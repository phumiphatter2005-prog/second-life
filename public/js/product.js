const id = Number(new URLSearchParams(location.search).get("id"));
const detail = document.getElementById("detail");

function favButtonText(on) {
  return on ? `${icon("heart")} อยู่ในรายการโปรดแล้ว` : `${icon("heart")} เพิ่มในรายการโปรด`;
}

function passedText(on) {
  return on ? "ส่งต่อแล้ว (กดเพื่อยกเลิก)" : "ยืนยันว่าส่งต่อแล้ว";
}

function formatDate(ms) {
  return new Date(ms).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

/* ปุ่มสำหรับผู้ซื้อ หรือปุ่มจัดการสำหรับเจ้าของประกาศ */
function actionButtons(p) {
  if (p.isOwner) {
    return `
      <p class="owner-note">นี่คือประกาศของคุณ</p>
      <button id="btn-passed" class="btn-primary">${passedText(p.passed)}</button>
      <button id="btn-delete" class="btn-outline danger">ลบประกาศ</button>`;
  }
  return `
    ${CHAT_ENABLED && p.hasOwner !== false ? `
      <button id="btn-chat" class="btn-primary">${icon("chat")} แชตกับผู้ประกาศ</button>` : ""}
    <button id="btn-fav" class="${CHAT_ENABLED && p.hasOwner !== false ? "btn-outline" : "btn-primary"} btn-fav ${p.isFav ? "on" : ""}">${favButtonText(p.isFav)}</button>
    <button id="btn-contact" class="btn-outline">ติดต่อผู้ขาย</button>
    <p id="contact-box" class="contact-box" hidden>ช่องทางติดต่อ: ${esc(p.contact)}</p>`;
}

/* ประกาศที่ส่งต่อแล้ว: คนที่ไม่ใช่เจ้าของ ผู้รับ หรือแอดมิน เห็นแค่ข้อความนี้ */
function renderRestricted() {
  document.title = "ประกาศนี้ส่งต่อไปแล้ว | Second Life";
  detail.innerHTML = `
    <div class="empty-state passed-gone">
      <span class="passed-gone-icon">${icon("recycle")}</span>
      <h1>ประกาศนี้ส่งต่อไปแล้ว</h1>
      <p class="muted">ของชิ้นนี้ได้เจ้าของใหม่แล้ว ลองดูของชิ้นอื่นที่ยังรอส่งต่ออยู่</p>
      <a class="btn-primary inline" href="search.html">กลับไปหน้าค้นหา</a>
    </div>`;
}

/* บรรทัด "ส่งต่อให้ ... เมื่อ ..." เห็นเฉพาะเจ้าของ ผู้รับ และแอดมิน (ข้อมูลมาเฉพาะคนที่มีสิทธิ์อยู่แล้ว) */
function passedLine(p) {
  if (!p.passed) return "";
  const when = p.passedAt ? ` เมื่อ ${formatDate(p.passedAt)}` : "";
  const text = p.isRecipient ? `คุณได้รับของชิ้นนี้${when}`
    : p.passedToName ? `ส่งต่อให้ <b>${esc(p.passedToName)}</b>${when}`
    : `ส่งต่อให้คนนอกระบบ / ไม่ระบุผู้รับ${when}`;
  return `<p class="passed-line">${icon("recycle")}<span>${text}</span></p>`;
}

function render(p) {
  if (p.restricted) return renderRestricted();
  document.title = p.title + " | Second Life";
  const gallery = Array.isArray(p.images) && p.images.length ? p.images : [p.img];

  detail.innerHTML = `
    <div class="detail">
      <div class="detail-media">
        <img class="detail-img" id="detail-img" src="${esc(p.img)}" alt="${esc(p.title)}">
        ${gallery.length > 1 ? `
          <div class="thumbs" role="list" aria-label="รูปทั้งหมด">
            ${gallery.map((src, i) => `
              <button type="button" role="listitem" class="${i === 0 ? "active" : ""}" data-src="${esc(src)}" title="รูปที่ ${i + 1}">
                <img src="${esc(src)}" alt="" loading="lazy">
              </button>`).join("")}
          </div>` : ""}
      </div>
      <div class="detail-info">
        <div class="detail-badges">
          <span class="badge badge-${p.type}">${TYPE_LABEL[p.type]}</span>
          ${p.passed ? `<span class="status status-ok">ส่งต่อแล้ว</span>` : ""}
        </div>
        <h1>${esc(p.title)}</h1>
        ${ratingLine(p.rating, p.ratingCount)}
        <div class="detail-price price-${p.type}">${formatPrice(p)}</div>
        ${passedLine(p)}
        ${swapValue(p) || swapWish(p) ? `
          <ul class="swap-facts">
            ${swapValue(p) ? `<li>มูลค่าประมาณ <b>${swapValue(p)}</b></li>` : ""}
            ${swapWish(p) ? `<li>อยากแลก: <b>${esc(swapWish(p))}</b></li>` : ""}
          </ul>` : ""}

        <ul class="detail-list">
          <li><span>หมวดหมู่</span>${categoryName(p.category)}</li>
          <li><span>สภาพสินค้า</span><span>${esc(p.condition)}<small>${esc(CONDITION_INFO[p.condition] || "")}</small></span></li>
          <li><span>ประเภท</span>${TYPE_LABEL[p.type]}</li>
          <li><span>จุดนัดรับ</span>${esc(p.pickup)}</li>
        </ul>

        <div class="seller">
          ${avatarHtml(p.sellerName, p.sellerAvatar, "avatar-lg")}
          <div>
            <strong>${esc(p.sellerName)}</strong>
            <div class="seller-rating">${p.sellerRatingCount
              ? `คะแนนผู้ขาย ${ratingLine(p.sellerRating, p.sellerRatingCount)}`
              : "ผู้ขายยังไม่มีคะแนน"}</div>
          </div>
        </div>

        ${actionButtons(p)}
        ${currentUser && currentUser.role === "admin" ? `
          <a class="btn-outline" href="admin.html?tab=products&edit=${p.id}">${icon("edit")}แก้ไขประกาศ (ผู้ดูแลระบบ)</a>` : ""}
        <p class="form-error" id="action-error" hidden></p>

        <h3>รายละเอียดสินค้า</h3>
        <p class="detail-desc">${esc(p.desc)}</p>

        <div class="notice" role="note">
          ${icon("alert")}
          <div>
            <strong>ข้อควรระวังก่อนนัดรับ</strong>
            <ul>
              <li>นัดเจอในที่สาธารณะภายในมหาวิทยาลัย ช่วงกลางวัน</li>
              <li>ตรวจสภาพสินค้าให้ครบก่อนจ่ายเงิน ไม่โอนเงินมัดจำล่วงหน้า</li>
              <li>ไม่ให้ข้อมูลส่วนตัว รหัสผ่าน หรือ OTP กับใคร</li>
              <li>ถ้าพบความผิดปกติ กด "รายงานประกาศ" เพื่อแจ้งผู้ดูแลระบบ</li>
            </ul>
          </div>
        </div>

        ${p.isOwner ? "" : `
          <button id="btn-report" type="button" class="btn btn-ghost btn-sm report-link">${icon("flag")}รายงานประกาศ</button>
          <div id="report-slot"></div>`}
      </div>
    </div>

    <section class="reviews">
      <div class="section-head"><h2>รีวิวและคะแนน</h2></div>
      <div class="reviews-layout">
        <div class="review-summary">
          <div class="big-score">${p.ratingCount ? p.rating.toFixed(1) : "–"}</div>
          ${starsHtml(p.rating)}
          <p class="muted">${p.ratingCount ? `จาก ${p.ratingCount} รีวิว` : "ยังไม่มีรีวิว"}</p>
        </div>
        <div>
          <div id="review-form-slot"></div>
          <div id="review-list" class="review-list"></div>
        </div>
      </div>
    </section>`;

  detail.querySelectorAll(".thumbs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("detail-img").src = btn.dataset.src;
      detail.querySelectorAll(".thumbs button").forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  const showError = msg => {
    const el = document.getElementById("action-error");
    el.textContent = msg;
    el.hidden = !msg;
  };

  if (p.isOwner) {
    const passedBtn = document.getElementById("btn-passed");
    passedBtn.addEventListener("click", async () => {
      /* ยังไม่ส่งต่อ → เลือกก่อนว่าส่งต่อให้ใคร */
      if (!p.passed) return openPassDialog(p, passedBtn, showError);
      try {
        await api(`/products/${p.id}/passed`, { method: "POST" });   // ยกเลิก: ล้างผู้รับด้วย
        render(await api("/products/" + p.id));
      } catch (err) { showError(err.message); }
    });

    const del = document.getElementById("btn-delete");
    del.addEventListener("click", async () => {
      /* กดสองครั้งเพื่อยืนยัน กันลบโดยไม่ตั้งใจ */
      if (!del.dataset.confirm) {
        del.dataset.confirm = "1";
        del.textContent = "กดอีกครั้งเพื่อยืนยันการลบ";
        return;
      }
      try {
        await api("/products/" + p.id, { method: "DELETE" });
        location.href = "favorites.html?tab=mine";
      } catch (err) { showError(err.message); }
    });
  } else {
    const favBtn = document.getElementById("btn-fav");
    favBtn.addEventListener("click", async () => {
      try {
        const on = await toggleFav(p.id);
        if (on !== null) {
          favBtn.innerHTML = favButtonText(on);
          favBtn.classList.toggle("on", on);
          if (on) popHeart(favBtn);
        }
      } catch (err) { showError(err.message); }
    });

    const chatBtn = document.getElementById("btn-chat");
    if (chatBtn) chatBtn.addEventListener("click", async () => {
      if (!currentUser) return goLogin();
      chatBtn.disabled = true;
      try {
        const { roomId } = await api("/chats/open", { method: "POST", body: { productId: p.id } });
        location.href = "messages.html?room=" + roomId;
      } catch (err) {
        showError(err.message);
        chatBtn.disabled = false;
      }
    });

    document.getElementById("btn-contact").addEventListener("click", () => {
      /* ต้องเข้าสู่ระบบก่อนจึงจะเห็นช่องทางติดต่อ */
      if (!currentUser) return goLogin();
      document.getElementById("contact-box").hidden = false;
    });

    document.getElementById("btn-report").addEventListener("click", () => {
      if (!currentUser) return goLogin();
      renderReportForm(p);
    });
  }

  renderReviews(p);
}

/* ---------- หน้าต่าง "ส่งต่อให้ใคร" ----------
   รายชื่อคนที่เคยแชตเรื่องสินค้านี้ + "คนนอกระบบ / ไม่ระบุ" แล้วบันทึกผู้รับและเวลาที่ส่งต่อ */
async function openPassDialog(p, opener, showError) {
  showError("");
  opener.disabled = true;
  let people = [];
  try {
    people = await api(`/products/${p.id}/candidates`);
  } catch (e) {
    /* โหลดรายชื่อไม่ได้ (เช่น ยังไม่ได้รันไฟล์ SQL) ยังเลือก "ไม่ระบุ" ได้ */
    people = [];
  } finally {
    opener.disabled = false;
  }

  const OUTSIDE = "outside";
  const wrap = document.createElement("div");
  wrap.className = "crop-backdrop pass-backdrop";
  wrap.innerHTML = `
    <form class="crop-card pass-card" role="dialog" aria-modal="true" aria-labelledby="pass-title" aria-describedby="pass-help">
      <div class="sheet-head">
        <strong id="pass-title">ส่งต่อให้ใคร?</strong>
        <button type="button" class="btn btn-ghost btn-sm" data-close aria-label="ปิด">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <p class="muted pass-help" id="pass-help">${people.length
        ? `เลือกคนที่ได้รับ “${esc(p.title)}” ผู้รับเท่านั้นที่ให้ดาวรีวิวชิ้นนี้ได้`
        : "ยังไม่มีใครแชตเรื่องสินค้านี้ ถ้าส่งต่อให้คนที่ไม่ได้ใช้เว็บ เลือก “คนนอกระบบ / ไม่ระบุ”"}</p>
      <div class="pass-list" role="radiogroup" aria-labelledby="pass-title">
        ${people.map(u => `
          <label class="pass-option">
            <input type="radio" name="pass-to" value="${esc(u.userId)}">
            ${avatarHtml(u.name, u.avatar)}
            <span class="pass-name">${esc(u.name)}<small>แชตล่าสุด ${formatDate(u.lastAt)}</small></span>
          </label>`).join("")}
        <label class="pass-option">
          <input type="radio" name="pass-to" value="${OUTSIDE}">
          <span class="avatar pass-outside" aria-hidden="true">?</span>
          <span class="pass-name">คนนอกระบบ / ไม่ระบุ<small>ไม่มีใครให้ดาวรีวิวชิ้นนี้ได้</small></span>
        </label>
      </div>
      <p class="form-error" role="alert" hidden></p>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" data-close>ยกเลิก</button>
        <button type="submit" class="btn-primary">ยืนยันส่งต่อแล้ว</button>
      </div>
    </form>`;
  document.body.appendChild(wrap);
  document.documentElement.classList.add("drawer-lock");
  document.querySelectorAll("body > header, body > main, body > footer").forEach(el => { el.inert = true; });

  const form = wrap.querySelector("form");
  const err = form.querySelector(".form-error");
  const close = () => {
    wrap.remove();
    document.documentElement.classList.remove("drawer-lock");
    document.querySelectorAll("[inert]").forEach(el => { el.inert = false; });
    opener.focus();
  };
  wrap.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
  wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
  wrap.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key === "Tab") {
      const items = [...form.querySelectorAll("button, input")].filter(el => el.offsetParent);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  form.querySelector("input[name=pass-to]").focus();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const picked = form.querySelector("input[name=pass-to]:checked");
    if (!picked) { err.textContent = "กรุณาเลือกผู้รับ"; err.hidden = false; return; }
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      const to = picked.value === OUTSIDE ? null : people.find(u => String(u.userId) === picked.value).userId;
      await api(`/products/${p.id}/passed`, { method: "POST", body: { to } });
      close();
      render(await api("/products/" + p.id));
      celebratePassed(document.getElementById("btn-passed"));
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      submit.disabled = false;
    }
  });
}

