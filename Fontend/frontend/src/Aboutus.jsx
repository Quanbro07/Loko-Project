import React, { useState } from 'react';
import Navbar from "./Navbar";
import './Aboutus.css';
import AboutUsOutput from './AboutUsOutput';

const Aboutus = () => {
    const [activeTab, setActiveTab] = useState('su-menh');

    const dataSet1 = [
        {
            diadiem: "Mỹ Khê",
            thoigian: "06:00",
            mota: "Tắm biển buổi sáng."
        },
        {
            diadiem: "Bà Nà hill",
            thoigian: "13:30",
            mota: "Di chuyển từ Đà Nẵng sang Bà Nà hill."
        },
        {
            diadiem: "Phố cổ Hội An",
            thoigian:"08:00",
            mota:"Thăm phố cổ, chèo thuyền trên sông"
        }
    ];

    const dataSet2 = [
        {
            diadiem: "TP. Hồ Chí Minh",
            thoigian: "1 ngày",
            mota: "Tham quan Dinh Độc Lập, Nhà thờ Đức Bà."
        },
        {
            diadiem: "Phú Quốc",
            thoigian: "4 ngày 3 đêm",
            mota: "Thư giãn tại bãi biển, khám phá VinWonders."
        },
    ];

    const dataSet3 = [
        {
            diadiem: "Cần Thơ",
            thoigian: "2 ngày",
            mota: "Du thuyền chợ nổi Cái Răng, thưởng thức trái cây."
        },
    ];

    const renderDescription = () => {
        switch (activeTab) {
            case 'su-menh':
                return <div className="description" id="des1">Sứ mệnh của Loko là đơn giản hóa triệt để quá trình lập kế hoạch du lịch bằng cách cung cấp các đề xuất thông minh, được cá nhân hóa cao, giúp mọi người khám phá thế giới một cách dễ dàng và đáng nhớ nhất.</div>;
            case 'tam-nhin':
                return <div className="description" id="des2">Trở thành nền tảng lập kế hoạch du lịch tích hợp AI hàng đầu, nơi mọi chuyến đi, dù lớn hay nhỏ, đều được thiết kế hoàn hảo chỉ bằng vài cú nhấp chuột.</div>;
            case 'gia-tri-cot-loi':
                return <div className="description" id="des3">Trên hành trình phát triển, LOKO luôn lấy giá trị cốt lõi làm kim chỉ nam cho mọi hoạt động: Trung thành và trung thực trong từng dự án, đặt khách hàng lên vị trí cao nhất, đề cao tính nhân văn và lợi ích cộng đồng, sáng tạo không ngừng để tạo nên sự khác biệt. Đây là động lực để không ngừng đổi mới, nâng cao trải nghiệm người tiêu dùng, tạo nên những cột mốc vượt thời gian cho mỗi cuộc cải cách của LOKO.</div>;
            default:
                return null;
        }
    };

    return (
        <div>
            <Navbar />
            <div className="banner"></div>
            <div className="info">
                <div className="left-info">
                    <div className="loko">LOKO</div>
                    <div className="description">LOKO-Website giúp bạn tiết kiệm thời gian cho chuyến du lịch được phát triển bởi tập đoàn LOKO </div>
                </div>
                <div className="right-info">
                    <div className="selection-bar">
                        <div className={`selection ${activeTab === 'su-menh' ? 'active' : ''}`} onClick={() => setActiveTab('su-menh')}>Sứ mệnh</div>
                        <div className={`selection ${activeTab === 'tam-nhin' ? 'active' : ''}`} onClick={() => setActiveTab('tam-nhin')}>Tầm nhìn</div>
                        <div className={`selection ${activeTab === 'gia-tri-cot-loi' ? 'active' : ''}`} onClick={() => setActiveTab('gia-tri-cot-loi')}>Giá trị cốt lõi</div>
                    </div>
                    <div className="description-box">
                        {renderDescription()}
                    </div>
                </div>
            </div>
            <div className="sample-container">
                <AboutUsOutput itineraryData={dataSet1} id="s1" />
                <AboutUsOutput itineraryData={dataSet2} id="s2" />
                <AboutUsOutput itineraryData={dataSet3} id="s3" />
            </div>
        </div>
    )
}

export default Aboutus;