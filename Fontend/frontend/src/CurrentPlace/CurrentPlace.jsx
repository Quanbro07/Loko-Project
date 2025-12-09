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
  dayIndex = 1,
  // 👇 Nhận ID Section từ cha để update progress đúng
  currentSectionId,
  rawDayIndex = 0,
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

  const safeIndex =
    currentIndex >= 0 && currentIndex < totalPlaces ? currentIndex : 0;
  const isLastSlide = safeIndex === totalPlaces - 1;

  const handleRatingSelect = (placeIndex, rating) => {
    setPlaceRatings((prev) => {
      const newR = [...prev];
      newR[placeIndex] = rating;
      return newR;
    });
  };

  // --- API 1: GỬI REVIEW (ĐÃ SỬA URL) ---
  const submitReviewToBackend = async (locationId, ratingValue) => {
    // Chỉ gửi nếu có rating > 0
    if (!tripId || !locationId || !ratingValue || ratingValue <= 0) return;

    const payload = {
      locationId: Number(locationId),
      tripId: Number(tripId),
      rating: Number(ratingValue),
      comment: "",
    };

    console.log("🚀 Đang gửi review:", payload);

    try {
      // ✅ FIX: Thêm /create vào đường dẫn
      const API_URL = "http://localhost:8080/api/v1/review/create";

      await axios.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("✅ Gửi đánh giá thành công!");
    } catch (e) {
      if (e.response) {
        console.error("❌ Lỗi Backend Review:", e.response.data);
      } else {
        console.error("❌ Lỗi kết nối Review:", e);
      }
    }
  };

  // --- API 2: UPDATE TIẾN ĐỘ ---
  const updateProgressBackend = async (sectionId, detailId) => {
    if (!tripId || !sectionId || !detailId) return;
    try {
      // Gửi theo ID (Chuẩn xác hơn Index)
      const payload = {
        tripId: Number(tripId),
        currentTripSectionId: Number(sectionId),
        currentTripDetailId: Number(detailId),
      };
      // console.log("💾 Saving Progress:", payload);
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
    } catch (e) {
      console.error("⚠️ Lỗi lưu tiến độ:", e);
    }
  };

  // --- API 3: HOÀN THÀNH TRIP ---
  const completeTripOnBackend = async () => {
    try {
      await axios.post(`http://localhost:8080/api/v1/trip/complete`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tripId: tripId },
      });
      setIsTripFinished(true);
      navigate("/currentplan");
    } catch (e) {
      console.error("❌ Lỗi hoàn thành chuyến đi:", e);
    }
  };

  // --- XỬ LÝ NÚT BẤM ---
  const handleProcessStep = async () => {
    const currentPlace = dataArray[safeIndex];
    if (!currentPlace) return;

    const placeId = currentPlace.location?.id || currentPlace.id;
    const currentRating = placeRatings[safeIndex] || 0;

    // 1. Gửi Rating
    await submitReviewToBackend(placeId, currentRating);

    // 2. Chuyển bước & Lưu tiến độ
    if (!isLastSlide) {
      // --> Next slide
      const nextIndex = safeIndex + 1;
      const nextPlace = dataArray[nextIndex];
      setCurrentIndex(nextIndex);

      // Lưu progress: ID ngày hiện tại + ID địa điểm tiếp theo
      const nextDetailId =
        nextPlace.tripDetailId || nextPlace.trip_detail_id || nextPlace.id;
      await updateProgressBackend(currentSectionId, nextDetailId);
    } else {
      // --> Hết ngày
      if (isLastDay) {
        await completeTripOnBackend();
      } else {
        setIsDayCompleted(true);
        // Lưu progress: Đánh dấu địa điểm cuối cùng của ngày này đã xong
        // (Lần sau vào lại load đúng điểm này hoặc cần logic backend tự nhảy sang ngày mới)
        const lastDetailId =
          currentPlace.tripDetailId ||
          currentPlace.trip_detail_id ||
          currentPlace.id;
        await updateProgressBackend(currentSectionId, lastDetailId);
      }
    }
  };

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

  const stars = [1, 2, 3, 4, 5];

  if (totalPlaces === 0)
    return (
      <div className="currplace-container">
        <p>Không có dữ liệu địa điểm.</p>
      </div>
    );

  const transformValue = `translateX(-${safeIndex * 100}%)`;

  return (
    <div className="currplace-container">
      <div className="currplace-header">
        <div className="currplace-title">Lịch trình hiện tại</div>
      </div>

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
            const loc = place.location || {};
            const title =
              loc.location_name ||
              loc.locationName ||
              place.title ||
              "Địa điểm";

            // Xử lý ảnh
            let imageList = [];
            const rawImgs = loc.locationImgs || place.imgs || [];
            if (Array.isArray(rawImgs)) {
              imageList = rawImgs
                .map((img) => {
                  if (!img) return null;
                  return typeof img === "string" ? img : img.url || img.img_url;
                })
                .filter(
                  (u) => u && typeof u === "string" && u.startsWith("http")
                );
            }

            return (
              <div
                key={index}
                className="currplace-card"
                style={{ width: "100%", flexShrink: 0 }}
              >
                <h3 className="place-title">{title}</h3>

                <div className="place-rating-input">
                  <div className="star-rating-container">
                    {stars.map((star) => (
                      <span
                        key={star}
                        className="star"
                        style={{
                          color:
                            (index === safeIndex && hoverRating >= star) ||
                            placeRatings[index] >= star
                              ? "#FFD700"
                              : "#ccc",
                          cursor: "pointer",
                          marginBottom: "20px",
                          fontSize: "40px",
                        }}
                        onClick={() =>
                          index === safeIndex && handleRatingSelect(index, star)
                        }
                        onMouseEnter={() =>
                          index === safeIndex && setHoverRating(star)
                        }
                        onMouseLeave={() =>
                          index === safeIndex && setHoverRating(0)
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div className="place-gallery-list">
                  {imageList.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="gallery-thumbnail"
                      onClick={() => setZoomedImg(url)}
                      onError={(e) => (e.target.style.display = "none")}
                      alt="place"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

      {zoomedImg && (
        <div className="image-modal-overlay" onClick={() => setZoomedImg(null)}>
          <div className="image-modal-content">
            <img src={zoomedImg} className="zoomed-image" alt="zoom" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentPlace;
