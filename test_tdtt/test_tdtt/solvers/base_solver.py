# solvers/base_solver.py
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from config import MAX_DAY_DURATION  # <--- DÒNG THÊM VÀO

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
        
        # Thực hiện các bước setup cơ bản
        self._add_cost_callbacks()
        self._add_time_dimension()
        self._add_base_constraints()

    def _add_cost_callbacks(self):
        """
        FIX QUAN TRỌNG (1/2): Định nghĩa CHI PHÍ (Cost).
        """
        time_matrix = self.instance["time_matrix"]

        def transit_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return time_matrix[from_node][to_node]

        transit_callback_index = self.routing.RegisterTransitCallback(transit_callback)
        self.routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def _add_time_dimension(self):
        """
        FIX QUAN TRỌNG (2/2): Định nghĩa RÀNG BUỘC THỜI GIAN (Time Dimension).
        """
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
            60,  # 60 phút chờ tối đa (slack)
            self.instance.get("max_duration", MAX_DAY_DURATION), # Thời gian tối đa 1 ngày
            True, # Bắt đầu từ 0
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
            
            # 1. Ràng buộc cứng: Time Windows
            start, end = time_windows[node]
            self.time_dim.CumulVar(index).SetRange(start, end)
            
            # 2. Ràng buộc mềm: Penalty (Disjunction)
            penalty = penalties[node]
           
            self.routing.AddDisjunction([index], penalty)

    def _add_profile_specific_constraints(self):
        """
        (Abstract) Lớp con sẽ override hàm này.
        """
        pass

    def solve(self, time_limit_seconds=15):
        """Chạy solver và trả về solution."""
        
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