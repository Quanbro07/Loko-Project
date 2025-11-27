import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../Language/LanguageContext';
import styles from './AuthModal.module.css';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const { authMode, switchAuthMode, login, register, forgotPassword, checkVerificationCode, resetPassword, setAuthMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { translate } = useLanguage();

  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    verificationCode: '', 
    newPassword: ''       
  });
  
  // --- THÊM STATE ĐỂ LƯU TOKEN TẠM THỜI ---
  const [resetToken, setResetToken] = useState(''); 
  // ----------------------------------------

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode && ['login', 'register', 'forgot-password', 'verify-code', 'reset-password'].includes(mode)) {
      setAuthMode(mode);
    }
  }, [location.search, setAuthMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      let result;

      // 1. LOGIN
      if (authMode === 'login') {
        result = await login({ email: formData.email, password: formData.password });
        if (result.success) {
          const userRole = result.user?.role;
          if (userRole === 'ADMIN') navigate('/admin');
          else navigate('/user');
        }
      } 
      
      // 2. REGISTER
      else if (authMode === 'register') {
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
        if (result.success) {
          navigate(`/verify?email=${encodeURIComponent(formData.email)}`);
          return;
        }
      } 
      
      // 3. FORGOT PASSWORD (BƯỚC 1: Nhập Email)
      else if (authMode === 'forgot-password') {
        result = await forgotPassword(formData.email);
        if (result.success) {
           setSuccessMsg('Mã xác nhận đã được gửi vào email của bạn.');
           setTimeout(() => setAuthMode('verify-code'), 1500);
        } else {
           setError(result.error);
        }
      }

      // 4. VERIFY CODE (BƯỚC 2: Nhập Mã & Lấy Token)
      else if (authMode === 'verify-code') {
        // Gọi API check code và nhận Token
        const checkRes = await checkVerificationCode(formData.email, formData.verificationCode);
        
        if (checkRes.success) {
            // --- LƯU TOKEN TẠM THỜI ---
            setResetToken(checkRes.token);
            // ---------------------------
            setSuccessMsg('Mã chính xác! Vui lòng nhập mật khẩu mới.');
            setTimeout(() => setAuthMode('reset-password'), 1000);
            result = { success: true };
        } else {
            setError(checkRes.error);
            result = { success: false };
        }
      }

      // 5. RESET PASSWORD (BƯỚC 3: Đổi Mật Khẩu với Token)
      else if (authMode === 'reset-password') {
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setLoading(false);
            return;
        }

        // Gửi request kèm Token tạm thời
        result = await resetPassword({
            email: formData.email,
            verificationCode: formData.verificationCode,
            password: formData.newPassword,
            confirmPassword: formData.confirmPassword,
            token: resetToken // <-- TRUYỀN TOKEN VÀO ĐÂY
        });

        if (result.success) {
            setSuccessMsg('Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...');
            setTimeout(() => {
                setAuthMode('login');
                navigate('/auth?mode=login');
            }, 2000);
        } else {
            setError(result.error);
        }
      }

      if (['login', 'register'].includes(authMode) && result && !result.success) {
        setError(result.error || 'Có lỗi xảy ra');
      }

    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (mode) => {
    setAuthMode(mode);
    navigate(`/auth?mode=${mode}`);
    setError('');
    setSuccessMsg('');
    if (mode === 'login') {
        setFormData(prev => ({ ...prev, password: '', verificationCode: '', newPassword: '', confirmPassword: '' }));
        setResetToken(''); // Xóa token tạm khi thoát
    }
  };

  const getTitle = () => {
    switch(authMode) {
        case 'register': return translate('auth_register_title');
        case 'forgot-password': return 'Quên Mật Khẩu';
        case 'verify-code': return 'Nhập Mã Xác Nhận'; 
        case 'reset-password': return 'Đặt Lại Mật Khẩu';
        default: return null;
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        <div className={styles.panelLeft}>
          <div className={styles.illustrationWrap}>
            <img src="/img/background.png" alt="travel illustration" className={styles.illustration} />
          </div>
        </div>

        <div className={styles.panelRight}>
          <div className={styles.content}>
            <div className={styles.header}>
              <img src="/img/logo.PNG" alt="Loko logo" className={styles.logoCentered} />
            </div>

            {authMode === 'login' ? (
              <>
                <div className={styles.title}>Don't just imagine paradise, Experience it!</div>
                <div className={styles.subtitle}>We'll help you plan your dream escape.</div>
              </>
            ) : (
                <h2 className={styles.title}>{getTitle()}</h2>
            )}

            {successMsg && <div style={{color: 'green', marginBottom: 10, textAlign: 'center'}}>{successMsg}</div>}

            <form onSubmit={handleSubmit} className={styles.form} style={{ marginTop: 6 }}>
              
              {authMode === 'register' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>{translate('auth_username')}</label>
                  <input className={`${styles.input} ${styles.inputWithDivider}`} type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder={translate('auth_username_placeholder')} />
                </div>
              )}

              {['login', 'register', 'forgot-password'].includes(authMode) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>{translate('auth_email')}</label>
                  <input className={`${styles.input} ${styles.inputWithDivider}`} type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder={translate('auth_email_placeholder')} />
                </div>
              )}

              {['login', 'register'].includes(authMode) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>{translate('auth_password')}</label>
                  <div className={styles.inputRow}>
                    <input className={`${styles.input} ${styles.inputWithDivider}`} type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} required placeholder={translate('auth_password_placeholder')} />
                    <button type="button" className={styles.toggleBtn} onClick={() => setShowPassword(s => !s)}>
                      {showPassword ? "Hide" : "Show"} 
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>{translate('auth_confirm_password')}</label>
                  <input className={`${styles.input} ${styles.inputWithDivider}`} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder={translate('auth_confirm_password_placeholder')} />
                </div>
              )}

              {authMode === 'verify-code' && (
                <div className={styles.formGroup}>
                    <label className={styles.label}>Mã xác nhận</label>
                    <input 
                        className={`${styles.input} ${styles.inputWithDivider}`} 
                        type="text" 
                        name="verificationCode" 
                        value={formData.verificationCode} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="Nhập mã 6 số từ email" 
                        maxLength={6}
                        style={{ textAlign: 'center', letterSpacing: '2px', fontSize: '1.2em' }}
                    />
                    <div style={{marginTop: 5, fontSize: 13, color: '#666'}}>
                        Đã gửi mã đến: <b>{formData.email}</b>
                    </div>
                </div>
              )}

              {authMode === 'reset-password' && (
                <>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Mật khẩu mới</label>
                        <input className={`${styles.input} ${styles.inputWithDivider}`} type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} required placeholder="Nhập mật khẩu mới" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Xác nhận mật khẩu</label>
                        <input className={`${styles.input} ${styles.inputWithDivider}`} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder="Nhập lại mật khẩu mới" />
                    </div>
                </>
              )}

              {error && <div className={styles.errorMessage}>{error}</div>}

              {authMode === 'login' && (
                  <div style={{textAlign: 'right', marginBottom: '10px'}}>
                      <span style={{color: '#007BFF', cursor: 'pointer', fontSize: '13px'}} onClick={() => changeMode('forgot-password')}>Quên mật khẩu?</span>
                  </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? translate('auth_loading') : (
                    authMode === 'login' ? 'Đăng Nhập' : 
                    authMode === 'register' ? 'Đăng Ký' : 
                    authMode === 'forgot-password' ? 'Gửi mã xác nhận' :
                    authMode === 'verify-code' ? 'Xác thực mã' : 
                    'Đổi mật khẩu'
                )}
              </button>
            </form>

            <div className={styles.switch} style={{ marginTop: 18, textAlign: 'center' }}>
              {authMode === 'login' ? (
                <p style={{ color: '#6b7280' }}>Chưa có tài khoản? <button type="button" className={styles.switchBtn} onClick={() => changeMode('register')}>Đăng ký ngay!</button></p>
              ) : authMode === 'register' ? (
                <p style={{ color: '#6b7280' }}>Đã có tài khoản? <button type="button" className={styles.switchBtn} onClick={() => changeMode('login')}>Đăng nhập</button></p>
              ) : (
                <p style={{ color: '#6b7280' }}><button type="button" className={styles.switchBtn} onClick={() => changeMode('login')}>Quay lại Đăng nhập</button></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;