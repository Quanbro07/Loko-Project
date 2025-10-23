import React, { useState, forwardRef } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Input.css';
import { Button, Checkbox } from '@mui/material';
// import Lottie from 'lottie-react'; // Remove Lottie import
// import paperPlaneAnimation from './lottie/Paper plane.json'; // Remove Lottie animation import

const CustomDateInput = forwardRef((props, ref) => {
    const { value, onClick, placeholderText } = props;

    const getDayAndDate = (dateString) => {
        if (!dateString) return { day: '', date: '', fullDate: '', formattedDate: '', formattedDay: '', };

        const date = new Date(dateString);
        const formattedDay = date.toLocaleDateString('vi-VN', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return {
            day: formattedDay,
            date: formattedDate,
            fullDate: dateString,
            formattedDate: formattedDate,
            formattedDay: formattedDay
        };
    };

    const { formattedDay, formattedDate } = getDayAndDate(value);

    return (
        <div className="custom-date-input" onClick={onClick} ref={ref}>
            {value ? (
                <>
                    <div className="day-display">{formattedDay}</div>
                    <div className="date-display">{formattedDate}</div>
                </>
            ) : (
                <div className="placeholder-display">{placeholderText}</div>
            )}
        </div>
    );
});

const Input = ({ onSearch }) => { // Accept onSearch prop
    const [selectedDateGo, setSelectedDateGo] = useState(null);
    const [selectedDateReturn, setSelectedDateReturn] = useState(null);
    const [travelType, setTravelType] = useState('Một mình');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [destinationError, setDestinationError] = useState(false);
    const [dateGoError, setDateGoError] = useState(false);
    const [dateReturnError, setDateReturnError] = useState(false);
    const [travelTypeError, setTravelTypeError] = useState(false);
    // const [showLoadingAnimation, setShowLoadingAnimation] = useState(false); // Remove internal showLoadingAnimation
    const provinces = [
        "Hà Nội",
        "Huế",
        "Quảng Ninh",
        "Cao Bằng",
        "Lạng Sơn",
        "Lai Châu",
        "Điện Biên",
        "Sơn La",
        "Thanh Hóa",
        "Nghệ An",
        "Hà Tĩnh",
        "Tuyên Quang",
        "Lào Cai",
        "Thái Nguyên",
        "Phú Thọ",
        "Bắc Ninh",
        "Hưng Yên",
        "Hải Phòng",
        "Ninh Bình",
        "Quảng Trị",
        "Đà Nẵng",
        "Quảng Ngãi",
        "Gia Lai",
        "Khánh Hòa",
        "Lâm Đồng",
        "Đắk Lắk",
        "TP Hồ Chí Minh",
        "Đồng Nai",
        "Tây Ninh",
        "Cần Thơ",
        "Vĩnh Long",
        "Đồng Tháp",
        "Cà Mau",
        "An Giang"
    ];

    const handleSearch = () => {
        // Reset all error states at the beginning
        setDestinationError(false);
        setDateGoError(false);
        setDateReturnError(false);
        setTravelTypeError(false);

        let hasError = false;

        if (!selectedProvince) {
            setDestinationError(true);
            hasError = true;
        }
        if (!selectedDateGo) {
            setDateGoError(true);
            hasError = true;
        }
        if (!selectedDateReturn) {
            setDateReturnError(true);
            hasError = true;
        }
        if (!travelType) {
            setTravelTypeError(true);
            hasError = true;
        }

        if (hasError) {
            // No alert for error, just visual cue
            console.log("Vui lòng điền đầy đủ thông tin.");
        } else {
            console.log("Tìm kiếm thành công!");
            // setShowLoadingAnimation(true); // Remove internal showLoadingAnimation
            // // Hide the animation after 3 seconds (adjust as needed)
            // setTimeout(() => {
            //     setShowLoadingAnimation(false);
            // }, 4000);
            onSearch(); // Call onSearch prop to notify Homepage
        }
    };

    return (
        <div className='input-container'>
            <div className='destination'>
                <label htmlFor="province-select">Địa điểm bạn muốn đến:</label>
                <select className={`option-select ${destinationError ? 'input-error-flash' : ''}`} value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
                    <option value="" >--Tỉnh/Thành phố--</option>
                    {provinces.map((province, index) => (
                        <option key={index} value={province}>{province}</option>
                    ))}
                </select>
            </div>
            <div className='time'>
                <div className={`date-picker-wrapper ${dateGoError ? 'input-error-flash' : ''}`}>
                    <img src='/img/plane-ticket.png' alt="Plane Ticket" className="date-picker-icon" />
                    <DatePicker
                        selected={selectedDateGo}
                        onChange={date => setSelectedDateGo(date)}
                        dateFormat="MM-dd-yyyy"
                        placeholderText="Ngày đi"
                        showOutsideDays={false}
                        customInput={<CustomDateInput placeholderText="Ngày đi" />}
                        minDate={new Date()}
                    />
                </div>
                <div className={`date-picker-wrapper ${dateReturnError ? 'input-error-flash' : ''}`}>
                    <img src='/img/plane-ticket.png' alt="Plane Ticket" className="date-picker-icon" />
                    <DatePicker
                        selected={selectedDateReturn}
                        onChange={date => setSelectedDateReturn(date)}
                        dateFormat="MM-dd-yyyy"
                        placeholderText="Ngày về"
                        showOutsideDays={false}
                        customInput={<CustomDateInput placeholderText="Ngày về" />}
                        minDate={selectedDateGo || new Date()}
                    />
                </div>
            </div>
            <div className='amount'>
                <div className='name'>Số lượng:</div>
                <div className={`travel-type-group ${travelTypeError ? 'input-error-flash' : ''}`}>
                    <RadioGroup
                        row
                        aria-labelledby="travel-type-radio-buttons-group-label"
                        name="travel-type-radio-buttons-group"
                        value={travelType}
                        onChange={(event) => {
                            setTravelType(event.target.value);
                        }}
                    >
                        <FormControlLabel value="Solo" control={<Radio />} label="Một mình" />
                        <FormControlLabel value="Group" control={<Radio />} label="Nhóm" />
                    </RadioGroup>
                </div>
            </div>
            <div className='age'>
                <div className='age-title'>Thành phần:</div>
                <FormControlLabel className='child' value='Child' control={<Checkbox />} label="Trẻ em" />
                <FormControlLabel className='adult' value='Adult' control={<Checkbox />} label="Người lớn tuổi" />
            </div>
            <div className='type'>
                <div className='type-title'>Thể loại:</div>
                <div className='type-list'><FormControlLabel value='Cruisine' control={<Checkbox />} label="Ẩm thực" />
                    <FormControlLabel value='Adventure' control={<Checkbox />} label="Mạo hiểm" />
                    <FormControlLabel value='Rest' control={<Checkbox />} label="Nghỉ dưỡng" />
                    <FormControlLabel value='Playground' control={<Checkbox />} label="Vui chơi giải trí" />
                    <FormControlLabel value='Photograph' control={<Checkbox />} label="Chụp hình sống ảo" />
                    <FormControlLabel value='History' control={<Checkbox />} label="Văn hóa lịch sử" />
                    <FormControlLabel value='Honeymoon' control={<Checkbox />} label="Tuần trăng mật" />
                    <FormControlLabel value='Nightlife' control={<Checkbox />} label="Giải trí đêm" />
                    <FormControlLabel value='Sea' control={<Checkbox />} label="Du lịch biển đảo" /></div>

            </div>
            <div>
                <div className='hour'>Thời gian hoạt động:</div>
                <div className='hour-list'>
                    <FormControlLabel value='1st' control={<Checkbox />} label="08h-12h" />
                    <FormControlLabel value='2nd' control={<Checkbox />} label="14h-18h" />
                    <FormControlLabel value='3rd' control={<Checkbox />} label="18h-22h" />
                    <FormControlLabel value='4th' control={<Checkbox />} label="22h-24h" />
                    <FormControlLabel value='5th' control={<Checkbox />} label="24h-06h" />
                </div>
            </div>
            <div className="search-button-container">
                <button className="search-button" onClick={handleSearch}>Tìm kiếm</button>
            </div>
            {/* Remove internal Lottie animation block */}
            {/*
            {showLoadingAnimation && (
                <div className="loading-animation-container">
                    <Lottie animationData={paperPlaneAnimation} loop={true} />
                </div>
            )}
            */}
        </div>

    );
};

export default Input;
