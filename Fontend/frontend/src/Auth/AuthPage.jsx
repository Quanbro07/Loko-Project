import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../Language/LanguageContext';
import styles from './AuthModal.module.css';
import { useLocation, useNavigate } from 'react-router-dom';

// A full-page auth screen (login / register) that reuses the modal styles
// Use this component as a route (e.g. /auth) instead of a popup modal.
const AuthPage = () => {
  const { authMode, switchAuthMode, login, register, setAuthMode, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode && (mode === 'login' || mode === 'register')) {
      setAuthMode(mode);
    }
  }, [location.search, setAuthMode]);
  const { translate } = useLanguage();

  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let result;
      if (authMode === 'login') {
        result = await login({ email: formData.email, password: formData.password });
      } else {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        const passwordError = "Mật khẩu phải có ít nhất 8 kí tự, bao gồm chữ in hoa, số và kí tự đặc biệt.";

        if (!passwordRegex.test(formData.password)) {
          setError(passwordError);
          setLoading(false);
          return;
        }
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
          age: 25,
          gender: 'OTHER'
        });
      }

      if (!result?.success) {
        setError(result?.error || 'Có lỗi xảy ra');
      } else {
        // On success: if login -> go to homepage; if register -> go to login page
        if (authMode === 'login') {
          navigate('/homepage');
        } else {
          // After register, clear any session and redirect to verify page so user can enter email code
          try {
            await logout();
          } catch (e) {
            // ignore logout errors
          }
          // Pass the registered email to the verify page
          navigate(`/auth/verify?email=${encodeURIComponent(formData.email)}`);
        }
      }
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        <div className={styles.panelLeft}>
          <div className={styles.illustrationWrap}>
            <img src="/img/Group%20439.png" alt="travel illustration" className={styles.illustration} />
          </div>
        </div>

        <div className={styles.panelRight}>
          <div className={styles.content}>
            <div className={styles.header}>
              <img src="/img/logo (1).PNG" alt="Loko logo" className={styles.logoCentered} />
            </div>

          {authMode === 'login' ? (
            <>
              <div className={styles.title}>Don't just imagine paradise, Experience it!</div>
              <div className={styles.subtitle}>We'll help you plan your dream escape.</div>
            </>
          ) : (
            null
          )}

          <form onSubmit={handleSubmit} className={styles.form} style={{marginTop:6}}>
            {authMode === 'register' && (
                <><>
                                  <div className={styles.title}>Don't just imagine paradise, Experience it!</div>
                                  <div className={styles.subtitle}>We'll help you plan your dream escape.</div>
                              </><div className={styles.formGroup}>
                                      <label className={styles.label} htmlFor="username">{translate('auth_username')}</label>
                                      <input className={`${styles.input} ${styles.inputWithDivider}`} type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required placeholder={translate('auth_username_placeholder')} />
                                  </div></>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">{translate('auth_email')}</label>
              <input className={`${styles.input} ${styles.inputWithDivider}`} type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder={translate('auth_email_placeholder')} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">{translate('auth_password')}</label>
              <div className={styles.inputRow}>
                <input className={`${styles.input} ${styles.inputWithDivider}`} type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder={translate('auth_password_placeholder')} />
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
                <input className={`${styles.input} ${styles.inputWithDivider}`} type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder={translate('auth_confirm_password_placeholder')} />
                {authMode === 'register' && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'left' }}>
                    Ít nhất 8 kí tự, bao gồm chữ hoa, số và kí tự đặc biệt.
                    </div>
                )}
              </div>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}

            {authMode === 'login' && (
              <div className={styles.switchSmall}>
                <div role="switch" aria-checked={remember} className={`${styles.rememberToggle} ${remember ? styles.rememberOn : ''}`} onClick={() => setRemember(r => !r)}>
                  <div className={styles.rememberToggleDot} />
                </div>
                <div style={{fontSize:13, color:'#6b7280'}}>Remember me</div>
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? translate('auth_loading') : (authMode === 'login' ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <div className={styles.switch} style={{marginTop:18,textAlign:'center'}}>
            {authMode === 'login' ? (
              <p style={{color:'#6b7280'}}>Don't have an account? <button type="button" className={styles.switchBtn} onClick={() => { switchAuthMode(); navigate('/auth?mode=register'); }}>Sign up!</button></p>
            ) : (
              <p style={{color:'#6b7280'}}>Already have an account? <button type="button" className={styles.switchBtn} onClick={() => { switchAuthMode(); navigate('/auth?mode=login'); }}>Login</button></p>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
