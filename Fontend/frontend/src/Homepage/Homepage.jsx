import React, { useState, useEffect } from 'react';
import "./Homepage.css";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { useLanguage } from '../Language/LanguageContext';
import slide1 from '../img/slide1.jpg';
import slide2 from '../img/slide2.jpg';
import slide3 from '../img/slide3.jpg';
import slide4 from '../img/slide4.jpg';
import slide5 from '../img/slide5.jpg';
import flyingBirds from '../img/flying-birds.json';
import Lottie from 'lottie-react';
import pop1 from '../img/pu1.jpg';
import pop2 from '../img/pu2.jpg';
import Ad from '../Ad/Ad';
import { useNavigate } from 'react-router-dom';
import logo from '../img/logo.PNG';
import SlidingList from '../SlidingList/SlidingList';

const Homepage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentAd, setCurrentAd] = useState(0); // New state for ad images
    const { translate } = useLanguage();
    const navigate = useNavigate(); // Initialize useNavigate

    const adImages = [pop1, pop2, slide1]; // Array of ad images

    useEffect(() => {
        const adInterval = setInterval(() => {
            setCurrentAd((prevAd) => (prevAd === adImages.length - 1 ? 0 : prevAd + 1));
        }, 1000);
        return () => clearInterval(adInterval);
    }, [adImages.length]);

    const [showModal, setShowModal] = useState(false);
    const modalTimer = React.useRef(null);

    useEffect(() => {
        modalTimer.current = setTimeout(() => {
            setShowModal(true);
        }, 5000);

        return () => {
            clearTimeout(modalTimer.current);
        };
    }, []);

    const handleGetStartedClick = () => {
        clearTimeout(modalTimer.current);
        navigate('/search');
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };
    return (
        <div>
            <Navbar></Navbar>
            <div>
                <div className='travel-with-loko'>
                    {translate("travel_with_loko").replace('LOKO', '')}
                    <img src={logo} alt="LOKO Logo" className='loko-in-text-logo' />
                </div>
                <div className="homepage-banner">
                    <div className='left-column'>
                        <img className='pop-img' src={adImages[currentAd]} alt="Advertisement" />
                    </div>
                    <div className='right-column'>
                        <div className='banner-text'>{translate("banner_text")}</div>
                        <div className='banner-subtext'>{translate("banner_subtext")}</div>
                        <button className='get-started' onClick={handleGetStartedClick}>{translate("get_started")}</button>
                    </div>
                </div>
            </div>
            <Ad className="ad"></Ad>
            <SlidingList className="sliding-list"></SlidingList>
            <Footer></Footer>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{translate("modal_title")}</h2>
                        <p>{translate("modal_message")}</p>
                        <button className='close-button' onClick={handleCloseModal}>X</button>
                        <button className='get-started' onClick={handleGetStartedClick}>{translate("get_started")}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Homepage;
