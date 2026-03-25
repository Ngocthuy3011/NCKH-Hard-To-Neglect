from fastapi import FastAPI
from routes.auth import router as auth_router
from routes.face import router as face_router
from database.models import Account
from database.database import Base, engine
from database import models
from dotenv import load_dotenv
load_dotenv()
Base.metadata.create_all(bind=engine)
app = FastAPI()

# đăng ký router
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(face_router, prefix="/face", tags=["Face"])

@app.get("/")
def home():
    return {"status": "FastAPI is running"}