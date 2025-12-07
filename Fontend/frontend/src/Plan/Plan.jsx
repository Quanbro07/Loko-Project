import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import "./Plan.css";
import React, { useState, useCallback } from "react";
import Lottie from "lottie-react";
import paperPlaneAnimation from "../lottie/Paper plane.json";
import Output from "../Output/Output";
import Footer from "../Footer/Footer";
import { useLanguage } from "../Language/LanguageContext";
import { useAuth } from "../Auth/AuthContext"; // Import useAuth
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

  const [totalDiff, setTotalDiff] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });

  const { translate } = useLanguage();
  const navigate = useNavigate();
  const { token } = useAuth(); // Lấy token từ Context

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

  // --- API 1: TẠO KẾ HOẠCH MỚI (MAKE PLAN) ---
  const callMakePlanApi = useCallback(
    async (data) => {
      if (!data) {
        console.warn("Dữ liệu đầu vào rỗng.");
        return;
      }
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
      setTotalDiff(0);

      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/make",
          data,
          { headers }
        );

        console.log("Make Plan Success:", response.data);
        const newPlanData = response.data;
        setPlanData(newPlanData);
        
        const total = countTotalItems(newPlanData);
        setInitialTotalItems(total);
        console.log("Tổng số địa điểm:", total);
        
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

  // --- API 2: TÁI TẠO LỊCH TRÌNH (REGENERATE) ---
  const callRegeneratePartAPI = useCallback(
    async (current_trip_plan, rejected_detail) => {
      setIsSearching(true);

      console.log("Rejected List nhận được:", rejected_detail);

      // Lọc danh sách rejected, đảm bảo đúng key mà Backend yêu cầu (trip_detail_id, location_id)
      const payloadDetail = rejected_detail.filter(
        (item) => item && item.trip_detail_id && item.location_id
      );

      // Code cũ của bạn có check length, nếu muốn có thể giữ lại:
      // if (payloadDetail.length === 0) { ... }

      const planToSend = current_trip_plan;

      if (!planToSend) {
        alert("Lỗi: Không có dữ liệu lịch trình hiện tại để tái tạo.");
        setIsSearching(false);
        return;
      }

      const payload = {
        current_trip_plan: planToSend, // Khớp @JsonProperty("current_trip_plan")
        rejected_detail: payloadDetail, // Khớp @JsonProperty("rejected_detail")
      };

      console.log("Regenerate Payload:", JSON.stringify(payload, null, 2));

      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/regenerate-part",
          payload,
          { headers }
        );

        console.log("Regenerate Success:", response.data);

        // Map kết quả trả về
        const newTripData = 
            response.data.newTrip || 
            response.data.new_trip_plan || 
            response.data;

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
      console.log("Search Request:", requestData);
      setLastRequestData(requestData);
      localStorage.setItem("lastRequestData", JSON.stringify(requestData));
      setTryCount(3);
      callMakePlanApi(requestData);
    },
    [callMakePlanApi]
  );

  const handleTryAgain = useCallback(
    (rejectedItems = []) => {
      if (tryCount <= 0) return;

      setTryCount((prev) => prev - 1);

      const rejectedCount = rejectedItems.length;
      let total = initialTotalItems;
      
      if (total === 0 && planData) {
        total = countTotalItems(planData);
      }
      if (total === 0) {
        total = outputStats.total + rejectedCount;
      }

      const threshold = total / 2;
      const isOver50Percent = rejectedCount > threshold;

      console.log(`Retry: Rejected=${rejectedCount}/${total}`);

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
        // Gọi Regenerate API với planData hiện tại và danh sách bị xóa
        callRegeneratePartAPI(planData, rejectedItems); 
      }
    },
    [
      tryCount,
      planData,
      lastRequestData,
      initialTotalItems,
      outputStats,
      callMakePlanApi,
      callRegeneratePartAPI,
    ]
  );

  // --- API 3: XÁC NHẬN VÀ LƯU (CONFIRM) ---
  const handleAccept = useCallback(async () => {
    if (!planData) {
        alert("Chưa có kế hoạch!");
        return;
    }

    // Lấy lại input data để gửi kèm thông tin weather, số người
    let inputData = lastRequestData;
    if (!inputData) {
      const saved = localStorage.getItem("lastRequestData");
      if (saved) inputData = JSON.parse(saved);
    }

    if (!inputData) {
      alert("Thiếu dữ liệu đầu vào (Input Data). Vui lòng tìm kiếm lại.");
      return;
    }

    try {
      console.log("🛠 Đang chuẩn bị Confirm...");

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Weather Request
      const weatherRequestPayload = {
        provinceId: inputData.provinceId || 0,
        provinceName: inputData.province,
        startDate: inputData.startDate,
        endDate: inputData.endDate,
        fromOperateTime: (inputData.fromOperateTime || "08:00").substring(0, 5),
        toOperateTime: (inputData.toOperateTime || "22:00").substring(0, 5),
      };

      // 2. Trip Request
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
            dayNum: section.dayNumber || index + 1,
            date: dateString,
            title: section.title || `Ngày ${index + 1}`,
            tripDetails: (section.tripDetails || []).map((detail) => ({
              startTime: (detail.startTime || "08:00").substring(0, 5),
              endTime: (detail.endTime || "09:00").substring(0, 5),
              activity: detail.activity || detail.description || "Tham quan",
              description: detail.description || "",
              price: detail.price || 0,
              locationId: detail.location?.id
            }))
          };
        }),
      };

      // 3. Final Payload
      const payload = {
        trip_request: tripRequestPayload,
        weather_request: weatherRequestPayload,
      };

      console.log("Payload Confirm:", payload);

      const response = await axios.post(
        "http://localhost:8080/api/v1/make-plan/confirm",
        payload,
        { headers }
      );

      console.log("Confirm Success:", response.data);
      
      const confirmedTrip = response.data.trip || response.data; 
      navigate("/currentplan", { state: { finalPlan: confirmedTrip } });

    } catch (error) {
      console.error("Lỗi Confirm:", error);
      handleAPIError(error);
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