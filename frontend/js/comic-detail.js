/**
 * ComicsWeb — Chi tiết truyện
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('');
  loadComicDetail();
});

async function loadComicDetail() {
  const comicId = getQueryParam('id');
  if (!comicId) {
    document.getElementById('comic-detail-content').innerHTML =
      '<p class="text-center text-secondary py-5">Không tìm thấy truyện.</p>';
    return;
  }

  try {
    const user = Auth.getCurrentUser();
    const promises = [
      getComicById(comicId),
      getChaptersByComic(comicId),
      getCommentsByComic(comicId),
    ];

    if (user) {
      promises.push(fetchAPI(`/bookmarks?userId=${user.id}&comicId=${comicId}`));
      promises.push(getPurchases(user.id));
      promises.push(getCart(user.id));
    } else {
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
      promises.push(Promise.resolve([]));
    }

    const [comic, chapters, comments, bookmarkInfo, purchases, cart] = await Promise.all(promises);

    if (!comic) throw new Error('Không tìm thấy');

    renderDetail(comic, chapters, comments, bookmarkInfo, purchases, cart);
  } catch (err) {
    console.error(err);
    document.getElementById('comic-detail-content').innerHTML =
      '<p class="text-center text-danger py-5">Lỗi tải dữ liệu truyện.</p>';
  }
}

function renderDetail(comic, chapters, comments = [], bookmarkInfo = [], purchases = [], cart = []) {
  const container = document.getElementById('comic-detail-content');
  const user = Auth.getCurrentUser();
  const genreTags = (comic.genres || []).map(g =>
    `<span class="cw-genre-tag">${g}</span>`
  ).join(' ');

  // Kiểm tra follow
  const isFollowed = bookmarkInfo && bookmarkInfo.length > 0;
  const followBtnHTML = isFollowed
    ? `<button class="btn btn-cw-outline btn-sm mt-2 px-3 py-2 d-flex align-items-center gap-1" onclick="handleUnfollow(${bookmarkInfo[0].id})" style="border-color:var(--text-muted); color:var(--text-muted);">
         <i class="bi bi-heartbreak-fill text-danger"></i> Huỷ theo dõi
       </button>`
    : `<button class="btn btn-cw-primary btn-sm mt-2 px-3 py-2 d-flex align-items-center gap-1" onclick="handleFollow(${comic.id})">
         <i class="bi bi-heart-fill"></i> Theo dõi truyện
       </button>`;

  // Kiểm tra chương đã mua hoặc miễn phí
  const chapterList = chapters.map(ch => {
    // Miễn phí: chương <= 3
    const isFree = ch.chapterNumber <= 3;
    const isUploader = user && comic.uploaderId === user.id;
    const isPurchased = purchases.some(p => p.chapterId === ch.id);
    const isOwned = isFree || isUploader || isPurchased;
    const inCart = cart.some(c => c.chapterId === ch.id);

    if (isOwned) {
      return `
        <a href="reader.html?id=${ch.id}" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
           style="background:var(--bg-surface);color:var(--text-primary);border-color:var(--border-color);">
          <span><i class="bi bi-book text-success me-2"></i> Chương ${ch.chapterNumber}</span>
          <div class="d-flex align-items-center gap-2">
            ${isFree ? '<span class="badge bg-secondary-subtle text-secondary small border border-secondary-subtle" style="font-size:0.7rem;">Miễn phí</span>' : '<span class="badge bg-success-subtle text-success small border border-success-subtle" style="font-size:0.7rem;">Đã sở hữu</span>'}
            <small class="text-muted">${timeAgo(ch.createdAt)}</small>
          </div>
        </a>
      `;
    } else {
      return `
        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
             style="background:var(--bg-surface);color:var(--text-primary);border-color:var(--border-color); cursor:pointer;"
             onclick="openChapterPurchaseModal(${ch.id}, ${ch.chapterNumber}, ${ch.price || 10})">
          <span class="text-secondary"><i class="bi bi-lock-fill text-danger me-2"></i> Chương ${ch.chapterNumber}</span>
          <div class="d-flex align-items-center gap-2">
            ${inCart 
              ? '<span class="badge bg-warning-subtle text-warning small border border-warning-subtle" style="font-size:0.7rem;"><i class="bi bi-cart-check"></i> Đã có trong giỏ</span>'
              : `<span class="badge bg-danger-subtle text-danger small border border-danger-subtle" style="font-size:0.7rem;"><i class="bi bi-coin"></i> ${ch.price || 10} Xu</span>`
            }
            <small class="text-muted">${timeAgo(ch.createdAt)}</small>
          </div>
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `
    <div class="row g-4 anim-fade-in">
      <div class="col-md-4 col-lg-3">
        <img src="../${comic.coverImage}" alt="${comic.title}" class="w-100 rounded-3"
             style="border:2px solid var(--border-color); aspect-ratio: 2/3; object-fit: cover;"
             onerror="this.src='../assets/images/placeholder.svg'">
      </div>
      <div class="col-md-8 col-lg-9">
        <h1 style="font-family:var(--font-heading);font-weight:900;text-transform:uppercase;">
          ${comic.title}
        </h1>
        <div class="d-flex flex-wrap gap-2 mb-3">
          ${genreTags}
          <span class="cw-genre-tag" style="background:rgba(46,204,113,0.15);color:#2ECC71;">
            ${comic.status === 'completed' ? 'Hoàn thành' : 'Đang ra'}
          </span>
        </div>
        <div class="cw-rating mb-3">${renderStars(comic.rating)}</div>
        <p class="text-secondary mb-2"><i class="bi bi-person"></i> <strong>Tác giả:</strong> ${comic.author}</p>
        <p class="text-secondary mb-2"><i class="bi bi-brush"></i> <strong>Hoạ sĩ:</strong> ${comic.artist}</p>
        <p class="text-secondary mb-2"><i class="bi bi-eye"></i> <strong>Lượt xem:</strong> ${formatViews(comic.views)}</p>
        <p class="text-secondary mt-3">${comic.description}</p>
        
        <div class="d-flex flex-wrap gap-2 mt-3">
          ${chapters.length > 0 ? `
            <a href="reader.html?id=${chapters[0].id}" class="btn btn-cw-primary d-flex align-items-center gap-1">
              <i class="bi bi-book-half"></i> Đọc từ đầu
            </a>
          ` : ''}
          ${followBtnHTML}
        </div>
      </div>
    </div>

    <!-- DANH SÁCH CHƯƠNG -->
    <div class="mt-5">
      <h3 style="font-family:var(--font-heading);border-left:4px solid var(--color-primary);padding-left:1rem;">
        Danh sách chương (${chapters.length})
      </h3>
      <div class="list-group mt-3">${chapterList || '<p class="text-muted">Chưa có chương nào.</p>'}</div>
    </div>

    <!-- PHẦN BÌNH LUẬN -->
    <div class="mt-5 border-top pt-4">
      <h3 style="font-family:var(--font-heading);border-left:4px solid var(--color-primary);padding-left:1rem;" class="mb-4">
        Bình luận (${comments.length})
      </h3>
      
      <!-- Khung nhập bình luận -->
      <div class="p-3 rounded mb-4" style="background:var(--bg-card); border:1px solid var(--border-color);">
        ${user
          ? `
            <div class="d-flex align-items-start gap-3">
              <img src="${user.avatar ? user.avatar : '../assets/images/placeholder.svg'}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1.5px solid var(--color-primary);" onerror="this.src='../assets/images/placeholder.svg'">
              <div class="flex-grow-1">
                <textarea id="comment-textarea" class="cw-form-input w-100 mb-2" rows="3" placeholder="Nhập bình luận của bạn tại đây..."></textarea>
                <div class="text-end">
                  <button onclick="handlePostComment(${comic.id})" class="btn btn-cw-primary btn-sm px-4">Gửi bình luận</button>
                </div>
              </div>
            </div>
          `
          : `
            <div class="text-center py-3 text-secondary">
              <i class="bi bi-chat-left-dots" style="font-size:1.5rem;"></i>
              <p class="mt-2 mb-0">Bạn cần <a href="login.html" class="text-danger fw-semibold">Đăng nhập</a> để tham gia bình luận.</p>
            </div>
          `
        }
      </div>

      <!-- Danh sách bình luận -->
      <div class="d-flex flex-column gap-3">
        ${comments.length > 0
          ? comments.map(comm => {
              const isOwner = user && (user.id === comm.userId || Auth.isAdmin());
              return `
                <div class="p-3 rounded" style="background:var(--bg-surface); border:1px solid var(--border-color);">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <img src="${comm.userAvatar ? comm.userAvatar : '../assets/images/placeholder.svg'}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color);" onerror="this.src='../assets/images/placeholder.svg'">
                      <div>
                        <strong style="color:var(--text-primary); font-size:0.9rem;">${comm.userDisplayName}</strong>
                        <span class="text-muted small ms-2">${timeAgo(comm.createdAt)}</span>
                      </div>
                    </div>
                    ${isOwner
                      ? `<button onclick="handleDeleteComment(${comm.id})" class="btn btn-sm text-danger p-0 bg-transparent border-0" title="Xoá bình luận"><i class="bi bi-trash"></i></button>`
                      : ''
                    }
                  </div>
                  <p class="mb-0 text-secondary" style="font-size:0.95rem; white-space:pre-wrap; padding-left:42px;">${comm.content}</p>
                </div>
              `;
            }).join('')
          : '<p class="text-muted text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm xúc!</p>'
        }
      </div>
    </div>
  `;
}

/* ===============================
   CHAPTER PURCHASE MODAL
================================ */

