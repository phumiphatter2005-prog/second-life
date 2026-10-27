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
      SELECT u.id, u.student_id, u.name FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.created_at > ?`).get(token, minCreated);
  }
  next();
});

function requireLogin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  next();
}

function publicUser(u) {
  return { id: u.id, studentId: u.student_id, name: u.name };
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
    isOwner: !!user && row.user_id === user.id,
    isFav: !!row.is_fav,
    createdAt: row.created_at
  };
}

const PRODUCT_SELECT = `
  SELECT p.*, u.name AS seller_name,
         EXISTS (SELECT 1 FROM favorites f WHERE f.product_id = p.id AND f.user_id = ?) AS is_fav
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
  res.json({ user: { id: Number(lastInsertRowid), studentId, name } });
});

app.post("/api/login", (req, res) => {
  const studentId = cleanText(req.body.studentId, 20);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const user = db.prepare("SELECT * FROM users WHERE student_id = ?").get(studentId);

  const ok = user && crypto.timingSafeEqual(
    Buffer.from(hashPassword(password, user.salt), "hex"),
    Buffer.from(user.pass_hash, "hex"));
  if (!ok) return res.status(401).json({ error: "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง" });

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

  let img = `https://picsum.photos/seed/sl${Date.now()}/400/300`;
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
  if (row.user_id !== req.user.id) { res.status(403).json({ error: "แก้ไขได้เฉพาะประกาศของตัวเอง" }); return null; }
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

/* ---------- ตัวนับผลกระทบ ---------- */
app.get("/api/stats", (req, res) => {
  res.json({
    passed: db.prepare("SELECT COUNT(*) AS n FROM products WHERE passed = 1").get().n,
    items: db.prepare("SELECT COUNT(*) AS n FROM products").get().n,
    users: db.prepare("SELECT COUNT(*) AS n FROM users").get().n
  });
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
