from sqlalchemy import Column, String, Boolean, Integer, ARRAY, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from db import Base # Import Base từ file database.py vừa tạo
from datetime import datetime

try:
    from pgvector.sqlalchemy import Vector
except:
    Vector = None


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100))
    full_name = Column(String(100))
    role = Column(String(20), default='student') # Khớp với user_role trong SQL

    # Liên kết ngược lại với sinh viên
    student = relationship("Students", back_populates="account", uselist=False)
    teacher = relationship("Teachers", back_populates="account", uselist=False)

class Major(Base):
    __tablename__ = "majors"
    major_code = Column(String(20), primary_key=True)
    major_name = Column(String(100), nullable=False)
    department_name = Column(String(100))
    
    students = relationship("Students", back_populates="major")

#BẢNG LƯU THÔNG TIN SINH VIÊN
class Students(Base):
    __tablename__ = 'students'
    #MSSV
    student_id = Column(String(20), ForeignKey("accounts.username", ondelete="CASCADE"), 
                        primary_key= True, nullable= False)
    
    class_name = Column(String(20)) #Lớp cố định vd:24050302
    #Mã ngành
    major_code = Column(String(20), ForeignKey("majors.major_code", ondelete="SET NULL")) #tạm thời khai báo bình thường
    #Tình trạng: Mặc định đang học
    is_active = Column(Boolean, default = True)
    #Thời gian tạo
    created_at = Column(DateTime, default = datetime.now)

    # Relationships
    account = relationship("Account", back_populates="student")
    major = relationship("Major", back_populates="students")
    faces = relationship("Faces_embedding", back_populates="student", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="student")

#Bảng lưu thông tin của giảng viên
# BẢNG LƯU THÔNG TIN GIẢNG VIÊN
class Teachers(Base):
    __tablename__ = 'teachers'

    # ID giảng viên (thường dùng mã giảng viên làm username luôn)
    teacher_id = Column(String(50), ForeignKey("accounts.username", ondelete="CASCADE"), 
                        primary_key=True, nullable=False)
    
    department = Column(String(100))     # Khoa (Ví dụ: Công nghệ thông tin)
    degree = Column(String(50))         # Học vị (Ví dụ: Thạc sĩ, Tiến sĩ)
    phone_number = Column(String(15))   # Số điện thoại liên lạc
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

    # Relationships - Liên kết ngược lại với tài khoản
    account = relationship("Account", back_populates="teacher")
    # Liên kết với các lớp học mà thầy/cô này dạy
    classes = relationship("Classes", back_populates="teacher_rel")
    
#Bảng môn học
class Subject(Base):
    __tablename__ = "subjects"

    subject_id = Column(String(20), primary_key=True) #Mã MH
    subject_name = Column(String(200), nullable=False) #Tên môn
    created_at = Column(DateTime, default=datetime.now)

# Bảng thông tin các lớp học (classes)
class Classes(Base):
    __tablename__ = "classes"

    class_id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(String(20), nullable=False)
    group_id = Column(Integer, nullable=False)
    sub_id = Column(Integer, nullable=True)
    
    teacher_id = Column(String(50), ForeignKey("teachers.teacher_id"))
    semester = Column(String(20), nullable=False)

    teacher_rel = relationship("Teachers", back_populates="classes")
    enrollments = relationship("Enrollments", back_populates="class_obj")

class Enrollments(Base):
    __tablename__ = 'enrollments'

    # Khóa chính kết hợp từ 2 cột
    student_id = Column(String(20), ForeignKey("students.student_id"), primary_key=True)
    class_id = Column(Integer, ForeignKey("classes.class_id"), primary_key=True)
    enrollment_date = Column(DateTime, default=datetime.now().date)
    status = Column(String(20), default="active")

    class_obj = relationship("Classes", back_populates="enrollments")
    student_obj = relationship("Students")

#Bảng lưu vector khuôn mặt
class Faces_embedding(Base):
    __tablename__ = 'faces_embedding'
    #STT tự động tăng dần
    id = Column(Integer,primary_key=True, autoincrement=True)

    #Mỗi SV cần nhiều ảnh nên không dùng MSSV làm khóa chính
    student_id = Column(String(20), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False) #MSSV
    if Vector:
        vector_straight = Column(Vector(512), nullable=True)
        vector_left = Column(Vector(512), nullable=True)
        vector_right = Column(Vector(512), nullable=True)
    else:
        vector_straight = Column(String, nullable=True)
        vector_left = Column(String, nullable=True)
        vector_right = Column(String, nullable=True)
    # image_url = Column(Text) #Đường dẫn đến ảnh được embedding
    created_at = Column(DateTime, default=datetime.now)

    student = relationship("Students", back_populates="faces")

#BẢNG LỊCH SỬ ĐIỂM DANH
class Attendance(Base):
    __tablename__ = 'attendance'

    #STT tăng dần
    id = Column(Integer, primary_key= True, autoincrement=True)

    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=False)
    #Mã môn học
    class_id = Column(Integer, ForeignKey("classes.class_id"), nullable=False)
    time = Column(DateTime, default=datetime.now)
    status = Column(String(20), default='vắng')
    session_no = Column(Integer, default = 1)

    #Mối quan hệ giúp truy xuất dữ liệu thông minh
    student = relationship("Students", back_populates="attendances")
