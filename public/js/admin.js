/* ---------- ระบบหลังบ้าน ---------- */
const adminParams = new URLSearchParams(location.search);
let adminTab = adminParams.get("tab") || "overview";
let adminSection = adminParams.get("section") || "";     // "images" = เมนู "จัดการรูป" (อยู่ในตั้งค่าเว็บ)
const ADMIN_LABELS = { overview: "แดชบอร์ด", products: "ประกาศ", users: "ผู้ใช้", reviews: "รีวิว", reports: "รายงาน", settings: "ตั้งค่าเว็บ" };
let adminRows = [];
const adminBody = document.getElementById("admin-body");
const adminQ = document.getElementById("admin-q");
const adminFilter = document.getElementById("admin-filter");
const adminFilterCheck = document.getElementById("admin-filter-check");

const ADMIN_TABS = {
  overview: { load: () => loadDashboard(), render: renderOverview },
  products: { load: "/admin/products", render: renderProducts, search: "ค้นหาชื่อสินค้า ผู้ขาย หรือรหัสนักศึกษา",
              filter: "เฉพาะที่ถูกรายงาน" },
  users:    { load: "/admin/users", render: renderUsers, search: "ค้นหาชื่อหรือรหัสนักศึกษา" },
  reviews:  { load: "/admin/reviews", render: renderReviews, search: "ค้นหาชื่อสินค้า ผู้รีวิว หรือข้อความ" },
  reports:  { load: loadReports, render: renderReports, search: "ค้นหาชื่อสินค้า เหตุผล หรือผู้รายงาน",
              filter: "แสดงเรื่องที่ปิดแล้วด้วย" },
  settings: { load: "/settings", render: renderSettings }
};

const REPORT_STATUS = {
  open:      ["รอตรวจสอบ", "status-warn"],
  resolved:  ["จัดการแล้ว", "status-ok"],
  dismissed: ["ไม่ดำเนินการ", ""]
};

function adminError(msg) {
  const el = document.getElementById("admin-error");
  el.textContent = msg || "";
  el.hidden = !msg;
}

function formatDay(ms) {
  return ms ? new Date(ms).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "-";
}

function matches(...fields) {
  const q = adminQ.value.trim().toLowerCase();
  return !q || fields.some(f => String(f ?? "").toLowerCase().includes(q));
}

/* ปุ่มที่ต้องกดสองครั้งเพื่อยืนยัน (ลบ / ระงับ) */
function confirmed(btn, text) {
  if (btn.dataset.confirm) return true;
  btn.dataset.confirm = "1";
  btn.textContent = text;
  setTimeout(() => {
    if (!btn.isConnected) return;
    delete btn.dataset.confirm;
    btn.textContent = btn.dataset.label;
  }, 4000);
  return false;
}

/* ---------- ภาพรวม ---------- */
/* ---------- แดชบอร์ด ----------
   ตัวเลขทั้งหมดมาจากฐานข้อมูลจริง: /admin/overview (ยอดรวม) + /admin/dashboard (รายวัน 14 วัน + กิจกรรมล่าสุด)
   /admin/dashboard ยังไม่พร้อม (ยังไม่ได้รัน 008) → การ์ดยังแสดงยอดรวม ส่วนกราฟแสดงคำแนะนำแทน ไม่พัง */
async function loadDashboard() {
  const [overview, dash] = await Promise.all([
    api("/admin/overview"),
    api("/admin/dashboard").catch(e => ({ error: e.message || "โหลดข้อมูลกราฟไม่สำเร็จ" }))
  ]);
  return { overview, dash };
}