/* ---------- รายงานประกาศ ---------- */
const REPORT_REASONS = [
  "ข้อมูลหรือรูปไม่ตรงกับสินค้าจริง",
  "สงสัยว่าเป็นการหลอกลวง",
  "สินค้าต้องห้ามหรือผิดกฎหมาย",
  "ข้อความหรือรูปไม่เหมาะสม",
  "ส่งต่อไปแล้วแต่ประกาศยังเปิดอยู่",
  "อื่นๆ"
];

function renderReportForm(p) {
  const slot = document.getElementById("report-slot");
  document.getElementById("btn-report").hidden = true;
  slot.innerHTML = `
    <form class="report-form">
      <strong>รายงานประกาศนี้</strong>
      <select required aria-label="เหตุผลที่รายงาน">
        <option value="" disabled selected>เลือกเหตุผล</option>
        ${REPORT_REASONS.map(r => `<option>${r}</option>`).join("")}
      </select>
      <textarea rows="3" maxlength="500" placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"></textarea>
      <p class="form-error" hidden></p>
      <div class="btn-row">
        <button type="button" class="btn btn-ghost btn-md" data-cancel>ยกเลิก</button>
        <button type="submit" class="btn btn-secondary btn-md">ส่งรายงาน</button>
      </div>
    </form>`;
  const form = slot.querySelector("form");
  const err = form.querySelector(".form-error");
  form.querySelector("[data-cancel]").addEventListener("click", () => {
    slot.innerHTML = "";
    document.getElementById("btn-report").hidden = false;
  });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const reason = form.querySelector("select").value;
    if (!reason) { err.textContent = "กรุณาเลือกเหตุผล"; err.hidden = false; return; }
    const submit = form.querySelector("[type=submit]");
    submit.disabled = true;
    try {
      await api(`/products/${p.id}/report`, {
        method: "POST",
        body: { reason, detail: form.querySelector("textarea").value }
      });
      slot.innerHTML = `<p class="report-done">ส่งรายงานแล้ว ขอบคุณที่ช่วยดูแลชุมชน ผู้ดูแลระบบจะตรวจสอบโดยเร็ว</p>`;
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      submit.disabled = false;
    }
  });
}

