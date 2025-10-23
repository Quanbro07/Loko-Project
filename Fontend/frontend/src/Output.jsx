import React, { useState, useEffect } from 'react';
import './Output.css';

const Output = () => {
    console.log("Output component is rendering.");
    const [itineraryData, setItineraryData] = useState([]);

    useEffect(() => {
        // Simulate data fetching
        setTimeout(() => {
            const dummyData = [
                {
                    diadiem: "Hồ Gươm",
                    thoigian: "08:00 - 10:00",
                    mota: "Tham quan Hồ Gươm và đền Ngọc Sơn."
                },
                {
                    diadiem: "Văn Miếu Quốc Tử Giám",
                    thoigian: "10:30 - 12:00",
                    mota: "Khám phá trường đại học đầu tiên của Việt Nam."
                },
                {
                    diadiem: "Phố Cổ",
                    thoigian: "14:00 - 17:00",
                    mota: "Dạo quanh Phố Cổ, thưởng thức ẩm thực đường phố."
                },
            ];
            setItineraryData(dummyData);
        }, 500); 
    }, []);

    return (
        <div className="output-container">
            <h3>LỊCH TRÌNH ĐỀ XUẤT</h3>
            <table className="itinerary-table">
                <thead>
                    <tr>
                        <th>Địa điểm</th>
                        <th>Thời gian</th>
                        <th>Mô tả</th>
                    </tr>
                </thead>
                <tbody>
                    {itineraryData.length === 0 ? (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>Không có dữ liệu lịch trình để hiển thị.</td>
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
