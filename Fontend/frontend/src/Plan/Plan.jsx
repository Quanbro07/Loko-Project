import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import "./Plan.css";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import paperPlaneAnimation from "../lottie/Paper plane.json";
import Output from "../Output/Output";
import Footer from "../Footer/Footer";
import { useLanguage } from "../Language/LanguageContext";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Plan = () => {
  const { user, token } = useAuth();
  const isVip = user?.role === 'VIP' || user?.role === 'ADMIN';
  const { translate } = useLanguage();
  const navigate = useNavigate();

  // --- CẤU HÌNH GIỚI HẠN ---
  const LIMIT_SEARCH_USER = 1;
  const LIMIT_SEARCH_VIP = 10;
  const LIMIT_RETRY_USER = 3;
  const LIMIT_RETRY_VIP = 9999; 

  // --- STATE TOAST (THÔNG BÁO) ---
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const toastTimeoutRef = useRef(null); // Dùng ref để clear timeout tránh lỗi

  // --- STATE APP ---
  const [isSearching, setIsSearching] = useState(false);
  const [isResultShown, setIsResultShown] = useState(false);
  const [searchIteration, setSearchIteration] = useState(0);
  const [planData, setPlanData] = useState(null);
  const [tryCount, setTryCount] = useState(isVip ? LIMIT_RETRY_VIP : LIMIT_RETRY_USER);
  const [lastRequestData, setLastRequestData] = useState(null);
  const [initialTotalItems, setInitialTotalItems] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });
  const [allRejectedItems, setAllRejectedItems] = useState([]);

  useEffect(() => {
      setTryCount(isVip ? LIMIT_RETRY_VIP : LIMIT_RETRY_USER);
  }, [isVip]);

  // --- HÀM HIỂN THỊ TOAST ---
  const showToast = (message, type = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500); // Tự ẩn sau 3.5 giây
  };

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

  // --- XỬ LÝ LỖI API (Thay Alert bằng Toast) ---
  const handleAPIError = (error) => {
    console.error("API Error:", error);
    let msg = "Có lỗi xảy ra";
    if (error.response) {
      if (error.response.status === 403) {
        msg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else {
        const data = error.response.data;
        msg = `Lỗi ${error.response.status}: ${data?.message || data?.error || JSON.stringify(data)}`;
      }
    } else if (error.request) {
      msg = "Không thể kết nối đến Server";
    }
    showToast(msg, "error"); // <--- DÙNG TOAST ERROR
  };

  const handleStatsUpdate = useCallback((stats) => {
    setOutputStats(stats);
  }, []);

  const checkSearchLimit = () => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `search_cnt_${user?.id}_${today}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || "0");
    const maxLimit = isVip ? LIMIT_SEARCH_VIP : LIMIT_SEARCH_USER;

    if (currentCount >= maxLimit) {
        // <--- DÙNG TOAST WARNING
        showToast(`Bạn đã hết ${maxLimit} lượt tạo hôm nay. ${!isVip ? 'Nâng cấp Premium để có thêm!' : ''}`, "warning");
        return false;
    }
    return true;
  };

  const incrementSearchCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `search_cnt_${user?.id}_${today}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || "0");
    localStorage.setItem(storageKey, currentCount + 1);
  };

  // --- API 1: MAKE PLAN ---
  const callMakePlanApi = useCallback(
    async (data) => {
      if (!data) return;
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
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
        showToast("Đã tạo kế hoạch thành công!", "success"); // Toast success
      } catch (error) {
        handleAPIError(error);
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // --- API 2: REGENERATE ---
  const callRegeneratePartAPI = useCallback(
    async (current_trip_plan, rejected_detail) => {
      setIsSearching(true);
      const payloadDetail = rejected_detail.filter(
        (item) => item && item.trip_detail_id && item.location_id
      );
      const planToSend = current_trip_plan;
      
      if (!planToSend) {
        showToast("Lỗi dữ liệu plan.", "error");
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
        showToast("Đã cập nhật lịch trình mới!", "success");
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
      if (!checkSearchLimit()) return;
      incrementSearchCount();
      setLastRequestData(requestData);
      localStorage.setItem("lastRequestData", JSON.stringify(requestData));
      setTryCount(isVip ? LIMIT_RETRY_VIP : LIMIT_RETRY_USER);
      callMakePlanApi(requestData);
    },
    [callMakePlanApi, isVip, user]
  );

  const handleTryAgain = useCallback(
    (newRejectedItems = []) => {
      if (tryCount <= 0) {
          showToast(!isVip ? "Hết lượt thử lại. Nâng cấp Premium!" : "Hết lượt hệ thống.", "warning");
          return;
      }
      
      if (!isVip) {
          setTryCount((prev) => prev - 1);
      }

      const updatedTotalRejected = [...allRejectedItems, ...newRejectedItems];
      setAllRejectedItems(updatedTotalRejected);

      const totalRejectedCount = updatedTotalRejected.length;
      let total = initialTotalItems;
      if (total === 0 && planData) total = countTotalItems(planData);
      if (total === 0) total = outputStats.total + totalRejectedCount;

      const threshold = total / 2;
      const isOver50Percent = totalRejectedCount > threshold;

      if (isOver50Percent) {
        let requestToUse = lastRequestData;
        if (!requestToUse) {
          const savedRequest = localStorage.getItem("lastRequestData");
          if (savedRequest) requestToUse = JSON.parse(savedRequest);
        }
        if (requestToUse) {
            showToast("Thay đổi quá 50%, đang tạo lại từ đầu...", "info");
            callMakePlanApi(requestToUse);
        }
        else showToast("Vui lòng thực hiện tìm kiếm lại từ đầu!", "warning");
      } else {
        callRegeneratePartAPI(planData, updatedTotalRejected);
      }
    },
    [tryCount, planData, lastRequestData, initialTotalItems, outputStats, allRejectedItems, callMakePlanApi, callRegeneratePartAPI, isVip]
  );

  const handleAccept = useCallback(async () => {
    console.log("CODE MỚI ĐÃ CHẠY")
    if (!planData) { showToast("Chưa có dữ liệu kế hoạch!", "warning"); return; }
    let inputData = lastRequestData;
    if (!inputData) {
      try {
        const saved = localStorage.getItem("lastRequestData");
        if (saved) inputData = JSON.parse(saved);
      } catch (e) {}
    }
    if (!inputData) { showToast("Dữ liệu tìm kiếm bị mất.", "error"); return; }

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const fmtTime = (t) => (t && typeof t === 'string' && t.length >= 5) ? t.substring(0, 5) : "08:00";

      const weatherRequestPayload = {
        provinceId: Number(inputData.provinceId) || 0,
        provinceName: inputData.province || "",
        startDate: inputData.startDate,
        endDate: inputData.endDate,
        fromOperateTime: fmtTime(inputData.fromOperateTime),
        toOperateTime: fmtTime(inputData.toOperateTime),
      };

      const tripRequestPayload = {
        tripName: planData.tripName || `Chuyến đi ${inputData.province}`,
        startDate: inputData.startDate,
        endDate: inputData.endDate,
        fromOperationTime: fmtTime(inputData.fromOperateTime),
        toOperationTime: fmtTime(inputData.toOperateTime),
        numAdult: Number(inputData.numAdults) || 1,
        numChild: Number(inputData.numChildren) || 0,
        numElder: Number(inputData.numElders) || 0,
        tripSections: (planData.tripSections || []).map((section, index) => {
          let dateString = section.date;
          if (!dateString) {
             const baseDate = new Date(inputData.startDate);
             baseDate.setDate(baseDate.getDate() + index);
             dateString = baseDate.toISOString().split("T")[0];
          }
          return {
            dayNumber: Number(section.dayNumber) || (index + 1), 
            date: dateString,
            title: section.title || `Ngày ${index + 1}`,
            tripDetails: (section.tripDetails || []).filter(d => d.location && d.location.id).map((detail, idx) => ({
                  startTime: fmtTime(detail.startTime),
                  endTime: fmtTime(detail.endTime),
                  activity: detail.activity,
                  price: Number(detail.price) || 0,
                  description: detail.description || "",
                  location: {
                      id: Number(detail.location.id),
locationName: detail.location.locationName || detail.location.name || "Không tên",                      latitude: detail.location.latitude || 0,
                      longitude: detail.location.longitude || 0
                  },
                  sequenceOrder: idx + 1
            }))
          };
        }),
      };

      const payload = { trip_request: tripRequestPayload, weather_request: weatherRequestPayload };
      const response = await axios.post("http://localhost:8080/api/v1/make-plan/confirm", payload, { headers });
      
      const confirmedTrip = response.data.trip || response.data; 
      showToast("Xác nhận thành công! Đang chuyển trang...", "success");
      
      setTimeout(() => {
          navigate("/currentplan", { state: { finalPlan: confirmedTrip } });
      }, 1000); // Delay 1 chút để user kịp nhìn thấy toast success

    } catch (error) {
      console.error("Lỗi Confirm:", error);
      if (error.response && error.response.data) showToast("Lỗi Backend: " + JSON.stringify(error.response.data), "error");
      else handleAPIError(error);
    }
  }, [navigate, planData, lastRequestData, token]);

  return (
    <div>
      <div className="homepage-background">
        <Navbar />
        <Input
          onSearch={handleSearch}
          isResultShown={isResultShown}
          searchIteration={searchIteration}
        />
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
            isVip={isVip} 
            onTryAgainClick={handleTryAgain}
            onAcceptClick={handleAccept}
            onStatsChange={handleStatsUpdate}
          />
        )}
      </div>
      <Footer />

      {/* --- RENDER TOAST COMPONENT --- */}
      <div className={`toast-notification ${toast.show ? "show" : ""} ${toast.type}`}>
        {toast.message}
      </div>
    </div>
  );
};

export default Plan;