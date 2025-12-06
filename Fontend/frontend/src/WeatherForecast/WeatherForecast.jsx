import React, { useMemo, useState, useEffect } from "react";
import "./WeatherForecast.css";
import defaultWeatherData from "./responseWeather.json";

const WeatherForecast = ({ currentDayIndex = 0, data = null }) => {
  const [startIndex, setStartIndex] = useState(0);
  const ITEMS_PER_ROW = 4;
  const sourceData = data || defaultWeatherData;
  const currentDayWeather = useMemo(() => {
    if (
      sourceData &&
      Array.isArray(sourceData.scopes) &&
      sourceData.scopes[currentDayIndex]
    ) {
      return sourceData.scopes[currentDayIndex];
    }
    return sourceData?.scopes?.[0] || null;
  }, [currentDayIndex, sourceData]);

  useEffect(() => {
    setStartIndex(0);
  }, [currentDayIndex]);

  // Logic tính vị trí background (Giữ nguyên logic "trượt" mượt mà)
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

  if (!currentDayWeather)
    return <div style={{ color: "white" }}>Đang tải dữ liệu...</div>;

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

                {/* --- [MỚI] CHÈN CẢNH BÁO MƯA TẠI ĐÂY --- */}
                {Number(hour.will_it_rain) === 1 && (
                  <div className="rain-alert">💧 Có mưa</div>
                )}
              </div>
            ))
          ) : (
            <p>Không có dữ liệu</p>
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
        Hiển thị {startIndex + 1} - {startIndex + visibleHours.length} trong số{" "}
        {allHours.length} giờ
      </div>
    </div>
  );
};

export default WeatherForecast;
