from app.solvers.base_solver import BaseSolver
from app.schedule_utils import minutes_to_str, time_str_to_minutes

class AdventureSolver(BaseSolver):
    def __init__(self, instance, profile, context):
        super().__init__(instance, profile, context)

    def _add_profile_specific_constraints(self):
        # ---------------------------------------------------------
        # 1. RÀNG BUỘC ĂN UỐNG (Giống AmusementSolver để đảm bảo sức khỏe)
        # ---------------------------------------------------------
        lunch_start = self.context.get("lunch_start")
        lunch_end = self.context.get("lunch_end")
        dinner_start = self.context.get("dinner_start")
        dinner_end = self.context.get("dinner_end")
        
        # Penalty cao cho Adventure vì cần nạp năng lượng kỹ
        meal_penalty = 300 

        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            loc_data = self.instance["locations_data"][node]
            
            open_str = loc_data.get("open_time", "00:00")
            close_str = loc_data.get("close_time", "23:59")
            
            open_mins = time_str_to_minutes(open_str) or 0
            close_mins = time_str_to_minutes(close_str)
            if close_mins is None: close_mins = 1440

            is_strict_lunch = close_mins < 960 and close_mins > open_mins
            is_strict_dinner = open_mins > 960
            
            if is_strict_dinner:
                if dinner_start and dinner_end:
                    self.time_dim.SetCumulVarSoftLowerBound(idx, dinner_start, meal_penalty)
                    self.time_dim.SetCumulVarSoftUpperBound(idx, dinner_end, meal_penalty)
            elif is_strict_lunch:
                if lunch_start and lunch_end:
                    self.time_dim.SetCumulVarSoftLowerBound(idx, lunch_start, meal_penalty)
                    self.time_dim.SetCumulVarSoftUpperBound(idx, lunch_end, meal_penalty)
            else:
                if lunch_start and dinner_end:
                    self.time_dim.SetCumulVarSoftLowerBound(idx, lunch_start, meal_penalty)
                    self.time_dim.SetCumulVarSoftUpperBound(idx, dinner_end, meal_penalty)

        # ---------------------------------------------------------
        # 2. RÀNG BUỘC ĐẶC THÙ ADVENTURE: EARLY BIRDS
        # ---------------------------------------------------------
        # Các hoạt động nặng/thiên nhiên nên bắt đầu trước 11:00 AM
        day_start_mins = self.context.get("day_start_mins")
        morning_limit_min = (11 * 60) - day_start_mins
        
        early_birds = ["mountain", "trekking", "climbing", "diving", "natural_feature"]

        # Duyệt qua các node (trừ depot)
        for node in range(1, self.num_places):
            # Hỗ trợ cả field 'tags' (chuẩn mới) và 'categories' (legacy data)
            loc_data = self.instance["locations_data"][node]
            tags = loc_data.get("tags") or loc_data.get("categories", [])
            
            # Nếu có tag cần đi sớm
            if any(t in tags for t in early_birds):
                idx = self.manager.NodeToIndex(node)
                # SoftUpperBound: Phạt nhẹ nếu đi muộn, ưu tiên xếp buổi sáng
                self.time_dim.SetCumulVarSoftUpperBound(idx, morning_limit_min, 10)

    def generate_day_schedule(self, time_limit_seconds=15):
        solution = self.solve(time_limit_seconds)
        if not solution:
            return None, None
        return self.format_solution(solution)

    def format_solution(self, solution):
        visited_nodes = []
        trip_details = []
        
        index = self.routing.Start(0)
        
        day_start_mins = self.context.get("day_start_mins")
        max_end_time_relative = self.context.get("max_duration")
        time_matrix = self.instance["time_matrix"]
        
        depot_place = self.locations[self.depot]
        hotel_title = depot_place.get('location_name', 'Khách sạn')
        
        sequence_order = 1
        total_energy = 100
        total_added_rest_time = 0 

        while not self.routing.IsEnd(index):
            node = self.manager.NodeToIndex(index)
            place = self.locations[node]
            name = place.get("location_name")
            
            time_var = self.time_dim.CumulVar(index)
            arrival_solved = solution.Value(time_var)
            
            arrival_actual = arrival_solved + total_added_rest_time
            
            # Check giới hạn ngày
            if arrival_actual >= max_end_time_relative:
                break

            service_time = self.instance["service_time"][node]
            end_time_actual = min(arrival_actual + service_time, max_end_time_relative)
            
            # --- CHECK SHORT VISIT (Tránh đi lướt qua các điểm Adventure) ---
            actual_duration = end_time_actual - arrival_actual
            if node != self.depot and index != self.routing.Start(0):
                # Adventure cần trải nghiệm sâu, nếu thời gian quá ngắn thì bỏ qua
                if actual_duration < (service_time * 0.5) or actual_duration < 30:
                    break

            if end_time_actual < arrival_actual:
                end_time_actual = arrival_actual

            # Format String
            start_str = minutes_to_str(arrival_actual, day_start_mins, 'up')
            end_str = minutes_to_str(end_time_actual, day_start_mins, 'down')
            
            if end_str < start_str:
                if (end_time_actual - arrival_actual) < 720: 
                    end_str = start_str
            
            if (end_time_actual - arrival_actual > 10) and (start_str == end_str):
                 end_str = minutes_to_str(end_time_actual, day_start_mins, 'up')

            if node == self.depot and index != self.routing.Start(0):
                break

            trip_details.append({
                "sequenceOrder": sequence_order,
                "startTime": start_str,
                "endTime": end_str,
                "description": place.get("description") or name,
                "location": place,
            })
            sequence_order += 1

            # --- LOGIC NĂNG LƯỢNG (ADVENTURE SPECIFIC) ---
            if node != self.depot:
                tags = place.get("tags") or place.get("categories", [])
                
                # Adventure tiêu tốn nhiều năng lượng hơn Amusement
                if "hotel" in tags: 
                    energy_loss = -50
                elif any(t in ["mountain"] for t in tags): 
                    energy_loss = 60 # Rất tốn sức
                elif any(t in ["cave", "diving", "waterfall"] for t in tags): 
                    energy_loss = 40 # Tốn sức vừa
                elif any(t in ["restaurant", "camping"] for t in tags): 
                    energy_loss = 10
                else: 
                    energy_loss = 20
                
                total_energy = max(0, min(100, total_energy - energy_loss))

                # Adventure mode: Ngưỡng mệt là < 30
                if total_energy < 30:
                      next_index = solution.Value(self.routing.NextVar(index))
                      if not self.routing.IsEnd(next_index):
                          next_node = self.manager.NodeToIndex(next_index)
                          travel_direct = time_matrix[node][next_node]
                          travel_to_depot = time_matrix[node][self.depot]
                          
                          # Adventure cần nghỉ lâu hơn (90 phút) để hồi sức
                          rest_duration = 90 
                          travel_from_depot = time_matrix[self.depot][next_node]
                          
                          detour_cost = travel_to_depot + rest_duration + travel_from_depot
                          added_time = max(0, detour_cost - travel_direct)
                          
                          if end_time_actual + travel_to_depot + rest_duration < max_end_time_relative:
                              total_energy = 100 
                              total_added_rest_time += added_time 
                              
                              rest_start = end_time_actual + travel_to_depot
                              rest_end = rest_start + rest_duration
                              
                              s_rest = minutes_to_str(rest_start, day_start_mins, 'up')
                              e_rest = minutes_to_str(rest_end, day_start_mins, 'down')
                              
                              trip_details.append({
                                 "sequenceOrder": sequence_order,
                                 "startTime": s_rest,
                                 "endTime": e_rest,
                                 "description": f"Về {hotel_title} nghỉ ngơi phục hồi sức lực",
                                 "activity": "Nghỉ ngơi",
                                 "location": depot_place
                              })
                              sequence_order += 1
            
            visited_nodes.append(node)
            index = solution.Value(self.routing.NextVar(index))

        # Điểm kết thúc
        last_end_str = trip_details[-1]["endTime"] if trip_details else minutes_to_str(0, day_start_mins, 'down')
        
        trip_details.append({
            "sequenceOrder": sequence_order,
            "startTime": last_end_str,
            "endTime": last_end_str,
            "description": f"Kết thúc hành trình khám phá, về {hotel_title}",
            "location": depot_place,
            "activity": "Nghỉ ngơi"
        })

        real_visited = [n for n in visited_nodes if n != self.depot]
        return real_visited, trip_details