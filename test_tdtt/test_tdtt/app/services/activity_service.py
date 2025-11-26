import google.generativeai as genai
from typing import List, Dict
from app.core.config import settings
from app.schemas.schedule_dto import ScheduleResponse
import json
import re
import time
import asyncio

class ActivityService:
    def __init__(self):
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("models/gemini-2.5-flash")
            self.enabled = True
        except Exception as e:
            print(f"Warning: Gemini AI init failed. {e}")
            self.enabled = False

    # --- PROMPT TEMPLATE TỪ FILE TEST CŨ ---
    PROMPT_TEMPLATE = """
    Bạn là chuyên gia du lịch, ẩm thực và địa điểm vui chơi tại Việt Nam.

    Nhiệm vụ:
    Với danh sách địa điểm (kèm ngữ cảnh) bên dưới, hãy tạo ra một mô tả **activity** (hoạt động) chi tiết, tự nhiên, hấp dẫn nhưng ngắn gọn (khoảng 1-2 câu).

    Dữ liệu đầu vào cho mỗi điểm gồm:
    - Sequence: Thứ tự trong ngày (1 là điểm đầu tiên).
    - Title: Tên địa điểm.
    - Context: Loại hình hoặc ghi chú.
    - Time: Thời gian dự kiến.

    =============================
    QUY TẮC LOGIC (BẮT BUỘC):
    =============================

    1. **ĐỐI VỚI KHÁCH SẠN / ĐIỂM NGHỈ (Dựa vào tên hoặc sequence)**
       - Nếu "Sequence" = 1 (Đầu ngày):
        → Viết dạng: "Khởi hành từ khách sạn để bắt đầu hành trình..." hoặc "Xuất phát từ..."
       - Nếu là điểm cuối cùng trong ngày hoặc tên có chữ "Về ... nghỉ ngơi":
        → Viết dạng: "Quay về khách sạn để nghỉ ngơi, nạp lại năng lượng."

    2. **ĐỐI VỚI CÁC ĐỊA ĐIỂM KHÁC**
       - Quán ăn/Restaurant: "Thưởng thức các món đặc sản..." hoặc "Dùng bữa tại không gian..."
       - Cafe: "Thư giãn, thưởng thức cà phê và ngắm cảnh..."
       - Công viên/Cảnh quan: "Tản bộ, hóng mát và check-in..."
       - Di tích/Bảo tàng: "Tham quan, tìm hiểu lịch sử và văn hóa..."
       - Vui chơi/Amusement: "Trải nghiệm các trò chơi thú vị..."
       - Chợ/Night Market: "Mua sắm, khám phá ẩm thực đường phố..."

    3. **YÊU CẦU ĐẦU RA**
       - Trả về đúng định dạng JSON.
       - Không thêm markdown (```json).
       - Key là "results", Value là danh sách object {"id": <sequence_id>, "activity": "<nội dung>"}.

    =============================
    DANH SÁCH ĐỊA ĐIỂM CẦN XỬ LÝ:
    =============================
    {locations_json}
    """

    async def fill_schedule_with_activities(self, schedule: ScheduleResponse) -> ScheduleResponse:
        """
        Hàm chính: Nhận vào ScheduleResponse, duyệt qua từng ngày, gọi AI và điền activity.
        """
        if not self.enabled:
            return schedule

        print("🚀 Đang khởi tạo Activity Description với Gemini...")
        
        # Duyệt qua từng Section (từng ngày)
        for section in schedule.tripSections:
            details = section.tripDetails
            if not details:
                continue

            # Chuẩn bị data để gửi (Batching nếu danh sách quá dài, ví dụ > 10 điểm/ngày)
            # Ở đây ta xử lý cả ngày một lần cho AI nắm ngữ cảnh liền mạch
            items_to_process = []
            
            for item in details:
                # Lấy tên category làm context bổ trợ
                loc_obj = item.location
                tags = []
                if isinstance(loc_obj, dict):
                    tags = [c.get('categoryName', '') for c in loc_obj.get('categories', [])]
                elif hasattr(loc_obj, 'categories'):
                    tags = [c.categoryName for c in loc_obj.categories]

                # Xây dựng object context gửi cho AI
                items_to_process.append({
                    "id": item.sequenceOrder,
                    "title": loc_obj.get('location_name', 'Unknown') if isinstance(loc_obj, dict) else loc_obj.location_name,
                    "context": f"Tags: {', '.join(tags)}. Note: {item.description}",
                    "time": f"{item.startTime} - {item.endTime}"
                })

            if not items_to_process:
                continue

            # Gọi AI
            activities_map = await self._call_gemini_batch(items_to_process)

            # Map kết quả trả về vào field 'activity' của DTO
            for item in details:
                seq_id = item.sequenceOrder
                if seq_id in activities_map:
                    item.activity = activities_map[seq_id]
                else:
                    # Fallback nếu AI bỏ sót
                    item.activity = "Tham quan và trải nghiệm địa điểm này."

        print("✅ Hoàn tất sinh Activity.")
        return schedule

    async def _call_gemini_batch(self, inputs: List[Dict]) -> Dict[int, str]:
        """
        Gửi request tới Gemini với cơ chế Retry
        """
        prompt = self.PROMPT_TEMPLATE.replace("{locations_json}", json.dumps(inputs, ensure_ascii=False, indent=2))
        
        retries = 3
        for attempt in range(retries):
            try:
                # Chạy synchronous method của Google trong thread pool để không chặn FastAPI
                response = await asyncio.to_thread(self.model.generate_content, prompt)
                
                result_json = self._extract_json(response.text)
                
                if result_json and "results" in result_json:
                    # Trả về Dict: {sequence_id: activity_text}
                    return {item["id"]: item["activity"] for item in result_json["results"]}
                
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "503" in err_msg:
                    wait_time = 2 * (attempt + 1)
                    print(f"⚠️ Gemini quá tải, đợi {wait_time}s... ({e})")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"❌ Gemini Error: {e}")
                    break
        
        return {}

    def _extract_json(self, text):
        """Hàm clean JSON từ response của AI (xử lý markdown, text thừa)"""
        try:
            # Xóa markdown code block
            clean = re.sub(r"```json|```", "", text).strip()
            return json.loads(clean)
        except:
            # Fallback: cố gắng tìm pattern JSON trong text hỗn loạn
            m = re.search(r"\{.*\}", text, re.S)
            if m:
                try:
                    return json.loads(m.group(0))
                except:
                    pass
            return None