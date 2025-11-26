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
        const token = localStorage.getItem('token');
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
            const url = `http://localhost:8080/api/v1/user/getAll`;
            
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

    const handleDisableUser = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa người dùng này?")) return;

        try {
            // Gọi API theo format @RequestParam: /disable?userId=...
            const url = `http://localhost:8080/api/v1/user/disable?userId=${userId}`;
            
            // Post request, body là null vì tham số nằm trên URL
            await axios.post(url, null);

            // Cập nhật State ngay lập tức (UI Optimistic Update)
            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? { ...user, enabled: false } : user
            ));
            alert("Đã vô hiệu hóa thành công!");

        } catch (err) {
            console.error("Lỗi khi disable user:", err);
            alert("Lỗi: Không thể vô hiệu hóa người dùng.");
        }
    };

    // const handleEnableUser = async (userId) => {
    //     if (!window.confirm("Kích hoạt lại người dùng này?")) return;

    //     try {
    //         const url = `http://localhost:8080/api/v1/user/enable?userId=${userId}`; 
    //         await axios.post(url, null, getAuthConfig());

    //         setUsers(prevUsers => prevUsers.map(user => 
    //             user.id === userId ? { ...user, enabled: true } : user
    //         ));
    //         alert("Đã kích hoạt thành công!");
    //     } catch (err) {
    //         console.error("Lỗi khi enable user:", err);
    //         alert("Lỗi: Không thể kích hoạt người dùng.");
    //     }
    // };

    // const handleChangeRole = async (userId, newRole) => {
    //     const actionText = newRole === 'VIP_USER' ? "nâng lên VIP" : "xuống thường";
    //     if (!window.confirm(`Bạn muốn ${actionText} cho user này?`)) return;

    //     try {
    //         const url = `http://localhost:8080/api/v1/user/change-role`; 
    //         await axios.post(url, null, {
    //             ...getAuthConfig(),
    //             params: { userId: userId, role: newRole }
    //         });

    //         setUsers(prevUsers => prevUsers.map(user => 
    //             user.id === userId ? { ...user, role: newRole } : user
    //         ));
            
    //     } catch (err) {
    //         console.error("Lỗi đổi role:", err);
    //         alert("Lỗi khi cập nhật quyền hạn.");
    //     }
    // };

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
                        <th>Trạng thái</th>
                        <th></th>
                        <th></th>
                        <th></th>
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
                            <td>{(user.enabled ? "Hoạt động":"Ngưng hoạt động")}</td>
                            <td className='button-span'>
                            {user.enabled ? (
                                    // Nếu đang Enable -> Hiện nút Deactivate
                                    <button 
                                        className='admin-button deactivate-button'
                                        onClick={() => handleDisableUser(user.id)}
                                    >
                                        Vô hiệu
                                    </button>
                                ) : (
                                    // Nếu đang Disable -> Hiện nút Reactivate
                                    <button 
                                        className='admin-button reactivate-button'
                                        // onClick={() => handleEnableUser(user.id)}
                                    >
                                        Kích hoạt
                                    </button>
                                )}
                            </td>
                            <td className='button-span'>
                            {user.role === 'USER' ? (
                                    <button 
                                        className='admin-button to-vip-user-button'
                                        // onClick={() => handleChangeRole(user.id, 'VIP_USER')}
                                    >
                                        Lên VIP
                                    </button>
                                ) : (
                                    <button 
                                        className='admin-button to-normal-user-button'
                                        // onClick={() => handleChangeRole(user.id, 'USER')}
                                    >
                                        Về thường
                                    </button>
                                )}
                            </td>
                            <td className='button-span'>
                                <div className='admin-button admin-delete-button'>Xóa người dùng</div>
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