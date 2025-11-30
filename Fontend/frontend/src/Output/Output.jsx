import React, { useState, useEffect } from "react";
import "./Output.css";
import { useLanguage } from "../Language/LanguageContext";
import scheduleData from "./schedule.json";

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

let rejectedCount = 0;

const processScheduleData = (data, translate) => {
  if (!data || !data.tripSections) return [];
  return data.tripSections.map((section) => {
    const activities = section.tripDetails.map((item) => ({
      diadiem:
        item.location?.location_name || translate("output_unknown_location"),
      thoigian: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
      mota: item.description || translate("output_no_description"),
      tripDetailID: item.tempId || item.id,
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

// FIXED: Added 'onStatsChange' to the list of props here 👇
const Output = ({
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

  // Calculate stats
  const currentTotalCount = schedule.reduce(
    (total, day) => total + day.activities.length,
    0
  );
  const currentRejectedCount = rejectedLocation.length;

  // Sync stats with parent (Plan.jsx)
  useEffect(() => {
    // Only call if the function exists
    if (onStatsChange) {
      onStatsChange({
        total: currentTotalCount,
        rejected: currentRejectedCount,
      });
    }
  }, [currentTotalCount, currentRejectedCount, onStatsChange]);

  useEffect(() => {
    if (scheduleData) {
      const processed = processScheduleData(scheduleData, translate);
      setSchedule(processed);
      setRejectedLocation([]);
      setCurrentDayIndex(0);
    }
  }, [translate]);

  const currentDaySchedule =
    schedule.length > 0 ? schedule[currentDayIndex] : null;
  const currentActivities = currentDaySchedule
    ? currentDaySchedule.activities
    : [];

  const handleDelete = (actIndex) => {
    const activityToDelete = currentActivities[actIndex];
    if (!activityToDelete) return;

    const newItem = {
      locationId: activityToDelete.locationId,
      ggPlaceId: activityToDelete.ggPlaceId,
    };
    rejectedCount += 1;

    console.log("Deleting item:", newItem);
    setRejectedLocation((prev) => [...prev, newItem]);

    const newSchedule = [...schedule];
    newSchedule[currentDayIndex].activities.splice(actIndex, 1);
    setSchedule(newSchedule);
  };

  const handleSave = () => {
    setIsSaving(true);
    console.log("Đang chuẩn bị dữ liệu gửi về...");

    setTimeout(() => {
      // --- SỬA ĐOẠN NÀY ---
      // Map lại tên biến cho đúng chuẩn Backend trước khi bắn sang Plan.jsx
      const cleanList = rejectedLocation.map((item) => ({
        id: item.locationId, // Đổi locationId -> id
        googlePlaceId: item.ggPlaceId, // Đổi ggPlaceId -> googlePlaceId
      }));

      console.log("Dữ liệu đã chuẩn hóa:", cleanList);

      if (onTryAgainClick) {
        onTryAgainClick(cleanList); // Gửi list đã sạch
      }
      // --------------------

      setIsSaving(false);
      alert("Đã gửi yêu cầu cập nhật lịch trình!");
    }, 2000);
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
  const canGoNext =
    schedule.length > 0 && currentDayIndex < schedule.length - 1;

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
          {currentActivities.length === 0 && deletingIndex === null ? (
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
                      title="Remove item"
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
      {rejectedLocation.length > 0 && (
        <div className="deleted-log-container">
          <div className="deleted-log-title">
            ⚠️ Các vị trí đã xóa (Sẽ gửi về Backend để tái tạo):
          </div>
          <ul className="deleted-list">
            {rejectedLocation.map((item, idx) => (
              <li key={idx} className="deleted-item">
                <span>
                  Location ID:{" "}
                  <span className="item-id">{item.locationId}</span>| Google
                  Place ID: <span className="item-id">{item.ggPlaceId}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <span>Total: {currentTotalCount}</span>
        <span>Rejected: {currentRejectedCount}</span>
      </div>
    </div>
  );
};

export default Output;
