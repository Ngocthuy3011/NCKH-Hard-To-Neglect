import React, { useState } from 'react';
import './SubjectDetails.css';

// Dữ liệu mẫu mô phỏng Database
const mockDetails = {
  "IT004": {
    name: "Lập trình Web (React/PHP)",
    total: 4,
    attended: 3,
    absent: 1,
    records: [
      { date: "10/05/2026", time: "07:30 - 09:30", status: "attended" },
      { date: "03/05/2026", time: "07:30 - 09:30", status: "attended" },
      { date: "26/04/2026", time: "07:30 - 09:30", status: "absent" },
      { date: "19/04/2026", time: "07:30 - 09:30", status: "attended" }
    ]
  },
  "IT002": {
    name: "Mật mã học cơ sở (RSA)",
    total: 3,
    attended: 3,
    absent: 0,
    records: [
      { date: "08/05/2026", time: "13:00 - 15:00", status: "attended" },
      { date: "01/05/2026", time: "13:00 - 15:00", status: "attended" },
      { date: "24/04/2026", time: "13:00 - 15:00", status: "attended" }
    ]
  }
};

const SubjectDetails = () => {
  const [selectedSubject, setSelectedSubject] = useState("IT004");
  const data = mockDetails[selectedSubject];

  return (
    <div className="details-container">
      <div className="details-header">
        <h2 style={{color: '#2d3748', margin: 0}}>Chi tiết từng buổi học</h2>
        <select 
          className="subject-select" 
          value={selectedSubject} 
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="IT004">Lập trình Web (React/PHP)</option>
          <option value="IT002">Mật mã học cơ sở (RSA)</option>
        </select>
      </div>

      <div className="mini-summary">
        <span>Có mặt: <strong>{data.attended}</strong></span>
        <span>Vắng mặt: <strong>{data.absent}</strong></span>
        <span>📊 Tổng số buổi đã diễn ra: <strong>{data.total}</strong></span>
      </div>

      <div className="date-list">
        {data.records.map((record, index) => (
          <div className={`date-card ${record.status}`} key={index}>
            <div className="date-info">
              <h4>Ngày: {record.date}</h4>
              <p>Thời gian: {record.time}</p>
            </div>
            <div className={`attendance-status ${record.status === 'attended' ? 'status-yes' : 'status-no'}`}>
              {record.status === 'attended' ? 'Có mặt' : 'Vắng'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectDetails;