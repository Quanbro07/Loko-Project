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
    Bước 2: Tìm top [type_of_place] in [city_name] in Vietnam (tối đa 20 kết quả)
    """
    query = f"top {type_of_place} in {city_name} in vietnam"
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
        results.append({
            "type_of_place": type_of_place,
            "title": item.get("title"),
            "place_id": item.get("place_id"),
            "latitude": gps_coords.get("latitude"),
            "longitude": gps_coords.get("longitude"),
            "types": item.get("types"),
            "operating_hours": item.get("operating_hours"),
            "thumbnail": item.get("thumbnail"),
            "rating": item.get("rating"),
            "description": item.get("description")
        })

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

        type_of_place = input("Nhập loại địa điểm (ví dụ: restaurants, hotels, coffee shops, attractions...): ").strip()
        if not type_of_place:
            print("Bạn chưa nhập loại địa điểm.")
            sys.exit(0)

        ll_string = get_city_coordinates(city_input, API_KEY)
        if not ll_string:
            sys.exit(0)

        top_places = fetch_top_places(city_input, ll_string, type_of_place)

        # === File sẽ mang tên thành phố, ghi nối tiếp ===
        output_filename = f"{city_input.lower().replace(' ', '_')}.json"
        append_to_json(top_places, output_filename)

        print("\n--- Hoàn tất tìm kiếm ---")

    except KeyboardInterrupt:
        print("\nĐã dừng chương trình.")
        sys.exit(0)
