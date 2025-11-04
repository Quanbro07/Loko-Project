import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Import component điều khiển
import MapBoundsController from './MapBoundsController';

import L from 'leaflet'; // Import thư viện Leaflet gốc

// 🌟 KHẮC PHỤC LỖI ICON MẶC ĐỊNH CỦA LEAFLET 🌟
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
const MyLeafletMap = ({ itineraryPoints }) => {
    // Vị trí/zoom mặc định chỉ là placeholder, vì MapBoundsController sẽ override
    const defaultPosition = [21.028511, 105.804817];
    const defaultZoom = 10;

    return (
        <MapContainer
            center={defaultPosition}
            zoom={defaultZoom}
            scrollWheelZoom={false}
            // Đặt key để đảm bảo MapContainer được khởi tạo lại nếu cần
            key={itineraryPoints.length}
            style={{ height: '800px', width: '80%' }}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* 🌟 1. Gọi Component Điều khiển và truyền danh sách điểm */}
            <MapBoundsController points={itineraryPoints} />

            {/* 🌟 2. Vẽ tất cả các điểm đánh dấu (Markers) */}
            {itineraryPoints.map((point, index) => (
                <Marker key={index} position={[point.lat, point.lng]}>
                    <Popup>{point.name}</Popup>
                </Marker>
            ))}

        </MapContainer>
    );
};
export default MyLeafletMap;