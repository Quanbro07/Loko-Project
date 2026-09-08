import React from 'react';
import { useAuth } from '../Auth/AuthContext';
import './PremiumFeature.css';
import { useNavigate } from 'react-router-dom';

const PremiumFeature = ({ children, fallbackText = "Tính năng dành cho Premium" }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Logic check VIP
    const isVip = user?.role === 'VIP' || user?.role === 'ADMIN';

    // 1. TRƯỜNG HỢP VIP: Hiển thị nội dung thật (Bản đồ, Thời tiết...)
    if (isVip) {
        return <>{children}</>;
    }

    // 2. TRƯỜNG HỢP USER: Ẩn hoàn toàn nội dung thật, thay bằng khung khóa
    return (
        <div className="premium-feature-wrapper locked-mode">
            {/* Không còn render {children} ở đây nữa -> Map sẽ không được tải */}
            
            <div className="premium-lock-overlay">
                <div className="lock-icon-lg">🔒</div>
                <p className="lock-text">{fallbackText}</p>
                <button className="btn-upgrade-sm" onClick={() => navigate('/purchase')}>
                    Nâng cấp Premium
                </button>
            </div>
        </div>
    );
};

export default PremiumFeature;