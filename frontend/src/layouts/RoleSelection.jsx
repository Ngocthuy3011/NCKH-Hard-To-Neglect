import React from 'react';
import './RoleSelection.css';

const RoleSelection = ({ onSelectRole }) => {
  return (
    <div className="role-container">
      <h1 className="role-title">Hệ Thống Điểm Danh</h1>
      <p className="role-subtitle">Vui lòng chọn vai trò của bạn để đăng nhập</p>

      <div className="card-wrapper">
        {/* Thẻ Sinh viên */}
        <div className="role-card student-card" onClick={() => onSelectRole('student')}>
          <div className="icon-box">🎓</div>
          <h2>Sinh Viên</h2>
          <p>Xem lịch học, kết quả điểm danh và thông tin cá nhân</p>
        </div>

        {/* Thẻ Giảng viên */}
        <div className="role-card teacher-card" onClick={() => onSelectRole('lecturer')}>
          <div className="icon-box">👨‍🏫</div>
          <h2>Giảng Viên</h2>
          <p>Quản lý lớp học, thực hiện điểm danh bằng khuôn mặt</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;