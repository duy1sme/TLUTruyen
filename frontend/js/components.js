/**
 * ComicsWeb — Shared Components
 * Inject Navbar + Footer vào mọi trang
 *
 * Sử dụng: gọi initComponents() trong DOMContentLoaded
 */

/**
 * Khởi tạo navbar và footer
 * @param {string} activePage - Tên trang hiện tại ('home', 'search', 'login', 'admin')
 */
function initComponents(activePage = '') {
  renderNavbar(activePage);
  renderFooter();
}


function renderNavbar(activePage) {
  const base = getBasePath();
  const user = Auth.getCurrentUser();
  const isLogged = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();

  const activeClass = (page) => activePage === page ? 'active' : '';

  const authButtons = isLogged
    ? `
      <div class="d-flex align-items-center gap-3">
        ${isAdmin ? `<a href="${base}pages/admin/dashboard.html" class="btn btn-sm btn-cw-outline px-3 py-1.5" style="font-size: 0.8rem;">
          <i class="bi bi-speedometer2"></i> Quản trị
        </a>` : ''}
        
        <a href="${base}pages/profile.html?tab=cart" class="text-decoration-none position-relative me-1" title="Giỏ hàng">
          <i class="bi bi-cart3" style="font-size: 1.2rem; color: var(--text-secondary); transition: color var(--transition-fast);"></i>
        </a>

        <span class="text-secondary small d-none d-md-inline">
          <a href="${base}pages/profile.html" class="text-decoration-none d-flex align-items-center gap-2" style="color: var(--text-primary);">
            <img src="${user?.avatar ? user.avatar : base + 'assets/images/placeholder.svg'}" 
                 style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--color-primary);" 
                 onerror="this.src='${base}assets/images/placeholder.svg'">
            <span class="fw-semibold">${user?.displayName || user?.email?.split('@')[0] || ''}</span>
            <span class="badge rounded-pill d-flex align-items-center gap-1" style="background: rgba(230, 36, 41, 0.15); color: #E62429; font-size: 0.75rem; border: 1px solid rgba(230, 36, 41, 0.3);">
              <i class="bi bi-coin text-warning"></i>
              <span>${user?.coins !== undefined ? user.coins : 0} Xu</span>
            </span>
          </a>
        </span>
        <button onclick="Auth.logout(); location.href='${base}index.html';" class="btn btn-sm btn-cw-primary px-3 py-1.5" style="font-size: 0.8rem;">
          <i class="bi bi-box-arrow-right"></i> Đăng xuất
        </button>
      </div>
    `
    : `
      <div class="d-flex gap-2">
        <a href="${base}pages/login.html" class="btn btn-sm btn-cw-outline">Đăng nhập</a>
        <a href="${base}pages/register.html" class="btn btn-sm btn-cw-primary">Đăng ký</a>
      </div>
    `;

  const navHTML = `
    <nav class="navbar navbar-expand-lg cw-navbar" id="mainNavbar">
      <div class="container">
        <a class="navbar-brand" href="${base}index.html">
          Comics<span>Web</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link ${activeClass('home')}" href="${base}index.html">
                <i class="bi bi-house-door"></i> Trang chủ
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${activeClass('search')}" href="${base}pages/search.html">
                <i class="bi bi-search"></i> Tìm kiếm
              </a>
            </li>
          </ul>
          ${authButtons}
        </div>
      </div>
    </nav>
  `;

  // Insert navbar at the beginning of body
  document.body.insertAdjacentHTML('afterbegin', navHTML);
}

function renderFooter() {
  const base = getBasePath();
  const year = new Date().getFullYear();

  const footerHTML = `
    <footer class="cw-footer" id="mainFooter">
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="cw-footer__brand">Comics<span>Web</span></div>
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
              <li><i class="bi bi-envelope"></i> contact@comicsweb.vn</li>
              <li><i class="bi bi-facebook"></i> ComicsWeb Vietnam</li>
            </ul>
          </div>
        </div>
        <div class="cw-footer__bottom">
          © ${year} ComicsWeb. Được xây dựng với ❤️
        </div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML('beforeend', footerHTML);
}
