import React, { useState } from 'react';
import Navbar from "../Navbar/Navbar";
import './Aboutus.css';
import AboutUsOutput from './AboutUsOutput';
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage

const Aboutus = () => {
    const [activeTab, setActiveTab] = useState('su-menh');
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

    const renderDescription = () => {
        switch (activeTab) {
            case 'su-menh':
                return <div className="description" id="des1">{translate('aboutus_mission_description')}</div>;
            case 'tam-nhin':
                return <div className="description" id="des2">{translate('aboutus_vision_description')}</div>;
            case 'gia-tri-cot-loi':
                return <div className="description" id="des3">{translate('aboutus_core_values_description')}</div>;
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
                    <div className="loko">{translate('homepage_loko')}</div>
                    <div className="description">{translate('aboutus_loko_website_description')}</div>
                </div>
                <div className="right-info">
                    <div className="selection-bar">
                        <div className={`selection ${activeTab === 'su-menh' ? 'active' : ''}`} onClick={() => setActiveTab('su-menh')}>{translate('aboutus_mission')}</div>
                        <div className={`selection ${activeTab === 'tam-nhin' ? 'active' : ''}`} onClick={() => setActiveTab('tam-nhin')}>{translate('aboutus_vision')}</div>
                        <div className={`selection ${activeTab === 'gia-tri-cot-loi' ? 'active' : ''}`} onClick={() => setActiveTab('gia-tri-cot-loi')}>{translate('aboutus_core_values')}</div>
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