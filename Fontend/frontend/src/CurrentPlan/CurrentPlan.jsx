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

  const [tripData, setTripData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);

  // --- HÀM HỖ TRỢ: Tìm Index Ngày và Index Địa điểm từ ID ---
  const findIndicesFromIds = (tripData, savedSectionId, savedDetailId) => {
    let foundDayIndex = 0;
    let foundPlaceIndex = 0;

    const sections = tripData.tripSections || tripData.trip_sections || [];

    // 1. Tìm Day Index dựa trên Section ID
    if (savedSectionId) {
      const dIndex = sections.findIndex(
        (s) => (s.tripSectionId || s.id) === Number(savedSectionId)
      );
      if (dIndex !== -1) foundDayIndex = dIndex;
    }

    // 2. Tìm Place Index dựa trên Detail ID (trong ngày đã tìm thấy)
    if (savedDetailId && sections[foundDayIndex]) {
      const details =
        sections[foundDayIndex].tripDetails ||
        sections[foundDayIndex].trip_details ||
        [];

      const pIndex = details.findIndex(
        (d) => (d.tripDetailId || d.id) === Number(savedDetailId)
      );

      if (pIndex !== -1) {
        foundPlaceIndex = pIndex;
      }
    }

    return { foundDayIndex, foundPlaceIndex };
  };

  const fetchTripDetail = async (tripId) => {
    if (!tripId) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        `http://localhost:8080/api/v1/trip/get`,
        { params: { tripId: tripId }, headers: headers }
      );

      const data = response.data;
      let extractedTrip = data.tripPlan || data.trip_plan || data;
      const extractedRoute = data.route || null;
      const extractedWeather = data.weather || null;

      if (extractedTrip) {
        setTripData(extractedTrip);
        setRouteData(extractedRoute);
        setWeatherData(extractedWeather);

        // --- KHÔI PHỤC TIẾN ĐỘ TỪ DB ---
        const savedSectionId = extractedTrip.currentTripSectionId;
        const savedDetailId = extractedTrip.currentTripDetailId;

        // 👉 LOG THEO YÊU CẦU: Log ra khi vừa tải trang
        console.log("🔄 [PAGE LOAD] Đã khôi phục tiến độ từ lần trước:", {
          Last_Saved_SectionID: savedSectionId,
          Last_Saved_DetailID: savedDetailId,
        });

        if (savedSectionId || savedDetailId) {
          const { foundDayIndex, foundPlaceIndex } = findIndicesFromIds(
            extractedTrip,
            savedSectionId,
            savedDetailId
          );

          setCurrentDayIndex(foundDayIndex);
          setCurrentPlaceIndex(foundPlaceIndex);

          console.log(
            `📍 [NAVIGATE] Nhảy tới: Ngày ${foundDayIndex + 1}, Địa điểm số ${
              foundPlaceIndex + 1
            }`
          );
        } else {
          setCurrentDayIndex(0);
          setCurrentPlaceIndex(0);
        }

        setViewMode("detail");
      }
    } catch (error) {
      console.error("❌ Error fetching trip:", error);
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

  // Các useMemo tính toán dữ liệu hiển thị
  const tripSections = useMemo(() => {
    if (!tripData) return [];
    return tripData.tripSections || tripData.trip_sections || [];
  }, [tripData]);

  const tripId = tripData?.tripId || tripData?.trip_id;

  const scheduleForCurrentDay = useMemo(() => {
    if (tripSections && tripSections[currentDayIndex]) {
      const section = tripSections[currentDayIndex];
      return section.tripDetails || section.trip_details || [];
    }
    return [];
  }, [tripSections, currentDayIndex]);

  const currentSectionId = useMemo(() => {
    if (tripSections && tripSections[currentDayIndex]) {
      return (
        tripSections[currentDayIndex].tripSectionId ||
        tripSections[currentDayIndex].id
      );
    }
    return null;
  }, [tripSections, currentDayIndex]);

  const itineraryPoints = useMemo(() => {
    return scheduleForCurrentDay
      .map((place) => {
        const locObj = place.location || place;
        return {
          name: locObj.location_name || place.title,
          lat: parseFloat(locObj.latitude),
          lng: parseFloat(locObj.longitude),
        };
      })
      .filter((p) => !isNaN(p.lat));
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
                <h2>Loading...</h2>
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
                        setCurrentPlaceIndex(0); // Reset về 0 khi đổi ngày thủ công
                      }}
                      tripSections={tripSections}
                      tripId={tripId}
                    />
                  </div>
                  <div className="weather-section-below">
                    <PremiumFeature fallbackText="Premium Only">
                      <WeatherForecast
                        currentDayIndex={currentDayIndex}
                        data={weatherData}
                      />
                    </PremiumFeature>
                  </div>
                </div>

                {scheduleForCurrentDay.length > 0 ? (
                  <div className="current-plan-content">
                    <CurrentPlace
                      scheduleData={scheduleForCurrentDay}
                      // Truyền state index để điều khiển slide
                      currentIndex={currentPlaceIndex}
                      setCurrentIndex={setCurrentPlaceIndex}
                      tripId={tripId}
                      dayIndex={currentDayIndex + 1}
                      rawDayIndex={currentDayIndex}
                      currentSectionId={currentSectionId}
                      isLastDay={isLastDay}
                    />
                    <div
                      style={{
                        width: "100%",
                        height: "600px",
                        position: "relative",
                      }}
                    >
                      <PremiumFeature fallbackText="Premium Only">
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
                    <h3>Chưa có dữ liệu cho ngày {currentDayIndex + 1}.</h3>
                  </div>
                )}
              </>
            ) : (
              <div className="error-screen">
                <h3>Lỗi hiển thị dữ liệu</h3>
                <button onClick={() => setViewMode("history")}>Back</button>
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
