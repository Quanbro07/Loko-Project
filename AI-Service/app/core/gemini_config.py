# app/core/gemini_config.py

import google.generativeai as genai
from app.core.config import GEMINI_API_KEY 

# Setup
genai.configure(api_key=GEMINI_API_KEY)

# Khởi tạo Model (Singleton)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash")
BATCH_SIZE = 20