from fastapi import FastAPI, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from database import crud, models
from database.database import SessionLocal, engine

app = FastAPI()

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