const DASH_ICONS = {
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
  recycle: '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.7"/><path d="m11 19 3 3 3-3"/><path d="M14 22v-7"/><path d="M12.6 3.8a1.8 1.8 0 0 1 3 0l3.6 6.2"/><path d="m21 6-.8 4.4-4.3-1"/><path d="M19.6 13.5 21 16.3a1.8 1.8 0 0 1-1.6 2.7H17"/><path d="M8.8 2.9 5.6 8.2"/><path d="m2.4 7.2 3.2 1 1.2-4.3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  star: '<path d="M11.5 2.3a.6.6 0 0 1 1 0l2.6 5.3 5.8.8a.6.6 0 0 1 .3 1l-4.2 4.1 1 5.8a.6.6 0 0 1-.9.6L12 17.2l-5.2 2.7a.6.6 0 0 1-.9-.6l1-5.8L2.7 9.4a.6.6 0 0 1 .3-1l5.8-.8z"/>'
};
const dashIcon = name => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DASH_ICONS[name]}</svg>`;
const statNum = n => (typeof n === "number" ? n.toLocaleString() : "–");
const sum = a => (a || []).reduce((t, n) => t + n, 0);

/* เส้นโค้งแบบ monotone (ไม่โค้งเกินจุดข้อมูล จึงไม่ลงต่ำกว่า 0) */
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  const n = pts.length, dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i] / 3;
    d += ` C${(x0 + h).toFixed(1)},${(y0 + t[i] * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - t[i + 1] * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}
/* ค่าสูงสุดของแกน: ปัดขึ้นให้หาร 4 ลงตัว อย่างน้อย 4 (ข้อมูลเป็น 0 ทั้งหมดก็ยังวาดได้) */
const niceMax = v => Math.max(4, Math.ceil(v / 4) * 4);

let dashUid = 0;
function sparkline(values, color) {
  const W = 120, H = 36, pad = 3, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [pad + i * (W - pad * 2) / (values.length - 1), H - pad - v / max * (H - pad * 2)]);
  const line = smoothPath(pts), id = "sg" + (++dashUid), last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color:var(${color});stop-opacity:.28"/><stop offset="1" style="stop-color:var(${color});stop-opacity:0"/></linearGradient></defs>
    <path d="${line} L${last[0]},${H} L${pts[0][0]},${H} Z" fill="url(#${id})"/>
    <path d="${line}" fill="none" style="stroke:var(${color})" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

const dayLabel = (start, i, opts = { day: "numeric", month: "short" }) =>
  new Date(start + i * 864e5 + 12 * 3600e3).toLocaleDateString("th-TH", { ...opts, timeZone: "Asia/Bangkok" });

/* กราฟใหญ่: ประกาศใหม่ + ส่งต่อแล้ว 14 วัน (SVG เขียนเอง · crosshair + tooltip · ปุ่มลูกศรเลื่อนวันได้) */
function drawTrend(box, dash) {
  const S = [
    { key: "products", label: "ประกาศใหม่", color: "--chart-new" },
    { key: "passed", label: "ส่งต่อแล้ว", color: "--chart-passed" }
  ];
  const days = dash.series.products.length;
  const W = Math.max(280, box.clientWidth), H = W < 520 ? 220 : 280;
  const L = 32, R = 16, T = 16, B = 30;
  const max = niceMax(Math.max(...S.flatMap(s => dash.series[s.key])));
  const x = i => L + i * (W - L - R) / (days - 1);
  const y = v => T + (1 - v / max) * (H - T - B);
  const every = W < 520 ? 3 : 2;
  const grid = [0, 1, 2, 3, 4].map(k => {
    const v = max * k / 4, yy = y(v).toFixed(1);
    return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="grid-line"/>
      <text x="${L - 8}" y="${yy}" class="axis-text" text-anchor="end" dominant-baseline="middle">${v}</text>`;
  }).join("");
  const xs = Array.from({ length: days }, (_, i) => i)
    .filter(i => (days - 1 - i) % every === 0)
    .map(i => `<text x="${x(i).toFixed(1)}" y="${H - 8}" class="axis-text" text-anchor="middle">${dayLabel(dash.start, i)}</text>`).join("");
  const series = S.map((s, k) => {
    const pts = dash.series[s.key].map((v, i) => [x(i), y(v)]);
    const line = smoothPath(pts), id = "tg" + k + (++dashUid);
    return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(${s.color});stop-opacity:.22"/><stop offset="1" style="stop-color:var(${s.color});stop-opacity:0"/></linearGradient></defs>
      <path d="${line} L${x(days - 1)},${y(0)} L${x(0)},${y(0)} Z" fill="url(#${id})"/>
      <path d="${line}" fill="none" style="stroke:var(${s.color})" stroke-width="2" stroke-linecap="round"/>`;
  }).join("");
  box.innerHTML = `
    <svg class="trend-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
      aria-label="กราฟเส้น ประกาศใหม่และการส่งต่อ 14 วันล่าสุด ดูตัวเลขรายวันได้ในตารางด้านล่าง">
      ${grid}${xs}${series}
      <line class="cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
      ${S.map((s, k) => `<circle class="cross-dot" data-k="${k}" r="5" style="fill:var(${s.color})" visibility="hidden"/>`).join("")}
    </svg>
    <div class="trend-tip" hidden></div>`;
  const svg = box.querySelector("svg"), tip = box.querySelector(".trend-tip");
  const cross = svg.querySelector(".cross"), dots = svg.querySelectorAll(".cross-dot");
  const show = i => {
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
    dots.forEach((d, k) => { d.setAttribute("cx", x(i)); d.setAttribute("cy", y(dash.series[S[k].key][i])); d.setAttribute("visibility", "visible"); });
    tip.innerHTML = `<strong>${dayLabel(dash.start, i, { weekday: "short", day: "numeric", month: "short" })}</strong>
      ${S.map(s => `<span><i style="background:var(${s.color})"></i>${s.label}<b>${dash.series[s.key][i]}</b></span>`).join("")}`;
    tip.hidden = false;
    const px = x(i) / W * box.clientWidth;
    tip.style.left = Math.min(Math.max(px, tip.offsetWidth / 2 + 4), box.clientWidth - tip.offsetWidth / 2 - 4) + "px";
    box.dataset.i = i;
  };
  const hide = () => { cross.setAttribute("visibility", "hidden"); dots.forEach(d => d.setAttribute("visibility", "hidden")); tip.hidden = true; };
  const nearest = e => {
    const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W;
    return Math.round(Math.min(Math.max((px - L) / (W - L - R) * (days - 1), 0), days - 1));
  };
  svg.addEventListener("pointermove", e => show(nearest(e)));
  svg.addEventListener("pointerdown", e => show(nearest(e)));
  svg.addEventListener("pointerleave", hide);
  box.onkeydown = e => {
    const cur = box.dataset.i === undefined ? days - 1 : Number(box.dataset.i);
    if (e.key === "ArrowLeft") { e.preventDefault(); show(Math.max(0, cur - 1)); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(Math.min(days - 1, cur + 1)); }
    if (e.key === "Escape") hide();
  };
  box.onfocus = () => show(box.dataset.i === undefined ? days - 1 : Number(box.dataset.i));
  box.onblur = hide;
}

function timeAgo(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "เมื่อสักครู่";
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} วันที่แล้ว`;
  return formatDay(ms);
}
const ACTIVITY = {
  product: ["package", "ลงประกาศใหม่", "act-product"],
  passed:  ["recycle", "ส่งต่อแล้ว", "act-passed"],
  review:  ["star", "รีวิวใหม่", "act-review"],
  report:  ["flag", "รายงานใหม่", "act-report"]
};

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" })) % 24;
  return h < 12 ? "สวัสดีตอนเช้า" : h < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";
}

function renderOverview({ overview: o, dash }) {
  const ok = dash && dash.series;
  const series = ok ? dash.series : {};
  const week = key => (ok ? sum(series[key].slice(-7)) : null);
  const cards = [
    ["ประกาศทั้งหมด", o.items, "package", "products", "products", "--chart-new"],
    ["ส่งต่อแล้ว", o.passed, "recycle", "passed", "products", "--chart-passed"],
    ["ผู้ใช้", o.users, "users", "users", "users", "--chart-users"],
    ["รายงานรอตรวจ", o.reportsOpen, "flag", "reports", "reports", "--chart-reports"]
  ];
  const typeOrder = ["sell", "free", "swap"];       // ม่วง → เขียว → น้ำเงิน (ม่วงติดน้ำเงินแยกยากสำหรับคนตาบอดสี)
  const typeTotal = sum(typeOrder.map(t => o.byType[t] || 0));
  const cats = CATEGORIES.filter(c => c.id !== "all").map(c => [c.name, o.byCategory[c.id] || 0]);
  const catTotal = sum(cats.map(c => c[1]));
  const pct = (n, t) => (t ? Math.round(n / t * 100) : 0);
  const rate = o.items ? Math.round(o.passed / o.items * 100) : 0;
  const online = SUPABASE_MODE ? "เชื่อมต่อ Supabase แล้ว" : DEMO_MODE ? "โหมดสาธิต" : "เชื่อมต่อเซิร์ฟเวอร์แล้ว";
  const notReady = `<p class="dash-empty">${esc(dash && dash.error ? "ยังโหลดข้อมูลรายวันไม่ได้ (" + dash.error + ")" : "ยังไม่มีข้อมูลรายวัน")}${SUPABASE_MODE ? " · รันไฟล์ supabase/008_admin_dashboard.sql ใน SQL Editor เพื่อแสดงกราฟ" : ""}</p>`;

  adminBody.innerHTML = `
    <div class="dash">
      <div class="dash-head">
        <div>
          <h2 class="dash-hello">${greeting()}, ${esc(currentUser.name)}</h2>
          <p class="muted">${esc(document.getElementById("admin-mode").textContent)}</p>
        </div>
        <span class="online-pill" title="${esc(online)}"><i aria-hidden="true"></i>ระบบออนไลน์</span>
      </div>

      ${cards.map(([label, n, ic, key, tab, color]) => {
        const w = week(key);
        return `
        <button type="button" class="dash-card stat-tile" data-goto="${tab}">
          <span class="stat-tile-top">
            <span class="stat-card-ic stat-${ic}">${dashIcon(ic)}</span>
            <span class="stat-card-label">${label}</span>
          </span>
          <span class="stat-tile-mid">
            <strong class="stat-card-num">${statNum(n)}</strong>
            ${w === null ? "" : `<span class="delta ${w ? "up" : ""}">${w ? "+" + w.toLocaleString() : "0"} ใน 7 วัน</span>`}
          </span>
          ${ok ? sparkline(series[key], color) : `<span class="spark spark-empty" aria-hidden="true"></span>`}
        </button>`;
      }).join("")}

      <section class="dash-card dash-trend" aria-labelledby="trend-title">
        <div class="dash-card-head">
          <h3 id="trend-title">ประกาศใหม่และการส่งต่อ 14 วันล่าสุด</h3>
          ${ok ? `<div class="legend">
            <span><i style="background:var(--chart-new)"></i>ประกาศใหม่ <b>${sum(series.products)}</b></span>
            <span><i style="background:var(--chart-passed)"></i>ส่งต่อแล้ว <b>${sum(series.passed)}</b></span>
          </div>` : ""}
        </div>
        ${ok ? `<div class="trend-box" id="trend-box" tabindex="0" aria-describedby="trend-help"></div>
          <p class="sr-help visually-hidden" id="trend-help">ใช้ปุ่มลูกศรซ้ายขวาเพื่อดูแต่ละวัน</p>
          <details class="trend-table">
            <summary>ดูเป็นตาราง</summary>
            <table>
              <thead><tr><th scope="col">วันที่</th><th scope="col">ประกาศใหม่</th><th scope="col">ส่งต่อแล้ว</th></tr></thead>
              <tbody>${series.products.map((v, i) => `<tr><th scope="row">${dayLabel(dash.start, i)}</th><td>${v}</td><td>${series.passed[i]}</td></tr>`).join("")}</tbody>
            </table>
          </details>` : notReady}
      </section>

      <section class="dash-card dash-types" aria-labelledby="types-title">
        <div class="dash-card-head"><h3 id="types-title">ตามประเภทประกาศ</h3><span class="muted">${typeTotal.toLocaleString()} ประกาศ</span></div>
        <div class="type-bar" role="img" aria-label="${typeOrder.map(t => `${TYPE_LABEL[t]} ${o.byType[t] || 0}`).join(", ")}">
          ${typeTotal ? typeOrder.filter(t => o.byType[t]).map(t => `<span class="seg seg-${t}" style="flex:${o.byType[t]}"></span>`).join("") : `<span class="seg seg-none"></span>`}
        </div>
        <ul class="type-legend">
          ${typeOrder.map(t => `<li><i class="tl-dot seg-${t}"></i><span>${TYPE_LABEL[t]}</span><b>${(o.byType[t] || 0).toLocaleString()}</b><small>${pct(o.byType[t] || 0, typeTotal)}%</small></li>`).join("")}
        </ul>
      </section>

      <section class="dash-card dash-mini" aria-labelledby="mini-title">
        <h3 id="mini-title" class="visually-hidden">ตัวเลขอื่น</h3>
        <dl class="mini-stats">
          <div><dt>รีวิว</dt><dd>${statNum(o.reviews)}</dd></div>
          <div><dt>ผู้ดูแลระบบ</dt><dd>${statNum(o.admins)}</dd></div>
          <div><dt>บัญชีถูกระงับ</dt><dd>${statNum(o.banned)}</dd></div>
          <div><dt>ห้องแชต</dt><dd>${statNum(o.chatRooms)}</dd></div>
          <div><dt>ส่งต่อสำเร็จ</dt><dd>${rate}%</dd></div>
        </dl>
      </section>

      <section class="dash-card dash-cats" aria-labelledby="cats-title">
        <div class="dash-card-head"><h3 id="cats-title">ตามหมวดหมู่</h3><span class="muted">${catTotal.toLocaleString()} ประกาศ</span></div>
        <ul class="cat-bars">
          ${cats.map(([name, n]) => `
            <li>
              <span class="cat-name">${esc(name)}</span>
              <span class="cat-track" role="img" aria-label="${esc(name)} ${n} ประกาศ (${pct(n, catTotal)}%)"><span style="width:${pct(n, catTotal)}%"></span></span>
              <b>${n.toLocaleString()}</b>
            </li>`).join("")}
        </ul>
      </section>

      <section class="dash-card dash-activity" aria-labelledby="act-title">
        <div class="dash-card-head"><h3 id="act-title">กิจกรรมล่าสุด</h3></div>
        ${ok ? (dash.activity.length ? `<ol class="activity">
          ${dash.activity.map(a => { const [ic, text, cls] = ACTIVITY[a.kind] || ACTIVITY.product; return `
            <li>
              <span class="act-ic ${cls}">${dashIcon(ic)}</span>
              <span class="act-body"><b>${esc(a.who)}</b> ${text}<span class="act-title">${esc(a.title)}</span></span>
              <time datetime="${new Date(a.at).toISOString()}" title="${esc(new Date(a.at).toLocaleString("th-TH"))}">${timeAgo(a.at)}</time>
            </li>`; }).join("")}
        </ol>` : `<p class="dash-empty">ยังไม่มีกิจกรรม</p>`) : notReady}
      </section>
    </div>`;

  if (ok) {
    const box = document.getElementById("trend-box");
    drawTrend(box, dash);
    /* วาดใหม่เมื่อความกว้างเปลี่ยน (หมุนจอ / ย่อหน้าต่าง) */
    if (window.ResizeObserver) {
      let w = box.clientWidth;
      new ResizeObserver(() => { if (box.isConnected && Math.abs(box.clientWidth - w) > 4) { w = box.clientWidth; drawTrend(box, dash); } }).observe(box);
    }
  }
}

/* ---------- สินค้า ---------- */
function renderProducts(list) {
  const rows = list.filter(p =>
    matches(p.title, p.sellerName, p.sellerStudentId, p.contact) &&
    (!adminFilterCheck.checked || p.reportCount > 0));
  adminBody.innerHTML = `
    <p class="muted admin-count">${rows.length.toLocaleString()} รายการ</p>
    <div class="list panel">
      ${rows.map(p => `
        <div class="list-row admin-row" data-id="${p.id}">
          <img class="admin-thumb" src="${esc(p.img)}" alt="" loading="lazy">
          <div class="admin-main">
            <a class="admin-title" href="product.html?id=${p.id}">${esc(p.title)}</a>
            <div class="admin-meta">
              <span class="badge badge-${p.type}">${TYPE_LABEL[p.type]}</span>
              <span class="price-${p.type}">${formatPrice(p)}</span>
              <span>${esc(p.sellerName)}${p.sellerStudentId ? ` · <code>${esc(p.sellerStudentId)}</code>` : ""}</span>
              <span>${formatDay(p.createdAt)}</span>
              ${p.passed ? `<span class="status status-ok">ส่งต่อแล้ว</span>` : `<span class="status">เปิดอยู่</span>`}
              ${p.reportCount ? `<span class="status status-warn">ถูกรายงาน ${p.reportCount}</span>` : ""}
            </div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-sm btn-secondary" data-act="edit">แก้ไข</button>
            <button class="btn btn-sm btn-secondary" data-act="passed" data-label="${p.passed ? "เปิดประกาศอีกครั้ง" : "ส่งต่อแล้ว"}">${p.passed ? "เปิดประกาศอีกครั้ง" : "ส่งต่อแล้ว"}</button>
            <button class="btn btn-sm btn-danger" data-act="delete" data-label="ลบ">ลบ</button>
          </div>
        </div>`).join("") || `<p class="empty">ไม่พบสินค้า</p>`}
    </div>`;
}

/* ---------- แก้ไขประกาศ (เฉพาะแอดมิน) ---------- */
let editImages = [];

async function openEditor(id) {
  adminError("");
  document.getElementById("admin-toolbar").hidden = true;
  adminBody.innerHTML = skeletonRows(5);
  history.replaceState(null, "", `?tab=products&edit=${id}`);
  try {
    const [p, settings] = await Promise.all([api("/admin/products/" + id), settingsReady]);
    renderEditor(p, settings);
  } catch (e) {
    adminBody.innerHTML = `<button class="btn btn-ghost btn-md" data-act="back">← กลับไปรายการสินค้า</button>`;
    adminError(e.message);
  }
}

function renderEditor(p, settings) {
  editImages = Array.isArray(p.images) && p.images.length ? [...p.images] : [p.img];
  const opts = (pairs, value) => pairs.map(([v, label]) =>
    `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(label)}</option>`).join("");
  const points = Array.isArray(settings.pickupPoints) && settings.pickupPoints.length ? settings.pickupPoints : DEFAULT_PICKUP_POINTS;

  adminBody.innerHTML = `
    <div class="panel"><div class="panel-body">
      <div class="edit-head">
        <h2>แก้ไขประกาศ #${p.id}</h2>
        <button type="button" class="btn btn-ghost btn-md" data-act="back">← กลับ</button>
      </div>
      <p class="muted"><a class="back-link" style="margin:0" href="product.html?id=${p.id}">ดูหน้าประกาศ</a></p>

      <form id="edit-form" class="form-grid" novalidate>
        <div class="full">
          <label class="field-label" for="e-title">ชื่อสินค้า *</label>
          <input id="e-title" type="text" maxlength="100" value="${esc(p.title)}">
        </div>
        <div>
          <label class="field-label" for="e-cat">หมวดหมู่</label>
          <select id="e-cat">${opts(CATEGORIES.filter(c => c.id !== "all").map(c => [c.id, c.name]), p.category)}</select>
        </div>
        <div>
          <label class="field-label" for="e-type">ประเภทประกาศ</label>
          <select id="e-type">${opts(Object.entries(TYPE_LABEL), p.type)}</select>
        </div>
        <div>
          <label class="field-label" for="e-price">ราคา (บาท)</label>
          <input id="e-price" type="number" inputmode="numeric" min="0" max="1000000" value="${Number(p.price) || 0}">
        </div>
        <div>
          <label class="field-label" for="e-cond">สภาพสินค้า</label>
          <select id="e-cond">${opts(Object.keys(CONDITION_INFO).map(c => [c, c]), p.condition)}</select>
        </div>
        <div>
          <label class="field-label" for="e-pickup">จุดนัดรับ *</label>
          <input id="e-pickup" type="text" maxlength="100" list="e-pickup-list" value="${esc(p.pickup)}">
          <datalist id="e-pickup-list">${points.map(x => `<option value="${esc(x)}">`).join("")}</datalist>
        </div>
        <div>
          <label class="field-label" for="e-contact">ช่องทางติดต่อ *</label>
          <input id="e-contact" type="text" maxlength="100" value="${esc(p.contact)}">
        </div>
        <div class="full">
          <label class="field-label" for="e-desc">รายละเอียดสินค้า</label>
          <textarea id="e-desc" rows="4" maxlength="1000">${esc(p.description)}</textarea>
        </div>
        <div class="full">
          <label class="field-label" style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input id="e-passed" type="checkbox" ${p.passed ? "checked" : ""}> ส่งต่อแล้ว (ปิดประกาศ)
          </label>
        </div>
        <div class="full">
          <label class="field-label">รูปภาพ (รูปแรกคือรูปหลัก · สูงสุด 10 รูป)</label>
          <div class="img-grid" id="edit-images"></div>
          <p class="field-hint">รูปที่ลบหรือเปลี่ยน จะถูกลบออกจาก Supabase Storage เมื่อกดบันทึก</p>
          <input id="edit-add" type="file" accept="image/*" multiple hidden>
          <input id="edit-replace" type="file" accept="image/*" hidden>
        </div>
        <div class="full">
          <p class="form-error" id="edit-error" hidden></p>
          <div class="btn-row">
            <button type="button" class="btn btn-secondary" data-act="back">ยกเลิก</button>
            <button type="submit" class="btn-primary" id="edit-save">บันทึกการแก้ไข</button>
          </div>
        </div>
      </form>
    </div></div>`;

  renderEditImages();
  const form = document.getElementById("edit-form");
  const errEl = document.getElementById("edit-error");
  let replaceIndex = -1;

  const addFiles = async (files, index) => {
    errEl.hidden = true;
    try {
      for (const f of files) {
        if (index < 0 && editImages.length >= 10) throw new Error("ใส่รูปได้ไม่เกิน 10 รูปต่อประกาศ");
        const data = await resizeImage(f, 800);
        if (index >= 0) editImages[index] = data;
        else editImages.push(data);
      }
    } catch (e) {
      errEl.textContent = e.message;
      errEl.hidden = false;
    }
    renderEditImages();
  };
  document.getElementById("edit-add").addEventListener("change", e => {
    addFiles([...e.target.files], -1);
    e.target.value = "";
  });
  document.getElementById("edit-replace").addEventListener("change", e => {
    if (e.target.files[0] && replaceIndex >= 0) addFiles([e.target.files[0]], replaceIndex);
    e.target.value = "";
  });

  document.getElementById("edit-images").addEventListener("click", e => {
    const btn = e.target.closest("[data-img]");
    if (!btn) return;
    const i = Number(btn.dataset.index);
    if (btn.dataset.img === "cover") editImages.unshift(...editImages.splice(i, 1));
    if (btn.dataset.img === "remove") editImages.splice(i, 1);
    if (btn.dataset.img === "replace") {
      replaceIndex = i;
      document.getElementById("edit-replace").click();
      return;
    }
    renderEditImages();
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const save = document.getElementById("edit-save");
    errEl.hidden = true;
    save.disabled = true;
    save.textContent = "กำลังบันทึก...";
    try {
      await api("/admin/products/" + p.id, {
        method: "PUT",
        body: {
          title: document.getElementById("e-title").value,
          category: document.getElementById("e-cat").value,
          type: document.getElementById("e-type").value,
          price: document.getElementById("e-price").value,
          condition: document.getElementById("e-cond").value,
          pickup: document.getElementById("e-pickup").value,
          contact: document.getElementById("e-contact").value,
          description: document.getElementById("e-desc").value,
          passed: document.getElementById("e-passed").checked,
          images: editImages
        }
      });
      adminTab = "products";
      history.replaceState(null, "", "?tab=products");
      await loadTab();
      adminBody.insertAdjacentHTML("afterbegin", `<p class="form-ok" style="margin:0 0 16px">บันทึกประกาศ #${p.id} แล้ว</p>`);
    } catch (ex) {
      errEl.textContent = ex.message;
      errEl.hidden = false;
      save.disabled = false;
      save.textContent = "บันทึกการแก้ไข";
    }
  });
}

