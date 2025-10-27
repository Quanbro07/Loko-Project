# diverse_routing.py
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import random
import os
import math

# ==========================================
# 🗺️ DATABASE DU LỊCH MỞ RỘNG
# ==========================================
def get_place_database():
    return [
        # Khách sạn (Start/End)
        ("Khách sạn Trung tâm", ["start", "end", "hotel"]),
        # Nhà hàng & Ẩm thực
        ("Nhà hàng Hải sản Biển Đông", ["restaurant", "seafood"]),
        ("Nhà hàng Lẩu Núi Xanh", ["restaurant", "mountain"]),
        ("Nhà hàng Chay An Lạc", ["restaurant", "vegetarian"]),
        ("Khu Ẩm thực Đêm", ["restaurant", "streetfood"]),
        ("Quán cà phê View Biển", ["cafe", "sea"]),
        # Văn hóa & Lịch sử
        ("Bảo tàng Lịch sử", ["museum", "culture"]),
        ("Đền Linh Ứng", ["temple", "culture"]),
        ("Nhà thờ cổ", ["church", "culture"]),
        ("Phòng triển lãm Nghệ thuật", ["art", "culture"]),
        ("Đài tưởng niệm Chiến sĩ", ["memorial", "history"]),
        # Thiên nhiên & Ngoại ô
        ("Leo núi Bà Nà", ["mountain", "adventure"]),
        ("Khu du lịch Suối Mơ", ["nature", "river"]),
        ("Đảo Cù Lao Chàm", ["island", "sea"]),
        ("Bãi biển Mỹ Khê", ["beach", "sea"]),
        ("Vườn Bách Thảo", ["garden", "nature"]),
        ("Thác Bạc", ["waterfall", "adventure"]),
        # Giải trí & Mua sắm
        ("Công viên Nước SunWorld", ["park", "waterpark"]),
        ("Trung tâm thương mại Vincom", ["shopping", "mall"]),
        ("Chợ Truyền thống Hàn", ["market", "shopping"]),
        ("Phố đi bộ ven sông", ["walking", "nightlife"]),
        ("Rạp chiếu phim CGV", ["cinema", "entertainment"]),
        ("Tháp Quan sát Toàn cảnh", ["view", "sightseeing"]),
    ]

# ==========================================
# 🔧 TẠO INSTANCE DỮ LIỆU
# ==========================================
def generate_instance(seed, num_places=16):
    random.seed(seed)
    db = get_place_database()
    chosen = [db[0]] + random.sample(db[1:], num_places - 1)
    names = [p[0] for p in chosen]
    tags = [p[1] for p in chosen]

    # Giả lập toạ độ (ngẫu nhiên 0–100)
    coords = [(random.uniform(0, 100), random.uniform(0, 100)) for _ in range(num_places)]

    # Ma trận thời gian di chuyển (phút)
    def travel_time(a, b):
        dx = coords[a][0] - coords[b][0]
        dy = coords[a][1] - coords[b][1]
        dist = math.hypot(dx, dy)
        return int(round(dist)) + 5

    time_matrix = [
        [travel_time(i, j) if i != j else 0 for j in range(num_places)]
        for i in range(num_places)
    ]

    # Thời gian dừng (service_time) + độ quan trọng
    service_time, importance = [], []
    for name, tag in chosen:
        if "hotel" in tag:
            service_time.append(0)
            importance.append(1000)
        elif "restaurant" in tag or "cafe" in tag:
            service_time.append(random.randint(45, 75))
            importance.append(90)
        elif "mountain" in tag or "waterpark" in tag or "island" in tag:
            service_time.append(random.randint(90, 180))
            importance.append(70)
        elif "museum" in tag or "culture" in tag:
            service_time.append(random.randint(60, 120))
            importance.append(80)
        elif "shopping" in tag or "market" in tag or "walking" in tag:
            service_time.append(random.randint(30, 75))
            importance.append(60)
        else:
            service_time.append(random.randint(30, 120))
            importance.append(50)

    # Khung thời gian hoạt động (time window)
    time_windows = []
    for i, (name, _) in enumerate(chosen):
        open_offset = random.randint(0, 180)
        close_offset = random.randint(420, 840)
        if i == 0:
            time_windows.append([0, 840])
        else:
            min_close = open_offset + service_time[i] + 30
            close = max(close_offset, min_close)
            time_windows.append([open_offset, close])

    # Xác định vị trí ăn trưa
    lunch_candidates = [
        i for i, (_, tag) in enumerate(chosen)
        if "restaurant" in tag or "cafe" in tag
    ]
    if not lunch_candidates:
        lunch_candidates = [i for i in range(1, num_places) if 40 <= service_time[i] <= 90]
    lunch_node = lunch_candidates[0] if lunch_candidates else 3

    # Trả về instance
    instance = {
        "places": names,
        "tags": tags,
        "coords": coords,
        "time_matrix": time_matrix,
        "service_time": service_time,
        "time_windows": time_windows,
        "importance": importance,
        "lunch_node": lunch_node,
    }
    return instance

