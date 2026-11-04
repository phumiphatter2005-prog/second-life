const $ = id => document.getElementById(id);
let step = 1;
let imgData = "";
let type = "sell";

/* ---------- ต้องเข้าสู่ระบบก่อนลงประกาศ ---------- */
userReady.then(() => { if (!currentUser) goLogin(); });

/* ---------- ตั้งค่าเริ่มต้น ---------- */
$("p-cat").innerHTML = `<option value="" disabled selected>เลือกหมวดหมู่</option>` + CATEGORIES
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
      type === "swap" ? "มูลค่าโดยประมาณ (ไม่บังคับ)" : "ราคา (บาท)";
    price.placeholder = type === "swap" ? "เช่น 300 (บาท)" : "เช่น 150";
    $("swap-wish-field").hidden = type !== "swap";
  });
});

/* ---------- อัปโหลดรูป (ย่อขนาดก่อนเก็บ) ---------- */
function setPhoto(data) {
  imgData = data;
  $("photo-preview").src = imgData;
  $("photo-preview").hidden = false;
  $("photo-hint").hidden = true;
}

function clearPhoto() {
  imgData = "";
  $("p-photo").value = "";
  $("photo-preview").removeAttribute("src");
  $("photo-preview").hidden = true;
  $("photo-hint").hidden = false;
}

$("p-photo").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  /* resizeImage (app.js) แจ้ง error เมื่อเปิดไฟล์ไม่ได้ เช่น HEIC จาก iPhone ที่เบราว์เซอร์อ่านไม่ออก */
  resizeImage(file, 600)
    .then(data => { setError(""); setPhoto(data); })
    .catch(err => {
      clearPhoto();
      setError(err.message === "เปิดไฟล์รูปไม่สำเร็จ"
        ? "เปิดไฟล์รูปนี้ไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG"
        : err.message);
    });
});

/* ---------- ตรวจข้อมูลแต่ละขั้น ---------- */
function validate() {
  if (step === 1) {
    /* เพดานความยาวตรงกับ check ใน supabase/schema.sql (AI อาจกรอกเกิน maxlength ได้) */
    const title = $("p-title").value.trim();
    if (title === "") return "กรุณากรอกชื่อสินค้า";
    if (title.length > 100) return "ชื่อสินค้ายาวได้ไม่เกิน 100 ตัวอักษร";
    if (!$("p-cat").value) return "กรุณาเลือกหมวดหมู่";
    if (type !== "free") {
      const v = $("p-price").value;
      const n = Number(v);
      const what = type === "swap" ? "มูลค่าโดยประมาณ" : "ราคา";
      /* แลกเปลี่ยนเว้นว่างได้ · input type=number ที่พิมพ์ไม่ใช่ตัวเลขให้ค่า "" แต่ validity.badInput = true */
      const blankSwap = type === "swap" && v === "" && !$("p-price").validity.badInput;
      if (!blankSwap && (v === "" || !Number.isInteger(n) || n < 0)) return `กรุณากรอก${what}เป็นจำนวนเต็มบาท`;
      if (n > 1000000) return `${what}ต้องไม่เกิน 1,000,000 บาท`;
      if (type === "sell" && n === 0) return "ราคาขายต้องมากกว่า 0 ถ้าต้องการให้ฟรี เลือก \"แจกฟรี\"";
    }
    if (type === "swap" && $("p-want-swap").value.trim().length > 60) return "\"อยากแลกกับอะไร\" ยาวได้ไม่เกิน 60 ตัวอักษร";
  }
  if (step === 2) {
    if (!$("p-cond").value) return "กรุณาเลือกสภาพสินค้า";
    if ($("p-desc").value.trim().length > 1000) return "รายละเอียดยาวได้ไม่เกิน 1,000 ตัวอักษร";
    if (!pickupValue()) return "กรุณาระบุจุดนัดรับ";
    if (pickupValue().length > 100) return "จุดนัดรับยาวได้ไม่เกิน 100 ตัวอักษร";
    if ($("p-contact").value.trim() === "") return "กรุณาระบุช่องทางติดต่อ";
    if ($("p-contact").value.trim().length > 100) return "ช่องทางติดต่อยาวได้ไม่เกิน 100 ตัวอักษร";
  }
  return "";
}

function buildItem() {
  return {
    title: $("p-title").value.trim(),
    price: type === "free" ? 0 : Number($("p-price").value) || 0,
    type: type,
    wantSwap: type === "swap" ? $("p-want-swap").value.trim() : "",
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
        ${item.type === "swap"
          ? `<li><span>มูลค่าโดยประมาณ</span>${swapValue(item) || "ไม่ระบุ"}</li>
             <li><span>อยากแลกกับ</span>${esc(swapWish(item)) || "ไม่ระบุ"}</li>`
          : `<li><span>ราคา</span>${formatPrice(item)}</li>`}
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