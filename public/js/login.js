let mode = "login";
const form = document.getElementById("auth-form");
const errorEl = form.querySelector(".form-error");
const sidInput = document.getElementById("a-sid");
const passInput = document.getElementById("a-pass");
const nameInput = document.getElementById("a-name");
const submit = document.getElementById("a-submit");
const sidMsg = document.getElementById("sid-msg");
const SID_LENGTH = 8;

/* กลับไปหน้าเดิมหลังเข้าสู่ระบบ (เฉพาะลิงก์ภายในเว็บเท่านั้น) ถ้าไม่มีไปหน้าแรก */
function nextUrl() {
  const next = new URLSearchParams(location.search).get("next") || "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "index.html";
}

userReady.then(() => { if (currentUser) location.href = nextUrl(); });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

/* ---------- แท็บ เข้าสู่ระบบ / สมัครสมาชิก (แคปซูลเลื่อน + ฟอร์มเปลี่ยนแบบนุ่มนวล) ---------- */
const TEXT = {
  login:    { heading: "ยินดีต้อนรับกลับมา", sub: "เข้าสู่ระบบด้วยรหัสนักศึกษา", button: "เข้าสู่ระบบ" },
  register: { heading: "สร้างบัญชีใหม่", sub: "ใช้รหัสนักศึกษาสมัครได้ในไม่กี่วินาที", button: "สมัครสมาชิก" }
};

async function setMode(next) {
  if (next === mode) return;
  mode = next;
  const tabs = document.getElementById("auth-tabs");
  tabs.dataset.mode = mode;
  tabs.querySelectorAll("button").forEach(b => {
    const on = b.dataset.mode === mode;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on);
  });

  if (!reduceMotion) {
    form.classList.add("switching");
    await sleep(180);
  }
  const isRegister = mode === "register";
  document.getElementById("auth-heading").textContent = TEXT[mode].heading;
  document.getElementById("auth-sub").textContent = TEXT[mode].sub;
  submit.querySelector(".btn-label").textContent = TEXT[mode].button;
  document.getElementById("name-field").hidden = !isRegister;
  document.getElementById("strength").hidden = !isRegister;
  passInput.autocomplete = isRegister ? "new-password" : "current-password";
  showError("");
  updateStrength();
  form.classList.remove("switching");
}

document.querySelectorAll("#auth-tabs button").forEach(btn =>
  btn.addEventListener("click", () => setMode(btn.dataset.mode)));

/* ---------- รหัสนักศึกษา: ตัวเลขเท่านั้น ครบ 8 หลัก ---------- */
function validateSid(fromTyping) {
  const raw = sidInput.value;
  const digits = raw.replace(/\D/g, "").slice(0, SID_LENGTH);
  const hadLetters = raw !== digits && /\D/.test(raw);
  if (raw !== digits) sidInput.value = digits;

  const ok = digits.length === SID_LENGTH;
  let msg = "";
  if (digits.length > 0 && !ok) msg = `ต้องเป็นตัวเลข ${SID_LENGTH} หลัก (ตอนนี้ ${digits.length} หลัก)`;
  if (hadLetters && fromTyping) msg = "ใส่ได้เฉพาะตัวเลข" + (ok ? "" : ` · ตอนนี้ ${digits.length}/${SID_LENGTH} หลัก`);
  sidMsg.textContent = msg;
  sidMsg.classList.remove("ok");
  sidInput.classList.toggle("invalid", !!msg);
  sidInput.setAttribute("aria-invalid", !!msg);
  submit.disabled = !ok;
  return ok;
}
sidInput.addEventListener("input", () => validateSid(true));
validateSid(false);

/* ---------- รหัสผ่าน: ปุ่มรูปตา + แถบความแข็งแรง (ตอนสมัคร) ---------- */
const eye = document.getElementById("a-eye");
function setEye(show) {
  passInput.type = show ? "text" : "password";
  eye.innerHTML = icon(show ? "eyeOff" : "eye");
  const label = show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน";
  eye.setAttribute("aria-label", label);
  eye.title = label;
}
eye.addEventListener("click", () => {
  setEye(passInput.type === "password");
  passInput.focus();
});
setEye(false);

const STRENGTH = ["", "อ่อนมาก", "พอใช้", "ดี", "แข็งแรง"];
function passwordScore(pw) {
  if (!pw) return 0;
  let s = pw.length >= 6 ? 1 : 0;
  if (pw.length >= 10) s++;
  if (/[a-z]/i.test(pw) && /\d/.test(pw)) s++;
  if (/[^a-z0-9]/i.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw))) s++;
  return Math.max(1, Math.min(4, s));
}
function updateStrength() {
  const box = document.getElementById("strength");
  const score = passwordScore(passInput.value);
  box.dataset.level = score;
  box.querySelector(".strength-bar span").style.transform = `scaleX(${score / 4})`;
  box.querySelector(".strength-label").textContent =
    passInput.value.length && passInput.value.length < 6 ? "สั้นเกินไป" : STRENGTH[score];
}
passInput.addEventListener("input", updateStrength);

/* ---------- ส่งฟอร์ม: วงหมุน → ถูก / สั่น + ข้อความแดง ---------- */
function shake() {
  form.classList.remove("shake");
  form.getBoundingClientRect();
  form.classList.add("shake");
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  showError("");
  if (!validateSid(false)) {
    sidMsg.textContent = `กรุณากรอกรหัสนักศึกษา ${SID_LENGTH} หลัก`;
    shake();
    return sidInput.focus();
  }
  if (mode === "register" && !nameInput.value.trim()) {
    showError("กรุณากรอกชื่อที่จะแสดง");
    shake();
    return nameInput.focus();
  }
  if (mode === "register" && passInput.value.length < 6) {
    showError("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    shake();
    return passInput.focus();
  }
  if (!passInput.value) {
    showError("กรุณากรอกรหัสผ่าน");
    shake();
    return passInput.focus();
  }

  const body = { studentId: sidInput.value, name: nameInput.value.trim(), password: passInput.value };
  submit.disabled = true;
  submit.classList.add("loading");
  try {
    await api(mode === "register" ? "/register" : "/login", { method: "POST", body });
    submit.classList.remove("loading");
    submit.classList.add("done");
    submit.setAttribute("aria-label", "สำเร็จ");
    await sleep(reduceMotion ? 0 : 750);
    location.href = nextUrl();
  } catch (err) {
    submit.classList.remove("loading");
    submit.disabled = false;
    showError(err.message);
    shake();
  }
});
