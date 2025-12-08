import "./User.css";
import React, { useState, useEffect } from "react";
import avatarSample from "../img/avatar-sample.jpg";
import barcodeSample from "../img/barcode-sample.png";
import Footer from "../Footer/Footer";
import Navbar from "../Navbar/Navbar";
import avatarChange from "../img/avatar-change.png";
import VisitedMap from "../Map/VisitedMap";
import { useLanguage } from "../Language/LanguageContext";
import { useAuth } from "../Auth/AuthContext";
import TripHistory from "../TripHistory/TripHistory";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// === BẢNG MAPPING: BACKEND ENUM -> GEOJSON SLUG ===
const PROVINCE_MAPPING = {
  HaNoi: "ha-noi",
  HaiPhong: "hai-phong",
  HungYen: "hung-yen",
  BacNinh: "bac-ninh",
  NinhBinh: "ninh-binh",
  QuangNinh: "quang-ninh",
  ThaiNguyen: "thai-nguyen",
  PhuTho: "phu-tho",
  LaiChau: "lai-chau",
  DienBien: "dien-bien",
  SonLa: "son-la",
  LangSon: "lang-son",
  CaoBang: "cao-bang",
  TuyenQuang: "tuyen-quang",
  LaoCai: "lao-cai",
  ThanhHoa: "thanh-hoa",
  NgheAn: "nghe-an",
  HaTinh: "ha-tinh",
  QuangTri: "quang-tri",
  Hue: "hue",
  DaNang: "da-nang",
  KhanhHoa: "khanh-hoa",
  QuangNgai: "quang-ngai",
  GiaLai: "gia-lai",
  DakLak: "dak-lak",
  LamDong: "lam-dong",
  TPHCM: "ho-chi-minh",
  DongNai: "dong-nai",
  TayNinh: "tay-ninh",
  CanTho: "can-tho",
  VinhLong: "vinh-long",
  DongThap: "dong-thap",
  AnGiang: "an-giang",
  CaMau: "ca-mau",
};

