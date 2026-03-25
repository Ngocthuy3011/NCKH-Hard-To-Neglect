// Kết nối với các thẻ HTML
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusText = document.getElementById('status');
const studentInput = document.getElementById('student_id_input');
const startBtn = document.getElementById('start_btn');

// --- CÁC BIẾN CHO KỊCH BẢN ĐẠO DIỄN ---
let isSystemRunning = false;
let currentStage = 'straight'; // Các vòng thu thập: 'straight' -> 'left' -> 'right' -> 'done'
let holdStartTime = 0;
let isHolding = false;
let lastCaptureTime = 0; 
const HOLD_DURATION = 1500; // Thời gian yêu cầu giữ yên mặt (1500ms = 1.5 giây)

// Kho chứa 9 bức ảnh chuẩn bị gửi đi
let capturedImages = {
    straight: [],
    left: [],
    right: []
};

// Khởi tạo thư viện MediaPipe Face Mesh
const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({ 
    maxNumFaces: 1, // Chỉ lấy 1 mặt để tránh nhiễu
    refineLandmarks: true, 
    minDetectionConfidence: 0.7, 
    minTrackingConfidence: 0.7 
});

// Xử lý sự kiện khi bấm nút Bắt Đầu
startBtn.addEventListener('click', () => {
    if (studentInput.value.trim() === "") {
        alert("Bạn chưa nhập Mã số sinh viên!");
        return;
    }
    isSystemRunning = true;
    studentInput.disabled = true;
    startBtn.disabled = true;
    statusText.innerText = "Đang phân tích tư thế... Vui lòng NHÌN THẲNG!";
    statusText.style.color = "cyan";
});

