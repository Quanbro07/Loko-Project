import json
import requests  # Bạn cần cài thư viện này

# --- Cấu hình ---
API_KEY = "936a7ef652bd479d8fb93d36dc2e1a3e"
# Chúng ta sẽ xây dựng URL đầy đủ bên dưới
API_BASE_URL = "https://api.geoapify.com/v1/routing"

# --- Tên file (đầu vào và đầu ra) ---
REQUEST_FILE = "geoapify_request.json"
OUTPUT_RESPONSE_FILE = "route_response.json"
OUTPUT_GEOMETRY_FILE = "route_geometry.json"

def call_geoapify_api_get():
    """
    Đọc file request, chuyển đổi nó sang tham số GET,
    gọi API Geoapify và lưu kết quả.
    """
    
    # 1. Đọc file JSON request đã tạo ở bước trước
    try:
        with open(REQUEST_FILE, 'r', encoding='utf-8') as f:
            request_data = json.load(f)
        print(f"Đã đọc thành công file request: {REQUEST_FILE}")
        
        mode = request_data['mode']
        waypoints_lon_lat = request_data['waypoints']

    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{REQUEST_FILE}'.")
        print("Vui lòng chạy script 'create_route_request.py' trước.")
        return
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Lỗi: File '{REQUEST_FILE}' bị lỗi hoặc thiếu dữ liệu: {e}")
        return

    # 2. Chuyển đổi Waypoints sang định dạng GET
    # POST dùng: [[lon, lat], [lon, lat]]
    # GET dùng: "lat,lon|lat,lon"
    try:
        waypoints_get_format = []
        for point in waypoints_lon_lat:
            # Đảo ngược từ [lon, lat] sang "lat,lon"
            lat = point[1]
            lon = point[0]
            waypoints_get_format.append(f"{lat},{lon}")
        
        # Nối tất cả các điểm bằng dấu |
        waypoints_string = "|".join(waypoints_get_format)

    except (IndexError, TypeError) as e:
        print(f"Lỗi: Dữ liệu waypoint trong '{REQUEST_FILE}' không đúng định dạng: {e}")
        return

    # 3. Xây dựng URL cho yêu cầu GET
    params = {
        'waypoints': waypoints_string,
        'mode': mode,
        'apiKey': API_KEY
    }
    
    # 4. Gửi yêu cầu GET đến API
    print(f"Đang gửi yêu cầu (GET) đến API của Geoapify...")
    try:
        response = requests.get(API_BASE_URL, params=params)
        
        # Kiểm tra mã trạng thái (status code)
        if response.status_code == 200:
            print(f"✅ Yêu cầu API thành công (Status code: {response.status_code})")
            response_data = response.json()
            
            # 5. Lưu toàn bộ file JSON kết quả
            with open(OUTPUT_RESPONSE_FILE, 'w', encoding='utf-8') as f:
                json.dump(response_data, f, indent=4, ensure_ascii=False)
            print(f"Đã lưu toàn bộ kết quả vào: {OUTPUT_RESPONSE_FILE}")

            # 6. Trích xuất và lưu riêng phần GeoJSON (để vẽ bản đồ)
            try:
                geometry = response_data['features'][0]['geometry']
                
                with open(OUTPUT_GEOMETRY_FILE, 'w', encoding='utf-8') as f:
                    json.dump(geometry, f, indent=4, ensure_ascii=False)
                print(f"Đã trích xuất và lưu lộ trình (GeoJSON) vào: {OUTPUT_GEOMETRY_FILE}")
                print("\nBạn có thể dùng file này để vẽ đường đi lên bản đồ.")

            except (KeyError, IndexError, TypeError):
                print(f"Lỗi: Không thể trích xuất 'geometry' từ kết quả.")
                print("File 'route_response.json' vẫn được lưu để bạn kiểm tra.")

        else:
            # Xử lý lỗi từ API
            print(f"Lỗi! API trả về mã trạng thái: {response.status_code}")
            print(f"Nội dung lỗi: {response.text}")

    except requests.exceptions.ConnectionError:
        print("Lỗi: Không thể kết nối đến API. Vui lòng kiểm tra mạng.")
    except requests.exceptions.RequestException as e:
        print(f"Đã xảy ra lỗi với yêu cầu API: {e}")

# Chạy hàm
if __name__ == "__main__":
    call_geoapify_api_get()