import Input from "../Input/Input";
import Navbar from "../Navbar/Navbar";
import '../Homepage/Homepage.css';
import React, { useState } from 'react';
import Lottie from 'lottie-react';
import paperPlaneAnimation from '../lottie/Paper plane.json';
import Output from '../Output/Output';
import Footer from "../Footer/Footer";
import { useLanguage } from '../Language/LanguageContext';

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
            <div className='loko'>{translate('homepage_loko')}</div>
            <Input onSearch={handleSearch} />
            <div className="itinerary-results-container">
                {showLoadingAnimation && (
                    <div className="loading-animation-container">
                        <Lottie animationData={paperPlaneAnimation} loop={true} />
                    </div>
                )}
                {!showLoadingAnimation && hasSearched && <Output />}
            </div>
            <Footer />
        </div>
    );
};

export default Plan;