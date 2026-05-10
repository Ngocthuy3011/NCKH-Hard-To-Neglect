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
        <div className="system-name">
          ĐIỂM DANH BẰNG<br></br> NHẬN DIỆN KHUÔN MẶT
        </div>

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center' }}>
          {/* Hiển thị Tên thật của Giảng viên từ Database */}
          <div className="user-info" style={{ marginRight: '15px', fontWeight: 'bold' }}>
            {user?.fullname || "Giảng viên"}
          </div>
          <img 
            src={avatarImg} 
            alt="User Avatar" 
            className="user-avatar" 
          />
          {/* Nút Đăng xuất */}
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '20px',
              fontWeight: 'bold',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.4)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <AiOutlineLogout size={18} /> Thoát
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

          <div className="menu">
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