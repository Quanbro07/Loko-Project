import './CurrentPlan.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { useLanguage } from '../Language/LanguageContext';
import React, { useState, useMemo } from 'react'; 
import MyLeafletMap from '../Map/MyLeafletMap';
import OutputReal from '../OutputReal/OutputReal';
import CurrentPlace from '../CurrentPlace/CurrentPlace';

// Import Data
import allRouteGeometry from '../Map/route_geometry.json'; // Dữ liệu đường đi
import allScheduleData from '../Output/schedule.json'; // Dữ liệu địa điểm

const CurrentPlan = () => {
    const { translate } = useLanguage();
    
    // 🌟 STATE QUẢN LÝ NGÀY CHUNG CHO TOÀN BỘ TRANG 🌟
    // State này điều khiển cả OutputReal, CurrentPlace và Map cùng lúc
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    // State cho Slider của CurrentPlace (Slide qua lại các địa điểm trong 1 ngày)
    const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0); 

    // 1. Lấy danh sách các ngày (Trip Sections)
    const tripSections = useMemo(() => {
        return allScheduleData.tripSections || [];
    }, []);

    // 2. Lấy dữ liệu lịch trình của ngày ĐANG ĐƯỢC CHỌN
    const scheduleForCurrentDay = useMemo(() => {
        if (tripSections[currentDayIndex]) {
            return tripSections[currentDayIndex].tripDetails;
        }
        return []; 
    }, [tripSections, currentDayIndex]);
    
    // 3. Tạo Markers cho Map từ dữ liệu ngày hiện tại
    const itineraryPoints = useMemo(() => {
        return scheduleForCurrentDay.map(place => {
            const lat = place.location?.latitude || place.latitude;
            const lng = place.location?.longitude || place.longitude;
            const name = place.location?.location_name || place.title;

            return {
                name: name,
                lat: lat,
                lng: lng,
            };
        }).filter(p => p.lat && p.lng); // Lọc bỏ điểm lỗi
    }, [scheduleForCurrentDay]);

    // Reset slider địa điểm về 0 mỗi khi chuyển ngày
    const handleDayChange = (newIndex) => {
        console.log("Chuyển sang ngày index:", newIndex);
        setCurrentDayIndex(newIndex);
        setCurrentPlaceIndex(0);
    };
    
    return (
        <div>
            <Navbar />
            <div className='body-container'>
                
                {/* 🌟 OutputReal: Hiển thị danh sách & Điều khiển chuyển ngày 🌟 */}
                <OutputReal 
                    currentDayIndex={currentDayIndex}
                    setCurrentDayIndex={handleDayChange} // Truyền hàm chuyển ngày xuống
                    tripSections={tripSections}
                />
                
                {/* Hiển thị luôn CurrentPlace và Map */}
                {scheduleForCurrentDay.length > 0 ? (
                    <>
                        <div className="current-plan-content">
                            {/* CurrentPlace: Slider chi tiết */}
                            <CurrentPlace 
                                scheduleData={scheduleForCurrentDay} 
                                currentIndex={currentPlaceIndex} 
                                setCurrentIndex={setCurrentPlaceIndex} 
                            /> 
                            
                            {/* Map: Bản đồ */}
                            {/* ⚠️ QUAN TRỌNG: Phải truyền currentDayIndex vào đây map mới đổi đường được */}
                            <MyLeafletMap 
                                itineraryPoints={itineraryPoints}
                                currentIndex={currentPlaceIndex} // Index của địa điểm (để highlight marker đỏ)
                                currentDayIndex={currentDayIndex} // Index của NGÀY (để vẽ đường đi Day 1, Day 2...)
                            />
                        </div>
                    </>
                ) : (
                    <div className='current-plan-empty-state'>
                        <h3>{translate('currentplace_no_plan') || "Chưa có dữ liệu cho ngày này."}</h3>
                    </div>
                )}
                
            </div>
            <Footer />
        </div>
    );
}

export default CurrentPlan;