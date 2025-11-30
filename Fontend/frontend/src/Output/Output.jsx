import React, { useState, useEffect } from "react";
import "./Output.css";
import { useLanguage } from "../Language/LanguageContext";

// Import dữ liệu lịch trình trực tiếp từ JSON
import scheduleData from "./schedule.json";

// Hàm hỗ trợ format giờ (bỏ giây): 09:30:00 -> 09:30
const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

// Chuyển đổi dữ liệu lịch trình JSON thành một cấu trúc dễ quản lý hơn
const processScheduleData = (data, translate) => {
  // Kiểm tra xem dữ liệu có đúng cấu trúc không
  if (!data || !data.tripSections) return [];

  return data.tripSections.map((section) => {
    const activities = section.tripDetails.map((item) => ({
      // Lấy tên địa điểm từ object location
      diadiem:
        item.location?.location_name || translate("output_unknown_location"),

      // Format lại thời gian
      thoigian: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,

      // Mô tả hoạt động
      mota: item.description || translate("output_no_description"),

      tripDetailID: item.tempId || item.id,
      locationId: item.location?.id,
      // Giữ lại ID để quản lý nếu cần
      originalId: item.sequenceOrder,
    }));

    return {
      dayTitle: section.title, // Ví dụ: "Ngày 1: Khám phá"
      activities: activities,
    };
  });
};

const Output = ({ tryCount, onTryAgainClick, onAcceptClick }) => {
  const { translate } = useLanguage();
  const [rejectedItems, setRejectedItems] = useState([]);
  // Theo dõi ngày hiện tại đang được hiển thị (dùng index của mảng tripSections)
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [schedule, setSchedule] = useState([]);
  // Theo dõi mục đang bị xóa
  const [deletingIndex, setDeletingIndex] = useState(null);

  // Sử dụng useEffect để xử lý dữ liệu khi component được mount
  useEffect(() => {
    if (scheduleData) {
      const processed = processScheduleData(scheduleData, translate);
      setSchedule(processed);
      setRejectedItems([]);
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
      tripDetailId: activityToDelete.tripDetailId,
      locationId: activityToDelete.locationId,
    };

    console.log("Deleting item:", newItem);
    setRejectedItems((prev) => [...prev, newItem]);

    // Cập nhật giao diện (Xóa khỏi state schedule)
    const newSchedule = [...schedule];
    newSchedule[currentDayIndex].activities.splice(actIndex, 1);
    setSchedule(newSchedule);
  };

  const handleNextDay = () => {
    if (currentDayIndex < schedule.length - 1) {
      setDeletingIndex(null); // Reset trạng thái xóa
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setDeletingIndex(null); // Reset trạng thái xóa
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const handleRetry = () => {
    console.log("Gửi list bị xóa tới Plan.jsx", rejectedItems);
    onTryAgainClick(rejectedItems);
  };

  // Kiểm tra điều kiện nút bấm
  const canGoPrev = currentDayIndex > 0;
  const canGoNext =
    schedule.length > 0 && currentDayIndex < schedule.length - 1;

  return (
    <div className="output-container">
      <h3>{translate("output_suggested_itinerary")}</h3>

      {/* --- Bộ điều khiển Navigation giữa các ngày --- */}
      <div className="day-navigation">
        <button
          onClick={handlePrevDay}
          disabled={!canGoPrev}
          className="nav-button"
        >
          &larr; {translate("output_previous_day")}
        </button>

        {/* Tiêu đề ngày hiện tại (Lấy từ JSON: "Ngày 1: Khám phá") */}
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

      {/* --- Bảng Lịch trình --- */}
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
                    >
                      {/* Icon X hoặc text */}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <hr />

      {/* --- Footer Buttons --- */}
      <div className="retry-accept-list">
        {tryCount > 0 && (
          <p className="remaining-tries">
            {translate("output_remaining_tries")}: {tryCount}
          </p>
        )}

        <button
          className="output-retry-button"
          onClick={handleRetry}
          disabled={tryCount <= 0}
        >
          {translate("output_retry_button")}
        </button>
        <button className="output-accept-button" onClick={onAcceptClick}>
          {translate("output_accept_button")}
        </button>
      </div>
      {rejectedItems.length > 0 && (
        <div className="deleted-log-container">
          <div className="deleted-log-title">
            ⚠️ Các vị trí đã xóa (Sẽ gửi về Backend để tái tạo):
          </div>
          <ul className="deleted-list">
            {rejectedItems.map((item, idx) => (
              <li key={idx} className="deleted-item">
                <span>❌ Mục #{idx + 1}</span>
                <span>
                  Detail ID:{" "}
                  <span className="item-id">{item.tripDetailId}</span> |
                  Location ID:{" "}
                  <span className="item-id">{item.locationId}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Output;
