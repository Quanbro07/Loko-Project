import React, { useMemo, useState, useEffect } from "react";
import "./WeatherForecast.css";
// [QUAN TRỌNG] Import file JSON dữ liệu
import weatherDataRaw from "./responseWeather.json";

const WeatherForecast = ({ currentDayIndex = 0 }) => {
    // --- LOGIC SLIDING WINDOW ---
    const [startIndex, setStartIndex] = useState(0);
    const ITEMS_PER_ROW = 4; // Hiển thị 4 thẻ trên 1 hàng

    // Lấy dữ liệu của ngày hiện tại (dựa vào index từ CurrentPlan)
    const currentDayWeather = useMemo(() => {
        if (weatherDataRaw && Array.isArray(weatherDataRaw.scopes) && weatherDataRaw.scopes[currentDayIndex]) {
            return weatherDataRaw.scopes[currentDayIndex];
        }
        // Fallback nếu không tìm thấy index thì lấy ngày đầu tiên
        return weatherDataRaw?.scopes?.[0] || null;
    }, [currentDayIndex]);

    // Reset về vị trí đầu khi đổi ngày
    useEffect(() => {
        setStartIndex(0);
    }, [currentDayIndex]);

    if (!currentDayWeather) return <div style={{color:'white'}}>Đang tải dữ liệu...</div>;

    const allHours = currentDayWeather.hourly_weather || [];
    
    // CẮT DATA: Chỉ lấy 4 phần tử bắt đầu từ startIndex
    const visibleHours = allHours.slice(startIndex, startIndex + ITEMS_PER_ROW);

    // Xử lý nút bấm
    const handleNext = () => {
        if (startIndex + ITEMS_PER_ROW < allHours.length) {
            setStartIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (startIndex > 0) {
            setStartIndex(prev => prev - 1);
        }
    };

    return (
        <div className="weather-figma-container">
            {/* Header */}
            <div className="weather-header">
                <h2 className="weather-title">
                    {currentDayWeather.date} 
                    <span className="scope-badge">{currentDayWeather.scope}</span>
                </h2>
            </div>

            {/* Container chính chứa Nút và Các thẻ */}
            <div className="weather-slider-wrapper">
                
                {/* Nút Trái */}
                <button 
                    className="nav-btn prev" 
                    onClick={handlePrev} 
                    disabled={startIndex === 0}
                >
                    &#10094;
                </button>

                {/* --- KHU VỰC HIỂN THỊ CÁC THẺ (FLEX ROW) --- */}
                <div className="weather-card-container">
                    {visibleHours.length > 0 ? (
                        visibleHours.map((hour, index) => (
                            <div key={index} className="glass-card">
                                {/* Icon */}
                                {hour.condition?.icon && (
                                    <img 
                                        src={hour.condition.icon} 
                                        alt="icon" 
                                        className="card-icon"
                                    />
                                )}
                                
                                {/* Nhiệt độ */}
                                <div className="card-temp">
                                    {Math.round(hour.temp_c)}°C
                                </div>
                                
                                {/* Giờ & Trạng thái */}
                                <div className="card-details">
                                    <p className="card-time">{hour.time ? hour.time.split(' ')[1] : '--:--'}</p>
                                    <p className="card-desc">{hour.condition?.text}</p>
                                </div>

                                {/* Cảnh báo mưa */}
                                {hour.will_it_rain === 1 && (
                                    <div className="rain-alert">💧 Có mưa</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>Không có dữ liệu</p>
                    )}
                </div>

                {/* Nút Phải */}
                <button 
                    className="nav-btn next" 
                    onClick={handleNext}
                    disabled={startIndex + ITEMS_PER_ROW >= allHours.length}
                >
                    &#10095;
                </button>
            </div>
            
            {/* Indicator (Optional) */}
            <div className="slider-indicator">
                Hiển thị {startIndex + 1} - {startIndex + visibleHours.length} trong số {allHours.length} giờ
            </div>
        </div>
    );
};

export default WeatherForecast;