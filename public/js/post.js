const $ = id => document.getElementById(id);
let step = 1;
let imgData = "";
let type = "sell";

/* ---------- ต้องเข้าสู่ระบบก่อนลงประกาศ ---------- */
userReady.then(() => { if (!currentUser) goLogin(); });

/* ---------- ตั้งค่าเริ่มต้น ---------- */
$("p-cat").innerHTML = CATEGORIES
  .filter(c => c.id !== "all")
  .map(c => `<option value="${c.id}">${c.name}</option>`)
  .join("");

/* ---------- คำอธิบายสภาพสินค้า (ไฮไลต์ระดับที่เลือก) ---------- */
function renderCondGuide() {
  $("cond-guide").innerHTML = Object.entries(CONDITION_INFO).map(([name, info]) =>
    `<li class="${name === $("p-cond").value ? "current" : ""}"><b>${name}</b>${info}</li>`).join("");
}
$("p-cond").addEventListener("change", renderCondGuide);
renderCondGuide();

/* ---------- จุดนัดรับ: เลือกจากรายการ หรือระบุเอง ---------- */
function renderPickupOptions(points) {
  $("p-pickup-select").innerHTML =
    `<option value="" disabled selected>เลือกจุดนัดรับ</option>` +
    points.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join("") +
    `<option value="${PICKUP_OTHER}">อื่นๆ (ระบุเอง)</option>`;
}
renderPickupOptions(DEFAULT_PICKUP_POINTS);
settingsReady.then(s => {
  if (Array.isArray(s.pickupPoints) && s.pickupPoints.length) renderPickupOptions(s.pickupPoints);
});
$("p-pickup-select").addEventListener("change", () => {
  const other = $("p-pickup-select").value === PICKUP_OTHER;
  $("p-pickup").hidden = !other;
  if (other) $("p-pickup").focus();
});

function pickupValue() {
  const sel = $("p-pickup-select").value;
  return sel === PICKUP_OTHER ? $("p-pickup").value.trim() : sel;
}

/* ---------- แสดงขั้นตอน ---------- */
function showStep(n) {
  step = n;
  document.querySelectorAll(".step-panel").forEach(p => {
    p.hidden = Number(p.dataset.panel) !== n;
  });
  document.querySelectorAll(".step").forEach(s => {
    const k = Number(s.dataset.step);
    s.classList.toggle("active", k === n);
    s.classList.toggle("done", k < n);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setError(msg) {
  const el = document.querySelector(`[data-panel="${step}"] .form-error`);
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

/* ---------- เลือกประเภทประกาศ ---------- */
document.querySelectorAll("#p-type .chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#p-type .chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    type = btn.dataset.value;

    const price = $("p-price");
    const isFree = type === "free";
    price.disabled = isFree;
    if (isFree) price.value = "";
    $("price-label").textContent =
      type === "swap" ? "มูลค่าโดยประมาณ (บาท)" : "ราคา (บาท)";
  });
});

/* ---------- อัปโหลดรูป (ย่อขนาดก่อนเก็บ) ---------- */
$("p-photo").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxW = 600;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      imgData = canvas.toDataURL("image/jpeg", 0.7);
      $("photo-preview").src = imgData;
      $("photo-preview").hidden = false;
      $("photo-hint").hidden = true;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- ตรวจข้อมูลแต่ละขั้น ---------- */
function validate() {
  if (step === 1) {
    if ($("p-title").value.trim() === "") return "กรุณากรอกชื่อสินค้า";
    if (type !== "free") {
      const v = $("p-price").value;
      if (v === "" || Number(v) < 0) return "กรุณากรอกราคาให้ถูกต้อง";
    }
  }
  if (step === 2) {
    if (!pickupValue()) return "กรุณาระบุจุดนัดรับ";
    if ($("p-contact").value.trim() === "") return "กรุณาระบุช่องทางติดต่อ";
  }
  return "";
}

function buildItem() {
  return {
    title: $("p-title").value.trim(),
    price: type === "free" ? 0 : Number($("p-price").value),
    type: type,
    category: $("p-cat").value,
    condition: $("p-cond").value,
    pickup: pickupValue(),
    contact: $("p-contact").value.trim(),
    desc: $("p-desc").value.trim(),
    img: imgData
  };
}

function renderSummary() {
  const item = buildItem();
  $("summary").innerHTML = `
    <div class="summary">
      ${item.img ? `<img src="${item.img}" alt="">` : ""}
      <ul class="detail-list">
        <li><span>ชื่อสินค้า</span>${esc(item.title)}</li>
        <li><span>ประเภท</span>${TYPE_LABEL[item.type]}</li>
        <li><span>ราคา</span>${formatPrice(item)}</li>
        <li><span>หมวดหมู่</span>${categoryName(item.category)}</li>
        <li><span>สภาพสินค้า</span>${esc(item.condition)}</li>
        <li><span>จุดนัดรับ</span>${esc(item.pickup)}</li>
        <li><span>ติดต่อ</span>${esc(item.contact)}</li>
      </ul>
    </div>`;
}

/* ---------- ปุ่มถัดไป / ย้อนกลับ ---------- */
document.querySelectorAll("[data-next]").forEach(btn => {
  btn.addEventListener("click", () => {
    const err = validate();
    if (err) return setError(err);
    setError("");
    if (step === 2) renderSummary();
    showStep(step + 1);
  });
});

document.querySelectorAll("[data-prev]").forEach(btn => {
  btn.addEventListener("click", () => {
    setError("");
    showStep(step - 1);
  });
});

/* ---------- ลงประกาศ ---------- */
$("btn-publish").addEventListener("click", async () => {
  const btn = $("btn-publish");
  btn.disabled = true;
  btn.textContent = "กำลังลงประกาศ...";
  try {
    const { id } = await api("/products", { method: "POST", body: buildItem() });
    $("link-product").href = "product.html?id=" + id;
    showStep(4);
  } catch (e) {
    if (e.status === 401) return goLogin();
    setError(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "ลงประกาศ";
  }
});