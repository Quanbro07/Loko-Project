import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ICON_CONFIG = {
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  red: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  blue: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
};

// --- HÀM TIỆN ÍCH GIẢI MÃ ---
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  if (Array.isArray(encoded)) return encoded;
  if (typeof encoded !== "string") return [];

  var poly = [];
  var index = 0, len = encoded.length;
  var lat = 0, lng = 0;

  try {
    while (index < len) {
      var b, shift = 0, result = 0;
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
  routeData = null, 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const timerRef = useRef(null);

  // --- 1. XỬ LÝ DỮ LIỆU (QUAN TRỌNG: Cập nhật Key theo DTO Backend) ---
  const { routeSegments, startCoordinate } = useMemo(() => {
    let segments = [];
    let startCoord = null;

    // Log để kiểm tra dữ liệu nhận được
    // console.log("Map received routeData:", routeData);

    if (routeData && routeData.sections) {
      // 1. Tìm section theo 'day_num' (Khớp với @JsonProperty("day_num"))
      const activeSection = routeData.sections.find(
        (s) => s.day_num === currentDayIndex + 1
      );

      if (activeSection) {
        // 2. Lấy danh sách đường đi từ 'route_path' (Khớp với @JsonProperty("route_path"))
        // Nếu backend trả về null thì fallback mảng rỗng
        const pathList = activeSection.route_path || [];

        pathList.forEach((leg) => {
          // 3. Lấy chuỗi mã hóa (Thường tên là 'polyline')
          const rawPath = leg.polyline || leg.geometry || ""; 
          
          if (rawPath) {
            const leafletPath = decodePolyline(rawPath);

            if (leafletPath.length > 0) {
              segments.push({
                coords: leafletPath,
                details: {
                  distance: leg.distanceMeters || 0,
                  duration: leg.durationSeconds || 0,
                },
              });

              if (!startCoord) startCoord = leafletPath[0];
            }
          }
        });
      }
    }

    return { routeSegments: segments, startCoordinate: startCoord };
  }, [currentDayIndex, routeData]);

  // --- 2. KHỞI TẠO MAP ---
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

  // --- 3. VẼ LAYER ---
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

    // A. Vẽ Đường Đi (Polyline)
    if (routeSegments.length > 0) {
        routeSegments.forEach((segmentObj, idx) => {
          const isCurrentLeg = idx === currentIndex; 

          const polyline = L.polyline(segmentObj.coords, {
            color: "#2157bb",
            weight: isCurrentLeg ? 6 : 4,
            opacity: isCurrentLeg ? 1.0 : 0.6,
            dashArray: isCurrentLeg ? null : "10, 10", 
          });

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
          }
          polyline.addTo(layerGroup);
        });
    } else {
        // Fallback: Vẽ đường thẳng nếu không có Route
        if (itineraryPoints.length > 1) {
            const straightLineCoords = itineraryPoints
                .filter(p => !isNaN(p.lat) && !isNaN(p.lng))
                .map(p => [p.lat, p.lng]);
            
            if (straightLineCoords.length > 1) {
                L.polyline(straightLineCoords, {
                    color: "#999", 
                    weight: 2, 
                    dashArray: "5, 10", 
                    opacity: 0.5
                }).addTo(layerGroup);
            }
        }
    }

    // B. Vẽ Markers
    const validPoints = itineraryPoints.filter(p => !isNaN(parseFloat(p.lat)) && !isNaN(parseFloat(p.lng)));
    
    validPoints.forEach((point, index) => {
      const isActive = index === currentIndex;
      const marker = L.marker([point.lat, point.lng], {
        icon: isActive ? getIcon(ICON_CONFIG.red) : getIcon(ICON_CONFIG.blue),
        zIndexOffset: isActive ? 1000 : 500,
      }).bindPopup(
        `<div style="text-align:center"><b>${index + 1}. ${point.name}</b></div>`
      );

      if (isActive) marker.openPopup();
      marker.addTo(layerGroup);
    });

    // --- 4. ZOOM LOGIC ---
    if (map) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            try {
                map.invalidateSize();
                // Ưu tiên zoom theo đường đi
                if (routeSegments.length > 0) {
                    const allPoints = routeSegments.flatMap((s) => s.coords);
                    if (allPoints.length > 0) {
                        const bounds = L.latLngBounds(allPoints);
                        map.fitBounds(bounds, { padding: [50, 50], animate: true });
                        return;
                    }
                }
                // Zoom theo markers
                if (validPoints.length > 0) {
                     const markerBounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
                     map.fitBounds(markerBounds, { padding: [50, 50], animate: true });
                } else if (startCoordinate) {
                     map.setView(startCoordinate, 14, { animate: true });
                }
            } catch (err) {
                console.warn("Map zoom warning:", err);
            }
        }, 300);
    }

  }, [routeSegments, itineraryPoints, currentIndex, startCoordinate]);

  return (
    <div className="map-wrapper-full-width" style={{ width: "100vw", height: "600px", position: "relative", left: "50%", right: "50%", marginLeft: "-50vw", marginRight: "-50vw", zIndex: 0 }}>
      <div id="map" ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default MyLeafletMap;