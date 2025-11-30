import React from 'react';
import './Purchase.css'; 
import Navbar from '../Navbar/Navbar';
import { useNavigate } from 'react-router-dom';

const Purchase = () => {
    const navigate = useNavigate();

    const handleChoosePlan = (planName) => {
        // Logic xử lý khi chọn gói (ví dụ: chuyển sang trang thanh toán hoặc gọi API)
        alert(`Bạn đã chọn gói: ${planName}. Chức năng thanh toán đang phát triển.`);
    };

    return (
        <div className="purchase-page-wrapper">
                        <Navbar />
        <div className="purchase-container">

            <div className="purchase-content">
                {/* Phần giới thiệu bên trái */}
                <div className="purchase-intro">
                    <h1>Travel <br /> Without Limits</h1>
                    <p>Unlimited planning, visual maps, and offline storage. Everything you need for the perfect trip.</p>
                </div>

                {/* Phần thẻ giá bên phải */}
                <div className="pricing-cards">
                    {/* Gói Pro Traveler */}
                    <div className="pricing-card">
                        <h3>Pro Traveler</h3>
                        <p className="sub-head">What You'll Get</p>
                        <ul className="features-list">
                            <li><span className="check">✔</span> Export your plan with PDF file without limits</li>
                            <li><span className="check">✔</span> Generate plan with 10 times per day</li>
                        </ul>
                        <div className="price-tag">$2.45<span>/day</span></div>
                        <button 
                            className="btn-choose"
                            onClick={() => handleChoosePlan('Pro Traveler (VIP 1 Day)')}
                        >
                            Choose
                        </button>
                    </div>

                    {/* Gói World Explorer */}
                    <div className="pricing-card">
                        <h3>World Explorer</h3>
                        <p className="sub-head">What You'll Get</p>
                        <ul className="features-list">
                            <li><span className="check">✔</span> Export your plan with PDF file without limits</li>
                            <li><span className="check">✔</span> Generate plan with 10 times per day</li>
                            <li><span className="check">✔</span> Storage your plan</li>
                            <li><span className="check">✔</span> Interactive map views</li>
                        </ul>
                        <div className="price-tag">$100<span>/month</span></div>
                        <button 
                            className="btn-choose"
                            onClick={() => handleChoosePlan('World Explorer (VIP 1 Month)')}
                        >
                            Choose
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default Purchase;