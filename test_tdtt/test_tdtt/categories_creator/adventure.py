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
    "natural_feature": "mountain", 
    
    # --- CAVE ---
    "cave": "cave",
    "cavern": "cave",
    "grotto": "cave",
    
    # --- WATERFALL ---
    "waterfall": "waterfall",
    "suối": "waterfall", 

    # --- CAMPING ---
    "campground": "camping",
    "camping": "camping",
    "rv_park": "camping",
    "campsite": "camping",
    "tent": "camping",
    "khu cắm trại": "camping",
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
    "homestay": "hotel",
    "hostel": "hotel",
    "guest_house": "hotel",
    "motel": "hotel",
    
    # --- RESTAURANT ---
    "restaurant": "restaurant",
    "food": "restaurant",
    "meal": "restaurant",
    "Khu ăn uống": "restaurant",
    "cafe": "restaurant",
    "bakery": "restaurant",
    "bar": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS (ADVENTURE VERSION)
# ----------------------------------------------------------
NAME_HINTS = {
    # --- MOUNTAIN ---
    "núi": "mountain", "đèo": "mountain", "trekking": "mountain", 
    "langbiang": "mountain", "bidoup": "mountain", "tuyền lâm": "mountain",
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
    
    # --- HOTEL ---
    "hotel": "hotel", "homestay": "hotel", "resort": "hotel", "bungalow": "hotel",
    "villa": "hotel", "hostel": "hotel", "nhà nghỉ": "hotel", "khách sạn": "hotel",
    "lodge": "hotel", "palace": "hotel", "dalat palace": "hotel",
    
    # --- RESTAURANT ---
    "nhà hàng": "restaurant", "quán": "restaurant", "bếp": "restaurant", 
    "kitchen": "restaurant", "coffee": "restaurant", "cafe": "restaurant",
    "cơm": "restaurant", "phở": "restaurant", "bún": "restaurant", 
    "lẩu": "restaurant", "nướng": "restaurant", "mì": "restaurant",
    "pizza": "restaurant", "bbq": "restaurant", "buffet": "restaurant",
    "ẩm thực": "restaurant", "bánh": "restaurant", "ăn vặt": "restaurant"
}

# ----------------------------------------------------------
# 3. HELPER FUNCTIONS
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

# ----------------------------------------------------------
# 4. CORE LOGIC: CLEAN CATEGORIES (ADVENTURE SPECIFIC)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    """
    Logic chuyên biệt cho Adventure:
    - Ưu tiên Type gốc của Google (Hotel/Restaurant).
    - Xử lý xung đột tên (VD: "Cafe Đỉnh Đồi" là Restaurant, không phải Mountain).
    - Chỉ fallback về Mountain khi không còn lựa chọn nào khác.
    """
    lower_name = name.lower()
    types_str = " ".join(types).lower()
    current_tags = set(tags)

    # --- BƯỚC 1: CHECK TYPE GỐC (BẮT BUỘC) ---
    if "khách sạn" in types_str or "hotel" in types_str or "lodging" in types_str:
        current_tags.add("hotel")
        
    if "nhà hàng" in types_str or "restaurant" in types_str or "food" in types_str:
        current_tags.add("restaurant")

    # --- BƯỚC 2: QUÉT TÊN (NAME HINTS) ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            current_tags.add(v)

    # --- BƯỚC 3: LOGIC KẾT HỢP (HYBRID) ---
    has_waterfall = any(x in lower_name for x in ["thác", "waterfall", "suối"])
    has_camping   = any(x in lower_name for x in ["camp", "trại", "glamping", "lều"])
    
    if has_waterfall and has_camping:
        current_tags.add("waterfall")
        current_tags.add("camping")

    # --- BƯỚC 4: XỬ LÝ XUNG ĐỘT (Conflict Resolution) ---
    
    # Conflict 1: Vừa Hotel vừa Mountain
    if "hotel" in current_tags and "mountain" in current_tags:
        # Nếu tên không có từ khóa núi rừng rõ ràng -> Ưu tiên Hotel, bỏ Mountain
        if not any(x in lower_name for x in ["núi", "rừng", "đèo", "trekking", "view"]):
            if "đỉnh" in lower_name: # Fix lỗi "Đỉnh Đồi"
                current_tags.remove("mountain")

    # Conflict 2: Restaurant bị dính Mountain
    if "restaurant" in current_tags and "mountain" in current_tags:
        # Nếu là quán ăn thông thường -> Bỏ mountain
        if any(x in lower_name for x in ["cơm", "bún", "phở", "quán"]):
            current_tags.remove("mountain")

    # --- BƯỚC 5: SẮP XẾP & FALLBACK ---
    priority_order = ["mountain", "cave", "waterfall", "diving", "camping", "hotel", "restaurant"]
    final_tags = []
    
    for major in priority_order:
        if major in current_tags:
            final_tags.append(major)

    # Fallback
    if not final_tags:
        if any(x in lower_name for x in ["quán", "ăn", "cafe", "coffee", "bistro"]):
             final_tags.append("restaurant")
        elif any(x in lower_name for x in ["stay", "nghỉ", "phòng"]):
             final_tags.append("hotel")
        else:
             final_tags.append("mountain") # Default cuối cùng cho Adventure

    return list(dict.fromkeys(final_tags))[:3]

# ----------------------------------------------------------
# 5. AI PROMPT & MODEL CALL
# ----------------------------------------------------------
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
    return [{"place": item["location_name"], "categories": []} for item in items]

# ----------------------------------------------------------
# 6. MAIN RUNNER (ADVENTURE)
# ----------------------------------------------------------
def run_adventure(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"🚀 Bắt đầu xử lý Adventure cho file: {INPUT_FILE}")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        # 1. Map tags sơ bộ từ Types
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        # 2. Lọc items cần hỏi AI (ít tag hoặc ko chắc chắn)
        to_query_items = []
        for item in block:
            if len(pre_tags_map[item["location_name"]]) < 2:
                to_query_items.append(item)

        # 3. Gọi AI
        api_result = {}
        if to_query_items:
            results = classify_with_model(model, to_query_items)
            for r in results:
                api_result[r["place"]] = r.get("categories", [])

        # 4. Merge và Clean
        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            # Gán key 'categories' và chạy logic dọn dẹp
            item["categories"] = clean_categories(name, ttypes, tags)
            
            # Xóa key cũ nếu có
            if "tags" in item:
                del item["tags"]
                
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Adventure Classification! File output:", OUTPUT_FILE)