import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (PHOTOGRAPHY: SCENIC, ARCHITECTURE, NATURE)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- ARCHITECTURE / CULTURE ---
    "church": "church/temple/pagoda",
    "nhà thờ": "church/temple/pagoda",
    "cathedral": "church/temple/pagoda",
    "basilica": "church/temple/pagoda",
    "temple": "church/temple/pagoda",
    "đền": "church/temple/pagoda",
    "pagoda": "church/temple/pagoda",
    "chùa": "church/temple/pagoda",
    "shrine": "church/temple/pagoda",
    "miếu": "church/temple/pagoda",
    
    "citadel": "citadel/palace",
    "thành": "citadel/palace",
    "palace": "citadel/palace",
    "cung điện": "citadel/palace",
    "fortress": "citadel/palace",
    "castle": "citadel/palace",
    "lăng": "citadel/palace", # Lăng tẩm (tomb) thường đi cùng nhóm di tích

    # --- NATURE (LAND & FLORA) ---
    "viewpoint": "viewpoint",
    "lookout": "viewpoint",
    "đài quan sát": "viewpoint",
    "deck": "viewpoint",
    
    "mountain": "mountain",
    "núi": "mountain",
    "đỉnh": "mountain",
    "peak": "mountain",
    "hill": "mountain",
    "đồi": "mountain",
    "pass": "mountain", # Đèo
    
    "garden": "flower field/garden",
    "vườn": "flower field/garden",
    "flower": "flower field/garden",
    "hoa": "flower field/garden",
    "farm": "flower field/garden", # Nông trại check-in
    "park": "flower field/garden", # Công viên cây xanh
    
    # --- NATURE (WATER) ---
    "waterfall": "waterfall",
    "thác": "waterfall",
    
    "river": "river",
    "sông": "river",
    "suối": "river",
    "stream": "river",
    "lake": "river", # Hồ cũng gộp vào nhóm water scenic (hoặc tách nếu cần)
    "hồ": "river",
    
    "island": "island",
    "đảo": "island",
    "hòn": "island",
    
    "beach": "beach",
    "bãi": "beach",
    "coast": "beach",

    # --- ACCOMMODATION ---
    "resort": "resort",
    "villa": "resort",
    "homestay": "homestay",
    "hostel": "homestay",
    "hotel": "hotel",
    "khách sạn": "hotel",

    # --- F&B ---
    "cafe": "cafe",
    "coffee": "cafe",
    "tea": "cafe",
    "restaurant": "restaurant",
    "nhà hàng": "restaurant",
    "bistro": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS
# ----------------------------------------------------------
NAME_HINTS = {
    "chùa": "church/temple/pagoda",
    "đền": "church/temple/pagoda",
    "nhà thờ": "church/temple/pagoda",
    "miếu": "church/temple/pagoda",
    "hoàng thành": "citadel/palace",
    "đại nội": "citadel/palace",
    "dinh": "citadel/palace",
    "lăng": "citadel/palace",
    "view": "viewpoint",
    "tầm nhìn": "viewpoint",
    "cổng trời": "viewpoint",
    "đèo": "viewpoint", # Đèo thường là viewpoint đẹp
    "thác": "waterfall",
    "suối": "river",
    "sông": "river",
    "hồ": "river",
    "núi": "mountain",
    "đỉnh": "mountain",
    "vườn": "flower field/garden",
    "thung lũng": "flower field/garden",
    "đồng cừu": "flower field/garden", # Địa điểm chụp ảnh phổ biến
    "coffee": "cafe",
    "cafe": "cafe"
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

# --- CẬP NHẬT PROMPT: PHOTOGRAPHY THEME ---
PROMPT_PHOTOGRAPHY = """
Classify these places suitable for photography/check-in.
Allowed categories: viewpoint, church/temple/pagoda, citadel/palace, restaurant, cafe, resort, homestay, hotel, flower field/garden, mountain, river, island, beach, waterfall.

RULES:
- Religious sites: Pagodas, Churches, Temples -> "church/temple/pagoda".
- Historical: Royal tombs, Citadels, Old Palaces -> "citadel/palace".
- Nature: Distinguish between 'mountain', 'river' (lakes/streams), 'waterfall', and 'flower field/garden' (parks/flower farms).
- Aesthetic Cafes: Cafes with views or decor -> "cafe".
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

def clean_categories(name, types, tags):
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # 1. Name Hints
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)
            
    # 2. Logic Accommodation (Simplified for Photo context)
    # Vẫn ưu tiên Resort > Hotel > Homestay (vì Resort thường chụp ảnh đẹp hơn)
    if "resort" in tags:
        if "hotel" in tags: tags.remove("hotel")
        if "homestay" in tags: tags.remove("homestay")
    
    # 3. Nature Logic (Fix specific keywords)
    # Nếu tên có "Thác" -> Bắt buộc phải là waterfall
    if "thác" in lower_name and "waterfall" not in tags:
        tags.append("waterfall")
    
    # Nếu tên có "Đèo", "Cổng trời" -> thường là viewpoint + mountain
    if any(k in lower_name for k in ["đèo", "cổng trời", "đỉnh"]):
        if "mountain" not in tags: tags.append("mountain")
        if "viewpoint" not in tags: tags.append("viewpoint")

    # 4. Religious/Cultural Logic
    # Đảm bảo gom nhóm đúng
    if any(k in lower_name for k in ["chùa", "nhà thờ", "đền", "tòa thánh"]):
        if "church/temple/pagoda" not in tags: tags.append("church/temple/pagoda")
        
    # 5. F&B Logic
    cafe_keywords = ["coffee", "cafe", "cà phê", "tiệm nước"]
    if any(k in lower_name for k in cafe_keywords):
        if "cafe" not in tags: tags.append("cafe")
        if "restaurant" in tags: tags.remove("restaurant")

    # 6. Sort & Filter (Allowed categories only)
    majors = [
        "viewpoint", 
        "church/temple/pagoda", "citadel/palace",
        "flower field/garden", "mountain", "river", "island", "beach", "waterfall",
        "resort", "homestay", "hotel", 
        "cafe", "restaurant"
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # Fallback
    if not final_tags:
        final_tags = tags_from_types(types)
    if not final_tags:
        # Đoán dựa trên keywords phổ biến nếu type rỗng
        if "garden" in lower_name or "vườn" in lower_name: final_tags = ["flower field/garden"]
        elif "coffee" in lower_name: final_tags = ["cafe"]
        elif "hotel" in lower_name: final_tags = ["hotel"]
        else: final_tags = ["viewpoint"] # Viewpoint là default an toàn cho chụp ảnh

    return list(dict.fromkeys(final_tags))[:3]

def run_photograph(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        to_query_items = []
        for item in block:
            if len(pre_tags_map[item["location_name"]]) < 1:
                to_query_items.append(item)

        api_result = {}
        if to_query_items:
            results = classify_with_model(model, to_query_items)
            for r in results:
                api_result[r["place"]] = r.get("categories", r.get("tags", []))

        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            # Gán vào key 'categories'
            item["categories"] = clean_categories(name, ttypes, tags)
            
            # Xóa key 'tags' cũ
            if "tags" in item:
                del item["tags"]
                
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất! File output:", OUTPUT_FILE)