function renderEditImages() {
  const grid = document.getElementById("edit-images");
  if (!grid) return;
  grid.innerHTML = editImages.map((src, i) => `
    <div class="img-tile">
      <img src="${esc(src)}" alt="รูปที่ ${i + 1}">
      ${i === 0 ? `<span class="cover-label">รูปหลัก</span>` : ""}
      <div class="img-actions">
        ${i > 0 ? `<button type="button" class="btn btn-sm btn-secondary" data-img="cover" data-index="${i}">ตั้งเป็นรูปหลัก</button>` : ""}
        <button type="button" class="btn btn-sm btn-secondary" data-img="replace" data-index="${i}">เปลี่ยนรูป</button>
        <button type="button" class="btn btn-sm btn-danger" data-img="remove" data-index="${i}">ลบรูป</button>
      </div>
    </div>`).join("") + (editImages.length < 10 ? `
    <label class="img-add" for="edit-add">${icon("image")}<span>+ เพิ่มรูป</span></label>` : "");
}

/* ---------- ผู้ใช้ ---------- */
function renderUsers(list) {
  const rows = list.filter(u => matches(u.name, u.studentId));
  adminBody.innerHTML = `
    <p class="muted admin-count">${rows.length.toLocaleString()} บัญชี</p>
    <div class="list panel">
      ${rows.map(u => {
        const self = currentUser && String(u.id) === String(currentUser.id);
        return `
        <div class="list-row admin-row" data-id="${esc(u.id)}">
          ${avatarHtml(u.name, u.avatarUrl)}
          <div class="admin-main">
            <span class="admin-title">${esc(u.name)}${self ? " (คุณ)" : ""}</span>
            <div class="admin-meta">
              <code>${esc(u.studentId)}</code>
              <span>${u.products} ประกาศ</span>
              <span>สมัคร ${formatDay(u.createdAt)}</span>
              ${u.role === "admin" ? `<span class="status status-admin">ผู้ดูแลระบบ</span>` : ""}
              ${u.banned ? `<span class="status status-bad">ถูกระงับ</span>` : ""}
            </div>
          </div>
          <div class="admin-actions">
            ${self ? `<span class="muted">บัญชีของคุณ</span>` : `
              ${u.avatarUrl ? `<button class="btn btn-sm btn-danger" data-act="avatar-remove" data-label="ลบรูปโปรไฟล์">ลบรูปโปรไฟล์</button>` : ""}
              <button class="btn btn-sm btn-secondary" data-act="role">${u.role === "admin" ? "ยกเลิกสิทธิ์แอดมิน" : "ตั้งเป็นแอดมิน"}</button>
              <button class="btn btn-sm ${u.banned ? "btn-secondary" : "btn-danger"}" data-act="ban"
                data-label="${u.banned ? "ปลดระงับ" : "ระงับบัญชี"}">${u.banned ? "ปลดระงับ" : "ระงับบัญชี"}</button>`}
          </div>
        </div>`;
      }).join("") || `<p class="empty">ไม่พบผู้ใช้</p>`}
    </div>`;
}

