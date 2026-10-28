/* ---------- หน้าโปรไฟล์ของฉัน: รูปโปรไฟล์ (ครอป + ย่อ 256×256) และชื่อที่แสดง ---------- */
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_SIZE = 256;

const $p = id => document.getElementById(id);

function showErr(id, msg) {
  const el = $p(id);
  el.textContent = msg || "";
  el.hidden = !msg;
}

function renderProfile() {
  $p("pf-avatar").innerHTML = avatarHtml(currentUser.name, currentUser.avatarUrl, "avatar-xl me-avatar");
  $p("pf-name").textContent = currentUser.name;
  $p("pf-sid").textContent = currentUser.studentId;
  $p("pf-remove").hidden = !currentUser.avatarUrl;
  $p("pf-name-input").value = currentUser.name;
}

/* ---------- เลือกไฟล์ → ตรวจชนิด/ขนาด → เปิดหน้าต่างครอป ---------- */
$p("pf-file").addEventListener("change", e => {
  const file = e.target.files[0];
  e.target.value = "";
  showErr("pf-photo-error", "");
  if (!file) return;
  if (!AVATAR_TYPES.includes(file.type)) return showErr("pf-photo-error", "รองรับเฉพาะไฟล์ JPG PNG หรือ WebP");
  if (file.size > AVATAR_MAX_BYTES) return showErr("pf-photo-error", "ไฟล์ใหญ่เกิน 5MB กรุณาเลือกรูปที่เล็กลง");
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => openCrop(img, url);
  img.onerror = () => { URL.revokeObjectURL(url); showErr("pf-photo-error", "เปิดไฟล์รูปไม่สำเร็จ ไฟล์อาจเสีย"); };
  img.src = url;
});

/* ---------- หน้าต่างครอปสี่เหลี่ยมจัตุรัส ---------- */
const crop = { img: null, url: "", V: 0, base: 1, zoom: 1, x: 0, y: 0, pointers: new Map(), pinch: null, returnFocus: null };
const stage = $p("crop-stage");
const cropImg = $p("crop-img");
const zoomInput = $p("crop-zoom");

const scale = () => crop.base * crop.zoom;

function clampCrop() {
  const s = scale();
  crop.x = Math.min(0, Math.max(crop.V - crop.img.naturalWidth * s, crop.x));
  crop.y = Math.min(0, Math.max(crop.V - crop.img.naturalHeight * s, crop.y));
}

function drawCrop() {
  clampCrop();
  cropImg.style.transform = `translate(${crop.x}px, ${crop.y}px) scale(${scale()})`;
}

/* ซูมโดยให้จุด (cx, cy) ในกรอบอยู่ที่เดิม */
function setZoom(z, cx = crop.V / 2, cy = crop.V / 2) {
  const s0 = scale();
  crop.zoom = Math.min(4, Math.max(1, z));
  const s1 = scale();
  crop.x = cx - (cx - crop.x) * (s1 / s0);
  crop.y = cy - (cy - crop.y) * (s1 / s0);
  zoomInput.value = crop.zoom;
  drawCrop();
}

function openCrop(img, url) {
  crop.img = img;
  crop.url = url;
  crop.returnFocus = document.activeElement;
  cropImg.src = url;
  showErr("crop-error", "");
  $p("crop").hidden = false;
  document.documentElement.classList.add("drawer-lock");
  document.querySelectorAll("body > header, body > main, body > footer").forEach(el => { el.inert = true; });
  /* วัดขนาดกรอบหลังแสดงผล แล้วจัดรูปให้เต็มกรอบและอยู่กึ่งกลาง */
  requestAnimationFrame(() => {
    crop.V = stage.clientWidth;
    crop.base = crop.V / Math.min(img.naturalWidth, img.naturalHeight);
    crop.zoom = 1;
    zoomInput.value = 1;
    crop.x = (crop.V - img.naturalWidth * crop.base) / 2;
    crop.y = (crop.V - img.naturalHeight * crop.base) / 2;
    drawCrop();
    stage.focus();
  });
}

function closeCrop() {
  $p("crop").hidden = true;
  document.documentElement.classList.remove("drawer-lock");
  document.querySelectorAll("[inert]").forEach(el => { el.inert = false; });
  if (crop.url) URL.revokeObjectURL(crop.url);
  crop.img = null;
  crop.pointers.clear();
  if (crop.returnFocus) crop.returnFocus.focus();
}

