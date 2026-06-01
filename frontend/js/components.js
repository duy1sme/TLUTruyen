/**
 * TLUTRUYEN — Module Thành phần dùng chung
 * Xử lý việc hiển thị và khởi tạo các phần tử UI phổ biến.
 */

/* ─── Khởi tạo ─────────────────────────────────────────────── */

/**
 * Khởi tạo tất cả các thành phần dùng chung cho một trang.
 * @param {string} activePage - ID trang hiện tại đang hoạt động ('home', 'search', v.v.).
 */
function initComponents(activePage = '') {
  if (window.location.pathname.endsWith('dashboard.html')) {
    return;
  }
  renderNavbar(activePage);
  renderFooter();
}

/* ─── Thành phần Navbar ───────────────────────────────────────────── */

/**
 * Hiển thị thanh điều hướng chính.
 * @param {string} activePage - ID trang hoạt động để làm nổi bật.
 */
function renderNavbar(activePage) {
  const base = getBasePath();
  const user = Auth.getCurrentUser();
  const isLogged = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();

  const getActiveClass = (page) => activePage === page ? 'active' : '';

  const authSectionHTML = isLogged
    ? _renderUserMenu(user, isAdmin, base)
    : _renderGuestMenu(base);

  const navHTML = `
    <nav class="navbar navbar-expand-lg cw-navbar" id="mainNavbar">
      <div class="container">
        <a class="navbar-brand" href="${base}index.html">
          TLU<span>TRUYEN</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link ${getActiveClass('home')}" href="${base}index.html">
                <i class="bi bi-house-door"></i> Trang chủ
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${getActiveClass('search')}" href="${base}pages/search.html">
                <i class="bi bi-search"></i> Tìm kiếm
              </a>
            </li>
          </ul>
          ${authSectionHTML}
        </div>
      </div>
    </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
}

/** @private */
function _renderUserMenu(user, isAdmin, base) {
  const avatarSrc = user?.avatar ? user.avatar : base + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Người dùng';
  const coins = user?.coins !== undefined ? user.coins : 0;

  return `
    <div class="d-flex align-items-center gap-3">
      ${isAdmin ? `
        <a href="${base}pages/admin/dashboard.html" class="btn btn-sm btn-cw-outline px-3 py-1.5" style="font-size: 0.8rem;">
          <i class="bi bi-speedometer2"></i> Quản trị
        </a>
      ` : ''}
      
      <a href="${base}pages/profile.html?tab=cart" class="text-decoration-none position-relative me-1" title="Giỏ hàng">
        <i class="bi bi-cart3" style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.8); transition: color var(--transition-fast);"></i>
      </a>

      <span class="small d-none d-md-inline">
        <a href="${base}pages/profile.html" class="text-decoration-none d-flex align-items-center gap-2" style="color: var(--text-primary);">
          <img src="${avatarSrc}" 
               style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--color-secondary);" 
               onerror="this.src='${base + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
          <span class="fw-semibold text-white">${displayName}</span>
          <span class="badge rounded-pill d-flex align-items-center gap-1" style="background: rgba(255, 255, 255, 0.15); color: #FFFFFF; font-size: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.3);">
            <i class="bi bi-coin text-warning"></i>
            <span>${coins} Xu</span>
          </span>
        </a>
      </span>
      <button onclick="Auth.logout(); location.href='${base}index.html';" class="btn btn-sm btn-cw-outline px-3 py-1.5 style-logout-btn" style="font-size: 0.8rem; color: #FFFFFF; border-color: rgba(255,255,255,0.5);">
        <i class="bi bi-box-arrow-right"></i> Đăng xuất
      </button>
    </div>
  `;
}

/** @private */
function _renderGuestMenu(base) {
  return `
    <div class="d-flex gap-2">
      <a href="${base}pages/login.html" class="btn btn-sm btn-cw-outline text-white" style="border-color: rgba(255,255,255,0.5);">Đăng nhập</a>
      <a href="${base}pages/register.html" class="btn btn-sm btn-cw-primary" style="background: var(--color-secondary);">Đăng ký</a>
    </div>
  `;
}

/* ─── Thành phần Footer ───────────────────────────────────────────── */

/**
 * Hiển thị footer toàn cục.
 */
function renderFooter() {
  const base = getBasePath();
  const year = new Date().getFullYear();

  const footerHTML = `
    <footer class="cw-footer" id="mainFooter">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="cw-footer__brand">TLU<span>TRUYEN</span></div>
            <p class="cw-footer__text mt-2">
              Website đọc truyện tranh trực tuyến miễn phí.
              Cập nhật nhanh nhất, chất lượng cao nhất.
            </p>
          </div>
          <div class="col-6 col-lg-2">
            <h6 class="cw-footer__heading">Điều hướng</h6>
            <ul class="cw-footer__links">
              <li><a href="${base}index.html">Trang chủ</a></li>
              <li><a href="${base}pages/search.html">Tìm kiếm</a></li>
              <li><a href="#">Thể loại</a></li>
            </ul>
          </div>
          <div class="col-6 col-lg-2">
            <h6 class="cw-footer__heading">Thể loại</h6>
            <ul class="cw-footer__links">
              <li><a href="#">Hành Động</a></li>
              <li><a href="#">Phiêu Lưu</a></li>
              <li><a href="#">Lãng Mạn</a></li>
              <li><a href="#">Giả Tưởng</a></li>
            </ul>
          </div>
          <div class="col-lg-4">
            <h6 class="cw-footer__heading">Liên hệ</h6>
            <ul class="cw-footer__links">
              <li><i class="bi bi-envelope"></i> contact@tlutruyen.vn</li>
              <li><i class="bi bi-facebook"></i> TLUTRUYEN Vietnam</li>
            </ul>
          </div>
        </div>
        <div class="cw-footer__bottom">
          © ${year} TLUTRUYEN. Được xây dựng với ❤️
        </div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
}

