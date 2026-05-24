import React, { useState, useEffect } from 'react';
import './StudentStatistics.css';

const StudentStatistics = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0,
    bySubject: {}
  });

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
          calculateStats(data);
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

  const calculateStats = (data) => {
    if (!data || data.length === 0) return;

    let presentCount = 0;
    let subjectData = {};

    data.forEach(record => {
      const isPresent = record.status === 'có mặt';
      if (isPresent) presentCount++;

      // GHÉP MÃ MÔN VÀ TÊN MÔN CHO PHẦN TIẾN ĐỘ THỐNG KÊ
      const fullSubjectName = `${record.subject_id} - ${record.subject_name}`;

      if (!subjectData[fullSubjectName]) {
        subjectData[fullSubjectName] = { total: 0, present: 0 };
      }
      subjectData[fullSubjectName].total += 1;
      if (isPresent) subjectData[fullSubjectName].present += 1;
    });

    setStats({
      total: data.length,
      present: presentCount,
      absent: data.length - presentCount,
      rate: Math.round((presentCount / data.length) * 100),
      bySubject: subjectData
    });
  };

  return (
    <div className="statistics-page">
      <h2 className="page-title">Thống kê Điểm danh</h2>

      {isLoading ? (
        <p className="loading-text">Đang tổng hợp dữ liệu thống kê...</p>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dữ liệu điểm danh nào trong học kỳ này để thống kê.</p>
        </div>
      ) : (
        <>
          <div className="stats-overview-grid">
            <div className="stat-box rate-box">
              <h3>{stats.rate}%</h3>
              <span>Tỷ lệ chuyên cần</span>
            </div>
            <div className="stat-box">
              <h3>{stats.total}</h3>
              <span>Tổng số buổi</span>
            </div>
            <div className="stat-box present-box">
              <h3>{stats.present}</h3>
              <span>Có mặt</span>
            </div>
            <div className="stat-box absent-box">
              <h3>{stats.absent}</h3>
              <span>Vắng mặt</span>
            </div>
          </div>

          <div className="subject-breakdown">
            <h3 className="section-title">Tiến độ theo môn học</h3>
            <div className="progress-container">
              {Object.keys(stats.bySubject).map((subjectName, index) => {
                const sub = stats.bySubject[subjectName];
                const subRate = Math.round((sub.present / sub.total) * 100);
                
                return (
                  <div key={index} className="progress-item">
                    <div className="progress-label">
                      <span className="subject-name">{subjectName}</span>
                      <span className="subject-rate">{sub.present}/{sub.total} buổi ({subRate}%)</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className={`progress-bar-fill ${subRate < 80 ? 'warning' : ''} ${subRate < 50 ? 'danger' : ''}`} 
                        style={{ width: `${subRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="history-table-section">
            <h3 className="section-title">Lịch sử chi tiết</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th>Ngày học</th>
                    <th>Giờ ghi nhận</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={index}>
                      {/* HIỂN THỊ MÃ MÔN VÀ TÊN MÔN Ở BẢNG LỊCH SỬ */}
                      <td className="fw-bold text-primary">{record.subject_id} - {record.subject_name}</td>
                      <td>{record.date}</td>
                      <td>{record.time_logged || "--:--"}</td>
                      <td>
                        <span className={`status-badge ${record.status === 'có mặt' ? 'status-present' : 'status-absent'}`}>
                          {record.status === 'có mặt' ? 'Có mặt' : 'Vắng'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentStatistics;