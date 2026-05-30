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
  
  // Trạng thái Camera tại lớp
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false); 
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [successAlert, setSuccessAlert] = useState(""); 
  
  // Trạng thái Điểm danh Online (Cho SV tự điểm danh ở nhà)
  const [pinCode, setPinCode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

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
        const studentName = data.student_name || "Sinh viên"; 
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
      if (ws.readyState === 1) ws.close();
    };
  }, []);

  // Vòng lặp bắn API khi mở Camera trực tiếp tại lớp
  useEffect(() => {
    let interval;
    if (isCameraActive && selectedClass && selectedSession) {
      interval = setInterval(async () => {
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            try {
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
      }, 2500); 
    }
    return () => clearInterval(interval);
  }, [isCameraActive, selectedClass, selectedSession, isGroupMode]);

  // Cleanup Timer khi đổi trang
  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, []);

  const handleStartLocalCamera = () => {
    if (!selectedClass || !selectedSession) {
      alert("Vui lòng chọn lớp và buổi học");
      return;
    }
    setIsCameraActive(true);
  };

  const handleStopLocalCamera = () => {
    setIsCameraActive(false);
    setRecognizedStudent(null);
    setSuccessAlert("");
  };

  // HÀM MỞ PHIÊN ĐIỂM DANH ONLINE (MÃ PIN)
  const handleOpenOnlineAttendance = async () => {
    if (!selectedClass) {
        return alert("Vui lòng chọn lớp học trước khi mở phiên điểm danh Online!");
    }
    
    try {
        const response = await fetch("http://localhost:8000/api/open-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ class_id: parseInt(selectedClass), duration_minutes: 5 })
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            setPinCode(data.pin_code);
            setTimeLeft(300); // 5 phút
            
            // Xóa timer cũ nếu có
            if (timerRef.current) clearInterval(timerRef.current);
            
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setPinCode(null); // Hết giờ tự ẩn mã PIN
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    } catch (error) {
        console.error("Lỗi mở phiên:", error);
        alert("Không thể kết nối đến máy chủ!");
    }
  };

  const handleCloseOnlineAttendance = async () => {
    try {
        await fetch("http://localhost:8000/api/close-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ class_id: parseInt(selectedClass) })
        });
        setPinCode(null);
        if (timerRef.current) clearInterval(timerRef.current);
    } catch (error) {
        console.error("Lỗi đóng phiên:", error);
    }
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
        <h2 className="attendance-page-title">Quản lý phiên điểm danh</h2>
      </div>

      <div className="attendance-card">
        {!isCameraActive ? (
          <div className="setting-panel">
            <h3>Cấu hình lớp học</h3>
            
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

            {/* PHẦN 1: ĐIỂM DANH TẠI LỚP (CAMERA TRỰC TIẾP) */}
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>1. Điểm danh trực tiếp tại lớp (Giảng viên bật Camera)</h4>
                
                <div className="input-item" style={{ padding: "10px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
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
                
                <div className="button-container" style={{ marginTop: '15px' }}>
                  <button className="start-btn-large" onClick={handleStartLocalCamera}>
                    Bắt đầu Camera & Điểm danh
                  </button>
                </div>
            </div>

            {/* PHẦN 2: ĐIỂM DANH ONLINE (CHO SINH VIÊN) */}
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#f0f8ff' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0984e3' }}>2. Điểm danh Online (Sinh viên tự điểm danh qua web)</h4>
                
                {!pinCode ? (
                    <button 
                        style={{ padding: '12px 20px', background: '#0984e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={handleOpenOnlineAttendance}
                    >
                        Mở phiên điểm danh từ xa (5 Phút)
                    </button>
                ) : (
                    <div style={{ textAlign: 'center', background: '#fff', padding: '20px', borderRadius: '8px', border: '2px solid #0984e3' }}>
                        <h2 style={{ color: '#d63031', fontSize: '32px', margin: '0' }}>MÃ PIN: {pinCode}</h2>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
                            ⏳ Thời gian còn lại: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                        </p>
                        <button 
                            style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={handleCloseOnlineAttendance}
                        >
                            Đóng phiên ngay
                        </button>
                    </div>
                )}
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
              <button className="btn-stop-camera" onClick={handleStopLocalCamera}>
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