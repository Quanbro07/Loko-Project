# main.py
from tag_rules.food_profile import FoodProfile
from data_loader import create_instance_from_files
from solvers.food_solver import FoodSolver

def main_itinerary_loop():
    """
    Hàm chính điều khiển MỘT vòng lặp duy nhất.
    Mỗi lần "no", nó sẽ giảm ưu tiên tất cả (KS + địa điểm) 
    và tự động tìm 1 KS mới (hoặc KS cũ nếu vẫn là tốt nhất).
    """
    
    # --- Cấu hình ban đầu ---
    preferred_tags = ["restaurant", "speciality", "night market"] 
    profile = FoodProfile()
    
    # --- Logic mới: Bộ nhớ về các địa điểm đã bị giảm ưu tiên ---
    # Key = original_index, Value = new_penalty
    penalty_overrides = {} 
    
    max_total_attempts = 10 # Cho phép tổng cộng 10 lần thử (cả KS và địa điểm)
    
    for attempt in range(1, max_total_attempts + 1):
        print(f"\n--- 🚀 Bắt đầu sinh lịch trình (Lần thử {attempt}/{max_total_attempts}) ---")

        # 1. Tải instance, truyền "bộ nhớ" penalty vào
        # data_loader sẽ tự động chọn KS tốt nhất dựa trên penalty mới
        instance, selected_hotel_idx, node_map = create_instance_from_files(
            profile, 
            preferred_tags, 
            penalty_overrides
        )
        
        if instance is None:
            print("❌ Đã hết khách sạn phù hợp để thử. Dừng chương trình.")
            break

        # 2. Khởi tạo Solver
        solver = FoodSolver(instance, profile)

        # 3. Chạy MỘT lần
        feedback, visited_nodes_reordered = solver.run_single_itinerary(
            attempt_num=attempt, 
            time_limit_seconds=30
        )
        
        # 4. Xử lý kết quả
        if feedback == "y":
            print("\n🎉🎉 Lịch trình cuối cùng đã được xác nhận. Hẹn gặp lại!")
            break # User đã nhấn "y", thoát vòng lặp
        
        # 5. Nếu "n": Cập nhật "bộ nhớ" penalty
        print(f"🔄 Đang giảm ưu tiên các địa điểm vừa đi (kể cả khách sạn)...")
        
        # Giảm ưu tiên khách sạn
        current_hotel_penalty = penalty_overrides.get(selected_hotel_idx, 10) # 10 là penalty KS
        penalty_overrides[selected_hotel_idx] = int(current_hotel_penalty * 5)

        # Giảm ưu tiên các địa điểm
        for reordered_idx in visited_nodes_reordered:
            original_idx = node_map.get(reordered_idx) # Lấy index gốc
            if original_idx and original_idx != selected_hotel_idx:
                # Lấy penalty hiện tại từ bộ nhớ (hoặc 100 nếu chưa có)
                current_penalty = penalty_overrides.get(original_idx, 100)
                penalty_overrides[original_idx] = int(max(5, current_penalty * 0.2))

    if attempt == max_total_attempts:
        print("\n--- Đã hết số lần thử. Kết thúc chương trình. ---")

if __name__ == "__main__":
    main_itinerary_loop()