from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from app.core.config import settings

class BaseSolver:
    def __init__(self, instance, profile, context: dict):
        self.instance = instance
        self.profile = profile
        self.context = context 
        
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
        time_matrix = self.instance["time_matrix"]
        def transit_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return time_matrix[from_node][to_node]

        transit_callback_index = self.routing.RegisterTransitCallback(transit_callback)
        self.routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    def _add_time_dimension(self):
        time_matrix = self.instance["time_matrix"]
        service_time = self.instance["service_time"]

        def time_dim_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            travel = time_matrix[from_node][to_node]
            service = service_time[from_node]
            return travel + service

        time_dim_callback_index = self.routing.RegisterTransitCallback(time_dim_callback)
        
        max_duration = self.context.get("max_duration", 1440)

        self.routing.AddDimension(
            time_dim_callback_index,
            60, 
            max_duration, 
            True,
            "Time"
        )
        self.time_dim = self.routing.GetDimensionOrDie("Time")

    def _add_base_constraints(self):
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
        Thêm các ràng buộc chung (Ăn trưa/Ăn tối) dựa trên context.
        Logic này được port từ file cũ nhưng dùng context động.
        """
        # Lấy giờ từ context (đã được tính toán theo giờ khởi hành của request)
        lunch_start = self.context.get("lunch_start")
        lunch_end = self.context.get("lunch_end")
        dinner_start = self.context.get("dinner_start")
        dinner_end = self.context.get("dinner_end")
        
        # Lấy penalty từ settings chung
        lunch_penalty = settings.LUNCH_PENALTY

        # Áp dụng cho tất cả các node được đánh dấu là "nhà hàng" (lunch_nodes)
        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            
            # Ràng buộc mềm cho bữa trưa
            if lunch_start is not None and lunch_end is not None:
                self.time_dim.SetCumulVarSoftLowerBound(idx, lunch_start, lunch_penalty)
                self.time_dim.SetCumulVarSoftUpperBound(idx, lunch_end, lunch_penalty)
            
            # Ràng buộc mềm cho bữa tối
            if dinner_start is not None and dinner_end is not None:
                self.time_dim.SetCumulVarSoftLowerBound(idx, dinner_start, lunch_penalty)
                self.time_dim.SetCumulVarSoftUpperBound(idx, dinner_end, lunch_penalty)

    def solve(self, time_limit_seconds=5):
        # Gọi hàm thêm ràng buộc ăn uống trước khi giải
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

        return self.routing.SolveWithParameters(search_parameters)