import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../Language/LanguageContext';
import styles from './AuthModal.module.css';
import { useLocation, useNavigate } from 'react-router-dom';

// Đường dẫn ảnh (đảm bảo file nằm trong public/img)
const LOGO_URL = "/img/logo.png"; 
const ILLUSTRATION_URL = "/img/background.png";

const AuthPage = () => {
  const { authMode, switchAuthMode, login, register, forgotPassword, verifyAccount, checkVerificationCode, resetPassword, resendVerificationCode, setAuthMode } = useAuth();
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
  
  const [resetToken, setResetToken] = useState(''); 
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // State: Có hiện link kích hoạt ngay không?
  const [showVerifyLink, setShowVerifyLink] = useState(false); 

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync URL với authMode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const emailParam = params.get('email'); // Lấy email từ URL nếu có

    if (mode && ['login', 'register', 'forgot-password', 'verify-code', 'reset-password'].includes(mode)) {
      setAuthMode(mode);
    }
    
    // Tự động điền email nếu có trên URL
    if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [location.search, setAuthMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setShowVerifyLink(false); // Ẩn link verify khi người dùng nhập lại
  };

  // --- HÀM XỬ LÝ GỬI LẠI MÃ ---
  const handleResend = async () => {
      if (!formData.email) {
          setError("Vui lòng nhập email trước khi gửi lại mã.");
          return;
      }
      setLoading(true);
      setError('');
      setSuccessMsg('');
      
      const result = await resendVerificationCode(formData.email);
      
      if (result.success) {
          setSuccessMsg(result.message || "Mã xác thực mới đã được gửi!");
      } else {
          setError(result.error);
      }
      setLoading(false);
  };
  // ---------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setShowVerifyLink(false);

    try {
      let result;

      // 1. LOGIN
      if (authMode === 'login') {
        result = await login({ email: formData.email, password: formData.password });
        
        if (result.success) {
          const userRole = result.user?.role;
          if (userRole === 'ADMIN') navigate('/admin');
          else navigate('/user');
        } else {
            // Nếu lỗi do chưa kích hoạt (cờ isNotVerified từ AuthContext) -> Hiện link
            setError(result.error);
            if (result.isNotVerified) {
                setShowVerifyLink(true);
            }
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
          // ĐĂNG KÝ THÀNH CÔNG -> CHUYỂN NGAY SANG TRANG VERIFY
          navigate(`/auth?mode=verify-code&email=${encodeURIComponent(formData.email)}`);
          return; 
        }
      } 
      
      // 3. FORGOT PASSWORD
      else if (authMode === 'forgot-password') {
        result = await forgotPassword(formData.email);
        if (result.success) {
           setSuccessMsg('Mã xác nhận đã được gửi vào email của bạn.');
           setTimeout(() => changeMode('verify-code'), 1500); // Chuyển sang nhập mã
        } else {
           setError(result.error);
        }
      }

      // 4. VERIFY CODE
      else if (authMode === 'verify-code') {
        const verifyAccRes = await verifyAccount(formData.email, formData.verificationCode);
        
        if (verifyAccRes.success) {
             setSuccessMsg('Kích hoạt tài khoản thành công! Đang chuyển đến đăng nhập...');
             setTimeout(() => changeMode('login'), 2000);
             return; 
        } 
        
        const checkRes = await checkVerificationCode(formData.email, formData.verificationCode);
        
        if (checkRes.success) {
            setResetToken(checkRes.token);
            setSuccessMsg('Mã chính xác! Vui lòng nhập mật khẩu mới.');
            setTimeout(() => changeMode('reset-password'), 1000);
        } else {
            setError('Mã xác thực không hợp lệ hoặc đã hết hạn.');
        }
      }

      // 5. RESET PASSWORD
      else if (authMode === 'reset-password') {
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setLoading(false);
            return;
        }
        result = await resetPassword({
            email: formData.email,
            verificationCode: formData.verificationCode,
            password: formData.newPassword,
            confirmPassword: formData.confirmPassword,
            token: resetToken
        });
        if (result.success) {
            setSuccessMsg('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            setTimeout(() => changeMode('login'), 2000);
        } else {
            setError(result.error);
        }
      }

      if (['login', 'register'].includes(authMode) && result && !result.success) {
         if (!result.isNotVerified) { 
             setError(result.error || 'Có lỗi xảy ra');
         }
      }

    } catch (err) {
      console.error(err);
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (mode) => {
    const currentEmail = formData.email;
    navigate(`/auth?mode=${mode}&email=${encodeURIComponent(currentEmail)}`);
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
    setShowVerifyLink(false);
    
    if (mode === 'login') {
        setFormData(prev => ({ ...prev, password: '', verificationCode: '', newPassword: '', confirmPassword: '' }));
        setResetToken('');
    }
  };

  const handleGoToVerify = () => {
      changeMode('verify-code');
  };

  const getTitle = () => {
    switch(authMode) {
        case 'register': return translate('auth_register_title');
        case 'forgot-password': return 'Quên Mật Khẩu';
        case 'verify-code': return 'Xác Thực Tài Khoản'; 
        case 'reset-password': return 'Đặt Lại Mật Khẩu';
        default: return null;
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        <div className={styles.panelLeft}>
          <div className={styles.illustrationWrap}>
            <img src={ILLUSTRATION_URL} alt="travel illustration" className={styles.illustration} />
          </div>
        </div>

        <div className={styles.panelRight}>
          <div className={styles.content}>
            <div className={styles.header}>
              <img src={LOGO_URL} alt="Loko logo" className={styles.logoCentered} />
            </div>

            {authMode === 'login' ? (
              <>
                <div className={styles.title}>Don't just imagine paradise, Experience it!</div>
                <div className={styles.subtitle}>We'll help you plan your dream escape.</div>
              </>
            ) : (
                <h2 className={styles.title}>{getTitle()}</h2>
            )}

            {successMsg && <div style={{color: '#10b981', marginBottom: 10, textAlign: 'center', fontWeight: '500'}}>{successMsg}</div>}

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
                        style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2em', fontWeight: 'bold' }} 
                    />
                    {/* --- PHẦN LINK GỬI LẠI MÃ --- */}
                    <div style={{marginTop: 8, fontSize: 13, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span>Đã gửi mã đến: <b>{formData.email}</b></span>
                        <button 
                            type="button" 
                            onClick={handleResend}
                            disabled={loading}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#007BFF',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontWeight: '500',
                                fontSize: 'inherit',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi lại mã'}
                        </button>
                    </div>
                    {/* --------------------------- */}
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

              {error && (
                  <div className={styles.errorMessage} style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <span>{error}</span>
                      {showVerifyLink && (
                          <button
                            type="button" 
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: '#ef4444', 
                                textDecoration: 'underline', 
                                cursor: 'pointer', 
                                fontWeight: 'bold',
                                fontSize: 'inherit',
                                fontFamily: 'inherit'
                            }}
                            onClick={handleGoToVerify}
                          >
                              Kích hoạt ngay
                          </button>
                      )}
                  </div>
              )}

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
                    authMode === 'verify-code' ? 'Xác thực' : 
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