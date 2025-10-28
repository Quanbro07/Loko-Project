import json
import re
import time
import google.generativeai as genai

# ==============================================================================
# CẢNH BÁO BẢO MẬT: API Key của bạn đang hiển thị rõ.
# Không chia sẻ file này cho bất kỳ ai.
API_KEY = "AIzaSyB1ZGPnAMCHz9QC_KguYToOxkprnZ2yMMU"
# ==============================================================================

INPUT_FILE = "da_nang_attractions.json"
OUTPUT_FILE = "attractions_with_tags.json"

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash") # Đã cập nhật lên 1.5-flash mới hơn

BATCH_SIZE = 50

PROMPT_TEMPLATE = """
You are a Professional Place Classification System.

Task:
Given a single place name (short, e.g., "Ha Long Bay" or "Ben Thanh Market, HCMC"), assign **2 to 5** tags that most accurately describe the place's PRIMARY and important SECONDARY characteristics, chosen ONLY from the allowed list below.

━━━━━━━━━━━━━━
✅ ALLOWED TAG LIST (USE EXACT LABELS ONLY):

beach, island, mountain, river, lake, waterfall, cave, park, garden, viewpoint,
harbor, square, market, shopping, village, nature, stadium, museum, palace,
fortress, bridge, tower, statue, landmark, temple, pagoda, cathedral, religion,
hotel, resort, homestay, restaurant, street-food, spa, "yacht / cruise", amusement,
zoo, diving, trekking, camping, watersport, family, kid, couple, trendy, crowded,
dangerous, night-spot, budget-friendly, luxury

(Use the string `"yacht / cruise"` exactly if applicable.)

━━━━━━━━━━━━━━
STRICT RULES (READ CAREFULLY — THEY ARE ENFORCED):

1) **OUTPUT SIZE** — For every valid place, return **between 2 and 5 tags**.  
   - The first tag must represent the place's **primary function or natural category** (e.g., "beach", "museum", "market").  
   - The remaining 1–4 tags should represent **secondary but factual** attributes (e.g., "viewpoint", "family", "street-food").

2) **NO GUESSING** — Only tag attributes that are:
   - Widely known facts about the place, or
   - Directly implied by the place type or common, reliable sources.
   If you cannot reliably identify 2 meaningful tags, return `[]` (empty array).

3) **NO ASSUMPTIONS / NO INFERENCE FROM NAME ONLY** — Do NOT infer commercial or demographic attributes from a name unless they are strongly associated (e.g., "Ben Thanh Market" → "market", "street-food"). Do NOT assign "restaurant" for a market unless the entity is primarily a restaurant.

4) **NO EXTRA TAGS** — Use ONLY tags from the allowed list. Do not invent new labels or synonyms.

5) **SENSIBLE FALLBACKS** — If exactly 1 highly-certain primary tag is known, pick **one** general fallback among `nature`, `landmark`, or `shopping` (only if applicable) to reach the minimum of 2 tags. Use the fallback that is least assumptive (prefer `nature` for natural sites, `landmark` for named monuments).

6) **SPECIAL TAG RULES**:
   - `"shopping"` → only for malls, markets, shopping streets; not for a street that occasionally has shops.
   - `"hotel"`, `"resort"`, `"homestay"` → only when the place is primarily accommodation.
   - `"viewpoint"` → only if the site’s main draw is the scenic view.
   - `"temple"`, `"pagoda"`, `"cathedral"` → use the specific one; add `"religion"` only if the religious function is central and widely recognized.
   - `"dangerous"` → only for places where adventurous or hazardous activities are typical (cliffs without barriers, extreme trekking, deep-cave exploration).
   - `"kid"`, `"family"` → only when the place is explicitly suitable or designed for children/families (theme parks, zoos with family facilities).
   - `"crowded"`, `"trendy"`, `"night-spot"`, `"budget-friendly"`, `"luxury"` → use these only if the place is commonly described this way in travel/guide sources (do not guess).

7) **PREFER FACTS OVER MARKETING** — Do not tag marketing adjectives (e.g., don’t tag “luxury” unless the place is widely recognized as luxury).

8) **NO EXPLANATION** — Output must be exactly and only the JSON (see format). No extra text, no commentary.

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
        # Thử tìm khối JSON lồng trong markdown (```json ... ```) hoặc văn bản
        match = re.search(r'\{.*\}', text, re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                print("Lỗi: Tìm thấy JSON nhưng không thể parse.")
                return None
    return None

def classify_batch(batch_titles):
    """
    Gửi một lô (batch) các *tên địa điểm* (strings) đến API
    và trả về kết quả phân loại.
    """
    # Tạo chuỗi prompt từ danh sách các tên địa điểm
    prompt_locations = "\n".join(f"- {title}" for title in batch_titles)
    prompt = PROMPT_TEMPLATE.format(locations=prompt_locations)
    
    # Thử gọi API tối đa 3 lần
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
            
    # Nếu thất bại, trả về một danh sách rỗng cho mỗi địa điểm
    print("Lỗi: Thất bại sau 3 lần thử. Gán tag rỗng cho lô này.")
    return [{"place": title, "tags": []} for title in batch_titles]

def main():
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            # locations là một danh sách các ĐỐI TƯỢNG (dictionary)
            locations = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{INPUT_FILE}'.")
        return
    except json.JSONDecodeError:
        print(f"Lỗi: File '{INPUT_FILE}' không phải là JSON hợp lệ.")
        return

    # *** THAY ĐỔI QUAN TRỌNG ***
    # all_locations_with_tags sẽ lưu các ĐỐI TƯỢNG GỐC đã được cập nhật
    all_locations_with_tags = []
    total = len(locations)

    print(f"Processing {total} locations in batches of {BATCH_SIZE}…")

    for i in range(0, total, BATCH_SIZE):
        # 1. Lấy lô các ĐỐI TƯỢNG GỐC
        batch_objects = locations[i:i+BATCH_SIZE]
        
        # 2. Tạo một danh sách chỉ chứa CÁC TÊN (title) để gửi cho AI
        # Giả sử trường chứa tên là "title" (từ script SerpApi trước)
        batch_titles = [loc.get("title", "") for loc in batch_objects]

        # 3. Gửi các tên này đi phân loại
        # classified_tags là danh sách: [{"place": "Tên 1", "tags": [...]}, ...]
        classified_tags = classify_batch(batch_titles)

        # 4. Tạo một "map" (dictionary) để tra cứu tag bằng tên
        # Ví dụ: {"Hồ Xuân Hương": ["lake", "park"], "Chợ Đà Lạt": ["market"]}
        tag_map = {res.get("place"): res.get("tags", []) for res in classified_tags}

        # 5. Lặp lại qua các ĐỐI TƯỢNG GỐC trong lô
        for obj in batch_objects:
            # Lấy title của đối tượng gốc
            title = obj.get("title", "")
            
            # Tra cứu tag từ map, nếu không thấy thì dùng list rỗng
            tags = tag_map.get(title, [])
            
            # Thêm trường "tags" mới vào ĐỐI TƯỢNG GỐC
            obj["tags"] = tags
        
        # 6. Thêm các đối tượng đã cập nhật vào danh sách kết quả cuối cùng
        all_locations_with_tags.extend(batch_objects)
        
        print(f"[{len(all_locations_with_tags)}/{total}] ✅ Done batch")
        
        time.sleep(1) # Tránh rate limit

    # 7. Lưu danh sách các ĐỐI TƯỢNG ĐÃ CẬP NHẬT
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        # all_locations_with_tags giờ chứa các đối tượng gốc + trường "tags"
        json.dump(all_locations_with_tags, f, ensure_ascii=False, indent=2)

    print(f"\n✅ All done! Dữ liệu đầy đủ (kèm tags) đã được lưu vào: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()