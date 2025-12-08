import React, { useState, forwardRef } from "react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Input.css";
import { Button, Checkbox } from "@mui/material";
import { useLanguage } from "../Language/LanguageContext"; // Import useLanguage
import { useAuth } from "../Auth/AuthContext"; // Import useAuth
import { useNavigate } from "react-router-dom";
import logo from "../img/logo.PNG";

const CustomDateInput = forwardRef((props, ref) => {
  const { value, onClick, placeholderText } = props;
  const { translate } = useLanguage(); // Use the hook

  const getDayAndDate = (dateString) => {
    if (!dateString)
      return {
        day: "",
        date: "",
        fullDate: "",
        formattedDate: "",
        formattedDay: "",
      };
    const date = new Date(dateString);
    const formattedDay = date.toLocaleDateString("vi-VN", { weekday: "long" });
    const formattedDate = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      formattedDay,
      formattedDate,
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

const Input = ({
  onSearch,
  isResultShown,
  searchIteration,
  onTryAgain,
  onAccept,
}) => {
  const [selectedDateGo, setSelectedDateGo] = useState(null);
  const [selectedDateReturn, setSelectedDateReturn] = useState(null);
  const { translate } = useLanguage(); // Use the hook
  const { isAuthenticated } = useAuth(); // Use the auth hook
  const navigate = useNavigate();

  const [travelType, setTravelType] = useState("Solo");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [hasChildren, setHasChildren] = useState(false);
  const [hasElders, setHasElders] = useState(false);

  const [selectedHobbies, setSelectedHobbies] = useState([]);

  const [destinationError, setDestinationError] = useState(false);
  const [dateGoError, setDateGoError] = useState(false);
  const [dateReturnError, setDateReturnError] = useState(false);
  const [travelTypeError, setTravelTypeError] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tryCount, setTryCount] = useState(3);

  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("17");
  const [endMinute, setEndMinute] = useState("00");
  const [locations, setLocations] = useState([]);
  const handleHobbyChange = (event) => {
    const value = event.target.value;

    setSelectedHobbies((prev) => {
      // Nếu hobby đó đang được chọn thì bỏ chọn (trở về rỗng)
      if (prev.includes(value)) {
        return [];
      } else {
        // Nếu chưa chọn, thì set mảng chỉ chứa duy nhất hobby mới này
        // (Điều này sẽ tự động bỏ chọn các hobby khác)
        return [value];
      }
    });
  };

  // Mapping Province hiển thị sang Enum Backend (Cần bổ sung cho khớp Java)
  const getProvinceEnum = (displayValue) => {
    // Đây là ví dụ, bạn cần map đúng với EProvince trong Java
    // Cách tốt hơn là value của <option> nên là Enum Key, còn hiển thị là text
    return displayValue;
  };

  // Mapping Hobby checkbox value sang Enum Backend
  const getHobbyEnum = (hobbyList) => {
    if (!hobbyList || hobbyList.length === 0) return "BEACHISLANDTOUR"; // Giá trị mặc định
    // Lấy hobby đầu tiên user chọn để map (vì Backend hiện tại nhận 1 hobby chính)
    const primaryHobby = hobbyList[0];
    return HOBBY_MAPPING[primaryHobby] || "BEACHISLANDTOUR";
  };

  const provinceOptions = [
    { value: "HaNoi", label: translate("input_province_ha_noi") },
    { value: "Hue", label: translate("input_province_hue") },
    { value: "QuangNinh", label: translate("input_province_quang_ninh") },
    { value: "CaoBang", label: translate("input_province_cao_bang") },
    { value: "LangSon", label: translate("input_province_lang_son") },
    { value: "LaiChau", label: translate("input_province_lai_chau") },
    { value: "DienBien", label: translate("input_province_dien_bien") },
    { value: "SonLa", label: translate("input_province_son_la") },
    { value: "ThanhHoa", label: translate("input_province_thanh_hoa") },
    { value: "NgheAn", label: translate("input_province_nghe_an") },
    { value: "HaTinh", label: translate("input_province_ha_tinh") },
    { value: "TuyenQuang", label: translate("input_province_tuyen_quang") },
    { value: "LaoCai", label: translate("input_province_lao_cai") },
    { value: "ThaiNguyen", label: translate("input_province_thai_nguyen") },
    { value: "PhuTho", label: translate("input_province_phu_tho") },
    { value: "BacNinh", label: translate("input_province_bac_ninh") },
    { value: "HungYen", label: translate("input_province_hung_yen") },
    { value: "HaiPhong", label: translate("input_province_hai_phong") },
    { value: "NinhBinh", label: translate("input_province_ninh_binh") },
    { value: "QuangTri", label: translate("input_province_quang_tri") },
    { value: "DaNang", label: translate("input_province_da_nang") },
    { value: "QuangNgai", label: translate("input_province_quang_ngai") },
    { value: "GiaLai", label: translate("input_province_gia_lai") },
    { value: "KhanhHoa", label: translate("input_province_khanh_hoa") },
    { value: "LamDong", label: translate("input_province_lam_dong") },
    { value: "DakLak", label: translate("input_province_dak_lak") },
    { value: "TPHCM", label: translate("input_province_hcmc") },
    { value: "DongNai", label: translate("input_province_dong_nai") },
    { value: "TayNinh", label: translate("input_province_tay_ninh") },
    { value: "CanTho", label: translate("input_province_can_tho") },
    { value: "VinhLong", label: translate("input_province_vinh_long") },
    { value: "DongThap", label: translate("input_province_dong_thap") },
    { value: "CaMau", label: translate("input_province_ca_mau") },
    { value: "AnGiang", label: translate("input_province_an_giang") },
  ];

  const HOBBY_MAPPING = {
    Sea: "BEACHISLANDTOUR",
    Cruisine: "CUISINE",
    History: "HISTORYCULTURE",
    Adventure: "ADVENTURE",
    Rest: "RELAXATION",
    Playground: "ENTERTAINMENT",
    Photograph: "PHOTOGRAPHY",
    Honeymoon: "HONEYMOON",
    Nightlife: "NIGHTLIFE",
  };

  const handleTryAgainClick = () => {
    const newTryCount = tryCount - 1;
    setTryCount(newTryCount);
    if (newTryCount <= 0) {
      console.log("Try count reached 0. Navigating to /currentplan");
      setIsModalOpen(false);
      navigate("/currentplan");
    } else {
      console.log("Remaining tries: ${newTryCount}");
      setIsModalOpen(false);
      if (onTryAgain) onTryAgain();
      handleSearch();
    }
  };

  const handleAcceptClick = () => {
    setIsModalOpen(false);
    if (onAccept) onAccept();
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prevStep) => prevStep - 1);
    }
  };
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
      console.log(translate("input_fill_all_info"));
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prevStep) => prevStep + 1);
    } else if (currentStep === totalSteps - 1) {
      handleSearch();
    }
  };
  const handleSearch = () => {
    if (isSearching) {
      return;
    }

    // 1. Kiểm tra đăng nhập
    if (!isAuthenticated) {
      navigate("/auth?mode=login");
      return;
    }

    // 2. Kiểm tra điền đủ thông tin (Khai báo hasError ở đây)
    let hasError = false;
    if (!selectedProvince || !selectedDateGo || !selectedDateReturn) {
      hasError = true;
    }

    // 3. Xử lý thời gian (Logic xuyên đêm)
    const startTimeVal = parseInt(startHour) * 60 + parseInt(startMinute);
    const endTimeVal = parseInt(endHour) * 60 + parseInt(endMinute);

    let duration = endTimeVal - startTimeVal;

    // Nếu duration âm (Ví dụ: 02:00 - 08:00), tức là qua ngày hôm sau -> Cộng 24h (1440 phút)
    if (duration < 0) {
      duration += 1440;
    }

    // Kiểm tra thời lượng tối thiểu (2 tiếng = 120 phút)
    if (duration < 120) {
      alert(
        "Khoảng thời gian hoạt động quá ngắn! Vui lòng chọn ít nhất 2 tiếng để có lịch trình tốt nhất."
      );
      return;
    }

    // 4. Xử lý lỗi nhập liệu
    if (hasError) {
      console.log(translate("input_fill_all_info"));
      // Bạn có thể thêm alert ở đây để nhắc người dùng
      // alert("Vui lòng điền đầy đủ thông tin địa điểm và ngày tháng!");
      return;
    }

    // Nếu không có lỗi thì bắt đầu tìm kiếm
    setIsSearching(true);

    // 5. Chuẩn bị dữ liệu gửi đi
    let numAdults = 1;
    let numChildren = 0;
    let numElders = 0;
    let isAlone = travelType === "Solo";

    if (travelType === "Group") {
      numAdults = 2;
      if (hasChildren) numChildren = 1;
      if (hasElders) numElders = 1;
    }

    const formatDateLocal = (date) => {
      if (!date) return "";
      const offset = date.getTimezoneOffset();
      const dateLocal = new Date(date.getTime() - offset * 60 * 1000);
      return dateLocal.toISOString().split("T")[0];
    };

    const pad = (num) => num.toString().padStart(2, "0");

    const requestData = {
      startDate: selectedDateGo ? formatDateLocal(selectedDateGo) : "",
      endDate: selectedDateReturn ? formatDateLocal(selectedDateReturn) : "",
      province: selectedProvince,
      hobby: getHobbyEnum(selectedHobbies),

      isAlone: isAlone,
      isChildren: numChildren > 0,
      numChildren: numChildren,
      numAdults: numAdults,
      isElder: numAdults > 0,
      numElders: 0,

      fromOperateTime: `${pad(startHour)}:${pad(startMinute)}`,
      toOperateTime: `${pad(endHour)}:${pad(endMinute)}`,

      locations: locations,
    };

    if (onSearch) {
      onSearch(requestData);
      console.log(requestData);
      
    }

    // Tự động tắt loading sau 10s nếu không có phản hồi (timeout thủ công)
    setTimeout(() => {
      setIsSearching(false);
      // setIsModalOpen(true); // Cân nhắc bỏ dòng này nếu logic hiển thị modal nằm ở Plan.jsx
    }, 10000);
  };
  // setShowLoadingAnimation(true); // Remove internal showLoadingAnimation
  // // Hide the animation after 3 seconds (adjust as needed)
  // setTimeout(() => {
  const transformValue = `translateX(${currentStep * -25}%)`;
  const hours = Array.from({ length: 25 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  return (
    <div className="input-container">
      <img className="loko-logo" src={logo} />
      <div className="slide-wrapper" style={{ transform: transformValue }}>
        {/* Slide 1: Destination */}
        <div className="sliding-input step-slide" id="si1">
          <div className="destination">
            <div className="province-select">
              {translate("input_destination_label")}
            </div>
            <select
              className={`option-select ${
                destinationError ? "input-error-flash" : ""
              }`}
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              <option value="">
                {translate("input_province_placeholder")}
              </option>
              {provinceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Slide 2: Dates */}

        <div className="sliding-input step-slide" id="si2">
          <div className="province-select">{translate("input_time_label")}</div>
          <div className="time">
            <div
              className={`date-picker-wrapper ${
                dateGoError ? "input-error-flash" : ""
              }`}
            >
              <img
                src="/img/plane-ticket.png"
                alt="Plane Ticket"
                className="date-picker-icon"
              />
              <DatePicker
                selected={selectedDateGo}
                onChange={(date) => setSelectedDateGo(date)}
                dateFormat="MM-dd-yyyy"
                placeholderText={translate("input_date_go_placeholder")}
                showOutsideDays={false}
                customInput={
                  <CustomDateInput
                    placeholderText="input_date_go_placeholder"
                    className="date-time-placeholder"
                  />
                }
                minDate={new Date()}
              />
            </div>
            <div
              className={`date-picker-wrapper ${
                dateReturnError ? "input-error-flash" : ""
              }`}
            >
              <img
                src="/img/plane-ticket.png"
                alt="Plane Ticket"
                className="date-picker-icon"
              />
              <DatePicker
                selected={selectedDateReturn}
                onChange={(date) => setSelectedDateReturn(date)}
                dateFormat="MM-dd-yyyy"
                placeholderText={translate("input_date_return_placeholder")}
                showOutsideDays={false}
                customInput={
                  <CustomDateInput
                    placeholderText="input_date_return_placeholder"
                    className="date-time-placeholder"
                  />
                }
                minDate={selectedDateGo || new Date()}
              />
            </div>
          </div>
        </div>

        {/* Slide 3: Quantity */}
        <div className="sliding-input step-slide" id="si3">
          <div className="amount">
            <div className="name">{translate("input_quantity_label")}</div>
            <div
              className={`travel-type-group ${
                travelTypeError ? "input-error-flash" : ""
              }`}
            >
              <RadioGroup
                row
                className="radio-group"
                aria-labelledby="travel-type-radio-buttons-group-label"
                name="travel-type-radio-buttons-group"
                value={travelType}
                onChange={(event) => {
                  setTravelType(event.target.value);
                }}
              >
                <FormControlLabel
                  value={translate("input_travel_type_solo")}
                  control={<Radio />}
                  label={translate("input_travel_type_solo")}
                />
                <FormControlLabel
                  value={translate("input_travel_type_group")}
                  control={<Radio />}
                  label={translate("input_travel_type_group")}
                />
              </RadioGroup>
            </div>
          </div>
          <div className="age">
            <div className="age-title">
              {translate("input_component_label")}
            </div>
            <FormControlLabel
              className="child"
              value="Child"
              control={<Checkbox />}
              label={translate("input_child")}
            />
            <FormControlLabel
              className="adult"
              value="Adult"
              control={<Checkbox />}
              label={translate("input_elderly")}
            />
          </div>
        </div>

        {/* Slide 4: Preference */}
        <div className="sliding-input step-slide" id="si4">
          <div className="type">
            <div className="type-title">
              {translate("input_category_label")}
            </div>
            <div className="type-list">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Cruisine")}
                    onChange={handleHobbyChange}
                    value="Cruisine"
                  />
                }
                label={translate("input_cuisine")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Adventure")}
                    onChange={handleHobbyChange}
                    value="Adventure"
                  />
                }
                label={translate("input_adventure")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Rest")}
                    onChange={handleHobbyChange}
                    value="Rest"
                  />
                }
                label={translate("input_rest")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Playground")}
                    onChange={handleHobbyChange}
                    value="Playground"
                  />
                }
                label={translate("input_entertainment")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Photograph")}
                    onChange={handleHobbyChange}
                    value="Photograph"
                  />
                }
                label={translate("input_photography")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("History")}
                    onChange={handleHobbyChange}
                    value="History"
                  />
                }
                label={translate("input_history_culture")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Honeymoon")}
                    onChange={handleHobbyChange}
                    value="Honeymoon"
                  />
                }
                label={translate("input_honeymoon")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Nightlife")}
                    onChange={handleHobbyChange}
                    value="Nightlife"
                  />
                }
                label={translate("input_nightlife")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedHobbies.includes("Sea")}
                    onChange={handleHobbyChange}
                    value="Sea"
                  />
                }
                label={translate("input_beach_island_tourism")}
              />
            </div>
          </div>
          <div>
            <div className="hour">
              {translate("input_operation_time_label")}
            </div>
            <div className="time-input-container">
              <div className="time-group">
                {/* Giờ Bắt đầu */}
                <select
                  className="time-select hour"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                >
                  {hours.map((h) => (
                    <option key={`sh-${h}`} value={h}>
                      {h}
                    </option>
                  ))}
                </select>

                {/* Dấu ngăn cách Giờ và Phút */}
                <span className="separator">:</span>

                {/* Phút Bắt đầu */}
                <select
                  className="time-select minute"
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                >
                  {minutes.map((m) => (
                    <option key={`sm-${m}`} value={m}>
                      {m}
                    </option>
                  ))}
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
                  {hours.map((h) => (
                    <option key={`sh-${h}`} value={h}>
                      {h}
                    </option>
                  ))}
                </select>

                {/* Dấu ngăn cách Giờ và Phút */}
                <span className="separator">:</span>

                {/* Phút Kết thúc */}
                <select
                  className="time-select minute"
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                >
                  {minutes.map((m) => (
                    <option key={`sm-${m}`} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="input-footer">
        <div className="counting-item">
          -------{currentStep + 1}/{totalSteps}-------
        </div>
        <div className="button-list">
          {/* Nút PREV: Luôn hiển thị, nhưng bị vô hiệu hóa khi ở bước 0 */}
          <button
            className={`prev-button ${
              currentStep === 0 ? "hidden-button" : ""
            }`}
            onClick={handlePrev}
            disabled={currentStep === 0} // Vô hiệu hóa nút
          >
            {translate("input_prev_button")}
          </button>

          {/* Nút SEARCH: Luôn hiển thị ở giữa */}
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={isResultShown}
          >
            {translate("input_search_button")}
          </button>

          {/* Nút NEXT: Luôn hiển thị, nhưng bị vô hiệu hóa khi ở bước cuối */}
          <button
            className={`next-button ${
              currentStep === totalSteps - 1 ? "hidden-button" : ""
            }`}
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1} // Vô hiệu hóa nút
          >
            {translate("input_next_button")}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Input;
