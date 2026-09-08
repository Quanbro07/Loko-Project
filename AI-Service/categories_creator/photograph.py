import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (PHOTOGRAPHY: EXPANDED)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- ARCHITECTURE / CULTURE ---
    "church": "church/temple/pagoda",
    "place_of_worship": "church/temple/pagoda",
    "cathedral": "church/temple/pagoda",
    "basilica": "church/temple/pagoda",
    "temple": "church/temple/pagoda",
    "pagoda": "church/temple/pagoda",
    "shrine": "church/temple/pagoda",
    "monastery": "church/temple/pagoda",
    
    "citadel": "citadel/palace",
    "palace": "citadel/palace",
    "castle": "citadel/palace",
    "fortress": "citadel/palace",
    "museum": "museum", # Mapping file có ID 18
    "landmark": "viewpoint", 

    # --- NATURE (LAND & FLORA) ---
    "viewpoint": "viewpoint",
    "observation_deck": "viewpoint",
    
    "mountain": "mountain",
    "peak": "mountain",
    "hill": "mountain",
    "natural_feature": "viewpoint", # Tạm gán, sẽ check name hint
    
    "garden": "flower field/garden",
    "park": "flower field/garden",
    "farm": "flower field/garden", 
    "florist": "flower field/garden",
    
    # --- NATURE (WATER) ---
    "waterfall": "waterfall",
    
    "river": "river",
    "lake": "river", # Gộp Lake vào River theo mapping ID 29
    
    "island": "island",
    "archipelago": "island",
    
    "beach": "beach",
    "natural_feature": "beach", # Đôi khi bãi biển là natural_feature
    
    # --- ACCOMMODATION ---
    "resort": "resort",
    "villa": "resort",
    "homestay": "homestay",
    "hotel": "hotel",
    "lodging": "hotel",

    # --- F&B ---
    "cafe": "cafe",
    "coffee_shop": "cafe",
    "tea_house": "cafe",
    "restaurant": "restaurant",
    "bar": "bar"
}

