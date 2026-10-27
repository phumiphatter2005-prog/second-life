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
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
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
      ${p.passed ? `<span class="passed-tag">♻️ ส่งต่อแล้ว</span>` : ""}
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
      <p class="footer-tag">Second Life for a Better Tomorrow 💜</p>
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
      <span class="cat-icon">${c.icon}</span>
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
