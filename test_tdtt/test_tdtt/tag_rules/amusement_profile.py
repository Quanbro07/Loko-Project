# tag_rules/amusement_profile.py
from .base_profile import BaseProfile

class AmusementProfile(BaseProfile):
    """
    Cấu hình chi tiết cho loại hình du lịch Giải trí (Amusement).
    """

    def __init__(self):
        super().__init__()

        # --- Service time (phút) ---
        # Yêu cầu: Nhà hàng 2h, còn lại 3-4h, nightlife 3h
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
            "restaurant": 250, # Chỉ là nơi ăn, ít quan trọng hơn
            "nightlife": 250,
            "zoo": 300,
            "amusement/water park": 300,
            "cultural performance": 250,
            "market": 100,
        }

    def get_penalty(self, tags, rating=None):
        """
        Override hàm base để thêm logic "ưu tiên sự đa dạng".
        """
        # 1. Lấy penalty cơ bản (đã bao gồm điều chỉnh theo rating)
        base = super().get_penalty(tags, rating)
        
        # 2. Yêu cầu: Ưu tiên địa điểm có nhiều tag đa dạng
        # Tăng 20% penalty (độ quan trọng) nếu có nhiều hơn 2 tag
        if tags and len(tags) > 2:
            base = int(base * 1.2)
            
        return base