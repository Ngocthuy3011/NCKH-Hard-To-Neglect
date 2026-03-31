from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer
from routes.auth import router as auth_router
from routes.face import router as face_router
from database.database import Base
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine

load_dotenv()

# 🔥 FIX CHỖ NÀY
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# router
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(face_router, prefix="/face", tags=["Face"])

@app.get("/")
def home():
    return {"status": "FastAPI is running"}

# logout
@app.post("/auth/logout")
def logout(token: str = Depends(oauth2_scheme)):
    return {"message": "Logout thành công"}