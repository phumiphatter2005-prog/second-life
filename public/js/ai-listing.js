/* ---------- AI ช่วยวิเคราะห์ประกาศ (เรียก Edge Function analyze-listing ดู docs/AI.md) ----------
   AI แค่เติมฟอร์มให้ผู้ใช้ตรวจ ไม่ลงประกาศเอง · ราคาแนะนำคำนวณจากประกาศจริง ไม่ได้มาจาก AI */
const AI_MAX_PHOTOS = 3;
const AI_MAX_BYTES = 5 * 1024 * 1024;
const AI_TIMEOUT_MS = 10000;
const AI_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AI_MIN_PRICE_SAMPLES = 3;

let aiPhotos = [];                // data URL ที่ย่อแล้ว
let aiBusy = false;
let aiProducts = null;            // ประกาศทั้งหมด โหลดครั้งเดียวต่อการเปิดหน้า
let aiShowPrice = false;
const aiCache = new Map();        // รูปและคำอธิบายเดิม → ผลเดิม ไม่เรียก AI ซ้ำ

$("ai-panel").hidden = !SUPABASE_MODE;

function aiError(msg) {
  $("ai-error").textContent = msg;
  $("ai-error").hidden = !msg;
}

/* ---------- เลือกรูป: ตรวจก่อน ไฟล์ไม่ผ่านจะไม่ถูกส่งไป AI ---------- */
function aiCheckFile(file) {
  if (!AI_TYPES.includes(file.type)) return `"${file.name}" ไม่ใช่รูปภาพ รองรับเฉพาะ JPG PNG หรือ WebP`;
  if (file.size > AI_MAX_BYTES) return `"${file.name}" ใหญ่เกิน 5MB กรุณาใช้รูปที่เล็กลง`;
  return "";
}

/* ย่อเหลือด้านยาว 1024px และวาดใหม่บน canvas จึงตัดข้อมูลแฝงในไฟล์ เช่น พิกัด GPS ออกด้วย */
function aiShrink(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`เปิด "${file.name}" เป็นรูปไม่ได้ ไฟล์อาจเสียหรือไม่ใช่รูปภาพ`));
    };
    img.src = url;
  });
}

function aiRenderPhotos() {
  $("ai-thumbs").innerHTML = aiPhotos.map((src, i) => `
    <div class="ai-thumb">
      <img src="${src}" alt="รูปที่ ${i + 1}">
      <button type="button" data-remove="${i}" aria-label="ลบรูปที่ ${i + 1}">${icon("close")}</button>
    </div>`).join("");
  $("ai-add").hidden = aiPhotos.length >= AI_MAX_PHOTOS;
  $("ai-count").textContent = `${aiPhotos.length}/${AI_MAX_PHOTOS} รูป`;
}

$("ai-photos").addEventListener("change", async e => {
  const files = [...e.target.files];
  e.target.value = "";              // เลือกไฟล์เดิมซ้ำได้
  aiError("");
  for (const file of files) {
    if (aiPhotos.length >= AI_MAX_PHOTOS) return aiError(`เลือกรูปได้ไม่เกิน ${AI_MAX_PHOTOS} รูป`);
    const problem = aiCheckFile(file);
    if (problem) return aiError(problem);
    try {
      aiPhotos.push(await aiShrink(file));
      aiRenderPhotos();
    } catch (err) {
      return aiError(err.message);
    }
  }
});

$("ai-thumbs").addEventListener("click", e => {
  const btn = e.target.closest("[data-remove]");
  if (!btn || aiBusy) return;
  aiPhotos.splice(Number(btn.dataset.remove), 1);
  aiError("");
  aiRenderPhotos();
});

/* ---------- ราคาแนะนำ: คำนวณจากประกาศขายจริงในหมวดเดียวกัน ---------- */
function priceSuggestion(products, category) {
  const prices = products
    .filter(p => p.category === category && p.type === "sell" && p.price > 0)
    .map(p => p.price)
    .sort((a, b) => a - b);
  if (prices.length < AI_MIN_PRICE_SAMPLES) return null;
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  return { median, min: prices[0], max: prices[prices.length - 1], count: prices.length };
}

async function aiRenderPrice() {
  const box = $("ai-price");
  box.hidden = !aiShowPrice || type === "free";
  if (box.hidden) return;
  const category = $("p-cat").value;
  try {
    aiProducts = aiProducts || await api("/products");
  } catch (e) {
    box.textContent = "โหลดข้อมูลราคาไม่สำเร็จ กรอกราคาเองได้เลย";
    return;
  }
  if (category !== $("p-cat").value) return;     // เปลี่ยนหมวดระหว่างรอโหลด
  const s = priceSuggestion(aiProducts, category);
  if (!s) {
    box.textContent = "ข้อมูลราคายังไม่พอ";
    return;
  }
  box.innerHTML = `
    <span>ราคาแนะนำ <b>฿${s.median.toLocaleString()}</b>
      <small>ค่ากลางจาก ${s.count} ประกาศในหมวด${esc(categoryName(category))} · ช่วง ฿${s.min.toLocaleString()}–฿${s.max.toLocaleString()}</small></span>
    <button type="button" class="btn-outline inline" id="ai-use-price">ใช้ราคานี้</button>`;
  $("ai-use-price").addEventListener("click", () => { $("p-price").value = s.median; });
}
$("p-cat").addEventListener("change", aiRenderPrice);
document.querySelectorAll("#p-type .chip").forEach(b => b.addEventListener("click", aiRenderPrice));

