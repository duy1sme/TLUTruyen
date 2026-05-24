/**
 * ComicsWeb — Trang đọc truyện (Reader)
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('');
  loadReader();
});

async function loadReader() {
  const chapterId = getQueryParam('id');
  if (!chapterId) return;

  try {
    const chapter = await getChapterById(chapterId);
    if (!chapter) throw new Error('Không tìm thấy chương');

    const comic = await getComicById(chapter.comicId);
    const allChapters = await getChaptersByComic(chapter.comicId);
    const user = Auth.getCurrentUser();

    // KIỂM TRA BẢO MẬT CHƯƠNG KHÓA
    const isFree = chapter.chapterNumber <= 3;
    const isUploader = user && comic.uploaderId === user.id;
    let isOwned = isFree || isUploader || Auth.isAdmin();

    if (!isOwned && user) {
      // Check purchases
      const purchases = await getPurchases(user.id);
      isOwned = purchases.some(p => p.chapterId === chapter.id);
    }

    if (!isOwned) {
      // Chương bị khoá và chưa sở hữu -> Hiện màn hình khoá
      renderLockedScreen(comic, chapter, allChapters);
      return;
    }

    // Đã sở hữu hoặc miễn phí -> Cho phép đọc
    renderReader(comic, chapter, allChapters);

    // Lưu lịch sử đọc nếu đã đăng nhập
    if (user) {
      updateReadingHistory(user.id, comic.id, chapter.id, 1).catch(() => {});
    }
  } catch (err) {
    console.error(err);
    document.getElementById('reader-content').innerHTML =
      '<p class="text-center text-danger py-5">Lỗi tải chương truyện.</p>';
  }
}

function renderReader(comic, chapter, allChapters) {
  const container = document.getElementById('reader-content');
  const currentIdx = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  const pagesHTML = (chapter.pages || []).map((src, i) => `
    <img src="../${src}" alt="Trang ${i + 1}" class="cw-reader__page"
         onerror="this.src='../assets/images/placeholder.svg'">
  `).join('');

  container.innerHTML = `
    <div class="text-center py-3">
      <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <h5 style="color:var(--color-primary);font-family:var(--font-heading);">${comic.title}</h5>
      </a>
      <h6 class="text-secondary">Chương ${chapter.chapterNumber}</h6>
    </div>
    <div class="cw-reader">${pagesHTML}</div>
    <div class="cw-reader__nav container" style="max-width:800px;">
      ${prevChapter
        ? `<a href="reader.html?id=${prevChapter.id}" class="btn btn-cw-outline btn-sm">
            <i class="bi bi-chevron-left"></i> Chương trước
           </a>`
        : '<span></span>'}
      <a href="comic-detail.html?id=${comic.id}" class="btn btn-sm" style="color:var(--text-secondary);">
        <i class="bi bi-list-ul"></i> Mục lục
      </a>
      ${nextChapter
        ? `<a href="reader.html?id=${nextChapter.id}" class="btn btn-cw-primary btn-sm">
            Chương sau <i class="bi bi-chevron-right"></i>
           </a>`
        : '<span></span>'}
    </div>
  `;
}

function renderLockedScreen(comic, chapter, allChapters) {
  const container = document.getElementById('reader-content');
  const currentIdx = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  container.innerHTML = `
    <div class="text-center py-3">
      <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <h5 style="color:var(--color-primary);font-family:var(--font-heading);">${comic.title}</h5>
      </a>
      <h6 class="text-secondary">Chương ${chapter.chapterNumber}</h6>
    </div>
    
    <div class="container my-5 text-center px-3" style="max-width: 500px;">
      <div class="p-5 rounded-4 anim-fade-in" style="background: var(--bg-card); border: 2px solid var(--border-color); box-shadow: var(--shadow-card);">
        <div class="mb-4 text-danger" style="font-size: 4rem;">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <h3 class="mb-3" style="font-family: var(--font-heading); text-transform: uppercase; font-weight: 800;">Chương truyện bị khoá</h3>
        <p class="text-secondary mb-4">Chương này cần mở khoá bằng xu để tiếp tục theo dõi hành trình của các nhân vật.</p>
        
        <div class="p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <span class="text-secondary">Giá mở khoá:</span>
          <strong class="text-danger" style="font-size: 1.25rem;"><i class="bi bi-coin text-warning"></i> ${chapter.price || 10} Xu</strong>
        </div>

        <button onclick="handleQuickBuyReader(${chapter.id}, ${chapter.price || 10}, ${comic.id})" class="btn btn-cw-primary w-100 mb-2 py-2.5">
          <i class="bi bi-unlock-fill"></i> Mua Chương Ngay
        </button>
        <button onclick="handleAddToCartReader(${chapter.id}, ${chapter.price || 10}, ${comic.id})" class="btn btn-cw-outline w-100 py-2.5">
          <i class="bi bi-cart-plus"></i> Thêm vào giỏ hàng
        </button>
      </div>
    </div>

    <div class="cw-reader__nav container" style="max-width:800px; margin-top: 3rem;">
      ${prevChapter
        ? `<a href="reader.html?id=${prevChapter.id}" class="btn btn-cw-outline btn-sm">
            <i class="bi bi-chevron-left"></i> Chương trước
           </a>`
        : '<span></span>'}
      <a href="comic-detail.html?id=${comic.id}" class="btn btn-sm" style="color:var(--text-secondary);">
        <i class="bi bi-list-ul"></i> Mục lục
      </a>
      ${nextChapter
        ? `<a href="reader.html?id=${nextChapter.id}" class="btn btn-cw-primary btn-sm">
            Chương sau <i class="bi bi-chevron-right"></i>
           </a>`
        : '<span></span>'}
    </div>
  `;
}

/* ===============================
   READER BUTTON ACTIONS
================================ */

async function handleQuickBuyReader(chapterId, price, comicId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để mua chương truyện', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  const currentCoins = user.coins !== undefined ? user.coins : 0;
  if (currentCoins < price) {
    showToast('Tài khoản của bạn không đủ xu. Vui lòng nạp thêm tại trang cá nhân!', 'error');
    return;
  }

  try {
    const newCoins = currentCoins - price;
    await updateUserCoins(user.id, newCoins);
    await createPurchase(user.id, comicId, chapterId, price);

    showToast('Mở khoá thành công!', 'success');
    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (err) {
    showToast('Mua chương thất bại!', 'error');
  }
}

async function handleAddToCartReader(chapterId, price, comicId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để thực hiện', 'error');
    return;
  }

  try {
    await addToCart(user.id, comicId, chapterId, price);
    showToast('Đã thêm chương truyện vào giỏ hàng!', 'success');
  } catch (err) {
    showToast('Thêm giỏ hàng thất bại!', 'error');
  }
}

