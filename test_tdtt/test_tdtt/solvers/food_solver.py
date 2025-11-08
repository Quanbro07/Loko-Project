# solvers/food_solver.py
import json
from .base_solver import BaseSolver
from ortools.constraint_solver import pywrapcp
from config import *
from utils import minutes_to_str

class FoodSolver(BaseSolver):
    """
    Solver cho du lịch Ẩm thực.
    Kế thừa BaseSolver và thêm các ràng buộc đặc thù cho Ẩm thực.
    """
    def __init__(self, instance, profile):
        if instance["night_nodes"]:
            instance["max_duration"] = (24 * 60) - DAY_START_TIME 
        else:
            instance["max_duration"] = MAX_DAY_DURATION 

        super().__init__(instance, profile)

    def _add_profile_specific_constraints(self):
        """
        Triển khai hàm abstract: Thêm ràng buộc mềm cho bữa trưa và chợ đêm.
        """
        print("... Thêm ràng buộc Ẩm thực (Bữa trưa, Chợ đêm)...")
        
        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            self.time_dim.SetCumulVarSoftLowerBound(idx, LUNCH_START_MINS, LUNCH_PENALTY)
            self.time_dim.SetCumulVarSoftUpperBound(idx, LUNCH_END_MINS, LUNCH_PENALTY)

        night_start_min = (19 * 60) - DAY_START_TIME
        for node in self.instance["night_nodes"]:
            idx = self.manager.NodeToIndex(node)
            self.time_dim.SetCumulVarSoftLowerBound(idx, night_start_min, 300)

    # --- SỬA ĐỔI: Tên hàm và xóa bỏ vòng lặp ---
    def run_single_itinerary(self, attempt_num, time_limit_seconds=30):
        """
        Hàm này chỉ chạy MỘT lần, lưu file, hỏi y/n, và trả kết quả.
        """
        solution = self.solve(time_limit_seconds) 
        
        if not solution:
            print("❌ Không thể tìm được lịch trình hợp lệ.")
            # Trả về "no" và danh sách rỗng
            return "n", [] 

        print("\n🗓️  Lịch trình được tạo:")
        print("=" * 70)
        
        # Lấy cả 2 kết quả từ format_solution
        visited_nodes, schedule_data = self.format_solution(solution)
        
        print("=" * 70)
        
        # Ghi file JSON (ghi đè)
        print(f"🔄 Đang lưu lịch trình (lần {attempt_num}) vào schedule.json...")
        try:
            with open("schedule.json", "w", encoding="utf-8") as f:
                json.dump(schedule_data, f, ensure_ascii=False, indent=4)
            print("✅ Đã lưu file schedule.json.")
        except Exception as e:
            print(f"❌ Lỗi khi lưu file JSON: {e}")

        feedback = input("\nBạn có hài lòng với lịch trình này không? (y/n): ").strip().lower()
        
        if feedback != "y":
            feedback = "n" # Chuẩn hóa
            
        # Trả về phản hồi và danh sách các node (đã được sắp xếp lại)
        return feedback, visited_nodes
    # --- HẾT SỬA ĐỔI ---


    def _reset_solver(self):
        # (Hàm này không còn được dùng bởi vòng lặp, nhưng cứ để đó)
        self.manager = pywrapcp.RoutingIndexManager(self.num_places, 1, self.depot)
        self.routing = pywrapcp.RoutingModel(self.manager)
        self._add_cost_callbacks()
        self._add_time_dimension()
        self._add_base_constraints()


    def format_solution(self, solution):
        """
        In ra lịch trình chi tiết VÀ trả về dữ liệu (list) để lưu JSON.
        (Hàm này giữ nguyên như phiên bản trước)
        """
        visited_nodes = [] # Sẽ chứa các index ĐÃ SẮP XẾP LẠI (reordered)
        schedule_data = [] 
        
        index = self.routing.Start(0)
        total_energy = 100 
        last_tag = "hotel"
        total_added_rest_time = 0 
        time_matrix = self.instance["time_matrix"] 
        
        depot_place = self.locations[self.depot] 
        hotel_title = depot_place.get('title', 'Khách sạn')
        
        while not self.routing.IsEnd(index):
            node = self.manager.NodeToIndex(index) # node = index đã sắp xếp lại
                
            place = self.locations[node]
            tags = [t.lower() for t in place.get("tags", [])]
            name = place.get("title", f"Place {node}")
            service_time = self.instance["service_time"][node]
            
            time_var = self.time_dim.CumulVar(index)
            arrival_solved = solution.Value(time_var) 
            arrival_actual = arrival_solved + total_added_rest_time
            
            start_str = minutes_to_str(arrival_actual)
            end_str = minutes_to_str(arrival_actual + service_time)

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
                if "hotel" in tags: energy_loss = -50
                elif any(t in ["market", "night market"] for t in tags): energy_loss = 25
                elif any(t in ["restaurant", "cafe", "speciality"] for t in tags): energy_loss = 10
                else: energy_loss = 15
                total_energy = max(0, min(100, total_energy - energy_loss))
                
                if last_tag == "restaurant" and "cafe" not in tags:
                    print("    👉 Gợi ý: Nên ghé một quán cafe để thư giãn sau khi ăn.")

                if total_energy < 30:
                    next_index = solution.Value(self.routing.NextVar(index))
                    next_node = self.manager.IndexToNode(next_index)
                    
                    if not self.routing.IsEnd(next_index):
                        travel_to_depot = time_matrix[node][self.depot]
                        rest_duration = 60
                        travel_from_depot = time_matrix[self.depot][next_node]
                        detour_time = travel_to_depot + rest_duration + travel_from_depot
                        
                        next_arrival_solved = solution.Value(self.time_dim.CumulVar(next_index))
                        current_leave_solved = arrival_solved + service_time
                        solved_travel_time = next_arrival_solved - current_leave_solved
                        
                        extra_time_needed = max(0, detour_time - solved_travel_time)
                        
                        total_energy = 100 
                        total_added_rest_time += extra_time_needed

                        current_leave_actual = arrival_actual + service_time
                        
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

            visited_nodes.append(node) # Thêm index đã sắp xếp lại
            last_tag = tags[0] if tags else "unknown"
            index = solution.Value(self.routing.NextVar(index))

        end_time_solved = solution.Value(self.time_dim.CumulVar(index))
        end_time_actual = end_time_solved + total_added_rest_time
        end_str_final = minutes_to_str(end_time_actual)
        
        print(f"- [{end_str_final}] Quay về {hotel_title} 🏨")
        
        schedule_data.append({
            "start": end_str_final, "end": end_str_final,
            "place_id": depot_place.get("place_id"), "title": f"Quay về {hotel_title}",
            "description": depot_place.get("description"), "rating": depot_place.get("rating"),
            "longitude": depot_place.get("longitude"), "latitude": depot_place.get("latitude")
        })
        
        # Trả về các index ĐÃ SẮP XẾP LẠI (reordered)
        return [n for n in visited_nodes if n != self.depot], schedule_data