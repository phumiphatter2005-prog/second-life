/* ---------- โหมดสาธิต (GitHub Pages / เปิดไฟล์ตรงๆ) ----------
   GitHub Pages รัน server.js ไม่ได้ จึงจำลอง API เดียวกันไว้ในเบราว์เซอร์
   ข้อมูลทั้งหมดเก็บใน localStorage ของเครื่องที่เปิดเท่านั้น */
const DEMO_MODE = location.hostname.endsWith("github.io") || location.protocol === "file:";

const DEMO_PRODUCTS = [
  { title: "หนังสือวิทยาการคอมพิวเตอร์", price: 150, type: "sell", category: "book",
    condition: "ดีมาก", pickup: "มหาวิทยาลัยศรีปทุม ขอนแก่น", contact: "081-234-5573 (Line)",
    desc: "หนังสือวิทยาการคอมพิวเตอร์ ม.6 สภาพดี มีรอยขีดเล็กน้อย แต่ใช้งานได้ปกติครับ",
    img: "https://picsum.photos/seed/book1/400/300" },
  { title: "เสื้อฮู้ด Oversize", price: 200, type: "sell", category: "clothes",
    condition: "ดี", pickup: "โรงอาหารกลาง", contact: "Line: pom_sp",
    desc: "ใส่ไม่กี่ครั้ง ซักสะอาดแล้ว", img: "https://picsum.photos/seed/hoodie/400/300" },
  { title: "โน้ตบุ๊ก", price: 6500, type: "sell", category: "electronic",
    condition: "ดี", pickup: "อาคารเรียนรวม", contact: "Line: nb_sell",
    desc: "ใช้งานปกติ แบตอยู่ได้ประมาณ 3 ชม.", img: "https://picsum.photos/seed/laptop/400/300" },
  { title: "กระเป๋าเป้", price: 350, type: "swap", category: "dorm",
    condition: "ดีมาก", pickup: "หอพักนักศึกษา", contact: "Line: bag_swap",
    desc: "อยากแลกกับกระเป๋าใบเล็กกว่า", img: "https://picsum.photos/seed/bag/400/300" },
  { title: "โคมไฟตั้งโต๊ะ", price: 120, type: "sell", category: "dorm",
    condition: "ดี", pickup: "หอพักนักศึกษา", contact: "Line: lamp01",
    desc: "ไฟ LED ปรับความสว่างได้", img: "https://picsum.photos/seed/lamp/400/300" },
  { title: "หูฟังไร้สาย", price: 890, type: "sell", category: "electronic",
    condition: "ดีมาก", pickup: "ห้องสมุด", contact: "Line: hp_sell",
    desc: "ใช้งานได้ปกติ มีกล่องครบ", img: "https://picsum.photos/seed/headphone/400/300" },
  { title: "หนังสือภาษาอังกฤษ", price: 0, type: "free", category: "book",
    condition: "ดี", pickup: "ห้องสมุด", contact: "Line: free_book",
    desc: "แจกฟรี มารับได้เลย", img: "https://picsum.photos/seed/book2/400/300" }
];

function demoLoad() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem("sl-demo")); } catch (e) { /* ใช้ค่าเริ่มต้น */ }
  if (!s) {
    s = { users: [], products: [], favorites: [], session: null, nextId: 1 };
    DEMO_PRODUCTS.forEach((p, i) => s.products.push(
      { ...p, id: s.nextId++, userId: null, passed: false, createdAt: Date.now() - i * 1000 }));
  }
  return s;
}

function demoSave(s) {
  try {
    localStorage.setItem("sl-demo", JSON.stringify(s));
  } catch (e) {
    throw demoError(413, "พื้นที่เก็บข้อมูลในเบราว์เซอร์เต็ม ลองใช้รูปที่เล็กลง");
  }
}

