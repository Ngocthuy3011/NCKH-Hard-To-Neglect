import React, { useState } from 'react';
import './Auth.css';

function Register({ role, onRegisterSuccess, onSwitchToLogin, onBack }) {
  // Lấy dữ liệu người dùng nhập
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); // Xóa lỗi cũ trước khi gửi

    try {
      // Bắn dữ liệu dạng JSON khớp với RegisterRequest bên Backend
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password,
          fullname: fullname,
          role: role // 'student' hoặc 'lecturer' truyền từ App.jsx xuống
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("🎉 Đăng ký thành công! Vui lòng đăng nhập.");
        onRegisterSuccess(); // Tự động chuyển qua form Login
      } else {
        setError(data.detail || 'Đăng ký thất bại!');
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối đến Server Backend. Hãy chắc chắn FastAPI đang chạy!');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glass-card">
        <button className="back-icon" onClick={onBack} title="Quay lại">⬅</button>
        
        <h2 className="auth-title">Tạo Tài Khoản</h2>
        <div className={`role-indicator ${role === 'student' ? 'student-badge' : 'lecturer-badge'}`}>
          {role === 'student' ? '🎓 Sinh Viên' : '👨‍🏫 Giảng Viên'}
        </div>

        {/* Hiện thông báo lỗi nếu có */}
        {error && (
          <div style={{
            color: '#c53030', background: '#fed7d7', padding: '10px', 
            borderRadius: '8px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Họ và tên" 
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <input 
              type="text" 
              placeholder={role === 'student' ? "Mã số sinh viên" : "Mã giảng viên"} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="auth-btn">Đăng Ký</button>
        </form>

        <div className="switch-mode">
          Đã có tài khoản? <span onClick={onSwitchToLogin}>Đăng nhập ngay</span>
        </div>
      </div>
    </div>
  );
}

export default Register;