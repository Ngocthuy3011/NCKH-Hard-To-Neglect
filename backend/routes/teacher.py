from fastapi import APIRouter, Depends, WebSocket, HTTPException, Body
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from database import crud, models
from database.db import get_db
from utils.jwt_handler import decode_token
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

router = APIRouter()
# --- ROUTES CHO GIẢNG VIÊN ---

@router.get("/lecturer/classes")
def read_lecturer_classes_current(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Lấy danh sách các lớp giảng viên hiện tại dạy"""
    teacher_id = current_user.get("sub")
    classes = crud.get_lecturer_classes(db, teacher_id=teacher_id)
    return jsonable_encoder(classes)

@router.get("/lecturer/{teacher_id}/classes")
def read_lecturer_classes(teacher_id: str, db: Session = Depends(get_db)):
    """Lấy danh sách các lớp giảng viên đó dạy"""
    classes = crud.get_lecturer_classes(db, teacher_id=teacher_id)
    return jsonable_encoder(classes)

@router.get("/class/{class_id}/session/{session_no}")
def read_attendance_by_session(class_id: int, session_no: int, db: Session = Depends(get_db)):
    """Chi tiết điểm danh của một buổi học cụ thể"""
    details = crud.get_attendance_detail_by_session(db, class_id, session_no)
    return jsonable_encoder(details)

@router.get("/class/{class_id}/students")
def read_class_students(class_id: int, db: Session = Depends(get_db)):
    """Danh sách sinh viên của một lớp"""
    students = crud.get_class_students(db, class_id=class_id)
    return jsonable_encoder(students)

@router.post("/class")
def create_class(class_data: dict = Body(...), db: Session = Depends(get_db)):
    """Tạo mới lớp học và có thể thêm sinh viên từ Excel"""
    new_class = crud.create_class(db, class_data)
    if not new_class:
        raise HTTPException(status_code=400, detail="Không thể tạo lớp mới")
    if class_data.get("students"):
        crud.bulk_create_students_and_enroll(db, new_class.class_id, class_data.get("students"))
    return jsonable_encoder({"class": new_class, "message": "Lớp đã được tạo"})

@router.put("/class/{class_id}")
def update_class(class_id: int, update_data: dict = Body(...), db: Session = Depends(get_db)):
    """Cập nhật thông tin lớp học"""
    updated = crud.update_class(db, class_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")
    return jsonable_encoder({"class": updated, "message": "Cập nhật lớp thành công"})

# ==========================================
# API XÓA LỚP HỌC (VỪA THÊM VÀO)
# ==========================================
@router.delete("/class/{class_id}")
def delete_class_endpoint(class_id: int, db: Session = Depends(get_db)):
    """Xóa lớp học và các dữ liệu liên quan"""
    try:
        success = crud.delete_class(db, class_id)
        if success:
            return jsonable_encoder({"status": "success", "message": "Đã xóa lớp thành công"})
        else:
            raise HTTPException(status_code=404, detail="Không tìm thấy lớp học này")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Không thể xóa lớp: {str(e)}")

@router.put("/student/{student_id}")
def update_student(student_id: str, update_data: dict = Body(...), db: Session = Depends(get_db)):
    """Cập nhật hoặc tạo sinh viên, kèm enroll vào lớp nếu cần"""
    student = crud.update_student(db, student_id, update_data)
    if not student:
        raise HTTPException(status_code=400, detail="Không thể cập nhật sinh viên")
    return jsonable_encoder({"student": student, "message": "Cập nhật sinh viên thành công"})

@router.get("/class/{class_id}/summary")
def read_class_attendance_summary(class_id: int, db: Session = Depends(get_db)):
    """Bảng tổng kết chuyên cần của cả lớp (Vắng/Trễ/Đi học)"""
    summary = crud.get_class_attendance_summary(db, class_id)
    return jsonable_encoder(summary)


# --- ROUTES CHO SINH VIÊN ---

@router.get("/student/{student_id}/enrolled-classes")
def read_student_enrolled_classes(student_id: str, db: Session = Depends(get_db)):
    """Danh sách các lớp sinh viên ĐANG học (active)"""
    classes = crud.get_student_enrolled_classes(db, student_id)
    return jsonable_encoder(classes)

@router.get("/student/{student_id}/enrollment-history")
def read_student_history(student_id: str, db: Session = Depends(get_db)):
    """Lịch sử tất cả các môn đã và đang học của sinh viên"""
    history = crud.get_student_enrollment_history(db, student_id)
    return jsonable_encoder(history)

@router.get("/student/{student_id}/attendance-stats/{class_id}")
def read_student_attendance_stats(student_id: str, class_id: int, db: Session = Depends(get_db)):
    """Thống kê chi tiết điểm danh của 1 sinh viên trong 1 lớp"""
    stats = crud.get_student_attendance_status(db, student_id, class_id)
    return jsonable_encoder(stats)


# --- ROUTE TỔNG QUÁT ---

@router.get("/get-all/{table_name}")
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

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Một số thư viện yêu cầu kiểm tra check_origin
    await websocket.accept()