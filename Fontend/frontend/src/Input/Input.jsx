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

    const handleSearch = () => {
        // Check if user is authenticated first
        if (!isAuthenticated) {
            openAuthModal('login');
            return;
        }

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
    };

    return (
        <div className='input-container'>
            <div className='destination'>
                <label htmlFor="province-select">{translate('input_destination_label')}</label>
                <select className={`option-select ${destinationError ? 'input-error-flash' : ''}`} value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
                    <option value="" >{translate('input_province_placeholder')}</option>
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
                        placeholderText={translate('input_date_go_placeholder')}
                        showOutsideDays={false}
                        customInput={<CustomDateInput placeholderText="input_date_go_placeholder" />}
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
                        customInput={<CustomDateInput placeholderText="input_date_return_placeholder" />}
                        minDate={selectedDateGo || new Date()}
                    />
                </div>
            </div>
            <div className='amount'>
                <div className='name'>{translate('input_quantity_label')}</div>
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
                <div className='hour-list'>
                    <FormControlLabel value='1st' control={<Checkbox />} label={translate('input_time_08h_12h')} />
                    <FormControlLabel value='2nd' control={<Checkbox />} label={translate('input_time_14h_18h')} />
                    <FormControlLabel value='3rd' control={<Checkbox />} label={translate('input_time_18h_22h')} />
                    <FormControlLabel value='4th' control={<Checkbox />} label={translate('input_time_22h_24h')} />
                    <FormControlLabel value='5th' control={<Checkbox />} label={translate('input_time_24h_06h')} />
                </div>
            </div>
            <div className="search-button-container">
                <button className="search-button" onClick={handleSearch}>{translate('input_search_button')}</button>
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