/* ---------- รีวิว ---------- */
async function renderReviews(p) {
  const listEl = document.getElementById("review-list");
  listEl.innerHTML = `<div aria-hidden="true">${'<div class="sk-row" style="padding:12px 0"><div class="sk" style="width:32px;height:32px;border-radius:50%"></div><div style="flex:1"><div class="sk sk-line w-30" style="margin-top:0"></div><div class="sk sk-line w-80"></div></div></div>'.repeat(2)}</div>`;
  let reviews = [];
  try {
    reviews = await api(`/products/${p.id}/reviews`);
  } catch (e) {
    listEl.innerHTML = `<p class="empty">โหลดรีวิวไม่สำเร็จ</p>`;
    renderReviewForm(p, null);
    return;
  }

  listEl.innerHTML = reviews.length
    ? reviews.map(r => `
        <div class="review ${r.mine ? "mine" : ""}">
          ${avatarHtml(r.name, r.avatar)}
          <div class="review-body">
            <div class="review-head">
              <strong>${esc(r.name)}${r.mine ? " (คุณ)" : ""}</strong>
              <span class="muted">${formatDate(r.createdAt)}</span>
            </div>
            ${starsHtml(r.stars)}
            ${r.comment ? `<p>${esc(r.comment)}</p>` : ""}
          </div>
        </div>`).join("")
    : `<p class="muted review-empty">ยังไม่มีใครรีวิวสินค้านี้</p>`;

  renderReviewForm(p, reviews.find(r => r.mine));
}

