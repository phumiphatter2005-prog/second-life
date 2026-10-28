let mode = "login";
const form = document.getElementById("auth-form");
const errorEl = form.querySelector(".form-error");

/* กลับไปหน้าเดิมหลังเข้าสู่ระบบ (เฉพาะลิงก์ภายในเว็บเท่านั้น) */
function nextUrl() {
  const next = new URLSearchParams(location.search).get("next") || "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "index.html";
}

userReady.then(() => { if (currentUser) location.href = nextUrl(); });

document.querySelectorAll("#auth-tabs .chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#auth-tabs .chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;

    const isRegister = mode === "register";
    document.getElementById("name-field").hidden = !isRegister;
    document.getElementById("a-pass").autocomplete = isRegister ? "new-password" : "current-password";
    document.getElementById("a-submit").textContent = isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    errorEl.hidden = true;
  });
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    studentId: document.getElementById("a-sid").value.trim(),
    name: document.getElementById("a-name").value.trim(),
    password: document.getElementById("a-pass").value
  };
  const submit = document.getElementById("a-submit");
  submit.disabled = true;
  try {
    await api(mode === "register" ? "/register" : "/login", { method: "POST", body });
    location.href = nextUrl();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    submit.disabled = false;
  }
});
