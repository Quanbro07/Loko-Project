import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (VACATION: EXPANDED)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- ACCOMMODATION (RESORT vs HOTEL) ---
    "resort": "resort",
    "khu nghỉ dưỡng": "resort",
    "villa": "resort", # Villa du lịch thường xếp vào nhóm nghỉ dưỡng
    "bungalow": "resort",
    "retreat": "resort",
    
    "homestay": "homestay",
    "guest_house": "homestay",
    "hostel": "homestay",
    "farmstay": "homestay",
    "nhà nghỉ": "homestay", # Ở mức du lịch bụi
    
    "hotel": "hotel",
    "khách sạn": "hotel",
    "lodging": "hotel",
    
    # --- NATURE / WATER ---
    "beach": "beach",
    "bãi tắm": "beach",
    "coast": "beach",
    "seaside": "beach",
    
    "island": "island",
    "archipelago": "island",
    "cù lao": "island",
    
    # --- WELLNESS & SPA ---
    "spa": "spa",
    "massage": "spa",
    "sauna": "spa",
    "beauty_salon": "spa", # Gội đầu dưỡng sinh thường ở đây
    "health": "spa",
    "onsen": "spa",
    "hot_spring": "spa", # Suối khoáng nóng
    
    # --- OUTDOOR / ACTIVITY ---
    "campground": "camping",
    "camping": "camping",
    "rv_park": "camping",
    
    "marina": "yatch/cruise", # Bến du thuyền
    "boat": "yatch/cruise",
    "pier": "yatch/cruise",

    # --- F&B (RELAX MODE) ---
    "bar": "bar",
    "pub": "bar",
    "lounge": "bar", # Lounge khách sạn/resort
    "cafe": "cafe",
    "restaurant": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS (DETAILED FOR VIETNAM VACATION)
