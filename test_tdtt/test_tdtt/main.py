# main.py
from tag_rules.food_profile import FoodProfile
from data_loader import create_instance_from_files
from solvers.food_solver import FoodSolver # <-- SỬA: Import FoodSolver

if __name__ == "__main__":
    print("=== DU LỊCH ẨM THỰC ===")
    
    # Các tag người dùng ưu tiên (có thể lấy từ UI)
    preferred_tags = ["restaurant", "speciality"] 
    
    # 1. Chọn Profile
    profile = FoodProfile()
    
    # 2. Tải dữ liệu dựa trên profile
    instance = create_instance_from_files(profile, preferred_tags)
    
    # 3. Khởi tạo Solver đặc thù
    solver = FoodSolver(instance, profile) # <-- SỬA: Khởi tạo Solver
    
    # 4. Chạy solver với vòng lặp phản hồi
    solver.run_solver_with_feedback(
        max_attempts=3, 
        time_limit_seconds=30
    ) # <-- SỬA: Gọi hàm của solver