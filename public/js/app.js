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
      <button class="fav-btn ${p.isFav ? "on" : ""}" data-id="${p.id}" aria-label="รายการโปรด">${p.isFav ? "❤️" : "🤍"}</button>
      <a class="card" href="product.html?id=${p.id}">
        <img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy">
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <div class="price">${formatPrice(p)}</div>
          <span class="badge badge-${p.type}">${TYPE_LABEL[p.type]}</span>
        </div>
      </a>
    </div>`;
}

/* ---------- ผู้ใช้ที่เข้าสู่ระบบ ---------- */
let currentUser = null;
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
    slot.innerHTML = `👤 ${esc(currentUser.name)} <button id="btn-logout" class="nav-btn">ออกจากระบบ</button>`;
    slot.querySelector("#btn-logout").addEventListener("click", async () => {
      await api("/logout", { method: "POST" }).catch(() => {});
      location.href = "index.html";
    });
  } else {
    slot.innerHTML = `<a href="login.html" class="nav-btn">เข้าสู่ระบบ</a>`;
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
      if (on !== null) {
        btn.classList.toggle("on", on);
        btn.textContent = on ? "❤️" : "🤍";
      }
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
