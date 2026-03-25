from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import timedelta
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm
from utils.jwt_handler import create_access_token
from utils.jwt_handler import create_access_token, decode_token
from sqlalchemy.orm import Session
from database.user import User
from passlib.hash import bcrypt
router = APIRouter()
from fastapi import Request
from utils.jwt_handler import BLACKLIST
from database.database import get_db


# ===== MODEL REQUEST =====
class LoginRequest(BaseModel):
    username: str
    password: str



# ===== LOGIN =====
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = form_data.username
    password = form_data.password

    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=401, detail="User không tồn tại")

    if not bcrypt.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Sai mật khẩu")

    access_token = create_access_token({"sub": username})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# ===== REISTER (BLACKLIST) =====
@router.post("/register")
def register(username: str, password: str, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == username).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    hashed_password = bcrypt.hash(password)

    new_user = User(username=username, password=hashed_password)
    db.add(new_user)
    db.commit()

    return {"message": "Tạo tài khoản thành công"}

# ===== LOGOUT (BLACKLIST) =====

@router.post("/logout")
def logout(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Thiếu token")

    token = auth_header.split(" ")[1]

    BLACKLIST.add(token)

    return {"message": "Đã logout"}