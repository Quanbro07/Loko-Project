# data_loader.py
import json, math, sys
from config import *
from utils import parse_operating_hours

def create_instance_from_files(profile, preferred_tags=None):
    """
    Load attraction data và tạo instance solver theo profile được chọn.
    """
    print("Đang tải dữ liệu...")
    preferred_tags = preferred_tags or []
    
    try:
        with open(ATTRACTIONS_FILE, 'r', encoding='utf-8') as f:
            locations = json.load(f)
    except Exception as e:
        print(f"❌ Lỗi đọc attractions: {e}")
        sys.exit(1)

    matrix = []
    try:
        with open(TIME_MATRIX_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                # Làm tròn giây lên phút
                row = [math.ceil(int(v) / 60) for v in line.strip().split()]
                matrix.append(row)
    except Exception as e:
        print(f"❌ Lỗi đọc time matrix: {e}")
        sys.exit(1)

    if len(matrix) != len(locations):
        print(f"⚠️ Dữ liệu không khớp: {len(locations)} điểm nhưng {len(matrix)} hàng ma trận.")
        sys.exit(1)

    # --- Yêu cầu: chọn khách sạn tốt nhất làm depot ---
    hotel_indices = [i for i, loc in enumerate(locations) if "hotel" in loc.get("tags", [])]
    if hotel_indices:
        # Chọn hotel có rating cao nhất
        hotel_index = max(hotel_indices, key=lambda i: locations[i].get("rating", 0))
    else:
        hotel_index = 0 # Fallback
        print("⚠️ Không tìm thấy khách sạn, mặc định chọn điểm 0 làm depot.")

    # --- Sắp xếp lại list, đưa hotel_index về vị trí 0 ---
    reorder = [hotel_index] + [i for i in range(len(locations)) if i != hotel_index]
    locs = [locations[i] for i in reorder]
    mat = [[matrix[i][j] for j in reorder] for i in reorder]

    service_times, time_windows, penalties = [], [], []
    lunch_nodes, night_nodes = [], []

    for i, loc in enumerate(locs):
        tags = [t.lower() for t in loc.get("tags", [])]
        rating = loc.get("rating", None)
        
        # 1. Lấy service time từ profile
        st = profile.get_service_time(tags)

        # 2. Lấy time window
        op = loc.get("operating_hours", None)
        tw = parse_operating_hours(op, st)
        if i == 0:  # hotel (depot)
            tw = [0, MAX_DAY_DURATION] # Luôn mở

        # 3. Lấy penalty (độ quan trọng)
        base_penalty = profile.get_penalty(tags, rating)
        
        # 4. Điều chỉnh penalty theo preference của user
        base_penalty = profile.adjust_by_preference(base_penalty, preferred_tags, tags)

        # 5. Boost cho các tag đặc biệt (vd: speciality)
        boost_multiplier = profile.boost_priority(tags)
        base_penalty = int(base_penalty * boost_multiplier)

        # --- Giữ khách sạn chính, tránh các khách sạn khác ---
        if "hotel" in tags:
            if i == 0:
                base_penalty = 0 # Depot không có penalty
            else:
                base_penalty = 1 

        service_times.append(st)
        time_windows.append(tw)
        penalties.append(base_penalty)

        # --- Thu thập các node đặc biệt cho FoodSolver ---
        if "restaurant" in tags:
            lunch_nodes.append(i)
        if any(nt in tags for nt in ["night market", "night-market", "nightmarket"]):
            night_nodes.append(i)

    instance = {
        "locations_data": locs,
        "time_matrix": mat,
        "service_time": service_times,
        "time_windows": time_windows,
        "penalties": penalties,
        "lunch_nodes": lunch_nodes,
        "night_nodes": night_nodes,
        "num_places": len(locs),
        "depot": 0
    }
    print(f"✅ Instance ready: {len(locs)} địa điểm, depot = '{locs[0].get('title', 'Khách sạn')}'")
    return instance