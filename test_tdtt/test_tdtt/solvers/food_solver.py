# solvers/food_solver.py
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
        # Nạp max_duration riêng của food (nếu có) vào instance
        # Yêu cầu: "lùi lại thời gian kết thúc chuyến đi để có thể đi night market"
        # Cho phép đi trễ hơn 2 tiếng (đến 24:00) nếu có đi chợ đêm
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
        
        # --- Yêu cầu: Ưu tiên restaurant vào trưa/tối ---
        for node in self.instance["lunch_nodes"]:
            idx = self.manager.NodeToIndex(node)
            # Phạt nếu ghé nhà hàng ngoài khung giờ 11:30 - 13:30
            self.time_dim.SetCumulVarSoftLowerBound(idx, LUNCH_START_MINS, LUNCH_PENALTY)
            self.time_dim.SetCumulVarSoftUpperBound(idx, LUNCH_END_MINS, LUNCH_PENALTY)
            
            # (Bạn có thể thêm 1 khung giờ tối ở đây nếu muốn)
            # DINNER_START = (18 * 60) - DAY_START_TIME
            # DINNER_END = (20 * 60) - DAY_START_TIME
            # self.time_dim.SetCumulVarSoftLowerBound(idx, DINNER_START, LUNCH_PENALTY)
            # self.time_dim.SetCumulVarSoftUpperBound(idx, DINNER_END, LUNCH_PENALTY)


        # --- Yêu cầu: Night market chỉ nên ghé sau 7g tối ---
        night_start_min = (19 * 60) - DAY_START_TIME # 19:00
        for node in self.instance["night_nodes"]:
            idx = self.manager.NodeToIndex(node)
            # Phạt 300 nếu ghé chợ đêm TRƯỚC 19:00
            self.time_dim.SetCumulVarSoftLowerBound(idx, night_start_min, 300)

    def run_solver_with_feedback(self, max_attempts=3, time_limit_seconds=30):
        """
        Hàm chính để chạy solver, có vòng lặp phản hồi của người dùng.
        """
        for attempt in range(1, max_attempts + 1):
            print(f"\n🚀 Bắt đầu sinh lịch trình Ẩm thực (lần {attempt})...")
            
            solution = self.solve(time_limit_seconds) # Gọi hàm solve() của BaseSolver
            
            if not solution:
                print("❌ Không thể tìm được lịch trình hợp lệ.")
                return None

            print("\n🗓️  Lịch trình được tạo:")
            print("=" * 70)
            visited_nodes = self.format_solution(solution)
            print("=" * 70)

            # --- Yêu cầu: Phản hồi người dùng ---
            feedback = input("\nBạn có hài lòng với lịch trình này không? (y/n): ").strip().lower()
            if feedback == "y":
                print("🎉 Cảm ơn bạn! Chúc bạn có một chuyến đi vui vẻ.")
                return visited_nodes
            else:
                # --- Yêu cầu: Giảm ưu tiên các điểm đã đi ---
                # "Giảm ưu tiên" = "Giảm penalty (chi phí bỏ qua)"
                # -> Solver sẽ thấy "rẻ" hơn nếu bỏ qua các điểm này ở lần sau.
                for node in visited_nodes:
                    if node != self.depot:
                        current_penalty = self.instance["penalties"][node]
                        # Giảm 20% penalty, tối thiểu là 5
                        new_penalty = int(max(5, current_penalty / 1.2)) 
                        self.instance["penalties"][node] = new_penalty
                
                print(f"🔄 Đã giảm độ ưu tiên cho {len(visited_nodes)} địa điểm, tạo lại lịch trình khác...\n")
                
                # Reset model để áp dụng penalty mới
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
        In ra lịch trình chi tiết và áp dụng logic (Energy, Gợi ý Cafe).
        """
        visited_nodes = []
        index = self.routing.Start(0)
        total_energy = 100 # Yêu cầu: Energy
        last_tag = "hotel"

        while not self.routing.IsEnd(index):
            node = self.manager.IndexToNode(index)
            if node == self.depot and index != self.routing.Start(0):
                break # Đã quay về khách sạn
                
            place = self.locations[node]
            tags = [t.lower() for t in place.get("tags", [])]
            name = place.get("title", f"Place {node}")
            service_time = self.instance["service_time"][node]
            
            time_var = self.time_dim.CumulVar(index)
            arrival = solution.Value(time_var)
            
            # Tính toán energy
            if "hotel" in tags:
                energy_loss = -50 # Hồi phục
            elif any(t in ["market", "night market"] for t in tags):
                energy_loss = 25 # Tốn nhiều
            elif any(t in ["restaurant", "cafe", "speciality"] for t in tags):
                energy_loss = 10 # Tốn ít
            else:
                energy_loss = 15
            
            total_energy = max(0, min(100, total_energy - energy_loss))

            # In lịch trình
            start_str = minutes_to_str(arrival)
            end_str = minutes_to_str(arrival + service_time)
            print(f"- [{start_str} → {end_str}] {name} (Dừng: {service_time}p)")
            print(f"    Tags: {tags} | Energy: {total_energy}%")

            # --- Yêu cầu: Gợi ý sau khi ăn nhà hàng ---
            if last_tag == "restaurant" and "cafe" not in tags:
                print("    👉 Gợi ý: Nên ghé một quán cafe để thư giãn sau khi ăn.")

            # --- Yêu cầu: Xử lý khi mệt mỏi ---
            if total_energy < 30 and "hotel" not in tags:
                print(f"    💤 Năng lượng thấp! Bạn nên nghỉ ngơi. Quay về khách sạn 1h...")
                total_energy = 100 # Hồi phục
                # (Code thực tế có thể tìm quán cafe gần nhất, 
                # nhưng hiện tại ta giả lập nghỉ tại chỗ hoặc về hotel)

            visited_nodes.append(node)
            last_tag = tags[0] if tags else "unknown"
            index = solution.Value(self.routing.NextVar(index))

        # Điểm cuối cùng (quay về depot)
        end_time = solution.Value(self.time_dim.CumulVar(index))
        print(f"- [{minutes_to_str(end_time)}] Quay về {self.locations[self.depot].get('title', 'Khách sạn')} 🏨")
        
        return [n for n in visited_nodes if n != self.depot]