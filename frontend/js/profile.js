/**
 * ComicsWeb — Profile Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('');
  initProfilePage();
});

let currentUserId = null;

async function initProfilePage() {
  const user = Auth.getCurrentUser();
  if (!user) {
    document.getElementById('unauthorized-message').classList.remove('d-none');
    return;
  }

  currentUserId = user.id;
  document.getElementById('profile-dashboard').classList.remove('d-none');

  // Cập nhật thông tin cơ bản
  updateProfileHeader(user);

  // Setup tabs
  setupTabs();

  // Load thể loại cho form đăng truyện
  loadUploadGenres();
}

function updateProfileHeader(user) {
  document.getElementById('user-profile-avatar').src = user.avatar ? user.avatar : '../assets/images/placeholder.svg';
  document.getElementById('user-profile-name').textContent = user.displayName || user.email.split('@')[0];
  document.getElementById('user-profile-email').textContent = user.email;
  document.getElementById('user-profile-coins').textContent = user.coins !== undefined ? user.coins : 0;
  
  // Settings tab prefill
  document.getElementById('settings-avatar-preview').src = user.avatar ? user.avatar : '../assets/images/placeholder.svg';
  document.getElementById('settings-avatar').value = user.avatar || '';
  document.getElementById('settings-display-name').value = user.displayName || '';
  document.getElementById('settings-email').value = user.email;
}

function setupTabs() {
  const buttons = document.querySelectorAll('.profile-nav-btn');
  const tabs = document.querySelectorAll('.profile-tab-content');

  // Check query parameter 'tab'
  const targetTab = getQueryParam('tab');
  if (targetTab) {
    const activeBtn = Array.from(buttons).find(btn => btn.dataset.tab === targetTab);
    if (activeBtn) {
      buttons.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      
      activeBtn.classList.add('active');
      const contentTab = document.getElementById(`tab-${targetTab}`);
      if (contentTab) contentTab.classList.add('active');
      loadTabData(targetTab);
    }
  } else {
    // Mặc định load tab lịch sử đọc
    loadTabData('reading-history');
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add('active');

      loadTabData(tabId);
    });
  });
}

function loadTabData(tabName) {
  switch (tabName) {
    case 'reading-history':
      loadReadingHistory();
      break;
    case 'purchase-history':
      loadPurchaseHistory();
      break;
    case 'cart':
      loadCart();
      break;
    case 'following':
      loadFollowedComics();
      break;
    case 'user-comics':
      loadUploadedComics();
      break;
    case 'settings':
      setupSettingsForm();
      break;
  }
}

/* ==========================================================================
   TAB 1: LỊCH SỬ ĐỌC TRUYỆN
   ========================================================================== */
async function loadReadingHistory() {
  const container = document.getElementById('reading-history-list');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>';

  try {
    const history = await fetchAPI(`/readingHistory?userId=${currentUserId}&_sort=updatedAt&_order=desc`);
    if (!history || history.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-5">Bạn chưa đọc truyện nào.</p>';
      return;
    }

    // Lấy thông tin truyện và chương để mapping
    const [comics, chapters] = await Promise.all([
      getComics({ limit: 999 }),
      fetchAPI('/chapters?_limit=9999')
    ]);

    let html = '';
    history.forEach(hist => {
      const comic = comics.find(c => c.id === hist.comicId);
      const chapter = chapters.find(ch => ch.id === hist.chapterId);
      
      if (comic && chapter) {
        html += `
          <div class="p-3 d-flex align-items-center justify-content-between history-card">
            <div class="d-flex align-items-center gap-3">
              <img src="../${comic.coverImage}" style="width: 50px; height: 75px; object-fit: cover; border-radius: var(--border-radius);" onerror="this.src='../assets/images/placeholder.svg'">
              <div>
                <h6 class="mb-1 fw-bold text-light">${comic.title}</h6>
                <p class="mb-0 text-secondary small">Đã đọc đến: Chương ${chapter.chapterNumber}</p>
                <small class="text-muted">${timeAgo(hist.updatedAt)}</small>
              </div>
            </div>
            <a href="reader.html?id=${chapter.id}" class="btn btn-cw-primary btn-sm px-3">
              Đọc tiếp <i class="bi bi-arrow-right-short"></i>
            </a>
          </div>
        `;
      }
    });

    container.innerHTML = html || '<p class="text-muted text-center py-5">Lỗi ánh xạ dữ liệu lịch sử.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải dữ liệu lịch sử đọc.</p>';
  }
}

