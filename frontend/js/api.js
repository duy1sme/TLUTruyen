/**
 * ComicsWeb — API Module
 * Fetch wrapper + CRUD helpers cho json-server
 */

/**
 * Gọi API chung — tự gắn JWT token nếu có
 * @param {string} endpoint - Đường dẫn API (vd: '/comics')
 * @param {object} options  - fetch options (method, body, ...)
 * @returns {Promise<any>}
 */
async function fetchAPI(endpoint, options = {}) {
  const url = CONFIG.API_BASE_URL + endpoint;
  const token = localStorage.getItem(CONFIG.JWT_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      Auth.logout();
      window.location.href = '/pages/login.html';
      return null;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Lỗi ${response.status}`);
    }

    // DELETE thường trả về 200 với body rỗng
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.error(`[API] ${options.method || 'GET'} ${endpoint}:`, err);
    showToast(err.message || 'Đã xảy ra lỗi kết nối', 'error');
    throw err;
  }
}

/* ─── Comics ────────────────────────────────────────────── */

/** Lấy danh sách truyện (có phân trang, sắp xếp) */
async function getComics(params = {}) {
  const query = new URLSearchParams({
    _page: params.page || 1,
    _limit: params.limit || CONFIG.ITEMS_PER_PAGE,
    _sort: params.sort || 'updatedAt',
    _order: params.order || 'desc',
    ...params.filters,
  }).toString();
  return fetchAPI(`/comics?${query}`);
}

/** Lấy chi tiết 1 truyện theo ID */
async function getComicById(id) {
  return fetchAPI(`/comics/${id}`);
}

/** Tìm kiếm truyện theo tên */
async function searchComics(query) {
  return fetchAPI(`/comics?q=${encodeURIComponent(query)}`);
}

/** Thêm truyện mới (admin) */
async function createComic(data) {
  return fetchAPI('/comics', { method: 'POST', body: JSON.stringify(data) });
}

/** Cập nhật truyện (admin) */
async function updateComic(id, data) {
  return fetchAPI(`/comics/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** Xoá truyện (admin) */
async function deleteComic(id) {
  return fetchAPI(`/comics/${id}`, { method: 'DELETE' });
}

/* ─── Chapters ──────────────────────────────────────────── */

/** Lấy danh sách chương theo comicId */
async function getChaptersByComic(comicId) {
  return fetchAPI(`/chapters?comicId=${comicId}&_sort=chapterNumber&_order=asc`);
}

/** Lấy chi tiết 1 chương */
async function getChapterById(id) {
  return fetchAPI(`/chapters/${id}`);
}

/** Thêm chương mới (admin) */
async function createChapter(data) {
  return fetchAPI('/chapters', { method: 'POST', body: JSON.stringify(data) });
}

/* ─── Genres ────────────────────────────────────────────── */

/** Lấy danh sách thể loại */
async function getGenres() {
  return fetchAPI('/genres');
}

/* ─── Bookmarks ─────────────────────────────────────────── */

/** Lấy bookmarks của user */
async function getBookmarks(userId) {
  return fetchAPI(`/bookmarks?userId=${userId}`);
}

/** Thêm bookmark */
async function addBookmark(userId, comicId) {
  return fetchAPI('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ userId, comicId, createdAt: new Date().toISOString() }),
  });
}

/** Xoá bookmark */
async function removeBookmark(bookmarkId) {
  return fetchAPI(`/bookmarks/${bookmarkId}`, { method: 'DELETE' });
}

/* ─── Reading History ───────────────────────────────────── */

/** Cập nhật lịch sử đọc */
async function updateReadingHistory(userId, comicId, chapterId, lastPage) {
  // Kiểm tra xem đã có record chưa
  const existing = await fetchAPI(`/readingHistory?userId=${userId}&comicId=${comicId}`);
  const data = { userId, comicId, chapterId, lastPage, updatedAt: new Date().toISOString() };

  if (existing && existing.length > 0) {
    return fetchAPI(`/readingHistory/${existing[0].id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  return fetchAPI('/readingHistory', { method: 'POST', body: JSON.stringify(data) });
}

/* ─── Cart (Giỏ hàng) ─────────────────────────────────────── */

/** Lấy giỏ hàng của user */
async function getCart(userId) {
  return fetchAPI(`/cart?userId=${userId}`);
}

/** Thêm vào giỏ hàng */
async function addToCart(userId, comicId, chapterId, price) {
  // Tránh add trùng
  const existing = await fetchAPI(`/cart?userId=${userId}&comicId=${comicId}&chapterId=${chapterId}`);
  if (existing && existing.length > 0) {
    return existing[0]; // Đã có rồi thì return luôn
  }
  return fetchAPI('/cart', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      comicId,
      chapterId,
      price,
      createdAt: new Date().toISOString()
    })
  });
}

/** Xoá khỏi giỏ hàng */
async function removeFromCart(cartId) {
  return fetchAPI(`/cart/${cartId}`, { method: 'DELETE' });
}

/* ─── Purchases (Mua truyện/chương) ─────────────────────────── */

/** Lấy danh sách đã mua của user */
async function getPurchases(userId) {
  return fetchAPI(`/purchases?userId=${userId}`);
}

/** Mua một chương truyện */
async function createPurchase(userId, comicId, chapterId, price) {
  return fetchAPI('/purchases', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      comicId,
      chapterId,
      price,
      createdAt: new Date().toISOString()
    })
  });
}

/* ─── User Coins (Xu tài khoản) ────────────────────────────────── */

/** Cập nhật xu của user */
async function updateUserCoins(userId, coins) {
  const result = await fetchAPI(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ coins })
  });
  
  if (result) {
    // Đồng bộ lại local storage
    const currentUser = Auth.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.coins = coins;
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser));
    }
  }
  return result;
}

/* ─── Comments (Bình luận) ────────────────────────────────────── */

/** Lấy danh sách bình luận của truyện */
async function getCommentsByComic(comicId) {
  return fetchAPI(`/comments?comicId=${comicId}&_sort=createdAt&_order=desc`);
}

/** Đăng bình luận mới */
async function addComment(comicId, content) {
  const user = Auth.getCurrentUser();
  if (!user) throw new Error('Vui lòng đăng nhập để bình luận');

  return fetchAPI('/comments', {
    method: 'POST',
    body: JSON.stringify({
      comicId: parseInt(comicId),
      userId: user.id,
      userDisplayName: user.displayName || user.email,
      userAvatar: user.avatar || '',
      content: content,
      createdAt: new Date().toISOString()
    })
  });
}

/** Xoá bình luận */
async function deleteComment(commentId) {
  return fetchAPI(`/comments/${commentId}`, { method: 'DELETE' });
}

/* ─── User Upload & Admin Approval ──────────────────────────── */

/** Đăng truyện mới bởi User (chờ duyệt) */
async function createComicByUser(data) {
  const user = Auth.getCurrentUser();
  if (!user) throw new Error('Vui lòng đăng nhập để thực hiện');

  return fetchAPI('/comics', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      views: 0,
      rating: 5.0,
      totalChapters: 0,
      approved: false,
      uploaderId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  });
}

/** Lấy danh sách truyện đang chờ duyệt */
async function getPendingComics() {
  return fetchAPI('/comics?approved=false');
}

/** Phê duyệt truyện */
async function approveComic(comicId) {
  return fetchAPI(`/comics/${comicId}`, {
    method: 'PATCH',
    body: JSON.stringify({ approved: true })
  });
}

