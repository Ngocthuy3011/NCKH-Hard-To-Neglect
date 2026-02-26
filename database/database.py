from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# CHỈNH SỬA TẠI ĐÂY: Thay đổi user, password, port tương ứng với file docker-compose của bạn
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:nckh%40HTN@localhost:5433/postgres"

# Động cơ kết nối
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Quản lý phiên làm việc (Session)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Khuôn mẫu chung cho các bảng dữ liệu
Base = declarative_base()

# Hàm lấy quyền truy cập database (Dùng cho FastAPI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()