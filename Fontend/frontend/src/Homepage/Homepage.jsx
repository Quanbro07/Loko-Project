import React, { useState, useEffect } from 'react';
import "./Homepage.css";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage

const Homepage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { translate } = useLanguage(); // Use the hook

    const dataSet1 = [
        {
            diadiem: translate('aboutus_my_khe'),
            thoigian: translate('aboutus_time_0600'),
            mota: translate('aboutus_morning_swim')
        },
        {
            diadiem: translate('aboutus_ba_na_hill'),
            thoigian: translate('aboutus_time_1330'),
            mota: translate('aboutus_move_to_ba_na_hill')
        },
        {
            diadiem: translate('aboutus_hoi_an_ancient_town'),
            thoigian: translate('aboutus_time_0800'),
            mota: translate('aboutus_visit_ancient_town')
        }
    ];

    const dataSet2 = [
        {
            diadiem: translate('aboutus_hcmc'),
            thoigian: translate('aboutus_one_day'),
            mota: translate('aboutus_hcmc_description')
        },
        {
            diadiem: translate('aboutus_phu_quoc'),
            thoigian: translate('aboutus_four_days_three_nights'),
            mota: translate('aboutus_phu_quoc_description')
        },
    ];

    const dataSet3 = [
        {
            diadiem: translate('aboutus_can_tho'),
            thoigian: translate('aboutus_two_days'),
            mota: translate('aboutus_can_tho_description')
        },
    ];

    const slidesData = [
        {
            image: '/img/aboutusbanner.jpg', // Example image path
            title: 'Lịch trình Đà Nẵng',
            dataSet: dataSet1,
        },
        {
            image: '/img/aboutusbanner1.jpg',
            title: 'Lịch trình TP.HCM',
            dataSet: dataSet2,
        },
        {
            image: '/img/bgc-homepage.png',
            title: 'Lịch trình Cần Thơ',
            dataSet: dataSet3,
        },
    ];

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide === slidesData.length - 1 ? 0 : prevSlide + 1));
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(slideInterval);
    }, [slidesData.length]);

    const nextSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === slidesData.length - 1 ? 0 : prevSlide + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide === 0 ? slidesData.length - 1 : prevSlide - 1));
    };

    return (
        <div>
            <Navbar></Navbar>
            <div className='tour-sample'>
                <div className='carousel-container' style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {slidesData.map((slide, index) => (
                        <div key={index} className='carousel-item' style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className='slide-info-box'>
                                <h3>{slide.title}</h3>
                                <div className='planning-table'>
                                    <div className='table-header'>
                                        <span>{translate('output_location')}</span>
                                        <span>{translate('output_time')}</span>
                                        <span>{translate('output_description')}</span>
                                    </div>
                                    {slide.dataSet.map((item, itemIndex) => (
                                        <div key={itemIndex} className='table-row'>
                                            <span>{item.diadiem}</span>
                                            <span>{item.thoigian}</span>
                                            <span>{item.mota}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={prevSlide} className='carousel-button prev'>&#10094;</button>
                <button onClick={nextSlide} className='carousel-button next'>&#10095;</button>
            </div>
            <Footer></Footer>
        </div>
    );
};

export default Homepage;
