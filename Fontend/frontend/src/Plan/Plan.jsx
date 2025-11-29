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
  const [isSearching, setIsSearching] = useState(false); // Thay thế showLoadingAnimation
  const [isResultShown, setIsResultShown] = useState(false);

  const [searchIteration, setSearchIteration] = useState(0);

  const [planData, setPlanData] = useState(null);
  const [tryCount, setTryCount] = useState(3);

  const [lastRequestData, setLastRequestData] = useState(null);

  const { translate } = useLanguage();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const callMakePlanApi = useCallback(
    async (data) => {
      if (!data) {
        console.warn("Dữ liệu đầu vào rỗng, hủy gọi API.");
        return;
      }
      setIsSearching(true);
      setIsResultShown(false);
      setPlanData(null);

      try {
        // 2. Lấy token NGAY TẠI THỜI ĐIỂM GỌI API để đảm bảo luôn mới nhất
        const currentToken = localStorage.getItem("token");

        const headers = {
          "Content-Type": "application/json",
        };

        if (currentToken) {
          headers["Authorization"] = `Bearer ${currentToken}`;
        }

        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/make",
          data,
          { headers }
        );

        console.log("Kết quả từ Backend:", response.data);
        setPlanData(response.data);
        setIsResultShown(true);
        setSearchIteration((prev) => prev + 1);
      } catch (error) {
        console.error("Lỗi khi gọi API Make Plan:", error);
        let msg = "Có lỗi xảy ra";
        if (error.response) {
          // Lấy message lỗi chi tiết từ Backend trả về (nếu có)
          const data = error.response.data;
          const backendMessage =
            data?.message || data?.error || JSON.stringify(data);

          if (error.response.status === 403) {
            msg =
              "Lỗi 403: Backend từ chối truy cập. Kiểm tra @CrossOrigin hoặc Token.";
          } else if (error.response.status === 500) {
            msg = `Lỗi 500: Server gặp sự cố.\nChi tiết: ${backendMessage}\n\n(Kiểm tra lại xem Database có dữ liệu cho Tỉnh/Sở thích này chưa)`;
          } else {
            msg = `Lỗi ${error.response.status}: ${backendMessage}`;
          }
        } else if (error.request) {
          msg = "Lỗi mạng hoặc Server không phản hồi.";
        }

        alert(msg);
      } finally {
        setIsSearching(false);
      }
    },
    [translate]
  );
  // Hàm thực hiện tìm kiếm (có Loading Animation)
  const handleSearch = useCallback((requestData) => {
    console.log("Nhận dữ liệu từ Input:", requestData);

    // 1. Lưu lại dữ liệu để dùng cho Try Again
    setLastRequestData(requestData);

    // 2. Reset số lượt thử lại về 3 (mỗi lần search mới là một session mới)
    setTryCount(3);

    // 3. Gọi API
    callMakePlanApi(requestData);
  }, []);

  const handleTryAgain = useCallback(() => {
    if (tryCount > 0 && lastRequestData) {
      console.log(`Đang thử lại... (Còn ${tryCount - 1} lượt)`);

      // Giảm số lượt còn lại
      setTryCount((prev) => prev - 1);

      // Gọi lại API với dữ liệu cũ
      callMakePlanApi(lastRequestData);
    } else {
      console.log("Đã hết lượt thử lại.");
    }
  }, [tryCount, lastRequestData]);

  const handleAccept = useCallback(() => {
    if (planData) {
      console.log("Chấp nhận lịch trình:", planData);
      // Chuyển hướng sang trang Current Plan và truyền dữ liệu theo
      navigate("/currentplan", { state: { finalPlan: planData } });
    }
  }, [navigate, planData]);

  return (
    <div>
      <div className="homepage-background">
        <Navbar />
        <Input
          onSearch={handleSearch} // Hàm search lần đầu
          isResultShown={isResultShown}
          searchIteration={searchIteration}
        />
      </div>
      <div className="itinerary-results-container">
        {/* HIỂN THỊ LOTTIE KHI ĐANG TÌM KIẾM */}
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
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Plan;
