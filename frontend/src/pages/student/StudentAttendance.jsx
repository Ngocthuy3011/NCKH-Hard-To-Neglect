import React, { useState, useEffect, useRef } from 'react';
import './StudentAttendance.css';
import Webcam from 'react-webcam'; 

// Lấy MediaPipe từ index.html
const FaceDetection = window.FaceDetection;
const Camera = window.Camera;

const StudentAttendance = () => {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State cho Camera Modal
  const [showCamera, setShowCamera] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaPipeCameraRef = useRef(null);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/schedule/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleOpenAttendance = (subject) => {
    setSelectedSubject(subject);
    setShowCamera(true);
  };

  // --- LOGIC VẼ KHUNG XANH MEDIAPIPE ---
  useEffect(() => {
    if (!showCamera) return;

    const faceDetection = new FaceDetection({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });

    faceDetection.setOptions({ model: 'short', minDetectionConfidence: 0.5 });

    faceDetection.onResults((results) => {
      if (!canvasRef.current || !webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.detections.length > 0) {
        results.detections.forEach((detection) => {
          const box = detection.boundingBox;
          const x = box.xCenter * canvas.width - (box.width * canvas.width) / 2;
          const y = box.yCenter * canvas.height - (box.height * canvas.height) / 2;
          ctx.beginPath();
          ctx.rect(x, y, box.width * canvas.width, box.height * canvas.height);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#00a8ff'; // Màu xanh khớp với thiết kế UI
          ctx.stroke();
        });
      }
      ctx.restore();
    });

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video) {
            await faceDetection.send({ image: webcamRef.current.video });
          }
        },
        width: 400, height: 300
      });
      camera.start();
      mediaPipeCameraRef.current = camera;
    }

    return () => {
      if (mediaPipeCameraRef.current) mediaPipeCameraRef.current.stop();
      faceDetection.close();
    };
  }, [showCamera]);

  const handleCaptureFace = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return alert("⚠️ Không thể chụp ảnh!");

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
        alert("✅ " + data.message);
        setShowCamera(false); 
        fetchSchedule(); // Load lại để update trạng thái
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      alert(" Lỗi kết nối đến Server AI!");
    }
  };

  return (
    <div className="attendance-page">
      <h2 className="page-title">Danh sách môn học cần điểm danh</h2>
      
      {isLoading ? (
        <p> Đang tải dữ liệu...</p>
      ) : schedule.length === 0 ? (
        <p> Hôm nay trống lịch!</p>
      ) : (
        <div className="subject-cards-container">
          {schedule.map((subject, index) => (
            <div key={index} className="subject-card">
              <div className="subject-info">
                <h3>{subject?.name}</h3>
                <p>🕒 {subject?.time} | 📍 {subject?.room}</p>
              </div>

              {subject?.status === 'pending' ? (
                <button className="btn-take-attendance" onClick={() => handleOpenAttendance(subject)}>
                 Điểm danh
                </button>
              ) : (
                <button className="btn-take-attendance done" disabled>
                  Đã điểm danh
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL CAMERA */}
      {showCamera && (
        <div className="camera-modal-overlay">
          <div className="camera-modal">
            <h2>Điểm danh khuôn mặt</h2>
            <p>Môn: <strong>{selectedSubject?.name}</strong></p>

            <div className="camera-frame" style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden', borderRadius: '12px' }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 400, height: 300, facingMode: "user" }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }} />
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

export default StudentAttendance;