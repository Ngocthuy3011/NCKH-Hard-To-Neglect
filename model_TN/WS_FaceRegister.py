import cv2
import os
import uuid
import numpy as np
import insightface
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from insightface.utils import face_align
from fastapi.responses import HTMLResponse
from scipy.datasets import face
from scipy.datasets import face

from API_SaveImg import SAVE_DIR

app = FastAPI()
SAVE_DIR = "database_tam"
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)
model = insightface.app.FaceAnalysis(name="buffalo_l", root="./insightface_model")
model.prepare(ctx_id=0, det_size=(640, 640))

@app.websocket("/ws/register")
async def websocket_endpoint(websocket: WebSocket):
    # A. Bắt tay kết nối
    await websocket.accept()
    print("Client đã kết nối!")
    
    try:
        while True:
            data = await websocket.receive_bytes()

            nparr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            faces = model.get(img)
            
            # E. Chuẩn bị kết quả gửi về
            if len(faces) > 0:
                # Lấy khuôn mặt to nhất (thường là mặt đầu tiên)
                box = faces[0].bbox.astype(int).tolist() # [x1, y1, x2, y2]
                # Gửi tọa độ về cho Client (dạng JSON)
                filename = f"{uuid.uuid4().hex}.jpg"
                save_path = os.path.join(SAVE_DIR, filename)
                # Lưu ảnh đã crop
                face = img[box[1]:box[3], box[0]:box[2]]
                face = face_align.norm_crop(img, landmark=faces[0].kps)
                cv2.imwrite(save_path, face)
                print(f"✅ Đã lưu ảnh: {filename}")
                await websocket.send_json({
                    "status": "found",
                    "box": box  # Ví dụ: [100, 100, 200, 200]
                })
            else:
                # Không thấy mặt thì báo về
                await websocket.send_json({
                    "status": "not_found"
                })

    except WebSocketDisconnect:
        print("Client đã ngắt kết nối")
    except Exception as e:
        print(f"Lỗi: {e}")
if __name__ == "__main__":
    import uvicorn
    # Chạy server ở cổng 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)