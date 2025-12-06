import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
// Import icon phù hợp: FaMapMarkedAlt (Bản đồ) hoặc FaEye (Xem)
import { FaSpinner, FaMapMarkedAlt } from "react-icons/fa";
import "./TripHistory.css";

const TripHistory = ({ onSelectTrip }) => {
  // --- STATE ---
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- HELPER ---
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

  // --- API: Lấy danh sách ---
  const fetchAllTrips = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

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
      console.error("Lỗi khi lấy danh sách chuyến đi:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTrips();
  }, [fetchAllTrips]);

  return (
    <div className="trip-history-container">
      <h2>Lịch Sử Chuyến Đi</h2>
      {loading ? (
        <div className="loading-container">
          <FaSpinner className="spinner" /> Đang tải...
        </div>
      ) : (
        <table className="trip-history-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên chuyến đi</th>
              <th>Ngày đi - Về</th>
              <th style={{ textAlign: "center" }}>Chi tiết</th>{" "}
              {/* Căn giữa tiêu đề cột */}
            </tr>
          </thead>
          <tbody>
            {trips.length > 0 ? (
              trips.map((trip, index) => {
                const currentId = trip.trip_id || trip.tripId || trip.id;

                return (
                  <tr key={currentId || index} className="trip-summary-row">
                    <td>{index + 1}</td>
                    <td>{trip.trip_name || trip.tripName || "Chưa đặt tên"}</td>
                    <td>
                      {formatDate(trip.start_date || trip.startDate)} -{" "}
                      {formatDate(trip.end_date || trip.endDate)}
                    </td>

                    {/* CỘT 4: CHỈ CHỨA ICON CHUYỂN VIEWMODE */}
                    <td className="action-cell" style={{ textAlign: "center" }}>
                      <button
                        className="detail-toggle-button" // Giữ class cũ để tận dụng CSS tròn/vuông nếu có
                        onClick={() => onSelectTrip(currentId)} // Gọi hàm chuyển ViewMode
                        title="Xem chi tiết bản đồ"
                        style={{
                          cursor: "pointer",
                          background: "transparent",
                          border: "none",
                          fontSize: "1.2rem",
                          color: "#2157bb",
                          transition: "transform 0.2s",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.transform = "scale(1.2)")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      >
                        {/* Dùng icon Bản đồ để biểu thị ý nghĩa chuyển trang */}
                        <FaMapMarkedAlt />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  Chưa có chuyến đi nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TripHistory;
