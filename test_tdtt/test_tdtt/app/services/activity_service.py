import google.generativeai as genai
from typing import List, Dict
from app.core.config import settings
import json
import re

class ActivityService:
    def __init__(self):
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("models/gemini-2.5-flash")
            self.enabled = True
        except Exception as e:
            print(f"Warning: Gemini AI init failed. {e}")
            self.enabled = False

    def generate_activities(self, trip_details: List[Dict]) -> List[Dict]:
        """
        Nhận vào list các trip details (JSON), gọi AI sinh activity, trả về list đã update.
        """
        if not self.enabled or not trip_details:
            return trip_details

        # Lọc các điểm cần sinh activity (bỏ qua 'Kết thúc ngày')
        items_to_process = []
        for item in trip_details:
            if item.get("location") and "location_name" in item["location"]:
                items_to_process.append(item["location"]["location_name"])
        
        if not items_to_process:
            return trip_details

        # Tạo prompt batch
        prompt = f"""
        Bạn là hướng dẫn viên du lịch. Hãy viết mô tả ngắn gọn (1 câu) hành động cụ thể (activity) mà khách sẽ làm tại các địa điểm sau.
        Danh sách:
        {json.dumps(items_to_process, ensure_ascii=False)}
        
        Trả về JSON format: {{"results": [{{"place": "Tên", "activity": "Mô tả"}}]}}
        """

        try:
            resp = self.model.generate_content(prompt)
            data = self._extract_json(resp.text)
            
            if data and "results" in data:
                activity_map = {r["place"]: r["activity"] for r in data["results"]}
                
                # Update lại vào list gốc
                for item in trip_details:
                    loc_name = item.get("location", {}).get("location_name")
                    if loc_name in activity_map:
                        item["activity"] = activity_map[loc_name]
                    else:
                        item["activity"] = "Tham quan và trải nghiệm"
        except Exception as e:
            print(f"Gemini generation error: {e}")
            for item in trip_details:
                item["activity"] = "Tham quan"

        return trip_details

    def _extract_json(self, text):
        try:
            clean = re.sub(r"```json|```", "", text).strip()
            return json.loads(clean)
        except:
            return None