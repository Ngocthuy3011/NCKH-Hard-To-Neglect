import uvicorn
import os
import sys
import numpy as np
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# Cấu hình path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Đảm bảo file tên là convert.py (hoặc đổi thành processor.py tùy bạn)
from convert import FaceProcessor 
from backend.database.db import engine, get_db
from database.models import Base, Faces_embedding
from pydantic import BaseModel

# ==========================================
# 1. KHỞI TẠO CẤU TRÚC (Chỉ chạy 1 lần)
# ==========================================
Base.metadata.create_all(bind=engine)
face_tool = FaceProcessor()

app = FastAPI(
    title="Hệ thống nhận diện khuôn mặt API",
    description="Lưu 3 vector trung bình (Thẳng, Trái, Phải)",
    version="1.1.0"
)

# Cấu hình CORS chuẩn để sửa lỗi 405
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImagesDict(BaseModel):
    straight: List[str] = []
    left: List[str] = []
    right: List[str] = []

class RegisterFaceRequest(BaseModel):
    student_id: str
    images: ImagesDict

def get_avg_vector(img_list: List[str]):
    vectors = []
    for b64 in img_list:
        v = face_tool.get_embedding(b64)
        if v:
            vectors.append(v)
    if not vectors:
        return None
    return np.mean(vectors, axis=0).tolist()

@app.post("/api/register-face")
async def register_face(request: RegisterFaceRequest, db: Session = Depends(get_db)):
    student_id = request.student_id
    
    try:
        v_straight = get_avg_vector(request.images.straight)
        v_left = get_avg_vector(request.images.left)
        v_right = get_avg_vector(request.images.right)

        if not v_straight:
            raise HTTPException(status_code=400, detail="Không thể trích xuất vector khuôn mặt nhìn thẳng")

        new_record = Faces_embedding(
            student_id=student_id,
            vector_straight=v_straight,
            vector_left=v_left,
            vector_right=v_right
        )
        
        db.add(new_record)
        db.commit()
        
        return {
            "status": "success", 
            "message": f"Đã lưu bộ vector trung bình cho sinh viên {student_id}"
        }

    except Exception as e:
        db.rollback()
        print(f"Lỗi SQL: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)