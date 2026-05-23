from fastapi import FastAPI, Depends, WebSocket, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import crud, models
from db import SessionLocal, engine

app = FastAPI()
# Cấu hình danh sách các nguồn được phép truy cập
origins = [
    "http://localhost:5173",  # Cổng mặc định của Vite (theo ảnh của bạn)
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # Phòng hờ nếu bạn đổi cổng
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Cho phép các nguồn trong danh sách
    allow_credentials=True,
    allow_methods=["*"],        # Cho phép tất cả các phương thức (GET, POST,...)
    allow_headers=["*"],        # Cho phép tất cả các loại headers
)
# Hàm lấy kết nối DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# --- ROUTES CHO GIẢNG VIÊN ---

@app.get("/lecturer/{teacher_id}/classes")
def read_lecturer_classes(teacher_id: str, db: Session = Depends(get_db)):
    """Lấy danh sách các lớp giảng viên đó dạy"""
    classes = crud.get_lecturer_classes(db, teacher_id=teacher_id)
    return jsonable_encoder(classes)

@app.get("/class/{class_id}/session/{session_no}")
def read_attendance_by_session(class_id: int, session_no: int, db: Session = Depends(get_db)):
    """Chi tiết điểm danh của một buổi học cụ thể"""
    details = crud.get_attendance_detail_by_session(db, class_id, session_no)
    return jsonable_encoder(details)

@app.get("/class/{class_id}/students")
def read_class_students(class_id: int, db: Session = Depends(get_db)):
    """Danh sách sinh viên của một lớp"""
    students = crud.get_class_students(db, class_id=class_id)
    return jsonable_encoder(students)

@app.post("/class")
def create_class(class_data: dict = Body(...), db: Session = Depends(get_db)):
    """Tạo mới lớp học và có thể thêm sinh viên từ Excel"""
    new_class = crud.create_class(db, class_data)
    if not new_class:
        raise HTTPException(status_code=400, detail="Không thể tạo lớp mới")
    if class_data.get("students"):
        crud.bulk_create_students_and_enroll(db, new_class.class_id, class_data.get("students"))
    return jsonable_encoder({"class": new_class, "message": "Lớp đã được tạo"})

@app.put("/class/{class_id}")
def update_class(class_id: int, update_data: dict = Body(...), db: Session = Depends(get_db)):
    """Cập nhật thông tin lớp học"""
    updated = crud.update_class(db, class_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")
    return jsonable_encoder({"class": updated, "message": "Cập nhật lớp thành công"})

@app.put("/student/{student_id}")
def update_student(student_id: str, update_data: dict = Body(...), db: Session = Depends(get_db)):
    """Cập nhật hoặc tạo sinh viên, kèm enroll vào lớp nếu cần"""
    student = crud.update_student(db, student_id, update_data)
    if not student:
        raise HTTPException(status_code=400, detail="Không thể cập nhật sinh viên")
    return jsonable_encoder({"student": student, "message": "Cập nhật sinh viên thành công"})

@app.get("/class/{class_id}/summary")
def read_class_attendance_summary(class_id: int, db: Session = Depends(get_db)):
    """Bảng tổng kết chuyên cần của cả lớp (Vắng/Trễ/Đi học)"""
    summary = crud.get_class_attendance_summary(db, class_id)
    return jsonable_encoder(summary)


# --- ROUTES CHO SINH VIÊN ---

@app.get("/student/{student_id}/enrolled-classes")
def read_student_enrolled_classes(student_id: str, db: Session = Depends(get_db)):
    """Danh sách các lớp sinh viên ĐANG học (active)"""
    classes = crud.get_student_enrolled_classes(db, student_id)
    return jsonable_encoder(classes)

@app.get("/student/{student_id}/enrollment-history")
def read_student_history(student_id: str, db: Session = Depends(get_db)):
    """Lịch sử tất cả các môn đã và đang học của sinh viên"""
    history = crud.get_student_enrollment_history(db, student_id)
    return jsonable_encoder(history)

@app.get("/student/{student_id}/attendance-stats/{class_id}")
def read_student_attendance_stats(student_id: str, class_id: int, db: Session = Depends(get_db)):
    """Thống kê chi tiết điểm danh của 1 sinh viên trong 1 lớp"""
    stats = crud.get_student_attendance_status(db, student_id, class_id)
    return jsonable_encoder(stats)


# --- ROUTE TỔNG QUÁT ---

@app.get("/get-all/{table_name}")
def get_all_data(table_name: str, db: Session = Depends(get_db)):
    """Lấy toàn bộ dữ liệu của một bảng bất kỳ (Dùng cho Admin)"""
    # Bản đồ map tên bảng với Model
    table_map = {
        "accounts": models.Account,
        "students": models.Students,
        "teachers": models.Teachers,
        "subjects": models.Subject,
        "classes": models.Classes
    }
    
    model = table_map.get(table_name.lower())
    if not model:
        raise HTTPException(status_code=404, detail="Không tìm thấy bảng này")
        
    data = crud.get_all_items(db, model)
    return jsonable_encoder(data)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Một số thư viện yêu cầu kiểm tra check_origin
    await websocket.accept()