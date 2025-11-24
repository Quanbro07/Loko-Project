import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (token && user) {
            setIsAuthenticated(true);
        } else if (!token) {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [token, user]);

    useEffect(() => {
        // Giả lập check token từ localStorage khi reload trang
        const checkAuth = async () => {
            setIsLoading(true); // Bắt đầu load
            try {
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');
                
                if (token && storedUser) {
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false); // Kết thúc load (Dù thành công hay thất bại)
            }
        };

        checkAuth();
    }, []);

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
                // Backend returns `username` in the top-level response (not a `user` object).
                // Normalize into a small user object used by the app UI.
                const resolvedUser = data.user || { username: data.username, age: data.age, gender: data.gender, role:data.role};
                setUser(resolvedUser);
                setIsAuthenticated(true);
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(resolvedUser));
                return { success: true, user: resolvedUser };
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
                // Registration may return a PendingVerificationResponse (no tokens).
                // Only set token/user if backend included them; otherwise return pending info.
                if (data.accessToken) {
                    setToken(data.accessToken);
                    const resolvedUser = data.user || { username: data.username, age: data.age, gender: data.gender };
                    setUser(resolvedUser);
                    setIsAuthenticated(true);
                    localStorage.setItem('token', data.accessToken);
                    localStorage.setItem('user', JSON.stringify(resolvedUser));
                    return { success: true };
                }
                // Pending verification flow
                return { success: true, pending: true, email: data.email };
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

    // Auto-logout when JWT token expires (if token is a JWT with an `exp` claim)
    useEffect(() => {
        if (!token) return;
        let timer;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return;
            const payload = JSON.parse(atob(parts[1]));
            const exp = payload && payload.exp;
            if (!exp) return;
            // If already expired, logout immediately
            if (Date.now() / 1000 > exp) {
                logout();
                return;
            }
            const msUntilExp = exp * 1000 - Date.now();
            timer = setTimeout(() => {
                logout();
            }, Math.max(msUntilExp, 0));
        } catch (e) {
            // If token isn't a JWT or parsing fails, do nothing (safe fallback)
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [token]);

    const switchAuthMode = () => {
        setAuthMode(authMode === 'login' ? 'register' : 'login');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            token,
            authMode,
            isLoading,
            login,
            register,
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
