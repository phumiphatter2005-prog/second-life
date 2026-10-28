const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { db, DATA_DIR } = require("./db");

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const TYPES = ["sell", "swap", "free"];
const CATEGORIES = ["book", "clothes", "stationery", "electronic", "dorm", "other"];
const CONDITIONS = ["ดีมาก", "ดี", "พอใช้"];
const SESSION_DAYS = 30;

const app = express();
app.use(express.json({ limit: "3mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

/* ---------- รหัสผ่าน + session ---------- */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function readCookie(req, name) {
  const match = (req.headers.cookie || "").split(/;\s*/).find(c => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)").run(token, userId, Date.now());
  res.cookie("sid", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
  });
}

/* แนบ req.user ถ้ามี session ที่ยังไม่หมดอายุ */
app.use((req, res, next) => {
  const token = readCookie(req, "sid");
  if (token) {
    const minCreated = Date.now() - SESSION_DAYS * 24 * 60 * 60 * 1000;
    req.user = db.prepare(`
      SELECT u.id, u.student_id, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.created_at > ? AND u.banned = 0`).get(token, minCreated);
  }
  next();
});

function requireLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  next();
}

function isAdmin(user) {
  return !!user && user.role === "admin";
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  if (!isAdmin(req.user)) return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
  next();
}

function publicUser(u) {
  return { id: u.id, studentId: u.student_id, name: u.name, role: u.role || "user" };
}

/* แปลงแถวในฐานข้อมูลเป็นข้อมูลที่ส่งให้หน้าเว็บ
   ช่องทางติดต่อส่งให้เฉพาะผู้ที่เข้าสู่ระบบแล้ว */
function toProduct(row, user) {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    type: row.type,
    category: row.category,
    condition: row.condition,
    pickup: row.pickup,
    contact: user ? row.contact : null,
    desc: row.description,
    img: row.img,
    passed: !!row.passed,
    sellerName: row.seller_name || "Second Life",
    hasOwner: row.user_id !== null,
    isOwner: !!user && row.user_id === user.id,
    isFav: !!row.is_fav,
    rating: row.rating_avg,
    ratingCount: row.rating_count,
    sellerRating: row.seller_avg,
    sellerRatingCount: row.seller_count,
    createdAt: row.created_at
  };
}

/* คะแนนดาวของสินค้า และคะแนนรวมของผู้ขาย (จากทุกประกาศของเขา) */
const PRODUCT_SELECT = `
  SELECT p.*, u.name AS seller_name,
         EXISTS (SELECT 1 FROM favorites f WHERE f.product_id = p.id AND f.user_id = ?) AS is_fav,
         (SELECT AVG(stars) FROM reviews r WHERE r.product_id = p.id) AS rating_avg,
         (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS rating_count,
         (SELECT AVG(r.stars) FROM reviews r JOIN products p2 ON p2.id = r.product_id
           WHERE p2.user_id = p.user_id) AS seller_avg,
         (SELECT COUNT(*) FROM reviews r JOIN products p2 ON p2.id = r.product_id
           WHERE p2.user_id = p.user_id) AS seller_count
  FROM products p LEFT JOIN users u ON u.id = p.user_id`;

