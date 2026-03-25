from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "secret123"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ===== BLACKLIST (tạm thời dùng RAM) =====
BLACKLIST = set()

# ===== CREATE TOKEN =====
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ===== DECODE TOKEN =====
def decode_token(token: str = Depends(oauth2_scheme)):
    try:
        # ❗ Check blacklist trước
        if token in BLACKLIST:
            raise HTTPException(status_code=401, detail="Token đã bị thu hồi")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token không hợp lệ")

        return payload  # ✅ trả về payload (quan trọng)

    except JWTError:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")