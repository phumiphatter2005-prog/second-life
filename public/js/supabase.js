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
async function sbUploadImage(sb, folder, dataUrl, bucket = "product-images") {
  const blob = await (await fetch(dataUrl)).blob();
  if (blob.size > 2 * 1024 * 1024) throw sbError(400, "รูปภาพใหญ่เกินไป");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  sbCheck(await sb.storage.from(bucket).upload(path, blob, { contentType: blob.type }));
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/* ลบไฟล์ใน Storage จากลิงก์ (ข้ามรูปที่อยู่ในเว็บ เช่น images/cat-book.svg) */
async function sbRemoveFiles(sb, urls, bucket = "product-images") {
  const paths = urls
    .map(u => String(u || "").split(`/storage/v1/object/public/${bucket}/`)[1])
    .filter(Boolean)
    .map(p => decodeURIComponent(p.split("?")[0]));
  if (!paths.length) return;
  const { data, error } = await sb.storage.from(bucket).remove(paths);
  /* ไม่ให้การลบไฟล์ล้มเหลวทำให้การบันทึกล้มเหลว แต่แจ้งไว้ในคอนโซล */
  if (error || (data && data.length < paths.length)) console.warn("ลบไฟล์ใน Storage ไม่ครบ", error || data);
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
      const rows = sbCheck(await sb.from("products").delete().eq("id", id).select("*"));
      if (!rows.length) throw sbError(403, "แก้ไขได้เฉพาะประกาศของตัวเอง");
      await sbRemoveFiles(sb, [rows[0].img, ...(rows[0].images || [])]);
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

  /* ---------- แชต (supabase/003_chat.sql) ---------- */
  if (path === "/chats/open") return { roomId: await rpc("chat_open", { p_product: Number(b.productId) }) };
  if (path === "/chats") return rpc("chat_rooms_list");
  if (path === "/chats/unread") return { count: await rpc("chat_unread") };
  if ((m = /^\/chats\/requesters\/(\d+)$/.exec(path))) return rpc("chat_requesters", { p_product: Number(m[1]) });
  if ((m = /^\/chats\/messages\/(\d+)\/respond$/.exec(path))) {
    await rpc("chat_respond", { p_message: Number(m[1]), p_action: String(b.action || "") });
    return { ok: true };
  }
  if ((m = /^\/chats\/(\d+)(\?after=(\d+))?$/.exec(path))) {
    const room = Number(m[1]);
    const [info, messages] = await Promise.all([
      rpc("chat_room", { p_room: room }),
      rpc("chat_messages_list", { p_room: room, p_after: Number(m[3]) || 0 })
    ]);
    return { room: info, messages, typing: null };   // กำลังพิมพ์ส่งผ่าน Realtime broadcast (chat.js)
  }
  if ((m = /^\/chats\/(\d+)\/(messages|read|give|passed|block|report|typing)$/.exec(path))) {
    const room = Number(m[1]);
    const action = m[2];
    if (action === "messages") {
      const data = { ...(b.data || {}) };
      if (typeof data.img === "string" && data.img.startsWith("data:")) {
        const user = await needUser();
        data.img = await sbUploadImage(sb, user.id, data.img, "chat-images");
      }
      return rpc("chat_send", { p_room: room, p_kind: String(b.kind || ""), p_body: String(b.body || ""), p_data: data });
    }
    if (action === "read") await rpc("chat_mark_read", { p_room: room });
    if (action === "give") await rpc("chat_give", { p_room: room });
    if (action === "passed") await rpc("chat_passed", { p_room: room });
    if (action === "block") await rpc("chat_block", { p_room: room, p_block: !!b.block });
    if (action === "report") await rpc("chat_report", { p_room: room, p_reason: String(b.reason || ""), p_detail: String(b.detail || "") });
    return { ok: true };
  }
  if (path === "/admin/chat-reports") return rpc("admin_chat_reports");
  if ((m = /^\/admin\/chat-reports\/(\d+)$/.exec(path))) {
    await rpc("admin_set_chat_report", { p_id: Number(m[1]), p_status: String(b.status || "") });
    return { ok: true };
  }

  /* ---------- ข้อความหน้าเว็บที่ตั้งค่าไว้ (อ่านได้ทุกคน) ---------- */
  if (path === "/settings") {
    const { data, error } = await sb.from("site_settings").select("data").eq("id", 1).maybeSingle();
    return error || !data ? {} : data.data || {};   // ยังไม่ได้รัน 002_admin_cms.sql → ใช้ค่าเริ่มต้น
  }

  /* ---------- ระบบหลังบ้าน ---------- */
  if (path === "/admin/settings" && method === "PUT") {
    const user = await needUser();
    const current = (await supabaseApi("/settings")) || {};
    const data = { ...b };
    /* แบนเนอร์: data URL = รูปใหม่, "" = ลบรูป, ลิงก์เดิม = ไม่เปลี่ยน */
    if (b.bannerUrl && b.bannerUrl.startsWith("data:")) {
      data.bannerUrl = await sbUploadImage(sb, "banner", b.bannerUrl, "site-assets");
    }
    const rows = sbCheck(await sb.from("site_settings")
      .update({ data, updated_at: new Date().toISOString(), updated_by: user.id }).eq("id", 1).select("id"));
    if (!rows.length) throw sbError(403, "เฉพาะผู้ดูแลระบบเท่านั้น");
    if (current.bannerUrl && current.bannerUrl !== data.bannerUrl) await sbRemoveFiles(sb, [current.bannerUrl], "site-assets");
    return data;
  }

  if (path === "/admin/reports") return rpc("admin_reports");
  if ((m = /^\/admin\/reports\/(\d+)$/.exec(path))) {
    await rpc("admin_set_report", { p_id: Number(m[1]), p_status: String(b.status || "") });
    return { ok: true };
  }

  if ((m = /^\/admin\/products\/(\d+)$/.exec(path))) {
    const id = Number(m[1]);
    await needUser();
    const old = sbCheck(await sb.from("products").select("*").eq("id", id).maybeSingle());
    if (!old) throw sbError(404, "ไม่พบสินค้านี้");
    if (method === "GET") return old;

    const item = {
      title: String(b.title || "").trim(),
      price: b.type === "free" ? 0 : Math.round(Number(b.price)),
      type: b.type, category: b.category, condition: b.condition,
      pickup: String(b.pickup || "").trim(),
      contact: String(b.contact || "").trim(),
      description: String(b.description || "").trim() || "ไม่มีรายละเอียดเพิ่มเติม",
      passed: !!b.passed
    };
    if (!item.title) throw sbError(400, "กรุณากรอกชื่อสินค้า");
    if (!TYPE_LABEL[item.type]) throw sbError(400, "ประเภทประกาศไม่ถูกต้อง");
    if (!CATEGORIES.some(c => c.id === item.category && c.id !== "all")) throw sbError(400, "หมวดหมู่ไม่ถูกต้อง");
    if (!CONDITION_INFO[item.condition]) throw sbError(400, "สภาพสินค้าไม่ถูกต้อง");
    if (!Number.isFinite(item.price) || item.price < 0 || item.price > 1000000) throw sbError(400, "กรุณากรอกราคาให้ถูกต้อง");
    if (!item.pickup) throw sbError(400, "กรุณาระบุจุดนัดรับ");
    if (!item.contact) throw sbError(400, "กรุณาระบุช่องทางติดต่อ");

    /* รูป: data URL = อัปโหลดใหม่, ลิงก์ = รูปเดิม · รูปเดิมที่ไม่อยู่ในรายการใหม่จะถูกลบจาก Storage */
    const images = [];
    for (const src of (Array.isArray(b.images) ? b.images : []).slice(0, 10)) {
      images.push(String(src).startsWith("data:") ? await sbUploadImage(sb, `admin/${id}`, src) : String(src));
    }
    if (!images.length) images.push(`images/cat-${item.category}.svg`);
    item.images = images;
    item.img = images[0];

    const rows = sbCheck(await sb.from("products").update(item).eq("id", id).select("id"));
    if (!rows.length) {
      await sbRemoveFiles(sb, images.filter(u => !(old.images || [old.img]).includes(u)));
      throw sbError(403, "เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขประกาศได้");
    }
    const before = [...new Set([old.img, ...(old.images || [])])];
    await sbRemoveFiles(sb, before.filter(u => !images.includes(u)));
    return { ok: true };
  }

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
