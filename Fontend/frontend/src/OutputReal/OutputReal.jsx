import React, { useState, useEffect, useMemo } from 'react';
import './OutputReal.css';
import { useLanguage } from '../Language/LanguageContext';
import { useAuth } from '../Auth/AuthContext'; // <--- FIX LỖI: Import useAuth

// Component giờ đây nhận currentDayIndex từ cha (CurrentPlan)
const OutputReal = ({ currentDayIndex, setCurrentDayIndex, tripSections, tripId }) => {
    const { translate } = useLanguage();
    const { token } = useAuth(); // Lấy token để gọi API
    const [isExporting, setIsExporting] = useState(false);
    // Tổng số ngày
    const totalDays = tripSections.length;

    // State cho dữ liệu hiển thị bảng (được map từ props)
    const [itineraryData, setItineraryData] = useState([]);

    // Lấy dữ liệu chi tiết từ section của ngày hiện tại (được truyền từ props)
    const currentSection = tripSections[currentDayIndex];
    const scheduleForCurrentDay = currentSection ? currentSection.tripDetails : [];
    
    // Lấy tiêu đề ngày
    const currentDayTitle = currentSection ? currentSection.title : `Day ${currentDayIndex + 1}`;
    const handleExportPdf = async () => {
        if (!tripId) {
            alert("Không tìm thấy ID chuyến đi!");
            return;
        }

        setIsExporting(true);
        try {
            // Gọi API Backend dựa trên TripPdfController.java
            const response = await fetch(`http://localhost:8080/api/v1/trip-pdf/download/${tripId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Lỗi khi tải PDF");

            // Xử lý file Blob để tải về trình duyệt
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Trip_Plan_${tripId}.pdf`; // Tên file khi tải về
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error("Export error:", error);
            alert("Không thể xuất file PDF. Vui lòng thử lại sau.");
        } finally {
            setIsExporting(false);
        }
    };
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

        const processedData = scheduleForCurrentDay.map(item => {
            // --- LOGIC LẤY TÊN ĐỊA ĐIỂM (SỬA Ở ĐÂY) ---
            let placeName = translate('output_unknown_location');

            // Ưu tiên 1: Lấy trong object location (nếu có)
            if (item.location) {
                placeName = item.location.locationName || 
                            item.location.location_name || 
                            item.location.name || 
                            item.location.title;
            }
            
            // Ưu tiên 2: Lấy trực tiếp từ item (nếu location null)
            if (!placeName || placeName === translate('output_unknown_location')) {
                placeName = item.locationName || 
                            item.location_name || 
                            item.title || 
                            item.activity || // Fallback cuối cùng: lấy tên hoạt động
                            translate('output_unknown_location');
            }
            // ------------------------------------------

            return {
                diadiem: placeName,
                // Cắt chuỗi thời gian HH:MM:SS -> HH:MM
                thoigian: `${item.startTime ? item.startTime.substring(0, 5) : ''} - ${item.endTime ? item.endTime.substring(0, 5) : ''}`,
                mota: item.activity || translate('output_no_description') 
            };
        });
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
            <button 
                className="btn-export-pdf" 
                onClick={handleExportPdf}
                disabled={isExporting}
                title="Xuất lịch trình ra file PDF"
            >
                {isExporting ? (
                    <span>⏳ Đang xuất...</span>
                ) : (
                    <>
                        {/* Icon PDF nhỏ (SVG) */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '5px'}}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Export PDF
                    </>
                )}
            </button>
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