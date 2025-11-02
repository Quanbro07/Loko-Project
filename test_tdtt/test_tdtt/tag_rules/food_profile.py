# tag_rules/food_profile.py
from .base_profile import BaseProfile

class FoodProfile(BaseProfile):
    """
    Cấu hình chi tiết cho loại hình du lịch Ẩm thực.
    """

    def __init__(self):
        super().__init__()

        # --- Service time (phút) ---
        # Yêu cầu: Nhà hàng 2h, snack 45m, cafe 1h30, night market 2h30
        self.service_time_map = {
            "restaurant": 120,    # 2 tiếng
            "snack": 45,          # 45 phút
            "cafe": 90,           # 1 tiếng 30 phút
            "night market": 150,  # 2 tiếng 30 phút
            "market": 75,         # 1 tiếng 15 phút
            "speciality": 60,     # món đặc sản, 1 tiếng
            "hotel": 0,           # nơi xuất phát
        }

        # --- Penalty cơ bản (giá trị càng LỚN = càng QUAN TRỌNG) ---
        # Đây là chi phí "bỏ qua" (skip) địa điểm này.
        self.penalty_map = {
            "hotel": 99999, # Không bao giờ được bỏ qua hotel (depot)
            "restaurant": 200,
            "snack": 150,
            "cafe": 150,
            "market": 100,
            "night market": 250,
            "speciality": 220,
        }

        # --- Boost nhỏ cho tag đặc biệt (Yêu cầu: Speciality ưu tiên hơn) ---
        # Sẽ nhân vào penalty ở data_loader
        self.priority_boost = {
            "speciality": 1.15 # Tăng 15% độ quan trọng (penalty)
        }