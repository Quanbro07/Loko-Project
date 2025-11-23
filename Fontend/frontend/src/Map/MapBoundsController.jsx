import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const MapBoundsController = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        // 1. Kiểm tra dữ liệu đầu vào
        if (!points || points.length === 0) return;

        // 2. Tạo bounds
        // L.latLngBounds chấp nhận mảng các mảng con dạng [lat, lng]
        const latLngs = points.map(p => [p.lat, p.lng]);
        const bounds = L.latLngBounds(latLngs);

        // 3. Kiểm tra bounds có hợp lệ không
        if (bounds.isValid()) {
            // 4. Dùng setTimeout để fix lỗi render giao diện (Quan trọng)
            const timer = setTimeout(() => {
                // Báo cho Leaflet biết kích thước container đã thay đổi (fix lỗi map xám hoặc zoom sai)
                map.invalidateSize();
                
                // Thực hiện zoom
                map.fitBounds(bounds, { 
                    padding: [50, 50], // Khoảng cách đệm từ mép
                    maxZoom: 16,       // Không zoom quá sát nếu chỉ có 1 điểm
                    animate: true,     // Hiệu ứng mượt
                    duration: 1
                });
            }, 200); // Đợi 200ms cho giao diện ổn định

            return () => clearTimeout(timer);
        }
    }, [map, points]);

    return null;
};

export default MapBoundsController;