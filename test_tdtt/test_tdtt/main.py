from data_loader import create_instance_from_files
from itinerary_solver import solve_itinerary, format_and_save_solution
from tag_rules import get_preferred_tags

if __name__ == "__main__":
    print("Chọn loại hình du lịch:")
    print("1. Ẩm thực")
    print("2. Vui chơi giải trí")
    print("3. Mạo hiểm")
    print("4. Chụp hình sống ảo")
    print("5. Văn hóa lịch sử")
    print("6. Nghỉ dưỡng")
    print("7. Tuần trăng mật")
    print("8. Giải trí đêm")
    print("9. Du lịch biển đảo")

    choice = int(input("Nhập số (1–9): "))
    preferred_tags = get_preferred_tags(choice)
    print(f"\n✅ Tags ưu tiên cho lựa chọn {choice}: {preferred_tags}")

    instance = create_instance_from_files(preferred_tags)
    solution, manager, routing, time_dim = solve_itinerary(instance, 15)

    if solution:
        format_and_save_solution(solution, manager, routing, time_dim, instance)
