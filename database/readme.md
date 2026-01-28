1. T?i docker và ??ng nh?p
2. T?i th? m?c ch? file docker-compose.yml, m? cmd
- docker compose up -d
- Ki?m tra xem ?ã Sau khi ch?y, b?n có th? ki?m tra xem database ?ã online ch?a b?ng l?nh:
docker compose ps
N?u th?y c?t STATUS là Up... thì server c?a b?n ?ã s?n sàng
3. Cài ??t th? vi?n python 
pip install opencv-python psycopg2-binary numpy
4. K?t n?i v?i backend
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port="5433",              # C?ng m?c ??nh ?ã c?u hình
    database="postgres",
    user="postgres",            # Thay b?ng user trong docker-compose
    password="nckh@HTN"  # Thay b?ng m?t kh?u b?n ?ã ??i
)
print("K?t n?i thành công!")


