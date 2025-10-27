import requests
import json
import sys

# ==============================================================================
# CẢNH BÁO BẢO MẬT: API Key của bạn đang hiển thị rõ trong code.
API_KEY = "c45056e1054eb471aa09bed19faef41ceddf9cce13e88ebdc58238c25a841854" 
# ==============================================================================

def get_city_coordinates(city_name, api_key):
    """
    Bước 1: Lấy tọa độ (lat, lng) của thành phố để làm trung tâm
    cho việc phân trang Attractions.
    """
    print(f"--- [Bước 1] Đang lấy tọa độ trung tâm cho: '{city_name}' ---")
    params = {
        "api_key": api_key,
        "engine": "google_maps",
        "type": "search",
        "q": city_name,
        "hl": "vi",
        "gl": "vn"
    }
    
    try:
        response = requests.get("https://serpapi.com/search.json", params=params)
        response.raise_for_status()
        data = response.json()
        
        gps_coords = None
        
        if "place_results" in data and data["place_results"].get("gps_coordinates"):
            gps_coords = data["place_results"]["gps_coordinates"]
        elif "local_results" in data and len(data["local_results"]) > 0:
            gps_coords = data["local_results"][0].get("gps_coordinates")

        if gps_coords and "latitude" in gps_coords and "longitude" in gps_coords:
            lat = gps_coords["latitude"]
            lng = gps_coords["longitude"]
            ll_string = f"@{lat},{lng},14z" 
            print(f"--- Đã tìm thấy tọa độ (với zoom): {ll_string} ---")
            return ll_string
        else:
            print(f"Lỗi: Không tìm thấy tọa độ cho '{city_name}'.")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối khi lấy tọa độ: {e}")
        return None


def fetch_paginated_attractions(city_name, ll_string):
    """
    Bước 2: Dùng tọa độ đã lấy để tìm các ĐIỂM THAM QUAN (có phân trang).
    """
    query = f"top attractions in {city_name} viet nam"
    all_attractions = []
    
    # === THAY ĐỔI: Giảm từ 5 trang xuống 2 trang để lấy tối đa 40 địa điểm ===
    max_pages = 2
    # =====================================================================
    
    print(f"\n--- [Bước 2] Đang lấy Điểm tham quan: '{query}' (Tối đa {max_pages} trang) ---")

    for page in range(max_pages):
        start_index = page * 20
        print(f"--- Đang lấy trang {page + 1}/{max_pages} (start index: {start_index}) ---")

        params = {
            "api_key": API_KEY,
            "engine": "google_maps",
            "type": "search",
            "q": query,
            "hl": "vi",
            "gl": "vn",
            "start": start_index,
            "ll": ll_string
        }

        try:
            response = requests.get("https://serpapi.com/search.json", params=params)
            response.raise_for_status()
            data = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Lỗi kết nối (Attractions): {e}. Dừng truy vấn.")
            break

        local_results = data.get("local_results")
        
        if not local_results:
            print(f"Trang {page + 1} không có kết quả. Dừng lại.")
            break

        print(f"Trang {page + 1} tìm thấy {len(local_results)} kết quả.")
        
        for item in local_results:
            gps_coords = item.get("gps_coordinates", {})
            attraction_data = {
                "title": item.get("title"),
                "place_id": item.get("place_id"),
                "latitude": gps_coords.get("latitude"),
                "longitude": gps_coords.get("longitude"),
                "types": item.get("types"),
                "operating_hours": item.get("operating_hours"),
                "description": item.get("description")
            }
            all_attractions.append(attraction_data)
            
    return all_attractions


