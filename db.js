/* ---------- ฐานข้อมูล SQLite (มีมาในตัว Node.js) ---------- */
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "secondlife.db"));
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    pass_hash  TEXT NOT NULL,
    salt       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    price      INTEGER NOT NULL DEFAULT 0,
    type       TEXT NOT NULL,
    category   TEXT NOT NULL,
    condition  TEXT NOT NULL,
    pickup     TEXT NOT NULL,
    contact    TEXT NOT NULL,
    description TEXT NOT NULL,
    img        TEXT NOT NULL,
    passed     INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment    TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    PRIMARY KEY (product_id, user_id)
  );
`);

/* ฐานข้อมูลรุ่นเก่า: เพิ่มคอลัมน์สิทธิ์ผู้ดูแลระบบและการระงับบัญชี */
const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
if (!userCols.includes("role")) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
if (!userCols.includes("banned")) db.exec("ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0");
if (!userCols.includes("avatar")) db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");

/* ผู้ดูแลระบบจากตัวแปร ADMIN_STUDENT_IDS (คั่นด้วยจุลภาค) */
(process.env.ADMIN_STUDENT_IDS || "").split(",").map(s => s.trim()).filter(Boolean).forEach(sid =>
  db.prepare("UPDATE users SET role = 'admin' WHERE student_id = ?").run(sid));

/* ---------- สินค้าตัวอย่าง (ใส่ให้ครั้งแรกที่ฐานข้อมูลยังว่าง) ---------- */
const SAMPLE_PRODUCTS = [
  { title: "หนังสือวิทยาการคอมพิวเตอร์", price: 150, type: "sell", category: "book",
    condition: "ดีมาก", pickup: "มหาวิทยาลัยศรีปทุม ขอนแก่น", contact: "ติดต่อผ่านเว็บ",
    desc: "หนังสือวิทยาการคอมพิวเตอร์ ม.6 สภาพดี มีรอยขีดเล็กน้อย แต่ใช้งานได้ปกติครับ",
    img: "images/sample-cs-book.jpg" },
  { title: "เสื้อฮู้ด Oversize", price: 200, type: "sell", category: "clothes",
    condition: "ดี", pickup: "โรงอาหารกลาง", contact: "ติดต่อผ่านเว็บ",
    desc: "ใส่ไม่กี่ครั้ง ซักสะอาดแล้ว", img: "images/sample-hoodie.jpg" },
  { title: "โน้ตบุ๊ก", price: 6500, type: "sell", category: "electronic",
    condition: "ดี", pickup: "อาคารเรียนรวม", contact: "ติดต่อผ่านเว็บ",
    desc: "ใช้งานปกติ แบตอยู่ได้ประมาณ 3 ชม.", img: "images/sample-laptop.jpg" },
  { title: "กระเป๋าเป้", price: 350, type: "swap", category: "dorm",
    condition: "ดีมาก", pickup: "หอพักนักศึกษา", contact: "ติดต่อผ่านเว็บ",
    desc: "อยากแลกกับกระเป๋าใบเล็กกว่า", img: "images/sample-backpack.jpg" },
  { title: "โคมไฟตั้งโต๊ะ", price: 120, type: "sell", category: "dorm",
    condition: "ดี", pickup: "หอพักนักศึกษา", contact: "ติดต่อผ่านเว็บ",
    desc: "ไฟ LED ปรับความสว่างได้", img: "images/sample-lamp.jpg" },
  { title: "หูฟังไร้สาย", price: 890, type: "sell", category: "electronic",
    condition: "ดีมาก", pickup: "ห้องสมุด", contact: "ติดต่อผ่านเว็บ",
    desc: "ใช้งานได้ปกติ มีกล่องครบ", img: "images/sample-headphones.jpg" },
  { title: "หนังสือภาษาอังกฤษ", price: 0, type: "free", category: "book",
    condition: "ดี", pickup: "ห้องสมุด", contact: "ติดต่อผ่านเว็บ",
    desc: "แจกฟรี มารับได้เลย", img: "images/sample-english-book.jpg" }
];

/* ฐานข้อมูลรุ่นเก่า: เปลี่ยนรูปสุ่ม/รูปการ์ตูนของสินค้าตัวอย่างเป็นรูปถ่ายจริง */
const fixSampleImg = db.prepare(
  "UPDATE products SET img = ? WHERE user_id IS NULL AND title = ? AND (img LIKE 'https://picsum%' OR (img LIKE 'images/%.svg' AND img NOT LIKE 'images/cat-%'))");
SAMPLE_PRODUCTS.forEach(p => fixSampleImg.run(p.img, p.title));

/* ฐานข้อมูลรุ่นเก่า: ลบเบอร์โทร/Line ของสินค้าตัวอย่าง */
const fixSampleContact = db.prepare("UPDATE products SET contact = ? WHERE user_id IS NULL AND title = ?");
SAMPLE_PRODUCTS.forEach(p => fixSampleContact.run(p.contact, p.title));

if (db.prepare("SELECT COUNT(*) AS n FROM products").get().n === 0) {
  const insert = db.prepare(`
    INSERT INTO products (user_id, title, price, type, category, condition, pickup, contact, description, img, created_at)
    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  SAMPLE_PRODUCTS.forEach((p, i) => insert.run(
    p.title, p.price, p.type, p.category, p.condition, p.pickup, p.contact, p.desc, p.img, Date.now() - i * 1000));
}

module.exports = { db, DATA_DIR };
