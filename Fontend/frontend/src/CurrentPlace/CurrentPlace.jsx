import './CurrentPlace.css';
import schedule from '../Output/schedule.json'; 
import React, { useState, useCallback } from 'react';
import { useLanguage } from '../Language/LanguageContext';

// 🌟 NHẬN PROPS KIỂM SOÁT STATE TỪ COMPONENT CHA 🌟
const CurrentPlace = ({ currentIndex, setCurrentIndex }) => { 
    const { translate } = useLanguage();
    // ❌ Đã loại bỏ: const [currentIndex, setCurrentIndex] = useState(0); (State được quản lý ở component cha)
    
    const scheduleData = schedule; 
    const totalPlaces = scheduleData.length;

    // Các state nội bộ vẫn giữ nguyên
    const [placeRatings, setPlaceRatings] = useState(new Array(totalPlaces).fill(0)); 
    const [hoverRating, setHoverRating] = useState(0); 
    
    const isLastSlide = currentIndex === totalPlaces - 1; 

    // ----------------------------------------------------
    // SỬA LOGIC NEXT (Một chiều, Dừng ở slide cuối)
    // ----------------------------------------------------
    const handleNext = useCallback(() => {
        // Gọi hàm cập nhật state từ component cha
        if (currentIndex < totalPlaces - 1) {
            setCurrentIndex(currentIndex + 1); 
        }
    }, [totalPlaces, currentIndex, setCurrentIndex]);

    const handleRatingSubmit = (placeIndex, rating, placeId) => {
        setPlaceRatings(prevRatings => {
            const newRatings = [...prevRatings];
            newRatings[placeIndex] = rating;
            return newRatings;
        });
        
        console.log(`[BACKEND] Đã gửi rating ${rating} sao cho Place ID: ${placeId}`);
        // TODO: Thực hiện API call để gửi dữ liệu rating
    };
    
    const stars = [1, 2, 3, 4, 5];
    const cardWidthPercentage = 100 / totalPlaces;
    const transformValue = `translateX(-${currentIndex * cardWidthPercentage}%)`; 

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
                        width: `${totalPlaces * 100}%` 
                    }}
                >
                    {scheduleData.map((place, index) => (
                        <div 
                            key={index} 
                            className='currplace-card'
                            style={{ width: `${100 / totalPlaces}%` }} 
                        >
                            <h3 className='place-title'>{place.title}</h3>
                            <div className='place-time'>
                                ⏰ {place.start} - {place.end}
                            </div>
                            <div className='place-description'>
                                📝 {place.description || translate('currentplace_no_description_available') || 'Không có mô tả chi tiết.'}
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
                                            }}
                                            onClick={() => {
                                                if (index === currentIndex) {
                                                    handleRatingSubmit(index, starValue, place.place_id);
                                                }
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
                                <p className='rating-feedback'>
                                    {(placeRatings[index] > 0) 
                                        }
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <button 
                    className='currplace-next-button' 
                    onClick={handleNext}
                    disabled={isLastSlide} // Vô hiệu hóa khi là slide cuối
                >
                    {translate('currplace_next_button')} 
                </button>
            <div className='currplace-counter'>
                {currentIndex + 1} / {totalPlaces}
            </div>
        </div>
    )
}

export default CurrentPlace;