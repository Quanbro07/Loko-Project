from app.tag_rules.base_profile import BaseProfile

class FoodProfile(BaseProfile):
    """
    Cấu hình cho loại hình Ẩm thực (Food Tour).
    Chiến lược: "Eat like a local".
    Ưu tiên: Chợ đêm, Đặc sản vùng miền (Speciality) và các món ăn vặt (Snack).
    """
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            # Nhóm Key Experience (Trải nghiệm chính)
            "night market": 150, # 2.5 tiếng: Vừa đi dạo vừa ăn nhiều món
            "restaurant": 90,    # 1.5 tiếng: Ăn chính nhanh gọn để dành bụng đi tiếp
            "market": 90,        # 1.5 tiếng: Chợ truyền thống (thường có Food court)
            
            # Nhóm Quick Bites (Ăn nhanh/Nghỉ chân)
            "speciality": 60,    # 1 tiếng: Thưởng thức món đặc sản cụ thể
            "cafe": 60,          # 1 tiếng: Nghỉ chân
            "snack": 45,         # 45 phút: Ăn vặt lề đường
            
            "hotel": 0,
        }

        self.penalty_map = {
            "hotel": 99999, # Loại bỏ
            
            # Key Visuals - Food Tour bắt buộc phải có những chỗ này
            "night market": 600, # Trùm cuối của food tour
            "speciality": 550,   # Đặc sản vùng miền (Must-try)
            "restaurant": 400,   # Ăn no
            
            # Support Nodes
            "snack": 350,        # Rất khuyến khích ăn vặt
            "market": 300,       # Chợ
            "cafe": 200,         # Thấp hơn ăn uống
            
            # Giảm thiểu các điểm không liên quan đến ăn uống
            "amusement/water park": 50, 
            "zoo": 50
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # LOGIC DUY NHẤT: Ưu tiên "Local Flavor"
        # Đi Food Tour quan trọng nhất là ăn món "Đặc sản" hoặc không khí "Chợ đêm"
        if categories:
            if "speciality" in categories or "night market" in categories:
                base = int(base * 1.3) # Tăng mạnh (30%) để ưu tiên các trải nghiệm này
                
        return base