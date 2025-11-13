# main.py
from tag_rules.food_profile import FoodProfile
from solvers.food_solver import FoodSolver
from tag_rules.amusement_profile import AmusementProfile 
from solvers.amusement_solver import AmusementSolver     
from data_loader import create_instance_from_files

def main_itinerary_loop():
    """
    Hàm chính điều khiển MỘT vòng lặp duy nhất.
    Mỗi lần "no", nó sẽ giảm ưu tiên tất cả (KS + địa điểm) 
    và tự động tìm 1 KS mới (hoặc KS cũ nếu vẫn là tốt nhất).
    """
    
    # --- SỬA ĐỔI: Chọn Profile và Solver ---
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
    # --- KẾT THÚC SỬA ĐỔI ---
    
    # Logic vòng lặp chính (giữ nguyên)
    penalty_overrides = {} 
    max_total_attempts = 10
    
    for attempt in range(1, max_total_attempts + 1):
        print(f"\n--- 🚀 Bắt đầu sinh lịch trình (Lần thử {attempt}/{max_total_attempts}) ---")

        instance, selected_hotel_idx, node_map = create_instance_from_files(
            profile, 
            preferred_tags, 
            penalty_overrides
        )
        
        if instance is None:
            print("❌ Đã hết khách sạn phù hợp để thử. Dừng chương trình.")
            break

        # SỬA ĐỔI: Khởi tạo Solver từ Class đã chọn
        solver = SolverClass(instance, profile)

        feedback, visited_nodes_reordered = solver.run_single_itinerary(
            attempt_num=attempt, 
            time_limit_seconds=30
        )
        
        if feedback == "y":
            print("\n🎉🎉 Lịch trình cuối cùng đã được xác nhận. Hẹn gặp lại!")
            break
        
        print(f"🔄 Đang giảm ưu tiên các địa điểm vừa đi (kể cả khách sạn)...")
        
        current_hotel_penalty = penalty_overrides.get(selected_hotel_idx, 10)
        penalty_overrides[selected_hotel_idx] = int(current_hotel_penalty * 5) # Tăng để không chọn lại

        for reordered_idx in visited_nodes_reordered:
            original_idx = node_map.get(reordered_idx)
            if original_idx and original_idx != selected_hotel_idx:
                current_penalty = penalty_overrides.get(original_idx, 100)
                penalty_overrides[original_idx] = int(max(5, current_penalty * 0.2)) # Giảm để bỏ qua

    if attempt == max_total_attempts:
        print("\n--- Đã hết số lần thử. Kết thúc chương trình. ---")

if __name__ == "__main__":
    main_itinerary_loop()