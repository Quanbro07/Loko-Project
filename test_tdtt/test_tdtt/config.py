# config.py
import os

ATTRACTIONS_FILE = 'attractions_with_tags.json'
TIME_MATRIX_FILE = 'time_matrix.txt'

END_TIME_FLEX_MINS = 20  # Biên độ linh hoạt cố định 20 phút
_SETUP_DONE = False

# Khởi tạo biến
_DAY_START_TIME = None
_DAY_END_TIME_BASE = None

# --- CÁC BIẾN NÀY SẼ ĐƯỢC SET UP BỞI HÀM BÊN DƯỚI ---
DAY_START_TIME = None
DAY_END_TIME_BASE = None 
DAY_END_TIME = None      
MAX_DAY_DURATION = None  
LUNCH_START_MINS = None
LUNCH_END_MINS = None
DINNER_START_MINS = None # <-- BIẾN CÒN THIẾU
DINNER_END_MINS = None   # <-- BIẾN CÒN THIẾU

# Giảm hình phạt ăn sai giờ (để ưu tiên ăn hơn là bỏ bữa)
LUNCH_PENALTY = 150 
# ---

def _time_str_to_minutes(time_str):
    """
    Chuyển chuỗi giờ 'HH:MM' hoặc 'HH' thành phút trong ngày.
    Chấp nhận '24' hoặc '0' (cho 00:00).
    """
    if not time_str or not time_str.strip():
        return None
    try:
        time_str = time_str.strip()
        if ':' in time_str:
            parts = time_str.split(':')
            hours = int(parts[0])
            minutes = int(parts[1]) if len(parts) > 1 else 0
        else:
            hours = int(time_str)
            minutes = 0
        
        if (0 <= hours <= 23 and 0 <= minutes < 60) or (hours == 24 and minutes == 0):
            if hours == 24:
                return 1440 # 24 * 60
            return hours * 60 + minutes
        else:
            return None
    except (ValueError, IndexError):
        return None

def _setup_day_time():
    """Hàm hỏi người dùng nhập giờ từ bàn phím (chỉ chạy 1 lần)."""
    global _DAY_START_TIME, _DAY_END_TIME_BASE, _SETUP_DONE
    
    if _SETUP_DONE:
        return
    
    _SETUP_DONE = True
    
    env_start = os.getenv('DAY_START_TIME_MIN')
    env_end = os.getenv('DAY_END_TIME_MIN')
    if env_start and env_end:
        _DAY_START_TIME = int(env_start)
        _DAY_END_TIME_BASE = int(env_end)
        if _DAY_END_TIME_BASE == 0 or _DAY_END_TIME_BASE == 1440:
             _DAY_END_TIME_BASE = 1440
        print(f"✓ Đã sử dụng giờ từ biến môi trường: Bắt đầu {_DAY_START_TIME//60:02d}:{_DAY_START_TIME%60:02d}, Kết thúc {_DAY_END_TIME_BASE//60%24:02d}:{_DAY_END_TIME_BASE%60:02d}")
        _calculate_derived_values()
        return
    
    print("\n" + "="*60)
    print("📅 THIẾT LẬP THỜI GIAN HOẠT ĐỘNG")
    print("="*60)
    print("Nhấn Enter để sử dụng giá trị mặc định trong ngoặc vuông [ ]")
    print("Bạn có thể nhập 0:00, 24:00 hoặc 24 cho nửa đêm.")
    print("Nếu Giờ kết thúc < Giờ bắt đầu, hệ thống sẽ hiểu là qua ngày hôm sau.")
    print()
    
    while _DAY_START_TIME is None:
        start_input = input("Nhập giờ bắt đầu hoạt động (HH:MM hoặc HH) [Mặc định: 8:00]: ").strip()
        if not start_input:
            _DAY_START_TIME = 8 * 60
            break
        _DAY_START_TIME = _time_str_to_minutes(start_input)
        if _DAY_START_TIME is None or _DAY_START_TIME == 1440:
            print("❌ Định dạng không hợp lệ! Vui lòng nhập lại (ví dụ: 8:00 hoặc 8)")
            _DAY_START_TIME = None
    
    while _DAY_END_TIME_BASE is None:
        end_input = input("Nhập giờ kết thúc hoạt động (HH:MM hoặc HH) [Mặc định: 22:00]: ").strip()
        if not end_input:
            _DAY_END_TIME_BASE = 22 * 60
            break
        
        _DAY_END_TIME_BASE = _time_str_to_minutes(end_input)
        
        if _DAY_END_TIME_BASE is None:
            print("❌ Định dạng không hợp lệ! Vui lòng nhập lại (ví dụ: 22:00 hoặc 24)")
        else:
            if _DAY_END_TIME_BASE == 0:
                _DAY_END_TIME_BASE = 1440
                print("ℹ️  Đã hiểu là 24:00 (00:00 hôm sau).")
            # Xử lý logic qua ngày hôm sau (ví dụ: 8:00 -> 3:00)
            elif _DAY_END_TIME_BASE <= _DAY_START_TIME:
                print(f"ℹ️  Đã hiểu là {end_input} sáng hôm sau.")
                _DAY_END_TIME_BASE += 1440
    
    start_str = f"{_DAY_START_TIME//60:02d}:{_DAY_START_TIME%60:02d}"
    end_str = f"{_DAY_END_TIME_BASE//60%24:02d}:{_DAY_END_TIME_BASE%60:02d}"
    print(f"\n✓ Đã thiết lập: Bắt đầu {start_str}, Kết thúc {end_str} (+{END_TIME_FLEX_MINS} phút linh hoạt)")
    print("="*60 + "\n")
    
    _calculate_derived_values()

def _calculate_derived_values():
    """Tính toán các giá trị phụ thuộc (được gọi sau khi _setup_day_time)."""
    # Khai báo các biến global MÀ HÀM NÀY SẼ GÁN GIÁ TRỊ
    global DAY_START_TIME, DAY_END_TIME_BASE, DAY_END_TIME, MAX_DAY_DURATION, LUNCH_START_MINS, LUNCH_END_MINS, DINNER_START_MINS, DINNER_END_MINS
    
    # (Đã xóa khối 'if' block gây lỗi UnboundLocalError)

    DAY_START_TIME = _DAY_START_TIME
    DAY_END_TIME_BASE = _DAY_END_TIME_BASE
    DAY_END_TIME = DAY_END_TIME_BASE + END_TIME_FLEX_MINS
    MAX_DAY_DURATION = DAY_END_TIME - DAY_START_TIME
    
    # Mở rộng khung giờ ăn (11:00-14:00 và 18:00-21:00)
    LUNCH_START_MINS = (11 * 60 + 0) - DAY_START_TIME
    LUNCH_END_MINS = (14 * 60 + 0) - DAY_START_TIME
    DINNER_START_MINS = (18 * 60 + 0) - DAY_START_TIME
    DINNER_END_MINS = (21 * 60 + 0) - DAY_START_TIME

# Tự động gọi setup khi import (chỉ chạy 1 lần)
_setup_day_time()