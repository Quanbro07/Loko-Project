import re
from config import DAY_START_TIME, DAY_END_TIME

# --- Thời gian phục vụ (service time) ước lượng theo tag ---
def get_service_time(tags):
    if not tags:
        return 60
    if any(t in tags for t in ["restaurant", "cafe", "food", "street-food"]):
        return 60
    if any(t in tags for t in ["museum", "temple", "pagoda", "cathedral"]):
        return 90
    if any(t in tags for t in ["shopping", "market"]):
        return 75
    if any(t in tags for t in ["amusement", "park", "zoo"]):
        return 120
    if any(t in tags for t in ["trekking", "mountain", "waterfall", "nature"]):
        return 150
    return 60


# --- Chuyển giờ mở cửa thành khoảng thời gian hoạt động (phút trong ngày) ---
def parse_operating_hours(hours_data, service_time):
    """
    Chuyển giờ mở cửa thành khoảng thời gian hoạt động (phút tính từ đầu ngày).
    - Có thể nhận string ("08:00-17:00") hoặc dict {"open": "08:00", "close": "17:00"}.
    """
    def time_to_minutes(t):
        if not t or not isinstance(t, str):
            return None
        parts = t.replace('.', ':').split(':')
        if len(parts) == 1:
            return int(parts[0]) * 60
        if len(parts) == 2:
            h, m = parts
            return int(h) * 60 + int(m)
        return None

    # --- Nếu không có dữ liệu ---
    if not hours_data:
        return [0, DAY_END_TIME - DAY_START_TIME]

    # --- Nếu là dict ---
    if isinstance(hours_data, dict):
        open_t = time_to_minutes(hours_data.get("open"))
        close_t = time_to_minutes(hours_data.get("close"))
    # --- Nếu là string ---
    elif isinstance(hours_data, str):
        import re
        match = re.findall(r"(\d{1,2}:?\d{0,2})", hours_data)
        if len(match) >= 2:
            open_t = time_to_minutes(match[0])
            close_t = time_to_minutes(match[1])
        else:
            open_t, close_t = None, None
    else:
        open_t, close_t = None, None

    # --- Fallback ---
    if open_t is None:
        open_t = DAY_START_TIME
    if close_t is None:
        close_t = DAY_END_TIME

    # --- Giới hạn hợp lệ ---
    start = max(0, open_t - DAY_START_TIME)
    end = min(close_t - DAY_START_TIME, DAY_END_TIME - DAY_START_TIME)

    if end - start < service_time:
        end = start + service_time + 30

    return [start, end]



# --- Tính penalty dựa trên độ quan trọng (tags) ---
def get_importance_penalty(tags):
    if not tags:
        return 500
    if "hotel" in tags:
        return 10
    if any(t in tags for t in ["restaurant", "food"]):
        return 100
    if any(t in tags for t in ["amusement", "park", "zoo"]):
        return 300
    if any(t in tags for t in ["museum", "temple"]):
        return 400
    if any(t in tags for t in ["nature", "mountain", "island", "beach"]):
        return 250
    return 500


# --- Định dạng thời gian HH:MM ---
def format_time(mins):
    total = DAY_START_TIME + mins
    h, m = divmod(total, 60)
    return f"{h:02d}:{m:02d}"
