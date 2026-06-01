# BÁO CÁO KỸ THUẬT DỰ ÁN WEBSITE ĐỌC TRUYỆN TLUTRUYEN

## I. TỔNG QUAN KỸ THUẬT (TECHNICAL STACK)

Dự án TLUTRUYEN được xây dựng dựa trên kiến trúc hiện đại, tách biệt giữa giao diện (Frontend) và xử lý dữ liệu (Backend), đảm bảo tính linh hoạt và dễ mở rộng.

*   **Frontend (Giao diện người dùng):**
    *   **Ngôn ngữ:** Vanilla JavaScript (ES6+). Việc sử dụng JS thuần thay vì các thư viện như React/Vue giúp tối ưu tốc độ phản hồi, giảm độ trễ và thể hiện tư duy lập trình logic cốt lõi.
    *   **UI Framework:** Bootstrap 5.3.3. Tận dụng hệ thống Grid và các Components (Modal, Navbar, Offcanvas) để đảm bảo tính responsive tuyệt đối trên mọi thiết bị (Mobile, Tablet, Desktop).
    *   **Icons:** Bootstrap Icons v1.11.3.
    *   **Quản lý trạng thái (State Management):** Sử dụng `localStorage` để lưu trữ phiên làm việc (JWT Token) và thông tin người dùng cục bộ, giúp duy trì trạng thái đăng nhập khi tải lại trang.

*   **Backend (Máy chủ & Dữ liệu):**
    *   **Môi trường:** Node.js.
    *   **Công nghệ:** json-server` kết hợp với `json-server-auth`. Đây là giải pháp giả lập RESTful API mạnh mẽ, cho phép xử lý đầy đủ các phương thức HTTP (GET, POST, PUT, PATCH, DELETE) và cơ chế xác thực bảo mật.
    *   **Cơ sở dữ liệu:** Tệp JSON (`db.json`) được cấu trúc theo mô hình NoSQL, tối ưu cho việc truy xuất dữ liệu truyện và người dùng.

*   **Kiến trúc hệ thống:**
    *   **Mô hình MPA (Multi-Page Application):** Giúp tách biệt rõ ràng các phân vùng chức năng (Trang chủ, Trình đọc, Quản trị), thuận tiện cho việc quản lý mã nguồn và tối ưu hóa SEO.
    *   **Decoupled Architecture:** Frontend giao tiếp với Backend hoàn toàn thông qua các Endpoint API trung tâm được định nghĩa trong tệp `api.js`.

---

## II. THIẾT KẾ GIAO DIỆN (UI/UX DESIGN SYSTEM)

Hệ thống được thiết kế với tư duy tập trung vào trải nghiệm người dùng (User-Centered Design), lấy cảm hứng từ các nền tảng Comic quốc tế như Marvel/DC.

*   **Hệ thống màu sắc (Color Palette):** Sử dụng bộ nhận diện "French Flag" (Xanh - Đỏ - Trắng) tạo cảm giác chuyên nghiệp và tin cậy:`
    *   **Xanh dương Pháp (`#002395`):** Màu chủ đạo cho Navbar, Footer và các nút hành động chính (Primary Buttons).
    *   **Đỏ Pháp (`#ED2939`):** Màu điểm nhấn cho các thông báo quan trọng, nhãn "Hot/Mới" và hiệu ứng hover.
    *   **Trắng (`#FFFFFF`):** Màu nền chủ đạo cho trình đọc, giúp giảm mỏi mắt và tăng tính tập trung vào nội dung truyện.

*   **Thành phần dùng chung (Reusable Components):**
    *   **Module `components.js`:** Đảm nhận việc render động các thành phần giao diện lặp lại. Giúp đồng bộ hóa Navbar và Footer trên tất cả các trang chỉ bằng một dòng code khởi tạo.
    *   **Comic Card:** Thiết kế thẻ truyện đồng nhất với các thông số hiển thị rõ ràng (Lượt xem, Số chương, Thể loại).

