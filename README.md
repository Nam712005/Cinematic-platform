# CINEMATIC — Nền tảng Xem Phim Trực Tuyến Tích Hợp Trợ Lý AI

**CINEMATIC** là hệ thống website xem phim trực tuyến hiện đại (Full-stack) hỗ trợ phát phim đa định dạng (**EMBED / HLS / MP4**), nâng cấp gói thành viên **Premium** qua cổng thanh toán QR, giao diện **Sáng / Tối (Light & Dark Mode)**, hệ thống **Quản trị Admin** toàn diện và **Trợ lý Chatbot AI** (hỗ trợ **Groq**, **Google Gemini**, **OpenAI**) kết nối trực tiếp dữ liệu phim thật từ MySQL.

---

## Tính năng chính

### 1. Phía Người dùng (Client & Member)
- **Khám phá & Xem phim đa nguồn:** Trang chủ Hero Spotlight, danh sách phim nổi bật/mới cập nhật, tìm kiếm & lọc đa tiêu chí (thể loại, quốc gia, định dạng phim lẻ/phim bộ, năm phát hành, sắp xếp).
- **Trình phát phim linh hoạt:** Hỗ trợ nguồn phát **EMBED (iframe)**, **HLS (`.m3u8`)** và **MP4**; chuyển đổi server phát, chọn tập phim, tự động lưu lịch sử & tiến độ xem (kèm hộp thoại *"Tiếp tục xem?"* cho nguồn HLS/MP4), báo lỗi nguồn phát.
- **Không gian cá nhân:** Đăng ký, đăng nhập (JWT Access/Refresh Token), quên/đặt lại mật khẩu qua Email, quản lý hồ sơ cá nhân, đổi mật khẩu, danh sách yêu thích, lịch sử xem phim, đánh giá sao và bình luận.
- **Gói Premium & Thanh toán QR:** Xem bảng giá gói thành viên (hiển thị gói *Phổ biến nhất* động từ Admin), thanh toán QR (ZaloPay QR, Ví MoMo QR, Chuyển khoản ngân hàng) tự động nối tiếp thời hạn và mở khóa tức thì kho phim Premium, theo dõi lịch sử giao dịch.
- **Giao diện Sáng / Tối:** Chuyển đổi mượt mà giữa Dark Mode & Light Mode trên toàn hệ thống.

### 2. Trợ lý Chatbot AI (Groq / Gemini / OpenAI)
- **Đa nhà cung cấp AI:** Hỗ trợ cấu hình linh hoạt **Groq (Llama 3 — miễn phí, tốc độ cao)**, **Google Gemini** và **OpenAI**; khóa API được mã hóa bảo mật bằng **AES-256-GCM** trong MySQL.
- **RAG dữ liệu thật & Hiểu tâm trạng:** Tự động truy vấn kho phim thật từ MySQL theo từ khóa, thể loại hoặc ánh xạ tâm trạng người dùng (buồn/stress, lãng mạn, kịch tính, hack não...), đảm bảo không bịa phim ngoài hệ thống.
- **Nhận diện phim đang xem & Thẻ phim mini:** Tự động nhận diện phim khi người dùng đang mở trang chi tiết/xem phim để gợi ý phim tương tự cùng thể loại, kèm thẻ phim mini có poster, năm phát hành và nút **Xem ngay** chuyển thẳng tới trang phim.
- **Đa phiên hội thoại:** Tạo nhiều phiên trò chuyện, lưu và quản lý lịch sử chat theo từng tài khoản thành viên.

### 3. Hệ thống Quản trị Admin (`/admin/*`)
- **Dashboard & Báo cáo thống kê:** KPI tổng quan, biểu đồ doanh thu & lượt mở xem 6 tháng, báo cáo theo khoảng thời gian (`7d`, `30d`, `6m`, `1y`), phân bổ gói Premium, Top 5 phim xem nhiều và nhật ký hoạt động.
- **Quản lý Phim & Nhập phim Đa nguồn API:** CRUD phim thủ công hoặc tìm kiếm/nhập trực tiếp bằng tên phim và **Link URL** từ **NguonC**, **KKPhim**, **OPhim**.
- **Quản lý Tập phim & Nguồn phát:** Thêm/sửa/xóa tập phim, cấu hình nhiều server phát (EMBED/HLS/MP4) và xử lý báo lỗi nguồn phát từ người xem.
- **Quản lý Phân loại, Người dùng & Bình luận:** CRUD Thể loại, Quốc gia, Danh mục, Diễn viên, Đạo diễn; quản lý tài khoản (lọc Thường/Premium/Admin, khóa/mở khóa); kiểm duyệt ẩn/hiện/xóa bình luận.
- **Quản lý Gói Premium, Đơn hàng & Cài đặt hệ thống:** Tùy chỉnh giá gói, chọn gói *Phổ biến nhất*, theo dõi & hoàn tiền giao dịch, cấu hình Chatbot AI, bật/tắt chế độ **Bảo trì (Maintenance Mode)** và bật/tắt từng cổng thanh toán.

