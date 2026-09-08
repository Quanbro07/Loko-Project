import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext'; 

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth(); 

  // 1. Đang tải thì chờ
  if (isLoading) {
      return <div>Đang kiểm tra quyền...</div>; 
  }

  // 2. Chưa đăng nhập
  if (!isAuthenticated) {
    console.log("Chặn: Chưa đăng nhập (isAuthenticated = false)");
    return <Navigate to="/auth?mode=login" replace />;
  }

  // 3. LOG QUAN TRỌNG: In ra xem user đang có cái gì
  console.log("--- DEBUG PROTECTED ROUTE ---");
  console.log("User hiện tại:", user);
  console.log("Role của User:", user?.role);
  console.log("Role yêu cầu:", allowedRoles);

  // 4. Kiểm tra quyền
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.warn(">>> CHẶN: Role không khớp!");
    return <Navigate to="/" replace />; 
  }

  return <Outlet />;
};

export default ProtectedRoute;