from sqlalchemy.orm import Session
import models
from sqlalchemy import func

# HÀM THÊM MỚI TỔNG QUÁT
def create_item(db: Session, model_class, schema_data):
    """
    Dùng cho: Thêm Account, Student, Class, Major... bất cứ bảng nào.
    - model_class: Là Class trong models.py (ví dụ: models.Account)
    - schema_data: Dữ liệu bạn muốn thêm (dạng dict hoặc Pydantic object)
    """
    # Chuyển dữ liệu thành object của SQLAlchemy
    db_item = model_class(**schema_data) 
    
    db.add(db_item) #Thêm vào hàng đợi
    db.commit()  #Thêm vào data
    db.refresh(db_item) #Cập nhật
    return db_item

def get_lecturer_classes(db: Session, teacher_name: str):
    # Lọc danh sách lớp dựa trên tên giảng viên trong bảng Classes
    return db.query(
        models.Classes.class_id,
        models.Classes.subject_id, # Mã MH
        models.Classes.group_id,   # Nhóm
        models.Classes.sub_id,     # Tổ
        models.Classes.semester    # Học kỳ
    ).filter(models.Classes.teacher_name == teacher_name).all()

#Hàm trả về danh sách sinh viên điểm danh trong buổi học
def get_attendance_detail_by_session(db: Session, class_id: int, session_no: int):
    """
    Lấy danh sách chi tiết điểm danh của một buổi học cụ thể.
    Trả về: MSSV, Họ tên, Trạng thái, Thời gian điểm danh.
    """
    # Bắt đầu từ bảng Enrollments để đảm bảo hiện đủ tất cả SV trong lớp
    results = db.query(
        models.Students.student_id,
        models.Account.full_name,
        models.Attendance.status,
        models.Attendance.time
    ).join(
        models.Account, models.Students.student_id == models.Account.username
    ).join(
        models.Enrollments, models.Students.student_id == models.Enrollments.student_id
    ).outerjoin(
        # Outerjoin với Attendance lọc theo class_id và session_no cụ thể
        models.Attendance, 
        (models.Attendance.student_id == models.Students.student_id) & 
        (models.Attendance.class_id == class_id) &
        (models.Attendance.session_no == session_no)
    ).filter(
        models.Enrollments.class_id == class_id
    ).all()
    
    return results

#    Thống kê tổng số buổi đi học, vắng, trễ của từng sinh viên trong một lớp cụ thể.
def get_class_attendance_summary(db: Session, class_id: int):

    # 1. Bắt đầu từ bảng Account để lấy tên, JOIN qua Students và Enrollments
    query = db.query(
        models.Students.student_id,
        models.Account.full_name, # Lấy tên đầy đủ từ bảng Account
        # Đếm số lần trạng thái là 'đi học'
        func.count(models.Attendance.id).filter(models.Attendance.status == 'đi học').label('present_count'),
        # Đếm số lần trạng thái là 'vắng'
        func.count(models.Attendance.id).filter(models.Attendance.status == 'vắng').label('absent_count'),
        # Đếm số lần trạng thái là 'trễ'
        func.count(models.Attendance.id).filter(models.Attendance.status == 'trễ').label('late_count')
    ).join(
        models.Account, models.Students.student_id == models.Account.username
    ).join(
        models.Enrollments, models.Students.student_id == models.Enrollments.student_id
    ).outerjoin(
        # Outerjoin giúp hiện cả những SV chưa bao giờ được điểm danh (số lượng = 0)
        models.Attendance, 
        (models.Attendance.student_id == models.Students.student_id) & 
        (models.Attendance.class_id == class_id)
    ).filter(
        models.Enrollments.class_id == class_id
    ).group_by(
        models.Students.student_id, models.Account.full_name
    ).all()

    return query

# HÀM LẤY DANH SÁCH TỔNG QUÁT
def get_all_items(db: Session, model_class, skip: int = 0, limit: int = 100):
    """Lấy danh sách cho bất kỳ bảng nào"""
    return db.query(model_class).offset(skip).limit(limit).all()