# main.py
from tag_rules.food_profile import FoodProfile
from solvers.food_solver import FoodSolver
from tag_rules.amusement_profile import AmusementProfile 
from solvers.amusement_solver import AmusementSolver     
from data_loader import create_instance_from_files
import json
from datetime import datetime, timedelta

def print_full_schedule(full_schedule_data, start_day=1):
    """Helper: In toàn bộ lịch trình nhiều ngày ra console."""
    for date_str, day_data in full_schedule_data.items():
        print("\n" + "="*50)
        print(f"🗓️   LỊCH TRÌNH NGÀY: {date_str}")
        print("="*50)
        
        schedule_list = day_data.get("schedule", [])
        if not schedule_list:
            print(" (Không có hoạt động)")
            continue
            
        for item in schedule_list:
            if "Nghỉ ngơi" in item["title"] or "Di chuyển" in item["title"]:
                 print(f"- [{item['start']} → {item['end']}] {item['title']} (Dừng: {item['description']})")
            elif "Quay về" in item["title"]:
                 print(f"- [{item['start']}] {item['title']} 🏨")
            elif item['start'] == item['end']: # Khách sạn ngày đầu
                 print(f"- [{item['start']} → {item['end']}] {item['title']}")
            else:
                 print(f"- [{item['start']} → {item['end']}] {item['title']}")


