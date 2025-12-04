import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./TripHistory.css"; // Đảm bảo bạn có file CSS này

// --- Dữ liệu giả định (Mock Data) ---
const mockTrips = [
  {
    id: 1,
    name: "Chuyến công tác Hà Nội",
    dates: "10/01/2024 - 15/01/2024",
    details: [
      { id: 101, item: "Vé máy bay khứ hồi (HAN)", cost: "3.500.000 VNĐ" },
      { id: 102, item: "Khách sạn 5 đêm", cost: "7.500.000 VNĐ" },
      { id: 103, item: "Chi phí đi lại", cost: "1.200.000 VNĐ" },
    ],
  },
  {
    id: 2,
    name: "Nghỉ dưỡng tại Đà Lạt",
    dates: "20/03/2024 - 25/03/2024",
    details: [
      { id: 201, item: "Vé xe khách", cost: "800.000 VNĐ" },
      { id: 202, item: "Homestay 4 đêm", cost: "3.200.000 VNĐ" },
      { id: 203, item: "Thuê xe máy", cost: "600.000 VNĐ" },
      { id: 204, item: "Ăn uống và tham quan", cost: "2.500.000 VNĐ" },
    ],
  },
  {
    id: 3,
    name: "Hội nghị Tech Summit HCM",
    dates: "05/05/2024 - 08/05/2024",
    details: [
      { id: 301, item: "Vé tàu hoả", cost: "1.800.000 VNĐ" },
      { id: 302, item: "Phí đăng ký hội nghị", cost: "5.000.000 VNĐ" },
    ],
  },
];

const TripHistory = () => {
  // State để lưu ID của chuyến đi đang được mở chi tiết (dropdown)
  // Null nếu không có chuyến nào đang mở
  const [openTripId, setOpenTripId] = useState(null);

  // Hàm xử lý khi bấm vào nút/icon
  const handleToggleDetails = (tripId) => {
    setOpenTripId(openTripId === tripId ? null : tripId);
  };

  return (
    <div className="trip-history-container">
      <h2>Lịch Sử Chuyến Đi</h2>
      <table className="trip-history-table">
        <thead>
          <tr>
            <th>Số thứ tự</th>
            <th>Tên chuyến đi</th>
            <th>Ngày đi-về</th>
            <th>Chi tiết</th> {/* Cột chứa nút dropdown */}
          </tr>
        </thead>
        <tbody>
          {mockTrips.map((trip, index) => (
            // Dùng Fragment (hoặc []) để trả về 2 hàng: hàng chính và hàng chi tiết
            <React.Fragment key={trip.id}>
              {/* Hàng chứa thông tin tổng quát */}
              <tr className="trip-summary-row">
                <td>{index + 1}</td>
                <td>{trip.name}</td>
                <td>{trip.dates}</td>
                <td className="detail-toggle-cell">
                  <button
                    className="detail-toggle-button"
                    onClick={() => handleToggleDetails(trip.id)}
                    aria-expanded={openTripId === trip.id} // Hỗ trợ accessibility
                    aria-controls={`details-for-trip-${trip.id}`}
                  >
                    {/* Hiển thị icon tương ứng với trạng thái mở/đóng */}
                    {openTripId === trip.id ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>
                </td>
              </tr>

              {/* Hàng chứa chi tiết (dropdown) */}
              {openTripId === trip.id && (
                <tr
                  className="trip-details-row"
                  id={`details-for-trip-${trip.id}`}
                >
                  {/* Cột này chiếm toàn bộ chiều rộng của bảng (colspan=4) */}
                  <td colSpan="4">
                    <div className="details-content">
                      <h4>Chi Tiết: {trip.name}</h4>
                      <ul className="details-list">
                        {trip.details.map((detail) => (
                          <li key={detail.id}>
                            <span className="detail-item">{detail.item}</span>:
                            <span className="detail-cost">{detail.cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TripHistory;