const User = () => {
  const { user, token, setUser } = useAuth();
  const { translate } = useLanguage();
  const navigate = useNavigate();

  // --- KIỂM TRA ROLE PREMIUM ---
  const isVip = user?.role === "VIP" || user?.role === "ADMIN";

  // --- STATE QUẢN LÝ UI ---
  const [isEditing, setIsEditing] = useState(false);

  // Mặc định luôn là "map" để hiển thị bản đồ cho tất cả mọi người
  const [activeSection, setActiveSection] = useState("map");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // Helper date
  const formatDateForInput = (dateData) => {
    if (!dateData) return "";
    if (Array.isArray(dateData)) {
      const [year, month, day] = dateData;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;
    }
    return dateData;
  };

  const formatDateForDisplay = (yyyy_mm_dd) => {
    if (!yyyy_mm_dd) return "";
    const [year, month, day] = yyyy_mm_dd.split("-");
    return `${day}/${month}/${year}`;
  };

  // --- STATE DỮ LIỆU USER ---
  const [name, setName] = useState(user?.fullName || "");
  const [dob, setDob] = useState(formatDateForInput(user?.dob) || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [avatar, setAvatar] = useState(avatarSample);
  const [avatarFile, setAvatarFile] = useState(null);

  // --- STATE MAP ---
  const [visitedSlugs, setVisitedSlugs] = useState([]);
  const [visitedNames, setVisitedNames] = useState([]);
  const [totalVisitedCount, setTotalVisitedCount] = useState(0);

  // --- STATE FORM EDIT ---
  const [editName, setEditName] = useState(name);
  const [editDob, setEditDob] = useState(dob);
  const [editGender, setEditGender] = useState(gender);

  // Effect: Sync user data khi user thay đổi
  useEffect(() => {
    if (user) {
      setName(user.fullName || "");
      setDob(formatDateForInput(user.dob) || "");
      setEditDob(formatDateForInput(user.dob) || "");
      setGender(user.gender || "");
      setEditGender(user.gender || "");
      if (user.avatarImg) {
        const imgSrc = user.avatarImg.startsWith("data:image")
          ? user.avatarImg
          : `data:image/png;base64,${user.avatarImg}`;
        setAvatar(imgSrc);
      }
    }
  }, [user]);

  // Các hàm xử lý chuỗi
  function removeDiacritics(str) {
    if (!str) return "";
    str = str.replace(/[đĐ]/g, "d");
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim();
  }
  function cleanProvinceName(str) {
    if (!str) return "";
    return str.replace(/^(Tỉnh|Thành phố|Thành Phố|TP\.?|TP)\s+/i, "");
  }
  function slugify(str) {
    if (!str) return "";
    const cleanName = cleanProvinceName(str);
    const noDia = removeDiacritics(cleanName);
    return noDia
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  function prettifySlug(slug) {
    if (!slug) return "";
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const convertBackendNameToSlug = (backendName) => {
    if (!backendName) return "";
    if (PROVINCE_MAPPING[backendName]) return PROVINCE_MAPPING[backendName];
    const splitName = backendName.replace(/([a-z])([A-Z])/g, "$1-$2");
    return slugify(splitName);
  };

  // Effect: Lấy danh sách tỉnh đã đi
  useEffect(() => {
    if (!user || !user.id) return;
    let mounted = true;
    const endpoint = `/api/v1/province/getAll?userId=${user.id}`;
    const fullEndpoint = endpoint.startsWith("http")
      ? endpoint
      : `http://localhost:8080${endpoint}`;

    fetch(fullEndpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Err");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const list = data.visited_provinces || [];
        setTotalVisitedCount(data.total_visited || 0);
        const slugs = list
          .map((item) =>
            convertBackendNameToSlug(
              item.province_name || item.provinceName || item.name || ""
            )
          )
          .filter(Boolean);
        if ([...new Set(slugs)].length) setVisitedSlugs([...new Set(slugs)]);
      })
      .catch((err) => console.error("Lỗi khi lấy dữ liệu tỉnh:", err));
    return () => {
      mounted = false;
    };
  }, [user, token]);

  // Effect: Lấy GeoJSON để map tên
  useEffect(() => {
    let mounted = true;
    const GEOJSON_URL =
      "/vietnam-geojson-data/geojson/country-wide/vietnam-tinh-thanh-34.geojson";
    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !data.features) return;
        const map = {};
        data.features.forEach((f) => {
          const n =
            f.properties.ten_tinh ||
            f.properties.NAME_1 ||
            f.properties.name ||
            "";
          if (n) map[slugify(n)] = cleanProvinceName(n);
        });
        setVisitedNames(
          visitedSlugs.map((s) => map[s] || prettifySlug(s)).filter(Boolean)
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [visitedSlugs]);

  // Component Icon Edit
  const EditIcon = ({ onClick }) => (
    <svg
      onClick={onClick}
      className="edit-icon-button"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  );

  // --- HANDLERS ---
  const handleEditClick = () => {
    setEditName(name);
    setEditDob(dob);
    setEditGender(gender);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const currentUserId = user?.userId || user?.id;
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập lại!", "error");
      return;
    }
    try {
      const infoPayload = {
        userId: currentUserId,
        userName: user.username,
        fullName: editName,
        dob: editDob,
        gender: editGender,
      };
      const infoResponse = await fetch(
        "http://localhost:8080/api/v1/user/change-info",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(infoPayload),
        }
      );
      if (!infoResponse.ok) throw new Error("Lỗi khi cập nhật thông tin.");

      let currentAvatarImg = user.avatarImg;
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const avatarResponse = await fetch(
          "http://localhost:8080/api/v1/avatar/change",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        if (avatarResponse.ok)
          currentAvatarImg = avatarFile ? avatar.split(",")[1] : user.avatarImg;
      }

      setName(editName);
      setDob(editDob);
      setGender(editGender);
      const newUserState = {
        ...user,
        fullName: editName,
        dob: editDob,
        gender: editGender,
        avatarImg: currentAvatarImg,
      };
      localStorage.setItem("user", JSON.stringify(newUserState));
      if (setUser) setUser(newUserState);

      setIsEditing(false);
      setAvatarFile(null);
      showToast("Cập nhật thành công!", "success");
    } catch (error) {
      console.error("Error:", error);
      showToast(`Lỗi: ${error.message}`, "error");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    if (user?.avatarImg) {
      const imgSrc = user.avatarImg.startsWith("data:image")
        ? user.avatarImg
        : `data:image/png;base64,${user.avatarImg}`;
      setAvatar(imgSrc);
    } else {
      setAvatar(avatarSample);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Ảnh quá lớn!", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setAvatarFile(file);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HÀM XỬ LÝ KHI BẤM NÚT TAB (PHÂN QUYỀN) ---
  const handleTabClick = (tabName) => {
    // Luôn cho phép chuyển sang tab map
    if (tabName === "map") {
      setActiveSection("map");
      return;
    }

    // Chặn tab lịch sử nếu không phải VIP
    if (tabName === "history" && !isVip) {
      showToast("Tính năng này chỉ dành cho thành viên Premium!", "warning");
      return;
    }
    setActiveSection(tabName);
  };

  // --- HÀM XỬ LÝ KHI PREMIUM BẤM VÀO 1 CHUYẾN ĐI TRONG LỊCH SỬ ---
  const handleSelectTripFromHistory = async (tripId) => {
    if (!tripId) return;
    try {
      // Gọi API lấy chi tiết chuyến đi
      const response = await axios.get(
        `http://localhost:8080/api/v1/trip/get/${tripId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        console.log("Xem lại chuyến đi:", response.data);
        navigate("/currentplan", {
          state: { finalPlan: response.data },
        });
      }
    } catch (error) {
      console.error("Lỗi tải chuyến đi:", error);
      showToast("Không thể tải dữ liệu chuyến đi này.", "error");
    }
  };

  return (
    <div className="user-page-background">
      <Navbar />

      {/* === KHỐI VÉ (FIXED HEIGHT, Z-INDEX CAO) === */}
      <div className="ticket-container">
        <div className="ticket-header">
          <img
            src="/img/plane-ticket.png"
            alt="Plane Ticket"
            className="plane-icon"
          />
          <div className="ticket-company">
            LOKO{" "}
            {isVip && (
              <span
                style={{ color: "gold", fontSize: "0.6em", marginLeft: "5px" }}
              >
                PREMIUM
              </span>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="edit-controls">
            <button className="save-button" onClick={handleSave}>
              <span>Lưu</span>
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              <span>Hủy</span>
            </button>
          </div>
        )}

        <div className="ticket-body">
          <div className="ticket-section passenger-info">
            {/* 1. HỌ TÊN */}
            <div className="info-item">
              <div className="label">
                <span>Họ và Tên</span>
                {!isEditing && <EditIcon onClick={handleEditClick} />}
              </div>
              {isEditing ? (
                <input
                  className="edit-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              ) : (
                <div className="value">
                  {name ? name : <span className="empty-data-box"></span>}
                </div>
              )}
            </div>

            {/* 2. NGÀY SINH */}
            <div className="info-item">
              <div className="label">
                <span>Ngày tháng năm sinh</span>
                {!isEditing && <EditIcon onClick={handleEditClick} />}
              </div>
              {isEditing ? (
                <input
                  className="edit-input"
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                />
              ) : (
                <div className="value">
                  {dob ? (
                    formatDateForDisplay(dob)
                  ) : (
                    <span className="empty-data-box"></span>
                  )}
                </div>
              )}
            </div>

            {/* 3. GIỚI TÍNH */}
            <div className="info-item">
              <div className="label">
                <span>Giới tính</span>
                {!isEditing && <EditIcon onClick={handleEditClick} />}
              </div>
              {isEditing ? (
                <select
                  className="edit-input"
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                >
                  <option value="">-- Chọn --</option>
                  <option value="MALE">NAM</option>
                  <option value="FEMALE">NỮ</option>
                  <option value="OTHER">KHÁC</option>
                </select>
              ) : (
                <div className="value">
                  {gender ? (
                    gender === "MALE" ? (
                      "NAM"
                    ) : gender === "FEMALE" ? (
                      "NỮ"
                    ) : (
                      "KHÁC"
                    )
                  ) : (
                    <span className="empty-data-box"></span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ticket-section travel-stats">
            <div className="info-item">
              <div className="label">Ngày tham gia</div>
              <div className="value">
                {user?.createAt
                  ? formatDateForDisplay(formatDateForInput(user.createAt))
                  : "01/01/2023"}
              </div>
            </div>
            <div className="info-item">
              <div className="label">Số tỉnh/thành đã đi cùng LOKO</div>
              <div
                className="value"
                style={{ fontSize: "1.2rem", fontWeight: 600 }}
              >
                {totalVisitedCount > 0
                  ? totalVisitedCount
                  : visitedSlugs.length}
                /34 tỉnh
              </div>
              <div className="visited-names">
                {visitedNames && visitedNames.length > 0 ? (
                  <>
                    {visitedNames.slice(0, 6).map((n, idx) => (
                      <span key={n + idx} className="pill">
                        {n}
                      </span>
                    ))}
                    {visitedNames.length > 6 && (
                      <span className="pill">
                        và {visitedNames.length - 6} tỉnh khác
                      </span>
                    )}
                  </>
                ) : (
                  <div style={{ color: "#777" }}>
                    Chưa có dữ liệu tỉnh đã đi
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ticket-section avatar-section">
            <div className="avatar-wrapper">
              <img src={avatar} alt="Avatar" className="avatar-img" />
              <input
                type="file"
                id="avatarUpload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatarUpload" className="avatar-change-label">
                <img
                  src={avatarChange}
                  alt="Change Avatar"
                  className="avatar-change"
                />
              </label>
            </div>
          </div>
        </div>

        {/* --- FOOTER: PHÂN QUYỀN NÚT BẤM --- */}
        <div className="ticket-footer">
          {/* NÚT LỊCH SỬ CHUYẾN ĐI (CHỈ VIP) */}
          <button
            className={`travel-history ${
              activeSection === "history" ? "active-tab" : ""
            } ${!isVip ? "disabled-btn" : ""}`}
            onClick={() => handleTabClick("history")}
            style={
              !isVip
                ? {
                    opacity: 0.6,
                    cursor: "not-allowed",
                    filter: "grayscale(100%)",
                  }
                : {}
            }
          >
            <span>{translate("travel_history_button")}</span>
            {!isVip && <span className="lock-icon">🔒</span>}
          </button>

          {/* NÚT THÀNH TỰU (CHỈ VIP) */}
          <button
            className={`travel-history ${
              activeSection === "map" ? "active-tab" : ""
            }`}
            onClick={() => handleTabClick("map")}
            // Bỏ style disabled để nút luôn sáng
          >
            {translate("travel_achievement_button")}
            {!isVip && " 🔒"}
          </button>

          <img src={barcodeSample} className="barcode-img" alt="barcode" />
        </div>
      </div>
      {/* === KẾT THÚC TICKET CONTAINER === */}

      {/* === NỘI DUNG SLIDE (NẰM BÊN NGOÀI VÉ ĐỂ TRƯỢT LÊN XUỐNG) === */}
      <div className="content-stack-wrapper">
        {/* Phần Lịch sử (Chỉ VIP thấy) */}
        {isVip && (
          <div
            className={`content-stack-item history-stack ${
              activeSection === "history" ? "active" : ""
            }`}
            aria-hidden={activeSection !== "history"}
          >
            <TripHistory onSelectTrip={handleSelectTripFromHistory} />
          </div>
        )}

        {/* Phần Bản đồ + Banner (Luôn render) */}
        <div
          className={`content-stack-item map-stack ${
            activeSection === "map" ? "active" : ""
          }`}
          aria-hidden={activeSection !== "map"}
        >
          {/* Map luôn hiển thị */}
          <VisitedMap visited={visitedSlugs} />

          {/* Nếu KHÔNG phải VIP: Render Banner đè lên Map */}
          {!isVip && (
            <div className="premium-upgrade-container glass-overlay">
              <div className="premium-banner-content">
                <div className="premium-text-section">
                  <h3>
                    <span className="crown-icon">👑</span> Nâng tầm trải nghiệm
                    cùng LOKO Premium
                  </h3>
                  <p className="premium-subtitle">
                    Mở khóa toàn bộ tính năng và lưu giữ hành trình của bạn mãi
                    mãi.
                  </p>
                  <ul className="premium-benefits-list">
                    <li>
                      <span className="check-icon">✓</span>{" "}
                      <span>
                        {" "}
                        Xem lại toàn bộ <strong> Lịch sử chuyến đi</strong>.
                      </span>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>{" "}
                      <span>
                        Khoe chiến tích với <strong> Bản đồ thành tựu</strong>.
                      </span>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>{" "}
                      <span>
                        <strong>Không giới hạn </strong> lượt tạo và tìm kiếm
                        lịch trình.
                      </span>
                    </li>
                    <li>
                      <span className="check-icon">✓</span>{" "}
                      <span>
                        Xuất lịch trình ra file <strong> PDF</strong>.
                      </span>
                    </li>
                  </ul>
                  <button
                    className="upgrade-button"
                    onClick={() => {
                      navigate("/purchase");
                    }}
                  >
                    Khám phá Premium ngay
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Toast Notification UI */}
      <div
        className={`toast-notification ${toast.show ? "show" : ""} ${
          toast.type
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
};

export default User;
