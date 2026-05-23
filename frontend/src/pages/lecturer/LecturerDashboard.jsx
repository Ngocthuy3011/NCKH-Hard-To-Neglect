import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout'; // Lùi ra 2 cấp để vào layouts
import { getCurrentUser } from '../../utils/jwt';
import './LecturerDashboard.css';

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const teacherId = user ? user.sub : null;

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    const fetchClasses = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/lecturer/${teacherId}/classes`);
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
        }
      } catch (error) {
        console.error("Lỗi tải lớp:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

  return (
    /* Dùng MainLayout bọc bên ngoài nội dung của Dashboard */
    <MainLayout userName="Nguyễn Thị Diệu Hiền">
      <div className="dashboard-wrapper">
        <div className="container">
          <div className="card">
            <span>ĐIỂM DANH</span>
            <p>{loading ? "Đang tải..." : `${classes.length} lớp`}</p>
          </div>
          
          <div className="card">
            <span>THỐNG KÊ</span>
            <p>{loading ? "Đang tải..." : `${classes.length} lớp`}</p>
          </div>
          
          <div className="card">
            <span>THÔNG TIN -<br />QUẢN LÝ</span>
            <p>{loading ? "Đang tải..." : `${classes.length} lớp`}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;