import json, math, sys
from utils import get_service_time, parse_operating_hours, get_importance_penalty
from config import *

def create_instance_from_files(preferred_tags=None):
    print("Đang tải dữ liệu...")
    with open(ATTRACTIONS_FILE, 'r', encoding='utf-8') as f:
        locations = json.load(f)

    matrix = []
    with open(TIME_MATRIX_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            row = [math.ceil(int(val)/60) for val in line.strip().split()]
            matrix.append(row)

    hotel_index = next((i for i, loc in enumerate(locations) if "hotel" in loc["tags"]), 0)
    map_idx = [hotel_index] + [i for i in range(len(locations)) if i != hotel_index]
    locs = [locations[i] for i in map_idx]
    mat = [[matrix[i][j] for j in map_idx] for i in map_idx]

    service_times, time_windows, penalties, lunch_nodes = [], [], [], []

    for loc in locs:
        tags = loc.get("tags", [])
        st = get_service_time(tags)
        tw = parse_operating_hours(loc.get("operating_hours"), st)
        service_times.append(st)
        penalties.append(get_importance_penalty(tags))

        # Ưu tiên nếu tag trùng
        if preferred_tags and any(t in preferred_tags for t in tags):
            penalties[-1] = max(10, penalties[-1] // 3)  # giảm penalty mạnh

        if "restaurant" in tags:
            lunch_nodes.append(locs.index(loc))
        time_windows.append(tw)

    return {
        "locations_data": locs,
        "time_matrix": mat,
        "service_time": service_times,
        "time_windows": time_windows,
        "penalties": penalties,
        "lunch_nodes": lunch_nodes,
        "num_places": len(locs),
        "depot": 0
    }
