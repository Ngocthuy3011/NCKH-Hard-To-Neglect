import React, { useState, useEffect } from "react";
import "./Attendance.css";
import { AiOutlineLaptop, AiOutlineCamera } from "react-icons/ai";
import { getCurrentUser } from "../../utils/jwt";

function Attendance() {
  const [selectedDevice, setSelectedDevice] = useState("laptop");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const teacherId = user ? user.mssv : null;

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
        } else {
          console.error("Lỗi tải lớp:", response.status);
        }
      } catch (error) {
        console.error("Không thể kết nối Backend:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

  const handleStartAttendance = () => {
    if (!selectedClass || !selectedSession) {
      alert("Vui lòng chọn lớp và buổi học");
      return;
    }
    // Logic để bắt đầu điểm danh, có thể gọi API hoặc chuyển trang
    alert(`Bắt đầu điểm danh cho lớp ${selectedClass}, buổi ${selectedSession}`);
  };

  return (
    <div className="attendance-wrapper">
      {/* Tiêu đề trang điểm danh */}
      <div className="attendance-header-line">
        <h2 className="attendance-page-title">Điểm danh</h2>
      </div>

      <div className="attendance-card">
        <h3>Bắt đầu phiên điểm danh</h3>
        
        <div className="selection-group">
          <div className="input-item">
            <label>Danh sách lớp</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Chọn lớp học</option>
              {classes.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>
                  {`${cls.subject_id} - ${cls.subject_name} - Nhóm ${cls.group_id}${cls.sub_id ? ` - Tổ ${cls.sub_id}` : ""} - HK ${cls.semester}`}
                  </option>
              ))}
            </select>
          </div>

          <div className="input-item">
            <label>Buổi học</label>
            <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
              <option value="">Chọn buổi học</option>
              <option value="1">Buổi 1</option>
              <option value="2">Buổi 2</option>
              <option value="3">Buổi 3</option>
            </select>
          </div>
        </div>

        <div className="device-selection">
          <label className="device-label">Thiết bị đầu vào</label>
          <div className="device-options">
            <div 
              className={`device-box ${selectedDevice === "laptop" ? "active" : ""}`}
              onClick={() => setSelectedDevice("laptop")}
            >
              <AiOutlineLaptop className="device-icon" />
              <span>Laptop Camera</span>
            </div>

            <div 
              className={`device-box ${selectedDevice === "phone" ? "active" : ""}`}
              onClick={() => setSelectedDevice("phone")}
            >
              <AiOutlineCamera className="device-icon" />
              <span>Phone Camera</span>
            </div>
          </div>
        </div>
        
        <div className="button-container">
          <button className="start-btn-large" onClick={handleStartAttendance}>
            Bắt đầu Camera & Điểm danh
          </button>
        </div>
      </div>
    </div>
  );
}

export default Attendance;