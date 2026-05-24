/**
 * ComicsWeb — Admin Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {

  initComponents('admin');

  // Kiểm tra quyền admin
  if (!Auth.isAdmin()) {

    document.getElementById('admin-content').innerHTML = `
      <div class="text-center py-5">
        <h3 class="text-danger">
          <i class="bi bi-shield-x"></i> Truy cập bị từ chối
        </h3>

        <p class="text-secondary">
          Bạn cần đăng nhập với tài khoản quản trị viên.
        </p>

        <a href="../login.html" class="btn btn-cw-primary mt-2">
          Đăng nhập
        </a>
      </div>
    `;

    return;
  }

  loadAdminStats();
  loadAdminComicList();
  loadAdminPendingComicList();

});


/* ===============================
   LOAD STATS
================================ */

async function loadAdminStats() {

  const container = document.getElementById('admin-stats');

  if (!container) return;

  try {

    const comics = await getComics({ limit: 999 });

    const totalComics = comics.length;

    const ongoing = comics.filter(
      c => c.status === 'ongoing'
    ).length;

    const totalViews = comics.reduce(
      (sum, c) => sum + (c.views || 0),
      0
    );

    container.innerHTML = `
      <div class="col-md-4 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Tổng truyện
          </h5>

          <h2 style="
            color:var(--color-primary);
            font-family:var(--font-heading);
          ">
            ${totalComics}
          </h2>
        </div>
      </div>

      <div class="col-md-4 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Đang ra
          </h5>

          <h2 style="
            color:var(--color-accent);
            font-family:var(--font-heading);
          ">
            ${ongoing}
          </h2>
        </div>
      </div>

      <div class="col-md-4 mb-3">
        <div class="p-3 rounded-3"
          style="
            background:var(--bg-surface);
            border:1px solid var(--border-color);
          "
        >
          <h5 class="text-secondary mb-1">
            Tổng lượt xem
          </h5>

          <h2 style="
            color:var(--color-success);
            font-family:var(--font-heading);
          ">
            ${formatViews(totalViews)}
          </h2>
        </div>
      </div>
    `;

  } catch (err) {

    console.error(err);

  }

}


/* ===============================
   LOAD COMIC LIST
================================ */

async function loadAdminComicList() {

  const container = document.getElementById('admin-comic-list');

  if (!container) return;

  try {

    const comics = await getComics({ limit: 999, filters: { approved: true } });

    container.innerHTML = `
      <table class="table table-dark table-hover">

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

        <tbody>

          ${comics.map(c => `

            <tr>

              <td>${c.id}</td>

              <td>${c.title}</td>

              <td>${c.author}</td>

              <td>
                <span class="cw-genre-tag">
                  ${c.status === 'completed'
                    ? 'Hoàn thành'
                    : 'Đang ra'}
                </span>
              </td>

              <td>${formatViews(c.views || 0)}</td>

              <td>

                <!-- EDIT -->
               <button
                 class="btn btn-sm btn-cw-outline"
                 onclick="window.location.href='editcomic.html?id=${c.id}'">
                  <i class="bi bi-pencil"></i>
                </button>

                <!-- DELETE -->
                <button
                  class="btn btn-sm btn-outline-danger"
                  onclick="handleDeleteComic(${c.id})"
                >
                  <i class="bi bi-trash"></i>
                </button>

              </td>

            </tr>

          `).join('')}

        </tbody>

      </table>
    `;

  } catch (err) {

    console.error(err);

    container.innerHTML = `
      <p class="text-danger">
        Lỗi tải danh sách truyện.
      </p>
    `;

  }

}


/* ===============================
   DELETE COMIC
================================ */

async function handleDeleteComic(id) {

  const confirmDelete = confirm(
    'Bạn có chắc muốn xoá truyện này không?'
  );

  if (!confirmDelete) return;

  try {

    // Xóa comic
    await deleteComic(id);

    // Reload lại bảng
    await loadAdminComicList();

    alert('Xóa truyện thành công!');

  } catch (err) {

    console.error(err);

    alert('Xóa truyện thất bại!');

  }

}

/* ===============================
   DUYỆT TRUYỆN THÀNH VIÊN ĐĂNG
================================ */

async function loadAdminPendingComicList() {
  const container = document.getElementById('admin-pending-comic-list');
  if (!container) return;

  try {
    const pendingComics = await getPendingComics();
    
    if (pendingComics.length === 0) {
      container.innerHTML = `
        <div class="alert alert-secondary text-center py-4" style="background:var(--bg-surface); border-color:var(--border-color); color:var(--text-secondary);">
          <i class="bi bi-check-circle-fill text-success mb-2" style="font-size:1.5rem; display:block;"></i>
          Không có truyện nào đang chờ phê duyệt.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="table table-dark table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên truyện</th>
            <th>Tác giả</th>
            <th>Thể loại</th>
            <th>Người đăng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${pendingComics.map(c => `
            <tr>
              <td>${c.id}</td>
              <td>${c.title}</td>
              <td>${c.author}</td>
              <td>
                ${(c.genres || []).map(g => `<span class="cw-genre-tag" style="font-size: 0.65rem;">${g}</span>`).join(' ')}
              </td>
              <td>
                <span class="text-secondary small">User ID: ${c.uploaderId || 'Chưa rõ'}</span>
              </td>
              <td>
                <!-- APPROVE -->
                <button class="btn btn-sm btn-success px-3 me-1" onclick="handleApproveComic(${c.id})" title="Phê duyệt hiển thị">
                  <i class="bi bi-check-lg"></i> Duyệt
                </button>
                <!-- DELETE -->
                <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteComicPending(${c.id})" title="Từ chối/Xoá">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-danger">Lỗi tải danh sách truyện chờ duyệt.</p>';
  }
}

async function handleApproveComic(id) {
  const confirmApprove = confirm('Bạn có chắc chắn muốn phê duyệt truyện này hiển thị trên trang chủ không?');
  if (!confirmApprove) return;

  try {
    await approveComic(id);
    alert('Phê duyệt truyện thành công!');
    
    // Reload lists & stats
    loadAdminStats();
    loadAdminComicList();
    loadAdminPendingComicList();
  } catch (err) {
    console.error(err);
    alert('Phê duyệt truyện thất bại!');
  }
}

async function handleDeleteComicPending(id) {
  const confirmDelete = confirm('Bạn có chắc chắn muốn từ chối và xóa truyện này?');
  if (!confirmDelete) return;

  try {
    await deleteComic(id);
    alert('Đã xóa truyện thành công!');
    loadAdminPendingComicList();
  } catch (err) {
    console.error(err);
    alert('Xóa truyện thất bại!');
  }
}