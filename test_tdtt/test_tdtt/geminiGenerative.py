import json
import re
import time
import google.generativeai as genai

# ==============================================================================
# CẢNH BÁO BẢO MẬT: API Key của bạn đang hiển thị rõ.
# Không chia sẻ file này cho bất kỳ ai.
API_KEY = "AIzaSyB1ZGPnAMCHz9QC_KguYToOxkprnZ2yMMU"
# ==============================================================================

INPUT_FILE = "ha_noi.json"
OUTPUT_FILE = "attractions_with_tags.json"

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash") # Đã cập nhật lên 1.5-flash mới hơn

BATCH_SIZE = 30

PROMPT_TEMPLATE_FOOD = """
You are a Professional Place Classification System.

Task:
Given a single place name (short, e.g., "Ha Long Bay" or "Ben Thanh Market, HCMC"), assign **2 to 5** tags that most accurately describe the place's PRIMARY and important SECONDARY characteristics, chosen ONLY from the allowed list below.

━━━━━━━━━━━━━━
✅ ALLOWED TAG LIST (USE EXACT LABELS ONLY):

snack, restaurant, cafe, night market, market, speciality, hotel

(Use the string `"yacht / cruise"` exactly if applicable.)

━━━━━━━━━━━━━━
STRICT RULES (READ CAREFULLY — THEY ARE ENFORCED):

1) **OUTPUT SIZE** — For every valid place, return **between 2 and 5 tags**.  
   - The first tag must represent the place's **primary function or natural category** (e.g., "beach", "museum", "market").  
   - The remaining 1–4 tags should represent **secondary but factual** attributes (e.g., "viewpoint", "family", "street-food").
   - Each place must have at least one tag

2) **NO GUESSING** — Only tag attributes that are:
   - Widely known facts about the place, or
   - Directly implied by the place type or common, reliable sources.

3) **NO ASSUMPTIONS / NO INFERENCE FROM NAME ONLY** — Do NOT infer commercial or demographic attributes from a name unless they are strongly associated (e.g., "Ben Thanh Market" → "market", "street-food"). Do NOT assign "restaurant" for a market unless the entity is primarily a restaurant.

4) **NO EXTRA TAGS** — Use ONLY tags from the allowed list. Do not invent new labels or synonyms.

5) **SPECIAL TAG RULES**:
    - "snack" → only for small eateries or stalls specializing in light meals, street snacks, or quick bites (e.g., bánh mì stands, dumpling carts, bubble tea shops). Not for full-service restaurants or cafés.
    - "speciality" → used exclusively for places known for regional signature dishes or must-try local foods. The item must be a well-known specialty of that city or province, and the place must be recognized for serving it. Also, that dishes is hardly to find in other provinces (e.g., "Bún bò Huế" in Huế, "Cao lầu" in Hội An).
    - "cafe" → applies to coffee shops, tea houses, or beverage-focused venues where the main experience is drinking and relaxing rather than eating full meals. Do not use for restaurants that merely serve coffee.
    - "restaurant" → only for venues primarily offering full meals (lunch, dinner) with table service or substantial dining menus. Excludes casual snack stalls or cafés.
    - "market" → for daytime or general public markets where shopping for goods or produce is the main activity. Includes traditional wet markets, local bazaars, and shopping streets open during the day.
    - "night market" → only for markets operating mainly at night and into late hours, where the evening or night atmosphere is a key attraction.
    - "hotel" → only for hotel. Also, the places with tag hotel cannot have any other tags

6) **NO EXPLANATION** — Output must be exactly and only the JSON (see format). No extra text, no commentary.

━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT):

{{
  "results": [
    {{ "place": "<place1>", "tags": ["t1","t2"] }},
    {{ "place": "<place2>", "tags": [] }}
  ]
}}

━━━━━━━━━━━━━━
Classify these places:

{locations}
"""

