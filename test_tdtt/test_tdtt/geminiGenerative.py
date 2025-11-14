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

BATCH_SIZE = 15

PROMPT_TEMPLATE_FOOD = """
You are a Professional Place Classification System.

Task:
Given a location object containing a 'place' (name), 'types' (Google Maps categories), and 'description', assign tags based on the STRICT rules below.

━━━━━━━━━━━━━━
🚫 NEGATIVE CONSTRAINTS (THESE RULES OVERRIDE EVERYTHING)

1. **THE "CONTAINMENT" BAN (QUAN TRỌNG NHẤT):**
   - You are **FORBIDDEN** from using `restaurant` or `snack` just because a place *contains* them.
   - **Logic 1 (Hotel):** A `hotel` *contains* restaurants, but it IS NOT a `restaurant`. Do NOT tag "Khách sạn ABC" as `restaurant`.
   - **Logic 2 (Market):** A `market` (chợ) *contains* food stalls, but it IS NOT a `restaurant`. Tag it as `market` (and maybe `snack` if description supports), but NEVER `restaurant`.
   - **Logic 3 (Night Market):** A `night market` (chợ đêm) *contains* many food stalls. Its primary tag is `night market`. It can ALSO be tagged `snack`, but it is NOT a `restaurant`.

2. **THE "SPECIALITY" BAN:**
   - You are **FORBIDDEN** from using `speciality` unless the `description` or `title` EXPLICITLY mentions a famous, unique local dish (e.g., "Mì Quảng", "Cao Lầu", "Bún Bò Huế").
   - A generic "Nhà hàng Việt Nam" is NOT a `speciality`.

━━━━━━━━━━━━━━
🧠 CLASSIFICATION LOGIC (PRIORITY ORDER)

* **Priority 1: `types` is KING.**
    - If `types` has "Nhà hàng" -> Tag: `restaurant`.
    - If `types` has "Quán cà phê" or "Tiệm cà phê" -> Tag: `cafe`.
    - If `types` has "Chợ" -> Tag: "market".
    - If `types` has "Chợ đêm" -> Tag: "night market".
    - If `types` has "Khách sạn" -> Tag: "hotel".
    - **Conflict Resolution:** If `place` is "Quán Cơm ABC" but `types` is "Cửa hàng tạp hóa", TRUST `types`.

* **Priority 2: `description` Support.**
    - Use `description` to find supporting tags.
    - `description`: "...món ăn đường phố..." -> `snack`.
    - `description`: "...nổi tiếng với món Bánh xèo..." -> `speciality`.

* **Priority 3: Single Tag Preference. (QUAN TRỌNG)**
    - It is **BETTER** to return just **1 correct tag** (e.g., `["cafe"]`) than to force a second wrong tag.
    - Do NOT invent tags just to meet a quota. The `2-5 tag` rule (from old prompt) is WRONG and causes errors.

━━━━━━━━━━━━━━
✅ ALLOWED TAG LIST (USE EXACT LABELS ONLY):

snack, restaurant, cafe, night market, market, speciality, hotel, "yacht / cruise"

━━━━━━━━━━━━━━
**STRICT EXAMPLES: (ĐÃ SỬA LỖI KEYERROR)**

1. Input: {{place: "Chợ Cồn", types: ["Chợ", "Điểm thu hút khách du lịch"], description: "Khu ẩm thực sầm uất..."}}
   -> Output Tags: ["market", "snack"] (Correct: Chợ + có đồ ăn vặt. KHÔNG PHẢI `restaurant`).

2. Input: {{place: "Khách sạn Novotel", types: ["Khách sạn"], description: "Sky bar, buffet..."}}
   -> Output Tags: ["hotel"] (Correct: KHÔNG PHẢI `restaurant`).

3. Input: {{place: "Highlands Coffee", types: ["Quán cà phê"], description: "Đồ uống, bánh ngọt"}}
   -> Output Tags: ["cafe"] (Correct: Chỉ 1 tag. KHÔNG PHẢI `snack`).

4. Input: {{place: "Nhà hàng Madame Lân", types: ["Nhà hàng"], description: "Đặc sản Đà Nẵng, Mì Quảng..."}}
   -> Output Tags: ["restaurant", "speciality"] (Correct: Có 'Nhà hàng' và 'Đặc sản' được chứng minh).

5. Input: {{place: "Quán Bánh mì Bà Lan", types: ["Tiệm bánh mì"], description: "Bánh mì que, bánh mì thịt"}}
   -> Output Tags: ["snack"] (Correct: Bánh mì là `snack`).

━━━━━━━━━━━━━━
STRICT RULES (READ CAREFULLY — THEY ARE ENFORCED):
(Tôi đã sao chép các định nghĩa `SPECIAL TAG RULES` của bạn vào đây)

1) **NO GUESSING** — Only tag attributes that are:
  - Widely known facts about the place, or
  - Directly implied by the `types` or `description`.

2) **NO ASSUMPTIONS / NO INFERENCE FROM NAME ONLY** — Do NOT infer commercial or demographic attributes from a name unless they are strongly associated. Trust `types` first.

3) **NO EXTRA TAGS** — Use ONLY tags from the allowed list. Do not invent new labels or synonyms.

4) **SPECIAL TAG RULES**:
  	- "snack" → only for small eateries or stalls specializing in light meals, street snacks, or quick bites (e.g., bánh mì stands, dumpling carts, bubble tea shops). Not for full-service restaurants or cafés.
  	- "speciality" → used exclusively for places known for regional signature dishes or must-try local foods. The item must be a well-known specialty of that city or province, and the place must be recognized for serving it. Also, that dishes is hardly to find in other provinces (e.g., "Bún bò Huế" in Huế, "Cao lầu" in Hội An).
  	- "cafe" → applies to coffee shops, tea houses, or beverage-focused venues where the main experience is drinking and relaxing rather than eating full meals. Do not use for restaurants that merely serve coffee.
  	- "restaurant" → only for venues primarily offering full meals (lunch, dinner) with table service or substantial dining menus. Excludes casual snack stalls or cafés.
  	- "market" → for daytime or general public markets where shopping for goods or produce is the main activity. Includes traditional wet markets, local bazaars, and shopping streets open during the day.
  	- "night market" → only for markets operating mainly at night and into late hours, where the evening or night atmosphere is a key attraction.
  	- "hotel" → only for hotel. Also, the places with tag hotel cannot have any other tags

5) **NO EXPLANATION** — Output must be exactly and only the JSON (see format). No extra text, no commentary.

━━━━━━━━━━━━━━
📥 INPUT FORMAT (How you will receive data)

- place: "<Place 1 Title>"
  types: ["Type 1", "Type 2"]
  description: "<Description text>"

- place: "<Place 2 Title>"
  types: ["Type A"]
  description: "<Description text>"

━━━━━━━━━━━━━━
📤 OUTPUT FORMAT (STRICT):

{{
. "results": [
.   {{ "place": "<Place 1 Title>", "tags": ["t1","t2"] }},
.   {{ "place": "<Place 2 Title>", "tags": [] }}
. ]
}}

━━━━━━━━━━━━━━
Classify these places:

{locations}
"""

