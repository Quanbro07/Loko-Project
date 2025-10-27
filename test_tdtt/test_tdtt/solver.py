# itinerary_solver.py
import json
import math
import sys
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# ==========================================
# === 1. CẤU HÌNH VÀ HẰNG SỐ
# ==========================================

# --- File Inputs ---
ATTRACTIONS_FILE = 'attractions_with_tags.json'
TIME_MATRIX_FILE = 'time_matrix.txt'

# --- File Output ---
SCHEDULE_OUTPUT_FILE = 'schedule.json'

# --- Cài đặt Lịch trình ---
# Giả định ngày tham quan là 'thứ bảy' (để lấy operating_hours)
DAY_OF_WEEK = "thứ bảy" 

# Giờ bắt đầu và kết thúc của *ngày* (ví dụ: 8:00 sáng -> 10:00 tối)
# Thời gian được tính bằng phút, tính từ 00:00
DAY_START_TIME = 8 * 60  # 8:00 AM
DAY_END_TIME = 22 * 60   # 10:00 PM
MAX_DAY_DURATION = DAY_END_TIME - DAY_START_TIME # = 840 phút

# --- Cài đặt Ràng buộc Ăn trưa (Soft Constraint) ---
# Khung giờ mong muốn, tính bằng phút *kể từ lúc DAY_START_TIME*
LUNCH_START_MINS = (11 * 60 + 30) - DAY_START_TIME # 11:30 AM -> 210 phút
LUNCH_END_MINS = (13 * 60 + 30) - DAY_START_TIME   # 1:30 PM -> 330 phút
LUNCH_PENALTY = 500  # Phạt nếu ghé nhà hàng ngoài khung giờ này

# ==========================================
# === 2. HÀM TIỆN ÍCH (HELPERS)
# ==========================================

def get_service_time(tags):
    """Gán thời gian tham quan (phút) dựa trên tag."""
    if not tags:
        return 30  # Mặc định
    
    if "hotel" in tags:
        return 0 # Depot
    if "nature" in tags or "museum" in tags or "palace" in tags or "historic" in tags:
        return 120 # 2 tiếng
    if "waterfall" in tags or "amusement" in tags or "dangerous" in tags or "park" in tags:
        return 90 # 1.5 tiếng
    if "restaurant" in tags or "food" in tags:
        return 60 # 1 tiếng
    if "temple" in tags or "market" in tags or "shopping" in tags or "viewpoint" in tags:
        return 45 # 45 phút
    
    return 30

def get_importance_penalty(tags):
    """Gán mức phạt nếu bỏ lỡ địa điểm (càng quan trọng, phạt càng cao)."""
    if not tags:
        return 1000 # Phạt cao nếu không có tag (không rõ)
    
    if "hotel" in tags:
        return 0 # Không được phép bỏ lỡ
    if "restaurant" in tags or "food" in tags:
        return 300 # Phải ăn
    if "nature" in tags or "museum" in tags or "historic" in tags:
        return 500
    
    return 700 # Mặc định

def parse_operating_hours(op_hours, service_time):
    """
    Chuyển đổi object giờ hoạt động thành [start, end] (tính bằng phút từ 00:00).
    Trả về [start_solver, latest_arrival_solver] đã được điều chỉnh.
    """
    if not op_hours or DAY_OF_WEEK not in op_hours:
        # Nếu không có thông tin, giả sử mở cả ngày
        hours_str = "Mở cửa cả ngày"
    else:
        hours_str = op_hours[DAY_OF_WEEK]

    if hours_str == "Mở cửa cả ngày":
        start_min = 0
        end_min = 1440 # 24 * 60
    elif hours_str == "Đóng cửa":
        return [0, 0] # Không thể đến
    elif '–' not in hours_str:
        # Xử lý các trường hợp giờ phức tạp (ví dụ: "07:30–11:45, 13:00–16:45")
        # Để đơn giản, ta chỉ lấy khung giờ đầu tiên
        if ',' in hours_str:
            hours_str = hours_str.split(',')[0]
        
        # Nếu vẫn không đúng định dạng, coi như mở cả ngày
        if '–' not in hours_str:
             start_min = 0
             end_min = 1440
        else:
            parts = hours_str.split('–')
            try:
                start_h, start_m = map(int, parts[0].split(':'))
                end_h, end_m = map(int, parts[1].split(':'))
                start_min = start_h * 60 + start_m
                end_min = end_h * 60 + end_m
            except ValueError:
                start_min = 0
                end_min = 1440
    else:
        try:
            parts = hours_str.split('–')
            start_h, start_m = map(int, parts[0].split(':'))
            end_h, end_m = map(int, parts[1].split(':'))
            start_min = start_h * 60 + start_m
            end_min = end_h * 60 + end_m
        except ValueError:
            # Lỗi phân tích cú pháp, giả sử mở cả ngày
            start_min = 0
            end_min = 1440

    # Chuyển đổi sang thời gian của solver (bắt đầu từ DAY_START_TIME)
    # Ví dụ: Mở cửa lúc 7:30 (450), DAY_START_TIME là 8:00 (480) -> solver_start = 0
    # Ví dụ: Mở cửa lúc 9:00 (540), DAY_START_TIME là 8:00 (480) -> solver_start = 60
    solver_start = max(0, start_min - DAY_START_TIME)
    solver_end = max(0, end_min - DAY_START_TIME)

    # Tính thời điểm đến muộn nhất
    # (Giờ đóng cửa - Thời gian tham quan)
    latest_arrival = solver_end - service_time
    
    # Đảm bảo thời điểm đến muộn nhất không sớm hơn giờ mở cửa
    latest_arrival = max(solver_start, latest_arrival)

    return [solver_start, latest_arrival]

