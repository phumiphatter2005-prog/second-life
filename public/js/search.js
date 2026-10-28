const filters = { q: "", type: "all", cat: "all", cond: "all" };
let PRODUCTS = [];

function readUrlParams() {
  const params = new URLSearchParams(location.search);
  filters.q = params.get("q") || "";
  filters.cat = params.get("cat") || "all";
}

function setupFilterControls() {
  const qInput = document.getElementById("f-q");
  const catSelect = document.getElementById("f-cat");
  const condSelect = document.getElementById("f-cond");

  catSelect.innerHTML = CATEGORIES.map(c =>
    `<option value="${c.id}">${c.name}</option>`).join("");

  qInput.value = filters.q;
  if (new URLSearchParams(location.search).has("focus")) qInput.focus();
  catSelect.value = filters.cat;

  qInput.addEventListener("input", () => { filters.q = qInput.value; renderResults(); });
  catSelect.addEventListener("change", () => setCategory(catSelect.value));
  condSelect.addEventListener("change", () => { filters.cond = condSelect.value; renderResults(); });

  document.querySelectorAll("#f-type .chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#f-type .chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filters.type = btn.dataset.value;
      renderResults();
    });
  });

  /* มือถือ: ซ่อนตัวกรองไว้ กดปุ่มเพื่อเปิด/ปิด */
  const toggle = document.getElementById("f-toggle");
  toggle.addEventListener("click", () => {
    const open = document.getElementById("filters").classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  document.getElementById("f-reset").addEventListener("click", () => {
    filters.q = ""; filters.type = "all"; filters.cat = "all"; filters.cond = "all";
    qInput.value = "";
    condSelect.value = "all";
    document.querySelectorAll("#f-type .chip").forEach(b =>
      b.classList.toggle("active", b.dataset.value === "all"));
    setCategory("all");
  });
}

/* ---------- แถบหมวดหมู่: แถบสีม่วงเลื่อนตามหมวดที่เลือก ---------- */
function setupCategoryTabs() {
  const bar = document.getElementById("cat-tabs");
  bar.innerHTML = CATEGORIES.map(c =>
    `<button type="button" role="tab" data-cat="${c.id}">${c.name}</button>`).join("") +
    `<span class="cat-ink" aria-hidden="true"></span>`;
  bar.addEventListener("click", e => {
    const btn = e.target.closest("[data-cat]");
    if (btn) setCategory(btn.dataset.cat);
  });
  addEventListener("resize", moveCatInk);
  if (document.fonts) document.fonts.ready.then(moveCatInk);
  syncCategoryTabs();
}

function moveCatInk() {
  const bar = document.getElementById("cat-tabs");
  const btn = bar.querySelector("button.active");
  const ink = bar.querySelector(".cat-ink");
  if (!btn) return;
  ink.style.setProperty("--x", btn.offsetLeft + "px");
  ink.style.setProperty("--w", btn.offsetWidth);
}

function syncCategoryTabs() {
  document.querySelectorAll("#cat-tabs [data-cat]").forEach(b => {
    const on = b.dataset.cat === filters.cat;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on);
  });
  /* เลื่อนเฉพาะแถบแนวนอนให้เห็นหมวดที่เลือก (ไม่เลื่อนทั้งหน้า) */
  const bar = document.getElementById("cat-tabs");
  const active = bar.querySelector("button.active");
  if (active) bar.scrollLeft = Math.max(0, active.offsetLeft - 16);
  moveCatInk();
}

function setCategory(cat) {
  filters.cat = cat;
  document.getElementById("f-cat").value = cat;
  syncCategoryTabs();
  renderResults();
}

function renderResults() {
  const q = filters.q.trim().toLowerCase();

  const list = PRODUCTS.filter(p =>
    (q === "" || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) &&
    (filters.type === "all" || p.type === filters.type) &&
    (filters.cat === "all" || p.category === filters.cat) &&
    (filters.cond === "all" || p.condition === filters.cond)
  );

  document.getElementById("result-count").textContent =
    `สินค้าที่พบ ${list.length} รายการ`;

  document.getElementById("results").innerHTML = list.length
    ? list.map(productCard).join("")
    : `<p class="empty">ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>`;
}

async function loadProducts() {
  document.getElementById("result-count").textContent = "กำลังโหลด...";
  document.getElementById("results").innerHTML = skeletonCards(6);
  try {
    await userReady;
    PRODUCTS = await api("/products");
    renderResults();
  } catch (e) {
    document.getElementById("result-count").textContent = "โหลดสินค้าไม่สำเร็จ: " + e.message;
  }
}

readUrlParams();
setupFilterControls();
setupCategoryTabs();
loadProducts();