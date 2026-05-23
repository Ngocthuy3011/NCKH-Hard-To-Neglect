from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from pydantic import BaseModel

from utils.jwt_handler import create_access_token, decode_token, BLACKLIST
from database.db import get_db
# Gộp chung import các model vào 1 dòng cho gọn gọn gàng
from database.models import Account, Students, Teachers 

router = APIRouter()

# ===== MODEL REQUEST ĐỂ THÊM class_name =====
class RegisterRequest(BaseModel):
    username: str
    password: str
    fullname: str
    role: str 
    class_name: str = None # Thêm trường này cho sinh viên (không bắt buộc)

# ===== LOGIN TỐI ƯU HÓA =====
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Account).filter(Account.username == form_data.username).first()

    if not user or not bcrypt.verify(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")

    access_token = create_access_token({"sub": user.username})

    # Khởi tạo thông tin cơ bản
    user_info = {
        "username": user.username,
        "fullname": user.full_name, # Cập nhật đúng tên cột full_name
        "role": user.role,
        "mssv": user.username
    }

    # Nếu là sinh viên, truy vấn thêm bảng Students để lấy Lớp
    if user.role == 'student':
        student_record = db.query(Students).filter(Students.student_id == user.username).first()
        if student_record:
            user_info["className"] = student_record.class_name

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

# ===== REGISTER TỐI ƯU HÓA =====
@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(Account).filter(Account.username == request.username).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username (MSSV/MGV) đã tồn tại")

    hashed_password = bcrypt.hash(request.password)

    # Bước 1: Tạo Account trước
    new_account = Account(
        username=request.username, 
        password=hashed_password,
        full_name=request.fullname, # Chú ý: full_name có dấu gạch dưới
        role=request.role
    )
    db.add(new_account)
    
    # Ép SQLAlchemy đẩy data xuống DB để lấy username làm khóa ngoại
    db.flush() 

    # Bước 2: Dựa vào role, tạo tiếp record bên bảng tương ứng
    if request.role == 'student':
        new_student = Students(
            student_id=request.username,
            class_name=request.class_name # Lưu tên lớp vào bảng Students
        )
        db.add(new_student)
    elif request.role == 'lecturer':
        new_teacher = Teachers(teacher_id=request.username)
        db.add(new_teacher)

    db.commit()

    return {"message": "Tạo tài khoản thành công"}

# ===== LOGOUT (Giữ nguyên) =====
@router.post("/logout")
def logout(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Thiếu token")
    token = auth_header.split(" ")[1]
    BLACKLIST.add(token)
    return {"message": "Đã logout thành công"}