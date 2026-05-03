import React, { useState } from "react";
import "./Attendance.css";
import { AiOutlineLaptop, AiOutlineCamera } from "react-icons/ai";
function Attendance() {
  const [selectedDevice, setSelectedDevice] = useState("laptop");

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
            <select>
              <option>Chọn lớp học</option>
              <option>Cấu trúc dữ liệu và giải thuật</option>
              <option>Công nghệ phần mềm</option>
            </select>
          </div>

          <div className="input-item">
            <label>Buổi học</label>
            <select>
              <option>Chọn buổi học</option>
              <option>Buổi 1</option>
              <option>Buổi 2</option>
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
          <button className="start-btn-large">
            Bắt đầu Camera & Điểm danh
          </button>
        </div>
        {/* <button className="start-btn">Bắt đầu</button> */}
      </div>
    </div>
  );
}

export default Attendance;