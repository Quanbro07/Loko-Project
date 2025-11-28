import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (NIGHTLIFE: ENTERTAINMENT, CHILL & LATE NIGHT)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- HARDCORE NIGHTLIFE (Bar, Club, Karaoke) ---
    "bar": "bar",
    "night_club": "nightlife", # Club/Disco xếp vào Nightlife (ID 11)
    "disco": "nightlife",
    "karaoke": "nightlife",
    "casino": "nightlife",
    "pub": "bar",
    "wine_bar": "bar",
    "cocktail_bar": "bar",
    "lounge": "bar",
    "beer_hall": "restaurant", # Bia hơi/Beer garden thường là quán ăn/nhậu
    
    # --- WALKING STREET / MARKET ---
    "tourist_attraction": "walking street", # Sẽ check name hint
    "point_of_interest": "walking street",
    "night_market": "night market",
    
    # --- ACCOMMODATION (SLEEP) ---
    "hotel": "hotel",
    "lodging": "hotel",
    "resort": "hotel",
    "love_hotel": "hotel", # Khách sạn tình yêu (phổ biến ở khu chơi đêm)
    "motel": "hotel",
    "hostel": "hotel",     # Dân tây hay ở hostel khu Bùi Viện
    
    # --- F&B (EAT & CHILL) ---
    "restaurant": "restaurant",
    "food": "restaurant",
    "cafe": "cafe",
    "coffee": "cafe",
    "bistro": "restaurant" # Bistro lai giữa Bar và Restaurant
}

