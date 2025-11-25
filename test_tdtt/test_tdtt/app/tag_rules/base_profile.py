class BaseProfile:
    """
    Lớp cơ sở cho mọi loại hình du lịch.
    """

    def __init__(self):
        self.service_time_map = {}
        self.penalty_map = {}
        self.priority_boost = {}

    def get_service_time(self, categories):
        categories = [t.lower() for t in categories or []]
        for t in categories:
            if t in self.service_time_map:
                return self.service_time_map[t]
        return 60 

    def get_penalty(self, categories, rating=None):
        categories = [t.lower() for t in categories or []]
        
        # Base mặc định nên thấp thôi, để tránh việc các node rác (không tag) được chọn bừa
        base = 100 
        found = False
        
        for t in categories:
            if t in self.penalty_map:
                base = self.penalty_map[t]
                found = True
                break
        
        # Nếu không tìm thấy tag trong map, nhưng có tag, cho điểm trung bình
        if not found and categories:
            base = 150
        
        if rating is not None:
            try:
                r = float(rating)
                # Rating tốt (4.0-5.0) sẽ tăng điểm lên chút
                mult = 0.8 + (r / 5.0) * 0.4 
                base = int(max(5, base * mult))
            except Exception:
                pass
        return base

    def adjust_by_preference(self, penalty, preferred_categories, categories):
        # Logic cũ, vẫn giữ lại cho các trường hợp phụ
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