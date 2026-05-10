import React, { useState, useEffect } from 'react';

const AttendanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi API lấy lịch sử điểm danh ngay khi mở tab này
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/attendance/history', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        } else {
          console.error("Lỗi khi tải lịch sử điểm danh");
        }
      } catch (error) {
        console.error("Không thể kết nối Backend:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="history-tab" style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '20px', borderRadius: '15px' }}>
      <h2 style={{ color: '#2d3748', marginBottom: '20px' }}>Lịch sử điểm danh của bạn</h2>
      
      {isLoading ? (
        <p style={{ color: '#718096' }}>⏳ Đang tải dữ liệu từ hệ thống...</p>
      ) : history.length === 0 ? (
        <p style={{ color: '#e53e3e', fontWeight: 'bold' }}>Bạn chưa có dữ liệu điểm danh nào trong học kỳ này.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#edf2f7', color: '#4a5568' }}>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e0' }}>Môn học</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e0' }}>Ngày</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e0' }}>Giờ ghi nhận</th>
                <th style={{ padding: '15px', borderBottom: '2px solid #cbd5e0' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#2b6cb0' }}>{record.subject_name}</td>
                  <td style={{ padding: '15px' }}>{record.date}</td>
                  <td style={{ padding: '15px' }}>{record.time_logged}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold',
                      backgroundColor: record.status === 'có mặt' ? '#c6f6d5' : '#fed7d7',
                      color: record.status === 'có mặt' ? '#22543d' : '#822727'
                    }}>
                      {record.status === 'có mặt' ? 'Có mặt' : 'Vắng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;