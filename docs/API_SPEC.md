# Đặc tả API (API Specification) — Dự án ToolNest

## 1. Cấu trúc JSON trả về chuẩn (Response Envelope)

### Thành công (200 OK, 201 Created):

```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 9,
    "totalItems": 15,
    "totalPages": 2
  }
}
```

(Ghi chú: meta chỉ có ở các API lấy danh sách có phân trang).

### Thất bại (400, 401, 403, 404, 409, 429, 500):

```json
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": {
    "email": "Email không đúng định dạng"
  }
}
```

## 2. Quy chuẩn Query String cho MỌI danh sách (Đáp ứng yêu cầu bắt buộc)

Tất cả các API lấy danh sách đều dùng chung chuẩn tham số trên URL để dễ dàng viết 1 hàm xử lý dùng chung cho cả Knex.js (Backend) và Custom Hook (Frontend):

- `page`: Trang hiện tại (mặc định 1)
- `limit`: Số dòng mỗi trang (mặc định 9 cho trang dịch vụ user, 10 cho các bảng quản trị/lịch sử)
- `search`: Từ khóa tìm kiếm tiếng Việt có dấu hoặc không dấu (kết hợp COLLATE Vietnamese_CI_AI)
- `sortBy`: Cột cần sắp xếp (ví dụ: created_at, usage_count, name, credit_cost)
- `sortOrder`: Thứ tự sắp xếp (asc hoặc desc, mặc định desc)

Các tham số lọc (filter) riêng theo từng bảng:

- `category`
- `status`
- `isVisible`
- `planType`
- ...

## 3. Danh sách toàn bộ Endpoints theo từng Phân hệ

### A. Xác thực & Tài khoản

| Method | Endpoint                  | Quyền  | Mô tả                                                 |
| ------ | ------------------------- | ------ | ----------------------------------------------------- |
| POST   | /api/auth/register        | Public | Đăng ký tài khoản mới + gửi email xác thực            |
| POST   | /api/auth/login           | Public | Đăng nhập (Email/Pass) -> Gắn JWT vào httpOnly cookie |
| POST   | /api/auth/google          | Public | Đăng nhập/Liên kết tài khoản qua Google OAuth         |
| POST   | /api/auth/logout          | Auth   | Đăng xuất (Xóa cookie JWT)                            |
| GET    | /api/auth/me              | Auth   | Lấy thông tin user đang đăng nhập                     |
| GET    | /api/auth/verify-email    | Public | Xác thực email qua token trong link                   |
| POST   | /api/auth/forgot-password | Public | Yêu cầu gửi email đặt lại mật khẩu                    |
| POST   | /api/auth/reset-password  | Public | Đặt lại mật khẩu mới bằng token                       |
| PUT    | /api/profile              | Auth   | Cập nhật hồ sơ (họ tên, năm sinh, địa chỉ, sđt)       |
| PUT    | /api/profile/password     | Auth   | Đổi mật khẩu (yêu cầu nhập mật khẩu hiện tại)         |

### B. Dịch vụ & Sử dụng công cụ

| Method | Endpoint                 | Quyền  | Mô tả                                                                                                                 |
| ------ | ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| GET    | /api/categories          | Public | Lấy 5 danh mục (PDF, Ảnh, Video, AI viết, Tệp)                                                                        |
| GET    | /api/services            | Public | Danh sách dịch vụ (chỉ lấy is_visible = 1, có Phân trang, Tìm kiếm, Lọc theo category/status, Sắp xếp)                |
| GET    | /api/services/:slug      | Public | Chi tiết 1 dịch vụ theo slug                                                                                          |
| POST   | /api/tools/:slug/execute | Auth   | Chạy công cụ (Upload file/text -> kiểm tra & trừ credit -> trả kết quả -> ghi usage_logs)                             |
| GET    | /api/history             | Auth   | Lịch sử sử dụng của chính user đó (Phân trang, Tìm kiếm theo tên công cụ/file, Lọc theo danh mục/trạng thái, Sắp xếp) |

### C. Thanh toán Online

| Method | Endpoint                   | Quyền  | Mô tả                                                                                                      |
| ------ | -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| GET    | /api/payments/packages     | Public | Danh sách gói nạp Credit / nâng cấp Premium                                                                |
| POST   | /api/payments/create-url   | Auth   | Tạo đơn pending trong DB và sinh URL thanh toán Sandbox                                                    |
| GET    | /api/payments/vnpay-return | Public | Xử lý kết quả trả về trình duyệt                                                                           |
| GET    | /api/payments/vnpay-ipn    | Public | Webhook/IPN: Xác minh chữ ký HMAC -> mở SQL Transaction cộng Credit/nâng cấp Premium -> gửi email biên lai |

### D. Quản trị viên

(Tất cả đều đi qua middleware requireAuth và requireRole('admin'). Mọi API GET danh sách đều bắt buộc có Phân trang, Tìm kiếm, Sắp xếp, Lọc)

| Method | Endpoint                           | Mô tả                                                                                               |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET    | /api/admin/stats                   | Thống kê tổng quan (tổng lượt dùng theo danh mục, top dịch vụ dùng nhiều nhất, tổng user/doanh thu) |
| GET    | /api/admin/users                   | Danh sách người dùng (role = 'user')                                                                |
| PUT    | /api/admin/users/:id               | Sửa thông tin user / Khóa hoặc mở khóa tài khoản (status)                                           |
| DELETE | /api/admin/users/:id               | Xóa tài khoản người dùng                                                                            |
| GET    | /api/admin/services                | Danh sách toàn bộ dịch vụ (gồm cả dịch vụ đang ẩn is_visible = 0)                                   |
| POST   | /api/admin/services                | Thêm dịch vụ mới                                                                                    |
| PUT    | /api/admin/services/:id            | Sửa thông tin dịch vụ                                                                               |
| PATCH  | /api/admin/services/:id/visibility | Bật/tắt nhanh trạng thái ẩn/hiện (is_visible)                                                       |
| DELETE | /api/admin/services/:id            | Xóa dịch vụ                                                                                         |
| GET    | /api/admin/admins                  | Danh sách tài khoản Quản trị viên (role = 'admin')                                                  |
| POST   | /api/admin/admins                  | Tạo thêm tài khoản Admin mới                                                                        |
| PUT    | /api/admin/admins/:id/password     | Đổi mật khẩu cho tài khoản Admin                                                                    |
| DELETE | /api/admin/admins/:id              | Xóa tài khoản Admin (chặn tự xóa chính mình)                                                        |
