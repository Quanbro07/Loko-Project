from app.solvers.base_solver import BaseSolver
from app.schedule_utils import minutes_to_str, time_str_to_minutes

class HoneymoonSolver(BaseSolver):
    def __init__(self, instance, profile, context):
        super().__init__(instance, profile, context)

    def _add_profile_specific_constraints(self):
        """
        Constraints cho Honeymoon:
        1. Ăn uống: Cực kỳ quan trọng (Romantic Dinner).
        2. Viewpoint/Yacht: Ưu tiên khung giờ hoàng hôn (16:30 - 18:30).
        3. Beach/Island: Về trước khi tối (trừ khi là nơi ăn tối).
        """
        
        # --- 1. Xử lý Giờ ăn (Ưu tiên tối đa) ---
        lunch_start = self.context.get("lunch_start")
        lunch_end = self.context.get("lunch_end")
        dinner_start = self.context.get("dinner_start")
        dinner_end = self.context.get("dinner_end")
        
        # Penalty cực lớn: Trăng mật mà lỡ bữa tối lãng mạn là hỏng
        meal_penalty = 20000 

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

        # --- 2. Xử lý "Golden Hour" (Viewpoint, Yacht/Cruise) ---
        # Mục tiêu: Đẩy các hoạt động này vào khoảng 16:30 (990p) -> 18:30 (1110p)
        day_start_mins = self.context.get("day_start_mins", 0)
        
        golden_hour_start = 16 * 60 + 30 # 16:30
        golden_hour_end = 18 * 60 + 30   # 18:30
        
        golden_start_rel = max(0, golden_hour_start - day_start_mins)
        
        # --- 3. Daylight Constraint ---
        sunset_limit = 18 * 60 # 18:00
        sunset_limit_rel = max(0, sunset_limit - day_start_mins)

        for i in range(self.num_places):
            if i == self.depot: continue
            
            loc_data = self.locations[i]
            tags = loc_data.get("tags", [])
            
            # Logic Golden Hour: Viewpoint & Yacht nên đi tầm chiều tà
            if any(t in ["viewpoint", "yacht", "cruise"] for t in tags):
                # Penalty thấp hơn ăn uống, nhưng đủ để khuyến khích
                self.time_dim.SetCumulVarSoftLowerBound(i, golden_start_rel, 300)
            
            # Logic Daylight: Beach/Island phải về trước tối (trừ khi có ăn uống/bar)
            if any(t in ["beach", "island"] for t in tags):
                if not any(t in ["restaurant", "bar", "nightlife", "yacht", "cruise"] for t in tags):
                     self.time_dim.SetCumulVarSoftUpperBound(i, sunset_limit_rel, 500)

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
        hotel_title = depot_place.get('location_name', 'Nơi nghỉ dưỡng')
        
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
            
            if arrival_actual >= max_end_time_relative:
                break

            service_time = self.instance["service_time"][node]
            end_time_actual = min(arrival_actual + service_time, max_end_time_relative)
            
            # --- LOGIC SHORT VISIT (Honeymoon Style) ---
            # Trăng mật cần sự thong thả tối đa. 
            # Bất kỳ điểm nào (trừ depot) mà thời gian thực tế quá ngắn đều bị cắt.
            actual_duration = end_time_actual - arrival_actual
            if node != self.depot and index != self.routing.Start(0):
                # Phải chơi được ít nhất 70% thời gian dự kiến hoặc ít nhất 60 phút
                # Logic này giúp loại bỏ các điểm "chạy sô" cuối ngày
                if actual_duration < (service_time * 0.7) or actual_duration < 60:
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

            # --- Logic Energy (Honeymoon Tuned) ---
            if node != self.depot:
                tags = place.get("tags", [])
                
                # Logic tiêu hao năng lượng cho cặp đôi
                if any(t in ["hotel", "resort", "homestay"] for t in tags): 
                    energy_loss = -60 # Về phòng là hồi phục mạnh nhất (ngủ, tắm, chill)
                
                elif any(t in ["yacht/cruise"] for t in tags):
                    energy_loss = 5   # Cruise rất chill, tốn cực ít sức
                    
                elif any(t in ["cafe", "viewpoint"] for t in tags): 
                    energy_loss = 5   # Ngồi ngắm cảnh/uống nước -> Rất nhẹ nhàng
                
                elif "restaurant" in tags: 
                    energy_loss = 10  # Ăn uống
                
                elif any(t in ["island"] for t in tags): 
                    energy_loss = 35  # Đi đảo vẫn mệt (di chuyển tàu bè, nắng)
                
                elif "beach" in tags: 
                    energy_loss = 25  # Tắm biển
                
                else: 
                    energy_loss = 20
                
                total_energy = max(0, min(100, total_energy - energy_loss))

                # Cơ chế nghỉ ngơi: Honeymoon cần giữ sức để buổi tối lãng mạn
                # Ngưỡng thấp hơn (40) để khuyến khích về phòng nghỉ ngơi (freshen up) sớm hơn
                if total_energy < 40:
                      next_index = solution.Value(self.routing.NextVar(index))
                      if not self.routing.IsEnd(next_index):
                          next_node = self.manager.NodeToIndex(next_index)
                          travel_direct = time_matrix[node][next_node]
                          travel_to_depot = time_matrix[node][self.depot]
                          rest_duration = 90 # Nghỉ lâu (tắm rửa, thay đồ đẹp)
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
                                 "description": f"Về {hotel_title} nghỉ ngơi & thay đồ",
                                 "activity": "Nghỉ ngơi",
                                 "location": depot_place
                              })
                              sequence_order += 1
            
            visited_nodes.append(node)
            index = solution.Value(self.routing.NextVar(index))

        last_end_str = trip_details[-1]["endTime"] if trip_details else minutes_to_str(0, day_start_mins, 'down')
        
        trip_details.append({
            "sequenceOrder": sequence_order,
            "startTime": last_end_str,
            "endTime": last_end_str,
            "description": f"Kết thúc ngày, về {hotel_title} nghỉ ngơi",
            "location": depot_place,
            "activity": "Nghỉ ngơi"
        })

        real_visited = [n for n in visited_nodes if n != self.depot]
        return real_visited, trip_details