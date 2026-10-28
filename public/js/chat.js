/* ---------- แชตระหว่างผู้ประกาศกับผู้สนใจ (หน้า messages.html) ----------
   Supabase: ข้อความเด้งทันทีผ่าน Realtime + "กำลังพิมพ์" ผ่าน broadcast (ดึงซ้ำทุก 10 วินาทีเผื่อหลุด)
   npm start: ดึงข้อความใหม่ทุก 2 วินาที */
const chatParams = new URLSearchParams(location.search);
let roomId = Number(chatParams.get("room")) || 0;
let room = null;
let messages = [];
let rendered = new Set();
let live = null;
let listTimer = null;
let typingTimer = null;
let lastTypingSent = 0;
let sending = false;
let myReview = undefined;   // รีวิวของฉันในสินค้าของห้องนี้ (โหลดเมื่อมีการ์ด "ส่งต่อแล้ว")

const listEl = document.getElementById("chat-list");
const pane = document.getElementById("chat-room");
const page = document.getElementById("chat-page");
const POLL_MS = SUPABASE_MODE ? 10000 : 2000;
const QUICK_TEXT = ["ยังอยู่ไหมครับ/คะ", "ลดได้ไหม", "นัดรับได้เมื่อไหร่"];
const STATUS = {
  pending:   ["รอตอบ", "status-warn"],
  accepted:  ["รับแล้ว", "status-ok"],
  confirmed: ["ยืนยันแล้ว", "status-ok"],
  rejected:  ["ปฏิเสธแล้ว", "status-bad"]
};
const REPORT_CHAT_REASONS = ["พูดจาไม่สุภาพหรือคุกคาม", "สงสัยว่าเป็นการหลอกลวง", "ขอข้อมูลส่วนตัว/ให้โอนเงินก่อน", "สแปม", "อื่นๆ"];

document.body.classList.add("chat-body");

/* ---------- เวลา ---------- */
const timeOf = ms => new Date(ms).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
function dayOf(ms) {
  const d = new Date(ms);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "วันนี้";
  if (d.toDateString() === yesterday.toDateString()) return "เมื่อวาน";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}
