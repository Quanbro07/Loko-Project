# tag_rules/base_profile.py
class BaseProfile:
    """
    Lớp cơ sở cho mọi loại hình du lịch.
    Định nghĩa logic tính service_time, penalty và điều chỉnh theo rating / preference.
    """

    def __init__(self):
        self.service_time_map = {}
        self.penalty_map = {}
        self.priority_boost = {}

    # --- SERVICE TIME ---
    def get_service_time(self, tags):
        """Thời gian lưu trú tại điểm, dựa theo tag"""
        tags = [t.lower() for t in tags or []]
        for t in tags:
            if t in self.service_time_map:
                return self.service_time_map[t]
        return 60  # default 60 phút

    # --- PENALTY (mức phạt khi bỏ qua điểm đó) ---
    def get_penalty(self, tags, rating=None):
        """Penalty cơ bản cho điểm đến, điều chỉnh theo rating."""
        tags = [t.lower() for t in tags or []]
        base = 500 # Mặc định
        found = False
        for t in tags:
            if t in self.penalty_map:
                base = self.penalty_map[t]
                found = True
                break
        
        if not found and tags:
            base = 600 # Phạt cao hơn cho các tag không xác định
        
        # giảm penalty nếu rating cao (tức là quan trọng hơn, KHÔNG NÊN BỎ QUA)
        # -> Rating càng cao, penalty (phí bỏ qua) càng LỚN
        if rating is not None:
            try:
                r = float(rating)
                # Rating 5.0 -> x1.2 (penalty 200 -> 240)
                # Rating 3.0 -> x1.0 (penalty 200 -> 200)
                # Rating 1.0 -> x0.8 (penalty 200 -> 160)
                mult = 0.7 + (r / 5.0) * 0.5 
                base = int(max(5, base * mult))
            except Exception:
                pass
        return base

    # --- PREFERENCE (giảm penalty cho tag được chọn) ---
    def adjust_by_preference(self, penalty, preferred_tags, tags):
        """
        Nếu tag nằm trong preferred_tags, TĂNG MẠNH penalty (để không bị bỏ qua).
        """
        tags = [t.lower() for t in tags or []]
        preferred_tags = [t.lower() for t in preferred_tags or []]
        
        if any(t in preferred_tags for t in tags):
             # Tăng penalty (chi phí bỏ qua) -> khiến nó quan trọng hơn
            return int(penalty * 1.5)
        return penalty

    def boost_priority(self, tags):
        """
        Tăng nhẹ độ ưu tiên (tăng penalty) nếu tag đặc biệt (vd: speciality).
        """
        tags = [t.lower() for t in tags or []]
        for t in tags:
            if t in self.priority_boost:
                return self.priority_boost[t] # Trả về hệ số boost
        return 1.0