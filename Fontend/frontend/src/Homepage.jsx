import Input from "./Input";
import Navbar from "./Navbar";
import './Homepage.css';
import React, { useState } from 'react';
import Lottie from 'lottie-react';
import paperPlaneAnimation from './lottie/Paper plane.json';
import Output from './Output';

const Homepage = () => {
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = () => {
        setShowLoadingAnimation(true);
        setHasSearched(false); // Reset hasSearched when a new search starts

        setTimeout(() => {
            setShowLoadingAnimation(false);
            setHasSearched(true); // Set hasSearched to true when loading is complete
        }, 4000); // Simulate Lottie animation duration (4 seconds)
    };

    return (
        <div className="homepage-background">
            <Navbar />
            <div className='loko'>LOKO</div>
            <Input onSearch={handleSearch} />
            <div className="itinerary-results-container">
                {showLoadingAnimation && (
                    <div className="loading-animation-container">
                        <Lottie animationData={paperPlaneAnimation} loop={true} />
                    </div>
                )}
                {!showLoadingAnimation && hasSearched && <Output />}
            </div>
        </div>
    );
};

export default Homepage;

