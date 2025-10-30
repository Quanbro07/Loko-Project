from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from config import *
from utils import format_time

def solve_itinerary(instance, time_limit_seconds=15):
    print("\n🚀 Solving itinerary...")
    PLACES = instance["locations_data"]
    TIME_MATRIX = instance["time_matrix"]
    SERVICE_TIME = instance["service_time"]
    TIME_WINDOWS = instance["time_windows"]
    PENALTIES = instance["penalties"]
    LUNCH_NODES = instance["lunch_nodes"]
    NUM_PLACES = instance["num_places"]
    DEPOT = instance["depot"]

    manager = pywrapcp.RoutingIndexManager(NUM_PLACES, 1, DEPOT)
    routing = pywrapcp.RoutingModel(manager)

    # --- Travel + service time callback ---
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return TIME_MATRIX[from_node][to_node] + SERVICE_TIME[from_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # --- Time dimension (working hours) ---
    routing.AddDimension(
        transit_callback_index,
        60,  # waiting buffer
        MAX_DAY_DURATION,
        True,
        "Time"
    )
    time_dim = routing.GetDimensionOrDie("Time")

    # --- Apply time windows ---
    for node in range(NUM_PLACES):
        index = manager.NodeToIndex(node)
        start, end = TIME_WINDOWS[node]
        time_dim.CumulVar(index).SetRange(start, end)

    # --- Soft lunch window (optional) ---
    for node in LUNCH_NODES:
        idx = manager.NodeToIndex(node)
        time_dim.SetCumulVarSoftLowerBound(idx, LUNCH_START_MINS, LUNCH_PENALTY)
        time_dim.SetCumulVarSoftUpperBound(idx, LUNCH_END_MINS, LUNCH_PENALTY)

    # --- Penalties for skipping ---
    for node in range(1, NUM_PLACES):
        idx = manager.NodeToIndex(node)
        routing.AddDisjunction([idx], PENALTIES[node])

    # --- Search parameters ---
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = time_limit_seconds

    solution = routing.SolveWithParameters(search_parameters)
    if not solution:
        print("❌ No feasible solution found.")
        return None, None, None, None

    print("✅ Solution found.")
    return solution, manager, routing, time_dim


def format_and_save_solution(solution, manager, routing, time_dim, instance):
    PLACES = instance["locations_data"]
    SERVICE_TIME = instance["service_time"]
    index = routing.Start(0)
    total_time = 0

    print("\n🗓️  Generated Schedule:")
    print("=" * 60)
    route_nodes = []

    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        time_var = time_dim.CumulVar(index)
        arrival = solution.Value(time_var)
        leave = arrival + SERVICE_TIME[node]
        total_time = leave
        route_nodes.append((node, arrival, leave))
        start_time = format_time(arrival)
        end_time = format_time(leave)
        name = PLACES[node]["place"]
        print(f"- [{start_time} → {end_time}] {name} ({SERVICE_TIME[node]} mins)")
        index = solution.Value(routing.NextVar(index))

    end_node = manager.IndexToNode(index)
    end_time = solution.Value(time_dim.CumulVar(index))
    print(f"- [End at {format_time(end_time)}] {PLACES[end_node]['place']}")
    print("=" * 60)
    print(f"Total time: {total_time} mins")

    visited = [n for n, _, _ in route_nodes]
    skipped = [i for i in range(len(PLACES)) if i not in visited]
    print(f"\nVisited {len(visited)} places; skipped {len(skipped)}:")
    print([PLACES[i]["place"] for i in skipped if i != 0])
