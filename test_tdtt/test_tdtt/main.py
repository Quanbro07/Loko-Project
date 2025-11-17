# main.py
from tag_rules.food_profile import FoodProfile
from solvers.food_solver import FoodSolver
from tag_rules.amusement_profile import AmusementProfile 
from solvers.amusement_solver import AmusementSolver     
from data_loader import create_instance_from_files
import json

def main_itinerary_loop():
    """
    Hàm chính điều khiển 2 vòng lặp:
    - Vòng lặp ngoài (Outer loop): Cho mỗi ngày (Day 1, Day 2...).
    - Vòng lặp trong (Inner loop): Cho mỗi lần phản hồi (y/n) CỦA NGÀY ĐÓ.
    """
    
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
        preferred_tags = ["zoo", "amusement/water park", "cultural performance", "nightlife", "restaurant"]


    # --- Bước 2: Nhập số ngày (YÊU CẦU MỚI) ---
    num_days = 0
    while num_days <= 0:
        try:
            num_days_input = input("Nhập tổng số ngày du lịch (ví dụ: 3): ").strip()
            num_days = int(num_days_input)
            if num_days <= 0: print("Số ngày phải lớn hơn 0.")
        except ValueError:
            print("Vui lòng nhập một con số.")

    # --- Bước 3: Khởi tạo Vòng lặp ---
    
    # "Bộ nhớ" cho TOÀN BỘ chuyến đi
    # Dùng để lưu các địa điểm ĐÃ ĐI (để không lặp lại)
    # và các địa điểm BỊ TỪ CHỐI (để giảm ưu tiên)
    penalty_overrides = {} 
    
    # Nơi lưu kết quả cuối cùng
    full_trip_schedule = {} 

    # Biến để "khóa" khách sạn sau khi chọn lần đầu tiên
    forced_hotel_original_idx = None
    
    max_attempts_per_day = 5 # Cho phép thử 5 lần cho mỗi ngày

    # --- VÒNG LẶP BÊN NGOÀI (Cho mỗi ngày) ---
    for day_num in range(1, num_days + 1):
        print("\n" + "="*60)
        print(f"📅 BẮT ĐẦU LÊN LỊCH CHO NGÀY {day_num}/{num_days}")
        print("="*60)
        
        day_accepted = False
        
        # "Bộ nhớ" tạm thời cho các lần thử CỦA NGÀY HÔM NAY
        # (Để nếu user nhấn 'n', lần thử sau sẽ khác)
        day_penalty_overrides = penalty_overrides.copy()

        # --- VÒNG LẶP BÊN TRONG (Cho mỗi lần 'y/n') ---
        for attempt in range(1, max_attempts_per_day + 1):
            print(f"\n--- 🚀 Bắt đầu sinh lịch trình (Ngày {day_num}, Lần thử {attempt}/{max_attempts_per_day}) ---")

            # 1. Tải instance
            instance, selected_hotel_idx, node_map = create_instance_from_files(
                profile, 
                preferred_tags, 
                day_penalty_overrides, # Sử dụng bộ nhớ tạm thời của ngày
                force_hotel_idx=forced_hotel_original_idx # "Khóa" khách sạn
            )
            
            if instance is None:
                print("❌ Lỗi: Không thể tải instance (có thể do hết khách sạn).")
                break

            # 2. "Khóa" khách sạn (chỉ chạy 1 lần)
            if forced_hotel_original_idx is None:
                forced_hotel_original_idx = selected_hotel_idx
                print(f"🏨 Đã chọn khách sạn cho toàn bộ chuyến đi: '{instance['locations_data'][0].get('title')}'")

            # 3. Khởi tạo và chạy Solver
            solver = SolverClass(instance, profile)
            feedback, visited_nodes, schedule_data = solver.run_single_itinerary(
                attempt_num=attempt, 
                time_limit_seconds=30
            )
            
            # 4. Xử lý phản hồi
            if feedback == "y":
                print(f"👍 Đã xác nhận lịch trình cho Ngày {day_num}.")
                full_trip_schedule[f"Day {day_num}"] = schedule_data
                day_accepted = True
                
                # CẬP NHẬT BỘ NHỚ CHÍNH:
                # Giảm mạnh (gần như = 0) penalty của các điểm đã đi
                # để chúng không bao giờ xuất hiện ở các ngày sau.
                for reordered_idx in visited_nodes:
                    original_idx = node_map.get(reordered_idx)
                    if original_idx:
                        penalty_overrides[original_idx] = 1 # Phạt 1 (rất rẻ để bỏ qua)
                
                break # <-- Thoát vòng lặp "thử lại", đi đến ngày tiếp theo
            
            else: # (feedback == "n")
                print(f"🔄 Đang giảm ưu tiên các địa điểm vừa đi (cho lần thử sau)...")
                
                # CẬP NHẬT BỘ NHỚ TẠM THỜI (day_penalty_overrides):
                # Giảm ưu tiên (nhân 0.2) các điểm vừa đi
                for reordered_idx in visited_nodes:
                    original_idx = node_map.get(reordered_idx)
                    if original_idx and original_idx != forced_hotel_original_idx:
                        # Lấy penalty hiện tại (từ bộ nhớ chính hoặc 100)
                        current_penalty = penalty_overrides.get(original_idx, 100) 
                        day_penalty_overrides[original_idx] = int(max(5, current_penalty * 0.2))
        
        # Nếu đã thử hết 5 lần mà user vẫn "n"
        if not day_accepted:
            print(f"❌ Đã hết số lần thử cho Ngày {day_num}. Dừng tạo lịch trình.")
            break # <-- Thoát vòng lặp "ngày"

    # --- Bước 4: Lưu kết quả cuối cùng ---
    if full_trip_schedule:
        print("\n" + "="*60)
        print(f"🎉🎉 Đã tạo xong lịch trình {len(full_trip_schedule)} ngày!")
        print(f"Đang lưu toàn bộ chuyến đi vào 'schedule.json'...")
        try:
            with open("schedule.json", "w", encoding="utf-8") as f:
                json.dump(full_trip_schedule, f, ensure_ascii=False, indent=4)
            print("✅ Đã lưu lịch trình thành công.")
        except Exception as e:
            print(f"❌ Lỗi khi lưu file JSON: {e}")
    else:
        print("\n--- Không có lịch trình nào được chấp nhận. Kết thúc. ---")

if __name__ == "__main__":
    main_itinerary_loop()