import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaSpinner, FaMapMarkedAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./TripHistory.css";

const TripHistory = ({ onSelectTrip }) => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper format ngày
  const formatDate = (dateData) => {
    if (!dateData) return "N/A";
    if (Array.isArray(dateData)) {
      const [year, month, day] = dateData;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(
        2,
        "0"
      )}/${year}`;
    }
    return new Date(dateData).toLocaleDateString("vi-VN");
  };

  // API lấy danh sách
  const fetchAllTrips = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(
        "http://localhost:8080/api/v1/trip/getAll",
        {
          headers,
          params: { page: 0, size: 20, sort: "startDate,desc" },
        }
      );

      if (response.data && response.data.content) {
        setTrips(response.data.content);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTrips();
  }, [fetchAllTrips]);

  if (loading) {
    return (
      <div
        className="trip-history-container"
        style={{ textAlign: "center", marginTop: "50px" }}
      >
        <FaSpinner className="spinner" /> Đang tải dữ liệu...
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="error-screen" style={{ minHeight: "50vh" }}>
        <div className="body-error">
          <h3 className="alert-error">Chưa có dữ liệu chuyến đi.</h3>
          <button onClick={() => navigate("/search")} className="get-started">
            Lên kế hoạch ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-history-container">
      <h2 style={{ color: "#003c72", marginBottom: "20px" }}>
        Lịch Sử Chuyến Đi
      </h2>
      <table className="trip-history-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên chuyến đi</th>
            <th>Thời gian</th>
            {/* CỘT TRẠNG THÁI */}
            <th style={{ textAlign: "center" }}>Trạng thái</th>
            <th style={{ textAlign: "center" }}>Xem chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, index) => {
            const currentId = trip.trip_id || trip.tripId || trip.id;
            // Logic kiểm tra status
            const isCompleted = trip.status === "COMPLETED";

            return (
              <tr key={currentId || index} className="trip-summary-row">
                <td>{index + 1}</td>
                <td>
                  {trip.trip_name || trip.tripName || "Chuyến đi chưa đặt tên"}
                </td>
                <td>
                  {formatDate(trip.start_date || trip.startDate)} -{" "}
                  {formatDate(trip.end_date || trip.endDate)}
                </td>

                {/* 👇 HIỂN THỊ TEXT TRẠNG THÁI 👇 */}
                <td
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                  }}
                >
                  {isCompleted ? (
                    <span
                      style={{
                        color: "#28a745", // Màu xanh lá
                        backgroundColor: "#e6f9ec", // Nền xanh nhạt
                        padding: "5px 10px",
                        borderRadius: "15px",
                        display: "inline-block",
                        minWidth: "120px",
                      }}
                    >
                      HOÀN THÀNH
                    </span>
                  ) : (
                    <span
                      style={{
                        color: "#ff9800", // Màu cam
                        backgroundColor: "#fff8e1", // Nền vàng nhạt
                        padding: "5px 10px",
                        borderRadius: "15px",
                        display: "inline-block",
                        minWidth: "120px",
                      }}
                    >
                      ĐANG DIỄN RA
                    </span>
                  )}
                </td>

                <td className="action-cell" style={{ textAlign: "center" }}>
                  <button
                    className="detail-toggle-button"
                    onClick={() => onSelectTrip(currentId)}
                    title="Xem chi tiết"
                    style={{
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      fontSize: "1.2rem",
                      color: "#2157bb",
                    }}
                  >
                    <FaMapMarkedAlt />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TripHistory;
