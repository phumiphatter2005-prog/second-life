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
    <button id="btn-fav" class="btn-primary btn-fav ${p.isFav ? "on" : ""}">${favButtonText(p.isFav)}</button>
    <button id="btn-contact" class="btn-outline">ติดต่อผู้ขาย</button>
    <p id="contact-box" class="contact-box" hidden>ช่องทางติดต่อ: ${esc(p.contact)}</p>`;
}

function render(p) {
  document.title = p.title + " | Second Life";

  detail.innerHTML = `
    <div class="detail">
      <div class="detail-media">
        <img class="detail-img" src="${esc(p.img)}" alt="${esc(p.title)}">
      </div>
      <div class="detail-info">
        <div class="detail-badges">
          <span class="badge badge-${p.type}">${TYPE_LABEL[p.type]}</span>
          ${p.passed ? `<span class="status status-ok">ส่งต่อแล้ว</span>` : ""}
        </div>
        <h1>${esc(p.title)}</h1>
        ${ratingLine(p.rating, p.ratingCount)}
        <div class="detail-price">${formatPrice(p)}</div>

        <ul class="detail-list">
          <li><span>หมวดหมู่</span>${categoryName(p.category)}</li>
          <li><span>สภาพสินค้า</span>${esc(p.condition)}</li>
          <li><span>ประเภท</span>${TYPE_LABEL[p.type]}</li>
          <li><span>จุดนัดรับ</span>${esc(p.pickup)}</li>
        </ul>

        <div class="seller">
          <span class="avatar avatar-lg">${esc(p.sellerName.slice(0, 1))}</span>
          <div>
            <strong>${esc(p.sellerName)}</strong>
            <div class="seller-rating">${p.sellerRatingCount
              ? `คะแนนผู้ขาย ${ratingLine(p.sellerRating, p.sellerRatingCount)}`
              : "ผู้ขายยังไม่มีคะแนน"}</div>
          </div>
        </div>

        ${actionButtons(p)}
        <p class="form-error" id="action-error" hidden></p>

        <h3>รายละเอียดสินค้า</h3>
        <p class="detail-desc">${esc(p.desc)}</p>
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

  const showError = msg => {
    const el = document.getElementById("action-error");
    el.textContent = msg;
    el.hidden = !msg;
  };

  if (p.isOwner) {
    const passedBtn = document.getElementById("btn-passed");
    passedBtn.addEventListener("click", async () => {
      try {
        const { passed } = await api(`/products/${p.id}/passed`, { method: "POST" });
        passedBtn.textContent = passedText(passed);
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
        }
      } catch (err) { showError(err.message); }
    });

    document.getElementById("btn-contact").addEventListener("click", () => {
      /* ต้องเข้าสู่ระบบก่อนจึงจะเห็นช่องทางติดต่อ */
      if (!currentUser) return goLogin();
      document.getElementById("contact-box").hidden = false;
    });
  }

  renderReviews(p);
}

/* ---------- รีวิว ---------- */
async function renderReviews(p) {
  const listEl = document.getElementById("review-list");
  let reviews = [];
  try {
    reviews = await api(`/products/${p.id}/reviews`);
  } catch (e) {
    listEl.innerHTML = `<p class="empty">โหลดรีวิวไม่สำเร็จ</p>`;
  }

  listEl.innerHTML = reviews.length
    ? reviews.map(r => `
        <div class="review ${r.mine ? "mine" : ""}">
          <span class="avatar">${esc(r.name.slice(0, 1))}</span>
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

  let stars = mine ? mine.stars : 0;
  slot.innerHTML = `
    <form class="review-form">
      <strong>${mine ? "แก้ไขรีวิวของคุณ" : "ให้คะแนนสินค้านี้"}</strong>
      <div class="star-input" role="radiogroup" aria-label="เลือกจำนวนดาว">
        ${[1, 2, 3, 4, 5].map(n =>
          `<button type="button" role="radio" data-star="${n}" aria-label="${n} ดาว">★</button>`).join("")}
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
    b.addEventListener("click", () => { stars = Number(b.dataset.star); paint(stars); });
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
  try {
    await userReady;
    render(await api("/products/" + id));
  } catch (e) {
    detail.innerHTML = `<p class="empty">${esc(e.status === 404 ? "ไม่พบสินค้านี้" : e.message)}</p>`;
  }
})();
