from app.solvers.base_solver import BaseSolver
from app.schedule_utils import minutes_to_str, time_str_to_minutes

class NightlifeSolver(BaseSolver):
    def __init__(self, instance, profile, context):
        super().__init__(instance, profile, context)

    def _add_profile_specific_constraints(self):
        """
        Constraints cho Nightlife:
        1. Giờ ăn: Tập trung vào Dinner (Ăn tối) và Supper (Ăn khuya - nếu có logic mở rộng).
        2. Night Activity: Ép Walking Street/Night Market mở sau 18:00.
        3. Late Night: Ép Bar/Pub mở sau 20:30.
        """
        
        # --- 1. Xử lý Giờ ăn (Ưu tiên Dinner) ---
        dinner_start = self.context.get("dinner_start")
        dinner_end = self.context.get("dinner_end")
        
        # Penalty cao để đảm bảo có lót dạ trước khi đi quẩy
        meal_penalty = 10000 

        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            loc_data = self.instance["locations_data"][node]
            
            # Logic đơn giản hóa cho Nightlife: Chỉ quan tâm bữa tối
            open_str = loc_data.get("open_time", "00:00")
            open_mins = time_str_to_minutes(open_str) or 0
            
            # Nếu mở cửa sau 16:00 (960 mins) -> Coi là địa điểm ăn tối
            if open_mins >= 960 and dinner_start and dinner_end:
                 self.time_dim.SetCumulVarSoftLowerBound(idx, dinner_start, meal_penalty)
                 self.time_dim.SetCumulVarSoftUpperBound(idx, dinner_end, meal_penalty)

        # --- 2. Xử lý Khung giờ Hoạt động đêm ---
        day_start_mins = self.context.get("day_start_mins", 0)
        
        # Mốc 18:00 (1080p) cho chợ đêm/phố đi bộ
        evening_start = 18 * 60 
        evening_start_rel = max(0, evening_start - day_start_mins)
        
        # Mốc 21:00 (1260p) cho Bar
        late_night_start = 21 * 60
        late_night_start_rel = max(0, late_night_start - day_start_mins)

        for i in range(self.num_places):
            if i == self.depot: continue
            
            loc_data = self.locations[i]
            tags = loc_data.get("tags", [])
            
            # Group 1: Chợ đêm, Phố đi bộ -> Nên đi sau 18:00
            if any(t in ["night market", "walking street"] for t in tags):
                # Penalty 500: Khá gắt, ép phải đi tối mới vui
                self.time_dim.SetCumulVarSoftLowerBound(i, evening_start_rel, 500)
            
            # Group 2: Bar, Camping (lửa trại) -> Nên đi sau 21:00
            if any(t in ["bar", "camping"] for t in tags):
                self.time_dim.SetCumulVarSoftLowerBound(i, late_night_start_rel, 400)

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
            
            if arrival_actual >= max_end_time_relative:
                break

            service_time = self.instance["service_time"][node]
            end_time_actual = min(arrival_actual + service_time, max_end_time_relative)
            
            # --- LOGIC SHORT VISIT (Nightlife) ---
            # Nightlife có thể chấp nhận "Bar hopping" hoặc đi dạo chợ đêm nhanh.
            # Tuy nhiên, vẫn cần tối thiểu 30-40 phút.
            actual_duration = end_time_actual - arrival_actual
            if node != self.depot and index != self.routing.Start(0):
                # Nếu < 30 phút hoặc < 40% thời gian dự kiến -> Skip
                if actual_duration < 30 or actual_duration < (service_time * 0.4):
                    break

            if end_time_actual < arrival_actual:
                end_time_actual = arrival_actual

            start_str = minutes_to_str(arrival_actual, day_start_mins, 'up')
            end_str = minutes_to_str(end_time_actual, day_start_mins, 'down')
            
            # Xử lý hiển thị giờ qua đêm (ví dụ 25:00) nếu cần thiết ở hàm minutes_to_str
            # Ở đây giữ logic cơ bản
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

            # --- Logic Energy (Nightlife Vibe) ---
            if node != self.depot:
                tags = place.get("tags", [])
                
                # Logic tiêu hao năng lượng cho Nightlife
                if "hotel" in tags: 
                    energy_loss = -50 
                
                elif "bar" in tags: 
                    energy_loss = 35 # Quẩy nhiệt tình -> Tốn sức nhanh
                
                elif "camping" in tags:
                    energy_loss = 30 # Hoạt động ngoài trời
                    
                elif any(t in ["walking street", "night market"] for t in tags): 
                    energy_loss = 25 # Đi bộ chen chúc -> Khá mệt
                
                elif "restaurant" in tags: 
                    energy_loss = -5 # Ăn tối -> Hồi chút sức (nạp năng lượng thực tế)
                
                elif "cafe" in tags: 
                    energy_loss = -10 # Ngồi cafe nghỉ chân -> Hồi sức
                
                else: 
                    energy_loss = 20
                
                total_energy = max(0, min(100, total_energy - energy_loss))

                # Cơ chế nghỉ ngơi:
                # Với Nightlife, khi mệt (low energy), người ta thường tìm quán ăn đêm hoặc cafe, 
                # hoặc về khách sạn ngủ luôn.
                if total_energy < 25:
                      next_index = solution.Value(self.routing.NextVar(index))
                      if not self.routing.IsEnd(next_index):
                          next_node = self.manager.NodeToIndex(next_index)
                          travel_direct = time_matrix[node][next_node]
                          travel_to_depot = time_matrix[node][self.depot]
                          # Nghỉ ngơi ngắn hơn một chút vì thời gian buổi tối ngắn
                          rest_duration = 60 
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
                                 "description": f"Về {hotel_title} nghỉ ngơi lấy sức",
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
            "description": f"Kết thúc đêm, về {hotel_title} ngủ",
            "location": depot_place,
            "activity": "Nghỉ ngơi"
        })

        real_visited = [n for n in visited_nodes if n != self.depot]
        return real_visited, trip_details