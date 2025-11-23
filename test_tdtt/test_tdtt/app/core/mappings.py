# app/core/mappings.py

# Từ điển map trực tiếp từ Tag của AI sang ID trong Database
# Key: Là từ khóa AI trả về (đã lowercase)
# Value: Là ID trong bảng location_category của bạn
TAG_TO_ID = {
    # ID 1: SNACK
    "snack": 1,

    # ID 2: RESTAURANT
    "restaurant": 2,

    # ID 3: CAFE
    "cafe": 3,

    # ID 4: NIGHT_MARKET
    "night market": 4,

    # ID 5: MARKET
    "market": 5,

    # ID 6: SPECIALITY
    "speciality": 6,

    # ID 7: HOTEL
    "hotel": 7,

    # ID 8: AMUSEMENT_WATER_PARK
    "amusement/water park": 8,

    # ID 9: ZOO
    "zoo": 9,

    # ID 10: AQUARIUM
    "aquarium": 10,

    # ID 11: NIGHTLIFE
    "nightlife": 11,

    # ID 12: FESTIVAL
    "festival": 12,

    # ID 13: CULTURE_PERFORMANCE
    "cultural performance": 13
}

def get_category_id(tag_raw: str) -> int:
    """
    Hàm chuẩn hóa và lấy ID.
    VD: "Amusement/Water Park" -> "amusement/water park" -> 8
    """
    if not tag_raw:
        return None
    
    # 1. Chuẩn hóa: chuyển về chữ thường + xóa khoảng trắng thừa đầu đuôi
    clean_tag = tag_raw.lower().strip()
    
    # 2. Tra từ điển
    return TAG_TO_ID.get(clean_tag)