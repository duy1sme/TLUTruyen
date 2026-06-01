/**
 * TLUTRUYEN — Chỉnh sửa Truyện & Quản lý Chương
 * Xử lý cập nhật siêu dữ liệu truyện và đầy đủ các thao tác CRUD chương.
 */

// Trạng thái trang
let currentComic = null;
let currentChapters = [];
let editingChapterId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra bảo mật: Quyền truy cập Admin
  if (!Auth.isAdmin()) {
    window.location.href = '../login.html';
    return;
  }

  initEditComicPage();
});

/* ─── Khởi tạo trang ────────────────────────────────────────── */

/**
 * Khởi tạo chính cho trang chỉnh sửa truyện.
 */
async function initEditComicPage() {
  const comicId = getQueryParam('id');
  if (!comicId) {
    showToast('Không tìm thấy ID truyện', 'error');
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    // 1. Tải dữ liệu
    currentComic = await getComicById(comicId);
    if (!currentComic) throw new Error('Dữ liệu truyện không tồn tại');

    // 2. Điền biểu mẫu
    _fillComicForm(currentComic);
    
    // 3. Tải các chương
    await loadChapters();

    // 4. Đính kèm sự kiện
    _bindComicEvents();
    _bindChapterEvents();
    _setupDragAndDrop();

  } catch (error) {
    console.error('[ADMIN EDIT] Lỗi khởi tạo:', error);
    showToast('Lỗi: ' + error.message, 'error');
  }
}

/* ─── Quản lý thông tin truyện ──────────────────────────────────────── */

/** @private */
function _fillComicForm(comic) {
  document.getElementById('comic-id').value = comic.id || '';
  document.getElementById('comic-title').value = comic.title || '';
  document.getElementById('comic-author').value = comic.author || '';
  document.getElementById('comic-artist').value = comic.artist || '';
  document.getElementById('comic-description').value = comic.description || '';
  document.getElementById('comic-genres').value = (comic.genres || []).join(', ');

  const preview = document.getElementById('comic-cover-preview');
  if (preview && comic.coverImage) {
    preview.src = getComicImageSrc(comic.coverImage, '../../');
  }
}

/** @private */
function _bindComicEvents() {
  const form = document.getElementById('edit-comic-form');
  if (form) form.addEventListener('submit', handleSaveComic);
}

/**
 * Xử lý lưu siêu dữ liệu truyện.
 */
async function handleSaveComic(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-save-comic');

  const title = document.getElementById('comic-title').value.trim();
  const coverFile = document.getElementById('comic-cover').files[0];

  if (!title) { showToast('Tiêu đề không được để trống!', 'warning'); return; }

  try {
    if (submitBtn) submitBtn.disabled = true;

    // 1. Xử lý tải lên Ảnh bìa (nếu thay đổi)
    let coverPath = currentComic.coverImage;
    if (coverFile) {
      coverPath = await _uploadCover(title, coverFile);
    }

    // 2. Chuẩn bị dữ liệu
    const updatedComic = {
      ...currentComic,
      title,
      slug: slugify(title),
      author: document.getElementById('comic-author').value.trim(),
      artist: document.getElementById('comic-artist').value.trim(),
      description: document.getElementById('comic-description').value.trim(),
      genres: document.getElementById('comic-genres').value.split(',').map(g => slugify(g.trim())).filter(Boolean),
      coverImage: coverPath,
      updatedAt: new Date().toISOString()
    };

    // 3. Lưu lên máy chủ
    await updateComic(currentComic.id, updatedComic);
    currentComic = updatedComic;
    showToast('Lưu thông tin thành công!', 'success');

  } catch (error) {
    console.error('[ADMIN EDIT] Lỗi lưu:', error);
    showToast('Lỗi khi lưu thông tin.', 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

/** @private */
async function _uploadCover(title, file) {
  const base64 = await _toBase64(file);
  const response = await fetch(`${CONFIG.API_BASE_URL}/api/upload-comic-media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comicTitle: title,
      coverFile: { name: file.name, base64: base64 },
      pages: []
    })
  });

  if (!response.ok) throw new Error('Upload ảnh bìa thất bại');
  const result = await response.json();
  
  // Dọn dẹp tệp cũ (logic tùy chọn từ bản gốc)
  if (currentComic.coverImage && !currentComic.coverImage.includes('placeholder')) {
    fetch(`${CONFIG.API_BASE_URL}/api/delete-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: currentComic.coverImage })
    }).catch(e => console.warn('Dọn dẹp ảnh bìa cũ thất bại', e));
  }

  return result.data.coverImage;
}

