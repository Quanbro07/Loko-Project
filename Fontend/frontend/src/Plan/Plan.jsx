import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import "./Plan.css";
import React, { useState, useCallback, useEffect } from "react";
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

  // --- CẤU HÌNH GIỚI HẠN (CONFIG) ---
  const LIMIT_SEARCH_USER = 1;   // User thường: 1 lần tìm/ngày
  const LIMIT_SEARCH_VIP = 10;   // VIP: 10 lần tìm/ngày
  
  const LIMIT_RETRY_USER = 3;    // User thường: 3 lần thử lại
  const LIMIT_RETRY_VIP = 9999;  // VIP: Vô hạn (đặt số lớn)

  // --- STATE ---
  const [isSearching, setIsSearching] = useState(false);
  const [isResultShown, setIsResultShown] = useState(false);
  const [searchIteration, setSearchIteration] = useState(0);
  const [planData, setPlanData] = useState(null);
  
  // Khởi tạo số lần thử lại dựa trên quyền hạn
  const [tryCount, setTryCount] = useState(isVip ? LIMIT_RETRY_VIP : LIMIT_RETRY_USER);
  
  const [lastRequestData, setLastRequestData] = useState(null);
  const [initialTotalItems, setInitialTotalItems] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });
  const [allRejectedItems, setAllRejectedItems] = useState([]);

  // Cập nhật lại tryCount khi user đăng nhập/đổi quyền
  useEffect(() => {
      setTryCount(isVip ? LIMIT_RETRY_VIP : LIMIT_RETRY_USER);
  }, [isVip]);

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
        msg = `Lỗi ${error.response.status}: ${data?.message || data?.error || JSON.stringify(data)}`;
      }
    } else if (error.request) {
      msg = "Không thể kết nối đến Server";
    }
    alert(msg);
  };

  const handleStatsUpdate = useCallback((stats) => {
    setOutputStats(stats);
  }, []);

  // --- HÀM KIỂM TRA GIỚI HẠN TÌM KIẾM TRONG NGÀY ---
  const checkSearchLimit = () => {
    const today = new Date().toISOString().split('T')[0]; // Lấy ngày YYYY-MM-DD
    const storageKey = `search_cnt_${user?.id}_${today}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || "0");
    const maxLimit = isVip ? LIMIT_SEARCH_VIP : LIMIT_SEARCH_USER;

    if (currentCount >= maxLimit) {
        alert(`Bạn đã dùng hết ${currentCount}/${maxLimit} lượt tạo lịch trình hôm nay. ${!isVip ? 'Nâng cấp Premium để có thêm lượt!' : ''}`);
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

  // --- API 1: TẠO KẾ HOẠCH MỚI ---
  const callMakePlanApi = useCallback(
    async (data) => {
      if (!data) return;
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
      setAllRejectedItems([]); // Reset danh sách xóa

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
      console.log("🔥 Regenerate List:", rejected_detail);

      const payloadDetail = rejected_detail.filter(
        (item) => item && item.trip_detail_id && item.location_id
      );
      const planToSend = current_trip_plan;
      
      if (!planToSend) {
        alert("Lỗi dữ liệu plan.");
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

  // --- HANDLE SEARCH (KHI BẤM NÚT LÊN KẾ HOẠCH) ---
  const handleSearch = useCallback(
    (requestData) => {
      // 1. Kiểm tra giới hạn số lần tìm kiếm
      if (!checkSearchLimit()) return;

      // 2. Nếu OK -> Tăng số lần đã dùng
      incrementSearchCount();

      setLastRequestData(requestData);
      localStorage.setItem("lastRequestData", JSON.stringify(requestData));
      
      // 3. Reset số lần thử lại (User=3, VIP=9999)
      setTryCount(isVip ? LIMIT_RETRY_VIP : LIMIT_RETRY_USER);
      
      callMakePlanApi(requestData);
    },
    [callMakePlanApi, isVip, user]
  );

  // --- HANDLE TRY AGAIN (KHI BẤM NÚT TẠO LẠI) ---
  const handleTryAgain = useCallback(
    (newRejectedItems = []) => {
      // Kiểm tra số lượt còn lại
      if (tryCount <= 0) {
          alert(!isVip ? "Bạn đã hết lượt thử lại. Nâng cấp Premium để không giới hạn!" : "Đã đạt giới hạn hệ thống.");
          return;
      }

      // Giảm số lượt (Nếu là VIP thì không cần giảm, hoặc giảm từ số rất lớn)
      if (!isVip) {
          setTryCount((prev) => prev - 1);
      }
      // Nếu là VIP, ta có thể giữ nguyên số 9999 hoặc giảm cũng được vì nó quá lớn

      // Logic cộng dồn danh sách xóa
      const updatedTotalRejected = [...allRejectedItems, ...newRejectedItems];
      setAllRejectedItems(updatedTotalRejected);

      // Tính toán ngưỡng 50%
      const totalRejectedCount = updatedTotalRejected.length;
      let total = initialTotalItems;
      if (total === 0 && planData) total = countTotalItems(planData);
      if (total === 0) total = outputStats.total + totalRejectedCount;

      const threshold = total / 2;
      const isOver50Percent = totalRejectedCount > threshold;

      console.log(`Retry: Total Rejected=${totalRejectedCount}/${total}`);

      if (isOver50Percent) {
        let requestToUse = lastRequestData;
        if (!requestToUse) {
          const savedRequest = localStorage.getItem("lastRequestData");
          if (savedRequest) requestToUse = JSON.parse(savedRequest);
        }

        if (requestToUse) {
          console.log("Rejected > 50% -> Gọi Make Plan lại từ đầu");
          callMakePlanApi(requestToUse);
        } else {
          alert("Vui lòng thực hiện tìm kiếm lại từ đầu!");
        }
      } else {
        console.log("Rejected <= 50% -> Gọi Regenerate Part");
        callRegeneratePartAPI(planData, updatedTotalRejected);
      }
    },
    [
      tryCount,
      planData,
      lastRequestData,
      initialTotalItems,
      outputStats,
      allRejectedItems,
      callMakePlanApi,
      callRegeneratePartAPI,
      isVip 
    ]
  );

  // --- API 3: XÁC NHẬN (CONFIRM) ---
  const handleAccept = useCallback(async () => {
    if (!planData) { alert("Chưa có dữ liệu kế hoạch!"); return; }

    let inputData = lastRequestData;
    if (!inputData) {
      try {
        const saved = localStorage.getItem("lastRequestData");
        if (saved) inputData = JSON.parse(saved);
      } catch (e) {}
    }
    if (!inputData) { alert("Dữ liệu input bị mất."); return; }

    try {
      console.log("🛠 Đang Confirm...");
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
                      locationName: detail.location.location_name || detail.location.locationName || "",
                      latitude: detail.location.latitude || 0,
                      longitude: detail.location.longitude || 0
                  },
                  sequenceOrder: idx + 1
            }))
          };
        }),
      };

      const payload = { trip_request: tripRequestPayload, weather_request: weatherRequestPayload };
      console.log("JSON Confirm:", JSON.stringify(payload));

      const response = await axios.post("http://localhost:8080/api/v1/make-plan/confirm", payload, { headers });
      console.log("Success:", response.data);
      const confirmedTrip = response.data.trip || response.data; 
      navigate("/currentplan", { state: { finalPlan: confirmedTrip } });

    } catch (error) {
      console.error("Lỗi Confirm:", error);
      if (error.response && error.response.data) {
          alert("Lỗi Backend: " + JSON.stringify(error.response.data));
      } else { handleAPIError(error); }
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
            tryCount={tryCount} // Truyền số lần thử lại đã tính toán
            isVip={isVip}
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