function openChapterPurchaseModal(chapterId, chapterNumber, price) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để mua chương truyện', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  // Remove existing modal if any
  const oldModal = document.getElementById('chapterPurchaseModal');
  if (oldModal) oldModal.remove();

  const modalHTML = `
    <div class="modal fade" id="chapterPurchaseModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary);">
          <div class="modal-header" style="border-bottom:1px solid var(--border-color);">
            <h5 class="modal-title" style="font-family:var(--font-heading); text-transform:uppercase;">
              <i class="bi bi-lock-fill text-danger"></i> Mở khoá chương truyện
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center py-4">
            <h6 class="text-secondary mb-3">Chương ${chapterNumber}</h6>
            <p class="mb-4">Chương này đang khoá. Bạn cần mua để đọc.</p>
            
            <div class="d-flex justify-content-around align-items-center p-3 rounded mb-4" style="background:var(--bg-surface); border:1px solid var(--border-color);">
              <div>
                <small class="text-secondary d-block">Giá mở khoá</small>
                <strong class="text-danger" style="font-size:1.4rem;"><i class="bi bi-coin text-warning"></i> ${price} Xu</strong>
              </div>
              <div style="border-left:1px solid var(--border-color); height:40px;"></div>
              <div>
                <small class="text-secondary d-block">Xu hiện có</small>
                <strong class="text-success" style="font-size:1.4rem;"><i class="bi bi-coin text-warning"></i> ${user.coins !== undefined ? user.coins : 0} Xu</strong>
              </div>
            </div>

            <div class="d-flex flex-column gap-2">
              <button onclick="handleQuickBuy(${chapterId}, ${price})" class="btn btn-cw-primary w-100">
                <i class="bi bi-unlock-fill"></i> Mua ngay (${price} Xu)
              </button>
              <button onclick="handleAddToCart(${chapterId}, ${price})" class="btn btn-cw-outline w-100">
                <i class="bi bi-cart-plus"></i> Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = new bootstrap.Modal(document.getElementById('chapterPurchaseModal'));
  modal.show();
}

async function handleQuickBuy(chapterId, price) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  const currentCoins = user.coins !== undefined ? user.coins : 0;
  if (currentCoins < price) {
    showToast('Tài khoản của bạn không đủ xu. Vui lòng nạp thêm tại trang cá nhân!', 'error');
    bootstrap.Modal.getInstance(document.getElementById('chapterPurchaseModal')).hide();
    return;
  }

  try {
    const comicId = getQueryParam('id');
    // Trừ xu
    const newCoins = currentCoins - price;
    await updateUserCoins(user.id, newCoins);
    
    // Tạo lịch sử mua
    await createPurchase(user.id, parseInt(comicId), chapterId, price);

    showToast('Mua chương thành công! Đang mở chương đọc...', 'success');
    bootstrap.Modal.getInstance(document.getElementById('chapterPurchaseModal')).hide();
    
    setTimeout(() => {
      window.location.href = `reader.html?id=${chapterId}`;
    }, 1000);
  } catch (err) {
    showToast('Mua chương thất bại. Vui lòng thử lại!', 'error');
  }
}

async function handleAddToCart(chapterId, price) {
  const user = Auth.getCurrentUser();
  if (!user) return;

  try {
    const comicId = getQueryParam('id');
    await addToCart(user.id, parseInt(comicId), chapterId, price);
    showToast('Đã thêm chương truyện vào giỏ hàng!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('chapterPurchaseModal')).hide();
    
    // Load lại trang để hiển thị trạng thái đã có trong giỏ hàng
    loadComicDetail();
  } catch (err) {
    showToast('Lỗi thêm giỏ hàng. Vui lòng thử lại!', 'error');
  }
}

/* ===============================
   FOLLOW & UNFOLLOW
================================ */

async function handleFollow(comicId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để theo dõi truyện', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  try {
    await addBookmark(user.id, comicId);
    showToast('Đã theo dõi truyện thành công!', 'success');
    loadComicDetail();
  } catch (err) {
    showToast('Theo dõi thất bại. Vui lòng thử lại!', 'error');
  }
}

async function handleUnfollow(bookmarkId) {
  try {
    await removeBookmark(bookmarkId);
    showToast('Đã huỷ theo dõi truyện!', 'success');
    loadComicDetail();
  } catch (err) {
    showToast('Huỷ theo dõi thất bại. Vui lòng thử lại!', 'error');
  }
}

/* ===============================
   COMMENTS HANDLERS
================================ */

async function handlePostComment(comicId) {
  const textarea = document.getElementById('comment-textarea');
  if (!textarea) return;
  const content = textarea.value.trim();
  if (!content) {
    showToast('Nội dung bình luận không được trống!', 'warning');
    return;
  }

  try {
    await addComment(comicId, content);
    showToast('Đăng bình luận thành công!', 'success');
    loadComicDetail();
  } catch (err) {
    showToast('Đăng bình luận thất bại!', 'error');
  }
}

async function handleDeleteComment(commentId) {
  const confirmDelete = confirm('Bạn có chắc muốn xoá bình luận này?');
  if (!confirmDelete) return;

  try {
    await deleteComment(commentId);
    showToast('Đã xoá bình luận!', 'success');
    loadComicDetail();
  } catch (err) {
    showToast('Xoá bình luận thất bại!', 'error');
  }
}

