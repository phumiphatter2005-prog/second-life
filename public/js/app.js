/* ---------- ไอคอน (SVG เส้น) ---------- */
const ICONS = {
  leaf:   '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>',
  home:   '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  grid:   '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  plus:   '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  heart:  '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  user:   '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pin:    '<path d="M12 21s-7-6.1-7-12a7 7 0 0 1 14 0c0 5.9-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  book:   '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  shirt:  '<path d="M20.4 6.6 16 3a4 4 0 0 1-8 0L3.6 6.6a1 1 0 0 0-.2 1.3L5 10.5a1 1 0 0 0 1.3.4L7 10.5V20a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9.5l.7.4a1 1 0 0 0 1.3-.4l1.6-2.6a1 1 0 0 0-.2-1.3Z"/>',
  pencil: '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  laptop: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 20h20"/>',
  lamp:   '<path d="M8 2h8l3 8H5Z"/><path d="M12 10v8M8 22h8M12 18v4"/>',
  box:    '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  check:  '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  menu:   '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:  '<path d="M6 6l12 12M18 6 6 18"/>',
  alert:  '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  flag:   '<path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5"/>',
  chat:   '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/>',
  edit:   '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  image:  '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  trash:  '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  recycle:'<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.2 9.5M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2.1M14 16l-3 3 3 3M8.3 13.6 7.2 9.5 3.1 10.6M14.8 6.8 13.4 4.5a1.8 1.8 0 0 0-3.1 0L9.1 6.6M16.7 10.9l3.1-1.1 1.1 4.1"/>'
};

function icon(name, cls = "ic") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

/* ---------- ดาว ---------- */
function starsHtml(value) {
  const pct = Math.max(0, Math.min(5, value || 0)) / 5 * 100;
  return `<span class="stars" aria-label="${(value || 0).toFixed(1)} จาก 5 ดาว">
    <span class="stars-fill" style="width:${pct}%">★★★★★</span>★★★★★</span>`;
}

function ratingLine(rating, count) {
  return count
    ? `<span class="rating">${starsHtml(rating)}<b>${rating.toFixed(1)}</b><small>(${count})</small></span>`
    : `<span class="rating rating-none">ยังไม่มีรีวิว</span>`;
}

/* ---------- การ์ดสินค้า ---------- */
function formatPrice(p) {
  return p.type === "free" ? "ฟรี" : "฿" + p.price.toLocaleString();
}

function categoryName(id) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.name : "อื่นๆ";
}

function productCard(p) {
  return `
    <div class="card-wrap">
      ${p.passed ? `<span class="passed-tag">${icon("recycle")}ส่งต่อแล้ว</span>` : ""}
      <button class="fav-btn ${p.isFav ? "on" : ""}" data-id="${p.id}" aria-label="รายการโปรด">${icon("heart")}</button>
      <a class="card" href="product.html?id=${p.id}">
        <div class="card-img"><img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy"></div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <div class="card-meta">
            <span class="price">${formatPrice(p)}</span>
            <span class="badge badge-${p.type}">${TYPE_LABEL[p.type]}</span>
          </div>
          <div class="card-pickup">${icon("pin")}${esc(p.pickup)}</div>
          <div class="card-foot">
            <span class="card-seller"><span class="avatar avatar-xs">${esc(p.sellerName.slice(0, 1))}</span><span>${esc(p.sellerName)}</span></span>
            ${p.ratingCount ? ratingLine(p.rating, p.ratingCount) : ""}
          </div>
        </div>
      </a>
    </div>`;
}

/* ---------- แถบเมนู + ส่วนท้าย (เหมือนกันทุกหน้า) ---------- */
const NAV_ICONS = { "index.html": "home", "search.html": "grid", "post.html": "plus", "favorites.html": "heart" };

const SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

