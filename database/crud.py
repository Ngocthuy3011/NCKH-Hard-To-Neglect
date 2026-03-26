from sqlalchemy.orm import Session
from database import models
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

def get_lecturer_classes(db: Session, teacher_id: str):
    # Lọc danh sách lớp dựa trên tên giảng viên trong bảng Classes
    return db.query(
        models.Classes.class_id,
        models.Classes.subject_id, # Mã MH
        models.Classes.group_id,   # Nhóm
        models.Classes.sub_id,     # Tổ
        models.Classes.semester    # Học kỳ
    ).filter(models.Classes.teacher_id == teacher_id).all()

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

# Thống kê tổng số buổi đi học, vắng, trễ của từng sinh viên trong một lớp cụ thể.
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

def get_student_enrolled_classes(db: Session, student_id: str):
    """
    Lấy danh sách các lớp học mà một sinh viên đang tham gia.
    """
    return db.query(
        models.Classes.class_id,
        models.Classes.subject_id,   # Mã môn học (ví dụ: IT001)
        models.Classes.group_id,     # Nhóm (ví dụ: 1)
        models.Classes.teacher_id, # Tên giảng viên
        models.Classes.semester      # Học kỳ
    ).join(
        models.Enrollments, 
        models.Classes.class_id == models.Enrollments.class_id
    ).filter(
        models.Enrollments.student_id == student_id,
        models.Enrollments.status == "active" # Chỉ lấy các lớp đang học
    ).all()

def get_student_enrollment_history(db: Session, student_id: str):
    """
    Thống kê tất cả các lớp (đã và đang học) của một sinh viên dựa trên student_id.
    """
    return db.query(
        models.Classes.class_id,
        models.Classes.subject_id,
        models.Subject.subject_name,  # Lấy tên môn học từ bảng Subjects
        models.Classes.group_id,
        models.Classes.semester,
        models.Enrollments.enrollment_date,
        models.Enrollments.status      # Để phân biệt đang học (active) hay đã xong
    ).join(
        models.Enrollments, 
        models.Classes.class_id == models.Enrollments.class_id
    ).join(
        models.Subject, 
        models.Classes.subject_id == models.Subject.subject_id
    ).filter(
        models.Enrollments.student_id == student_id
    ).order_by(
        models.Classes.semester.desc() # Sắp xếp học kỳ mới nhất lên đầu
    ).all()

def get_student_attendance_stats(db: Session, student_id: str, class_id: int):
    """
    Thống kê chi tiết lịch sử điểm danh và tổng hợp số buổi Vắng/Trễ/Hiện diện
    của một sinh viên trong một lớp cụ thể.
    """
    # 1. Lấy danh sách chi tiết các buổi điểm danh
    history = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.class_id == class_id
    ).order_by(models.Attendance.session_no.asc()).all()

    # 2. Truy vấn tổng hợp (Aggregation) để đếm số lượng từng loại trạng thái
    stats = db.query(
        models.Attendance.status,
        func.count(models.Attendance.id).label('count')
    ).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.class_id == class_id
    ).group_by(models.Attendance.status).all()

    # Chuyển kết quả count thành dictionary cho dễ dùng
    summary = {stat.status: stat.count for stat in stats}
    
    return {
        "history": history,
        "summary": {
            "vắng": summary.get("vắng", 0),
            "trễ": summary.get("trễ", 0),
            "có mặt": summary.get("có mặt", 0), # Giả sử bạn dùng tag này cho hiện diện
            "tổng_buổi": sum(summary.values())
        }
    }

# HÀM LẤY DANH SÁCH TỔNG QUÁT
def get_all_items(db: Session, model_class, skip: int = 0, limit: int = 100):
    """Lấy danh sách cho bất kỳ bảng nào"""
    return db.query(model_class).offset(skip).limit(limit).all()