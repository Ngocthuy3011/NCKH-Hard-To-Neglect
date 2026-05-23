from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import models, crud, db
from fastapi import FastAPI

app = FastAPI()  # Dòng này cực kỳ quan trọng, uvicorn tìm chữ 'app' ở đây

@app.get("/")
async def root():
    return {"message": "Hello World"}

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# --- CỔNG 1: ĐIỂM DANH TỰ ĐỘNG (Dành cho AI của Thắng) ---
@router.post("/auto")
async def attendance_auto(student_code: str, class_id: int, session: int, db: Session = Depends(db.get_db)):
    # 1. Kiểm tra xem sinh viên có trong danh sách lớp (enrollments) không
    is_enrolled = db.query(models.Enrollments).filter(
        models.Enrollments.student_id == student_code,
        models.Enrollments.class_id == class_id
    ).first()

    if not is_enrolled:
        return {"status": "error", "message": "Sinh viên không có tên trong lớp này"}

    # 2. KIỂM TRA TRÙNG: Nếu đã có bản ghi điểm danh buổi này rồi thì dừng
    already_checked = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_code,
        models.Attendance.class_id == class_id,
        models.Attendance.session_no == session  # Thêm dòng này để phân biệt ca sáng/chiều
    ).first()

    if already_checked:
        return {"status": "info", "message": "Sinh viên này đã được điểm danh trước đó"}

    # 3. Nếu chưa có thì mới tiến hành điểm danh "đi học"
    data_to_save = {
        "student_id": student_code,
        "class_id": class_id,
        "status": "đi học",
        "session_no": session
    }
    return crud.create_item(db, models.Attendance, data_to_save)


# --- CỔNG 2: ĐIỂM DANH THỦ CÔNG (Dành cho Giảng viên) ---
@router.post("/manual")
async def attendance_manual(student_code: str, class_id: int, status: str, session: int, db: Session = Depends(db.get_db)):
    # 1. Vẫn phải kiểm tra xem SV có thuộc lớp không để tránh giảng viên chọn nhầm người lớp khác
    is_enrolled = db.query(models.Enrollments).filter(
        models.Enrollments.student_id == student_code,
        models.Enrollments.class_id == class_id
    ).first()
    
    if not is_enrolled:
        raise HTTPException(status_code=400, detail="Sinh viên không thuộc danh sách lớp này")

    # 2. Kiểm tra xem bản ghi điểm danh đã tồn tại chưa
    attendance_record = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_code,
        models.Attendance.class_id == class_id,
        models.Attendance.session_no == session
    ).first()

    if attendance_record:
        # TRƯỜNG HỢP CẬP NHẬT: (Ví dụ: từ 'vắng' hoặc 'chưa có' thành 'đi học' hoặc 'trễ')
        attendance_record.status = status
        db.commit()
        db.refresh(attendance_record)
        return {"status": "success", "message": f"Đã cập nhật trạng thái {status} cho SV {student_code}"}
    else:
        # TRƯỜNG HỢP TẠO MỚI: (Nếu giảng viên điểm danh trước khi AI quét hoặc trước khi chốt danh sách)
        data_to_save = {
        "student_id": student_code,
        "class_id": class_id,
        "status": status,
        "session_no": session
        }
        return crud.create_item(db, models.Attendance, data_to_save)


# --- CỔNG 3: CHỐT DANH SÁCH (Tự động đánh vắng) ---
@router.post("/finalize/{class_id}")
async def finalize(class_id: int, session: int, db: Session = Depends(db.get_db)):
    # 1. Lấy danh sách từ bảng Enrollment vì đây mới là danh sách lớp thực tế
    class_enrollments = db.query(models.Enrollments).filter(models.Enrollments.class_id == class_id).all()

    # 3. Lấy danh sách những bạn ĐÃ có mặt trong bảng attendance
    present_student_ids = db.query(models.Attendance.student_id).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.session_no == session
    ).all()
    present_ids = [r[0] for r in present_student_ids]

    # 4. Những ai có tên trong lớp nhưng chưa có trong present_ids thì thêm vào với status="vắng"
    absent_count = 0
    for student in class_enrollments:
        if student.student_id not in present_ids:
            data_to_save = {
                "student_id": student.student_id,
                "class_id": class_id,
                "status": "vắng",
                "session_no": session
            }
            crud.create_item(db, models.Attendance, data_to_save)
            absent_count += 1
            
    return {"message": f"Đã chốt danh sách. Có {absent_count} sinh viên vắng."}