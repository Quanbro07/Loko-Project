from app.tag_rules.base_profile import BaseProfile

class VacationProfile(BaseProfile):
    """
    Cấu hình cho loại hình Nghỉ dưỡng (Vacation).
    Ưu tiên: Resort, Island, Beach, Spa.
    Chiến lược: Tập trung vào các địa điểm có CHẤT LƯỢNG CAO (Rating >= 4.5).
    """
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            # Nhóm Destination (Điểm đến chính) - Thời gian lưu lại lâu
            "island": 300,      # 5 tiếng
            "resort": 240,      # 4 tiếng
            "camping": 240,     # 4 tiếng
            
            # Nhóm Experience (Trải nghiệm)
            "beach": 150,       # 2.5 tiếng
            "spa": 120,         # 2 tiếng
            "homestay": 90,     # Thăm quan khuôn viên/Check-in
            
            # Nhóm Service (Dịch vụ)
            "restaurant": 120,  # Ăn uống thư thả
            "cafe": 60,         # 1 tiếng
            "hotel": 0,         # 0 (Không tính vào lịch trình tham quan)
        }

        self.penalty_map = {
            "hotel": 50,        # Rất thấp, trừ khi là Resort
            
            # Key Visuals - Điểm số cao để làm trọng tâm
            "island": 600,
            "resort": 600,      
            "beach": 500,
            "camping": 500,
            
            # Support Activities
            "spa": 400,         
            "homestay": 300,    
            
            # Support Nodes
            "restaurant": 200,
            "cafe": 150,        
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # LOGIC DUY NHẤT: Ưu tiên địa điểm Rating cao (>= 4.5)
        # Lý do: Đi nghỉ dưỡng cần sự đảm bảo về trải nghiệm "đáng tiền".
        if rating and rating >= 4.5:
            base = int(base * 1.2) # Tăng 20% điểm ưu tiên
            
        return base