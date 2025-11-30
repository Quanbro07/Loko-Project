# tag_rules/amusement_profile.py
from .base_profile import BaseProfile

class AdventureProfile(BaseProfile):
    """
    Cấu hình chi tiết cho loại hình du lịch Mạo hiểm (Adventure).
    """

    def __init__(self):
        super().__init__()

        # --- Service time (phút) ---
        self.service_time_map = {
            "mountain": 240,     # Tăng lên 4 tiếng: Leo núi cần nhiều thời gian.
            "cave": 150,         # 2.5 tiếng: Đủ để đi sâu vào hang.
            "camping": 150,      # 2.5 tiếng (Dừng chân cắm trại/nghỉ ngơi).
            "waterfall": 120,     # 2 tiếng
            "diving": 180,       # 3 tiếng: Bao gồm chuẩn bị đồ + lặn.
            
            # Dịch vụ phụ trợ
            "restaurant": 60,    # 1 tiếng: Dân phượt ăn nhanh để đi tiếp
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
            
            # --- NHÓM CORE (Phải cao hơn Restaurant) ---
            "mountain": 800,     # Trọng tâm của Adventure
            "cave": 750,
            "diving": 700,
            "waterfall": 600,
        }

    def get_penalty(self, categories, rating=None):
        """
        Override hàm base để thêm logic "ưu tiên sự đa dạng".
        """
        base = super().get_penalty(categories, rating)
        
        if rating and rating >= 4.5:
            base = int(base * 1.2)
            
        return base