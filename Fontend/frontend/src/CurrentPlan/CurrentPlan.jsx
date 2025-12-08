import "./CurrentPlan.css";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { useLanguage } from "../Language/LanguageContext";
import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyLeafletMap from "../Map/MyLeafletMap";
import OutputReal from "../OutputReal/OutputReal";
import CurrentPlace from "../CurrentPlace/CurrentPlace";
import WeatherForecast from "../WeatherForecast/WeatherForecast";
import TripHistory from "../TripHistory/TripHistory";
import { FaArrowLeft } from "react-icons/fa"; // Icon nút back
import axios from "axios";

const CurrentPlan = () => {
  const { translate } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Nhận dữ liệu từ trang Search/Plan (nếu vừa tạo xong)
  const receivedPlan = location.state?.finalPlan;

  // --- STATE QUẢN LÝ ---
  // viewMode: 'history' (xem bảng) hoặc 'detail' (xem map/weather)
  const [viewMode, setViewMode] = useState(receivedPlan ? "detail" : "history");

  const [isLoading, setIsLoading] = useState(false);
  const [tripData, setTripData] = useState(null); // Dữ liệu Trip (OutputReal/CurrentPlace)
  const [routeData, setRouteData] = useState(null); // Dữ liệu Route (Map)
  const [weatherData, setWeatherData] = useState(null); // Dữ liệu Weather

  // State quản lý slide ngày/địa điểm
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  // --- HÀM GỌI API /get KHI BẤM ICON ---
  const fetchTripDetail = async (tripId) => {
    setIsLoading(true);
    try {
      console.log(`🔄 Đang lấy chi tiết Trip ID: ${tripId}...`);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Gọi API Get Trip (Trả về MakePlanResponse)
      const response = await axios.get(
        `http://localhost:8080/api/v1/trip/get`,
        { params: { tripId: tripId }, headers: headers }
      );

      const data = response.data; // MakePlanResponse
      console.log("✅ Dữ liệu chi tiết:", data);

      // --- PHÂN TÁCH DỮ LIỆU TỪ MakePlanResponse ---
      // 1. Trip Data (Trip + Sections)
      if (data.tripPlan) {
        setTripData(data.tripPlan);
      } else {
        // Fallback nếu API trả thẳng Trip obj
        setTripData(data);
      }

      // 2. Route Data
      setRouteData(data.route || null);

      // 3. Weather Data
      setWeatherData(data.weather || null);

      // Reset index về ngày đầu tiên
      setCurrentDayIndex(0);
      setCurrentPlaceIndex(0);

      // Chuyển sang chế độ xem chi tiết
      setViewMode("detail");
    } catch (error) {
      console.error("❌ Lỗi tải chi tiết chuyến đi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECT: XỬ LÝ DỮ LIỆU KHI VỪA TẠO PLAN MỚI ---
  useEffect(() => {
    if (receivedPlan) {
      // Nếu có receivedPlan từ trang trước chuyển sang, set data luôn
      const extractedTrip = receivedPlan.tripPlan || receivedPlan;
      setTripData(extractedTrip);
      setRouteData(receivedPlan.route || null);
      setWeatherData(receivedPlan.weather || null);
      setViewMode("detail");
    }
  }, [receivedPlan]);

  // --- LOGIC TÍNH TOÁN (CHO DETAIL VIEW) ---
  const tripSections = useMemo(() => {
    return tripData?.tripSections || tripData?.trip_sections || [];
  }, [tripData]);

  const tripId = tripData?.tripId || tripData?.trip_id;

  const scheduleForCurrentDay = useMemo(() => {
    if (tripSections[currentDayIndex]) {
      return (
        tripSections[currentDayIndex].tripDetails ||
        tripSections[currentDayIndex].trip_details ||
        []
      );
    }
    return [];
  }, [tripSections, currentDayIndex]);

  const itineraryPoints = useMemo(() => {
    return scheduleForCurrentDay
      .map((place) => {
        const lat = parseFloat(place.location?.latitude || place.latitude);
        const lng = parseFloat(place.location?.longitude || place.longitude);
        const name =
          place.location?.location_name || place.title || place.locationName;
        return { name, lat, lng };
      })
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
  }, [scheduleForCurrentDay]);

  // --- RENDER ---
  return (
    <div>
      <Navbar />
      <div className="body-container">
        {/* === MODE 1: HISTORY LIST === */}
        {viewMode === "history" && (
          <div style={{ padding: "20px", minHeight: "60vh" }}>
            <TripHistory onSelectTrip={fetchTripDetail} />
          </div>
        )}

        {/* === MODE 2: DETAIL VIEW (OutputReal, Weather, CurrentPlace, Map) === */}
        {viewMode === "detail" && (
          <>
            {isLoading ? (
              <div className="loading-screen">Đang tải dữ liệu chi tiết...</div>
            ) : tripData ? (
              <>
                {/* NÚT BACK */}
                <div style={{ padding: "10px 40px" }}>
                  <button
                    onClick={() => setViewMode("history")}
                    className="back-button-style"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor: "#003c72",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    <FaArrowLeft /> Trở lại danh sách
                  </button>
                </div>

                <div className="plan-dashboard-wrapper">
                  {/* BẢNG LỊCH TRÌNH */}
                  <div className="plan-list-section">
                    <OutputReal
                      currentDayIndex={currentDayIndex}
                      setCurrentDayIndex={(idx) => {
                        setCurrentDayIndex(idx);
                        setCurrentPlaceIndex(0);
                      }}
                      tripSections={tripSections}
                      tripId={tripId}
                    />
                  </div>

                  {/* THỜI TIẾT */}
                  <div className="weather-section-below">
                    <WeatherForecast
                      currentDayIndex={currentDayIndex}
                      data={weatherData}
                    />
                  </div>
                </div>

                {/* CURRENT PLACE & MAP */}
                {scheduleForCurrentDay.length > 0 ? (
                  <div className="current-plan-content">
                    <CurrentPlace
                      scheduleData={scheduleForCurrentDay}
                      currentIndex={currentPlaceIndex}
                      setCurrentIndex={setCurrentPlaceIndex}
                    />
                    <MyLeafletMap
                      itineraryPoints={itineraryPoints}
                      currentIndex={currentPlaceIndex}
                      currentDayIndex={currentDayIndex}
                      routeData={routeData}
                    />
                  </div>
                ) : (
                  <div className="current-plan-empty-state">
                    <h3>Chưa có dữ liệu cho ngày này.</h3>
                  </div>
                )}
              </>
            ) : (
              // Nếu loading xong mà không có data (lỗi)
              <div className="error-screen">
                <h3>Không thể tải dữ liệu chuyến đi.</h3>
                <button onClick={() => setViewMode("history")}>Quay lại</button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CurrentPlan;
