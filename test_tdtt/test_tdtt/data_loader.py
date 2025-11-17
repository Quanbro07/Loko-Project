# data_loader.py
import json, math, sys
from config import *
from utils import parse_operating_hours

def create_instance_from_files(profile, preferred_tags=None, penalty_overrides=None, force_hotel_idx=None):
    """
    Load data, áp dụng penalty_overrides, 
    chọn khách sạn tốt nhất (depot) hoặc "khóa" khách sạn đã chọn.
    """
    print("Đang tải dữ liệu...")
    preferred_tags = preferred_tags or []
    penalty_overrides = penalty_overrides or {} 
    
    try:
        with open(ATTRACTIONS_FILE, 'r', encoding='utf-8') as f:
            locations = json.load(f) # <-- Biến 'locations' được tải ở đây
    except Exception as e:
        print(f"❌ Lỗi đọc attractions: {e}")
        sys.exit(1)

    matrix = []
    try:
        with open(TIME_MATRIX_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                row = [math.ceil(int(v) / 60) for v in line.strip().split()]
                matrix.append(row)
    except Exception as e:
        print(f"❌ Lỗi đọc time matrix: {e}")
        sys.exit(1)

    if len(matrix) != len(locations):
        print(f"⚠️ Dữ liệu không khớp: {len(locations)} điểm nhưng {len(matrix)} hàng ma trận.")
        sys.exit(1)

    # --- Logic chọn Depot ---
    hotel_index = None
    if force_hotel_idx is not None:
        if 0 <= force_hotel_idx < len(locations):
            hotel_index = force_hotel_idx
        else:
            print(f"⚠️ Lỗi: force_hotel_idx ({force_hotel_idx}) không hợp lệ.")
            
    if hotel_index is None:
        hotel_penalties = {}
        for i, loc in enumerate(locations):
            tags = [t.lower() for t in loc.get("tags", [])]
            if "hotel" in tags or "hotels" in tags:
                if i in penalty_overrides:
                    hotel_penalties[i] = penalty_overrides[i]
                else:
                    hotel_penalties[i] = 10 
        
        if not hotel_penalties:
            print("⚠️ Không tìm thấy khách sạn nào.")
            # --- SỬA LỖI Ở ĐÂY (trả về 4 giá trị) ---
            return None, None, None, None 

        hotel_index = min(hotel_penalties, key=hotel_penalties.get)
    # ---

    # --- Logic lọc bỏ các KS khác ---
    all_hotel_indices = {
        i for i, loc in enumerate(locations) 
        if "hotel" in [t.lower() for t in loc.get("tags", [])] or 
           "hotels" in [t.lower() for t in loc.get("tags", [])]
    }
    reorder = [hotel_index] + [
        i for i in range(len(locations)) 
        if i not in all_hotel_indices
    ]
    # ---
    
    locs = [locations[i] for i in reorder]
    mat = [[matrix[i][j] for j in reorder] for i in reorder]
    node_map = {new_idx: original_idx for new_idx, original_idx in enumerate(reorder)}

    service_times, time_windows, penalties = [], [], []
    lunch_nodes, night_nodes = [], []

    for i, loc in enumerate(locs): # i = index MỚI (0 đến N)
        original_idx = node_map[i] # Lấy index GỐC
        
        tags = [t.lower() for t in loc.get("tags", [])]
        rating = loc.get("rating", None)
        st = profile.get_service_time(tags)
        op = loc.get("operating_hours", None)
        
        tw = parse_operating_hours(op, st) 
        
        if i == 0: # Depot
            tw = [0, MAX_DAY_DURATION] 
            base_penalty = 0
        else: # Địa điểm
            if original_idx in penalty_overrides:
                base_penalty = penalty_overrides[original_idx]
            else:
                base_penalty = profile.get_penalty(tags, rating)
                base_penalty = profile.adjust_by_preference(base_penalty, preferred_tags, tags)
                base_penalty = int(base_penalty * profile.boost_priority(tags))
        
        service_times.append(st)
        time_windows.append(tw)
        penalties.append(base_penalty)

        if "restaurant" in tags:
            lunch_nodes.append(i)
        
        if any(nt in tags for nt in ["night market", "night-market", "nightmarket", "nightlife", "bar"]):
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
    # Sửa lỗi cú pháp dấu nháy
    print(f"✅ Instance ready: {len(locs)} địa điểm (đã lọc bỏ các KS khác), depot = '{locs[0].get('title', 'Khách sạn')}' (Gốc: {hotel_index})")
    
    # --- SỬA LỖI Ở ĐÂY (trả về 4 giá trị) ---
    return instance, hotel_index, node_map, locations