# utils/google_maps.py
import requests
from app.core.config import SERP_API_KEY # 1. Import Key từ config chung

def get_city_coordinates(city_name):
    """
    Lấy tọa độ trung tâm thành phố từ SerpApi
    """
    print(f"--- [Crawler Helper] Lấy tọa độ: '{city_name}' ---")
    params = {
        "api_key": SERP_API_KEY, # Dùng key từ config
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
                return f"@{lat},{lng},14z"

        print(f"⚠️ Cảnh báo: Không tìm thấy tọa độ cho '{city_name}'.")
        return None

    except Exception as e:
        print(f"❌ Lỗi kết nối khi lấy tọa độ: {e}")
        return None


def fetch_top_places(city_name, ll_string, type_of_place):
    """
    Tìm kiếm địa điểm và trả về danh sách Dict (khớp với DTO PlaceItem)
    """
    # Thêm 'in vietnam' để tăng độ chính xác nếu cần, hoặc bỏ tùy logic của bạn
    query = f"top {type_of_place} in {city_name}" 
    print(f"--- [Crawler Helper] Searching: '{query}' ---")

    params = {
        "api_key": SERP_API_KEY,
        "engine": "google_maps",
        "type": "search",
        "q": query,
        "hl": "vi",
        "gl": "vn",
        "ll": ll_string
    }

    results = []
    try:
        response = requests.get("https://serpapi.com/search.json", params=params)
        data = response.json()
        local_results = data.get("local_results", [])
        
        if not local_results:
            return []

        # Lấy 20 kết quả đầu
        for item in local_results[:20]:
            gps_coords = item.get("gps_coordinates", {})
            
            # Xử lý Operating Hours
            raw_hours = item.get("operating_hours")
            open_time_data = "N/A"
            if raw_hours:
                open_time_data = raw_hours

            # Xử lý Images
            raw_imgs = []
            thumbnail = item.get("thumbnail")
            if thumbnail:
                raw_imgs.append({
                    "img_url": thumbnail,
                    "description": "Thumbnail từ Google Maps"
                })

            # Tạo object khớp với format bạn cần
            new_structure = {
                "gg_place_id": item.get("place_id"),
                "location_name": item.get("title"),
                "latitude": gps_coords.get("latitude"),
                "longitude": gps_coords.get("longitude"),
                "open_time": open_time_data,
                "types": item.get("types", []), # Mặc định là list rỗng nếu None
                "average_rating": item.get("rating", 0.0), # Mặc định 0.0
                "review_count": 0,
                "province_id": 0,
                "rawImgs": raw_imgs,
                "description": item.get("description"),
                "categories": [] # Để trống chờ AI điền sau
            }
            results.append(new_structure)

    except Exception as e:
        print(f"❌ Lỗi crawl keyword '{type_of_place}': {e}")
        return []

    return results