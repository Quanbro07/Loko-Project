import { Routes, Route } from 'react-router-dom';
import Homepage from './Homepage/Homepage';
import Aboutus from './AboutUs/Aboutus';
import User from './User/User'; // Import User component
import './App.css';
import { LanguageProvider } from './Language/LanguageContext'; // Import LanguageProvider
import { AuthProvider } from './Auth/AuthContext'; // Import AuthProvider
import AuthModal from './Auth/AuthModal'; // Import AuthModal

function App() {
  return (
    <LanguageProvider> {/* Wrap Routes with LanguageProvider */}
      <AuthProvider> {/* Wrap with AuthProvider */}
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/aboutus" element={<Aboutus />} />
          <Route path="/user" element={<User />} /> {/* Add new route for User */}
        </Routes>
        <AuthModal /> {/* Add AuthModal */}
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
