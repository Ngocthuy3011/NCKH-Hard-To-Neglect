import React, { useState, useEffect } from 'react';
import './SubjectDetails.css';

const SubjectDetails = () => {
  const [history, setHistory] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
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
          const historyData = data || [];
          setHistory(historyData);

          const subjects = [];
          const subjectMap = new Map();

          historyData.forEach((item) => {
            if (!subjectMap.has(item.subject_id)) {
              subjectMap.set(item.subject_id, item.subject_name);
              subjects.push({ subject_id: item.subject_id, subject_name: item.subject_name });
            }
          });

          setSubjectOptions(subjects);
          if (subjects.length > 0) {
            setSelectedSubjectId(subjects[0].subject_id);
          }
        } else {
          console.error('Lỗi khi tải dữ liệu chi tiết ngày học');
        }
      } catch (error) {
        console.error('Không thể kết nối Backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, []);

  const filteredRecords = history.filter((record) => record.subject_id === selectedSubjectId);
  const selectedName = subjectOptions.find((item) => item.subject_id === selectedSubjectId)?.subject_name || '';

  const attendedCount = filteredRecords.filter((record) => record.status === 'có mặt').length;
  const absentCount = filteredRecords.filter((record) => record.status !== 'có mặt').length;
  const totalCount = filteredRecords.length;

  return (
    <div className="details-container">
      <div className="details-header">
        <h2 style={{ color: '#2d3748', margin: 0 }}>Chi tiết từng buổi học</h2>
        <select
          className="subject-select"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          disabled={isLoading || subjectOptions.length === 0}
        >
          {subjectOptions.length === 0 ? (
            <option value="">Không có dữ liệu</option>
          ) : (
            subjectOptions.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.subject_name}
              </option>
            ))
          )}
        </select>
      </div>

      {isLoading ? (
        <p style={{ color: '#718096', marginTop: '20px' }}>⏳ Đang tải dữ liệu từ hệ thống...</p>
      ) : filteredRecords.length === 0 ? (
        <p style={{ color: '#e53e3e', fontWeight: 'bold', marginTop: '20px' }}>
          Chưa có dữ liệu điểm danh cho môn này.
        </p>
      ) : (
        <>
          <div className="mini-summary">
            <span>Có mặt: <strong>{attendedCount}</strong></span>
            <span>Vắng mặt: <strong>{absentCount}</strong></span>
            <span>📊 Tổng số buổi đã diễn ra: <strong>{totalCount}</strong></span>
          </div>

          <div className="date-list">
            {filteredRecords.map((record, index) => (
              <div className={`date-card ${record.status === 'có mặt' ? 'status-yes' : 'status-no'}`} key={index}>
                <div className="date-info">
                  <h4>{selectedName}</h4>
                  <p>Ngày: {record.date}</p>
                  <p>Thời gian: {record.time_logged}</p>
                  <p>Buổi: {record.session_no}</p>
                </div>
                <div className={`attendance-status ${record.status === 'có mặt' ? 'status-yes' : 'status-no'}`}>
                  {record.status === 'có mặt' ? 'Có mặt' : 'Vắng'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SubjectDetails;
