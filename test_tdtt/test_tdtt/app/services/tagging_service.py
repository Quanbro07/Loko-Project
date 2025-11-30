# app/services/tagging_service.py
import json
import tempfile
import os
from app.core.gemini_config import MODEL, BATCH_SIZE
from categories_creator.food import run_food
from categories_creator.amusement import run_amusement
from categories_creator.adventure import run_adventure
from categories_creator.history import run_history

# Import hàm mapping
from app.core.mappings import get_category_id

def apply_ai_tags(places_data: list, category_name: str) -> list:
    if not places_data:
        return []

    print(f"--- [AI Service] Gắn thẻ và Map ID cho {len(places_data)} địa điểm ---")

    # Tạo file tạm (Input cho AI)
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json', encoding='utf-8') as tmp_in:
        json.dump(places_data, tmp_in, ensure_ascii=False, indent=4)
        input_path = tmp_in.name
    output_path = input_path.replace(".json", "_out.json")

    try:
        # Chạy AI (Sinh ra file chứa tags dạng chữ)
        if category_name == "Food":
            run_food(MODEL, input_path, output_path, BATCH_SIZE)
        elif category_name == "Amusement":
            run_amusement(MODEL, input_path, output_path, BATCH_SIZE)
        elif category_name == "Adventure":
            run_adventure(MODEL, input_path, output_path, BATCH_SIZE)
        elif category_name == "History":
            run_history(MODEL, input_path, output_path, BATCH_SIZE)
        else:
            return places_data 

        # Đọc kết quả AI trả về
        if os.path.exists(output_path):
            with open(output_path, "r", encoding="utf-8") as f:
                ai_results = json.load(f)
            
            # --- LOGIC MAP TỪ CHỮ SANG SỐ ---
            final_results = []
            for place in ai_results:
                # Lấy list tags chữ (VD: ["Hotel", "Amusement/Water Park"])
                raw_tags = place.get("categories", [])
                
                # Dùng set để chứa ID (tránh trùng lặp, VD: 2 tag cùng ra 1 ID)
                ids_set = set()
                
                for tag in raw_tags:
                    cat_id = get_category_id(tag) # Hàm này đã xử lý lower() rồi
                    if cat_id:
                        ids_set.add(cat_id)
                
                # Xóa trường cũ 'categories' (list str)
                if "categories" in place:
                    del place["categories"]
                
                # Thêm trường mới 'category_ids' (list int)
                place["category_ids"] = list(ids_set)
                
                final_results.append(place)
            # -------------------------------
            
            return final_results
        else:
            return places_data

    except Exception as e:
        print(f"❌ Lỗi xử lý AI/Mapping: {e}")
        return places_data

    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)