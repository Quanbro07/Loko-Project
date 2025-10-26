import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../Language/LanguageContext';
import './AuthModal.css';

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
        <div className="auth-modal-overlay" onClick={closeAuthModal}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <div className="auth-modal-header">
                    <h2>{authMode === 'login' ? translate('auth_login_title') : translate('auth_register_title')}</h2>
                    <button className="close-btn" onClick={closeAuthModal}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {authMode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="username">{translate('auth_username')}</label>
                            <input
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

                    <div className="form-group">
                        <label htmlFor="email">{translate('auth_email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            placeholder={translate('auth_email_placeholder')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{translate('auth_password')}</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            placeholder={translate('auth_password_placeholder')}
                        />
                    </div>

                    {authMode === 'register' && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">{translate('auth_confirm_password')}</label>
                            <input
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

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? translate('auth_loading') : (authMode === 'login' ? translate('auth_login_button') : translate('auth_register_button'))}
                    </button>
                </form>

                <div className="auth-switch">
                    {authMode === 'login' ? (
                        <p>
                            {translate('auth_no_account')} 
                            <button type="button" className="switch-btn" onClick={switchAuthMode}>
                                {translate('auth_register_link')}
                            </button>
                        </p>
                    ) : (
                        <p>
                            {translate('auth_have_account')} 
                            <button type="button" className="switch-btn" onClick={switchAuthMode}>
                                {translate('auth_login_link')}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
