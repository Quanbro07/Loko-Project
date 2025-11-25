from app.tag_rules.base_profile import BaseProfile

class AmusementProfile(BaseProfile):
    """
    Cấu hình cho loại hình Vui chơi giải trí.
    Đã tinh chỉnh lại điểm số: Zoo/Park phải cao hơn Restaurant.
    """
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            "restaurant": 90, # Ăn nhanh hơn chút để dành giờ đi chơi
            "nightlife": 150,
            "zoo": 240, # 4 tiếng
            "amusement/water park": 240, # 4 tiếng
            "cultural performance": 120,
            "market": 60,
            "cafe": 45,
            "hotel": 0,
            "culture_performance": 120,
            "aquarium": 120,
            "museum": 120
        }

        self.penalty_map = {
            "hotel": 99999,
            
            # Key Visuals (Điểm chính) - Điểm gốc phải cao
            "zoo": 600,
            "amusement/water park": 600,
            "aquarium": 500,
            "museum": 450,
            "cultural performance": 450,
            "culture_performance": 450,
            "nightlife": 400,

            # Support Nodes (Điểm phụ) - Điểm thấp hơn
            "restaurant": 200, # Thấp hơn điểm chính
            "cafe": 100,
            "market": 80,
            "night market": 150,
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        # Nếu là địa điểm tổ hợp (nhiều tag), tăng nhẹ
        if categories and len(categories) > 2:
            base = int(base * 1.1)
        return base