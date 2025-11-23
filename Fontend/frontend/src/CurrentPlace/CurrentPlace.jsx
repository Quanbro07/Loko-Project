import './CurrentPlace.css';
import React, { useState, useCallback, useMemo } from 'react';
import { useLanguage } from '../Language/LanguageContext';

const CurrentPlace = ({ scheduleData, currentIndex, setCurrentIndex }) => {
    const { translate } = useLanguage();
    
    // Đảm bảo là array
    const dataArray = useMemo(() => Array.isArray(scheduleData) ? scheduleData : [], [scheduleData]);
    const totalPlaces = dataArray.length;

    // --- State Rating (Giữ nguyên) ---
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
        // API call here...
    };
    
    const stars = [1, 2, 3, 4, 5];
    
    if (totalPlaces === 0) {
        return (
            <div className='currplace-container'>
                 <p className='no-schedule-data'>Không có lịch trình chi tiết cho ngày này.</p>
            </div>
        );
    }

    // Tính toán độ rộng
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
                        display: 'flex', // Đảm bảo flexbox để slide ngang
                        transition: 'transform 0.5s ease'
                    }}
                >
                    {dataArray.map((place, index) => {
                        // 🌟 MAP DATA TỪ JSON 🌟
                        const title = place.location?.location_name || place.title || "Unknown Location";
                        const time = `${place.startTime?.substring(0,5)} - ${place.endTime?.substring(0,5)}`;
                        const desc = place.description;
                        const placeId = place.location?.id || index;

                        return (
                            <div 
                                key={index} 
                                className='currplace-card'
                                style={{ width: '100%', flexShrink: 0 }} // Mỗi card chiếm 100% view
                            >
                                <h3 className='place-title'>{title}</h3>
                                <div className='place-time'>
                                    ⏰ {time}
                                </div>
                                <div className='place-description'>
                                    📝 {desc || translate('currentplace_no_description_available') || 'Không có mô tả chi tiết.'}
                                </div>
                                
                                {/* --- Phần Rating Giữ Nguyên --- */}
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