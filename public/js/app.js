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
          ${p.ratingCount ? ratingLine(p.rating, p.ratingCount) : ""}
          <div class="card-pickup">${icon("pin")}${esc(p.pickup)}</div>
        </div>
      </a>
    </div>`;
}

/* ---------- แถบเมนู + ส่วนท้าย (เหมือนกันทุกหน้า) ---------- */
const NAV_ICONS = { "index.html": "home", "search.html": "grid", "post.html": "plus", "favorites.html": "heart" };

function decorateNav() {
  const logo = document.querySelector(".logo");
  if (logo) logo.innerHTML = `<span class="logo-mark">${icon("leaf")}</span><span>Second <em>Life</em></span>`;

  document.querySelectorAll(".nav-links a").forEach(a => {
    const name = NAV_ICONS[a.getAttribute("href")];
    if (name) a.innerHTML = icon(name) + `<span>${a.textContent}</span>`;
  });

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
          <p>คณะเทคโนโลยีสารสนเทศ<br>มหาวิทยาลัยศรีปทุม วิทยาเขตขอนแก่น</p>
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

function renderNavUser() {
  const nav = document.querySelector(".nav-links");
  if (!nav) return;
  if (currentUser && currentUser.role === "admin") {
    const onAdmin = location.pathname.endsWith("admin.html");
    nav.insertAdjacentHTML("beforeend",
      `<a href="admin.html" class="${onAdmin ? "active" : ""}">${icon("shield")}<span>หลังบ้าน</span></a>`);
  }

  const slot = document.createElement("span");
  slot.className = "nav-user";
  if (currentUser) {
    slot.innerHTML = `
      <span class="avatar" title="${esc(currentUser.name)}">${esc(currentUser.name.slice(0, 1))}</span>
      <span class="nav-name">${esc(currentUser.name)}</span>
      <button id="btn-logout" class="nav-btn" aria-label="ออกจากระบบ">${icon("logout")}<span>ออก</span></button>`;
    slot.querySelector("#btn-logout").addEventListener("click", async () => {
      await api("/logout", { method: "POST" }).catch(() => {});
      location.href = "index.html";
    });
  } else {
    slot.innerHTML = `<a href="login.html" class="nav-btn nav-login">${icon("user")}<span>เข้าสู่ระบบ</span></a>`;
  }
  nav.appendChild(slot);
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
    passed.textContent = s.passed.toLocaleString();
    document.getElementById("stat-items").textContent = s.items.toLocaleString();
    document.getElementById("stat-users").textContent = s.users.toLocaleString();
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

renderCategories();
renderPopular();
renderStats();
setupHeroSearch();
setupFavButtons();