/* ---------- รีวิว ---------- */
function renderReviews(list) {
  const rows = list.filter(r => matches(r.productTitle, r.name, r.comment));
  adminBody.innerHTML = `
    <p class="muted admin-count">${rows.length.toLocaleString()} รีวิว</p>
    <div class="list panel">
      ${rows.map(r => `
        <div class="list-row admin-row" data-product="${r.productId}" data-user="${esc(r.userId)}">
          <div class="admin-main">
            <a class="admin-title" href="product.html?id=${r.productId}">${esc(r.productTitle)}</a>
            <div class="admin-meta">${starsHtml(r.stars)}<span>${esc(r.name)}</span><span>${formatDay(r.createdAt)}</span></div>
            ${r.comment ? `<p class="admin-comment">${esc(r.comment)}</p>` : ""}
          </div>
          <div class="admin-actions">
            <button class="btn btn-sm btn-danger" data-act="delete-review" data-label="ลบรีวิว">ลบรีวิว</button>
          </div>
        </div>`).join("") || `<p class="empty">ยังไม่มีรีวิว</p>`}
    </div>`;
}

/* ---------- รายงานประกาศ + รายงานแชต ---------- */
async function loadReports() {
  /* รายงานประกาศต้องใช้ Supabase · รายงานแชตใช้ได้ทั้ง Supabase และ npm start */
  const [products, chats] = await Promise.allSettled([api("/admin/reports"), api("/admin/chat-reports")]);
  return {
    product: products.status === "fulfilled" ? products.value : [],
    productError: products.status === "rejected" ? products.reason.message : "",
    chat: chats.status === "fulfilled" ? chats.value : [],
    chatError: chats.status === "rejected" ? chats.reason.message : ""
  };
}

