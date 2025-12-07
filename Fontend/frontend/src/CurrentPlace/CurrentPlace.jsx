import './CurrentPlace.css';
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '../Language/LanguageContext';

const CurrentPlace = ({ scheduleData, currentIndex, setCurrentIndex }) => {
    const { translate } = useLanguage();
    
    const dataArray = useMemo(() => Array.isArray(scheduleData) ? scheduleData : [], [scheduleData]);
    const totalPlaces = dataArray.length;

    const [placeRatings, setPlaceRatings] = useState(new Array(totalPlaces || 0).fill(0)); 
    const [hoverRating, setHoverRating] = useState(0); 
    
    const isLastSlide = currentIndex === totalPlaces - 1; 

    const handleNext = useCallback(() => {
        if (currentIndex < totalPlaces - 1) {
            setCurrentIndex(currentIndex + 1); 
        }
    }, [totalPlaces, currentIndex, setCurrentIndex]);

    const handleRatingSubmit = (placeIndex, rating, placeId) => {
        setPlaceRatings(prev => {
            const newR = [...prev];
            newR[placeIndex] = rating;
            return newR;
        });
        console.log(`Rated Place ${placeId}: ${rating} stars`);
    };
    
    const stars = [1, 2, 3, 4, 5];
    
    if (totalPlaces === 0) {
        return (
            <div className='currplace-container'>
                 <p className='no-schedule-data'>
                    {translate('currentplace_no_plan') || 'Chưa có dữ liệu cho ngày này.'}
                 </p>
            </div>
        );
    }

    const transformValue = `translateX(-${currentIndex * 100}%)`; 

    return(
        <div className='currplace-container'>
            <div className='currplace-header'>
                <div className='currplace-title'>
                    {translate('currentplace_your_current_plan') || 'Lịch trình hiện tại'}
                </div>
            </div>
            
            <div className='currplace-slide-window'>
                <div 
                    className='currplace-slide-wrapper' 
                    style={{ 
                        transform: transformValue,
                        width: `${totalPlaces * 100}%`,
                        display: 'flex', 
                        transition: 'transform 0.5s ease'
                    }}
                >
                    {dataArray.map((place, index) => {
                        // --- 🛠 SỬA LOGIC MAP DỮ LIỆU Ở ĐÂY ---
                        
                        // 1. Lấy tên địa điểm (Ưu tiên location object, fallback sang title)
                        let title = "Unknown Location";
                        if (place.location) {
                            title = place.location.location_name || 
                                    place.location.locationName || 
                                    place.location.name || 
                                    place.title; // Fallback
                        } else {
                            title = place.locationName || place.title || place.activity;
                        }

                        // 2. Xử lý thời gian an toàn (Tránh lỗi .substring of undefined)
                        const start = place.startTime || place.start_time || "00:00";
                        const end = place.endTime || place.end_time || "00:00";
                        // Chỉ cắt chuỗi nếu nó là string
                        const timeStr = `${typeof start === 'string' ? start.substring(0,5) : start} - ${typeof end === 'string' ? end.substring(0,5) : end}`;

                        // 3. Lấy mô tả & ID
                        const desc = place.description || place.activity || "";
                        const placeId = place.location?.id || place.id || index;
                        // ----------------------------------------

                        return (
                            <div 
                                key={index} 
                                className='currplace-card'
                                style={{ width: '100%', flexShrink: 0 }}
                            >
                                <h3 className='place-title'>{title}</h3>
                                <div className='place-time'>
                                    ⏰ {timeStr}
                                </div>
                                <div className='place-description'>
                                    📝 {desc || translate('currentplace_no_description_available') || 'Không có mô tả chi tiết.'}
                                </div>
                                
                                <div className='place-rating-input'>
                                    <p className='rating-prompt'>{translate('currentplace_rate_this_place') || 'Đánh giá địa điểm này:'}</p>
                                    <div className='star-rating-container'>
                                        {stars.map((starValue) => (
                                            <span
                                                key={starValue}
                                                className='star'
                                                style={{
                                                    color: (index === currentIndex && hoverRating >= starValue) || placeRatings[index] >= starValue ? '#FFD700' : '#ccc',
                                                    cursor: 'pointer',
                                                    fontSize: '24px'
                                                }}
                                                onClick={() => {
                                                    if (index === currentIndex) handleRatingSubmit(index, starValue, placeId);
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
                            </div>
                        );
                    })}
                </div>
            </div>
            <button 
                className='currplace-next-button' 
                onClick={handleNext}
                disabled={isLastSlide}
            >
                {translate('currplace_next_button') || 'Tiếp theo'} 
            </button>
            <div className='currplace-counter'>
                {currentIndex + 1} / {totalPlaces}
            </div>
        </div>
    )
}

export default CurrentPlace;