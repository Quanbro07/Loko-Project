import './User.css';
import React, { useState, useEffect } from 'react';
import avatarSample from '../img/avatar-sample.jpg';
import barcodeSample from '../img/barcode-sample.png';
import Footer from '../Footer/Footer';
import Navbar from '../Navbar/Navbar';
import avatarChange from '../img/avatar-change.png';
import VisitedMap from '../Map/VisitedMap';
import { useLanguage } from '../Language/LanguageContext';
import { useAuth } from '../Auth/AuthContext';

// === BẢNG MAPPING: BACKEND ENUM -> GEOJSON SLUG ===
// Key: Tên Enum từ Backend (Java)
// Value: Slug chuẩn của GeoJSON (đã xử lý bởi hàm slugify bên dưới)
const PROVINCE_MAPPING = {
    // 1. MIỀN BẮC
    "HaNoi": "ha-noi", "HaiPhong": "hai-phong", "HungYen": "hung-yen", "BacNinh": "bac-ninh", 
    "NinhBinh": "ninh-binh", "QuangNinh": "quang-ninh", "ThaiNguyen": "thai-nguyen", "PhuTho": "phu-tho", 
    "LaiChau": "lai-chau", "DienBien": "dien-bien", "SonLa": "son-la", "LangSon": "lang-son", 
    "CaoBang": "cao-bang", "TuyenQuang": "tuyen-quang", "LaoCai": "lao-cai",

    // 2. MIỀN TRUNG
    "ThanhHoa": "thanh-hoa", "NgheAn": "nghe-an", "HaTinh": "ha-tinh", "QuangTri": "quang-tri", 
    "Hue": "hue", "DaNang": "da-nang", "KhanhHoa": "khanh-hoa",

    // 3. TÂY NGUYÊN
    "QuangNgai": "quang-ngai", "GiaLai": "gia-lai", "DakLak": "dak-lak", "LamDong": "lam-dong",

    // 4. MIỀN NAM
    "TPHCM": "ho-chi-minh", "DongNai": "dong-nai", "TayNinh": "tay-ninh", "CanTho": "can-tho", 
    "VinhLong": "vinh-long", "DongThap": "dong-thap", "AnGiang": "an-giang", "CaMau": "ca-mau"
};

