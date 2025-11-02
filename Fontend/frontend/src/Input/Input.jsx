import React, { useState, forwardRef } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Input.css';
import { Button, Checkbox } from '@mui/material';
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage
import { useAuth } from '../Auth/AuthContext'; // Import useAuth
// import Lottie from 'lottie-react'; // Remove Lottie import
// import paperPlaneAnimation from './lottie/Paper plane.json'; // Remove Lottie animation import
import logo from '../img/logo.PNG';
const CustomDateInput = forwardRef((props, ref) => {
    const { value, onClick, placeholderText } = props;
    const { translate } = useLanguage(); // Use the hook

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
                <div className="placeholder-display">{translate(placeholderText)}</div>
            )}
        </div>
    );
});

const Input = ({ onSearch }) => { // Accept onSearch prop
    const [selectedDateGo, setSelectedDateGo] = useState(null);
    const [selectedDateReturn, setSelectedDateReturn] = useState(null);
    const { translate } = useLanguage(); // Use the hook
    const { isAuthenticated, openAuthModal } = useAuth(); // Use the auth hook
    const [travelType, setTravelType] = useState(translate('input_travel_type_solo'));
    const [selectedProvince, setSelectedProvince] = useState('');
    const [destinationError, setDestinationError] = useState(false);
    const [dateGoError, setDateGoError] = useState(false);
    const [dateReturnError, setDateReturnError] = useState(false);
    const [travelTypeError, setTravelTypeError] = useState(false);
    // const [showLoadingAnimation, setShowLoadingAnimation] = useState(false); // Remove internal showLoadingAnimation
    const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2, 3
    const totalSteps = 4; // si1, si2, si3, si4
    const getTranslatedProvinces = () => {
        return [
            translate("input_province_ha_noi"),
            translate("input_province_hue"),
            translate("input_province_quang_ninh"),
            translate("input_province_cao_bang"),
            translate("input_province_lang_son"),
            translate("input_province_lai_chau"),
            translate("input_province_dien_bien"),
            translate("input_province_son_la"),
            translate("input_province_thanh_hoa"),
            translate("input_province_nghe_an"),
            translate("input_province_ha_tinh"),
            translate("input_province_tuyen_quang"),
            translate("input_province_lao_cai"),
            translate("input_province_thai_nguyen"),
            translate("input_province_phu_tho"),
            translate("input_province_bac_ninh"),
            translate("input_province_hung_yen"),
            translate("input_province_hai_phong"),
            translate("input_province_ninh_binh"),
            translate("input_province_quang_tri"),
            translate("input_province_da_nang"),
            translate("input_province_quang_ngai"),
            translate("input_province_gia_lai"),
            translate("input_province_khanh_hoa"),
            translate("input_province_lam_dong"),
            translate("input_province_dak_lak"),
            translate("input_province_hcmc"), // Assuming you have this key for TP Hồ Chí Minh
            translate("input_province_dong_nai"),
            translate("input_province_tay_ninh"),
            translate("input_province_can_tho"),
            translate("input_province_vinh_long"),
            translate("input_province_dong_thap"),
            translate("input_province_ca_mau"),
            translate("input_province_an_giang")
        ];
    };

    const provinces = getTranslatedProvinces();
    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prevStep => prevStep - 1);
        }
    }
    const handleNext = () => {
        let stepHasError = false;
        if (currentStep === 0 && !selectedProvince) {
            setDestinationError(true);
            stepHasError = true;
        } else {
            setDestinationError(false);
        }

        if (currentStep === 1) {
            if (!selectedDateGo) {
                setDateGoError(true);
                stepHasError = true;
            } else {
                setDateGoError(false);
            }
            if (!selectedDateReturn) {
                setDateReturnError(true);
                stepHasError = true;
            } else {
                setDateReturnError(false);
            }
        }

        if (currentStep === 2 && !travelType) {
            setTravelTypeError(true);
            stepHasError = true;
        } else {
            setTravelTypeError(false);
        }

        if (stepHasError) {
            console.log(translate('input_fill_all_info'));
            return; // Dừng lại nếu có lỗi
        }


        // Chuyển sang bước tiếp theo
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prevStep => prevStep + 1);
        } else if (currentStep === totalSteps - 1) {
            // Nếu đã ở bước cuối cùng, gọi handleSearch (nếu cần)
            handleSearch();
        }
    }
    const handleSearch = () => {
        console.log(translate('input_fill_all_info'));
        // Check if user is authenticated first
        if (!isAuthenticated) {
            openAuthModal('login');
            return;
        }
        let hasError = false;
        if (!selectedProvince || !selectedDateGo || !selectedDateReturn || !travelType) {
            hasError = true;
        }
        if (hasError) {
            // No alert for error, just visual cue
            console.log(translate('input_fill_all_info'));
        } else {
            console.log(translate('input_search_success'));
            // setShowLoadingAnimation(true); // Remove internal showLoadingAnimation
            // // Hide the animation after 3 seconds (adjust as needed)
            // setTimeout(() => {
            //     setShowLoadingAnimation(false);
            // }, 4000);
            onSearch(); // Call onSearch prop to notify Homepage
        }
    }
    // setShowLoadingAnimation(true); // Remove internal showLoadingAnimation
    // // Hide the animation after 3 seconds (adjust as needed)
    // setTimeout(() => {
    const transformValue = `translateX(${currentStep * -25}%)`;
    const [startHour, setStartHour] = useState('09');
    const [startMinute, setStartMinute] = useState('00');
    const [endHour, setEndHour] = useState('17');
    const [endMinute, setEndMinute] = useState('00');

    // Mảng cho giờ (00 -> 24)
    const hours = Array.from({ length: 25 }, (_, i) => String(i).padStart(2, '0'));
    // Mảng cho phút (00 -> 59)
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
    return (
        <div className='input-container'>
            <img className='loko-logo' src={logo} />
            <div className='slide-wrapper' style={{ transform: transformValue }}>
                <div className='sliding-input step-slide' id='si1'>
                    <div className='destination'>
                        <div className="province-select">{translate('input_destination_label')}</div>
                        <select className={`option-select ${destinationError ? 'input-error-flash' : ''}`} value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
                            <option value="" >{translate('input_province_placeholder')}</option>
                            {provinces.map((province, index) => (
                                <option key={index} value={province}>{province}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className='sliding-input step-slide' id='si2'>
                    <div className="province-select">{translate('input_time_label')}</div>
                    <div className='time'>
                        <div className={`date-picker-wrapper ${dateGoError ? 'input-error-flash' : ''}`}>
                            <img src='/img/plane-ticket.png' alt="Plane Ticket" className="date-picker-icon" />
                            <DatePicker
                                selected={selectedDateGo}
                                onChange={date => setSelectedDateGo(date)}
                                dateFormat="MM-dd-yyyy"
                                placeholderText={translate('input_date_go_placeholder')}
                                showOutsideDays={false}
                                customInput={<CustomDateInput placeholderText="input_date_go_placeholder" className="date-time-placeholder" />}
                                minDate={new Date()}
                            />
                        </div>
                        <div className={`date-picker-wrapper ${dateReturnError ? 'input-error-flash' : ''}`}>
                            <img src='/img/plane-ticket.png' alt="Plane Ticket" className="date-picker-icon" />
                            <DatePicker
                                selected={selectedDateReturn}
                                onChange={date => setSelectedDateReturn(date)}
                                dateFormat="MM-dd-yyyy"
                                placeholderText={translate('input_date_return_placeholder')}
                                showOutsideDays={false}
                                customInput={<CustomDateInput placeholderText="input_date_return_placeholder" className="date-time-placeholder" />}
                                minDate={selectedDateGo || new Date()}
                            />
                        </div>
                    </div>
                </div>
                <div className='sliding-input step-slide' id='si3'>
                    <div className='amount'>
                        <div className='name'>{translate('input_quantity_label')}</div>
                        <div className={`travel-type-group ${travelTypeError ? 'input-error-flash' : ''}`}>
                            <RadioGroup
                                row
                                className='radio-group'
                                aria-labelledby="travel-type-radio-buttons-group-label"
                                name="travel-type-radio-buttons-group"
                                value={travelType}
                                onChange={(event) => {
                                    setTravelType(event.target.value);
                                }}
                            >
                                <FormControlLabel value={translate('input_travel_type_solo')} control={<Radio />} label={translate('input_travel_type_solo')} />
                                <FormControlLabel value={translate('input_travel_type_group')} control={<Radio />} label={translate('input_travel_type_group')} />
                            </RadioGroup>
                        </div>
                    </div>
                    <div className='age'>
                        <div className='age-title'>{translate('input_component_label')}</div>
                        <FormControlLabel className='child' value='Child' control={<Checkbox />} label={translate('input_child')} />
                        <FormControlLabel className='adult' value='Adult' control={<Checkbox />} label={translate('input_elderly')} />
                    </div>
                </div>
                <div className='sliding-input step-slide' id='si4'>
                    <div className='type'>
                        <div className='type-title'>{translate('input_category_label')}</div>
                        <div className='type-list'><FormControlLabel value='Cruisine' control={<Checkbox />} label={translate('input_cuisine')} />
                            <FormControlLabel value='Adventure' control={<Checkbox />} label={translate('input_adventure')} />
                            <FormControlLabel value='Rest' control={<Checkbox />} label={translate('input_rest')} />
                            <FormControlLabel value='Playground' control={<Checkbox />} label={translate('input_entertainment')} />
                            <FormControlLabel value='Photograph' control={<Checkbox />} label={translate('input_photography')} />
                            <FormControlLabel value='History' control={<Checkbox />} label={translate('input_history_culture')} />
                            <FormControlLabel value='Honeymoon' control={<Checkbox />} label={translate('input_honeymoon')} />
                            <FormControlLabel value='Nightlife' control={<Checkbox />} label={translate('input_nightlife')} />
                            <FormControlLabel value='Sea' control={<Checkbox />} label={translate('input_beach_island_tourism')} /></div>
                    </div>
                    <div>
                        <div className='hour'>{translate('input_operation_time_label')}</div>
                        <div className="time-input-container">
                            {/* -------------------- 1. KHỐI THỜI GIAN BẮT ĐẦU (START TIME) -------------------- */}
                            <div className="time-group">
                                {/* Giờ Bắt đầu */}
                                <select
                                    className="time-select hour"
                                    value={startHour}
                                    onChange={(e) => setStartHour(e.target.value)}
                                >
                                    {hours.map(h => <option key={`sh-${h}`} value={h}>{h}</option>)}
                                </select>

                                {/* Dấu ngăn cách Giờ và Phút */}
                                <span className="separator">:</span>

                                {/* Phút Bắt đầu */}
                                <select
                                    className="time-select minute"
                                    value={startMinute}
                                    onChange={(e) => setStartMinute(e.target.value)}
                                >
                                    {minutes.map(m => <option key={`sm-${m}`} value={m}>{m}</option>)}
                                </select>
                            </div>

                            {/* -------------------- 2. DẤU NGĂN CÁCH GIỮA START VÀ END -------------------- */}
                            <span className="main-separator">-</span>

                            {/* -------------------- 3. KHỐI THỜI GIAN KẾT THÚC (END TIME) -------------------- */}
                            <div className="time-group">
                                {/* Giờ Kết thúc */}
                                <select
                                    className="time-select hour"
                                    value={endHour}
                                    onChange={(e) => setEndHour(e.target.value)}
                                >
                                    {hours.map(h => <option key={`eh-${h}`} value={h}>{h}</option>)}
                                </select>

                                {/* Dấu ngăn cách Giờ và Phút */}
                                <span className="separator">:</span>

                                {/* Phút Kết thúc */}
                                <select
                                    className="time-select minute"
                                    value={endMinute}
                                    onChange={(e) => setEndMinute(e.target.value)}
                                >
                                    {minutes.map(m => <option key={`em-${m}`} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='button-list'>
                {currentStep > 0 && (
                    <button className='prev-button' onClick={handlePrev}>{translate('input_prev_button')}</button>
                )}
                <button className="search-button" onClick={handleSearch}>{translate('input_search_button')}</button>
                {currentStep < totalSteps - 1 && (
                    <button className="next-button" onClick={handleNext}>{translate('input_next_button')}</button>
                )}
            </div>
        </div>
    )
};
export default Input;
