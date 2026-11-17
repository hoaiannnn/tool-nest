# Đặc tả API — ToolNest

Tài liệu mô tả các API **đã được cài đặt** trong `server/src`. Tất cả đường dẫn bắt đầu bằng `/api`.

## 1. Quy ước chung

**Xác thực:** JWT lưu trong cookie `toolnest_token` (httpOnly, sameSite=lax, hạn 7 ngày). Client gọi với `credentials: "include"`.

**Phân quyền (3 mức):**

- **Public**: không cần đăng nhập.
- **Auth**: cần đăng nhập (`requireAuth`; kiểm tra lại tài khoản còn tồn tại và không bị khóa).
- **Admin**: cần đăng nhập và có role `admin` (`requireAdmin`; kiểm tra role và status trong CSDL ở mỗi request).

**Định dạng phản hồi**

Thành công:

```json
{ "success": true, "message": "Thao tác thành công", "data": {} }
```

Thất bại:

```json
{ "success": false, "message": "Mô tả lỗi" }
```

**Mã trạng thái thường gặp:** 200, 201, 400 (dữ liệu không hợp lệ), 401 (chưa đăng nhập / hết phiên), 402 (không đủ Credits), 403 (bị khóa / không đủ quyền), 404, 409 (trùng dữ liệu), 429 (thử quá nhiều lần), 500.

**Danh sách, tìm kiếm và phân trang:** các API danh sách trả về toàn bộ dữ liệu của trang tương ứng. Việc **tìm kiếm, lọc, sắp xếp và phân trang được thực hiện ở client** (hook `usePagination`).

**Giới hạn số lần gọi (rate limit):** `register`, `login`, `forgot-password`, `reset-password` tối đa 10 lần / 5 phút / địa chỉ IP.

## 2. Xác thực và tài khoản — `/api/auth`

| Method | Endpoint              | Quyền  | Mô tả                                                                                                                       |
| ------ | --------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| POST   | /auth/register        | Public | Đăng ký (`email`, `password` ≥ 8 ký tự, `fullName`, `birthYear`, `phone`, `address`); tặng 10 Credits; gắn cookie đăng nhập |
| POST   | /auth/login           | Public | Đăng nhập (`email`, `password`); tài khoản bị khóa trả 403                                                                  |
| POST   | /auth/logout          | Public | Xóa cookie đăng nhập                                                                                                        |
| GET    | /auth/me              | Auth   | Thông tin người dùng hiện tại                                                                                               |
| PUT    | /auth/profile         | Auth   | Cập nhật hồ sơ (`fullName`, `birthYear`, `phone`, `address`)                                                                |
| PUT    | /auth/change-password | Auth   | Đổi mật khẩu (`currentPassword`, `newPassword`)                                                                             |
| POST   | /auth/forgot-password | Public | Gửi email đặt lại mật khẩu (`email`); luôn trả cùng một thông báo dù email có tồn tại hay không                             |
| POST   | /auth/reset-password  | Public | Đặt mật khẩu mới (`token`, `password` ≥ 8 ký tự)                                                                            |

**Cơ chế quên mật khẩu:** token ngẫu nhiên 32 byte; CSDL (bảng `password_resets`) chỉ lưu bản băm SHA-256; hạn 30 phút; dùng một lần (`used_at`); token cũ bị vô hiệu khi tạo token mới; đổi mật khẩu và đánh dấu đã dùng trong cùng một transaction.

## 3. Danh mục và dịch vụ

| Method | Endpoint          | Quyền         | Mô tả                                                            |
| ------ | ----------------- | ------------- | ---------------------------------------------------------------- |
| GET    | /categories       | Public        | Danh sách danh mục (PDF, Ảnh, Video, AI viết, Tệp)               |
| GET    | /services         | Public        | Danh sách dịch vụ đang hiển thị (`is_visible = 1`)               |
| GET    | /services/:id     | Public        | Chi tiết một dịch vụ                                             |
| POST   | /services/:id/use | Public / Auth | Ghi nhận một lượt sử dụng công cụ (`inputSummary`, `durationMs`) |

**Quy tắc `POST /services/:id/use`:**

