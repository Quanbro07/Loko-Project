import './User.css'
import React, { useState, useEffect } from 'react';
import avatarSample from '../img/avatar-sample.jpg';
import barcodeSample from '../img/barcode-sample.png';
import Footer from '../Footer/Footer';
import Navbar from '../Navbar/Navbar';
import avatarChange from '../img/avatar-change.png';
import VisitedMap from '../Map/VisitedMap';
import { useLanguage } from '../Language/LanguageContext';
// 1. Import useAuth để lấy thông tin user và token
import { useAuth } from '../Auth/AuthContext';

const User = () => {
    // 2. Lấy user, token và hàm setUser từ Context
    const { user, token, setUser } = useAuth(); 
    const { translate } = useLanguage();

    const [isEditing, setIsEditing] = useState(false);
    
    // 3. Khởi tạo state từ dữ liệu thật của User (nếu có), nếu không dùng mặc định
    const [name, setName] = useState(user?.fullName || 'NGUYỄN TRỌNG');
    const [dob, setDob] = useState(user?.dob || '2000-01-01');
    const [gender, setGender] = useState(user?.gender || 'NAM');
    const [avatar, setAvatar] = useState(user?.avatarImg || avatarSample);

    // State cho Map
    const [visitedSlugs, setVisitedSlugs] = useState(["ha-noi", "an-giang", "da-nang", "tp-ho-chi-minh"]);
    const [visitedNames, setVisitedNames] = useState([]);

    // State tạm để chỉnh sửa
    const [editName, setEditName] = useState(name);
    const [editDob, setEditDob] = useState(dob);
    const [editGender, setEditGender] = useState(gender);

    // Cập nhật state khi user thay đổi (ví dụ sau khi login xong hoặc reload trang)
    useEffect(() => {
        if (user) {
            setName(user.fullName || '');
            setDob(user.dob || '');
            // Backend có thể trả về 'MALE', 'FEMALE', cần map lại nếu muốn hiển thị tiếng Việt
            setGender(user.gender || 'OTHER');
            if (user.avatarImg) setAvatar(user.avatarImg);
        }
    }, [user]);

    // --- Các hàm tiện ích xử lý chuỗi (cho Map) ---
    function removeDiacritics(str) { 
        if (!str) return ''; 
        return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s-]/g, '').trim(); 
    }
    
    function slugify(str) { 
        if (!str) return ''; 
        const noDia = removeDiacritics(str); 
        return noDia.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, ''); 
    }
    
    function prettifySlug(slug) { 
        if (!slug) return ''; 
        return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); 
    }

    // Logic gọi API lấy tỉnh đã đi (Giữ nguyên logic cũ của bạn)
    useEffect(() => {
        let mounted = true;
        const endpoint = '/api/user/visited';
        fetch(endpoint)
            .then((res) => {
                if (!res.ok) throw new Error('Network error');
                return res.json();
            })
            .then((data) => {
                if (!mounted) return;
                if (!Array.isArray(data)) return;

                if (data.length > 0 && typeof data[0] === 'string') {
                    const maybeSlugs = data.map((s) => slugify(s));
                    setVisitedSlugs(maybeSlugs);
                    return;
                }

                const slugs = data.map((item) => {
                    if (!item) return '';
                    if (item.slug) return slugify(item.slug);
                    if (item.name) return slugify(item.name);
                    if (item.ten) return slugify(item.ten);
                    return '';
                }).filter(Boolean);

                if (slugs.length) setVisitedSlugs(slugs);
            })
            .catch((err) => {
                // console.warn('Could not load visited provinces from backend:', err);
            });

        return () => { mounted = false; };
    }, []);

    // Logic GeoJSON để map tên tỉnh (Giữ nguyên logic cũ của bạn)
    useEffect(() => {
        let mounted = true;
        const GEOJSON_URL = '/vietnam-geojson-data/geojson/country-wide/vietnam-tinh-thanh-34.geojson';
        fetch(GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => {
                if (!mounted) return;
                if (!data || !Array.isArray(data.features)) return;
                const map = {};
                data.features.forEach((f) => {
                    const props = f.properties || {};
                    const name = props.ten_tinh || props.NAME_1 || props.NAME || props.name || props.ten || '';
                    if (name) map[slugify(name)] = name;
                });
                const names = visitedSlugs.map((s) => map[s] || prettifySlug(s));
                setVisitedNames(names.filter(Boolean));
            })
            .catch(() => {
                const names = visitedSlugs.map((s) => prettifySlug(s));
                setVisitedNames(names);
            });
        return () => { mounted = false; };
    }, [visitedSlugs]);


    // SVG Icon bút chì
    const EditIcon = ({ onClick }) => (
        <svg onClick={onClick} className='edit-icon-button' width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
    );

    const handleEditClick = () => {
        setEditName(name);
        setEditDob(dob);
        setEditGender(gender);
        setIsEditing(true);
    };

    // --- HÀM LƯU THÔNG TIN (GỌI API) ---
    const handleSave = async () => {
        try {
            // Chuẩn bị dữ liệu gửi đi (theo UserDTO của backend)
            const payload = {
                userId: user?.id, // Lấy ID từ user context (đã được thêm vào AuthContext)
                userName: user?.username, // Backend yêu cầu username
                fullName: editName,
                dob: editDob,
                gender: editGender // Gửi 'MALE', 'FEMALE' hoặc 'OTHER'
            };

            const response = await fetch('http://localhost:8080/api/v1/user/change-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Gửi kèm token xác thực
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const updatedUserDTO = await response.json();
                
                // 1. Cập nhật UI
                setName(updatedUserDTO.fullName);
                setDob(updatedUserDTO.dob);
                setGender(updatedUserDTO.gender);
                
                // 2. Cập nhật vào Context và LocalStorage để đồng bộ dữ liệu mới
                const newUserState = { ...user, ...updatedUserDTO };
                localStorage.setItem('user', JSON.stringify(newUserState));
                if (setUser) setUser(newUserState);

                setIsEditing(false);
                alert("Cập nhật thông tin thành công!");
            } else {
                alert("Lỗi khi cập nhật thông tin. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error("Error updating user info:", error);
            alert("Lỗi kết nối server.");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
                // TODO: Gọi API upload avatar lên server tại đây nếu cần
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="user-page-background">
            <Navbar/>
            <div className='ticket-container'>
                <div className='ticket-header'>
                    <img src="/img/plane-ticket.png" alt="Plane Ticket" className="plane-icon" />
                    <div className='ticket-company'>LOKO</div>
                </div>
                {isEditing && (
                    <div className='edit-controls'>
                        <button className='save-button' onClick={handleSave}><span>Lưu</span></button>
                        <button className='cancel-button' onClick={handleCancel}><span>Hủy</span></button>
                    </div>
                )}
                <div className='ticket-body'>
                    <div className='ticket-section passenger-info'>
                        
                        {/* HỌ VÀ TÊN */}
                        <div className='info-item'>
                            <div className='label'>
                                <span>Họ và Tên</span>
                                {!isEditing && <EditIcon onClick={handleEditClick} />}
                            </div>
                            {isEditing ? (
                                <input
                                    className='edit-input'
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            ) : (
                                <div className='value'>{name}</div>
                            )}
                        </div>

                        {/* NGÀY SINH */}
                        <div className='info-item'>
                            <div className='label'>
                                <span>Ngày tháng năm sinh</span>
                                {!isEditing && <EditIcon onClick={handleEditClick} />}
                            </div>
                            {isEditing ? (
                                <input
                                    className='edit-input'
                                    type="date" // Dùng type="date" để có lịch chọn
                                    value={editDob}
                                    onChange={(e) => setEditDob(e.target.value)}
                                />
                            ) : (
                                <div className='value'>{dob}</div>
                            )}
                        </div>

                        {/* GIỚI TÍNH */}
                        <div className='info-item'>
                            <div className='label'>
                                <span>Giới tính</span>
                                {!isEditing && <EditIcon onClick={handleEditClick} />}
                            </div>
                            {isEditing ? (
                                <select 
                                    className='edit-input' 
                                    value={editGender}
                                    onChange={(e) => setEditGender(e.target.value)}
                                >
                                    <option value="MALE">NAM</option>
                                    <option value="FEMALE">NỮ</option>
                                    <option value="OTHER">KHÁC</option>
                                </select>
                            ) : (
                                <div className='value'>
                                    {gender === 'MALE' ? 'NAM' : gender === 'FEMALE' ? 'NỮ' : 'KHÁC'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='ticket-section travel-stats'>
                        <div className='info-item'>
                            <div className='label'>Ngày tham gia</div>
                            {/* Lấy ngày tạo từ user, nếu không có thì dùng mặc định */}
                            <div className='value'>{user?.createAt || '01/01/2023'}</div>
                        </div>
                        <div className='info-item'>
                            <div className='label'>Số tỉnh/thành đã đi cùng LOKO</div>
                            <div className='value'>{visitedSlugs.length}/{34}</div>
                            <div className='visited-names'>
                                {visitedNames && visitedNames.length > 0 ? (
                                    <>
                                        {visitedNames.slice(0, 6).map((n, idx) => (
                                            <span key={n + idx} className="pill">{n}</span>
                                        ))}
                                        {visitedNames.length > 6 && (
                                            <span className="pill">và {visitedNames.length - 6} tỉnh khác</span>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ color: '#777' }}>Chưa có dữ liệu tỉnh đã đi</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='ticket-section avatar-section'>
                        <div className='avatar-wrapper'>
                            <img src={avatar} alt="Avatar" className="avatar-img" />
                            <input
                                type="file"
                                id="avatarUpload"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                            <label htmlFor="avatarUpload" className="avatar-change-label">
                                <img src={avatarChange} alt="Change Avatar" className="avatar-change" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className='ticket-footer'>
                    <button className='travel-history'>{translate('travel_history_button')}</button>
                    <img src={barcodeSample} className="barcode-img" />
                </div>
            </div>
            <VisitedMap visited={visitedSlugs} />
            <Footer/>
        </div>
    )
}

export default User;