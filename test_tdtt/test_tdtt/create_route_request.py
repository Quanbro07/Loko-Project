import json

# --- Tên file (bạn có thể thay đổi nếu cần) ---
INPUT_SCHEDULE_FILE = 'schedule.json'
OUTPUT_REQUEST_FILE = 'geoapify_request.json'

# --- Chế độ di chuyển (thay đổi tại đây) ---
# Các lựa chọn phổ biến: "drive", "walk", "bicycle", "motorcycle"
TRAVEL_MODE = 'drive'

def create_geoapify_request():
    """
    Đọc file schedule.json, trích xuất tọa độ,
    và tạo file JSON request cho Geoapify Routing API.
    """
    
    print(f"Đang đọc file đầu vào: {INPUT_SCHEDULE_FILE}...")
    
    # 1. Đọc file schedule.json
    try:
        with open(INPUT_SCHEDULE_FILE, 'r', encoding='utf-8') as f:
            schedule_data = json.load(f)
            
            if not isinstance(schedule_data, list):
                print("Lỗi: Dữ liệu trong 'schedule.json' không phải là một danh sách (list).")
                return

    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{INPUT_SCHEDULE_FILE}'.")
        print("Vui lòng đảm bảo file này tồn tại trong cùng thư mục với script.")
        return
    except json.JSONDecodeError:
        print(f"Lỗi: File '{INPUT_SCHEDULE_FILE}' không phải là file JSON hợp lệ.")
        return
    except Exception as e:
        print(f"Đã xảy ra lỗi không xác định khi đọc file: {e}")
        return

    # 2. Trích xuất tọa độ [longitude, latitude]
    waypoints = []
    try:
        for i, item in enumerate(schedule_data):
            # API của Geoapify yêu cầu định dạng [longitude, latitude]
            lon = item['longitude']
            lat = item['latitude']
            waypoints.append([lon, lat])
            
        print(f"Đã trích xuất {len(waypoints)} điểm tọa độ.")

    except KeyError as e:
        print(f"Lỗi: Dữ liệu trong 'schedule.json' (phần tử thứ {i}) thiếu trường {e}.")
        return
    except TypeError:
        print(f"Lỗi: Cấu trúc dữ liệu trong 'schedule.json' không đúng (phần tử thứ {i}).")
        return

    # 3. Tạo cấu trúc (body) cho request API
    api_request_body = {
        "mode": TRAVEL_MODE,
        "waypoints": waypoints
    }
    
    # 4. Ghi ra file JSON mới
    try:
        with open(OUTPUT_REQUEST_FILE, 'w', encoding='utf-8') as f:
            # indent=4 để file JSON đẹp, dễ đọc
            # ensure_ascii=False để giữ nguyên các ký tự (nếu có)
            json.dump(api_request_body, f, indent=4, ensure_ascii=False)
            
        print(f"\n✅ Hoàn tất! Đã tạo file request tại: {OUTPUT_REQUEST_FILE}")
        print("Bạn có thể dùng file này làm 'body' khi gọi POST đến API của Geoapify.")

    except Exception as e:
        print(f"Đã xảy ra lỗi khi ghi file đầu ra: {e}")

# Chạy hàm
if __name__ == "__main__":
    create_geoapify_request()