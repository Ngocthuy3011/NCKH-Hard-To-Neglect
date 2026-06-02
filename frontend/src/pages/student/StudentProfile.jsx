import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import './StudentProfile.css';

const StudentProfile = ({ user }) => {
  const webcamRef = useRef(null);
  const [images, setImages] = useState({ straight: null, left: null, right: null });
  const [step, setStep] = useState('straight');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // State quản lý email
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  
  // State quản lý thời hạn 3 tháng
  const [faceStatus, setFaceStatus] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(false);

  const isValidEmail = (value) => {
    const trimmed = value.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  // ===================================
  // 1. API CẬP NHẬT EMAIL
  // ===================================
  const handleUpdateEmail = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập email trước khi lưu!");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Email không hợp lệ. Vui lòng kiểm tra lại định dạng.");
      return;
    }

    try {
      // Đã thêm student_id vào link API để Backend biết ai đang cập nhật
      const response = await fetch(`http://localhost:8000/api/update-profile?student_id=${user.mssv}&email=${encodeURIComponent(trimmedEmail)}`, {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        alert("Cập nhật email thành công!");
        setEmailError("");
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (err) { 
      alert("Lỗi kết nối đến Server Backend!"); 
    }
  };

  // ===================================
  // 2. CHECK TRẠNG THÁI KHUÔN MẶT
  // ===================================
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.mssv) return;
      try {
        const response = await fetch(`http://localhost:8000/api/check-face-status/${user.mssv}`);
        const data = await response.json();
        if (data.status === 'success') {
          setFaceStatus(data);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái khuôn mặt:", error);
      }
    };
    checkStatus();
  }, [user]);

  // ===================================
  // 3. XỬ LÝ CAMERA
  // ===================================
  const capture = (angle) => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setImages((prev) => ({ ...prev, [angle]: imageSrc }));
      if (angle === 'straight') setStep('left');
      else if (angle === 'left') setStep('right');
      else if (angle === 'right') setStep('done');
    }
  };

  const handleRegisterFace = async () => {
    setIsRegistering(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        student_id: user?.mssv,
        images: {
          straight: [images.straight],
          left: [images.left],
          right: [images.right]
        }
      };

      const response = await fetch('http://localhost:8000/api/register-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert("Nạp dữ liệu khuôn mặt thành công!");
        window.location.reload(); // Tải lại trang để cập nhật số ngày
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (error) {
      alert("Lỗi kết nối đến Server!");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="profile-page">
      <h2 className="page-title">Hồ sơ Sinh viên</h2>
      
      <div className="profile-card">
        <h3>Thông tin cá nhân</h3>
        <p><strong>Họ và tên:</strong> {user?.fullname}</p>
        <p><strong>MSSV:</strong> {user?.mssv}</p>
        <p><strong>Lớp:</strong> {user?.className || "Chưa cập nhật"}</p>

        {/* THÊM KHỐI NHẬP EMAIL CÁ NHÂN VÀO ĐÂY */}
        <div className="email-update-section" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc' }}>
          <p style={{ marginBottom: '8px', color: '#4a5568' }}><strong>Email cá nhân (Nhận cảnh báo điểm danh):</strong></p>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="Ví dụ: abc@gmail.com"
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', flex: 1 }}
              />
              <button 
                onClick={handleUpdateEmail}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#4e73df', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Lưu Cập Nhật
              </button>
            </div>
            {emailError && (
              <p style={{ margin: '8px 0 0', color: '#d32f2f', fontSize: '0.95rem' }}>
                {emailError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="face-registration-section">
        <h3>Dữ liệu Khuôn mặt (AI)</h3>

        {/* NẾU ĐÃ ĐĂNG KÝ VÀ CÒN HẠN */}
        {faceStatus?.is_registered && !faceStatus?.is_expired && !forceUpdate ? (
          <div className="face-valid-status">
            
            {/* KHỐI SVG ANIMATION GIỮ NGUYÊN */}
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>

            <h4>Dữ liệu khuôn mặt của bạn đang hoạt động tốt!</h4>
            <p>Ngày cập nhật gần nhất: <strong>{faceStatus.created_at}</strong></p>
            <p>Hết hạn sau: <strong style={{color: '#00a8ff', fontSize: '20px'}}>{faceStatus.days_left} ngày</strong> (3 tháng)</p>
            <p className="instruction">Bạn không cần phải đăng ký lại, có thể đi điểm danh ngay.</p>
            <button className="btn-retry" onClick={() => setForceUpdate(true)}>
              Cập nhật lại ảnh mới? Bấm vào đây
            </button>
          </div>
        ) : (
          /* NẾU CHƯA ĐĂNG KÝ, HẾT HẠN HOẶC ÉP CẬP NHẬT */
          <>
            {faceStatus?.is_expired && (
              <div className="expired-warning">
                Lưu ý: Dữ liệu khuôn mặt của bạn đã quá 3 tháng. Vui lòng cập nhật lại để AI nhận diện chính xác nhất!
              </div>
            )}
            <p className="instruction">
              Vui lòng chụp 3 góc khuôn mặt để hệ thống AI làm dữ liệu gốc.
            </p>

            {step !== 'done' ? (
              <div className="registration-camera">
                <h4 className="step-indicator">
                  Bước hiện tại: 
                  {step === 'straight' && <span className="highlight">Nhìn thẳng</span>}
                  {step === 'left' && <span className="highlight">Quay sang trái</span>}
                  {step === 'right' && <span className="highlight">Quay sang phải</span>}
                </h4>

                <div className="webcam-container">
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ width: 400, height: 300, facingMode: "user" }} className="webcam-view" />
                </div>

                <button className="btn-capture" onClick={() => capture(step)}>
                  Chụp ảnh góc {step === 'straight' ? 'Thẳng' : step === 'left' ? 'Trái' : 'Phải'}
                </button>
              </div>
            ) : (
              <div className="registration-preview">
                <h4>Đã chụp đủ 3 góc mặt!</h4>
                <div className="preview-grid">
                  <img src={images.straight} alt="Thẳng" />
                  <img src={images.left} alt="Trái" />
                  <img src={images.right} alt="Phải" />
                </div>
                
                <button className="btn-submit-face" onClick={handleRegisterFace} disabled={isRegistering}>
                  {isRegistering ? "Đang tải lên..." : "Hoàn tất & Nạp dữ liệu"}
                </button>
                <button className="btn-retry" onClick={() => setStep('straight')}>Chụp lại</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;