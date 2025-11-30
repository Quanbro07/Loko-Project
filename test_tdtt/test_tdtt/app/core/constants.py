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
        "zoo",
        "aquarium",
        "cultural performance",
        "festival",
        "hotel",
        "restaurant"
    ],
    "Adventure": [
        "mountain", 
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
        "pagoda",
        "hotel", 
        "restaurant"
    ],
    "Honeymoon": [
        "hotel", 
        "beach",
        "island",
        "yacht",
        "cruise",
        "viewpoint",
        "cafe",
        "resort",
        "homestay", 
        "restaurant"
    ],
    "Vacation": [
        "hotel", 
        "beach",
        "spa",
        "camping",
        "cafe",
        "resort",
        "restaurant"
    ],
    "Photograph": [
        "hotel", 
        "viewpoint",
        "beach",
        "cafe",
        "resort",
        "restaurant",
        "waterfall",
        "temple"
    ],
    "Nightlife": [
        "hotel", 
        "night market",
        "bar",
        "camping",
        "cafe",
        "walking street",
        "restaurant"
    ]
}