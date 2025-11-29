from app.tag_rules.base_profile import BaseProfile

class HistoryProfile(BaseProfile):
    """
    Cấu hình cho loại hình du lịch Văn hóa - Lịch sử (History).
    Chiến lược: "Slow Travel" - Đi chậm, tìm hiểu sâu.
    Ưu tiên các địa điểm mang tính di sản, bảo tàng và kiến trúc cổ.
    """
    def __init__(self):
        super().__init__()

        # --- Quy định thời gian (phút) ---
        self.service_time_map = {
            "citadel/palace": 150,      # 2.5 tiếng: Đại nội/Cung điện (Rộng, đi bộ nhiều)
            "museum": 120,              # 2 tiếng: Bảo tàng (Đọc thông tin, xem hiện vật)
            "old battlefield": 90,      # 1.5 tiếng: Di tích chiến tranh
            "cultural performance": 90, # 1.5 tiếng: Xem show văn hóa/múa rối
            "church/temple/pagoda": 60, # 1 tiếng: Thăm viếng tôn giáo
            
            # Dịch vụ phụ trợ
            "restaurant": 90,           # 1.5 tiếng: Ăn uống từ tốn, thưởng thức ẩm thực
            "cafe": 45,                 # 45p: Cafe nghỉ chân/ngắm phố cổ
            "hotel": 0
        }

        # --- Trọng số ưu tiên (Penalty) ---
        self.penalty_map = {
            "hotel": 99999,
            
            # Core Activities (Nhóm Chính - Không thể bỏ qua)
            "citadel/palace": 850,      # Quan trọng nhất
            "museum": 800,              # Rất quan trọng
            "old battlefield": 700,
            "church/temple/pagoda": 650,
            "cultural performance": 600,

            # Support Nodes (Nhóm Phụ)
            # Restaurant giữ ở mức 400 (cao hơn Amusement) vì ẩm thực là một phần của văn hóa
            "restaurant": 400,
            "cafe": 150,
        }

    def get_penalty(self, categories, rating=None):
        base = super().get_penalty(categories, rating)
        
        # Logic: Ưu tiên địa điểm nổi tiếng (Rating cao)
        # Khách lịch sử thường thích đến những nơi "Must-go" đã được kiểm chứng
        if rating and rating >= 4.5:
            base = int(base * 1.2)
            
        return base