const User = () => {
    const { user, token, setUser } = useAuth(); 
    const { translate } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    
    // Helper: Format Date
    const formatDateForInput = (dateData) => {
        if (!dateData) return '';
        if (Array.isArray(dateData)) {
            const [year, month, day] = dateData;
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return dateData; 
    };

    const [name, setName] = useState(user?.fullName || 'NGUYỄN TRỌNG');
    const [dob, setDob] = useState(formatDateForInput(user?.dob) || '2000-01-01');
    const [gender, setGender] = useState(user?.gender || 'MALE');
    const [avatar, setAvatar] = useState(avatarSample);
    const [avatarFile, setAvatarFile] = useState(null);

    const [visitedSlugs, setVisitedSlugs] = useState([]);
    const [visitedNames, setVisitedNames] = useState([]);
    const [totalVisitedCount, setTotalVisitedCount] = useState(0);

    const [editName, setEditName] = useState(name);
    const [editDob, setEditDob] = useState(dob);
    const [editGender, setEditGender] = useState(gender);

    useEffect(() => {
        if (user) {
            setName(user.fullName || '');
            setDob(formatDateForInput(user.dob));
            setEditDob(formatDateForInput(user.dob));
            setGender(user.gender || 'MALE');
            setEditGender(user.gender || 'MALE');
            if (user.avatarImg) {
                const imgSrc = user.avatarImg.startsWith('data:image') 
                    ? user.avatarImg 
                    : `data:image/png;base64,${user.avatarImg}`;
                setAvatar(imgSrc);
            }
        }
    }, [user]);

    // === CÁC HÀM XỬ LÝ CHUỖI (Đồng bộ logic với VisitedMap) ===
    function removeDiacritics(str) { 
        if (!str) return ''; 
        // Thay đ/Đ thành d để khớp với dữ liệu backend trả về (DongThap, DaNang)
        str = str.replace(/[đĐ]/g, 'd');
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim(); 
    }
    
    function cleanProvinceName(str) {
        if (!str) return '';
        // Xóa tiền tố hành chính từ GeoJSON để lấy tên gốc
        return str.replace(/^(Tỉnh|Thành phố|Thành Phố|TP\.?|TP)\s+/i, '');
    }

    function slugify(str) { 
        if (!str) return ''; 
        const cleanName = cleanProvinceName(str);
        const noDia = removeDiacritics(cleanName); 
        return noDia.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/(^-|-$)/g, ''); 
    }
    
    function prettifySlug(slug) { if (!slug) return ''; return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

    // --- LOGIC CHUYỂN ĐỔI: BACKEND -> SLUG ---
    const convertBackendNameToSlug = (backendName) => {
        if (!backendName) return '';
        
        // 1. Ưu tiên tra cứu trong bảng Mapping (Để xử lý TPHCM, Hue, DienBien...)
        if (PROVINCE_MAPPING[backendName]) {
            return PROVINCE_MAPPING[backendName];
        }

        // 2. Fallback: Tự động tách từ CamelCase -> kebab-case
        const splitName = backendName.replace(/([a-z])([A-Z])/g, '$1-$2');
        return slugify(splitName);
    };

    // --- FETCH DATA TỪ BACKEND ---
    useEffect(() => {
        if (!user || !user.id) return;
        let mounted = true;
        
        const endpoint = `/api/v1/province/getAll?userId=${user.id}`;
        // Lưu ý: Đảm bảo URL backend đúng (thêm domain nếu cần)
        const fullEndpoint = endpoint.startsWith('http') ? endpoint : `http://localhost:8080${endpoint}`;

        fetch(fullEndpoint, { headers: { 'Authorization': `Bearer ${token}` } })
            .then((res) => { 
                if (!res.ok) throw new Error('Err'); 
                return res.json(); 
            })
            .then((data) => {
                if (!mounted) return;
                
                const list = data.visited_provinces || [];
                setTotalVisitedCount(data.total_visited || 0);

                const slugs = list.map((item) => {
                    // Lấy tên thô từ backend (Enum String)
                    const rawName = item.province_name || item.provinceName || item.name || '';
                    return convertBackendNameToSlug(rawName);
                }).filter(Boolean);

                const uniqueSlugs = [...new Set(slugs)];
                if (uniqueSlugs.length) setVisitedSlugs(uniqueSlugs);
            }).catch((err) => {
                console.error('Lỗi khi lấy dữ liệu tỉnh:', err);
            });

        return () => { mounted = false; };
    }, [user, token]);

    // --- TẢI GEOJSON ĐỂ LẤY TÊN HIỂN THỊ ĐẸP (CHO LIST BÊN PHẢI) ---
    useEffect(() => {
        let mounted = true;
        const GEOJSON_URL = '/vietnam-geojson-data/geojson/country-wide/vietnam-tinh-thanh-34.geojson';
        fetch(GEOJSON_URL).then((res) => res.json()).then((data) => { 
            if (!mounted || !data.features) return; 
            const map = {}; 
            
            data.features.forEach((f) => { 
                const n = f.properties.ten_tinh || f.properties.NAME_1 || f.properties.name || ''; 
                if (n) {
                    const key = slugify(n);
                    map[key] = cleanProvinceName(n); // Lưu tên đẹp (Vd: "Đồng Tháp")
                }
            }); 
            
            setVisitedNames(visitedSlugs.map(s => map[s] || prettifySlug(s)).filter(Boolean)); 
        }).catch(() => {});
        return () => { mounted = false; };
    }, [visitedSlugs]);

    const EditIcon = ({ onClick }) => (
        <svg onClick={onClick} className='edit-icon-button' width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
    );

    const handleEditClick = () => {
        setEditName(name);
        setEditDob(dob);
        setEditGender(gender);
        setIsEditing(true);
    };

    const handleSave = async () => {
        const currentUserId = user?.userId || user?.id;
        if (!currentUserId) {
            alert("Vui lòng đăng nhập lại.");
            return;
        }

        try {
            const infoPayload = {
                userId: currentUserId,
                userName: user.username,
                fullName: editName,
                dob: editDob,
                gender: editGender
            };

            const infoResponse = await fetch('http://localhost:8080/api/v1/user/change-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(infoPayload)
            });

            if (!infoResponse.ok) {
                const err = await infoResponse.json().catch(() => ({}));
                throw new Error(err.message || "Lỗi khi cập nhật thông tin.");
            }

            let currentAvatarImg = user.avatarImg;
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                const avatarResponse = await fetch('http://localhost:8080/api/v1/avatar/change', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!avatarResponse.ok) alert("Cập nhật ảnh thất bại.");
                else currentAvatarImg = avatarFile ? avatar.split(',')[1] : user.avatarImg;
            }

            setName(editName);
            setDob(editDob); 
            setGender(editGender);

            const newUserState = { 
                ...user, 
                fullName: editName, 
                dob: editDob, 
                gender: editGender, 
                avatarImg: currentAvatarImg 
            };
            
            localStorage.setItem('user', JSON.stringify(newUserState));
            if (setUser) setUser(newUserState);

            setIsEditing(false);
            setAvatarFile(null);
            alert("Cập nhật thành công!");

        } catch (error) {
            console.error("Error:", error);
            alert(`Lỗi: ${error.message}`);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setAvatarFile(null);
        if (user?.avatarImg) {
             const imgSrc = user.avatarImg.startsWith('data:image') ? user.avatarImg : `data:image/png;base64,${user.avatarImg}`;
             setAvatar(imgSrc);
        } else {
             setAvatar(avatarSample);
        }
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Ảnh quá lớn!");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
                setAvatarFile(file);
                setIsEditing(true);
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
                        <div className='info-item'>
                            <div className='label'>
                                <span>Họ và Tên</span>
                                {!isEditing && <EditIcon onClick={handleEditClick} />}
                            </div>
                            {isEditing ? (
                                <input className='edit-input' value={editName} onChange={(e) => setEditName(e.target.value)} />
                            ) : (
                                <div className='value'>{name}</div>
                            )}
                        </div>
                        <div className='info-item'>
                            <div className='label'>
                                <span>Ngày tháng năm sinh</span>
                                {!isEditing && <EditIcon onClick={handleEditClick} />}
                            </div>
                            {isEditing ? (
                                <input 
                                    className='edit-input' 
                                    type="date" 
                                    value={editDob} 
                                    onChange={(e) => setEditDob(e.target.value)} 
                                />
                            ) : (
                                <div className='value'>{dob}</div>
                            )}
                        </div>
                        <div className='info-item'>
                            <div className='label'>
                                <span>Giới tính</span>
                                {!isEditing && <EditIcon onClick={handleEditClick} />}
                            </div>
                            {isEditing ? (
                                <select className='edit-input' value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                                    <option value="MALE">NAM</option>
                                    <option value="FEMALE">NỮ</option>
                                    <option value="OTHER">KHÁC</option>
                                </select>
                            ) : (
                                <div className='value'>{gender === 'MALE' ? 'NAM' : gender === 'FEMALE' ? 'NỮ' : 'KHÁC'}</div>
                            )}
                        </div>
                    </div>

                    <div className='ticket-section travel-stats'>
                        <div className='info-item'>
                            <div className='label'>Ngày tham gia</div>
                            <div className='value'>{formatDateForInput(user?.createAt) || '2023-01-01'}</div>
                        </div>
                        <div className='info-item'>
                            <div className='label'>Số tỉnh/thành đã đi cùng LOKO</div>
                            <div className='value' style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                {totalVisitedCount > 0 ? totalVisitedCount : visitedSlugs.length}/34 tỉnh
                            </div>
                            <div className='visited-names'>
                                {visitedNames && visitedNames.length > 0 ? (
                                    <>{visitedNames.slice(0, 6).map((n, idx) => <span key={n + idx} className="pill">{n}</span>)}{visitedNames.length > 6 && <span className="pill">và {visitedNames.length - 6} tỉnh khác</span>}</>
                                ) : (<div style={{ color: '#777' }}>Chưa có dữ liệu tỉnh đã đi</div>)}
                            </div>
                        </div>
                    </div>
                    <div className='ticket-section avatar-section'>
                        <div className='avatar-wrapper'>
                            <img src={avatar} alt="Avatar" className="avatar-img" />
                            <input type="file" id="avatarUpload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            <label htmlFor="avatarUpload" className="avatar-change-label">
                                <img src={avatarChange} alt="Change Avatar" className="avatar-change" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className='ticket-footer'>
                    <button className='travel-history'>{translate('travel_history_button')}</button>
                    <img src={barcodeSample} className="barcode-img" alt="barcode" />
                </div>
            </div>
            
            <VisitedMap visited={visitedSlugs} />
            <Footer/>
        </div>
    )
}

export default User;