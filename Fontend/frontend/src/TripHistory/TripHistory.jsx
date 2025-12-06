import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaChevronDown, FaChevronUp, FaSpinner } from "react-icons/fa";
import "./TripHistory.css";

const TripHistory = () => {
  // --- STATE ---
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openTripId, setOpenTripId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- HELPER: Format Date ---
  const formatDate = (dateData) => {
    if (!dateData) return "N/A";
    if (Array.isArray(dateData)) {
      const [year, month, day] = dateData;
      return `${String(day).padStart(2, "0")}/${String(month).padStart(
        2,
        "0"
      )}/${year}`;
    }
    // Xử lý chuỗi ngày tháng (YYYY-MM-DD)
    return new Date(dateData).toLocaleDateString("vi-VN");
  };

  // --- HELPER: Format Tiền ---
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0 VNĐ";
    return value.toLocaleString("vi-VN") + " VNĐ";
  };

  // --- API: Lấy danh sách tất cả chuyến đi ---
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

      console.log("🔥 Dữ liệu getAll từ Backend:", response.data);

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

  // --- API: Lấy chi tiết chuyến đi ---
  const fetchTripDetail = async (tripId) => {
    if (!tripId) return;

    if (detailsCache[tripId]) {
      setOpenTripId(tripId);
      return;
    }

    setLoadingDetail(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log(`📡 Đang gọi API chi tiết với ID: ${tripId}`);

      const response = await axios.get(
        `http://localhost:8080/api/v1/trip/get`,
        {
          headers,
          params: { tripId: tripId },
        }
      );

      console.log("✅ Chi tiết chuyến đi nhận được:", response.data);

      setDetailsCache((prev) => ({
        ...prev,
        [tripId]: response.data,
      }));

      setOpenTripId(tripId);
    } catch (error) {
      console.error("❌ Lỗi khi lấy chi tiết:", error);
      alert("Không thể tải chi tiết. Vui lòng thử lại.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- HANDLER: Toggle Dropdown ---
  const handleToggleDetails = (tripItem) => {
    // SỬA LỖI Ở ĐÂY: Ưu tiên lấy trip_id (snake_case)
    const id = tripItem.trip_id || tripItem.tripId || tripItem.id;

    if (!id) {
      console.error("❌ Trip ID missing:", tripItem);
      return;
    }

    if (openTripId === id) {
      setOpenTripId(null);
    } else {
      fetchTripDetail(id);
    }
  };

  // --- RENDER CHI TIẾT ---
  const renderDetails = (tripId) => {
    const detailData = detailsCache[tripId];

    if (loadingDetail && !detailData && openTripId === tripId) {
      return (
        <div className="loading-text">
          <FaSpinner className="spinner" /> Đang tải thông tin chi tiết...
        </div>
      );
    }

    if (!detailData)
      return <div className="no-data">Không có thông tin chi tiết.</div>;

    // Mapping dữ liệu chi tiết (Backend có thể trả về camelCase cho detail hoặc snake_case)
    // Code dưới đây hỗ trợ cả hai trường hợp
    const tName = detailData.tripName || detailData.trip_name;
    const tStatus = detailData.status;
    const tAdult = detailData.numAdult || detailData.num_adult;
    const tChild = detailData.numChild || detailData.num_child;
    const tElder = detailData.numElder || detailData.num_elder;
    const tSections = detailData.tripSections || detailData.trip_sections;

    return (
      <div className="details-content">
        <h4>{tName || "Chi tiết chuyến đi"}</h4>

        <div className="details-info-grid">
          <p>
            <strong>Trạng thái:</strong> {tStatus || "N/A"}
          </p>
          <p>
            <strong>Người lớn:</strong> {tAdult || 0}
          </p>
          <p>
            <strong>Trẻ em:</strong> {tChild || 0}
          </p>
          <p>
            <strong>Người cao tuổi:</strong> {tElder || 0}
          </p>
        </div>

        <div className="details-routes">
          <h5>Lịch trình chi tiết:</h5>
          <ul className="details-list">
            {tSections && tSections.length > 0 ? (
              tSections.map((section, idx) => (
                <li
                  key={section.sectionId || section.section_id || idx}
                  className="section-item"
                >
                  <div className="section-header">
                    <strong>
                      {section.sectionName ||
                        section.section_name ||
                        `Phần ${idx + 1}`}
                    </strong>
                  </div>

                  {/* Render chi tiết trong section (nếu có) */}
                  {/* Kiểm tra cả camelCase và snake_case cho danh sách details */}
                  {(section.tripDetails || section.trip_details || []).length >
                    0 && (
                    <ul className="sub-details-list">
                      {(section.tripDetails || section.trip_details).map(
                        (detail, dIdx) => (
                          <li key={detail.id || dIdx}>
                            <span className="detail-item">
                              {detail.locationName ||
                                detail.location_name ||
                                detail.name ||
                                "Địa điểm"}
                            </span>
                            <span className="detail-cost">
                              {/* Nếu có giá tiền thì hiện */}
                              {detail.price ? formatCurrency(detail.price) : ""}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </li>
              ))
            ) : (
              <li className="empty-list">Chưa có thông tin lịch trình.</li>
            )}
          </ul>
        </div>

        {(detailData.pdfUrl || detailData.pdf_url) && (
          <div className="pdf-link">
            <a
              href={detailData.pdfUrl || detailData.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xem file PDF lịch trình
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="trip-history-container">
      <h2>Lịch Sử Chuyến Đi</h2>

      {loading ? (
        <div className="loading-container">
          <FaSpinner className="spinner" /> Đang tải dữ liệu...
        </div>
      ) : (
        <table className="trip-history-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên chuyến đi</th>
              <th>Ngày đi - Về</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {trips.length > 0 ? (
              trips.map((trip, index) => {
                // SỬA LỖI: Lấy ID từ trip_id (snake_case)
                const currentId = trip.trip_id || trip.tripId || trip.id;
                // Tạo key an toàn
                const rowKey = currentId || `idx-${index}`;

                return (
                  <React.Fragment key={rowKey}>
                    <tr className="trip-summary-row">
                      <td>{index + 1}</td>
                      {/* SỬA LỖI: Lấy tên từ trip_name */}
                      <td>
                        {trip.trip_name || trip.tripName || "Chưa đặt tên"}
                      </td>
                      <td>
                        {/* SỬA LỖI: Lấy ngày từ start_date / end_date */}
                        {formatDate(trip.start_date || trip.startDate)} -{" "}
                        {formatDate(trip.end_date || trip.endDate)}
                      </td>
                      <td className="detail-toggle-cell">
                        <button
                          className="detail-toggle-button"
                          onClick={() => handleToggleDetails(trip)}
                          disabled={
                            loadingDetail &&
                            openTripId !== currentId &&
                            openTripId !== null
                          }
                        >
                          {openTripId === currentId ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </button>
                      </td>
                    </tr>

                    {openTripId === currentId && (
                      <tr className="trip-details-row">
                        <td colSpan="4">{renderDetails(currentId)}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Bạn chưa có chuyến đi nào.
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
