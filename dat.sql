
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('teacher', 'student');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY, -- SERIAL tự động tạo nextval('accounts_id_seq')
    username character varying(50) NOT NULL UNIQUE, -- Giới hạn 50 ký tự và không được trùng
    password character varying(255) NOT NULL, -- Độ dài 255 để lưu hash mật khẩu an toàn
    email character varying(100), -- character varying(100)
    full_name character varying(100), -- character varying(100)
    role user_role NOT NULL DEFAULT 'student' -- Sử dụng kiểu user_role bạn đã định nghĩa
);

INSERT INTO public.accounts (id, username, password, email, full_name, role) VALUES
(1, '52400046', '$2b$12$GeIZABj2gAf1Lm0L2.L2b.Kau7WiKFZf9op5.MmW3YjyX9XmhHgkW', '52400046@student.tdtu.edu.vn', 'Nguyễn Thị Diệu Hiền', 'student'),
(2, '2025001', '$2b$12$u9zAZMwH2BureBJNvLWXqeVb3I.DOfyt1Mr185hISGHebLJ.76woi', 'giangvien@truong.edu.vn', 'Nguyễn Văn A', 'teacher'),
(3, '52400001', '$2b$12$s6fc5oYyt0Gw17QxOMYEdeR8bd3cs1MBSUaoHSsxRmCE4cf/jjh6.', '52400001@student.edu.vn', 'Nguyễn Văn A', 'student'),
(4, '52400002', '$2b$12$cRJb00e8M1W3UWsCnr.a1unQoGHNnlnZ7h5gJQeSDAtzJWNkywzzC', '52400002@student.edu.vn', 'Nguyễn Văn B', 'student'),
(5, '52400003', '$2b$12$Q7IyNd6DteSAaFNX4AXnBOjbt4AHe4ewvQm9LY4Wq3Y8.a6kgaFuS', '52400003@student.edu.vn', 'Nguyễn Văn C', 'student'),
(6, '52400004', '$2b$12$zGMEy8dUjDgSWD1Gj47Z1eOsrjgGzTukYlsokmcNltA6BFJscEj3K', '52400004@student.edu.vn', 'Nguyễn Văn D', 'student'),
(7, '52400005', '$2b$12$9ixlY/SDp5xKp.WV6Nik1.rCS2StX3x5V7mVwuW9Kg80mVMAA6oem', '52400005@student.edu.vn', 'Nguyễn Văn E', 'student'),
(8, '52400006', '$2b$12$xqZYK800NBKFJ7jZDBKnRu8kW3DqrIjQdOdEXbebMRs54v6wk5OEa', '52400006@student.edu.vn', 'Nguyễn Văn F', 'student'),
(9, '52400007', '$2b$12$x4iEoZhtIfWAaPVuJtaQ0..M19Nz8YriCqUVq/KPag0xNQPQryxbm', '52400007@student.edu.vn', 'Nguyễn Văn G', 'student'),
(10, '52400008', '$2b$12$dRmtnGPywHwub9yxMU4YpODNmXauI7mivjD7PtQnLSpg6KQP15X6W', '52400008@student.edu.vn', 'Nguyễn Văn H', 'student'),
(11, '52400009', '$2b$12$TRRwJKtxS0Syr9xdNyBSHu1tS4K2M9Ch0tXIT4WHfWDXIS50XTBw2', '52400009@student.edu.vn', 'Nguyễn Văn I', 'student'),
(12, '52400010', '$2b$12$Y4N8NGqnNmyQWAkBEl/ZmeMPQGMW6PEwyuumkBxzCPnWdVvynXafK', '52400010@student.edu.vn', 'Nguyễn Văn J', 'student'),
(13, '52400056', '$2b$12$AOU0VdhUfH1pfnQqPJblsuKDJeEn.gupkk5c16wWpOj6wXxkWBzku', '52400056@student.tdtu.edu.vn', 'Chu Đức Thành Nhân', 'student'),
(14, '52400319', '$2b$12$AOU0VdhUfH1pfnQqPJblsuKDJeEn.gupkk5c16wWpOj6wXxkWBzku', '52400319@student.tdtu.edu.vn', 'Huỳnh Nguyễn Ngọc Thùy', 'student');

select * from accounts;

go
CREATE EXTENSION IF NOT EXISTS vector;



