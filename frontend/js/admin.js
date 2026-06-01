/**
 * TLUTRUYEN — Logic Bảng điều khiển Quản trị Redesigned
 * Xử lý thống kê toàn cục, quản lý truyện, quy trình phê duyệt, và CRUD tài khoản nội tuyến.
 */

// Bộ nhớ đệm cục bộ cho dữ liệu tìm kiếm nhanh
let comicsCache = [];
let accountsCache = [];
let pendingComicsCache = [];
let currentEditingAccountId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Khởi tạo các thành phần dùng chung (Bỏ qua navbar/footer chuẩn nhờ bypass)
  initComponents('admin');

  // Kiểm tra bảo mật: Quyền truy cập Admin
  if (!Auth.isAdmin()) {
    _renderAccessDenied();
    return;
  }

  // Khởi tạo trang quản trị mới
  initAdminDashboard();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Khởi tạo chính cho bảng điều khiển quản trị.
 */
async function initAdminDashboard() {
  loadAdminProfile();
  initTabs();
  initSearchListeners();
  
  // Thiết lập trình xử lý biểu mẫu tài khoản
  const accountForm = document.getElementById('account-form');
  if (accountForm) {
    accountForm.addEventListener('submit', handleSaveAccount);
  }

  // Mặc định ẩn biểu mẫu tạo tài khoản ban đầu
  toggleAccountForm(false);

  // Tải dữ liệu bất đồng bộ
  await refreshAllData();
}

/**
 * Làm mới toàn bộ dữ liệu hiển thị.
 */
async function refreshAllData() {
  await loadAdminStats();
  await loadAdminComicList();
  await loadAdminAccountList();
  await loadPendingComicList();
}

/** @private */
function _renderAccessDenied() {
  document.getElementById('admin-content').innerHTML = `
    <div class="text-center py-5">
      <h3 class="text-danger"><i class="bi bi-shield-x"></i> Truy cập bị từ chối</h3>
      <p class="text-secondary">Bạn cần đăng nhập với tài khoản quản trị viên.</p>
      <a href="../login.html" class="btn btn-cw-primary mt-2">Đăng nhập</a>
    </div>
  `;
}

/* ─── Sidebar Profile & Tabs SPA ────────────────────────────── */

/**
 * Tải thông tin tài khoản admin hiện tại lên Sidebar.
 */
function loadAdminProfile() {
  const currentUser = Auth.getCurrentUser();
  if (currentUser) {
    const nameEl = document.getElementById('admin-profile-name');
    const avatarEl = document.getElementById('admin-profile-avatar');
    if (nameEl) nameEl.textContent = currentUser.displayName || currentUser.email.split('@')[0];
    if (avatarEl && currentUser.avatar) {
      avatarEl.src = currentUser.avatar;
    }
  }
}

/**
 * Thiết lập các sự kiện chuyển đổi tab và toggle sidebar di động.
 */
function initTabs() {
  const links = document.querySelectorAll('.admin-sidebar__menu-link[data-tab]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      switchAdminTab(tabId);
    });
  });

  // Toggle sidebar trên điện thoại
  const sidebar = document.getElementById('adminSidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Đóng sidebar khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  }
}

/**
 * Hàm toàn cục chuyển đổi tab nội dung admin.
 * @param {string} tabId - ID của tab muốn hiển thị.
 */
window.switchAdminTab = function(tabId) {
  // Ẩn tất cả tab pane
  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  // Hủy active tất cả menu link
  document.querySelectorAll('.admin-sidebar__menu-link[data-tab]').forEach(link => {
    link.classList.remove('active');
  });

  // Hiển thị tab pane tương ứng
  const targetPane = document.getElementById(`pane-${tabId}`);
  if (targetPane) targetPane.classList.add('active');

  // Active menu link tương ứng
  const targetLink = document.querySelector(`.admin-sidebar__menu-link[data-tab="${tabId}"]`);
  if (targetLink) targetLink.classList.add('active');

  // Đổi tiêu đề trên topbar
  const titles = {
    overview: 'Tổng quan thống kê',
    comics: 'Quản lý danh sách truyện tranh',
    accounts: 'Quản lý tài khoản thành viên',
    pending: 'Phê duyệt truyện thành viên đăng'
  };
  const titleEl = document.getElementById('adminTopbarTitle');
  if (titleEl) titleEl.textContent = titles[tabId] || 'Quản trị hệ thống';

  // Đóng sidebar di động sau khi chọn
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) sidebar.classList.remove('open');
};

