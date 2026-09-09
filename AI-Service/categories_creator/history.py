import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (HISTORY VERSION)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- MUSEUM ---
    "bảo tàng": "museum",
    "museum": "museum",
    "gallery": "museum",
    "triển lãm": "museum",
    "nhà trưng bày": "museum",
    
    # --- CITADEL / PALACE (Hoàng thành, Cung điện, Lăng tẩm) ---
    "hoàng thành": "citadel/palace",
    "cung điện": "citadel/palace",
    "palace": "citadel/palace",
    "citadel": "citadel/palace",
    "lăng": "citadel/palace",
    "tẩm": "citadel/palace",
    "thành cổ": "citadel/palace",
    "di tích": "citadel/palace", # Gán tạm, AI sẽ check kỹ hơn
    "fort": "citadel/palace",
    "castle": "citadel/palace",
    
    # --- CHURCH / TEMPLE / PAGODA (Tôn giáo & Tín ngưỡng) ---
    "chùa": "church/temple/pagoda",
    "pagoda": "church/temple/pagoda",
    "temple": "church/temple/pagoda",
    "đền": "church/temple/pagoda",
    "miếu": "church/temple/pagoda",
    "phủ": "church/temple/pagoda",
    "nhà thờ": "church/temple/pagoda",
    "church": "church/temple/pagoda",
    "cathedral": "church/temple/pagoda",
    "tu viện": "church/temple/pagoda",
    "monastery": "church/temple/pagoda",
    "place_of_worship": "church/temple/pagoda",
    
    # --- OLD BATTLEFIELD (Chiến trường xưa, Di tích chiến tranh) ---
    "chiến trường": "old battlefield",
    "battlefield": "old battlefield",
    "địa đạo": "old battlefield", # Tunnels
    "nhà tù": "old battlefield",  # Prison (thường là di tích lịch sử)
    "nghĩa trang liệt sĩ": "old battlefield",
    "căn cứ": "old battlefield",
    
    # --- HOTEL ---
    "khách sạn": "hotel",
    "hotel": "hotel",
    "resort": "hotel",
    "homestay": "hotel",
    "villa": "hotel",
    "nhà nghỉ": "hotel",
    
    # --- RESTAURANT ---
    "nhà hàng": "restaurant",
    "restaurant": "restaurant",
    "ẩm thực": "restaurant",
    "quán": "restaurant",
    "cafe": "restaurant",
    "coffee": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS (HISTORY VERSION)
# ----------------------------------------------------------
NAME_HINTS = {
    # Museum
    "bảo tàng": "museum",
    "trưng bày": "museum",
    "art center": "museum",
    
    # Citadel/Palace
    "đại nội": "citadel/palace",
    "kinh thành": "citadel/palace",
    "lăng": "citadel/palace", # Lăng Khải Định, Tự Đức...
    "tẩm": "citadel/palace",
    "điện": "citadel/palace", # Điện Thái Hòa...
    "phủ": "citadel/palace",  # Phủ Nội vụ (tùy ngữ cảnh, có thể là đền)
    "dinh": "citadel/palace", # Dinh Bảo Đại
    
    # Church/Temple
    "chùa": "church/temple/pagoda",
    "đền": "church/temple/pagoda",
    "miếu": "church/temple/pagoda",
    "nhà thờ": "church/temple/pagoda",
    "thánh đường": "church/temple/pagoda",
    "thiền viện": "church/temple/pagoda",
    "tổ đình": "church/temple/pagoda",
    
    # Battlefield
    "địa đạo": "old battlefield",
    "nhà tù": "old battlefield",
    "nhà lao": "old battlefield",
    "côn đảo": "old battlefield", # Context hint
    "khe sanh": "old battlefield",
    "thành cổ quảng trị": "old battlefield",

    # Services
    "hotel": "hotel",
    "resort": "hotel",
    "homestay": "hotel",
    "nhà hàng": "restaurant",
    "quán": "restaurant",
    "cafe": "restaurant"
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

# --- PROMPT HISTORY ---
PROMPT_HISTORY = """
Classify these places for a Cultural/History travel profile.
Allowed categories: museum, citadel/palace, church/temple/pagoda, old battlefield, hotel, restaurant.

RULES:
- "citadel/palace": Includes Imperial Cities (Đại Nội), Royal Tombs (Lăng), Palaces (Dinh), Ancient Citadels (Thành cổ).
- "church/temple/pagoda": Includes all religious sites (Chùa, Đền, Nhà thờ, Miếu).
- "old battlefield": War remnants, tunnels (Địa đạo), historic prisons (Nhà tù), famous battle sites.
- "museum": Places exhibiting artifacts or art.
- If a place is a "War Museum", tag BOTH ["museum", "old battlefield"].
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
    prompt = PROMPT_HISTORY.replace("{locations}", locations)
    
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

    # 1. NAME HINTS (Ưu tiên từ khóa trong tên)
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)

    # 2. LOGIC HYBRID & FIXING
    # Phân biệt Lăng tẩm (Palace) và Lăng Bác/Lăng Ông (Cultural/Memorial - tạm gộp Palace hoặc Museum)
    if "lăng" in lower_name:
        if "citadel/palace" not in tags: tags.append("citadel/palace")

    # Phân biệt Di tích chiến tranh
    war_keywords = ["chiến thắng", "địa đạo", "nhà tù", "kháng chiến", "battle", "war"]
    if any(k in lower_name or k in types_str for k in war_keywords):
        if "old battlefield" not in tags: tags.append("old battlefield")

    # 3. RESTAURANT FILTER
    # Nếu địa điểm là Di tích/Chùa/Bảo tàng, bỏ tag Restaurant trừ khi tên rõ ràng
    if "restaurant" in tags:
        is_historic_site = any(t in tags for t in ["museum", "citadel/palace", "church/temple/pagoda", "old battlefield"])
        is_explicit_food = any(k in lower_name for k in ["nhà hàng", "quán", "cafe", "coffee", "bếp"])
        
        if is_historic_site and not is_explicit_food:
            tags.remove("restaurant")

    # 4. SORT & FILTER (Thứ tự ưu tiên hiển thị)
    majors = ["citadel/palace", "old battlefield", "museum", "church/temple/pagoda", "hotel", "restaurant"]
    
    final_tags = []
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # 5. FALLBACK
    if not final_tags:
        final_tags = tags_from_types(types)
    
    if not final_tags:
        # Mặc định dựa vào tên nếu vẫn rỗng
        if any(k in lower_name for k in ["hotel", "homestay"]): final_tags = ["hotel"]
        elif any(k in lower_name for k in ["quán", "cafe"]): final_tags = ["restaurant"]
        elif any(k in lower_name for k in ["chùa", "đền", "nhà thờ"]): final_tags = ["church/temple/pagoda"]
        else:
            # Nếu là địa điểm tham quan mà không rõ, gán tạm citadel/palace (di tích)
            final_tags = ["citadel/palace"]

    return list(dict.fromkeys(final_tags))[:3]

def run_history(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    print(f"📜 Bắt đầu xử lý History cho file: {INPUT_FILE}")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        to_query_items = []
        for item in block:
            # Nếu ít tag hoặc tag chưa rõ ràng, hỏi AI
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
            
            item["categories"] = clean_categories(name, ttypes, tags)
            
            if "tags" in item:
                del item["tags"]
                
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất History! File output:", OUTPUT_FILE)