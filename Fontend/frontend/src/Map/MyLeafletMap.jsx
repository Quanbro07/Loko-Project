import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import dữ liệu
import allRouteGeoJSON from './route_geometry.json'; 

const ICON_CONFIG = {
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
};

const MyLeafletMap = ({ 
    itineraryPoints = [], 
    currentIndex = 0, 
    currentDayIndex = 0 
}) => { 
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const layerGroupRef = useRef(null);
    const timerRef = useRef(null); 

    // --- 1. XỬ LÝ DỮ LIỆU ---
    const { routeSegments, startCoordinate } = useMemo(() => {
        let segments = [];
        let startCoord = null; 

        if (allRouteGeoJSON) {
            const dayKeys = Object.keys(allRouteGeoJSON);
            const activeKey = dayKeys[currentDayIndex] || dayKeys[0]; 
            const dayData = allRouteGeoJSON[activeKey];

            if (dayData && dayData.coordinates) {
                let rawCoords = dayData.coordinates;
                if (rawCoords.length > 0 && Array.isArray(rawCoords[0]) && Array.isArray(rawCoords[0][0]) && Array.isArray(rawCoords[0][0][0])) {
                     rawCoords = rawCoords.flat(1);
                }

                // Lấy điểm đầu tiên để zoom (chỉ dùng khi đổi ngày)
                if (rawCoords.length > 0 && rawCoords[0].length > 0) {
                    const firstPt = rawCoords[0][0]; 
                    if (Array.isArray(firstPt) && firstPt.length >= 2) {
                        const lat = parseFloat(firstPt[1]);
                        const lng = parseFloat(firstPt[0]);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            startCoord = [lat, lng];
                        }
                    }
                }

                // Xử lý segments
                rawCoords.forEach(segment => {
                    const leafletSegment = segment.map(coord => {
                        const lat = parseFloat(coord[1]);
                        const lng = parseFloat(coord[0]);
                        return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
                    }).filter(pt => pt !== null);
                    
                    if (leafletSegment.length > 0) segments.push(leafletSegment);
                });
            }
        }

        return { routeSegments: segments, startCoordinate: startCoord };
    }, [currentDayIndex]);

    // --- 2. KHỞI TẠO MAP (Chạy 1 lần) ---
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return; 

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            center: [16.0471, 108.2068], 
            zoom: 6 
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                layerGroupRef.current = null;
            }
        };
    }, []);

    // --- 3. VẼ LAYER (Cập nhật khi currentIndex thay đổi) ---
    // Effect này CHỊU TRÁCH NHIỆM vẽ lại đường đi (nét đứt/liền) và marker
    useEffect(() => {
        const map = mapInstanceRef.current;
        const layerGroup = layerGroupRef.current;

        if (!map || !layerGroup) return;

        // Xóa layer cũ để vẽ lại trạng thái mới
        layerGroup.clearLayers();
        
        const getIcon = (url) => new L.Icon({
            iconUrl: url, shadowUrl: ICON_CONFIG.shadowUrl,
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        // Vẽ đường (Logic highlight đường đi nằm ở đây)
        routeSegments.forEach((segment, idx) => {
            const isCurrentLeg = idx === (currentIndex - 1); // Logic đổi style
            L.polyline(segment, {
                color: '#2157bb',
                weight: isCurrentLeg ? 6 : 4,
                opacity: 0.8,
                dashArray: isCurrentLeg ? null : '5, 10' // Đổi sang solid nếu là current
            }).addTo(layerGroup);
        });

        // Vẽ markers
        itineraryPoints.forEach((point, index) => {
            const lat = parseFloat(point.lat);
            const lng = parseFloat(point.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const isActive = index === currentIndex;
            const marker = L.marker([lat, lng], { 
                icon: isActive ? getIcon(ICON_CONFIG.red) : getIcon(ICON_CONFIG.blue), 
                zIndexOffset: isActive ? 1000 : 500 
            }).bindPopup(`<div style="text-align:center"><b>${index + 1}. ${point.name}</b></div>`);
            
            if (isActive) marker.openPopup();
            marker.addTo(layerGroup);
        });
        
    }, [routeSegments, itineraryPoints, currentIndex]); // <--- CHỈ VẼ LẠI, KHÔNG ZOOM


    // --- 4. ZOOM LOGIC (CHỈ CHẠY KHI ĐỔI NGÀY) ---
    // Effect này tách biệt hoàn toàn, không có 'currentIndex' trong dependency
    useEffect(() => {
        const map = mapInstanceRef.current;
        
        // Chỉ zoom khi có startCoordinate (tức là khi dữ liệu ngày mới được load)
        if (startCoordinate && map) {
            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => {
                if (map && map.getContainer()) { 
                    try {
                        map.invalidateSize();
                        // Zoom vào điểm đầu tiên của ngày đó
                        map.setView(startCoordinate, 14, { animate: true });
                    } catch (err) {
                        console.warn("Map zoom warning:", err);
                    }
                }
            }, 100); 
        }
    }, [startCoordinate]); // <--- QUAN TRỌNG: KHÔNG CÓ currentIndex Ở ĐÂY

    return (
        <div 
            className="map-wrapper-full-width" 
            style={{ 
                width: '100vw',        
                height: '600px',      
                position: 'relative', 
                left: '50%', 
                right: '50%', 
                marginLeft: '-50vw', 
                marginRight: '-50vw',
                zIndex: 0 
            }}
        >
            <div id="map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default MyLeafletMap;