PROMPT_TEMPLATE_AMUSEMENT = """
You are a Professional Place Classification System.

Task:
Given a single place name (short, e.g., "Ha Long Bay" or "Ben Thanh Market, HCMC"), assign **2 to 5** tags that most accurately describe the place's PRIMARY and important SECONDARY characteristics, chosen ONLY from the allowed list below.

━━━━━━━━━━━━━━
✅ ALLOWED TAG LIST (USE EXACT LABELS ONLY):

amusement/water park, zoo, aquarium, nightlife, festival, cultural performance

━━━━━━━━━━━━━━
STRICT RULES (READ CAREFULLY — THEY ARE ENFORCED):

1) **OUTPUT SIZE** — For every valid place, return **between 2 and 5 tags**.  
   - The first tag must represent the place's **primary function or natural category** (e.g., "beach", "museum", "market").  
   - The remaining 1–4 tags should represent **secondary but factual** attributes (e.g., "viewpoint", "family", "street-food").
   - Each place must have at least one tag

2) **NO GUESSING** — Only tag attributes that are:
   - Widely known facts about the place, or
   - Directly implied by the place type or common, reliable sources.

3) **NO ASSUMPTIONS / NO INFERENCE FROM NAME ONLY** — Do NOT infer commercial or demographic attributes from a name unless they are strongly associated (e.g., "Ben Thanh Market" → "market", "street-food"). Do NOT assign "restaurant" for a market unless the entity is primarily a restaurant.

4) **NO EXTRA TAGS** — Use ONLY tags from the allowed list. Do not invent new labels or synonyms.

5) **SPECIAL TAG RULES**:
    - "amusement park" → for amusement parks, theme parks, and entertainment complexes featuring mechanical rides, thrill attractions, and themed entertainment zones. Includes outdoor or indoor amusement centers, family entertainment centers (FECs), and theme-based recreational parks. Focus is on rides, games, and large-scale attractions designed for fun and excitement. Excludes simple playgrounds, botanical gardens, or resorts without amusement features.
    - "water park" → for parks and complexes primarily offering water-based attractions such as slides, wave pools, lazy rivers, and aquatic playgrounds. Includes indoor and outdoor water parks, aqua complexes, and large resort water zones where water recreation is the main activity. Excludes regular swimming pools, beaches, or resorts without specialized water attractions.
    - "zoo" → only for zoological parks, wildlife sanctuaries, or animal exhibits where viewing, studying, and conserving animals are the primary purposes. Includes safari parks, animal conservation centers, and wildlife breeding areas open to the public.
    - "aquarium" → for aquariums, oceanariums, or marine life exhibits dedicated to displaying aquatic animals and marine ecosystems. Includes underwater tunnels, marine museums, and large-scale marine observation centers.
    - "nightlife" → for venues primarily active during evening or night hours, including bars, pubs, clubs, lounges, and entertainment venues focusing on night-time social activities, live music, or dance.
    - "festival" → for places or venues primarily known for hosting festivals, cultural celebrations, or periodic major events. Use only if the site is recognized as a regular festival location or is central to cultural festivities.
    - "cultural performance" → for theaters, performance halls, cultural centers, or venues dedicated to traditional and contemporary performing arts. Includes opera houses, concert halls, puppet theaters, folk performance centers, and cultural exhibition stages.

6) **NO EXPLANATION** — Output must be exactly and only the JSON (see format). No extra text, no commentary.

━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT):

{{
  "results": [
    {{ "place": "<place1>", "tags": ["t1","t2"] }},
    {{ "place": "<place2>", "tags": [] }}
  ]
}}

━━━━━━━━━━━━━━
Classify these places:

{locations}
"""

def extract_json(text):
    """Trích xuất khối JSON từ phản hồi văn bản của AI."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                print("Lỗi: Tìm thấy JSON nhưng không thể parse.")
                return None
    return None

def detect_template_type(filename):
    """
    CHỈ SỬA PHẦN NÀY:
    Chọn template theo con số người dùng nhập (1 = food, 2 = amusement)
    """
    while True:
        try:
            choice = int(input("Chọn loại template (1 = food, 2 = amusement): "))
            if choice == 1:
                return "food"
            elif choice == 2:
                return "amusement"
            else:
                print("Vui lòng nhập 1 hoặc 2.")
        except ValueError:
            print("Vui lòng nhập số hợp lệ (1 hoặc 2).")

def classify_batch(batch_titles, template_type="food"):
    if template_type == "amusement":
        template = PROMPT_TEMPLATE_AMUSEMENT
    else:
        template = PROMPT_TEMPLATE_FOOD
    
    prompt_locations = "\n".join(f"- {title}" for title in batch_titles)
    prompt = template.format(locations=prompt_locations)
    
    for _ in range(3):
        try:
            resp = MODEL.generate_content(prompt)
            data = extract_json(resp.text)
            if data and "results" in data:
                return data["results"]
            else:
                print("Lỗi: Phản hồi API không hợp lệ hoặc thiếu 'results'. Đang thử lại...")
                time.sleep(1)
        except Exception as e:
            print(f"Lỗi API: {e}. Đang thử lại sau 2 giây...")
            time.sleep(2)
            
    print("Lỗi: Thất bại sau 3 lần thử. Gán tag rỗng cho lô này.")
    return [{"place": title, "tags": []} for title in batch_titles]

def main():
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            locations = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{INPUT_FILE}'.")
        return
    except json.JSONDecodeError:
        print(f"Lỗi: File '{INPUT_FILE}' không phải là JSON hợp lệ.")
        return

    template_type = detect_template_type(INPUT_FILE)
    print(f"📋 Detected template type: {template_type} (user selected)")

    all_locations_with_tags = []
    total = len(locations)
    print(f"Processing {total} locations in batches of {BATCH_SIZE}…")

    for i in range(0, total, BATCH_SIZE):
        batch_objects = locations[i:i+BATCH_SIZE]
        batch_titles = [loc.get("title", "") for loc in batch_objects]
        classified_tags = classify_batch(batch_titles, template_type)
        tag_map = {res.get("place"): res.get("tags", []) for res in classified_tags}
        for obj in batch_objects:
            title = obj.get("title", "")
            tags = tag_map.get(title, [])
            obj["tags"] = tags
        all_locations_with_tags.extend(batch_objects)
        print(f"[{len(all_locations_with_tags)}/{total}] ✅ Done batch")
        time.sleep(1)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_locations_with_tags, f, ensure_ascii=False, indent=2)

    print(f"\n✅ All done! Dữ liệu đầy đủ (kèm tags) đã được lưu vào: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
