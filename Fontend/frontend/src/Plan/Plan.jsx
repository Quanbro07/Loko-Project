import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import "./Plan.css";
import React, { useState, useCallback } from "react";
import Lottie from "lottie-react";
import paperPlaneAnimation from "../lottie/Paper plane.json";
import Output from "../Output/Output";
import Footer from "../Footer/Footer";
import { useLanguage } from "../Language/LanguageContext";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Plan = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isResultShown, setIsResultShown] = useState(false);
  const [searchIteration, setSearchIteration] = useState(0);
  const [planData, setPlanData] = useState(null);
  const [tryCount, setTryCount] = useState(3);
  const [lastRequestData, setLastRequestData] = useState(null);
  const [initialTotalItems, setInitialTotalItems] = useState(0);

  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });

  // 1. THÊM STATE MỚI: Lưu trữ danh sách tích lũy các địa điểm đã xóa qua các lần
  const [allRejectedItems, setAllRejectedItems] = useState([]); 

  const { translate } = useLanguage();
  const navigate = useNavigate();
  const { token } = useAuth();

  const countTotalItems = (plan) => {
    const sections = plan?.tripSections || plan?.trip_sections;
    if (!sections) return 0;
    let count = 0;
    sections.forEach((section) => {
      const details = section.tripDetails || section.trip_details || [];
      count += details.length;
    });
    return count;
  };

  const handleAPIError = (error) => {
    console.error("API Error:", error);
    let msg = "Có lỗi xảy ra";
    if (error.response) {
      if (error.response.status === 403) {
        msg = "Phiên đăng nhập hết hạn hoặc không đủ quyền. Vui lòng đăng nhập lại.";
      } else {
        const data = error.response.data;
        msg = `Lỗi ${error.response.status}: ${
          data?.message || data?.error || JSON.stringify(data)
        }`;
      }
    } else if (error.request) {
      msg = "Không thể kết nối đến Server";
    }
    alert(msg);
  };

  const handleStatsUpdate = useCallback((stats) => {
    setOutputStats(stats);
  }, []);

  // --- API 1: TẠO KẾ HOẠCH MỚI ---
  const callMakePlanApi = useCallback(
    async (data) => {
      if (!data) return;
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
      
      // 2. RESET KHI TÌM KIẾM MỚI: Xóa sạch lịch sử cũ
      setAllRejectedItems([]); 

      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/make",
          data,
          { headers }
        );

        const newPlanData = response.data;
        setPlanData(newPlanData);
        setInitialTotalItems(countTotalItems(newPlanData));
        setIsResultShown(true);
        setSearchIteration((prev) => prev + 1);
      } catch (error) {
        handleAPIError(error);
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // --- API 2: TÁI TẠO LỊCH TRÌNH ---
  const callRegeneratePartAPI = useCallback(
    async (current_trip_plan, rejected_detail) => {
      setIsSearching(true);

      // Log để kiểm tra xem danh sách có cộng dồn không
      console.log("🔥 Gửi đi danh sách TỔNG các địa điểm bị xóa:", rejected_detail.length, "items", rejected_detail);

      const payloadDetail = rejected_detail.filter(
        (item) => item && item.trip_detail_id && item.location_id
      );
      const planToSend = current_trip_plan;
      if (!planToSend) {
        alert("Lỗi dữ liệu.");
        setIsSearching(false);
        return;
      }

      const payload = {
        current_trip_plan: planToSend,
        rejected_detail: payloadDetail,
      };

      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/regenerate-part",
          payload,
          { headers }
        );

        const newTripData = response.data.newTrip || response.data.new_trip_plan || response.data;
        setPlanData(newTripData);
        setSearchIteration((prev) => prev + 1);
      } catch (error) {
        handleAPIError(error);
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  const handleSearch = useCallback(
    (requestData) => {
      setLastRequestData(requestData);
      localStorage.setItem("lastRequestData", JSON.stringify(requestData));
      setTryCount(3);
      callMakePlanApi(requestData);
    },
    [callMakePlanApi]
  );

  // 3. SỬA LOGIC THỬ LẠI: CỘNG DỒN DANH SÁCH XÓA
  const handleTryAgain = useCallback(
    (newRejectedItems = []) => {
      if (tryCount <= 0) return;
      setTryCount((prev) => prev - 1);

      // --- BƯỚC CỘNG DỒN ---
      // Lấy danh sách cũ + danh sách mới vừa chọn
      const updatedTotalRejected = [...allRejectedItems, ...newRejectedItems];
      
      // Lưu lại vào state để dùng cho lần sau
      setAllRejectedItems(updatedTotalRejected);

      // Tính toán ngưỡng 50% dựa trên tổng số lượng item đã xóa tích lũy
      const totalRejectedCount = updatedTotalRejected.length;
      let total = initialTotalItems;
      if (total === 0 && planData) total = countTotalItems(planData);
      if (total === 0) total = outputStats.total + totalRejectedCount;

      const threshold = total / 2;
      const isOver50Percent = totalRejectedCount > threshold;

      console.log(`Retry: Total Rejected Accumulative=${totalRejectedCount}/${total}`);

      if (isOver50Percent) {
        let requestToUse = lastRequestData;
        if (!requestToUse) {
          const savedRequest = localStorage.getItem("lastRequestData");
          if (savedRequest) requestToUse = JSON.parse(savedRequest);
        }

        if (requestToUse) {
          console.log("Rejected > 50% -> Gọi Make Plan lại từ đầu");
          // Khi gọi lại Make Plan, nhớ reset luôn list đã xóa (đã xử lý trong callMakePlanApi)
          callMakePlanApi(requestToUse);
        } else {
          alert("Vui lòng thực hiện tìm kiếm lại từ đầu!");
        }
        if (requestToUse) callMakePlanApi(requestToUse);
        else alert("Vui lòng thực hiện tìm kiếm lại từ đầu!");
      } else {
        console.log("Rejected <= 50% -> Gọi Regenerate Part với DANH SÁCH TỔNG");
        // QUAN TRỌNG: Gửi danh sách TỔNG (updatedTotalRejected) đi API
        callRegeneratePartAPI(planData, updatedTotalRejected); 
      }
    },
    [
      tryCount,
      planData,
      lastRequestData,
      initialTotalItems,
      outputStats,
      allRejectedItems, // Thêm dependency này
      callMakePlanApi,
      callRegeneratePartAPI,
    ]
  );

  // --- API 3: XÁC NHẬN KẾ HOẠCH (ACCEPT) ---
  const handleAccept = useCallback(async () => {
    if (!planData) { alert("Chưa có kế hoạch!"); return; }
    let inputData = lastRequestData;
    if (!inputData) {
      try {
        const saved = localStorage.getItem("lastRequestData");
        if (saved) inputData = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    if (!inputData) { alert("Thiếu dữ liệu."); return; }

    // Lấy user id từ local storage (để tránh gửi null)
    let currentUserId = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        currentUserId = userObj.id || userObj.userId || userObj.user_id;
      }
    } catch (e) {}

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const weatherRequestPayload = {
        provinceId: inputData.provinceId || 0,
        provinceName: inputData.province,
        startDate: inputData.startDate,
        endDate: inputData.endDate,
        fromOperateTime: (inputData.fromOperateTime || "08:00").substring(0, 5),
        toOperateTime: (inputData.toOperateTime || "22:00").substring(0, 5),
      };

      const tripRequestPayload = {
        tripName: planData.tripName || `Chuyến đi ${inputData.province}`,
        startDate: inputData.startDate,
        endDate: inputData.endDate,
        fromOperationTime: weatherRequestPayload.fromOperateTime + ":00",
        toOperationTime: weatherRequestPayload.toOperateTime + ":00",
        numAdult: inputData.numAdults || 1,
        numChild: inputData.numChildren || 0,
        numElder: inputData.numElders || 0,
        tripSections: (planData.tripSections || []).map((section, index) => {
          const baseDate = new Date(inputData.startDate);
          baseDate.setDate(baseDate.getDate() + index);
          const dateString = baseDate.toISOString().split("T")[0];
          return {
            dayNumber: section.dayNumber,
            date: section.date,
            title: section.title || `Ngày ${index + 1}`,
            tripDetails: (section.tripDetails || []).map((detail) => ({
              startTime: (detail.startTime || "08:00").substring(0, 5),
              endTime: (detail.endTime || "09:00").substring(0, 5),
              activity: detail.activity || detail.description || "Tham quan",
              description: detail.description || "",
              price: detail.price || 0,
              location: {
        id: detail.location.id
    }
            }))
          };
        }),
      };

      const payload = { trip_request: tripRequestPayload, weather_request: weatherRequestPayload };
      const response = await axios.post("http://localhost:8080/api/v1/make-plan/confirm", payload, { headers });
      const confirmedTrip = response.data.trip || response.data; 
      navigate("/currentplan", { state: { finalPlan: confirmedTrip } });

    } catch (error) {
      handleAPIError(error);
    }
  }, [navigate, planData, lastRequestData, token]);

  return (
    <div>
      <div className="homepage-background">
        <Navbar />
        <Input onSearch={handleSearch} isResultShown={isResultShown} searchIteration={searchIteration} />
      </div>
      <div className="itinerary-results-container">
        {isSearching && (
          <div className="loading-animation-container">
            <Lottie animationData={paperPlaneAnimation} loop={true} />
          </div>
        )}
        {!isSearching && isResultShown && planData && (
          <Output
            key={searchIteration}
            data={planData}
            tryCount={tryCount}
            onTryAgainClick={handleTryAgain}
            onAcceptClick={handleAccept}
            onStatsChange={handleStatsUpdate}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Plan;