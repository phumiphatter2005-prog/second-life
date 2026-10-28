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
  back:   '<path d="M15 18l-6-6 6-6"/>',
  send:   '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z"/>',
  tag:    '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  swap:   '<path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13"/>',
  eye:    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.4 3.4M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/>',
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
const NAV_ICONS = { "index.html": "home", "search.html": "grid", "post.html": "plus", "messages.html": "chat", "favorites.html": "heart" };

const SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";

function decorateNav() {
  const logo = document.querySelector(".logo");
  if (logo) logo.innerHTML = `<span class="logo-mark">${icon("leaf")}</span><span>Second Life</span>`;

  const nav = document.querySelector(".nav-links");
  if (nav) {
    nav.id = "nav-links";
    /* เมนู "ข้อความ" (แชต) ก่อนรายการโปรด */
    const favLink = nav.querySelector('a[href="favorites.html"]');
    if (CHAT_ENABLED && favLink && !nav.querySelector('a[href="messages.html"]')) {
      const onMessages = location.pathname.endsWith("messages.html");
      favLink.insertAdjacentHTML("beforebegin", `<a href="messages.html" class="${onMessages ? "active" : ""}">ข้อความ</a>`);
    }
    nav.querySelectorAll("a").forEach(a => {
      const href = a.getAttribute("href");
      /* ชื่อเมนูไว้ใช้เป็น tooltip และสำหรับโปรแกรมอ่านหน้าจอ เมื่อจอแคบแสดงแค่ไอคอน */
      a.title = a.textContent.trim();
      a.setAttribute("aria-label", a.title);
      const name = NAV_ICONS[href];
      if (href === "search.html") {
        /* แถบล่างบนมือถือเรียกปุ่มนี้ว่า "ค้นหา" (คอมยังเป็น "หมวดหมู่") */
        a.innerHTML = icon("grid", "ic only-desk") + icon("search", "ic only-mob") +
          `<span class="only-desk">${a.textContent}</span><span class="only-mob">ค้นหา</span>`;
      } else if (name) {
        a.innerHTML = icon(name) + `<span>${a.textContent}</span>`;
      }
    });
    const chatLink = nav.querySelector('a[href="messages.html"]');
    if (chatLink) {
      chatLink.classList.add("nav-chat");
      chatLink.insertAdjacentHTML("beforeend", `<span class="nav-badge" hidden aria-label="ข้อความที่ยังไม่อ่าน"></span>`);
    }

    /* มือถือ: แคปซูลพื้นหลังของแถบเมนูล่าง · ขวา: ปุ่มค้นหา + บัญชีผู้ใช้ */
    nav.insertAdjacentHTML("afterbegin", `<span class="nav-pill" aria-hidden="true"></span>`);
    nav.insertAdjacentHTML("afterend", `
      <div class="nav-right">
        <button class="nav-search" type="button" title="ค้นหา (${SHORTCUT})" aria-label="ค้นหา">${icon("search")}<span>ค้นหา</span><kbd>${SHORTCUT}</kbd></button>
        <span class="nav-user"></span>
      </div>`);
    document.querySelector(".nav-search").addEventListener("click", openSearch);
    placeNavPill();
    setupDrawer(logo);
  }

  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-row">
          <div class="footer-brand">
            <div class="footer-logo">${icon("leaf")} Second Life</div>
            <p><span>ตลาดสินค้ามือสองในมหาวิทยาลัย</span><span class="footer-sep"> · </span><span>ให้สิ่งของได้มีชีวิตที่สอง</span></p>
          </div>
          <p class="footer-sdg-note">ตอบโจทย์ SDG 12.5 และ SDG 11.6</p>
        </div>
        <p class="footer-tag">Second Life for a Better Tomorrow</p>
      </div>
    </footer>`);
}

/* ---------- เมนูลิ้นชักด้านซ้าย (มือถือ ≤ 820px) ---------- */
const DRAWER_MQ = matchMedia("(max-width: 820px)");
let drawerReturnFocus = null;

function drawerLinks() {
  const page = location.pathname.split("/").pop() || "index.html";
  const mine = new URLSearchParams(location.search).get("tab") === "mine";
  const isAdmin = currentUser && currentUser.role === "admin";
  const items = [
    ["index.html", "home", "หน้าแรก", page === "index.html"],
    ["search.html", "grid", "หมวดหมู่", page === "search.html"],
    ["post.html", "plus", "ลงประกาศ", page === "post.html"],
    CHAT_ENABLED && ["messages.html", "chat", "ข้อความ", page === "messages.html", true],
    ["favorites.html", "heart", "รายการโปรด", page === "favorites.html" && !mine],
    ["favorites.html?tab=mine", "box", "ประกาศของฉัน", page === "favorites.html" && mine],
    isAdmin && ["admin.html", "shield", "หลังบ้าน", page === "admin.html"],
    ["index.html#about", "leaf", "เกี่ยวกับโครงการ", false]
  ].filter(Boolean);
  return items.map(([href, ic, label, active, badge]) => `
    <a href="${href}" class="${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""}>
      ${icon(ic)}<span>${label}</span>
      ${badge ? `<span class="drawer-badge" hidden aria-label="ข้อความที่ยังไม่อ่าน"></span>` : ""}
    </a>`).join("");
}

function setupDrawer(logo) {
  logo.insertAdjacentHTML("beforebegin", `
    <button class="nav-burger" type="button" aria-label="เปิดเมนู" title="เมนู" aria-haspopup="dialog"
      aria-expanded="false" aria-controls="drawer">${icon("menu")}</button>`);
  document.body.insertAdjacentHTML("beforeend", `
    <div class="drawer-backdrop" hidden></div>
    <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1" hidden>
      <div class="drawer-head">
        <a href="index.html" class="logo" id="drawer-title"><span class="logo-mark">${icon("leaf")}</span><span>Second Life</span></a>
        <button class="drawer-close" type="button" aria-label="ปิดเมนู" title="ปิด">${icon("close")}</button>
      </div>
      <div class="drawer-user" id="drawer-user"></div>
      <nav class="drawer-nav" aria-label="เมนูหลัก">${drawerLinks()}</nav>
      <div class="drawer-foot" id="drawer-foot" hidden></div>
    </aside>`);

  const burger = document.querySelector(".nav-burger");
  const drawer = document.getElementById("drawer");
  const backdrop = document.querySelector(".drawer-backdrop");
  burger.addEventListener("click", openDrawer);
  drawer.querySelector(".drawer-close").addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  /* แตะลิงก์ในหน้าเดียวกัน (เช่น #about) → ปิดเมนูก่อนเลื่อนไป */
  drawer.addEventListener("click", e => { if (e.target.closest(".drawer-nav a")) closeDrawer(false); });
  drawer.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(); }
    if (e.key !== "Tab") return;
    /* วนโฟกัสอยู่ในเมนูระหว่างเปิด */
    const items = [...drawer.querySelectorAll("a[href], button:not([disabled])")].filter(el => el.offsetParent);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  /* หมุนจอ/ขยายจอจนเกิน 820px ระหว่างเปิด → ปิดเมนู */
  DRAWER_MQ.addEventListener("change", e => { if (!e.matches) closeDrawer(false); });
  renderDrawerUser();
}

function renderDrawerUser() {
  const box = document.getElementById("drawer-user");
  const foot = document.getElementById("drawer-foot");
  if (!box) return;
  document.querySelector(".drawer-nav").innerHTML = drawerLinks();
  if (currentUser) {
    box.innerHTML = `
      <span class="avatar avatar-lg">${esc(currentUser.name.slice(0, 1))}</span>
      <span class="drawer-user-text"><strong>${esc(currentUser.name)}</strong><code>${esc(currentUser.studentId)}</code></span>`;
    foot.hidden = false;
    foot.innerHTML = `<button type="button" class="btn btn-danger drawer-logout">${icon("logout")}ออกจากระบบ</button>`;
    foot.querySelector("button").addEventListener("click", async () => {
      await api("/logout", { method: "POST" }).catch(() => {});
      location.href = "index.html";
    });
  } else {
    box.innerHTML = `
      <span class="avatar avatar-lg">${icon("user")}</span>
      <span class="drawer-user-text"><strong>ยินดีต้อนรับ</strong><a href="login.html">เข้าสู่ระบบ / สมัครสมาชิก</a></span>`;
    foot.hidden = true;
    foot.innerHTML = "";
  }
  refreshUnread();
}

function openDrawer() {
  const drawer = document.getElementById("drawer");
  const backdrop = document.querySelector(".drawer-backdrop");
  const burger = document.querySelector(".nav-burger");
  drawerReturnFocus = burger;
  drawer.hidden = false;
  backdrop.hidden = false;
  drawer.getBoundingClientRect();   // ให้เบราว์เซอร์วาดตำแหน่งเริ่มก่อน แล้วค่อยเลื่อนเข้า
  document.documentElement.classList.add("drawer-lock");
  document.body.classList.add("drawer-open");
  burger.setAttribute("aria-expanded", "true");
  /* ส่วนอื่นของหน้ากดหรือโฟกัสไม่ได้ระหว่างเปิด */
  document.querySelectorAll("body > header, body > main, body > section, body > footer").forEach(el => { el.inert = true; });
  drawer.querySelector(".drawer-close").focus();
}

function closeDrawer(restoreFocus = true) {
  const drawer = document.getElementById("drawer");
  if (!drawer || drawer.hidden) return;
  const backdrop = document.querySelector(".drawer-backdrop");
  document.body.classList.remove("drawer-open");
  document.documentElement.classList.remove("drawer-lock");
  document.querySelector(".nav-burger").setAttribute("aria-expanded", "false");
  document.querySelectorAll("[inert]").forEach(el => { el.inert = false; });
  const hide = () => { if (!document.body.classList.contains("drawer-open")) { drawer.hidden = true; backdrop.hidden = true; } };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) hide();
  else setTimeout(hide, 320);
  if (restoreFocus && drawerReturnFocus) drawerReturnFocus.focus();
}

/* แคปซูลของแถบเมนูล่าง (มือถือ): เลื่อนจากเมนูของหน้าก่อนหน้าไปยังเมนูปัจจุบัน */
function placeNavPill() {
  const nav = document.querySelector(".nav-links");
  const pill = nav && nav.querySelector(".nav-pill");
  if (!pill) return;
  /* นับเฉพาะเมนูที่แสดงอยู่ (มือถือซ่อน "หลังบ้าน" ไว้ในเมนูบัญชี) */
  const links = [...nav.querySelectorAll(":scope > a")].filter(a => getComputedStyle(a).display !== "none");
  const i = links.findIndex(a => a.classList.contains("active"));
  nav.style.setProperty("--n", links.length);
  pill.hidden = i < 0;
  if (i < 0) return;
  let prev = -1;
  try { prev = Number(sessionStorage.getItem("nav-i") ?? -1); sessionStorage.setItem("nav-i", i); } catch (e) { /* ไม่มี storage ก็ไม่เลื่อน */ }
  if (prev >= 0 && prev < links.length && prev !== i) {
    pill.classList.add("no-anim");
    pill.style.setProperty("--i", prev);
    pill.getBoundingClientRect();   // บังคับให้วาดตำแหน่งเดิมก่อน แล้วค่อยเลื่อน
    pill.classList.remove("no-anim");
    requestAnimationFrame(() => pill.style.setProperty("--i", i));
  } else {
    pill.style.setProperty("--i", i);
  }
  /* กดเมนูแล้วแคปซูลเลื่อนไปทันทีระหว่างรอหน้าใหม่ */
  links.forEach((a, k) => {
    a.onclick = () => {
      pill.hidden = false;
      pill.style.setProperty("--i", k);
      try { sessionStorage.setItem("nav-i", k); } catch (e) { /* ข้าม */ }
    };
  });
}

/* ---------- ข้อความเด้งมุมจอ ---------- */
function toast(message, kind = "") {
  let box = document.querySelector(".toasts");
  if (!box) {
    box = document.createElement("div");
    box.className = "toasts";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const ic = { heart: "heart", leaf: "leaf" }[kind] || "check";
  const el = document.createElement("div");
  el.className = "toast" + (kind ? " toast-" + kind : "");
  el.innerHTML = `${icon(ic)}<span>${esc(message)}</span>`;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* ---------- ใบไม้กระจายออกจากปุ่ม ---------- */
const LEAF_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/></svg>';

function leafBurst(el, count = 16) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = el.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "leaf-burst";
  burst.style.transform = `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px)`;
  for (let k = 0; k < count; k++) {
    const angle = (Math.PI * 2 * k) / count + Math.random() * .4;
    const dist = 60 + Math.random() * 90;
    burst.insertAdjacentHTML("beforeend", LEAF_SVG);
    const leaf = burst.lastElementChild;
    leaf.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    leaf.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
    leaf.style.setProperty("--r", `${Math.round(Math.random() * 540 - 270)}deg`);
    leaf.style.setProperty("--t", `${.7 + Math.random() * .5}s`);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1400);
}

/* "ส่งต่อแล้ว" สำเร็จ: ใบไม้ + ข้อความขอบคุณ */
function celebratePassed(btn) {
  leafBurst(btn);
  toast("ขอบคุณที่ให้ของได้มีชีวิตที่สอง", "leaf");
}

/* ---------- ทุกส่วนค่อยๆ เลื่อนขึ้นและชัดขึ้นเมื่อเลื่อนมาถึง ---------- */
const REVEAL_SELECTOR = [
  "main > .section-head", "main > .grid", ".how", ".about", ".conveyor-section", ".categories",
  ".detail", ".reviews", ".post-card", ".steps", ".search-layout", ".page-head", ".kpis", ".admin-split",
  "#fav-list", ".empty-state"
].join(",");
const revealObserver = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches
  ? new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: .05 })
  : null;

function revealOnScroll(root = document) {
  if (!revealObserver) return;
  root.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
    if (el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

/* ---------- ตัวเลขนับขึ้นจาก 0 เมื่อเลื่อนมาเห็น ---------- */
function countUp(el, target) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window) || !target) {
    el.textContent = Number(target || 0).toLocaleString();
    return;
  }
  el.textContent = "0";
  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    const start = performance.now();
    const dur = Math.min(1800, 700 + target * 20);
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: .6 });
  io.observe(el);
}

/* ---------- กล่องเทาระหว่างโหลด ---------- */
function skeletonCards(n = 4) {
  return Array.from({ length: n }, () => `
    <div class="card-wrap sk-card" aria-hidden="true">
      <div class="sk sk-img"></div>
      <div class="card-body">
        <div class="sk sk-line w-80"></div>
        <div class="sk sk-line w-30"></div>
        <div class="sk sk-line w-50"></div>
      </div>
    </div>`).join("");
}

function skeletonRows(n = 5) {
  return `<div class="panel" aria-hidden="true">${Array.from({ length: n }, () => `
    <div class="sk-row">
      <div class="sk sk-thumb"></div>
      <div style="flex:1"><div class="sk sk-line w-50" style="margin-top:0"></div><div class="sk sk-line w-80"></div></div>
    </div>`).join("")}</div>`;
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
  renderDrawerUser();
  if (isAdmin) {
    const onAdmin = location.pathname.endsWith("admin.html");
    nav.insertAdjacentHTML("beforeend",
      `<a href="admin.html" title="หลังบ้าน" aria-label="หลังบ้าน" class="${onAdmin ? "active" : ""}">${icon("shield")}<span>หลังบ้าน</span></a>`);
    placeNavPill();
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
      ${CHAT_ENABLED ? `<a role="menuitem" href="messages.html">${icon("chat")}ข้อความ</a>` : ""}
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
  /* "ทั้งหมด" เป็นหมวดที่เลือกไว้ก่อน กดหมวดไหน หมวดนั้นได้ขอบม่วงระหว่างไปหน้าค้นหา */
  el.innerHTML = CATEGORIES.map(c => `
    <a class="cat cat-${c.id} ${c.id === "all" ? "selected" : ""}" href="search.html?cat=${c.id}"
      ${c.id === "all" ? 'aria-current="true"' : ""}>
      <span class="cat-icon">${icon(c.icon)}</span>
      <span class="cat-text">
        <span class="cat-name">${c.name}</span>
        <span class="cat-count" data-cat="${c.id}"><span class="sk" style="display:inline-block;width:32px;height:10px"></span></span>
      </span>
    </a>`).join("");
  el.addEventListener("click", e => {
    const card = e.target.closest(".cat");
    if (!card) return;
    el.querySelectorAll(".cat").forEach(c => c.classList.toggle("selected", c === card));
  });
}

/* จำนวนสินค้าที่ยังเปิดอยู่ในแต่ละหมวด */
function updateCategoryCounts(list) {
  document.querySelectorAll(".cat-count").forEach(el => {
    const cat = el.dataset.cat;
    const n = list.filter(p => !p.passed && (cat === "all" || p.category === cat)).length;
    el.textContent = n ? `${n.toLocaleString()} ชิ้น` : "ยังไม่มี";
  });
}

async function renderPopular() {
  const el = document.getElementById("popular");
  if (!el) return;
  el.innerHTML = skeletonCards(4);
  renderConveyorSkeleton();
  try {
    await userReady;
    const list = (await api("/products")).filter(p => !p.passed);
    el.innerHTML = list.length
      ? list.slice(0, 10).map(productCard).join("")
      : `<p class="empty">ยังไม่มีสินค้า มาเป็นคนแรกที่ <a href="post.html">ลงประกาศ</a></p>`;
    renderConveyor(list);
    updateCategoryCounts(list);
  } catch (e) {
    el.innerHTML = `<p class="empty">โหลดสินค้าไม่สำเร็จ: ${esc(e.message)}</p>`;
    renderConveyor([]);
    document.querySelectorAll(".cat-count").forEach(c => { c.textContent = ""; });
  }
}

/* ---------- สายพานส่งต่อ: การ์ดรูปจริงเลื่อนวนช้าๆ ชี้แล้วหยุด ---------- */
function renderConveyorSkeleton() {
  const track = document.getElementById("conveyor-track");
  if (track) track.innerHTML = Array.from({ length: 6 }, () =>
    `<div class="belt-card sk-card" aria-hidden="true"><div class="sk" style="height:140px;border-radius:0"></div>
     <div><div class="sk sk-line w-80" style="margin-top:0"></div><div class="sk sk-line w-30"></div></div></div>`).join("");
}

function renderConveyor(list) {
  const section = document.getElementById("conveyor-section");
  const track = document.getElementById("conveyor-track");
  if (!track) return;
  /* เฉพาะสินค้าที่มีรูปถ่าย (ไม่ใช่รูปแทนหมวดหมู่) */
  const items = list.filter(p => p.img && !/images\/cat-/.test(p.img));
  if (items.length < 3) { section.hidden = true; return; }
  const card = (p, hidden) => `
    <a class="belt-card" href="product.html?id=${p.id}" ${hidden ? 'aria-hidden="true" tabindex="-1"' : ""}>
      <img src="${esc(p.img)}" alt="${hidden ? "" : esc(p.title)}" loading="lazy">
      <div><strong>${esc(p.title)}</strong><span class="price">${formatPrice(p)}</span></div>
    </a>`;
  /* ต่อรายการให้ยาวพอเต็มจอ แล้วซ้ำอีกชุดเพื่อให้วนต่อเนื่องไม่สะดุด */
  let row = [...items];
  while (row.length < 10) row = row.concat(items);
  track.innerHTML = row.map(p => card(p, false)).join("") + row.map(p => card(p, true)).join("");
  track.style.setProperty("--dur", `${row.length * 5}s`);
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
      el.closest(".stat").hidden = !n;
      countUp(el, Number(n || 0));
      if (n) shown++;
    });
    document.getElementById("stats").hidden = !shown;
    document.getElementById("about").classList.toggle("no-stats", !shown);
  } catch (e) { /* ไม่แสดงตัวเลขถ้าโหลดไม่ได้ */ }
}

function setupHeroSearch() {
  const form = document.getElementById("hero-search");
  if (!form) return;
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
  toast(fav ? "เพิ่มในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว", fav ? "heart" : "");
  return fav;
}

/* หัวใจเด้ง (เล่นซ้ำได้ทุกครั้งที่กด) */
function popHeart(btn) {
  btn.classList.remove("pop");
  btn.getBoundingClientRect();
  btn.classList.add("pop");
}

function setupFavButtons() {
  document.addEventListener("click", async e => {
    const btn = e.target.closest(".fav-btn");
    if (!btn) return;
    e.preventDefault();
    btn.disabled = true;
    try {
      const on = await toggleFav(Number(btn.dataset.id));
      if (on !== null) {
        btn.classList.toggle("on", on);
        if (on) popHeart(btn);
      }
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

/* ---------- ตัวเลขข้อความที่ยังไม่อ่านบนเมนู "ข้อความ" ---------- */
let unreadTimer = null;
async function refreshUnread() {
  if (!currentUser || !CHAT_ENABLED) return;
  try {
    const { count } = await api("/chats/unread");
    document.querySelectorAll(".nav-badge, .drawer-badge").forEach(b => {
      b.textContent = count > 99 ? "99+" : count;
      b.hidden = !count;
    });
  } catch (e) { /* ไม่แสดงตัวเลขถ้าโหลดไม่ได้ */ }
}

function watchUnread() {
  if (!currentUser || !CHAT_ENABLED) return;
  refreshUnread();
  const bump = () => {
    clearTimeout(unreadTimer);
    unreadTimer = setTimeout(() => {
      refreshUnread();
      document.dispatchEvent(new CustomEvent("chat:activity"));
    }, 400);
  };
  /* Supabase: ข้อความใหม่ในห้องที่เราอยู่เด้งมาทันที (RLS กรองให้เห็นเฉพาะห้องของเรา) */
  if (SUPABASE_MODE) {
    sbClient().then(sb => sb.channel(`unread-${currentUser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, bump)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_rooms" }, bump)
      .subscribe()).catch(() => {});
  }
  setInterval(refreshUnread, SUPABASE_MODE ? 60000 : 15000);
}
userReady.then(watchUnread);

applySettings();
revealOnScroll();
/* ส่วนที่หน้าเว็บสร้างทีหลัง (รายละเอียดสินค้า หลังบ้าน ฯลฯ) ก็ค่อยๆ โผล่เช่นกัน */
if (revealObserver) {
  new MutationObserver(() => revealOnScroll())
    .observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
}
renderCategories();
renderPopular();
renderStats();
setupHeroSearch();
setupFavButtons();
setupDotGrid();
