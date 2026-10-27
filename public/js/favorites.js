let tab = new URLSearchParams(location.search).get("tab") === "mine" ? "mine" : "favs";

function emptyState(msg, link, linkText) {
  return `
    <div class="empty-state">
      <p>${msg}</p>
      <a class="btn-primary inline" href="${link}">${linkText}</a>
    </div>`;
}

async function renderFavs() {
  const listEl = document.getElementById("fav-list");
  const countEl = document.getElementById("fav-count");

  if (!currentUser) {
    countEl.textContent = "";
    listEl.innerHTML = emptyState("เข้าสู่ระบบเพื่อดูรายการโปรดและประกาศของคุณ",
      "login.html?next=" + encodeURIComponent(location.pathname), "เข้าสู่ระบบ");
    return;
  }

  try {
    const list = await api(tab === "favs" ? "/favorites" : "/my-products");
    countEl.textContent = list.length ? `ทั้งหมด ${list.length} รายการ` : "";
    listEl.innerHTML = list.length
      ? list.map(productCard).join("")
      : tab === "favs"
        ? emptyState("ยังไม่มีสินค้าในรายการโปรด กด 🤍 บนสินค้าที่สนใจได้เลย", "search.html", "ไปค้นหาสินค้า")
        : emptyState("คุณยังไม่ได้ลงประกาศสินค้า", "post.html", "ลงประกาศสินค้า");
  } catch (e) {
    listEl.innerHTML = `<p class="empty">โหลดไม่สำเร็จ: ${esc(e.message)}</p>`;
  }
}

document.querySelectorAll("#fav-tabs .chip").forEach(btn => {
  btn.classList.toggle("active", btn.dataset.tab === tab);
  btn.addEventListener("click", () => {
    document.querySelectorAll("#fav-tabs .chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    tab = btn.dataset.tab;
    renderFavs();
  });
});

/* เอาหัวใจออกแล้วให้การ์ดหายจากแท็บ "สินค้าที่ชอบ" ทันที */
document.addEventListener("favchange", () => {
  if (tab === "favs") renderFavs();
});

userReady.then(renderFavs);
