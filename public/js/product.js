const id = Number(new URLSearchParams(location.search).get("id"));
const detail = document.getElementById("detail");

function favButtonText(on) {
  return on ? "❤️ อยู่ในรายการโปรดแล้ว" : "🤍 เพิ่มในรายการโปรด";
}

function passedText(on) {
  return on ? "✅ ส่งต่อแล้ว (กดเพื่อยกเลิก)" : "♻️ ยืนยันว่าส่งต่อแล้ว";
}

/* ปุ่มสำหรับผู้ซื้อ หรือปุ่มจัดการสำหรับเจ้าของประกาศ */
function actionButtons(p) {
  if (p.isOwner) {
    return `
      <p class="owner-note">นี่คือประกาศของคุณ</p>
      <button id="btn-passed" class="btn-primary">${passedText(p.passed)}</button>
      <button id="btn-delete" class="btn-outline danger">🗑️ ลบประกาศ</button>`;
  }
  return `
    <button id="btn-fav" class="btn-primary">${favButtonText(p.isFav)}</button>
    <button id="btn-contact" class="btn-outline">ติดต่อผู้ขาย</button>
    <p id="contact-box" class="contact-box" hidden>📞 ช่องทางติดต่อ: ${esc(p.contact)}</p>`;
}

function render(p) {
  document.title = p.title + " | Second Life";

  detail.innerHTML = `
    <div class="detail">
      <img class="detail-img" src="${esc(p.img)}" alt="${esc(p.title)}">
      <div class="detail-info">
        <span class="badge badge-${p.type}">${TYPE_LABEL[p.type]}</span>
        ${p.passed ? `<span class="badge badge-free">♻️ ส่งต่อแล้ว</span>` : ""}
        <h1>${esc(p.title)}</h1>
        <div class="detail-price">${formatPrice(p)}</div>

        <ul class="detail-list">
          <li><span>หมวดหมู่</span>${categoryName(p.category)}</li>
          <li><span>สภาพสินค้า</span>${esc(p.condition)}</li>
          <li><span>ประเภท</span>${TYPE_LABEL[p.type]}</li>
          <li><span>จุดนัดรับ</span>${esc(p.pickup)}</li>
          <li><span>ผู้ลงประกาศ</span>${esc(p.sellerName)}</li>
        </ul>

        ${actionButtons(p)}
        <p class="form-error" hidden></p>

        <h3>รายละเอียดสินค้า</h3>
        <p class="detail-desc">${esc(p.desc)}</p>
      </div>
    </div>`;

  const showError = msg => {
    const el = detail.querySelector(".form-error");
    el.textContent = msg;
    el.hidden = !msg;
  };

  if (p.isOwner) {
    document.getElementById("btn-passed").addEventListener("click", async e => {
      try {
        const { passed } = await api(`/products/${p.id}/passed`, { method: "POST" });
        e.target.textContent = passedText(passed);
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
    return;
  }

  document.getElementById("btn-fav").addEventListener("click", async e => {
    try {
      const on = await toggleFav(p.id);
      if (on !== null) e.target.textContent = favButtonText(on);
    } catch (err) { showError(err.message); }
  });

  document.getElementById("btn-contact").addEventListener("click", () => {
    /* ต้องเข้าสู่ระบบก่อนจึงจะเห็นช่องทางติดต่อ */
    if (!currentUser) return goLogin();
    document.getElementById("contact-box").hidden = false;
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