---

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, React Router DOM, Tailwind CSS, Lucide Icons, Recharts, HLS.js, `qrcode.react`, Axios |
| **Backend** | Node.js (ESM), Express.js, MySQL2, Zod, JWT (`jsonwebtoken`), `bcryptjs`, Helmet, Multer, Nodemailer |
| **Cơ sở dữ liệu** | MySQL 8.4 (InnoDB, `utf8mb4_unicode_ci`) |
| **AI Providers** | Groq API (OpenAI-compatible), Google Gemini API, OpenAI API |

---

## Yêu cầu môi trường

- **Node.js**: phiên bản `>= 18.x` (khuyến nghị `20.x` hoặc mới hơn)
- **MySQL**: phiên bản `8.0+` (khuyến nghị `8.4`)
- **npm**: đi kèm cùng Node.js

---

## Cấu trúc thư mục

```text
CINEMATIC/
├── backend/          # RESTful API Server (Node.js + Express + MySQL)
├── frontend/         # Ứng dụng Web SPA (React + Vite + Tailwind CSS)
├── database/         # Script khởi tạo CSDL (schema.sql & seed.sql)
├── .gitignore
└── README.md
```

---

## Hướng dẫn cài đặt & chạy dự án

### Bước 1: Khởi tạo cơ sở dữ liệu MySQL

Tạo database `cinematic` và import lần lượt 2 file SQL trong thư mục `database/`:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

> Hoặc mở MySQL Workbench / DBeaver / phpMyAdmin để chạy lần lượt `database/schema.sql` rồi `database/seed.sql`.

### Bước 2: Cấu hình biến môi trường (`.env`)

1. **Backend:** Tạo file `backend/.env` từ file mẫu `backend/.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Cập nhật thông tin kết nối MySQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), các khóa bảo mật (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` — chuỗi hex 64 ký tự cho AES-256-GCM) và cấu hình SMTP (nếu dùng chức năng gửi email đặt lại mật khẩu).

2. **Frontend:** Tạo file `frontend/.env` từ file mẫu `frontend/.env.example`:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Mặc định `VITE_API_BASE_URL=http://localhost:5000/api`.

### Bước 3: Cài đặt thư viện (`npm install`)

```bash
# Cài đặt thư viện Backend
cd backend
npm install

# Cài đặt thư viện Frontend
cd ../frontend
npm install
```

### Bước 4: Chạy ứng dụng ở chế độ phát triển (Development)

Mở **2 cửa sổ terminal** riêng biệt:

```bash
# Terminal 1 — Chạy Backend (mặc định: http://localhost:5000)
cd backend
npm run dev
```

```bash
# Terminal 2 — Chạy Frontend (mặc định: http://localhost:5173)
cd frontend
npm run dev
```

Truy cập ứng dụng tại: **http://localhost:5173**

### Bước 5: Build bản Production (Frontend)

```bash
cd frontend
npm run build
```

Kết quả build sẽ được xuất ra thư mục `frontend/dist/`.

---

## Cấu hình nhanh Chatbot AI (Groq)

1. Đăng nhập bằng tài khoản **Admin** và truy cập `/admin/chatbot`.
2. Chọn **Nhà cung cấp AI chính** là **Groq (Llama 3 - Miễn phí, tốc độ cao)** (hoặc Google Gemini / OpenAI).
3. Nhập **Groq Model** (mặc định `llama-3.3-70b-versatile`) và dán **Groq API Key** (`gsk_...`).
4. Bấm **Lưu cấu hình AI** (key sẽ tự động mã hóa AES-256-GCM vào MySQL), sau đó bấm **Kiểm tra kết nối AI** để xác nhận.
