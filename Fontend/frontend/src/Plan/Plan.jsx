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
import scheduleData from "../Output/schedule.json";

const Plan = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isResultShown, setIsResultShown] = useState(false);
  const [searchIteration, setSearchIteration] = useState(0);
  const [planData, setPlanData] = useState(null);
  const [tryCount, setTryCount] = useState(3);
  const [lastRequestData, setLastRequestData] = useState(null);
  const [initialTotalItems, setInitialTotalItems] = useState(0);

  // FIXED: Added the missing state definition here
  const [totalDiff, setTotalDiff] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });

  const { translate } = useLanguage();
  const navigate = useNavigate();

  const countTotalItems = (plan) => {
    const sections = plan?.tripSections || plan?.trip_sections;
    if (!sections) return 0;

    let count = 0;
    sections.forEach((section) => {
      // Kiểm tra cả tripDetails và trip_details
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
    // console.log("Set total và rejected", stats);
  }, []);

  const callMakePlanApi = useCallback(
    async (data) => {
      if (!data) {
        console.warn("Dữ liệu đầu vào rỗng, hủy gọi API.");
        return;
      }
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
      // Reset diff when making a new plan
      setTotalDiff(0);

      try {
        const currentToken = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/make",
          data,
          { headers }
        );

        console.log("Kết quả từ Backend:", response.data);
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

  const callRegeneratePartAPI = useCallback(
    async (currentPlan, rejectedItems) => {
      setIsSearching(true);

      // LOG: Kiểm tra xem Output gửi đúng chưa
      console.log("Danh sách nhận từ Output (Đã chuẩn hóa):", rejectedItems);

      // Vì Output đã map đúng tên key (id, googlePlaceId) nên ở đây lấy dùng luôn
      // Chỉ cần filter bỏ các item null/undefined cho an toàn
      const payloadDetail = rejectedItems.filter(
        (item) => item && item.id && item.googlePlaceId
      );

      // Kiểm tra nếu danh sách rỗng thì chặn lại ngay
      if (payloadDetail.length === 0) {
        console.error("Lỗi: Danh sách rejected không hợp lệ hoặc rỗng");
        alert("Không tìm thấy thông tin địa điểm để tái tạo.");
        setIsSearching(false);
        return;
      }

      const planToSend = currentPlan || scheduleData;
      const payload = {
        current_trip_plan: planToSend, // Lấy từ file json import
        rejected_detail: payloadDetail,
      };

      console.log("Đã có schedule:", planToSend);
      console.log("Payload gửi đi:", payload);

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
        const newTripData =
          response.data.newTrip || response.data.currentTrip || response.data;

        setPlanData(newTripData);
        setSearchIteration((prev) => prev + 1);
      } catch (error) {
        handleAPIError(error);
      } finally {
        setIsSearching(false);
      }
      console.log(setPlanData);
    },
    []
  );

  const handleSearch = useCallback(
    (requestData) => {
      console.log("Nhận dữ liệu từ Input:", requestData);
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

      // FIX: Lấy tổng số item chuẩn. Nếu initialTotalItems = 0 thì tính lại từ planData hiện tại
      let total = initialTotalItems;
      if (total === 0 && planData) {
        total = countTotalItems(planData);
      }

      // Nếu vẫn bằng 0 (trường hợp lỗi) thì fallback về cách cũ
      if (total === 0) {
        total = outputStats.total + rejectedCount;
      }

      const threshold = total / 2;

      // Logic so sánh: Rejected phải LỚN HƠN 50% thì mới make plan
      // Ví dụ: 11/22 = 50% -> Không lớn hơn -> Regenerate Part
      // Ví dụ: 12/22 > 50% -> Lớn hơn -> Make Plan
      const isOver50Percent = rejectedCount > threshold;

      console.log(
        `Retry Logic: Total=${total}, Rejected=${rejectedCount}, Threshold=${threshold}, Over50%=${isOver50Percent}`
      );

      if (isOver50Percent) {
        let requestToUse = lastRequestData;

        // Nếu state null, thử tìm trong localStorage
        if (!requestToUse) {
          const savedRequest = localStorage.getItem("lastRequestData");
          if (savedRequest) {
            requestToUse = JSON.parse(savedRequest);
          }
        }

        if (requestToUse) {
          callMakePlanApi(requestToUse);
        } else {
          alert(
            "Vui lòng thực hiện tìm kiếm lại từ đầu để có dữ liệu tạo lịch trình!"
          );
        }
      } else {
        console.log("Tiến hành gọi Regenerate Part API..."); // Thêm log này để debug

        // Gọi hàm callRegeneratePartAPI
        // Tham số 1: planData hiện tại (để làm current_trip_plan)
        // Tham số 2: rejectedItems (danh sách địa điểm bị từ chối)
        callRegeneratePartAPI(planData, rejectedItems);
      }
    },
    [
      tryCount,
      planData,
      lastRequestData,
      initialTotalItems, // Đảm bảo dependency này có mặt
      outputStats,
      callMakePlanApi,
      callRegeneratePartAPI,
    ]
  );

  const handleAccept = useCallback(() => {
    if (planData) {
      console.log("Chấp nhận lịch trình:", planData);
      navigate("/currentplan", { state: { finalPlan: planData } });
    }
  }, [navigate, planData]);

  return (
    <div>
      {/* Now totalDiff is defined and can be displayed */}
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

        {/* Note: Ensure Output receives onStatsChange */}
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
