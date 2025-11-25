from app.solvers.base_solver import BaseSolver
from app.schedule_utils import minutes_to_str, time_str_to_minutes

class AmusementSolver(BaseSolver):
    def __init__(self, instance, profile, context):
        super().__init__(instance, profile, context)

    def _add_profile_specific_constraints(self):
        # FIX: Tăng penalty để ép AI phải chọn địa điểm ăn uống nếu có
        
        lunch_start = self.context.get("lunch_start")
        lunch_end = self.context.get("lunch_end")
        dinner_start = self.context.get("dinner_start")
        dinner_end = self.context.get("dinner_end")
        
        # TĂNG PENALTY: Từ 150 lên 300. 
        # Nếu bỏ qua khung giờ này (hoặc chọn sai giờ) sẽ bị phạt nặng hơn -> AI sẽ ưu tiên xếp đúng giờ ăn.
        meal_penalty = 300 

        # 1. Xử lý Nightlife
        day_start_mins = self.context.get("day_start_mins")
        night_start_absolute = 21 * 60 
        night_start_relative = night_start_absolute - day_start_mins
        
        if night_start_relative < self.context.get("max_duration"):
            for node in self.instance["night_nodes"]:
                tags = self.instance["locations_data"][node].get("tags", [])
                if "nightlife" in tags or "bar" in tags:
                    idx = self.manager.NodeToIndex(node)
                    self.time_dim.SetCumulVarSoftLowerBound(idx, night_start_relative, 200)

        # 2. Xử lý Ăn uống
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
                # Mở cả ngày -> Linh hoạt (Lunch start -> Dinner end)
                if lunch_start and dinner_end:
                    self.time_dim.SetCumulVarSoftLowerBound(idx, lunch_start, meal_penalty)
                    self.time_dim.SetCumulVarSoftUpperBound(idx, dinner_end, meal_penalty)

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
            
            # Nếu đến nơi mà đã hết giờ ngày -> Dừng
            if arrival_actual >= max_end_time_relative:
                break

            service_time = self.instance["service_time"][node]
            
            # Thời gian kết thúc thực tế (bị chặn bởi max_duration)
            end_time_actual = min(arrival_actual + service_time, max_end_time_relative)
            
            # --- FIX LOGIC: TRÁNH ĐI CỐ (SHORT VISIT) ---
            # Tính thời gian thực sự chơi được
            actual_duration = end_time_actual - arrival_actual
            
            # Logic: Nếu thời gian chơi thực tế quá ngắn (ví dụ < 50% thời gian chuẩn hoặc < 30 phút)
            # Thì coi như không đủ để trải nghiệm -> CẮT BỎ, kết thúc ngày sớm hơn.
            # (Trừ trường hợp là depot đầu tiên)
            if node != self.depot and index != self.routing.Start(0):
                if actual_duration < (service_time * 0.5) or actual_duration < 30:
                    # Dừng vòng lặp, không thêm node này vào lịch
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

            # --- Logic Energy & Rest ---
            if node != self.depot:
                tags = place.get("tags", [])
                if "hotel" in tags: energy_loss = -50
                elif any(t in ["zoo", "amusement/water park"] for t in tags): energy_loss = 35
                elif any(t in ["culture_performance", "nightlife", "market"] for t in tags): energy_loss = 25
                elif any(t in ["restaurant", "cafe"] for t in tags): energy_loss = 10
                else: energy_loss = 20
                
                total_energy = max(0, min(100, total_energy - energy_loss))

                if total_energy < 30:
                     next_index = solution.Value(self.routing.NextVar(index))
                     if not self.routing.IsEnd(next_index):
                         next_node = self.manager.NodeToIndex(next_index)
                         travel_direct = time_matrix[node][next_node]
                         travel_to_depot = time_matrix[node][self.depot]
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
                                "description": f"Về {hotel_title} nghỉ ngơi nạp năng lượng",
                                "activity": "Nghỉ ngơi",
                                "location": depot_place
                             })
                             sequence_order += 1
            
            visited_nodes.append(node)
            index = solution.Value(self.routing.NextVar(index))

        # Điểm kết thúc
        # Sử dụng thời điểm kết thúc của node cuối cùng hợp lệ
        # Nếu break sớm ở trên, thời điểm này sẽ là thời điểm kết thúc của node trước đó
        
        # Cần lấy thời gian kết thúc của node CUỐI CÙNG trong trip_details để làm mốc về khách sạn
        last_end_str = trip_details[-1]["endTime"] if trip_details else minutes_to_str(0, day_start_mins, 'down')
        
        # Tuy nhiên, để chính xác theo flow thời gian, ta lấy end_time_actual của vòng lặp cuối cùng (nếu break thì là của node bị break? Không, phải là node trước đó).
        # Đơn giản nhất: Lấy end time của activity cuối cùng + thời gian di chuyển về depot (ước lượng hoặc lấy từ matrix nếu có next_node là end).
        # Ở đây đơn giản hóa: Lấy end time của activity cuối cùng.
        
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