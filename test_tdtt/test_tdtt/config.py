import os

ATTRACTIONS_FILE = 'attractions_with_tags.json'
TIME_MATRIX_FILE = 'time_matrix.txt'

# Các biến giờ có thể chỉnh (có thể override qua ENV hoặc input)
_DAY_START_TIME = None
_DAY_END_TIME_BASE = None
END_TIME_FLEX_MINS = 20  # Biên độ linh hoạt cố định 20 phút
_SETUP_DONE = False

def _time_str_to_minutes(time_str):
    """Chuyển chuỗi giờ 'HH:MM' hoặc 'HH' thành phút trong ngày."""
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
        
        if 0 <= hours < 24 and 0 <= minutes < 60:
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
    
    # Ưu tiên 1: Kiểm tra biến môi trường
    if os.getenv('DAY_START_TIME_MIN') and os.getenv('DAY_END_TIME_MIN'):
        _DAY_START_TIME = int(os.getenv('DAY_START_TIME_MIN', 8 * 60))
        _DAY_END_TIME_BASE = int(os.getenv('DAY_END_TIME_MIN', 22 * 60))
        print(f"✓ Đã sử dụng giờ từ biến môi trường: Bắt đầu {_DAY_START_TIME//60:02d}:{_DAY_START_TIME%60:02d}, Kết thúc {_DAY_END_TIME_BASE//60:02d}:{_DAY_END_TIME_BASE%60:02d}")
        return
    
    # Ưu tiên 2: Hỏi người dùng nhập từ bàn phím
    print("\n" + "="*60)
    print("📅 THIẾT LẬP THỜI GIAN HOẠT ĐỘNG")
    print("="*60)
    print("Nhấn Enter để sử dụng giá trị mặc định trong ngoặc vuông [ ]")
    print()
    
    # Hỏi giờ bắt đầu
    while _DAY_START_TIME is None:
        start_input = input("Nhập giờ bắt đầu hoạt động (HH:MM hoặc HH) [Mặc định: 8:00]: ").strip()
        if not start_input:
            _DAY_START_TIME = 8 * 60  # Mặc định 8:00
            break
        _DAY_START_TIME = _time_str_to_minutes(start_input)
        if _DAY_START_TIME is None:
            print("❌ Định dạng không hợp lệ! Vui lòng nhập lại (ví dụ: 8:00 hoặc 8)")
    
    # Hỏi giờ kết thúc (base, trước khi cộng biên độ)
    while _DAY_END_TIME_BASE is None:
        end_input = input("Nhập giờ kết thúc hoạt động (HH:MM hoặc HH) [Mặc định: 22:00]: ").strip()
        if not end_input:
            _DAY_END_TIME_BASE = 22 * 60  # Mặc định 22:00
            break
        _DAY_END_TIME_BASE = _time_str_to_minutes(end_input)
        if _DAY_END_TIME_BASE is None:
            print("❌ Định dạng không hợp lệ! Vui lòng nhập lại (ví dụ: 22:00 hoặc 22)")
        elif _DAY_END_TIME_BASE <= _DAY_START_TIME:
            start_str = f"{_DAY_START_TIME//60:02d}:{_DAY_START_TIME%60:02d}"
            print(f"❌ Giờ kết thúc phải sau giờ bắt đầu ({start_str})! Vui lòng nhập lại.")
            _DAY_END_TIME_BASE = None
    
    start_str = f"{_DAY_START_TIME//60:02d}:{_DAY_START_TIME%60:02d}"
    end_str = f"{_DAY_END_TIME_BASE//60:02d}:{_DAY_END_TIME_BASE%60:02d}"
    print(f"\n✓ Đã thiết lập: Bắt đầu {start_str}, Kết thúc {end_str} (+{END_TIME_FLEX_MINS} phút linh hoạt)")
    print("="*60 + "\n")

# Tự động gọi setup khi import (chỉ chạy 1 lần)
_setup_day_time()

def _calculate_derived_values():
    """Tính toán các giá trị phụ thuộc từ _DAY_START_TIME và _DAY_END_TIME_BASE"""
    global DAY_START_TIME, DAY_END_TIME_BASE, DAY_END_TIME, MAX_DAY_DURATION, LUNCH_START_MINS, LUNCH_END_MINS
    DAY_START_TIME = _DAY_START_TIME
    DAY_END_TIME_BASE = _DAY_END_TIME_BASE  # Giờ kết thúc base (không có biên độ)
    DAY_END_TIME = _DAY_END_TIME_BASE + END_TIME_FLEX_MINS  # Giờ kết thúc với biên độ
    MAX_DAY_DURATION = DAY_END_TIME - DAY_START_TIME  # Thời lượng tối đa (có biên độ, cho solver)
    LUNCH_START_MINS = (11 * 60 + 30) - DAY_START_TIME
    LUNCH_END_MINS = (13 * 60 + 30) - DAY_START_TIME

# Tính toán các giá trị công khai (sau khi đã setup)
_calculate_derived_values()

# Các biến công khai
# DAY_START_TIME, DAY_END_TIME_BASE, DAY_END_TIME, MAX_DAY_DURATION, LUNCH_START_MINS, LUNCH_END_MINS đã được tính ở trên
LUNCH_PENALTY = 500
