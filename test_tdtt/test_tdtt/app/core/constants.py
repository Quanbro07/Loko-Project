# app/core/constants.py

# Mapping kiểu du lịch -> Các từ khóa cần search Google Map
CATEGORY_KEYWORDS = {
    "Food": [
        "specialities", 
        "snack", 
        "restaurant", 
        "night market", 
        "hotel" # Food thường gắn liền nơi ở hoặc ăn uống trong ks
    ],
    "Amusement": [
        "amusement",
        "amusement park",
        "water park",
        "zoo",
        "aquarium",
        "cultural performance",
        "nightlife",
        "festival",
        "hotel",
        "restaurant"
    ],
    "Adventure": [
        "moutain", 
        "cave",
        "waterfall",
        "camping",
        "diving", 
        "hotel", 
        "restaurant"
    ],
    "History": [
        "museum", 
        "citadel",
        "palace",
        "old battlefield",
        "church",
        "temple",
        "pagoda" 
        "hotel", 
        "restaurant"
    ]
}