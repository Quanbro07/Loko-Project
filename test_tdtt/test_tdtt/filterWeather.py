import json

def filter_weather_data(input_file):
    try:
        # 1. Đọc file JSON
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 2. Chuẩn bị biến chứa kết quả
        filtered_results = {
            "location": data['location']['name'],
            "country": data['location']['country'],
            "daily_forecasts": []
        }

        # 3. Duyệt qua từng ngày dự báo
        forecast_days = data['forecast']['forecastday']
        
        for day in forecast_days:
            hours_list = day['hour']
            
            # Lấy object tại index 8 (8h sáng) và 17 (5h chiều)
            # WeatherAPI đảm bảo danh sách hour luôn chạy từ 00:00 -> 23:00
            hour_8 = hours_list[8]
            hour_17 = hours_list[17]

            # Tạo object rút gọn cho ngày đó
            daily_summary = {
                "date": day['date'],
                "avg_temp": day['day']['avgtemp_c'], # Nhiệt độ trung bình ngày
                "condition_text": day['day']['condition']['text'], # Thời tiết chung cả ngày
                "selected_hours": [
                    {
                        "time": "08:00",
                        "temp_c": hour_8['temp_c'],
                        "condition": hour_8['condition']['text'],
                        "rain_chance": hour_8['chance_of_rain'],
                        "wind_kph": hour_8['wind_kph']
                    },
                    {
                        "time": "17:00",
                        "temp_c": hour_17['temp_c'],
                        "condition": hour_17['condition']['text'],
                        "rain_chance": hour_17['chance_of_rain'],
                        "wind_kph": hour_17['wind_kph']
                    }
                ]
            }
            
            filtered_results["daily_forecasts"].append(daily_summary)

        return filtered_results

    except FileNotFoundError:
        print("Lỗi: Không tìm thấy file JSON.")
        return None

# --- CHẠY SCRIPT ---
if __name__ == "__main__":
    # Giả sử file json nằm cùng thư mục
    output = filter_weather_data('responseWeather.json')
    
    if output:
        # In kết quả ra màn hình (hoặc có thể ghi ra file mới)
        print(json.dumps(output, indent=4, ensure_ascii=False))