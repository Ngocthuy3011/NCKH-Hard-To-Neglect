import React, { useState, useEffect, useRef } from 'react';
import './StudentDashboard.css';
import AttendanceHistory from './AttendanceHistory';
import SubjectDetails from './SubjectDetails';
import Webcam from 'react-webcam'; 


const FaceDetection = window.FaceDetection;
const Camera = window.Camera;

const StudentDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCamera, setShowCamera] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    total_enrolled: 0,
    present_count: 0,
    absent_count: 0,
    late_count: 0,
    attendance_rate: '0%',
    total_attendance: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // References cho Webcam, Canvas (để vẽ khung vuông) và MediaPipe Camera
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaPipeCameraRef = useRef(null);

  const fetchTodaySchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/schedule/today', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTodaySchedule(data);
      } else {
        console.error("Lỗi khi tải lịch học");
      }
    } catch (error) {
      console.error("Không thể kết nối Backend:", error);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceSummary(data);
      } else {
        console.error("Lỗi khi tải tổng quan điểm danh");
      }
    } catch (error) {
      console.error("Không thể kết nối Backend:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchTodaySchedule(), fetchAttendanceSummary()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleOpenAttendance = (subject) => {
    setSelectedSubject(subject);
    setShowCamera(true);
  };

  // ── LOGIC CHẠY MEDIAPIPE NGAY KHI MỞ CAMERA ────────────────
  useEffect(() => {
    if (!showCamera) return; // Chỉ chạy khi Popup Camera mở

    // Khởi tạo model phát hiện khuôn mặt của Google
    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });

    faceDetection.setOptions({
      model: 'short', // 'short' dành cho mặt gần camera (nhanh và nhẹ)
      minDetectionConfidence: 0.5
    });

    // Hàm xử lý mỗi khi MediaPipe tìm thấy khuôn mặt
    faceDetection.onResults((results) => {
      if (!canvasRef.current || !webcamRef.current?.video) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Ép kích thước canvas khớp với video thực tế
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.detections.length > 0) {
        results.detections.forEach((detection) => {
          const boundingBox = detection.boundingBox;
          // MediaPipe trả về tỷ lệ (0 -> 1), cần nhân lên kích thước thật
          const x = boundingBox.xCenter * canvas.width - (boundingBox.width * canvas.width) / 2;
          const y = boundingBox.yCenter * canvas.height - (boundingBox.height * canvas.height) / 2;
          const width = boundingBox.width * canvas.width;
          const height = boundingBox.height * canvas.height;

          // Vẽ khung vuông màu xanh lá cây
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#00FF00';
          ctx.stroke();
        });
      }
      ctx.restore();
    });

    // Móc MediaPipe vào luồng hình ảnh của react-webcam
    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await faceDetection.send({ image: webcamRef.current.video });
          }
        },
        width: 400,
        height: 300
      });

      camera.start();
      mediaPipeCameraRef.current = camera;
    }

    // Dọn dẹp bộ nhớ khi đóng Camera
    return () => {
      if (mediaPipeCameraRef.current) {
        mediaPipeCameraRef.current.stop();
      }
      faceDetection.close();
    };
  }, [showCamera]);

  const handleCaptureFace = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) {
      alert("⚠️ Không thể chụp ảnh từ Camera! Vui lòng kiểm tra quyền truy cập.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/check-attendance-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          image_base64: imageSrc,
          class_id: selectedSubject?.id, 
          session_no: 1 
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        alert("Hoàn thành " + data.message);
        setShowCamera(false); 
        fetchTodaySchedule(); 
      } else {
        alert("Không thành công! Vui lòng thử lại " + data.message);
      }
      
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối đến Server AI!");
    }
  };

  const videoConstraints = {
    width: 400,
    height: 300,
    facingMode: "user" 
  };

  return (
    <div className="student-dashboard">

      {/* ── GREETING ─────────────────────────────────────── */}
      <div className="welcome-section">
        <h1>Chào bạn, {user?.fullname || "Sinh viên"} 🎓</h1>
        <p>Hôm nay bạn có {todaySchedule.length} tiết học.</p>
      </div>

      {/* ── TAB NAVIGATION ───────────────────────────────── */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Lịch sử điểm danh
        </button>
        <button
          className={`tab-btn ${activeTab === 'details' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Chi tiết ngày học
        </button>
      </div>

      {/* ── TAB: TỔNG QUAN ───────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Tỷ lệ chuyên cần</span>
              <h3>{attendanceSummary.attendance_rate}</h3>
            </div>
            <div className="stat-card">
              <span>Số buổi đã học</span>
              <h3>{attendanceSummary.present_count}</h3>
            </div>
            <div className="stat-card">
              <span>Số buổi vắng</span>
              <h3>{attendanceSummary.absent_count}</h3>
            </div>
          </div>

          <div className="content-grid">
            <div className="main-content">
              <h2>Lịch học hôm nay</h2>

              {isLoading ? (
                <p className="status-text status-text--loading">⏳ Đang tải dữ liệu từ máy chủ...</p>
              ) : todaySchedule.length === 0 ? (
                <p className="status-text status-text--empty">🎉 Hôm nay bạn không có lịch học nào. Trống lịch!</p>
              ) : (
                <div className="schedule-list">
                  {todaySchedule.map((subject, index) => (
                    <div key={index} className="schedule-item">
                      <div>
                        <h3 className="schedule-item__name">{subject?.name}</h3>
                        <p className="schedule-item__meta">
                          🧾 Mã môn: {subject?.subject_id || 'N/A'} | Nhóm: {subject?.group || 'N/A'} | Học kỳ: {subject?.semester || 'N/A'}
                        </p>
                        <p className="schedule-item__meta">🕒 {subject?.time} | 📍 {subject?.room}</p>
                      </div>

                      {/* {subject?.status === 'pending' ? (
                        <button className="attend-btn" onClick={() => handleOpenAttendance(subject)}>
                          📷 Điểm danh
                        </button>
                      ) : (
                        <button className="attend-btn attend-btn--done" disabled>
                          Đã điểm danh
                        </button>
                      )} */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="side-content">
              <h2>Thông tin cá nhân</h2>
              <p><strong>Họ và tên:</strong> {user?.fullname}</p>
              <p><strong>MSSV:</strong> {user?.mssv}</p>
              <p><strong>Lớp:</strong> {user?.className || "Chưa cập nhật"}</p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && <AttendanceHistory />}
      {activeTab === 'details' && <SubjectDetails />}

      {/* ── MODAL CAMERA ─────────────────────────────────── */}
      {showCamera && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <h2>Điểm danh khuôn mặt</h2>
            <p>Môn: <strong>{selectedSubject?.name}</strong></p>

            {/* KHUNG CAMERA CHỨA MEDIA PIPE CANVAS */}
            <div 
              className="camera-frame" 
              style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden', borderRadius: '12px' }}
            >
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
              />
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