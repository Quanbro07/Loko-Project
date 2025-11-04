import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import './Plan.css';
import React, { useState, useCallback } from 'react';
import Lottie from 'lottie-react';
import paperPlaneAnimation from '../lottie/Paper plane.json';
import Output from '../Output/Output';
import Footer from "../Footer/Footer";
import { useLanguage } from '../Language/LanguageContext';
import logo from '../img/logo.PNG';
import { useNavigate } from 'react-router-dom';

const Plan = () => {
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchIteration, setSearchIteration] = useState(0);
    const [isResultShown, setIsResultShown] = useState(false);
    const { translate } = useLanguage();
    const navigate = useNavigate();

    const startSearchProcess = useCallback(() => {
        setShowLoadingAnimation(true);
        setIsResultShown(false);
        setHasSearched(false);
        console.log("Bắt đầu tìm kiếm...");
        setTimeout(() => {
            setShowLoadingAnimation(false);
            setHasSearched(true);
            setIsResultShown(true);
            console.log('Tìm kiếm hoàn tất');
        }, 4000);
    }, []);
    const handleSearch = useCallback(() => {
        setSearchIteration(prev => prev + 1);
        startSearchProcess();
    }, [startSearchProcess]);
    const handleTryAgain = useCallback(() => {
        console.log('Tìm kiếm lại...');
        handleSearch();
    }, [handleSearch]);
    const handleAccept = useCallback(() => {
        console.log('Chấp nhận lịch trình. Chuyển tiếp...');
        navigate('/user');
    }, [navigate])

    return (
        <div>
            <div className="homepage-background">
                <Navbar />
                <Input
                    onSearch={handleSearch}
                    onTryAgain={handleTryAgain}
                    onAccept={handleAccept}
                    isResultShown={isResultShown} />
            </div>
            <div className="itinerary-results-container">
                {showLoadingAnimation && (
                    <div className="loading-animation-container">
                        <Lottie animationData={paperPlaneAnimation} loop={true} />
                    </div>
                )}
                {isResultShown && <Output key={searchIteration} />}
            </div>
            <Footer />
        </div>
    );
};

export default Plan;