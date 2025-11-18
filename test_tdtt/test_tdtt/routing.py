import json
import requests  # Bạn cần cài thư viện này
import time      # Thêm thư viện time để tạm dừng
 
# --- Cấu hình ---
API_KEY = "936a7ef652bd479d8fb93d36dc2e1a3e"
API_BASE_URL = "https://api.geoapify.com/v1/routing"

# --- Tên file (sử dụng tên file gốc) ---
REQUEST_FILE = "geoapify_request.json"
OUTPUT_RESPONSE_FILE = "route_response.json"
OUTPUT_GEOMETRY_FILE = "route_geometry.json"

def call_geoapify_api_by_day():
    """
    Đọc file request theo ngày, gọi API Geoapify cho mỗi ngày
    và lưu kết quả theo cấu trúc ngày.
    """
    
    # 1. Đọc file JSON request đã tạo ở bước 1
    try:
        with open(REQUEST_FILE, 'r', encoding='utf-8') as f:
            all_requests_data = json.load(f)
        print(f"Đã đọc thành công file request: {REQUEST_FILE}")
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{REQUEST_FILE}'.")
        print("Vui lòng chạy script 'create_route_request.py' trước.")
        return
    except json.JSONDecodeError:
        print(f"Lỗi: File '{REQUEST_FILE}' không phải là JSON hợp lệ.")
        return
    
    all_responses = {}
    all_geometries = {}

    # 2. Duyệt qua từng ngày và gọi API
    for day_name, request_data in all_requests_data.items():
        print(f"\n--- Đang xử lý {day_name} ---")
        
        try:
            mode = request_data['mode']
            waypoints_lon_lat = request_data['waypoints']

            # 3. Chuyển đổi Waypoints sang định dạng GET (lat,lon|lat,lon)
            waypoints_get_format = []
            for point in waypoints_lon_lat:
                lat = point[1]
                lon = point[0]
                waypoints_get_format.append(f"{lat},{lon}")
            
            waypoints_string = "|".join(waypoints_get_format)
            
            # 4. Xây dựng URL cho yêu cầu GET
            params = {
                'waypoints': waypoints_string,
                'mode': mode,
                'apiKey': API_KEY
            }

            # 5. Gửi yêu cầu GET
            print(f"Đang gửi yêu cầu (GET) cho {day_name}...")
            response = requests.get(API_BASE_URL, params=params)

            # 6. Xử lý kết quả
            if response.status_code == 200:
                print(f"✅ Yêu cầu API thành công cho {day_name} (Status code: 200)")
                response_data = response.json()
                all_responses[day_name] = response_data # Lưu response đầy đủ

                # Trích xuất geometry
                try:
                    geometry = response_data['features'][0]['geometry']
                    all_geometries[day_name] = geometry # Lưu geometry
                    print(f"-> Đã trích xuất geometry cho {day_name}.")
                except (KeyError, IndexError, TypeError):
                    print(f"Lỗi: Không thể trích xuất 'geometry' cho {day_name}.")
                    all_geometries[day_name] = None
            
            else:
                print(f"Lỗi! API trả về mã trạng thái {response.status_code} cho {day_name}")
                print(f"Nội dung lỗi: {response.text}")
                all_responses[day_name] = {"error": response.text, "status_code": response.status_code}
                all_geometries[day_name] = None

        except Exception as e:
            print(f"Đã xảy ra lỗi ngoài ý muốn khi xử lý {day_name}: {e}")
        
        time.sleep(0.5) # Tạm dừng 0.5 giây giữa các lần gọi để tránh spam API

    # 7. Ghi tất cả kết quả ra file
    try:
        with open(OUTPUT_RESPONSE_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_responses, f, indent=4, ensure_ascii=False)
        print(f"\nĐã lưu toàn bộ kết quả response vào: {OUTPUT_RESPONSE_FILE}")

        with open(OUTPUT_GEOMETRY_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_geometries, f, indent=4, ensure_ascii=False)
        print(f"Đã lưu toàn bộ lộ trình (GeoJSON) vào: {OUTPUT_GEOMETRY_FILE}")
        print("\nĐây là file bạn cần để vẽ lên bản đồ.")
        
    except Exception as e:
        print(f"Đã xảy ra lỗi khi ghi file đầu ra: {e}")

# Chạy hàm
if __name__ == "__main__":
    call_geoapify_api_by_day()