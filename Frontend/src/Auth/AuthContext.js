import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios'; // Import Axios để can thiệp vào Plan.jsx

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. STATE QUẢN LÝ
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [authMode, setAuthMode] = useState('login'); 

    // Ref lưu giá trị mới nhất để Interceptor dùng
    const tokenRef = useRef(token);
    const refreshTokenRef = useRef(refreshToken);

    // 2. KHỞI TẠO: XÓA CACHE KHI F5 (Theo yêu cầu của bạn)
    useEffect(() => {
        // Mỗi lần F5 hoặc chạy lại App, xóa sạch localStorage để bắt đăng nhập lại
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // Cập nhật Ref khi state đổi
    useEffect(() => {
        tokenRef.current = token;
        refreshTokenRef.current = refreshToken;
    }, [token, refreshToken]);

    // 3. HÀM LOGOUT
    const logout = () => {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthMode('login');
        localStorage.clear(); // Xóa sạch để Plan.jsx không lấy nhầm token cũ
        sessionStorage.clear();
    };

    // 4. INTERCEPTOR CHO AXIOS (Dành cho Plan.jsx) & FETCH (Dành cho các file khác)
    useEffect(() => {
        // --- A. CẤU HÌNH AXIOS (Để cứu file Plan.jsx) ---
        // Plan.jsx dùng axios, nên ta phải chặn lỗi 403 của axios ở đây
        const axiosInterceptor = axios.interceptors.response.use(
            (response) => response, // Nếu thành công thì trả về luôn
            async (error) => {
                const originalRequest = error.config;

                // Nếu gặp lỗi 401/403 và chưa từng thử lại (retry)
                if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
                    originalRequest._retry = true; // Đánh dấu đã thử
                    console.log("⚠️ Axios (Plan.jsx): Token hết hạn. Đang Refresh...");

                    const currentRefreshToken = refreshTokenRef.current;
                    if (currentRefreshToken) {
                        try {
                            // Gọi API Refresh
                            const refreshRes = await axios.post('http://localhost:8080/api/v1/auth/refresh', {
                                token: currentRefreshToken
                            });

                            if (refreshRes.status === 200) {
                                const { accessToken, refreshToken: newRefToken } = refreshRes.data;

                                // Cập nhật State
                                setToken(accessToken);
                                if (newRefToken) setRefreshToken(newRefToken);
                                
                                // QUAN TRỌNG: Ghi vào localStorage để Plan.jsx đọc được cho lần sau
                                localStorage.setItem('token', accessToken);

                                // Gắn token mới vào header request cũ và gọi lại
                                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                                return axios(originalRequest);
                            }
                        } catch (refreshError) {
                            console.error("Axios Refresh failed:", refreshError);
                            logout();
                        }
                    } else {
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        // --- B. CẤU HÌNH FETCH (Dành cho OutputReal, User...) ---
        // (Giữ nguyên logic override fetch như trước để các file khác chạy ngon)
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            let response = await originalFetch(url, options);
            if ((response.status === 401 || response.status === 403) && !url.includes('/auth/')) {
                const currentRefreshToken = refreshTokenRef.current;
                if (currentRefreshToken) {
                    try {
                        const res = await originalFetch('http://localhost:8080/api/v1/auth/refresh', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: currentRefreshToken })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setToken(data.accessToken);
                            if (data.refreshToken) setRefreshToken(data.refreshToken);
                            
                            // Đồng bộ localStorage cho Axios dùng
                            localStorage.setItem('token', data.accessToken);

                            const newOptions = { ...options, headers: { ...options.headers, 'Authorization': `Bearer ${data.accessToken}` } };
                            return await originalFetch(url, newOptions);
                        } else { logout(); }
                    } catch (e) { logout(); }
                } else { logout(); }
            }
            return response;
        };

        // Cleanup
        return () => {
            axios.interceptors.response.eject(axiosInterceptor);
            window.fetch = originalFetch;
        };
    }, []);

    // 5. LOGIN (SỬA ĐỔI: GHI LOCALSTORAGE CHO PLAN.JSX DÙNG)
    const login = async (credentials) => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                
                if (!data.accessToken) return { success: false, error: 'Chưa kích hoạt.', isNotVerified: true };

                setToken(data.accessToken);
                setRefreshToken(data.refreshToken);
                
                // --- FIX CHO PLAN.JSX ---
                // Plan.jsx dùng localStorage.getItem('token'), nên ta BẮT BUỘC phải lưu vào đây
                localStorage.setItem('token', data.accessToken); 
                // ------------------------

                const resolvedUser = data.user || { id: data.userId,
                    username: data.username, 
                    role: data.role,
                    dob: data.dob, 
                    gender: data.gender,
                    fullName: data.fullName,
                    avatarImg: data.avatarImg,
                    createAt: data.createAt
                };
                setUser(resolvedUser);
                localStorage.setItem('user', JSON.stringify(resolvedUser)); // Lưu user để các trang khác dùng nếu cần
                setIsAuthenticated(true);
                
                return { success: true, user: resolvedUser };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Lỗi đăng nhập' };
            }
        } catch (error) {
            return { success: false, error: 'Lỗi kết nối' };
        }
    };

    // Các hàm khác giữ nguyên...
    const register = async (d) => { try { const r = await fetch('http://localhost:8080/api/v1/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(d)}); if(r.ok) { await r.json().catch(()=>{}); return {success:true}; } else { const e=await r.json(); return {success:false, error:e.message}; } } catch(e){return{success:false, error:'Lỗi'}} };
    const verifyAccount = async (e, c) => { try { const r = await fetch('http://localhost:8080/api/v1/auth/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({email:e, verificationCode:c})}); if(r.ok) return {success:true}; else { const err=await r.json(); return {success:false, error:err.message}; } } catch(err) { return {success:false, error:'Lỗi'}; } };
    const forgotPassword = async (e) => { try { const r = await fetch(`http://localhost:8080/api/v1/auth/forget-password?email=${encodeURIComponent(e)}`, {method:'POST', headers:{'Content-Type':'application/json'}}); if(r.ok) return {success:true}; else { const err=await r.json(); return {success:false, error:err.message}; } } catch(err) { return {success:false, error:'Lỗi'}; } };
    const checkVerificationCode = async (e, c) => { try { const r = await fetch('http://localhost:8080/api/v1/auth/verify-password', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:e, verificationCode:c})}); if(r.ok) { const d=await r.json(); return {success:true, token:d.jwtToken}; } else { const err=await r.json(); return {success:false, error:err.message}; } } catch(err) { return {success:false, error:'Lỗi'}; } };
    const resetPassword = async (d) => { try { const h = {'Content-Type':'application/json'}; if(d.token) h['Authorization'] = `Bearer ${d.token}`; const r = await fetch('http://localhost:8080/api/v1/auth/change-password', {method:'POST', headers:h, body: JSON.stringify(d)}); if(r.ok) return {success:true}; else { const err=await r.json(); return {success:false, error:err.message}; } } catch(err) { return {success:false, error:'Lỗi'}; } };
    const resendVerificationCode = async (e) => { try { const r = await fetch(`http://localhost:8080/api/v1/auth/resend?email=${encodeURIComponent(e)}`, {method:'POST'}); if(r.ok) return {success:true}; else { const err=await r.json(); return {success:false, error:err.message}; } } catch(err) { return {success:false, error:'Lỗi'}; } };
    const switchAuthMode = (m) => setAuthMode(m);

    return (
        <AuthContext.Provider value={{
            isAuthenticated, user, token, authMode, setUser, 
            login, register, logout, verifyAccount, forgotPassword, checkVerificationCode, resetPassword, resendVerificationCode,
            setAuthMode, switchAuthMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);