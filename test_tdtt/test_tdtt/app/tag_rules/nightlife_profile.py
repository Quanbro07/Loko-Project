from app.tag_rules.base_profile import BaseProfile

class NightlifeProfile(BaseProfile):
    """
    Cấu hình cho Cuộc sống về đêm (Nightlife).
    Chiến lược: "Vibrant & Bustling".
    Ưu tiên: Bar/Pub, Phố đi bộ, Chợ đêm (Những nơi có không khí sôi động).
    """
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            # Nhóm High Energy (Quẩy & Tụ tập)
            "bar": 120,           # 2 tiếng: Uống bia, nghe nhạc, trò chuyện
            "camping": 180,       # 3 tiếng: Nếu chọn camping đêm, thời gian cần dài
            
            # Nhóm Walking & Exploring (Đi dạo & Khám phá)
            "walking street": 90, # 1.5 tiếng: Đi bộ, xem biểu diễn đường phố
            "night market": 120,  # 2 tiếng: Ăn vặt và mua sắm
            
            # Nhóm Chill/Dining
            "restaurant": 90,     # 1.5 tiếng: Ăn tối trước khi đi chơi (Pre-game)
            "cafe": 60,           # 1 tiếng: Cafe acoustic hoặc mở đêm
            "hotel": 0,           # 0
        }

        self.penalty_map = {
            "hotel": 50,
            
            # Key Visuals - Linh hồn của Nightlife
            "bar": 600,           # Ưu tiên cao nhất cho nightlife
            "walking street": 550, # Trung tâm của sự náo nhiệt
            "night market": 500,   # Ẩm thực và không khí đêm
            
            # Alternative Options (Lựa chọn thay thế)
            "camping": 400,        # Một dạng nightlife chill riêng biệt (Glamping)
            
            # Support Nodes
            "restaurant": 250,     # Cần thiết nhưng xếp sau chỗ chơi
            "cafe": 200,           # Chỗ nghỉ chân hoặc tăng 2 nhẹ nhàng
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # LOGIC DUY NHẤT: Ưu tiên "Không khí sôi động"
        # Bar hoặc Phố đi bộ là những nơi định hình rõ nhất trải nghiệm Nightlife
        if categories:
            if "bar" in categories or "walking street" in categories:
                base = int(base * 1.3) # Tăng 30% để đảm bảo lịch trình "vui tới bến"
                
        return base