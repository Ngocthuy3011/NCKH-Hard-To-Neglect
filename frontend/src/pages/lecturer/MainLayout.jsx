import React from 'react';
import "./MainLayout.css";
import logoImg from '../../assets/logo-tdtu.jpg'; 
import { AiOutlineHome, AiOutlineCheckCircle, AiOutlineBarChart, AiOutlineSetting, AiOutlineLogout } from "react-icons/ai";
import { FaUserCircle } from "react-icons/fa"; // Thêm thư viện icon chuẩn cho User

function LecturerLayout({ setPage, children, user, onLogout }) {
  
  // Hàm xử lý khi bấm nút Thoát
  const handleLogout = () => {
    localStorage.removeItem('token'); 
    if (onLogout) {
      onLogout(); 
    } else {
      window.location.reload(); 
    }
  };

  return (
    <div className="wrapper">
      <div className="header">
        
        {/* GÓC TRÁI: Logo Trường + Tên Hệ Thống */}
        <div className="header-left">
          <img src={logoImg} alt="TDTU Logo" className="school-logo" />
          <div className="system-name">
            HỆ THỐNG NHẬN DIỆN KHUÔN MẶT
          </div>
        </div>

        {/* GÓC PHẢI: Tên Giảng viên + Avatar + Nút Đăng xuất */}
        <div className="header-right">
          <div className="user-profile">
            <span className="user-info">{user?.fullname || "Giảng viên"}</span>
            
            {/* LOGIC THÔNG MINH: Nếu có link ảnh thật thì hiện, không thì dùng Icon Vector siêu nét */}
            {user?.avatar ? (
              <img src={user.avatar} alt="User Avatar" className="user-avatar" />
            ) : (
              <FaUserCircle className="user-avatar-icon" />
            )}
          </div>
          
          <button className="header-logout-btn" onClick={handleLogout}>
            <AiOutlineLogout size={18} /> Đăng xuất
          </button>
        </div>

      </div>

      <div className="layout">
        <div className="sidebar">
          <div onClick={() => setPage("dashboard")} className="menu">
            <AiOutlineHome className="menu-icon" /> <span>Trang chủ</span>
          </div>
          
          <div onClick={() => setPage("attendance")} className="menu">
            <AiOutlineCheckCircle className="menu-icon" /> <span>Điểm danh</span>
          </div>

          <div onClick={() => setPage("statistics")} className="menu">
            <AiOutlineBarChart className="menu-icon" /> <span>Thống kê</span>
          </div>

          <div onClick={() => setPage("management")} className="menu">
            <AiOutlineSetting className="menu-icon" /> <span>Quản lý</span>
          </div>
        </div>

        <div className="main">
          <div className="content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LecturerLayout;