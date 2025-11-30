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

    # ID 14: MOUNTAIN
    "mountain": 14,

    # ID 15: CAVE
    "cave": 15,

    # ID 16: CAMPING
    "camping": 16,

    # ID 17: DIVING
    "diving": 17,

    # ID 18: MUSEUM
    "museum": 18,

    # ID 19: CITADEL_PALACE
    "citadel/palace": 19,

    # ID 20: CHURCH_TEMPLE_PAGODA
    "church/temple/pagoda": 20,

    # ID 21: OLD_BATTLEFIELD
    "old battlefield": 21,

    #ID 22: BEACH
    "beach": 22,

    #ID 23: ISLAND
    "island": 23,

    #ID 24: YACHT_CRUISE
    "yacht/cruise": 24,

    #ID 25: VIEWPOINT
    "viewpoint": 25,

    #ID 26: RESORT
    "resort": 26,

    #ID 27: HOMESTAY
    "homestay": 27,

    #ID 28: SPA
    "spa": 28,

    #ID 29: RIVER
    "river": 29,

    #ID 30: FLOWER_FIELD_GARDEN
    "flower field/garden": 30,

    #ID 31:BAR
    "bar": 31,

    #ID 32: WALKING_STREET
    "walking street": 32,

    #ID 33: WATERFALL
    "waterfall": 33
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

PROVINCE_ID_TO_NAME = {
    # ======= 1. MIỀN BẮC =======
    1: "Ha Noi",          # HaNoi (Enum Index bắt đầu từ 0 trong list Java, nhưng nếu Database ID khác thì bạn sửa lại key này nhé. Ở đây giả định theo thứ tự Enum)
    2: "Hai Phong",       # HaiPhong
    3: "Hung Yen",        # HungYen
    4: "Bac Ninh",        # BacNinh
    5: "Ninh Binh",       # NinhBinh
    6: "Quang Ninh",      # QuangNinh
    7: "Thai Nguyen",     # ThaiNguyen
    8: "Phu Tho",         # PhuTho
    9: "Lai Chau",        # LaiChau
    10: "Dien Bien",       # DienBien
    11: "Son La",         # SonLa
    12: "Lang Son",       # LangSon
    13: "Cao Bang",       # CaoBang
    14: "Tuyen Quang",    # TuyenQuang
    15: "Lao Cai",        # LaoCai

    # ======= 2. MIỀN TRUNG =======
    16: "Thanh Hoa",      # ThanhHoa
    17: "Nghe An",        # NgheAn
    18: "Ha Tinh",        # HaTinh
    19: "Quang Tri",      # QuangTri
    20: "Hue",            # Hue
    21: "Da Nang",        # DaNang
    22: "Khanh Hoa",      # KhanhHoa

    # ======= 3. TÂY NGUYÊN =======
    23: "Quang Ngai",     # QuangNgai
    24: "Gia Lai",        # GiaLai
    25: "Dak Lak",        # DakLak
    26: "Lam Dong",       # LamDong

    # ======= 4. MIỀN NAM =======
    27: "Ho Chi Minh City", # TPHCM (Map đặc biệt)
    28: "Dong Nai",       # DongNai
    29: "Tay Ninh",       # TayNinh
    30: "Can Tho",        # CanTho
    31: "Vinh Long",      # VinhLong
    32: "Dong Thap",      # DongThap
    33: "An Giang",       # AnGiang
    34: "Ca Mau"          # CaMau
}

def get_province_name_by_id(p_id: int) -> str:
    """
    Lấy tên tỉnh từ ID để query Google Maps.
    """
    return PROVINCE_ID_TO_NAME.get(p_id, "Vietnam") # Default fallback