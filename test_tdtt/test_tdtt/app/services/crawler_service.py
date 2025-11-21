from app.core.constants import CATEGORY_KEYWORDS
from app.utils import google_maps as query_module  # Import module utils mới
from app.services import tagging_service

def process_location_sync(city_name: str, category_name: str):
    # 1. Chuẩn hóa tên thành phố
    formatted_city = city_name.replace("_", " ").strip()
    
    # 2. Lấy danh sách từ khóa dựa trên Category
    keywords = CATEGORY_KEYWORDS.get(category_name, ["tourist attraction"])
    
    all_places = []
    seen_ids = set()

    # 3. Lấy tọa độ trung tâm 
    # SỬA LỖI: Không truyền API Key vào đây nữa
    ll_string = query_module.get_city_coordinates(formatted_city)
    
    if not ll_string:
        print(f"❌ Không lấy được tọa độ cho {formatted_city}")
        return []

    # 4. Loop qua từng từ khóa
    for kw in keywords:
        print(f"🔍 Fetching keyword: {kw} for {formatted_city}")
        
        # Gọi hàm search (Lưu ý: hàm này cũng không cần truyền API Key nữa nếu bạn đã sửa google_maps.py chuẩn)
        places = query_module.fetch_top_places(formatted_city, ll_string, kw)
        
        # Gộp kết quả, lọc trùng lặp
        for p in places:
            if p['gg_place_id'] not in seen_ids:
                seen_ids.add(p['gg_place_id'])
                all_places.append(p)

    print(f"✅ Tìm thấy tổng cộng {len(all_places)} địa điểm thô. Bắt đầu gắn tag AI...")

    # 5. Gọi AI để gắn Tag
    final_results = tagging_service.apply_ai_tags(all_places, category_name)
    
    return final_results