import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Thêm thư mục gốc NCKH vào hệ thống tìm kiếm
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from backend.database.db import SessionLocal
from database import models, crud

# 1. Khởi tạo session kết nối database
db = SessionLocal()

def test_classes():
    try:
        # 2. Gọi hàm mà Hiền muốn test
        # Ví dụ: test hàm lấy danh sách lớp của thầy 'Nguyễn Văn A'
        results = crud.get_lecturer_classes(db, teacher_name="Nguyễn Văn A")
        
        # 3. In kết quả ra màn hình để kiểm tra
        print(f"--- Tìm thấy {len(results)} lớp học ---")
        for c in results:
            print(f"ID: {c.class_id} | Môn: {c.subject_id} | Nhóm: {c.group_id}")

    finally:
        db.close() # Nhớ đóng kết nối

def test_summary():
    db = SessionLocal()
    try:
        # GIẢ SỬ: Hiền muốn test lớp có class_id = 1 (Thay bằng ID thực tế trong DB của bạn)
        target_class_id = 8
        
        print(f"--- ĐANG TRUY XUẤT THỐNG KÊ CHO LỚP ID: {target_class_id} ---")
        
        # Gọi hàm thống kê từ crud.py
        stats = crud.get_class_attendance_summary(db, class_id=target_class_id)
        
        if not stats:
            print("(!) Không tìm thấy dữ liệu sinh viên hoặc điểm danh cho lớp này.")
            return

        # In tiêu đề bảng
        print(f"{'MSSV':<12} | {'Họ và Tên':<25} | {'Học':<5} | {'Trễ':<5} | {'Vắng':<5}")
        print("-" * 65)

        for row in stats:
            # Lưu ý: Tên cột phải khớp với label() Hiền đặt trong crud.py
            print(f"{row.student_id:<12} | {row.full_name:<25} | {row.present_count:<5} | {row.late_count:<5} | {row.absent_count:<5}")

    except Exception as e:
        print(f"Xảy ra lỗi khi test: {e}")
    finally:
        db.close()

def test_session_detail():
    db = SessionLocal()
    try:
        # THÔNG SỐ TEST: Hiền hãy chỉnh ID lớp và số buổi cho khớp với DB của bạn nhé
        test_class_id = 1
        test_session_no = 1
        
        print(f"--- CHI TIẾT ĐIỂM DANH LỚP {test_class_id} - BUỔI SỐ {test_session_no} ---")
        
        # Gọi hàm từ crud.py
        results = crud.get_attendance_detail_by_session(
            db, 
            class_id=test_class_id, 
            session_no=test_session_no
        )
        
        if not results:
            print("(!) Không tìm thấy danh sách sinh viên cho lớp này.")
            return

        # In bảng kết quả
        print(f"{'MSSV':<12} | {'Họ và Tên':<25} | {'Trạng thái':<12} | {'Thời gian'}")
        print("-" * 70)

        for row in results:
            # Xử lý hiển thị nếu dữ liệu bị trống (do dùng Outer Join)
            status = row.status if row.status else "Chưa điểm danh"
            time_display = row.time.strftime("%H:%M:%S") if row.time else "--:--:--"
            
            print(f"{row.student_id:<12} | {row.full_name:<25} | {status:<12} | {time_display}")

    except Exception as e:
        print(f"Lỗi khi chạy test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_summary()
    test_session_detail()