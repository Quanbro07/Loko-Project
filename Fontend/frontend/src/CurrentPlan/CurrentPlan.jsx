import './CurrentPlan.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { useLanguage } from '../Language/LanguageContext';
import React, { useState, useMemo } from 'react'; 
import MyLeafletMap from '../Map/MyLeafletMap';
import OutputReal from '../OutputReal/OutputReal';
import CurrentPlace from '../CurrentPlace/CurrentPlace';
import WeatherForecast from '../WeatherForecast/WeatherForecast';
// Import Data
import allScheduleData from '../Output/schedule.json'; 

const CurrentPlan = () => {
    const { translate } = useLanguage();
    
    // 🌟 STATE QUẢN LÝ NGÀY CHUNG CHO TOÀN BỘ TRANG 🌟
    const [currentDayIndex, setCurrentDayIndex] = useState(0);

    // State cho Slider của CurrentPlace
    const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0); 
    const tripId = allScheduleData.tripId;
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
    
    // 3. Tạo Markers cho Map
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
        }).filter(p => p.lat && p.lng); 
    }, [scheduleForCurrentDay]);

    // Reset slider khi đổi ngày
    const handleDayChange = (newIndex) => {
        console.log("Chuyển sang ngày index:", newIndex);
        setCurrentDayIndex(newIndex);
        setCurrentPlaceIndex(0); // Reset slide địa điểm về đầu tiên
    };
    
    return (
        <div>
            <Navbar/>
            <div className='body-container'>
                
               <div className="plan-dashboard-wrapper">
                    {/* OutputReal: Thanh chọn ngày */}
                    <div className="plan-list-section">
                        <OutputReal 
                            currentDayIndex={currentDayIndex}
                            setCurrentDayIndex={handleDayChange} 
                            tripSections={tripSections}
                            tripId={tripId}
                        />
                    </div>

                    {/* WeatherForecast nằm NGAY BÊN DƯỚI */}
                    {/* 🌟 CẬP NHẬT: Truyền currentDayIndex để đồng bộ */}
                    <div className="weather-section-below">
                        <WeatherForecast currentDayIndex={currentDayIndex} />
                    </div>
                </div>

                
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
                            <MyLeafletMap 
                                itineraryPoints={itineraryPoints}
                                currentIndex={currentPlaceIndex} 
                                currentDayIndex={currentDayIndex} 
                            />
                        </div>
                    </>
                ) : (
                    <div className='current-plan-empty-state'>
                        <h3>{translate('currentplace_no_plan') || "Chưa có dữ liệu cho ngày này."}</h3>
                    </div>
                )}
                
            </div>
            <Footer/>
        </div>
    );
}

export default CurrentPlan;