/* ==========================================================================
   TAB 2: LỊCH SỬ MUA TRUYỆN
   ========================================================================== */
async function loadPurchaseHistory() {
  const container = document.getElementById('purchase-history-list');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>';

  try {
    const purchases = await getPurchases(currentUserId);
    if (!purchases || purchases.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-5">Bạn chưa mua chương truyện nào.</p>';
      return;
    }

    const [comics, chapters] = await Promise.all([
      getComics({ limit: 999 }),
      fetchAPI('/chapters?_limit=9999')
    ]);

    let html = '';
    purchases.forEach(pur => {
      const comic = comics.find(c => c.id === pur.comicId);
      const chapter = chapters.find(ch => ch.id === pur.chapterId);

      if (comic && chapter) {
        html += `
          <div class="p-3 d-flex align-items-center justify-content-between purchase-card">
            <div class="d-flex align-items-center gap-3">
              <div class="text-warning" style="font-size: 1.5rem;"><i class="bi bi-unlock-fill"></i></div>
              <div>
                <h6 class="mb-1 fw-bold text-light">${comic.title}</h6>
                <p class="mb-0 text-secondary small">Chương ${chapter.chapterNumber}</p>
                <small class="text-muted">Đã mở khóa vào: ${formatDate(pur.createdAt)} — Giá: <strong class="text-danger">${pur.price} xu</strong></small>
              </div>
            </div>
            <a href="reader.html?id=${chapter.id}" class="btn btn-cw-outline btn-sm px-3">
              Đọc ngay <i class="bi bi-book-half"></i>
            </a>
          </div>
        `;
      }
    });

    container.innerHTML = html || '<p class="text-muted text-center py-5">Lỗi ánh xạ dữ liệu lịch sử mua.</p>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải dữ liệu lịch sử mua truyện.</p>';
  }
}

/* ==========================================================================
   TAB 3: GIỎ HÀNG CỦA TÔI
   ========================================================================== */
