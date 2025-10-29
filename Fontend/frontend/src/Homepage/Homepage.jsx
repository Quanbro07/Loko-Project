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
import Ad from '../Ad/Ad';

const Homepage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { translate } = useLanguage();

    const dataSet1 = [
        {
            diadiem: translate('planning_ninhbinh_tamcoc'),
            thoigian: translate('8am'),
            mota: translate('planning_ninhbinh_tamcoc_description')
        },
        {
            diadiem: translate('planning_ninhbinh_trangan'),
            thoigian: translate('12pm'),
            mota: translate('planning_ninhbinh_trangan_description')
        },
        {
            diadiem: translate('planning_ninhbinh_hangmua'),
            thoigian: translate('4pm'),
            mota: translate('planning_ninhbinh_hangmua_description')
        }
    ];

    const dataSet2 = [
        {
            diadiem: translate('planning_phuquy_dautruong'),
            thoigian: translate('8am'),
            mota: translate('planning_phuquy_dautruong_description')
        },
        {
            diadiem: translate('planning_phuquy_lan'),
            thoigian: translate('1pm'),
            mota: translate('planning_phuquy_lan_description')
        },
        {
            diadiem: translate('planning_phuquy_docphuot'),
            thoigian: translate('6am'),
            mota: translate('planning_phuquy_docphuot_description')
        },
    ];

    const dataSet3 = [
        {
            diadiem: translate('planning_fansipan_tamquan'),
            thoigian: translate('8am'),
            mota: translate('planning_fansipan_tamquan_description')
        },
        {
            diadiem: translate('planning_fansipan_baothap'),
            thoigian: translate('10am'),
            mota: translate('planning_fansipan_baothap_description')
        },
    ];

    const dataSet4 = [
        {
            diadiem: translate('planning_danang_mykhe'),
            thoigian: translate('6am'),
            mota: translate('planning_danang_mykhe_description')
        },
        {
            diadiem: translate('planning_danang_hoian'),
            thoigian: translate('2pm'),
            mota: translate('planning_danang_hoian_description')
        },
        {
            diadiem: translate('planning_danang_chualinhung'),
            thoigian: translate('8am'),
            mota: translate('planning_danang_chualinhung_description')
        },
    ];

    const dataSet5 = [
        {
            diadiem: translate('planning_hcm_cafe'),
            thoigian: translate('5am'),
            mota: translate('planning_hcm_cafe_description')
        },
        {
            diadiem: translate('planning_hcm_baotang'),
            thoigian: translate('9am'),
            mota: translate('planning_hcm_baotang_description')
        },
        {
            diadiem: translate('planning_hcm_nhahang'),
            thoigian: translate('6pm'),
            mota: translate('planning_hcm_nhahang_description')
        },
        {
            diadiem: translate('planning_hcm_bar'),
            thoigian: translate('11pm'),
            mota: translate('planning_hcm_bar_description')
        }
    ]

    const slidesData = [
        {
            image: slide1,
            title: translate('planning_ninhbinh_title'),
            dataSet: dataSet1,
        },
        {
            image: slide2,
            title: translate('planning_phuquy_title'),
            dataSet: dataSet2,
        },
        {
            image: slide3,
            title: translate('planning_fansipan_title'),
            dataSet: dataSet3,
        },
        {
            image: slide4,
            title: translate('planning_danang_title'),
            dataSet: dataSet4,
        },
        {
            image: slide5,
            title: translate('planning_hcm_title'),
            dataSet: dataSet5,
        }
    ];

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide === slidesData.length - 1 ? 0 : prevSlide + 1));
        }, 5000);

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
                <Lottie
                    animationData={flyingBirds}
                    loop={true}
                    autoplay={true}
                    className="flying-birds-animation"
                />
                <div className='carousel-container' style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {slidesData.map((slide, index) => (
                        <div key={index} className='carousel-item' style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            <div className='glass-itinerary-box'>
                                <div className='slide-info-box'>
                                    <h3 className='slide-title'>{slide.title}</h3>
                                    <div className='planning-table'>
                                        <div className='table-header'>
                                            <span>{translate('output_location')}</span>
                                            <span>{translate('output_time')}</span>
                                            <span className='description-title'>{translate('output_description')}</span>
                                        </div>
                                        {slide.dataSet.map((item, itemIndex) => (
                                            <div key={itemIndex} className='table-row'>
                                                <span>{item.diadiem}</span>
                                                <span className='time-value'>{item.thoigian}</span>
                                                <span>{item.mota}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={prevSlide} className='carousel-button prev'>&#10094;</button>
                <button onClick={nextSlide} className='carousel-button next'>&#10095;</button>
            </div>
            <Ad className="ad"></Ad>
            <Footer></Footer>
        </div>
    );
};

export default Homepage;
