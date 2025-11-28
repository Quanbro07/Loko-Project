package com.exproject.backend.province.info;

/**
 * Danh sách 34 tỉnh/thành phố của Việt Nam (hiệu lực từ 01/07/2025)
 * Được phân loại theo 4 Miền (Bắc, Trung, Tây Nguyên, Nam)
 * Dựa trên 6 Vùng kinh tế - xã hội mới.
 */
public enum EProvince {

    // ======= 1. MIỀN BẮC (Tổng cộng 15 tỉnh/thành) =======
    HaNoi,          // 0
    HaiPhong,
    HungYen,
    BacNinh,
    NinhBinh,
    QuangNinh,
    ThaiNguyen,
    PhuTho,
    LaiChau,
    DienBien,
    SonLa,
    LangSon,
    CaoBang,
    TuyenQuang,
    LaoCai,


    // ======= 2. MIỀN TRUNG (Tổng cộng 7 tỉnh/thành) =======
    ThanhHoa,     // 15
    NgheAn,
    HaTinh,
    QuangTri,
    Hue,
    DaNang,
    KhanhHoa,


    // ======= 3. TÂY NGUYÊN (Tổng cộng 4 tỉnh/thành) =======
    QuangNgai,   // 22
    GiaLai,
    DakLak,
    LamDong,


    // ======= 4. MIỀN NAM (Tổng cộng 8 tỉnh/thành) =======
    TPHCM,  // 26
    DongNai,
    TayNinh,
    CanTho,
    VinhLong,
    DongThap,
    AnGiang,
    CaMau
}