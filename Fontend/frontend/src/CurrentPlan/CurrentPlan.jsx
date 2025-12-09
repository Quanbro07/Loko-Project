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
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

const CurrentPlan = () => {
  const { translate } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const receivedPlan = location.state?.finalPlan;

  // --- STATE ---
  const [viewMode, setViewMode] = useState(receivedPlan ? "detail" : "history");
  const [isLoading, setIsLoading] = useState(false);

  const [tripData, setTripData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  // --- HÀM GỌI API CHI TIẾT ---
  const fetchTripDetail = async (tripId) => {
    if (!tripId) return;

    setIsLoading(true);
    try {
      console.log(`🔄 Start fetching Trip ID: ${tripId}...`);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `http://localhost:8080/api/v1/trip/get`,
        { params: { tripId: tripId }, headers: headers }
      );

      console.log("✅ API Response Raw:", response.data);
      const data = response.data;

      // --- [FIX] XỬ LÝ DỮ LIỆU ROBUST (Bắt cả snake_case và camelCase) ---

      // 1. Lấy Trip Object
      let extractedTrip = null;
      if (data.tripPlan) extractedTrip = data.tripPlan;
      else if (data.trip_plan)
        extractedTrip = data.trip_plan; // Fix: snake_case
      else extractedTrip = data; // Fallback

      // 2. Lấy Route & Weather
      const extractedRoute = data.route || null;
      const extractedWeather = data.weather || null;

      console.log("📌 Extracted Trip Data:", extractedTrip);

      if (extractedTrip) {
        setTripData(extractedTrip);
        setRouteData(extractedRoute);
        setWeatherData(extractedWeather);

        // Reset Index
        setCurrentDayIndex(0);
        setCurrentPlaceIndex(0);

        setViewMode("detail");
      } else {
        console.error("⚠️ Không tìm thấy object Trip hợp lệ trong response");
      }
    } catch (error) {
      console.error("❌ Lỗi tải chi tiết chuyến đi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECT: DATA TỪ TRANG TẠO PLAN ---
  useEffect(() => {
    if (receivedPlan) {
      // Logic tương tự như trên
      const data = receivedPlan;
      let extractedTrip = null;
      if (data.tripPlan) extractedTrip = data.tripPlan;
      else if (data.trip_plan) extractedTrip = data.trip_plan;
      else extractedTrip = data;

      setTripData(extractedTrip);
      setRouteData(data.route || null);
      setWeatherData(data.weather || null);
      setViewMode("detail");
    }
  }, [receivedPlan]);

  // --- [FIX] LOGIC TÍNH TOÁN (QUAN TRỌNG) ---

  // 1. Lấy Trip Sections (Bắt cả snake_case)
  const tripSections = useMemo(() => {
    if (!tripData) return [];
    // Kiểm tra kỹ các trường hợp
    return tripData.tripSections || tripData.trip_sections || [];
  }, [tripData]);

  // 2. Lấy Trip ID
  const tripId = tripData?.tripId || tripData?.trip_id;

  // 3. Lấy Danh sách địa điểm ngày hiện tại (Bắt cả snake_case)
  const scheduleForCurrentDay = useMemo(() => {
    if (tripSections && tripSections[currentDayIndex]) {
      const section = tripSections[currentDayIndex];
      // Kiểm tra tripDetails hoặc trip_details
      return section.tripDetails || section.trip_details || [];
    }
    return [];
  }, [tripSections, currentDayIndex]);

  // 4. Tạo Marker Map (Kiểm tra location object)
  const itineraryPoints = useMemo(() => {
    return scheduleForCurrentDay
      .map((place) => {
        // place.location có thể là null nếu cấu trúc phẳng, hoặc nằm trong object
        const locObj = place.location || place;

        const lat = parseFloat(locObj.latitude || place.latitude);
        const lng = parseFloat(locObj.longitude || place.longitude);

        // Tên địa điểm
        const name =
          locObj.location_name ||
          locObj.locationName ||
          place.title ||
          "Điểm đến";

        return { name, lat, lng };
      })
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
  }, [scheduleForCurrentDay]);

  // Debug Log để kiểm tra xem dữ liệu đã vào chưa
  useEffect(() => {
    if (viewMode === "detail") {
      console.log("📊 Debug UI Data:");
      console.log("- Trip Sections:", tripSections);
      console.log(`- Schedule Day ${currentDayIndex}:`, scheduleForCurrentDay);
      console.log("- Map Points:", itineraryPoints);
    }
  }, [
    tripSections,
    scheduleForCurrentDay,
    itineraryPoints,
    viewMode,
    currentDayIndex,
  ]);

  // --- RENDER ---
  return (
    <div>
      <Navbar />
      <div className="body-container">
        {/* MODE 1: LIST */}
        {viewMode === "history" && (
          <div style={{ padding: "20px", minHeight: "60vh" }}>
            <TripHistory onSelectTrip={fetchTripDetail} />
          </div>
        )}

        {/* MODE 2: DETAIL */}
        {viewMode === "detail" && (
          <>
            {isLoading ? (
              <div
                className="loading-screen"
                style={{ textAlign: "center", padding: "50px" }}
              >
                <h2>Đang tải dữ liệu...</h2>
              </div>
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
                    <FaArrowLeft />
                    LỊCH SỬ CHUYẾN ĐI
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
                      tripId={tripId}
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
                    <h3>
                      Chưa có dữ liệu địa điểm cho ngày này (
                      {tripSections.length > 0
                        ? `Ngày ${currentDayIndex + 1}`
                        : "Không xác định"}
                      ).
                    </h3>
                  </div>
                )}
              </>
            ) : (
              <div
                className="error-screen"
                style={{ padding: "50px", textAlign: "center" }}
              >
                <h3>Không thể hiển thị dữ liệu.</h3>
                <button
                  onClick={() => setViewMode("history")}
                  style={{ cursor: "pointer", padding: "10px" }}
                >
                  Quay lại
                </button>
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
