from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.student import router as student_router
from routes.teacher import router as teacher_router
from routes.face import router as face_router # Đã mở khóa
from database.db import Base
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
load_dotenv()

# Chuỗi kết nối Database
DATABASE_URL = "postgresql://postgres:nckh%40HTN@localhost:5433/postgres"
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ===== BẬT CORS ĐỂ FRONTEND REACT CÓ THỂ KẾT NỐI =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ===== KHAI BÁO CÁC ĐƯỜNG DẪN ROUTER =====
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(student_router, prefix="/api", tags=["Student API"])
app.include_router(teacher_router, prefix="", tags=["Teacher API"])
app.include_router(face_router) # Đã mở khóa và kích hoạt AI

@app.get("/")
def home():
    return {"status": "FastAPI is running"}

# logout
@app.post("/auth/logout")
def logout(token: str = Depends(oauth2_scheme)):
    return {"message": "Logout thành công"}

# Cấu hình Mail (Chờ cấu hình thật khi test Quên mật khẩu)
conf = ConnectionConfig(
    MAIL_USERNAME = "your_email@gmail.com",
    MAIL_PASSWORD = "your_app_password", 
    MAIL_FROM = "your_email@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)