function reportButtons(r, act) {
  return r.status === "open" ? `
    <button class="btn btn-sm btn-secondary" data-act="${act}" data-status="resolved">จัดการแล้ว</button>
    <button class="btn btn-sm btn-secondary" data-act="${act}" data-status="dismissed">ไม่ดำเนินการ</button>` : `
    <button class="btn btn-sm btn-secondary" data-act="${act}" data-status="open">เปิดเรื่องอีกครั้ง</button>`;
}

function renderReports(data) {
  const visible = r => adminFilterCheck.checked || r.status === "open";
  const chats = data.chat.filter(r =>
    matches(r.productTitle, r.reason, r.detail, r.reporterName, r.reporterStudentId, r.reportedName, r.reportedStudentId) &&
    visible(r));
  renderProductReports(data.product, data.productError);
  adminBody.insertAdjacentHTML("beforeend", `
    <h3 class="admin-subhead">รายงานห้องแชต</h3>
    ${data.chatError ? `<p class="muted">${esc(data.chatError)}</p>` : `
    <p class="muted admin-count">${chats.length.toLocaleString()} เรื่อง</p>
    <div class="list panel">
      ${chats.map(r => {
        const [label, cls] = REPORT_STATUS[r.status] || [r.status, ""];
        return `
        <div class="list-row admin-row" data-id="${r.id}">
          <img class="admin-thumb" src="${esc(r.productImg)}" alt="" loading="lazy">
          <div class="admin-main">
            <a class="admin-title" href="messages.html?room=${r.roomId}">แชตเรื่อง ${esc(r.productTitle)}</a>
            <div class="admin-meta">
              <span class="status ${cls}">${label}</span>
              <strong>${esc(r.reason)}</strong>
              <span>ผู้ถูกรายงาน ${esc(r.reportedName)}${r.reportedStudentId ? ` · <code>${esc(r.reportedStudentId)}</code>` : ""}</span>
              <span>โดย ${esc(r.reporterName)}</span>
              <span>${formatDay(r.createdAt)}</span>
            </div>
            ${r.detail ? `<p class="admin-comment">${esc(r.detail)}</p>` : ""}
          </div>
          <div class="admin-actions">
            <a class="btn btn-sm btn-secondary" href="messages.html?room=${r.roomId}">ดูแชต</a>
            ${reportButtons(r, "chat-report-status")}
          </div>
        </div>`;
      }).join("") || `<p class="empty" style="padding:16px">${adminFilterCheck.checked ? "ยังไม่มีรายงานแชต" : "ไม่มีรายงานแชตที่รอตรวจสอบ"}</p>`}
    </div>`}`);
}

