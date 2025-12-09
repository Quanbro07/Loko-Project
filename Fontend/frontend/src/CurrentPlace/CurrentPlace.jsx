import "./CurrentPlace.css";
import React, { useState, useMemo } from "react";
import { useLanguage } from "../Language/LanguageContext";
import { useAuth } from "../Auth/AuthContext";
import axios from "axios";

// Thêm prop dayIndex (để biết là Ngày mấy)
const CurrentPlace = ({ scheduleData, currentIndex, setCurrentIndex, tripId, dayIndex = 1 }) => {
  const { translate } = useLanguage();
  const { token } = useAuth();
  
  // State quản lý xem ngày này đã hoàn thành chưa để disable nút
  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);

  const dataArray = useMemo(
    () => (Array.isArray(scheduleData) ? scheduleData : []),
    [scheduleData]
  );
  const totalPlaces = dataArray.length;

  const [placeRatings, setPlaceRatings] = useState(
    new Array(totalPlaces || 0).fill(0)
  );
  const [hoverRating, setHoverRating] = useState(0);

  // Kiểm tra xem có phải phần tử cuối cùng không
  const isLastSlide = currentIndex === totalPlaces - 1;

  // --- 1. HÀM CHỈ LƯU STATE SAO (Không gửi API ngay) ---
  const handleRatingSelect = (placeIndex, rating) => {
    setPlaceRatings((prev) => {
      const newR = [...prev];
      newR[placeIndex] = rating;
      return newR;
    });
  };

  // --- 2. HÀM GỬI API (Được gọi khi bấm Next/Finish) ---
  const submitReviewToBackend = async (locationId, ratingValue) => {
    if (!tripId || !locationId) return;

    // Payload chuẩn bị gửi
    const payload = {
      locationId: Number(locationId),
      tripId: Number(tripId),
      rating: Number(ratingValue),
      comment: "" 
    };

    // 👉 YÊU CẦU CỦA BẠN: Console log payload trước khi gửi
    console.log("🚀 [Payload Sending] Gói tin gửi đi:", JSON.stringify(payload, null, 2));

    try {
      const API_URL = "http://localhost:8080/api/reviews/rate"; // Sửa lại port nếu cần
      const config = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        }
      };
      
      // Chỉ gửi nếu rating > 0 (hoặc tùy logic của bạn)
      if (payload.rating > 0) {
        await axios.post(API_URL, payload, config);
        console.log("✅ Đã gửi đánh giá thành công!");
      } else {
        console.log("ℹ️ User chưa đánh giá sao nào, bỏ qua request.");
      }
    } catch (error) {
      console.error("❌ Lỗi gửi đánh giá:", error);
    }
  };

  // --- 3. XỬ LÝ NÚT NEXT / HOÀN THÀNH ---
  const handleProcessStep = async () => {
    // 1. Lấy thông tin địa điểm hiện tại
    const currentPlace = dataArray[currentIndex];
    const placeId = currentPlace.location?.id || currentPlace.id;
    const currentRating = placeRatings[currentIndex] || 0;

    // 2. Gửi dữ liệu của địa điểm hiện tại (Log payload nằm trong hàm này)
    await submitReviewToBackend(placeId, currentRating);

    // 3. Điều hướng logic
    if (!isLastSlide) {
      // Nếu chưa phải cuối -> Next
      setCurrentIndex(currentIndex + 1);
    } else {
      // Nếu là cuối -> Hoàn thành
      setIsDayCompleted(true);
      console.log("🎉 Đã hoàn thành lịch trình ngày hôm nay!");
    }
  };

  const stars = [1, 2, 3, 4, 5];

  if (totalPlaces === 0) {
    return (
      <div className="currplace-container">
        <p className="no-schedule-data">
          {translate("currentplace_no_plan") || "Chưa có dữ liệu cho ngày này."}
        </p>
      </div>
    );
  }

  const transformValue = `translateX(-${currentIndex * 100}%)`;

  return (
    <div className="currplace-container">
      <div className="currplace-header">
        <div className="currplace-title">
          {translate("currentplace_your_current_plan") || "Lịch trình hiện tại"}
        </div>
      </div>

      <div className="currplace-slide-window">
        <div
          className="currplace-slide-wrapper"
          style={{
            transform: transformValue,
            width: `${totalPlaces * 100}%`,
            display: "flex",
            transition: "transform 0.5s ease",
          }}
        >
          {dataArray.map((place, index) => {
            // ... (Logic xử lý hiển thị title, image giữ nguyên như cũ) ...
            let title = "Unknown Location";
            if (place.location) {
              title = place.location.location_name || place.location.locationName || place.location.name || place.title;
            } else {
              title = place.locationName || place.title || place.activity;
            }

            const start = place.startTime || place.start_time || "00:00";
            const end = place.endTime || place.end_time || "00:00";
            const timeStr = `${typeof start === "string" ? start.substring(0, 5) : start} - ${typeof end === "string" ? end.substring(0, 5) : end}`;
            const desc = place.description || place.activity || "";
            
            // Xử lý ảnh
            const rawImages = place.location?.locationImgs || place.location?.imgs || place.imgs || [];
            const images = rawImages.map((img) => {
                if (typeof img === "string") return img;
                let rawUrl = img.img_url || img.url || img.link || img.path || "";
                if (rawUrl && rawUrl.includes(" Maps Photo")) rawUrl = rawUrl.replace(" Maps Photo", "").trim();
                return rawUrl;
            }).filter((url) => url && url.startsWith("http"));

            return (
              <div key={index} className="currplace-card" style={{ width: "100%", flexShrink: 0 }}>
                <h3 className="place-title">{title}</h3>
                <div className="place-time">⏰ {timeStr}</div>
                <div className="place-description">📝 {desc || "Không có mô tả chi tiết."}</div>

                <div className="place-rating-input">
                  <p className="rating-prompt">
                    {translate("currentplace_rate_this_place") || "Đánh giá địa điểm này:"}
                  </p>
                  <div className="star-rating-container">
                    {stars.map((starValue) => (
                      <span
                        key={starValue}
                        className="star"
                        style={{
                          color: (index === currentIndex && hoverRating >= starValue) || placeRatings[index] >= starValue ? "#FFD700" : "#ccc",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        // Thay đổi logic click: Chỉ set state, không gửi API ngay
                        onClick={() => {
                          if (index === currentIndex) handleRatingSelect(index, starValue);
                        }}
                        onMouseEnter={() => {
                          if (index === currentIndex) setHoverRating(starValue);
                        }}
                        onMouseLeave={() => {
                          if (index === currentIndex) setHoverRating(0);
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="place-gallery-container">
                    <p className="gallery-title">📸 Hình ảnh thực tế:</p>
                    <div className="place-gallery-list">
                      {images.map((imgUrl, imgIdx) => (
                        <img
                          key={imgIdx} src={imgUrl} alt={`Place ${imgIdx}`} className="gallery-thumbnail"
                          onClick={() => setZoomedImg(imgUrl)}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- NÚT ĐIỀU HƯỚNG THÔNG MINH --- */}
      <button
        className={`currplace-next-button ${isLastSlide ? "finish-btn" : ""}`}
        onClick={handleProcessStep}
        disabled={isDayCompleted} // Disable nếu đã bấm hoàn thành
        style={{
           backgroundColor: isDayCompleted ? "#ccc" : (isLastSlide ? "#28a745" : ""), // Đổi màu xanh lá nếu là nút hoàn thành
           cursor: isDayCompleted ? "not-allowed" : "pointer"
        }}
      >
        {isDayCompleted 
          ? "Đã hoàn thành" 
          : isLastSlide 
            ? `Hoàn thành ngày ${dayIndex}` // Thay đổi text nếu là slide cuối
            : (translate("currplace_next_button") || "Tiếp theo")
        }
      </button>

      <div className="currplace-counter">
        {currentIndex + 1} / {totalPlaces}
      </div>

      {zoomedImg && (
        <div className="image-modal-overlay" onClick={() => setZoomedImg(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={zoomedImg} alt="Zoomed Place" className="zoomed-image" />
            <button className="close-modal-btn" onClick={() => setZoomedImg(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentPlace;