import React, { useState, useEffect } from 'react';
import './Output.css';
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage

const Output = () => {
    console.log("Output component is rendering.");
    const [itineraryData, setItineraryData] = useState([]);
    const { translate } = useLanguage(); // Use the hook

    useEffect(() => {
        // Simulate data fetching
        setTimeout(() => {
            const dummyData = [
                {
                    diadiem: translate('output_ho_guom'),
                    thoigian: translate('output_time_0800_1000'),
                    mota: translate('output_ho_guom_description')
                },
                {
                    diadiem: translate('output_van_mieu'),
                    thoigian: translate('output_time_1030_1200'),
                    mota: translate('output_van_mieu_description')
                },
                {
                    diadiem: translate('output_old_quarter'),
                    thoigian: translate('output_time_1400_1700'),
                    mota: translate('output_old_quarter_description')
                },
            ];
            setItineraryData(dummyData);
        }, 500);
    }, []);

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
                    {itineraryData.length === 0 ? (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>{translate('output_no_itinerary_data')}</td>
                        </tr>
                    ) : (
                        itineraryData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.diadiem}</td>
                                <td>{item.thoigian}</td>
                                <td>{item.mota}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Output;
