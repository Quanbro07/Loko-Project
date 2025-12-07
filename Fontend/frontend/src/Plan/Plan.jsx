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
  const [planData, setPlanData] = useState(null);
  const [tryCount, setTryCount] = useState(3);
  const [lastRequestData, setLastRequestData] = useState(null);
  const [initialTotalItems, setInitialTotalItems] = useState(0);

  const [totalDiff, setTotalDiff] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });

  const { translate } = useLanguage();
  const navigate = useNavigate();

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
      if (!data) return;
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);
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

        console.log("Make Plan Success:", response.data);
        const newPlanData = response.data;
        setPlanData(newPlanData);

        const total = countTotalItems(newPlanData);
        setInitialTotalItems(total);

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

  // --- API 2: TÁI TẠO LỊCH TRÌNH ---
  const callRegeneratePartAPI = useCallback(
    async (current_trip_plan, rejected_detail) => {
      setIsSearching(true);
      const payloadDetail = rejected_detail.filter(
        (item) => item && item.id && item.googlePlaceId
      );
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
        const newTripData = response.data.new_trip_plan;
        setPlanData(newTripData);
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
      if (total === 0 && planData) total = countTotalItems(planData);
      if (total === 0) total = outputStats.total + rejectedCount;

      const isOver50Percent = rejectedCount > total / 2;

      if (isOver50Percent) {
        let requestToUse = lastRequestData;
        if (!requestToUse) {
          const saved = localStorage.getItem("lastRequestData");
          if (saved) requestToUse = JSON.parse(saved);
        }
        if (requestToUse) callMakePlanApi(requestToUse);
        else alert("Vui lòng thực hiện tìm kiếm lại từ đầu!");
      } else {
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

  // --- API 3: XÁC NHẬN KẾ HOẠCH (ACCEPT) ---
  const handleAccept = useCallback(async () => {
    if (!planData) return;

    let inputData = lastRequestData;
    if (!inputData) {
      try {
        const saved = localStorage.getItem("lastRequestData");
        if (saved) inputData = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    if (!inputData) {
      alert("Thiếu dữ liệu đầu vào. Vui lòng tìm kiếm lại.");
      return;
    }

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
      console.log("🛠 Đang chuẩn bị dữ liệu Confirm...");
      const currentToken = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      };

      // 1. Xử lý Weather Request
      // Xử lý province name từ inputData (có thể là object hoặc string)
      console.log(inputData);
      let provinceValue = "";
      const rawProvince = inputData.province || inputData.province_id;
      if (typeof rawProvince === "object" && rawProvince !== null) {
        provinceValue = rawProvince.name || rawProvince.slug || "";
      } else {
        provinceValue = String(rawProvince || "");
      }
      // Chuyển về UPPERCASE để khớp Enum backend (VD: HaNoi -> HANOI)

      const weatherRequestPayload = {
        province: inputData.province, // Quan trọng: Phải khớp Enum Backend
        startDate: inputData.startDate || inputData.start_date,
        endDate: inputData.endDate || inputData.end_date,
        fromOperateTime: (
          inputData.fromTime ||
          inputData.from_time ||
          "08:00"
        ).substring(0, 5),
        toOperateTime: (
          inputData.toTime ||
          inputData.to_time ||
          "22:00"
        ).substring(0, 5),
      };

      // 2. Xử lý Trip Request
      const tripRequestPayload = {
        tripName:
          planData.tripName ||
          planData.trip_name ||
          `Chuyến đi ${provinceValue}`,
        startDate: weatherRequestPayload.startDate,
        endDate: weatherRequestPayload.endDate,
        fromOperationTime: weatherRequestPayload.fromOperateTime + ":00",
        toOperationTime: weatherRequestPayload.toOperateTime + ":00",
        numAdult: inputData.numAdult || inputData.num_adult || 1,
        numChild: inputData.numChild || inputData.num_child || 0,
        numElder: inputData.numElder || inputData.num_elder || 0,

        tripSections: (
          planData.tripSections ||
          planData.trip_sections ||
          []
        ).map((section, index) => {
          // Tự tính ngày dựa trên startDate + index
          const baseDate = new Date(weatherRequestPayload.startDate);
          baseDate.setDate(baseDate.getDate() + index);
          const dateString = baseDate.toISOString().split("T")[0];

          return {
            // Gửi cả 2 tên biến để chắc chắn Backend nhận được
            dayNum: index + 1,
            dayNumber: index + 1, // <-- QUAN TRỌNG CHO AI SERVICE (Lỗi 422 trước đó báo thiếu cái này)

            date: section.date || dateString,
            title: section.title || section.section_name || `Ngày ${index + 1}`,

            tripDetails: (
              section.tripDetails ||
              section.trip_details ||
              []
            ).map((detail, dIndex) => ({
              startTime: (
                detail.startTime ||
                detail.start_time ||
                "08:00"
              ).substring(0, 5),
              endTime: (detail.endTime || detail.end_time || "09:00").substring(
                0,
                5
              ),
              activity: detail.activity || detail.description || "Tham quan",
              price: detail.price || 0,

              // Sequence Order (Thứ tự địa điểm)
              sequenceOrder: dIndex + 1, // <-- QUAN TRỌNG CHO AI SERVICE

              // Location Object (Đã gộp sequenceOrder và sequence chung cho gọn)
              location: {
                id: detail.location?.id || detail.locationId,
                // Latitude/Longitude bắt buộc phải có giá trị số (float), không được null
                latitude: parseFloat(
                  detail.location?.latitude || detail.latitude || 0
                ),
                longitude: parseFloat(
                  detail.location?.longitude || detail.longitude || 0
                ),
                locationName: detail.location?.location_name || detail.title,
              },
            })),
          };
        }),
      };

      const payload = {
        trip_request: tripRequestPayload,
        weather_request: weatherRequestPayload,
      };

      console.log("🚀 PAYLOAD GỬI ĐI:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        "http://localhost:8080/api/v1/make-plan/confirm",
        payload,
        { headers }
      );

      console.log("✅ Confirm Success:", response.data);
      navigate("/currentplan", { state: { finalPlan: response.data } });
    } catch (error) {
      console.error("❌ Lỗi khi Confirm:", error);
      if (error.response) {
        console.error("Chi tiết lỗi Backend:", error.response.data);
        alert(`Lỗi Server: ${JSON.stringify(error.response.data)}`);
      } else {
        alert("Không thể kết nối đến server.");
      }
    }
  }, [navigate, planData, lastRequestData]);

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
