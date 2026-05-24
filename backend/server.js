/**
 * ComicsWeb Backend — json-server-auth
 *
 * Khởi động: npm start
 * Server chạy tại: http://localhost:3001
 *
 * Routes mặc định từ json-server:
 *   GET    /comics          — Lấy danh sách truyện
 *   GET    /comics/:id      — Lấy chi tiết truyện
 *   POST   /comics          — Thêm truyện (cần auth)
 *   PUT    /comics/:id      — Sửa truyện (cần auth)
 *   DELETE /comics/:id      — Xoá truyện (cần auth)
 *   ... tương tự cho chapters, genres, bookmarks, readingHistory
 *
 * Auth routes (từ json-server-auth):
 *   POST   /register        — Đăng ký (email, password)
 *   POST   /login           — Đăng nhập → trả về JWT
 *   POST   /600/users       — Truy cập user (cần auth)
 */

const jsonServer = require('json-server');
const auth = require('json-server-auth');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, '..', 'frontend'),
});

// ─── Cấu hình CORS ────────────────────────────────────────
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ─── Quy tắc bảo vệ routes ───────────────────────────────
// Cú pháp: "resource permission"
//   6 = chỉ owner, 4 = authenticated user, 0 = public
//
// Ví dụ: "/comics" → 660 → owner: rw, authenticated: rw, public: none
//         "/comics" → 664 → owner: rw, authenticated: rw, public: r
const rules = auth.rewriter({
  // Comics: ai cũng đọc được, chỉ admin sửa/xoá
  comics: 664,
  // Chapters: ai cũng đọc được, chỉ admin sửa/xoá
  chapters: 664,
  // Genres: ai cũng đọc được
  genres: 444,
  // Bookmarks: chỉ user đã đăng nhập
  bookmarks: 660,
  // Reading History: chỉ user đã đăng nhập
  readingHistory: 660,
  // Users: chỉ owner xem/sửa
  users: 600,
  // Giỏ hàng: chỉ owner xem/sửa
  cart: 660,
  // Lịch sử mua: chỉ owner xem/sửa
  purchases: 660,
  // Bình luận: ai cũng đọc được, chỉ user đăng nhập mới được đăng
  comments: 664,
});

// ─── Apply middleware theo thứ tự ─────────────────────────
server.use(rules);
server.use(middlewares);

// Bind json-server-auth router
server.db = router.db;
server.use(auth);
server.use(router);

// ─── Khởi động server ────────────────────────────────────
const PORT = 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      🚀 ComicsWeb API is running!       ║');
  console.log(`  ║      http://localhost:${PORT}              ║`);
  console.log('  ╠══════════════════════════════════════════╣');
  console.log('  ║  Endpoints:                              ║');
  console.log('  ║    GET  /comics      — Danh sách truyện  ║');
  console.log('  ║    GET  /chapters    — Danh sách chương   ║');
  console.log('  ║    GET  /genres      — Thể loại           ║');
  console.log('  ║    POST /register    — Đăng ký            ║');
  console.log('  ║    POST /login       — Đăng nhập          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