function cleanText(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/* ---------- บัญชีผู้ใช้ ---------- */
app.post("/api/register", (req, res) => {
  const studentId = cleanText(req.body.studentId, 20);
  const name = cleanText(req.body.name, 60);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!/^[0-9]{5,20}$/.test(studentId)) return res.status(400).json({ error: "รหัสนักศึกษาต้องเป็นตัวเลข 5–20 หลัก" });
  if (!name) return res.status(400).json({ error: "กรุณากรอกชื่อที่จะแสดง" });
  if (password.length < 6) return res.status(400).json({ error: "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร" });
  if (db.prepare("SELECT 1 FROM users WHERE student_id = ?").get(studentId)) {
    return res.status(409).json({ error: "รหัสนักศึกษานี้สมัครไว้แล้ว" });
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const { lastInsertRowid } = db.prepare(
    "INSERT INTO users (student_id, name, pass_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(studentId, name, hashPassword(password, salt), salt, Date.now());

  startSession(res, Number(lastInsertRowid));
  res.json({ user: { id: Number(lastInsertRowid), studentId, name, role: "user" } });
});

app.post("/api/login", (req, res) => {
  const studentId = cleanText(req.body.studentId, 20);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const user = db.prepare("SELECT * FROM users WHERE student_id = ?").get(studentId);

  const ok = user && crypto.timingSafeEqual(
    Buffer.from(hashPassword(password, user.salt), "hex"),
    Buffer.from(user.pass_hash, "hex"));
  if (!ok) return res.status(401).json({ error: "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง" });
  if (user.banned) return res.status(403).json({ error: "บัญชีนี้ถูกระงับโดยผู้ดูแลระบบ" });

  startSession(res, user.id);
  res.json({ user: publicUser(user) });
});

app.post("/api/logout", (req, res) => {
  const token = readCookie(req, "sid");
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.clearCookie("sid");
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

/* ---------- สินค้า ---------- */
app.get("/api/products", (req, res) => {
  const uid = req.user ? req.user.id : 0;
  const rows = db.prepare(`${PRODUCT_SELECT} ORDER BY p.passed ASC, p.created_at DESC`).all(uid);
  res.json(rows.map(r => toProduct(r, req.user)));
});

app.get("/api/products/:id", (req, res) => {
  const uid = req.user ? req.user.id : 0;
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`).get(uid, Number(req.params.id));
  if (!row) return res.status(404).json({ error: "ไม่พบสินค้านี้" });
  res.json(toProduct(row, req.user));
});

/* รับรูปแบบ data URL (JPEG/PNG/WebP) แล้วบันทึกเป็นไฟล์ */
function saveImage(dataUrl) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 2 * 1024 * 1024) return null;
  const name = crypto.randomBytes(12).toString("hex") + "." + (m[1] === "jpeg" ? "jpg" : m[1]);
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return "/uploads/" + name;
}

app.post("/api/products", requireLogin, (req, res) => {
  const b = req.body;
  const item = {
    title: cleanText(b.title, 100),
    type: b.type,
    category: b.category,
    condition: b.condition,
    pickup: cleanText(b.pickup, 100),
    contact: cleanText(b.contact, 100),
    desc: cleanText(b.desc, 1000) || "ไม่มีรายละเอียดเพิ่มเติม"
  };
  item.price = item.type === "free" ? 0 : Math.round(Number(b.price));

  if (!item.title) return res.status(400).json({ error: "กรุณากรอกชื่อสินค้า" });
  if (!TYPES.includes(item.type)) return res.status(400).json({ error: "ประเภทประกาศไม่ถูกต้อง" });
  if (!CATEGORIES.includes(item.category)) return res.status(400).json({ error: "หมวดหมู่ไม่ถูกต้อง" });
  if (!CONDITIONS.includes(item.condition)) return res.status(400).json({ error: "สภาพสินค้าไม่ถูกต้อง" });
  if (!Number.isFinite(item.price) || item.price < 0 || item.price > 1000000) {
    return res.status(400).json({ error: "กรุณากรอกราคาให้ถูกต้อง" });
  }
  if (!item.pickup) return res.status(400).json({ error: "กรุณาระบุจุดนัดรับ" });
  if (!item.contact) return res.status(400).json({ error: "กรุณาระบุช่องทางติดต่อ" });

  let img = `images/cat-${item.category}.svg`;
  if (b.img) {
    img = saveImage(b.img);
    if (!img) return res.status(400).json({ error: "รูปภาพไม่ถูกต้องหรือใหญ่เกินไป" });
  }

  const { lastInsertRowid } = db.prepare(`
    INSERT INTO products (user_id, title, price, type, category, condition, pickup, contact, description, img, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.id, item.title, item.price, item.type, item.category, item.condition,
        item.pickup, item.contact, item.desc, img, Date.now());

  res.status(201).json({ id: Number(lastInsertRowid) });
});

function ownProduct(req, res) {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(req.params.id));
  if (!row) { res.status(404).json({ error: "ไม่พบสินค้านี้" }); return null; }
  if (row.user_id !== req.user.id && !isAdmin(req.user)) { res.status(403).json({ error: "แก้ไขได้เฉพาะประกาศของตัวเอง" }); return null; }
  return row;
}

/* เจ้าของกดยืนยันว่า "ส่งต่อแล้ว" (กดซ้ำเพื่อยกเลิก) */
app.post("/api/products/:id/passed", requireLogin, (req, res) => {
  const row = ownProduct(req, res);
  if (!row) return;
  const passed = row.passed ? 0 : 1;
  db.prepare("UPDATE products SET passed = ? WHERE id = ?").run(passed, row.id);
  res.json({ passed: !!passed });
});

app.delete("/api/products/:id", requireLogin, (req, res) => {
  const row = ownProduct(req, res);
  if (!row) return;
  db.prepare("DELETE FROM products WHERE id = ?").run(row.id);
  if (row.img.startsWith("/uploads/")) {
    fs.rm(path.join(UPLOAD_DIR, path.basename(row.img)), { force: true }, () => {});
  }
  res.json({ ok: true });
});

app.get("/api/my-products", requireLogin, (req, res) => {
  const rows = db.prepare(`${PRODUCT_SELECT} WHERE p.user_id = ? ORDER BY p.created_at DESC`)
    .all(req.user.id, req.user.id);
  res.json(rows.map(r => toProduct(r, req.user)));
});

/* ---------- รายการโปรด ---------- */
app.get("/api/favorites", requireLogin, (req, res) => {
  const rows = db.prepare(`${PRODUCT_SELECT}
    JOIN favorites fav ON fav.product_id = p.id AND fav.user_id = ?
    ORDER BY p.created_at DESC`).all(req.user.id, req.user.id);
  res.json(rows.map(r => toProduct(r, req.user)));
});

app.post("/api/favorites/:id", requireLogin, (req, res) => {
  const pid = Number(req.params.id);
  if (!db.prepare("SELECT 1 FROM products WHERE id = ?").get(pid)) {
    return res.status(404).json({ error: "ไม่พบสินค้านี้" });
  }
  const del = db.prepare("DELETE FROM favorites WHERE user_id = ? AND product_id = ?").run(req.user.id, pid);
  if (del.changes === 0) {
    db.prepare("INSERT INTO favorites (user_id, product_id) VALUES (?, ?)").run(req.user.id, pid);
  }
  res.json({ fav: del.changes === 0 });
});

/* ---------- รีวิวและให้ดาว ---------- */
app.get("/api/products/:id/reviews", (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, u.name FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ? ORDER BY r.created_at DESC`).all(Number(req.params.id));
  res.json(rows.map(r => ({
    name: r.name,
    stars: r.stars,
    comment: r.comment,
    createdAt: r.created_at,
    mine: !!req.user && r.user_id === req.user.id
  })));
});

/* ให้ดาวได้คนละ 1 ครั้งต่อสินค้า (ส่งใหม่ = แก้รีวิวเดิม) */
app.post("/api/products/:id/reviews", requireLogin, (req, res) => {
  const product = db.prepare("SELECT user_id FROM products WHERE id = ?").get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: "ไม่พบสินค้านี้" });
  if (product.user_id === req.user.id) return res.status(403).json({ error: "ให้ดาวประกาศของตัวเองไม่ได้" });

  const stars = Number(req.body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: "กรุณาเลือกดาว 1–5 ดวง" });

  db.prepare(`
    INSERT INTO reviews (product_id, user_id, stars, comment, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (product_id, user_id) DO UPDATE SET stars = excluded.stars, comment = excluded.comment,
      created_at = excluded.created_at`
  ).run(Number(req.params.id), req.user.id, stars, cleanText(req.body.comment, 300), Date.now());
  res.json({ ok: true });
});

/* ---------- ตัวนับผลกระทบ ---------- */
app.get("/api/stats", (req, res) => {
  res.json({
    passed: db.prepare("SELECT COUNT(*) AS n FROM products WHERE passed = 1").get().n,
    items: db.prepare("SELECT COUNT(*) AS n FROM products").get().n,
    users: db.prepare("SELECT COUNT(*) AS n FROM users").get().n
  });
});

/* ---------- แชตระหว่างผู้ประกาศกับผู้สนใจ (chat-server.js) ---------- */
const chat = require("./chat-server")(app, { db, requireLogin, requireAdmin, isAdmin, cleanText, saveImage });

/* ---------- ระบบหลังบ้าน (เฉพาะผู้ดูแลระบบ) ---------- */
function countBy(sql) {
  return Object.fromEntries(db.prepare(sql).all().map(r => [r.k, r.n]));
}

app.get("/api/admin/overview", requireAdmin, (req, res) => {
  const n = sql => db.prepare(sql).get().n;
  res.json({
    users: n("SELECT COUNT(*) AS n FROM users"),
    admins: n("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"),
    banned: n("SELECT COUNT(*) AS n FROM users WHERE banned = 1"),
    items: n("SELECT COUNT(*) AS n FROM products"),
    passed: n("SELECT COUNT(*) AS n FROM products WHERE passed = 1"),
    reviews: n("SELECT COUNT(*) AS n FROM reviews"),
    reportsOpen: chat.openReports(),
    chatRooms: chat.roomCount(),
    byCategory: countBy("SELECT category AS k, COUNT(*) AS n FROM products GROUP BY category"),
    byType: countBy("SELECT type AS k, COUNT(*) AS n FROM products GROUP BY type")
  });
});

app.get("/api/admin/products", requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.name AS seller_name, u.student_id AS seller_sid,
           (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count
    FROM products p LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC`).all();
  res.json(rows.map(r => ({
    id: r.id, title: r.title, price: r.price, type: r.type, category: r.category,
    img: r.img, passed: !!r.passed, pickup: r.pickup, contact: r.contact,
    sellerName: r.seller_name || "Second Life", sellerStudentId: r.seller_sid,
    reviewCount: r.review_count, createdAt: r.created_at
  })));
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT u.*, (SELECT COUNT(*) FROM products p WHERE p.user_id = u.id) AS product_count
    FROM users u ORDER BY u.created_at DESC`).all();
  res.json(rows.map(u => ({
    id: u.id, studentId: u.student_id, name: u.name, role: u.role, banned: !!u.banned,
    products: u.product_count, createdAt: u.created_at
  })));
});

/* เปลี่ยนสิทธิ์ (role) หรือระงับบัญชี (banned) — แก้บัญชีตัวเองไม่ได้ กันล็อกตัวเองออก */
app.post("/api/admin/users/:id", requireAdmin, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "ไม่พบผู้ใช้นี้" });
  if (user.id === req.user.id) return res.status(400).json({ error: "แก้ไขสิทธิ์บัญชีของตัวเองไม่ได้" });

  const role = req.body.role === undefined ? user.role : req.body.role;
  const banned = req.body.banned === undefined ? !!user.banned : !!req.body.banned;
  if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "สิทธิ์ไม่ถูกต้อง" });

  db.prepare("UPDATE users SET role = ?, banned = ? WHERE id = ?").run(role, banned ? 1 : 0, user.id);
  if (banned) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  res.json({ ok: true });
});

app.get("/api/admin/reviews", requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, u.name, p.title FROM reviews r
    JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id
    ORDER BY r.created_at DESC`).all();
  res.json(rows.map(r => ({
    productId: r.product_id, productTitle: r.title, userId: r.user_id, name: r.name,
    stars: r.stars, comment: r.comment, createdAt: r.created_at
  })));
});

app.delete("/api/admin/reviews/:productId/:userId", requireAdmin, (req, res) => {
  const { changes } = db.prepare("DELETE FROM reviews WHERE product_id = ? AND user_id = ?")
    .run(Number(req.params.productId), Number(req.params.userId));
  if (!changes) return res.status(404).json({ error: "ไม่พบรีวิวนี้" });
  res.json({ ok: true });
});

app.use("/api", (req, res) => res.status(404).json({ error: "ไม่พบ API นี้" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ error: "ข้อมูลใหญ่เกินไป ลองใช้รูปที่เล็กลง" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "ข้อมูลไม่ถูกต้อง" });
  console.error(err);
  res.status(500).json({ error: "เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง" });
});

app.listen(PORT, () => {
  console.log(`Second Life พร้อมใช้งานที่ http://localhost:${PORT}`);
});
