import os

class Settings:
    # Cấu hình API Key
    GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", "936a7ef652bd479d8fb93d36dc2e1a3e") # Key từ file cũ của bạn
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDYDxuvC6YuUpuh2aWdHhdOILakoHiDBK0") # Key từ file cũ của bạn
    SERP_API_KEY = os.getenv("SERP_API_KEY", "c45056e1054eb471aa09bed19faef41ceddf9cce13e88ebdc58238c25a841854") # Key cho Google Maps crawler cũ
    GEOAPIFY_BASE_URL = "https://api.geoapify.com/v1/routing"
    
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