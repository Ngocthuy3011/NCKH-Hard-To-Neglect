from fastapi.encoders import jsonable_encoder
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware # Nhớ import thư viện này
from sqlalchemy.orm import Session
from typing import List
import psycopg2 
import os
import sys

from database import crud

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

from convert import FaceProcessor 
from backend.database.db import get_db
from database.models import Base, Faces_embedding, Classes, Students, Enrollments, Account

from attendance import attendance_auto



app = FastAPI()

# --- THÊM ĐOẠN NÀY ĐỂ FIX LỖI 405 OPTIONS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép gọi từ mọi file HTML
    allow_credentials=True,
    allow_methods=["*"], # Bắt buộc phải có để chấp nhận method OPTIONS
    allow_headers=["*"],
)
# ---------------------------------------------

face_tool = FaceProcessor()
DB_URL = "postgresql://postgres:nckh%40HTN@localhost:5433/postgres"

# ==========================================
# 1. QUẢN LÝ WEBSOCKET CONNECTION
# ==========================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        """Gửi thông báo đến TẤT CẢ các tab web đang mở bảng"""
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Giữ kết nối
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ==========================================
# 2. API ĐIỂM DANH AI (Kèm logic đổi màu viền)
# ==========================================
@app.post("/api/check-attendance-ai")
async def check_attendance_ai(data: dict, db: Session = Depends(get_db)):
    image_b64 = data.get("image_base64")
    class_id = data.get("class_id")
    session_no = data.get("session_no")

    try:
        print("\n\n--- BƯỚC 1: ĐÃ NHẬN ĐƯỢC ẢNH TỪ CAMERA ---")
        
        # 1. Chuyển ảnh hiện tại thành vector 512 chiều
        current_vector = face_tool.get_embedding(image_b64)
        
        if not current_vector:
            print("❌ LỖI BƯỚC 1: AI không tìm thấy khuôn mặt nào trong tấm ảnh này!")
            return {"status": "fail", "message": "Không tìm thấy khuôn mặt", "color": "yellow"}

        print("✅ BƯỚC 2: AI ĐĐÃ TRÍCH XUẤT THÀNH CÔNG VECTOR KHUÔN MẶT!")
        
        # 2. So sánh pgvector để tìm người giống nhất
        vector_str = f"[{','.join(map(str, current_vector))}]"
        
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # Dùng hàm LEAST để lấy khoảng cách nhỏ nhất trong 3 góc mặt
        # Dùng COALESCE(..., 2.0) để phòng hờ trường hợp có góc mặt bị NULL (chưa nạp) thì nó sẽ tự bỏ qua
        search_query = """
            SELECT student_id, 
                   LEAST(
                       COALESCE((vector_straight <=> %s::vector), 2.0),
                       COALESCE((vector_left <=> %s::vector), 2.0),
                       COALESCE((vector_right <=> %s::vector), 2.0)
                   ) as distance 
            FROM faces_embedding 
            ORDER BY distance ASC 
            LIMIT 1;
        """
        
        # Vì trong câu SQL có 3 dấu %s, chúng ta phải truyền vector_str vào 3 lần
        cur.execute(search_query, (vector_str, vector_str, vector_str))
        result = cur.fetchone()

        print(f"🔎 BƯỚC 3: KẾT QUẢ TÌM KIẾM TRONG DATABASE: {result}")

        if result:
            student_id, distance = result
            
            # --- ĐÂY LÀ KHU VỰC IN KẾT QUẢ ---
            print(f"=========================================")
            print(f"👤 Sinh viên giống nhất: {student_id}")
            print(f"📏 Điểm khoảng cách (Distance): {distance:.4f}")
            print(f"=========================================")
            
            if distance < 0.4: # Ngưỡng chấp nhận AI
                print("✅ BƯỚC 4: ĐIỂM SỐ ĐẠT CHUẨN (<0.4). TIẾN HÀNH ĐIỂM DANH!")
                
                # 1. BẮN TÍN HIỆU WEBSOCKET SANG TRANG ATTEND.HTML (Đây là dòng quyết định đổi màu!)
                await manager.broadcast(f"ATTENDANCE_SUCCESS:{student_id}")
                
                # 2. Ghi vào CSDL (Nếu bạn đã import hàm attendance_auto thì bỏ dấu # ở dòng dưới đi nhé)
                # db_result = await attendance_auto(student_id, class_id, session_no, db)
                
                # 3. Trả về màu XANH cho Camera Popup
                return {
                    "status": "success", 
                    "student_id": student_id,
                    "color": "green", 
                    "message": "Điểm danh thành công"
                }
            else:
                print("⚠️ BƯỚC 4: TÌM THẤY NGƯỜI NHƯNG KHÔNG GIỐNG LẮM (>0.4). BỎ QUA!")
                return {"status": "fail", "color": "yellow", "message": "Khuôn mặt không khớp"}
        
        else:
            print("🚨 LỖI LỚN: BẢNG faces_embedding TRỐNG RỖNG, CHƯA CÓ AI TRONG HỆ THỐNG!")
            return {"status": "fail", "color": "yellow", "message": "Chưa có dữ liệu khuôn mặt"}

    except Exception as e:
        print(f"🔥 LỖI HỆ THỐNG SẬP TẠI BƯỚC NÀO ĐÓ: {str(e)}")
        return {"status": "error", "message": str(e)}

