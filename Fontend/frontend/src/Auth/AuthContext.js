import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [authMode, setAuthMode] = useState('login'); 

    useEffect(() => {
        if (token && user) {
            setIsAuthenticated(true);
        } else if (!token) {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [token, user]);

    // 1. LOGIN
    const login = async (credentials) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                
                if (!data.accessToken) {
                    return { 
                        success: false, 
                        error: 'Tài khoản chưa được kích hoạt.',
                        isNotVerified: true 
                    };
                }

                setToken(data.accessToken);
                const resolvedUser = data.user || { 
                    id: data.userId,
                    username: data.username, 
                    role: data.role,
                    dob: data.dob, 
                    age: data.age, 
                    gender: data.gender,
                    fullName: data.fullName,
                    avatarImg: data.avatarImg
                };

                setUser(resolvedUser);
                setIsAuthenticated(true);
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(resolvedUser));
                return { success: true, user: resolvedUser };
            } else {
                const error = await response.json();
                let errorMessage = error.message || 'Đăng nhập thất bại';
                let isNotVerified = false;

                if (errorMessage.includes('Bad credentials') || errorMessage.includes('User not found')) {
                    errorMessage = 'Email hoặc mật khẩu không đúng';
                } else if (errorMessage.includes('not verified') || errorMessage.includes('disabled')) {
                     errorMessage = 'Tài khoản chưa được kích hoạt.';
                     isNotVerified = true; 
                }
                return { success: false, error: errorMessage, isNotVerified: isNotVerified };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    };

    // 2. REGISTER
    const register = async (userData) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                // Đọc response để tránh lỗi pending promise nếu có
                await response.json().catch(() => {});
                return { success: true }; 
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Đăng ký thất bại' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    };

    // 3. VERIFY ACCOUNT
    const verifyAccount = async (email, code) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, verificationCode: code }),
            });

            if (response.ok) {
                return { success: true };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Mã xác thực không đúng' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    };

    // 4. FORGOT PASSWORD
    const forgotPassword = async (email) => {
        try {
            const url = `http://localhost:8080/api/v1/auth/forget-password?email=${encodeURIComponent(email)}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                return { success: true, message: 'Vui lòng kiểm tra email để lấy mã xác nhận.' };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Không thể gửi yêu cầu' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    };

    // 5. CHECK VERIFICATION CODE
    const checkVerificationCode = async (email, code) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, verificationCode: code }),
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, token: data.jwtToken }; 
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Mã xác nhận không đúng.' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    };

    // 6. RESET PASSWORD
    const resetPassword = async (data) => {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (data.token) headers['Authorization'] = `Bearer ${data.token}`;

            const response = await fetch('http://localhost:8080/api/v1/auth/change-password', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    email: data.email,
                    verificationCode: data.verificationCode,
                    password: data.password,
                    confirmPassword: data.confirmPassword 
                }),
            });

            if (response.ok) {
                return { success: true, message: 'Đổi mật khẩu thành công.' };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Đổi mật khẩu thất bại.' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    }

    // 7. RESEND VERIFICATION CODE (MỚI)
    const resendVerificationCode = async (email) => {
        try {
            // Endpoint: POST /api/v1/auth/resend?email=...
            const response = await fetch(`http://localhost:8080/api/v1/auth/resend?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                return { success: true, message: 'Mã xác thực mới đã được gửi.' };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Không thể gửi lại mã.' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối server' };
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthMode('login');
    };

    const switchAuthMode = (mode) => {
        setAuthMode(mode);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            token,
            authMode,
            setUser, 
            login,
            register,
            verifyAccount,
            forgotPassword,
            checkVerificationCode,
            resetPassword,
            resendVerificationCode,
            logout,
            setAuthMode,
            switchAuthMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};