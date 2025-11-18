import json

# --- Tên file (sử dụng tên file gốc) ---
INPUT_SCHEDULE_FILE = 'schedule.json'
# Tên file output quay về tên gốc
OUTPUT_REQUEST_FILE = 'geoapify_request.json' 

# --- Chế độ di chuyển (thay đổi tại đây) ---
TRAVEL_MODE = 'drive'

def create_geoapify_requests_by_day():
    """
    Đọc file schedule.json (cấu trúc theo ngày),
    trích xuất tọa độ cho mỗi ngày,
    và tạo một file JSON chứa các request cho từng ngày.
    """
    
    print(f"Đang đọc file đầu vào: {INPUT_SCHEDULE_FILE}...")
    
    # 1. Đọc file schedule.json
    try:
        with open(INPUT_SCHEDULE_FILE, 'r', encoding='utf-8') as f:
            schedule_data = json.load(f)
            
            if not isinstance(schedule_data, dict):
                print("Lỗi: Dữ liệu trong 'schedule.json' không phải là một đối tượng (dictionary).")
                return

    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{INPUT_SCHEDULE_FILE}'.")
        return
    except json.JSONDecodeError:
        print(f"Lỗi: File '{INPUT_SCHEDULE_FILE}' không phải là file JSON hợp lệ.")
        return
    except Exception as e:
        print(f"Đã xảy ra lỗi không xác định khi đọc file: {e}")
        return

    all_requests = {}
    
    # 2. Duyệt qua từng ngày trong file JSON
    for day_name, locations_list in schedule_data.items():
        print(f"-> Đang xử lý {day_name}...")
        
        if not isinstance(locations_list, list):
            print(f"Cảnh báo: Dữ liệu cho '{day_name}' không phải là danh sách, bỏ qua.")
            continue
            
        waypoints = []
        try:
            # 3. Trích xuất tọa độ [longitude, latitude] cho ngày
            for i, item in enumerate(locations_list):
                lon = item['longitude']
                lat = item['latitude']
                waypoints.append([lon, lat])
            
            print(f"   Đã trích xuất {len(waypoints)} điểm tọa độ cho {day_name}.")

            # 4. Tạo cấu trúc request cho ngày
            api_request_body = {
                "mode": TRAVEL_MODE,
                "waypoints": waypoints
            }
            
            all_requests[day_name] = api_request_body

        except KeyError as e:
            print(f"Lỗi: Dữ liệu trong '{day_name}' (phần tử thứ {i}) thiếu trường {e}.")
        except TypeError:
            print(f"Lỗi: Cấu trúc dữ liệu trong '{day_name}' không đúng (phần tử thứ {i}).")

    
    # 5. Ghi tất cả request của các ngày ra 1 file
    try:
        with open(OUTPUT_REQUEST_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_requests, f, indent=4, ensure_ascii=False)
            
        print(f"\n✅ Hoàn tất! Đã tạo file request theo ngày tại: {OUTPUT_REQUEST_FILE}")

    except Exception as e:
        print(f"Đã xảy ra lỗi khi ghi file đầu ra: {e}")

# Chạy hàm
if __name__ == "__main__":
    create_geoapify_requests_by_day()