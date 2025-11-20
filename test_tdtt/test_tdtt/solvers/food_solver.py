# solvers/food_solver.py
import json
from .base_solver import BaseSolver
from ortools.constraint_solver import pywrapcp
from config import *
from utils import minutes_to_str

class FoodSolver(BaseSolver):
    def __init__(self, instance, profile):
        instance["max_duration"] = MAX_DAY_DURATION
        super().__init__(instance, profile)

    def _add_profile_specific_constraints(self):
        super()._add_profile_specific_constraints()
        print("... Thêm ràng buộc Ẩm thực (Chợ đêm)...")
        night_start_min = (19 * 60) - DAY_START_TIME 
        for node in self.instance["night_nodes"]:
            tags = self.instance["locations_data"][node].get("tags", [])
            if "night market" in tags:
                idx = self.manager.NodeToIndex(node)
                self.time_dim.SetCumulVarSoftLowerBound(idx, night_start_min, 300)

    def generate_day_schedule(self, time_limit_seconds=30):
        solution = self.solve(time_limit_seconds) 
        if not solution:
            print("❌ Không thể tìm được lịch trình hợp lệ cho ngày này.")
            return None, None 

        print("\n🗓️  Lịch trình (ngày) được tạo:")
        print("=" * 70)
        visited_nodes, trip_details = self.format_solution(solution)
        print("=" * 70)
        return visited_nodes, trip_details

    def _reset_solver(self):
        self.manager = pywrapcp.RoutingIndexManager(self.num_places, 1, self.depot)
        self.routing = pywrapcp.RoutingModel(self.manager)
        self._add_cost_callbacks()
        self._add_time_dimension()
        self._add_base_constraints()

    def format_solution(self, solution):
        visited_nodes = []
        trip_details = [] 
        index = self.routing.Start(0)
        total_energy = 100 
        total_added_rest_time = 0 
        time_matrix = self.instance["time_matrix"] 
        depot_place = self.locations[self.depot] 
        
        hotel_title = depot_place.get('location_name', 'Khách sạn')
        max_end_time_mins = self.instance["max_duration"]
        sequence_order = 1

        # --- Helper tạo object location lồng nhau ---
        def create_location_object(place_data):
            cats = [{"id": i+1, "categoryName": t} for i, t in enumerate(place_data.get("tags", []))]
            imgs = []
            for i, img in enumerate(place_data.get("rawImgs", [])):
                imgs.append({
                    "id": i+1,
                    "img_url": img.get("img_url"),
                    "description": img.get("description", "Ảnh địa điểm")
                })

            return {
                "id": 0,
                "gg_place_id": place_data.get("gg_place_id"),
                "location_name": place_data.get("location_name"),
                "latitude": place_data.get("latitude"),
                "longitude": place_data.get("longitude"),
                "open_time": place_data.get("open_time", "N/A"),
                "average_rating": place_data.get("average_rating"),
                "review_count": place_data.get("review_count", 0),
                "province_id": place_data.get("province_id", 0),
                "categories": cats,
                "imgs": imgs
            }
        # -------------------------------------------

        while not self.routing.IsEnd(index):
            node = self.manager.NodeToIndex(index)
            place = self.locations[node]
            tags = [t.lower() for t in place.get("tags", [])]
            name = place.get("location_name", f"Place {node}")
            service_time = self.instance["service_time"][node]
            
            time_var = self.time_dim.CumulVar(index)
            arrival_solved = solution.Value(time_var) 
            arrival_actual = arrival_solved + total_added_rest_time
            
            if arrival_actual > max_end_time_mins:
                print(f"⚠️ Đã đạt giới hạn thời gian.")
                break
            
            end_time_actual = min(arrival_actual + service_time, max_end_time_mins)
            if end_time_actual < arrival_actual: break
            
            start_str = f"{minutes_to_str(arrival_actual)}:00"
            end_str = f"{minutes_to_str(end_time_actual)}:00"

            if node == self.depot and index != self.routing.Start(0):
                break 
            
            print(f"- [{start_str[:5]} → {end_str[:5]}] {name} (ID: {place.get('gg_place_id')})")
            
            # --- TẠO TRIP DETAIL ---
            trip_details.append({
                "sequenceOrder": sequence_order,
                "startTime": start_str,
                "endTime": end_str,
                "description": place.get("description") or name, # Lấy description từ source hoặc dùng tên
                "location": create_location_object(place)
            })
            sequence_order += 1

            if node != self.depot:
                if "hotel" in tags: energy_loss = -50
                elif any(t in ["market", "night market"] for t in tags): energy_loss = 25
                elif any(t in ["restaurant", "cafe", "speciality"] for t in tags): energy_loss = 10
                else: energy_loss = 15
                total_energy = max(0, min(100, total_energy - energy_loss))

                if total_energy < 30:
                    next_index = solution.Value(self.routing.NextVar(index))
                    next_node = self.manager.NodeToIndex(next_index)
                    
                    if not self.routing.IsEnd(next_index):
                        travel_to_depot = time_matrix[node][self.depot]
                        rest_duration = 60
                        travel_from_depot = time_matrix[self.depot][next_node]
                        detour_time = travel_to_depot + rest_duration + travel_from_depot
                        extra_time_needed = max(0, detour_time - (solution.Value(self.time_dim.CumulVar(next_index)) - (arrival_solved + service_time)))
                        
                        if end_time_actual + extra_time_needed <= max_end_time_mins and extra_time_needed > 0:
                            total_energy = 100 
                            total_added_rest_time += extra_time_needed
                            
                            current_leave = end_time_actual
                            arrive_hotel = current_leave + travel_to_depot
                            leave_hotel = arrive_hotel + rest_duration
                            
                            s_rest = f"{minutes_to_str(arrive_hotel)}:00"
                            e_rest = f"{minutes_to_str(leave_hotel)}:00"
                            
                            print(f"    💤 Nghỉ ngơi tại {hotel_title}")
                            
                            trip_details.append({
                                "sequenceOrder": sequence_order,
                                "startTime": s_rest,
                                "endTime": e_rest,
                                "description": f"Nghỉ ngơi tại {hotel_title}",
                                "location": create_location_object(depot_place)
                            })
                            sequence_order += 1

            visited_nodes.append(node)
            index = solution.Value(self.routing.NextVar(index))

        end_time_solved = solution.Value(self.time_dim.CumulVar(index))
        end_time_actual = min(end_time_solved + total_added_rest_time, max_end_time_mins)
        end_str_final = f"{minutes_to_str(end_time_actual)}:00"
        
        print(f"- [{end_str_final[:5]}] Quay về {hotel_title}")
        
        trip_details.append({
            "sequenceOrder": sequence_order,
            "startTime": end_str_final,
            "endTime": end_str_final,
            "description": f"Kết thúc ngày, quay về {hotel_title}",
            "location": create_location_object(depot_place)
        })
        
        return [n for n in visited_nodes if n != self.depot], trip_details