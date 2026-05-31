from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")


SQLALCHEMY_DATABASE_URL = "postgresql://neondb_owner:npg_YyHMBoC3J4WL@ep-bitter-wind-a1be41ah-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
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

        