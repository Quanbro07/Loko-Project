import './CurrentPlan.css';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import Output from '../Output/Output';
import { useLanguage } from '../Language/LanguageContext';
import React, { useState, useEffect } from 'react';
import MyLeafletMap from '../Map/MyLeafletMap';
import OutputReal from '../OutputReal/OutputReal';
// 1. Import file JSON
import routeGeometry from '../Map/route_geometry.json'; 
import CurrentPlace from '../CurrentPlace/CurrentPlace';
import schedule from '../Output/schedule.json'; 

// Khai báo kiểu dữ liệu chung
const defaultPoint = { name: '', lat: 0, lng: 0 };

const CurrentPlan = () => {
    const { translate } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    // itineraryPoints giờ là chuỗi tọa độ đường đi
    const [itineraryPoints, setItineraryPoints] = useState([]); 
    const [startPoint, setStartPoint] = useState(defaultPoint);
    const [endPoint, setEndPoint] = useState(defaultPoint);

    useEffect(() => {
        if (schedule && schedule.length > 0) {
            
            // Lấy ra tên, lat, lng của từng địa điểm trong lịch trình
            const pointsOfInterests = schedule.map(place => ({
                name: place.title,
                lat: place.latitude,
                lng: place.longitude,
            }));

            // Xác định điểm bắt đầu và kết thúc
            const start = pointsOfInterests[0];
            const end = pointsOfInterests[pointsOfInterests.length - 1];

            setStartPoint(start);
            setEndPoint(end);
            
            // 🌟 Dùng 8 điểm mốc này để vẽ Markers 🌟
            setItineraryPoints(pointsOfInterests); 

            console.log(`Đã nạp ${pointsOfInterests.length} điểm mốc từ lịch trình.`);

        } 
        
        // Giữ lại logic routeGeometry nếu bạn vẫn cần nó để tính toán bản đồ (MapBoundsController)
        // hoặc để vẽ đường đi (nhưng routeGeoJSON đã được import trong MyLeafletMap)
        else if (
            routeGeometry &&
            routeGeometry.coordinates &&
            routeGeometry.coordinates.length > 0
        ) {
            // Nếu không có schedule, bạn có thể truyền toàn bộ chuỗi tọa độ 
            // (nhưng điều này sẽ gây ra quá nhiều marker như đã nói)
            const routeLine = routeGeometry.coordinates[0]; 
            const allPoints = routeLine.map(coord => ({
                lat: coord[1],
                lng: coord[0],
            }));
            setItineraryPoints(allPoints);
        }
    }, []); 

    return (
        <div>
            <Navbar />
            <div className='body-container'>
                {/* Truyền thông tin điểm Bắt đầu và Kết thúc vào Output để hiển thị
                  (Bạn cần đảm bảo component Output chấp nhận các props này)
                */}
                <OutputReal/>
                <CurrentPlace 
                    currentIndex={currentIndex} 
                    setCurrentIndex={setCurrentIndex} 
                /> 
                {/* ... */}
                {/* 🌟 3. Truyền state xuống MyLeafletMap 🌟 */}
                <MyLeafletMap 
                    itineraryPoints={itineraryPoints} 
                    currentIndex={currentIndex} 
                    className='output-map' 
                />
            </div>
            <Footer />
        </div>
    );
}

export default CurrentPlan;