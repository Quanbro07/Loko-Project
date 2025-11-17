import React from 'react';
// Import GeoJSON để vẽ đường đi
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapBoundsController from './MapBoundsController'; 

// 🌟 SỬ DỤNG IMPORT ĐỂ LẤY DỮ LIỆU TỪ FILE JSON 🌟
import routeGeoJSON from './route_geometry.json'; 
import './MyLeafletMap.css';

// Khắc phục lỗi Icon mặc định của Leaflet (giữ nguyên)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Component Bản đồ Leaflet hiển thị tuyến đường và điểm mốc.
 * @param {Array<{lat: number, lng: number, name: string}>} itineraryPoints - Danh sách các điểm mốc.
 * @param {number} currentIndex - Index của địa điểm hiện tại (0 là điểm xuất phát).
 */
const MyLeafletMap = ({ itineraryPoints, currentIndex = 0 }) => { // 🌟 NHẬN currentIndex 🌟
    const defaultPosition = [21.028511, 105.804817]; // Trung tâm Hà Nội
    const defaultZoom = 10;

    return (
        <MapContainer
            center={defaultPosition}
            zoom={defaultZoom}
            scrollWheelZoom={false}
            key={itineraryPoints.length} 
            style={{ height: '600px', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 1. Gọi Component Điều khiển Bản đồ để tự động căn chỉnh */}
            <MapBoundsController points={itineraryPoints} />

            {/* 🌟 2. THÊM ĐƯỜNG ĐI PHÂN CHIA (SOLID/DOTTED) 🌟 */}
            {routeGeoJSON && routeGeoJSON.coordinates && routeGeoJSON.coordinates.map((segmentCoords, segmentIndex) => {
                // Tạo một đối tượng GeoJSON cho từng đoạn đường (LineString)
                const segmentGeoJSON = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: segmentCoords // [Lng, Lat] array
                    }
                };

                // Đoạn đường NÉP theo vị trí hiện tại: segmentIndex === currentIndex
                const isCurrentSegment = segmentIndex === currentIndex-1;
                
                let styleOptions = {};
                
                if (isCurrentSegment) {
                    // Đường đi SẮP TỚI (Solid)
                    styleOptions = {
                        color: '#004ea1ff', // Màu xanh dương
                        weight: 5, 
                        opacity: 1, 
                        dashArray: null, // Solid line
                        lineCap: 'round'
                    };
                } else {
                    // Đường đã đi VÀ đường DỰ TÍNH (Dotted)
                    styleOptions = {
                        color: '#035ab6ff', 
                        weight: 3, 
                        opacity: 1.0, 
                        dashArray: '5, 8', // Dotted line (5px nét, 10px khoảng cách)
                        lineCap: 'round'
                    };
                }
                
                // Bỏ qua nếu segment rỗng
                if (segmentCoords.length === 0) return null;

                return (
                    <GeoJSON 
                        key={`route-segment-${segmentIndex}`}
                        data={segmentGeoJSON} 
                        style={() => styleOptions}
                    />
                );
            })}
            
            {/* 3. THÊM MARKER CHO TẤT CẢ CÁC ĐIỂM DỪNG */}
            {itineraryPoints.map((point, index) => {
                // ... (logic marker giữ nguyên)
                return (
                    <Marker 
                        key={index} 
                        position={[point.lat, point.lng]}
                    >
                        <Popup>
                            <div className="location-name-content"> 
                                {point.name}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
};
export default MyLeafletMap;