/* ─── Thành phần Thẻ Truyện ───────────────────────────────────────── */

/**
 * Hiển thị HTML cho một thẻ truyện duy nhất.
 * @param {object} comic - Đối tượng dữ liệu truyện.
 * @param {number} index - Chỉ số để tạo hiệu ứng trễ animation.
 * @returns {string} Chuỗi HTML.
 */
function renderComicCard(comic, index = 0) {
  const base = getBasePath();
  const statusBadgeHTML = comic.status === 'completed'
    ? '<span class="cw-comic-card__badge cw-comic-card__badge--completed">Hoàn thành</span>'
    : '<span class="cw-comic-card__badge">Đang ra</span>';

  const genreTagsHTML = (comic.genres || [])
    .slice(0, 3)
    .map(genre => `<span class="cw-genre-tag">${genre}</span>`)
    .join('');

  const delayClass = `anim-delay-${(index % 4) + 1}`;
  const imageSrc = getComicImageSrc(comic.coverImage, base);

  return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-4 anim-slide-up ${delayClass}">
      <a href="${base}pages/comic-detail.html?id=${comic.id}" class="text-decoration-none">
        <div class="cw-comic-card">
          <div class="cw-comic-card__cover">
            <img src="${imageSrc}" alt="${escapeHtml(comic.title)}"
                 onerror="this.src='${base + CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
            ${statusBadgeHTML}
          </div>
          <div class="cw-comic-card__body">
            <h5 class="cw-comic-card__title">${escapeHtml(comic.title)}</h5>
            <p class="cw-comic-card__meta">
              <i class="bi bi-eye"></i> ${formatViews(comic.views)}
              &nbsp;·&nbsp;
              <i class="bi bi-book"></i> ${comic.totalChapters || '?'} chương
            </p>
            <div class="cw-comic-card__genres">${genreTagsHTML}</div>
          </div>
        </div>
      </a>
    </div>
  `;
}
