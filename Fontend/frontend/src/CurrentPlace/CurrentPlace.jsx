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
  rawDayIndex = 0,
  isLastDay = false,
}) => {
  const { translate } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [isTripFinished, setIsTripFinished] = useState(false);
  const [zoomedImg, setZoomedImg] = useState(null);

  // Đảm bảo dataArray luôn là mảng
  const dataArray = useMemo(
    () => (Array.isArray(scheduleData) ? scheduleData : []),
    [scheduleData]
  );
  const totalPlaces = dataArray.length;

  const [placeRatings, setPlaceRatings] = useState(
    new Array(totalPlaces).fill(0)
  );
  const [hoverRating, setHoverRating] = useState(0);

  // Reset state khi data thay đổi
  useEffect(() => {
    setIsDayCompleted(false);
    setPlaceRatings(new Array(totalPlaces).fill(0));
  }, [scheduleData, totalPlaces]);

  // Kiểm tra bounds index để tránh lỗi render
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

  // --- API Functions ---
  const submitReviewToBackend = async (locationId, ratingValue) => {
    if (!tripId || !locationId || ratingValue === 0) return;
    try {
      const payload = {
        locationId: Number(locationId),
        tripId: Number(tripId),
        rating: Number(ratingValue),
        comment: "",
      };
      await axios.post("http://localhost:8080/api/reviews/rate", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.error("Rating Error", e);
    }
  };

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
    } catch (e) {
      console.error("Progress Error", e);
    }
  };

  const completeTripOnBackend = async () => {
    try {
      await axios.post(`http://localhost:8080/api/v1/trip/complete`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tripId: tripId },
      });
      setIsTripFinished(true);
      navigate("/Plan");
    } catch (e) {
      console.error("Complete Error", e);
    }
  };

  const handleProcessStep = async () => {
    const currentPlace = dataArray[safeIndex];
    if (!currentPlace) return; // Guard clause

    const placeId = currentPlace.location?.id || currentPlace.id;
    const currentRating = placeRatings[safeIndex] || 0;

    await submitReviewToBackend(placeId, currentRating);

    if (!isLastSlide) {
      const nextIndex = safeIndex + 1;
      setCurrentIndex(nextIndex);
      await updateProgressBackend(rawDayIndex, nextIndex);
    } else {
      if (isLastDay) {
        await completeTripOnBackend();
      } else {
        setIsDayCompleted(true);
        // Lưu sang ngày mới, place 0
        await updateProgressBackend(rawDayIndex + 1, 0);
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
        <p>No Data Available</p>
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

            // --- FIX IMAGE MAPPING ROBUST ---
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

                {/* Rating */}
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
                          fontSize: "24px",
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
            <button onClick={() => setZoomedImg(null)}>x</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentPlace;
