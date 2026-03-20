from database.db import Database
import mysql.connector

def run_test():
    db = None
    try:
        print("--- Đang kết nối tới MySQL... ---")
        db = Database()
        
        # Gọi thử một câu lệnh đơn giản
        result = db.test_connection()
        print(f"✅ Kết nối thành công!")
        print(f"✅ Đang sử dụng database: {result['DATABASE()']}")
        
    except mysql.connector.Error as err:
        print(f"❌ Lỗi MySQL: {err}")
    except Exception as e:
        print(f"❌ Lỗi không xác định: {e}")
    finally:
        if db:
            db.close()
            print("--- Đã đóng kết nối. ---")

if __name__ == "__main__":
    run_test()