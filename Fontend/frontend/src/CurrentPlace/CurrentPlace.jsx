import "./CurrentPlace.css";
import React, { useState, useCallback, useMemo } from "react";
import { useLanguage } from "../Language/LanguageContext";

const CurrentPlace = ({ scheduleData, currentIndex, setCurrentIndex }) => {
  const { translate } = useLanguage();

  // State để quản lý ảnh đang được phóng to (Modal)
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

  const isLastSlide = currentIndex === totalPlaces - 1;

  const handleNext = useCallback(() => {
    if (currentIndex < totalPlaces - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [totalPlaces, currentIndex, setCurrentIndex]);

  const handleRatingSubmit = (placeIndex, rating, placeId) => {
    setPlaceRatings((prev) => {
      const newR = [...prev];
      newR[placeIndex] = rating;
      return newR;
    });
    console.log(`Rated Place ${placeId}: ${rating} stars`);
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
            // --- XỬ LÝ DỮ LIỆU HIỂN THỊ ---

            // 1. Lấy tên địa điểm
            let title = "Unknown Location";
            if (place.location) {
              title =
                place.location.location_name ||
                place.location.locationName ||
                place.location.name ||
                place.title;
            } else {
              title = place.locationName || place.title || place.activity;
            }

            // 2. Xử lý thời gian
            const start = place.startTime || place.start_time || "00:00";
            const end = place.endTime || place.end_time || "00:00";
            const timeStr = `${
              typeof start === "string" ? start.substring(0, 5) : start
            } - ${typeof end === "string" ? end.substring(0, 5) : end}`;

            // 3. Lấy mô tả & ID
            const desc = place.description || place.activity || "";
            const placeId = place.location?.id || place.id || index;

            // 4. --- QUAN TRỌNG: LẤY DANH SÁCH ẢNH TỪ DTO ---
            // Dựa vào DTO Java: locationImgs
            // Fallback sang imgs nếu dữ liệu cũ
            const rawImages =
              place.location?.locationImgs ||
              place.location?.imgs ||
              place.imgs ||
              [];
            console.log(rawImages);
            // Map dữ liệu ảnh về dạng URL chuỗi
            const images = rawImages
              .map((img) => {
                if (typeof img === "string") return img;

                // Lấy đường dẫn thô
                let rawUrl =
                  img.img_url || img.url || img.link || img.path || "";

                // Xử lý nếu URL chứa chữ " Maps Photo" thừa (Clean URL)
                if (rawUrl && rawUrl.includes(" Maps Photo")) {
                  rawUrl = rawUrl.replace(" Maps Photo", "").trim();
                }

                return rawUrl;
              })
              .filter((url) => url && url.startsWith("http"));

            return (
              <div
                key={index}
                className="currplace-card"
                style={{ width: "100%", flexShrink: 0 }}
              >
                <h3 className="place-title">{title}</h3>
                <div className="place-time">⏰ {timeStr}</div>
                <div className="place-description">
                  📝{" "}
                  {desc ||
                    translate("currentplace_no_description_available") ||
                    "Không có mô tả chi tiết."}
                </div>

                <div className="place-rating-input">
                  <p className="rating-prompt">
                    {translate("currentplace_rate_this_place") ||
                      "Đánh giá địa điểm này:"}
                  </p>
                  <div className="star-rating-container">
                    {stars.map((starValue) => (
                      <span
                        key={starValue}
                        className="star"
                        style={{
                          color:
                            (index === currentIndex &&
                              hoverRating >= starValue) ||
                            placeRatings[index] >= starValue
                              ? "#FFD700"
                              : "#ccc",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={() => {
                          if (index === currentIndex)
                            handleRatingSubmit(index, starValue, placeId);
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

                {/* --- 5. HIỂN THỊ LIST ẢNH --- */}
                {images.length > 0 && (
                  <div className="place-gallery-container">
                    <p className="gallery-title">
                      📸{" "}
                      {translate("currentplace_photos") || "Hình ảnh thực tế:"}
                    </p>
                    <div className="place-gallery-list">
                      {images.map((imgUrl, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={imgUrl}
                          alt={`Place ${imgIdx}`}
                          className="gallery-thumbnail"
                          onClick={() => setZoomedImg(imgUrl)} // Click để phóng to
                          onError={(e) => {
                            e.target.style.display = "none"; // Ẩn ảnh lỗi
                          }}
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

      <button
        className="currplace-next-button"
        onClick={handleNext}
        disabled={isLastSlide}
      >
        {translate("currplace_next_button") || "Tiếp theo"}
      </button>
      <div className="currplace-counter">
        {currentIndex + 1} / {totalPlaces}
      </div>

      {/* --- MODAL OVERLAY (Phóng to ảnh) --- */}
      {zoomedImg && (
        <div className="image-modal-overlay" onClick={() => setZoomedImg(null)}>
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={zoomedImg} alt="Zoomed Place" className="zoomed-image" />
            <button
              className="close-modal-btn"
              onClick={() => setZoomedImg(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentPlace;
