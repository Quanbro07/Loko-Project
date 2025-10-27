import requests
import json
import time
import sys
import math

# ======================= CẤU HÌNH =======================
# Chỉ cần MỘT API key của Geoapify
GEOAPIFY_API_KEY = "936a7ef652bd479d8fb93d36dc2e1a3e"

INPUT_FILE = "attractions_with_tags.json"
OUTPUT_FILE = "time_matrix.txt"

# API Endpoints của Geoapify
GEOAPIFY_MATRIX_URL = f"https://api.geoapify.com/v1/routematrix?apiKey={GEOAPIFY_API_KEY}"
GEOAPIFY_REVGEOCODE_URL = "https://api.geoapify.com/v1/geocode/reverse"

GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places"

# Nếu 90% đường đi từ một điểm bị lỗi (-1), coi đó là tọa độ hỏng
FAILURE_THRESHOLD = 0.50
# ========================================================


def load_original_locations(input_file):
    """Đọc file JSON gốc để lấy 'title' và tọa độ gốc."""
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{input_file}'.")
        return []
    except json.JSONDecodeError:
        print(f"Lỗi: File '{input_file}' không phải là JSON hợp lệ.")
        return []

def prepare_geoapify_locations(original_locations):
    """
    Chuẩn bị danh sách tọa độ cho Geoapify [lng, lat] từ danh sách đối tượng gốc.
    """
    api_locations = []
    for loc in original_locations:
        if 'latitude' in loc and 'longitude' in loc:
            coords = [loc['longitude'], loc['latitude']]
            api_locations.append({"location": coords})
        else:
            api_locations.append(None) # Thêm placeholder nếu thiếu tọa độ
    return api_locations

def send_geoapify_request(origin_locations, target_locations):
    """Gửi một yêu cầu POST đến API routematrix."""
    headers = {"Content-Type": "application/json"}
    body = {
        "mode": "drive",
        "sources": origin_locations,
        "targets": target_locations
    }
    
    try:
        response = requests.post(GEOAPIFY_MATRIX_URL, headers=headers, data=json.dumps(body))
        response.raise_for_status() 
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối (Geoapify Matrix): {e}")
    return None

def build_matrix_rows_from_response(response):
    """Xử lý JSON, chuyển 'null' hoặc lỗi thành -1."""
    matrix_rows = []
    results = response.get('sources_to_targets')
    if not results: return []

    for row in results:
        row_durations = []
        for element in row:
            time_value = element.get('time') if element else None
            row_durations.append(time_value if time_value is not None else -1)
        matrix_rows.append(row_durations)
    return matrix_rows

def create_time_matrix(api_locations):
    """Hàm chính để tạo ma trận, áp dụng logic chia lô (batching) 1000 elements."""
    num_locations = len(api_locations)
    if num_locations == 0: return []

    valid_locations = [loc for loc in api_locations if loc is not None]
    valid_indices = [i for i, loc in enumerate(api_locations) if loc is not None]
    
    if not valid_locations:
        return [[-1] * num_locations for _ in range(num_locations)]

    num_valid = len(valid_locations)
    max_elements_per_request = 1000
    max_rows_per_request = max(1, max_elements_per_request // num_valid) # Đảm bảo ít nhất là 1
    
    q, r = divmod(num_valid, max_rows_per_request)
    total_requests = q + (1 if r > 0 else 0)
    
    valid_matrix = [] 
    print(f"\nTổng số địa điểm hợp lệ: {num_valid}/{num_locations}")
    print(f"Sẽ thực hiện {total_requests} request đến Geoapify Matrix...")
    
    for i in range(q + (1 if r > 0 else 0)):
        start = i * max_rows_per_request
        end = (i + 1) * max_rows_per_request if i < q else num_valid
        origin_locations = valid_locations[start:end]
        
        response = send_geoapify_request(origin_locations, valid_locations)
        if response:
            valid_matrix.extend(build_matrix_rows_from_response(response))
        else:
            for _ in origin_locations: valid_matrix.append([-1] * num_valid)
        time.sleep(1)

    # Mở rộng ma trận (Re-inflate)
    full_matrix = [[-1] * num_locations for _ in range(num_locations)]
    for i, valid_i in enumerate(valid_indices):
        for j, valid_j in enumerate(valid_indices):
            if i < len(valid_matrix) and j < len(valid_matrix[i]):
                 full_matrix[valid_i][valid_j] = valid_matrix[i][j]
            
    return full_matrix

def find_bad_location_indices(matrix):
    """Phân tích ma trận để tìm các hàng bị lỗi (toàn -1)."""
    bad_indices = []
    if not matrix: return []
    num_locations = len(matrix)
    
    for i, row in enumerate(matrix):
        errors_in_row = sum(1 for j, time in enumerate(row) if time == -1 and i != j)
        total_paths = num_locations - 1
        
        if total_paths > 0 and (errors_in_row / total_paths) >= FAILURE_THRESHOLD:
            bad_indices.append(i)
            
    return bad_indices

def get_corrected_location_geoapify(latitude, longitude):
    """
    SỬA LỖI: Dùng Geoapify Places API để tìm BÃI ĐỖ XE (parking)
    gần nhất với tọa độ bị lỗi.
    """
    RADIUS_METERS = 5000 # Tìm trong bán kính 5km

    params = {
        # Yêu cầu: tìm bãi đỗ xe, hoặc bãi đỗ xe đạp
        "categories": "parking", 
        "filter": f"circle:{longitude},{latitude},{RADIUS_METERS}",
        "limit": 1, # Chỉ cần 1 kết quả gần nhất
        "apiKey": GEOAPIFY_API_KEY
    }
    
    try:
        # SỬ DỤNG ENDPOINT MỚI (GEOAPIFY_PLACES_URL)
        response = requests.get(GEOAPIFY_PLACES_URL, params=params) 
        response.raise_for_status()
        data = response.json()
        
        # Phản hồi Places API có cấu trúc "features"
        if data.get("features"):
            first_result = data["features"][0]
            properties = first_result.get("properties", {})
            
            # Tọa độ nằm trong "properties"
            corrected_lon = properties.get("lon")
            corrected_lat = properties.get("lat")
            
            if corrected_lon and corrected_lat:
                print(f"    -> Đã tìm thấy bãi đỗ xe/lối vào: {properties.get('name', properties.get('address_line1', 'N/A'))}")
                # Trả về đối tượng location đúng định dạng [lng, lat]
                return {"location": [corrected_lon, corrected_lat]}
            else:
                print(f"    -> Đã tìm thấy bãi đỗ xe, nhưng không có tọa độ.")

        else:
            print("    -> Không tìm thấy bãi đỗ xe nào trong bán kính 5km.")

    except requests.exceptions.HTTPError as http_err:
        print(f"    -> Lỗi HTTP (Geoapify Places): {http_err}")
    except requests.exceptions.RequestException as e:
        print(f"    -> Lỗi kết nối (Geoapify Places): {e}")
        
    return None # Trả về None nếu sửa lỗi thất bại

def save_matrix_to_txt(matrix, filename):
    """Lưu ma trận 2D vào file .txt."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            for row in matrix:
                f.write(" ".join(str(e) for e in row) + "\n")
        print(f"\n🎉 Đã lưu ma trận vào file: {filename}")
    except IOError as e:
        print(f"Lỗi khi ghi file output: {e}")

# --- HÀM MAIN (QUY TRÌNH CHÍNH) ---
def main():
    if GEOAPIFY_API_KEY == "YOUR_GEOAPIFY_API_KEY":
        print("LỖI: Vui lòng cấu hình GEOAPIFY_API_KEY.")
        sys.exit(1)
        
    # 1. Tải dữ liệu gốc (để lấy 'title' và tọa độ gốc)
    original_locations = load_original_locations(INPUT_FILE)
    if not original_locations: return
    
    print(f"Đã tải {len(original_locations)} địa điểm từ {INPUT_FILE}.")
    
    # 2. Chuẩn bị tọa độ [lng, lat] cho Geoapify
    api_locations = prepare_geoapify_locations(original_locations)

    # 3. CHẠY LẦN 1 (TEST RUN)
    print("\n--- Bắt đầu Chạy Thử (Lần 1) để tìm lỗi ---")
    matrix_pass1 = create_time_matrix(api_locations)
    
    if not matrix_pass1:
        print("Không thể tạo ma trận lần 1. Dừng lại.")
        return

    # 4. PHÁT HIỆN LỖI
    bad_indices = find_bad_location_indices(matrix_pass1)
    
    if not bad_indices:
        print("\n🎉 Không tìm thấy tọa độ lỗi. Ma trận hợp lệ.")
        save_matrix_to_txt(matrix_pass1, OUTPUT_FILE)
        sys.exit(0)
        
    # 5. SỬA LỖI (Nếu tìm thấy)
    print(f"\n--- Phát hiện {len(bad_indices)} tọa độ lỗi. Bắt đầu Tự động Sửa ---")
    
    corrected_api_locations = api_locations.copy()
    
    for index in bad_indices:
        location = original_locations[index]
        location_name = location.get('title', f"Địa điểm {index}")
        print(f"Đang sửa: {location_name} (Index: {index})...")
        
        # Lấy tọa độ gốc (lat, lon)
        lat = location.get('latitude')
        lon = location.get('longitude')
        
        if lat and lon:
            # Gọi API Reverse Geocode của Geoapify
            new_location_object = get_corrected_location_geoapify(lat, lon)
            
            if new_location_object:
                corrected_api_locations[index] = new_location_object
            else:
                print(f"    -> KHÔNG THỂ sửa lỗi cho {location_name}. Sẽ giữ lỗi -1.")
        else:
             print(f"    -> Bỏ qua {location_name} vì thiếu tọa độ gốc.")
            
    # 6. CHẠY LẦN 2 (FINAL RUN)
    print("\n--- Bắt đầu Chạy Lại (Lần 2) với tọa độ đã sửa ---")
    matrix_pass2 = create_time_matrix(corrected_api_locations)
    
    # 7. LƯU KẾT QUẢ
    save_matrix_to_txt(matrix_pass2, OUTPUT_FILE)
    print("\n--- Đã hoàn tất và lưu ma trận đã sửa ---")

if __name__ == "__main__":
    main()