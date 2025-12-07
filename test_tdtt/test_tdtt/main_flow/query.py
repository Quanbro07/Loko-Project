import requests
import json
import sys
import os

# ======================================================================
# CẢNH BÁO: Không nên public API Key này nếu bạn đẩy code lên GitHub!
API_KEY = "c45056e1054eb471aa09bed19faef41ceddf9cce13e88ebdc58238c25a841854"
# ======================================================================


def get_city_coordinates(city_name, api_key):
    """
    Bước 1: Lấy tọa độ (lat, lng) của thành phố để làm trung tâm tìm kiếm.
    (Giữ nguyên logic cũ)
    """
    print(f"--- [Bước 1] Lấy tọa độ trung tâm cho '{city_name}' ---")
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

        if gps_coords:
            lat, lng = gps_coords.get("latitude"), gps_coords.get("longitude")
            if lat and lng:
                ll_string = f"@{lat},{lng},14z"
                print(f"--- Tọa độ: {ll_string} ---")
                return ll_string

        print(f"Lỗi: Không tìm thấy tọa độ cho '{city_name}'.")
        return None

    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối khi lấy tọa độ: {e}")
        return None


def fetch_top_places(city_name, ll_string, type_of_place):
    """
    Bước 2: Tìm top địa điểm và map sang cấu trúc JSON mới.
    """
    query = f"{type_of_place} in {city_name} in vietnam"
    print(f"\n--- [Bước 2] Tìm kiếm: '{query}' ---")

    params = {
        "api_key": API_KEY,
        "engine": "google_maps",
        "type": "search",
        "q": query,
        "hl": "vi",
        "gl": "vn",
        "ll": ll_string
    }

    try:
        response = requests.get("https://serpapi.com/search.json", params=params)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối khi tìm {type_of_place}: {e}")
        return []

    local_results = data.get("local_results", [])
    if not local_results:
        print(f"Không tìm thấy kết quả nào cho '{type_of_place}'.")
        return []

    print(f"Tìm thấy {len(local_results)} kết quả, lấy 20 đầu tiên.")
    
    results = []
    for item in local_results[:20]:
        gps_coords = item.get("gps_coordinates", {})
        
        # --- Xử lý Operating Hours ---
        # API thường trả về dict hoặc complex object, ta convert sang string để khớp format
        raw_hours = item.get("operating_hours")
        open_time_str = "N/A"
        if isinstance(raw_hours, dict):
            # Nếu trả về dict (thứ: giờ), ta lấy tạm giá trị đầu tiên hoặc convert string
            open_time_str = str(raw_hours).replace("'", '"') 
        elif raw_hours:
            open_time_str = str(raw_hours)

        # --- Xử lý Images (dùng thumbnail) ---
        raw_imgs = []
        thumbnail = item.get("thumbnail")
        if thumbnail:
            raw_imgs.append({
                "img_url": thumbnail,
                "description": "Thumbnail từ Google Maps"
            })

        # --- Mapping sang cấu trúc mới ---
        new_structure = {
            "gg_place_id": item.get("place_id"),
            "location_name": item.get("title"),
            "latitude": gps_coords.get("latitude"),
            "longitude": gps_coords.get("longitude"),
            "open_time": open_time_str,
            "types": item.get("types"),
            "average_rating": item.get("rating"),
            "review_count": 0,          # Yêu cầu hardcode là 0
            "province_id": 0,           # Placeholder
            "rawImgs": raw_imgs,         # Cấu trúc list chứa dict
            "description": item.get("description")
        }
        results.append(new_structure)

    return results


def append_to_json(data_list, filename):
    """
    Lưu dữ liệu vào file JSON — nếu file đã tồn tại, đọc nội dung cũ và nối thêm.
    """
    existing_data = []

    if os.path.exists(filename):
        try:
            with open(filename, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                if not isinstance(existing_data, list):
                    existing_data = []
        except (json.JSONDecodeError, IOError):
            existing_data = []

    # Nối thêm dữ liệu mới
    combined_data = existing_data + data_list

    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(combined_data, f, ensure_ascii=False, indent=4)
        print(f"\n🎉 Đã cập nhật file '{filename}' với {len(data_list)} mục mới (tổng {len(combined_data)}).")
    except IOError as e:
        print(f"Lỗi khi ghi file '{filename}': {e}")


# ========================== MAIN ===================================
if __name__ == "__main__":
    try:
        city_input = input("Nhập tên thành phố (ví dụ: Huế, Hà Nội, Đà Nẵng): ").strip()
        if not city_input:
            print("Bạn chưa nhập tên thành phố.")
            sys.exit(0)

        type_of_place = input("Nhập loại địa điểm (ví dụ: restaurants, hotels, coffee shops...): ").strip()
        if not type_of_place:
            print("Bạn chưa nhập loại địa điểm.")
            sys.exit(0)

        ll_string = get_city_coordinates(city_input, API_KEY)
        if not ll_string:
            sys.exit(0)

        top_places = fetch_top_places(city_input, ll_string, type_of_place)

        # Tạo tên file dựa trên tên thành phố
        city_safe = city_input.lower().replace(' ', '_')
        output_filename = f"{city_safe}.json"
        
        append_to_json(top_places, output_filename)

        print("\n--- Hoàn tất tìm kiếm ---")

    except KeyboardInterrupt:
        print("\nĐã dừng chương trình.")
        sys.exit(0)