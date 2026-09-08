# AI-Service

Tầng tính toán của Loko: nhận danh sách địa điểm ứng viên và ràng buộc của người dùng,
trả về **lịch trình theo khung giờ** cho từng ngày.

Bài toán được mô hình hoá thành **VRPTW** (Vehicle Routing Problem with Time Windows) và
giải bằng **Google OR-Tools**. Xem phần [Thuật toán lập lịch](../README.md#thuật-toán-lập-lịch)
ở README gốc để biết chi tiết mô hình.

## Chạy

```bash
python -m venv venv && venv\Scripts\activate     # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                             # rồi điền API key
uvicorn app.main:app --reload --port 8000
```

Tài liệu API tự sinh: http://localhost:8000/docs

## Endpoint

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/schedule/generate` | Giải VRPTW rồi để LLM điền mô tả hoạt động |
| POST | `/api/v1/routing/generate` | Tính tuyến đường giữa các điểm |
| POST | `/api/v1/locations/sync-locations` | Crawl và gắn tag địa điểm mới |
| POST | `/api/v1/weather/forecast` | Dự báo thời tiết theo ngày |
| GET | `/ping` | Health check |

## Cấu trúc

```
app/
├── solvers/        8 solver VRPTW, kế thừa từ base_solver.py
│                   Mỗi profile ghi đè _add_profile_specific_constraints()
├── tag_rules/      Bộ quy tắc tính service time & penalty theo từng profile
├── services/
│   ├── schedule_service.py   Dựng instance bài toán, gọi solver, ghép nhiều ngày
│   ├── matrix_service.py     Ma trận thời gian di chuyển (Geoapify, có chia lô)
│   ├── tagging_service.py    Gắn tag địa điểm bằng Gemini
│   ├── activity_service.py   Sinh mô tả hoạt động bằng Gemini
│   ├── crawler_service.py    Thu thập dữ liệu địa điểm
│   ├── routing_service.py    Tính tuyến đường
│   └── weather_service.py    Dự báo thời tiết
├── routers/        Endpoint HTTP
├── schemas/        DTO Pydantic cho request/response
└── core/           Cấu hình, hằng số, mapping tag
categories_creator/ Script sinh dữ liệu địa điểm theo từng phân loại
tests/              Test cho tầng solver (chạy offline)
```

## Thêm một profile mới

1. Tạo `app/tag_rules/<ten>_profile.py` — quy định service time và penalty theo tag.
2. Tạo `app/solvers/<ten>_solver.py` kế thừa `BaseSolver`, ghi đè
   `_add_profile_specific_constraints()` để thêm ràng buộc riêng.
3. Đăng ký profile trong `app/core/mappings.py`.
4. Thêm test cho ràng buộc mới vào `tests/`.

## Test

```bash
pip install -r requirements-dev.txt
pytest
```

Test **không** gọi API ngoài và **không** cần API key — chúng dựng thẳng instance bài toán
rồi kiểm tra các bất biến của mô hình (khung giờ, thời gian cộng dồn, độ dài ngày, cơ chế
bỏ điểm qua `AddDisjunction`, và các ràng buộc mềm về giờ ăn / giờ đi chơi đêm).

Một lưu ý khi viết thêm test: dimension `Time` khai báo `slack_max = 60`, nghĩa là lịch
trình **không thể "chờ không" quá 60 phút tại mỗi điểm**. Muốn kiểm tra hành vi vào buổi
tối thì instance phải có đủ điểm để đồng hồ chạy thật đến giờ đó — xem
`tests/test_food_solver.py::full_day_instance`.
