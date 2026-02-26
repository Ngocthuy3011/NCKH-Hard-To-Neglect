from sqlalchemy import Column, String, Boolean, Integer, ARRAY, Float, DateTime, ForeignKey, Text
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from database import Base # Import Base từ file database.py vừa tạo
from datetime import datetime

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100))
    full_name = Column(String(100))
    role = Column(String(20), default='student') # Khớp với user_role trong SQL

    # Liên kết ngược lại với sinh viên
    student = relationship("Student", back_populates="account", uselist=False)

#BẢNG LƯU THÔNG TIN SINH VIÊN
class Students(Base):
    __tablename__ = 'students'
    #MSSV
    student_id = Column(String(20), ForeignKey("accounts.username", ondelete="CASCADE"), 
                        primary_key= True, nullable= False)
    
    class_name = Column(String(20)) #Lớp cố định vd:24050302
    #Mã ngành
    major_code = Column(String(20)) #tạm thời khai báo bình thường
    #Tình trạng: Mặc định đang học
    is_active = Column(Boolean, default = True)
    #Thời gian tạo
    created_at = Column(DateTime, default = datetime.now)

    # Relationships
    account = relationship("Account", back_populates="student")
    faces = relationship("FaceEmbedding", back_populates="student", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="student")

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
    teacher_name = Column(String(100), nullable=False)
    semester = Column(String(20), nullable=False)

#Bảng lưu vector khuôn mặt
class Faces_embedding(Base):
    __tablename__ = 'faces_embedding'
    #STT tự động tăng dần
    id = Column(Integer,primary_key=True, autoincrement=True)

    #Mỗi SV cần nhiều ảnh nên không dùng MSSV làm khóa chính
    student_id = Column(String(20), ForeignKey("students.student_code", ondelete="CASCADE"), nullable=False) #MSSV
    face_vector = Column(Vector(512), nullable=False) 
    image_url = Column(Text) #Đường dẫn đến ảnh được embedding
    create_at = Column(DateTime, default=datetime.now)
    student = relationship("Student", back_populates="faces")

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

    #Mối quan hệ giúp truy xuất dữ liệu thông minh
    student = relationship("Student", back_populates="attendances")



