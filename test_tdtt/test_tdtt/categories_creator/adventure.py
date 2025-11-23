import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (ADVENTURE VERSION)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- MOUNTAIN / TREKKING ---
    "mountain": "mountain",
    "peak": "mountain",
    "hill": "mountain",
    "hiking_area": "mountain",
    "climbing": "mountain",
    "volcano": "mountain",
    "rock_climbing": "mountain",
    "natural_feature": "mountain", # Gán tạm, AI sẽ check lại
    
    # --- CAVE ---
    "cave": "cave",
    "cavern": "cave",
    "grotto": "cave",
    
    # --- WATERFALL (Thêm suối) ---
    "waterfall": "waterfall",
    "suối": "waterfall", 

    # --- CAMPING (Thêm tiếng Việt) ---
    "campground": "camping",
    "camping": "camping",
    "rv_park": "camping",
    "campsite": "camping",
    "tent": "camping",
    "khu cắm trại": "camping", # <--- QUAN TRỌNG: Google trả về type này
    "bãi cắm trại": "camping",
    "lều": "camping",
    
    # --- DIVING / WATER SPORT ---
    "diving": "diving",
    "scuba": "diving",
    "snorkeling": "diving",
    "dive_center": "diving",
    "coral": "diving",
    "reef": "diving",
    
    # --- HOTEL ---
    "lodging": "hotel",
    "hotel": "hotel",
    "resort": "hotel",
    "homestay": "hotel", # Dân phượt hay ở homestay
    "hostel": "hotel",
    "guest_house": "hotel",
    "motel": "hotel",
    
    # --- RESTAURANT ---
    "restaurant": "restaurant",
    "food": "restaurant",
    "meal": "restaurant",
    "Khu ăn uống": "restaurant",
    "cafe": "restaurant", # Dân adventure thường gộp cafe vào chỗ nghỉ chân ăn uống
    "bakery": "restaurant",
    "bar": "restaurant"   # Ít đi bar, coi như chỗ ăn uống
}

# ----------------------------------------------------------
# 2. NAME HINTS (ADVENTURE VERSION)
# ----------------------------------------------------------
# Các từ khóa trong tên địa điểm gợi ý chính xác category
NAME_HINTS = {
    # --- MOUNTAIN (Cẩn thận hơn) ---
    "núi": "mountain", "đèo": "mountain", "trekking": "mountain", 
    "langbiang": "mountain", "bidoup": "mountain", "tuyền lâm": "mountain",
    # Bỏ chữ "đỉnh" đứng một mình để tránh "Công ty Đỉnh Đồi", chỉ bắt "đỉnh núi" nếu cần
    "đỉnh núi": "mountain", "peak": "mountain", 

    # --- CAVE ---
    "hang": "cave", "động": "cave", "grotto": "cave", "đường hầm" : "cave",
    
    # --- WATERFALL ---
    "thác": "waterfall", "waterfall": "waterfall", "suối": "waterfall", "cascade": "waterfall",
    
    # --- CAMPING ---
    "camping": "camping", "cắm trại": "camping", "glamping": "camping",
    "camp": "camping", "trại": "camping", "lều": "camping", 
    
    # --- DIVING ---
    "lặn": "diving", "san hô": "diving", 
    
    # --- HOTEL (Thêm các từ khóa phổ biến) ---
    "hotel": "hotel", "homestay": "hotel", "resort": "hotel", "bungalow": "hotel",
    "villa": "hotel", "hostel": "hotel", "nhà nghỉ": "hotel", "khách sạn": "hotel",
    "lodge": "hotel", "palace": "hotel", "dalat palace": "hotel",
    
    # --- RESTAURANT (Thêm tên món ăn để nhận diện) ---
    "nhà hàng": "restaurant", "quán": "restaurant", "bếp": "restaurant", 
    "kitchen": "restaurant", "coffee": "restaurant", "cafe": "restaurant",
    "cơm": "restaurant", "phở": "restaurant", "bún": "restaurant", 
    "lẩu": "restaurant", "nướng": "restaurant", "mì": "restaurant",
    "pizza": "restaurant", "bbq": "restaurant", "buffet": "restaurant",
    "ẩm thực": "restaurant", "bánh": "restaurant", "ăn vặt": "restaurant"
}

