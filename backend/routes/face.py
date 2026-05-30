from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import Faces_embedding, Attendance, Enrollments, Classes, Students, Account
from pydantic import BaseModel
import numpy as np
import psycopg2
from datetime import datetime, timedelta
from typing import List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random

from model_api.convert import FaceProcessor

face_tool = FaceProcessor()
router = APIRouter(prefix="/api", tags=["Face & Attendance API"])

DB_URL = "postgresql://postgres:nckh%40HTN@localhost:5433/postgres"

# ==========================================
# BỘ NHỚ LƯU TRẠNG THÁI ĐIỂM DANH ONLINE
# ==========================================
# Cấu trúc: { class_id: {"is_open": True, "pin_code": "1234", "end_time": datetime} }
active_sessions = {}

# ==========================================
# CẤU HÌNH EMAIL HỆ THỐNG
# ==========================================
SENDER_EMAIL = "stdattendsystem.htn@gmail.com"
SENDER_PASSWORD = "eyeatdmdzfyezhrl"  

def send_warning_email_background(student_id: str, student_name: str, class_name: str, time_str: str, absent_count: int, db: Session):
    """Hàm gửi email cảnh báo chạy ngầm"""
    try:
        # Truy vấn email từ Database
        student_info = db.query(Account).filter(Account.username == student_id).first()
        
        if student_info and student_info.email:
            receiver_email = student_info.email
        else:
            # Nếu sinh viên chưa cập nhật email, gửi tạm về mail hệ thống
            receiver_email = "stdattendsystem.htn@gmail.com" 
        
        msg = MIMEMultipart()
        msg['From'] = f"Hệ thống Điểm danh AI <{SENDER_EMAIL}>"
        msg['To'] = receiver_email
        msg['Subject'] = f"Xác nhận điểm danh thành công - Môn {class_name}"

        body = f"""
        Kính gửi {student_name} (MSSV: {student_id}),

        Hệ thống xác nhận bạn đã được điểm danh thành công.
        * Môn học: {class_name}
        * Thời gian ghi nhận: {time_str}

        Thống kê chuyên cần:
        * Tổng số buổi đã vắng: {absent_count} buổi
        """

        # Thêm cảnh báo nếu vắng từ 2 buổi trở lên
        if absent_count >= 2:
            body += """
        Lưu ý: Theo quy chế học vụ, sinh viên vắng mặt quá 20% tổng số tiết học sẽ bị cấm thi cuối kỳ. Vui lòng theo dõi tiến độ học tập để đảm bảo điều kiện dự thi.
        """

        body += "\nTrân trọng,\nHệ thống Quản lý Điểm danh AI."

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, receiver_email, text)
        server.quit()
        print(f"[INFO] Da gui email canh bao thanh cong cho {student_name} ({receiver_email})")
    except Exception as e:
        print(f"[ERROR] Loi gui email: {e}")

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
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ==========================================
# 2. SCHEMA
# ==========================================
class AttendanceRequest(BaseModel):
    image_base64: str
    class_id: int
    session_no: int
    cutoff_time: str = None
    pin_code: str = None  # Nhận mã PIN từ Sinh viên
    is_online: bool = False # Cờ phân biệt điểm danh từ xa (SV) hay trực tiếp (GV)

class ImagesDict(BaseModel):
    straight: List[str] = []
    left: List[str] = []
    right: List[str] = []

class RegisterFaceRequest(BaseModel):
    student_id: str
    images: ImagesDict

# Thêm 2 Schema mới cho chức năng Mở/Đóng phiên của Giảng viên
class OpenAttendanceRequest(BaseModel):
    class_id: int
    duration_minutes: int  # Thời gian đếm ngược (phút)

class CloseAttendanceRequest(BaseModel):
    class_id: int

