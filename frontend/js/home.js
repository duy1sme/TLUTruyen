/**
 * ComicsWeb — Trang chủ (Home)
 */
document.addEventListener('DOMContentLoaded', () => {
  initComponents('home');
  loadFeaturedComics();
  loadLatestUpdates();
});

/** Load truyện nổi bật (top views) */
async function loadFeaturedComics() {
  const container = document.getElementById('featured-comics');
  if (!container) return;

  try {
    const comics = await getComics({ sort: 'views', order: 'desc', limit: 6, filters: { approved: true } });
    container.innerHTML = comics.map((c, i) => renderComicCard(c, i)).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-secondary">Không thể tải truyện nổi bật.</p>';
  }
}

/** Load truyện mới cập nhật */
async function loadLatestUpdates() {
  const container = document.getElementById('latest-comics');
  if (!container) return;

  try {
    const comics = await getComics({ sort: 'updatedAt', order: 'desc', limit: 12, filters: { approved: true } });
    container.innerHTML = comics.map((c, i) => renderComicCard(c, i)).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-secondary">Không thể tải truyện mới.</p>';
  }
}
