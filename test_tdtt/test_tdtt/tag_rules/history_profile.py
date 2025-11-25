# tag_rules/history_profile.py
from .base_profile import BaseProfile

class HistoryProfile(BaseProfile):
    """
    Cấu hình chi tiết cho loại hình du lịch Văn hóa - Lịch sử (History).
    """

    def __init__(self):
        super().__init__()

        # --- Service time (phút) ---
        self.service_time_map = {
            "citadel/palace": 150,      # 2.5 tiếng: Đi bộ khám phá
            "museum": 120,              # 2 tiếng: Xem hiện vật
            "old battlefield": 90,      # 1.5 tiếng
            "church/temple/pagoda": 60, # 1 tiếng: Thắp hương, vãn cảnh
            
            # Dịch vụ phụ trợ
            "restaurant": 90,           # 1.5 tiếng: Khách văn hóa ăn uống từ tốn hơn
            "cultural performance": 90,
            "hotel": 0,
        }

        # --- Penalty cơ bản (giá trị càng LỚN = càng QUAN TRỌNG) ---
        self.penalty_map = {
            "hotel": 99999,
            
            # --- NHÓM CORE (Trọng tâm lịch sử) ---
            "citadel/palace": 850,      # Ưu tiên cao nhất (Đại Nội, Cung điện)
            "museum": 800,              
            "old battlefield": 700,        
            "church/temple/pagoda": 650,   
            "cultural performance": 600,   

            # --- NHÓM SUPPORT ---
            "restaurant": 400,          # Quan trọng nhì (Ẩm thực văn hóa)              
        }

    def get_penalty(self, categories, rating=None):
        """
        Override hàm base.
        Logic đơn giản: Chỉ ưu tiên dựa vào Rating (địa điểm nổi tiếng/được đánh giá tốt).
        """
        base = super().get_penalty(categories, rating)
        
        # Logic đơn giản y chang mẫu: Check rating cao thì thưởng điểm
        if rating and rating >= 4.5:
            base = int(base * 1.2)
            
        return base