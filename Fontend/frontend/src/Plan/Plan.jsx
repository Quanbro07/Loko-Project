import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import "./Plan.css";
import React, { useState, useCallback } from "react";
import Lottie from "lottie-react";
import paperPlaneAnimation from "../lottie/Paper plane.json";
import Output from "../Output/Output";
import Footer from "../Footer/Footer";
import { useLanguage } from "../Language/LanguageContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Plan = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isResultShown, setIsResultShown] = useState(false);
  const [searchIteration, setSearchIteration] = useState(0);
  const [planData, setPlanData] = useState(null); // Dữ liệu thật sẽ nằm ở đây
  const [tryCount, setTryCount] = useState(3);
  const [lastRequestData, setLastRequestData] = useState(null);
  const [initialTotalItems, setInitialTotalItems] = useState(0);

  const [totalDiff, setTotalDiff] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });

  const { translate } = useLanguage();
  const navigate = useNavigate();

  const countTotalItems = (plan) => {
    // Xử lý linh hoạt cả camelCase (Frontend) và snake_case (Backend)
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
      const data = error.response.data;
      msg = `Lỗi ${error.response.status}: ${
        data?.message || data?.error || JSON.stringify(data)
      }`;
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
      if (!data) {
        console.warn("Dữ liệu đầu vào rỗng.");
        return;
      }
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
      setTotalDiff(0);

      try {
        const currentToken = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;

        // Gọi API Make Plan
        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/make",
          data,
          { headers }
        );

        console.log("Make Plan Success:", response.data);
        
        // Cập nhật State bằng dữ liệu thật từ API
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
    [translate]
  );

  // --- API 2: TÁI TẠO LỊCH TRÌNH (Regenerate) ---
  const callRegeneratePartAPI = useCallback(
    async (current_trip_plan, rejected_detail) => {
      setIsSearching(true);

      console.log("Rejected List:", rejected_detail);

      const payloadDetail = rejected_detail.filter(
        (item) => item && item.id && item.googlePlaceId
      );
      // if (payloadDetail.length === 0) {
      //   alert("Không tìm thấy thông tin địa điểm để tái tạo.");
      //   setIsSearching(false);
      //   return;
      // }

      // 2. SỬA QUAN TRỌNG: Chỉ dùng currentPlan (Dữ liệu thật), bỏ scheduleData
      const planToSend = current_trip_plan; 

      if (!planToSend) {
          alert("Lỗi: Không có dữ liệu lịch trình hiện tại để tái tạo.");
          setIsSearching(false);
          return;
      }

      const payload = {
        current_trip_plan: planToSend,
        rejected_detail: payloadDetail,
      };



      console.log("Regenerate Payload:", payload);

      try {
        const currentToken = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/regenerate-part",
          payload,
          { headers }
        );

        console.log("Regenerate Success:", response.data);
        
        // API có thể trả về cấu trúc khác nhau tùy backend, kiểm tra kỹ
        const newTripData = response.data.new_trip_plan

        setPlanData(newTripData); // Cập nhật lại giao diện với dữ liệu mới
        setSearchIteration((prev) => prev + 1);
      } catch (error) {
        handleAPIError(error);
      } finally {
        setIsSearching(false);
      }
    },
    []
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
        // Nếu xóa quá nhiều -> Gọi lại Make Plan (Tạo mới hoàn toàn)
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
        // Nếu xóa ít -> Gọi Regenerate Part (Chỉ bù đắp phần thiếu)
        console.log("Rejected <= 50% -> Gọi Regenerate Part");
        callRegeneratePartAPI(planData, rejectedItems); // planData ở đây chắc chắn là dữ liệu từ API trước đó
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

  const handleAccept = useCallback(() => {
    if (planData) {
      console.log("Chấp nhận và chuyển trang:", planData);
      // Chuyển sang trang CurrentPlan với dữ liệu thật
      navigate("/currentplan", { state: { finalPlan: planData } });
    }
  }, [navigate, planData]);

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

        {/* Chỉ hiện Output khi có planData thật sự */}
        {!isSearching && isResultShown && planData && (
          <Output
            key={searchIteration}
            data={planData} // Truyền dữ liệu thật vào đây
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