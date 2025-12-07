import React, { useState, useEffect } from "react";
import "./Output.css";
import { useLanguage } from "../Language/LanguageContext";
// 1. XÓA DÒNG NÀY: import scheduleData from "./schedule.json";

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

let rejectedCount = 0;

const processScheduleData = (data, translate) => {
  // Kiểm tra cả snake_case (Backend) và camelCase (Frontend cũ)
  const sections = data?.tripSections || data?.trip_sections;
  
  if (!sections) return [];

  return sections.map((section) => {
    const details = section.tripDetails || section.trip_details || [];
    
    const activities = details.map((item) => ({
      diadiem: item.location?.location_name || item.title || translate("output_unknown_location"),
      thoigian: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
      mota: item.activity || translate("output_no_description"),
      
      // Map các trường ID quan trọng để dùng cho chức năng Xóa/Tái tạo
      tripDetailID: item.temp_id,
      locationId: item.location?.id,
      ggPlaceId: item.location?.gg_place_id,
      originalId: item.sequenceOrder,
    }));

    return {
      dayTitle: section.title,
      activities: activities,
    };
  });
};

const Output = ({
  data, // <--- 2. QUAN TRỌNG: Nhận data từ Plan.jsx
  tryCount,
  onTryAgainClick,
  onAcceptClick,
  onStatsChange,
}) => {
  const { translate } = useLanguage();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [rejectedLocation, setRejectedLocation] = useState([]);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentTotalCount = schedule.reduce(
    (total, day) => total + day.activities.length,
    0
  );
  const currentRejectedCount = rejectedLocation.length;

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({
        total: currentTotalCount,
        rejected: currentRejectedCount,
      });
    }
  }, [currentTotalCount, currentRejectedCount, onStatsChange]);

  // --- 3. SỬA USE EFFECT: Dùng 'data' thay vì 'scheduleData' ---
  useEffect(() => {
    if (data) {
      console.log("Output nhận dữ liệu mới:", data); // Log để kiểm tra
      const processed = processScheduleData(data, translate);
      setSchedule(processed);
      setRejectedLocation([]); // Reset danh sách xóa khi có plan mới
      setCurrentDayIndex(0);   // Reset về ngày 1
    }
  }, [data, translate]); 
  // -----------------------------------------------------------

  const currentDaySchedule = schedule.length > 0 ? schedule[currentDayIndex] : null;
  const currentActivities = currentDaySchedule ? currentDaySchedule.activities : [];

  const handleDelete = (actIndex) => {
    const activityToDelete = currentActivities[actIndex];
    if (!activityToDelete) return;

    const newItem = {
      tripDetailID: activityToDelete.tripDetailID,
      locationId: activityToDelete.locationId,
      ggPlaceId: activityToDelete.ggPlaceId,
    };
    rejectedCount += 1;

    console.log("Xóa địa điểm:", newItem);
    setRejectedLocation((prev) => [...prev, newItem]);

    const newSchedule = [...schedule];
    newSchedule[currentDayIndex].activities.splice(actIndex, 1);
    setSchedule(newSchedule);
  };

  const handleSave = () => {
    setIsSaving(true);
    console.log("Đang gửi yêu cầu thử lại...");

    setTimeout(() => {
      const cleanList = rejectedLocation.map((item) => ({
        trip_detail_id: item.tripDetailID,
        location_id: item.locationId
      }));

      if (onTryAgainClick) {
        onTryAgainClick(cleanList);
      }

      setIsSaving(false);
    }, 1000); // Giảm timeout xuống 1s cho nhanh
  };

  const handleNextDay = () => {
    if (currentDayIndex < schedule.length - 1) {
      setDeletingIndex(null);
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setDeletingIndex(null);
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const canGoPrev = currentDayIndex > 0;
  const canGoNext = schedule.length > 0 && currentDayIndex < schedule.length - 1;

  return (
    <div className="output-container">
      <h3>{translate("output_suggested_itinerary")}</h3>

      <div className="day-navigation">
        <button
          onClick={handlePrevDay}
          disabled={!canGoPrev}
          className="nav-button"
        >
          &larr; {translate("output_previous_day")}
        </button>
        {currentDaySchedule && (
          <h4 className="current-day-title">{currentDaySchedule.dayTitle}</h4>
        )}
        <button
          onClick={handleNextDay}
          disabled={!canGoNext}
          className="nav-button"
        >
          {translate("output_next_day")} &rarr;
        </button>
      </div>

      <hr />

      <table className="itinerary-table">
        <thead>
          <tr>
            <th style={{ width: "30%" }}>{translate("output_location")}</th>
            <th style={{ width: "15%" }}>{translate("output_time")}</th>
            <th style={{ width: "45%" }}>{translate("output_description")}</th>
            <th style={{ width: "10%" }}></th>
          </tr>
        </thead>
        <tbody>
          {currentActivities.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                {translate("output_no_itinerary_data")}
              </td>
            </tr>
          ) : (
            currentActivities.map((item, index) => {
              const isDeleting = index === deletingIndex;
              return (
                <tr
                  key={`${currentDayIndex}-${index}`}
                  className={isDeleting ? "deleting" : ""}
                >
                  <td className="location-cell">
                    <strong>{item.diadiem}</strong>
                  </td>
                  <td className="time-cell">{item.thoigian}</td>
                  <td className="desc-cell">{item.mota}</td>
                  <td className="delete-button-cell">
                    <button
                      className="delete"
                      title="Xóa địa điểm này"
                      onClick={() => handleDelete(index)}
                      disabled={isDeleting}
                    ></button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <hr />

      <div className="retry-accept-list">
        {tryCount > 0 && (
          <p className="remaining-tries">
            {translate("output_remaining_tries")}: {tryCount}
          </p>
        )}
        <button
          className="output-retry-button"
          onClick={handleSave}
          disabled={tryCount <= 0 || isSaving}
        >
          {translate("output_retry_button")}
        </button>
        <button className="output-accept-button" onClick={onAcceptClick}>
          {translate("output_accept_button")}
        </button>
      </div>
      
      {/* Log hiển thị các item đã xóa (chỉ để debug, có thể ẩn đi) */}
      {rejectedLocation.length > 0 && (
        <div className="deleted-log-container">
          <div className="deleted-log-title" style={{color:'red'}}>
            Các địa điểm đã xóa ({currentRejectedCount}):
          </div>
          <ul className="deleted-list">
            {rejectedLocation.map((item, idx) => (
              <li key={idx} className="deleted-item">
                {item.locationId} - {item.ggPlaceId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Output;