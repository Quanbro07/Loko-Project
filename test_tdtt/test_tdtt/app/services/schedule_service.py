from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from app.schemas.schedule_dto import ScheduleRequest, LocationDTO
from app.core.mappings import get_tag_from_id
from app.services.matrix_service import MatrixService
from app.services.activity_service import ActivityService
# Import Profile và Solver
from app.tag_rules.amusement_profile import AmusementProfile
from app.solvers.amusement_solver import AmusementSolver
from app.tag_rules.food_profile import FoodProfile
from app.solvers.food_solver import FoodSolver
from app.schedule_utils import time_str_to_minutes, parse_operating_hours

class ScheduleService:
    def __init__(self):
        self.matrix_service = MatrixService()
        self.activity_service = ActivityService()

    def create_schedule(self, request: ScheduleRequest) -> Dict:
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

        # 2. Chọn Profile & Solver dựa trên Hobby
        if request.hobby == "AMUSEMENT":
            profile = AmusementProfile()
            SolverClass = AmusementSolver
            # Các tag ưu tiên cho Amusement
            preferred_tags = ["zoo", "amusement/water park", "cultural performance", "nightlife", "aquarium"]
        elif request.hobby == "FOOD":
            profile = FoodProfile()
            SolverClass = FoodSolver
            preferred_tags = ["restaurant", "night market", "speciality", "snack", "cafe"]
        else:
            # Default fallback (Có thể mở rộng thêm Culture, Nature ở đây)
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

        # 5. LỌC DỮ LIỆU: Chọn 1 Hotel làm Depot, loại bỏ các Hotel khác
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
            
            # Tạo instance cho ngày với logic Boost/Damp mới
            instance = self._create_instance(
                filtered_locations, 
                filtered_matrix, 
                profile, 
                preferred_tags, 
                penalty_overrides, 
                context, 
                current_hobby=request.hobby # Truyền Hobby vào để xử lý lọc rác
            )
            
            # Khởi tạo Solver với context
            solver = SolverClass(instance, profile, context)
            
            visited_indices, trip_details = solver.generate_day_schedule(time_limit_seconds=5)
            
            if trip_details:
                # AI sinh activity
                trip_details = self.activity_service.generate_activities(trip_details)

                # --- XỬ LÝ RESPONSE: Loại bỏ tags khỏi location ---
                for item in trip_details:
                    if "location" in item and isinstance(item["location"], dict):
                        loc_copy = item["location"].copy()
                        loc_copy.pop("tags", None)
                        item["location"] = loc_copy
                
                # Đặt tên tiêu đề chuyến đi theo Hobby
                if request.hobby == "FOOD":
                    title = f"Ngày {day_num}: Food Tour & Đặc sản"
                elif request.hobby == "AMUSEMENT":
                    title = f"Ngày {day_num}: Vui chơi giải trí"
                else:
                    title = f"Ngày {day_num}: Khám phá"

                trip_sections.append({
                    "dayNumber": day_num,
                    "title": title,
                    "tripDetails": trip_details
                })
                
                for v_idx in visited_indices:
                    if v_idx != 0: 
                         penalty_overrides[v_idx] = 0

        return {
            "userId": 1, 
            "tripName": f"Chuyến đi {request.province}",
            "startDate": request.startDate,
            "endDate": request.endDate,
            "numAdult": request.numAdults,
            "numChild": request.numChildren,
            "numElder": request.numElders,
            "tripSections": trip_sections
        }

    def _find_best_depot_index(self, locations):
        for i, loc in enumerate(locations):
            if "hotel" in loc.get("tags", []):
                return i
        return 0 

    def _create_instance(self, locs, matrix, profile, preferred_tags, penalty_overrides, context, current_hobby):
        service_times = []
        time_windows = []
        penalties = []
        lunch_nodes = []
        night_nodes = []

        # --- LOGIC CÂN BẰNG TRỌNG SỐ MỚI ---
        # 1. Hệ số Boost: Nếu đúng hobby, nhân điểm lên thật cao để bù cho việc tốn thời gian
        BOOST_FACTOR = 6.0 
        
        # 2. Hệ số Damp: Nếu là điểm phụ (filler) mà không đúng hobby, dìm điểm xuống
        # Những tag này thường thời gian ngắn, dễ bị AI chọn bừa để lấp đầy lịch
        FILLER_TAGS = ["speciality", "market", "souvenir", "shop", "snack"]
        FILLER_DAMPING = 0.1 # Chỉ giữ lại 10% điểm

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
                    # Lấy điểm gốc từ Profile
                    base_penalty = profile.get_penalty(tags, rating)
                    
                    # --- ÁP DỤNG LOGIC MỚI ---
                    is_preferred = any(t in preferred_tags for t in tags)
                    is_filler = any(t in FILLER_TAGS for t in tags)
                    
                    if is_preferred:
                        # Ưu tiên cực mạnh
                        base_penalty = int(base_penalty * BOOST_FACTOR)
                    
                    elif is_filler and current_hobby != "FOOD":
                        # Nếu đi chơi (Amusement) mà gặp quán bán kẹo (Speciality) -> Dìm hàng
                        base_penalty = int(base_penalty * FILLER_DAMPING)
                    
                    else:
                        # Các trường hợp trung tính (nhà hàng khi đi chơi, cafe...)
                        # Vẫn dùng logic cũ nhẹ nhàng
                        base_penalty = profile.adjust_by_preference(base_penalty, preferred_tags, tags)
                        base_penalty = int(base_penalty * profile.boost_priority(tags))

            service_times.append(st)
            time_windows.append(tw)
            penalties.append(base_penalty)
            
            if i != 0:
                if "restaurant" in tags or "food" in tags or "snack" in tags: 
                    lunch_nodes.append(i)
                if any(nt in tags for nt in ["night market", "nightlife", "bar"]): 
                    night_nodes.append(i)

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