# ==========================================
# 🧭 GIẢI BẰNG OR-TOOLS (GUIDED LOCAL SEARCH)
# ==========================================
def solve_instance(instance, seed, time_limit_seconds=20):
    os.environ["ORTOOLS_RANDOM_SEED"] = str(seed)
    random.seed(seed)

    PLACES = instance["places"]
    TIME_MATRIX = instance["time_matrix"]
    SERVICE_TIME = instance["service_time"]
    TIME_WINDOWS = instance["time_windows"]
    LUNCH_NODE = instance["lunch_node"]
    LUNCH_PENALTY = 500

    num_places = len(PLACES)
    depot = 0
    manager = pywrapcp.RoutingIndexManager(num_places, 1, depot)
    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return TIME_MATRIX[from_node][to_node] + SERVICE_TIME[from_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    routing.AddDimension(transit_callback_index, 60, 840, True, 'Time')
    time_dimension = routing.GetDimensionOrDie('Time')

    for node in range(num_places):
        index = manager.NodeToIndex(node)
        tw = TIME_WINDOWS[node]
        time_dimension.CumulVar(index).SetRange(tw[0], tw[1])
        if node == LUNCH_NODE:
            time_dimension.SetCumulVarSoftLowerBound(index, 180, LUNCH_PENALTY)
            time_dimension.SetCumulVarSoftUpperBound(index, 330, LUNCH_PENALTY)

    for node in range(1, num_places):
        idx = manager.NodeToIndex(node)
        penalty = max(50, 1000 - instance["importance"][node]*5)
        routing.AddDisjunction([idx], penalty)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_parameters.time_limit.seconds = time_limit_seconds

    solution = routing.SolveWithParameters(search_parameters)
    if not solution:
        print(f"❌ No feasible solution found for seed {seed}.")
        return None

    index = routing.Start(0)
    print("\n" + "="*46)
    print(f"✅ Schedule (Seed: {seed})")
    print(f"Objective: {solution.ObjectiveValue()}")
    print("="*46)
    route_nodes = []
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        time_var = time_dimension.CumulVar(index)
        arrival = solution.Value(time_var)
        leave = arrival + SERVICE_TIME[node]
        route_nodes.append((node, arrival, leave))
        start_h = (8*60 + arrival)//60
        start_m = (8*60 + arrival)%60
        leave_h = (8*60 + leave)//60
        leave_m = (8*60 + leave)%60
        print(f"- [{start_h:02d}:{start_m:02d} -> {leave_h:02d}:{leave_m:02d}] {PLACES[node]} ({instance['tags'][node]})")
        index = solution.Value(routing.NextVar(index))

    end_node = manager.IndexToNode(index)
    end_time = solution.Value(time_dimension.CumulVar(index))
    end_h = (8*60 + end_time)//60
    end_m = (8*60 + end_time)%60
    print(f"- [Kết thúc lúc {end_h:02d}:{end_m:02d}] {PLACES[end_node]}")
    return route_nodes

# ==========================================
# 🧩 MAIN TEST
# ==========================================
if __name__ == "__main__":
    for s in [10, 50]:
        inst = generate_instance(seed=s, num_places=18)
        print(f"\nGenerated instance (seed {s}):")
        for i, name in enumerate(inst["places"]):
            print(f" {i}. {name} - tags: {inst['tags'][i]} - service: {inst['service_time'][i]}m - window: {inst['time_windows'][i]}")
        solve_instance(inst, seed=s, time_limit_seconds=10)
