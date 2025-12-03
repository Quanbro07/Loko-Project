import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import dữ liệu file JSON mới
import allRouteGeoJSON from "./route_geometry.json";

const ICON_CONFIG = {
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  red: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  blue: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
};

// Hàm tiện ích để format hiển thị
const formatDistance = (meters) => {
  if (!meters) return "0 m";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds) => {
  if (!seconds) return "0 phút";
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} giờ ${m} phút`;
  }
  return `${mins} phút`;
};

const MyLeafletMap = ({
  itineraryPoints = [],
  currentIndex = 0,
  currentDayIndex = 0,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const timerRef = useRef(null);

  // --- 1. XỬ LÝ DỮ LIỆU MỚI ---
  const { routeSegments, startCoordinate } = useMemo(() => {
    let segments = [];
    let startCoord = null;

    if (allRouteGeoJSON && allRouteGeoJSON.sections) {
      // Tìm section tương ứng với ngày hiện tại (giả sử day_num bắt đầu từ 1, hoặc dùng index)
      // Logic ở đây: Thử tìm theo day_num khớp với currentDayIndex + 1, nếu không thì lấy theo index mảng
      const activeSection =
        allRouteGeoJSON.sections.find(
          (s) => s.day_num === currentDayIndex + 1
        ) ||
        allRouteGeoJSON.sections[currentDayIndex] ||
        allRouteGeoJSON.sections[0];

      if (activeSection && activeSection.route_path) {
        // route_path là mảng các chặng
        activeSection.route_path.forEach((leg) => {
          // leg chứa: { distance_meter, duration_second, path: [[lat, lng], ...] }

          const rawPath = leg.path || [];

          // Convert raw path sang format Leaflet [lat, lng]
          const leafletPath = rawPath
            .map((coord) => {
              // Dựa trên snippet bạn gửi: [10.77794, 106.703569] -> [Lat, Lng]
              // Code cũ của bạn đảo ngược coord[1], coord[0], nhưng file mới có vẻ đã chuẩn Lat trước.
              // Nếu vẽ ra bị sai vị trí, hãy đổi lại vị trí 2 biến này.
              const lat = parseFloat(coord[0]);
              const lng = parseFloat(coord[1]);
              return !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null;
            })
            .filter((pt) => pt !== null);

          if (leafletPath.length > 0) {
            // Lưu thêm thông tin meta vào segment
            segments.push({
              coords: leafletPath,
              details: {
                distance: leg.distance_meter,
                duration: leg.duration_second,
              },
            });

            // Lấy điểm đầu tiên của chặng đầu tiên làm điểm start
            if (!startCoord) startCoord = leafletPath[0];
          }
        });
      }
    }

    return { routeSegments: segments, startCoordinate: startCoord };
  }, [currentDayIndex]);

  // --- 2. KHỞI TẠO MAP (Giữ nguyên) ---
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      center: [16.0471, 108.2068],
      zoom: 6,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
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

  // --- 3. VẼ LAYER & HIỂN THỊ THÔNG TIN ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;

    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const getIcon = (url) =>
      new L.Icon({
        iconUrl: url,
        shadowUrl: ICON_CONFIG.shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

    // Vẽ đường đi
    routeSegments.forEach((segmentObj, idx) => {
      const isCurrentLeg = idx === currentIndex - 1;

      // segmentObj bây giờ là object { coords, details }
      const polyline = L.polyline(segmentObj.coords, {
        color: "#2157bb",
        weight: isCurrentLeg ? 6 : 4,
        opacity: 0.8,
        dashArray: isCurrentLeg ? null : "5, 10",
      });

      // BIND POPUP ĐỂ HIỂN THỊ KHOẢNG CÁCH/THỜI GIAN
      if (segmentObj.details) {
        const { distance, duration } = segmentObj.details;
        const infoContent = `
                    <div style="text-align:center; font-size: 13px;">
                        <b>Chặng ${idx + 1}</b><br/>
                        Quãng đường: <b>${formatDistance(distance)}</b><br/>
                        Thời gian: <b>${formatDuration(duration)}</b>
                    </div>
                `;
        // Dùng bindTooltip để hiển thị khi hover, hoặc bindPopup để click
        polyline.bindPopup(infoContent);
      }

      polyline.addTo(layerGroup);
    });

    // Vẽ markers (Giữ nguyên logic cũ)
    itineraryPoints.forEach((point, index) => {
      const lat = parseFloat(point.lat);
      const lng = parseFloat(point.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const isActive = index === currentIndex;
      const marker = L.marker([lat, lng], {
        icon: isActive ? getIcon(ICON_CONFIG.red) : getIcon(ICON_CONFIG.blue),
        zIndexOffset: isActive ? 1000 : 500,
      }).bindPopup(
        `<div style="text-align:center"><b>${index + 1}. ${
          point.name
        }</b></div>`
      );

      if (isActive) marker.openPopup();
      marker.addTo(layerGroup);
    });
  }, [routeSegments, itineraryPoints, currentIndex]);

  // --- 4. ZOOM LOGIC (Giữ nguyên) ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (startCoordinate && map) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (map && map.getContainer()) {
          try {
            map.invalidateSize();
            map.setView(startCoordinate, 14, { animate: true });
          } catch (err) {
            console.warn("Map zoom warning:", err);
          }
        }
      }, 100);
    }
  }, [startCoordinate]);

  return (
    <div
      className="map-wrapper-full-width"
      style={{
        width: "100vw",
        height: "600px",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        zIndex: 0,
      }}
    >
      <div
        id="map"
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default MyLeafletMap;
