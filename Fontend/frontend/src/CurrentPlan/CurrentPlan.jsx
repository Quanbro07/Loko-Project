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
import axios from "axios";

const CurrentPlan = () => {
  const { translate } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. NHẬN DỮ LIỆU TỪ TRANG PLAN (qua location.state)
  const receivedPlan = location.state?.finalPlan;

  // State lưu dữ liệu chuyến đi
  const [tripData, setTripData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý UI
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [routeData, setRouteData] = useState(null);

  // --- HÀM GỌI API KHI RELOAD ---
  const fetchTripById = async (tripId) => {
    try {
      console.log(`🔄 Reload: Đang tải lại Trip ID: ${tripId}...`);
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        "http://localhost:8080/api/v1/trip/get",
        { params: { tripId: tripId }, headers: headers }
      );

      console.log("✅ Dữ liệu tải lại thành công:", response.data);

      // Xử lý Trip Data
      const fetchedTrip = response.data;
      setTripData(fetchedTrip);

      // --- XỬ LÝ ROUTE DATA ---
      // Nếu API /trip/get trả về kèm route (lý tưởng), ta dùng nó.
      // Nếu không (thường gặp), ta set null => Map sẽ tự vẽ đường thẳng (fallback).
      if (fetchedTrip.route || response.data.route) {
        setRouteData(fetchedTrip.route || response.data.route);
      } else {
        console.warn(
          "⚠️ API /trip/get không trả về 'route'. Map sẽ dùng chế độ vẽ đường thẳng."
        );
        setRouteData(null);
      }
    } catch (error) {
      console.error("❌ Lỗi tải lại dữ liệu:", error);
      // Nếu lỗi 403/401 thì có thể logout user tại đây
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECT: KHỞI TẠO DỮ LIỆU ---
  useEffect(() => {
    const initData = async () => {
      // TRƯỜNG HỢP 1: Có dữ liệu từ trang Plan chuyển sang (Vừa bấm Accept)
      if (receivedPlan) {
        console.log("🌟 Dữ liệu từ State (Mới tạo):", receivedPlan);

        let extractedTrip = null;
        let extractedRoute = null;
        let extractedWeather = null;
        // Xử lý cấu trúc MakePlanResponse vs TripResponse
        if (receivedPlan.tripPlan || receivedPlan.trip_plan) {
          extractedTrip = receivedPlan.tripPlan || receivedPlan.trip_plan;
          extractedRoute = receivedPlan.route;
          extractedWeather = receivedPlan.weather;
        } else if (receivedPlan.tripSections || receivedPlan.trip_sections) {
          extractedTrip = receivedPlan;
        }

        if (extractedTrip) {
          setTripData(extractedTrip);
          setRouteData(extractedRoute);

          // Xử lý Weather Data
          if (extractedWeather) {
            console.log("🌦️ Đã nhận được Weather Data:", extractedWeather);
            setWeatherData(extractedWeather);
            // Lưu vào localStorage để reload không bị mất
            localStorage.setItem(
              "currentWeatherData",
              JSON.stringify(extractedWeather)
            );
          } else {
            setWeatherData(null);
          }

          // Lưu Trip ID
          const tId = extractedTrip.tripId || extractedTrip.trip_id;
          if (tId) {
            localStorage.setItem("currentTripId", tId);
          }

          setIsLoading(false);
          return;
        }
      }

      // TRƯỜNG HỢP 2: Reload trang (State mất) -> Tìm ID trong LocalStorage
      console.log("🔄 Không thấy State, tìm ID trong LocalStorage...");
      const savedTripId = localStorage.getItem("currentTripId");
      const savedWeather = localStorage.getItem("currentWeatherData");
      if (savedWeather) {
        try {
          setWeatherData(JSON.parse(savedWeather));
        } catch (e) {
          console.error("Lỗi parse weather", e);
        }
      }

      if (savedTripId) {
        await fetchTripById(savedTripId);
      } else {
        console.warn("⚠️ Không tìm thấy dữ liệu nào.");
        setIsLoading(false);
      }
    };

    initData();
  }, [receivedPlan, navigate]);

  // --- LOGIC TÍNH TOÁN DỮ LIỆU ---

  // 1. ID chuyến đi
  const tripId = tripData?.tripId || tripData?.trip_id;

  // 2. Danh sách các ngày
  const tripSections = useMemo(() => {
    return tripData?.tripSections || tripData?.trip_sections || [];
  }, [tripData]);

  // 3. Lịch trình ngày hiện tại
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
        const lat = parseFloat(place.location?.latitude || place.latitude);
        const lng = parseFloat(place.location?.longitude || place.longitude);
        const name =
          place.location?.location_name || place.title || place.locationName;

        return {
          name: name,
          lat: lat,
          lng: lng,
        };
      })
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));
  }, [scheduleForCurrentDay]);

  const handleDayChange = (newIndex) => {
    console.log("Chuyển sang ngày index:", newIndex);
    setCurrentDayIndex(newIndex);
    setCurrentPlaceIndex(0);
  };

  if (isLoading) {
    return <div className="loading-screen">Đang tải dữ liệu chuyến đi...</div>;
  }

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

          {/* WeatherForecast */}
          <div className="weather-section-below">
            <WeatherForecast
              currentDayIndex={currentDayIndex}
              data={weatherData}
            />
          </div>
        </div>

        {/* Hiển thị CurrentPlace và Map */}
        {scheduleForCurrentDay.length > 0 ? (
          <>
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
