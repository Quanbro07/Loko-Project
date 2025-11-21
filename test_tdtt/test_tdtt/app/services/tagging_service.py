# app/services/tagging_service.py
import json
import tempfile
import os
import shutil

# 1. Import Model và cấu hình từ file app.core.gemini_config vừa sửa
from app.core.gemini_config import MODEL, BATCH_SIZE

# 2. Import các hàm xử lý logic cũ của bạn
from categories_creator.food import run_food
from categories_creator.amusement import run_amusement

def apply_ai_tags(places_data: list, category_name: str) -> list:
    """
    Hàm này nhận vào List địa điểm, tạo file tạm, 
    gọi hàm run_food/run_amusement cũ để xử lý, 
    sau đó đọc file kết quả trả về.
    """
    if not places_data:
        return []

    print(f"--- [AI Service] Bắt đầu gắn thẻ cho {len(places_data)} địa điểm (Loại: {category_name}) ---")

    # BƯỚC 1: Tạo file tạm chứa dữ liệu input
    # delete=False để file không bị xóa ngay khi đóng, ta sẽ xóa thủ công sau
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json', encoding='utf-8') as tmp_in:
        json.dump(places_data, tmp_in, ensure_ascii=False, indent=4)
        input_path = tmp_in.name
    
    # Định nghĩa đường dẫn file output tạm
    output_path = input_path.replace(".json", "_out.json")

    try:
        # BƯỚC 2: Điều hướng logic (Thay thế cho đoạn if/else input() cũ)
        if category_name == "Food":
            # Gọi hàm cũ của bạn, truyền đường dẫn file tạm vào
            run_food(MODEL, input_path, output_path, BATCH_SIZE)
            
        elif category_name == "Amusement":
            run_amusement(MODEL, input_path, output_path, BATCH_SIZE)
            
        else:
            print(f"⚠️ Chưa hỗ trợ AI tag cho loại: {category_name}")
            return places_data # Trả về nguyên gốc nếu không biết xử lý

        # BƯỚC 3: Đọc lại kết quả từ file output tạm
        if os.path.exists(output_path):
            with open(output_path, "r", encoding="utf-8") as f:
                tagged_data = json.load(f)
            print("✅ Gắn thẻ thành công!")
            return tagged_data
        else:
            print("❌ Lỗi: AI chạy xong nhưng không thấy file kết quả.")
            return places_data

    except Exception as e:
        print(f"❌ Lỗi nghiêm trọng trong quá trình gắn thẻ AI: {e}")
        return places_data

    finally:
        # BƯỚC 4: Dọn dẹp chiến trường (Xóa file tạm)
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)