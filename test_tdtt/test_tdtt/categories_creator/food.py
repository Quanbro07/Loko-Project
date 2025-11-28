import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (FOOD: EXPANDED & LOCALIZED)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- RESTAURANT (MAIN MEALS) ---
    "restaurant": "restaurant",
    "nhà hàng": "restaurant",
    "quán ăn": "restaurant",
    "ẩm thực": "restaurant",
    "dining": "restaurant",
    "diner": "restaurant",
    "bistro": "restaurant", # Bistro thường là nhà hàng nhỏ
    "steak": "restaurant",
    "bbq": "restaurant",
    "nướng": "restaurant",
    "lẩu": "restaurant",
    "hotpot": "restaurant",
    "hải sản": "restaurant",
    "seafood": "restaurant",
    "sushi": "restaurant",
    "pizza": "restaurant",
    "pasta": "restaurant",
    "vegetarian": "restaurant",
    "chay": "restaurant",
    "cơm": "restaurant",
    "rice": "restaurant",
    "phở": "restaurant",
    "noodle": "restaurant",
    "bún": "restaurant",
    "mì": "restaurant",
    "hủ tiếu": "restaurant",
    "dimsum": "restaurant",

    # --- CAFE (BEVERAGE) ---
    "cafe": "cafe",
    "coffee": "cafe",
    "cà phê": "cafe",
    "kafe": "cafe",
    "tea": "cafe",
    "trà": "cafe",
    "milk tea": "cafe",
    "trà sữa": "cafe",
    "juice": "cafe",
    "sinh tố": "cafe",
    "nước ép": "cafe",
    "beverage": "cafe",
    "giải khát": "cafe",
    "quán nước": "cafe",
    "roastery": "cafe",
    
    # --- SNACK (STREET FOOD / LIGHT MEALS) ---
    "snack": "snack",
    "ăn vặt": "snack",
    "street food": "snack",
    "fast food": "snack",
    "thức ăn nhanh": "snack",
    "bakery": "snack",
    "bánh": "snack",
    "tiệm bánh": "snack",
    "cake": "snack",
    "ice cream": "snack",
    "kem": "snack",
    "gelato": "snack",
    "dessert": "snack",
    "tráng miệng": "snack",
    "chè": "snack",
    "yogurt": "snack",
    "yaourt": "snack",
    "bánh mì": "snack", # Bánh mì thường xếp vào snack/nhanh
    "xôi": "snack",

    # --- MARKET / SHOPPING ---
    "market": "market",
    "chợ": "market",
    "siêu thị": "market",
    "supermarket": "market",
    "grocery": "market",
    "convenience_store": "market",
    "bách hóa": "market",
    "night_market": "night market",
    "chợ đêm": "night market",
    
    # --- SPECIALITY (GIFTS) ---
    "speciality": "speciality",
    "đặc sản": "speciality",
    "gift": "speciality",
    "souvenir": "speciality",
    "quà": "speciality",
    "lưu niệm": "speciality",
    "yến": "speciality", # Yến sào
    "bird nest": "speciality",
    "trầm": "speciality", # Trầm hương
    "agarwood": "speciality",
    
    # --- ACCOMMODATION (WITH FOOD) ---
    "hotel": "hotel",
    "khách sạn": "hotel",
    "resort": "hotel"
}

