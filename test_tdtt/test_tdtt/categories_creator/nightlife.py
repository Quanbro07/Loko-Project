import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (NIGHTLIFE: ENTERTAINMENT & LATE NIGHT)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- NIGHTLIFE SPECIFIC ---
    "bar": "bar",
    "pub": "bar",
    "club": "bar",
    "lounge": "bar",
    "nightlife": "bar",
    "wine": "bar",
    "beer": "bar",
    "karaoke": "bar", # Karaoke thường đi kèm bar/giải trí đêm
    "cocktail": "bar",

    "night market": "night market",
    "chợ đêm": "night market",
    
    "walking street": "walking street",
    "phố đi bộ": "walking street",
    "pedestrian": "walking street",

    # --- ACCOMMODATION (Camping is popular for night activities) ---
    "camp": "camping",
    "camping": "camping",
    "cắm trại": "camping",
    "glamping": "camping",
    
    "hotel": "hotel",
    "khách sạn": "hotel",
    "hostel": "hotel", # Hostel thường có hoạt động đêm
    
    # --- F&B ---
    "cafe": "cafe",
    "coffee": "cafe",
    "cà phê": "cafe",
    "tea": "cafe",
    
    "restaurant": "restaurant",
    "nhà hàng": "restaurant",
    "quán ăn": "restaurant",
    "ẩm thực": "restaurant",
    "bistro": "restaurant", # Bistro thường lai giữa restaurant và bar
    "dining": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS
# ----------------------------------------------------------
NAME_HINTS = {
    "bar": "bar",
    "pub": "bar",
    "club": "bar",
    "lounge": "bar",
    "bia": "bar",
    "beer": "bar",
    "chợ đêm": "night market",
    "night market": "night market",
    "phố đi bộ": "walking street",
    "walking street": "walking street",
    "quảng trường": "walking street", # Quảng trường buổi tối thường như phố đi bộ
    "glamping": "camping",
    "camp": "camping",
    "lều": "camping",
    "hotel": "hotel",
    "khách sạn": "hotel",
    "cafe": "cafe",
    "coffee": "cafe"
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

# --- CẬP NHẬT PROMPT: NIGHTLIFE THEME ---
PROMPT_NIGHTLIFE = """
Classify these places for a nightlife/entertainment trip.
Allowed categories: hotel, night market, bar, camping, cafe, walking street, restaurant.

RULES:
- Nightlife focus: Bars, Pubs, Clubs, Lounges, Beer Clubs -> "bar".
- Markets: Only specific Night Markets -> "night market".
- Walking Streets: Pedestrian zones/streets -> "walking street".
- Camping: Glamping or campsites -> "camping".
- F&B: Distinguish late-night Cafes vs Restaurants.
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
    prompt = PROMPT_NIGHTLIFE.replace("{locations}", locations)
    
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

    # 1. Name Hints (Mạnh tay với các từ khóa đặc thù)
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)
            
    # 2. Logic Walking Street & Night Market
    # Nếu tên có "Chợ đêm" -> Xóa restaurant/cafe (vì nó là khu phức hợp)
    if "chợ đêm" in lower_name or "night market" in lower_name:
        if "night market" not in tags: tags.append("night market")
        if "restaurant" in tags: tags.remove("restaurant")
        if "cafe" in tags: tags.remove("cafe")
        
    # Tương tự với Phố đi bộ
    if "phố đi bộ" in lower_name or "walking street" in lower_name:
        if "walking street" not in tags: tags.append("walking street")

    # 3. Logic Bar/Pub
    # Nếu là Bistro/Gastrobar -> Có thể giữ cả restaurant và bar
    if "bistro" in lower_name:
        if "restaurant" not in tags: tags.append("restaurant")
        if "bar" not in tags: tags.append("bar")
    # Các từ khóa mạnh cho Bar
    elif any(k in lower_name for k in ["pub", "club", "lounge", "sky bar", "mixology"]):
        if "bar" not in tags: tags.append("bar")
        # Thường pub/club ít khi tag là restaurant trừ khi phục vụ ăn chính
        if "restaurant" in tags and "bistro" not in lower_name: 
            tags.remove("restaurant")

    # 4. F&B Cleaning
    cafe_keywords = ["coffee", "cafe", "cà phê", "tea", "trà"]
    if any(k in lower_name for k in cafe_keywords):
        if "cafe" not in tags: tags.append("cafe")
        if "restaurant" in tags: tags.remove("restaurant")
        if "bar" in tags: tags.remove("bar") # Trừ khi cafe bar, nhưng ưu tiên cafe để tránh nhầm

    # 5. Sort & Filter (Allowed categories only)
    majors = [
        "hotel", 
        "night market", "walking street", "bar", 
        "camping", 
        "restaurant", "cafe"
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # Fallback
    if not final_tags:
        final_tags = tags_from_types(types)
    if not final_tags:
        if "hotel" in lower_name: final_tags = ["hotel"]
        elif "coffee" in lower_name: final_tags = ["cafe"]
        elif "bar" in lower_name: final_tags = ["bar"]
        else: final_tags = ["restaurant"] # Mặc định an toàn cho nightlife

    return list(dict.fromkeys(final_tags))[:3]

def run_nightlife(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        to_query_items = []
        for item in block:
            # Nightlife cần phân loại kỹ hơn vì Google Maps hay gộp chung Bar/Restaurant
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