import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import "./Attendance.css";
import { AiOutlineLaptop, AiOutlineCamera, AiOutlineStop } from "react-icons/ai";
import { getCurrentUser } from "../../utils/jwt";

function Attendance() {
  const [selectedDevice, setSelectedDevice] = useState("laptop");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // THÊM STATE QUẢN LÝ CHẾ ĐỘ ĐIỂM DANH (CÁ NHÂN HAY TẬP THỂ)
  const [isGroupMode, setIsGroupMode] = useState(false); 
  
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [successAlert, setSuccessAlert] = useState(""); 
  
  const webcamRef = useRef(null);
  const user = getCurrentUser();

  const currentId = user ? (user.username || user.mssv) : null;

  useEffect(() => {
    if (!currentId) {
      setLoading(false);
      return;
    }
    const fetchClasses = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/classes`);
        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && Array.isArray(result.data)) {
            setClasses(result.data);
          } else if (Array.isArray(result)) {
            setClasses(result); 
          } else {
            setClasses([]);
          }
        } else {
          console.error("Lỗi tải lớp:", response.status);
          setClasses([]);
        }
      } catch (error) {
        console.error("Không thể kết nối Backend:", error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [currentId]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/api/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "ATTENDANCE_SUCCESS") {
        const studentName = data.student_name || "Sinh viên"; // Fallback nếu điểm danh tập thể ko trả về tên
        setRecognizedStudent({
          name: studentName,
          mssv: data.student_id
        });
        
        setSuccessAlert(`🎉 Điểm danh thành công: ${studentName} (${data.student_id})`);
        setTimeout(() => setSuccessAlert(""), 3000);
        
        setTimeout(() => setRecognizedStudent(null), 4000);
      }
    };

    return () => {
      if (ws.readyState === 1) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isCameraActive && selectedClass && selectedSession) {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            try {
              // TỰ ĐỘNG CHUYỂN ĐỔI API DỰA VÀO CHẾ ĐỘ ĐANG CHỌN
              const endpoint = isGroupMode ? "check-attendance-group" : "check-attendance-ai";
              
              await fetch(`http://localhost:8000/api/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image_base64: imageSrc,
                  class_id: parseInt(selectedClass),
                  session_no: parseInt(selectedSession)
                })
              });
            } catch (error) {
              console.error("Lỗi gửi ảnh điểm danh:", error);
            }
          }
        }
      }, 2500); // Tăng lên 2.5s để AI có thời gian quét đám đông
    }
    return () => clearInterval(interval);
  }, [isCameraActive, selectedClass, selectedSession, isGroupMode]);

  const handleStartAttendance = () => {
    if (!selectedClass || !selectedSession) {
      alert("Vui lòng chọn lớp và buổi học");
      return;
    }
    setIsCameraActive(true);
  };

  const handleStopAttendance = () => {
    setIsCameraActive(false);
    setRecognizedStudent(null);
    setSuccessAlert("");
  };

  const simulateAI = () => {
    setRecognizedStudent({
      name: "Huỳnh Nguyễn Ngọc Thùy",
      mssv: "52400319"
    });
    setSuccessAlert(`🎉 Điểm danh thành công: Huỳnh Nguyễn Ngọc Thùy (52400319)`);
    setTimeout(() => setSuccessAlert(""), 3000);
    setTimeout(() => setRecognizedStudent(null), 3000);
  };

  return (
    <div className="attendance-wrapper">
      <div className="attendance-header-line">
        <h2 className="attendance-page-title">Điểm danh trực tiếp</h2>
      </div>

      <div className="attendance-card">
        {!isCameraActive ? (
          <div className="setting-panel">
            <h3>Bắt đầu phiên điểm danh</h3>
            
            <div className="selection-group">
              <div className="input-item">
                <label>Danh sách lớp</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="">Chọn lớp học</option>
                  {Array.isArray(classes) && classes.map((cls, index) => (
                    <option key={cls.class_id || index} value={cls.class_id}>
                      {`${cls.subject_id} - ${cls.subject_name || 'Lập trình Web'} - Nhóm ${cls.group_id}${cls.sub_id ? ` - Tổ ${cls.sub_id}` : ""} - HK ${cls.semester}`}
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

            {/* KHỐI CHỌN CHẾ ĐỘ ĐIỂM DANH */}
            <div className="input-item" style={{ marginTop: "15px", padding: "10px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>Chế độ AI điểm danh</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={!isGroupMode} 
                    onChange={() => setIsGroupMode(false)} 
                  /> 👤 Từng cá nhân (Nhanh)
                </label>
                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={isGroupMode} 
                    onChange={() => setIsGroupMode(true)} 
                  /> 👥 Tập thể lớp (Quét đám đông)
                </label>
              </div>
            </div>

            <div className="device-selection" style={{ marginTop: "15px" }}>
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
        ) : (
          <div className="camera-panel">
            
            {successAlert && (
                <div style={{
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    padding: '12px 20px', 
                    borderRadius: '8px', 
                    marginBottom: '15px', 
                    fontWeight: 'bold', 
                    textAlign: 'center',
                    border: '1px solid #c3e6cb',
                    fontSize: '16px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {successAlert}
                </div>
            )}

            <div className="camera-header">
              <h3>
                Đang điểm danh (Buổi {selectedSession}) - 
                <span style={{ color: isGroupMode ? "#e74c3c" : "#3498db", marginLeft: "5px" }}>
                  Chế độ: {isGroupMode ? "Tập thể" : "Cá nhân"}
                </span>
              </h3>
              <button className="btn-stop-camera" onClick={handleStopAttendance}>
                <AiOutlineStop /> Kết thúc
              </button>
            </div>
            
            <div className="live-camera-container">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: selectedDevice === "laptop" ? "user" : "environment" }}
                className="live-video"
              />
              
              {recognizedStudent && !isGroupMode && (
                <div className="ai-overlay success">
                  <div className="overlay-avatar">
                    {recognizedStudent.name.charAt(0)}
                  </div>
                  <div className="overlay-info">
                    <span className="overlay-name">{recognizedStudent.name}</span>
                    <span className="overlay-mssv">{recognizedStudent.mssv}</span>
                  </div>
                  <div className="overlay-status">
                    Đã điểm danh
                  </div>
                </div>
              )}
            </div>

            <button onClick={simulateAI} style={{marginTop: "10px", padding: "8px", background: "#f0f0f0", border: "1px solid #ccc", cursor: "pointer"}}>
              [Test] Giả lập có người đi qua
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Attendance;