import React from 'react';
import "./MainLayout.css";
// Lùi 2 cấp (../../) để trỏ đúng vào thư mục assets từ trong pages/lecturer/
import avatarImg from '../../assets/user.png'; 
import { AiOutlineHome, AiOutlineCheckCircle, AiOutlineBarChart, AiOutlineSetting, AiOutlineLogout } from "react-icons/ai";

function LecturerLayout({ setPage, children, user, onLogout }) {
  
  // Hàm xử lý khi bấm nút Thoát
  const handleLogout = () => {
    localStorage.removeItem('token'); // Xóa token đăng nhập
    if (onLogout) {
      onLogout(); // Gọi hàm đẩy ra màn hình chọn Role
    } else {
      window.location.reload(); 
    }
  };

  return (
    <div className="wrapper">
      <div className="header">
        <div className="system-name" style={{ fontWeight: 'bold', fontSize: '24px' }}>
          HỆ THỐNG ĐIỂM DANH 
        </div>

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center' }}>
          {/* Hiển thị Tên thật của Giảng viên từ Database
          <div className="user-info" style={{ fontWeight: 'bold' }}>
            {user?.fullname || "Giảng viên"} */}
          
          <img 
            src={avatarImg} 
            alt="User Avatar" 
            className="user-avatar" 
          />
          {/* Hiển thị Tên thật của Giảng viên từ Database */}
          <div className="user-info">
            {user?.fullname || "Giảng viên"}
          </div>
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

          <div className="sidebar-footer">
            <button className="logout-button" onClick={handleLogout}>
              <AiOutlineLogout size={18} /> Đăng xuất
            </button>
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