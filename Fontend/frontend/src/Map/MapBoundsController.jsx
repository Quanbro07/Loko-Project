import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet'; // Cần import thư viện Leaflet gốc

// Component này sẽ tính toán và điều chỉnh ranh giới bản đồ
const MapBoundsController = ({ points }) => {
    const map = useMap(); // Lấy đối tượng bản đồ từ context

    useEffect(() => {
        if (points && points.length > 0) {
            // 1. Tạo một mảng các đối tượng LatLng của Leaflet từ tọa độ của bạn
            const latLngs = points.map(p => L.latLng(p.lat, p.lng));

            // 2. Tạo Bounding Box (LatLngBounds) từ mảng tọa độ
            const bounds = L.latLngBounds(latLngs);

            // 3. Sử dụng fitBounds để điều chỉnh bản đồ
            // { padding: [50, 50] } là để tạo khoảng đệm (padding) quanh các điểm
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, points]); // Chạy lại khi đối tượng map hoặc danh sách điểm thay đổi

    return null; // Component này không render gì cả
};

export default MapBoundsController;