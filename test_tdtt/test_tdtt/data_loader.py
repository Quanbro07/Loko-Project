# data_loader.py
import json, math, sys
from config import *
from utils import parse_operating_hours

def create_instance_from_files(profile, preferred_categories=None, penalty_overrides=None, force_hotel_idx=None):
    print("Đang tải dữ liệu...")
    preferred_categories = preferred_categories or []
    penalty_overrides = penalty_overrides or {} 
    
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
                if not line.strip(): continue
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
            categories = [t.lower() for t in loc.get("categories", [])]
            if "hotel" in categories or "hotels" in categories:
                if i in penalty_overrides:
                    hotel_penalties[i] = penalty_overrides[i]
                else:
                    hotel_penalties[i] = 10 
        
        if not hotel_penalties:
            print("⚠️ Không tìm thấy khách sạn nào.")
            return None, None, None, None

        hotel_index = min(hotel_penalties, key=hotel_penalties.get)
    
    # --- Logic lọc bỏ các KS khác ---
    all_hotel_indices = {
        i for i, loc in enumerate(locations) 
        if "hotel" in [t.lower() for t in loc.get("categories", [])] or 
           "hotels" in [t.lower() for t in loc.get("categories", [])]
    }
    reorder = [hotel_index] + [
        i for i in range(len(locations)) 
        if i not in all_hotel_indices
    ]
    
    locs = [locations[i] for i in reorder]
    mat = [[matrix[i][j] for j in reorder] for i in reorder]
    node_map = {new_idx: original_idx for new_idx, original_idx in enumerate(reorder)}

    service_times, time_windows, penalties = [], [], []
    lunch_nodes, night_nodes = [], []

    for i, loc in enumerate(locs): 
        original_idx = node_map[i] 
        categories = [t.lower() for t in loc.get("categories", [])]
        
        # --- SỬA LỖI: Map đúng tên trường từ JSON mới ---
        # Ưu tiên tên mới (location_name), fallback về tên cũ (title) nếu không có
        rating = loc.get("average_rating") or loc.get("rating")
        st = profile.get_service_time(categories)
        op = loc.get("open_time") or loc.get("operating_hours")
        
        tw = parse_operating_hours(op, st) 
        
        if i == 0: # Depot
            tw = [0, MAX_DAY_DURATION] 
            base_penalty = 0
        else: 
            if original_idx in penalty_overrides:
                base_penalty = penalty_overrides[original_idx]
            else:
                base_penalty = profile.get_penalty(categories, rating)
                base_penalty = profile.adjust_by_preference(base_penalty, preferred_categories, categories)
                base_penalty = int(base_penalty * profile.boost_priority(categories))
        
        service_times.append(st)
        time_windows.append(tw)
        penalties.append(base_penalty)

        # --- SỬA LỖI LOGIC: Không thêm Depot vào danh sách ăn uống/vui chơi ---
        if i != 0: 
            if "restaurant" in categories:
                lunch_nodes.append(i)
            
            if any(nt in categories for nt in ["night market", "night-market", "nightmarket", "nightlife", "bar"]):
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
    
    # Sửa lỗi log: Dùng location_name
    depot_name = locs[0].get('location_name') or locs[0].get('title', 'Khách sạn')
    print(f"✅ Instance ready: {len(locs)} địa điểm, depot = '{depot_name}' (Gốc: {hotel_index})")
    
    return instance, hotel_index, node_map, locations