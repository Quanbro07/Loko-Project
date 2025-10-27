import requests
import json

# --- Cấu hình API ---
# API Key bạn cung cấp trong ví dụ
WEATHER_API_KEY = "0c01602b13164d699b6132032252210"
BASE_URL = "http://api.weatherapi.com/v1/current.json"

def get_weather_by_ll(ll_query):
    """
    Hàm gọi WeatherAPI bằng tọa độ (latitude,longitude)
    và trả về dữ liệu JSON.
    """
    
    # Các tham số cho API request
    params = {
        "key": WEATHER_API_KEY,
        "q": ll_query,  # Tọa độ dạng "latitude,longitude"
        "aqi": "yes",   # "yes" để lấy dữ liệu chất lượng không khí (Air Quality)
        "lang": "vi"    # Yêu cầu kết quả bằng tiếng Việt
    }
    
    print(f"\nĐang lấy dữ liệu thời tiết cho tọa độ: {ll_query}...")
    
    try:
        # Gửi request GET đến WeatherAPI
        response = requests.get(BASE_URL, params=params)
        
        # Tự động báo lỗi nếu request không thành công (vd: 400, 401, 403, 500)
        response.raise_for_status() 
        
        # Trả về dữ liệu JSON nếu thành công
        return response.json()
        
    except requests.exceptions.HTTPError as http_err:
        # Xử lý lỗi từ server (ví dụ: API key sai, tọa độ không hợp lệ)
        print(f"Lỗi HTTP: {http_err}")
        print(f"Nội dung lỗi từ API: {response.text}")
    except requests.exceptions.RequestException as e:
        # Xử lý lỗi kết nối (ví dụ: mất mạng)
        print(f"Lỗi khi gọi API: {e}")
        
    return None

def display_weather_info(data):
    """
    Hàm này nhận dữ liệu JSON và in thông tin thời tiết ra màn hình.
    """
    if not data or 'location' not in data or 'current' not in data:
        print("Lỗi: Dữ liệu thời tiết trả về không đầy đủ hoặc không hợp lệ.")
        return

    # Lấy các khối dữ liệu chính
    # Dùng .get(key, {}) để tránh lỗi nếu key không tồn tại
    loc = data.get('location', {})
    curr = data.get('current', {})
    cond = curr.get('condition', {})
    aq = curr.get('air_quality', {})

    print("\n" + "="*40)
    print(f"🌥️ THỜI TIẾT HIỆN TẠI 🌥️")
    print("="*40)
    
    # In thông tin địa điểm
    print(f"Địa điểm: {loc.get('name', 'N/A')}, {loc.get('region', 'N/A')}, {loc.get('country', 'N/A')}")
    print(f"Tọa độ (Lat, Lon): {loc.get('lat', 'N/A')}, {loc.get('lon', 'N/A')}")
    print(f"Giờ địa phương: {loc.get('localtime', 'N/A')}")
    print(f"Cập nhật lần cuối: {curr.get('last_updated', 'N/A')}")
    
    print("\n--- Tình hình chính ---")
    print(f"☀️ Tình trạng: {cond.get('text', 'N/A')}")
    print(f"🌡️ Nhiệt độ: {curr.get('temp_c', 'N/A')} °C")
    print(f"🌡️ Cảm giác như: {curr.get('feelslike_c', 'N/A')} °C")
    
    print("\n--- Chi tiết ---")
    print(f"💧 Độ ẩm: {curr.get('humidity', 'N/A')} %")
    print(f"💨 Gió: {curr.get('wind_kph', 'N/A')} kph, hướng {curr.get('wind_dir', 'N/A')}")
    print(f"🌧️ Lượng mưa: {curr.get('precip_mm', 'N/A')} mm")
    print(f"☁️ Mây che phủ: {curr.get('cloud', 'N/A')} %")
    
    print("\n--- Chất lượng không khí (AQI) ---")
    # Dùng f-string format để làm tròn số thập phân
    print(f"   - PM2.5: {aq.get('pm2_5', 0):.2f} µg/m³")
    print(f"   - US EPA Index: {aq.get('us-epa-index', 'N/A')}")
    
    print("="*40)

# Hàm main để chạy chương trình
if __name__ == "__main__":
    print("--- CHƯƠNG TRÌNH LẤY THỜI TIẾT TỪ TỌA ĐỘ ---")
    
    # Lấy input từ người dùng
    # API yêu cầu định dạng "vĩ độ,kinh độ" (không có khoảng trắng)
    latitude = input("Nhập vĩ độ (Latitude): ")
    longitude = input("Nhập kinh độ (Longitude): ")
    
    # Làm sạch và ghép chuỗi input
    ll_query = f"{latitude.strip()},{longitude.strip()}"
    
    if not latitude or not longitude:
        print("Lỗi: Bạn phải nhập cả vĩ độ và kinh độ.")
    else:
        # 1. Gọi hàm lấy dữ liệu
        weather_data = get_weather_by_ll(ll_query)
        
        # 2. Nếu có dữ liệu, gọi hàm hiển thị
        if weather_data:
            display_weather_info(weather_data)