function demoError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function demoApi(path, options = {}) {
  const method = options.method || "GET";
  const b = options.body || {};
  const s = demoLoad();
  const user = s.users.find(u => u.id === s.session) || null;
  const pub = u => ({ id: u.id, studentId: u.studentId, name: u.name });
  const view = p => {
    const seller = s.users.find(u => u.id === p.userId);
    return {
      ...p,
      contact: user ? p.contact : null,
      sellerName: seller ? seller.name : "Second Life",
      isOwner: !!user && p.userId === user.id,
      isFav: !!user && s.favorites.some(f => f.userId === user.id && f.productId === p.id)
    };
  };
  const needLogin = () => { if (!user) throw demoError(401, "กรุณาเข้าสู่ระบบก่อน"); };
  const findOwn = id => {
    const p = s.products.find(p => p.id === id);
    if (!p) throw demoError(404, "ไม่พบสินค้านี้");
    if (p.userId !== user.id) throw demoError(403, "แก้ไขได้เฉพาะประกาศของตัวเอง");
    return p;
  };
  const byNewest = (a, b) => b.createdAt - a.createdAt;

  let m;
  if (path === "/me") return { user: user ? pub(user) : null };

  if (path === "/register" && method === "POST") {
    const studentId = String(b.studentId || "").trim();
    const name = String(b.name || "").trim();
    if (!/^[0-9]{5,20}$/.test(studentId)) throw demoError(400, "รหัสนักศึกษาต้องเป็นตัวเลข 5–20 หลัก");
    if (!name) throw demoError(400, "กรุณากรอกชื่อที่จะแสดง");
    if (String(b.password || "").length < 6) throw demoError(400, "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    if (s.users.some(u => u.studentId === studentId)) throw demoError(409, "รหัสนักศึกษานี้สมัครไว้แล้ว");
    const u = { id: s.nextId++, studentId, name, password: b.password };
    s.users.push(u);
    s.session = u.id;
    demoSave(s);
    return { user: pub(u) };
  }

  if (path === "/login" && method === "POST") {
    const u = s.users.find(u => u.studentId === String(b.studentId || "").trim() && u.password === b.password);
    if (!u) throw demoError(401, "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง");
    s.session = u.id;
    demoSave(s);
    return { user: pub(u) };
  }

  if (path === "/logout") {
    s.session = null;
    demoSave(s);
    return { ok: true };
  }

  if (path === "/stats") {
    return {
      passed: s.products.filter(p => p.passed).length,
      items: s.products.length,
      users: s.users.length
    };
  }

  if (path === "/products" && method === "GET") {
    return [...s.products].sort((a, b) => a.passed - b.passed || byNewest(a, b)).map(view);
  }

  if (path === "/products" && method === "POST") {
    needLogin();
    const item = {
      title: String(b.title || "").trim(),
      price: b.type === "free" ? 0 : Math.round(Number(b.price)),
      type: b.type, category: b.category, condition: b.condition,
      pickup: String(b.pickup || "").trim(),
      contact: String(b.contact || "").trim(),
      desc: String(b.desc || "").trim() || "ไม่มีรายละเอียดเพิ่มเติม"
    };
    if (!item.title) throw demoError(400, "กรุณากรอกชื่อสินค้า");
    if (!Number.isFinite(item.price) || item.price < 0) throw demoError(400, "กรุณากรอกราคาให้ถูกต้อง");
    if (!item.pickup) throw demoError(400, "กรุณาระบุจุดนัดรับ");
    if (!item.contact) throw demoError(400, "กรุณาระบุช่องทางติดต่อ");
    const id = s.nextId++;
    s.products.push({
      ...item, id, userId: user.id, passed: false, createdAt: Date.now(),
      img: b.img || `https://picsum.photos/seed/sl${Date.now()}/400/300`
    });
    demoSave(s);
    return { id };
  }

  if ((m = /^\/products\/(\d+)$/.exec(path))) {
    const id = Number(m[1]);
    if (method === "DELETE") {
      needLogin();
      findOwn(id);
      s.products = s.products.filter(p => p.id !== id);
      s.favorites = s.favorites.filter(f => f.productId !== id);
      demoSave(s);
      return { ok: true };
    }
    const p = s.products.find(p => p.id === id);
    if (!p) throw demoError(404, "ไม่พบสินค้านี้");
    return view(p);
  }

  if ((m = /^\/products\/(\d+)\/passed$/.exec(path))) {
    needLogin();
    const p = findOwn(Number(m[1]));
    p.passed = !p.passed;
    demoSave(s);
    return { passed: p.passed };
  }

  if (path === "/my-products") {
    needLogin();
    return s.products.filter(p => p.userId === user.id).sort(byNewest).map(view);
  }

  if (path === "/favorites") {
    needLogin();
    const ids = s.favorites.filter(f => f.userId === user.id).map(f => f.productId);
    return s.products.filter(p => ids.includes(p.id)).sort(byNewest).map(view);
  }

  if ((m = /^\/favorites\/(\d+)$/.exec(path))) {
    needLogin();
    const pid = Number(m[1]);
    if (!s.products.some(p => p.id === pid)) throw demoError(404, "ไม่พบสินค้านี้");
    const had = s.favorites.some(f => f.userId === user.id && f.productId === pid);
    s.favorites = had
      ? s.favorites.filter(f => !(f.userId === user.id && f.productId === pid))
      : [...s.favorites, { userId: user.id, productId: pid }];
    demoSave(s);
    return { fav: !had };
  }

  throw demoError(404, "ไม่พบ API นี้");
}

/* แถบแจ้งว่าเป็นโหมดสาธิต */
if (DEMO_MODE) {
  document.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("div");
    bar.className = "demo-bar";
    bar.textContent = "โหมดสาธิต: ข้อมูลเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ต้องใช้รหัสผ่านจริง";
    document.body.prepend(bar);
  });
}