function decorateNav() {
  const logo = document.querySelector(".logo");
  if (logo) logo.innerHTML = `<span class="logo-mark">${icon("leaf")}</span><span>Second Life</span>`;

  const nav = document.querySelector(".nav-links");
  if (nav) {
    nav.id = "nav-links";
    nav.querySelectorAll("a").forEach(a => {
      const name = NAV_ICONS[a.getAttribute("href")];
      if (name) a.innerHTML = icon(name) + `<span>${a.textContent}</span>`;
    });

    /* มือถือ: ปุ่มเปิดเมนูแบบลิ้นชัก · ขวา: ปุ่มค้นหา + บัญชีผู้ใช้ */
    logo.insertAdjacentHTML("beforebegin", `
      <button class="nav-toggle" type="button" aria-label="เมนู" title="เมนู" aria-expanded="false" aria-controls="nav-links">${icon("menu")}</button>`);
    nav.insertAdjacentHTML("afterend", `
      <div class="nav-right">
        <button class="nav-search" type="button" title="ค้นหา (${SHORTCUT})" aria-label="ค้นหา">${icon("search")}<span>ค้นหา</span><kbd>${SHORTCUT}</kbd></button>
        <span class="nav-user"></span>
      </div>`);

    const toggle = document.querySelector(".nav-toggle");
    const setOpen = open => {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = icon(open ? "close" : "menu");
    };
    toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
    document.addEventListener("click", e => {
      if (!e.target.closest(".navbar")) setOpen(false);
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
    document.querySelector(".nav-search").addEventListener("click", openSearch);
  }

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <div class="footer-logo">${icon("leaf")} Second Life</div>
          <p>ตลาดสินค้ามือสองในมหาวิทยาลัย<br>ให้สิ่งของ...ได้มีชีวิตที่สอง</p>
        </div>
        <div>
          <strong>เป้าหมายการพัฒนาที่ยั่งยืน</strong>
          <p>SDG 12 การผลิตและการบริโภคที่ยั่งยืน (12.5)<br>SDG 11 เมืองและชุมชนที่ยั่งยืน (11.6)</p>
        </div>
        <div>
          <strong>จัดทำโดย</strong>
          <p id="footer-credits">คณะเทคโนโลยีสารสนเทศ<br>มหาวิทยาลัยศรีปทุม วิทยาเขตขอนแก่น</p>
        </div>
      </div>
      <p class="footer-tag container">Second Life for a Better Tomorrow</p>
    </footer>`);
}

/* ---------- ผู้ใช้ที่เข้าสู่ระบบ ---------- */
let currentUser = null;
decorateNav();
const userReady = api("/me")
  .then(d => { currentUser = d.user; })
  .catch(() => {})
  .then(renderNavUser);

/* ข้อความหน้าเว็บที่ผู้ดูแลระบบตั้งค่าไว้ (ว่าง = ใช้ค่าเริ่มต้นใน HTML) */
const settingsReady = api("/settings").catch(() => ({}));

function renderNavUser() {
  const nav = document.querySelector(".nav-links");
  const slot = document.querySelector(".nav-user");
  if (!nav || !slot) return;
  const isAdmin = currentUser && currentUser.role === "admin";
  if (isAdmin) {
    const onAdmin = location.pathname.endsWith("admin.html");
    nav.insertAdjacentHTML("beforeend",
      `<a href="admin.html" class="${onAdmin ? "active" : ""}">${icon("shield")}<span>หลังบ้าน</span></a>`);
  }

  if (!currentUser) {
    slot.innerHTML = `<a href="login.html" class="btn btn-primary btn-sm">เข้าสู่ระบบ</a>`;
    return;
  }

  /* เมนูบัญชีแบบ dropdown จากรูปโปรไฟล์ */
  slot.innerHTML = `
    <button class="avatar-btn" type="button" aria-haspopup="menu" aria-expanded="false" title="${esc(currentUser.name)}">
      <span class="avatar">${esc(currentUser.name.slice(0, 1))}</span>
    </button>
    <div class="user-menu" role="menu" hidden>
      <div class="user-menu-head"><strong>${esc(currentUser.name)}</strong><code>${esc(currentUser.studentId)}</code></div>
      <a role="menuitem" href="favorites.html?tab=mine">${icon("box")}ประกาศของฉัน</a>
      <a role="menuitem" href="favorites.html">${icon("heart")}รายการโปรด</a>
      ${isAdmin ? `<a role="menuitem" href="admin.html">${icon("shield")}ระบบหลังบ้าน</a>` : ""}
      <button role="menuitem" type="button" class="danger-item" id="btn-logout">${icon("logout")}ออกจากระบบ</button>
    </div>`;
  const btn = slot.querySelector(".avatar-btn");
  const menu = slot.querySelector(".user-menu");
  const setOpen = open => { menu.hidden = !open; btn.setAttribute("aria-expanded", open); };
  btn.addEventListener("click", () => setOpen(menu.hidden));
  document.addEventListener("click", e => { if (!e.target.closest(".nav-user")) setOpen(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
  slot.querySelector("#btn-logout").addEventListener("click", async () => {
    await api("/logout", { method: "POST" }).catch(() => {});
    location.href = "index.html";
  });
}

/* ---------- ค้นหาทั่วเว็บ (⌘K / Ctrl K) ---------- */
function openSearch() {
  const input = [...document.querySelectorAll("#hero-q, #f-q, #admin-q")].find(el => el.offsetParent);
  if (input) {
    input.focus();
    input.select();
  } else {
    location.href = "search.html?focus=1";
  }
}

document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openSearch();
  }
});

/* ---------- ลายจุดบนหน้าแรกที่ขยับตามเมาส์ ---------- */
function setupDotGrid() {
  const hero = document.querySelector(".hero");
  if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--mx", e.clientX - r.left + "px");
    hero.style.setProperty("--my", e.clientY - r.top + "px");
    hero.classList.add("dots-on");
  });
  hero.addEventListener("pointerleave", () => hero.classList.remove("dots-on"));
}

/* ---------- หน้าแรก ---------- */
function renderCategories() {
  const el = document.getElementById("categories");
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => `
    <a class="cat" href="search.html?cat=${c.id}">
      <span class="cat-icon">${icon(c.icon)}</span>
      <span>${c.name}</span>
    </a>`).join("");
}

async function renderPopular() {
  const el = document.getElementById("popular");
  if (!el) return;
  try {
    await userReady;
    const list = (await api("/products")).filter(p => !p.passed);
    el.innerHTML = list.length
      ? list.slice(0, 10).map(productCard).join("")
      : `<p class="empty">ยังไม่มีสินค้า มาเป็นคนแรกที่ <a href="post.html">ลงประกาศ</a></p>`;
  } catch (e) {
    el.innerHTML = `<p class="empty">โหลดสินค้าไม่สำเร็จ: ${esc(e.message)}</p>`;
  }
}

async function renderStats() {
  const passed = document.getElementById("stat-passed");
  if (!passed) return;
  try {
    const s = await api("/stats");
    /* ซ่อนตัวเลขที่เป็น 0 ถ้าเป็น 0 ทั้งหมดก็ซ่อนทั้งแถบ */
    const values = { "stat-passed": s.passed, "stat-items": s.items, "stat-users": s.users };
    let shown = 0;
    Object.entries(values).forEach(([id, n]) => {
      const el = document.getElementById(id);
      el.textContent = Number(n || 0).toLocaleString();
      el.closest(".stat").hidden = !n;
      if (n) shown++;
    });
    document.getElementById("stats").hidden = !shown;
    document.getElementById("about").classList.toggle("no-stats", !shown);
  } catch (e) { /* ไม่แสดงตัวเลขถ้าโหลดไม่ได้ */ }
}

function setupHeroSearch() {
  const form = document.getElementById("hero-search");
  if (!form) return;
  document.getElementById("hero-kbd").textContent = SHORTCUT;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const q = document.getElementById("hero-q").value.trim();
    location.href = "search.html?q=" + encodeURIComponent(q);
  });
}

/* ---------- ปุ่มหัวใจบนการ์ดสินค้า (ใช้ได้ทุกหน้า) ---------- */
async function toggleFav(id) {
  if (!currentUser) { goLogin(); return null; }
  const { fav } = await api("/favorites/" + id, { method: "POST" });
  document.dispatchEvent(new CustomEvent("favchange", { detail: { id, fav } }));
  return fav;
}

function setupFavButtons() {
  document.addEventListener("click", async e => {
    const btn = e.target.closest(".fav-btn");
    if (!btn) return;
    e.preventDefault();
    btn.disabled = true;
    try {
      const on = await toggleFav(Number(btn.dataset.id));
      if (on !== null) btn.classList.toggle("on", on);
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- ข้อความหน้าเว็บจากหน้า "ตั้งค่าเว็บ" ---------- */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el && typeof value === "string" && value.trim()) el.textContent = value.trim();
}

async function applySettings() {
  const s = await settingsReady;
  setText("footer-credits", s.credits);
  setText("about-title", s.aboutTitle);
  setText("about-text", s.aboutText);
  setText("hero-text", s.heroText);
  const h1 = document.getElementById("hero-title");
  if (h1 && (s.heroTitle || "").trim()) {
    h1.textContent = s.heroTitle.trim();
    /* คำเน้นสีเขียวต่อท้ายหัวข้อ (ไม่บังคับ) */
    if ((s.heroHighlight || "").trim()) {
      h1.insertAdjacentHTML("beforeend", ` <span class="hl">${esc(s.heroHighlight.trim())}</span>`);
    }
  }
  const banner = document.getElementById("hero-banner");
  if (banner && s.bannerUrl) {
    banner.src = s.bannerUrl;
    banner.hidden = false;
    banner.closest(".hero").classList.add("has-banner");
  }
}

/* ย่อรูปให้กว้างไม่เกิน maxW แล้วคืนเป็น data URL (JPEG) สำหรับอัปโหลด */
function resizeImage(file, maxW = 800) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("กรุณาเลือกไฟล์รูปภาพ"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("เปิดไฟล์รูปไม่สำเร็จ"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

applySettings();
renderCategories();
renderPopular();
renderStats();
setupHeroSearch();
setupFavButtons();
setupDotGrid();
