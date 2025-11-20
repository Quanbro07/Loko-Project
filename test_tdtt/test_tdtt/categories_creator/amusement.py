import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (GIỮ NGUYÊN)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- AMUSEMENT ---
    "công viên giải trí": "amusement/water park",
    "công viên nước": "amusement/water park",
    "trung tâm vui chơi": "amusement/water park",
    "khu vui chơi": "amusement/water park",
    "công viên chủ đề": "amusement/water park",
    
    # --- ZOO / AQUARIUM ---
    "sở thú": "zoo",
    "vườn thú": "zoo",
    "thủy cung": "aquarium",
    "aquarium": "aquarium",
    
    # --- CULTURAL ---
    "nhà hát": "cultural performance",
    "trung tâm văn hóa": "cultural performance",
    "lễ hội": "festival",
    "bảo tàng": "cultural performance", 
    "di tích": "cultural performance",
    "cáp treo": "cultural performance",
    "nhà thờ": "cultural performance",
    "chùa": "cultural performance",
    "đền": "cultural performance",
    "thắng cảnh": "cultural performance",
    "quảng trường": "cultural performance",
    "thu hút khách du lịch": "cultural performance",
    
    # --- NIGHTLIFE ---
    "bar": "nightlife",
    "pub": "nightlife",
    "club": "nightlife",
    "lounge": "nightlife",
    "karaoke": "nightlife",
    
    # --- HOTEL / RESTAURANT ---
    "khách sạn": "hotel",
    "hotel": "hotel",
    "resort": "hotel",
    "homestay": "hotel",
    "villa": "hotel",
    "nhà hàng": "restaurant",
    "restaurant": "restaurant",
    "ẩm thực": "restaurant",
    "buffet": "restaurant",
    "quán ăn": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS
# ----------------------------------------------------------
NAME_HINTS = {
    "festival": "festival",
    "lễ hội": "festival",
    "nhà hát": "cultural performance",
    "theater": "cultural performance",
    "show": "cultural performance",
    "cáp treo": "cultural performance",
    "nhà thờ": "cultural performance",
    "chùa": "cultural performance",
    "hòn chồng": "cultural performance",
    "tháp": "cultural performance",
    "bảo tàng": "cultural performance",
    "pub": "nightlife",
    "bar": "nightlife",
    "club": "nightlife"
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

# --- CẬP NHẬT PROMPT: ĐỔI TAGS -> CATEGORIES ---
PROMPT_AMUSEMENT = """
Classify these places.
Allowed categories: amusement/water park, zoo, aquarium, nightlife, festival, cultural performance, hotel, restaurant.

RULES:
- Flexible tagging: A place can be BOTH a park AND a cultural spot.
- VinWonders/Sun World -> ["amusement/water park", "cultural performance"].
- Landmarks/Churches -> ["cultural performance"].
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
    lines = [f"- {x['location_name']} (Types: {', '.join(x['types'][:2])})" for x in items]
    locations = "\n".join(lines)
    prompt = PROMPT_AMUSEMENT.replace("{locations}", locations)
    
    for _ in range(3):
        try:
            resp = model.generate_content(prompt)
            data = extract_json(resp.text)
            if data and "results" in data:
                return data["results"]
        except:
            time.sleep(1)
    # Trả về list rỗng nếu lỗi, key là categories
    return [{"place": item["location_name"], "categories": []} for item in items]

def clean_categories(name, types, tags):
    # (Logic giữ nguyên, chỉ đổi tên hàm cho hợp ngữ cảnh)
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # Logic Hybrid
    if any(x in lower_name for x in ["vinwonders", "sun world", "vinpearl land", "universal", "disney"]):
        if "amusement/water park" not in tags: tags.append("amusement/water park")
        if "cultural performance" not in tags: tags.append("cultural performance")
            
    if "cáp treo" in lower_name or "cable car" in lower_name:
        if "amusement/water park" not in tags: tags.append("amusement/water park")
        if "cultural performance" not in tags: tags.append("cultural performance")

    # Name Hints
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)

    # Restaurant filter
    if "restaurant" in tags:
        restaurant_keywords = ["restaurant", "nhà hàng", "quán", "ẩm thực", "dining", "buffet", "kitchen", "bistro", "lounge"]
        is_in_name = any(x in lower_name for x in restaurant_keywords)
        is_in_types = any(x in types_str for x in restaurant_keywords)
        if not is_in_name and not is_in_types: 
            tags.remove("restaurant")

    # Sort & Filter
    majors = ["amusement/water park", "cultural performance", "zoo", "aquarium", "nightlife", "festival", "hotel", "restaurant"]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # Fallback
    if not final_tags:
        final_tags = tags_from_types(types)
    if not final_tags:
        if "park" in lower_name or "công viên" in lower_name:
            final_tags = ["amusement/water park"]
        else:
            final_tags = ["cultural performance"]

    return list(dict.fromkeys(final_tags))[:3]

def run_amusement(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        to_query_items = []
        for item in block:
            if len(pre_tags_map[item["location_name"]]) < 2:
                to_query_items.append(item)

        api_result = {}
        if to_query_items:
            results = classify_with_model(model, to_query_items)
            for r in results:
                # Ưu tiên lấy 'categories', nếu model cũ trả 'tags' thì vẫn lấy được
                api_result[r["place"]] = r.get("categories", r.get("tags", []))

        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            # ĐỔI TÊN KEY OUTPUT TẠI ĐÂY: 'categories'
            item["categories"] = clean_categories(name, ttypes, tags)
            
            # Xóa key 'tags' cũ nếu có để tránh rác
            if "tags" in item:
                del item["tags"]
                
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất! File output:", OUTPUT_FILE)