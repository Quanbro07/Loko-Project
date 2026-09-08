from app.tag_rules.base_profile import BaseProfile

class PhotographProfile(BaseProfile):
    """
    Cấu hình cho Nhiếp ảnh/Sống ảo (Photography).
    Chiến lược: "Visual Impact".
    Ưu tiên: Các điểm có khung cảnh đẹp (Viewpoint, Vườn hoa) và Kiến trúc độc đáo (Citadel, Temple).
    """
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            # Nhóm Landscape (Thiên nhiên) - Cần nhiều thời gian căn góc/di chuyển
            "island": 240,          # 4 tiếng
            "mountain": 180,        # 3 tiếng: Trekking & chụp cảnh hùng vĩ
            "waterfall": 150,       # 2.5 tiếng: Phơi sáng thác nước
            "flower field/garden": 120, # 2 tiếng: Rất tốn thời gian tạo dáng
            "beach": 120,           # 2 tiếng
            "river": 90,
            
            # Nhóm Architecture (Kiến trúc)
            "citadel/palace": 150,  # 2.5 tiếng: Không gian rộng, nhiều chi tiết
            "church/temple/pagoda": 90, # 1.5 tiếng
            "viewpoint": 60,        # 1 tiếng: Chụp toàn cảnh nhanh gọn
            
            # Nhóm Service (Dịch vụ)
            "resort": 120,          # Vào chụp check-in khuôn viên
            "restaurant": 90,
            "cafe": 90,             # Cafe check-in cần thời gian lâu hơn uống cafe thường
            "homestay": 60,
            "hotel": 0,
        }

        self.penalty_map = {
            "hotel": 50,
            
            # Key Visuals - Những "Mỏ vàng" của nhiếp ảnh
            "viewpoint": 600,           # Góc nhìn bao quát (Best for photo)
            "flower field/garden": 600, # Màu sắc rực rỡ
            "citadel/palace": 550,      # Kiến trúc cổ kính, hoành tráng
            "waterfall": 550,           # Cảnh quan ấn tượng
            
            # Secondary Subjects
            "mountain": 500,
            "church/temple/pagoda": 500,
            "island": 450,
            "beach": 450,
            
            # Support Nodes
            "cafe": 350,        # Cao hơn Restaurant vì Cafe thường decor đẹp hơn để chụp
            "resort": 300,
            "restaurant": 200,
            "river": 200,
            "homestay": 150,
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # LOGIC DUY NHẤT: Ưu tiên "Background Đẹp"
        # Vườn hoa hoặc Cung điện/Di tích là những nơi đảm bảo có ảnh đẹp mang về
        if categories:
            if "flower field/garden" in categories or "citadel/palace" in categories:
                base = int(base * 1.3) # Tăng 30% cho các điểm "siêu ăn ảnh" này
                
        return base