# tag_rules/amusement_profile.py
from .base_profile import BaseProfile

class AmusementProfile(BaseProfile):
    """
    Cấu hình chi tiết cho loại hình du lịch Giải trí (Amusement).
    """

    def __init__(self):
        super().__init__()

        # --- Service time (phút) ---
        self.service_time_map = {
            "restaurant": 120,      # 2 tiếng
            "nightlife": 180,       # 3 tiếng (sẽ bị cắt ngắn nếu hết giờ)
            "zoo": 210,             # 3.5 tiếng
            "amusement/water park": 210, # 3.5 tiếng
            "cultural performance": 180, # 3 tiếng
            "market": 75,
            "cafe": 60,
            "hotel": 0,
        }

        # --- Penalty cơ bản (giá trị càng LỚN = càng QUAN TRỌNG) ---
        self.penalty_map = {
            "hotel": 99999,
            
            # --- SỬA Ở ĐÂY ---
            # Tăng mạnh penalty của nhà hàng (từ 250 lên 400)
            # để nó quan trọng hơn cả Zoo/Công viên (300)
            "restaurant": 400, 
            # --- HẾT SỬA ---
            
            "nightlife": 250,
            "zoo": 300,
            "amusement/water park": 300,
            "cultural performance": 250,
            "market": 100,
        }

    def get_penalty(self, categories, rating=None):
        """
        Override hàm base để thêm logic "ưu tiên sự đa dạng".
        """
        base = super().get_penalty(categories, rating)
        
        if categories and len(categories) > 2:
            base = int(base * 1.2)
            
        return base