import React from 'react';
import MainLayout from '../layouts/MainLayout'; // Lùi ra 2 cấp để vào layouts
import './LecturerDashboard.css';

const Dashboard = () => {
  return (
    /* Dùng MainLayout bọc bên ngoài nội dung của Dashboard */
    <MainLayout userName="Nguyễn Thị Diệu Hiền">
      <div className="dashboard-wrapper">
        <div className="container">
          <div className="card">
            <span>ĐIỂM DANH</span>
          </div>
          
          <div className="card">
            <span>THỐNG KÊ</span>
          </div>
          
          <div className="card">
            <span>THÔNG TIN -<br />QUẢN LÝ</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;