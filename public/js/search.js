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
  catSelect.value = filters.cat;

  qInput.addEventListener("input", () => { filters.q = qInput.value; renderResults(); });
  catSelect.addEventListener("change", () => { filters.cat = catSelect.value; renderResults(); });
  condSelect.addEventListener("change", () => { filters.cond = condSelect.value; renderResults(); });

  document.querySelectorAll("#f-type .chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#f-type .chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filters.type = btn.dataset.value;
      renderResults();
    });
  });

  document.getElementById("f-reset").addEventListener("click", () => {
    filters.q = ""; filters.type = "all"; filters.cat = "all"; filters.cond = "all";
    qInput.value = "";
    catSelect.value = "all";
    condSelect.value = "all";
    document.querySelectorAll("#f-type .chip").forEach(b =>
      b.classList.toggle("active", b.dataset.value === "all"));
    renderResults();
  });
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
loadProducts();