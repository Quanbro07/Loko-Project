import json
import re
import time
import google.generativeai as genai

# === Cấu hình API ===
API_KEY = "AIzaSyB1ZGPnAMCHz9QC_KguYToOxkprnZ2yMMU"
INPUT_FILE = OUTPUT_FILE = "schedule.json"

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash")

BATCH_SIZE = 10

# === Prompt yêu cầu xác định "activity" ===
PROMPT_TEMPLATE = """
Bạn là chuyên gia về du lịch ẩm thực tại Việt Nam.

Nhiệm vụ: Với mỗi địa điểm bên dưới, hãy xác định **ngắn gọn, tự nhiên và chính xác** người ta thường **đến đó để làm gì**.

Dữ liệu đầu vào là danh sách các địa điểm (chỉ có tên).  
Hãy trả về kết quả ở định dạng JSON với cấu trúc **chính xác** như sau:
{{
  "results": [
    {{"place": "Tên địa điểm", "activity": "mô tả ngắn gọn hoạt động chính"}}
  ]
}}

❗ Quy tắc suy luận:
1. Dựa vào **tên địa điểm** để đoán hoạt động cụ thể nhất có thể:
   - Nếu tên chứa "coffee", "cafe", "roastery" → `"uống cà phê"`, `"thưởng thức cà phê"`, hoặc `"đọc sách và uống cà phê"`
   - Nếu tên chứa "restaurant", "quán ăn", "nhà hàng" → `"thưởng thức món ăn"`, `"ăn trưa"`, `"ăn tối"`
   - Nếu tên chứa "bar", "pub", "sky" → `"uống cocktail"`, `"thưởng thức đồ uống"`, `"ngắm cảnh đêm"`
   - Nếu tên chứa "market", "chợ" → `"mua sắm"`, `"ăn vặt"`, `"dạo chợ"`
   - Nếu tên chứa "hotel", "resort", "homestay" → `"nghỉ ngơi"`, `"trở về khách sạn"`
   - Nếu tên chứa "street", "alley", "corner" → `"dạo phố"`, `"ăn vặt"`
   - Nếu tên chứa "museum", "temple", "pagoda" → `"tham quan"`
   - Nếu là tên đặc sản hoặc vùng miền → `"thưởng thức đặc sản địa phương"`
   - Nếu không rõ, chọn `"tham quan"`.

2. Viết **tự nhiên, đa dạng**, tránh lặp lại cùng một mẫu.  
   Ví dụ: thay vì `"ăn tối"`, có thể viết `"thưởng thức bữa tối tại nhà hàng sang trọng"` nếu tên nghe cao cấp.

3. Chỉ trả về JSON, **không giải thích thêm**.

Dưới đây là danh sách địa điểm:
{locations}
"""


# === Hàm phụ để trích xuất JSON từ text trả về ===
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
                print("⚠️ Lỗi: Tìm thấy JSON nhưng không thể parse.")
                return None
    return None


# === Hàm gọi model để phân loại hàng loạt ===
def classify_batch(batch_titles):
    """Phân loại 1 lô tên địa điểm và trả về danh sách activity."""
    prompt_locations = "\n".join(f"- {title}" for title in batch_titles)
    prompt = PROMPT_TEMPLATE.format(locations=prompt_locations)

    for _ in range(3):  # thử lại tối đa 3 lần
        try:
            resp = MODEL.generate_content(prompt)
            data = extract_json(resp.text)

            if data and "results" in data:
                return data["results"]

            print("⚠️ Lỗi: Phản hồi API không hợp lệ hoặc thiếu 'results'. Đang thử lại...")
            time.sleep(1)

        except Exception as e:
            print(f"⚠️ Lỗi API: {e}. Đang thử lại sau 2 giây...")
            time.sleep(2)

    # Nếu thất bại -> fallback
    print("❌ Thất bại sau 3 lần thử. Gán activity mặc định 'tham quan'.")
    return [{"place": title, "activity": "tham quan"} for title in batch_titles]


# === Hàm chính ===
def main():
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            locations = json.load(f)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file '{INPUT_FILE}'.")
        return
    except json.JSONDecodeError:
        print(f"❌ Lỗi: File '{INPUT_FILE}' không phải là JSON hợp lệ.")
        return

    all_locations_with_activity = []
    total = len(locations)
    print(f"Processing {total} locations in batches of {BATCH_SIZE}…")

    for i in range(0, total, BATCH_SIZE):
        batch_objects = locations[i:i+BATCH_SIZE]
        batch_titles = [loc.get("title", "") for loc in batch_objects]

        classified = classify_batch(batch_titles)

        # map để tra nhanh
        activity_map = {res.get("place"): res.get("activity", "tham quan") for res in classified}

        # gán activity vào từng object
        for obj in batch_objects:
            title = obj.get("title", "")
            obj["activity"] = activity_map.get(title, "tham quan")

        all_locations_with_activity.extend(batch_objects)
        print(f"[{len(all_locations_with_activity)}/{total}] ✅ Done batch")
        time.sleep(1)  # tránh rate limit

    # ghi kết quả
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_locations_with_activity, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Hoàn tất! Đã thêm 'activity' vào: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
