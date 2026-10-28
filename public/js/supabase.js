/* ---------- โหมด Supabase (ฐานข้อมูลออนไลน์) ----------
   แปลงเส้นทาง API เดียวกับ server.js เป็นการเรียก Supabase
   ฟังก์ชันฝั่งฐานข้อมูลอยู่ใน supabase/schema.sql */
const SB = window.SL_CONFIG || {};
const SUPABASE_MODE = !!(SB.supabaseUrl && SB.supabaseAnonKey);
const SB_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
let sbClientPromise = null;

/* โหลดไลบรารีเมื่อใช้ครั้งแรกเท่านั้น */
function sbClient() {
  sbClientPromise = sbClientPromise || new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SB_LIB;
    s.onload = () => resolve(window.supabase.createClient(SB.supabaseUrl, SB.supabaseAnonKey));
    s.onerror = () => reject(sbError(503, "เชื่อมต่อฐานข้อมูลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต"));
    document.head.appendChild(s);
  });
  return sbClientPromise;
}

function sbError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/* ข้อความ error จากฟังก์ชันใน schema.sql เป็นภาษาไทยอยู่แล้ว แปลเฉพาะของ Supabase Auth */
const SB_MESSAGES = {
  "Invalid login credentials": "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง",
  "User already registered": "รหัสนักศึกษานี้สมัครไว้แล้ว",
  "Database error saving new user": "รหัสนักศึกษานี้สมัครไว้แล้ว",
  "Email not confirmed": "ผู้ดูแลระบบต้องปิด Confirm email ใน Supabase ก่อน"
};

function sbCheck({ data, error }) {
  if (error) {
    const msg = SB_MESSAGES[error.message] || error.message || "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง";
    throw sbError(error.status || (/เข้าสู่ระบบ/.test(msg) ? 401 : 400), msg);
  }
  return data;
}

async function sbProfile(sb) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const p = sbCheck(await sb.from("profiles").select("id, student_id, name, role, banned")
    .eq("id", session.user.id).maybeSingle());
  if (!p || p.banned) return null;
  return { id: p.id, studentId: p.student_id, name: p.name, role: p.role };
}

