import cv2
import numpy as np
import os
import pickle
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from insightface.app import FaceAnalysis
from fastapi.responses import FileResponse
app = FastAPI()

# Cho phép Client (Web) gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Cấu hình thư mục lưu trữ
DATASET_DIR = "dataset_students"
os.makedirs(DATASET_DIR, exist_ok=True)

# 2. Khởi tạo AI
model = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider'])
model.prepare(ctx_id=0, det_size=(640, 640))

@app.get("/")
async def read_root():
    # Đảm bảo file test_register.html nằm cùng thư mục với file python này
    return FileResponse("test_register.html")

@app.post("/api/register")
async def register_student(
    student_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    API nhận 1 ảnh, tìm khuôn mặt, lưu ảnh đã cắt và lưu vector.
    """
    # Tạo thư mục riêng cho sinh viên này
    save_path = os.path.join(DATASET_DIR, student_id)
    os.makedirs(save_path, exist_ok=True)
    
    # Đọc ảnh từ Client
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    faces = model.get(img)
    
    if len(faces) == 0:
        return {"status": "error", "message": "Không tìm thấy khuôn mặt nào!"}
    
    if len(faces) > 1:
        return {"status": "error", "message": "Chỉ được phép có 1 người trong khung hình khi đăng ký!"}
    
    face = faces[0]
    embedding = face.embedding # Vector 512 chiều

    bbox = face.bbox.astype(int)
    face_img = img[bbox[1]:bbox[3], bbox[0]:bbox[2]]

    import time
    filename = f"{int(time.time())}.jpg"
    cv2.imwrite(os.path.join(save_path, filename), face_img)
    
    # 2. Lưu Vector (Append vào file .npy hoặc .pkl)
    # Ở đây thầy lưu từng vector ra file riêng, lát nữa sẽ tính trung bình sau
    vector_path = os.path.join(save_path, f"{int(time.time())}.npy")
    np.save(vector_path, embedding)

    return {
        "status": "success", 
        "message": "Đã lưu góc mặt thành công",
        "student_id": student_id,
        "angle_saved": filename
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)