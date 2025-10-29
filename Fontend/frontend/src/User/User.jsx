import './User.css'
import React, { useState, useEffect } from 'react';
import avatarSample from '../img/avatar-sample.jpg';
import barcodeSample from '../img/barcode-sample.png';
import Footer from '../Footer/Footer';
import Navbar from '../Navbar/Navbar';
import avatarChange from '../img/avatar-change.png';
import VisitedMap from '../Map/VisitedMap';
// Removed import { useLanguage } from '../Language/LanguageContext';

const User = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [avatar, setAvatar] = useState(avatarSample); // State for avatar
        const [visitedSlugs, setVisitedSlugs] = useState(["ha-noi", "an-giang", "da-nang", "tp-ho-chi-minh"]);
        const [visitedNames, setVisitedNames] = useState([]);
    // Removed const { translate: dictionary } = useLanguage();

        // Utility: remove diacritics and slugify (keeps same logic as VisitedMap)
        function removeDiacritics(str) {
            if (!str) return '';
            return str
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[^\w\s-]/g, '')
                .trim();
        }

        function slugify(str) {
            if (!str) return '';
            const noDia = removeDiacritics(str);
            return noDia
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        // Fetch visited provinces from backend. Assumptions:
        // - Endpoint: GET /api/user/visited (can be changed below)
        // - Response: JSON array. Either array of slug strings ["ha-noi","da-nang"]
        //   or array of objects with `name` or `slug` properties.
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
                    if (!Array.isArray(data)) {
                        // unexpected shape: keep default sample
                        return;
                    }

                    // If array of strings and they look like slugs, use directly
                    if (data.length > 0 && typeof data[0] === 'string') {
                        const maybeSlugs = data.map((s) => slugify(s));
                        setVisitedSlugs(maybeSlugs);
                        return;
                    }

                    // If array of objects, try to pick slug or name
                    const slugs = data.map((item) => {
                        if (!item) return '';
                        if (item.slug) return slugify(item.slug);
                        if (item.name) return slugify(item.name);
                        // try common keys
                        if (item.ten) return slugify(item.ten);
                        return '';
                    }).filter(Boolean);

                    if (slugs.length) setVisitedSlugs(slugs);
                })
                .catch((err) => {
                    // keep default sample on error; optionally log
                    // eslint-disable-next-line no-console
                    console.warn('Could not load visited provinces from backend:', err);
                });

            return () => { mounted = false; };
        }, []);

            // Load province GeoJSON to build a slug -> official name map so we can display names next to counts.
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
                        // map created; map current visitedSlugs
                        const names = visitedSlugs.map((s) => map[s] || prettifySlug(s));
                        setVisitedNames(names.filter(Boolean));
                    })
                    .catch(() => {
                        // ignore — we'll fallback to prettified slugs
                        const names = visitedSlugs.map((s) => prettifySlug(s));
                        setVisitedNames(names);
                    });
                return () => { mounted = false; };
            }, [visitedSlugs]);

            function prettifySlug(slug) {
                if (!slug) return '';
                return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            }

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="user-page-background">
            <Navbar />
            <div className='ticket-container'>
                <div className='ticket-header'>
                    <img src="/img/plane-ticket.png" alt="Plane Ticket" className="plane-icon" />
                    <div className='ticket-company'>LOKO</div>
                </div>
                {isEditing ? (
                    <div className='edit-controls'>
                        <button className='save-button'><span>Lưu</span></button>
                        <button className='cancel-button' onClick={() => setIsEditing(false)}><span>Hủy</span></button>
                    </div>
                ) : (
                    <button className='edit-sticky-button' onClick={() => setIsEditing(true)}>
                        <span>Thay đổi thông tin</span>
                    </button>
                )}
                <div className='ticket-body'>
                    <div className='ticket-section passenger-info'>
                        <div className='info-item'>
                            <div className='label'>Họ và Tên</div>
                            <div className='value'>NGUYỄN TRỌNG</div>
                        </div>
                        <div className='info-item'>
                            <div className='label'>Ngày tháng năm sinh</div>
                            <div className='value'>01/01/2000</div>
                        </div>

                        <div className='info-item'>
                            <div className='label'>Giới tính</div>
                            <div className='value'>NAM</div>
                        </div>
                    </div>
                    <div className='ticket-section travel-stats'>
                        <div className='info-item'>
                            <div className='label'>Ngày tham gia</div>
                            <div className='value'>01/01/2023</div>
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
                                        <div style={{color: '#777'}}>Chưa có dữ liệu tỉnh đã đi</div>
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
                    <img src={barcodeSample} className="barcode-img" />
                </div>
            </div>
                {/* Visited provinces map: pass an array of province slugs (normalized, e.g. "ha-noi", "an-giang").
                    The list is fetched from backend (GET /api/user/visited) when available. */}
                <VisitedMap visited={visitedSlugs} />
            <Footer className="footer" />
        </div>
    )
}

export default User;