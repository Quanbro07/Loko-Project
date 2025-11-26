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
        
        # 1. Thu thập tất cả các mốc thời gian hợp lệ từ tags
        valid_times = []
        for t in categories:
            if t in self.service_time_map:
                valid_times.append(self.service_time_map[t])
        
        # Nếu không có tag nào khớp map, trả về mặc định
        if not valid_times:
            return 60
            
        # 2. Tính toán Logic Flex (Linh hoạt)
        max_time = max(valid_times)
        min_time = min(valid_times)
        
        # Nếu các tag có thời gian đồng nhất hoặc chỉ có 1 tag -> Trả về Max
        if len(valid_times) == 1 or max_time == min_time:
            return max_time
            
        # LOGIC FLEX: "Ưu tiên thời gian dài, nhưng vẫn se đi ngắn được"
        # Thay vì lấy max_time cứng nhắc, ta tính giá trị "thỏa hiệp" lệch về phía Max.
        # Công thức: Max - (Khoảng chênh lệch * Hệ số co giãn)
        # Hệ số 0.3 (30%) giúp giảm bớt sự cứng nhắc của MaxTime mà không làm mất đi tính chất "đi lâu".
        
        # Ví dụ: Snack (45p) vs Night Market (150p). Diff = 105.
        # Flex Time = 150 - (105 * 0.3) = 118 phút.
        # -> Dễ xếp lịch hơn 150 phút, nhưng vẫn dài hơn hẳn 45 phút.
        
        flex_factor = 0.3 
        flex_time = max_time - ((max_time - min_time) * flex_factor)
        
        # Đảm bảo thời gian không bao giờ nhỏ hơn min_time (dù toán học đã đảm bảo)
        return int(max(flex_time, min_time))

    def get_penalty(self, categories, rating=None):
        categories = [t.lower() for t in categories or []]
        
        base = 100 
        found = False
        
        # Penalty vẫn giữ logic lấy cái đầu tiên tìm thấy hoặc ưu tiên
        # (Có thể nâng cấp lên max penalty nếu muốn ưu tiên cực đoan)
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