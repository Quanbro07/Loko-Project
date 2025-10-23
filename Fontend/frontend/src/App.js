import { Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import Aboutus from './Aboutus';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/aboutus" element={<Aboutus />} />
    </Routes>
  );
}

export default App;