PROMPT_TEMPLATE_AMUSEMENT = """
You are a Professional Place Classification System.

Task:
Given a location object containing a 'place' (name), 'types' (Google Maps categories), and 'description', assign **2 to 5** tags that most accurately describe the place's PRIMARY and important SECONDARY characteristics, chosen ONLY from the allowed list below.

━━━━━━━━━━━━━━
🧠 INPUT CONTEXT (RULES FOR CLASSIFICATION)

* **Rule 1: `types` is KING.** The `types` list is your primary, most trusted source. If `types` contains "Công viên giải trí" (Amusement Park) or "Công viên nước" (Water Park), you MUST assign the corresponding tag.

* **Rule 2: Trust `types` OVER `title`. (CRITICAL!)**
  You will see conflicting data. For example:
  - `title`: "Quầy lễ tân Ga thác Tóc Tiên" (Reception Desk...)
  - `types`: ["Công viên giải trí"] (Amusement Park)
  In this case, the `title` is misleading. The `types` ("Công viên giải trí") is the TRUTH. This place MUST be tagged "amusement park".
  - `title`: "Ticket Ba Na Hills"
  - `types`: ["Công viên giải trí"]
  Again, `types` wins. This is an "amusement park". Do NOT return `[]` just because the title has "Ticket" or "Quầy lễ tân".

* **Rule 3: `description` is #2.** If `types` is generic (e.g., "Điểm thu hút khách du lịch" - Tourist Attraction), use the `description` to find evidence.
  - `description`: "...có tàu lượn..." (has roller coaster) → This implies "amusement park".
  - `description`: "...hồ tạo sóng, đường trượt..." (wave pool, slides) → This implies "water park".

* **Rule 4 (NEW & CRITICAL): Primary Purpose vs. Amenity (NHÀ HÀNG).**
  - This is the most important rule. A place's tag must describe its **primary purpose**, not just an amenity it *contains*.
  - **"restaurant" RULE:** Do NOT tag a location as "restaurant" just because it has restaurants inside.
  - **Example 1:** "Sun World Bà Nà Hills" is an "amusement park". It *contains* restaurants, but it is NOT a "restaurant". The "restaurant" tag is WRONG for this place.
  - **Example 2:** "Hot Springs Park" is a "water park". It is NOT a "restaurant".
  - **Conclusion:** Only use the "restaurant" tag if the `title` AND `types` clearly indicate the place *itself* is primarily a restaurant (e.g., `title: "Nhà hàng ABC"`, `types: ["Nhà hàng"]`). Không có địa điểm nào trong danh sách của bạn đáp ứng tiêu chí này.

* **Rule 5 (was 4): When to use `[]` (Empty Tags).**
  Return `[]` ONLY IF the `types`, `description`, AND `title` all confirm it is not an attraction (e.g., a real ticket booth *without* "Amusement Park" in its `types`).

* **Rule 6 (was 5): Vietnamese Mapping (Examples):**
  - "Công viên giải trí" → `amusement park`
  - "Công viên nước" → `water park`
  - "Nhà hàng" → `restaurant`
  - "trò chơi cảm giác mạnh", "tàu lượn" → `amusement park`
  - "hồ bơi", "đường trượt nước", "hồ tạo sóng" → `water park`

━━━━━━━━━━━━━━
✅ ALLOWED TAG LIST (USE EXACT LABELS ONLY):

amusement park, water park, zoo, aquarium, nightlife, festival, cultural performance, hotel, restaurant

━━━━━━━━━━━━━━
STRICT RULES (READ CAREFYLLY — THEY ARE ENFORCED):

1) **OUTPUT SIZE** — For every valid place, return **between 2 and 5 tags**. 
   - Each place must have at least one tag (unless it's irrelevant, see Context Rules).

2) **NO GUESSING** — Only tag attributes that are directly implied by `types` or `description`.

3) **NO ASSUMPTIONS / NO INFERENCE FROM NAME ONLY** — The `place` name is the *least* reliable source. Trust `types` and `description` instead.

4. **NO EXTRA TAGS** — Use ONLY tags from the allowed list.

5) **SPECIAL TAG RULES**:
   - "amusement park" → for amusement parks, theme parks, and entertainment complexes featuring mechanical rides, thrill attractions, and themed entertainment zones. Includes outdoor or indoor amusement centers, family entertainment centers (FECs), and theme-based recreational parks. Focus is on rides, games, and large-scale attractions designed for fun and excitement. Excludes simple playgrounds, botanical gardens, or resorts without amusement features.
   - "water park" → for parks and complexes primarily offering water-based attractions such as slides, wave pools, lazy rivers, and aquatic playgrounds. Includes indoor and outdoor water parks, aqua complexes, and large resort water zones where water recreation is the main activity. Excludes regular swimming pools, beaches, or resorts without specialized water attractions.
   - "zoo" → only for zoological parks, wildlife sanctuaries, or animal exhibits where viewing, studying, and conserving animals are the primary purposes. Includes safari parks, animal conservation centers, and wildlife breeding areas open to the public.
   - "aquarium" → for aquariums, oceanariums, or marine life exhibits dedicated to displaying aquatic animals and marine ecosystems. Includes underwater tunnels, marine museums, and large-scale marine observation centers.
   - "nightlife" → for venues primarily active during evening or night hours, including bars, pubs, clubs, lounges, and entertainment venues focusing on night-time social activities, live music, or dance.
   - "festival" → for places or venues primarily known for hosting festivals, cultural celebrations, or periodic major events. Use only if the site is recognized as a regular festival location or is central to cultural festivities.
   - "cultural performance" → for theaters, performance halls, cultural centers, or venues dedicated to traditional and contemporary performing arts. Includes opera houses, concert halls, puppet theaters, folk performance centers, and cultural exhibition stages.
   - "hotel" → only for hotel. Also, the places with tag hotel cannot have any other tags
   - "restaurant" → only for venues primarily offering full meals (lunch, dinner) with table service or substantial dining menus. Excludes casual snack stalls or cafés.

6) **NO EXPLANATION** — Output must be exactly and only the JSON (see format).

7) **Exact Name:** In the output JSON, the `place` field must be *identical* to the `place` name you received. Do not change or translate it.

━━━━━━━━━━━━━━
📥 INPUT FORMAT (How you will receive data)

- place: "<Place 1 Title>"
  types: ["Type 1", "Type 2"]
  description: "<Description text>"

- place: "<Place 2 Title>"
  types: ["Type A"]
  description: "<Description text>"

━━━━━━━━━━━━━━
📤 OUTPUT FORMAT (STRICT):

{{
 "results": [
   {{ "place": "<Place 1 Title>", "tags": ["t1","t2"] }},
   {{ "place": "<Place 2 Title>", "tags": [] }}
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

def classify_batch(batch_objects, template_type="food"):
    if template_type == "amusement":
        template = PROMPT_TEMPLATE_AMUSEMENT
    else:
        template = PROMPT_TEMPLATE_FOOD
    
    # Xây dựng chuỗi location mới, có cấu trúc
    location_strings = []
    for loc in batch_objects:
        title = loc.get("title", "")
        # Xử lý types (là một danh sách)
        types_list = loc.get("types", [])
        types_str = ", ".join(f'"{t}"' for t in types_list) # Format: ["item 1", "item 2"]
        
        # Xử lý description (là một chuỗi), đảm bảo không có lỗi nếu là None
        desc = loc.get("description")
        if not desc:
            desc = "N/A" # Dùng "N/A" nếu không có mô tả
        
        # Đảm bảo quotes (dấu ngoặc kép) bên trong title và desc được escape
        title_clean = title.replace('"', '\\"')
        desc_clean = desc.replace('"', '\\"').replace('\n', ' ') # Xóa cả ký tự xuống dòng

        location_strings.append(
            f'- place: "{title_clean}"\n'
            f'  types: [{types_str}]\n'
            f'  description: "{desc_clean}"'
        )
    
    prompt_locations = "\n\n".join(location_strings)
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
    # Trả về tên gốc nếu thất bại
    return [{"place": loc.get("title", ""), "tags": []} for loc in batch_objects]

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
        # Xóa dòng 'batch_titles = ...' vì không cần nữa
        classified_tags = classify_batch(batch_objects, template_type)
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
