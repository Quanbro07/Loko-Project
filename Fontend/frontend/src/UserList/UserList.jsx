import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserList.css';

const UserList = () => {
    // 1. Khởi tạo State
    const [users, setUsers] = useState([]);          // Chứa danh sách user
    const [loading, setLoading] = useState(true);    // Trạng thái loading
    const [error, setError] = useState(null);        // Trạng thái lỗi
    
    // State cho phân trang (Pagination)
    const [currentPage, setCurrentPage] = useState(0); // Spring Boot bắt đầu trang từ 0
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 20; // Khớp với @PageableDefault(size=20) bên backend

    // 2. Hàm gọi API
    const fetchUsers = async (page) => {
        setLoading(true);
    
        // --- CHECKPOINT 1: Kiểm tra đầu vào ---
        const token = localStorage.getItem('accessToken');
        console.group("🔍 DEBUG: Chuẩn bị gọi API");
        console.log("1. URL:", `/api/v1/user/getAll`);
        console.log("2. Page:", page);
        console.log("3. Token lấy từ LocalStorage:", token ? "Đã lấy được (Ẩn vì bảo mật)" : "⚠️ KHÔNG CÓ TOKEN (NULL/UNDEFINED)");
        
        // Nếu không có token mà Backend yêu cầu -> Lỗi chắc chắn ở đây
        if (!token) {
            console.warn("⚠️ Cảnh báo: Đang gửi request mà không có Token!");
        }
        console.groupEnd();
    
        try {
            const url = `/api/v1/user/getAll`;
            
            // Tạo config object để log ra xem trước khi gửi
            const requestConfig = {
                params: {
                    page: page,
                    size: pageSize,
                    sort: 'id,asc'
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
    
            // --- CHECKPOINT 2: Kiểm tra cấu hình gửi đi ---
            // console.log("4. Config gửi đi:", requestConfig); // Bỏ comment nếu muốn soi kỹ headers
    
            const response = await axios.get(url, requestConfig);
    
            // --- CHECKPOINT 3: Thành công ---
            console.log("✅ API Thành công:", response.data);
    
            setUsers(response.data.content);
            setTotalPages(response.data.totalPages);
            setError(null);
    
        } catch (err) {
            // --- CHECKPOINT 4: Xử lý Lỗi (Quan trọng nhất) ---
            console.group("❌ DEBUG: Lỗi khi gọi API");
            
            if (err.response) {
                // Server đã trả về phản hồi nhưng là lỗi (4xx, 5xx)
                console.error("Status Code:", err.response.status); // 403, 401, 500?
                console.error("Dữ liệu lỗi (Response Body):", err.response.data); // Thường backend sẽ trả message ở đây
                console.error("Headers trả về:", err.response.headers);
            } else if (err.request) {
                // Request đã gửi nhưng không nhận được phản hồi (Network Error)
                console.error("Không nhận được phản hồi từ Server (Có thể do CORS hoặc Server tắt):", err.request);
            } else {
                // Lỗi khi setup request
                console.error("Lỗi Setup Request:", err.message);
            }
            console.groupEnd();
    
            if (err.response && err.response.status === 403) {
                 setError("Bạn không có quyền xem danh sách này (Lỗi 403). Kiểm tra Console để xem chi tiết.");
            } else {
                 setError("Không thể tải danh sách người dùng.");
            }
        } finally {
            setLoading(false);
        }
    };

    // 4. useEffect để gọi API khi component load hoặc page thay đổi
    useEffect(() => {
        fetchUsers(currentPage);
    }, [currentPage]);

    // Hàm chuyển trang
    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    // 5. Render giao diện
    if (loading && users.length === 0) return <div className="loading">Đang tải dữ liệu...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="user-list-container">
            <h2>Danh sách người dùng</h2>
            
            <table className="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Tuổi</th>
                        <th>Giới tính</th>
                        <th>Vai trò</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.age}</td>
                            {/* Hiển thị Enum Gender và Role */}
                            <td>{user.gender}</td> 
                            <td>
                                <span className={`role-badge ${user.role ? user.role.toLowerCase() : ''}`}>
                                    {user.role}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Điều khiển phân trang */}
            <div className="pagination">
                <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 0}
                >
                    Trước
                </button>
                <span>Trang {currentPage + 1} / {totalPages}</span>
                <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages - 1}
                >
                    Sau
                </button>
            </div>
        </div>
    );
};

export default UserList;