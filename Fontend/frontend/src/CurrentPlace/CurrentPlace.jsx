import "./CurrentPlace.css";
import React, { useState, useMemo, useEffect } from "react";
import { useLanguage } from "../Language/LanguageContext";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CurrentPlace = ({
  scheduleData,
  currentIndex,
  setCurrentIndex,
  tripId,
  dayIndex = 1, // Hiển thị UI (1, 2, 3...)
  rawDayIndex = 0, // Dùng để gửi API (0, 1, 2...)
  isLastDay = false,
}) => {
  const { translate } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [isTripFinished, setIsTripFinished] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);

  const dataArray = useMemo(
    () => (Array.isArray(scheduleData) ? scheduleData : []),
    [scheduleData]
  );
  const totalPlaces = dataArray.length;
  const [placeRatings, setPlaceRatings] = useState(
    new Array(totalPlaces).fill(0)
  );
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setIsDayCompleted(false);
    setPlaceRatings(new Array(totalPlaces).fill(0));
  }, [scheduleData, totalPlaces]);

  const isLastSlide = currentIndex === totalPlaces - 1;

  const handleRatingSelect = (placeIndex, rating) => {
    setPlaceRatings((prev) => {
      const newR = [...prev];
      newR[placeIndex] = rating;
      return newR;
    });
  };

  // --- API 1: Đánh giá ---
  const submitReviewToBackend = async (locationId, ratingValue) => {
    if (!tripId || !locationId || ratingValue === 0) return;
    const payload = {
      locationId: Number(locationId),
      tripId: Number(tripId),
      rating: Number(ratingValue),
      comment: "",
    };
    try {
      await axios.post("http://localhost:8080/api/reviews/rate", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Rating Error", error);
    }
  };

  // --- API 2: Update Progress (MỚI) ---
  const updateProgressBackend = async (nextDayIdx, nextPlaceIdx) => {
    if (!tripId) return;
    try {
      const payload = {
        tripId: Number(tripId),
        currentDayIndex: nextDayIdx,
        currentPlaceIndex: nextPlaceIdx,
      };
      console.log("💾 Saving Progress:", payload);

      await axios.post(
        "http://localhost:8080/api/v1/trip/update-progress",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("❌ Failed to save progress", error);
    }
  };

  // --- API 3: Complete Trip ---
  const completeTripOnBackend = async () => {
    try {
      await axios.post(`http://localhost:8080/api/v1/trip/complete`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tripId: tripId },
      });
      setIsTripFinished(true);
      alert("🎉 Hoàn thành chuyến đi!");
      navigate("/");
    } catch (error) {
      console.error("Complete Error", error);
    }
  };

  // --- LOGIC NÚT BẤM (Next / Finish) ---
  const handleProcessStep = async () => {
    // 1. Gửi Rating
    const currentPlace = dataArray[currentIndex];
    const placeId = currentPlace.location?.id || currentPlace.id;
    const currentRating = placeRatings[currentIndex] || 0;
    await submitReviewToBackend(placeId, currentRating);

    // 2. Xử lý Chuyển bước & Lưu Progress
    if (!isLastSlide) {
      // --> Sang địa điểm tiếp theo trong cùng 1 ngày
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex); // Update UI

      // Gọi API lưu: Vẫn ở ngày cũ (rawDayIndex), nhưng place tăng lên
      await updateProgressBackend(rawDayIndex, nextIndex);
    } else {
      // --> Hết địa điểm của ngày
      if (isLastDay) {
        await completeTripOnBackend(); // Xong luôn chuyến đi
      } else {
        setIsDayCompleted(true);
        // Lưu progress: Coi như đã xong ngày này, chuẩn bị sang ngày kế tiếp (rawDayIndex + 1), place 0
        // (Hoặc tùy logic backend của bạn muốn lưu trạng thái nào)
        await updateProgressBackend(rawDayIndex + 1, 0);
      }
    }
  };

  // ... (Phần render UI giữ nguyên như cũ) ...
  // Chỉ rút gọn phần hiển thị để code đỡ dài, bạn giữ nguyên logic render

  const getButtonText = () => {
    if (isTripFinished) return "Đã hoàn tất chuyến đi";
    if (isLastSlide) {
      if (isLastDay) return "Hoàn thành chuyến đi";
      return isDayCompleted
        ? `Đã xong ngày ${dayIndex}`
        : `Hoàn thành ngày ${dayIndex}`;
    }
    return translate("currplace_next_button") || "Tiếp theo";
  };

  // ... (Copy phần Render từ code cũ vào đây) ...
  // Lưu ý thêm prop rawDayIndex vào component CurrentPlace ở CurrentPlan.jsx nhé!
  const stars = [1, 2, 3, 4, 5];
  if (totalPlaces === 0)
    return (
      <div className="currplace-container">
        <p>No Data</p>
      </div>
    );
  const transformValue = `translateX(-${currentIndex * 100}%)`;

  return (
    <div className="currplace-container">
      {/* Header */}
      <div className="currplace-header">
        <div className="currplace-title">Lịch trình hiện tại</div>
      </div>

      {/* Slider Window */}
      <div className="currplace-slide-window">
        <div
          className="currplace-slide-wrapper"
          style={{
            transform: transformValue,
            width: `${totalPlaces * 100}%`,
            display: "flex",
            transition: "0.5s",
          }}
        >
          {dataArray.map((place, index) => {
            // Logic lấy ảnh, title như cũ
            let imageList = [];
            const rawImgs = place.location?.locationImgs || place.imgs || [];
            if (Array.isArray(rawImgs)) {
              imageList = rawImgs
                .map((img) =>
                  typeof img === "string" ? img : img.url || img.img_url
                )
                .filter((u) => u && u.startsWith("http"));
            }

            return (
              <div
                key={index}
                className="currplace-card"
                style={{ width: "100%", flexShrink: 0 }}
              >
                <h3 className="place-title">
                  {place.location?.location_name || place.title}
                </h3>
                {/* ... Render chi tiết ... */}

                {/* Rating */}
                <div className="place-rating-input">
                  <div className="star-rating-container">
                    {stars.map((star) => (
                      <span
                        key={star}
                        className="star"
                        style={{
                          color:
                            (index === currentIndex && hoverRating >= star) ||
                            placeRatings[index] >= star
                              ? "#FFD700"
                              : "#ccc",
                          cursor: "pointer",
                          fontSize: "24px",
                        }}
                        onClick={() =>
                          index === currentIndex &&
                          handleRatingSelect(index, star)
                        }
                        onMouseEnter={() =>
                          index === currentIndex && setHoverRating(star)
                        }
                        onMouseLeave={() =>
                          index === currentIndex && setHoverRating(0)
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="place-gallery-list">
                  {imageList.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="gallery-thumbnail"
                      onClick={() => setZoomedImg(url)}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Button */}
      <button
        className={`currplace-next-button ${isLastSlide ? "finish-btn" : ""}`}
        onClick={handleProcessStep}
        disabled={isDayCompleted || isTripFinished}
        style={{
          backgroundColor:
            isDayCompleted || isTripFinished
              ? "#ccc"
              : isLastSlide && isLastDay
              ? "#ff5722"
              : isLastSlide
              ? "#28a745"
              : "",
          cursor: isDayCompleted || isTripFinished ? "not-allowed" : "pointer",
          color: "white",
        }}
      >
        {getButtonText()}
      </button>

      {/* Modal Image... */}
      {zoomedImg && (
        <div className="image-modal-overlay" onClick={() => setZoomedImg(null)}>
          <div className="image-modal-content">
            <img src={zoomedImg} className="zoomed-image" />
            <button onClick={() => setZoomedImg(null)}>x</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentPlace;
