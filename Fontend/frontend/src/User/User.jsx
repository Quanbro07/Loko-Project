import './User.css'
import React, { useState } from 'react';
import avatarSample from '../img/avatar-sample.jpg';
import barcodeSample from '../img/barcode-sample.png';
import Footer from '../Footer/Footer';
import Navbar from '../Navbar/Navbar';
// Removed import { useLanguage } from '../Language/LanguageContext';

const User = () => {
    const [isEditing, setIsEditing] = useState(false);
    // Removed const { translate: dictionary } = useLanguage();

    return (
        <div className="user-page-background">
            <Navbar />
            <div className='ticket-container'>
                <div className='ticket-header'>
                    <img src="/img/plane-ticket.png" alt="Plane Ticket" className="plane-icon" />
                    <div className='ticket-company'>LOKO</div>
                </div>
                {isEditing ? (
                    <div className='edit-controls'>
                        <button className='save-button'><span>Lưu</span></button>
                        <button className='cancel-button' onClick={() => setIsEditing(false)}><span>Hủy</span></button>
                    </div>
                ) : (
                    <button className='edit-sticky-button' onClick={() => setIsEditing(true)}>
                        <span>Thay đổi thông tin</span>
                    </button>
                )}
                <div className='ticket-body'>
                    <div className='ticket-section passenger-info'>
                        <div className='info-item'>
                            <div className='label'>Họ và Tên</div>
                            <div className='value'>NGUYỄN TRỌNG</div>
                        </div>
                        <div className='info-item'>
                            <div className='label'>Ngày tháng năm sinh</div>
                            <div className='value'>01/01/2000</div>
                        </div>

                        <div className='info-item'>
                            <div className='label'>Giới tính</div>
                            <div className='value'>NAM</div>
                        </div>
                    </div>
                    <div className='ticket-section travel-stats'>
                        <div className='info-item'>
                            <div className='label'>Ngày tham gia</div>
                            <div className='value'>01/01/2023</div>
                        </div>
                        <div className='info-item'>
                            <div className='label'>Số tỉnh/thành đã đi cùng LOKO</div>
                            <div className='value'>24/34</div>
                        </div>
                    </div>
                    <div className='ticket-section avatar-section'>
                        <div className='avatar-container'>
                            <img src={avatarSample} alt="Avatar" className="avatar-img" />
                        </div>
                    </div>
                </div>
                <div className='ticket-footer'>
                    <img src={barcodeSample} className="barcode-img" />
                </div>
            </div>
            <div className='map'></div>
            <Footer className="footer" />
        </div>
    )
}

export default User;