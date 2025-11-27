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
    ],
    "Honeymoon": [
        "hotel", 
        "beach",
        "island",
        "yatch",
        "cruise",
        "viewpoint",
        "cafe" 
        "resort",
        "homestay", 
        "restaurant"
    ],
    "Vacation": [
        "hotel", 
        "beach",
        "island",
        "spa",
        "camping",
        "cafe" 
        "resort",
        "homestay", 
        "restaurant"
    ],
    "Photograph": [
        "hotel", 
        "viewpoint",
        "moutain",
        "beach",
        "island",
        "cafe" 
        "resort",
        "homestay", 
        "restaurant",
        "waterfall",
        "river",
        "lake",
        "festival",
        "church",
        "temple"
    ],
    "Nightlife": [
        "hotel", 
        "night market",
        "bar",
        "camping",
        "cafe" 
        "walking street",
        "restaurant"
    ]
}