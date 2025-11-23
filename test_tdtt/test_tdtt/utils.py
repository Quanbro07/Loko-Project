# utils.py
from config import DAY_START_TIME, DAY_END_TIME_BASE, MAX_DAY_DURATION

def time_to_minutes(t):
    """Helper chuyển chuỗi giờ 'HH:MM' thành phút trong ngày."""
    if not t or not isinstance(t, str) or t == "N/A":
        return None
    try:
        parts = t.replace('.', ':').split(':')
        if len(parts) == 2:
            h, m = parts
            return int(h) * 60 + int(m)
        elif len(parts) == 1:
            return int(parts[0]) * 60
    except ValueError:
        pass
    return None

def parse_operating_hours(open_str, close_str, service_time):
    """
    Tính toán cửa sổ thời gian (Time Window) cho Solver dựa trên giờ mở/đóng cửa.
    Input: Chuỗi '08:00', '17:00'
    Output: [start_min, end_min] (tương đối so với DAY_START_TIME)
    """
    open_t = time_to_minutes(open_str)
    close_t = time_to_minutes(close_str)

    # --- Fallback nếu dữ liệu thiếu ---
    if open_t is None:
        open_t = DAY_START_TIME
    if close_t is None:
        close_t = DAY_END_TIME_BASE

    # --- Giới hạn hợp lệ (quy đổi về phút bắt đầu từ 0 của lịch trình) ---
    # start: Phút sớm nhất có thể đến (tính từ lúc bắt đầu ngày)
    start = max(0, open_t - DAY_START_TIME)
    
    # end: Phút muộn nhất phải rời đi
    end = min(close_t - DAY_START_TIME, MAX_DAY_DURATION)

    # Đảm bảo cửa sổ thời gian đủ cho service_time
    if end - start < service_time:
        end = start + service_time
    
    # Đảm bảo end không vượt quá giới hạn ngày tối đa
    if end > MAX_DAY_DURATION:
        end = MAX_DAY_DURATION

    return [start, end]

def minutes_to_str(mins):
    """Định dạng thời gian HH:MM từ số phút trong ngày du lịch."""
    total = DAY_START_TIME + mins
    h, m = divmod(total, 60)
    h = h % 24
    return f"{int(h):02d}:{int(m):02d}"