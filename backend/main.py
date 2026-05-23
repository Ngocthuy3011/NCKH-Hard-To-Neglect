from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware # Thêm thư viện CORS
from routes.auth import router as auth_router
from routes.student import router as student_router # Import router của Sinh viên vừa tạo
# from routes.face import router as face_router  <-- Tạm tắt để tránh lỗi thiếu file AI
from database.database import Base
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
load_dotenv()

# 🔥 ĐÃ FIX CHỖ NÀY: Gán cứng chuỗi kết nối luôn cho chắc cú!
DATABASE_URL = "postgresql://postgres:nckh%40HTN@localhost:5433/postgres"
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ===== BẬT CORS ĐỂ FRONTEND REACT CÓ THỂ KẾT NỐI =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các cổng, bao gồm localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ===== KHAI BÁO CÁC ĐƯỜNG DẪN ROUTER =====
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

# KÍCH HOẠT API CỦA SINH VIÊN VỪA TẠO
app.include_router(student_router, prefix="/api", tags=["Student API"])

# app.include_router(face_router, prefix="/face", tags=["Face"]) <-- Tạm tắt

@app.get("/")
def home():
    return {"status": "FastAPI is running"}

# logout
@app.post("/auth/logout")
def logout(token: str = Depends(oauth2_scheme)):
    return {"message": "Logout thành công"}




conf = ConnectionConfig(
    MAIL_USERNAME = "your_email@gmail.com",
    MAIL_PASSWORD = "your_app_password", # Mật khẩu ứng dụng Google
    MAIL_FROM = "your_email@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)