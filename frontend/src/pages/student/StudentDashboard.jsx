import React, { useState, useEffect } from 'react';
import './StudentDashboard.css';
import AttendanceHistory from './AttendanceHistory';
import SubjectDetails from './SubjectDetails';

const StudentDashboard = ({ onBack, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCamera, setShowCamera] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // 1. TẠO STATE ĐỂ CHỨA DỮ LIỆU TỪ BACKEND TRẢ VỀ
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Hiệu ứng chờ tải dữ liệu

  // 2. DÙNG USEEFFECT ĐỂ GỌI API NGAY KHI VÀO TRANG
  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        // Lấy Token đã lưu trong ví lúc Đăng nhập
        const token = localStorage.getItem('token'); 
        
        // Gọi thẳng vào API của Backend
        const response = await fetch('http://localhost:8000/api/schedule/today', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Trình thẻ VIP
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTodaySchedule(data); // Đổ dữ liệu thật vào State
        } else {
          console.error("Lỗi khi tải lịch học");
        }
      } catch (error) {
        console.error("Không thể kết nối Backend:", error);
      } finally {
        setIsLoading(false); // Tải xong thì tắt hiệu ứng chờ
      }
    };

    fetchTodaySchedule();
  }, []); // Dấu ngoặc vuông rỗng nghĩa là chỉ chạy 1 lần khi mới mở trang

  // Hàm mở Camera
  const handleOpenAttendance = (subject) => {
    setSelectedSubject(subject);
    setShowCamera(true);
  };

  const handleCaptureFace = () => {
    alert(`Đang gửi dữ liệu khuôn mặt đến API_CheckAttend.py cho môn ${selectedSubject?.name}...`);
    setShowCamera(false);
  };

  return (
    <div className="student-dashboard">
      <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {/* Hiển thị Tên thật của sinh viên */}
          <h1>Chào bạn, {user?.fullname || "Sinh viên"} 🎓</h1>
          <p>Hôm nay bạn có {todaySchedule.length} tiết học.</p>
        </div>
        <button className="back-btn" onClick={() => {
          localStorage.removeItem('token'); // Đăng xuất thì xé bỏ vé VIP
          onBack();
        }}>Đăng xuất</button>
      </div>

      {/* THANH MENU CHUYỂN TAB */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            background: activeTab === 'overview' ? '#3182ce' : 'rgba(255,255,255,0.5)',
            color: activeTab === 'overview' ? 'white' : '#4a5568'
          }}
        >
          Tổng quan
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            background: activeTab === 'history' ? '#3182ce' : 'rgba(255,255,255,0.5)',
            color: activeTab === 'history' ? 'white' : '#4a5568'
          }}
        >
          Lịch sử điểm danh
        </button>
        <button 
          onClick={() => setActiveTab('details')}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
            background: activeTab === 'details' ? '#3182ce' : 'rgba(255,255,255,0.5)',
            color: activeTab === 'details' ? 'white' : '#4a5568'
          }}
        >
          Chi tiết ngày học
        </button>
      </div>

      {/* NỘI DUNG TAB TỔNG QUAN */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><span>Tỷ lệ chuyên cần</span><h3>--%</h3></div>
            <div className="stat-card"><span>Số buổi đã học</span><h3>--</h3></div>
            <div className="stat-card"><span>Số buổi vắng</span><h3>--</h3></div>
          </div>

          <div className="content-grid">
            <div className="main-content">
              <h2>Lịch học hôm nay</h2>
              
              {/* Kiểm tra nếu đang tải thì hiện chữ Loading, nếu mảng rỗng thì báo trống */}
              {isLoading ? (
                <p style={{color: '#718096'}}>⏳ Đang tải dữ liệu từ máy chủ...</p>
              ) : todaySchedule.length === 0 ? (
                <p style={{color: '#48bb78', fontWeight: 'bold'}}>🎉 Hôm nay bạn không có lịch học nào. Trống lịch!</p>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {todaySchedule.map((subject, index) => (
                    <div key={index} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3182ce'
                    }}>
                      <div>
                        <h3 style={{margin: '0 0 5px 0', color: '#1a365d'}}>{subject?.name}</h3>
                        <p style={{margin: 0, fontSize: '14px', color: '#718096'}}>🕒 {subject?.time} | 📍 {subject?.room}</p>
                      </div>
                      
                      {subject?.status === 'pending' ? (
                        <button className="attend-btn" onClick={() => handleOpenAttendance(subject)}>
                          📷 Điểm danh
                        </button>
                      ) : (
                        <button className="attend-btn" disabled style={{background: '#48bb78', color: 'white'}}>
                          ✅ Đã điểm danh
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="side-content">
              <h2>Thông tin cá nhân</h2>
              {/* Hiển thị dữ liệu thật của bạn */}
              <p><strong>Họ và tên:</strong> {user?.fullname}</p>
              <p><strong>MSSV:</strong> {user?.mssv}</p>
              <p><strong>Lớp:</strong> {user?.className || "Chưa cập nhật"}</p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && <AttendanceHistory />}
      {activeTab === 'details' && <SubjectDetails />}

      {/* MODAL POPUP CAMERA */}
      {showCamera && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <h2>Điểm danh khuôn mặt</h2>
            <p>Môn: <strong>{selectedSubject?.name}</strong></p>
            
            <div className="camera-frame">
              📷 [Luồng Camera sẽ hiển thị ở đây]
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCamera(false)}>Hủy bỏ</button>
              <button className="capture-btn" onClick={handleCaptureFace}>Chụp & Xác nhận</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;