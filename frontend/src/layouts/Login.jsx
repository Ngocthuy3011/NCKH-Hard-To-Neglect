import React, { useState } from 'react';
import './Auth.css';

// ĐÃ XÓA: bỏ prop onSwitchToRegister
function Login({ role, onLoginSuccess, onBack }) {
  // Lấy dữ liệu người dùng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Vì Backend dùng OAuth2PasswordRequestForm, ta phải gửi định dạng form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Gọi API Backend
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Lưu token vào ví (localStorage) để mốt gọi API Điểm danh
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Đẩy thông tin user vừa lấy được từ Backend lên cho App.jsx
        onLoginSuccess(data.user);
      } else {
        setError(data.detail || 'Đăng nhập thất bại!');
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
        <h2 className="auth-title">Đăng Nhập</h2>
        
        <div className={`role-indicator ${role === 'student' ? 'student-badge' : 'lecturer-badge'}`}>
          {role === 'student' ? '🎓 Sinh Viên' : '👨‍🏫 Giảng Viên'}
        </div>

        {/* Hiện thông báo lỗi nếu có */}
        {error && <div style={{color: 'red', marginBottom: '10px', fontSize: '14px'}}>{error}</div>}

        <form onSubmit={handleLogin}>
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
          <button type="submit" className="auth-btn">Đăng Nhập</button>
        </form>

        {/* ĐÃ XÓA: Khối div chứa nút Đăng ký ngay */}
      </div>
    </div>
  );
}

export default Login;