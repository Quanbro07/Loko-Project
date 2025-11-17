import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import './Plan.css';
import React, { useState, useCallback } from 'react';
import Lottie from 'lottie-react';
import paperPlaneAnimation from '../lottie/Paper plane.json';
import Output from '../Output/Output';
import Footer from "../Footer/Footer";
import { useLanguage } from '../Language/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Plan = () => {
    // 🌟 TRẠNG THÁI CHÍNH ĐƯỢC QUẢN LÝ TẬP TRUNG 🌟
    const [isSearching, setIsSearching] = useState(false); // Thay thế showLoadingAnimation
    const [isResultShown, setIsResultShown] = useState(false);
    
    // searchIteration: 0 = Chưa tìm kiếm; 1 = Lần 1; 2 = Lần 2; v.v. Dùng làm key cho Output.
    const [searchIteration, setSearchIteration] = useState(0); 
    
    // Số lần thử lại còn lại (ban đầu là 3)
    const [tryCount, setTryCount] = useState(3); 

    const { translate } = useLanguage();
    const navigate = useNavigate();

    // Hàm thực hiện tìm kiếm (có Loading Animation)
    const startSearchProcess = useCallback(() => {
        setIsSearching(true);
        setIsResultShown(false);
        
        // Giả lập thời gian tìm kiếm
        setTimeout(() => {
            setIsSearching(false);
            setIsResultShown(true);
            console.log(`Tìm kiếm lần ${searchIteration} hoàn tất.`);
        }, 4000);
    }, [searchIteration]); 

    // Hàm xử lý nút TÌM KIẾM (Chỉ chạy lần đầu tiên)
    const handleSearch = useCallback(() => {
        if (searchIteration === 0) {
            setSearchIteration(1); // Bắt đầu lần 1
            startSearchProcess();
        }
    }, [searchIteration, startSearchProcess]);
    
    // Hàm xử lý nút THỬ LẠI (Retry)
    const handleTryAgain = useCallback(() => {
        if (tryCount > 0) {
            console.log(`Bắt đầu thử lại... Lượt còn lại: ${tryCount - 1}`);
            setTryCount(prev => prev - 1);
            setSearchIteration(prev => prev + 1); // Đảm bảo Output re-render (dùng key)
            startSearchProcess();
        } else {
            console.log('Đã hết lượt thử lại (3 lần). Chuyển hướng.');
            // Nếu hết lượt, bạn có thể chuyển hướng hoặc hiển thị thông báo
            setIsResultShown(false);
            // navigate('/currentplan');
        }
    }, [tryCount, startSearchProcess, navigate]);

    // Hàm xử lý nút CHẤP NHẬN (Accept)
    const handleAccept = useCallback(() => {
        console.log('Chấp nhận lịch trình. Chuyển tiếp...');
        navigate('/currentplan');
    }, [navigate]);

    return (
        <div>
            <div className="homepage-background">
                <Navbar />
                <Input
                    onSearch={handleSearch} // Hàm search lần đầu
                    isResultShown={isResultShown}
                    // Truyền số lần tìm kiếm để Input khóa nút
                    searchIteration={searchIteration} 
                />
            </div>
            <div className="itinerary-results-container">
                {/* HIỂN THỊ LOTTIE KHI ĐANG TÌM KIẾM */}
                {isSearching && (
                    <div className="loading-animation-container">
                        <Lottie animationData={paperPlaneAnimation} loop={true} />
                    </div>
                )}
                
                {/* HIỂN THỊ OUTPUT KHI CÓ KẾT QUẢ */}
                {isResultShown && (
                    <Output 
                        key={searchIteration} // Quan trọng: Re-render Output khi tìm kiếm lại
                        tryCount={tryCount}
                        onTryAgainClick={handleTryAgain}
                        onAcceptClick={handleAccept}
                    />
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Plan;