# ----------------------------------------------------------
# 2. NAME HINTS (DETAILED VIETNAMESE CONTEXT)
# ----------------------------------------------------------
NAME_HINTS = {
    # --- CAFE ---
    "coffee": "cafe", "cafe": "cafe", "kafe": "cafe", "cà phê": "cafe",
    "trà sữa": "cafe", "milk tea": "cafe", "tea": "cafe", 
    "phúc long": "cafe", "highlands": "cafe", "starbucks": "cafe", 
    "katinat": "cafe", "trung nguyên": "cafe", "the coffee house": "cafe",
    "sinh tố": "cafe", "nước ép": "cafe", "kem bơ": "snack", # Kem bơ đà lạt lai giữa cafe và snack

    # --- RESTAURANT (DISHES) ---
    "nhà hàng": "restaurant", "restaurant": "restaurant",
    "quán": "restaurant", "kitchen": "restaurant", "bếp": "restaurant",
    "lẩu": "restaurant", "hotpot": "restaurant", "kichi": "restaurant", "manwah": "restaurant",
    "nướng": "restaurant", "bbq": "restaurant", "gogi": "restaurant",
    "hải sản": "restaurant", "seafood": "restaurant", "ốc": "restaurant",
    "cơm": "restaurant", "cơm niêu": "restaurant", "cơm tấm": "restaurant",
    "phở": "restaurant", "bún": "restaurant", "mì quảng": "restaurant", "hủ tiếu": "restaurant",
    "nem nướng": "restaurant", "bánh căn": "restaurant", # Bánh căn ngồi ăn tại chỗ coi là quán ăn
    "pizza": "restaurant", "pasta": "restaurant", "sushi": "restaurant",
    "buffet": "restaurant", "rau": "restaurant", # Lẩu rau

    # --- SNACK / BAKERY ---
    "bánh mì": "snack", "banh mi": "snack", "liên hoa": "snack", # Tiệm bánh nổi tiếng
    "bakery": "snack", "tiệm bánh": "snack", "cake": "snack",
    "kem": "snack", "ice cream": "snack", "gelato": "snack",
    "chè": "snack", "tàu hũ": "snack", "sữa chua": "snack",
    "ăn vặt": "snack", "bánh tráng": "snack", "xắp xắp": "snack",
    "khoai lang": "snack", "bắp nướng": "snack",

    # --- SPECIALITY / MARKET ---
    "đặc sản": "speciality", "langfarm": "speciality", "l'angfarm": "speciality",
    "yến sào": "speciality", "yến đảo": "speciality",
    "trầm hương": "speciality", "kỳ nam": "speciality",
    "mứt": "speciality", "hồng treo": "speciality", "rượu vang": "speciality",
    "chợ đêm": "night market", "night market": "night market", "walking street": "night market",
    "chợ": "market", "market": "market", "vựa": "market" # Vựa hải sản (mua mang về)
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
# 4. LOGIC: CLEAN CATEGORIES (FOOD SPECIFIC)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # --- BƯỚC 1: NAME HINTS (Quét từ khóa) ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            if v not in tags: tags.append(v)
            
            # Logic phụ: Nếu tên có "Nhà hàng" thì chắc chắn là Restaurant, bỏ Snack
            if v == "restaurant" and "nhà hàng" in lower_name:
                if "snack" in tags: tags.remove("snack")

    # --- BƯỚC 2: LOGIC HYBRID (Kết hợp) ---

    # RULE A: Bistro / Resto-Cafe -> Cả 2
    if "bistro" in lower_name or "lounge" in lower_name:
        if "restaurant" not in tags: tags.append("restaurant")
        if "cafe" not in tags: tags.append("cafe")

    # RULE B: Night Market -> Snack + Market (Bỏ Restaurant nếu không rõ ràng)
    if "night market" in tags or "chợ đêm" in lower_name:
        if "snack" not in tags: tags.append("snack")
        if "night market" not in tags: tags.append("night market")
        # Chợ đêm thường ăn vặt, ít khi gọi là "Nhà hàng" trừ khi vào quán cụ thể
        if "market" in tags: tags.remove("market") # Chuyển hẳn sang Night Market

    # RULE C: Speciality (Quà tặng)
    if any(x in lower_name for x in ["yến", "trầm", "đặc sản", "gift", "souvenir", "langfarm"]):
        if "speciality" not in tags: tags.append("speciality")
        # Nếu chỉ bán quà, không phải chợ hay nhà hàng thì bỏ mấy cái kia
        if "restaurant" in tags and "nhà hàng" not in lower_name: tags.remove("restaurant")
        if "market" in tags: tags.remove("market")

    # RULE D: Bakery (Tiệm bánh) -> Snack (Có thể có Cafe)
    if any(x in lower_name for x in ["bakery", "tiệm bánh", "bánh mì"]):
        if "snack" not in tags: tags.append("snack")
        if "restaurant" in tags: tags.remove("restaurant") # Bánh mì là snack, ko phải nhà hàng

    # RULE E: Cafe (Ưu tiên)
    # Nếu là quán Cafe có phục vụ đồ ăn nhẹ (Bánh), ưu tiên Cafe
    if "cafe" in tags and "snack" in tags:
        # Giữ cả 2
        pass
    elif "cafe" in tags and "restaurant" in tags:
        # Nếu tên không có chữ "Restaurant/Nhà hàng/Bistro" -> Bỏ Restaurant (VD: Highlands Coffee có bán bánh mì nhưng là Cafe)
        if not any(x in lower_name for x in ["nhà hàng", "restaurant", "bistro", "quán ăn", "kitchen"]):
            tags.remove("restaurant")

    # --- BƯỚC 3: SORT & FILTER (ALLOWED CATEGORIES) ---
    majors = [
        "speciality",   # ID 6
        "night market", # ID 4
        "market",       # ID 5
        "restaurant",   # ID 2
        "cafe",         # ID 3
        "snack",        # ID 1
        "hotel"         # ID 7
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # --- BƯỚC 4: FALLBACK ---
    if not final_tags:
        # Đoán dựa trên keywords phổ biến lần cuối
        if "coffee" in lower_name or "cafe" in lower_name: final_tags.append("cafe")
        elif "mart" in lower_name: final_tags.append("market")
        elif "hotel" in lower_name: final_tags.append("hotel")
        else: final_tags.append("restaurant") # Default là quán ăn

    return list(dict.fromkeys(final_tags))[:3]

# ----------------------------------------------------------
# 5. GEMINI PROMPT
# ----------------------------------------------------------
PROMPT_FOOD = """
Classify these food/dining locations.
Allowed categories: snack, restaurant, cafe, night market, market, speciality, hotel.

RULES:
- "speciality": Shops selling local gifts (Bird's Nest/Yến Sào, Dried Seafood, Tea gifts).
- "snack": Bakeries, Ice Cream shops, Bánh Mì stands, Sweet Soup (Chè), Street Food.
- "restaurant": Proper meals (Phở, Rice/Cơm, Seafood, BBQ, Hotpot, Buffet).
- "cafe": Coffee shops, Milk Tea (Trà Sữa), Juice bars.
- "night market": Designated night markets (Chợ đêm).
- Hybrid: A "Bistro" can be ["restaurant", "cafe"].
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
    return [{"place": item["location_name"], "categories": []} for item in items]

# ----------------------------------------------------------
# 6. MAIN RUNNER
# ----------------------------------------------------------
def run_food(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"🍜 Bắt đầu xử lý Food cho file: {INPUT_FILE}")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        # Query AI nếu ít tag hoặc không chắc chắn
        to_query_items = []
        for item in block:
            if len(pre_tags_map[item["location_name"]]) < 2:
                to_query_items.append(item)

        api_result = {}
        if to_query_items:
            results = classify_with_model(model, to_query_items)
            for r in results:
                api_result[r["place"]] = r.get("categories", [])

        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            # Chạy logic làm sạch
            item["categories"] = clean_categories(name, ttypes, tags)
            
            if "tags" in item: del item["tags"]
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Food! File output:", OUTPUT_FILE)