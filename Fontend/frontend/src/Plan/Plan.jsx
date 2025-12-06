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
        const newTripData = response.data.new_trip_plan;

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

  const handleAccept = useCallback(async () => {
    if (!planData) return;

    // 1. Lấy dữ liệu input ban đầu (để lấy thông tin weather, số người, v.v...)
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
      console.log("🛠 Đang chuẩn bị dữ liệu Confirm...");

      const currentToken = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      };

      // 2. CHUẨN BỊ GÓI WEATHER (weather_request)
      // Map từ inputData (dữ liệu lúc bạn nhập form tìm kiếm) sang WeatherRequest của Backend
      const weatherRequestPayload = {
        provinceId: inputData.provinceId,
        provinceName: inputData.provinceName,
        startDate: inputData.start_date || inputData.startDate,
        endDate: inputData.end_date || inputData.endDate,
        fromOperateTime: (
          inputData.from_time ||
          inputData.fromTime ||
          "08:00"
        ).substring(0, 5),
        toOperateTime: (
          inputData.to_time ||
          inputData.toTime ||
          "22:00"
        ).substring(0, 5),
      };

      // 3. CHUẨN BỊ GÓI TRIP (trip_request)
      // Map từ planData (kết quả AI trả về) + inputData (số người...) sang TripRequest của Backend
      const tripRequestPayload = {
        tripName:
          planData.tripName ||
          planData.trip_name ||
          `Chuyến đi ${weatherRequestPayload.provinceName}`,
        startDate: weatherRequestPayload.startDate, // Lấy từ input cho chắc chắn
        endDate: weatherRequestPayload.endDate, // Lấy từ input cho chắc chắn
        fromOperationTime: weatherRequestPayload.fromOperateTime + ":00", // Java LocalTime cần HH:mm:ss hoặc HH:mm tùy config, an toàn thì thêm :00 nếu cần
        toOperationTime: weatherRequestPayload.toOperateTime + ":00",

        numAdult: inputData.num_adult || inputData.numAdult || 1,
        numChild: inputData.num_child || inputData.numChild || 0,
        numElder: inputData.num_elder || inputData.numElder || 0,

        tripSections: (
          planData.tripSections ||
          planData.trip_sections ||
          []
        ).map((section, index) => {
          // TÍNH TOÁN NGÀY (DATE) CHO TỪNG SECTION
          // Vì AI có thể không trả về ngày cụ thể cho từng section, ta phải tự tính dựa trên startDate + index
          const baseDate = new Date(weatherRequestPayload.startDate);
          baseDate.setDate(baseDate.getDate() + index); // Cộng thêm số ngày tương ứng với index (0, 1, 2...)
          const dateString = baseDate.toISOString().split("T")[0]; // Format yyyy-MM-dd

          return {
            // Map các trường cơ bản
            dayNum: section.dayNum || section.day_num || index + 1,
            date: section.date || dateString, // QUAN TRỌNG: Nếu section không có date, dùng ngày tự tính
            title: section.title || section.section_name || `Ngày ${index + 1}`,

            // Map chi tiết (TripDetails)
            tripDetails: (
              section.tripDetails ||
              section.trip_details ||
              []
            ).map((detail) => ({
              startTime: (
                detail.startTime ||
                detail.start_time ||
                "08:00"
              ).substring(0, 5), // Cắt bỏ giây nếu có (HH:mm)
              endTime: (detail.endTime || detail.end_time || "09:00").substring(
                0,
                5
              ),
              activity: detail.activity || detail.description || "Tham quan",
              price: detail.price || 0,
              locationId: detail.location?.id || detail.locationId,
              // Nếu backend cần googlePlaceId, thêm vào đây:
              // googlePlaceId: detail.location?.googlePlaceId || detail.googlePlaceId
            })),
          };
        }),
      };

      // 4. GÓI FINAL PAYLOAD (ConfirmPlanRequest)
      const payload = {
        trip_request: tripRequestPayload, // Khớp với @JsonProperty("trip_request")
        weather_request: weatherRequestPayload, // Khớp với @JsonProperty("weather_request")
      };

      console.log(
        "🚀 PAYLOAD GỬI ĐI CONFIRM:",
        JSON.stringify(payload, null, 2)
      );

      // Gọi API
      const response = await axios.post(
        "http://localhost:8080/api/v1/make-plan/confirm",
        payload,
        { headers }
      );

      console.log("✅ Confirm Success:", response.data);

      // Chuyển trang
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
