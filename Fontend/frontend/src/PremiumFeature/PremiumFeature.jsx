import React from 'react';
import { useAuth } from '../Auth/AuthContext'; // Điều chỉnh đường dẫn import cho đúng
import './PremiumFeature.css'; // Tạo file css tương ứng

const PremiumFeature = ({ children, fallbackText = "Tính năng dành cho Premium" }) => {
    const { user } = useAuth();
    const isVip = user?.role === 'VIP' || user?.role === 'ADMIN';

    if (isVip) {
        return <>{children}</>;
    }

    return (
        <div className="premium-feature-wrapper">
            <div className="premium-feature-content blurred">
                {children}
            </div>
            <div className="premium-lock-overlay">
                <div className="lock-icon">🔒</div>
                <p>{fallbackText}</p>
                <button className="btn-upgrade-sm" onClick={() => window.location.href='/purchase'}>
                    Nâng cấp ngay
                </button>
            </div>
        </div>
    );
};

export default PremiumFeature;