from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Neon database connection string; override with DATABASE_URL in .env or environment
DEFAULT_DATABASE_URL = "postgresql://neondb_owner:npg_W5QhsgdFI6lc@ep-round-butterfly-aqjvcjnd-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

# SQLALCHEMY_DATABASE_URL = "postgresql://postgres:nckh%40HTN@localhost:5433/postgres"
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

        