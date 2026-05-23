# HƯỚNG DẪN KHỞI CHẠY DỰ ÁN NCKH - ĐIỂM DANH KHUÔN MẶT

Dưới đây là hướng dẫn chi tiết từng bước để khởi chạy dự án trên máy tính cá nhân.  
Vui lòng đọc kỹ và thực hiện theo đúng thứ tự để tránh lỗi kết nối nhé.

---

# Yêu cầu cài đặt trước (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các phần mềm sau:

- Python (Phiên bản 3.10 trở lên)
- Node.js (Phiên bản 18.x trở lên)
- Docker Desktop (Dùng để chạy Database)
- Git (Để pull code về máy)

---

# BƯỚC 1: Tải mã nguồn về máy

Mở Terminal hoặc Command Prompt (CMD) và chạy lệnh sau để clone dự án:

```bash
git clone https://github.com/Ngocthuy3011/NCKH-Hard-To-Neglect.git
cd NCKH-Hard-To-Neglect
```

---

# BƯỚC 2: Khởi động Database (PostgreSQL)

Chúng ta sẽ sử dụng Docker để chạy Database.  
Cần đảm bảo Docker Desktop đã được mở và đang hoạt động trên máy bạn.

## Di chuyển vào thư mục chứa cấu hình database

```bash
cd database
```
## Khởi động các container ở chế độ chạy ngầm (detached mode)
```bash
docker compose up -d
```
## Kiểm tra xem database đã chạy thành công chưa
```bash
docker compose ps
```
Nếu thấy trạng thái là Up thì bạn có thể yên tâm sang bước tiếp theo.

# BƯỚC 3: Khởi động Backend (FastAPI)

Mở một cửa sổ Terminal/CMD mới
(để giữ cửa sổ cũ nếu cần) và đảm bảo bạn đang đứng ở thư mục gốc của dự án (NCKH-Hard-To-Neglect).

Di chuyển vào thư mục backend
```bash
cd backend
```
##  Kích hoạt môi trường ảo (Virtual Environment) trên Windows
```bash
.\venv\Scripts\activate
```
Nếu thành công, bạn sẽ thấy chữ (venv) hiện ở đầu dòng lệnh.

Cài đặt các thư viện cần thiết
```bash
pip install uvicorn
```
Lưu ý: Để cài đầy đủ toàn bộ thư viện của dự án, team nên chạy:
```bash
pip install -r requirements.txt
```
Khởi chạy Server Backend
```bash
uvicorn main:app --reload
```
Backend sẽ chạy tại địa chỉ: http://localhost:8000

# BƯỚC 4: Khởi động Frontend (React)

Tiếp tục mở thêm một cửa sổ Terminal/CMD mới thứ ba, đảm bảo đang đứng ở thư mục gốc của dự án.

Di chuyển vào thư mục frontend
```bash
cd frontend
```
Cài đặt các gói thư viện Node

Chỉ cần chạy lần đầu tiên hoặc khi có người mới thêm thư viện.
```bash
npm install
```
Khởi chạy giao diện web
```bash
npm run dev
```
Frontend sẽ chạy tại địa chỉ: http://localhost:5173

# BƯỚC 5: Trải nghiệm hệ thống

Sau khi hoàn thành 4 bước trên, hệ thống của chúng ta đã sẵn sàng!

Giao diện người dùng (Web)

Mở trình duyệt và truy cập:
```bash
http://localhost:5173
```
Tài liệu API Backend (Swagger UI)

Truy cập:
```bash
http://localhost:8000/docs
```
để test thử các API.

# Lưu ý khi tắt dự án
Tắt Frontend và Backend

Quay lại cửa sổ Terminal của nó và nhấn:
```bash
Ctrl + C
```
Tắt Database an toàn

Mở Terminal ở thư mục database và chạy:
```bash
docker compose down
```
