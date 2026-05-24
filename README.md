# 📚 ComicsWeb — Website Đọc Truyện Tranh

Website đọc truyện tranh trực tuyến sử dụng **Vanilla JavaScript**, **Bootstrap 5**, và **json-server-auth**.

## 🏗️ Cấu trúc thư mục

```
ComicsWeb/
├── backend/
│   ├── db.json          # Cơ sở dữ liệu JSON
│   ├── package.json     # Dependencies
│   └── server.js        # json-server-auth entry point
│
├── frontend/
│   ├── index.html       # Trang chủ
│   ├── css/style.css    # Design system
│   ├── js/
│   │   ├── config.js    # Cấu hình chung
│   │   ├── api.js       # Fetch wrapper + CRUD
│   │   ├── auth.js      # Đăng nhập/Đăng ký/JWT
│   │   ├── utils.js     # Helper functions
│   │   ├── components.js# Navbar + Footer
│   │   ├── home.js      # Logic trang chủ
│   │   ├── comic-detail.js
│   │   ├── reader.js
│   │   ├── search.js
│   │   └── admin.js
│   ├── pages/
│   │   ├── comic-detail.html
│   │   ├── reader.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── search.html
│   │   └── admin/dashboard.html
│   └── assets/images/
│
└── README.md
```

## 🚀 Cài đặt & Chạy

### 1. Cài đặt Backend
```bash
cd backend
npm install
```

### 2. Chạy Backend (API server)
```bash
npm start
# Server chạy tại http://localhost:3001
```

### 3. Chạy Frontend
Mở `frontend/index.html` bằng **Live Server** (VS Code extension) hoặc bất kỳ HTTP server nào.


## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập → JWT |
| GET | `/comics` | Danh sách truyện |
| GET | `/comics/:id` | Chi tiết truyện |
| GET | `/chapters?comicId=X` | Chương theo truyện |
| GET | `/genres` | Thể loại |
| GET/POST | `/bookmarks` | Đánh dấu truyện |

## 🎨 Thiết kế

- Lấy cảm hứng từ [Marvel.com/comics](https://www.marvel.com/comics)
- Dark theme, accent đỏ `#E62429`
- Font: Roboto Condensed (heading) + Inter (body)
- Responsive mobile-first

## 👥 Tài khoản mẫu

- **Admin:** `admin@comicsweb.vn` (cần đăng ký lại vì password trong db.json là placeholder)

## 📝 License

MIT