def format_time(minutes_since_start):
    """Chuyển đổi phút (từ DAY_START_TIME) sang chuỗi HH:MM."""
    total_minutes = DAY_START_TIME + minutes_since_start
    h = total_minutes // 60
    m = total_minutes % 60
    return f"{h:02d}:{m:02d}"

# ==========================================
# === 3. DATA PRE-PROCESSING
# ==========================================

def create_instance_from_files():
    """
    Tải tất cả dữ liệu thật và chuyển đổi thành instance cho solver.
    """
    print("Đang tải dữ liệu từ file...")
    # 1. Tải locations
    try:
        with open(ATTRACTIONS_FILE, 'r', encoding='utf-8') as f:
            locations = json.load(f)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{ATTRACTIONS_FILE}'.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Lỗi: File '{ATTRACTIONS_FILE}' không phải là JSON hợp lệ.")
        sys.exit(1)

    # 2. Tải time matrix
    try:
        matrix = []
        with open(TIME_MATRIX_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    # Chuyển đổi các giá trị thời gian (giây) sang phút (làm tròn)
                    row = [math.ceil(int(val) / 60) for val in line.strip().split()]
                    matrix.append(row)
    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file '{TIME_MATRIX_FILE}'.")
        sys.exit(1)
    except ValueError:
        print(f"Lỗi: File '{TIME_MATRIX_FILE}' chứa giá trị không phải là số.")
        sys.exit(1)

    if len(locations) != len(matrix):
        print(f"Lỗi: Số địa điểm ({len(locations)}) không khớp với ma trận ({len(matrix)}).")
        sys.exit(1)

    # --- 3. Tiền xử lý: Chọn Depot (Khách sạn) và Sắp xếp lại ---
    
    # Tìm khách sạn đầu tiên để làm depot
    hotel_index = -1
    for i, loc in enumerate(locations):
        if "hotel" in loc.get("tags", []):
            hotel_index = i
            break
            
    if hotel_index == -1:
        print("Lỗi: Không tìm thấy địa điểm nào có tag 'hotel' để làm điểm bắt đầu.")
        # Mặc định lấy điểm đầu tiên
        hotel_index = 0
        print(f"Cảnh báo: Lấy '{locations[0]['title']}' làm điểm bắt đầu/kết thúc.")


    print(f"Đã chọn '{locations[hotel_index]['title']}' làm điểm bắt đầu/kết thúc (Depot).")

    # Tạo bản đồ chỉ mục để đưa khách sạn về index 0
    n = len(locations)
    map_to_new = [hotel_index] + [i for i in range(n) if i != hotel_index]
    
    # Sắp xếp lại locations và time_matrix
    final_locations = [locations[i] for i in map_to_new]
    final_matrix = [
        [matrix[map_to_new[i]][map_to_new[j]] for j in range(n)]
        for i in range(n)
    ]

    # --- 4. Tạo các mảng dữ liệu cho Solver ---
    service_times = []
    time_windows = []
    penalties = []
    lunch_nodes = []

    for i, loc in enumerate(final_locations):
        tags = loc.get("tags", [])
        
        # Lấy service time
        st = get_service_time(tags)
        service_times.append(st)
        
        # Lấy operating hours
        op_hours = loc.get("operating_hours")
        tw = parse_operating_hours(op_hours, st)
        
        # Ràng buộc đặc biệt cho Depot (Index 0)
        if i == 0:
            tw = [0, MAX_DAY_DURATION] # Phải bắt đầu từ 0 và có thể kết thúc bất cứ lúc nào
        
        time_windows.append(tw)

        # Lấy penalties
        if i == 0:
            penalties.append(0) # Không được bỏ lỡ depot
        else:
            penalties.append(get_importance_penalty(tags))
        
        # Xác định các điểm ăn trưa
        if "restaurant" in tags or "food" in tags:
            lunch_nodes.append(i)

    print(f"Đã xử lý {n} địa điểm. Sẵn sàng cho solver.")

    instance = {
        "locations_data": final_locations, # Dùng để xuất JSON cuối cùng
        "time_matrix": final_matrix,
        "service_time": service_times,
        "time_windows": time_windows,
        "penalties": penalties,
        "lunch_nodes": lunch_nodes,
        "num_places": n,
        "depot": 0
    }
    return instance

# ==========================================
# === 4. SOLVER & SCHEDULING
# ==========================================

def solve_itinerary(instance, time_limit_seconds=20):
    """
    Xây dựng mô hình VRP và giải bằng OR-Tools.
    """
    print("\n--- Bắt đầu giải lịch trình (OR-Tools) ---")
    
    manager = pywrapcp.RoutingIndexManager(
        instance["num_places"], 1, instance["depot"]
    )
    routing = pywrapcp.RoutingModel(manager)

    # --- 1. Ràng buộc Thời gian di chuyển (Arc Cost) ---
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        # Thời gian = thời gian đi + thời gian tham quan tại điểm 'from'
        return instance["time_matrix"][from_node][to_node] + instance["service_time"][from_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # --- 2. Ràng buộc Giờ mở cửa (Time Windows) ---
    routing.AddDimension(
        transit_callback_index,
        30,  # "slack" - thời gian chờ tối đa
        MAX_DAY_DURATION, # Tổng thời gian tối đa của 1 ngày
        False, # KHÔNG bắt đầu từ 0 (False)
        'Time'
    )
    time_dimension = routing.GetDimensionOrDie('Time')

    for node_idx, time_window in enumerate(instance["time_windows"]):
        if node_idx == instance["depot"]:
            continue # Bỏ qua depot
        index = manager.NodeToIndex(node_idx)
        time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])

    # --- 3. Ràng buộc Bỏ qua Địa điểm (Disjunctions) ---
    # Cho phép solver bỏ qua các địa điểm nếu tốn kém, trừ depot
    for node_idx in range(1, instance["num_places"]):
        index = manager.NodeToIndex(node_idx)
        routing.AddDisjunction([index], instance["penalties"][node_idx])

    # --- 4. Ràng buộc Ăn trưa (Soft Constraint) ---
    # Thêm hình phạt nếu ghé thăm một nhà hàng BÊN NGOÀI khung giờ ăn trưa
    for node_idx in instance["lunch_nodes"]:
        index = manager.NodeToIndex(node_idx)
        # SetCumulVarSoft... tạo ra một "khung giờ ưu tiên"
        # Nếu đến *trước* LUNCH_START_MINS, bị phạt
        time_dimension.SetCumulVarSoftLowerBound(index, LUNCH_START_MINS, LUNCH_PENALTY)
        # Nếu đến *sau* LUNCH_END_MINS, bị phạt
        time_dimension.SetCumulVarSoftUpperBound(index, LUNCH_END_MINS, LUNCH_PENALTY)

    # --- 5. Cài đặt Solver ---
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = time_limit_seconds

    print(f"Đang giải trong {time_limit_seconds} giây...")
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        print("✅ Đã tìm thấy giải pháp!")
        return solution, manager, routing, time_dimension
    else:
        print("❌ Không tìm thấy giải pháp.")
        return None, None, None, None

