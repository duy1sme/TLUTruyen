/**
 * ComicsWeb — Trang tìm kiếm
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('search');
  loadGenreFilters();
  loadAllComics();
  setupSearch();
});

async function loadGenreFilters() {
  const container = document.getElementById('genre-filters');
  if (!container) return;

  try {
    const genres = await getGenres();
    container.innerHTML = `
      <button class="btn btn-sm cw-genre-tag active" data-genre="all"
              style="cursor:pointer;">Tất cả</button>
      ${genres.map(g => `
        <button class="btn btn-sm cw-genre-tag" data-genre="${g.slug}"
                style="cursor:pointer;">${g.name}</button>
      `).join('')}
    `;
    // Add click handlers
    container.querySelectorAll('[data-genre]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-genre]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterByGenre(btn.dataset.genre);
      });
    });
  } catch (err) { /* silent */ }
}

async function loadAllComics() {
  const container = document.getElementById('search-results');
  if (!container) return;

  try {
    const comics = await getComics({ limit: 50, filters: { approved: true } });
    window.__allComics = comics;
    container.innerHTML = comics.map((c, i) => renderComicCard(c, i)).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-secondary">Không thể tải dữ liệu.</p>';
  }
}

function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', debounce((e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = (window.__allComics || []).filter(c =>
      c.title.toLowerCase().includes(q) || c.author.toLowerCase().includes(q)
    );
    document.getElementById('search-results').innerHTML =
      filtered.map((c, i) => renderComicCard(c, i)).join('') ||
      '<p class="text-secondary text-center py-4">Không tìm thấy kết quả.</p>';
  }, 300));
}

function filterByGenre(genre) {
  const comics = window.__allComics || [];
  const filtered = genre === 'all'
    ? comics
    : comics.filter(c => (c.genres || []).includes(genre));

  document.getElementById('search-results').innerHTML =
    filtered.map((c, i) => renderComicCard(c, i)).join('') ||
    '<p class="text-secondary text-center py-4">Không có truyện nào thuộc thể loại này.</p>';
}