/* รูปจากหน้าลงประกาศเป็น data URL → อัปโหลดเข้า Storage แล้วเก็บเป็นลิงก์ */
async function sbUploadImage(sb, userId, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  if (blob.size > 2 * 1024 * 1024) throw sbError(400, "รูปภาพใหญ่เกินไป");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  sbCheck(await sb.storage.from("product-images").upload(path, blob, { contentType: blob.type }));
  return sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

async function supabaseApi(path, options = {}) {
  const method = options.method || "GET";
  const b = options.body || {};
  const sb = await sbClient();
  const rpc = async (fn, args) => sbCheck(await sb.rpc(fn, args));
  const needUser = async () => {
    const u = await sbProfile(sb);
    if (!u) throw sbError(401, "กรุณาเข้าสู่ระบบก่อน");
    return u;
  };
  const email = sid => `${String(sid || "").trim()}@${SB.emailDomain || "student.secondlife.app"}`;

  let m;
  if (path === "/me") return { user: await sbProfile(sb) };

  if (path === "/register" && method === "POST") {
    const studentId = String(b.studentId || "").trim();
    const name = String(b.name || "").trim();
    if (!/^[0-9]{5,20}$/.test(studentId)) throw sbError(400, "รหัสนักศึกษาต้องเป็นตัวเลข 5–20 หลัก");
    if (!name) throw sbError(400, "กรุณากรอกชื่อที่จะแสดง");
    if (String(b.password || "").length < 6) throw sbError(400, "รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    const data = sbCheck(await sb.auth.signUp({
      email: email(studentId), password: b.password,
      options: { data: { student_id: studentId, name: name.slice(0, 60) } }
    }));
    if (!data.session) throw sbError(400, SB_MESSAGES["Email not confirmed"]);
    return { user: await sbProfile(sb) };
  }

  if (path === "/login" && method === "POST") {
    sbCheck(await sb.auth.signInWithPassword({ email: email(b.studentId), password: String(b.password || "") }));
    const user = await sbProfile(sb);
    if (!user) {
      await sb.auth.signOut();
      throw sbError(403, "บัญชีนี้ถูกระงับโดยผู้ดูแลระบบ");
    }
    return { user };
  }

  if (path === "/logout") {
    await sb.auth.signOut();
    return { ok: true };
  }

  if (path === "/stats") return rpc("sl_stats");

  if (path === "/products" && method === "GET") return rpc("sl_products");

  if (path === "/products" && method === "POST") {
    const user = await needUser();
    const item = {
      title: String(b.title || "").trim(),
      price: b.type === "free" ? 0 : Math.round(Number(b.price)),
      type: b.type, category: b.category, condition: b.condition,
      pickup: String(b.pickup || "").trim(),
      contact: String(b.contact || "").trim(),
      description: String(b.desc || "").trim() || "ไม่มีรายละเอียดเพิ่มเติม"
    };
    if (!item.title) throw sbError(400, "กรุณากรอกชื่อสินค้า");
    if (!TYPE_LABEL[item.type]) throw sbError(400, "ประเภทประกาศไม่ถูกต้อง");
    if (!CATEGORIES.some(c => c.id === item.category && c.id !== "all")) throw sbError(400, "หมวดหมู่ไม่ถูกต้อง");
    if (!Number.isFinite(item.price) || item.price < 0 || item.price > 1000000) throw sbError(400, "กรุณากรอกราคาให้ถูกต้อง");
    if (!item.pickup) throw sbError(400, "กรุณาระบุจุดนัดรับ");
    if (!item.contact) throw sbError(400, "กรุณาระบุช่องทางติดต่อ");
    item.img = b.img ? await sbUploadImage(sb, user.id, b.img) : `images/cat-${item.category}.svg`;
    const row = sbCheck(await sb.from("products").insert({ ...item, user_id: user.id }).select("id").single());
    return { id: row.id };
  }

  if ((m = /^\/products\/(\d+)$/.exec(path))) {
    const id = Number(m[1]);
    if (method === "DELETE") {
      await needUser();
      const rows = sbCheck(await sb.from("products").delete().eq("id", id).select("img"));
      if (!rows.length) throw sbError(403, "แก้ไขได้เฉพาะประกาศของตัวเอง");
      const stored = rows[0].img.split("/product-images/")[1];
      if (stored) await sb.storage.from("product-images").remove([stored]);
      return { ok: true };
    }
    const [p] = await rpc("sl_products", { p_id: id });
    if (!p) throw sbError(404, "ไม่พบสินค้านี้");
    return p;
  }

  if ((m = /^\/products\/(\d+)\/passed$/.exec(path))) {
    return { passed: await rpc("sl_toggle_passed", { p_id: Number(m[1]) }) };
  }

  if ((m = /^\/products\/(\d+)\/report$/.exec(path))) {
    await rpc("sl_report", { p_id: Number(m[1]), p_reason: String(b.reason || ""), p_detail: String(b.detail || "") });
    return { ok: true };
  }

  if ((m = /^\/products\/(\d+)\/reviews$/.exec(path))) {
    const pid = Number(m[1]);
    if (method === "GET") return rpc("sl_reviews", { p_id: pid });
    await rpc("sl_review", { p_id: pid, p_stars: Number(b.stars), p_comment: String(b.comment || "") });
    return { ok: true };
  }

  if (path === "/my-products") {
    const user = await needUser();
    return rpc("sl_products", { p_owner: user.id });
  }

  if (path === "/favorites") {
    await needUser();
    return rpc("sl_products", { p_favs: true });
  }

  if ((m = /^\/favorites\/(\d+)$/.exec(path))) {
    return { fav: await rpc("sl_toggle_fav", { p_id: Number(m[1]) }) };
  }

  /* ---------- ระบบหลังบ้าน ---------- */
  if (path === "/admin/overview") return rpc("admin_overview");
  if (path === "/admin/products") return rpc("admin_products");
  if (path === "/admin/users") return rpc("admin_users");
  if (path === "/admin/reviews") return rpc("admin_reviews");

  if ((m = /^\/admin\/users\/([\w-]+)$/.exec(path))) {
    await rpc("admin_set_user", {
      p_id: m[1],
      p_role: b.role === undefined ? null : b.role,
      p_banned: b.banned === undefined ? null : !!b.banned
    });
    return { ok: true };
  }

  if ((m = /^\/admin\/reviews\/(\d+)\/([\w-]+)$/.exec(path))) {
    await rpc("admin_delete_review", { p_product: Number(m[1]), p_user: m[2] });
    return { ok: true };
  }

  throw sbError(404, "ไม่พบ API นี้");
}
