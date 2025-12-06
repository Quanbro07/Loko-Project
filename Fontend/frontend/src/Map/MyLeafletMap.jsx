import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 1. XÓA IMPORT JSON CŨ
// import allRouteGeoJSON from "./route_geometry.json";

const ICON_CONFIG = {
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  red: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  blue: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
};

// --- HÀM TIỆN ÍCH ---

// 1. Hàm giải mã Polyline (An toàn hơn - Chống crash)
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  if (Array.isArray(encoded)) return encoded;
  if (typeof encoded !== "string") return [];

  var poly = [];
  var index = 0,
    len = encoded.length;
  var lat = 0,
    lng = 0;

  try {
    while (index < len) {
      var b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      var p = [lat / 1e5, lng / 1e5];
      poly.push(p);
    }
  } catch (e) {
    console.error("Error decoding polyline:", e);
    return [];
  }
  return poly;
};

// 2. Format khoảng cách
const formatDistance = (meters) => {
  if (!meters) return "0 m";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

// 3. Format thời gian
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
  routeData = null, // 2. THÊM PROP MỚI ĐỂ NHẬN DỮ LIỆU TỪ BACKEND
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const timerRef = useRef(null);

  // --- 3. SỬA USEMEMO ĐỂ DÙNG routeData ---
  const { routeSegments, startCoordinate } = useMemo(() => {
    let segments = [];
    let startCoord = null;

    // Kiểm tra nếu có dữ liệu từ prop routeData
    if (routeData && routeData.sections) {
      // Tìm section theo ngày
      // Lưu ý: Backend có thể trả về mảng sections mà index tương ứng với ngày,
      // hoặc có thuộc tính day_num. Logic dưới đây xử lý cả hai.
      const activeSection =
        routeData.sections.find((s) => s.day_num === currentDayIndex + 1) ||
        routeData.sections[currentDayIndex];

      if (activeSection && activeSection.route_path) {
        // Lọc bỏ các phần tử null hoặc không hợp lệ
        const validLegs = activeSection.route_path.filter(
          (leg) => leg !== null && typeof leg === "object"
        );

        validLegs.forEach((leg) => {
          // Lấy path an toàn (backend có thể trả về 'path' hoặc 'coords')
          const rawPath = leg.path || leg.coords || "";

          // Gọi hàm decode
          const leafletPath = decodePolyline(rawPath);

          if (leafletPath.length > 0) {
            segments.push({
              coords: leafletPath,
              details: {
                distance: leg.distance_meter,
                duration: leg.duration_second,
              },
            });

            // Lấy điểm đầu tiên làm startCoord
            if (!startCoord) startCoord = leafletPath[0];
          }
        });
      }
    }

    return { routeSegments: segments, startCoordinate: startCoord };
  }, [currentDayIndex, routeData]); // Thêm routeData vào dependencies

  // --- 4. KHỞI TẠO MAP (Giữ nguyên) ---
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

  // --- 5. VẼ LAYER & HIỂN THỊ THÔNG TIN (Giữ nguyên logic vẽ) ---
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

    // Vẽ Polyline
    routeSegments.forEach((segmentObj, idx) => {
      // Logic Solid/Dotted
      const isCurrentLeg = idx === currentIndex;

      const polyline = L.polyline(segmentObj.coords, {
        color: "#2157bb",
        weight: isCurrentLeg ? 6 : 4,
        opacity: isCurrentLeg ? 1.0 : 0.6,
        dashArray: isCurrentLeg ? null : "10, 10", // Solid vs Dotted
      });

      // Bind Popup info
      if (segmentObj.details) {
        const { distance, duration } = segmentObj.details;
        const infoContent = `
          <div style="text-align:center; font-size: 13px; font-family: sans-serif;">
            <b style="color: #2157bb;">Chặng ${idx + 1}</b><br/>
            Quãng đường: <b>${formatDistance(distance)}</b><br/>
            Thời gian: <b>${formatDuration(duration)}</b>
          </div>
        `;
        polyline.bindPopup(infoContent);
        polyline.bindTooltip(infoContent, { sticky: true, opacity: 0.9 });
      }

      polyline.addTo(layerGroup);
    });

    // Vẽ Markers
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

  // --- 6. ZOOM LOGIC (Giữ nguyên) ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (startCoordinate && map) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (map && map.getContainer()) {
          try {
            map.invalidateSize();
            if (routeSegments.length > 0) {
              const allPoints = routeSegments.flatMap((s) => s.coords);
              if (allPoints.length > 0) {
                const bounds = L.latLngBounds(allPoints);
                map.fitBounds(bounds, { padding: [50, 50], animate: true });
              }
            } else {
              map.setView(startCoordinate, 14, { animate: true });
            }
          } catch (err) {
            console.warn("Map zoom warning:", err);
          }
        }
      }, 200);
    }
  }, [startCoordinate, routeSegments]);

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
