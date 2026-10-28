const CATEGORIES = [
  { id: "all",       name: "ทั้งหมด",        icon: "grid" },
  { id: "book",      name: "หนังสือ",        icon: "book" },
  { id: "clothes",   name: "เสื้อผ้า",        icon: "shirt" },
  { id: "stationery",name: "อุปกรณ์การเรียน", icon: "pencil" },
  { id: "electronic",name: "เครื่องใช้ไฟฟ้า", icon: "laptop" },
  { id: "dorm",      name: "ของใช้ในหอพัก",  icon: "lamp" },
  { id: "other",     name: "อื่นๆ",          icon: "box" }
];

const TYPE_LABEL = { sell: "ขาย", swap: "แลกเปลี่ยน", free: "แจกฟรี" };

/* คำอธิบายระดับสภาพสินค้า (แสดงตอนลงประกาศและในหน้าสินค้า) */
const CONDITION_INFO = {
  "ดีมาก": "แทบไม่มีร่องรอยการใช้งาน ใช้งานได้ครบทุกฟังก์ชัน",
  "ดี":    "มีรอยใช้งานเล็กน้อย เช่น รอยขีด รอยพับ แต่ใช้งานได้ปกติ",
  "พอใช้": "มีรอยชัดเจนหรือชำรุดบางส่วน ยังใช้งานได้ (ควรระบุจุดที่ชำรุดในรายละเอียด)"
};

/* จุดนัดรับเริ่มต้น — ผู้ดูแลระบบแก้ได้ในหน้า "ตั้งค่าเว็บ" */
const DEFAULT_PICKUP_POINTS = [
  "โรงอาหารกลาง",
  "ห้องสมุด",
  "อาคารเรียนรวม",
  "หอพักนักศึกษา",
  "ลานกิจกรรมหน้าอาคารอำนวยการ",
  "ป้ายรถหน้ามหาวิทยาลัย"
];
const PICKUP_OTHER = "__other";

/* ฟีเจอร์ที่ต้องใช้ฐานข้อมูล Supabase (server.js และโหมดสาธิตไม่มี) */
const SUPABASE_ONLY = /^\/(products\/\d+\/report|settings|admin\/(reports|settings|products\/\d+))(\/|$)/;

/* ---------- เรียก API ของเซิร์ฟเวอร์ ---------- */
async function api(path, options = {}) {
  if (SUPABASE_MODE) return supabaseApi(path, options);
  if (SUPABASE_ONLY.test(path)) {
    if (path === "/settings") return {};
    const err = new Error("ฟีเจอร์นี้ใช้ได้เมื่อเชื่อมต่อฐานข้อมูล Supabase (ตั้งค่าใน js/config.js)");
    err.status = 501;
    throw err;
  }
  if (DEMO_MODE) return demoApi(path, options);
  const res = await fetch("/api" + path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin"
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    err.status = res.status;
    throw err;
  }
  return data;
}

/* กันข้อความที่ผู้ใช้พิมพ์ไม่ให้กลายเป็นโค้ด HTML */
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function goLogin() {
  location.href = "login.html?next=" + encodeURIComponent(location.pathname + location.search);
}
