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
Bạn là chuyên gia du lịch, ẩm thực và địa điểm vui chơi tại Việt Nam.

Nhiệm vụ:
Với mỗi địa điểm bên dưới, hãy tạo ra một mô tả **activity chi tiết**, tự nhiên, ngắn gọn nhưng đủ thông tin để người dùng biết chính xác HỌ SẼ LÀM GÌ tại địa điểm đó.

Bạn được cung cấp đầy đủ:
- tên địa điểm (title)
- mô tả (description)
- thời gian đến – rời đi
- rating
- loại địa điểm có thể suy luận từ tên và mô tả

Hãy trả kết quả theo JSON với cấu trúc:
{{
  "results": [
    {{"place": "Tên địa điểm", "activity": "Mô tả chi tiết hoạt động chính"}}
  ]
}}

=============================
QUY TẮC PHÂN TÍCH & TẠO ACTIVITY
=============================

1. **PHẢI DỰA TRÊN TÊN ĐỊA ĐIỂM + MÔ TẢ + LOẠI HÌNH SUY LUẬN**
   - Nếu là quán ăn / restaurant / dining → mô tả: người dùng đến để **thưởng thức món gì**, phong cách ăn uống gì (casual, fine dining,…).
   - Nếu là cafe → mô tả: thưởng thức cà phê, không gian, nghỉ chân.
   - Nếu là công viên → đi dạo, tập thể dục, chụp ảnh, thư giãn.
   - Nếu là đền chùa, di tích → tham quan, tìm hiểu lịch sử, chụp ảnh.
   - Nếu là escape room → chơi giải đố, trải nghiệm trò chơi thử thách.
   - Nếu là khu mua sắm / chợ → mua sắm, ăn vặt, khám phá địa phương.
   - Nếu là bar / pub → thưởng thức cocktail, nghe nhạc, chill buổi tối.
   - Nếu không rõ → chọn hoạt động hợp lý nhất theo bối cảnh.

2. **ĐỐI VỚI KHÁCH SẠN / RESORT**
   - Nếu là **điểm đầu tiên trong ngày** → "nghỉ ngơi tại khách sạn" hoặc "xuất phát từ khách sạn".
   - Nếu KHÔNG PHẢI điểm đầu tiên → **bắt buộc** viết dạng:
     → `"Quay về khách sạn để nghỉ ngơi / thư giãn / chuẩn bị cho chặng tiếp theo…"`

3. **VIẾT CHI TIẾT – TỰ NHIÊN – CÓ NGỮ CẢNH**
   Ví dụ:
   - Thay vì: “ăn tối”
     → “thưởng thức bữa tối phong cách fine dining với thực đơn sáng tạo theo mùa”
   - Thay vì: “tham quan”
     → “tham quan Văn Miếu – Quốc Tử Giám và tìm hiểu lịch sử giáo dục thời phong kiến”

4. **CÓ THỂ DỰA VÀO MÔ TẢ (description) NẾU CÓ**
   - Nếu mô tả nói “có hồ bơi lắp kính” → đưa vào activity.
   - Nếu mô tả nói “có đường chạy bộ” → đưa vào activity của công viên.
   - Nếu mô tả rỗng, chỉ dùng tên + suy luận hợp lý.

5. **KHÔNG ĐƯỢC tạo ra thông tin sai hoặc tưởng tượng không có căn cứ.**

6. **Trả đúng JSON format, không thêm bất kỳ text nào ngoài JSON.**

=============================
DANH SÁCH ĐỊA ĐIỂM
=============================
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
