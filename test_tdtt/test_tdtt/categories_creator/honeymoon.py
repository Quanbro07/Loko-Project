import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (HONEYMOON / RESORT / RELAX)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- ACCOMMODATION ---
    "resort": "resort",
    "khu nghỉ dưỡng": "resort",
    "villa": "resort",
    "bungalow": "resort",
    
    "homestay": "homestay",
    "nhà nghỉ": "homestay",
    "guest house": "homestay",
    "hostel": "homestay",
    "farmstay": "homestay",
    
    "hotel": "hotel",
    "khách sạn": "hotel",
    "lodging": "hotel",
    "nơi lưu trú": "hotel",
    
    # --- MARINE / COASTAL ---
    "beach": "beach",
    "bãi biển": "beach",
    "bãi tắm": "beach",
    "coast": "beach",
    
    "island": "island",
    "đảo": "island",
    "hòn": "island",
    "cù lao": "island",
    
    "yacht": "yacht/cruise",
    "cruise": "yacht/cruise",
    "du thuyền": "yacht/cruise",
    "bến tàu": "yacht/cruise",
    "pier": "yacht/cruise",
    "marina": "yacht/cruise",
    "boat": "yacht/cruise",

    # --- F&B ---
    "cafe": "cafe",
    "coffee": "cafe",
    "cà phê": "cafe",
    "tea": "cafe",
    "quán nước": "cafe",
    
    "restaurant": "restaurant",
    "nhà hàng": "restaurant",
    "quán ăn": "restaurant",
    "ẩm thực": "restaurant",
    "dining": "restaurant",
    "bistro": "restaurant",
    
    # --- SIGHTSEEING ---
    "viewpoint": "viewpoint",
    "đài quan sát": "viewpoint",
    "lookout": "viewpoint",
    "tầm nhìn": "viewpoint",
    "đỉnh": "viewpoint", 
    "observation": "viewpoint",
    "deck": "viewpoint"
}

# ----------------------------------------------------------
# 2. NAME HINTS
# ----------------------------------------------------------
NAME_HINTS = {
    "resort": "resort",
    "villa": "resort",
    "retreat": "resort",
    "homestay": "homestay",
    "hotel": "hotel",
    "khách sạn": "hotel",
    "beach": "beach",
    "bãi": "beach",
    "hòn": "island",
    "đảo": "island",
    "du thuyền": "yacht/cruise",
    "cruise": "yacht/cruise",
    "coffee": "cafe",
    "kafe": "cafe",
    "cà phê": "cafe",
    "rooftop": "viewpoint",
    "sky bar": "viewpoint",
    "view": "viewpoint"
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

# --- CẬP NHẬT PROMPT: HONEYMOON / RELAX THEME ---
PROMPT_HONEYMOON = """
Classify these places for a honeymoon/relax trip.
Allowed categories: hotel, resort, homestay, beach, island, yacht/cruise, restaurant, cafe, viewpoint.

RULES:
- Hierarchy: If it's a 'resort', do NOT tag 'hotel'.
- Ambiguity: 'Island Resort' -> ["resort", "island"].
- Cafe with View: A cafe on a hill/rooftop -> ["cafe", "viewpoint"].
- Homestay: Small lodging, guest house, bungalow -> "homestay".
- Luxury: High-end dining -> "restaurant".
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
    prompt = PROMPT_HONEYMOON.replace("{locations}", locations)
    
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
            
    # 2. Accommodation Logic
    # Ưu tiên Resort > Hotel > Homestay
    if "resort" in tags:
        if "hotel" in tags: tags.remove("hotel")
        if "homestay" in tags: tags.remove("homestay")
    
    # Xử lý Villa: thường là Resort hoặc Homestay cao cấp, ít khi gọi là Hotel
    if "villa" in lower_name:
        if "hotel" in tags: tags.remove("hotel")
        if "resort" not in tags and "homestay" not in tags: tags.append("resort")

    # 3. F&B Logic
    cafe_keywords = ["coffee", "cafe", "cà phê", "tea", "trà"]
    if any(k in lower_name for k in cafe_keywords):
        if "cafe" not in tags: tags.append("cafe")
        if "restaurant" in tags: tags.remove("restaurant")
        
    # 4. Viewpoint Logic
    # Rooftop/Sky Bar -> Cafe/Nightlife (đã map) + Viewpoint
    if any(k in lower_name for k in ["rooftop", "sky bar", "panorama", "đỉnh"]):
        if "viewpoint" not in tags: tags.append("viewpoint")

    # 5. Sort & Filter (Allowed categories only)
    majors = [
        "resort", "homestay", "hotel", 
        "beach", "island", "yacht/cruise", 
        "restaurant", "cafe", 
        "viewpoint"
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # Fallback
    if not final_tags:
        final_tags = tags_from_types(types)
    if not final_tags:
        if "coffee" in lower_name: final_tags = ["cafe"]
        elif "resort" in lower_name: final_tags = ["resort"]
        elif "hotel" in lower_name: final_tags = ["hotel"]
        else: final_tags = ["viewpoint"]

    return list(dict.fromkeys(final_tags))[:3]

def run_honeymoon(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
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