/* ลาก (นิ้วเดียว/เมาส์) และหยิกซูม (สองนิ้ว) */
stage.addEventListener("pointerdown", e => {
  stage.setPointerCapture(e.pointerId);
  crop.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (crop.pointers.size === 2) {
    const [a, b] = [...crop.pointers.values()];
    crop.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: crop.zoom };
  }
});
stage.addEventListener("pointermove", e => {
  const prev = crop.pointers.get(e.pointerId);
  if (!prev) return;
  const next = { x: e.clientX, y: e.clientY };
  crop.pointers.set(e.pointerId, next);
  if (crop.pointers.size === 1) {
    crop.x += next.x - prev.x;
    crop.y += next.y - prev.y;
    drawCrop();
  } else if (crop.pinch) {
    const [a, b] = [...crop.pointers.values()];
    const r = stage.getBoundingClientRect();
    setZoom(crop.pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / crop.pinch.d,
      (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
  }
});
const endPointer = e => {
  crop.pointers.delete(e.pointerId);
  if (crop.pointers.size < 2) crop.pinch = null;
};
stage.addEventListener("pointerup", endPointer);
stage.addEventListener("pointercancel", endPointer);
stage.addEventListener("wheel", e => {
  e.preventDefault();
  const r = stage.getBoundingClientRect();
  setZoom(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
zoomInput.addEventListener("input", () => setZoom(Number(zoomInput.value)));

/* คีย์บอร์ด: ลูกศรเลื่อน, + − ซูม, Esc ปิด, Tab วนอยู่ในหน้าต่าง */
$p("crop").addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); return closeCrop(); }
  if (e.target === stage) {
    const step = e.shiftKey ? 40 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); crop.x += moves[e.key][0]; crop.y += moves[e.key][1]; drawCrop(); }
    if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom(crop.zoom * 1.1); }
    if (e.key === "-") { e.preventDefault(); setZoom(crop.zoom / 1.1); }
  }
  if (e.key === "Tab") {
    const items = [...$p("crop").querySelectorAll("button, input, [tabindex='0']")].filter(el => el.offsetParent);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
$p("crop-close").addEventListener("click", closeCrop);
$p("crop-cancel").addEventListener("click", closeCrop);
$p("crop").addEventListener("click", e => { if (e.target === $p("crop")) closeCrop(); });

/* ตัดเฉพาะส่วนในกรอบ แล้วย่อเหลือ 256×256 (WebP ถ้าเบราว์เซอร์รองรับ ไม่งั้น JPEG) */
function exportCrop() {
  const s = scale();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(crop.img, -crop.x / s, -crop.y / s, crop.V / s, crop.V / s, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  const webp = canvas.toDataURL("image/webp", .86);
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", .88);
}

$p("crop-save").addEventListener("click", async () => {
  const btn = $p("crop-save");
  btn.disabled = true;
  btn.textContent = "กำลังบันทึก...";
  showErr("crop-error", "");
  try {
    const { avatarUrl } = await api("/profile/avatar", { method: "POST", body: { img: exportCrop() } });
    currentUser.avatarUrl = avatarUrl;
    closeCrop();
    renderProfile();
    updateMeUI();
    toast("บันทึกรูปโปรไฟล์แล้ว");
  } catch (e) {
    showErr("crop-error", e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "บันทึก";
  }
});

/* ---------- ลบรูป → กลับไปใช้วงกลมตัวอักษร ---------- */
$p("pf-remove").addEventListener("click", async () => {
  const btn = $p("pf-remove");
  if (!btn.dataset.confirm) {
    btn.dataset.confirm = "1";
    btn.textContent = "กดอีกครั้งเพื่อยืนยัน";
    setTimeout(() => { delete btn.dataset.confirm; btn.textContent = btn.dataset.label; }, 4000);
    return;
  }
  btn.disabled = true;
  try {
    await api("/profile/avatar", { method: "DELETE" });
    currentUser.avatarUrl = null;
    renderProfile();
    updateMeUI();
    toast("ลบรูปโปรไฟล์แล้ว");
  } catch (e) {
    showErr("pf-photo-error", e.message);
  } finally {
    btn.disabled = false;
    delete btn.dataset.confirm;
    btn.textContent = btn.dataset.label;
  }
});

/* ---------- แก้ชื่อที่แสดง ---------- */
$p("pf-name-form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $p("pf-name-input").value.trim();
  showErr("pf-name-error", "");
  if (!name) return showErr("pf-name-error", "กรุณากรอกชื่อที่จะแสดง");
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  try {
    const res = await api("/profile", { method: "POST", body: { name } });
    currentUser.name = res.name || name;
    renderProfile();
    updateMeUI();
    toast("บันทึกชื่อแล้ว");
  } catch (ex) {
    showErr("pf-name-error", ex.message);
  } finally {
    btn.disabled = false;
  }
});

userReady.then(() => {
  if (!currentUser) return goLogin();
  if (!CHAT_ENABLED) {
    document.querySelector(".profile-page").insertAdjacentHTML("beforeend",
      `<p class="muted">โปรไฟล์ใช้ได้เมื่อเชื่อมต่อฐานข้อมูล Supabase</p>`);
    return;
  }
  renderProfile();
  $p("profile-app").hidden = false;
});