def fetch_single_page_data(query, data_type_name):
    """
    Hàm chung để lấy MỘT trang dữ liệu (cho nhà hàng, khách sạn).
    Không cần 'll' vì không phân trang.
    """
    print(f"\n--- [Bước] Đang lấy 1 trang cho: '{data_type_name}' ---")
    print(f"Truy vấn: '{query}'")

    params = {
        "api_key": API_KEY,
        "engine": "google_maps",
        "type": "search",
        "q": query,
        "hl": "vi",
        "gl": "vn"
    }
    
    try:
        response = requests.get("https://serpapi.com/search.json", params=params)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối khi lấy {data_type_name}: {e}")
        return []

    local_results = data.get("local_results")
    if not local_results:
        print(f"Không tìm thấy kết quả nào cho {data_type_name}.")
        return []

    print(f"Tìm thấy {len(local_results)} kết quả {data_type_name}.")
    
    results_list = []
    # Lặp qua kết quả và trích xuất DÙNG CHUNG CẤU TRÚC
    for item in local_results:
        gps_coords = item.get("gps_coordinates", {})
        result_data = {
            "title": item.get("title"),
            "place_id": item.get("place_id"),
            "latitude": gps_coords.get("latitude"),
            "longitude": gps_coords.get("longitude"),
            "types": item.get("types"),
            "operating_hours": item.get("operating_hours"),
            "description": item.get("description")
        }
        results_list.append(result_data)
    
    return results_list


def save_to_json(data_list, filename):
    """
    Hàm tiện ích để lưu danh sách tổng hợp vào file JSON.
    """
    if not data_list:
        print(f"\nKhông có dữ liệu tổng hợp để lưu.")
        return
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data_list, f, ensure_ascii=False, indent=4)
        print(f"\n🎉 Thành công!")
        print(f"Đã lưu TỔNG CỘNG {len(data_list)} mục vào tệp: '{filename}'")
    except IOError as e:
        print(f"Lỗi khi ghi file '{filename}': {e}")


# --- Hàm main để chạy script ---
if __name__ == "__main__":
    try:
        city_input = input("Nhập tên thành phố (ví dụ: Huế, Hà Nội, Đà Nẵng): ")
        city_input = city_input.strip()
        if not city_input:
            print("Đã hủy. Bạn chưa nhập tên thành phố.")
            sys.exit(0)
        
        # 1. Tạo một danh sách tổng (Master List)
        all_places_list = []
        
        filename_safe_city = city_input.lower().replace(' ', '_')
        output_filename = f"{filename_safe_city}_attractions.json" # Tên file output cuối cùng

        # --- 2. Lấy tọa độ (Bắt buộc cho Attractions) ---
        ll_string = get_city_coordinates(city_input, API_KEY)
        
        # --- 3. Xử lý Attractions (Phân trang) ---
        if ll_string:
            attractions_list = fetch_paginated_attractions(city_input, ll_string)
            all_places_list.extend(attractions_list)
            print(f"-> Đã thêm {len(attractions_list)} điểm tham quan vào danh sách tổng.")
        else:
            print("\nBỏ qua tìm Attractions vì không lấy được tọa độ.")

        # --- 4. Xử lý Restaurants (1 trang) ---
        restaurant_query = f"top restaurants in {city_input} in vietnam"
        restaurants_list = fetch_single_page_data(restaurant_query, "Nhà hàng")
        
        # === THAY ĐỔI: Chỉ lấy 5 nhà hàng đầu tiên ===
        restaurants_list = restaurants_list[:5]
        # ============================================
        
        all_places_list.extend(restaurants_list)
        print(f"-> Đã thêm {len(restaurants_list)} nhà hàng vào danh sách tổng.")

        # --- 5. Xử lý Hotels (1 trang) ---
        hotel_query = f"top hotels in {city_input} in vietnam"
        hotels_list = fetch_single_page_data(hotel_query, "Khách sạn")
        
        # === THAY ĐỔI: Chỉ lấy 5 khách sạn đầu tiên ===
        hotels_list = hotels_list[:5]
        # ==========================================
        
        all_places_list.extend(hotels_list)
        print(f"-> Đã thêm {len(hotels_list)} khách sạn vào danh sách tổng.")
        
        # --- 6. Lưu file MỘT LẦN DUY NHẤT ---
        save_to_json(all_places_list, output_filename)
        
        print("\n--- Hoàn tất tất cả truy vấn ---")

    except KeyboardInterrupt:
        print("\nĐã dừng chương trình.")
        sys.exit(0)