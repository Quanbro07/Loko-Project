import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AuthModal.module.css';

const VerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const emailParam = params.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email && emailParam) setEmail(emailParam);
  }, [emailParam, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!/^[0-9]{6}$/.test(code)) {
      setError('Vui lòng nhập mã gồm 6 chữ số');
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch('http://localhost:8080/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode: code })
      });

      if (resp.ok) {
        // Verified -> redirect to login
        navigate('/login');
      } else {
        const data = await resp.json().catch(() => ({}));
        setError(data.message || 'Mã không hợp lệ hoặc đã hết hạn');
      }
    } catch (err) {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`http://localhost:8080/api/v1/auth/resend?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      if (resp.ok) {
        alert('Mã xác thực đã được gửi lại vào email của bạn');
      } else {
        const data = await resp.json().catch(() => ({}));
        setError(data.message || 'Không thể gửi lại mã');
      }
    } catch (e) {
      setError('Lỗi kết nối');
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

            <div className={styles.title}>Verify your account</div>
            <div className={styles.subtitle}>Enter the 6-digit verification code sent to your email.</div>

            <form onSubmit={handleSubmit} className={styles.form} style={{ marginTop: 6 }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input className={`${styles.input} ${styles.inputWithDivider}`} value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Verification code</label>
                <input className={`${styles.input} ${styles.inputWithDivider}`} value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} required />
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
            </form>

            <div className={styles.switch} style={{ marginTop: 18, textAlign: 'center' }}>
              <p style={{ color: '#6b7280' }}>Didn't receive the code? <button type="button" className={styles.switchBtn} onClick={handleResend}>Resend</button></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
