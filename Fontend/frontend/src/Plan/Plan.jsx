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

  // FIXED: Added the missing state definition here
  const [totalDiff, setTotalDiff] = useState(0);
  const [outputStats, setOutputStats] = useState({ total: 0, rejected: 0 });

  const { translate } = useLanguage();
  const navigate = useNavigate();

  const countTotalItems = (plan) => {
    if (!plan || !plan.tripSections) return 0;
    let count = 0;
    plan.tripSections.forEach((section) => {
      count += section.tripDetails.length;
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
    async (currentPlan, rejectedLocation) => {
      setIsSearching(true);
      const payload = {
        current_trip_plan: currentPlan,
        rejected_detail: rejectedLocation,
      };
      try {
        const currentToken = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (currentToken) headers["Authorization"] = `Bearer ${currentToken}`;

        console.log("Calling API /regenerate-part with payload:", payload);
        const response = await axios.post(
          "http://localhost:8080/api/v1/make-plan/regenerate-part",
          payload,
          { headers }
        );

        console.log("Regenerate Part Response:", response.data);
        const newTripData =
          response.data.newTrip || response.data.currentTrip || response.data;

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
      console.log("Nhận dữ liệu từ Input:", requestData);
      setLastRequestData(requestData);
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
      const remainingCount = outputStats.total;
      const realInitialTotal = remainingCount + rejectedCount;
      const threshold = realInitialTotal / 2;
      const difference = rejectedCount - threshold;
      // Use the now defined setter
      setTotalDiff(difference);

      console.log(
        `Retry Logic: InitialTotal=${initialTotalItems}, Rejected=${rejectedCount}, Diff=${difference}`
      );

      if (difference > 0) {
        console.log("Difference > 0 (Over 50%) -> Calling /make API");
        if (lastRequestData) {
          callMakePlanApi(lastRequestData);
        } else {
          console.error("Missing lastRequestData for full regeneration");
        }
      } else {
        console.log(
          "Difference <= 0 (Under 50%) -> Calling /regenerate-part API"
        );
        callRegeneratePartAPI(planData, rejectedItems);
      }
    },
    [
      tryCount,
      planData,
      lastRequestData,
      initialTotalItems,
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
      <span>Total difference: {totalDiff}</span>

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
        {
          /* !isSearching && isResultShown && planData && */ <Output
            key={searchIteration}
            data={planData}
            tryCount={tryCount}
            onTryAgainClick={handleTryAgain}
            onAcceptClick={handleAccept}
            onStatsChange={handleStatsUpdate}
          />
        }
      </div>
      <Footer />
    </div>
  );
};

export default Plan;
