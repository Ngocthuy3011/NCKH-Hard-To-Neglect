from fastapi import FastAPI
from routes.auth import router as auth_router
from routes.face import router as face_router

app = FastAPI()

# đăng ký router
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(face_router, prefix="/face", tags=["Face"])

@app.get("/")
def home():
    return {"status": "FastAPI is running"}