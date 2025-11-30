import { Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './Homepage/Homepage';
import Aboutus from './AboutUs/Aboutus';
import User from './User/User'; 
import Plan from './Plan/Plan'; 
import './App.css';
import { LanguageProvider } from './Language/LanguageContext'; 
import { AuthProvider } from './Auth/AuthContext'; 
import AuthPage from './Auth/AuthPage';
import VerifyPage from './Auth/VerifyPage';
import CurrentPlan from './CurrentPlan/CurrentPlan';
import ProtectedRoute from './ProtectedRoute/ProtectedRoute'; // Đảm bảo đường dẫn đúng
import AdminDashboard from './AdminDashboard/AdminDashboard'; 
import MainLayout from './MainLayout/MainLayout';
import Purchase from './Purchase/Purchase';
function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        {/* Chỉ dùng 1 thẻ Routes duy nhất */}
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Homepage />} />
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/aboutus" element={<Aboutus />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/verify" element={<VerifyPage />} />
            <Route element={<ProtectedRoute allowedRoles={['USER']}/>}>
              <Route path="/user" element={<User />} />              
              <Route path="/search" element={<Plan />} /> 
              <Route path="/currentplan" element={<CurrentPlan />} />
            </Route>
          </Route>
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=register" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;