# ----------------------------------------------------------
# 2. NAME HINTS (VIETNAMESE NIGHTLIFE CONTEXT)
# ----------------------------------------------------------
NAME_HINTS = {
    # --- BAR / CLUB / PUB ---
    "bar": "bar", "pub": "bar", "lounge": "bar", 
    "club": "nightlife", "disco": "nightlife", "nightclub": "nightlife",
    "rooftop": "bar", "sky bar": "bar", "beer club": "bar", # Beer Club là Bar
    "mixology": "bar", "speakeasy": "bar", 
    "acoustic": "nightlife", # Nhạc sống/Bolero
    "karaoke": "nightlife", "ktv": "nightlife",
    
    # --- WALKING STREET / VIBE ---
    "phố đi bộ": "walking street", "walking street": "walking street",
    "bùi viện": "walking street", "tạ hiện": "walking street", "nguyễn huệ": "walking street",
    "chợ đêm": "night market", "night market": "night market", "night bazaar": "night market",
    
    # --- EATING (NHẬU) ---
    "bia": "restaurant", "beer": "restaurant", # Bia hơi/Bia tô là Restaurant
    "nhậu": "restaurant", "ốc": "restaurant", "hải sản": "restaurant",
    "lẩu": "restaurant", "nướng": "restaurant", "bbq": "restaurant",
    "bistro": "restaurant", "nhà hàng": "restaurant", "quán": "restaurant",
    
    # --- ACCOMMODATION ---
    "hotel": "hotel", "khách sạn": "hotel", "homestay": "hotel",
    "hostel": "hotel", "nhà nghỉ": "hotel"
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
# 4. LOGIC: CLEAN CATEGORIES (NIGHTLIFE SPECIFIC)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # --- BƯỚC 1: NAME HINTS ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            if v not in tags: tags.append(v)

    # --- BƯỚC 2: LOGIC HYBRID & PRIORITY ---

    # Rule A: Beer Club vs Bia Hơi
    # Nếu tên có "Beer Club" -> Bar. Nếu chỉ là "Bia Tô/Bia Hơi" -> Restaurant.
    if "beer" in lower_name or "bia" in lower_name:
        if "club" in lower_name:
            if "bar" not in tags: tags.append("bar")
            if "restaurant" in tags: tags.remove("restaurant")
        else:
            if "restaurant" not in tags: tags.append("restaurant")

    # Rule B: Rooftop/Sky Bar -> Bar (View đẹp)
    if "rooftop" in lower_name or "sky" in lower_name:
        if "bar" not in tags: tags.append("bar")
        # Rooftop thường bán cả cafe, nhưng tối là Bar. Ưu tiên Bar.
        if "cafe" in tags: tags.remove("cafe")

    # Rule C: Phố đi bộ (Walking Street)
    # Các con phố nổi tiếng như Bùi Viện / Tạ Hiện -> Vừa là Phố đi bộ, vừa là Nightlife (sôi động)
    if any(x in lower_name for x in ["bùi viện", "tạ hiện", "phố đi bộ"]):
        if "walking street" not in tags: tags.append("walking street")
        # Nếu chưa có tag nightlife/bar thì thêm vào vì mấy phố này toàn bar
        if "nightlife" not in tags and "bar" not in tags: tags.append("nightlife")

    # Rule D: Acoustic / Live Music (Cafe nhạc sống)
    if "acoustic" in lower_name or "live music" in lower_name or "phòng trà" in lower_name:
        if "nightlife" not in tags: tags.append("nightlife") # Nhạc sống là giải trí đêm
        if "cafe" not in tags: tags.append("cafe")

    # Rule E: Bistro (Nhà hàng lai Bar)
    if "bistro" in lower_name:
        if "restaurant" not in tags: tags.append("restaurant")
        # Bistro có thể uống rượu, nhưng bản chất vẫn là ăn, nên giữ restaurant

    # --- BƯỚC 3: SORT & FILTER ---
    majors = [
        "nightlife",      # ID 11 (Club, Disco, Karaoke)
        "bar",            # ID 31 (Pub, Lounge, Sky Bar)
        "walking street", # ID 32
        "night market",   # ID 4
        "restaurant",     # ID 2 (Quán nhậu, ăn đêm)
        "hotel",          # ID 7
        "cafe"            # ID 3 (Acoustic)
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # --- BƯỚC 4: FALLBACK ---
    if not final_tags:
        if "club" in lower_name: final_tags.append("nightlife")
        elif "pub" in lower_name or "lounge" in lower_name: final_tags.append("bar")
        elif "hotel" in lower_name: final_tags.append("hotel")
        elif "coffee" in lower_name: final_tags.append("cafe")
        else: final_tags.append("restaurant") # Default an toàn

    return list(dict.fromkeys(final_tags))[:3]

# ----------------------------------------------------------
# 5. GEMINI PROMPT
# ----------------------------------------------------------
PROMPT_NIGHTLIFE = """
Classify these places for a Nightlife/Entertainment profile.
Allowed categories: nightlife, bar, walking street, night market, restaurant, hotel, cafe.

RULES:
- "nightlife": Nightclubs, Discos, Karaoke, Casinos, Live Music Venues (Phòng trà).
- "bar": Pubs, Lounges, Rooftop Bars, Cocktail Bars, Beer Clubs.
- "walking street": Pedestrian streets like Bui Vien, Ta Hien, Nguyen Hue.
- "restaurant": Late night dining, "Nhậu" places (Beer gardens), Bistros, Street Food.
- "hotel": Places to stay near nightlife areas.
- "cafe": Acoustic cafes, 24h cafes.
- Hybrid: "Bùi Viện Walking Street" -> ["walking street", "nightlife"].
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

# ----------------------------------------------------------
# 6. MAIN RUNNER
# ----------------------------------------------------------
def run_nightlife(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"🍸 Bắt đầu xử lý Nightlife cho file: {INPUT_FILE}")
    
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        # Query AI
        to_query_items = []
        for item in block:
            if len(pre_tags_map[item["location_name"]]) < 1:
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
            
            item["categories"] = clean_categories(name, ttypes, tags)
            
            if "tags" in item: del item["tags"]
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Nightlife! File output:", OUTPUT_FILE)