function listTime(ms) {
  const d = new Date(ms);
  return d.toDateString() === new Date().toDateString()
    ? timeOf(ms) : d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
const thaiDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("th-TH",
  { weekday: "short", day: "numeric", month: "short", year: "numeric" });

/* ---------- รายการห้อง ---------- */
async function loadList() {
  try {
    const rooms = await api("/chats");
    listEl.innerHTML = rooms.length ? rooms.map(r => `
      <a class="chat-item ${r.id === roomId ? "active" : ""}" href="messages.html?room=${r.id}" data-room="${r.id}">
        <span class="chat-item-pics">
          ${avatarHtml(r.otherName, r.otherAvatar, "chat-item-avatar")}
          <img class="chat-item-thumb" src="${esc(r.productImg)}" alt="" loading="lazy">
        </span>
        <span class="chat-item-main">
          <span class="chat-item-top">
            <strong>${esc(r.otherName)}</strong>
            <time>${listTime(r.lastAt)}</time>
          </span>
          <span class="chat-item-product">${esc(r.productTitle)} · ${r.isSeller ? "ประกาศของคุณ" : TYPE_LABEL[r.productType]}</span>
          <span class="chat-item-last ${r.unread ? "unread" : ""}">${esc(r.lastMessage)}</span>
        </span>
        ${r.unread ? `<span class="chat-dot" title="${r.unread} ข้อความที่ยังไม่อ่าน">${r.unread > 99 ? "99+" : r.unread}</span>` : ""}
      </a>`).join("")
      : `<div class="chat-list-empty">${icon("chat")}<p>ยังไม่มีข้อความ</p>
         <a class="btn btn-secondary btn-md" href="search.html">ดูสินค้าแล้วกด "แชตกับผู้ประกาศ"</a></div>`;
  } catch (e) {
    listEl.innerHTML = `<p class="empty" style="padding:16px">${esc(e.message)}</p>`;
  }
}

listEl.addEventListener("click", e => {
  const a = e.target.closest(".chat-item");
  if (!a) return;
  e.preventDefault();
  openRoom(Number(a.dataset.room), true);
});

/* ---------- เปิดห้อง ---------- */
async function openRoom(id, push) {
  stopLive();
  roomId = id;
  room = null;
  messages = [];
  rendered = new Set();
  myReview = undefined;
  if (push) history.pushState(null, "", `messages.html?room=${id}`);
  page.classList.toggle("has-room", !!id);
  listEl.querySelectorAll(".chat-item").forEach(a => a.classList.toggle("active", Number(a.dataset.room) === id));
  if (!id) {
    pane.innerHTML = `<div class="chat-empty">${icon("chat")}<p>เลือกห้องแชตเพื่อเริ่มคุย</p></div>`;
    return;
  }
  pane.innerHTML = `<div class="room-loading">${skeletonRows(4)}</div>`;
  try {
    const data = await api(`/chats/${id}`);
    room = data.room;
    messages = data.messages;
    renderRoom();
    markRead();
    startLive();
  } catch (e) {
    pane.innerHTML = `<div class="chat-empty">${icon("alert")}<p>${esc(e.message)}</p>
      <a class="btn btn-secondary btn-md" href="messages.html">กลับไปรายการแชต</a></div>`;
  }
}

addEventListener("popstate", () => openRoom(Number(new URLSearchParams(location.search).get("room")) || 0, false));

/* ---------- หัวห้อง: การ์ดสินค้าย่อ + ปุ่มของผู้ประกาศ ---------- */
function roomHead() {
  const r = room;
  const sellerTools = r.isSeller && !r.adminView;
  return `
    <header class="room-head">
      <a class="room-back" href="messages.html" aria-label="กลับไปรายการแชต" title="กลับ">${icon("back")}</a>
      <a class="room-product" href="product.html?id=${r.productId}" title="ดูหน้าสินค้า">
        <img src="${esc(r.productImg)}" alt="">
        <span>
          <strong>${esc(r.productTitle)}</strong>
          <span class="room-product-meta">
            <span class="price">${formatPrice({ type: r.productType, price: r.productPrice })}</span>
            <span class="badge badge-${r.productType}">${TYPE_LABEL[r.productType]}</span>
            ${r.productPassed ? `<span class="status status-ok">ส่งต่อแล้ว</span>` : ""}
          </span>
        </span>
      </a>
      <div class="room-actions">
        ${sellerTools && r.productType === "free" ? `
          <button type="button" class="btn btn-sm btn-secondary" data-act="requesters">คนที่ขอ (${r.requesters})</button>` : ""}
        ${sellerTools && !r.productPassed ? `
          <button type="button" class="btn btn-sm btn-secondary" data-act="passed" title="ยืนยันว่าส่งต่อแล้ว" aria-label="ยืนยันว่าส่งต่อแล้ว">${icon("recycle")}<span>ส่งต่อแล้ว</span></button>` : ""}
        ${r.adminView ? "" : `
          <div class="room-menu-wrap">
            <button type="button" class="btn btn-ghost btn-sm room-menu-btn" data-act="menu" aria-haspopup="menu" aria-label="ตัวเลือกเพิ่มเติม" title="ตัวเลือกเพิ่มเติม">⋯</button>
            <div class="user-menu room-menu" role="menu" hidden>
              <button type="button" role="menuitem" data-act="report">${icon("flag")}รายงานห้องแชตนี้</button>
              <button type="button" role="menuitem" class="danger-item" data-act="block">${icon("shield")}${r.blockedByMe ? "ปลดบล็อก" : "บล็อก"} ${esc(r.otherName)}</button>
            </div>
          </div>`}
      </div>
    </header>
    <div class="room-sub">
      <span class="room-sub-who">${r.adminView
        ? `โหมดผู้ดูแลระบบ (ดูอย่างเดียว) · ผู้ประกาศ <b>${esc(r.sellerName)}</b> คุยกับ <b>${esc(r.buyerName)}</b>`
        : `${avatarHtml(r.otherName, r.otherAvatar, "avatar-xs")} คุยกับ <b>${esc(r.otherName)}</b> · ${r.isSeller ? "ผู้สนใจสินค้าของคุณ" : "ผู้ประกาศ"}`}</span>
      <span class="room-safe">${icon("shield")}ไม่โอนเงินก่อนเห็นของ</span>
    </div>`;
}

/* ---------- ข้อความแต่ละประเภท ---------- */
function statusChip(s) {
  const [label, cls] = STATUS[s] || [s, ""];
  return `<span class="status ${cls}">${label}</span>`;
}

function cardActions(m) {
  const d = m.data || {};
  if (d.status !== "pending" || room.adminView || room.blocked) return "";
  if (["offer", "swap", "request"].includes(m.kind) && room.isSeller) {
    const yes = m.kind === "request" ? "ให้คนนี้" : "รับข้อเสนอ";
    return `<div class="card-btns">
      <button type="button" class="btn btn-sm btn-primary" data-respond="accept" data-mid="${m.id}">${yes}</button>
      <button type="button" class="btn btn-sm btn-secondary" data-respond="reject" data-mid="${m.id}">ปฏิเสธ</button></div>`;
  }
  if (m.kind === "meetup" && !m.mine) {
    return `<div class="card-btns">
      <button type="button" class="btn btn-sm btn-primary" data-respond="confirm" data-mid="${m.id}">ยืนยันนัด</button>
      <button type="button" class="btn btn-sm btn-secondary" data-respond="reject" data-mid="${m.id}">ไม่สะดวก</button></div>`;
  }
  return "";
}

function messageInner(m) {
  const d = m.data || {};
  switch (m.kind) {
    case "offer":
      return `<div class="msg-card">
        <span class="msg-card-label">${icon("tag")}เสนอราคา</span>
        <strong class="offer-amount">฿${Number(d.amount).toLocaleString()}</strong>
        <span class="muted">ราคาประกาศ ${formatPrice({ type: room.productType, price: room.productPrice })}</span>
        ${statusChip(d.status)}${cardActions(m)}</div>`;
    case "swap":
      return `<div class="msg-card">
        <span class="msg-card-label">${icon("swap")}เสนอแลกกับ</span>
        ${d.img ? `<img class="swap-img" src="${esc(d.img)}" alt="${esc(d.title)}" loading="lazy">` : ""}
        <strong>${esc(d.title)}</strong>
        ${statusChip(d.status)}${cardActions(m)}</div>`;
    case "request":
      return `<div class="msg-card">
        <span class="msg-card-label">${icon("heart")}ขอรับของชิ้นนี้</span>
        <span class="muted">${m.mine ? "รอผู้ประกาศเลือกผู้รับ" : "ผู้สนใจขอรับของแจกฟรี"}</span>
        ${statusChip(d.status)}${cardActions(m)}</div>`;
    case "meetup":
      return `<div class="msg-card">
        <span class="msg-card-label">${icon("pin")}นัดรับ</span>
        <strong>${esc(d.place)}</strong>
        <span>${thaiDate(d.date)} · ${esc(d.time)} น.</span>
        ${statusChip(d.status)}${cardActions(m)}</div>`;
    case "contact":
      return `<div class="msg-card">
        <span class="msg-card-label">${icon("user")}ช่องทางติดต่อ</span>
        <strong class="contact-value">${esc(m.body)}</strong>
        <button type="button" class="btn btn-sm btn-secondary" data-copy="${esc(m.body)}">คัดลอก</button></div>`;
    default:
      return `<div class="msg-text">${esc(m.body)}</div>`;
  }
}

function passedCard(m) {
  let rate = "";
  if (room.isBuyer && !room.adminView) {
    if (myReview === undefined) {
      rate = `<p class="muted">กำลังโหลด...</p>`;
      loadMyReview();
    } else if (myReview) {
      rate = `<p class="passed-done">${starsHtml(myReview.stars)} คุณให้ ${myReview.stars} ดาวแล้ว ขอบคุณ</p>`;
    } else {
      rate = `
        <form class="passed-rate">
          <span>ให้ดาวผู้ขาย</span>
          <div class="star-input" role="radiogroup" aria-label="ให้ดาวผู้ขาย">
            ${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" data-star="${n}" aria-label="${n} ดาว" style="--d:${(n - 1) * 45}ms">★</button>`).join("")}
          </div>
          <input type="text" maxlength="300" placeholder="เล่าประสบการณ์สั้นๆ (ไม่บังคับ)" aria-label="ความเห็น">
          <button type="submit" class="btn btn-sm btn-primary">ส่งรีวิว</button>
        </form>`;
    }
  }
  return `
    <div class="msg-passed" data-id="${m.id}">
      <span class="ha-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span>
      <strong>${room.isSeller ? "คุณยืนยันว่าส่งต่อแล้ว" : "ผู้ประกาศยืนยันว่าส่งต่อแล้ว"}</strong>
      <span class="muted">ขอบคุณที่ให้ของได้มีชีวิตที่สอง</span>
      ${rate}
    </div>`;
}

async function loadMyReview() {
  try {
    const reviews = await api(`/products/${room.productId}/reviews`);
    myReview = reviews.find(r => r.mine) || null;
  } catch (e) { myReview = null; }
  renderMessages(false);
}

function renderMessages(scrollToEnd) {
  const box = document.getElementById("msgs");
  if (!box) return;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  /* ข้อความล่าสุดของฉัน → แสดงสถานะ "อ่านแล้ว" */
  const lastMine = [...messages].reverse().find(m => m.mine);
  let lastDay = "";
  let html = "";
  messages.forEach(m => {
    const day = dayOf(m.createdAt);
    if (day !== lastDay) {
      html += `<div class="msg-day"><span>${day}</span></div>`;
      lastDay = day;
    }
    const fresh = !rendered.has(m.id) ? " fresh" : "";
    if (m.kind === "system") {
      html += `<div class="msg-system${fresh}"><span>${esc(m.body)}</span></div>`;
    } else if (m.kind === "passed") {
      html += `<div class="msg-center${fresh}">${passedCard(m)}</div>`;
    } else {
      const who = room.adminView && m.senderName ? `<span class="msg-who">${esc(m.senderName)}</span>` : "";
      const prev = messages[messages.indexOf(m) - 1];
      const firstOfRun = !prev || prev.senderId !== m.senderId || ["system", "passed"].includes(prev.kind);
      const face = m.mine ? "" : firstOfRun ? senderAvatar(m) : `<span class="msg-face-gap"></span>`;
      const read = m === lastMine && !room.adminView
        ? `<span class="msg-read">${room.otherReadAt >= m.createdAt ? "อ่านแล้ว" : "ส่งแล้ว"}</span>` : "";
      html += `
        <div class="msg-row ${m.mine ? "mine" : "theirs"}${fresh}">${face}
        <div class="msg ${m.mine ? "mine" : "theirs"}" data-id="${m.id}">
          ${who}${messageInner(m)}
          <span class="msg-time">${timeOf(m.createdAt)}${read ? " · " + read : ""}</span>
        </div></div>`;
    }
  });
  box.innerHTML = html || `<div class="msg-system"><span>เริ่มคุยได้เลย ข้อความจะเห็นเฉพาะคุณ ${esc(room.otherName)} และผู้ดูแลระบบ</span></div>`;
  messages.forEach(m => rendered.add(m.id));
  if (scrollToEnd || nearBottom) box.scrollTop = box.scrollHeight;
}

/* รูปโปรไฟล์ของคนส่ง (แอดมินดูได้ทั้งสองฝ่าย) */
function senderAvatar(m) {
  const r = room;
  const isBuyer = r.buyerId !== undefined ? String(m.senderId) === String(r.buyerId) : null;
  const name = r.adminView ? (isBuyer ? r.buyerName : r.sellerName) : r.otherName;
  const url = r.adminView ? (isBuyer ? r.buyerAvatar : r.sellerAvatar) : r.otherAvatar;
  return avatarHtml(m.senderName || name, url, "msg-face");
}

/* ---------- ปุ่มด่วนตามประเภทประกาศ ---------- */
function quickBar() {
  const r = room;
  const chips = [];
  if (r.isBuyer && !r.productPassed) {
    if (r.productType === "sell") {
      QUICK_TEXT.forEach(t => chips.push(`<button type="button" class="chip" data-quick="${esc(t)}">${esc(t)}</button>`));
      chips.push(`<button type="button" class="chip chip-strong" data-sheet="offer">${icon("tag")}เสนอราคา</button>`);
    }
    if (r.productType === "swap") chips.push(`<button type="button" class="chip chip-strong" data-sheet="swap">${icon("swap")}เสนอของแลก</button>`);
    if (r.productType === "free" && !messages.some(m => m.kind === "request")) {
      chips.push(`<button type="button" class="chip chip-strong" data-act="request">${icon("heart")}ขอรับ</button>`);
    }
  }
  chips.push(`<button type="button" class="chip" data-sheet="meetup">${icon("pin")}นัดรับ</button>`);
  chips.push(`<button type="button" class="chip" data-sheet="contact">${icon("user")}ส่งช่องทางติดต่อ</button>`);
  return chips.join("");
}

function renderRoom() {
  const r = room;
  let bottom;
  if (r.adminView) {
    bottom = `<div class="room-banner">โหมดผู้ดูแลระบบ: อ่านได้อย่างเดียว</div>`;
  } else if (r.blocked) {
    bottom = `<div class="room-banner">${r.blockedByMe
      ? `คุณบล็อก ${esc(r.otherName)} อยู่ <button type="button" class="btn btn-sm btn-secondary" data-act="block">ปลดบล็อก</button>`
      : "ส่งข้อความในห้องนี้ไม่ได้ เนื่องจากมีการบล็อก"}</div>`;
  } else {
    bottom = `
      <div class="quick" id="quick">${quickBar()}</div>
      <div class="sheet" id="sheet" hidden></div>
      <form class="composer" id="composer">
        <textarea id="msg-input" rows="1" maxlength="1000" placeholder="พิมพ์ข้อความ..." aria-label="ข้อความ"></textarea>
        <span class="composer-count" id="msg-count" aria-live="polite"></span>
        <button type="submit" class="btn btn-primary composer-send" aria-label="ส่ง" title="ส่ง">${icon("send")}</button>
      </form>
      <p class="form-error composer-error" id="composer-error" role="alert" hidden></p>`;
  }
  pane.innerHTML = `
    ${roomHead()}
    <div class="room-panel" id="room-panel" hidden></div>
    <div class="msgs" id="msgs" role="log" aria-live="polite"></div>
    <div class="typing" id="typing" hidden><span class="typing-dots"><i></i><i></i><i></i></span><span id="typing-name"></span></div>
    ${bottom}`;
  renderMessages(true);
  bindComposer();
}

/* ---------- ช่องพิมพ์ ---------- */
function bindComposer() {
  const form = document.getElementById("composer");
  if (!form) return;
  const input = document.getElementById("msg-input");
  const count = document.getElementById("msg-count");
  const grow = () => {
    input.style.height = "auto";
    input.style.height = Math.min(140, input.scrollHeight) + "px";
    const n = input.value.length;
    count.textContent = n > 800 ? `${n}/1000` : "";
    count.classList.toggle("over", n >= 1000);
  };
  input.addEventListener("input", () => { grow(); sendTyping(); });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (await send("text", text)) {
      input.value = "";
      grow();
    }
    input.focus();
  });
}

function composerError(msg) {
  const el = document.getElementById("composer-error");
  if (!el) return toast(msg);
  el.textContent = msg;
  el.hidden = !msg;
}

/* ส่งข้อความ (กันกดรัว: ระหว่างส่งกดซ้ำไม่ได้ เซิร์ฟเวอร์จำกัด 6 ข้อความต่อ 10 วินาที) */
async function send(kind, body = "", data = {}) {
  if (sending) return false;
  sending = true;
  composerError("");
  const btn = document.querySelector(".composer-send");
  if (btn) btn.disabled = true;
  try {
    const m = await api(`/chats/${roomId}/messages`, { method: "POST", body: { kind, body, data } });
    if (!messages.some(x => x.id === m.id)) messages.push(m);
    renderMessages(true);
    const quick = document.getElementById("quick");
    if (quick) quick.innerHTML = quickBar();
    loadList();
    return true;
  } catch (e) {
    composerError(e.message);
    return false;
  } finally {
    setTimeout(() => {
      sending = false;
      if (btn) btn.disabled = false;
    }, 400);
  }
}

/* ---------- แผงฟอร์ม (เสนอราคา / ของแลก / นัดรับ / ช่องทางติดต่อ) ---------- */
async function openSheet(kind) {
  const sheet = document.getElementById("sheet");
  if (!sheet.hidden && sheet.dataset.kind === kind) return closeSheet();
  sheet.dataset.kind = kind;
  const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const close = `<button type="button" class="btn btn-ghost btn-sm" data-close aria-label="ปิด">${icon("close")}</button>`;
  if (kind === "offer") {
    sheet.innerHTML = `
      <form class="sheet-form" data-form="offer">
        <div class="sheet-head"><strong>เสนอราคา</strong>${close}</div>
        <label class="field-label" for="s-amount">ราคาที่เสนอ (บาท) · ราคาประกาศ ${formatPrice({ type: room.productType, price: room.productPrice })}</label>
        <input id="s-amount" type="number" inputmode="numeric" min="1" max="1000000" value="${Math.max(1, Math.round(room.productPrice * .9))}" required>
        <button type="submit" class="btn btn-primary btn-md">ส่งข้อเสนอ</button>
      </form>`;
  } else if (kind === "swap") {
    sheet.innerHTML = `
      <form class="sheet-form" data-form="swap">
        <div class="sheet-head"><strong>เสนอของแลก</strong>${close}</div>
        <label class="field-label" for="s-swap-title">ของที่จะนำมาแลก</label>
        <input id="s-swap-title" type="text" maxlength="100" placeholder="เช่น กระเป๋าสะพายข้าง สภาพดี" required>
        <label class="swap-photo" for="s-swap-img"><span id="s-swap-preview">${icon("camera")} แนบรูป (ไม่บังคับ)</span></label>
        <input id="s-swap-img" type="file" accept="image/*" hidden>
        <button type="submit" class="btn btn-primary btn-md">ส่งข้อเสนอแลก</button>
      </form>`;
    sheet.querySelector("#s-swap-img").addEventListener("change", async e => {
      try {
        const data = await resizeImage(e.target.files[0], 800);
        sheet.dataset.img = data;
        sheet.querySelector("#s-swap-preview").innerHTML = `<img src="${data}" alt="รูปของที่จะแลก">`;
      } catch (ex) { toast(ex.message); }
    });
  } else if (kind === "meetup") {
    const s = await settingsReady;
    const points = [...new Set([room.productPickup,
      ...(Array.isArray(s.pickupPoints) && s.pickupPoints.length ? s.pickupPoints : DEFAULT_PICKUP_POINTS)].filter(Boolean))];
    sheet.innerHTML = `
      <form class="sheet-form" data-form="meetup">
        <div class="sheet-head"><strong>นัดรับในมหาวิทยาลัย</strong>${close}</div>
        <label class="field-label" for="s-place">จุดนัดรับ</label>
        <select id="s-place">${points.map(p => `<option>${esc(p)}</option>`).join("")}</select>
        <div class="sheet-row">
          <div><label class="field-label" for="s-date">วัน</label><input id="s-date" type="date" min="${today}" value="${today}" required></div>
          <div><label class="field-label" for="s-time">เวลา</label><input id="s-time" type="time" value="12:00" required></div>
        </div>
        <p class="field-hint">แนะนำนัดในที่สาธารณะช่วงกลางวัน</p>
        <button type="submit" class="btn btn-primary btn-md">ส่งนัดหมาย</button>
      </form>`;
  } else if (kind === "contact") {
    sheet.innerHTML = `
      <form class="sheet-form" data-form="contact">
        <div class="sheet-head"><strong>ส่งช่องทางติดต่อ</strong>${close}</div>
        <label class="field-label" for="s-contact">ช่องทางที่ต้องการให้ ${esc(room.otherName)}</label>
        <input id="s-contact" type="text" maxlength="100" placeholder="เช่น Line: myid หรือ 08x-xxx-xxxx" required>
        <p class="field-hint">ระบบไม่แสดงเบอร์หรือ Line ของใครให้อัตโนมัติ ส่งเฉพาะเมื่อคุณมั่นใจ</p>
        <button type="submit" class="btn btn-primary btn-md">ส่งให้ในแชตนี้</button>
      </form>`;
  }
  sheet.hidden = false;
  const first = sheet.querySelector("input:not([type=file]), select");
  if (first) first.focus();
}

function closeSheet() {
  const sheet = document.getElementById("sheet");
  if (!sheet) return;
  sheet.hidden = true;
  sheet.innerHTML = "";
  delete sheet.dataset.img;
}

pane.addEventListener("submit", async e => {
  const form = e.target.closest("[data-form]");
  if (form) {
    e.preventDefault();
    const kind = form.dataset.form;
    const v = id => form.querySelector("#" + id).value;
    let ok = false;
    if (kind === "offer") ok = await send("offer", "", { amount: Number(v("s-amount")) });
    if (kind === "swap") ok = await send("swap", "", { title: v("s-swap-title"), img: document.getElementById("sheet").dataset.img || "" });
    if (kind === "meetup") ok = await send("meetup", "", { place: v("s-place"), date: v("s-date"), time: v("s-time") });
    if (kind === "contact") ok = await send("contact", v("s-contact"));
    if (ok) closeSheet();
    return;
  }
  const rate = e.target.closest(".passed-rate");
  if (rate) {
    e.preventDefault();
    const stars = Number(rate.dataset.stars || 0);
    if (!stars) return toast("กรุณาเลือกจำนวนดาว");
    try {
      await api(`/products/${room.productId}/reviews`, {
        method: "POST", body: { stars, comment: rate.querySelector("input").value }
      });
      myReview = { stars };
      renderMessages(false);
      toast("ขอบคุณสำหรับรีวิว", "heart");
    } catch (ex) { toast(ex.message); }
  }
  const report = e.target.closest(".report-form");
  if (report) {
    e.preventDefault();
    const reason = report.querySelector("select").value;
    if (!reason) return toast("กรุณาเลือกเหตุผล");
    try {
      await api(`/chats/${roomId}/report`, { method: "POST", body: { reason, detail: report.querySelector("textarea").value } });
      document.getElementById("room-panel").innerHTML = `<p class="report-done">ส่งรายงานแล้ว ผู้ดูแลระบบจะตรวจสอบโดยเร็ว</p>`;
    } catch (ex) { toast(ex.message); }
  }
});

/* ---------- ปุ่มต่างๆ ในห้อง ---------- */
pane.addEventListener("click", async e => {
  const t = e.target;
  const star = t.closest(".passed-rate [data-star]");
  if (star) {
    const form = star.closest(".passed-rate");
    const n = Number(star.dataset.star);
    form.dataset.stars = n;
    form.querySelectorAll("[data-star]").forEach(s => {
      s.classList.toggle("on", Number(s.dataset.star) <= n);
      s.classList.remove("pop");
      s.getBoundingClientRect();
      if (Number(s.dataset.star) <= n) s.classList.add("pop");
    });
    return;
  }
  if (t.closest("[data-close]")) return closeSheet();
  const sheetBtn = t.closest("[data-sheet]");
  if (sheetBtn) return openSheet(sheetBtn.dataset.sheet);
  const quick = t.closest("[data-quick]");
  if (quick) return send("text", quick.dataset.quick);
  const copy = t.closest("[data-copy]");
  if (copy) {
    try { await navigator.clipboard.writeText(copy.dataset.copy); toast("คัดลอกแล้ว"); } catch (ex) { toast("คัดลอกไม่สำเร็จ"); }
    return;
  }
  const back = t.closest(".room-back");
  if (back && matchMedia("(max-width: 860px)").matches) {
    e.preventDefault();
    history.pushState(null, "", "messages.html");
    openRoom(0, false);
    loadList();
    return;
  }

  const respond = t.closest("[data-respond]");
  if (respond) {
    respond.disabled = true;
    try {
      await api(`/chats/messages/${respond.dataset.mid}/respond`, { method: "POST", body: { action: respond.dataset.respond } });
      await refresh();
    } catch (ex) { toast(ex.message); respond.disabled = false; }
    return;
  }

  const act = t.closest("[data-act]");
  if (!act) return;
  const a = act.dataset.act;
  const menu = pane.querySelector(".room-menu");
  if (a === "menu") { menu.hidden = !menu.hidden; return; }
  if (menu) menu.hidden = true;

  try {
    if (a === "request") {
      await send("request");
    } else if (a === "passed") {
      if (!act.dataset.confirm) {
        act.dataset.confirm = "1";
        act.querySelector("span").textContent = "ยืนยันส่งต่อ?";
        return;
      }
      await api(`/chats/${roomId}/passed`, { method: "POST" });
      celebratePassed(act);
      await refresh();
    } else if (a === "block") {
      const block = !room.blockedByMe;
      if (block && !confirm(`บล็อก ${room.otherName}? ทั้งสองฝ่ายจะส่งข้อความในห้องนี้ไม่ได้จนกว่าจะปลดบล็อก`)) return;
      await api(`/chats/${roomId}/block`, { method: "POST", body: { block } });
      toast(block ? "บล็อกแล้ว" : "ปลดบล็อกแล้ว");
      await refresh(true);
    } else if (a === "report") {
      const panel = document.getElementById("room-panel");
      panel.hidden = false;
      panel.innerHTML = `
        <form class="report-form">
          <div class="sheet-head"><strong>รายงานห้องแชตนี้</strong><button type="button" class="btn btn-ghost btn-sm" data-act="close-panel" aria-label="ปิด">${icon("close")}</button></div>
          <select required aria-label="เหตุผล"><option value="" disabled selected>เลือกเหตุผล</option>
            ${REPORT_CHAT_REASONS.map(x => `<option>${x}</option>`).join("")}</select>
          <textarea rows="2" maxlength="500" placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"></textarea>
          <button type="submit" class="btn btn-secondary btn-md">ส่งรายงานถึงผู้ดูแลระบบ</button>
        </form>`;
    } else if (a === "close-panel") {
      const panel = document.getElementById("room-panel");
      panel.hidden = true;
      panel.innerHTML = "";
    } else if (a === "requesters") {
      const panel = document.getElementById("room-panel");
      if (!panel.hidden) { panel.hidden = true; return; }
      panel.hidden = false;
      panel.innerHTML = `<p class="muted">กำลังโหลด...</p>`;
      const list = await api(`/chats/requesters/${room.productId}`);
      const chosen = list.some(x => x.status === "accepted");
      panel.innerHTML = `
        <div class="sheet-head"><strong>คนที่ขอรับ (${list.length})</strong><button type="button" class="btn btn-ghost btn-sm" data-act="close-panel" aria-label="ปิด">${icon("close")}</button></div>
        ${list.length ? `<div class="list">${list.map(x => `
          <div class="list-row">
            <span><b>${esc(x.name)}</b> <span class="muted">${listTime(x.requestedAt)}</span></span>
            <span class="admin-actions">
              ${statusChip(x.status)}
              ${!chosen && x.status === "pending" ? `<button type="button" class="btn btn-sm btn-primary" data-give="${x.roomId}">ให้คนนี้</button>` : ""}
              ${x.roomId !== roomId ? `<a class="btn btn-sm btn-secondary" href="messages.html?room=${x.roomId}">เปิดแชต</a>` : ""}
            </span>
          </div>`).join("")}</div>` : `<p class="muted">ยังไม่มีใครขอรับ</p>`}`;
    }
  } catch (ex) {
    toast(ex.message);
  }
});

/* เลือกผู้รับจากรายชื่อ */
pane.addEventListener("click", async e => {
  const give = e.target.closest("[data-give]");
  if (!give) return;
  give.disabled = true;
  try {
    await api(`/chats/${give.dataset.give}/give`, { method: "POST" });
    toast("เลือกผู้รับแล้ว");
    document.getElementById("room-panel").hidden = true;
    await refresh(true);
  } catch (ex) { toast(ex.message); give.disabled = false; }
});

document.addEventListener("click", e => {
  const menu = pane.querySelector(".room-menu");
  if (menu && !e.target.closest(".room-menu-wrap")) menu.hidden = true;
});

/* ---------- อัปเดตสด ---------- */
async function refresh(full) {
  if (!roomId) return;
  try {
    const data = await api(`/chats/${roomId}`);
    const changed = full || data.messages.length !== messages.length ||
      JSON.stringify(data.messages.map(m => m.data)) !== JSON.stringify(messages.map(m => m.data)) ||
      data.room.otherReadAt !== room.otherReadAt || data.room.blocked !== room.blocked ||
      data.room.productPassed !== room.productPassed || data.room.requesters !== room.requesters;
    const hadNewFromOther = data.messages.some(m => !rendered.has(m.id) && !m.mine);
    const blockChanged = data.room.blocked !== room.blocked || data.room.blockedByMe !== room.blockedByMe;
    room = data.room;
    messages = data.messages;
    if (data.typing) showTyping(data.typing);
    if (blockChanged || full) {
      const draft = document.getElementById("msg-input");
      const keep = draft ? draft.value : "";
      renderRoom();
      const input = document.getElementById("msg-input");
      if (input) input.value = keep;
    } else if (changed) {
      /* อัปเดตเฉพาะหัวห้อง (สถานะส่งต่อ/จำนวนคนขอ) ไม่แตะช่องพิมพ์ */
      const tmp = document.createElement("div");
      tmp.innerHTML = roomHead();
      pane.querySelector(".room-head").replaceWith(tmp.querySelector(".room-head"));
      renderMessages(false);
      const quick = document.getElementById("quick");
      if (quick) quick.innerHTML = quickBar();
    }
    if (hadNewFromOther) {
      hideTyping();
      markRead();
    }
  } catch (e) { /* เครือข่ายสะดุด ลองใหม่รอบถัดไป */ }
}

let readTimer = null;
function markRead() {
  if (!room || room.adminView || document.hidden) return;
  clearTimeout(readTimer);
  readTimer = setTimeout(async () => {
    try {
      await api(`/chats/${roomId}/read`, { method: "POST" });
      refreshUnread();
      loadList();
    } catch (e) { /* ข้าม */ }
  }, 300);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) { markRead(); refresh(); } });

/* "กำลังพิมพ์" */
function showTyping(name) {
  const el = document.getElementById("typing");
  if (!el) return;
  document.getElementById("typing-name").textContent = `${name} กำลังพิมพ์...`;
  el.hidden = false;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(hideTyping, 4000);
}
function hideTyping() {
  const el = document.getElementById("typing");
  if (el) el.hidden = true;
}

function sendTyping() {
  if (Date.now() - lastTypingSent < 2500 || !room || room.adminView) return;
  lastTypingSent = Date.now();
  if (live && live.typing) live.typing();
  else api(`/chats/${roomId}/typing`, { method: "POST" }).catch(() => {});
}

function startLive() {
  stopLive();
  const id = roomId;
  const poll = setInterval(() => refresh(), POLL_MS);
  live = { stop: () => clearInterval(poll) };
  if (!SUPABASE_MODE) return;
  sbClient().then(sb => {
    if (roomId !== id) return;
    const channel = sb.channel(`room-${id}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `room_id=eq.${id}` }, () => refresh())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_rooms", filter: `id=eq.${id}` }, () => refresh())
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload && payload.userId !== (currentUser && currentUser.id)) showTyping(payload.name);
      })
      .subscribe();
    live = {
      stop: () => { clearInterval(poll); sb.removeChannel(channel); },
      typing: () => channel.send({ type: "broadcast", event: "typing", payload: { userId: currentUser.id, name: currentUser.name } })
    };
  }).catch(() => { /* ใช้การดึงซ้ำเป็นระยะแทน */ });
}

function stopLive() {
  if (live) live.stop();
  live = null;
  hideTyping();
}

/* ---------- เริ่มต้น ---------- */
userReady.then(async () => {
  if (!currentUser) return goLogin();
  if (!CHAT_ENABLED) {
    pane.innerHTML = `<div class="chat-empty">${icon("chat")}<p>แชตใช้ได้เมื่อเชื่อมต่อฐานข้อมูล Supabase</p></div>`;
    listEl.innerHTML = "";
    return;
  }
  listEl.innerHTML = skeletonRows(4);
  await loadList();
  openRoom(roomId, false);
  /* รายการห้องอัปเดตตามข้อความใหม่ */
  document.addEventListener("chat:activity", loadList);
  listTimer = setInterval(loadList, SUPABASE_MODE ? 30000 : 5000);
});
