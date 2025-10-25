import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

    useEffect(() => {
        if (token && user) {
            setIsAuthenticated(true);
        } else if (!token) {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [token, user]);

    const login = async (credentials) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.accessToken);
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowAuthModal(false);
                return { success: true };
            } else {
                const error = await response.json();
                // Translate error messages
                let errorMessage = error.message || 'Đăng nhập thất bại';
                if (errorMessage.includes('Bad credentials') || errorMessage.includes('User not found')) {
                    errorMessage = 'Email hoặc mật khẩu không đúng';
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.accessToken);
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowAuthModal(false);
                return { success: true };
            } else {
                const error = await response.json();
                // Translate error messages
                let errorMessage = error.message || 'Đăng ký thất bại';
                if (errorMessage.includes('Password and confirm password do not match')) {
                    errorMessage = 'Mật khẩu và xác nhận mật khẩu không khớp';
                } else if (errorMessage.includes('already exists')) {
                    errorMessage = 'Email này đã được sử dụng';
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const openAuthModal = (mode = 'login') => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const closeAuthModal = () => {
        setShowAuthModal(false);
    };

    const switchAuthMode = () => {
        setAuthMode(authMode === 'login' ? 'register' : 'login');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            token,
            showAuthModal,
            authMode,
            login,
            register,
            logout,
            openAuthModal,
            closeAuthModal,
            switchAuthMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
