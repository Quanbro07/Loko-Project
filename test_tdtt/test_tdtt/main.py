# main.py
from datetime import datetime, timedelta
import json
from tag_rules.food_profile import FoodProfile
from solvers.food_solver import FoodSolver
from tag_rules.amusement_profile import AmusementProfile 
from solvers.amusement_solver import AmusementSolver
from tag_rules.adventure_profile import AdventureProfile
from solvers.adventure_solver import AdventureSolver
from data_loader import create_instance_from_files

def print_full_schedule(final_output):
    """Helper: In toàn bộ lịch trình từ cấu trúc JSON mới ra console."""
    print("\n" + "="*60)
    print(f"📝 {final_output.get('tripName', 'Lịch trình')}")
    print(f"📅 Thời gian: {final_output.get('startDate')} - {final_output.get('endDate')}")
    print("="*60)

    for section in final_output.get('tripSections', []):
        print(f"\n📌 {section['title']}")
        print("-" * 40)
        
        trip_details = section.get('tripDetails', [])
        if not trip_details:
            print(" (Không có hoạt động)")
            continue
            
        for item in trip_details:
            s = item.get('startTime', '')[:5]
            e = item.get('endTime', '')[:5]
            loc = item.get('location', {})
            name = loc.get('location_name', 'Địa điểm')
            desc = item.get('description', '')
            print(f"- [{s} → {e}] {name} | {desc}")


