import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (HONEYMOON: ROMANCE + LUXURY)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- ACCOMMODATION (PRIORITY: RESORT) ---
    "resort": "resort",
    "khu nghỉ dưỡng": "resort",
    "villa": "resort", 
    "bungalow": "resort", # Bungalow thường lãng mạn
    "retreat": "resort",

    "hotel": "hotel",
    "khách sạn": "hotel",
    "boutique_hotel": "hotel", # Boutique hotel thường đẹp, hợp cặp đôi
    "lodging": "hotel",
    
    "homestay": "homestay",
    "nhà gỗ": "homestay",
    
    # --- ROMANTIC NATURE ---
    "beach": "beach",
    "bãi tắm": "beach",
    
    "island": "island",
    "đảo": "island",
    "hòn": "island",
    
    "flower": "flower field/garden",
    "garden": "flower field/garden",
    "vườn": "flower field/garden",
    "thung lũng": "flower field/garden", # Thung lũng tình yêu...
    
    # --- LUXURY / RELAX ---
    "spa": "spa",
    "massage": "spa",
    "wellness": "spa",
    "onsen": "spa",
    
    "yacht": "yacht/cruise",
    "cruise": "yacht/cruise",
    "du thuyền": "yacht/cruise",
    "bến tàu": "yacht/cruise",
    "marina": "yacht/cruise",
    
    # --- ROMANTIC DINING & VIEW ---
    "restaurant": "restaurant",
    "nhà hàng": "restaurant",
    "fine_dining": "restaurant",
    "bistro": "restaurant",
    
    "cafe": "cafe",
    "coffee": "cafe",
    "lounge": "bar",
    "bar": "bar",
    "pub": "bar",
    "sky_bar": "bar",
    
    "viewpoint": "viewpoint",
    "scenic": "viewpoint",
    "đài quan sát": "viewpoint"
}

# ----------------------------------------------------------
# 2. NAME HINTS (VIETNAMESE ROMANTIC CONTEXT)
# ----------------------------------------------------------
NAME_HINTS = {
    # --- ACCOMMODATION ---
    "resort": "resort", "khu nghỉ dưỡng": "resort", "ana mandara": "resort", "six senses": "resort",
    "villa": "resort", "biệt thự": "resort",
    "homestay": "homestay", "đợi một người": "homestay", "nhà bên hồ": "homestay",
    "hotel": "hotel", "khách sạn": "hotel",
    
    # --- ROMANCE / NATURE ---
    "tình yêu": "flower field/garden", # Thung lũng tình yêu
    "mộng mơ": "flower field/garden", # Đồi mộng mơ
    "thung lũng": "flower field/garden", 
    "vườn": "flower field/garden", "garden": "flower field/garden",
    "bãi": "beach", "beach": "beach",
    "hòn": "island", "đảo": "island", "island": "island",
    
    # --- LUXURY / RELAX ---
    "spa": "spa", "massage": "spa", "tắm bùn": "spa", "onsen": "spa",
    "du thuyền": "yacht/cruise", "cruise": "yacht/cruise", "emperor": "yacht/cruise",
    
    # --- VIEW & CHILL ---
    "sunset": "viewpoint", "hoàng hôn": "viewpoint", # Ngắm hoàng hôn
    "rooftop": "bar", "tầng thượng": "bar", "sky bar": "bar",
    "view": "viewpoint", "tầm nhìn": "viewpoint", "cổng trời": "viewpoint",
    "mây": "viewpoint", "cloud": "viewpoint", # Săn mây cùng người yêu
    "bistro": "restaurant", "dining": "restaurant"
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
# 4. LOGIC: CLEAN CATEGORIES (HONEYMOON SPECIFIC)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # --- BƯỚC 1: NAME HINTS ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            if v not in tags: tags.append(v)
            
            # Logic phụ: Nếu là "Sky Bar" hoặc "Rooftop" -> Thêm Viewpoint
            if "rooftop" in lower_name or "sky bar" in lower_name or "sunset" in lower_name:
                if "viewpoint" not in tags: tags.append("viewpoint")

    # --- BƯỚC 2: HIERARCHY & PRIORITY ---

    # Rule A: Resort > Hotel > Homestay (Trừ khi Homestay rất chill)
    if "resort" in tags:
        if "hotel" in tags: tags.remove("hotel")
        if "homestay" in tags: tags.remove("homestay")
    
    # Rule B: Bar & Cafe (View đẹp)
    # Nếu là Rooftop Bar -> Ưu tiên Bar + Viewpoint, bỏ Cafe (trừ khi tên có Cafe)
    if "bar" in tags and "viewpoint" in tags:
        if "cafe" in tags and "cafe" not in lower_name and "coffee" not in lower_name:
            tags.remove("cafe")

    # Rule C: Flower Field/Garden (Địa điểm lãng mạn)
    # Nếu tên có "Thung lũng tình yêu", "Vườn hoa" -> Flower Field + Viewpoint
    if any(x in lower_name for x in ["thung lũng", "vườn hoa", "flower", "love", "tình yêu"]):
        if "flower field/garden" not in tags: tags.append("flower field/garden")
        if "viewpoint" not in tags: tags.append("viewpoint")

    # Rule D: Du thuyền (Luxury Dinner)
    if "yacht/cruise" in tags:
        # Giữ lại restaurant nếu là ăn tối trên tàu
        pass

    # --- BƯỚC 3: SORT & FILTER ---
    majors = [
        "resort",               # ID 26
        "hotel",                # ID 7
        "homestay",             # ID 27
        "spa",                  # ID 28
        "yacht/cruise",         # ID 24
        "beach",                # ID 22
        "island",               # ID 23
        "flower field/garden",  # ID 30 (Check-in lãng mạn)
        "restaurant",           # ID 2 (Fine dining)
        "bar",                  # ID 31 (Rooftop)
        "cafe",                 # ID 3
        "viewpoint"             # ID 25
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # --- BƯỚC 4: FALLBACK ---
    if not final_tags:
        if "coffee" in lower_name: final_tags.append("cafe")
        elif "hotel" in lower_name: final_tags.append("hotel")
        elif "resort" in lower_name: final_tags.append("resort")
        elif "spa" in lower_name: final_tags.append("spa")
        else: final_tags.append("viewpoint") # Đi trăng mật thì ngắm cảnh là safe choice

    return list(dict.fromkeys(final_tags))[:3]

# ----------------------------------------------------------
# 5. GEMINI PROMPT
# ----------------------------------------------------------
PROMPT_HONEYMOON = """
Classify these places for a Honeymoon/Romantic trip.
Allowed categories: hotel, resort, homestay, beach, island, yacht/cruise, spa, restaurant, cafe, bar, flower field/garden, viewpoint.

RULES:
- Atmosphere: Focus on Romantic, Luxury, Chill, Scenic.
- Hierarchy: "Resort" > "Hotel".
- Scenic: "Love Valley", "Flower Garden" -> "flower field/garden".
- Nightlife: "Rooftop Bar", "Sky Lounge" -> ["bar", "viewpoint"].
- Dining: "Fine Dining", "Steakhouse" -> "restaurant".
- Wellness: "Couple Spa", "Massage" -> "spa".
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

# ----------------------------------------------------------
# 6. MAIN RUNNER
# ----------------------------------------------------------
def run_honeymoon(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"💍 Bắt đầu xử lý Honeymoon cho file: {INPUT_FILE}")
    
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
            
            item["categories"] = clean_categories(name, ttypes, tags)
            
            if "tags" in item: del item["tags"]
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất Honeymoon! File output:", OUTPUT_FILE)