import React, { useState, useEffect } from 'react';
import './Output.css';
import { useLanguage } from '../Language/LanguageContext';

import scheduleData from './schedule.json';

// 🌟 THÊM PROPS CHO HÀM XỬ LÝ NÚT VÀ SỐ LẦN THỬ LẠI 🌟
const Output = ({ onTryAgainClick, onAcceptClick, tryCount }) => {
    console.log("Output component is rendering.");
    
    const { translate } = useLanguage();
    const [itineraryData, setItineraryData] = useState([]);
    const [deletingIndex, setDeletingIndex] = useState(null);

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

    const handleDelete = (indexToDelete) => {
        const transitionDuration = 300; 

        setDeletingIndex(indexToDelete);

        setTimeout(() => {
            setItineraryData(prevData => prevData.filter((_, index) => index !== indexToDelete));
            setDeletingIndex(null);
        }, transitionDuration);
    };

    return (
        <div className="output-container">
            <h3>{translate('output_suggested_itinerary')}</h3>
            <table className="itinerary-table">
                <thead>
                    <tr>
                        <th>{translate('output_location')}</th>
                        <th>{translate('output_time')}</th>
                        <th>{translate('output_description')}</th>
                        <th></th> 
                    </tr>
                </thead>
                <tbody>
                    {itineraryData.length === 0 && deletingIndex === null ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center' }}>{translate('output_no_itinerary_data')}</td>
                        </tr>
                    ) : (
                        itineraryData.map((item, index) => {
                            const isDeleting = index === deletingIndex;

                            return (
                                <tr 
                                    key={index}
                                    className={isDeleting ? 'deleting' : ''} 
                                >
                                    <td className=''>{item.diadiem}</td>
                                    <td>{item.thoigian}</td>
                                    <td>{item.mota}</td>
                                    <td className='delete-button-cell'>
                                        <button 
                                            className='delete' 
                                            onClick={() => handleDelete(index)}
                                            disabled={isDeleting} 
                                        >
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
            <div className='retry-accept-list'>
                {/* 🌟 HIỂN THỊ SỐ LẦN THỬ LẠI CÒN LẠI 🌟 */}
                {/* Đặt trong một div hoặc style để căn giữa nếu cần */}
                {tryCount > 0 && (
                    <p className='remaining-tries'>
                        {translate('output_remaining_tries')}: {tryCount}
                    </p>
                )}
                
                {/* 🌟 SỬ DỤNG HANDLER MỚI 🌟 */}
                <button 
                    className='output-retry-button' 
                    onClick={onTryAgainClick}
                    disabled={tryCount <= 0} // Vô hiệu hóa khi hết lượt
                >
                    {translate('output_retry_button')}
                </button>
                <button className='output-accept-button' onClick={onAcceptClick}>
                    {translate('output_accept_button')}
                </button>
            </div>
        </div>
    );
};

export default Output;