# Ảnh chụp màn hình

Thư mục này chứa ảnh dùng cho mục **Giao diện** ở [README gốc](../../README.md).

## Cần chụp những gì

Chụp đúng 5 ảnh dưới đây, lưu vào chính thư mục này với đúng tên file. Ảnh nào
chưa có thì bỏ dòng tương ứng ra khỏi khối markdown ở cuối file này.

| Tên file | Màn hình | Chụp cái gì |
|---|---|---|
| `plan-input.png` | `/search` | Form nhập điểm đến, số ngày, sở thích, nhóm đi cùng — cho thấy hệ thống nhận vào gì |
| `itinerary.png` | `/currentplan` | **Ảnh quan trọng nhất.** Lịch trình đã sinh, thấy rõ khung giờ từng điểm trong ngày |
| `regenerate.png` | `/currentplan` | Thao tác từ chối một điểm và tạo lại phần lịch trình đó |
| `visited-map.png` | `/user` | Bản đồ tỉnh thành đã đi qua |
| `weather.png` | `/currentplan` | Dự báo thời tiết gắn theo ngày trong lịch trình |

## Cách chụp cho đẹp

- Chụp ở cửa sổ rộng khoảng **1440×900**, đừng chụp cả màn hình.
- Dùng dữ liệu thật, đừng để form trống hay danh sách rỗng.
- Che email và tên thật nếu có hiện trên màn hình.
- Xuất PNG. Nếu file quá 1 MB thì nén lại (TinyPNG hoặc `pngquant`) —
  repo này vừa được dọn cho gọn, đừng làm nó phình lại.

## Cách chạy để có dữ liệu chụp

```bash
docker compose up --build
```

Chờ cả 4 service lên, mở http://localhost:3000, đăng ký một tài khoản, rồi tạo
một chuyến đi thật. Lịch trình sinh ra mới là thứ đáng chụp.

## Khối markdown để dán vào README gốc

Chụp xong thì chèn nguyên khối này vào `README.md`, đặt ngay sau mục
**Tính năng** và trước mục **Kiến trúc**:

```markdown
---

## Giao diện

### Nhập yêu cầu chuyến đi

![Màn hình nhập yêu cầu chuyến đi](docs/screenshots/plan-input.png)

### Lịch trình sinh tự động

Kết quả của bộ giải VRPTW: từng điểm được gán khung giờ cụ thể, tôn trọng giờ
mở cửa và thời gian di chuyển thực tế giữa các điểm.

![Lịch trình chi tiết theo khung giờ](docs/screenshots/itinerary.png)

### Tạo lại một phần lịch trình

Từ chối một điểm thì chỉ phần lịch trình liên quan được xếp lại, các điểm đã
từ chối bị hạ mức ưu tiên nên không lặp lại.

![Tạo lại một phần lịch trình](docs/screenshots/regenerate.png)

### Bản đồ tỉnh thành đã đi qua

![Bản đồ tỉnh thành đã đi qua](docs/screenshots/visited-map.png)

### Thời tiết theo ngày

![Dự báo thời tiết theo ngày](docs/screenshots/weather.png)
```
