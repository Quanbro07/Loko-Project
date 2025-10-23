import { Routes, Route } from 'react-router-dom';
import Homepage from './Homepage/Homepage';
import Aboutus from './AboutUs/Aboutus';
import './App.css';
import { LanguageProvider } from './Language/LanguageContext'; // Import LanguageProvider

function App() {
  return (
    <LanguageProvider> {/* Wrap Routes with LanguageProvider */}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/aboutus" element={<Aboutus />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