# @app.get("/api/classes")
# async def get_all_classes(db: Session = Depends(get_db)):
#     try:
#         classes_data = db.query(Classes).all()
        
#         result = []
#         for c in classes_data:
#             if c.teacher_rel and c.teacher_rel.account:
#                 t_name = c.teacher_rel.account.full_name
#             else:
#                 t_name = "Chưa phân công"
#             result.append({
#                 "class_id": c.class_id,
#                 "subject_id": c.subject_id,
#                 "group_id": c.group_id,
#                 "sub_id": c.sub_id,
#                 "teacher_name": t_name, 
#                 "semester": c.semester
#             })
            
#         return {"status": "success", "data": result}
#     except Exception as e:
#         print(f"Lỗi truy vấn DB: {e}")
#         return {"status": "error", "message": str(e)}

@app.get("/api/classes")
async def get_all_classes(teacher_id: str = "2025001", db: Session = Depends(get_db)):
    try:
        # Sử dụng chính hàm CRUD mà Hiền đã tạo ở file kia
        # Giả sử crud đã được import vào file này
        classes = crud.get_lecturer_classes(db, teacher_id=teacher_id)
        
        # Nếu muốn trả về định dạng "success" như cũ cho Frontend không bị lỗi
        return {
            "status": "success", 
            "data": jsonable_encoder(classes)
        }
    except Exception as e:
        print(f"Lỗi truy vấn DB: {e}")
        return {"status": "error", "message": str(e)}
# ==========================================
# 4. API LẤY DANH SÁCH SINH VIÊN THEO LỚP
# ==========================================
@app.get("/api/class-students/{class_id}")
async def get_class_students(class_id: int, db: Session = Depends(get_db)):
    try:
        # Truy vấn nối 3 bảng: Enrollments (tìm SV trong lớp) -> Students -> Account (lấy họ tên)
        students_in_class = db.query(
            Enrollments.student_id,
            Account.full_name
        ).join(
            Students, Enrollments.student_id == Students.student_id
        ).join(
            Account, Students.student_id == Account.username
        ).filter(
            Enrollments.class_id == class_id
        ).all()

        result = []
        for idx, stu in enumerate(students_in_class):
            result.append({
                "stt": idx + 1,
                "student_id": stu.student_id,
                "full_name": stu.full_name if stu.full_name else "Chưa cập nhật tên"
            })
            
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"Lỗi truy vấn danh sách SV: {e}")    
        return {"status": "error", "message": str(e)}

if __name__ == '__main__':
    uvicorn.run("API_CheckAttend:app", host="0.0.0.0", port=8000, reload=True)