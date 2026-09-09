import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// 1. Định nghĩa các hằng số
const containerStyle = {
    width: '100%',
    height: '500px' // Kích thước hiển thị bản đồ
};

const defaultCenter = {
    lat: 21.028511, // Tọa độ mặc định (ví dụ: Hà Nội)
    lng: 105.804817
};

// Khai báo thư viện cần tải (ví dụ: 'places' nếu cần tính năng tìm kiếm địa điểm)
const libraries = ["places"];

const MyMap = () => {
    // THAY THẾ KHÓA API CỦA BẠN VÀO ĐÂY
    const apiKey = 'YOUR_API_KEY';

    // 2. Sử dụng hook để tải Google Maps JavaScript API
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries: libraries
    });

    const [map, setMap] = useState(null);

    // Lưu trữ tham chiếu bản đồ khi tải thành công
    const onLoad = useCallback((map) => {
        // Có thể thực hiện các thao tác khi bản đồ tải xong (ví dụ: setZoom)
        setMap(map);
    }, []);

    // Xóa tham chiếu bản đồ khi component bị hủy (giúp tối ưu bộ nhớ)
    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return <div>Đang tải bản đồ...</div>;
    }

    // 3. Render component GoogleMap
    return (
        <div style={containerStyle}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12} // Mức độ phóng đại
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* 4. Thêm điểm đánh dấu (Marker) */}
                <Marker position={defaultCenter} />
            </GoogleMap>
        </div>
    );
};

export default MyMap;