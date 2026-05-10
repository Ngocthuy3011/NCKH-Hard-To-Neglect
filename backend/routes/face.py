from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter()

@router.post("/register")
async def register_face(
    user_id: str = Form(...),
    image: UploadFile = File(...)
):
    return {
        "status": "success",
        "user_id": user_id,
        "filename": image.filename,
        "message": "Face registered (mock)"
    }