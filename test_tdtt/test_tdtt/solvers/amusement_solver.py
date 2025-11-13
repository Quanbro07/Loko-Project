# solvers/amusement_solver.py
import json
from .base_solver import BaseSolver
from ortools.constraint_solver import pywrapcp
from config import *
from utils import minutes_to_str

class AmusementSolver(BaseSolver):
    """
    Solver cho du lịch Giải trí (Amusement).
    """
    def __init__(self, instance, profile):
        instance["max_duration"] = MAX_DAY_DURATION
        super().__init__(instance, profile)

    def _add_profile_specific_constraints(self):
        """
        Triển khai hàm abstract: Thêm ràng buộc mềm cho bữa trưa và nightlife.
        """
        print("... Thêm ràng buộc Giải trí (Bữa trưa, Nightlife)...")
        
        # --- SỬA Ở ĐÂY: Giảm hình phạt ăn sai giờ ---
        # (Chi phí bỏ qua nhà hàng là ~375)
        # Đặt hình phạt sai giờ < 375 (ví dụ: 150)
        CUSTOM_LUNCH_PENALTY = 150 # Thay vì LUNCH_PENALTY (500)
        # --- HẾT SỬA ---

        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            # Ràng buộc mềm cho bữa trưa
            self.time_dim.SetCumulVarSoftLowerBound(idx, LUNCH_START_MINS, CUSTOM_LUNCH_PENALTY)
            self.time_dim.SetCumulVarSoftUpperBound(idx, LUNCH_END_MINS, CUSTOM_LUNCH_PENALTY)
            
            # Ràng buộc mềm cho bữa tối
            dinner_start = (18 * 60) - DAY_START_TIME
            dinner_end = (20 * 60) - DAY_START_TIME
            self.time_dim.SetCumulVarSoftLowerBound(idx, dinner_start, CUSTOM_LUNCH_PENALTY)
            self.time_dim.SetCumulVarSoftUpperBound(idx, dinner_end, CUSTOM_LUNCH_PENALTY)

        # Yêu cầu: Night life chỉ đi sau 9g đêm (21:00)
        night_start_min = (21 * 60) - DAY_START_TIME
        for node in self.instance["night_nodes"]:
            idx = self.manager.NodeToIndex(node)
            self.time_dim.SetCumulVarSoftLowerBound(idx, night_start_min, 300)

    # (Các hàm run_single_itinerary, _reset_solver, format_solution 
    # giữ nguyên, không cần thay đổi)

    # --- HÀM NÀY GIỐNG HỆT FOOD_SOLVER ---
    def run_single_itinerary(self, attempt_num, time_limit_seconds=30):
        """
        Hàm này chỉ chạy MỘT lần, lưu file, hỏi y/n, và trả kết quả.
        """
        solution = self.solve(time_limit_seconds) 
        
        if not solution:
            print("❌ Không thể tìm được lịch trình hợp lệ.")
            return "n", [] 

        print("\n🗓️  Lịch trình được tạo:")
        print("=" * 70)
        
        visited_nodes, schedule_data = self.format_solution(solution)
        
        print("=" * 70)
        
        print(f"🔄 Đang lưu lịch trình (lần {attempt_num}) vào schedule.json...")
        try:
            with open("schedule.json", "w", encoding="utf-8") as f:
                json.dump(schedule_data, f, ensure_ascii=False, indent=4)
            print("✅ Đã lưu file schedule.json.")
        except Exception as e:
            print(f"❌ Lỗi khi lưu file JSON: {e}")

        feedback = input("\nBạn có hài lòng với lịch trình này không? (y/n): ").strip().lower()
        
        if feedback != "y":
            feedback = "n"
            
        return feedback, visited_nodes

    # --- HÀM NÀY GIỐNG HỆT FOOD_SOLVER ---
    def _reset_solver(self):
        self.manager = pywrapcp.RoutingIndexManager(self.num_places, 1, self.depot)
        self.routing = pywrapcp.RoutingModel(self.manager)
        self._add_cost_callbacks()
        self._add_time_dimension()
        self._add_base_constraints()

    # --- HÀM NÀY ĐÃ SỬA LOGIC ENERGY ---
    def format_solution(self, solution):
        """
        In ra lịch trình chi tiết VÀ trả về dữ liệu (list) để lưu JSON.
        Logic energy tiêu hao cao hơn.
        """
        visited_nodes = []
        schedule_data = [] 
        index = self.routing.Start(0)
        total_energy = 100 
        last_tag = "hotel"
        total_added_rest_time = 0 
        time_matrix = self.instance["time_matrix"] 
        depot_place = self.locations[self.depot] 
        hotel_title = depot_place.get('title', 'Khách sạn')
        
        from config import DAY_START_TIME, DAY_END_TIME
        max_end_time_mins = DAY_END_TIME - DAY_START_TIME
        
        while not self.routing.IsEnd(index):
            node = self.manager.NodeToIndex(index)
            place = self.locations[node]
            tags = [t.lower() for t in place.get("tags", [])]
            name = place.get("title", f"Place {node}")
            service_time = self.instance["service_time"][node]
            
            time_var = self.time_dim.CumulVar(index)
            arrival_solved = solution.Value(time_var) 
            arrival_actual = arrival_solved + total_added_rest_time
            
            if arrival_actual > max_end_time_mins:
                print(f"⚠️ Đã đạt giới hạn thời gian ({minutes_to_str(max_end_time_mins)}), dừng lịch trình.")
                break
            
            end_time_actual = min(arrival_actual + service_time, max_end_time_mins)
            if end_time_actual < arrival_actual:
                break
            
            start_str = minutes_to_str(arrival_actual)
            end_str = minutes_to_str(end_time_actual)

            if node == self.depot and index != self.routing.Start(0):
                break 
            
            print(f"- [{start_str} → {end_str}] {name} (Dừng: {service_time}p)")
            print(f"    Tags: {tags} | Energy: {total_energy}%")
            
            schedule_data.append({
                "start": start_str, "end": end_str,
                "place_id": place.get("place_id"), "title": name,
                "description": place.get("description"), "rating": place.get("rating"),
                "longitude": place.get("longitude"), "latitude": place.get("latitude")
            })

            if node != self.depot:
                if "hotel" in tags: 
                    energy_loss = -50
                elif any(t in ["zoo", "amusement/water park"] for t in tags): 
                    energy_loss = 35
                elif any(t in ["cultural performance", "nightlife", "market"] for t in tags):
                    energy_loss = 25
                elif any(t in ["restaurant", "cafe"] for t in tags):
                    energy_loss = 10
                else: 
                    energy_loss = 20
                
                total_energy = max(0, min(100, total_energy - energy_loss))
                
                if total_energy < 30:
                    next_index = solution.Value(self.routing.NextVar(index))
                    next_node = self.manager.NodeToIndex(next_index)
                    
                    if not self.routing.IsEnd(next_index):
                        travel_to_depot = time_matrix[node][self.depot]
                        rest_duration = 60
                        travel_from_depot = time_matrix[self.depot][next_node]
                        detour_time = travel_to_depot + rest_duration + travel_from_depot
                        estimated_end_after_rest = end_time_actual + detour_time
                        
                        if estimated_end_after_rest > max_end_time_mins:
                            print(f"    ⚠️ Không đủ thời gian để nghỉ ngơi (sẽ vượt quá {minutes_to_str(max_end_time_mins)}), tiếp tục lịch trình.")
                        else:
                            next_arrival_solved = solution.Value(self.time_dim.CumulVar(next_index))
                            current_leave_solved = arrival_solved + service_time
                            solved_travel_time = next_arrival_solved - current_leave_solved
                            extra_time_needed = max(0, detour_time - solved_travel_time)
                            
                            if end_time_actual + extra_time_needed > max_end_time_mins:
                                extra_time_needed = max(0, max_end_time_mins - end_time_actual)
                                if extra_time_needed == 0:
                                    print(f"    ⚠️ Không đủ thời gian để nghỉ ngơi, tiếp tục lịch trình.")
                                    visited_nodes.append(node)
                                    last_tag = tags[0] if tags else "unknown"
                                    index = solution.Value(self.routing.NextVar(index))
                                    continue
                            
                            total_energy = 100 
                            total_added_rest_time += extra_time_needed

                            current_leave_actual = end_time_actual
                            rest_start_1_str = minutes_to_str(current_leave_actual)
                            arrive_at_hotel_time = current_leave_actual + travel_to_depot
                            rest_end_1_str = minutes_to_str(arrive_at_hotel_time)
                            rest_start_2_str = rest_end_1_str
                            leave_hotel_time = arrive_at_hotel_time + rest_duration
                            rest_end_2_str = minutes_to_str(leave_hotel_time)

                            print(f"- [{rest_start_1_str} → {rest_end_1_str}] (Di chuyển về) {hotel_title} (Dừng: 0p)")
                            print(f"- [{rest_start_2_str} → {rest_end_2_str}] (Nghỉ ngơi tại) {hotel_title} (Dừng: {rest_duration}p)")
                            print(f"    💤 Năng lượng đã hồi phục!")

                            schedule_data.append({
                                "start": rest_start_1_str, "end": rest_end_1_str,
                                "place_id": depot_place.get("place_id"), "title": f"(Di chuyển về) {hotel_title}",
                                "description": "Di chuyển về khách sạn để nghỉ ngơi", "rating": depot_place.get("rating"),
                                "longitude": depot_place.get("longitude"), "latitude": depot_place.get("latitude")
                            })
                            schedule_data.append({
                                "start": rest_start_2_str, "end": rest_end_2_str,
                                "place_id": depot_place.get("place_id"), "title": f"(Nghỉ ngơi tại) {hotel_title}",
                                "description": f"Nghỉ ngơi {rest_duration} phút", "rating": depot_place.get("rating"),
                                "longitude": depot_place.get("longitude"), "latitude": depot_place.get("latitude")
                            })
                    else:
                        print(f"    💤 Năng lượng thấp! May mắn đây là điểm cuối.")

            visited_nodes.append(node)
            last_tag = tags[0] if tags else "unknown"
            index = solution.Value(self.routing.NextVar(index))

        end_time_solved = solution.Value(self.time_dim.CumulVar(index))
        end_time_actual = min(end_time_solved + total_added_rest_time, max_end_time_mins)
        end_str_final = minutes_to_str(end_time_actual)
        
        print(f"- [{end_str_final}] Quay về {hotel_title} 🏨")
        
        schedule_data.append({
            "start": end_str_final, "end": end_str_final,
            "place_id": depot_place.get("place_id"), "title": f"Quay về {hotel_title}",
            "description": depot_place.get("description"), "rating": depot_place.get("rating"),
            "longitude": depot_place.get("longitude"), "latitude": depot_place.get("latitude")
        })
        
        return [n for n in visited_nodes if n != self.depot], schedule_data