# ----------------------------------------------------------
# 2. NAME HINTS (DETAILED & LOCALIZED)
# ----------------------------------------------------------
NAME_HINTS = {
    # --- RELIGIOUS ---
    "chùa": "church/temple/pagoda", "pagoda": "church/temple/pagoda",
    "đền": "church/temple/pagoda", "temple": "church/temple/pagoda",
    "nhà thờ": "church/temple/pagoda", "church": "church/temple/pagoda", "cathedral": "church/temple/pagoda",
    "miếu": "church/temple/pagoda", "phủ": "church/temple/pagoda",
    "thiền viện": "church/temple/pagoda", "tu viện": "church/temple/pagoda", "tịnh xá": "church/temple/pagoda",
    "tòa thánh": "church/temple/pagoda", "holy see": "church/temple/pagoda",

    # --- HISTORICAL / ROYAL ---
    "hoàng thành": "citadel/palace", "citadel": "citadel/palace",
    "đại nội": "citadel/palace", "imperial": "citadel/palace",
    "dinh": "citadel/palace", "palace": "citadel/palace", "biệt điện": "citadel/palace",
    "lăng": "citadel/palace", "tomb": "citadel/palace", "lăng tẩm": "citadel/palace",
    "thành cổ": "citadel/palace", "cửa ngọ môn": "citadel/palace",

    # --- BEACH / COAST (Expanded) ---
    "bãi": "beach", "beach": "beach", "biển": "beach",
    "vịnh": "beach", "bay": "beach", # Vịnh thường có biển
    "mũi": "viewpoint", "cape": "viewpoint", # Mũi thường là chỗ ngắm cảnh biển
    "hòn": "island", "island": "island", "cù lao": "island",
    "bờ kè": "beach", "seaside": "beach", "coast": "beach",
    "hải đăng": "viewpoint", "lighthouse": "viewpoint",

    # --- WATERFALL ---
    "thác": "waterfall", "waterfall": "waterfall", "cascade": "waterfall",

    # --- RIVER / LAKE ---
    "hồ": "river", "lake": "river", "đầm": "river", "lagoon": "river",
    "sông": "river", "river": "river", "bến": "river", "wharf": "river",
    "suối": "river", "stream": "river", # Suối nhỏ gộp vào river
    "tuyền lâm": "river", "xuân hương": "river", "than thở": "river",

    # --- MOUNTAIN / HILL ---
    "núi": "mountain", "mountain": "mountain", "mt.": "mountain",
    "đồi": "mountain", "hill": "mountain",
    "đỉnh": "mountain", "peak": "mountain",
    "đèo": "viewpoint", "pass": "viewpoint", # Đèo check-in chủ yếu là ngắm cảnh
    "langbiang": "mountain", "fansipan": "mountain", "bidoup": "mountain",

    # --- FLOWER / GARDEN / FARM ---
    "vườn": "flower field/garden", "garden": "flower field/garden",
    "hoa": "flower field/garden", "flower": "flower field/garden",
    "thung lũng": "flower field/garden", "valley": "flower field/garden",
    "đồng cừu": "flower field/garden", "sheep": "flower field/garden", # Check-in kiểu nông trại
    "nông trại": "flower field/garden", "farm": "flower field/garden",
    "rừng": "flower field/garden", "forest": "flower field/garden", # Rừng thông check-in
    "cẩm tú cầu": "flower field/garden", "hydrangea": "flower field/garden",
    "công viên": "flower field/garden", "park": "flower field/garden",

    # --- VIEWPOINT / CHECK-IN ---
    "view": "viewpoint", "tầm nhìn": "viewpoint", "panorama": "viewpoint",
    "cổng trời": "viewpoint", "sky gate": "viewpoint", "heaven gate": "viewpoint",
    "săn mây": "viewpoint", "cloud": "viewpoint", "mây": "viewpoint",
    "nấc thang": "viewpoint", "stairway": "viewpoint",
    "cầu kính": "viewpoint", "glass bridge": "viewpoint",
    "quảng trường": "cultural performance", "square": "cultural performance",

    # --- F&B (Aesthetic) ---
    "cafe": "cafe", "coffee": "cafe", "cà phê": "cafe",
    "tiệm nước": "cafe", "trà": "cafe", "tea": "cafe",
    "túi mơ to": "cafe", # Tên quán nổi tiếng

    # --- ACCOMMODATION ---
    "resort": "resort", "khu nghỉ dưỡng": "resort",
    "homestay": "homestay", "hostel": "homestay", "nhà bên suối": "homestay"
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
# 4. LOGIC: CLEAN CATEGORIES (PHOTO SPECIFIC)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # --- BƯỚC 1: NAME HINTS (Quét từ khóa chi tiết) ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            # Logic đặc biệt cho Đèo/Mũi (Vừa là viewpoint, vừa là nature)
            if v == "viewpoint" and ("đèo" in lower_name or "mũi" in lower_name):
                if "mountain" not in tags and "đèo" in lower_name: tags.append("mountain")
                if "beach" not in tags and "mũi" in lower_name: tags.append("beach")
            
            if v not in tags:
                tags.append(v)

    # --- BƯỚC 2: LOGIC ƯU TIÊN (PRIORITY RULES) ---

    # RULE A: Resort chụp ảnh đẹp hơn Hotel
    if "resort" in tags:
        if "hotel" in tags: tags.remove("hotel")
        if "homestay" in tags: tags.remove("homestay")

    # RULE B: Cafe check-in đè Restaurant (trừ khi tên có chữ Nhà hàng rõ ràng)
    if "cafe" in tags and "restaurant" in tags:
        if not any(x in lower_name for x in ["nhà hàng", "restaurant", "quán ăn", "ẩm thực", "bếp"]):
            tags.remove("restaurant")

    # RULE C: Nature Specificity (Cụ thể đè Chung chung)
    # Nếu đã là Waterfall thì bỏ River/Mountain (để icon hiển thị chính xác hơn)
    if "waterfall" in tags:
        if "river" in tags: tags.remove("river")
        if "mountain" in tags: tags.remove("mountain")

    # RULE D: Săn mây (Cloud Hunting) -> Viewpoint + Mountain
    if any(x in lower_name for x in ["săn mây", "cloud", "cổng trời", "đồi chè"]):
        if "viewpoint" not in tags: tags.append("viewpoint")
        if "mountain" not in tags: tags.append("mountain")

    # RULE E: Biển Đảo
    if "island" in tags and "beach" not in tags:
        # Thường đảo sẽ có biển, thêm tag beach để user tìm biển cũng ra đảo
        tags.append("beach")

    # --- BƯỚC 3: SORT & FILTER (THEO MAPPING ID) ---
    # Chỉ giữ lại các category có trong Mapping File
    majors = [
        "viewpoint",  # ID 25
        "church/temple/pagoda", # ID 20
        "citadel/palace", # ID 19
        "museum", # ID 18
        "flower field/garden", # ID 30
        "mountain", # ID 14
        "river", # ID 29 (Includes Lake)
        "island", # ID 23
        "beach", # ID 22
        "waterfall", # ID 33
        "resort", # ID 26
        "homestay", # ID 27
        "hotel", # ID 7
        "cafe", # ID 3
        "bar", # ID 31
        "restaurant", # ID 2
        "cultural performance" # ID 13 (Quảng trường...)
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # --- BƯỚC 4: FALLBACK ---
    if not final_tags:
        # Nếu rỗng, đoán lại lần cuối
        if "garden" in lower_name: final_tags.append("flower field/garden")
        elif "hotel" in lower_name: final_tags.append("hotel")
        elif "coffee" in lower_name: final_tags.append("cafe")
        else: final_tags.append("viewpoint") # Default cho chụp ảnh

    return list(dict.fromkeys(final_tags))[:3] # Lấy tối đa 3 tag

# ----------------------------------------------------------
# 5. GEMINI PROMPT
# ----------------------------------------------------------
PROMPT_PHOTOGRAPHY = """
Classify these places suitable for photography/check-in/sightseeing.
Allowed categories: viewpoint, church/temple/pagoda, citadel/palace, museum, restaurant, cafe, bar, resort, homestay, hotel, flower field/garden, mountain, river, island, beach, waterfall.

RULES:
- Religious: Pagodas/Churches -> "church/temple/pagoda".
- History: Citadels/Tombs -> "citadel/palace".
- Nature: 
  - "Hồ/Lake", "Suối/Stream" -> "river".
  - "Đồi/Hill", "Đỉnh/Peak" -> "mountain".
  - "Vườn hoa/Flower Farm" -> "flower field/garden".
- Beach/Island: Distinct classification.
- Aesthetic: Cafes with views -> "cafe".
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
    prompt = PROMPT_PHOTOGRAPHY.replace("{locations}", locations)
    
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
def run_photograph(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"📸 Bắt đầu xử lý Photograph cho file: {INPUT_FILE}")
    
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
            
            # Xử lý Logic chi tiết
            item["categories"] = clean_categories(name, ttypes, tags)
            
            if "tags" in item: del item["tags"]
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Photograph! File output:", OUTPUT_FILE)