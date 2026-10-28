/* ---------- ระบบหลังบ้าน ---------- */
let adminTab = new URLSearchParams(location.search).get("tab") || "overview";
let adminRows = [];
const adminBody = document.getElementById("admin-body");
const adminQ = document.getElementById("admin-q");

const ADMIN_TABS = {
  overview: { load: "/admin/overview", render: renderOverview },
  products: { load: "/admin/products", render: renderProducts, search: "ค้นหาชื่อสินค้า ผู้ขาย หรือรหัสนักศึกษา" },
  users:    { load: "/admin/users", render: renderUsers, search: "ค้นหาชื่อหรือรหัสนักศึกษา" },
  reviews:  { load: "/admin/reviews", render: renderReviews, search: "ค้นหาชื่อสินค้า ผู้รีวิว หรือข้อความ" }
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
function renderOverview(o) {
  const tiles = [
    ["สินค้าทั้งหมด", o.items],
    ["ส่งต่อแล้ว", o.passed],
    ["ผู้ใช้งาน", o.users],
    ["รีวิว", o.reviews],
    ["ผู้ดูแลระบบ", o.admins],
    ["บัญชีที่ถูกระงับ", o.banned]
  ];
  const rate = o.items ? Math.round(o.passed / o.items * 100) : 0;
  const breakdown = (title, entries) => `
    <div class="panel">
      <h3 class="panel-title">${title}</h3>
      <div class="list">
        ${entries.map(([label, n]) => `
          <div class="list-row"><span>${label}</span><strong>${(n || 0).toLocaleString()}</strong></div>`).join("")}
      </div>
    </div>`;

  adminBody.innerHTML = `
    <div class="kpis">
      ${tiles.map(([label, n]) => `
        <div class="kpi"><span>${label}</span><strong>${(n || 0).toLocaleString()}</strong></div>`).join("")}
    </div>
    <p class="muted kpi-note">อัตราการส่งต่อสำเร็จ <b>${rate}%</b> ของประกาศทั้งหมด</p>
    <div class="admin-split">
      ${breakdown("ตามหมวดหมู่", CATEGORIES.filter(c => c.id !== "all").map(c => [c.name, o.byCategory[c.id]]))}
      ${breakdown("ตามประเภทประกาศ", Object.keys(TYPE_LABEL).map(t => [TYPE_LABEL[t], o.byType[t]]))}
    </div>`;
}

/* ---------- สินค้า ---------- */
function renderProducts(list) {
  const rows = list.filter(p => matches(p.title, p.sellerName, p.sellerStudentId, p.contact));
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
              <span>${formatPrice(p)}</span>
              <span>${esc(p.sellerName)}${p.sellerStudentId ? ` · <code>${esc(p.sellerStudentId)}</code>` : ""}</span>
              <span>${formatDay(p.createdAt)}</span>
              ${p.passed ? `<span class="status status-ok">ส่งต่อแล้ว</span>` : `<span class="status">เปิดอยู่</span>`}
            </div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-sm btn-secondary" data-act="passed">${p.passed ? "เปิดประกาศอีกครั้ง" : "ทำเครื่องหมายส่งต่อแล้ว"}</button>
            <button class="btn btn-sm btn-danger" data-act="delete" data-label="ลบ">ลบ</button>
          </div>
        </div>`).join("") || `<p class="empty">ไม่พบสินค้า</p>`}
    </div>`;
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
          <span class="avatar">${esc(u.name.slice(0, 1))}</span>
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

/* ---------- โหลดและสลับแท็บ ---------- */
async function loadTab() {
  const tab = ADMIN_TABS[adminTab] ? adminTab : "overview";
  const conf = ADMIN_TABS[tab];
  document.querySelectorAll("#admin-tabs .chip").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.getElementById("admin-toolbar").hidden = !conf.search;
  adminQ.placeholder = conf.search || "";
  adminError("");
  adminBody.innerHTML = `<p class="muted">กำลังโหลด...</p>`;
  try {
    adminRows = await api(conf.load);
    conf.render(adminRows);
  } catch (e) {
    adminBody.innerHTML = "";
    adminError(e.message);
  }
}

document.querySelectorAll("#admin-tabs .chip").forEach(btn => {
  btn.addEventListener("click", () => {
    adminTab = btn.dataset.tab;
    adminQ.value = "";
    history.replaceState(null, "", "?tab=" + adminTab);
    loadTab();
  });
});

adminQ.addEventListener("input", () => ADMIN_TABS[adminTab].render(adminRows));

adminBody.addEventListener("click", async e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const row = btn.closest(".admin-row");
  const act = btn.dataset.act;
  try {
    if (act === "passed") {
      await api(`/products/${row.dataset.id}/passed`, { method: "POST" });
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
    } else if (act === "delete-review") {
      if (!confirmed(btn, "ยืนยันลบ?")) return;
      await api(`/admin/reviews/${row.dataset.product}/${row.dataset.user}`, { method: "DELETE" });
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
    : DEMO_MODE ? "โหมดสาธิต — ข้อมูลเก็บในเบราว์เซอร์นี้เท่านั้น" : "ฐานข้อมูลบนเซิร์ฟเวอร์ (SQLite)";
  document.getElementById("admin-app").hidden = false;
  loadTab();
});