def main_itinerary_loop():
    
    # --- Bước 1: Chọn Profile và Solver ---
    print("\n" + "="*60)
    print("🏞️  CHỌN LOẠI HÌNH DU LỊCH")
    print("="*60)
    print("1: Ẩm thực (Food) - Ưu tiên nhà hàng, đặc sản, chợ đêm")
    print("2: Giải trí (Amusement) - Ưu tiên công viên, show, nightlife")
    choice = input("Lựa chọn của bạn [Mặc định: 1]: ").strip()

    if choice == "1":
        print("\n--- Đã chọn: Ẩm thực (Food) ---")
        profile = FoodProfile()
        SolverClass = FoodSolver
        preferred_tags = ["restaurant", "speciality", "night market"]

    elif choice == "2":
        print("\n--- Đã chọn: Giải trí (Amusement) ---")
        profile = AmusementProfile()
        SolverClass = AmusementSolver
        preferred_tags = ["zoo", "amusement/water park", "cultural performance", "nightlife", "aquarium", "festival", "restaurant"]

    # --- Bước 2: Nhập Ngày đi & Ngày về ---
    start_date = None
    end_date = None
    num_days = 0
    start_date_str = ""
    end_date_str = ""

    while True:
        try:
            print("\n--- Nhập thời gian chuyến đi ---")
            s_input = input("Nhập ngày đi (yyyy-mm-dd, ví dụ 2025-12-20): ").strip()
            start_date = datetime.strptime(s_input, "%Y-%m-%d")
            start_date_str = s_input

            e_input = input("Nhập ngày về (yyyy-mm-dd, ví dụ 2025-12-22): ").strip()
            end_date = datetime.strptime(e_input, "%Y-%m-%d")
            end_date_str = e_input

            if end_date < start_date:
                print("❌ Ngày về phải sau hoặc bằng ngày đi. Vui lòng nhập lại.")
                continue
            
            num_days = (end_date - start_date).days + 1
            print(f"✓ Tổng thời gian: {num_days} ngày.")
            break
        except ValueError:
            print("❌ Định dạng ngày không hợp lệ. Vui lòng nhập đúng định dạng yyyy-mm-dd.")

    # --- Bước 3: Khởi tạo Vòng lặp "Thử" ---
    master_penalty_overrides = {} 
    max_total_attempts = 5 
    
    # --- VÒNG LẶP BÊN NGOÀI (Cho mỗi lần thử y/n) ---
    for attempt in range(1, max_total_attempts + 1):
        print("\n" + "="*60)
        print(f"🚀 BẮT ĐẦU SINH TOÀN BỘ LỊCH TRÌNH (Lần thử {attempt}/{max_total_attempts})")
        print("="*60)

        current_attempt_penalties = master_penalty_overrides.copy()
        
        final_output = {
            "userId": 1, 
            "tripName": f"Chuyến đi {num_days} ngày",
            "startDate": start_date_str,
            "endDate": end_date_str,
            "numAdult": 2, "numChild": 0, "numElder": 0,
            "tripSections": []
        }
        
        all_visited_nodes_for_penalty = [] 
        all_node_maps = []

        forced_hotel_original_idx = None
        itinerary_failed = False
        locations = None 

        # --- VÒNG LẶP BÊN TRONG (Tự động lặp qua các ngày) ---
        for i in range(num_days):
            current_date = start_date + timedelta(days=i)
            day_num = i + 1
            
            print(f"\n--- ⏳ Đang xử lý Ngày {day_num}/{num_days} ---")

            instance, selected_hotel_idx, node_map, loaded_locations = create_instance_from_files(
                profile, 
                preferred_tags, 
                current_attempt_penalties,
                force_hotel_idx=forced_hotel_original_idx
            )
            
            if instance is None:
                print("❌ Lỗi: Không thể tải instance.")
                itinerary_failed = True
                break
            
            if locations is None: locations = loaded_locations

            if forced_hotel_original_idx is None:
                forced_hotel_original_idx = selected_hotel_idx
                # Sửa lỗi hiển thị None
                hotel_name = instance['locations_data'][0].get('location_name') or instance['locations_data'][0].get('title')
                print(f"🏨 Đã chọn khách sạn: '{hotel_name}'")

            solver = SolverClass(instance, profile)

            visited_nodes, trip_details_list = solver.generate_day_schedule(
                time_limit_seconds=30
            )
            
            if trip_details_list is None:
                print(f"❌ Không tìm được lịch trình cho Ngày {day_num}.")
                itinerary_failed = True
                break
            
            section = {
                "dayNumber": day_num,
                "title": f"Ngày {day_num}: Khám phá",
                "tripDetails": trip_details_list
            }
            final_output["tripSections"].append(section)
            
            all_visited_nodes_for_penalty.append(visited_nodes)
            all_node_maps.append(node_map)
            
            # --- SỬA LỖI 1: Xử lý tránh trùng lặp giữa các ngày ---
            for reordered_idx in visited_nodes:
                original_idx = node_map.get(reordered_idx)
                # Dùng 'is not None' để bắt được cả index 0
                if original_idx is not None:
                    current_attempt_penalties[original_idx] = 1 
            # ----------------------------------------------------
        
        # --- Kết thúc vòng lặp "Ngày" ---

        if itinerary_failed or len(final_output["tripSections"]) != num_days:
            print(f"❌ Thử nghiệm thất bại.")
            if forced_hotel_original_idx is not None:
                 master_penalty_overrides[forced_hotel_original_idx] = master_penalty_overrides.get(forced_hotel_original_idx, 10) * 5
            continue 

        # --- Hiển thị và Hỏi ---
        print("\n" + "="*60)
        print(f"🎉 ĐÃ TẠO XONG (Lần thử {attempt})")
        print_full_schedule(final_output)
        print("="*60)
        
        try:
            with open("schedule.json", "w", encoding="utf-8") as f:
                json.dump(final_output, f, ensure_ascii=False, indent=4)
            print("✅ Đã lưu 'schedule.json'.")
        except Exception as e:
            print(f"❌ Lỗi lưu file: {e}")

        feedback = input("\nBạn có hài lòng với lịch trình này không? (y/n): ").strip().lower()

        if feedback == "y":
            print("\n🎉🎉 Chúc bạn chuyến đi vui vẻ!")
            break 
        
        else: 
            print(f"🔄 Đã hiểu. Đang tạo lại...")
            master_penalty_overrides[forced_hotel_original_idx] = master_penalty_overrides.get(forced_hotel_original_idx, 10) * 5

            # Logic phạt mới: Phạt dựa trên danh sách các node đã đi của từng ngày
            for i in range(len(all_visited_nodes_for_penalty)):
                visited_nodes = all_visited_nodes_for_penalty[i]
                node_map = all_node_maps[i]
                for reordered_idx in visited_nodes:
                    original_idx = node_map.get(reordered_idx)
                    # --- SỬA LỖI 2: Xử lý phạt khi user chọn 'No' ---
                    if original_idx is not None and original_idx != forced_hotel_original_idx:
                        loc_data = locations[original_idx]
                        rating = loc_data.get("average_rating") or loc_data.get("rating")
                        current_penalty = profile.get_penalty(loc_data.get("tags", []), rating)
                        master_penalty_overrides[original_idx] = int(max(5, current_penalty * 0.2))
                    # -----------------------------------------------

    if attempt == max_total_attempts:
        print("\n--- Đã hết số lần thử. ---")

if __name__ == "__main__":
    main_itinerary_loop()