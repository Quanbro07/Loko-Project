import React, { useState, useEffect } from 'react';
import './Output.css';
import { useLanguage } from '../Language/LanguageContext';

// Import dữ liệu lịch trình trực tiếp từ JSON
import scheduleData from './schedule.json';

// Hàm hỗ trợ format giờ (bỏ giây): 09:30:00 -> 09:30
const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
};

// Chuyển đổi dữ liệu lịch trình JSON thành một cấu trúc dễ quản lý hơn
const processScheduleData = (data, translate) => {
    // Kiểm tra xem dữ liệu có đúng cấu trúc không
    if (!data || !data.tripSections) return [];

    return data.tripSections.map(section => {
        const activities = section.tripDetails.map(item => ({
            // Lấy tên địa điểm từ object location
            diadiem: item.location?.location_name || translate('output_unknown_location'),
            
            // Format lại thời gian
            thoigian: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
            
            // Mô tả hoạt động
            mota: item.description || translate('output_no_description'),
            
            // Giữ lại ID để quản lý nếu cần
            originalId: item.sequenceOrder 
        }));

        return {
            dayTitle: section.title, // Ví dụ: "Ngày 1: Khám phá"
            activities: activities
        };
    });
};

const Output = ({ onTryAgainClick, onAcceptClick, tryCount }) => {
    const { translate } = useLanguage();
    
    // Lưu trữ dữ liệu lịch trình đã được xử lý (mảng các ngày)
    const [itineraryByDay, setItineraryByDay] = useState([]);
    
    // Theo dõi ngày hiện tại đang được hiển thị (dùng index của mảng tripSections)
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    
    // Theo dõi mục đang bị xóa
    const [deletingIndex, setDeletingIndex] = useState(null);
    
    // Sử dụng useEffect để xử lý dữ liệu khi component được mount
    useEffect(() => {
        const processedData = processScheduleData(scheduleData, translate);
        
        // Giả lập độ trễ tải dữ liệu cho mượt mà
        setTimeout(() => {
            setItineraryByDay(processedData);
        }, 300);

    }, [translate]); 

    // Lấy dữ liệu của ngày hiện tại
    const currentDaySchedule = itineraryByDay.length > 0 ? itineraryByDay[currentDayIndex] : null;
    const currentActivities = currentDaySchedule ? currentDaySchedule.activities : [];

    // --- Xử lý chức năng Xóa (Delete) ---
    const handleDelete = (indexToDelete) => {
        const transitionDuration = 300; 

        setDeletingIndex(indexToDelete);

        setTimeout(() => {
            setItineraryByDay(prevData => {
                // Tạo bản sao sâu (deep copy) để tránh tham chiếu
                const newItinerary = [...prevData];
                
                // Lấy dữ liệu của ngày hiện tại trong bản sao
                const currentDayData = { ...newItinerary[currentDayIndex] };
                
                // Lọc bỏ hoạt động cần xóa
                currentDayData.activities = currentDayData.activities.filter((_, index) => index !== indexToDelete);
                
                // Cập nhật lại ngày đó vào mảng chính
                newItinerary[currentDayIndex] = currentDayData;
                
                return newItinerary;
            });
            setDeletingIndex(null);
        }, transitionDuration);
    };

    // --- Xử lý Chuyển đổi Ngày (Sliding Window) ---

    const handleNextDay = () => {
        if (currentDayIndex < itineraryByDay.length - 1) {
            setDeletingIndex(null); // Reset trạng thái xóa
            setCurrentDayIndex(currentDayIndex + 1);
        }
    };

    const handlePrevDay = () => {
        if (currentDayIndex > 0) {
            setDeletingIndex(null); // Reset trạng thái xóa
            setCurrentDayIndex(currentDayIndex - 1);
        }
    };

    // Kiểm tra điều kiện nút bấm
    const canGoPrev = currentDayIndex > 0;
    const canGoNext = itineraryByDay.length > 0 && currentDayIndex < itineraryByDay.length - 1;

    return (
        <div className="output-container">
            <h3>{translate('output_suggested_itinerary')}</h3>

            {/* --- Bộ điều khiển Navigation giữa các ngày --- */}
            <div className="day-navigation">
                <button 
                    onClick={handlePrevDay} 
                    disabled={!canGoPrev} 
                    className="nav-button"
                >
                    &larr; {translate('output_previous_day')}
                </button>
                
                {/* Tiêu đề ngày hiện tại (Lấy từ JSON: "Ngày 1: Khám phá") */}
                {currentDaySchedule && (
                    <h4 className="current-day-title">
                        {currentDaySchedule.dayTitle}
                    </h4>
                )}
                
                <button 
                    onClick={handleNextDay} 
                    disabled={!canGoNext} 
                    className="nav-button"
                >
                    {translate('output_next_day')} &rarr;
                </button>
            </div>
            
            <hr />

            {/* --- Bảng Lịch trình --- */}
            <table className="itinerary-table">
                <thead>
                    <tr>
                        <th style={{width: '30%'}}>{translate('output_location')}</th>
                        <th style={{width: '15%'}}>{translate('output_time')}</th>
                        <th style={{width: '45%'}}>{translate('output_description')}</th>
                        <th style={{width: '10%'}}></th> 
                    </tr>
                </thead>
                <tbody>
                    {currentActivities.length === 0 && deletingIndex === null ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                {translate('output_no_itinerary_data')}
                            </td>
                        </tr>
                    ) : (
                        currentActivities.map((item, index) => {
                            const isDeleting = index === deletingIndex;

                            return (
                                <tr 
                                    key={`${currentDayIndex}-${index}`} 
                                    className={isDeleting ? 'deleting' : ''} 
                                >
                                    <td className='location-cell'>
                                        <strong>{item.diadiem}</strong>
                                    </td>
                                    <td className='time-cell'>{item.thoigian}</td>
                                    <td className='desc-cell'>{item.mota}</td>
                                    <td className='delete-button-cell'>
                                        <button 
                                            className='delete' 
                                            title="Remove item"
                                            onClick={() => handleDelete(index)}
                                            disabled={isDeleting} 
                                        >
                                            {/* Icon X hoặc text */}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            
            <hr />

            {/* --- Footer Buttons --- */}
            <div className='retry-accept-list'>
                {tryCount > 0 && (
                    <p className='remaining-tries'>
                        {translate('output_remaining_tries')}: {tryCount}
                    </p>
                )}
                
                <button 
                    className='output-retry-button' 
                    onClick={onTryAgainClick}
                    disabled={tryCount <= 0} 
                >
                    {translate('output_retry_button')}
                </button>
                <button className='output-accept-button' onClick={onAcceptClick}>
                    {translate('output_accept_button')}
                </button>
            </div>
        </div>
    );
};

export default Output;