import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pgvector.sqlalchemy import Vector
import base64
import numpy as np
import cv2
from insightface.app import FaceAnalysis
from datetime import datetime

import sys
import os

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from database.database import engine, get_db
from database.models import Base, Faces_embedding


Base.metadata.create_all(bind=engine)
# ==========================================
# 1. KHỞI TẠO FASTAPI & SWAGGER TỰ ĐỘNG
# ==========================================
app = FastAPI(
    title="Hệ thống nhận diện khuôn mặt API",
    description="API phục vụ cho việc đăng ký và điểm danh sinh viên",
    version="1.0.0"
)

# Cấu hình CORS cho phép Web JS gọi vào API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ==========================================
# 3. KHỞI TẠO INSIGHTFACE
# ==========================================
print("Đang tải mô hình InsightFace...")
app_face = FaceAnalysis(name='buffalo_l', root='./insightface_model', providers=['CPUExecutionProvider'])
app_face.prepare(ctx_id=0, det_size=(640, 640))
print("Khởi tạo xong InsightFace!")

# ==========================================
# 4. KHAI BÁO MODEL PYDANTIC (Định nghĩa JSON đầu vào cho Swagger)
# ==========================================
class ImagesDict(BaseModel):
    straight: List[str] = []
    left: List[str] = []
    right: List[str] = []

class RegisterFaceRequest(BaseModel):
    student_id: str
    images: ImagesDict
    
    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "52400056",
                "images": {
                    "straight": ["data:image/jpeg;base64,..."],
                    "left": ["data:image/jpeg;base64,..."],
                    "right": ["data:image/jpeg;base64,..."]
                }
            }
        }

# ==========================================
# 5. CÁC HÀM XỬ LÝ ẢNH
# ==========================================
def base64_to_cv2(base64_string):
    encoded_data = base64_string.split(',')[1]
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def avg_vector(base64_list):
    if not base64_list:
        return None
    vectors = []
    for b64 in base64_list:
        img = base64_to_cv2(b64)
        faces = app_face.get(img)
        if len(faces) > 0:
            vectors.append(faces[0].embedding)
            
    if not vectors:
        return None
    return np.mean(vectors, axis=0).tolist()

# ==========================================
# 6. API ĐĂNG KÝ (ENDPOINT)
# ==========================================
# @app.post("/api/register-face", tags=["QuanLyKhuonMat"])
# def register_face(data: RegisterFaceRequest, db: Session = Depends(get_db)):
#     print(f"Đang xử lý vector cho sinh viên: {data.student_id}")

#     vec_straight = avg_vector(data.images.straight)
#     vec_left = avg_vector(data.images.left)
#     vec_right = avg_vector(data.images.right)

#     if not any([vec_straight, vec_left, vec_right]):
#          return {"status": "error", "message": "Không tìm thấy khuôn mặt trong bất kỳ ảnh nào!"}

#     try:
#         existing_student = db.query(Faces_embedding).filter(Faces_embedding.student_id == data.student_id).first()

#         if existing_student:
#             if vec_straight: existing_student.vector_straight = vec_straight
#             if vec_left: existing_student.vector_left = vec_left
#             if vec_right: existing_student.vector_right = vec_right
#         else:
#             new_student = Faces_embedding(
#                 student_id=data.student_id,
#                 vector_straight=vec_straight,
#                 vector_left=vec_left,
#                 vector_right=vec_right
#             )
#             db.add(new_student)
            
#         db.commit()
#         return {"status": "success", "message": f"Đã lưu thành công 3 góc mặt cho MSSV {data.student_id}!"}

#     except Exception as e:
#         db.rollback()
#         return {"status": "error", "message": f"Lỗi lưu Database: {str(e)}"}

@app.post("/api/register-face", tags=["QuanLyKhuonMat"])
def register_face(data: RegisterFaceRequest, db: Session = Depends(get_db)):
    print(f"👉 BƯỚC 1: Đã nhận được yêu cầu từ MSSV: {data.student_id}")
    print(f"   - Số ảnh góc Thẳng gửi lên: {len(data.images.straight)} tấm")

    # Ép kiểu ảnh thành Vector
    vec_straight = avg_vector(data.images.straight)
    vec_left = avg_vector(data.images.left)
    vec_right = avg_vector(data.images.right)

    print(f"👉 BƯỚC 2: Kết quả InsightFace trích xuất Vector:")
    print(f"   - Góc thẳng: {'✅ Thành công' if vec_straight else '❌ FAILED (Không thấy mặt)'}")
    print(f"   - Góc trái:  {'✅ Thành công' if vec_left else '❌ FAILED (Không thấy mặt)'}")
    print(f"   - Góc phải:  {'✅ Thành công' if vec_right else '❌ FAILED (Không thấy mặt)'}")

    if not any([vec_straight, vec_left, vec_right]):
         print("🛑 DỪNG LẠI: Không có bất kỳ Vector nào được tạo ra. Hủy lưu Database!")
         return {"status": "error", "message": "Không tìm thấy khuôn mặt trong bất kỳ ảnh nào!"}

    try:
        print("👉 BƯỚC 3: Bắt đầu gọi cửa PostgreSQL...")
        existing_student = db.query(Faces_embedding).filter(Faces_embedding.student_id == data.student_id).first()

        if existing_student:
            print("   - Đã thấy MSSV này trong kho, tiến hành GHI ĐÈ dữ liệu...")
            if vec_straight: existing_student.vector_straight = vec_straight
            if vec_left: existing_student.vector_left = vec_left
            if vec_right: existing_student.vector_right = vec_right
        else:
            print("   - Đây là sinh viên mới, tiến hành TẠO HỒ SƠ MỚI...")
            new_student = Faces_embedding(
                student_id=data.student_id,
                vector_straight=vec_straight,
                vector_left=vec_left,
                vector_right=vec_right
            )
            db.add(new_student)
            
        db.commit()
        print("🎉 BƯỚC 4: LƯU THÀNH CÔNG VÀO POSTGRESQL!")
        return {"status": "success", "message": f"Đã lưu thành công 3 góc mặt cho MSSV {data.student_id}!"}

    except Exception as e:
        db.rollback()
        print(f"🚨 BÁO ĐỘNG ĐỎ - LỖI DATABASE: {str(e)}")
        return {"status": "error", "message": f"Lỗi lưu Database: {str(e)}"}

if __name__ == '__main__':
    uvicorn.run("API_CreateVec:app", host="0.0.0.0", port=8000, reload=True)