/* ─── Tìm kiếm nhanh ────────────────────────────────────────── */

/**
 * Gán sự kiện tìm kiếm trực tiếp có chống rung (debounce) cho truyện và tài khoản.
 */
function initSearchListeners() {
  const comicSearch = document.getElementById('comic-search-input');
  if (comicSearch) {
    comicSearch.addEventListener('input', debounce(() => {
      renderComicTable(comicSearch.value);
    }, CONFIG.DEBOUNCE_DELAY));
  }

  const accountSearch = document.getElementById('account-search-input');
  if (accountSearch) {
    accountSearch.addEventListener('input', debounce(() => {
      renderAccountTable(accountSearch.value);
    }, CONFIG.DEBOUNCE_DELAY));
  }
}

/* ─── Thống kê ─────────────────────────────────────────────────── */

/**
 * Tải và hiển thị thống kê quản trị toàn cục.
 */
async function loadAdminStats() {
  try {
    const comics = await getComics({ limit: 999 });
    
    const stats = {
      total: comics.length,
      ongoing: comics.filter(c => c.status === 'ongoing' && c.approved !== false).length,
      pending: comics.filter(c => c.approved === false).length,
      views: comics.reduce((sum, c) => sum + (c.views || 0), 0)
    };

    // Đổ số liệu vào thẻ HTML mới
    document.getElementById('stat-total-comics').textContent = stats.total;
    document.getElementById('stat-ongoing-comics').textContent = stats.ongoing;
    document.getElementById('stat-pending-comics').textContent = stats.pending;
    document.getElementById('stat-total-views').textContent = formatViews(stats.views);

    // Cập nhật số lượng thông báo phê duyệt chờ ở sidebar
    const badge = document.getElementById('sidebar-pending-badge');
    if (badge) {
      if (stats.pending > 0) {
        badge.textContent = stats.pending;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }
    
  } catch (error) {
    console.error('[ADMIN] Lỗi tải thống kê:', error);
  }
}

/* ─── Quản lý truyện ───────────────────────────────────────────── */

/**
 * Lấy danh sách truyện từ DB và lưu vào bộ nhớ cache.
 */
async function loadAdminComicList() {
  try {
    comicsCache = await getComics({ limit: 999 });
    renderComicTable();
  } catch (error) {
    console.error('[ADMIN] Lỗi tải danh sách truyện:', error);
    document.getElementById('admin-comic-list').innerHTML = '<p class="text-danger p-3">Lỗi tải danh sách truyện.</p>';
  }
}

/**
 * Tạo bảng truyện từ cache kèm lọc từ khóa tìm kiếm.
 */
function renderComicTable(keyword = '') {
  const container = document.getElementById('admin-comic-list');
  if (!container) return;

  const query = keyword.toLowerCase().trim();
  const filteredComics = comicsCache.filter(comic => {
    return (comic.title || '').toLowerCase().includes(query) || 
           (comic.author || '').toLowerCase().includes(query) ||
           String(comic.id).includes(query);
  });

  if (filteredComics.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-secondary">
        <i class="bi bi-inbox fs-3 d-block mb-2 opacity-50"></i>
        Không tìm thấy bộ truyện nào phù hợp.
      </div>
    `;
    return;
  }

  const rowsHTML = filteredComics.map(comic => {
    const coverUrl = getComicImageSrc(comic.coverImage, '../../');
    return `
      <tr>
        <td>${comic.id}</td>
        <td>
          <div class="d-flex align-items-center">
            <img src="${coverUrl}" class="admin-thumbnail-cover me-3" onerror="this.src='../../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
            <span class="fw-bold">${escapeHtml(comic.title)}</span>
          </div>
        </td>
        <td>${escapeHtml(comic.author)}</td>
        <td>
          ${comic.approved === false 
            ? '<span class="badge badge-admin-custom badge-admin-custom--pending">Chờ duyệt</span>'
            : `<span class="badge badge-admin-custom badge-admin-custom--active">${comic.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}</span>`
          }
        </td>
        <td><i class="bi bi-eye text-muted me-1"></i>${formatViews(comic.views || 0)}</td>
        <td>
          <button class="btn btn-sm btn-cw-outline p-1.5" onclick="window.location.href='editcomic.html?id=${comic.id}'" title="Chỉnh sửa truyện & chương">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-info ms-1 p-1.5" onclick="window.open('../comic-detail.html?id=${comic.id}', '_blank')" title="Xem giao diện đọc">
            <i class="bi bi-eye"></i>
          </button>
          ${comic.approved === false ? `
            <button class="btn btn-sm btn-outline-success ms-1 p-1.5" onclick="handleApproveComic(${comic.id})" title="Duyệt xuất bản">
              <i class="bi bi-check-circle"></i>
            </button>
          ` : ''}
          <button class="btn btn-sm btn-outline-danger ms-1 p-1.5" onclick="handleDeleteComic(${comic.id})" title="Xoá vĩnh viễn">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="table admin-table-new align-middle mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên truyện</th>
          <th>Tác giả</th>
          <th>Trạng thái</th>
          <th>Lượt xem</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}

/* ─── Phê duyệt đang chờ ──────────────────────────────────────────── */

/**
 * Tải và hiển thị các bộ truyện đang chờ phê duyệt.
 */
async function loadPendingComicList() {
  const container = document.getElementById('admin-pending-comic-list');
  const overviewContainer = document.getElementById('overview-pending-list');
  if (!container && !overviewContainer) return;

  try {
    const comics = await getComics({ limit: 999 });
    pendingComicsCache = comics.filter(c => c.approved === false);

    const fullTableHTML = await _renderPendingTable(pendingComicsCache, false);
    if (container) container.innerHTML = fullTableHTML;

    // Render bản thu gọn cho tab Tổng quan
    if (overviewContainer) {
      const overviewTableHTML = await _renderPendingTable(pendingComicsCache.slice(0, 5), true);
      overviewContainer.innerHTML = overviewTableHTML;
    }
    
  } catch (error) {
    console.error('[ADMIN] Lỗi tải danh sách chờ:', error);
    if (container) container.innerHTML = '<p class="text-danger p-3">Lỗi tải danh sách chờ duyệt.</p>';
    if (overviewContainer) overviewContainer.innerHTML = '<p class="text-danger p-3">Lỗi tải danh sách chờ duyệt.</p>';
  }
}

/** @private */
async function _renderPendingTable(pending, isOverview = false) {
  if (pending.length === 0) {
    return `
      <div class="text-center py-5 text-secondary">
        <i class="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
        <p class="mb-0">Tuyệt vời! Không có truyện nào đang chờ phê duyệt.</p>
      </div>
    `;
  }

  const rows = await Promise.all(pending.map(async comic => {
    let uploaderName = 'Ẩn danh';
    if (comic.uploaderId) {
      try {
        const uploader = await fetchAPI(`/users/${comic.uploaderId}`);
        uploaderName = uploader?.displayName || uploader?.email || comic.uploaderId;
      } catch(e) {}
    }

    const coverUrl = getComicImageSrc(comic.coverImage, '../../');

    return `
      <tr>
        <td>${comic.id}</td>
        <td>
          <img src="${coverUrl}" class="admin-thumbnail-cover" onerror="this.src='../../${CONFIG.DEFAULTS.PLACEHOLDER_IMAGE}'">
        </td>
        <td>
          <strong class="text-primary">${escapeHtml(comic.title)}</strong>
          ${!isOverview ? `<br><small class="text-muted">${(comic.genres||[]).join(', ')}</small>` : ''}
        </td>
        <td>${escapeHtml(comic.author)}</td>
        <td>${escapeHtml(uploaderName)}</td>
        <td><small class="text-muted">${formatDate(comic.createdAt)}</small></td>
        <td>
          <button class="btn btn-sm btn-outline-info p-1" onclick="window.open('../comic-detail.html?id=${comic.id}', '_blank')" title="Xem trước nội dung">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success ms-1 p-1" onclick="handleApproveComic(${comic.id})" title="Duyệt xuất bản">
            <i class="bi bi-check-circle"></i> Duyệt
          </button>
          <button class="btn btn-sm btn-outline-danger ms-1 p-1" onclick="handleDeleteComic(${comic.id})" title="Từ chối truyện">
            <i class="bi bi-x-circle"></i> Từ chối
          </button>
        </td>
      </tr>
    `;
  }));

  return `
    <table class="table admin-table-new align-middle mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Ảnh</th>
          <th>Tên truyện</th>
          <th>Tác giả</th>
          <th>Người đăng</th>
          <th>Thời gian</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `;
}

/* ─── Quản lý tài khoản ─────────────────────────────────────────── */

/**
 * Tải danh sách người dùng từ cơ sở dữ liệu.
 */
async function loadAdminAccountList() {
  try {
    accountsCache = await getUsers();
    renderAccountTable();
  } catch (error) {
    console.error('[ADMIN] Lỗi tải danh sách tài khoản:', error);
    document.getElementById('admin-account-list').innerHTML = '<p class="text-danger p-3">Lỗi tải danh sách tài khoản.</p>';
  }
}

/**
 * Tạo bảng tài khoản từ cache kèm lọc từ khóa tìm kiếm.
 */
function renderAccountTable(keyword = '') {
  const container = document.getElementById('admin-account-list');
  if (!container) return;

  const query = keyword.toLowerCase().trim();
  const filteredUsers = accountsCache.filter(user => {
    const searchString = `${user.displayName || ''} ${user.username || ''} ${user.email || ''} ${user.role || ''}`.toLowerCase();
    return searchString.includes(query);
  });

  if (filteredUsers.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-secondary">
        <i class="bi bi-inbox fs-3 d-block mb-2 opacity-50"></i>
        Không tìm thấy tài khoản nào khớp với từ khoá.
      </div>
    `;
    return;
  }

  const rowsHTML = filteredUsers.map(user => {
    const username = user.username || user.email?.split('@')[0] || 'Unknown';
    const isLocked = user.status === 'locked';
    
    return `
      <tr>
        <td>${user.id}</td>
        <td>
          <div class="d-flex align-items-center">
            <img src="${user.avatar || '../../assets/images/placeholder.svg'}" class="admin-avatar-small me-2" onerror="this.src='../../assets/images/placeholder.svg'">
            <strong>${escapeHtml(user.displayName || '')}</strong>
          </div>
        </td>
        <td>${escapeHtml(username)}</td>
        <td>${escapeHtml(user.email || '')}</td>
        <td>
          <span class="badge badge-admin-custom ${user.role === 'admin' ? 'badge-admin-custom--admin' : 'badge-admin-custom--user'}">
            ${user.role === 'admin' ? 'Admin' : 'User'}
          </span>
        </td>
        <td>
          <span class="badge badge-admin-custom ${isLocked ? 'badge-admin-custom--locked' : 'badge-admin-custom--active'}">
            ${isLocked ? 'Tạm khóa' : 'Hoạt động'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-cw-outline p-1.5" onclick="startEditAccount(${user.id})" title="Chỉnh sửa tài khoản">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger ms-1 p-1.5" onclick="handleDeleteUserDashboard(${user.id})" title="Xoá vĩnh viễn tài khoản">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <table class="table admin-table-new align-middle mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Họ tên</th>
          <th>Username</th>
          <th>Email</th>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  `;
}

/**
 * Mở/Đóng biểu mẫu tài khoản.
 */
window.toggleAccountForm = function(show = true) {
  const panel = document.getElementById('account-form-panel');
  const btn = document.getElementById('btn-minimize-form');
  if (!panel) return;

  if (show) {
    panel.classList.remove('d-none');
    if (btn) btn.innerHTML = '<i class="bi bi-chevron-up"></i> Thu gọn';
  } else {
    panel.classList.add('d-none');
    if (btn) btn.innerHTML = '<i class="bi bi-chevron-down"></i> Mở rộng';
  }
};

/**
 * Đưa dữ liệu tài khoản lên biểu mẫu chỉnh sửa nội tuyến.
 */
window.startEditAccount = function(id) {
  const user = accountsCache.find(u => Number(u.id) === Number(id));
  if (!user) return;

  currentEditingAccountId = user.id;
  toggleAccountForm(true);

  document.getElementById('account-form-title').innerHTML = '<i class="bi bi-pencil-square text-warning"></i> Chỉnh sửa tài khoản';
  document.getElementById('account-id').value = user.id;
  document.getElementById('fullname').value = user.displayName || '';
  document.getElementById('username').value = user.username || user.email.split('@')[0];
  document.getElementById('email').value = user.email || '';
  
  // Vô hiệu hóa trường mật khẩu khi sửa đổi ở giao diện quản trị nhanh
  const passwordField = document.getElementById('password');
  passwordField.value = '';
  passwordField.placeholder = '(Không thay đổi mật khẩu tại đây)';
  passwordField.disabled = true;
  
  document.getElementById('role').value = user.role || 'user';
  document.getElementById('status').value = user.status || 'active';

  document.getElementById('account-form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/**
 * Đặt lại biểu mẫu về chế độ thêm mới.
 */
window.resetAccountForm = function() {
  currentEditingAccountId = null;
  document.getElementById('account-form-title').innerHTML = '<i class="bi bi-person-plus-fill text-primary"></i> Thêm mới tài khoản';
  document.getElementById('account-form').reset();
  document.getElementById('account-id').value = '';
  
  const passwordField = document.getElementById('password');
  passwordField.disabled = false;
  passwordField.placeholder = 'Nhập mật khẩu khi thêm mới';
};

/**
 * Xử lý lưu (thêm mới / cập nhật) tài khoản nội tuyến.
 */
async function handleSaveAccount(e) {
  e.preventDefault();

  const data = {
    displayName: document.getElementById('fullname').value.trim(),
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value.trim(),
    role: document.getElementById('role').value,
    status: document.getElementById('status').value,
  };

  if (!data.displayName || !data.email) {
    showToast('Vui lòng nhập đầy đủ họ tên và email!', 'warning');
    return;
  }

  if (!currentEditingAccountId && !data.password) {
    showToast('Vui lòng nhập mật khẩu cho tài khoản mới!', 'warning');
    return;
  }

  try {
    if (currentEditingAccountId) {
      // Cập nhật tài khoản
      const { password, ...updateData } = data;
      await updateUser(currentEditingAccountId, { ...updateData, updatedAt: new Date().toISOString() });
      showToast('Cập nhật tài khoản thành công!', 'success');
    } else {
      // Thêm mới tài khoản
      await createUser({ ...data, avatar: '', coins: 0, createdAt: new Date().toISOString() });
      showToast('Thêm tài khoản thành công!', 'success');
    }

    resetAccountForm();
    toggleAccountForm(false);
    await loadAdminAccountList();
    
  } catch (error) {
    console.error('[ADMIN ACCOUNTS] Lỗi lưu:', error);
    showToast('Lưu tài khoản thất bại. Email hoặc username có thể đã tồn tại.', 'error');
  }
}

/* ─── Hành động Admin ──────────────────────────────────────────────── */

/**
 * Phê duyệt một bộ truyện đang chờ xuất bản.
 */
async function handleApproveComic(id) {
  if (!confirm('Duyệt hiển thị bộ truyện này lên trang chủ công khai?')) return;

  try {
    await patchComic(id, { approved: true });
    showToast('Phê duyệt truyện thành công!', 'success');
    await refreshAllData();
    
  } catch (error) {
    showToast('Gặp lỗi khi phê duyệt truyện!', 'error');
  }
}

/**
 * Xóa một bộ truyện và các chương liên quan vĩnh viễn.
 */
async function handleDeleteComic(id) {
  if (!confirm('Hành động này sẽ xoá vĩnh viễn truyện, tất cả chương và ảnh trên hệ thống! Tiếp tục?')) return;

  try {
    const chapters = await getChaptersByComic(id);
    for (const chapter of chapters) {
      await deleteChapter(chapter.id);
    }

    await deleteComic(id);
    showToast('Xoá truyện thành công khỏi hệ thống!', 'info');
    await refreshAllData();
    
  } catch (error) {
    showToast('Xoá truyện thất bại!', 'error');
  }
}

/**
 * Xóa tài khoản người dùng từ bảng điều khiển.
 */
async function handleDeleteUserDashboard(id) {
  const currentUser = Auth.getCurrentUser();
  if (currentUser && Number(currentUser.id) === Number(id)) {
    showToast('Bạn không thể xoá tài khoản chính mình!', 'warning');
    return;
  }

  if (!confirm('Bạn có chắc muốn xoá tài khoản này không? Tất cả dữ liệu của user sẽ biến mất.')) return;

  try {
    await deleteUser(id);
    showToast('Đã xoá tài khoản thành công!', 'success');
    await loadAdminAccountList();
    
  } catch (error) {
    showToast('Xoá tài khoản thất bại!', 'error');
  }
}