// Hàm chạy liên tục mỗi khi Camera có khung hình mới
faceMesh.onResults((results) => {
    // 1. Xóa khung hình cũ và vẽ hình camera mới lên
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Nếu chưa bấm bắt đầu hoặc đã hoàn thành thì thoát luôn, không cần tính toán
    if (!isSystemRunning || currentStage === 'done') return;

    // NẾU TÌM THẤY KHUÔN MẶT
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // 2. Thuật toán tìm Bounding Box (Khung chữ nhật bao quanh mặt)
        let xMin = 1, yMin = 1, xMax = 0, yMax = 0;
        for (let pt of landmarks) {
            if (pt.x < xMin) xMin = pt.x;
            if (pt.x > xMax) xMax = pt.x;
            if (pt.y < yMin) yMin = pt.y;
            if (pt.y > yMax) yMax = pt.y;
        }
        const w = canvasElement.width;
        const h = canvasElement.height;
        const rectX = xMin * w;
        const rectY = yMin * h;
        const rectWidth = (xMax - xMin) * w;
        const rectHeight = (yMax - yMin) * h;

        // 3. Tính góc nghiêng đầu (ROLL) dựa vào 2 đuôi mắt
        const deltaY = landmarks[263].y - landmarks[33].y;
        const deltaX = landmarks[263].x - landmarks[33].x;
        const rollAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        // 4. Tính góc quay mặt (YAW) dựa vào chóp mũi và 2 bên má
        const noseTipX = landmarks[1].x;
        const leftCheekX = landmarks[234].x;
        const rightCheekX = landmarks[454].x;
        const distLeft = Math.abs(noseTipX - leftCheekX);
        const distRight = Math.abs(rightCheekX - noseTipX);
        const yawRatio = distLeft / distRight;

        // --- ĐÁNH GIÁ ĐIỀU KIỆN ---
        let isDistanceOK = rectWidth >= 150 && rectWidth <= 350;
        let isRollOK = Math.abs(rollAngle) < 10; // Cấm nghiêng đầu quá 10 độ
        let isPoseTargetOK = false;
        let instructionMsg = "";

        // Kiểm tra góc quay mặt tùy theo màn kịch bản hiện tại
        if (currentStage === 'straight') {
            instructionMsg = "Vui lòng nhìn thẳng";
            isPoseTargetOK = (yawRatio > 0.7 && yawRatio < 1.3);
        } else if (currentStage === 'left') {
            instructionMsg = "Vui lòng quay mặt sang trái";
            // SỬA Ở ĐÂY: Đổi (yawRatio < 0.6) thành (yawRatio > 1.4)
            isPoseTargetOK = (yawRatio > 1.4); 
        } else if (currentStage === 'right') {
            instructionMsg = "Vui lòng quay mặt sang phải";
            // SỬA Ở ĐÂY: Đổi (yawRatio > 1.4) thành (yawRatio < 0.6)
            isPoseTargetOK = (yawRatio < 0.6); 
        }

        // Vẽ cái hộp bao quanh khuôn mặt để người dùng dễ căn chỉnh
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 3;
        canvasCtx.rect(rectX, rectY, rectWidth, rectHeight);

        // --- KIỂM TRA TỔNG HỢP (Luật giám thị) ---
        if (!isDistanceOK) {
            statusText.innerText = rectWidth < 150 ? "Khuôn mặt quá xa, tiến lại gần!" : "Khuôn mặt quá gần, lùi lại!";
            statusText.style.color = "orange";
            canvasCtx.strokeStyle = "orange";
            isHolding = false; // Phá vỡ chuỗi đếm ngược
        } else if (!isRollOK) {
            statusText.innerText = "Vui lòng không nghiêng đầu!";
            statusText.style.color = "orange";
            canvasCtx.strokeStyle = "orange";
            isHolding = false;
        } else if (!isPoseTargetOK) {
            statusText.innerText = instructionMsg;
            statusText.style.color = "yellow";
            canvasCtx.strokeStyle = "yellow";
            isHolding = false;
        } else {
            // NẾU ĐẠT CHUẨN 100% -> BẮT ĐẦU ĐẾM NGƯỢC
            canvasCtx.strokeStyle = "lime";
            if (!isHolding) {
                isHolding = true;
                holdStartTime = Date.now();
            } else {
                const elapsed = Date.now() - holdStartTime;
                
                if (elapsed >= HOLD_DURATION) {
                    // Đã giữ yên đủ 1.5 giây -> Nháy máy chụp 3 tấm cách nhau 300ms
                    if (Date.now() - lastCaptureTime > 300) {
                        
                        // Chụp lấy toàn bộ khung hình ảnh thực (không lấy nét vẽ)
                        const snapCanvas = document.createElement('canvas');
                        snapCanvas.width = results.image.width;
                        snapCanvas.height = results.image.height;
                        snapCanvas.getContext('2d').drawImage(results.image, 0, 0);
                        const base64Image = snapCanvas.toDataURL('image/jpeg', 0.9);
                        
                        // Cất ảnh vào kho
                        capturedImages[currentStage].push(base64Image);
                        lastCaptureTime = Date.now();
                        
                        let count = capturedImages[currentStage].length;
                        statusText.innerText = `Đang chụp ...`;
                        statusText.style.color = "lime";

                        // Nếu đã chụp đủ 3 tấm cho vòng này -> Tự động chuyển qua vòng tiếp theo
                        if (count === 3) {
                            if (currentStage === 'straight') currentStage = 'left';
                            else if (currentStage === 'left') currentStage = 'right';
                            else if (currentStage === 'right') {
                                currentStage = 'done'; // KẾT THÚC THU THẬP
                                sendDataToFastAPI(); // Đẩy dữ liệu về Backend
                            }
                            isHolding = false; // Reset lại để đếm cho góc mới
                        }
                    }
                } else {
                    // Đang trong quá trình đếm ngược chờ chụp
                    statusText.innerText = `Giữ yên tư thế... ${Math.ceil((HOLD_DURATION - elapsed) / 1000)}s`;
                    statusText.style.color = "lime";
                }
            }
        }
        canvasCtx.stroke(); // Thực thi nét vẽ viền lên màn hình
    } else {
        // Lỡ đi khỏi khung hình
        statusText.innerText = "Không tìm thấy khuôn mặt";
        statusText.style.color = "red";
        isHolding = false;
    }
});

// --- HÀM GÓI GÓI HÀNG GỬI CHO FASTAPI ---
function sendDataToFastAPI() {
    statusText.innerText = "Đã xong!";
    statusText.style.color = "cyan";

    const mssv = studentInput.value.trim();
    
    // Gói dữ liệu JSON đúng chuẩn Pydantic bên Backend
    const payload = {
        student_id: mssv,
        images: capturedImages
    };

    // Bắn API tới cổng 8000 của FastAPI
    fetch('http://localhost:8000/api/register-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            statusText.innerText = "✅ " + data.message;
            statusText.style.color = "lime";
        } else {
            statusText.innerText = "❌ Lỗi: " + data.message;
            statusText.style.color = "red";
            startBtn.disabled = false; 
            currentStage = 'straight'; 
            capturedImages = { straight: [], left: [], right: [] }; 
        }
    })
    .catch(err => {
        console.error(err);
        statusText.innerText = "❌ Không kết nối được tới máy chủ FastAPI!";
        statusText.style.color = "red";
        startBtn.disabled = false;
    });
}

// Kích hoạt Camera ngay khi trang web vừa tải xong
const camera = new Camera(videoElement, {
  onFrame: async () => { await faceMesh.send({image: videoElement}); },
  width: 640, 
  height: 480
});
camera.start();