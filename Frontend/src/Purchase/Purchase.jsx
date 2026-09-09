import React, { useState } from 'react';
import './Purchase.css';
import Navbar from '../Navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

const Purchase = () => {
    const navigate = useNavigate();
    const { token, user, setUser } = useAuth();
    const [showModal, setShowModal] = useState(false);

    // --- LOGIC XỬ LÝ THANH TOÁN (GIỮ NGUYÊN) ---
    const handleChooseClick = () => {
        if (!user) {
            alert("Vui lòng đăng nhập trước!");
            navigate('/login');
            return;
        }
        setShowModal(true);
    };

    const handleConfirmUpgrade = async () => {
        const currentToken = token || localStorage.getItem('token');
        try {
            // Gọi API kích hoạt VIP 1 năm (365 ngày)
            const response = await fetch(`http://localhost:8080/api/v1/user/upgrade-duration?duration=365`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (response.ok) {
                const updatedUser = { ...user, role: 'VIP' };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setShowModal(false);
                navigate('/user');
            } else {
                alert("Lỗi nâng cấp. Vui lòng thử lại.");
                setShowModal(false);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối.");
            setShowModal(false);
        }
    };
    // -------------------------------------------


    return (
        <div className="purchase-page-wrapper">
            <Navbar />
            <div className="purchase-container">
                <div className="purchase-content-new-layout">
                    
                    {/* --- PHẦN TEXT BÊN TRÁI --- */}
                    <div className="left-text-section">
                        <h1>Travel <br /> Without Limits</h1>
                        <p>Unlimited planning, visual maps, and offline storage. Everything you need for the perfect trip.</p>
                    </div>

                    {/* --- PHẦN CARDS BÊN PHẢI --- */}
                    <div className="right-cards-section">
                        
                        {/* CARD 1: Ảnh người phụ nữ */}
                        <div className="orange-card promo-card">
                            <div className="promo-content">
                                <h3>Save More <br/> With Goodplans.</h3>
                                <p>Choose a plan and get onboard in minutes. Then get $100 credits for your next payment.</p>
                                {/* Icon mũi tên */}
                                <div className="arrow-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </div>
                            </div>
                            {/* QUAN TRỌNG: Đổi tên file 'woman-demo.png' bên dưới 
                                thành tên file thực tế trong thư mục public/img của bạn.
                            */}
                            <img src="/img/model.png" alt="Traveler" className="woman-image" />
                        </div>

                        {/* CARD 2: Gói World Explorer (Pricing) */}
                        <div className="orange-card pricing-card-final">
                            <h3>World Explorer</h3>
                            <p className="sub-head-final">What You'll Get</p>
                            <ul className="features-list-final">
                                <li><span className="check-final">✔</span> Export your plan with PDF file without limits</li>
                                <li><span className="check-final">✔</span> Generate plan with 10 times per day</li>
                                <li><span className="check-final">✔</span> Storage your plan</li>
                                <li><span className="check-final">✔</span> Interactive map views</li>
                            </ul>
                            <div className="price-tag-final">$100<span>/year</span></div>
                            
                            <button className="btn-choose-final" onClick={handleChooseClick}>
                                Choose
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- MODAL CONFIRM (GIỮ NGUYÊN LOGIC CŨ) --- */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h2>Xác nhận nâng cấp</h2>
                        </div>
                        <div className="modal-body">
                            <p>Bạn sắp nâng cấp lên gói <strong>World Explorer (1 Năm)</strong>.</p>
                            <p className="price-confirm">Giá: $100</p>
                            <p>Bạn có chắc chắn muốn thực hiện giao dịch này không?</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                            <button className="btn-confirm" onClick={handleConfirmUpgrade}>Xác nhận thanh toán</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchase;