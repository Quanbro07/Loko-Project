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
import PremiumFeature from "../PremiumFeature/PremiumFeature";
import axios from "axios";

const CurrentPlan = () => {
  const { translate } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const receivedPlan = location.state?.finalPlan;

  const [viewMode, setViewMode] = useState(receivedPlan ? "detail" : "history");
  const [isLoading, setIsLoading] = useState(false);

  // Dữ liệu chuyến đi
  const [tripData, setTripData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // State vị trí hiện tại
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  // --- HÀM GỌI API CHI TIẾT & KHÔI PHỤC PROGRESS ---
  const fetchTripDetail = async (tripId) => {
    if (!tripId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      console.log(`🔄 Fetching Trip ID: ${tripId}`);

      const response = await axios.get(
        `http://localhost:8080/api/v1/trip/get`,
        { params: { tripId: tripId }, headers: headers }
      );

      const data = response.data;
      // Bắt lỗi cấu trúc dữ liệu linh hoạt (Snake/Camel)
      let extractedTrip = data.tripPlan || data.trip_plan || data;
      const extractedRoute = data.route || null;
      const extractedWeather = data.weather || null;

      if (extractedTrip) {
        setTripData(extractedTrip);
        setRouteData(extractedRoute);
        setWeatherData(extractedWeather);

        // --- 👇 KHÔI PHỤC TIẾN ĐỘ TỪ DB (FIX NUMBER) 👇 ---
        // Ép kiểu Number để đảm bảo không bị lỗi so sánh chuỗi
        const savedDay = Number(
          extractedTrip.currentDayIndex ?? extractedTrip.current_day_index ?? 0
        );
        const savedPlace = Number(
          extractedTrip.currentPlaceIndex ??
            extractedTrip.current_place_index ??
            0
        );

        console.log(
          `📥 Restoring Progress: Day ${savedDay}, Place ${savedPlace}`
        );

        setCurrentDayIndex(savedDay);
        setCurrentPlaceIndex(savedPlace);

        setViewMode("detail");
      }
    } catch (error) {
      console.error("❌ Lỗi tải chi tiết chuyến đi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (receivedPlan) {
      const data = receivedPlan;
      let extractedTrip = data.tripPlan || data.trip_plan || data;
      setTripData(extractedTrip);
      setRouteData(data.route || null);
      setWeatherData(data.weather || null);

      setCurrentDayIndex(0);
      setCurrentPlaceIndex(0);
      setViewMode("detail");
    }
  }, [receivedPlan]);

  // --- TÍNH TOÁN DỮ LIỆU ---

  // 1. Lấy Trip Sections
  const tripSections = useMemo(() => {
    if (!tripData) return [];
    return tripData.tripSections || tripData.trip_sections || [];
  }, [tripData]);

  const tripId = tripData?.tripId || tripData?.trip_id;

  // 2. Lấy Danh sách địa điểm ngày hiện tại
  const scheduleForCurrentDay = useMemo(() => {
    // Kiểm tra an toàn để tránh crash
    if (
      tripSections &&
      Array.isArray(tripSections) &&
      tripSections[currentDayIndex]
    ) {
      const section = tripSections[currentDayIndex];
      return section.tripDetails || section.trip_details || [];
    }
    return [];
  }, [tripSections, currentDayIndex]);

  // LOG DEBUG: Kiểm tra xem tại sao không hiện
  useEffect(() => {
    if (tripData) {
      console.log(
        `📊 Day Index: ${currentDayIndex}, Places Count: ${scheduleForCurrentDay.length}`
      );
      if (scheduleForCurrentDay.length === 0) {
        console.warn(
          "⚠️ Warning: No places found for current day. CurrentPlace will be hidden."
        );
      }
    }
  }, [scheduleForCurrentDay, currentDayIndex, tripData]);

  const itineraryPoints = useMemo(() => {
    return scheduleForCurrentDay
      .map((place) => {
        const locObj = place.location || place;
        const lat = parseFloat(locObj.latitude || place.latitude);
        const lng = parseFloat(locObj.longitude || place.longitude);
        const name =
          locObj.location_name ||
          locObj.locationName ||
          place.title ||
          "Điểm đến";
        return { name, lat, lng };
      })
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
  }, [scheduleForCurrentDay]);

  const isLastDay = useMemo(() => {
    if (tripSections.length === 0) return false;
    return currentDayIndex === tripSections.length - 1;
  }, [currentDayIndex, tripSections]);

  return (
    <div>
      <Navbar />
      <div className="body-container">
        {viewMode === "history" && (
          <div style={{ padding: "20px", minHeight: "60vh" }}>
            <TripHistory onSelectTrip={fetchTripDetail} />
          </div>
        )}

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
                    <FaArrowLeft /> LỊCH SỬ CHUYẾN ĐI
                  </button>
                </div>

                <div className="plan-dashboard-wrapper">
                  <div className="plan-list-section">
                    <OutputReal
                      currentDayIndex={currentDayIndex}
                      setCurrentDayIndex={(idx) => {
                        setCurrentDayIndex(idx);
                        setCurrentPlaceIndex(0); // Reset place về 0 khi đổi ngày
                      }}
                      tripSections={tripSections}
                      tripId={tripId}
                    />
                  </div>
                  <div className="weather-section-below">
                    <PremiumFeature fallbackText="Dự báo thời tiết chi tiết chỉ dành cho Premium">
                      <WeatherForecast
                        currentDayIndex={currentDayIndex}
                        data={weatherData}
                      />
                    </PremiumFeature>
                  </div>
                </div>

                {/* --- RENDER CURRENT PLACE --- */}
                {scheduleForCurrentDay.length > 0 ? (
                  <div className="current-plan-content">
                    <CurrentPlace
                      scheduleData={scheduleForCurrentDay}
                      currentIndex={currentPlaceIndex}
                      setCurrentIndex={setCurrentPlaceIndex}
                      tripId={tripId}
                      dayIndex={currentDayIndex + 1}
                      rawDayIndex={currentDayIndex}
                      isLastDay={isLastDay}
                    />
                    <div
                      style={{
                        width: "100%",
                        height: "600px",
                        position: "relative",
                      }}
                    >
                      <PremiumFeature fallbackText="Bản đồ tương tác chỉ dành cho Premium">
                        <MyLeafletMap
                          itineraryPoints={itineraryPoints}
                          currentIndex={currentPlaceIndex}
                          currentDayIndex={currentDayIndex}
                          routeData={routeData}
                        />
                      </PremiumFeature>
                    </div>
                  </div>
                ) : (
                  <div className="current-plan-empty-state">
                    <h3>
                      Chưa có dữ liệu địa điểm cho ngày {currentDayIndex + 1}.
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
