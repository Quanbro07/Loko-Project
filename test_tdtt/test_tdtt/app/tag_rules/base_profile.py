class BaseProfile:
    """
    Lớp cơ sở cho mọi loại hình du lịch.
    """

    def __init__(self):
        self.service_time_map = {}
        self.penalty_map = {}
        self.priority_boost = {}
        
        # --- CẤU HÌNH NHÂN KHẨU HỌC (DEMOGRAPHICS) ---
        # 1. Cấu hình cho TRẺ EM
        self.child_boost_tags = [
            "zoo", "amusement/water park", "aquarium", "snack", 
            "night market", "park", "camping"
        ]
        self.child_reduce_tags = [
            "nightlife", "bar", "pub", "club", "casino", 
            "cave", "old battlefield", "historical site", "diving", "museum"
        ]

        # 2. Cấu hình cho NGƯỜI LỚN TUỔI
        self.elder_boost_tags = [
            "cultural performance", "citadel/palace", "church/temple/pagoda", 
            "museum", "speciality", "flower", "ancient town", "history"
        ]
        self.elder_reduce_tags = [
            "mountain", "climbing", "adventure", "water park", 
            "diving", "nightlife", "bar", "pub", "theme park"
        ]

    def get_service_time(self, categories):
        categories = [t.lower() for t in categories or []]
        valid_times = []
        for t in categories:
            if t in self.service_time_map:
                valid_times.append(self.service_time_map[t])
        
        if not valid_times:
            return 60
            
        max_time = max(valid_times)
        min_time = min(valid_times)
        
        if len(valid_times) == 1 or max_time == min_time:
            return max_time
            
        flex_factor = 0.3 
        flex_time = max_time - ((max_time - min_time) * flex_factor)
        return int(max(flex_time, min_time))

    def get_penalty(self, categories, rating=None):
        categories = [t.lower() for t in categories or []]
        base = 100 
        found = False
        
        for t in categories:
            if t in self.penalty_map:
                base = self.penalty_map[t]
                found = True
                break
        
        if not found and categories:
            base = 150
        
        if rating is not None:
            try:
                r = float(rating)
                mult = 0.8 + (r / 5.0) * 0.4 
                base = int(max(5, base * mult))
            except Exception:
                pass
        return base

    def adjust_by_preference(self, penalty, preferred_categories, categories):
        categories = [t.lower() for t in categories or []]
        preferred_categories = [t.lower() for t in preferred_categories or []]
        
        if any(t in preferred_categories for t in categories):
            return int(penalty * 1.5)
        return penalty

    def boost_priority(self, categories):
        categories = [t.lower() for t in categories or []]
        for t in categories:
            if t in self.priority_boost:
                return self.priority_boost[t]
        return 1.0

    # --- HÀM MỚI ĐƯỢC THÊM VÀO ---
    def adjust_demographic_score(self, current_penalty, categories, is_children=False, is_elder=False):
        """
        Điều chỉnh điểm số (penalty/prize) dựa trên đối tượng tham gia.
        - Boost: Tăng điểm (nhân 1.5 - 2.0) -> Solver sẽ ưu tiên đi.
        - Reduce: Giảm điểm (nhân 0.3 - 0.5) -> Solver sẽ dễ bỏ qua.
        """
        if not categories:
            return current_penalty

        categories = [t.lower() for t in categories]
        new_penalty = float(current_penalty)

        # 1. Xử lý Trẻ em
        if is_children:
            # Nếu gặp tag trẻ em thích -> Tăng mạnh độ ưu tiên (x1.6)
            if any(tag in categories for tag in self.child_boost_tags):
                new_penalty *= 1.6
            
            # Nếu gặp tag trẻ em không hợp -> Giảm mạnh (x0.4)
            if any(tag in categories for tag in self.child_reduce_tags):
                new_penalty *= 0.4

        # 2. Xử lý Người lớn tuổi
        if is_elder:
            # Nếu gặp tag người già thích -> Tăng mạnh độ ưu tiên (x1.6)
            if any(tag in categories for tag in self.elder_boost_tags):
                new_penalty *= 1.6
            
            # Nếu gặp tag người già mệt/không thích -> Giảm mạnh (x0.3)
            # Lưu ý: Hệ số giảm của người già thấp hơn (0.3) vì sức khỏe quan trọng hơn sở thích
            if any(tag in categories for tag in self.elder_reduce_tags):
                new_penalty *= 0.3

        # Đảm bảo penalty không quá nhỏ (tránh lỗi 0) và làm tròn
        return int(max(10, new_penalty))