create table public.majors(
	 major_code VARCHAR(20) PRIMARY KEY, 
	 major_name VARCHAR(100) NOT NULL,    
	 department_name VARCHAR(100) 
)

select * from majors;

CREATE TABLE public.students (
    student_code VARCHAR(20) PRIMARY KEY, --MSSV
    class_name VARCHAR(20),
    major_code VARCHAR(20),               -- Mã ngành (Số và chữ)

    is_active BOOLEAN DEFAULT TRUE,      -- Trạng thái: TRUE là đang học, FALSE là nghỉ/bảo lưu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Thời gian đăng ký hệ thống

    -- Khóa ngoại trỏ sang bảng accounts (MSSV = Username)
    CONSTRAINT fk_accounts FOREIGN KEY (student_code) 
    REFERENCES public.accounts(username) ON DELETE CASCADE,

    -- Khóa ngoại trỏ sang bảng majors 
    CONSTRAINT fk_majors FOREIGN KEY (major_code) 
    REFERENCES public.majors(major_code) ON DELETE SET NULL
);
select * from students;

--Tạo bảng mã và tên
CREATE TABLE public.subjects (
    subject_id VARCHAR(20) PRIMARY KEY, -- Mã môn học (Ví dụ: 502051, 504008)
    subject_name VARCHAR(200) NOT NULL, -- Tên môn học (Ví dụ: Hệ cơ sở dữ liệu)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.subjects (subject_id, subject_name) VALUES
('306104', 'Chủ nghĩa Xã hội khoa học'),
('502051', 'Hệ cơ sở dữ liệu'),
('502061', 'Xác suất và thống kê ứng dụng cho Công nghệ thông tin'),
('503043', 'Nhập môn Trí tuệ nhân tạo'),
('503109', 'Quản trị hệ thống thông tin'),
('504', 'Test'),
('504008', 'Cấu trúc dữ liệu và giải thuật');

CREATE TABLE public.faces_embedding (
    id SERIAL PRIMARY KEY,            -- ID tự tăng để quản lý từng mẫu mặt
    student_id VARCHAR(20) NOT NULL, -- Liên kết với MSSV ở bảng students
    face_vector vector(512) NOT NULL,  -- Lưu vector đặc trưng (từ OpenCV/FaceNet)
    image_url TEXT,                    -- (Tùy chọn) Đường dẫn ảnh gốc để đối chiếu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ràng buộc: Nếu xóa sinh viên thì các mẫu mặt cũng tự động xóa theo
    CONSTRAINT fk_student_code FOREIGN KEY (student_id) 
    REFERENCES public.students(student_code) ON DELETE CASCADE
);

CREATE TABLE public.classes (
    class_id SERIAL PRIMARY KEY,            -- ID lớp
    subject_id VARCHAR(20) NOT NULL,        -- Mã môn học
    group_id INT NOT NULL,                  -- Nhóm 
    sub_id INT default NULL,                    -- Tổ
    teacher_name VARCHAR(100) NOT NULL,     -- Tên giảng viên
    semester VARCHAR(20) NOT NULL           -- Học kỳ (vd: HK1/2024-2025)
);

INSERT INTO classes (subject_id, group_id, sub_id, teacher_name, semester)
VALUES 
    ('502061', 2, 1, 'Lê Tuấn Thu', '2/2025-2026'),
    ('504008', 2, NULL, 'Trần Quang Huy', '2/2025-2026'),
    ('306104', 13, NULL, 'Lê Thị Lan', '2/2025-2026'),
    ('504008', 2, 1, 'Trần Quang Huy', '2/2025-2026'),
    ('503043', 2, NULL, 'Trịnh Hùng Cường', '2/2025-2026'),
    ('502061', 2, NULL, 'Trần Hà Sơn', '2/2025-2026'),
    ('503109', 1, NULL, 'Hồ Thị Linh', '2/2025-2026'),
    ('504', 1, NULL, 'NCKH', '2/2025-2026'),
    ('502051', 1, 1, 'Lê Anh Khoa', '2/2025-2026'),
    ('502051', 1, NULL, 'Dương Hớn Minh', '2/2025-2026');

select * from classes;
select * from enrollments;
select * from faces_embedding;

ALTER USER postgres WITH PASSWORD 'nckh@HTN';

ALTER TABLE attendance 
ADD COLUMN session_no INTEGER DEFAULT 1;