# ----------------------------------------------------------
NAME_HINTS = {
    # --- ACCOMMODATION ---
    "resort": "resort", "khu nghỉ dưỡng": "resort", "làng bình an": "resort",
    "villa": "resort", "biệt thự": "resort",
    "homestay": "homestay", "nhà bên rừng": "homestay", "stay": "homestay",
    "hotel": "hotel", "khách sạn": "hotel", "suites": "hotel",
    
    # --- WELLNESS ---
    "spa": "spa", "massage": "spa", "trị liệu": "spa",
    "gội đầu": "spa", "dưỡng sinh": "spa", "nail": "spa",
    "tắm bùn": "spa", "mud bath": "spa", "khoáng nóng": "spa",
    "onsen": "spa", "xông hơi": "spa", "herbal": "spa",
    
    # --- CRUISE / YACHT ---
    "du thuyền": "yatch/cruise", "cruise": "yatch/cruise",
    "bến tàu": "yatch/cruise", "cano": "yatch/cruise", "yacht": "yatch/cruise",
    
    # --- BEACH / ISLAND ---
    "bãi": "beach", "beach": "beach", "biển": "beach",
    "hòn": "island", "đảo": "island", "island": "island",
    
    # --- CAMPING ---
    "glamping": "camping", "camp": "camping", "lều": "camping",
    "cắm trại": "camping", "trại": "camping",
    
    # --- CHILL SPOTS ---
    "beach club": "bar", "skylight": "bar", "rooftop": "bar",
    "lounge": "bar", "pub": "bar"
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
# 4. LOGIC: CLEAN CATEGORIES (VACATION SPECIFIC)
# ----------------------------------------------------------
def clean_categories(name, types, tags):
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # --- BƯỚC 1: NAME HINTS ---
    for k, v in NAME_HINTS.items():
        if k in lower_name:
            if v not in tags: tags.append(v)

    # --- BƯỚC 2: LOGIC XỬ LÝ "LAI" (HYBRID RULES) ---
    
    # Rule A: Beach Club -> Bar + Beach
    if "beach club" in lower_name or ("bar" in tags and "beach" in lower_name):
        if "bar" not in tags: tags.append("bar")
        if "beach" not in tags: tags.append("beach")
        if "restaurant" in tags: tags.remove("restaurant") # Beach club là bar, ko phải quán ăn thường

    # Rule B: Du thuyền (Cruise) -> Có thể có Restaurant/Bar
    if "yatch/cruise" in tags or "du thuyền" in lower_name:
        if "yatch/cruise" not in tags: tags.append("yatch/cruise")
        # Du thuyền thường có ăn uống, giữ lại restaurant/bar nếu có

    # Rule C: Tắm bùn/Onsen -> Spa + Resort (nếu là khu du lịch)
    if any(x in lower_name for x in ["tắm bùn", "onsen", "khoáng nóng", "hot spring"]):
        if "spa" not in tags: tags.append("spa")
        # Nếu là khu du lịch tắm bùn lớn (không phải spa nhỏ), thường coi là điểm vui chơi nghỉ dưỡng
        # Nhưng ở đây ta focus vào 'spa' cho wellness.

    # --- BƯỚC 3: HIERARCHY (PHÂN CẤP) ---

    # Rule D: Resort > Villa > Hotel > Homestay
    if "resort" in tags:
        if "hotel" in tags: tags.remove("hotel")
        if "homestay" in tags: tags.remove("homestay")
    elif "hotel" in tags and "homestay" in tags:
        # Nếu vừa hotel vừa homestay, check tên
        if "homestay" in lower_name:
            tags.remove("hotel")
        else:
            tags.remove("homestay")

    # Rule E: Camping/Glamping
    if "camping" in tags or "glamping" in lower_name:
        if "camping" not in tags: tags.append("camping")
        if "hotel" in tags: tags.remove("hotel") # Lều không phải khách sạn
        if "resort" in tags: tags.remove("resort") # Trừ khi tên là "Glamping Resort"

    # Rule F: Cafe & Restaurant trong Vacation
    # Nếu là Resort, thường có Cafe/Restaurant bên trong, nhưng ta chỉ tag Resort để tránh loãng.
    # Trừ khi đó là quán Cafe/Bar RỜI (không dính tên Resort)
    if "resort" in tags or "hotel" in tags:
        # Nếu tên địa điểm trùng tên khách sạn (VD: "Vinpearl Resort"), bỏ tag restaurant/cafe
        # Nếu tên địa điểm là "Nhà hàng ABC - Vinpearl" thì giữ.
        if "restaurant" in tags and not any(x in lower_name for x in ["nhà hàng", "restaurant", "dining", "bar", "cafe"]):
             tags.remove("restaurant")

    # --- BƯỚC 4: SORT & FILTER (ALLOWED LIST) ---
    majors = [
        "resort",       # ID 26
        "villa",        # Map về Resort hoặc Hotel tuỳ logic, ở đây giữ Resort
        "homestay",     # ID 27
        "hotel",        # ID 7
        "beach",        # ID 22
        "island",       # ID 23
        "yatch/cruise", # ID 24 (Lưu ý chính tả trong mapping gốc là yatch)
        "spa",          # ID 28
        "camping",      # ID 16
        "bar",          # ID 31
        "cafe",         # ID 3
        "restaurant"    # ID 2
    ]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # --- BƯỚC 5: FALLBACK ---
    if not final_tags:
        if "coffee" in lower_name: final_tags.append("cafe")
        elif "villa" in lower_name: final_tags.append("resort")
        elif "hotel" in lower_name: final_tags.append("hotel")
        elif "beach" in lower_name: final_tags.append("beach")
        else: final_tags.append("restaurant") # Default an toàn

    return list(dict.fromkeys(final_tags))[:3]

# ----------------------------------------------------------
# 5. GEMINI PROMPT
# ----------------------------------------------------------
PROMPT_VACATION = """
Classify these places for a Vacation/Relaxation trip.
Allowed categories: hotel, resort, homestay, beach, island, spa, camping, yatch/cruise, bar, cafe, restaurant.

RULES:
- Hierarchy: A "Resort" is NOT a "Hotel". A "Glamping" site is "camping".
- Wellness: "Massage", "Mud Bath" (Tắm bùn), "Onsen", "Hair Wash" (Gội đầu) -> "spa".
- Cruises: "Du thuyền", "Boat Tour", "Pier" -> "yatch/cruise".
- Beach Life: "Beach Club" -> ["bar", "beach"].
- Island: "Hòn Tằm", "Cù Lao" -> "island".
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
    prompt = PROMPT_VACATION.replace("{locations}", locations)
    
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
def run_vacation(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"🏖️ Bắt đầu xử lý Vacation cho file: {INPUT_FILE}")
    
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

    print("\n🎉 Hoàn tất Vacation! File output:", OUTPUT_FILE)