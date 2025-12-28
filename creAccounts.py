import csv
import bcrypt
import string

# =====================
# CẤU HÌNH
# =====================
NUM_STUDENTS = 30               # số sinh viên cần tạo
START_ID = 52400001             # mã sinh viên bắt đầu
PASSWORD = "sinhvien123"
EMAIL_DOMAIN = "student.edu.vn"


# =====================
# HÀM HASH PASSWORD
# =====================
def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


# =====================
# TẠO DỮ LIỆU
# =====================
users = []

alphabet = list(string.ascii_uppercase)  # A → Z

for i in range(NUM_STUDENTS):
    student_id = START_ID + i
    full_name = f"Nguyen Van {alphabet[i % 26]}"
    username = str(student_id)
    email = f"{student_id}@{EMAIL_DOMAIN}"
    password_hash = hash_password(PASSWORD)
    role = "student"

    users.append([
        student_id,
        username,
        password_hash,
        email,
        full_name,
        role
    ])


# =====================
# GHI FILE CSV
# =====================
with open("students.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "student_id",
        "username",
        "password_hash",
        "email",
        "full_name",
        "role"
    ])
    writer.writerows(users)

print("✅ Đã tạo file students.csv theo khuôn mẫu")
