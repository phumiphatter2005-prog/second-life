/* conds = สภาพที่ติ๊กไว้ (ว่าง = ทุกสภาพ) · min/max = ช่วงราคา ("" = ไม่จำกัด) */
const filters = { q: "", type: "all", cat: "all", conds: new Set(), min: "", max: "", sort: "latest" };
let PRODUCTS = [];

/* คำอธิบายสั้นใต้แต่ละระดับสภาพในแผงตัวกรอง */
const CONDITION_SHORT = { "ดีมาก": "แทบไม่มีร่องรอยการใช้งาน", "ดี": "มีรอยใช้งานเล็กน้อย", "พอใช้": "มีรอยชัดเจน แต่ยังใช้งานได้" };

const $ = id => document.getElementById(id);

function readUrlParams() {
  const params = new URLSearchParams(location.search);
  filters.q = params.get("q") || "";
  filters.cat = CATEGORIES.some(c => c.id === params.get("cat")) ? params.get("cat") : "all";
  if (TYPE_LABEL[params.get("type")]) filters.type = params.get("type");
}

function setupFilterControls() {
  const qInput = $("f-q");
  qInput.value = filters.q;
  if (new URLSearchParams(location.search).has("focus")) qInput.focus();
  qInput.addEventListener("input", () => { filters.q = qInput.value; renderResults(); });

  $("f-type").addEventListener("click", e => {
    const btn = e.target.closest("[data-value]");
    if (btn) { filters.type = btn.dataset.value; renderResults(); }
  });

  $("f-cond").innerHTML = Object.keys(CONDITION_INFO).map(c => `
    <label class="f-check">
      <input type="checkbox" value="${c}">
      <span><b>${c}</b><small>${CONDITION_SHORT[c] || ""}</small></span>
    </label>`).join("");
  $("f-cond").addEventListener("change", e => {
    e.target.checked ? filters.conds.add(e.target.value) : filters.conds.delete(e.target.value);
    renderResults();
  });

  ["min", "max"].forEach(k => $("f-" + k).addEventListener("input", e => {
    const v = e.target.value;
    filters[k] = v === "" || Number(v) < 0 ? "" : String(Math.floor(Number(v)));
    renderResults();
  }));

  $("f-sort").addEventListener("change", e => { filters.sort = e.target.value; renderResults(); });

  $("f-reset").addEventListener("click", () => { clearPanelFilters(); renderResults(); });

  /* ชิปตัวกรองที่เลือกอยู่ และปุ่มล้างในข้อความ "ไม่พบสินค้า" */
  document.querySelector(".results").addEventListener("click", e => {
    const chip = e.target.closest("[data-remove]");
    if (chip) { removeFilter(chip.dataset.remove); return; }
    if (e.target.closest("#empty-reset")) clearAllFilters();
  });

  setupSheet();
}

/* ---------- มือถือ: แผ่นตัวกรองเลื่อนขึ้นจากล่าง ---------- */
function setupSheet() {
  const sheet = $("filters"), backdrop = $("filters-backdrop"), openBtn = $("f-open");
  $("f-close").innerHTML = icon("close");

  const open = () => {
    backdrop.hidden = false;
    document.documentElement.classList.add("drawer-lock");
    openBtn.setAttribute("aria-expanded", "true");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    /* โฟกัสได้หลังแผ่นไม่ถูกซ่อน (visibility) แล้วเท่านั้น */
    requestAnimationFrame(() => {
      sheet.classList.add("open");
      backdrop.classList.add("open");
      sheet.focus({ preventScroll: true });
    });
  };
  const close = () => {
    if (!sheet.classList.contains("open")) return;
    sheet.classList.remove("open");
    backdrop.classList.remove("open");
    document.documentElement.classList.remove("drawer-lock");
    openBtn.setAttribute("aria-expanded", "false");
    sheet.removeAttribute("role");
    sheet.removeAttribute("aria-modal");
    setTimeout(() => { backdrop.hidden = true; }, 300);
    openBtn.focus({ preventScroll: true });
  };

  openBtn.addEventListener("click", open);
  $("f-close").addEventListener("click", close);
  $("f-apply").addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  /* ขยายจอจนกลายเป็นแผงซ้าย ให้ปิดแผ่นทิ้ง */
  matchMedia("(max-width: 860px)").addEventListener("change", e => { if (!e.matches) close(); });
}

/* ---------- แถวแคปซูลหมวดหมู่ (สร้างด้วย renderCatPills ใน app.js) ---------- */
function setupCategoryTabs() {
  const wrap = $("cat-pills");
  renderCatPills(wrap, filters.cat, false);
  wrap.addEventListener("click", e => {
    const pill = e.target.closest("[data-cat]");
    if (pill) setCategory(pill.dataset.cat);
  });
  syncCategoryTabs();
}

function syncCategoryTabs() {
  const wrap = $("cat-pills");
  selectCatPill(wrap, filters.cat);
  /* เลื่อนเฉพาะแถวแนวนอนให้เห็นหมวดที่เลือก (ไม่เลื่อนทั้งหน้า) */
  const row = wrap.querySelector(".cat-pills");
  const active = row.querySelector('[aria-pressed="true"]');
  if (active) row.scrollLeft = Math.max(0, active.offsetLeft - row.offsetLeft - 16);
  updateCatFade(wrap);
}

function setCategory(cat) {
  filters.cat = cat;
  syncCategoryTabs();
  renderResults();
}

