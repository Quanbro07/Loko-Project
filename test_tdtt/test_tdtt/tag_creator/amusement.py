import json
import re
import time

# ----------------------------------------------------------
# 1. TYPE MAPPING (GIỮ NGUYÊN CÁC ĐỊNH NGHĨA RỘNG)
# ----------------------------------------------------------
TYPE_TO_TAG = {
    # --- AMUSEMENT ---
    "công viên giải trí": "amusement/water park",
    "công viên nước": "amusement/water park",
    "trung tâm vui chơi": "amusement/water park",
    "khu vui chơi": "amusement/water park",
    "công viên chủ đề": "amusement/water park",
    
    # --- ZOO / AQUARIUM ---
    "sở thú": "zoo",
    "vườn thú": "zoo",
    "thủy cung": "aquarium",
    "aquarium": "aquarium",
    
    # --- CULTURAL (ĐỊNH NGHĨA RỘNG: CẢ SHOW & THẮNG CẢNH) ---
    "nhà hát": "cultural performance",
    "trung tâm văn hóa": "cultural performance",
    "lễ hội": "festival",
    "bảo tàng": "cultural performance", 
    "di tích": "cultural performance",
    "cáp treo": "cultural performance",
    "nhà thờ": "cultural performance",
    "chùa": "cultural performance",
    "đền": "cultural performance",
    "thắng cảnh": "cultural performance",
    "quảng trường": "cultural performance",
    "thu hút khách du lịch": "cultural performance",
    
    # --- NIGHTLIFE ---
    "bar": "nightlife",
    "pub": "nightlife",
    "club": "nightlife",
    "lounge": "nightlife",
    "karaoke": "nightlife",
    
    # --- HOTEL / RESTAURANT ---
    "khách sạn": "hotel",
    "hotel": "hotel",
    "resort": "hotel",
    "homestay": "hotel",
    "villa": "hotel",
    "nhà hàng": "restaurant",
    "restaurant": "restaurant",
    "ẩm thực": "restaurant",
    "buffet": "restaurant",
    "quán ăn": "restaurant"
}

# ----------------------------------------------------------
# 2. NAME HINTS & BRAND LOGIC
# ----------------------------------------------------------
NAME_HINTS = {
    "festival": "festival",
    "lễ hội": "festival",
    "nhà hát": "cultural performance",
    "theater": "cultural performance",
    "show": "cultural performance",
    "cáp treo": "cultural performance",
    "nhà thờ": "cultural performance",
    "chùa": "cultural performance",
    "hòn chồng": "cultural performance",
    "tháp": "cultural performance",
    "bảo tàng": "cultural performance",
    "pub": "nightlife",
    "bar": "nightlife",
    "club": "nightlife"
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

PROMPT_AMUSEMENT = """
Classify these places.
Allowed tags: amusement/water park, zoo, aquarium, nightlife, festival, cultural performance, hotel, restaurant.

RULES:
- Flexible tagging: A place can be BOTH a park AND a cultural spot.
- VinWonders/Sun World -> ["amusement/water park", "cultural performance"].
- Landmarks/Churches -> ["cultural performance"].
- JSON only.

Format:
{
  "results": [
    { "place": "<name>", "tags": ["tag1", "tag2"] }
  ]
}

Classify:
{locations}
"""

def classify_with_model(model, items):
    lines = [f"- {x['location_name']} (Types: {', '.join(x['types'][:2])})" for x in items]
    locations = "\n".join(lines)
    prompt = PROMPT_AMUSEMENT.replace("{locations}", locations)
    
    for _ in range(3):
        try:
            resp = model.generate_content(prompt)
            data = extract_json(resp.text)
            if data and "results" in data:
                return data["results"]
        except:
            time.sleep(1)
    return [{"place": item["location_name"], "tags": []} for item in items]

def clean_tags(name, types, tags):
    # 1. Deduplicate ban đầu
    tags = list(set(tags))
    lower_name = name.lower()
    types_str = " ".join(types).lower()

    # 2. LOGIC ĐẶC BIỆT (HYBRID LOGIC) - QUAN TRỌNG
    # Nếu là VinWonders, Sun World, hoặc các khu tổ hợp lớn -> ÉP CÓ CẢ 2 TAG
    if any(x in lower_name for x in ["vinwonders", "sun world", "vinpearl land", "universal", "disney"]):
        if "amusement/water park" not in tags:
            tags.append("amusement/water park")
        if "cultural performance" not in tags:
            tags.append("cultural performance")
            
    # Nếu là cáp treo -> ÉP CÓ CẢ 2
    if "cáp treo" in lower_name or "cable car" in lower_name:
        if "amusement/water park" not in tags: tags.append("amusement/water park")
        if "cultural performance" not in tags: tags.append("cultural performance")

    # 3. Name Hints (Bổ sung thêm nếu thiếu)
    for k, v in NAME_HINTS.items():
        if k in lower_name and v not in tags:
            tags.append(v)

    # 4. Restaurant Logic (Lọc nhiễu)
    if "restaurant" in tags:
        restaurant_keywords = ["restaurant", "nhà hàng", "quán", "ẩm thực", "dining", "buffet", "kitchen", "bistro", "lounge"]
        is_in_name = any(x in lower_name for x in restaurant_keywords)
        is_in_types = any(x in types_str for x in restaurant_keywords)
        # VinWonders có nhà hàng bên trong, nhưng nó không phải là tag chính để hiển thị, trừ khi nó là nhà hàng riêng biệt
        # Tuy nhiên nếu bạn muốn giữ sự linh hoạt, ta nới lỏng điều kiện này
        if not is_in_name and not is_in_types: 
            tags.remove("restaurant")

    # 5. SẮP XẾP & GIỮ LẠI (KHÔNG XÓA LẪN NHAU)
    majors = ["amusement/water park", "cultural performance", "zoo", "aquarium", "nightlife", "festival", "hotel", "restaurant"]
    
    final_tags = []
    # Vòng lặp này chỉ dùng để sắp xếp thứ tự ưu tiên hiển thị, KHÔNG dùng để lọc bỏ
    for major in majors:
        if major in tags:
            final_tags.append(major)

    # Fallback nếu rỗng
    if not final_tags:
        final_tags = tags_from_types(types)
    if not final_tags:
        # Logic fallback thông minh hơn
        if "park" in lower_name or "công viên" in lower_name:
            final_tags = ["amusement/water park"]
        else:
            final_tags = ["cultural performance"]

    return list(dict.fromkeys(final_tags))[:3]

def run_amusement(model, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE):
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        locations = json.load(f)

    all_results = []
    total = len(locations)

    for i in range(0, total, BATCH_SIZE):
        block = locations[i:i+BATCH_SIZE]
        
        pre_tags_map = {item["location_name"]: tags_from_types(item["types"]) for item in block}

        to_query_items = []
        for item in block:
            # Vẫn giữ logic gọi AI cũ
            if len(pre_tags_map[item["location_name"]]) < 2:
                to_query_items.append(item)

        api_result = {}
        if to_query_items:
            results = classify_with_model(model, to_query_items)
            for r in results:
                api_result[r["place"]] = r["tags"]

        for item in block:
            name = item["location_name"]
            ttypes = item["types"]
            
            tags = pre_tags_map[name].copy()
            if name in api_result:
                tags.extend(api_result[name])
            
            item["tags"] = clean_tags(name, ttypes, tags)
            all_results.append(item)

        print(f"✔ Done {min(i+BATCH_SIZE, total)}/{total}")
        time.sleep(0.5)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print("\n🎉 Hoàn tất! File output:", OUTPUT_FILE)