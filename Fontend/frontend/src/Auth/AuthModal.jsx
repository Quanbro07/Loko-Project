import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../Language/LanguageContext';
import styles from './AuthModal.module.css';

const AuthModal = () => {
    const { showAuthModal, closeAuthModal, authMode, switchAuthMode, login, register } = useAuth();
    const { translate } = useLanguage();
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (authMode === 'login') {
                result = await login({
                    email: formData.email,
                    password: formData.password
                });
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Mật khẩu xác nhận không khớp');
                    setLoading(false);
                    return;
                }
                result = await register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    age: 25, // Default age, có thể thêm field này
                    gender: 'OTHER' // Default gender
                });
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (error) {
            setError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    if (!showAuthModal) return null;

    return (
        <div className={styles.overlay} onClick={closeAuthModal}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.illustrationWrap}>
                    <img src="/img/Group%20439.png" alt="travel illustration" className={styles.illustration} />
                </div>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <img src={authMode === 'login' ? "/img/logo (1).PNG" : "/img/logo (1).PNG"} alt="Loko logo" className={styles.logo} />
                        <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Close">×</button>
                    </div>

                    {/* Title and subtitle (login view) */}
                    {authMode === 'login' ? (
                        <>
                            <div className={styles.title}>Don't just imagine paradise, Experience it!</div>
                            <div className={styles.subtitle}>We'll help you plan your dream escape.</div>
                        </>
                    ) : (
                        <h2>{translate('auth_register_title')}</h2>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {authMode === 'register' && (
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="username">{translate('auth_username')}</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={translate('auth_username_placeholder')}
                                />
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">{translate('auth_email')}</label>
                            <input
                                className={styles.input}
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder={translate('auth_email_placeholder')}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">{translate('auth_password')}</label>
                            <div className={styles.inputRow}>
                                <input
                                    className={styles.input}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={translate('auth_password_placeholder')}
                                />
                                <button type="button" className={styles.toggleBtn} onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility">
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                            <path d="M3 3l18 18" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M10.58 10.58a3 3 0 004.24 4.24" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M14.12 9.88A6.5 6.5 0 0121 12s-3 5-9 5a9.3 9.3 0 01-3.5-.66" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                            <path d="M2.98 12.02C5.73 7.23 9.98 5 12 5c2.02 0 6.27 2.23 9.02 7.02C18.27 16.77 14.02 19 12 19c-2.02 0-6.27-2.23-9.02-6.98z" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {authMode === 'register' && (
                            <div className={styles.formGroup}>
                                <label className={styles.label} htmlFor="confirmPassword">{translate('auth_confirm_password')}</label>
                                <input
                                    className={styles.input}
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={translate('auth_confirm_password_placeholder')}
                                />
                            </div>
                        )}

                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <div className={styles.switchSmall}>
                            <div
                                role="switch"
                                aria-checked={remember}
                                className={`${styles.rememberToggle} ${remember ? styles.rememberOn : ''}`}
                                onClick={() => setRemember(r => !r)}
                            >
                                <div className={styles.rememberToggleDot} />
                            </div>
                            <div style={{fontSize:13, color:'#6b7280'}}>Remember me</div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? translate('auth_loading') : (authMode === 'login' ? translate('auth_login_button') : translate('auth_register_button'))}
                        </button>
                    </form>

                    <div className={styles.switch}>
                        {authMode === 'login' ? (
                            <p>
                                {translate('auth_no_account')}{' '}
                                <button type="button" className={styles.switchBtn} onClick={switchAuthMode}>
                                    {translate('auth_register_link')}
                                </button>
                            </p>
                        ) : (
                            <p>
                                {translate('auth_have_account')}{' '}
                                <button type="button" className={styles.switchBtn} onClick={switchAuthMode}>
                                    {translate('auth_login_link')}
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.illustrationWrap}>
                    <img src="/img/travel-illustration.svg" alt="travel illustration" className={styles.illustration} />
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
