import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Thêm thư mục gốc NCKH vào hệ thống tìm kiếm
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.append(project_root)

from database.database import SessionLocal
from database import models, crud

# 1. Khởi tạo session kết nối database
db = SessionLocal()

def test_classes():
    try:
        # 2. Gọi hàm mà Hiền muốn test
        # Ví dụ: test hàm lấy danh sách lớp của thầy 'Nguyễn Văn A'
        results = crud.get_lecturer_classes(db, teacher_id="2025001")
        
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
        target_class_id = 11
        
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
        test_class_id = 11
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
def test_stats():
    # 1. Khởi tạo kết nối tạm thời
    db = SessionLocal()
    
    # ID của Hiền để test (dựa trên dữ liệu file SQL của bạn)
    test_student_id = "52400046" 
    test_class_id = 11 # ID lớp học có trong bảng classes

    try:
        print(f"--- ĐANG KIỂM TRA THỐNG KÊ CHO MSSV: {test_student_id} ---\n")

        # --- TEST HÀM 1: Lịch sử học tập ---
        print("[1] Kiểm tra: Lịch sử đăng ký môn học")
        history_classes = crud.get_student_enrollment_history(db, test_student_id)
        
        if not history_classes:
            print("=> Kết quả: Trống (Có thể SV chưa đăng ký môn nào).")
        else:
            for item in history_classes:
                print(f"   + Môn: {item.subject_name} | Kỳ: {item.semester} | Trạng thái: {item.status}")

        print("-" * 50)

        # --- TEST HÀM 2: Chi tiết điểm danh ---
        print(f"[2] Kiểm tra: Điểm danh tại lớp ID {test_class_id}")
        attendance_results = crud.get_student_attendance_stats(db, test_student_id, test_class_id)
        
        # In phần tổng kết
        summary = attendance_results["summary"]
        print(f"   + TỔNG KẾT: Có mặt ({summary['có mặt']}), Vắng ({summary['vắng']}), Trễ ({summary['trễ']})")
        print(f"   + Tổng số buổi đã diễn ra: {summary['tổng_buổi']}")

        # In chi tiết từng buổi
        print("   + CHI TIẾT TỪNG BUỔI:")
        if not attendance_results["history"]:
            print("     => Chưa có dữ liệu điểm danh thực tế.")
        else:
            for record in attendance_results["history"]:
                time_display = record.time.strftime("%d/%m/%Y %H:%M") if record.time else "N/A"
                print(f"     - Buổi {record.session_no}: {record.status} ({time_display})")

    except Exception as e:
        print(f"❌ Lỗi khi chạy test: {e}")
    finally:
        db.close() # Luôn đóng kết nối sau khi test xong

if __name__ == "__main__":
    test_classes()
    # test_summary()
    # test_session_detail()
    # test_stats()
