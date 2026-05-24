import React from 'react';
import './StudentLayout.css';
import logoImg from '../../assets/logo-tdtu.jpg';
import {
  AiOutlineHome,
  AiOutlineCheckCircle,
  AiOutlineBarChart,
  AiOutlineLogout,
  AiOutlineUser,
} from 'react-icons/ai';
import { FaUserCircle } from 'react-icons/fa';

function StudentLayout({ setPage, children, user, onLogout }) {

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="st-wrapper">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="st-header">
        <div className="st-header-left">
          <img src={logoImg} alt="TDTU Logo" className="st-school-logo" />
          <div className="st-system-name">
            HỆ THỐNG NHẬN DIỆN KHUÔN MẶT
          </div>
        </div>

        <div className="st-header-right">
          {/* Badge sinh viên */}
          <span className="st-role-badge">Sinh viên</span>

          <div className="st-user-profile">
            <span className="st-user-info">{user?.fullname || 'Sinh viên'}</span>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="st-user-avatar" />
            ) : (
              <FaUserCircle className="st-user-avatar-icon" />
            )}
          </div>

          <button className="st-header-logout-btn" onClick={handleLogout}>
            <AiOutlineLogout size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div className="st-layout">

        {/* SIDEBAR */}
        <aside className="st-sidebar">
          <div className="st-menu-group">
            <div className="st-menu" onClick={() => setPage && setPage('dashboard')}>
              <AiOutlineHome className="st-menu-icon" />
              <span>Trang chủ</span>
            </div>

            <div className="st-menu" onClick={() => setPage && setPage('attendance')}>
              <AiOutlineCheckCircle className="st-menu-icon" />
              <span>Điểm danh</span>
            </div>

            <div className="st-menu" onClick={() => setPage && setPage('statistics')}>
              <AiOutlineBarChart className="st-menu-icon" />
              <span>Thống kê</span>
            </div>

            <div className="st-menu" onClick={() => setPage && setPage('profile')}>
              <AiOutlineUser className="st-menu-icon" />
              <span>Hồ sơ</span>
            </div>
          </div>

          {/* Logout được quản lý bởi nút trên Header */}
          <div className="st-sidebar-footer" />
        </aside>

        {/* MAIN CONTENT */}
        <main className="st-main">
          <div className="st-content">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export default StudentLayout;