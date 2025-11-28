from app.solvers.base_solver import BaseSolver
from app.schedule_utils import minutes_to_str, time_str_to_minutes

class VacationSolver(BaseSolver):
    def __init__(self, instance, profile, context):
        super().__init__(instance, profile, context)

    def _add_profile_specific_constraints(self):
        """
        Thêm các ràng buộc đặc thù cho Vacation:
        1. Giờ ăn (Rất quan trọng, penalty cao).
        2. Beach/Island/Camping: Ưu tiên khung giờ có ánh sáng.
        """
        
        # --- 1. Xử lý Giờ ăn (Logic giữ nguyên vì quan trọng) ---
        lunch_start = self.context.get("lunch_start")
        lunch_end = self.context.get("lunch_end")
        dinner_start = self.context.get("dinner_start")
        dinner_end = self.context.get("dinner_end")
        
        # Penalty cao để ép đúng giờ ăn nghỉ dưỡng
        meal_penalty = 10000 

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

        # --- 2. Xử lý Logic "Daylight" (Beach, Island) ---
        # Đi biển/đảo nên kết thúc trước khi trời tối (ví dụ 17:30 = 1050 phút)
        # Trừ khi đó là camping hoặc có tag nightlife
        sunset_time = 17 * 60 + 30  # 17:30
        day_start_mins = self.context.get("day_start_mins", 0)
        sunset_relative = max(0, sunset_time - day_start_mins)

        # Lặp qua tất cả nodes để tìm Beach/Island
        for i in range(self.num_places):
            # Bỏ qua depot
            if i == self.depot: continue
            
            loc_data = self.locations[i]
            tags = loc_data.get("tags", [])
            
            # Nếu là Beach hoặc Island, và KHÔNG phải nightlife/camping -> Ép về trước hoàng hôn
            if any(t in ["beach", "island"] for t in tags):
                if not any(t in ["nightlife", "bar", "camping"] for t in tags):
                     # Penalty vừa phải (500) để AI cố gắng xếp buổi sáng/chiều, 
                     # nhưng nếu bắt buộc vẫn có thể trễ hơn xíu
                    self.time_dim.SetCumulVarSoftUpperBound(i, sunset_relative, 500)

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
        # Lấy tên nơi ở (Hotel/Resort/Homestay)
        hotel_title = depot_place.get('location_name', 'Nơi lưu trú')
        
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
            
            # Check giới hạn thời gian ngày
            if arrival_actual >= max_end_time_relative:
                break

            service_time = self.instance["service_time"][node]
            end_time_actual = min(arrival_actual + service_time, max_end_time_relative)
            
            # --- LOGIC SHORT VISIT (Quan trọng cho Vacation) ---
            # Đi nghỉ dưỡng cần thong thả. Nếu thời gian còn lại quá ít -> Cắt bỏ.
            actual_duration = end_time_actual - arrival_actual
            if node != self.depot and index != self.routing.Start(0):
                # Nếu thời gian chơi < 60% service_time hoặc < 45 phút (khắt khe hơn Amusement)
                if actual_duration < (service_time * 0.6) or actual_duration < 45:
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

            # --- Logic Energy & Rest (Vacation tuned) ---
            if node != self.depot:
                tags = place.get("tags", [])
                
                # Logic hồi/mất sức cho Vacation
                if any(t in ["hotel", "resort", "homestay"] for t in tags): 
                    energy_loss = -50 # Về phòng nghỉ -> Hồi sức
                
                elif "spa" in tags: 
                    energy_loss = -30 # Spa -> Hồi sức (nhẹ hơn về ngủ)
                
                elif any(t in ["island", "camping"] for t in tags): 
                    energy_loss = 40 # Đi đảo/cắm trại -> Tốn nhiều sức
                
                elif "beach" in tags: 
                    energy_loss = 30 # Tắm biển -> Tốn khá sức
                
                elif any(t in ["cafe"] for t in tags): 
                    energy_loss = 5 # Cafe -> Chill, tốn rất ít
                
                elif "restaurant" in tags: 
                    energy_loss = 10 # Ăn uống -> Bình thường
                
                else: 
                    energy_loss = 20 # Mặc định
                
                # Trừ (hoặc cộng) năng lượng
                total_energy = max(0, min(100, total_energy - energy_loss))

                # Cơ chế tự động chèn nghỉ ngơi nếu cạn năng lượng
                if total_energy < 30:
                      next_index = solution.Value(self.routing.NextVar(index))
                      if not self.routing.IsEnd(next_index):
                          next_node = self.manager.NodeToIndex(next_index)
                          travel_direct = time_matrix[node][next_node]
                          travel_to_depot = time_matrix[node][self.depot]
                          rest_duration = 90 # Nghỉ dưỡng nên nghỉ lâu hơn (90p thay vì 60p)
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
                                 "description": f"Về {hotel_title} nghỉ ngơi nạp năng lượng",
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
            "description": f"Kết thúc ngày, quay về {hotel_title}",
            "location": depot_place,
            "activity": "Nghỉ ngơi"
        })

        real_visited = [n for n in visited_nodes if n != self.depot]
        return real_visited, trip_details