- Dịch vụ phải tồn tại, đang hiển thị và có `status = ready`.
- Công cụ miễn phí (`credit_cost = 0`): khách vẫn dùng được; người đã đăng nhập thì được ghi `usage_logs`.
- Công cụ có phí (`credit_cost > 0`): **bắt buộc đăng nhập**; máy chủ trừ Credits **có điều kiện** (`credits >= credit_cost`) trong một transaction cùng với việc tăng `usage_count` và ghi `usage_logs`. Không đủ Credits trả 402. Phản hồi trả về `data.credits` là số dư còn lại.
- Lịch sử sử dụng **không** mở cho người dùng; chỉ quản trị viên xem được (xem mục 5).

## 4. Thanh toán — `/api/plans` (PayPal Sandbox)

| Method | Endpoint                   | Quyền | Mô tả                                                                                                           |
| ------ | -------------------------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| POST   | /plans/paypal/create-order | Auth  | Tạo đơn `pending` và đơn PayPal (`planId`: pro/team, `cycle`: monthly/yearly); trả `approveUrl` để chuyển hướng |
| POST   | /plans/paypal/capture      | Auth  | Chốt đơn sau khi người dùng đồng ý trên PayPal (`orderId`); trả `user` và `receipt`                             |

**Nguyên tắc:**

- **Giá do máy chủ quyết định** (bảng `PLANS`); client chỉ gửi mã gói và chu kỳ.
- Giá VNĐ được quy đổi sang USD theo tỷ giá cố định `USD_VND_RATE` (mặc định 25.000) vì PayPal không hỗ trợ VNĐ.
- Khi chốt đơn, máy chủ **xác minh** trạng thái `COMPLETED`, loại tiền USD và số tiền đã thu khớp với đơn.
- Việc cộng gói và Credits, đổi trạng thái `pending → paid` nằm trong một transaction; đơn đã `paid` thì gọi lại chỉ trả lại biên lai (không cộng lần hai).

| Gói         | Giá tháng | Giá năm    | Credits / tháng |
| ----------- | --------- | ---------- | --------------- |
| Pro         | 79.000đ   | 790.000đ   | 500             |
| Nhóm (team) | 199.000đ  | 1.990.000đ | 2.000           |

## 5. Quản trị viên — `/api/admin`

Toàn bộ đi qua `requireAuth` và `requireAdmin`.

| Method | Endpoint                       | Mô tả                                                                                                                        |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| GET    | /admin/overview                | Thống kê: số người dùng, số admin, người dùng trả phí, số dịch vụ, tổng lượt dùng, doanh thu; top dịch vụ; hoạt động gần đây |
| GET    | /admin/users                   | Danh sách người dùng (role = user)                                                                                           |
| PUT    | /admin/users/:id               | Sửa thông tin (`fullName`, `phone`, `planType`, `credits`)                                                                   |
| PATCH  | /admin/users/:id/toggle-status | Khóa / mở khóa tài khoản người dùng                                                                                          |
| PATCH  | /admin/users/:id/role          | Đổi quyền user ↔ admin (`role`)                                                                                              |
| GET    | /admin/activity                | Nhật ký sử dụng công cụ (tối đa 500 dòng gần nhất)                                                                           |
| GET    | /admin/services                | Danh sách toàn bộ dịch vụ (gồm cả dịch vụ đang ẩn)                                                                           |
| POST   | /admin/services                | Thêm dịch vụ (`name`, `category`, `desc`, `status`, `visible`, `creditCost`)                                                 |
| PUT    | /admin/services/:id            | Sửa dịch vụ                                                                                                                  |
| DELETE | /admin/services/:id            | Xóa dịch vụ (409 nếu dịch vụ đã có lượt sử dụng)                                                                             |
| GET    | /admin/admins                  | Danh sách quản trị viên                                                                                                      |
| POST   | /admin/admins                  | Tạo tài khoản admin (`fullName`, `email`, `password`, `phone`)                                                               |

**Ràng buộc an toàn:**

- Không tự đổi quyền của chính mình; luôn còn ít nhất 1 admin.
- Chỉ khóa / mở khóa được tài khoản có role `user`.
- Tài khoản bị khóa không thể đăng nhập; các request mang cookie cũ cũng bị từ chối (403).

## 6. Sức khỏe hệ thống

| Method | Endpoint | Quyền  | Mô tả                                  |
| ------ | -------- | ------ | -------------------------------------- |
| GET    | /health  | Public | Kiểm tra máy chủ và kết nối SQL Server |
