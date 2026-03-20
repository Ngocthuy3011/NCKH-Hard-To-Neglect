from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import timedelta
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm
from utils.jwt_handler import create_access_token
from utils.jwt_handler import create_access_token, decode_token

router = APIRouter()

# ===== MODEL REQUEST =====
class LoginRequest(BaseModel):
    username: str
    password: str

# ===== FAKE DB =====
USERS = {
    "51801003": {"password": "123456", "role": "student"},
    "GV001": {"password": "admin123", "role": "teacher"}
}

# ===== LOGIN =====


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password

    # demo user
    if username != "51801003" or password != "123456":
        return {"error": "Sai tài khoản hoặc mật khẩu"}

    access_token = create_access_token({"sub": username})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ===== LOGOUT (BLACKLIST) =====
BLACKLIST = set()

@router.post("/logout")
def logout(token: str = Depends(decode_token)):
    BLACKLIST.add(token)
    return {"message": "Đã logout"}