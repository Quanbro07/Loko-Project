import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import './Plan.css';
import React, { useState } from 'react';
import Lottie from 'lottie-react';
import paperPlaneAnimation from '../lottie/Paper plane.json';
import Output from '../Output/Output';
import Footer from "../Footer/Footer";
import { useLanguage } from '../Language/LanguageContext';
import logo from '../img/logo.PNG';

const Plan = () => {
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { translate } = useLanguage();

    const handleSearch = () => {
        setShowLoadingAnimation(true);
        setHasSearched(false);

        setTimeout(() => {
            setShowLoadingAnimation(false);
            setHasSearched(true);
        }, 4000);
    };

    return (
        <div className="homepage-background">
            <Navbar />
            <Input onSearch={handleSearch} />
            <div className="itinerary-results-container">
                {showLoadingAnimation && (
                    <div className="loading-animation-container">
                        <Lottie animationData={paperPlaneAnimation} loop={true} />
                    </div>
                )}
                {!showLoadingAnimation && hasSearched && <Output />}
            </div>
            {/* <Footer /> */}
        </div>
    );
};

export default Plan;