*   **Các màn hình chính:**
    1.  **Trang chủ:** Banner Hero nổi bật, danh sách truyện mới cập nhật và truyện nổi bật nhất.
    2.  **Trang Chi tiết truyện:** Hiển thị thông tin tác giả, mô tả nội dung và danh sách chương.
    3.  **Trình đọc (Reader Engine):** Chế độ đọc cuộn mượt mà, hỗ trợ điều hướng chương nhanh chóng.
    4.  **Hệ thống Admin Dashboard:** Giao diện quản trị CMS chuyên nghiệp để quản lý kho truyện và người dùng.

---

## III. CHI TIẾT LOGIC & CHỨC NĂNG (CORE ENGINE)

Đây là phần trọng tâm về kỹ thuật, giải quyết các bài toán xử lý dữ liệu phức tạp.

*   **Xác thực và Bảo mật (Authentication & Security):**
    *   Sử dụng cơ chế **JSON Web Token (JWT)**. Mọi yêu cầu truy xuất dữ liệu nhạy cảm đều được đính kèm Token trong Header `Authorization`.
    *   **Phân quyền (RBAC):** Hệ thống phân tách rõ rệt giữa `User` và `Admin`. Hàm `isAdmin()` kiểm tra quyền hạn ngay từ tầng logic để bảo vệ các trang quản trị.

*   **Logic Trình đọc (Reader Logic):**
    *   **Access Control:** Trước khi tải ảnh truyện, hệ thống sẽ thực hiện kiểm tra quyền truy cập 3 lớp:
        1.  Chương này có miễn phí không?
        2.  Người dùng có phải là Admin/Người đăng không?
        3.  Người dùng đã dùng Xu để mua chương này chưa?
    *   **Reading History:** Tự động ghi lại chương và trang cuối cùng người dùng đang đọc thông qua API `PATCH` để đồng bộ lịch sử trên mọi thiết bị.

*   **Hệ thống Ví & Giao dịch (Coin & Economy):**
    *   Mỗi người dùng có một số dư Xu (`coins`).
    *   Khi mua chương, hệ thống thực hiện đồng thời: Trừ xu người dùng (`PATCH /users`) và Tạo bản ghi giao dịch (`POST /purchases`).
    *   Hỗ trợ "Giỏ hàng" (Cart) để người dùng có thể lưu các chương truyện yêu thích và thanh toán hàng loạt.

*   **Quản trị nội dung (CMS Admin Suite):**
    *   Cung cấp công cụ CRUD hoàn chỉnh: Thêm truyện, sửa thông tin chương, xóa người dùng vi phạm.
    *   Cơ chế **Auto-ID Generation** và xử lý ảnh (giả lập upload) đảm bảo tính nhất quán của dữ liệu.

---

## IV. ĐÁNH GIÁ & HƯỚNG PHÁT TRIỂN

### 1. Kết quả đạt được
*   Xây dựng thành công hệ thống đọc truyện hoàn chỉnh, mượt mà và bảo mật.
*   Giao diện responsive tốt, tốc độ phản hồi API nhanh (dưới 200ms).
*   Kiến trúc code rõ ràng, áp dụng đúng các chuẩn IT chuyên ngành.

### 2. Hạn chế
*   Hệ thống lưu trữ vẫn phụ thuộc vào file vật lý (`db.json`), chưa chịu được tải cực lớn.
*   Cơ chế nạp xu hiện tại vẫn là giả lập, chưa tích hợp cổng thanh toán ngân hàng/MoMo thực tế.

### 3. Hướng phát triển (Future Roadmap)
*   Nâng cấp Backend lên **Express.js** và **MongoDB** để xử lý dữ liệu quy mô lớn.
*   Tích hợp Socket.io để thực hiện chức năng thông báo thời gian thực và bình luận trực tiếp.
*   Xây dựng thuật toán gợi ý truyện (Recommendation System) dựa trên sở thích người dùng.

---
**Người thực hiện:** Nhóm phát triển TLUTRUYEN
**Ngày hoàn thành:** 01/06/2026
