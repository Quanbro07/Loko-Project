# solvers/food_solver.py
import json # <-- THÊM VÀO: Cần thiết để ghi file JSON
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
        # GIỮ NGUYÊN LOGIC CŨ (THEO YÊU CẦU)
        if instance["night_nodes"]:
            instance["max_duration"] = (24 * 60) - DAY_START_TIME # 16 tiếng
        else:
            instance["max_duration"] = MAX_DAY_DURATION # 14 tiếng

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

        night_start_min = (19 * 60) - DAY_START_TIME # 19:00
        for node in self.instance["night_nodes"]:
            idx = self.manager.NodeToIndex(node)
            self.time_dim.SetCumulVarSoftLowerBound(idx, night_start_min, 300)

    def run_solver_with_feedback(self, max_attempts=3, time_limit_seconds=30):
        """
        Hàm chính để chạy solver, có vòng lặp phản hồi của người dùng.
        SẼ LƯU KẾT QUẢ RA JSON MỖI LẦN TẠO LỊCH TRÌNH.
        """
        for attempt in range(1, max_attempts + 1):
            print(f"\n🚀 Bắt đầu sinh lịch trình Ẩm thực (lần {attempt})...")
            
            solution = self.solve(time_limit_seconds) 
            
            if not solution:
                print("❌ Không thể tìm được lịch trình hợp lệ.")
                return None

            print("\n🗓️  Lịch trình được tạo:")
            print("=" * 70)
            
            # --- SỬA ĐỔI 1: Lấy cả 2 kết quả từ format_solution ---
            visited_nodes, schedule_data = self.format_solution(solution)
            
            print("=" * 70)
            
            # --- SỬA ĐỔI 2: Ghi file JSON ngay lập tức (và ghi đè) ---
            print(f"🔄 Đang lưu lịch trình (lần {attempt}) vào schedule.json...")
            try:
                with open("schedule.json", "w", encoding="utf-8") as f:
                    json.dump(schedule_data, f, ensure_ascii=False, indent=4)
                print("✅ Đã lưu file schedule.json.")
            except Exception as e:
                print(f"❌ Lỗi khi lưu file JSON: {e}")
            # --- HẾT SỬA ĐỔI 2 ---

            feedback = input("\nBạn có hài lòng với lịch trình này không? (y/n): ").strip().lower()
            if feedback == "y":
                print("🎉 Cảm ơn bạn! Chúc bạn có một chuyến đi vui vẻ. (Lịch trình cuối cùng đã được lưu)")
                return visited_nodes
            else:
                for node in visited_nodes:
                    if node != self.depot:
                        current_penalty = self.instance["penalties"][node]
                        new_penalty = int(max(5, current_penalty * 0.2)) 
                        self.instance["penalties"][node] = new_penalty
                
                print(f"🔄 Đã giảm độ ưu tiên, tạo lại lịch trình khác (sẽ ghi đè file JSON)...\n")
                
                self._reset_solver()


    def _reset_solver(self):
        """Tạo lại model với penalties đã được cập nhật."""
        self.manager = pywrapcp.RoutingIndexManager(self.num_places, 1, self.depot)
        self.routing = pywrapcp.RoutingModel(self.manager)
        self._add_cost_callbacks()
        self._add_time_dimension()
        self._add_base_constraints()


    def format_solution(self, solution):
        """
        In ra lịch trình chi tiết VÀ trả về dữ liệu (list) để lưu JSON.
        """
        visited_nodes = []
        schedule_data = [] # <-- Dữ liệu JSON sẽ được lưu ở đây
        
        index = self.routing.Start(0)
        total_energy = 100 
        last_tag = "hotel"
        total_added_rest_time = 0 
        time_matrix = self.instance["time_matrix"] 
        
        depot_place = self.locations[self.depot] # Lấy thông tin khách sạn
        
        while not self.routing.IsEnd(index):
            node = self.manager.NodeToIndex(index)
                
            place = self.locations[node]
            tags = [t.lower() for t in place.get("tags", [])]
            name = place.get("title", f"Place {node}")
            service_time = self.instance["service_time"][node]
            
            time_var = self.time_dim.CumulVar(index)
            arrival_solved = solution.Value(time_var) 
            arrival_actual = arrival_solved + total_added_rest_time
            
            start_str = minutes_to_str(arrival_actual)
            end_str = minutes_to_str(arrival_actual + service_time)

            # --- In ra Console (Giữ nguyên) ---
            if node == self.depot and index != self.routing.Start(0):
                break # Đã quay về khách sạn
            
            print(f"- [{start_str} → {end_str}] {name} (Dừng: {service_time}p)")
            print(f"    Tags: {tags} | Energy: {total_energy}%")
            
            if node != self.depot:
                if "hotel" in tags: energy_loss = -50
                elif any(t in ["market", "night market"] for t in tags): energy_loss = 25
                elif any(t in ["restaurant", "cafe", "speciality"] for t in tags): energy_loss = 10
                else: energy_loss = 15
                total_energy = max(0, min(100, total_energy - energy_loss))
                
                if last_tag == "restaurant" and "cafe" not in tags:
                    print("    👉 Gợi ý: Nên ghé một quán cafe để thư giãn sau khi ăn.")

                if total_energy < 30 and "hotel" not in tags:
                    # ... (logic mô phỏng nghỉ ngơi giữ nguyên) ...
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
                        print(f"    💤 Năng lượng thấp! Quay về khách sạn nghỉ {rest_duration}p.")
                        print(f"    (Hành trình này cộng thêm {extra_time_needed} phút vào lịch trình)")
                        total_added_rest_time += extra_time_needed
                        total_energy = 100 
                    else:
                        print(f"    💤 Năng lượng thấp! May mắn đây là điểm cuối.")

            # --- Thêm dữ liệu vào list JSON ---
            entry = {
                "start": start_str,
                "end": end_str,
                "place_id": place.get("place_id"),
                "title": name,
                "description": place.get("description"),
                "rating": place.get("rating"),
                "longitude": place.get("longitude"),
                "latitude": place.get("latitude"),
                "type": place.get("type") or (tags[0] if tags else "unknown")
            }
            schedule_data.append(entry)
            # --- Hết phần thêm JSON ---

            visited_nodes.append(node)
            last_tag = tags[0] if tags else "unknown"
            index = solution.Value(self.routing.NextVar(index))

        # --- In điểm cuối (Quay về) ra Console ---
        end_time_solved = solution.Value(self.time_dim.CumulVar(index))
        end_time_actual = end_time_solved + total_added_rest_time
        end_str_final = minutes_to_str(end_time_actual)
        print(f"- [{end_str_final}] Quay về {depot_place.get('title', 'Khách sạn')} 🏨")
        
        # --- Thêm điểm cuối vào list JSON ---
        entry = {
            "start": start_str,
            "end": end_str,
            "place_id": place.get("place_id"),
            "title": name,
            "description": place.get("description"),
            "rating": place.get("rating"),
            "longitude": place.get("longitude"),
            "latitude": place.get("latitude"),
            "type": place.get("type") or (tags[0] if tags else "unknown")
        }
        schedule_data.append(entry)
        
        # --- SỬA ĐỔI 3: Trả về cả 2 ---
        return [n for n in visited_nodes if n != self.depot], schedule_data