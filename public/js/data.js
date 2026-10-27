const CATEGORIES = [
  { id: "all",       name: "ทั้งหมด",        icon: "🔲" },
  { id: "book",      name: "หนังสือ",        icon: "📖" },
  { id: "clothes",   name: "เสื้อผ้า",        icon: "👕" },
  { id: "stationery",name: "อุปกรณ์การเรียน", icon: "✏️" },
  { id: "electronic",name: "เครื่องใช้ไฟฟ้า", icon: "💻" },
  { id: "dorm",      name: "ของใช้ในหอพัก",  icon: "🎒" },
  { id: "other",     name: "อื่นๆ",          icon: "💜" }
];

const TYPE_LABEL = { sell: "ขาย", swap: "แลกเปลี่ยน", free: "แจกฟรี" };

/* ---------- เรียก API ของเซิร์ฟเวอร์ ---------- */
async function api(path, options = {}) {
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