async function loadCart() {
  const container = document.getElementById('cart-list');
  const checkoutBtn = document.getElementById('checkout-all-btn');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>';
  checkoutBtn.classList.add('d-none');

  try {
    const cart = await getCart(currentUserId);
    if (!cart || cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-secondary">
          <i class="bi bi-cart-x" style="font-size: 3rem;"></i>
          <p class="mt-3">Giỏ hàng của bạn đang trống.</p>
          <a href="search.html" class="btn btn-cw-outline btn-sm mt-2">Dạo kho truyện tranh</a>
        </div>
      `;
      return;
    }

    const [comics, chapters] = await Promise.all([
      getComics({ limit: 999 }),
      fetchAPI('/chapters?_limit=9999')
    ]);

    let html = '';
    let validCartItems = [];

    cart.forEach(item => {
      const comic = comics.find(c => c.id === item.comicId);
      const chapter = chapters.find(ch => ch.id === item.chapterId);

      if (comic && chapter) {
        validCartItems.push(item);
        html += `
          <div class="p-3 d-flex align-items-center justify-content-between cart-card">
            <div class="d-flex align-items-center gap-3">
              <img src="../${comic.coverImage}" style="width: 40px; height: 60px; object-fit: cover; border-radius: var(--border-radius);" onerror="this.src='../assets/images/placeholder.svg'">
              <div>
                <h6 class="mb-1 fw-bold text-light">${comic.title}</h6>
                <p class="mb-0 text-secondary small">Chương ${chapter.chapterNumber}</p>
                <strong class="text-danger small"><i class="bi bi-coin text-warning"></i> ${item.price} Xu</strong>
              </div>
            </div>
            <button onclick="handleRemoveCart(${item.id})" class="btn btn-sm btn-outline-danger px-3 py-1">
              <i class="bi bi-trash"></i> Xoá
            </button>
          </div>
        `;
      }
    });

    container.innerHTML = html;

    if (validCartItems.length > 0) {
      checkoutBtn.classList.remove('d-none');
      checkoutBtn.onclick = () => handleCheckoutAll(validCartItems);
      checkoutBtn.innerHTML = `<i class="bi bi-wallet2"></i> Thanh toán toàn bộ (${validCartItems.length * 10} Xu)`;
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải giỏ hàng.</p>';
  }
}

async function handleRemoveCart(cartId) {
  try {
    await removeFromCart(cartId);
    showToast('Đã xoá chương truyện khỏi giỏ hàng', 'info');
    loadCart();
  } catch (err) {
    showToast('Xoá thất bại!', 'error');
  }
}

async function handleCheckoutAll(cartItems) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const currentCoins = user.coins !== undefined ? user.coins : 0;
  const totalCost = cartItems.reduce((sum, item) => sum + (item.price || 10), 0);

  if (currentCoins < totalCost) {
    showToast(`Không đủ xu! Cần ${totalCost} Xu, bạn hiện có ${currentCoins} Xu. Hãy nạp thêm xu!`, 'error');
    return;
  }

  const confirmPay = confirm(`Xác nhận thanh toán mua ${cartItems.length} chương truyện với tổng giá ${totalCost} Xu?`);
  if (!confirmPay) return;

  try {
    // 1. Trừ xu
    const newCoins = currentCoins - totalCost;
    await updateUserCoins(user.id, newCoins);

    // 2. Thêm vào Purchases và Xoá khỏi giỏ hàng
    const purchasePromises = cartItems.map(item => createPurchase(user.id, item.comicId, item.chapterId, item.price));
    const deletePromises = cartItems.map(item => removeFromCart(item.id));

    await Promise.all([...purchasePromises, ...deletePromises]);

    showToast('Thanh toán giỏ hàng thành công!', 'success');
    
    // Cập nhật lại số dư xu trong sidebar
    document.getElementById('user-profile-coins').textContent = newCoins;

    // Load lại giỏ hàng
    loadCart();
  } catch (err) {
    showToast('Đã xảy ra lỗi trong quá trình thanh toán!', 'error');
  }
}

/* ==========================================================================
   TAB 4: TRUYỆN ĐANG THEO DÕI
   ========================================================================== */
async function loadFollowedComics() {
  const container = document.getElementById('following-list');
  container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>';

  try {
    const bookmarks = await getBookmarks(currentUserId);
    if (!bookmarks || bookmarks.length === 0) {
      container.innerHTML = '<div class="col-12 text-center py-5 text-secondary"><i class="bi bi-heartbreak" style="font-size:3rem;"></i><p class="mt-3">Chưa theo dõi truyện nào.</p></div>';
      return;
    }

    const comics = await getComics({ limit: 999 });
    
    let html = '';
    bookmarks.forEach(book => {
      const comic = comics.find(c => c.id === book.comicId);
      if (comic) {
        const base = getBasePath();
        const genreTags = (comic.genres || []).slice(0, 2).map(g => `<span class="cw-genre-tag">${g}</span>`).join(' ');

        html += `
          <div class="col-12 col-md-6 col-xl-4 mb-3 anim-fade-in">
            <div class="p-3 d-flex gap-3 rounded border" style="background:var(--bg-surface); border-color:var(--border-color);">
              <a href="comic-detail.html?id=${comic.id}">
                <img src="../${comic.coverImage}" style="width: 60px; height: 90px; object-fit: cover; border-radius: var(--border-radius);" onerror="this.src='../assets/images/placeholder.svg'">
              </a>
              <div class="flex-grow-1 d-flex flex-column justify-content-between">
                <div>
                  <a href="comic-detail.html?id=${comic.id}" class="text-decoration-none text-light fw-bold small d-block mb-1">${truncateText(comic.title, 25)}</a>
                  <div class="mb-2">${genreTags}</div>
                </div>
                <button onclick="handleUnfollowProfile(${book.id})" class="btn btn-sm btn-outline-danger py-1" style="font-size:0.75rem;">
                  <i class="bi bi-heartbreak"></i> Bỏ theo dõi
                </button>
              </div>
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html || '<div class="col-12 text-center py-5"><p class="text-muted">Không thể ánh xạ danh sách theo dõi.</p></div>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">Lỗi tải danh sách theo dõi.</p></div>';
  }
}

async function handleUnfollowProfile(bookmarkId) {
  try {
    await removeBookmark(bookmarkId);
    showToast('Đã huỷ theo dõi truyện', 'info');
    loadFollowedComics();
  } catch (err) {
    showToast('Lỗi huỷ theo dõi!', 'error');
  }
}

/* ==========================================================================
   TAB 5: TRUYỆN TỰ ĐĂNG (USER UPLOAD COMIC)
   ========================================================================== */
async function loadUploadedComics() {
  const container = document.getElementById('uploaded-comics-list');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div></div>';

  try {
    const comics = await fetchAPI(`/comics?uploaderId=${currentUserId}&_sort=createdAt&_order=desc`);
    if (!comics || comics.length === 0) {
      container.innerHTML = '<p class="text-muted text-center py-5">Bạn chưa đăng bộ truyện nào. Hãy chia sẻ tác phẩm đầu tay nhé!</p>';
      return;
    }

    let html = '';
    comics.forEach(comic => {
      const badge = comic.approved
        ? '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1" style="font-size:0.7rem;">Đã phê duyệt</span>'
        : '<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1" style="font-size:0.7rem;">Chờ phê duyệt</span>';

      html += `
        <div class="p-3 d-flex align-items-center justify-content-between upload-card">
          <div class="d-flex align-items-center gap-3">
            <img src="../${comic.coverImage}" style="width: 50px; height: 75px; object-fit: cover; border-radius: var(--border-radius);" onerror="this.src='../assets/images/placeholder.svg'">
            <div>
              <h6 class="mb-1 fw-bold text-light">${comic.title}</h6>
              <p class="mb-0 text-secondary small">Tác giả: ${comic.author} — Thể loại: ${comic.genres?.join(', ') || 'Chưa phân loại'}</p>
              <small class="text-muted">Đăng lúc: ${formatDate(comic.createdAt)}</small>
            </div>
          </div>
          <div class="text-end">
            <div class="mb-2">${badge}</div>
            ${comic.approved 
              ? `<a href="comic-detail.html?id=${comic.id}" class="btn btn-cw-outline btn-sm py-1 px-3">Xem trang tổng</a>`
              : '<button class="btn btn-sm btn-secondary py-1 px-3" disabled>Đang đợi duyệt</button>'
            }
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger text-center py-5">Lỗi tải danh sách truyện đã đăng.</p>';
  }
}

async function loadUploadGenres() {
  const container = document.getElementById('upload-genres-checkboxes');
  if (!container) return;

  try {
    const genres = await getGenres();
    container.innerHTML = genres.map(g => `
      <div class="form-check form-check-inline m-0 py-1 pe-3">
        <input class="form-check-input" type="checkbox" name="genres" id="genre-cb-${g.id}" value="${g.slug}">
        <label class="form-check-label text-secondary small" style="cursor:pointer;" for="genre-cb-${g.id}">${g.name}</label>
      </div>
    `).join('');
  } catch (err) { /* silent */ }

  // Listen to form submit
  const form = document.getElementById('upload-comic-form');
  if (form) {
    form.addEventListener('submit', handleUploadComic);
  }
}

async function handleUploadComic(e) {
  e.preventDefault();

  const title = document.getElementById('upload-title').value.trim();
  const author = document.getElementById('upload-author').value.trim();
  const artist = document.getElementById('upload-artist').value.trim();
  const coverImage = document.getElementById('upload-cover').value.trim();
  const description = document.getElementById('upload-desc').value.trim();

  // Get selected genres
  const checkboxes = document.querySelectorAll('input[name="genres"]:checked');
  if (checkboxes.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 thể loại truyện!', 'warning');
    return;
  }
  const genres = Array.from(checkboxes).map(cb => cb.value);

  const slug = slugify(title);

  const comicData = {
    title,
    slug,
    author,
    artist,
    coverImage,
    description,
    genres,
    status: 'ongoing'
  };

  try {
    await createComicByUser(comicData);
    showToast('Đăng truyện thành công! Đang chờ Admin duyệt hiển thị.', 'success');
    
    // Reset form and reload
    document.getElementById('upload-comic-form').reset();
    
    // Collapse form
    const collapseEl = document.getElementById('upload-form-wrapper');
    bootstrap.Collapse.getInstance(collapseEl).hide();

    loadUploadedComics();
  } catch (err) {
    showToast('Đăng truyện thất bại. Vui lòng thử lại!', 'error');
  }
}

/* ==========================================================================
   TAB 6: CÀI ĐẶT THÔNG TIN TÀI KHOẢN
   ========================================================================== */
function setupSettingsForm() {
  const avatarInput = document.getElementById('settings-avatar');
  const previewImg = document.getElementById('settings-avatar-preview');

  // Preview avatar link change
  avatarInput.addEventListener('input', () => {
    const val = avatarInput.value.trim();
    previewImg.src = val ? val : '../assets/images/placeholder.svg';
  });

  const form = document.getElementById('profile-settings-form');
  
  // Tránh add event listener nhiều lần
  form.onsubmit = async (e) => {
    e.preventDefault();

    const user = Auth.getCurrentUser();
    if (!user) return;

    const displayName = document.getElementById('settings-display-name').value.trim();
    const avatar = avatarInput.value.trim();
    const password = document.getElementById('settings-password').value;
    const confirmPassword = document.getElementById('settings-confirm-password').value;

    if (!displayName) {
      showToast('Tên hiển thị không được để trống!', 'warning');
      return;
    }

    let payload = { displayName, avatar };

    // Nếu đổi password
    if (password) {
      if (password.length < 4) {
        showToast('Mật khẩu mới phải từ 4 kí tự trở lên!', 'warning');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp!', 'warning');
        return;
      }
      payload.password = password;
    }

    try {
      const result = await fetchAPI(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (result) {
        // Đồng bộ user mới vào local storage
        const updatedUser = { ...user, ...payload };
        // Delete password field in storage for security
        delete updatedUser.password;
        
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(updatedUser));
        
        showToast('Cập nhật thông tin tài khoản thành công!', 'success');
        
        // Reload UI header and sidebar
        updateProfileHeader(updatedUser);
      }
    } catch (err) {
      showToast('Lỗi cập nhật tài khoản. Vui lòng thử lại!', 'error');
    }
  };
}

/* ==========================================================================
   TAB 7: VÍ TIỀN & NẠP XU ẢO
   ========================================================================== */
async function handleTopupCoins(amount) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const currentCoins = user.coins !== undefined ? user.coins : 0;
  const newCoins = currentCoins + amount;

  try {
    await updateUserCoins(user.id, newCoins);
    
    // Cập nhật giao diện
    document.getElementById('user-profile-coins').textContent = newCoins;
    
    showToast(`Nạp thành công +${amount} Xu vào ví tài khoản!`, 'success');
  } catch (err) {
    showToast('Nạp xu thất bại. Vui lòng thử lại!', 'error');
  }
}
window.handleTopupCoins = handleTopupCoins;
