# app/services/crawler_service.py
from app.core.constants import CATEGORY_KEYWORDS
from app.utils import google_maps as query_module 
from app.services import tagging_service
from app.core.mappings import get_tag_from_id, get_province_name_by_id # Import thêm hàm map tỉnh

# --- THAY ĐỔI: Tham số đầu vào ---
def process_location_sync(province_id: int, category_id: int):
    
    # 1. Map ID -> Tên Tỉnh (Query)
    # Dùng province_id để lấy tên tỉnh chuẩn (VD: 25 -> "Lam Dong")
    city_name = get_province_name_by_id(province_id)
    print(f"🌍 Syncing Province ID: {province_id} -> Name: '{city_name}'")

    # 2. Map ID -> Category Keyword (VD: 1 -> "snack")
    specific_keyword = get_tag_from_id(category_id)
    
    if not specific_keyword or specific_keyword == "unknown":
        print(f"❌ Category ID {category_id} không hợp lệ.")
        return []

    print(f"🔄 Mapping Category ID {category_id} -> Keyword: '{specific_keyword}'")

    # 3. List search
    keywords = [specific_keyword]
    
    # --- LOGIC PHỤ TRỢ AI ---
    ai_category_name = "Vacation" 
    for broad_cat, kws in CATEGORY_KEYWORDS.items():
        if specific_keyword.lower() in [k.lower() for k in kws]:
            ai_category_name = broad_cat
            break
    # ------------------------

    all_places = []
    seen_ids = set()

    # 4. Lấy tọa độ trung tâm (Dùng tên tỉnh vừa map được)
    ll_string = query_module.get_city_coordinates(city_name)
    
    if not ll_string:
        print(f"❌ Không lấy được tọa độ cho {city_name}")
        return []

    # 5. Loop search
    for kw in keywords:
        print(f"🔍 Fetching specific keyword: '{kw}' for {city_name}")
        
        places = query_module.fetch_top_places(city_name, ll_string, kw)
        
        for p in places:
            if p['gg_place_id'] not in seen_ids:
                p['province_id'] = province_id
                
                # --- Lấy ảnh chi tiết ---
                photos_link = p.get('photos_link')
                if photos_link:
                    detail_images = query_module.get_detail_images(photos_link)
                    if detail_images:
                        p['rawImgs'] = detail_images
                    else:
                        p['rawImgs'] = [{
                            "img_url": p.get('thumbnail'),
                            "description": "Thumbnail"
                        }] if p.get('thumbnail') else []
                else:
                    p['rawImgs'] = [{
                        "img_url": p.get('thumbnail'),
                        "description": "Thumbnail"
                    }] if p.get('thumbnail') else []
                
                p.pop('photos_link', None)
                p.pop('thumbnail', None)

                seen_ids.add(p['gg_place_id'])
                all_places.append(p)

    print(f"✅ Tìm thấy {len(all_places)} địa điểm tại {city_name}. Gắn tag AI theo nhóm '{ai_category_name}'...")

    final_results = tagging_service.apply_ai_tags(all_places, ai_category_name)
    
    return final_results