import os
from dotenv import load_dotenv

# 1. Load biến môi trường từ file .env
load_dotenv()

class Settings:
    # --- CẤU HÌNH BẢO MẬT (Lấy từ .env) ---
    # Không để giá trị mặc định là key thật ở đây nữa
    GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    SERP_API_KEY = os.getenv("SERP_API_KEY")
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

    # --- CẤU HÌNH URL & HẰNG SỐ (Giữ nguyên) ---
    GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1/routing"
    WEATHER_API_BASE_URL = "http://api.weatherapi.com/v1/forecast.json"
    
    # Cấu hình mặc định nếu Request không gửi
    DEFAULT_DAY_START = "08:00"
    DEFAULT_DAY_END = "22:00"
    
    # Logic cũ
    END_TIME_FLEX_MINS = 20
    LUNCH_PENALTY = 150

settings = Settings()

# --- BACKWARD COMPATIBILITY (Tương thích ngược) ---
# Các biến này vẫn giữ nguyên tên để không làm hỏng các file cũ đang import chúng
# Nhưng giá trị của chúng giờ được lấy an toàn từ class Settings

SERP_API_KEY = settings.SERP_API_KEY
GEOAPIFY_API_KEY = settings.GEOAPIFY_API_KEY
GEMINI_API_KEY = settings.GEMINI_API_KEY
WEATHER_API_KEY = settings.WEATHER_API_KEY