function renderProductReports(list, error) {
  const rows = list.filter(r =>
    matches(r.productTitle, r.reason, r.detail, r.reporterName, r.reporterStudentId) &&
    (adminFilterCheck.checked || r.status === "open"));
  if (error) {
    adminBody.innerHTML = `<h3 class="admin-subhead" style="margin-top:0">รายงานประกาศ</h3><p class="muted">${esc(error)}</p>`;
    return;
  }
  adminBody.innerHTML = `
    <h3 class="admin-subhead" style="margin-top:0">รายงานประกาศ</h3>
    <p class="muted admin-count">${rows.length.toLocaleString()} เรื่อง</p>
    <div class="list panel">
      ${rows.map(r => {
        const [label, cls] = REPORT_STATUS[r.status] || [r.status, ""];
        return `
        <div class="list-row admin-row" data-id="${r.id}">
          <img class="admin-thumb" src="${esc(r.productImg)}" alt="" loading="lazy">
          <div class="admin-main">
            <a class="admin-title" href="product.html?id=${r.productId}">${esc(r.productTitle)}</a>
            <div class="admin-meta">
              <span class="status ${cls}">${label}</span>
              <strong>${esc(r.reason)}</strong>
              <span>โดย ${esc(r.reporterName)}${r.reporterStudentId ? ` · <code>${esc(r.reporterStudentId)}</code>` : ""}</span>
              <span>${formatDay(r.createdAt)}</span>
            </div>
            ${r.detail ? `<p class="admin-comment">${esc(r.detail)}</p>` : ""}
          </div>
          <div class="admin-actions">
            <button class="btn btn-sm btn-secondary" data-act="edit" data-pid="${r.productId}">แก้ไขประกาศ</button>
            ${r.status === "open" ? `
              <button class="btn btn-sm btn-secondary" data-act="report-status" data-status="resolved">จัดการแล้ว</button>
              <button class="btn btn-sm btn-secondary" data-act="report-status" data-status="dismissed">ไม่ดำเนินการ</button>` : `
              <button class="btn btn-sm btn-secondary" data-act="report-status" data-status="open">เปิดเรื่องอีกครั้ง</button>`}
          </div>
        </div>`;
      }).join("") || `<p class="empty">${adminFilterCheck.checked ? "ยังไม่มีรายงาน" : "ไม่มีรายงานที่รอตรวจสอบ"}</p>`}
    </div>`;
}

async function refreshReportBadge() {
  /* นับรวมรายงานประกาศและรายงานแชตที่รอตรวจ */
  try {
    const o = await api("/admin/overview");
    document.getElementById("report-badge").textContent = o.reportsOpen ? String(o.reportsOpen) : "";
  } catch (e) { /* ไม่แสดงตัวเลขถ้าโหลดไม่ได้ */ }
}

/* ---------- ตั้งค่าเว็บ ---------- */
let settingsBanner = "";