/* ---------- แสดงผล ---------- */
const aiLevel = c => c >= 0.8 ? "สูง" : c >= 0.6 ? "ปานกลาง" : "ต่ำ";

function aiConfidence(c) {
  const percent = Math.round(c * 100);
  const level = aiLevel(c);
  return `<p class="ai-confidence" data-level="${level}">ความมั่นใจของ AI ${percent}% (${level})
    <span class="ai-meter"><i style="width:${percent}%"></i></span></p>`;
}

/* ตรวจซ้ำก่อนใช้ แม้ Edge Function ตรวจแล้ว เพราะค่าเหล่านี้จะถูกเติมลงฟอร์ม */
function aiValid(r) {
  if (!r || typeof r.is_product !== "boolean" || typeof r.need_more_info !== "boolean") return false;
  if (typeof r.confidence !== "number" || r.confidence < 0 || r.confidence > 1) return false;
  if (typeof r.message !== "string") return false;
  if (!r.is_product || r.need_more_info) return true;
  return typeof r.title === "string" && r.title.trim() !== "" && typeof r.condition_reason === "string"
    && CATEGORIES.some(c => c.id === r.category && c.id !== "all") && !!CONDITION_INFO[r.condition];
}

function aiFillForm(r) {
  $("p-title").value = r.title;
  $("p-cat").value = r.category;
  $("p-cond").value = r.condition;
  $("p-cond").dispatchEvent(new Event("change"));
  $("ai-cond-note").textContent = `ผลจาก AI โปรดตรวจสอบ: ประเมินว่า "${r.condition}" เพราะ ${r.condition_reason}`;
  $("ai-cond-note").hidden = false;
  if (!imgData) setPhoto(aiPhotos[0]);
}

function aiShowResult(r) {
  const box = $("ai-result");
  box.hidden = false;
  if (!r.is_product) {
    box.className = "ai-result warn";
    box.innerHTML = `<b>วิเคราะห์ไม่ได้</b><p>${esc(r.message)}</p>`;
    return;
  }
  if (r.need_more_info) {
    box.className = "ai-result warn";
    box.innerHTML = `<b>ขอรูปเพิ่มอีกนิด</b><p>${esc(r.message)}</p>${aiConfidence(r.confidence)}`;
    return;
  }
  aiFillForm(r);
  box.className = "ai-result";
  box.innerHTML = `
    <span class="ai-badge">ผลจาก AI โปรดตรวจสอบ</span>
    <p>เติมชื่อสินค้า หมวดหมู่ และสภาพสินค้าให้แล้ว แก้ไขได้ทุกช่องก่อนลงประกาศ</p>
    <ul class="detail-list">
      <li><span>ชื่อสินค้า</span>${esc(r.title)}</li>
      <li><span>หมวดหมู่</span>${esc(categoryName(r.category))}</li>
      <li><span>สภาพสินค้า</span>${esc(r.condition)}</li>
      <li><span>เหตุผล</span>${esc(r.condition_reason)}</li>
    </ul>
    ${aiConfidence(r.confidence)}`;
  aiShowPrice = true;
  aiRenderPrice();
}

/* ---------- ปุ่มให้ AI ช่วยกรอก ---------- */
function aiSetBusy(on) {
  aiBusy = on;
  $("ai-run").disabled = on;
  $("ai-photos").disabled = on;
  $("ai-note").disabled = on;
  $("ai-status").hidden = !on;
}

function aiMessage(e) {
  if (e.name === "AbortError") return "AI ใช้เวลานานเกิน 10 วินาที ลองใหม่อีกครั้งหรือกรอกข้อมูลเองได้เลย";
  if (e instanceof TypeError) return "เชื่อมต่อ AI ไม่สำเร็จ กรอกข้อมูลเองได้เลย";
  return e.message || "ใช้ AI ไม่ได้ในขณะนี้ กรอกข้อมูลเองได้เลย";
}

$("ai-run").addEventListener("click", async () => {
  aiError("");
  $("ai-result").hidden = true;
  if (!aiPhotos.length) return aiError("กรุณาเลือกรูปสินค้าอย่างน้อย 1 รูปก่อนให้ AI ช่วยกรอก");

  const description = $("ai-note").value.trim();
  const key = JSON.stringify([aiPhotos, description]);
  if (aiCache.has(key)) return aiShowResult(aiCache.get(key));

  const timer = new AbortController();
  const timeout = setTimeout(() => timer.abort(), AI_TIMEOUT_MS);
  aiSetBusy(true);
  try {
    const result = await api("/ai/analyze", {
      method: "POST", body: { images: aiPhotos, description }, signal: timer.signal
    });
    if (!aiValid(result)) return aiError("AI ตอบกลับในรูปแบบที่ใช้ไม่ได้ ลองใหม่อีกครั้งหรือกรอกข้อมูลเองได้เลย");
    aiCache.set(key, result);
    aiShowResult(result);
  } catch (e) {
    if (e.status === 401) return goLogin();
    aiError(aiMessage(e));
  } finally {
    clearTimeout(timeout);
    aiSetBusy(false);
  }
});
