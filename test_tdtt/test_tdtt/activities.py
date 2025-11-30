import json
import re
import time
import google.generativeai as genai

API_KEY = "AIzaSyD1cLajJYQSqgR6HQGnkdpqn4Te_hhHwVE"
INPUT_FILE = OUTPUT_FILE = "schedule.json"

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash")

BATCH_SIZE = 8

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
{
  "results": [
    {"place": "Tên địa điểm", "activity": "Mô tả chi tiết hoạt động chính"}
  ]
}

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
   - Nếu "sequenceOrder" = 1 → tức là điểm đầu tiên của ngày:
    → Luôn phải viết theo dạng:
        "Xuất phát từ khách sạn..."
        "Khởi hành từ khách sạn..."
        "Bắt đầu ngày mới tại khách sạn và di chuyển đến..."
        "Rời khách sạn để bắt đầu hành trình..."

- Nếu "sequenceOrder" > 1 → nghĩa là quay về khách sạn giữa/ngày cuối:
    → Luôn phải viết theo dạng:
        "Quay về khách sạn để nghỉ ngơi..."
        "Trở lại khách sạn để thư giãn..."

3. **VIẾT CHI TIẾT – TỰ NHIÊN – CÓ NGỮ CẢNH**

4. **CÓ THỂ DỰA VÀO MÔ TẢ (description) NẾU CÓ**

5. **KHÔNG ĐƯỢC tạo ra thông tin sai hoặc tưởng tượng không có căn cứ.**

6. **Trả đúng JSON format, không thêm bất kỳ text nào ngoài JSON.**

=============================
DANH SÁCH ĐỊA ĐIỂM
=============================
{locations}
"""


def extract_json(text):
    try:
        clean = re.sub(r"```json|```", "", text).strip()
        return json.loads(clean)
    except:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except:
                return None
    return None


def classify_batch(titles):
    prompt = PROMPT_TEMPLATE.replace(
        "{locations}",
        "\n".join(f"- {t}" for t in titles)
    )

    for attempt in range(5):
        try:
            resp = MODEL.generate_content(prompt)
            data = extract_json(resp.text)
            if data and "results" in data:
                return data["results"]

            print(f"⚠️ JSON lỗi (lần {attempt+1}) thử lại…")

        except Exception as e:
            if "429" in str(e) or "503" in str(e):
                wait = 4 * (2 ** attempt)
                print(f"🔥 429/503, đợi {wait}s…")
                time.sleep(wait)
                continue
            else:
                print("⚠️ Lỗi khác:", e)
                time.sleep(2)

    print("❌ Dùng activity mặc định.")
    return [{"place": t, "activity": "tham quan và trải nghiệm"} for t in titles]


def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    trip_sections = data["tripSections"]

    for section in trip_sections:
        print(f"\n📅 Xử lý ngày {section['dayNumber']}")

        details = section["tripDetails"]
        titles = [d["location"]["location_name"] for d in details]
        total = len(titles)

        for i in range(0, total, BATCH_SIZE):
            batch_titles = titles[i:i+BATCH_SIZE]

            print(f"   ⏳ Batch {i//BATCH_SIZE + 1}")

            results = classify_batch(batch_titles)
            activity_map = {r["place"]: r["activity"] for r in results}

            # Gắn activity vào từng tripDetails
            for d in details[i:i+BATCH_SIZE]:
                place = d["location"]["location_name"]
                d["activity"] = activity_map.get(place, "tham quan và trải nghiệm")

            if i + BATCH_SIZE < total:
                print("   ☕ nghỉ 5s…")
                time.sleep(5)

        time.sleep(2)

    # Giữ NGUYÊN cấu trúc ban đầu, chỉ thêm activity
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("\n🎉 DONE →", OUTPUT_FILE)


if __name__ == "__main__":
    main()
