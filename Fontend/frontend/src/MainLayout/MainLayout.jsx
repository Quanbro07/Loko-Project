// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
// Import Navbar, Footer của User ở đây (nếu bạn có)
import Navbar from '../Navbar/Navbar'; 
import Footer from '../Footer/Footer';

const MainLayout = () => {
  return (
    <div>
       <Navbar />  
       
       <div className="main-content">
          <Outlet /> {/* Nơi nội dung các trang con (Home, User...) sẽ hiện ra */}
       </div>

       <Footer /> 
    </div>
  );
};

export default MainLayout;