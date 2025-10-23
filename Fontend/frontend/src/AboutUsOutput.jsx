import React from 'react';
import './AboutUsOutput.css';

const AboutUsOutput = ({ itineraryData, id }) => {
    return (
        <div className="aboutus-output-container" id={id}>
            <h3>GỢI Ý DU LỊCH</h3>
            <table className="aboutus-itinerary-table">
                <thead>
                    <tr>
                        <th>Địa điểm</th>
                        <th>Thời gian</th>
                        <th>Mô tả</th>
                    </tr>
                </thead>
                <tbody>
                    {itineraryData && itineraryData.length === 0 ? (
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

export default AboutUsOutput;
