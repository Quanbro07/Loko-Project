# utils.py
import re
from config import DAY_START_TIME, DAY_END_TIME, MAX_DAY_DURATION

def time_to_minutes(t):
    """Helper chuyển chuỗi giờ 'HH:MM' thành phút trong ngày."""
    if not t or not isinstance(t, str):
        return None
    parts = t.replace('.', ':').split(':')
    if len(parts) == 1:
        try: return int(parts[0]) * 60
        except ValueError: return None
    if len(parts) == 2:
        try:
            h, m = parts
            return int(h) * 60 + int(m)
        except ValueError: return None
    return None

def parse_operating_hours(hours_data, service_time):
    """
    Chuyển giờ mở cửa thành khoảng thời gian hoạt động (phút tính từ DAY_START_TIME).
    - Có thể nhận string ("08:00-17:00") hoặc dict {"open": "08:00", "close": "17:00"}.
    """
    open_t, close_t = None, None

    # --- Nếu là dict ---
    if isinstance(hours_data, dict):
        open_t = time_to_minutes(hours_data.get("open"))
        close_t = time_to_minutes(hours_data.get("close"))
    # --- Nếu là string ---
    elif isinstance(hours_data, str):
        match = re.findall(r"(\d{1,2}:?\d{0,2})", hours_data)
        if len(match) >= 2:
            open_t = time_to_minutes(match[0])
            close_t = time_to_minutes(match[1])

    # --- Fallback ---
    if open_t is None:
        open_t = DAY_START_TIME
    if close_t is None:
        close_t = DAY_END_TIME

    # --- Giới hạn hợp lệ (quy đổi về phút bắt đầu từ 0 của ngày du lịch) ---
    start = max(0, open_t - DAY_START_TIME)
    end = min(close_t - DAY_START_TIME, MAX_DAY_DURATION)

    # Đảm bảo cửa sổ thời gian đủ cho service_time
    if end - start < service_time:
        end = start + service_time
    
    # Đảm bảo end không vượt quá giới hạn ngày
    if end > MAX_DAY_DURATION:
        end = MAX_DAY_DURATION

    return [start, end]


def minutes_to_str(mins):
    """Định dạng thời gian HH:MM từ số phút trong ngày du lịch."""
    total = DAY_START_TIME + mins
    h, m = divmod(total, 60)
    h = h % 24
    return f"{int(h):02d}:{int(m):02d}"