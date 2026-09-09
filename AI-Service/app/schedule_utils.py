import math

def time_str_to_minutes(time_str: str):
    """
    Chuyển đổi HH:MM thành số phút trong ngày.
    Trả về None nếu chuỗi rỗng hoặc không hợp lệ.
    Trả về 0 nếu là "00:00".
    """
    if not time_str or not isinstance(time_str, str):
        return None
    try:
        parts = time_str.strip().split(':')
        h = int(parts[0])
        m = int(parts[1]) if len(parts) > 1 else 0
        return h * 60 + m
    except ValueError:
        return None

def minutes_to_str(mins: int, day_start_time_mins: int, round_mode=None) -> str:
    """
    Chuyển đổi số phút (tương đối so với start_time) thành HH:MM thực tế.
    """
    total_mins = day_start_time_mins + mins
    
    if round_mode == 'up':
        # Làm tròn LÊN 5 phút (08:01 -> 08:05)
        total_mins = math.ceil(total_mins / 5) * 5
    elif round_mode == 'down':
        # Làm tròn XUỐNG 5 phút (08:04 -> 08:00)
        total_mins = math.floor(total_mins / 5) * 5
        
    h, m = divmod(total_mins, 60)
    h_display = h % 24 # Hiển thị theo khung 24h (25:00 -> 01:00)
    
    return f"{int(h_display):02d}:{int(m):02d}"

def parse_operating_hours(open_str, close_str, service_time, day_start_mins, day_end_mins, max_day_duration):
    """
    Tính Time Window [start, end] tương đối so với day_start_mins.
    LOGIC STRICT: Đảm bảo khách phải HOÀN THÀNH hoạt động trước giờ đóng cửa.
    """
    open_t = time_str_to_minutes(open_str)
    close_t = time_str_to_minutes(close_str)
    
    # 1. Heuristic: Nếu đóng 23:59 hoặc 00:00 -> Coi như mở xuyên đêm/24h
    if close_t is not None and (close_t == 1439 or close_t == 0):
        close_t = None 

    if open_t is None: open_t = day_start_mins
    if close_t is None: close_t = day_end_mins

    # 2. Xử lý qua đêm (vd mở 18:00, đóng 02:00 sáng hôm sau)
    if close_t < open_t:
        close_t += 1440
    
    # 3. Xử lý trường hợp đóng cửa sáng hôm sau nhưng tour bắt đầu muộn
    # Ví dụ: Tour bắt đầu 20:00, Quán đóng 02:00 sáng hôm sau (26:00)
    if close_t < day_start_mins:
        close_t += 1440

    # 4. Tính toán Window
    # start: Thời điểm sớm nhất có thể ĐẾN
    start = max(0, open_t - day_start_mins)
    
    # closing_limit: Thời điểm đóng cửa (tương đối)
    closing_limit = close_t - day_start_mins
    
    # end: Thời điểm muộn nhất có thể ĐẾN
    # Để đảm bảo: (Giờ đến + Thời gian chơi) <= Giờ đóng cửa
    # Ta phải lấy: Giờ đóng cửa - Thời gian chơi
    latest_arrival_allowed = min(closing_limit, max_day_duration) - service_time

    # Nếu khoảng thời gian mở cửa quá ngắn (< service_time) hoặc giờ đóng cửa sớm hơn giờ mở cửa
    # -> Node này không khả thi
    if latest_arrival_allowed < start:
        return [0, 0] 

    return [int(start), int(latest_arrival_allowed)]