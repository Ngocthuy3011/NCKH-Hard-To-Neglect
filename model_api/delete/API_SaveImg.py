import os
import uuid
import cv2
import numpy as np
import insightface
from insightface.utils import face_align
from fastapi import FastAPI, UploadFile, File, Form

# --- 1. KHỞI TẠO APP VÀ MODEL ---
app = FastAPI()

# Load model (Bắt buộc phải có để lấy landmarks cho việc xoay ảnh)
print("⏳ Đang tải Model AI... (Chỉ mất vài giây)")
model = insightface.app.FaceAnalysis(name="buffalo_l", root="./insightface_model")
model.prepare(ctx_id=0, det_size=(640, 640)) 
print("✅ Model đã sẵn sàng xử lý ảnh crop!")

# --- 2. CẤU HÌNH THƯ MỤC ---
SAVE_DIR = "database_tam"
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

# --- 3. API NHẬN ẢNH CROP VÀ CĂN CHỈNH ---
@app.post("/SinhVien")
async def save_crop_image(
    mssv: str = Form(...),       
    file: UploadFile = File(...) 
):
    try:
        # A. Đọc dữ liệu ảnh (Lúc này là ảnh khuôn mặt đã crop từ Client)
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_crop = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_crop is None:
            return {"status": "error", "message": "File ảnh bị lỗi!"}

        # B. Tìm điểm mốc (Landmarks) trên ảnh crop để căn chỉnh
        # (Dù đã crop nhưng vẫn cần biết mắt nằm đâu để xoay cho thẳng)
        faces = model.get(img_crop)

        if len(faces) == 0:
            # Trường hợp ảnh crop quá mờ hoặc cắt mất các bộ phận quan trọng
            return {
                "status": "warning", 
                "message": "Ảnh crop không rõ nét, không thể căn chỉnh. (Server sẽ lưu ảnh gốc)",
                "path": save_raw_image(mssv, img_crop) # Lưu tạm ảnh crop gốc
            }

        # C. Thực hiện Căn chỉnh (Align)
        # Lấy khuôn mặt rõ nhất (thường trong ảnh crop chỉ có 1 mặt)
        face = faces[0] 
        align_img = face_align.norm_crop(img_crop, landmark=face.kps)

        # D. Lưu ảnh đã căn chỉnh
        filename = f"{mssv}_{uuid.uuid4().hex[:6]}.jpg"
        file_path = os.path.join(SAVE_DIR, filename)
        cv2.imwrite(file_path, align_img)

        return {
            "status": "success", 
            "path": file_path, 
            "message": "✅ Đã căn chỉnh và lưu thành công!"
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Hàm phụ: Lưu ảnh gốc nếu không căn chỉnh được
def save_raw_image(mssv, img):
    filename = f"{mssv}_RAW_{uuid.uuid4().hex[:6]}.jpg"
    file_path = os.path.join(SAVE_DIR, filename)
    cv2.imwrite(file_path, img)
    return file_path

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)