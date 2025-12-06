import requests
import re
from app.core.config import SERP_API_KEY

def get_city_coordinates(city_name):
    # ... (Giữ nguyên hàm này không đổi) ...
    print(f"--- [Crawler Helper] Lấy tọa độ: '{city_name}' ---")
    params = {
        "api_key": SERP_API_KEY,
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

# --- SỬA HÀM NÀY ---
def parse_operating_hours(raw_hours):
    """
    Hàm xử lý logic tách giờ mở/đóng cửa.
    Nếu không có dữ liệu -> Mặc định là Mở cửa cả ngày (00:00 - 23:59)
    """
    # THAY ĐỔI QUAN TRỌNG: Set mặc định là cả ngày
    default_res = ("00:00", "23:59")

    # 1. Nếu không có dữ liệu hoặc không phải Dict -> Trả về Mặc định
    if not raw_hours or not isinstance(raw_hours, dict):
        return default_res

    # 2. Tìm một ngày bất kỳ có giờ mở cửa
    sample_time_str = None
    for day, time_val in raw_hours.items():
        if time_val and "Đóng cửa" not in time_val and "Closed" not in time_val:
            sample_time_str = time_val
            break
    
    # Nếu toàn bộ các ngày đều đóng cửa hoặc không tìm thấy giờ -> Trả về Mặc định
    # (Để an toàn cho thuật toán, coi như mở cả ngày thay vì bỏ qua)
    if not sample_time_str:
        return default_res

    # 3. Chuẩn hóa chuỗi
    sample_time_str = sample_time_str.replace("–", "-").strip()

    # 4. Xử lý "Mở cửa cả ngày"
    if "cả ngày" in sample_time_str.lower() or "24 hours" in sample_time_str.lower():
        return "00:00", "23:59"

    # 5. Xử lý tách giờ
    try:
        intervals = sample_time_str.split(',')
        first_interval = intervals[0].strip()
        last_interval = intervals[-1].strip()

        open_t = first_interval.split('-')[0].strip()
        close_t = last_interval.split('-')[-1].strip()

        return open_t, close_t

    except Exception as e:
        print(f"⚠️ Lỗi parse giờ: {sample_time_str} -> Dùng mặc định cả ngày.")
        return default_res

def fetch_top_places(city_name, ll_string, type_of_place):
    # ... (Giữ nguyên hàm này, nó sẽ gọi parse_operating_hours mới ở trên) ...
    query = f"{type_of_place} in {city_name}" 
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

        for item in local_results[:20]:
            gps_coords = item.get("gps_coordinates", {})
            
            raw_hours = item.get("operating_hours")
            # Gọi hàm xử lý giờ mới
            open_t, close_t = parse_operating_hours(raw_hours)

            raw_imgs = []
            thumbnail = item.get("thumbnail")
            if thumbnail:
                raw_imgs.append({
                    "img_url": thumbnail,
                    "description": "Thumbnail từ Google Maps"
                })

            new_structure = {
                "gg_place_id": item.get("place_id"),
                "location_name": item.get("title"),
                "latitude": gps_coords.get("latitude"),
                "longitude": gps_coords.get("longitude"),
                "open_time": open_t,
                "close_time": close_t,
                "types": item.get("types", []),
                "average_rating": item.get("rating", 0.0),
                "review_count": 0,
                "province_id": 0,
                "rawImgs": raw_imgs,
                "description": item.get("description"),
                "photos_link": item.get("photos_link"),
                "categories": []
            }
            results.append(new_structure)

    except Exception as e:
        print(f"❌ Lỗi crawl keyword '{type_of_place}': {e}")
        return []

    return results

def get_detail_images(photos_link_url):
    """
    Truy vấn đường dẫn photos_link từ SerpApi để lấy danh sách ảnh chất lượng cao.
    Lấy tối đa 5 ảnh từ trường 'image'.
    """
    if not photos_link_url:
        return []

    # photos_link trong JSON trả về thường có dạng: https://serpapi.com/search.json?data_id=...
    # Cần nối thêm api_key vào
    final_url = f"{photos_link_url}&api_key={SERP_API_KEY}"

    try:
        response = requests.get(final_url)
        data = response.json()
        
        # Kiểm tra nếu có lỗi
        if "error" in data:
            print(f"Error fetching photos: {data['error']}")
            return []

        photos_list = data.get("photos", [])
        result_imgs = []

        # Lấy tối đa 5 ảnh
        for item in photos_list[:5]:
            # User yêu cầu lấy từ trường "image", nếu không có thì fallback sang "thumbnail"
            img_src = item.get("image") or item.get("thumbnail")
            
            if img_src:
                result_imgs.append({
                    "img_url": img_src,
                    "description": "Google Maps Photo" # Hoặc lấy item.get("caption") nếu muốn
                })
        
        return result_imgs

    except Exception as e:
        print(f"❌ Exception fetching detailed photos: {e}")
        return []