function renderSettings(s) {
  settingsBanner = s.bannerUrl || "";
  const field = (id, label, value, placeholder, rows = 0, hint = "") => `
    <div class="full">
      <label class="field-label" for="${id}">${label}</label>
      ${rows
        ? `<textarea id="${id}" rows="${rows}" placeholder="${esc(placeholder)}">${esc(value || "")}</textarea>`
        : `<input id="${id}" type="text" value="${esc(value || "")}" placeholder="${esc(placeholder)}">`}
      ${hint ? `<p class="field-hint">${hint}</p>` : ""}
    </div>`;

  adminBody.innerHTML = `
    <div class="panel"><div class="panel-body">
      <div class="edit-head"><h2>ตั้งค่าเว็บ</h2></div>
      <p class="muted">เว้นว่าง = ใช้ข้อความเดิมของเว็บ (แสดงเป็นตัวอย่างสีจางในช่อง) · ขึ้นบรรทัดใหม่ได้</p>
      <form id="settings-form" class="form-grid">
        ${field("s-heroTitle", "หัวข้อหน้าแรก", s.heroTitle, "ให้สิ่งของ\nได้มี", 2)}
        ${field("s-heroHighlight", "คำเน้นสีเขียวท้ายหัวข้อ", s.heroHighlight, "ชีวิตที่สอง", 0,
          "ถ้าตั้งหัวข้อเอง คำนี้จะต่อท้ายหัวข้อเป็นสีเขียว (เว้นว่างได้)")}
        ${field("s-heroText", "คำอธิบายใต้หัวข้อ", s.heroText, "ซื้อ ขาย แลกเปลี่ยน และแจกฟรี ภายในชุมชนมหาวิทยาลัย", 2)}
        ${field("s-aboutTitle", "เกี่ยวกับโครงการ: หัวข้อ", s.aboutTitle, "ร่วมส่งต่อสิ่งของ ลดขยะ สร้างสังคมที่ยั่งยืนไปด้วยกัน")}
        ${field("s-aboutText", "เกี่ยวกับโครงการ: เนื้อหา", s.aboutText, "ทุกชิ้นที่ส่งต่อ คือการให้ชีวิตที่สองและลดขยะ ตอบโจทย์ SDG 12 และ SDG 11", 3)}
        ${field("s-credits", "ผู้จัดทำ (ท้ายเว็บทุกหน้า)", s.credits, "คณะเทคโนโลยีสารสนเทศ\nมหาวิทยาลัยศรีปทุม วิทยาเขตขอนแก่น", 3)}
        ${field("s-pickup", "จุดนัดรับให้เลือกตอนลงประกาศ (บรรทัดละ 1 จุด)",
          (s.pickupPoints || []).join("\n"), DEFAULT_PICKUP_POINTS.join("\n"), 6)}
        <div class="full">
          <label class="field-label">รูปแบนเนอร์หน้าแรก</label>
          <div id="banner-slot"></div>
          <div class="chips">
            <label class="btn btn-sm btn-secondary" for="s-banner-file">เลือกรูป</label>
            <button type="button" class="btn btn-sm btn-danger" id="s-banner-remove">ลบรูปแบนเนอร์</button>
          </div>
          <input id="s-banner-file" type="file" accept="image/*" hidden>
          <p class="field-hint">แนะนำแนวนอน 4:3 ระบบย่อให้กว้าง 1200px อัตโนมัติ · รูปเดิมจะถูกลบจาก Storage เมื่อบันทึก</p>
        </div>
        <div class="full">
          <p class="form-error" id="settings-error" hidden></p>
          <p class="form-ok" id="settings-ok" hidden>บันทึกแล้ว เปิดหน้าแรกเพื่อดูผล</p>
          <div class="btn-row">
            <button type="submit" class="btn-primary" id="settings-save">บันทึกการตั้งค่า</button>
          </div>
        </div>
      </form>
    </div></div>`;

  if (adminSection === "images") {
    const box = document.getElementById("banner-slot").closest(".full");
    box.classList.add("admin-focus");
    requestAnimationFrame(() => box.scrollIntoView({ block: "start", behavior: "smooth" }));
  }

  const renderBanner = () => {
    document.getElementById("banner-slot").innerHTML = settingsBanner
      ? `<img class="banner-preview" src="${esc(settingsBanner)}" alt="ตัวอย่างแบนเนอร์">`
      : `<p class="muted" style="margin-bottom:12px">ยังไม่มีรูปแบนเนอร์</p>`;
    document.getElementById("s-banner-remove").hidden = !settingsBanner;
  };
  renderBanner();

  const errEl = document.getElementById("settings-error");
  document.getElementById("s-banner-file").addEventListener("change", async e => {
    try {
      if (e.target.files[0]) settingsBanner = await resizeImage(e.target.files[0], 1200);
      renderBanner();
    } catch (ex) {
      errEl.textContent = ex.message;
      errEl.hidden = false;
    }
    e.target.value = "";
  });
  document.getElementById("s-banner-remove").addEventListener("click", () => {
    settingsBanner = "";
    renderBanner();
  });

  document.getElementById("settings-form").addEventListener("submit", async e => {
    e.preventDefault();
    const save = document.getElementById("settings-save");
    const val = id => document.getElementById(id).value.trim();
    errEl.hidden = true;
    document.getElementById("settings-ok").hidden = true;
    save.disabled = true;
    try {
      const saved = await api("/admin/settings", {
        method: "PUT",
        body: {
          heroTitle: val("s-heroTitle"),
          heroHighlight: val("s-heroHighlight"),
          heroText: val("s-heroText"),
          aboutTitle: val("s-aboutTitle"),
          aboutText: val("s-aboutText"),
          credits: val("s-credits"),
          pickupPoints: val("s-pickup").split("\n").map(x => x.trim()).filter(Boolean).slice(0, 30),
          bannerUrl: settingsBanner
        }
      });
      settingsBanner = saved.bannerUrl || "";
      renderBanner();
      document.getElementById("settings-ok").hidden = false;
    } catch (ex) {
      errEl.textContent = ex.message;
      errEl.hidden = false;
    } finally {
      save.disabled = false;
    }
  });
}

/* ---------- โหลดและสลับแท็บ ---------- */
async function loadTab() {
  const tab = ADMIN_TABS[adminTab] ? adminTab : "overview";
  const conf = ADMIN_TABS[tab];
  markAdminNav(tab);
  document.getElementById("admin-toolbar").hidden = !conf.filter;
  /* หน้าที่ไม่มีรายการให้ค้น (แดชบอร์ด/ตั้งค่า): พิมพ์แล้วกด Enter = ค้นหาประกาศ */
  adminQ.placeholder = conf.search || "ค้นหาประกาศ แล้วกด Enter";
  adminFilter.hidden = !conf.filter;
  adminFilter.querySelector("span").textContent = conf.filter || "";
  adminError("");
  adminBody.innerHTML = skeletonRows(5);
  try {
    adminRows = typeof conf.load === "function" ? await conf.load() : await api(conf.load);
    conf.render(adminRows);
  } catch (e) {
    adminBody.innerHTML = "";
    adminError(e.message);
  }
}

