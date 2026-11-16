# ToolNest — Nền tảng công cụ trực tuyến

Đồ án môn Lập trình Web (PTIT). ToolNest cung cấp các công cụ xử lý PDF, ảnh, văn bản, tệp ngay trên trình duyệt; có hệ thống tài khoản, gói dịch vụ trả phí và trang quản trị.

## Công nghệ

| Phần          | Công nghệ                                                                |
| ------------- | ------------------------------------------------------------------------ |
| Frontend      | React, Vite, React Router, JavaScript, CSS thuần (BEM)                   |
| Backend       | Node.js, Express, Knex, JWT (cookie httpOnly), bcryptjs, Zod, Nodemailer |
| Cơ sở dữ liệu | Microsoft SQL Server                                                     |
| Triển khai    | Docker, Docker Compose, Nginx                                            |
| Thanh toán    | PayPal Sandbox                                                           |

## Chức năng

**Người dùng**

- Đăng ký, đăng nhập, đăng xuất (JWT trong cookie httpOnly)
- Quên mật khẩu qua email (token băm SHA-256, hạn 30 phút, dùng một lần)
- Hồ sơ cá nhân: cập nhật thông tin, đổi mật khẩu
- Danh sách và chi tiết công cụ, xử lý tệp ngay trên trình duyệt
- Credits: công cụ có phí trừ Credits ở máy chủ
- Nâng cấp gói Pro / Nhóm qua PayPal Sandbox

**Quản trị (admin)**

- Tổng quan số liệu, nhật ký sử dụng
- Quản lý người dùng: xem, sửa thông tin, khóa/mở khóa, cấp/hạ quyền admin
- Quản lý danh sách admin
- Quản lý dịch vụ: thêm, sửa, ẩn/hiện, xóa

## Cấu trúc thư mục

```
client/   Giao diện (React + Vite)
server/   API (Express + Knex), migrations, seeds
docs/     Tài liệu thiết kế
docker-compose.yml
```

## Chạy trên máy (không dùng Docker)

Yêu cầu: Node.js 22, SQL Server (bật TCP/IP).

```bash
# 1. Backend
cd server
npm install
cp ../.env.example .env
npm run migrate
npm run seed
npm run dev

# 2. Frontend (terminal khác)
cd client
npm install
npm run dev
```

## Chạy bằng Docker

Tạo file `.env` ở thư mục gốc:

```
DB_PASSWORD=MatKhau@Manh123
JWT_SECRET=chuoi-bi-mat-dai-kho-doan
```

```bash
docker compose up --build
```

Máy chủ tự tạo database, chạy migration và chỉ seed khi các bảng còn trống.
Mở http://localhost:5173 (web) và http://localhost:5000/api/health (API).

## Biến môi trường (server/.env)

| Biến                                                            | Ý nghĩa                                           |
| --------------------------------------------------------------- | ------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`       | Kết nối SQL Server                                |
| `JWT_SECRET`                                                    | Khóa ký JWT                                       |
| `CLIENT_URL`, `CLIENT_ORIGIN`                                   | Địa chỉ giao diện (CORS, link trong email)        |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | SMTP gửi email (để trống thì link in ra terminal) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`   | PayPal Sandbox                                    |

File `.env` chứa bí mật và đã nằm trong `.gitignore`; không đưa lên Git.

## Tài khoản mẫu (sau khi seed)

| Vai trò    | Email             | Mật khẩu |
| ---------- | ----------------- | -------- |
| Admin      | admin@toolnest.vn | 12345678 |
| Người dùng | user@toolnest.vn  | 12345678 |

## Thanh toán thử

Gói Pro/Nhóm thanh toán qua PayPal **Sandbox** (không trừ tiền thật). Giá tính bằng VND và quy đổi sang USD theo tỷ giá cố định (`USD_VND_RATE`, mặc định 25.000). Đăng nhập PayPal bằng tài khoản mua hàng (Personal) trong mục Sandbox accounts của PayPal Developer.

## Bảo mật (tóm tắt)

- Mật khẩu băm bcrypt; token đặt lại mật khẩu chỉ lưu bản băm
- Giá và Credits do máy chủ quyết định; đơn hàng chỉ xử lý một lần
- Quyền admin kiểm tra lại trong CSDL ở mỗi request
- Giới hạn số lần thử đăng nhập, đăng ký, quên mật khẩu
