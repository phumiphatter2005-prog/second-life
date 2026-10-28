/* ---------- ระบบหลังบ้าน ---------- */
const adminParams = new URLSearchParams(location.search);
let adminTab = adminParams.get("tab") || "overview";
let adminRows = [];
const adminBody = document.getElementById("admin-body");
const adminQ = document.getElementById("admin-q");
const adminFilter = document.getElementById("admin-filter");
const adminFilterCheck = document.getElementById("admin-filter-check");

const ADMIN_TABS = {
  overview: { load: "/admin/overview", render: renderOverview },
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
function renderOverview(o) {
  const tiles = [
    ["สินค้าทั้งหมด", o.items],
    ["ส่งต่อแล้ว", o.passed],
    ["ผู้ใช้งาน", o.users],
    ["รีวิว", o.reviews],
    ["ผู้ดูแลระบบ", o.admins],
    ["บัญชีที่ถูกระงับ", o.banned]
  ];
  if (o.reportsOpen !== undefined) tiles.push(["รายงานรอตรวจสอบ", o.reportsOpen]);
  if (o.chatRooms !== undefined) tiles.push(["ห้องแชต", o.chatRooms]);
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
              <span>${formatPrice(p)}</span>
              <span>${esc(p.sellerName)}${p.sellerStudentId ? ` · <code>${esc(p.sellerStudentId)}</code>` : ""}</span>
              <span>${formatDay(p.createdAt)}</span>
              ${p.passed ? `<span class="status status-ok">ส่งต่อแล้ว</span>` : `<span class="status">เปิดอยู่</span>`}
              ${p.reportCount ? `<span class="status status-warn">ถูกรายงาน ${p.reportCount}</span>` : ""}
            </div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-sm btn-secondary" data-act="edit">แก้ไข</button>
            <button class="btn btn-sm btn-secondary" data-act="passed">${p.passed ? "เปิดประกาศอีกครั้ง" : "ส่งต่อแล้ว"}</button>
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
    document.getElementById("report-badge").textContent = o.reportsOpen ? ` (${o.reportsOpen})` : "";
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
  document.querySelectorAll("#admin-tabs .chip").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.getElementById("admin-toolbar").hidden = !conf.search;
  adminQ.placeholder = conf.search || "";
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

document.querySelectorAll("#admin-tabs .chip").forEach(btn => {
  btn.addEventListener("click", () => {
    adminTab = btn.dataset.tab;
    adminQ.value = "";
    adminFilterCheck.checked = false;
    history.replaceState(null, "", "?tab=" + adminTab);
    loadTab();
  });
});

adminQ.addEventListener("input", () => ADMIN_TABS[adminTab].render(adminRows));
adminFilterCheck.addEventListener("change", () => ADMIN_TABS[adminTab].render(adminRows));

adminBody.addEventListener("click", async e => {
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
  refreshReportBadge();
  const editId = adminParams.get("edit");
  if (editId) {
    adminTab = "products";
    document.querySelectorAll("#admin-tabs .chip").forEach(b => b.classList.toggle("active", b.dataset.tab === "products"));
    openEditor(editId);
  } else {
    loadTab();
  }
});