# ==========================================
# === 5. OUTPUT & EXECUTION
# ==========================================

def format_and_save_solution(solution, manager, routing, time_dimension, instance):
    """
    Lấy kết quả từ solver và định dạng thành file JSON đầu ra.
    """
    print("\n--- Lịch trình Tối ưu ---")
    schedule = []
    index = routing.Start(0)
    
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        loc_data = instance["locations_data"][node]
        service_time = instance["service_time"][node]
        
        time_var = time_dimension.CumulVar(index)
        arrival_time_mins = solution.Value(time_var)
        departure_time_mins = arrival_time_mins + service_time
        
        # Định dạng thời gian
        time_str = f"{format_time(arrival_time_mins)} - {format_time(departure_time_mins)}"
        
        # In ra console
        print(f"[{time_str}] {loc_data['title']} (Tham quan: {service_time} phút)")
        
        # Bỏ qua depot (khách sạn) trong file JSON đầu ra
        if node != instance["depot"]:
            schedule_item = {
                "time": time_str,
                "place": loc_data.get("title"),
                "place_id": loc_data.get("place_id"),
                "latitude": loc_data.get("latitude"),
                "longitude": loc_data.get("longitude")
            }
            schedule.append(schedule_item)
            
        index = solution.Value(routing.NextVar(index))

    # Xử lý điểm kết thúc (quay về depot)
    end_time_mins = solution.Value(time_dimension.CumulVar(index))
    print(f"[{format_time(end_time_mins)}] Về khách sạn")
    
    # Lưu file JSON
    try:
        with open(SCHEDULE_OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(schedule, f, ensure_ascii=False, indent=4)
        print(f"\n🎉 Đã lưu lịch trình vào file: '{SCHEDULE_OUTPUT_FILE}'")
    except IOError as e:
        print(f"\nLỗi: Không thể ghi file '{SCHEDULE_OUTPUT_FILE}': {e}")


# --- Hàm main để chạy script ---
if __name__ == "__main__":
    # 1. Tải và xử lý dữ liệu
    instance_data = create_instance_from_files()
    
    # 2. Giải
    solution, manager, routing, time_dim = solve_itinerary(instance_data, time_limit_seconds=15)
    
    # 3. Xuất kết quả
    if solution:
        format_and_save_solution(solution, manager, routing, time_dim, instance_data)
    else:
        print("Không thể tạo lịch trình với các ràng buộc đã cho.")