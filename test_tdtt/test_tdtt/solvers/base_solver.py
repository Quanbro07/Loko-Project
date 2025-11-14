# solvers/base_solver.py
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
# SỬA LỖI: Import các biến mới từ config
from config import MAX_DAY_DURATION, LUNCH_START_MINS, LUNCH_END_MINS, DINNER_START_MINS, DINNER_END_MINS, LUNCH_PENALTY

class BaseSolver:
    """
    Lớp Solver cơ sở.
    Chứa toàn bộ logic OR-Tools chung để giải VRP-TW-P.
    """
    def __init__(self, instance, profile):
        self.instance = instance
        self.profile = profile
        
        self.locations = instance["locations_data"]
        self.num_places = instance["num_places"]
        self.depot = instance["depot"]
        self.manager = pywrapcp.RoutingIndexManager(self.num_places, 1, self.depot)
        self.routing = pywrapcp.RoutingModel(self.manager)
        self.time_dim = None
        
        self._add_cost_callbacks()
        self._add_time_dimension()
        self._add_base_constraints()

    def _add_cost_callbacks(self):
        """Định nghĩa CHI PHÍ (Cost) = Thời gian di chuyển."""
        time_matrix = self.instance["time_matrix"]

        def transit_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return time_matrix[from_node][to_node]

        transit_callback_index = self.routing.RegisterTransitCallback(transit_callback)
        self.routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def _add_time_dimension(self):
        """Định nghĩa RÀNG BUỘC THỜI GIAN = Di chuyển + Dịch vụ."""
        time_matrix = self.instance["time_matrix"]
        service_time = self.instance["service_time"]

        def time_dim_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            travel = time_matrix[from_node][to_node]
            service = service_time[from_node]
            return travel + service

        time_dim_callback_index = self.routing.RegisterTransitCallback(time_dim_callback)

        self.routing.AddDimension(
            time_dim_callback_index,
            60,
            self.instance.get("max_duration", MAX_DAY_DURATION), 
            True,
            "Time"
        )
        self.time_dim = self.routing.GetDimensionOrDie("Time")

    def _add_base_constraints(self):
        """Thêm các ràng buộc cơ bản: Time Windows và Penalty (bỏ qua)."""
        time_windows = self.instance["time_windows"]
        penalties = self.instance["penalties"]

        for node in range(self.num_places):
            if node == self.depot:
                continue
            
            index = self.manager.NodeToIndex(node)
            
            start, end = time_windows[node]
            self.time_dim.CumulVar(index).SetRange(start, end)
            
            penalty = penalties[node]
            self.routing.AddDisjunction([index], penalty)

    def _add_profile_specific_constraints(self):
        """
        (SỬA ĐỔI) Thêm các ràng buộc chung mà TẤT CẢ các solver con nên có.
        Lớp con sẽ gọi super() và thêm các ràng buộc riêng.
        """
        print("... Thêm ràng buộc chung (Ăn trưa/Ăn tối)...")
        
        # Ràng buộc mềm cho TẤT CẢ các nhà hàng
        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            
            # Ràng buộc mềm cho bữa trưa (11:00 - 14:00)
            self.time_dim.SetCumulVarSoftLowerBound(idx, LUNCH_START_MINS, LUNCH_PENALTY)
            self.time_dim.SetCumulVarSoftUpperBound(idx, LUNCH_END_MINS, LUNCH_PENALTY)
            
            # Ràng buộc mềm cho bữa tối (18:00 - 21:00)
            self.time_dim.SetCumulVarSoftLowerBound(idx, DINNER_START_MINS, LUNCH_PENALTY)
            self.time_dim.SetCumulVarSoftUpperBound(idx, DINNER_END_MINS, LUNCH_PENALTY)

    def solve(self, time_limit_seconds=15):
        """Chạy solver và trả về solution."""
        
        # Gọi hàm (giờ đã có logic ăn uống)
        self._add_profile_specific_constraints()

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = time_limit_seconds
        search_parameters.log_search = False

        solution = self.routing.SolveWithParameters(search_parameters)
        
        if solution:
            return solution
        else:
            return None