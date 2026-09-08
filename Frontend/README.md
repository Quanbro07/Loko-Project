# Frontend

Giao diện người dùng của Loko (React, Create React App).

## Chạy

Thông thường chạy qua Docker Compose ở thư mục gốc. Chạy riêng khi phát triển:

```bash
npm install
npm start
```

Mặc định mở tại http://localhost:3000 và gọi backend ở http://localhost:8080.

## Route

| Đường dẫn | Màn hình | Quyền |
|---|---|---|
| `/` · `/homepage` | Trang chủ | công khai |
| `/aboutus` | Giới thiệu | công khai |
| `/auth` · `/auth/verify` | Đăng nhập / đăng ký / xác thực email | công khai |
| `/purchase` | Nâng cấp gói | công khai |
| `/search` | Nhập yêu cầu và sinh lịch trình | `USER`, `VIP` |
| `/currentplan` | Xem và chỉnh sửa lịch trình hiện tại | `USER`, `VIP` |
| `/user` | Hồ sơ, sở thích, lịch sử chuyến đi | `USER`, `VIP` |
| `/admin` | Bảng điều khiển quản trị | `ADMIN` |

Phân quyền thực hiện qua `ProtectedRoute`, dựa trên role lấy từ JWT.

## Cấu trúc

Mỗi thư mục trong `src/` là một màn hình hoặc một khối giao diện, gồm cả `.jsx` và `.css`
đi kèm.

```
src/
├── Auth/            Đăng nhập, đăng ký, xác thực email, AuthContext
├── ProtectedRoute/  Chặn route theo role
├── MainLayout/      Khung chung (Navbar + Footer)
├── Homepage/        Trang chủ
├── Input/           Form nhập yêu cầu chuyến đi
├── Plan/            Luồng sinh lịch trình
├── CurrentPlan/     Lịch trình hiện tại, chấp nhận / tạo lại từng phần
├── CurrentPlace/    Chi tiết một điểm trong lịch trình
├── Output*/         Hiển thị kết quả lịch trình
├── Map/ · Province/ Bản đồ tỉnh thành đã đi qua
├── TripHistory/ · TripList/   Lịch sử chuyến đi
├── WeatherForecast/ Dự báo thời tiết
├── User/ · UserList/          Hồ sơ và quản lý người dùng
├── AdminDashboard/  Bảng điều khiển quản trị
├── PremiumFeature/ · Purchase/ · Ad/   Gói premium
└── img/ · lottie/   Tài nguyên tĩnh
```

## Script

| Lệnh | Mô tả |
|---|---|
| `npm start` | Chạy chế độ phát triển |
| `npm run build` | Build bản production vào `build/` |
| `npm test` | Chạy test (React Testing Library) |
