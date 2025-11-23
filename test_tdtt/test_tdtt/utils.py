# utils.py
import re
import math # <-- THÊM
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
    Tính toán cửa sổ thời gian (Time Window) cho Solver.
    """
    open_t = time_to_minutes(open_str)
    close_t = time_to_minutes(close_str)

    if open_t is None:
        open_t = DAY_START_TIME
    if close_t is None:
        close_t = DAY_END_TIME_BASE

    start = max(0, open_t - DAY_START_TIME)
    end = min(close_t - DAY_START_TIME, MAX_DAY_DURATION)

    if end - start < service_time:
        end = start + service_time
    
    if end > MAX_DAY_DURATION:
        end = MAX_DAY_DURATION

    return [start, end]

def minutes_to_str(mins, round_mode=None):
    """
    Định dạng thời gian HH:MM từ số phút (tương đối so với DAY_START_TIME).
    
    Args:
        mins: Số phút tính từ lúc bắt đầu ngày du lịch.
        round_mode: 
            - 'up': Làm tròn LÊN (cho giờ bắt đầu - tránh xung đột).
            - 'down': Làm tròn XUỐNG (cho giờ kết thúc - tránh lố giờ).
            - None: Không làm tròn.
    """
    # 1. Tính tổng số phút tuyệt đối trong ngày (từ 00:00)
    total_mins = DAY_START_TIME + mins
    
    # 2. Xử lý làm tròn 5 phút
    if round_mode == 'up':
        # Ví dụ: 08:01 (481) -> 485 (08:05)
        total_mins = math.ceil(total_mins / 5) * 5
    elif round_mode == 'down':
        # Ví dụ: 08:59 (539) -> 535 (08:55)
        total_mins = math.floor(total_mins / 5) * 5
    
    # 3. Chuyển đổi ra giờ:phút
    h, m = divmod(total_mins, 60)
    h = h % 24 # Xử lý qua ngày hôm sau (24:00 -> 00:00)
    
    return f"{int(h):02d}:{int(m):02d}"