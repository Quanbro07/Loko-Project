import React, { useState, useEffect } from "react";
import "./Output.css";
import { useLanguage } from "../Language/LanguageContext";

const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

let rejectedCount = 0;

const processScheduleData = (data, translate) => {
  const sections = data?.tripSections || data?.trip_sections;
  if (!sections) return [];

  return sections.map((section) => {
    const details = section.tripDetails || section.trip_details || [];
    const activities = details.map((item) => ({
      diadiem: item.location?.location_name || item.title || translate("output_unknown_location"),
      thoigian: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
      mota: item.activity || translate("output_no_description"),
      tripDetailID: item.temp_id,
      locationId: item.location?.id,
      ggPlaceId: item.location?.gg_place_id,
      originalId: item.sequenceOrder,
    }));

    return { dayTitle: section.title, activities: activities };
  });
};

const Output = ({
  data,
  tryCount,
  onTryAgainClick,
  onAcceptClick,
  onStatsChange,
  // --- 1. NHẬN PROP isVip ---
  isVip = false 
}) => {
  const { translate } = useLanguage();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [schedule, setSchedule] = useState([]);
  const [rejectedLocation, setRejectedLocation] = useState([]);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentTotalCount = schedule.reduce((total, day) => total + day.activities.length, 0);
  const currentRejectedCount = rejectedLocation.length;

  useEffect(() => {
    if (onStatsChange) { onStatsChange({ total: currentTotalCount, rejected: currentRejectedCount }); }
  }, [currentTotalCount, currentRejectedCount, onStatsChange]);

  useEffect(() => {
    if (data) {
      const processed = processScheduleData(data, translate);
      setSchedule(processed);
      setRejectedLocation([]);
      setCurrentDayIndex(0);
    }
  }, [data, translate]);

  const currentDaySchedule = schedule.length > 0 ? schedule[currentDayIndex] : null;
  const currentActivities = currentDaySchedule ? currentDaySchedule.activities : [];

  const handleDelete = (actIndex) => {
    const activityToDelete = currentActivities[actIndex];
    if (!activityToDelete) return;
    const newItem = { tripDetailID: activityToDelete.tripDetailID, locationId: activityToDelete.locationId, ggPlaceId: activityToDelete.ggPlaceId };
    rejectedCount += 1;
    setRejectedLocation((prev) => [...prev, newItem]);
    const newSchedule = [...schedule];
    newSchedule[currentDayIndex].activities.splice(actIndex, 1);
    setSchedule(newSchedule);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const cleanList = rejectedLocation.map((item) => ({ trip_detail_id: item.tripDetailID, location_id: item.locationId }));
      if (onTryAgainClick) { onTryAgainClick(cleanList); }
      setIsSaving(false);
    }, 1000);
  };

  const handleNextDay = () => { if (currentDayIndex < schedule.length - 1) { setDeletingIndex(null); setCurrentDayIndex(currentDayIndex + 1); } };
  const handlePrevDay = () => { if (currentDayIndex > 0) { setDeletingIndex(null); setCurrentDayIndex(currentDayIndex - 1); } };
  const canGoPrev = currentDayIndex > 0;
  const canGoNext = schedule.length > 0 && currentDayIndex < schedule.length - 1;

  return (
    <div className="output-container">
      <h3>{translate("output_suggested_itinerary")}</h3>
      <div className="day-navigation">
        <button onClick={handlePrevDay} disabled={!canGoPrev} className="nav-button">&larr; {translate("output_previous_day")}</button>
        {currentDaySchedule && <h4 className="current-day-title">{currentDaySchedule.dayTitle}</h4>}
        <button onClick={handleNextDay} disabled={!canGoNext} className="nav-button">{translate("output_next_day")} &rarr;</button>
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
            <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>{translate("output_no_itinerary_data")}</td></tr>
          ) : (
            currentActivities.map((item, index) => {
              const isDeleting = index === deletingIndex;
              return (
                <tr key={`${currentDayIndex}-${index}`} className={isDeleting ? "deleting" : ""}>
                  <td className="location-cell"><strong>{item.diadiem}</strong></td>
                  <td className="time-cell">{item.thoigian}</td>
                  <td className="desc-cell">{item.mota}</td>
                  <td className="delete-button-cell">
                    <button className="delete" title="Xóa địa điểm này" onClick={() => handleDelete(index)} disabled={isDeleting}></button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <hr />
      
      <div className="retry-accept-list">
        {/* --- 2. ẨN TEXT NẾU LÀ VIP --- */}
        {!isVip && tryCount > 0 && (
          <p className="remaining-tries">
            {translate("output_remaining_tries")}: {tryCount}
          </p>
        )}
        
        <button className="output-retry-button" onClick={handleSave} disabled={tryCount <= 0 || isSaving}>
          {translate("output_retry_button")}
        </button>
        <button className="output-accept-button" onClick={onAcceptClick}>
          {translate("output_accept_button")}
        </button>
      </div>
    </div>
  );
};

export default Output;