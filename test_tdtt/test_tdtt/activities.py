import json
import re
import time
import google.generativeai as genai

# === Cấu hình API ===
API_KEY = "AIzaSyB1ZGPnAMCHz9QC_KguYToOxkprnZ2yMMU" # Thay bằng key của bạn
INPUT_FILE = OUTPUT_FILE = "schedule.json"

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash")

# Giảm Batch Size xuống một chút để an toàn hơn cho tác vụ viết văn (nặng đô)
BATCH_SIZE = 8 

# === PROMPT NGUYÊN VĂN (GIỮ NGUYÊN, KHÔNG SỬA 1 CHỮ) ===
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

# === Hàm phụ trích xuất JSON từ text (Cải tiến) ===
def extract_json(text):
    try:
        # Xóa markdown code block nếu model lỡ thêm vào
        clean_text = re.sub(r"```json|```", "", text).strip()
        return json.loads(clean_text)
    except json.JSONDecodeError:
        # Fallback: Dùng regex tìm khối {}
        match = re.search(r'\{.*\}', text, re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
    return None

# === Hàm gọi model phân loại batch (Logic mới: Exponential Backoff) ===
def classify_batch(batch_titles):
    prompt_locations = "\n".join(f"- {title}" for title in batch_titles)
    prompt = PROMPT_TEMPLATE.replace("{locations}", prompt_locations)

    max_retries = 5
    base_wait_time = 4  # Bắt đầu chờ 4 giây

    for attempt in range(max_retries):
        try:
            resp = MODEL.generate_content(prompt)
            data = extract_json(resp.text)

            if data and "results" in data:
                return data["results"]

            print(f"⚠️ Lỗi format JSON (Lần {attempt + 1}). Thử lại...")

        except Exception as e:
            # Nếu lỗi quá tải (429) hoặc server (503)
            if "429" in str(e) or "503" in str(e):
                wait_time = base_wait_time * (2 ** attempt) # 4s, 8s, 16s...
                print(f"🔥 API quá tải. Đợi {wait_time}s rồi thử lại (Lần {attempt + 1})...")
                time.sleep(wait_time)
                continue 
            else:
                print(f"⚠️ Lỗi khác: {e}. Đợi 2s...")
                time.sleep(2)

    print("❌ Thất bại. Dùng activity mặc định.")
    return [{"place": title, "activity": "tham quan và trải nghiệm"} for title in batch_titles]

# === Hàm chính ===
def main():
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            schedule_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file '{INPUT_FILE}'.")
        return
    except json.JSONDecodeError:
        print(f"❌ Lỗi: File JSON hỏng.")
        return

    all_days = {}
    
    for day, locations in schedule_data.items():
        print(f"\n📅 Đang xử lý: {day} ({len(locations)} địa điểm)...")
        
        all_locations_with_activity = []
        total = len(locations)

        for i in range(0, total, BATCH_SIZE):
            batch_objects = locations[i:i+BATCH_SIZE]
            batch_titles = [loc.get("title", "") for loc in batch_objects]

            print(f"   ⏳ Batch {i//BATCH_SIZE + 1}: Gọi AI cho {len(batch_titles)} địa điểm...")
            
            classified = classify_batch(batch_titles)

            # Tạo map tra cứu
            activity_map = {res.get("place"): res.get("activity", "tham quan") for res in classified}

            # Gán dữ liệu
            for obj in batch_objects:
                title = obj.get("title", "")
                obj["activity"] = activity_map.get(title, "tham quan và khám phá")

            all_locations_with_activity.extend(batch_objects)
            
            # === QUAN TRỌNG: Nghỉ giữa hiệp để tránh 429 ===
            if i + BATCH_SIZE < total:
                print("   ☕ Nghỉ 5s để tránh rate limit...")
                time.sleep(5)

        all_days[day] = all_locations_with_activity
        print(f"✅ Xong {day}.")
        time.sleep(3) # Nghỉ giữa các ngày

    # Ghi file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_days, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Hoàn tất! Đã ghi vào: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()