# ----------------------------------------------------------
# 2. HÀM CLEAN CATEGORIES (Đã sửa logic ưu tiên Type gốc)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    """
    Sửa lỗi: Ưu tiên tuyệt đối cho Hotel và Restaurant dựa trên Type gốc.
    Chỉ fallback về Mountain khi không tìm thấy gì khác.
    """
    # Chuẩn hóa
    lower_name = name.lower()
    types_str = " ".join(types).lower()
    current_tags = set(tags) # Dùng set để tránh trùng

    # --- BƯỚC 1: CHECK TYPE GỐC (BẮT BUỘC) ---
    # Nếu Google đã bảo là Hotel/Restaurant thì phải tin nó trước.
    if "khách sạn" in types_str or "hotel" in types_str or "lodging" in types_str:
        current_tags.add("hotel")
        
    if "nhà hàng" in types_str or "restaurant" in types_str or "food" in types_str:
        current_tags.add("restaurant")

    # --- BƯỚC 2: QUÉT TÊN (NAME HINTS) ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            current_tags.add(v)

    # --- BƯỚC 3: LOGIC KẾT HỢP (HYBRID) ---
    # (Giữ nguyên logic Camping + Nature)
    has_waterfall = any(x in lower_name for x in ["thác", "waterfall", "suối"])
    has_camping   = any(x in lower_name for x in ["camp", "trại", "glamping", "lều"])
    
    if has_waterfall and has_camping:
        current_tags.add("waterfall")
        current_tags.add("camping")

    # --- BƯỚC 4: XỬ LÝ XUNG ĐỘT (Conflict Resolution) ---
    
    # TRƯỜNG HỢP 1: Vừa Hotel vừa Mountain (VD: Colline Đỉnh Đồi)
    # Nếu là Hotel rõ ràng, nhưng bị dính từ khóa Mountain (do tên "Đỉnh"), ta ưu tiên Hotel.
    # Trừ khi nó là "Resort & Spa giữa rừng" thì giữ cả hai.
    if "hotel" in current_tags and "mountain" in current_tags:
        # Nếu tên không có chữ "núi/rừng/đèo" mà chỉ dính chữ "đỉnh" của tên riêng -> Bỏ mountain
        if not any(x in lower_name for x in ["núi", "rừng", "đèo", "trekking", "view"]):
            if "đỉnh" in lower_name: # Fix lỗi "Đỉnh Đồi"
                current_tags.remove("mountain")

    # TRƯỜNG HỢP 2: Restaurant bị dính Mountain
    if "restaurant" in current_tags and "mountain" in current_tags:
        # Nếu tên là quán ăn bình thường -> Bỏ mountain
        if any(x in lower_name for x in ["cơm", "bún", "phở", "quán"]):
            current_tags.remove("mountain")

    # --- BƯỚC 5: SẮP XẾP & FALLBACK ---
    priority_order = ["mountain", "cave", "waterfall", "diving", "camping", "hotel", "restaurant"]
    final_tags = []
    
    for major in priority_order:
        if major in current_tags:
            final_tags.append(major)

    # Fallback: Chỉ gán Mountain nếu danh sách RỖNG hoàn toàn
    if not final_tags:
        # Check lại lần cuối xem có phải quán ăn không
        if any(x in lower_name for x in ["quán", "ăn", "cafe", "coffee", "bistro"]):
             final_tags.append("restaurant")
        elif any(x in lower_name for x in ["stay", "nghỉ", "phòng"]):
             final_tags.append("hotel")
        else:
             final_tags.append("mountain") # Default cuối cùng

    return list(dict.fromkeys(final_tags))[:3]

# ----------------------------------------------------------
def extract_json(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r'\{.*\}', text, re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except:
                return None
    return None

def tags_from_types(types):
    results = set()
    for t in types:
        key = t.lower().strip()
        for k, v in TYPE_TO_TAG.items():
            if k in key:
                results.add(v)
    return list(results)

# --- CẬP NHẬT PROMPT CHO ADVENTURE ---
PROMPT_ADVENTURE = """
Classify these places for an Adventure/Nature travel profile.
Allowed categories: mountain, cave, waterfall, camping, diving, hotel, restaurant.

RULES:
- Priority is NATURE: If a place is a "Waterfall" inside a "National Park", tag as ["waterfall", "mountain"].
- "Camping": Look for campgrounds, glamping, or places allowing tents.
- "Diving": Look for scuba, snorkeling, coral reefs, or islands famous for diving.
- "Mountain": Includes trekking spots, hills, hiking trails, viewpoints on peaks.
- Ambiguity: A "Cave Lodge" should be ["cave", "hotel"].
- JSON only.

Format:
{
  "results": [
    { "place": "<name>", "categories": ["cat1", "cat2"] }
  ]
}

Classify:
{locations}
"""

def classify_with_model(model, items):
    # Lấy tên và types để đưa vào prompt
    lines = [f"- {x['location_name']} (Types: {', '.join(x['types'][:3])})" for x in items]
    locations = "\n".join(lines)
    prompt = PROMPT_ADVENTURE.replace("{locations}", locations)
    
    for _ in range(3):
        try:
            resp = model.generate_content(prompt)
            data = extract_json(resp.text)
            if data and "results" in data:
                return data["results"]
        except:
            time.sleep(1)
    # Trả về rỗng nếu lỗi
    return [{"place": item["location_name"], "categories": []} for item in items]

def run_adventure(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"🚀 Bắt đầu xử lý Adventure cho file: {INPUT_FILE}")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        # Bước 1: Tag sơ bộ từ Types
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        # Bước 2: Lọc ra những mục khó/thiếu tag để hỏi AI
        to_query_items = []
        for item in block:
            # Nếu ít hơn 1 tag hoặc tag chung chung 'mountain' nhưng tên lạ, hỏi AI cho chắc
            if len(pre_tags_map[item["location_name"]]) < 1:
                to_query_items.append(item)
            # Hoặc hỏi AI tất cả để độ chính xác cao nhất (tuỳ bạn chọn, ở đây giữ logic cũ < 2)
            elif len(pre_tags_map[item["location_name"]]) < 2:
                to_query_items.append(item)

        api_result = {}
        if to_query_items:
            results = classify_with_model(model, to_query_items)
            for r in results:
                api_result[r["place"]] = r.get("categories", [])

        # Bước 3: Merge và Clean
        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            # Gán vào key 'categories'
            item["categories"] = clean_categories(name, ttypes, tags)
            
            # Xóa key cũ
            if "tags" in item:
                del item["tags"]
                
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5) # Tránh rate limit

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Adventure Classification! File output:", OUTPUT_FILE)