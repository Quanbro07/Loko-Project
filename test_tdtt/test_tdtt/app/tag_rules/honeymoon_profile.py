from app.tag_rules.base_profile import BaseProfile

class HoneymoonProfile(BaseProfile):
    """
    Cấu hình cho Tuần trăng mật (Honeymoon).
    Chiến lược: "Romantic & Memorable".
    Ưu tiên: Trải nghiệm lãng mạn (Du thuyền, Viewpoint) và Nghỉ dưỡng sang trọng.
    """
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            # Nhóm Exclusive Experience (Trải nghiệm đặc biệt)
            "island": 300,        # 5 tiếng: Tour đảo riêng tư
            "yacht/cruise": 180,  # 3 tiếng: Sunset cruise/Ăn tối trên tàu
            "resort": 240,        # 4 tiếng: Tận hưởng không gian riêng
            
            # Nhóm Romantic Date (Hẹn hò)
            "beach": 150,         # 2.5 tiếng: Đi dạo, ngắm hoàng hôn
            "restaurant": 120,    # 2 tiếng: Bữa tối lãng mạn (Fine dining)
            "cafe": 90,           # 1.5 tiếng: Cafe view đẹp, không gian chill
            "viewpoint": 60,      # 1 tiếng: Chụp ảnh lưu niệm cặp đôi
            
            # Nhóm lưu trú (Nếu chỉ ngủ thì set 0)
            "homestay": 0,
            "hotel": 0,
        }

        self.penalty_map = {
            "hotel": 50,         # Honeymoon thường ít chọn khách sạn phổ thông
            "homestay": 50,      # Ưu tiên sự riêng tư/dịch vụ của Resort hơn
            
            # Key Visuals - Những khoảnh khắc "đắt giá"
            "yacht/cruise": 700, # Điểm cao nhất: Trải nghiệm độc đáo, sang trọng
            "resort": 600,       # Cốt lõi của nghỉ dưỡng
            "viewpoint": 550,    # Nơi tạo ra những bức ảnh kỷ niệm
            "island": 500,       
            "beach": 500,
            
            # Support Nodes
            "restaurant": 300,   # Cao hơn các profile khác vì bữa tối rất quan trọng
            "cafe": 150,
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # LOGIC DUY NHẤT: Ưu tiên "Khoảnh khắc lãng mạn"
        # Du thuyền hoặc các điểm ngắm cảnh (Viewpoint) là nơi tạo ra ký ức đẹp nhất
        if categories:
            if "yacht/cruise" in categories or "viewpoint" in categories:
                base = int(base * 1.3) # Boost mạnh 30% để đảm bảo lịch trình có điểm nhấn
                
        return base