import React from 'react';
import './Purchase.css';
import Navbar from '../Navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext'; // Import AuthContext

const Purchase = () => {
    const navigate = useNavigate();
    const { token, user, setUser } = useAuth(); // Lấy token từ Context

    const handleChoosePlan = async () => {
        // 1. Lấy token ưu tiên từ Context, nếu không có thì lấy từ localStorage (dự phòng)
        const currentToken = token || localStorage.getItem('token');

        // 2. Kiểm tra đăng nhập
        if (!user || !currentToken) {
            alert("Vui lòng đăng nhập để thực hiện nâng cấp!");
            navigate('/login');
            return;
        }

        const confirmUpgrade = window.confirm("Xác nhận nâng cấp lên World Explorer (VIP 1 năm) với giá $100?");
        if (!confirmUpgrade) return;

        // DEBUG: Kiểm tra token trong Console (F12)
        console.log("Đang gửi request với Token:", currentToken);

        try {
            // 3. Gọi API kích hoạt VIP
            const response = await fetch(`http://localhost:8080/api/v1/user/upgrade-duration?duration=365`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // QUAN TRỌNG: Gửi kèm Token trong Header
                    'Authorization': `Bearer ${currentToken}` 
                }
            });

            if (response.ok) {
                // 4. Cập nhật state ngay lập tức để Navbar đổi icon Vương miện
                const updatedUser = { ...user, role: 'VIP' };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Lưu user mới vào storage

                alert("Thanh toán thành công! Bạn đã là thành viên VIP.");
                navigate('/user');
            } else {
                // Xử lý lỗi từ Backend (401, 403, 500)
                if (response.status === 403 || response.status === 401) {
                    alert("Lỗi xác thực (Forbidden). Vui lòng đăng xuất và đăng nhập lại.");
                } else {
                    alert(`Lỗi hệ thống: ${response.status}`);
                }
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Không thể kết nối đến máy chủ.");
        }
    };

    return (
        <div className="purchase-page-wrapper">
            <Navbar />
            <div className="purchase-container">
                <div className="purchase-content" style={{ justifyContent: 'center' }}>
                    
                    <div className="pricing-cards single-card">
                        {/* Gói World Explorer */}
                        <div className="pricing-card">
                            <h3>World Explorer</h3>
                            <p className="sub-head">Trải nghiệm trọn vẹn nhất</p>
                            <ul className="features-list">
                                <li><span className="check">✔</span> Xuất kế hoạch ra PDF không giới hạn</li>
                                <li><span className="check">✔</span> Tạo kế hoạch không giới hạn số lần</li>
                                <li><span className="check">✔</span> Lưu trữ lịch sử chuyến đi</li>
                                <li><span className="check">✔</span> Bản đồ tương tác nâng cao</li>
                            </ul>
                            
                            <div className="price-tag">$100<span>/year</span></div>
                            
                            <button 
                                className="btn-choose"
                                onClick={handleChoosePlan}
                            >
                                Choose (Upgrade Now)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Purchase;