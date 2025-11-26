from datetime import datetime
from typing import List, Dict
from app.schemas.schedule_dto import ScheduleRequest, ScheduleResponse, TripSectionDTO
from app.core.mappings import get_tag_from_id
from app.services.matrix_service import MatrixService

from app.tag_rules.amusement_profile import AmusementProfile
from app.solvers.amusement_solver import AmusementSolver
from app.tag_rules.food_profile import FoodProfile
from app.solvers.food_solver import FoodSolver
from app.schedule_utils import time_str_to_minutes, parse_operating_hours

class ScheduleService:
    def __init__(self):
        self.matrix_service = MatrixService()

    def create_schedule(self, request: ScheduleRequest) -> ScheduleResponse:
        # 1. Tính toán Context thời gian
        day_start_mins = time_str_to_minutes(request.fromOperateTime)
        day_end_mins = time_str_to_minutes(request.toOperateTime)
        
        if day_end_mins <= day_start_mins:
            day_end_mins += 1440
            
        max_duration = day_end_mins - day_start_mins
        
        context = {
            "day_start_mins": day_start_mins,
            "day_end_mins": day_end_mins,
            "max_duration": max_duration,
            "lunch_start": (11 * 60) - day_start_mins,
            "lunch_end": (14 * 60) - day_start_mins,
            "dinner_start": (18 * 60) - day_start_mins,
            "dinner_end": (21 * 60) - day_start_mins
        }

        # 2. Chọn Profile & Solver
        if request.hobby == "AMUSEMENT":
            profile = AmusementProfile()
            SolverClass = AmusementSolver
            preferred_tags = ["zoo", "amusement/water park", "cultural performance", "nightlife", "aquarium"]
        elif request.hobby == "FOOD":
            profile = FoodProfile()
            SolverClass = FoodSolver
            preferred_tags = ["restaurant", "night market", "speciality", "snack", "cafe"]
        else:
            profile = AmusementProfile()
            SolverClass = AmusementSolver
            preferred_tags = []

        start_date = datetime.strptime(request.startDate, "%Y-%m-%d")
        end_date = datetime.strptime(request.endDate, "%Y-%m-%d")
        num_days = (end_date - start_date).days + 1
        
        # 3. Xử lý dữ liệu Locations
        raw_locations = [loc.dict() for loc in request.locations]
        for loc in raw_locations:
            if "tags" not in loc or not loc["tags"]:
                cat_ids = [c['id'] for c in loc.get('categories', [])]
                loc['tags'] = [get_tag_from_id(cid) for cid in cat_ids]

        # 4. Gọi Matrix Service
        time_matrix = self.matrix_service.get_time_matrix(raw_locations)

        # 5. Lọc dữ liệu Depot
        depot_index = self._find_best_depot_index(raw_locations)
        valid_indices = [depot_index] 
        for i, loc in enumerate(raw_locations):
            if i == depot_index: continue
            if "hotel" in loc.get("tags", []): continue 
            valid_indices.append(i)

        filtered_locations = [raw_locations[i] for i in valid_indices]
        filtered_matrix = []
        for r_idx in valid_indices:
            row = []
            for c_idx in valid_indices:
                row.append(time_matrix[r_idx][c_idx])
            filtered_matrix.append(row)

        trip_sections = []
        penalty_overrides = {} 
        
        for i in range(num_days):
            day_num = i + 1
            
            # --- UPDATE: Truyền thêm isChildren và isElder vào hàm tạo instance ---
            instance = self._create_instance(
                filtered_locations, 
                filtered_matrix, 
                profile, 
                preferred_tags, 
                penalty_overrides, 
                context, 
                current_hobby=request.hobby,
                is_children=request.isChildren, # MỚI
                is_elder=request.isElder        # MỚI
            )
            
            solver = SolverClass(instance, profile, context)
            
            visited_indices, trip_details_raw = solver.generate_day_schedule(time_limit_seconds=5)
            
            if trip_details_raw:
                # Clean up tags khỏi location output
                for item in trip_details_raw:
                    if "location" in item and isinstance(item["location"], dict):
                        loc_copy = item["location"].copy()
                        loc_copy.pop("tags", None)
                        item["location"] = loc_copy
                
                if request.hobby == "FOOD":
                    title = f"Ngày {day_num}: Food Tour & Đặc sản"
                elif request.hobby == "AMUSEMENT":
                    title = f"Ngày {day_num}: Vui chơi giải trí"
                else:
                    title = f"Ngày {day_num}: Khám phá"

                trip_sections.append(TripSectionDTO(
                    dayNumber=day_num,
                    title=title,
                    tripDetails=trip_details_raw
                ))
                
                for v_idx in visited_indices:
                    if v_idx != 0: 
                         penalty_overrides[v_idx] = 0

        return ScheduleResponse(
            userId=1,
            tripName=f"Chuyến đi {request.province}",
            startDate=request.startDate,
            endDate=request.endDate,
            numAdult=request.numAdults,
            numChild=request.numChildren,
            numElder=request.numElders,
            tripSections=trip_sections
        )

    def _find_best_depot_index(self, locations):
        for i, loc in enumerate(locations):
            if "hotel" in loc.get("tags", []):
                return i
        return 0 

    # --- UPDATE: Thêm tham số is_children, is_elder ---
    def _create_instance(self, locs, matrix, profile, preferred_tags, penalty_overrides, context, current_hobby, is_children=False, is_elder=False):
        service_times = []
        time_windows = []
        penalties = []
        lunch_nodes = []
        night_nodes = []
        
        BOOST_FACTOR = 6.0 
        FILLER_TAGS = ["speciality", "market", "souvenir", "shop", "snack"]
        FILLER_DAMPING = 0.1

        for i, loc in enumerate(locs):
            tags = loc["tags"]
            rating = loc.get("average_rating", 0) or 0
            st = profile.get_service_time(tags)
            tw = parse_operating_hours(
                loc.get("open_time"), loc.get("close_time"), st,
                context["day_start_mins"], context["day_end_mins"], context["max_duration"]
            )
            
            if i == 0: 
                tw = [0, context["max_duration"]]
                base_penalty = 0
            else:
                if i in penalty_overrides:
                    base_penalty = penalty_overrides[i]
                else:
                    # 1. Lấy Base Score từ Profile (Amusement, Food...)
                    base_penalty = profile.get_penalty(tags, rating)
                    
                    is_preferred = any(t in preferred_tags for t in tags)
                    is_filler = any(t in FILLER_TAGS for t in tags)
                    is_dining = any(t in ["restaurant", "food", "buffet"] for t in tags)
                    
                    if is_preferred: base_penalty = int(base_penalty * BOOST_FACTOR)
                    elif is_dining: base_penalty = int(base_penalty * 12.0)
                    elif is_filler and current_hobby != "FOOD": base_penalty = int(base_penalty * FILLER_DAMPING)
                    else:
                        base_penalty = profile.adjust_by_preference(base_penalty, preferred_tags, tags)
                        base_penalty = int(base_penalty * profile.boost_priority(tags))
                    
                    # 2. --- APPLY LOGIC TRẺ EM / NGƯỜI GIÀ Ở ĐÂY ---
                    # Logic này sẽ nhân tiếp vào base_penalty đã tính ở trên
                    base_penalty = profile.adjust_demographic_score(base_penalty, tags, is_children, is_elder)

            service_times.append(st)
            time_windows.append(tw)
            penalties.append(base_penalty)
            
            if i != 0:
                if "restaurant" in tags or "food" in tags or "snack" in tags: lunch_nodes.append(i)
                if any(nt in tags for nt in ["night market", "nightlife", "bar"]): night_nodes.append(i)

        return {
            "locations_data": locs,
            "time_matrix": matrix,
            "service_time": service_times,
            "time_windows": time_windows,
            "penalties": penalties,
            "lunch_nodes": lunch_nodes,
            "night_nodes": night_nodes,
            "num_places": len(locs),
            "depot": 0
        }