def main_itinerary_loop():
    """
    Hàm chính điều khiển 2 vòng lặp:
    - Vòng lặp ngoài (Attempt loop): Cho mỗi LẦN THỬ tạo lịch trình (hỏi y/n).
    - Vòng lặp trong (Day loop): Tự động lặp qua các ngày (Day 1, 2, 3...).
    """
    
    # --- Bước 1: Chọn Profile và Solver ---
    print("\n" + "="*60)
    print("🏞️  CHỌN LOẠI HÌNH DU LỊCH")
    print("="*60)
    print("1: Ẩm thực (Food) - Ưu tiên nhà hàng, đặc sản, chợ đêm")
    print("2: Giải trí (Amusement) - Ưu tiên công viên, show, nightlife")
    choice = input("Lựa chọn của bạn [Mặc định: 1]: ").strip()

    if choice == "2":
        print("\n--- Đã chọn: Giải trí (Amusement) ---")
        profile = AmusementProfile()
        SolverClass = AmusementSolver
        preferred_tags = ["zoo", "amusement/water park", "cultural performance", "nightlife", "restaurant"]
    else:
        print("\n--- Đã chọn: Ẩm thực (Food) ---")
        profile = FoodProfile()
        SolverClass = FoodSolver
        preferred_tags = ["restaurant", "speciality", "night market"]

    # --- Bước 2: Nhập ngày đi & Ngày về ---
    start_date = None
    end_date = None
    num_days = 0
    while True:
        try:
            print("\n--- Nhập thời gian chuyến đi ---")
            s_input = input("Nhập ngày đi (dd-mm-yyyy, ví dụ 20-12-2025): ").strip()
            start_date = datetime.strptime(s_input, "%d-%m-%Y")

            e_input = input("Nhập ngày về (dd-mm-yyyy, ví dụ 23-12-2025): ").strip()
            end_date = datetime.strptime(e_input, "%d-%m-%Y")

            if end_date < start_date:
                print("❌ Ngày về phải sau hoặc bằng ngày đi. Vui lòng nhập lại.")
                continue
            
            # Tính số ngày (cộng 1 để tính cả ngày bắt đầu)
            num_days = (end_date - start_date).days + 1
            print(f"✓ Tổng thời gian: {num_days} ngày.")
            break
        except ValueError:
            print("❌ Định dạng ngày không hợp lệ. Vui lòng nhập đúng định dạng dd-mm-yyyy.")

    # --- Bước 3: Khởi tạo Vòng lặp "Thử" (Attempt) ---
    master_penalty_overrides = {} 
    max_total_attempts = 5 
    
    # --- VÒNG LẶP BÊN NGOÀI (Cho mỗi lần thử y/n) ---
    for attempt in range(1, max_total_attempts + 1):
        print("\n" + "="*60)
        print(f"🚀 BẮT ĐẦU SINH TOÀN BỘ LỊCH TRÌNH (Lần thử {attempt}/{max_total_attempts})")
        print("="*60)

        current_attempt_penalties = master_penalty_overrides.copy()
        full_trip_attempt_data = {}
        forced_hotel_original_idx = None
        itinerary_failed = False
        
        # Biến 'locations' sẽ được định nghĩa ở vòng lặp Ngày đầu tiên
        locations = None 

        # --- VÒNG LẶP BÊN TRONG (Tự động lặp qua các ngày) ---
        for day_num in range(1, num_days + 1):
            print(f"\n--- ⏳ Đang xử lý Ngày {day_num}/{num_days} ---")

            # --- SỬA LỖI 1: Nhận thêm 'locations' ---
            instance, selected_hotel_idx, node_map, loaded_locations = create_instance_from_files(
                profile, 
                preferred_tags, 
                current_attempt_penalties,
                force_hotel_idx=forced_hotel_original_idx
            )
            
            # --- SỬA LỖI 2: Kiểm tra instance (vì data_loader có thể trả về 4 giá trị None) ---
            if instance is None:
                print("❌ Lỗi: Không thể tải instance (có thể do hết khách sạn).")
                itinerary_failed = True
                break
            
            # Lưu locations (danh sách gốc) vào biến của vòng lặp
            if locations is None:
                locations = loaded_locations

            if forced_hotel_original_idx is None:
                forced_hotel_original_idx = selected_hotel_idx
                print(f"🏨 Đã chọn khách sạn cho toàn bộ chuyến đi: '{instance['locations_data'][0].get('title')}'")

            solver = SolverClass(instance, profile)

            visited_nodes, schedule_data = solver.generate_day_schedule(
                time_limit_seconds=30
            )
            
            if schedule_data is None:
                print(f"❌ Không thể tìm được lịch trình hợp lệ cho Ngày {day_num}.")
                itinerary_failed = True
                break
            
            full_trip_attempt_data[f"Day {day_num}"] = {
                "schedule": schedule_data,
                "nodes": visited_nodes,
                "map": node_map
            }
            
            for reordered_idx in visited_nodes:
                original_idx = node_map.get(reordered_idx)
                if original_idx:
                    current_attempt_penalties[original_idx] = 1 
        
        # --- Kết thúc vòng lặp "Ngày" ---

        if itinerary_failed or len(full_trip_attempt_data) != num_days:
            print(f"❌ Thử nghiệm {attempt} thất bại, không thể tạo đủ {num_days} ngày.")
            if forced_hotel_original_idx is not None:
                 master_penalty_overrides[forced_hotel_original_idx] = master_penalty_overrides.get(forced_hotel_original_idx, 10) * 5
            continue 

        # --- Hiển thị kết quả và hỏi Y/N ---
        print("\n" + "="*60)
        print(f"🎉 ĐÃ TẠO XONG TOÀN BỘ LỊCH TRÌNH {num_days} NGÀY (Lần thử {attempt})")
        print_full_schedule(full_trip_attempt_data, start_day=1)
        print("="*60)
        
        try:
            with open("schedule.json", "w", encoding="utf-8") as f:
                schedule_to_save = {day_key: data["schedule"] for day_key, data in full_trip_attempt_data.items()}
                json.dump(schedule_to_save, f, ensure_ascii=False, indent=4)
            print("✅ Đã lưu lịch trình (tạm thời) vào 'schedule.json'.")
        except Exception as e:
            print(f"❌ Lỗi khi lưu file JSON: {e}")

        feedback = input("\nBạn có hài lòng với TOÀN BỘ lịch trình này không? (y/n): ").strip().lower()

        if feedback == "y":
            print("\n🎉🎉 Chúc bạn có một chuyến đi vui vẻ! Lịch trình đã được lưu.")
            break 
        
        else: # (feedback == "n")
            print(f"🔄 Đã hiểu. Sẽ tạo lại TOÀN BỘ lịch trình (Thử {attempt+1})...")
            
            master_penalty_overrides[forced_hotel_original_idx] = master_penalty_overrides.get(forced_hotel_original_idx, 10) * 5

            for day_data in full_trip_attempt_data.values():
                visited_nodes = day_data["nodes"]
                node_map = day_data["map"]
                for reordered_idx in visited_nodes:
                    original_idx = node_map.get(reordered_idx)
                    if original_idx and original_idx != forced_hotel_original_idx:
                        
                        # --- SỬA LỖI 3: Giờ 'locations' đã được định nghĩa ---
                        current_penalty = profile.get_penalty(locations[original_idx].get("tags", []), locations[original_idx].get("rating"))
                        master_penalty_overrides[original_idx] = int(max(5, current_penalty * 0.2))

    if attempt == max_total_attempts:
        print("\n--- Đã hết số lần thử. Kết thúc chương trình. ---")

if __name__ == "__main__":
    main_itinerary_loop()