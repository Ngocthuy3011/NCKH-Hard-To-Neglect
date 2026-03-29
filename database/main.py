from fastapi import FastAPI, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from database import crud, models
from database.database import SessionLocal, engine

app = FastAPI()

# Hàm lấy kết nối DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/attendance-status/{student_id}/{class_id}")
def get_attendance_status(student_id: str, class_id: int, db: Session = Depends(get_db)):
    data = crud.get_student_attendance_status(db, student_id, class_id)
    # Dùng jsonable_encoder để biến dữ liệu thành JSON chuẩn cho web
    return jsonable_encoder(data)

@app.get("/api/lecturer_classes/{teacher_id}")
def get_lecturer_classes(teacher_id: str, db: Session = Depends(get_db)):
    data = crud.get_lecturer_classes(teacher_id)
    return data

def get_student_attendance_status(student_id: str, class_id: int, db: Session = Depends(get_db)):
    return crud.get_student_attendance_status(db, student_id, class_id)

@app.get("/api/student-history/{student_id}")
def get_history(student_id: str, db: Session = Depends(get_db)):
    history = crud.get_student_enrollment_history(db, student_id)
    return jsonable_encoder(history)