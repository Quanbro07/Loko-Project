import React, { useMemo, useState, useEffect } from "react";
import "./WeatherForecast.css";

const WeatherForecast = ({ currentDayIndex = 0, data = null }) => {
  const [startIndex, setStartIndex] = useState(0);
  const ITEMS_PER_ROW = 4;

  // Logic lấy dữ liệu thời tiết cho ngày hiện tại
  const currentDayWeather = useMemo(() => {
    if (data && Array.isArray(data.scopes)) {
      // Tìm scope tương ứng với currentDayIndex
      // Nếu index vượt quá độ dài mảng, fallback về ngày đầu tiên (hoặc null)
      return data.scopes[currentDayIndex] || data.scopes[0] || null;
    }
    return null;
  }, [currentDayIndex, data]);

  // Reset slider về vị trí đầu khi chuyển ngày
  useEffect(() => {
    setStartIndex(0);
  }, [currentDayIndex]);

  // Logic tính vị trí background
  const getBackgroundPosition = (timeString) => {
    if (!timeString) return "0% 50%";
    let hour = 0;
    try {
      const timePart = timeString.includes(" ")
        ? timeString.split(" ")[1]
        : timeString;
      hour = parseInt(timePart.split(":")[0], 10);
    } catch (e) {
      hour = 0;
    }
    const positionPercent = (hour / 24) * 100;
    return `${positionPercent}% 50%`;
  };

  // --- TRƯỜNG HỢP KHÔNG CÓ DỮ LIỆU ---
  // Nếu data null (đang loading hoặc lỗi), hiển thị thông báo
  if (!currentDayWeather) {
    return (
      <div className="weather-figma-container loading-state">
        <p style={{ color: "white", textAlign: "center", padding: "20px" }}>
          {data
            ? "Không có dữ liệu thời tiết cho ngày này."
            : "Đang tải thông tin thời tiết..."}
        </p>
      </div>
    );
  }

  console.log(currentDayWeather);

  const allHours = currentDayWeather.hourly_weather || [];
  const visibleHours = allHours.slice(startIndex, startIndex + ITEMS_PER_ROW);

  const bgPosition =
    visibleHours.length > 0
      ? getBackgroundPosition(visibleHours[0].time)
      : "0% 50%";

  const handleNext = () => {
    if (startIndex + ITEMS_PER_ROW < allHours.length) {
      setStartIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="weather-figma-container"
      style={{ backgroundPosition: bgPosition }}
    >
      <div className="weather-header">
        <h2 className="weather-title">
          {currentDayWeather.date}
          <span className="scope-badge">{currentDayWeather.scope}</span>
        </h2>
      </div>

      <div className="weather-slider-wrapper">
        <button
          className="nav-btn prev"
          onClick={handlePrev}
          disabled={startIndex === 0}
        >
          &#10094;
        </button>

        <div className="weather-card-container">
          {visibleHours.length > 0 ? (
            visibleHours.map((hour, index) => (
              <div key={index} className="glass-card">
                {hour.condition?.icon && (
                  <img
                    src={hour.condition.icon}
                    alt="icon"
                    className="card-icon"
                  />
                )}

                <div className="card-temp">{Math.round(hour.temp_c)}°C</div>

                <div className="card-details">
                  <p className="card-time">
                    {hour.time ? hour.time.split(" ")[1] : "--:--"}
                  </p>
                  <p className="card-desc">{hour.condition?.text}</p>
                </div>

                {/* Cảnh báo mưa */}
                {Number(hour.will_it_rain) === 1 && (
                  <div className="rain-alert">💧 Có mưa</div>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: "white", width: "100%", textAlign: "center" }}>
              Không có dữ liệu giờ
            </p>
          )}
        </div>

        <button
          className="nav-btn next"
          onClick={handleNext}
          disabled={startIndex + ITEMS_PER_ROW >= allHours.length}
        >
          &#10095;
        </button>
      </div>

      <div className="slider-indicator">
        {allHours.length > 0
          ? `Hiển thị ${startIndex + 1} - ${Math.min(
              startIndex + visibleHours.length,
              allHours.length
            )} trong số ${allHours.length} giờ`
          : ""}
      </div>
    </div>
  );
};

export default WeatherForecast;
