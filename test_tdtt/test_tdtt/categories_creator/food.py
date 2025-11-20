import json
import re
import time

# ----------------------------------------------------------
# 1. MAPPING CHI TIẾT CHO FOOD (GIỮ NGUYÊN)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- RESTAURANT (Ăn chính) ---
    "nhà hàng": "restaurant",
    "restaurant": "restaurant",
    "quán ăn": "restaurant",
    "ẩm thực": "restaurant",
    "buffet": "restaurant",
    "hải sản": "restaurant",
    "lẩu": "restaurant",
    "nướng": "restaurant",
    "bbq": "restaurant",
    "cơm": "restaurant",
    "phở": "restaurant",
    "bún": "restaurant",
    "mì": "restaurant",
    "steak": "restaurant",
    "pizza": "restaurant",
    "sushi": "restaurant",
    "dining": "restaurant",
    
    # --- CAFE (Đồ uống) ---
    "cà phê": "cafe",
    "coffee": "cafe",
    "cafe": "cafe",
    "trà": "cafe",
    "tea": "cafe",
    "sinh tố": "cafe",
    "juice": "cafe",
    "giải khát": "cafe",
    "quán nước": "cafe",
    
    # --- SNACK (Ăn vặt / Bánh ngọt / Fastfood) ---
    "ăn vặt": "snack",
    "fast food": "snack",
    "đồ ăn nhanh": "snack",
    "bánh mì": "snack",
    "bakery": "snack",
    "tiệm bánh": "snack",
    "kem": "snack",
    "ice cream": "snack",
    "chè": "snack",
    "xôi": "snack",
    "tráng miệng": "snack",
    "dessert": "snack",
    
    # --- MARKET / NIGHT MARKET ---
    "chợ": "market",
    "market": "market",
    "siêu thị": "market",
    "grocery": "market",
    "thực phẩm": "market",
    "chợ đêm": "night market",
    "night market": "night market",
    
    # --- SPECIALITY (Đặc sản / Quà tặng) ---
    "đặc sản": "speciality",
    "quà lưu niệm": "speciality",
    "souvenir": "speciality",
    "yến sào": "speciality",
    "trầm hương": "speciality",
    "hải sản khô": "speciality",
    "nước mắm": "speciality",
    "nem": "speciality",
    
    # --- HOTEL ---
    "khách sạn": "hotel",
    "hotel": "hotel",
    "resort": "hotel"
}

# ----------------------------------------------------------
# 2. NAME HINTS
# ----------------------------------------------------------
NAME_HINTS = {
    # Cafe & Snack
    "coffee": "cafe",
    "cafe": "cafe",
    "kafe": "cafe",
    "tea": "cafe",
    "bánh mì": "snack",
    "bakery": "snack",
    "kem": "snack",
    "chè": "snack",
    "bistro": "restaurant", 
    
    # Restaurant
    "nhà hàng": "restaurant",
    "quán": "restaurant",
    "hải sản": "restaurant",
    "lẩu": "restaurant",
    "nướng": "restaurant",
    "buffet": "restaurant",
    "cơm niêu": "restaurant",
    
    # Speciality
    "đặc sản": "speciality",
    "yến sào": "speciality",
    "bird's nest": "speciality",
    "trầm": "speciality",
    "agarwood": "speciality",
    "gift": "speciality",
    
    # Market
    "chợ đầm": "market",
    "chợ xóm mới": "market",
    "siêu thị": "market",
    "mart": "market",
    "chợ đêm": "night market",
    "night market": "night market"
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
PROMPT_FOOD = """
Classify these food/dining locations.
Allowed categories: snack, restaurant, cafe, night market, market, speciality, hotel.

RULES:
- "speciality" is for shops selling local gifts like Bird's Nest (Yến Sào), Dried Seafood.
- "snack" is for Bánh Mì, Ice Cream, Bakery.
- "restaurant" is for proper meals (Phở, Seafood, Buffet).
- Flexible: A bakery with coffee -> ["snack", "cafe"].
- A hotel with dining -> ["hotel", "restaurant"].
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
    prompt = PROMPT_FOOD.replace("{locations}", locations)
    
    for _ in range(3):
        try:
            resp = model.generate_content(prompt)
            data = extract_json(resp.text)
            if data and "results" in data:
                return data["results"]
        except:
            time.sleep(1)
    # Trả về key categories rỗng nếu lỗi
    return [{"place": item["location_name"], "categories": []} for item in items]

def clean_categories(name, types, tags):
    # (Logic giữ nguyên các rule thông minh của Food, chỉ đổi tên hàm)
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # LOGIC HYBRID & LINH HOẠT
    
    # Nếu tên có cả Coffee và Restaurant/Bistro
    if "bistro" in lower_name or ("cafe" in lower_name and "restaurant" in lower_name):
        if "restaurant" not in tags: tags.append("restaurant")
        if "cafe" not in tags: tags.append("cafe")
        
    # Xử lý Night Market
    if "chợ đêm" in lower_name or "night market" in lower_name:
        if "night market" not in tags: tags.append("night market")
        if "snack" not in tags: tags.append("snack")
        if "market" in tags: tags.remove("market")

    # Xử lý Speciality
    if any(x in lower_name for x in ["yến sào", "trầm hương", "đặc sản", "gift shop", "lưu niệm"]):
        if "speciality" not in tags: tags.append("speciality")
        if "market" in tags: tags.remove("market")

    # Name Hints
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)

    # Restaurant vs Snack Conflict
    if "snack" in tags and "restaurant" in tags:
        if any(x in lower_name for x in ["bakery", "kem", "ice cream", "chè"]):
            tags.remove("restaurant")

    # Sort & Filter
    allowed = ["speciality", "night market", "market", "restaurant", "cafe", "snack", "hotel"]
    
    final_tags = []
    for tag in allowed:
        if tag in tags:
            final_tags.append(tag)

    # Fallback
    if not final_tags:
        final_tags = tags_from_types(types)
    if not final_tags:
        if "coffee" in lower_name or "cafe" in lower_name:
            final_tags = ["cafe"]
        else:
            final_tags = ["restaurant"]

    return list(dict.fromkeys(final_tags))[:3]

def run_food(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
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
                # Ưu tiên key 'categories', fallback 'tags'
                api_result[r["place"]] = r.get("categories", r.get("tags", []))

        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            # ĐỔI TÊN KEY OUTPUT TẠI ĐÂY: 'categories'
            item["categories"] = clean_categories(name, ttypes, tags)
            
            # Xóa key 'tags' cũ nếu tồn tại
            if "tags" in item:
                del item["tags"]

            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Food! File output:", OUTPUT_FILE)