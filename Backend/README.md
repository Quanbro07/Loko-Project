# Backend

API chính của Loko (Spring Boot 3, Java 21). Là nguồn sự thật về dữ liệu người dùng,
địa điểm và chuyến đi; đồng thời điều phối các lời gọi sang [AI-Service](../AI-Service).

## Chạy

Thông thường chạy qua Docker Compose ở thư mục gốc. Chạy riêng khi phát triển:

```bash
cp .env.example .env          # rồi điền thông tin SMTP
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

> Repo không commit Maven wrapper, nên cần cài sẵn Maven và JDK 21.

Profile `dev` dùng PostgreSQL và Redis ở `localhost`, `ddl-auto: create-drop`.
Profile `product` (mặc định khi chạy trong Docker) đọc toàn bộ cấu hình từ biến môi trường.

Biến `JWT_SECRET` là **bắt buộc** — thiếu thì ứng dụng dừng ngay lúc khởi động.
Tạo khoá mới: `openssl rand -base64 64`.

## Cấu trúc

Code tổ chức theo **tính năng**, mỗi package tự chứa entity, repository, service,
controller và DTO của riêng nó.

```
com/exproject/backend/
├── authenticate/     Đăng ký, đăng nhập, xác thực email OTP, đổi/quên mật khẩu
├── config/           Spring Security, JwtService, JwtAuthenticationFilter, CORS
├── aiAPI/            Client gọi sang AI-Service
├── makePlan/         Điều phối luồng sinh & tạo lại lịch trình
├── trip/             Chuyến đi
├── trip_detail/      Từng mục trong lịch trình
├── trip_section/     Chặng của chuyến đi
├── trip_history/     Lịch sử chuyến đi
├── location/         Địa điểm
├── location_img/     Ảnh địa điểm
├── location_category/ Phân loại địa điểm
├── review_location/  Đánh giá địa điểm
├── province/         Tỉnh thành
├── hobby/            Sở thích du lịch của người dùng
├── user/ · avatar/   Hồ sơ người dùng
├── pdf/              Xuất lịch trình ra PDF
├── email/            Gửi email xác thực
├── exception/        GlobalExceptionHandle + các exception nghiệp vụ
├── initializer/      Nạp dữ liệu nền lúc khởi động (tỉnh thành, phân loại, admin...)
└── redis/            Cấu hình Spring Cache trên Redis
```

## Ghi chú

- **Xác thực:** JWT access token (30 phút) + refresh token (24 giờ), ký HS512.
  Khoá ký đọc từ `${JWT_SECRET}`, không hardcode trong source.
- **Cache:** `@Cacheable` trên Redis cho danh sách địa điểm nổi bật theo tỉnh
  (`top_locations_dto`) và chi tiết chuyến đi (`full_trip`).
- **Tác vụ định kỳ:** `MasterScheduler` đồng bộ dữ liệu địa điểm theo phân loại,
  tiến độ lưu ở bảng `category_sync_stat`.
- **Xử lý lỗi:** tập trung ở `exception/GlobalExceptionHandle.java`.

Danh sách endpoint: xem [API chính](../README.md#api-chính) ở README gốc.
