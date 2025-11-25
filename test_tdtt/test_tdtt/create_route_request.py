import json

# --- Cấu hình tên file ---
INPUT_SCHEDULE_FILE = 'schedule.json'
OUTPUT_REQUEST_FILE = 'geoapify_request.json'
TRAVEL_MODE = 'drive'  # Chế độ lái xe

def create_geoapify_request():
    print(f"📂 Đang đọc file lịch trình: {INPUT_SCHEDULE_FILE}...")
    
    try:
        with open(INPUT_SCHEDULE_FILE, 'r', encoding='utf-8') as f:
            schedule_data = json.load(f)
    except Exception as e:
        print(f"❌ Lỗi khi đọc file: {e}")
        return

    # Lấy danh sách các phần (tripSections)
    trip_sections = schedule_data.get('tripSections')
    if not trip_sections or not isinstance(trip_sections, list):
        print("❌ Lỗi: File schedule.json không chứa danh sách 'tripSections' hợp lệ.")
        return

    all_requests = {}

    # Duyệt qua từng ngày
    for section in trip_sections:
        day_number = section.get('dayNumber')
        day_title = section.get('title', f'Day {day_number}')
        trip_details = section.get('tripDetails', [])
        
        day_key = f"Day {day_number}" 
        print(f"   -> Xử lý: {day_title} ({len(trip_details)} điểm)")

        waypoints = []
        for item in trip_details:
            location = item.get('location', {})
            lat = location.get('latitude')
            lon = location.get('longitude')
            
            if lat is not None and lon is not None:
                # Geoapify nhận [lon, lat]
                waypoints.append([lon, lat])
            else:
                print(f"      ⚠️ Bỏ qua địa điểm thiếu tọa độ: {item.get('description')}")

        if len(waypoints) >= 2:
            all_requests[day_key] = {
                "mode": TRAVEL_MODE,
                "waypoints": waypoints
            }
        else:
            print(f"      ⚠️ Cảnh báo: {day_key} không đủ điểm để tạo lộ trình.")

    # Ghi file request
    try:
        with open(OUTPUT_REQUEST_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_requests, f, indent=4, ensure_ascii=False)
        print(f"\n✅ Đã tạo xong file: {OUTPUT_REQUEST_FILE}")
    except Exception as e:
        print(f"❌ Lỗi khi ghi file: {e}")

if __name__ == "__main__":
    create_geoapify_request()