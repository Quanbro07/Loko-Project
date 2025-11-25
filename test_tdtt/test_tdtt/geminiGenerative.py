import google.generativeai as genai
from categories_creator.amusement import run_amusement
from categories_creator.adventure import run_adventure
from categories_creator.history import run_history
from categories_creator.food import run_food

# ==========================
# CONFIG INPUT / OUTPUT
# ==========================
INPUT_FILE = "lam_dong.json"
OUTPUT_FILE = "attractions_with_tags.json"
BATCH_SIZE = 20  # Đặt ở main

# ==========================
# API KEY + MODEL
# ==========================
API_KEY = "AIzaSyB1ZGPnAMCHz9QC_KguYToOxkprnZ2yMMU"
genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("models/gemini-2.5-flash")

# ==========================
# MAIN
# ==========================
def main():
    print("=== CATEGORIES CREATOR ===")
    print("1. Food")
    print("2. Amusement")
    print("3. Adventure")
    print("4. History")

    choice = input("Chọn loại xử lý (1-3): ").strip()

    if choice == "1":
        print("🚀 Chạy Food...")
        run_food(MODEL, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE)
        print("🎉 Hoàn tất xử lý Food!")

    elif choice == "2":
        print("🚀 Chạy Amusement...")
        run_amusement(MODEL, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE)
        print("🎉 Hoàn tất xử lý Amusement!")

    elif choice == "3":
        print("🚀 Chạy Adventure...")
        run_adventure(MODEL, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE)
        print("🎉 Hoàn tất xử lý Amusement!")

    elif choice == "4":
        print("🚀 Chạy History...")
        run_history(MODEL, INPUT_FILE, OUTPUT_FILE, BATCH_SIZE)
        print("🎉 Hoàn tất xử lý Amusement!")

    else:
        print("❌ Lựa chọn không hợp lệ.")


if __name__ == "__main__":
    main()
