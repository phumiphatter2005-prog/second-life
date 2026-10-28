/* ---------- ระบบแชต (โหมด npm start / SQLite) ----------
   กติกาเหมือน supabase/003_chat.sql ทุกข้อ — หน้าเว็บดึงข้อความใหม่เป็นระยะแทน Realtime */
const MAX_BODY = 1000;
const RATE = { count: 6, ms: 10 * 1000 };
const TYPING_MS = 4000;
const KINDS = ["text", "offer", "swap", "request", "meetup", "contact"];

module.exports = function setupChat(app, { db, requireLogin, requireAdmin, isAdmin, cleanText, saveImage }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_rooms (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      buyer_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at      INTEGER NOT NULL,
      last_message    TEXT NOT NULL DEFAULT '',
      last_message_at INTEGER NOT NULL,
      buyer_read_at   INTEGER NOT NULL,
      seller_read_at  INTEGER NOT NULL DEFAULT 0,
      UNIQUE (product_id, buyer_id)
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id    INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      sender_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      kind       TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      data       TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS chat_messages_room_idx ON chat_messages (room_id, id);
    CREATE TABLE IF NOT EXISTS chat_blocks (
      blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      active     INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (blocker_id, blocked_id)
    );
    CREATE TABLE IF NOT EXISTS chat_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id     INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reported_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reason      TEXT NOT NULL,
      detail      TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'open',
      created_at  INTEGER NOT NULL
    );
  `);

  const typing = new Map();   // roomId → { userId, at }
  const fail = (res, status, error) => { res.status(status).json({ error }); return null; };
  const nameOf = id => (db.prepare("SELECT name FROM users WHERE id = ?").get(id) || {}).name || "ผู้ใช้";
  const avatarOf = id => (db.prepare("SELECT avatar FROM users WHERE id = ?").get(id) || {}).avatar || null;
  const blockedBetween = (a, b) => !!db.prepare(`
    SELECT 1 FROM chat_blocks WHERE active = 1 AND ((blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?))`)
    .get(a, b, b, a);
  const money = n => Number(n).toLocaleString("en-US");

  function msgJson(m, user) {
    return {
      id: m.id, roomId: m.room_id, senderId: m.sender_id, senderName: m.sender_id ? nameOf(m.sender_id) : null,
      mine: !!user && m.sender_id === user.id, kind: m.kind, body: m.body, data: JSON.parse(m.data || "{}"),
      createdAt: m.created_at
    };
  }

  /* ห้องที่ผู้ใช้อยู่ (แอดมินเปิดได้ทุกห้องแบบดูอย่างเดียว) */
  function loadRoom(req, res, { allowAdmin = true } = {}) {
    const r = db.prepare("SELECT * FROM chat_rooms WHERE id = ?").get(Number(req.params.id));
    if (!r) return fail(res, 404, "ไม่พบห้องแชตนี้");
    const party = [r.buyer_id, r.seller_id].includes(req.user.id);
    if (!party && !(allowAdmin && isAdmin(req.user))) return fail(res, 403, "คุณไม่ได้อยู่ในห้องแชตนี้");
    return r;
  }

  function addSystem(roomId, body, kind = "system", sender = null) {
    const now = Date.now();
    db.prepare("INSERT INTO chat_messages (room_id, sender_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(roomId, sender, kind, body.slice(0, MAX_BODY), now);
    db.prepare("UPDATE chat_rooms SET last_message = ?, last_message_at = ? WHERE id = ?").run(body.slice(0, 120), now, roomId);
  }

  function setStatus(messageId, status) {
    const m = db.prepare("SELECT data FROM chat_messages WHERE id = ?").get(messageId);
    const data = { ...JSON.parse(m.data || "{}"), status };
    db.prepare("UPDATE chat_messages SET data = ? WHERE id = ?").run(JSON.stringify(data), messageId);
  }

  function roomJson(r, user) {
    const p = db.prepare("SELECT * FROM products WHERE id = ?").get(r.product_id);
    const seller = user.id === r.seller_id;
    const other = seller ? r.buyer_id : r.seller_id;
    return {
      id: r.id, productId: p.id, productTitle: p.title, productImg: p.img, productPrice: p.price,
      productType: p.type, productPassed: !!p.passed, productPickup: p.pickup,
      isSeller: seller, isBuyer: user.id === r.buyer_id, adminView: ![r.buyer_id, r.seller_id].includes(user.id),
      buyerId: r.buyer_id, sellerId: r.seller_id,
      buyerName: nameOf(r.buyer_id), sellerName: nameOf(r.seller_id), otherName: nameOf(other),
      buyerAvatar: avatarOf(r.buyer_id), sellerAvatar: avatarOf(r.seller_id), otherAvatar: avatarOf(other),
      otherReadAt: seller ? r.buyer_read_at : r.seller_read_at,
      blockedByMe: !!db.prepare("SELECT 1 FROM chat_blocks WHERE active = 1 AND blocker_id = ? AND blocked_id = ?").get(user.id, other),
      blocked: blockedBetween(r.buyer_id, r.seller_id),
      requesters: seller && p.type === "free" ? db.prepare(`
        SELECT COUNT(DISTINCT r2.id) AS n FROM chat_rooms r2 JOIN chat_messages m ON m.room_id = r2.id
        WHERE r2.product_id = ? AND m.kind = 'request'`).get(p.id).n : 0
    };
  }

  const unreadSql = `
    SELECT COUNT(*) AS n FROM chat_messages m
    WHERE m.room_id = r.id AND (m.sender_id IS NULL OR m.sender_id <> @me)
      AND m.created_at > CASE WHEN r.seller_id = @me THEN r.seller_read_at ELSE r.buyer_read_at END`;

  /* ---------- เปิดห้อง ---------- */
  app.post("/api/chats/open", requireLogin, (req, res) => {
    const p = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(req.body.productId));
    if (!p) return fail(res, 404, "ไม่พบสินค้านี้");
    if (!p.user_id) return fail(res, 400, "ประกาศตัวอย่างนี้ไม่มีผู้ประกาศให้แชต");
    if (p.user_id === req.user.id) return fail(res, 400, "นี่คือประกาศของคุณ");
    const found = db.prepare("SELECT id FROM chat_rooms WHERE product_id = ? AND buyer_id = ?").get(p.id, req.user.id);
    if (found) return res.json({ roomId: found.id });
    if (blockedBetween(req.user.id, p.user_id)) return fail(res, 403, "ไม่สามารถเริ่มแชตได้ เนื่องจากมีการบล็อก");
    const now = Date.now();
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO chat_rooms (product_id, buyer_id, seller_id, created_at, last_message_at, buyer_read_at)
      VALUES (?, ?, ?, ?, ?, ?)`).run(p.id, req.user.id, p.user_id, now, now, now);
    res.json({ roomId: Number(lastInsertRowid) });
  });

  /* ---------- รายการห้อง / ยังไม่อ่าน ---------- */
  app.get("/api/chats", requireLogin, (req, res) => {
    const me = req.user.id;
    const rows = db.prepare(`
      SELECT r.*, p.title, p.img, p.price, p.type, p.passed, (${unreadSql}) AS unread
      FROM chat_rooms r JOIN products p ON p.id = r.product_id
      WHERE (r.buyer_id = @me OR r.seller_id = @me)
        AND EXISTS (SELECT 1 FROM chat_messages m WHERE m.room_id = r.id)
      ORDER BY r.last_message_at DESC`).all({ me });
    res.json(rows.map(r => ({
      id: r.id, productId: r.product_id, productTitle: r.title, productImg: r.img, productPrice: r.price,
      productType: r.type, productPassed: !!r.passed, isSeller: r.seller_id === me,
      otherName: nameOf(r.seller_id === me ? r.buyer_id : r.seller_id),
      otherAvatar: avatarOf(r.seller_id === me ? r.buyer_id : r.seller_id),
      lastMessage: r.last_message, lastAt: r.last_message_at, unread: r.unread
    })));
  });

  app.get("/api/chats/unread", requireLogin, (req, res) => {
    const row = db.prepare(`
      SELECT SUM((${unreadSql})) AS n FROM chat_rooms r WHERE r.buyer_id = @me OR r.seller_id = @me`).get({ me: req.user.id });
    res.json({ count: row.n || 0 });
  });

  /* ---------- ห้อง + ข้อความ (?after= เอาเฉพาะข้อความใหม่) ---------- */
  app.get("/api/chats/:id", requireLogin, (req, res) => {
    const r = loadRoom(req, res);
    if (!r) return;
    const after = Number(req.query.after) || 0;
    const messages = db.prepare(`
      SELECT * FROM (SELECT * FROM chat_messages WHERE room_id = ? AND id > ? ORDER BY id DESC LIMIT 500) ORDER BY id`)
      .all(r.id, after).map(m => msgJson(m, req.user));
    const t = typing.get(r.id);
    res.json({
      room: roomJson(r, req.user),
      messages,
      typing: !!t && t.userId !== req.user.id && Date.now() - t.at < TYPING_MS ? t.name : null
    });
  });

  app.post("/api/chats/:id/read", requireLogin, (req, res) => {
    const r = loadRoom(req, res);
    if (!r) return;
    const now = Date.now();
    if (r.buyer_id === req.user.id) db.prepare("UPDATE chat_rooms SET buyer_read_at = ? WHERE id = ?").run(now, r.id);
    if (r.seller_id === req.user.id) db.prepare("UPDATE chat_rooms SET seller_read_at = ? WHERE id = ?").run(now, r.id);
    res.json({ ok: true });
  });

  app.post("/api/chats/:id/typing", requireLogin, (req, res) => {
    const r = loadRoom(req, res, { allowAdmin: false });
    if (!r) return;
    typing.set(r.id, { userId: req.user.id, name: req.user.name, at: Date.now() });
    res.json({ ok: true });
  });

  /* ---------- ส่งข้อความ ---------- */
  app.post("/api/chats/:id/messages", requireLogin, (req, res) => {
    const r = loadRoom(req, res);
    if (!r) return;
    const me = req.user.id;
    const kind = req.body.kind;
    const body = typeof req.body.body === "string" ? req.body.body.trim() : "";
    const input = req.body.data && typeof req.body.data === "object" ? req.body.data : {};
    const p = db.prepare("SELECT * FROM products WHERE id = ?").get(r.product_id);
    const buyer = me === r.buyer_id;

    if (!KINDS.includes(kind)) return fail(res, 400, "ประเภทข้อความไม่ถูกต้อง");
    if (body.length > MAX_BODY) return fail(res, 400, "ข้อความยาวเกิน 1000 ตัวอักษร");
    if (blockedBetween(r.buyer_id, r.seller_id)) return fail(res, 403, "ส่งข้อความไม่ได้ เนื่องจากมีการบล็อกในห้องนี้");
    const recent = db.prepare("SELECT COUNT(*) AS n FROM chat_messages WHERE sender_id = ? AND created_at > ?")
      .get(me, Date.now() - RATE.ms).n;
    if (recent >= RATE.count) return fail(res, 429, "ส่งข้อความเร็วเกินไป กรุณารอสักครู่");

    let data = {};
    let preview = body;
    if (kind === "text") {
      if (!body) return fail(res, 400, "กรุณาพิมพ์ข้อความ");
    } else if (kind === "contact") {
      if (!body) return fail(res, 400, "กรุณาใส่ช่องทางติดต่อ");
      if (body.length > 100) return fail(res, 400, "ช่องทางติดต่อยาวเกิน 100 ตัวอักษร");
      preview = "ส่งช่องทางติดต่อ";
    } else if (kind === "offer") {
      if (!buyer) return fail(res, 403, "เฉพาะผู้สนใจเท่านั้นที่เสนอราคาได้");
      if (p.type !== "sell") return fail(res, 400, "เสนอราคาได้เฉพาะประกาศขาย");
      const amount = Number(input.amount);
      if (!Number.isInteger(amount) || amount < 1 || amount > 1000000) return fail(res, 400, "กรุณาใส่ราคาเป็นตัวเลข 1–1,000,000 บาท");
      data = { amount, status: "pending" };
      preview = "เสนอราคา ฿" + money(amount);
    } else if (kind === "swap") {
      if (!buyer) return fail(res, 403, "เฉพาะผู้สนใจเท่านั้นที่เสนอของแลกได้");
      if (p.type !== "swap") return fail(res, 400, "เสนอของแลกได้เฉพาะประกาศแลกเปลี่ยน");
      const title = cleanText(input.title, 100);
      if (!title) return fail(res, 400, "กรุณาใส่ชื่อของที่จะนำมาแลก (ไม่เกิน 100 ตัวอักษร)");
      let img = "";
      if (typeof input.img === "string" && input.img.startsWith("data:")) {
        img = saveImage(input.img);
        if (!img) return fail(res, 400, "รูปภาพไม่ถูกต้องหรือใหญ่เกินไป");
      }
      data = { title, img, status: "pending" };
      preview = "เสนอแลกกับ " + title;
    } else if (kind === "request") {
      if (!buyer) return fail(res, 403, "เฉพาะผู้สนใจเท่านั้นที่ขอรับได้");
      if (p.type !== "free") return fail(res, 400, "ขอรับได้เฉพาะประกาศแจกฟรี");
      if (p.passed) return fail(res, 400, "ของชิ้นนี้ส่งต่อไปแล้ว");
      if (db.prepare("SELECT 1 FROM chat_messages WHERE room_id = ? AND kind = 'request'").get(r.id)) {
        return fail(res, 400, "คุณขอรับของชิ้นนี้ไปแล้ว");
      }
      data = { status: "pending" };
      preview = "ขอรับของชิ้นนี้";
    } else if (kind === "meetup") {
      const place = cleanText(input.place, 100);
      if (!place) return fail(res, 400, "กรุณาเลือกจุดนัดรับ");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || "") || !/^\d{2}:\d{2}$/.test(input.time || "")) {
        return fail(res, 400, "กรุณาเลือกวันและเวลานัด");
      }
      const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);   // เวลาไทย
      if (input.date < today) return fail(res, 400, "วันนัดต้องไม่ใช่วันที่ผ่านมาแล้ว");
      data = { place, date: input.date, time: input.time, status: "pending" };
      preview = "นัดรับ " + place;
    }

    const now = Date.now();
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO chat_messages (room_id, sender_id, kind, body, data, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(r.id, me, kind, body, JSON.stringify(data), now);
    db.prepare(`
      UPDATE chat_rooms SET last_message = ?, last_message_at = ?,
        buyer_read_at = CASE WHEN buyer_id = ? THEN ? ELSE buyer_read_at END,
        seller_read_at = CASE WHEN seller_id = ? THEN ? ELSE seller_read_at END
      WHERE id = ?`).run(preview.slice(0, 120), now, me, now, me, now, r.id);
    typing.delete(r.id);
    res.status(201).json(msgJson(db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(lastInsertRowid), req.user));
  });

  /* ---------- แจกฟรี: เลือกผู้รับ ---------- */
  function give(req, res, r) {
    const p = db.prepare("SELECT * FROM products WHERE id = ?").get(r.product_id);
    if (req.user.id !== r.seller_id) return fail(res, 403, "เฉพาะผู้ประกาศเท่านั้นที่เลือกผู้รับได้");
    if (p.type !== "free") return fail(res, 400, "เลือกผู้รับได้เฉพาะประกาศแจกฟรี");
    const request = db.prepare("SELECT * FROM chat_messages WHERE room_id = ? AND kind = 'request'").get(r.id);
    if (!request) return fail(res, 400, "ผู้ใช้คนนี้ยังไม่ได้ขอรับ");
    const requests = db.prepare(`
      SELECT m.* FROM chat_messages m JOIN chat_rooms r2 ON r2.id = m.room_id
      WHERE r2.product_id = ? AND m.kind = 'request'`).all(p.id);
    if (requests.some(m => JSON.parse(m.data).status === "accepted")) return fail(res, 400, "คุณเลือกผู้รับของชิ้นนี้ไปแล้ว");
    setStatus(request.id, "accepted");
    addSystem(r.id, "ผู้ประกาศเลือกให้คุณเป็นผู้รับ นัดรับกันได้เลย");
    requests.filter(m => m.room_id !== r.id && JSON.parse(m.data).status === "pending").forEach(m => {
      setStatus(m.id, "rejected");
      addSystem(m.room_id, "ผู้ประกาศมอบของชิ้นนี้ให้ผู้ขอคนอื่นแล้ว ขอบคุณที่สนใจ");
    });
    return res.json({ ok: true });
  }

  app.post("/api/chats/:id/give", requireLogin, (req, res) => {
    const r = loadRoom(req, res, { allowAdmin: false });
    if (r) give(req, res, r);
  });

  /* ---------- ตอบรับ / ปฏิเสธ / ยืนยันนัด ---------- */
  app.post("/api/chats/messages/:mid/respond", requireLogin, (req, res) => {
    const m = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(Number(req.params.mid));
    if (!m) return fail(res, 404, "ไม่พบข้อความนี้");
    const r = db.prepare("SELECT * FROM chat_rooms WHERE id = ?").get(m.room_id);
    const me = req.user.id;
    if (![r.buyer_id, r.seller_id].includes(me)) return fail(res, 403, "คุณไม่ได้อยู่ในห้องแชตนี้");
    if (blockedBetween(r.buyer_id, r.seller_id)) return fail(res, 403, "ทำรายการไม่ได้ เนื่องจากมีการบล็อกในห้องนี้");
    const data = JSON.parse(m.data || "{}");
    if (data.status !== "pending") return fail(res, 400, "รายการนี้ตอบไปแล้ว");
    const action = req.body.action;
    let status, note;

    if (["offer", "swap", "request"].includes(m.kind)) {
      if (me !== r.seller_id) return fail(res, 403, "เฉพาะผู้ประกาศเท่านั้นที่ตอบรับได้");
      if (!["accept", "reject"].includes(action)) return fail(res, 400, "คำสั่งไม่ถูกต้อง");
      if (m.kind === "request" && action === "accept") return give(req, res, r);
      status = action === "accept" ? "accepted" : "rejected";
      note = m.kind === "offer"
        ? `ผู้ประกาศ${action === "accept" ? "รับ" : "ปฏิเสธ"}ข้อเสนอ ฿${money(data.amount)}`
        : m.kind === "swap"
          ? `ผู้ประกาศ${action === "accept" ? "รับ" : "ปฏิเสธ"}ข้อเสนอแลกกับ ${data.title}`
          : "ผู้ประกาศปฏิเสธคำขอรับ";
    } else if (m.kind === "meetup") {
      if (me === m.sender_id) return fail(res, 400, "อีกฝ่ายเป็นคนยืนยันนัด");
      if (!["confirm", "reject"].includes(action)) return fail(res, 400, "คำสั่งไม่ถูกต้อง");
      status = action === "confirm" ? "confirmed" : "rejected";
      note = `${action === "confirm" ? "ยืนยันนัดรับแล้ว" : "ไม่สะดวกนัด"}: ${data.place} ${data.date} ${data.time}`;
    } else {
      return fail(res, 400, "ข้อความนี้ตอบรับไม่ได้");
    }
    setStatus(m.id, status);
    addSystem(r.id, note);
    res.json({ ok: true });
  });

  app.get("/api/chats/requesters/:productId", requireLogin, (req, res) => {
    const p = db.prepare("SELECT * FROM products WHERE id = ? AND user_id = ?").get(Number(req.params.productId), req.user.id);
    if (!p) return fail(res, 403, "เฉพาะผู้ประกาศเท่านั้น");
    const rows = db.prepare(`
      SELECT r.id AS room_id, r.buyer_id, m.data, m.created_at FROM chat_rooms r
      JOIN chat_messages m ON m.room_id = r.id AND m.kind = 'request'
      WHERE r.product_id = ? ORDER BY m.created_at`).all(p.id);
    res.json(rows.map(x => ({
      roomId: x.room_id, name: nameOf(x.buyer_id), status: JSON.parse(x.data).status, requestedAt: x.created_at
    })));
  });

  /* ---------- ส่งต่อแล้ว / บล็อก / รายงาน ---------- */
  app.post("/api/chats/:id/passed", requireLogin, (req, res) => {
    const r = loadRoom(req, res, { allowAdmin: false });
    if (!r) return;
    if (req.user.id !== r.seller_id) return fail(res, 403, "เฉพาะผู้ประกาศเท่านั้น");
    if (db.prepare("SELECT 1 FROM chat_messages WHERE room_id = ? AND kind = 'passed'").get(r.id)) {
      return fail(res, 400, "ยืนยันส่งต่อในห้องนี้ไปแล้ว");
    }
    db.prepare("UPDATE products SET passed = 1 WHERE id = ?").run(r.product_id);
    addSystem(r.id, "ผู้ประกาศยืนยันว่าส่งต่อแล้ว", "passed", r.seller_id);
    res.json({ ok: true });
  });

  app.post("/api/chats/:id/block", requireLogin, (req, res) => {
    const r = loadRoom(req, res, { allowAdmin: false });
    if (!r) return;
    const other = req.user.id === r.buyer_id ? r.seller_id : r.buyer_id;
    db.prepare(`
      INSERT INTO chat_blocks (blocker_id, blocked_id, active) VALUES (?, ?, ?)
      ON CONFLICT (blocker_id, blocked_id) DO UPDATE SET active = excluded.active`)
      .run(req.user.id, other, req.body.block ? 1 : 0);
    res.json({ ok: true });
  });

  app.post("/api/chats/:id/report", requireLogin, (req, res) => {
    const r = loadRoom(req, res, { allowAdmin: false });
    if (!r) return;
    const reason = cleanText(req.body.reason, 100);
    if (!reason) return fail(res, 400, "กรุณาเลือกเหตุผล");
    if (db.prepare("SELECT 1 FROM chat_reports WHERE room_id = ? AND reporter_id = ? AND status = 'open'").get(r.id, req.user.id)) {
      return fail(res, 400, "คุณรายงานห้องนี้ไปแล้ว ผู้ดูแลระบบกำลังตรวจสอบ");
    }
    db.prepare(`
      INSERT INTO chat_reports (room_id, reporter_id, reported_id, reason, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(r.id, req.user.id, req.user.id === r.buyer_id ? r.seller_id : r.buyer_id, reason,
           cleanText(req.body.detail, 500), Date.now());
    res.json({ ok: true });
  });

  /* ---------- หลังบ้าน: รายงานแชต ---------- */
  app.get("/api/admin/chat-reports", requireAdmin, (req, res) => {
    const rows = db.prepare(`
      SELECT c.*, p.title, p.img, a.name AS a_name, a.student_id AS a_sid, b.name AS b_name, b.student_id AS b_sid
      FROM chat_reports c JOIN chat_rooms r ON r.id = c.room_id JOIN products p ON p.id = r.product_id
      LEFT JOIN users a ON a.id = c.reporter_id LEFT JOIN users b ON b.id = c.reported_id
      ORDER BY (c.status = 'open') DESC, c.created_at DESC`).all();
    res.json(rows.map(c => ({
      id: c.id, roomId: c.room_id, productTitle: c.title, productImg: c.img, reason: c.reason, detail: c.detail,
      status: c.status, reporterName: c.a_name || "ผู้ใช้ที่ถูกลบ", reporterStudentId: c.a_sid,
      reportedName: c.b_name || "ผู้ใช้ที่ถูกลบ", reportedStudentId: c.b_sid, createdAt: c.created_at
    })));
  });

  app.post("/api/admin/chat-reports/:id", requireAdmin, (req, res) => {
    if (!["open", "resolved", "dismissed"].includes(req.body.status)) return fail(res, 400, "สถานะไม่ถูกต้อง");
    const { changes } = db.prepare("UPDATE chat_reports SET status = ? WHERE id = ?").run(req.body.status, Number(req.params.id));
    if (!changes) return fail(res, 404, "ไม่พบรายงานนี้");
    res.json({ ok: true });
  });

  return {
    openReports: () => db.prepare("SELECT COUNT(*) AS n FROM chat_reports WHERE status = 'open'").get().n,
    roomCount: () => db.prepare("SELECT COUNT(*) AS n FROM chat_rooms").get().n
  };
};
