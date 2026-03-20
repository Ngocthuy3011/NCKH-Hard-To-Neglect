import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI
from database import models
from model_TN import attendance
# Tự động tạo bảng nếu DB của bạn chưa có (rất tiện để test)

app = FastAPI(title="Test API Điểm Danh")

# Đưa các API trong file attendance vào hệ thống
app.include_router(attendance.router)

@app.get("/")
async def root():
    return {"message": "Server đang chạy, hãy vào /docs để test API"}