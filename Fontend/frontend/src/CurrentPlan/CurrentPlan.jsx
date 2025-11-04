import './CurrentPlan.css'
import Navbar from '../Navbar/Navbar'
import Footer from '../Footer/Footer'
import Output from '../Output/Output';
import { useLanguage } from '../Language/LanguageContext';
import React, { useState, useEffect } from 'react';
import MyMap from '../Map/MyMap';
import MyLeafletMap from '../Map/MyLeafletMap';

const mockItineraryData = [
    { name: 'Hồ Gươm', lat: 21.028511, lng: 105.852787 },
    { name: 'Văn Miếu Quốc Tử Giám', lat: 21.02598, lng: 105.83446 },
    { name: 'Phố Cổ (Bia Tạ Hiện)', lat: 21.0331, lng: 105.8533 },
];
const CurrentPlan = () => {
    const [isEditing, setIsEditing] = useState(false);
    const { translate, setLanguage } = useLanguage();
    const [itineraryPoints, setItineraryPoints] = useState(mockItineraryData);
    return (
        <div>
            <Navbar></Navbar>
            <div className='body-container'>
                <Output></Output>
                <MyLeafletMap itineraryPoints={itineraryPoints} className='output-map' />
            </div>

            <Footer></Footer>
        </div>
    )
}

export default CurrentPlan