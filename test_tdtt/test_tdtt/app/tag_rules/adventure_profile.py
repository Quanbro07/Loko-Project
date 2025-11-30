from app.tag_rules.base_profile import BaseProfile

class AdventureProfile(BaseProfile):
    """
    Cấu hình cho loại hình Du lịch Mạo hiểm (Adventure).
    Chiến lược: Ưu tiên các hoạt động thiên nhiên cường độ cao.
    Thời gian ăn uống được rút ngắn (60p) để tối đa hóa thời gian khám phá.
    """
    def __init__(self):
        super().__init__()
        
        # --- Quy định thời gian (phút) ---
        self.service_time_map = {
            "mountain": 240,    # 4 tiếng: Leo núi
            "diving": 180,      # 3 tiếng: Lặn biển
            "cave": 150,        # 2.5 tiếng: Thám hiểm hang
            "camping": 150,     # 2.5 tiếng: Cắm trại
            "waterfall": 120,   # 2 tiếng: Thác nước
            
            # Dịch vụ phụ trợ
            "restaurant": 60,   # Ăn nhanh (1 tiếng) cho dân phượt
            "hotel": 0
        }

        # --- Trọng số ưu tiên (Penalty càng cao càng khó bị bỏ qua) ---
        self.penalty_map = {
            "hotel": 99999,

            # Core Activities (Điểm chính) - Phải cao nhất
            "mountain": 800,
            "cave": 750,
            "diving": 700,
            "waterfall": 600,

            # Support Nodes (Điểm phụ)
            # Logic: Tăng Restaurant lên 400 (quan trọng hơn các điểm tham quan nhẹ nhàng khác)
            "restaurant": 400,
            "camping": 350
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # Logic riêng: Ưu tiên địa điểm chất lượng cao (Rating >= 4.5)
        # Giúp lọc ra các trải nghiệm mạo hiểm "đáng tiền" nhất
        if rating and rating >= 4.5:
            base = int(base * 1.2)
            
        return base