/* ---------- ล้าง / เอาตัวกรองออกทีละอัน ---------- */
function clearPanelFilters() {
  filters.type = "all";
  filters.conds.clear();
  filters.min = filters.max = "";
}

function clearAllFilters() {
  clearPanelFilters();
  filters.q = "";
  filters.cat = "all";
  syncCategoryTabs();
  renderResults();
}

function removeFilter(key) {
  if (key === "q") filters.q = "";
  else if (key === "cat") { filters.cat = "all"; syncCategoryTabs(); }
  else if (key === "type") filters.type = "all";
  else if (key === "price") filters.min = filters.max = "";
  else if (key.startsWith("cond:")) filters.conds.delete(key.slice(5));
  renderResults();
}

/* จำนวนตัวกรองในแผง (ประเภท + สภาพแต่ละอัน + ช่วงราคา) สำหรับ "ล้าง (n)" และปุ่มตัวกรองบนมือถือ */
function panelFilterCount() {
  return (filters.type !== "all") + filters.conds.size + (filters.min !== "" || filters.max !== "");
}

function priceLabel() {
  const fmt = v => "฿" + Number(v).toLocaleString();
  if (filters.min !== "" && filters.max !== "") return `${fmt(filters.min)} – ${fmt(filters.max)}`;
  return filters.min !== "" ? `ตั้งแต่ ${fmt(filters.min)}` : `ไม่เกิน ${fmt(filters.max)}`;
}

function activeChips() {
  const chips = [];
  if (filters.q.trim()) chips.push(["q", `“${filters.q.trim()}”`]);
  if (filters.cat !== "all") chips.push(["cat", categoryName(filters.cat)]);
  if (filters.type !== "all") chips.push(["type", TYPE_LABEL[filters.type]]);
  filters.conds.forEach(c => chips.push(["cond:" + c, `สภาพ${c}`]));
  if (filters.min !== "" || filters.max !== "") chips.push(["price", priceLabel()]);
  return chips;
}

/* ทำให้ปุ่ม/ช่องในแผงตรงกับค่าใน filters (หลังล้างหรือกด × บนชิป) */
function syncPanel() {
  $("f-q").value = filters.q;
  document.querySelectorAll("#f-type [data-value]").forEach(b =>
    b.setAttribute("aria-pressed", b.dataset.value === filters.type));
  document.querySelectorAll("#f-cond input").forEach(cb => { cb.checked = filters.conds.has(cb.value); });
  if ($("f-min").value !== filters.min && document.activeElement !== $("f-min")) $("f-min").value = filters.min;
  if ($("f-max").value !== filters.max && document.activeElement !== $("f-max")) $("f-max").value = filters.max;

  const n = panelFilterCount();
  $("f-reset").hidden = !n;
  $("f-reset-n").textContent = n;
  $("f-open-n").hidden = !n;
  $("f-open-n").textContent = n;

  const chips = activeChips();
  const box = $("active-filters");
  box.hidden = !chips.length;
  box.innerHTML = chips.map(([key, label]) => `
    <button type="button" class="filter-chip" data-remove="${esc(key)}" aria-label="เอาตัวกรอง ${esc(label)} ออก">
      ${esc(label)}${icon("close")}
    </button>`).join("");
}

const priceOf = p => (p.type === "free" ? 0 : Number(p.price) || 0);

function renderResults() {
  syncPanel();
  const q = filters.q.trim().toLowerCase();
  let lo = filters.min === "" ? -Infinity : Number(filters.min);
  let hi = filters.max === "" ? Infinity : Number(filters.max);
  if (lo > hi) [lo, hi] = [hi, lo];

  const list = PRODUCTS.filter(p =>
    (q === "" || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) &&
    (filters.type === "all" || p.type === filters.type) &&
    (filters.cat === "all" || p.category === filters.cat) &&
    (!filters.conds.size || filters.conds.has(p.condition)) &&
    priceOf(p) >= lo && priceOf(p) <= hi
  );
  /* "ล่าสุด" = ลำดับที่ได้จากเซิร์ฟเวอร์ (ใหม่ก่อน) */
  if (filters.sort === "price-asc") list.sort((a, b) => priceOf(a) - priceOf(b));
  if (filters.sort === "price-desc") list.sort((a, b) => priceOf(b) - priceOf(a));

  $("result-count").innerHTML = `สินค้าที่พบ <b>${list.length.toLocaleString()}</b> รายการ`;
  $("f-apply-n").textContent = list.length.toLocaleString();

  const hasFilters = activeChips().length > 0;
  $("results").innerHTML = list.length
    ? list.map(productCard).join("")
    : `<div class="empty empty-filter">
        <p>${hasFilters ? "ไม่พบสินค้าที่ตรงกับตัวกรอง ลองเอาบางเงื่อนไขออกดู" : "ยังไม่มีสินค้า"}</p>
        ${hasFilters ? `<button id="empty-reset" type="button" class="btn btn-secondary btn-md">ล้างตัวกรองทั้งหมด</button>` : ""}
      </div>`;
}

async function loadProducts() {
  $("result-count").textContent = "กำลังโหลด...";
  $("results").innerHTML = skeletonCards(6);
  try {
    await userReady;
    PRODUCTS = await api("/products");
    hideEmptyCatPills($("cat-pills"), PRODUCTS);
    renderResults();
  } catch (e) {
    $("result-count").textContent = "โหลดสินค้าไม่สำเร็จ: " + e.message;
    $("results").innerHTML = "";
  }
}

readUrlParams();
setupFilterControls();
setupCategoryTabs();
syncPanel();
loadProducts();
