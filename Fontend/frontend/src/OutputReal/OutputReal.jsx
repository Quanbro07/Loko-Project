import React, { useState, useEffect, useMemo } from 'react';
import './OutputReal.css';
import { useLanguage } from '../Language/LanguageContext';

// Component giờ đây nhận currentDayIndex từ cha (CurrentPlan)
const OutputReal = ({ currentDayIndex, setCurrentDayIndex, tripSections }) => {
    const { translate } = useLanguage();

    // Tổng số ngày
    const totalDays = tripSections.length;

    // State cho dữ liệu hiển thị bảng (được map từ props)
    const [itineraryData, setItineraryData] = useState([]);

    // Lấy dữ liệu chi tiết từ section của ngày hiện tại (được truyền từ props)
    const currentSection = tripSections[currentDayIndex];
    const scheduleForCurrentDay = currentSection ? currentSection.tripDetails : [];
    
    // Lấy tiêu đề ngày
    const currentDayTitle = currentSection ? currentSection.title : `Day ${currentDayIndex + 1}`;

    // --- Logic Navigation (Gọi hàm của cha) ---
    const handlePrevDay = () => {
        if (currentDayIndex > 0) {
            setCurrentDayIndex(currentDayIndex - 1);
        }
    };

    const handleNextDay = () => {
        if (currentDayIndex < totalDays - 1) {
            setCurrentDayIndex(currentDayIndex + 1);
        }
    };

    // --- Effect: Xử lý dữ liệu hiển thị khi ngày thay đổi ---
    useEffect(() => {
        if (!scheduleForCurrentDay) return;

        const processedData = scheduleForCurrentDay.map(item => ({
            diadiem: item.location?.location_name || item.title || translate('output_unknown_location'),
            // Cắt chuỗi thời gian HH:MM:SS thành HH:MM
            thoigian: `${item.startTime ? item.startTime.substring(0, 5) : ''} - ${item.endTime ? item.endTime.substring(0, 5) : ''}`,
            mota: item.description || translate('output_no_description') 
        }));

        setItineraryData(processedData);

    }, [scheduleForCurrentDay, translate]); 

    if (totalDays === 0) {
        return (
            <div className="output-container">
                <h3>{translate('output_suggested_itinerary')}</h3>
                <p style={{ textAlign: 'center', padding: '20px' }}>
                    {translate('output_no_itinerary_data')}
                </p>
            </div>
        );
    }

    return (
        <div className="output-container">
            <h3>{translate('output_suggested_itinerary') || 'Lịch trình được đề xuất'}</h3>
            
            {/* Bộ điều khiển chuyển ngày */}
            <div className='day-navigation-container'>
                <button 
                    className='nav-button nav-prev' 
                    onClick={handlePrevDay} 
                    disabled={currentDayIndex === 0}
                >
                    &lt;
                </button>

                <h4 className='current-day-title'>
                    {currentDayTitle}
                </h4>

                <button 
                    className='nav-button nav-next' 
                    onClick={handleNextDay} 
                    disabled={currentDayIndex === totalDays - 1}
                >
                    &gt;
                </button>
            </div>

            {/* Bảng danh sách địa điểm */}
            <table className="itinerary-table">
                <thead>
                    <tr>
                        <th>{translate('output_location') || 'Địa điểm'}</th>
                        <th>{translate('output_time') || 'Thời gian'}</th>
                        <th>{translate('output_description') || 'Mô tả'}</th>
                    </tr>
                </thead>
                <tbody>
                    {itineraryData.length === 0 ? (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>
                                {translate('output_no_itinerary_data')}
                            </td>
                        </tr>
                    ) : (
                        itineraryData.map((item, index) => (
                            <tr key={index}>
                                <td className=''>{item.diadiem}</td>
                                <td>{item.thoigian}</td>
                                <td>{item.mota}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            
            {/* ĐÃ XÓA NÚT "CHẤP NHẬN KẾ HOẠCH" */}
        </div>
    );
};

export default OutputReal;