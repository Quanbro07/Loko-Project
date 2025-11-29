import json
import requests
import time

# --- Cấu hình ---
API_KEY = "936a7ef652bd479d8fb93d36dc2e1a3e"
API_BASE_URL = "https://api.geoapify.com/v1/routing"

# --- Tên file ---
REQUEST_FILE = "geoapify_request.json"
OUTPUT_RESPONSE_FILE = "route_response.json"
OUTPUT_GEOMETRY_FILE = "route_geometry.json"

def get_segment_route(start_point, end_point, mode):
    """
    Gọi API cho 2 điểm. 
    Trả về danh sách tọa độ nếu thành công.
    Trả về đường thẳng nối 2 điểm nếu thất bại (qua biển/lỗi).
    """
    # Chuyển đổi sang format "lat,lon" cho URL
    waypoints_str = f"{start_point[1]},{start_point[0]}|{end_point[1]},{end_point[0]}"
    
    params = {
        'waypoints': waypoints_str,
        'mode': mode,
        'apiKey': API_KEY
    }
    
    try:
        response = requests.get(API_BASE_URL, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'features' in data and len(data['features']) > 0:
                # API trả về Geometry dạng LineString -> lấy coordinates
                # coordinates là list các [lon, lat]
                return data['features'][0]['geometry']['coordinates']
    except Exception as e:
        print(f"      ⚠️ Lỗi kết nối segment: {e}")
    
    # Fallback: Nếu lỗi hoặc không tìm thấy đường -> Trả về đường thẳng
    print("      -> Không tìm thấy đường bộ (có thể qua biển), dùng đường thẳng.")
    return [start_point, end_point]

def call_geoapify_api_smart():
    print(f"📂 Đang đọc file request: {REQUEST_FILE}...")
    
    try:
        with open(REQUEST_FILE, 'r', encoding='utf-8') as f:
            all_requests_data = json.load(f)
    except Exception as e:
        print(f"❌ Lỗi đọc file: {e}")
        return
    
    final_geometries = {}

    for day_key, request_data in all_requests_data.items():
        print(f"\n🚀 Đang xử lý {day_key}...")
        mode = request_data['mode']
        waypoints = request_data['waypoints'] # List các [lon, lat]
        
        day_segments_coordinates = [] # Chứa danh sách các đoạn đường
        
        # Duyệt qua từng cặp điểm (A->B, B->C, ...)
        for i in range(len(waypoints) - 1):
            start_pt = waypoints[i]
            end_pt = waypoints[i+1]
            
            print(f"   - Đoạn {i+1}: Từ {start_pt} đến {end_pt}...", end=" ")
            
            # Gọi hàm xử lý từng đoạn
            segment_coords = get_segment_route(start_pt, end_pt, mode)
            
            # Thêm đoạn đường này vào danh sách của ngày
            day_segments_coordinates.append(segment_coords)
            
            if len(segment_coords) > 2:
                print("OK (Đường bộ)")
            else:
                print("OK (Đường thẳng)")
                
            time.sleep(0.2) # Nghỉ xíu tránh spam API

        # Lưu kết quả dạng MultiLineString
        final_geometries[day_key] = {
            "type": "MultiLineString",
            "coordinates": day_segments_coordinates
        }

    # Lưu file kết quả
    try:
        with open(OUTPUT_GEOMETRY_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_geometries, f, indent=4, ensure_ascii=False)
        print(f"\n✅ HOÀN TẤT! File lộ trình đã lưu tại: {OUTPUT_GEOMETRY_FILE}")
        print("   (Các đoạn qua biển đã được nối bằng đường thẳng)")
        
    except Exception as e:
        print(f"❌ Lỗi khi lưu file: {e}")

if __name__ == "__main__":
    call_geoapify_api_smart()