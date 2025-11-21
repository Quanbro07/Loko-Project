# app/services/crawler_service.py
from app.core.constants import CATEGORY_KEYWORDS
from app.utils import google_maps as query_module
from app.services import tagging_service

def process_location_sync(city_name: str, category_name: str):
    # 1. Chuẩn hóa tên thành phố
    formatted_city = city_name.replace("_", " ").strip()
    
    # 2. Lấy danh sách từ khóa dựa trên Category
    keywords = CATEGORY_KEYWORDS.get(category_name, ["tourist attraction"])
    
    all_places = []
    seen_ids = set()

    # 3. Lấy tọa độ trung tâm (Chỉ cần lấy 1 lần để tiết kiệm request nếu cần)
    # Giả sử query_module có hàm get_coords
    ll_string = query_module.get_city_coordinates(formatted_city, query_module.API_KEY) 
    
    if not ll_string:
        return []

    # 4. Loop qua từng từ khóa (Food -> 5 lần, Amusement -> 4 lần)
    for kw in keywords:
        print(f"Fetching keyword: {kw} for {formatted_city}")
        # Gọi hàm search trong query.py của bạn
        places = query_module.fetch_top_places(formatted_city, ll_string, kw)
        
        # Gộp kết quả, lọc trùng lặp
        for p in places:
            if p['gg_place_id'] not in seen_ids:
                seen_ids.add(p['gg_place_id'])
                all_places.append(p)

    # 5. Gọi AI để gắn Tag (Categories Creator)
    # Truyền danh sách địa điểm thô vào để AI xử lý
    final_results = tagging_service.apply_ai_tags(all_places, category_name)
    
    return final_results