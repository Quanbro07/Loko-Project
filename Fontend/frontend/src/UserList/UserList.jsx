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
    
    const [searchId, setSearchId] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const getAuthConfig = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };
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

    const handleSearch = async () => {
        // Nếu ô tìm kiếm rỗng, load lại danh sách gốc
        if (!searchId.trim()) {
            fetchUsers(0);
            return;
        }

        setLoading(true);
        setIsSearching(true); // Đang ở chế độ tìm kiếm

        try {
            // Gọi API getUser theo ID
            const url = `http://localhost:8080/api/v1/user/getUser?id=${searchId}`;
            
            console.log(`🔍 Searching ID: ${searchId}`);
            
            const response = await axios.get(url, getAuthConfig());

            console.log("✅ Kết quả tìm kiếm:", response.data);

            // QUAN TRỌNG: API trả về 1 object, ta phải biến nó thành mảng để map() hoạt động
            if (response.data) {
                setUsers([response.data]); 
                setError(null);
            } else {
                setUsers([]); // Không có data (dù hiếm khi xảy ra nếu status 200)
            }
            
            // Khi tìm đích danh 1 người, không cần phân trang
            setTotalPages(0); 

        } catch (err) {
            console.error("❌ Lỗi tìm kiếm:", err);
            setUsers([]); // Xóa danh sách cũ để tránh hiểu nhầm
            
            if (err.response && err.response.status === 404) {
                setError(`Không tìm thấy người dùng có ID = ${searchId}`);
            } else if (err.response && err.response.status === 403) {
                setError("Bạn không có quyền tìm kiếm user này.");
            } else {
                setError("Lỗi khi tìm kiếm (Vui lòng kiểm tra ID là số).");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetSearch = () => {
        setSearchId('');
        fetchUsers(0);
    };

    const handleDisableUser = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa người dùng này?")) return;

        try {
            const url = `http://localhost:8080/api/v1/user/disable?userId=${userId}`;
            // FIX: Thêm getAuthConfig() để có Token
            await axios.post(url, null, getAuthConfig());

            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? { ...user, enabled: false } : user
            ));
            alert("Đã vô hiệu hóa thành công!");

        } catch (err) {
            console.error("Lỗi disable:", err);
            alert("Lỗi: Không thể vô hiệu hóa người dùng (Kiểm tra quyền Admin).");
        }
    };

    const handleEnableUser = async (userId) => {
        if (!window.confirm("Kích hoạt lại người dùng này?")) return;

        try {
            const url = `http://localhost:8080/api/v1/user/enable?userId=${userId}`; 
            await axios.post(url, null, getAuthConfig());

            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? { ...user, enabled: true } : user
            ));
            alert("Đã kích hoạt thành công!");
        } catch (err) {
            console.error("Lỗi enable:", err);
            alert("Lỗi: Không thể kích hoạt người dùng.");
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        const actionText = newRole === 'VIP_USER' ? "nâng lên VIP" : "xuống thường";
        if (!window.confirm(`Bạn muốn ${actionText} cho user này?`)) return;

        try {
            // LƯU Ý: Đảm bảo Backend có API hỗ trợ đổi role này
            // Nếu Backend chỉ có /upgrade, logic "xuống thường" có thể chưa chạy được ở phía server
            const url = `http://localhost:8080/api/v1/user/upgrade`; 
            
            await axios.post(url, null, {
                ...getAuthConfig(),
                params: { userId: userId, role: newRole } // Gửi role lên để backend xử lý
            });

            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
            alert(`Đã chuyển thành công sang ${newRole}!`);
            
        } catch (err) {
            console.error("Lỗi đổi role:", err);
            alert("Lỗi khi cập nhật quyền hạn.");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("CẢNH BÁO: Hành động này không thể hoàn tác. Xóa người dùng?")) return;

        try {
            const url = `http://localhost:8080/api/v1/user/delete?userId=${userId}`;
            await axios.post(url, null, getAuthConfig());

            // Xóa khỏi danh sách hiển thị
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            alert("Đã xóa người dùng thành công!");
        } catch (err) {
            console.error("Lỗi xóa user:", err);
            alert("Lỗi: Không thể xóa người dùng.");
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

    return (
        <div className="user-list-container">
            <h2>Danh sách người dùng</h2>
            <div className="search-bar">
                <input  className='admin-input-search'
                    type="number" 
                    placeholder="Nhập ID người dùng..." 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ padding: '8px', width: '250px' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // Nhấn Enter để tìm
                />
                <button 
                    onClick={handleSearch} 
                    className="admin-search-button " 
                    style={{ backgroundColor: '#007bff', color: 'white' }}
                >
                    🔍 Tìm kiếm
                </button>
                {isSearching}
            </div>
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
                    </tr>
                </thead>
                <tbody>
                    {/* Kiểm tra: Nếu ĐANG LOAD thì hiện loading */}
                    {loading ? (
                        <tr>
                            <td colSpan="10" style={{textAlign: 'center', padding: '20px'}}>Đang tải dữ liệu...</td>
                        </tr>
                    ) : users.length > 0 ? (
                        // TRƯỜNG HỢP CÓ DỮ LIỆU: Render danh sách
                        users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.age}</td>
                                <td>{user.gender}</td> 
                                <td>
                                    <span className={`role-badge ${user.role ? user.role.toLowerCase() : ''}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{(user.enabled ? "Hoạt động":"Ngưng hoạt động")}</td>
                                <td className='button-span'>
                                    {user.enabled ? (
                                        <button className='admin-button deactivate-button' onClick={() => handleDisableUser(user.id)}>Vô hiệu</button>
                                    ) : (
                                        <button className='admin-button reactivate-button' onClick={() => handleEnableUser(user.id)}>Kích hoạt</button>
                                    )}
                                </td>
                                <td className='button-span'>
                                    {user.role === 'USER' ? (
                                        <button className='admin-button to-vip-user-button' onClick={() => handleChangeRole(user.id, 'VIP_USER')}>Nâng cấp</button>
                                    ) : (
                                        <button className='admin-button to-normal-user-button' onClick={() => handleChangeRole(user.id, 'USER')}>Hạ cấp</button>
                                    )}
                                </td>
                                <td className='button-span'>
                                    <button className='admin-button admin-delete-button' onClick={() => handleDeleteUser(user.id)}>Xóa</button> 
                                </td>
                            </tr>
                        ))
                    ) : (
                        // TRƯỜNG HỢP KHÔNG CÓ DỮ LIỆU (MẢNG RỖNG): Render hàng thông báo
                        // colSpan="10" vì bảng của bạn có 10 cột headers
                        <tr>
                            <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: 'red', fontWeight: 'bold' }}>
                                {error ? error : "Không tìm thấy người dùng nào trong danh sách."}
                            </td>
                        </tr>
                    )}
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