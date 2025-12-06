import "./CurrentPlan.css";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { useLanguage } from "../Language/LanguageContext";
import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import hooks điều hướng
import MyLeafletMap from "../Map/MyLeafletMap";
import OutputReal from "../OutputReal/OutputReal";
import CurrentPlace from "../CurrentPlace/CurrentPlace";
import WeatherForecast from "../WeatherForecast/WeatherForecast";
import axios from "axios";

const CurrentPlan = () => {
  const { translate } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // 🌟 1. NHẬN DỮ LIỆU TỪ TRANG PLAN (qua location.state) 🌟
  // finalPlan cấu trúc: { tripPlan: {...}, route: {...}, pdf: {...} }
  const receivedPlan = location.state?.finalPlan;

  // State lưu dữ liệu chuyến đi
  const [tripData, setTripData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý UI
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [routeData, setRouteData] = useState(null);

  // --- EFFECT: KHỞI TẠO DỮ LIỆU ---
  useEffect(() => {
    if (receivedPlan) {
      console.log("CurrentPlan received data:", receivedPlan);
      let extractedTrip = null;
      let extractedRoute = null;
      if (receivedPlan.tripPlan || receivedPlan.trip_plan) {
        extractedTrip = receivedPlan.tripPlan || receivedPlan.trip_plan;
        extractedRoute = receivedPlan.route;
      } else if (receivedPlan.tripSections || receivedPlan.trip_sections) {
        extractedTrip = receivedPlan;
      }

      if (extractedTrip) {
        setTripData(extractedTrip);
        setRouteData(extractedRoute);
        setWeatherData(null);
        setIsLoading(false);
      } else {
        console.warn("Data structure not recognized");
        setIsLoading(false);
      }
    } else {
      console.warn("No state received in location!");
      setIsLoading(false);
    }
  }, [receivedPlan, navigate]);

  // --- LOGIC TÍNH TOÁN DỮ LIỆU (Dựa trên tripData state) ---

  // 1. ID chuyến đi
  const tripId = tripData?.tripId || tripData?.trip_id;

  // 2. Danh sách các ngày (Trip Sections)
  const tripSections = useMemo(() => {
    // Kiểm tra cả snake_case và camelCase
    return tripData?.tripSections || tripData?.trip_sections || [];
  }, [tripData]);

  // 3. Lấy lịch trình của ngày ĐANG CHỌN
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

  // 4. Tạo Markers cho Map
  const itineraryPoints = useMemo(() => {
    return scheduleForCurrentDay
      .map((place) => {
        const lat = place.location?.latitude || place.latitude;
        const lng = place.location?.longitude || place.longitude;
        const name =
          place.location?.location_name || place.title || place.locationName;

        return {
          name: name,
          lat: lat,
          lng: lng,
        };
      })
      .filter((p) => p.lat && p.lng);
  }, [scheduleForCurrentDay]);

  // Reset slider khi đổi ngày
  const handleDayChange = (newIndex) => {
    console.log("Chuyển sang ngày index:", newIndex);
    setCurrentDayIndex(newIndex);
    setCurrentPlaceIndex(0);
  };

  if (isLoading) {
    return <div className="loading-screen">Đang tải dữ liệu chuyến đi...</div>;
  }

  // Nếu không có dữ liệu tripData sau khi load xong
  if (!tripData) {
    return (
      <div className="error-screen">
        <Navbar />
        <div className="body-error">
          <h3 className="alert-error">Chưa có dữ liệu chuyến đi.</h3>
          <button onClick={() => navigate("/search")} className="get-started">
            Lên kế hoạch
          </button>
        </div>
        <Footer />
      </div>
    );
  }
  if (isLoading) return <div className="loading-screen">Loading...</div>;
  if (!tripData) return <div className="error-screen">No Data Found</div>;

  return (
    <div>
      <Navbar />
      <div className="body-container">
        <div className="plan-dashboard-wrapper">
          {/* OutputReal: Hiển thị bảng lịch trình */}
          <div className="plan-list-section">
            <OutputReal
              currentDayIndex={currentDayIndex}
              setCurrentDayIndex={handleDayChange}
              tripSections={tripSections}
              tripId={tripId}
            />
          </div>

          {/* WeatherForecast: Hiển thị thời tiết */}
          {/* Nếu WeatherForecast chưa nhận data động, nó vẫn dùng file json cũ (fallback) 
                        hoặc bạn cần sửa WeatherForecast để nhận prop `weatherData` */}
          <div className="weather-section-below">
            <WeatherForecast
              currentDayIndex={currentDayIndex}
              // data={weatherData} // <-- Bỏ comment khi WeatherForecast đã sẵn sàng nhận prop
            />
          </div>
        </div>

        {/* Hiển thị CurrentPlace và Map */}
        {scheduleForCurrentDay.length > 0 ? (
          <>
            <div className="current-plan-content">
              {/* CurrentPlace: Slider chi tiết */}
              <CurrentPlace
                scheduleData={scheduleForCurrentDay}
                currentIndex={currentPlaceIndex}
                setCurrentIndex={setCurrentPlaceIndex}
              />

              {/* Map: Bản đồ */}
              <MyLeafletMap
                itineraryPoints={itineraryPoints}
                currentIndex={currentPlaceIndex}
                currentDayIndex={currentDayIndex}
                routeData={routeData}
              />
            </div>
          </>
        ) : (
          <div className="current-plan-empty-state">
            <h3>
              {translate("currentplace_no_plan") ||
                "Chưa có dữ liệu cho ngày này."}
            </h3>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CurrentPlan;
