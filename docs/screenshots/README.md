# Ảnh chụp màn hình

Ảnh dùng cho mục **Giao diện** ở [README gốc](../../README.md). Tất cả đều chụp từ ứng
dụng chạy thật bằng `docker compose up`, dữ liệu Hà Nội khôi phục từ dump trong
`db_command/`.

## Đã có

| File | Màn hình | Nội dung |
|---|---|---|
| `plan-input.jpg` | `/search` bước 1 | Chọn tỉnh/thành điểm đến |
| `plan-preferences.jpg` | `/search` bước 4 | Chọn thể loại chuyến đi và khung giờ hoạt động |
| `itinerary.png` | `/search` sau khi tìm kiếm | Lịch trình sinh tự động, từng điểm có khung giờ |

Ảnh chụp ở khung 1440×900, xuất từ Playwright ở 2× rồi thu nhỏ, nên nét trên màn hình
retina mà vẫn dưới 300 KB mỗi file.

## Chưa có

| Màn hình | Vì sao chưa chụp được |
|---|---|
| Bản đồ tỉnh thành đã đi (`/user`) | Bản đồ render đúng nhưng đang ở trạng thái rỗng `0/34 tỉnh`, vì tài khoản demo chưa hoàn thành chuyến đi nào. Cần một chuyến đi đã xác nhận và đánh dấu hoàn thành thì ảnh mới có ý nghĩa. |
| Chuyến đi hiện tại (`/currentplan`) | Bước xác nhận lịch trình lỗi 500: cột `trip_detail.route_polyline` khai `varchar(255)` nhưng chuỗi polyline dài hơn nhiều. Sửa kiểu cột thành `text` là qua được. |
| Dự báo thời tiết | Nằm trong màn hình chuyến đi hiện tại, phụ thuộc lỗi trên. |

## Chụp lại như thế nào

```bash
docker compose up -d
```

Đợi frontend compile xong, mở http://localhost:3000, đăng nhập, rồi tạo một chuyến đi
thật. Xem mục [Nạp dữ liệu địa điểm](../../README.md#nạp-dữ-liệu-địa-điểm) ở README gốc
nếu lịch trình không sinh ra được.

Lưu ảnh mới vào chính thư mục này, giữ nguyên tên file để README không phải sửa. Nếu file
vượt 700 KB thì nén lại trước khi commit — repo này vừa được dọn cho gọn.
