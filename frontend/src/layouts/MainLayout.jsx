import React from 'react';
import './MainLayout.css'; // Chúng ta sẽ đưa phần CSS vào đây
import avatarImg from '../assets/user.png';

const MainLayout = ({ children, userName}) => {
  return (
    <div className="layout-wrapper">
      {/* Header cố định */}
      <header>
        <h1>HỆ THỐNG ĐIỂM DANH BẰNG<br />NHẬN DIỆN KHUÔN MẶT</h1>
      </header>

      {/* Thanh thông tin người dùng */}
      <div className="user-info">
        <span>{userName}</span>
        {/* <div style={{ width: '24px', height: '24px', background: '#666', borderRadius: '50%' }}></div> */}

        <img 
          src={avatarImg} 
          alt="User Avatar" 
          className="user-avatar" 
        />

        <img 
          src="https://flagcdn.com/w20/vn.png" 
          alt="VN Flag" 
          className="flag-icon" 
        />
        {/* <img src="https://flagcdn.com/w20/vn.png" alt="VN" /> */}
      </div> 

      {/* Vùng nội dung chính - Sẽ thay đổi theo từng trang */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;