/* เมนูที่เลือกอยู่ + หัวข้อ + ตำแหน่งหน้า (หลังบ้าน / ...) */
function markAdminNav(tab) {
  document.querySelectorAll("#admin-tabs [data-tab]").forEach(b => {
    const on = b.dataset.tab === tab && (b.dataset.section || "") === (tab === "settings" ? adminSection : "");
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("tab-overview", tab === "overview");   // แดชบอร์ดมีคำทักทายแทนหัวข้อหน้า
  const label = tab === "settings" && adminSection === "images" ? "จัดการรูป" : ADMIN_LABELS[tab] || "แดชบอร์ด";
  document.getElementById("admin-crumb").textContent = label;
  document.getElementById("admin-title").textContent = label;
  document.title = label + " · หลังบ้าน | Second Life";
}

function goAdminTab(tab, section = "", keepQuery = false) {
  adminTab = tab;
  adminSection = section;
  if (!keepQuery) adminQ.value = "";
  adminFilterCheck.checked = false;
  history.replaceState(null, "", "?tab=" + adminTab + (section ? "&section=" + section : ""));
  closeAdminSide();
  loadTab();
}

document.querySelectorAll("#admin-tabs [data-tab]").forEach(btn => {
  btn.addEventListener("click", () => goAdminTab(btn.dataset.tab, btn.dataset.section || ""));
});

adminQ.addEventListener("input", () => { if (ADMIN_TABS[adminTab].search) ADMIN_TABS[adminTab].render(adminRows); });
adminQ.addEventListener("keydown", e => {
  if (e.key === "Enter" && !ADMIN_TABS[adminTab].search && adminQ.value.trim()) goAdminTab("products", "", true);
});
adminFilterCheck.addEventListener("change", () => ADMIN_TABS[adminTab].render(adminRows));

adminBody.addEventListener("click", async e => {
  const go = e.target.closest("[data-goto]");
  if (go) return goAdminTab(go.dataset.goto);
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const row = btn.closest(".admin-row");
  const act = btn.dataset.act;
  if (act === "edit") return openEditor(btn.dataset.pid || row.dataset.id);
  if (act === "back") {
    history.replaceState(null, "", "?tab=" + adminTab);
    return loadTab();
  }
  try {
    if (act === "passed") {
      /* ยกเลิกการส่งต่อ = รีวิวของผู้รับคนเดิมถูกลบ จึงกดสองครั้งเพื่อยืนยัน */
      const cur = adminRows.find(p => String(p.id) === row.dataset.id);
      if (cur && cur.passed && !confirmed(btn, "ยืนยัน? รีวิวผู้รับจะถูกลบ")) return;
      const { passed } = await api(`/products/${row.dataset.id}/passed`, { method: "POST" });
      if (passed) celebratePassed(btn);
    } else if (act === "delete") {
      if (!confirmed(btn, "ยืนยันลบ?")) return;
      await api("/products/" + row.dataset.id, { method: "DELETE" });
    } else if (act === "role") {
      const u = adminRows.find(u => String(u.id) === row.dataset.id);
      await api("/admin/users/" + u.id, { method: "POST", body: { role: u.role === "admin" ? "user" : "admin" } });
    } else if (act === "ban") {
      const u = adminRows.find(u => String(u.id) === row.dataset.id);
      if (!u.banned && !confirmed(btn, "ยืนยันระงับ?")) return;
      await api("/admin/users/" + u.id, { method: "POST", body: { banned: !u.banned } });
    } else if (act === "avatar-remove") {
      if (!confirmed(btn, "ยืนยันลบรูป?")) return;
      await api(`/admin/users/${row.dataset.id}/avatar-remove`, { method: "POST" });
      toast("ลบรูปโปรไฟล์แล้ว");
    } else if (act === "delete-review") {
      if (!confirmed(btn, "ยืนยันลบ?")) return;
      await api(`/admin/reviews/${row.dataset.product}/${row.dataset.user}`, { method: "DELETE" });
    } else if (act === "chat-report-status") {
      await api("/admin/chat-reports/" + row.dataset.id, { method: "POST", body: { status: btn.dataset.status } });
      refreshReportBadge();
    } else if (act === "report-status") {
      await api("/admin/reports/" + row.dataset.id, { method: "POST", body: { status: btn.dataset.status } });
      refreshReportBadge();
    }
    loadTab();
  } catch (err) {
    adminError(err.message);
  }
});

/* ---------- ตรวจสิทธิ์ก่อนเปิดหน้า ---------- */
userReady.then(() => {
  if (!currentUser) return goLogin();
  if (currentUser.role !== "admin") {
    document.getElementById("admin-gate").innerHTML = `
      <div class="empty-state">
        <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        <a class="btn btn-secondary" href="index.html">กลับหน้าแรก</a>
      </div>`;
    return;
  }
  document.getElementById("admin-mode").textContent = SUPABASE_MODE
    ? "เชื่อมต่อฐานข้อมูล Supabase"
    : (DEMO_MODE ? "โหมดสาธิต — ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น" : "ฐานข้อมูลบนเซิร์ฟเวอร์ (SQLite)") +
      " · แก้ไขประกาศ รายงาน และตั้งค่าเว็บ ใช้ได้เมื่อเชื่อมต่อ Supabase";
  document.getElementById("admin-app").hidden = false;
  document.body.classList.add("is-admin");
  document.getElementById("admin-me").innerHTML = `
    <span class="admin-me-text"><strong>${esc(currentUser.name)}</strong><small>ผู้ดูแลระบบ</small></span>
    <a href="profile.html" class="admin-me-avatar" aria-label="โปรไฟล์ของ ${esc(currentUser.name)}">${avatarHtml(currentUser.name, currentUser.avatarUrl, "avatar-lg")}</a>`;
  refreshReportBadge();
  const editId = adminParams.get("edit");
  if (editId) {
    adminTab = "products";
    markAdminNav("products");
    openEditor(editId);
  } else {
    loadTab();
  }
});

/* ---------- หน้าตาหลังบ้าน: เมนูซ้าย (มือถือเลื่อนออกมา) · ธีม · ออกจากระบบ ---------- */
const adminSide = document.getElementById("admin-side");
const adminMenuBtn = document.getElementById("admin-menu-btn");
const adminBackdrop = document.getElementById("admin-backdrop");
const ADMIN_MOBILE = matchMedia("(max-width: 767px)");

function openAdminSide() {
  adminSide.classList.add("open");
  adminBackdrop.hidden = false;
  adminMenuBtn.setAttribute("aria-expanded", "true");
  document.documentElement.classList.add("drawer-lock");
  (adminSide.querySelector(".admin-nav-item.active") || adminSide.querySelector(".admin-nav-item")).focus();
}
function closeAdminSide(restoreFocus = false) {
  if (!adminSide.classList.contains("open")) return;
  adminSide.classList.remove("open");
  adminBackdrop.hidden = true;
  adminMenuBtn.setAttribute("aria-expanded", "false");
  document.documentElement.classList.remove("drawer-lock");
  if (restoreFocus) adminMenuBtn.focus();
}
adminMenuBtn.addEventListener("click", openAdminSide);
document.getElementById("admin-side-close").addEventListener("click", () => closeAdminSide(true));
adminBackdrop.addEventListener("click", () => closeAdminSide(true));
adminSide.addEventListener("keydown", e => {
  if (e.key === "Escape" && adminSide.classList.contains("open")) { e.preventDefault(); closeAdminSide(true); }
  if (e.key !== "Tab" || !adminSide.classList.contains("open")) return;
  const items = [...adminSide.querySelectorAll("a[href], button")].filter(el => el.offsetParent);
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
ADMIN_MOBILE.addEventListener("change", e => { if (!e.matches) closeAdminSide(); });

document.getElementById("admin-theme").innerHTML = `<span class="admin-theme-label">ธีมสี</span>${themeChoices()}`;
syncThemeUI();
document.getElementById("admin-logout").addEventListener("click", async () => {
  await api("/logout", { method: "POST" }).catch(() => {});
  location.href = "index.html";
});
markAdminNav(ADMIN_TABS[adminTab] ? adminTab : "overview");
