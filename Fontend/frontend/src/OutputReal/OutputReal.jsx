import React, { useState, useEffect } from 'react';
import './OutputReal.css';
import { useLanguage } from '../Language/LanguageContext';

import scheduleData from '../Output/schedule.json';

// 🌟 THÊM PROPS CHO HÀM XỬ LÝ NÚT VÀ SỐ LẦN THỬ LẠI 🌟
const OutputReal = () => {
    console.log("Output component is rendering.");
    
    const { translate } = useLanguage();
    const [itineraryData, setItineraryData] = useState([]);

    useEffect(() => {
        const processedData = scheduleData.map(item => ({
            diadiem: item.title,
            thoigian: `${item.start} - ${item.end}`,
            mota: item.description || translate('output_no_description') 
        }));

        setTimeout(() => {
            setItineraryData(processedData);
        }, 500);

    }, [translate]); 

    return (
        <div className="output-container">
            <h3>{translate('output_suggested_itinerary')}</h3>
            <table className="itinerary-table">
                <thead>
                    <tr>
                        <th>{translate('output_location')}</th>
                        <th>{translate('output_time')}</th>
                        <th>{translate('output_description')}</th>
                    </tr>
                </thead>
                <tbody>
                    {itineraryData.length === 0? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center' }}>{translate('output_no_itinerary_data')}</td>
                        </tr>
                    ) : (
                        itineraryData.map((item, index) => {
                            return (
                                <tr>
                                    <td className=''>{item.diadiem}</td>
                                    <td>{item.thoigian}</td>
                                    <td>{item.mota}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
);};

export default OutputReal;