# ==========================================
# 3. HÀM PHỤ TRỢ
# ==========================================
def process_attendance_db(student_id: str, class_id: int, session_no: int, cutoff_time_str: str, db: Session):
    is_enrolled = db.query(Enrollments).filter(
        Enrollments.student_id == student_id,
        Enrollments.class_id == class_id
    ).first()
    if not is_enrolled:
        return None

    already_checked = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.class_id == class_id,
        Attendance.session_no == session_no
    ).first()
    if already_checked:
        return "ALREADY_CHECKED"

    now = datetime.now()
    current_time_str = now.strftime("%H:%M") 
    
    status = "có mặt" 
    if cutoff_time_str and current_time_str > cutoff_time_str:
        status = "trễ"

    new_record = Attendance(
        student_id=student_id,
        class_id=class_id,
        status=status,
        session_no=session_no,
        time=now
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    return {
        "student_id": student_id,
        "status": status,
        "time": current_time_str
    }

def get_avg_vector(img_list: List[str]):
    vectors = []
    for b64 in img_list:
        v = face_tool.get_embedding(b64)
        if v is not None:
            vectors.append(v)
    if not vectors:
        return None
    return np.mean(vectors, axis=0).tolist()

def format_pgvector(vector_list):
    if not vector_list:
        return None
    return f"[{','.join(map(str, vector_list))}]"

# ==========================================
# 4. API QUẢN LÝ PHIÊN ĐIỂM DANH ONLINE (MÃ PIN + ĐẾM NGƯỢC)
# ==========================================
@router.post("/open-attendance")
async def open_attendance(request: OpenAttendanceRequest):
    """API cho Giảng viên mở phiên điểm danh từ xa"""
    # Sinh mã PIN ngẫu nhiên 4 số
    pin_code = str(random.randint(1000, 9999))
    end_time = datetime.now() + timedelta(minutes=request.duration_minutes)
    
    active_sessions[request.class_id] = {
        "is_open": True,
        "pin_code": pin_code,
        "end_time": end_time
    }
    
    # Bắn tín hiệu WebSocket cho toàn bộ Sinh viên biết để bật form nhập PIN
    import json
    await manager.broadcast(json.dumps({
        "type": "OPEN_ATTENDANCE",
        "class_id": request.class_id,
        "end_time": end_time.isoformat()
    }))
    
    return {"status": "success", "pin_code": pin_code, "end_time": end_time}

@router.post("/close-attendance")
async def close_attendance(request: CloseAttendanceRequest):
    """API cho Giảng viên đóng phiên sớm"""
    if request.class_id in active_sessions:
        del active_sessions[request.class_id]
        
    import json
    await manager.broadcast(json.dumps({
        "type": "CLOSE_ATTENDANCE",
        "class_id": request.class_id
    }))
    return {"status": "success", "message": "Đã đóng phiên điểm danh"}

# ==========================================
# 4.1 API ĐIỂM DANH CÁ NHÂN (HỖ TRỢ OFFLINE VÀ ONLINE CÓ PIN CODE)
# ==========================================
@router.post("/check-attendance-ai")
async def check_attendance_ai(request: AttendanceRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    print("\n" + "="*50)
    
    # --- FIREWALL: CHỈ KIỂM TRA MÃ PIN NẾU SINH VIÊN TỰ ĐIỂM DANH (ONLINE) ---
    if request.is_online:
        session_info = active_sessions.get(request.class_id)
        if not session_info or not session_info["is_open"]:
            return {"status": "fail", "message": "Giảng viên chưa mở phiên điểm danh hoặc phiên đã kết thúc!"}
            
        if datetime.now() > session_info["end_time"]:
            del active_sessions[request.class_id] # Xoá session quá hạn
            return {"status": "fail", "message": "Đã hết thời gian điểm danh!"}
            
        if request.pin_code != session_info["pin_code"]:
            return {"status": "fail", "message": "Mã PIN không chính xác. Vui lòng xem trên màn hình Giảng viên!"}
    # ---------------------------------------------

    print("[INFO] Bat dau xu ly anh diem danh moi...")
    try:
        current_vector = face_tool.get_embedding(request.image_base64)
        if not current_vector:
            print("[WARNING] Khong tim thay khuon mat trong khung hinh. Bo qua.")
            return {"status": "fail", "message": "Không tìm thấy khuôn mặt trong khung hình!"}

        print("[INFO] Trich xuat dac trung khuon mat thanh cong. Dang truy van co so du lieu...")
        vector_str = f"[{','.join(map(str, current_vector))}]"
        
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        search_query = """
            SELECT student_id, 
                   LEAST(
                       COALESCE((REPLACE(REPLACE(vector_straight::text, '{', '['), '}', ']')::vector <=> %s::vector), 2.0),
                       COALESCE((REPLACE(REPLACE(vector_left::text, '{', '['), '}', ']')::vector <=> %s::vector), 2.0),
                       COALESCE((REPLACE(REPLACE(vector_right::text, '{', '['), '}', ']')::vector <=> %s::vector), 2.0)
                   ) as distance 
            FROM faces_embedding 
            ORDER BY distance ASC LIMIT 1;
        """
        cur.execute(search_query, (vector_str, vector_str, vector_str))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            student_id, distance = result
            print(f"[INFO] Ket qua AI: Khuon mat khop nhat voi sinh vien [{student_id}]")
            print(f"[INFO] Do lech (Distance): {distance:.4f} (Nguong chap nhan: < 0.40)")
            
            # Sử dụng ngưỡng khắt khe 0.40 để đảm bảo độ chính xác tuyệt đối
            if distance < 0.40:
                print("[INFO] Khoang cach hop le. Tien hanh kiem tra dieu kien diem danh...")
                db_result = process_attendance_db(student_id, request.class_id, request.session_no, request.cutoff_time, db)
                
                if db_result == "ALREADY_CHECKED":
                    print("[INFO] Sinh vien da duoc diem danh truoc do. Bo qua gui email.")
                    return {"status": "fail", "message": "Bạn đã điểm danh môn này rồi!"}
                elif db_result:
                    print(f"[SUCCESS] Ghi nhan thanh cong. Kich hoat Websocket va gui Email cho sinh vien [{student_id}].")
                    
                    student_info = db.query(Account).filter(Account.username == student_id).first()
                    student_name = student_info.full_name if student_info else student_id
                    
                    class_info = db.query(Classes).filter(Classes.class_id == request.class_id).first()
                    if class_info:
                        subj_code = getattr(class_info, 'subject_id', '')
                        subj_name = getattr(class_info, 'subject_name', 'Lớp học')
                        # Ghép cả Mã môn và Tên môn (VD: IT004 - Lập trình Web)
                        class_name = f"{subj_code} - {subj_name}" if subj_code else subj_name
                    else:
                        class_name = "Lớp học"

                    absent_count = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.class_id == request.class_id, Attendance.status == 'vắng').count()

                    now = datetime.now()
                    background_tasks.add_task(send_warning_email_background, student_id, student_name, class_name, now.strftime("%d/%m/%Y %H:%M"), absent_count, db)

                    import json
                    await manager.broadcast(json.dumps({
                        "type": "ATTENDANCE_SUCCESS",
                        "student_id": db_result["student_id"],
                        "student_name": student_name,
                        "time": db_result["time"],
                        "status": db_result["status"]
                    }))
                    
                    return {"status": "success", "message": "Điểm danh khuôn mặt thành công!", "student_id": student_id}
                else:
                    print("[WARNING] Nhan dien thanh cong nhung sinh vien khong nam trong danh sach lop hoc nay.")
                    return {"status": "fail", "message": "Khuôn mặt hợp lệ nhưng bạn KHÔNG thuộc lớp này!"}
            else:
                print("[WARNING] Tu choi nhan dien. Do lech vuot qua nguong cho phep (> 0.40).")
                return {"status": "fail", "message": "Khuôn mặt không khớp với cơ sở dữ liệu!"}
        else:
            print("[ERROR] Co so du lieu hien tai chua co bat ky du lieu khuon mat nao.")
            return {"status": "fail", "message": "Chưa có bất kỳ dữ liệu khuôn mặt nào trong hệ thống!"}

    except Exception as e:
        print(f"[CRITICAL] Loi he thong trong qua trinh xu ly co so du lieu: {str(e)}")
        db.rollback()
        return {"status": "error", "message": str(e)}

# ==========================================
# 5. API ĐIỂM DANH TẬP THỂ
# ==========================================
@router.post("/check-attendance-group")
async def check_attendance_group(request: AttendanceRequest, db: Session = Depends(get_db)):
    try:
        face_vectors_list = face_tool.get_multiple_embeddings(request.image_base64) 
        if not face_vectors_list:
            return {"status": "fail", "message": "Không tìm thấy khuôn mặt nào trong ảnh!"}

        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        recognized_count = 0

        for current_vector in face_vectors_list:
            vector_str = f"[{','.join(map(str, current_vector))}]"
            
            search_query = """
                SELECT student_id, 
                    LEAST(
                        COALESCE((REPLACE(REPLACE(vector_straight::text, '{', '['), '}', ']')::vector <=> %s::vector), 2.0),
                        COALESCE((REPLACE(REPLACE(vector_left::text, '{', '['), '}', ']')::vector <=> %s::vector), 2.0),
                        COALESCE((REPLACE(REPLACE(vector_right::text, '{', '['), '}', ']')::vector <=> %s::vector), 2.0)
                    ) as distance 
                FROM faces_embedding 
                ORDER BY distance ASC LIMIT 1;
            """
            cur.execute(search_query, (vector_str, vector_str, vector_str))
            result = cur.fetchone()

            if result:
                student_id, distance = result
                # Sử dụng ngưỡng 0.40 đồng nhất với điểm danh cá nhân
                if distance < 0.40: 
                    db_result = process_attendance_db(student_id, request.class_id, request.session_no, request.cutoff_time, db)
                    if db_result and db_result != "ALREADY_CHECKED":
                        recognized_count += 1
                        import json
                        await manager.broadcast(json.dumps({
                            "type": "ATTENDANCE_SUCCESS",
                            "student_id": db_result["student_id"],
                            "time": db_result["time"],
                            "status": db_result["status"]
                        }))

        cur.close()
        conn.close()
        return {"status": "success", "recognized_count": recognized_count, "message": f"Đã điểm danh thành công {recognized_count} sinh viên!"}

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

# ==========================================
# 6. API ĐĂNG KÝ KHUÔN MẶT MỚI
# ==========================================
@router.post("/register-face")
async def register_face(request: RegisterFaceRequest, db: Session = Depends(get_db)):
    student_id = request.student_id
    try:
        v_straight = get_avg_vector(request.images.straight)
        v_left = get_avg_vector(request.images.left)
        v_right = get_avg_vector(request.images.right)

        if not v_straight:
            raise HTTPException(status_code=400, detail="Không thể trích xuất vector khuôn mặt nhìn thẳng")

        new_record = Faces_embedding(
            student_id=student_id,
            vector_straight=format_pgvector(v_straight),
            vector_left=format_pgvector(v_left),
            vector_right=format_pgvector(v_right)
        )
        db.add(new_record)
        db.commit()
        return {"status": "success", "message": f"Đã lưu khuôn mặt cho sinh viên {student_id}"}

    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

# ==========================================
# 7. API LẤY DANH SÁCH SINH VIÊN & LỚP HỌC
# ==========================================
@router.get("/classes")
async def get_all_classes(db: Session = Depends(get_db)):
    try:
        classes_data = db.query(Classes).all()
        result = []
        for c in classes_data:
            result.append({
                "class_id": c.class_id, 
                "subject_id": getattr(c, 'subject_id', ''), 
                "group_id": getattr(c, 'group_id', ''),
                "sub_id": getattr(c, 'sub_id', ''), 
                "semester": getattr(c, 'semester', ''), 
                "subject_name": getattr(c, 'subject_name', 'Lập trình Web')
            })
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"[ERROR] Loi lay danh sach lop: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.get("/class-students/{class_id}")
async def get_class_students(class_id: int, db: Session = Depends(get_db)):
    try:
        students_in_class = db.query(
            Enrollments.student_id, Account.full_name
        ).join(Students, Enrollments.student_id == Students.student_id)\
         .join(Account, Students.student_id == Account.username)\
         .filter(Enrollments.class_id == class_id).all()

        result = [{"stt": idx + 1, "student_id": stu.student_id, "full_name": stu.full_name or "Chưa cập nhật"} 
                  for idx, stu in enumerate(students_in_class)]
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# ==========================================
# 8. KIỂM TRA TRẠNG THÁI KHUÔN MẶT
# ==========================================
@router.get("/check-face-status/{student_id}")
async def check_face_status(student_id: str, db: Session = Depends(get_db)):
    try:
        record = db.query(Faces_embedding).filter(Faces_embedding.student_id == student_id).first()
        if not record:
            return {"status": "success", "is_registered": False}
        
        if record.created_at:
            days_diff = (datetime.now() - record.created_at).days
            days_left = 90 - days_diff 
            is_expired = days_left <= 0
        else:
            days_left = 0
            is_expired = True

        return {
            "status": "success", 
            "is_registered": True,
            "created_at": record.created_at.strftime("%d/%m/%Y") if record.created_at else "Cũ",
            "days_left": max(0, days_left),
            "is_expired": is_expired
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
# ==========================================
# 9. API THỐNG KÊ ĐIỂM DANH CHO GIẢNG VIÊN
# ==========================================
@router.get("/class/{class_id}/summary")
async def get_class_summary(class_id: int, db: Session = Depends(get_db)):
    """API tính tổng số buổi Có mặt, Vắng, Trễ của toàn lớp"""
    try:
        enrollments = db.query(Enrollments).filter(Enrollments.class_id == class_id).all()
        result = []

        for enroll in enrollments:
            student_id = enroll.student_id
            student_info = db.query(Account).filter(Account.username == student_id).first()
            full_name = student_info.full_name if student_info else student_id

            present = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.class_id == class_id, Attendance.status == 'có mặt').count()
            absent = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.class_id == class_id, Attendance.status == 'vắng').count()
            late = db.query(Attendance).filter(Attendance.student_id == student_id, Attendance.class_id == class_id, Attendance.status == 'trễ').count()

            result.append({
                "student_id": student_id,
                "full_name": full_name,
                "present_count": present,
                "absent_count": absent,
                "late_count": late
            })
        return result
    except Exception as e:
        print(f"[ERROR] Loi Thong ke: {e}")
        return []

@router.get("/student/{student_id}/attendance-stats/{class_id}")
async def get_student_detail(student_id: str, class_id: int, db: Session = Depends(get_db)):
    """API xem chi tiết lịch sử điểm danh của 1 sinh viên khi nháy đúp chuột"""
    try:
        records = db.query(Attendance).filter(
            Attendance.student_id == student_id, 
            Attendance.class_id == class_id
        ).order_by(Attendance.session_no).all()
        
        history = []
        for r in records:
            history.append({
                "session_no": r.session_no,
                "status": r.status,
                "time": r.time.strftime("%d/%m/%Y %H:%M:%S") if r.time else None
            })
            
        return {
            "history": history,
            "summary": {"tổng_buổi": len(history)}
        }
    except Exception as e:
        print(f"[ERROR] Loi Chi tiet Sinh vien: {e}")
        return {"history": [], "summary": {}}
    
# ==========================================
# 10. API C