function renderReviewForm(p, mine) {
  const slot = document.getElementById("review-form-slot");
  if (p.isOwner) {
    slot.innerHTML = `<p class="muted review-note">ให้ดาวประกาศของตัวเองไม่ได้</p>`;
    return;
  }
  if (!currentUser) {
    slot.innerHTML = `<button class="btn-outline review-login">เข้าสู่ระบบเพื่อให้ดาว</button>`;
    slot.querySelector("button").addEventListener("click", goLogin);
    return;
  }
  /* กันรีวิวปลอม: ให้ดาวได้เฉพาะผู้รับของชิ้นนี้ */
  if (!p.isRecipient) {
    slot.innerHTML = `<p class="muted review-note">ให้ดาวได้เฉพาะผู้ที่ได้รับของชิ้นนี้ หลังผู้ประกาศยืนยันว่าส่งต่อให้คุณแล้ว</p>`;
    return;
  }

  let stars = mine ? mine.stars : 0;
  slot.innerHTML = `
    <form class="review-form">
      <strong>${mine ? "แก้ไขรีวิวของคุณ" : "ให้คะแนนสินค้านี้"}</strong>
      <div class="star-input" role="radiogroup" aria-label="เลือกจำนวนดาว">
        ${[1, 2, 3, 4, 5].map(n =>
          `<button type="button" role="radio" data-star="${n}" aria-label="${n} ดาว" style="--d:${(n - 1) * 45}ms">★</button>`).join("")}
        <span class="star-label"></span>
      </div>
      <textarea rows="2" maxlength="300" placeholder="เล่าประสบการณ์ เช่น สภาพตรงปก นัดรับตรงเวลา (ไม่บังคับ)">${mine ? esc(mine.comment) : ""}</textarea>
      <p class="form-error" hidden></p>
      <button type="submit" class="btn-primary">${mine ? "บันทึกรีวิว" : "ส่งรีวิว"}</button>
    </form>`;

  const form = slot.querySelector("form");
  const LABELS = ["", "แย่", "พอใช้", "ดี", "ดีมาก", "ยอดเยี่ยม"];
  const paint = n => {
    form.querySelectorAll("[data-star]").forEach(b => {
      b.classList.toggle("on", Number(b.dataset.star) <= n);
      b.setAttribute("aria-checked", Number(b.dataset.star) === stars);
    });
    form.querySelector(".star-label").textContent = LABELS[n];
  };
  paint(stars);

  form.querySelectorAll("[data-star]").forEach(b => {
    b.addEventListener("mouseenter", () => paint(Number(b.dataset.star)));
    b.addEventListener("mouseleave", () => paint(stars));
    b.addEventListener("click", () => {
      stars = Number(b.dataset.star);
      paint(stars);
      /* ดาวที่เลือกเด้งทีละดวง */
      form.querySelectorAll("[data-star]").forEach(s => {
        s.classList.remove("pop");
        s.getBoundingClientRect();
        if (Number(s.dataset.star) <= stars) s.classList.add("pop");
      });
    });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const err = form.querySelector(".form-error");
    if (!stars) {
      err.textContent = "กรุณาเลือกจำนวนดาว";
      err.hidden = false;
      return;
    }
    try {
      await api(`/products/${p.id}/reviews`, {
        method: "POST",
        body: { stars, comment: form.querySelector("textarea").value }
      });
      render(await api("/products/" + p.id));
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });
}

(async () => {
  /* กล่องเทาระหว่างโหลด */
  detail.innerHTML = `
    <div class="detail sk-detail" aria-hidden="true">
      <div class="sk sk-hero"></div>
      <div>
        <div class="sk sk-line w-30"></div>
        <div class="sk sk-line w-80" style="height:28px;margin-top:16px"></div>
        <div class="sk sk-line w-30" style="height:32px;margin-top:16px"></div>
        ${'<div class="sk sk-line w-80" style="margin-top:20px"></div>'.repeat(4)}
        <div class="sk sk-line" style="height:44px;margin-top:24px"></div>
      </div>
    </div>`;
  try {
    await userReady;
    render(await api("/products/" + id));
  } catch (e) {
    detail.innerHTML = `<p class="empty">${esc(e.status === 404 ? "ไม่พบสินค้านี้" : e.message)}</p>`;
  }
})();
