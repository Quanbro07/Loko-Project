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
| `confirmed-trip.png` | `/currentplan` | Chuyến đi đã xác nhận và lưu vào cơ sở dữ liệu |

Ảnh chụp ở khung 1440×900, xuất từ Playwright ở 2× rồi thu nhỏ, nên nét trên màn hình
retina mà vẫn dưới 300 KB mỗi file.

## Chưa có

| Màn hình | Vì sao chưa chụp được |
|---|---|
| Dự báo thời tiết | Khối thời tiết đứng ở trạng thái *Đang tải* và bảng `weather_section` không có dòng nào. Cần `WEATHER_API_KEY` còn hiệu lực. |
| Bản đồ tỉnh thành đã đi (`/user`) | Bản đồ render được nhưng chập chờn: file geojson 33 MB thường lỗi `ERR_CACHE_WRITE_FAILURE` khi tải trong trình duyệt headless. Rút gọn hình học hoặc chuyển sang file theo từng tỉnh sẽ xử lý được cả vấn đề này lẫn thời gian tải trang. |
| Bản đồ lộ trình trong chuyến đi | Marker và đường đi vẽ đúng, nhưng tile nền OpenStreetMap không kịp tải trong headless nên ảnh ra nền xám. |

## Lưu ý về API key

Lúc chụp, `GEMINI_API_KEY` đã hết hạn — log của AI-Service báo `API_KEY_INVALID`. Vì vậy
cột **Mô tả** trong ảnh lịch trình hiển thị câu mặc định thay vì mô tả do LLM sinh. Phần
xếp lịch bằng OR-Tools không phụ thuộc Gemini nên vẫn chạy đúng.

## Chụp lại như thế nào

```bash
docker compose up -d
```

Đợi frontend compile xong, mở http://localhost:3000, đăng nhập, rồi tạo một chuyến đi
thật. Xem mục [Nạp dữ liệu địa điểm](../../README.md#nạp-dữ-liệu-địa-điểm) ở README gốc
nếu lịch trình không sinh ra được.

Lưu ảnh mới vào chính thư mục này, giữ nguyên tên file để README không phải sửa. Nếu file
vượt 700 KB thì nén lại trước khi commit — repo này vừa được dọn cho gọn.
