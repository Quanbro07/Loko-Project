import React from 'react';
import './AboutUsOutput.css';
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage

const AboutUsOutput = ({ itineraryData, id }) => {
    const { translate } = useLanguage(); // Use the hook
    return (
        <div className="aboutus-output-container" id={id}>
            <h3>{translate('aboutus_output_suggested_itinerary')}</h3>
            <table className="aboutus-itinerary-table">
                <thead>
                    <tr>
                        <th>{translate('output_location')}</th>
                        <th>{translate('output_time')}</th>
                        <th>{translate('output_description')}</th>
                    </tr>
                </thead>
                <tbody>
                    {itineraryData && itineraryData.length === 0 ? (
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

export default AboutUsOutput;
