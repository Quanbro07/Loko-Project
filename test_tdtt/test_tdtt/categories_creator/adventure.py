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
    
    # --- WATERFALL ---
    "waterfall": "waterfall",
    
    # --- CAMPING ---
    "campground": "camping",
    "camping": "camping",
    "rv_park": "camping",
    "campsite": "camping",
    "tent": "camping",
    
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
    "cafe": "restaurant", # Dân adventure thường gộp cafe vào chỗ nghỉ chân ăn uống
    "bakery": "restaurant",
    "bar": "restaurant"   # Ít đi bar, coi như chỗ ăn uống
}

# ----------------------------------------------------------
# 2. NAME HINTS (ADVENTURE VERSION)
# ----------------------------------------------------------
# Các từ khóa trong tên địa điểm gợi ý chính xác category
NAME_HINTS = {
    # Mountain
    "núi": "mountain",
    "đỉnh": "mountain",
    "đèo": "mountain",
    "dốc": "mountain",
    "mount": "mountain",
    "peak": "mountain",
    "trekking": "mountain",
    "leo núi": "mountain",
    
    # Cave
    "hang": "cave",
    "động": "cave",
    "grotto": "cave",
    "cave": "cave",
    
    # Waterfall
    "thác": "waterfall",
    "waterfall": "waterfall",
    "suối": "waterfall", # Suối thường đi kèm thác hoặc tắm
    
    # Camping
    "camping": "camping",
    "cắm trại": "camping",
    "glamping": "camping",
    "lều": "camping",
    "bãi trại": "camping",
    
    # Diving
    "lặn": "diving",
    "san hô": "diving",
    "coral": "diving",
    "dive": "diving",
    "scuba": "diving",
    "hòn": "diving", # Các hòn đảo nhỏ thường để lặn (AI sẽ lọc kỹ hơn)
    
    # Hotel & Restaurant hints (Cơ bản)
    "homestay": "hotel",
    "bungalow": "hotel",
    "resort": "hotel",
    "quán": "restaurant",
    "nhà hàng": "restaurant",
    "bếp": "restaurant"
}

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

def clean_categories(name, types, tags):
    """
    Hàm làm sạch và ưu tiên tag cho Adventure
    """
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # --- Logic Hybrid & Keyword forcing ---
    
    # 1. Force tag nếu tên địa điểm quá rõ ràng
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)
            
    # 2. Xử lý "National Park" / "Vườn quốc gia"
    # Thường VQG bao gồm núi và rừng -> gán Mountain
    if "national park" in types_str or "vườn quốc gia" in lower_name:
        if "mountain" not in tags: tags.append("mountain")

    # 3. Xử lý Restaurant filter
    # Nếu là Hotel/Resort thì thường có ăn uống, nhưng ta chỉ để tag Hotel để tránh loãng
    # Trừ khi tên nó là "Restaurant & Hotel"
    if "restaurant" in tags and "hotel" in tags:
        # Ưu tiên Hotel, bỏ Restaurant trừ khi tên có chữ "nhà hàng"/"quán"
        if not any(x in lower_name for x in ["nhà hàng", "quán", "restaurant", "food"]):
            tags.remove("restaurant")

    # 4. Sort & Filter theo độ ưu tiên Adventure
    # Thứ tự ưu tiên: Các hoạt động Nature > Camping > Hotel > Restaurant
    majors = ["mountain", "cave", "waterfall", "diving", "camping", "hotel", "restaurant"]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # 5. Fallback (Nếu không tìm thấy tag nào)
    if not final_tags:
        # Thử lấy lại từ types gốc
        final_tags = tags_from_types(types)
    
    if not final_tags:
        # Fallback cuối cùng dựa vào tên
        if any(x in lower_name for x in ["hotel", "homestay", "nghỉ", "stay"]):
            final_tags = ["hotel"]
        elif any(x in lower_name for x in ["quán", "ăn", "cafe", "coffee"]):
            final_tags = ["restaurant"]
        else:
            # Nếu là địa điểm thiên nhiên lạ, gán tạm mountain (đi bộ ngắm cảnh)
            final_tags = ["mountain"]

    # Giới hạn 3 tag quan trọng nhất
    return list(dict.fromkeys(final_tags))[:3]

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