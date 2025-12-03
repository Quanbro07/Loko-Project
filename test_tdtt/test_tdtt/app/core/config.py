import os

class Settings:
    # Cấu hình API Key
    GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", "936a7ef652bd479d8fb93d36dc2e1a3e") # Key từ file cũ của bạn
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBEo1-yGc12DV75wPtIO4RHjbniRpo5uD0") # Key từ file cũ của bạn
    SERP_API_KEY = os.getenv("SERP_API_KEY", "559cc6706988c66736951336f1f163f62c4c6ede7ba0f88730e280ba00bb9228") # Key cho Google Maps crawler cũ
    GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1/routing"

    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "0c01602b13164d699b6132032252210")
    WEATHER_API_BASE_URL = "http://api.weatherapi.com/v1/forecast.json"
    
    # Cấu hình mặc định nếu Request không gửi
    DEFAULT_DAY_START = "08:00"
    DEFAULT_DAY_END = "22:00"
    
    # Logic cũ
    END_TIME_FLEX_MINS = 20
    LUNCH_PENALTY = 150

settings = Settings()

# --- BACKWARD COMPATIBILITY (Tương thích ngược) ---
# Xuất các biến ra level module để các file cũ (như google_maps.py) có thể import trực tiếp
# Ví dụ: from app.core.config import SERP_API_KEY

SERP_API_KEY = settings.SERP_API_KEY
GEOAPIFY_API_KEY = settings.GEOAPIFY_API_KEY
GEMINI_API_KEY = settings.GEMINI_API_KEY
WEATHER_API_KEY = settings.WEATHER_API_KEY