import { Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './Homepage/Homepage';
import Aboutus from './AboutUs/Aboutus';
import User from './User/User'; // Import User component
import Plan from './Plan/Plan'; // Import Plan component
import './App.css';
import { LanguageProvider } from './Language/LanguageContext'; // Import LanguageProvider
import { AuthProvider } from './Auth/AuthContext'; // Import AuthProvider
import AuthPage from './Auth/AuthPage';
import CurrentPlan from './CurrentPlan/CurrentPlan';

function App() {
  return (
    <LanguageProvider> {/* Wrap Routes with LanguageProvider */}
      <AuthProvider> {/* Wrap with AuthProvider */}
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/aboutus" element={<Aboutus />} />
          <Route path="/user" element={<User />} /> {/* Add new route for User */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/search" element={<Plan />} /> {/* Add new route for Plan */}
          <Route path="/currentplan" element={<CurrentPlan />} />
          {/* convenience routes for direct /login and /signup */}
          <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=register" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
