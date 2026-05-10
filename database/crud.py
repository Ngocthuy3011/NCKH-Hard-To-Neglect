from sqlalchemy.orm import Session
import models
from sqlalchemy import func
from fastapi.encoders import jsonable_encoder

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


def normalize_int(value):
    if value is None or value == '':
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def get_class_by_id(db: Session, class_id: int):
    return db.query(models.Classes).filter(models.Classes.class_id == class_id).first()


def create_subject_if_missing(db: Session, subject_id: str, subject_name: str):
    if not subject_id:
        return None
    subject = db.query(models.Subject).filter(models.Subject.subject_id == subject_id).first()
    if subject:
        if subject_name and subject.subject_name != subject_name:
            subject.subject_name = subject_name
            db.commit()
            db.refresh(subject)
        return subject
    subject = models.Subject(subject_id=subject_id, subject_name=subject_name or subject_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def create_class(db: Session, class_data: dict):
    create_subject_if_missing(db, class_data.get('subject_id'), class_data.get('subject_name'))
    normalized = {
        'subject_id': class_data.get('subject_id'),
        'group_id': normalize_int(class_data.get('group_id')) or 0,
        'sub_id': normalize_int(class_data.get('sub_id')),
        'teacher_id': class_data.get('teacher_id'),
        'semester': class_data.get('semester') or ''
    }
    new_class = models.Classes(**normalized)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class


def update_class(db: Session, class_id: int, update_data: dict):
    class_obj = get_class_by_id(db, class_id)
    if not class_obj:
        return None
    if update_data.get('subject_id'):
        class_obj.subject_id = update_data['subject_id']
    if update_data.get('subject_name'):
        create_subject_if_missing(db, update_data.get('subject_id'), update_data.get('subject_name'))
    if update_data.get('group_id') is not None:
        normalized_group = normalize_int(update_data.get('group_id'))
        if normalized_group is not None:
            class_obj.group_id = normalized_group
    if update_data.get('sub_id') is not None:
        class_obj.sub_id = normalize_int(update_data.get('sub_id'))
    if update_data.get('semester') is not None:
        class_obj.semester = update_data.get('semester')
    db.commit()
    db.refresh(class_obj)
    return class_obj


def update_student(db: Session, student_id: str, update_data: dict):
    if not student_id:
        return None
    account = db.query(models.Account).filter(models.Account.username == student_id).first()
    if not account:
        # Tạo tài khoản student mới nếu chưa tồn tại
        account = models.Account(username=student_id, password='123456', full_name=update_data.get('full_name') or '')
        db.add(account)
        db.commit()
        db.refresh(account)
    else:
        if update_data.get('full_name') is not None:
            account.full_name = update_data.get('full_name')
            db.commit()
            db.refresh(account)

    student = db.query(models.Students).filter(models.Students.student_id == student_id).first()
    if not student:
        student = models.Students(student_id=student_id, class_name=update_data.get('class_name'))
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        if update_data.get('class_name') is not None:
            student.class_name = update_data.get('class_name')
            db.commit()
            db.refresh(student)

    if update_data.get('class_id') is not None:
        class_id = normalize_int(update_data.get('class_id'))
        if class_id is not None:
            enrollment = db.query(models.Enrollments).filter(
                models.Enrollments.student_id == student_id,
                models.Enrollments.class_id == class_id
            ).first()
            if not enrollment:
                enrollment = models.Enrollments(student_id=student_id, class_id=class_id, status='active')
                db.add(enrollment)
                db.commit()
    return student


def bulk_create_students_and_enroll(db: Session, class_id: int, students: list):
    added = []
    for row in students:
        student_id = row.get('student_id') or row.get('MSSV') or row.get('mssv') or row.get('mã sinh viên')
        if not student_id:
            continue
        student_id = str(student_id).strip() if isinstance(student_id, str) else str(student_id)
        full_name = row.get('full_name') or row.get('fullName') or row.get('Họ và Tên') or row.get('name') or ''
        class_name = row.get('class_name') or row.get('className') or row.get('Lớp') or ''
        update_student(db, student_id, {'full_name': full_name, 'class_name': class_name, 'class_id': class_id})
        added.append(student_id)
    return added

#ROUTE CỦA GIẢNG VIÊN

def get_lecturer_classes(db: Session, teacher_id: str):
    """ 
    Truy xuất danh sách lớp kèm theo tên môn học bằng cách JOIN với bảng Subjects 
    """
    results = db.query(
        models.Classes,
        models.Subject.subject_name # Lấy thêm tên môn học
    ).join(
        models.Subject, 
        models.Classes.subject_id == models.Subject.subject_id
    ).filter(
        models.Classes.teacher_id == teacher_id
    ).all()

    # Chuyển đổi kết quả thành danh sách dict để dễ xử lý ở Frontend
    classes_with_names = []
    for row in results:
        cls_obj = row[0] # Đối tượng Classes
        subject_name = row[1] # Tên môn học lấy từ bảng Subjects
        
        # Tạo một dict chứa đầy đủ thông tin
        classes_with_names.append({
            "class_id": cls_obj.class_id,
            "subject_id": cls_obj.subject_id,
            "subject_name": subject_name,
            "group_id": cls_obj.group_id,
            "sub_id": cls_obj.sub_id,
            "semester": cls_obj.semester
        })
        
    return classes_with_names
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


def get_class_students(db: Session, class_id: int):
    """Lấy danh sách sinh viên của một lớp theo class_id."""
    results = db.query(
        models.Enrollments.student_id,
        models.Account.full_name,
        models.Students.class_name
    ).join(
        models.Students, models.Enrollments.student_id == models.Students.student_id
    ).join(
        models.Account, models.Students.student_id == models.Account.username
    ).filter(
        models.Enrollments.class_id == class_id
    ).all()

    return [
        {
            "student_id": r.student_id,
            "full_name": r.full_name,
            "class_name": r.class_name,
        }
        for r in results
    ]

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

    summary = []
    for row in query:
        present_count = int(row.present_count or 0)
        absent_count = int(row.absent_count or 0)
        late_count = int(row.late_count or 0)
        total_count = present_count + absent_count + late_count
        attendance_rate = f"{round((present_count / total_count) * 100)}%" if total_count > 0 else "0%"

        summary.append({
            "student_id": row.student_id,
            "full_name": row.full_name,
            "present_count": present_count,
            "absent_count": absent_count,
            "late_count": late_count,
            "total_count": total_count,
            "attendance_rate": attendance_rate,
        })

    return summary

#ROUTE CỦA SINH VIÊN
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
    ). outerjoin(
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

def get_student_attendance_status(db: Session, student_id: str, class_id: int):
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