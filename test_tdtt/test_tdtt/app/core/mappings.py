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
    "cultural performance": 13,

    # ID 14: MOUTAIN
    "moutain": 14,

    # ID 15: CAVE
    "cave": 15,

    # ID 16: CAMPING
    "camping": 16,

    # ID 17: DIVING
    "diving": 17,

    # ID 18: MUSEUM
    "museum": 18,

    # ID 19: CITADEL/PALACE
    "citadel/palace": 19,

    # ID 20: CHURCH_TEMPLE_PAGODA
    "church/temple/pagoda": 20,

    # ID 21: OLD_BATTLEFIELD
    "old battlefield": 21

}

# --- TẠO TỪ ĐIỂN ĐẢO NGƯỢC (ID -> TAG) ---
ID_TO_TAG = {v: k for k, v in TAG_TO_ID.items()}

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

# --- HÀM MỚI ĐỂ LẤY TAG TỪ ID ---
def get_tag_from_id(cat_id: int) -> str:
    """
    Chuyển đổi ID category thành tag string.
    VD: 8 -> "amusement/water park"
    """
    return ID_TO_TAG.get(cat_id, "unknown")