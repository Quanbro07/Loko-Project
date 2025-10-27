import json
import re
import time
import google.generativeai as genai

# ==============================================================================
# CẢNH BÁO BẢO MẬT: API Key của bạn đang hiển thị rõ.
# Không chia sẻ file này cho bất kỳ ai.
API_KEY = "AIzaSyB1ZGPnAMCHz9QC_KguYToOxkprnZ2yMMU"
# ==============================================================================

INPUT_FILE = "da_lat_attractions.json"
OUTPUT_FILE = "attractions_with_tags.json"

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash") # Đã cập nhật lên 1.5-flash mới hơn

BATCH_SIZE = 50

PROMPT_TEMPLATE = """
You are a **Professional Place Classification System**.
Your job: assign factual tags to each place in the given list.

━━━━━━━━━━━━━━
✅ ALLOWED TAG LIST (MUST USE ONLY these exact labels):

beach, viewpoint, shopping, hotel, park, lake, museum, temple, religion,
mountain, hill, nature, island, bridge, amusement, zoo, historic, market,
statue, waterfall, harbor, square, tower, cave, palace, village, stadium,
dangerous, kid, hotel, restaurant, food

━━━━━━━━━━━━━━
STRICT CLASSIFICATION POLICY:

1️⃣ MAXIMUM 3 tags per place.
2️⃣ Only tag MAIN characteristics (primary purpose only)
3️⃣ No guessing. If not sure → []
4️⃣ Use only allowed tag list
5️⃣ No secondary functions or assumptions
6️⃣ Special rules:
   - “shopping” → only shopping areas or markets
   - “hotel” → only lodging-focused buildings
   - “viewpoint” → main attraction = scenic view
   - “temple” = pagodas, churches, shrines
     Also add “religion” if correct
   - “historic” = heritage/historical importance
   - "dangerous" is for place people usually do adventurous activities and not for kids or elderly
   - "kid" → place that suitable and highly recommended for kid
7️⃣ If a place has multiple roles → choose main one

━━━━━━━━━━━━━━
OUTPUT FORMAT (STRICT):

{{
  "results": [
    {{ "place": "<place1>", "tags": ["t1","t2"] }},
    {{ "place": "<place2>", "tags": [] }}
  ]
}}

ABSOLUTELY NO:
- Explanation
- Extra keys
- Natural language

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