1.	Tải docker và đăng nhập
2.	Tại thư mục chứ file docker-compose.yml, mở cmd
-	docker compose up -d
-	Kiểm tra xem đã Sau khi chạy, bạn có thể kiểm tra xem database đã online chưa bằng lệnh:
docker compose ps. Nếu thấy cột STATUS là Up... thì server của bạn đã sẵn sàng
3.	Cài đặt thư viện python 
pip install opencv-python psycopg2-binary numpy
4.	Kết nối với backend
<img width="954" height="280" alt="image" src="https://github.com/user-attachments/assets/3296a3ed-d03f-42ae-9842-7b0aab450871" />

import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port="5433",              # Cổng mặc định đã cấu hình
    database="postgres",
    user="postgres",            # Thay bằng user trong docker-compose
    password="nckh@HTN"  # Thay bằng mật khẩu bạn đã đổi
)
print("Kết nối thành công!")
5. Nếu muốn xem các bảng 1 cách trực quan thì tải postgresSQL về
to be continue...
