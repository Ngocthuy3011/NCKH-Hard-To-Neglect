from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime

from database.db import get_db
from database.models import Enrollments, Classes, Subject, Attendance
from utils.jwt_handler import decode_token

router = APIRouter()

# ===== HÀM BẢO MẬT: TRÍCH XUẤT MSSV TỪ TOKEN =====
def get_current_student(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Thiếu hoặc sai định dạng Token")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token) # Giải mã Token
    
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")
    
    return payload["sub"] # Trả về username (chính là mssv)


# ===== API 1: LẤY LỊCH HỌC HÔM NAY (PHIÊN BẢN DEBUG) =====
@router.get("/schedule/today")
def get_today_schedule(mssv: str = Depends(get_current_student), db: Session = Depends(get_db)):
    print("\n========== 🕵️ BẮT ĐẦU QUÉT DỮ LIỆU ==========")
    print(f"1. MSSV đang gọi API từ React: '{mssv}'")
    
    enrollments = db.query(Enrollments, Classes, Subject)\
        .join(Classes, Enrollments.class_id == Classes.class_id)\
        .join(Subject, Classes.subject_id == Subject.subject_id)\
        .filter(Enrollments.student_id == mssv, Enrollments.status == "active")\
        .all()

    print(f"2. Số môn học tìm thấy trong CSDL: {len(enrollments)} môn")
    print("============================================\n")

    schedule = []
    for enr, cls, sub in enrollments:
        schedule.append({
            "id": cls.class_id,
            "subject_id": sub.subject_id,
            "name": sub.subject_name,
            "group": cls.group_id,
            "semester": cls.semester,
            "teacher_id": cls.teacher_id,
            "time": "07:30 - 09:30", 
            "room": "Phòng A1.01",   
            "status": "pending" 
        })
    return schedule


@router.get("/student/summary")
def get_student_summary(mssv: str = Depends(get_current_student), db: Session = Depends(get_db)):
    """API lấy tổng quan điểm danh của sinh viên hiện tại."""
    total_enrolled = db.query(Enrollments).filter(
        Enrollments.student_id == mssv,
        Enrollments.status == "active"
    ).count()

    present_count = db.query(Attendance).filter(
        Attendance.student_id == mssv,
        Attendance.status == 'có mặt'
    ).count()
    absent_count = db.query(Attendance).filter(
        Attendance.student_id == mssv,
        Attendance.status == 'vắng'
    ).count()
    late_count = db.query(Attendance).filter(
        Attendance.student_id == mssv,
        Attendance.status == 'trễ'
    ).count()

    total_attendance = present_count + absent_count + late_count
    attendance_rate = f"{round((present_count / total_attendance) * 100)}%" if total_attendance else "0%"

    return {
        "total_enrolled": total_enrolled,
        "present_count": present_count,
        "absent_count": absent_count,
        "late_count": late_count,
        "total_attendance": total_attendance,
        "attendance_rate": attendance_rate
    }


# ===== API 2: LẤY LỊCH SỬ ĐIỂM DANH =====
@router.get("/attendance/history")
def get_attendance_history(mssv: str = Depends(get_current_student), db: Session = Depends(get_db)):
    # Lấy lịch sử từ bảng Attendance (kết nối Attendance -> Classes -> Subject)
    history = db.query(Attendance, Classes, Subject)\
        .join(Classes, Attendance.class_id == Classes.class_id)\
        .join(Subject, Classes.subject_id == Subject.subject_id)\
        .filter(Attendance.student_id == mssv)\
        .order_by(Attendance.time.desc())\
        .all()

    records = []
    for att, cls, sub in history:
        records.append({
            "subject_id": sub.subject_id,
            "subject_name": sub.subject_name,
            "date": att.time.strftime("%d/%m/%Y"),
            "time_logged": att.time.strftime("%H:%M"),
            "status": att.status, # 'có mặt' hoặc 'vắng'
            "session_no": att.session_no
        })
        
    return records