/* ─── Quản lý Chương ─────────────────────────────────────────── */

/**
 * Tải và hiển thị bảng các chương.
 */
async function loadChapters() {
  try {
    currentChapters = await getChaptersByComic(currentComic.id) || [];
    _renderChaptersTable(currentChapters);
  } catch (error) {
    console.error('[ADMIN EDIT] Lỗi tải chương:', error);
    _renderChaptersTable([]);
  }
}

/** @private */
function _renderChaptersTable(chapters) {
  const tbody = document.getElementById('chapters-tbody');
  const emptyRow = document.getElementById('chapters-empty-row');
  if (!tbody) return;

  // Xóa hiện tại
  [...tbody.querySelectorAll('tr:not(#chapters-empty-row)')].forEach(r => r.remove());

  if (chapters.length === 0) {
    if (emptyRow) emptyRow.style.display = '';
    return;
  }

  if (emptyRow) emptyRow.style.display = 'none';

  chapters.forEach(ch => {
    const pageCount = (ch.pages || []).length;
    const price = ch.price || 0;
    const priceBadge = price > 0 
      ? `<span class="badge bg-warning text-dark"><i class="bi bi-coin me-1"></i>${price} xu</span>` 
      : `<span class="badge bg-success">Miễn phí</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-bold text-primary">${ch.chapterNumber}</td>
      <td>${escapeHtml(ch.title || 'Chương ' + ch.chapterNumber)}</td>
      <td class="text-center text-muted small">${pageCount} trang</td>
      <td class="text-center">${priceBadge}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary me-1" onclick="onEditChapter(${ch.id})" title="Sửa"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="onDeleteChapter(${ch.id}, '${escapeHtml(ch.title || '')}')" title="Xoá"><i class="bi bi-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/** @private */
function _bindChapterEvents() {
  document.getElementById('btn-show-add-chapter')?.addEventListener('click', () => _showChapterForm(null));
  document.getElementById('btn-cancel-chapter')?.addEventListener('click', _hideChapterForm);
  document.getElementById('btn-save-chapter')?.addEventListener('click', handleSaveChapter);
}

/** @private */
function _showChapterForm(chapter) {
  const wrap = document.getElementById('chapter-form-wrap');
  const titleEl = document.getElementById('chapter-form-title');
  const btnText = document.getElementById('btn-save-chapter-text');

  // Đặt lại biểu mẫu
  document.getElementById('ch-number').value = '';
  document.getElementById('ch-title').value = '';
  document.getElementById('ch-price').value = '0';
  document.getElementById('ch-pages').value = '';
  _clearChapterPagesPreview();

  if (chapter) {
    // Chế độ sửa
    editingChapterId = chapter.id;
    document.getElementById('ch-number').value = chapter.chapterNumber;
    document.getElementById('ch-title').value = chapter.title || '';
    document.getElementById('ch-price').value = chapter.price || 0;
    titleEl.innerHTML = `<i class="bi bi-pencil-square me-2 text-warning"></i>Sửa chương ${chapter.chapterNumber}`;
    btnText.textContent = 'Lưu thay đổi';
  } else {
    // Chế độ thêm
    editingChapterId = null;
    const nextNum = currentChapters.length > 0 ? Math.max(...currentChapters.map(c => Number(c.chapterNumber) || 0)) + 1 : 1;
    document.getElementById('ch-number').value = nextNum;
    document.getElementById('ch-title').value = `Chương ${nextNum}`;
    titleEl.innerHTML = '<i class="bi bi-plus-circle me-2 text-success"></i>Thêm chương mới';
    btnText.textContent = 'Thêm chương';
  }

  wrap.classList.remove('d-none');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** @private */
function _hideChapterForm() {
  document.getElementById('chapter-form-wrap').classList.add('d-none');
  editingChapterId = null;
}

/**
 * Lưu chương (Thêm hoặc Sửa).
 */
async function handleSaveChapter() {
  const saveBtn = document.getElementById('btn-save-chapter');
  const chapterNumber = parseInt(document.getElementById('ch-number').value);
  const title = document.getElementById('ch-title').value.trim();
  const price = parseInt(document.getElementById('ch-price').value) || 0;
  const pageFiles = Array.from(document.getElementById('ch-pages').files || []);

  if (!chapterNumber || !title) { showToast('Vui lòng nhập số chương và tiêu đề!', 'warning'); return; }

  try {
    if (saveBtn) saveBtn.disabled = true;

    // 1. Tải lên trang truyện (nếu được chọn)
    let pages = editingChapterId ? (currentChapters.find(c => c.id === editingChapterId)?.pages || []) : [];
    if (pageFiles.length > 0) {
      const uploadRes = await fetch(`${CONFIG.API_BASE_URL}/api/upload-comic-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicTitle: currentComic.title,
          chapterNumber: chapterNumber,
          pages: await Promise.all(pageFiles.map(async f => ({ name: f.name, base64: await _toBase64(f) })))
        })
      });
      if (!uploadRes.ok) throw new Error('Upload trang truyện thất bại');
      const data = await uploadRes.json();
      pages = data.data.pages;
    }

    const payload = {
      comicId: currentComic.id,
      chapterNumber,
      title,
      price,
      pages,
      updatedAt: new Date().toISOString(),
      createdAt: editingChapterId ? (currentChapters.find(c => c.id === editingChapterId)?.createdAt) : new Date().toISOString()
    };

    // 2. Cập nhật hoặc Tạo mới
    if (editingChapterId) {
      await updateChapter(editingChapterId, payload);
      showToast(`Đã cập nhật chương ${chapterNumber}!`, 'success');
    } else {
      await createChapter(payload);
      showToast(`Đã thêm chương ${chapterNumber}!`, 'success');
    }

    // 3. Hoàn tất
    await loadChapters();
    await patchComic(currentComic.id, { totalChapters: currentChapters.length, updatedAt: new Date().toISOString() });
    _hideChapterForm();

  } catch (error) {
    console.error('[ADMIN EDIT] Lỗi lưu chương:', error);
    showToast('Lỗi khi lưu chương truyện.', 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

/**
 * Hành động sửa chương.
 */
window.onEditChapter = (id) => {
  const chapter = currentChapters.find(c => c.id === id);
  if (chapter) _showChapterForm(chapter);
};

/**
 * Hành động xóa chương.
 */
window.onDeleteChapter = async (id, title) => {
  if (!confirm(`Bạn có chắc muốn xoá "${title || 'chương này'}"?`)) return;

  try {
    const ch = currentChapters.find(c => c.id === id);
    await deleteChapter(id);
    
    // Dọn dẹp vật lý (fire & forget)
    if (ch?.pages?.length > 0) {
      ch.pages.forEach(p => {
        fetch(`${CONFIG.API_BASE_URL}/api/delete-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: p })
        }).catch(() => {});
      });
    }

    showToast('Đã xoá chương truyện!', 'info');
    await loadChapters();
    await patchComic(currentComic.id, { totalChapters: currentChapters.length, updatedAt: new Date().toISOString() });

  } catch (error) {
    showToast('Lỗi khi xoá chương!', 'error');
  }
};

/* ─── UI: Kéo & Thả ────────────────────────────────────────────── */

/** @private */
function _setupDragAndDrop() {
  const coverIn = document.getElementById('comic-cover');
  const coverLabel = document.querySelector('label[for="comic-cover"]');
  const pageIn = document.getElementById('ch-pages');
  const pageBox = document.getElementById('ch-pages-box');

  if (coverIn && coverLabel) {
    _bindZone(coverLabel, coverIn, (files) => {
      const reader = new FileReader();
      reader.onload = (e) => { document.getElementById('comic-cover-preview').src = e.target.result; };
      reader.readAsDataURL(files[0]);
      _updateLabel(coverLabel, `Đã chọn: ${files[0].name}`, true);
    });
  }

  if (pageIn && pageBox) {
    _bindZone(pageBox, pageIn, (files) => {
      _updateLabel(pageBox, `Đã chọn ${files.length} trang truyện`, true);
      _renderPagesPreview(Array.from(files));
    });
  }
}

/** @private */
function _bindZone(zone, input, callback) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => zone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }));
  zone.addEventListener('dragenter', () => zone.classList.add('dragover'));
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  
  const sortAndSetFiles = (fileList) => {
    const dt = new DataTransfer();
    const files = Array.from(fileList);
    // Sort files naturally by name (e.g. 1.jpg, 2.jpg, 10.jpg)
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    files.forEach(f => dt.items.add(f));
    input.files = dt.files;
    callback(dt.files);
  };

  zone.addEventListener('drop', (e) => {
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) { 
      sortAndSetFiles(e.dataTransfer.files);
    }
  });
  input.addEventListener('change', () => { 
    if (input.files.length > 0) {
      sortAndSetFiles(input.files);
    } 
  });
}

/** @private */
function _updateLabel(label, text, success = false) {
  const s = label.querySelector('span');
  const m = label.querySelector('small');
  if (s) s.textContent = text;
  if (m && success) m.innerHTML = '<strong class="text-success">✓ Đã sẵn sàng</strong>';
  if (success) { label.style.borderColor = 'var(--color-success)'; label.classList.add('has-files'); }
}

/** @private */
function _renderPagesPreview(files) {
  const container = document.getElementById('ch-pages-preview-container');
  const grid = document.getElementById('ch-pages-grid');
  if (!container || !grid) return;

  grid.innerHTML = '';
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (imageFiles.length === 0) { container.classList.add('d-none'); return; }

  container.classList.remove('d-none');
  document.getElementById('ch-pages-count').textContent = imageFiles.length;

  imageFiles.forEach((file, index) => {
    // Create the container synchronously to preserve order
    const item = document.createElement('div');
    item.className = 'upload-preview-grid-item';
    item.innerHTML = `<div class="upload-preview-grid-item-overlay"><div class="upload-preview-grid-item-number">${index + 1}</div></div>`;
    grid.appendChild(item);

    // Create image element
    const img = document.createElement('img');
    img.className = 'upload-preview-grid-item-img';

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      item.insertBefore(img, item.firstChild);
    };
    reader.readAsDataURL(file);
  });
}

/** @private */
function _clearChapterPagesPreview() {
  document.getElementById('ch-pages-preview-container')?.classList.add('d-none');
  const box = document.getElementById('ch-pages-box');
  if (box) {
    box.classList.remove('has-files');
    box.style.borderColor = '';
    box.querySelector('span').textContent = 'Kéo thả hoặc nhấn để chọn ảnh trang truyện';
    box.querySelector('small').textContent = 'PNG, JPG, WEBP — có thể chọn nhiều file';
  }
}

/* ─── Tiện ích ─────────────────────────────────────────────────── */

/** @private */
function _toBase64(file) {
  return new Promise((r, j) => {
    const rd = new FileReader();
    rd.onload = () => r(rd.result);
    rd.onerror = j;
    rd.readAsDataURL(file);
  });
}

// Phơi bày toàn cục để dọn dẹp
window.removeCoverPreview = () => {
  const preview = document.getElementById('comic-cover-preview');
  if (currentComic) preview.src = getComicImageSrc(currentComic.coverImage, '../../');
  document.getElementById('comic-cover').value = '';
};
