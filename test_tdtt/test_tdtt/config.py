import os

ATTRACTIONS_FILE = 'attractions_with_tags.json'
TIME_MATRIX_FILE = 'time_matrix.txt'

# Các biến giờ có thể chỉnh (có thể override qua ENV)
# Ví dụ ENV: DAY_START_TIME_MIN=480, DAY_END_TIME_MIN=1320, END_TIME_FLEX_MINS=20
DAY_START_TIME = int(os.getenv('DAY_START_TIME_MIN', 8 * 60))
_DAY_END_TIME_BASE = int(os.getenv('DAY_END_TIME_MIN', 22 * 60))
END_TIME_FLEX_MINS = int(os.getenv('END_TIME_FLEX_MINS', 20))  # Cho phép kết thúc lệch 20 phút

# Dùng giờ kết thúc có cộng biên độ linh hoạt
DAY_END_TIME = _DAY_END_TIME_BASE + END_TIME_FLEX_MINS

# Thời lượng tối đa trong ngày (đã tính biên độ 20 phút)
MAX_DAY_DURATION = DAY_END_TIME - DAY_START_TIME

# Cửa sổ bữa trưa tính theo mốc bắt đầu ngày
LUNCH_START_MINS = (11 * 60 + 30) - DAY_START_TIME
LUNCH_END_MINS = (13 * 60 + 30) - DAY_START_TIME
LUNCH_PENALTY = 500