--
-- PostgreSQL database dump
--

\restrict bhL6EYgLCpxCZJm8qST4miNucgf2eKh0wt6RhlZsiKyzrJUQbOIEfqAdRjaN9mE

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg12+1)
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-29 12:38:46

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16406)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 3689 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- TOC entry 967 (class 1247 OID 16389)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'teacher',
    'student'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16394)
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(100),
    full_name character varying(100),
    role public.user_role NOT NULL
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16393)
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO postgres;

--
-- TOC entry 3690 (class 0 OID 0)
-- Dependencies: 216
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- TOC entry 227 (class 1259 OID 24678)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    student_id character varying(20) NOT NULL,
    class_id integer NOT NULL,
    "time" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'vắng'::character varying NOT NULL,
    session_no integer DEFAULT 1
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24677)
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.attendance ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 24649)
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    class_id integer NOT NULL,
    subject_id character varying(20) NOT NULL,
    group_id integer NOT NULL,
    sub_id integer,
    teacher_id character varying(50) NOT NULL,
    semester character varying(20) NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24648)
-- Name: classes_class_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_class_id_seq OWNER TO postgres;

--
-- TOC entry 3691 (class 0 OID 0)
-- Dependencies: 223
-- Name: classes_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_class_id_seq OWNED BY public.classes.class_id;


--
-- TOC entry 225 (class 1259 OID 24655)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    student_id character varying(20) NOT NULL,
    class_id integer NOT NULL,
    enrollment_date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24627)
-- Name: faces_embedding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faces_embedding (
    id integer NOT NULL,
    student_id character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vector_straight public.vector(512),
    vector_left public.vector(512),
    vector_right public.vector(512)
);


ALTER TABLE public.faces_embedding OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24626)
-- Name: faces_embedding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faces_embedding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faces_embedding_id_seq OWNER TO postgres;

--
-- TOC entry 3692 (class 0 OID 0)
-- Dependencies: 221
-- Name: faces_embedding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faces_embedding_id_seq OWNED BY public.faces_embedding.id;


--
-- TOC entry 218 (class 1259 OID 24598)
-- Name: majors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.majors (
    major_code character varying(20) NOT NULL,
    major_name character varying(100) NOT NULL,
    department_name character varying(100)
);


ALTER TABLE public.majors OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24603)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    student_id character varying(20) NOT NULL,
    class_name character varying(20),
    major_code character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24620)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    subject_id character varying(20) NOT NULL,
    subject_name character varying(200) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 41006)
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    teacher_id character varying(50) NOT NULL,
    department character varying(100),
    degree character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- TOC entry 3482 (class 2604 OID 16397)
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- TOC entry 3488 (class 2604 OID 24652)
-- Name: classes class_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN class_id SET DEFAULT nextval('public.classes_class_id_seq'::regclass);


--
-- TOC entry 3486 (class 2604 OID 24630)
-- Name: faces_embedding id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faces_embedding ALTER COLUMN id SET DEFAULT nextval('public.faces_embedding_id_seq'::regclass);


--
-- TOC entry 3672 (class 0 OID 16394)
-- Dependencies: 217
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, username, password, email, full_name, role) FROM stdin;
1	52400046	$2b$12$GeIZABj2gAf1Lm0L2.L2b.Kau7WiKFZf9op5.MmW3YjyX9XmhHgkW	52400046@student.tdtu.edu.vn	Nguyễn Thị Diệu Hiền	student
2	2025001	$2b$12$u9zAZMwH2BureBJNvLWXqeVb3I.DOfyt1Mr185hISGHebLJ.76woi	giangvien@truong.edu.vn	Nguyễn Văn A	teacher
3	52400001	$2b$12$s6fc5oYyt0Gw17QxOMYEdeR8bd3cs1MBSUaoHSsxRmCE4cf/jjh6.	52400001@student.edu.vn	Nguyễn Văn A	student
7	52400005	$2b$12$9ixlY/SDp5xKp.WV6Nik1.rCS2StX3x5V7mVwuW9Kg80mVMAA6oem	52400005@student.edu.vn	Nguyễn Văn E	student
8	52400006	$2b$12$xqZYK800NBKFJ7jZDBKnRu8kW3DqrIjQdOdEXbebMRs54v6wk5OEa	52400006@student.edu.vn	Nguyễn Văn F	student
9	52400007	$2b$12$x4iEoZhtIfWAaPVuJtaQ0..M19Nz8YriCqUVq/KPag0xNQPQryxbm	52400007@student.edu.vn	Nguyễn Văn G	student
10	52400008	$2b$12$dRmtnGPywHwub9yxMU4YpODNmXauI7mivjD7PtQnLSpg6KQP15X6W	52400008@student.edu.vn	Nguyễn Văn H	student
11	52400009	$2b$12$TRRwJKtxS0Syr9xdNyBSHu1tS4K2M9Ch0tXIT4WHfWDXIS50XTBw2	52400009@student.edu.vn	Nguyễn Văn I	student
12	52400010	$2b$12$Y4N8NGqnNmyQWAkBEl/ZmeMPQGMW6PEwyuumkBxzCPnWdVvynXafK	52400010@student.edu.vn	Nguyễn Văn J	student
13	52400056	$2b$12$AOU0VdhUfH1pfnQqPJblsuKDJeEn.gupkk5c16wWpOj6wXxkWBzku	52400056@student.tdtu.edu.vn	Chu Đức Thành Nhân	student
14	52400319	$2b$12$AOU0VdhUfH1pfnQqPJblsuKDJeEn.gupkk5c16wWpOj6wXxkWBzku	52400319@student.tdtu.edu.vn	Huỳnh Nguyễn Ngọc Thùy	student
4	52400022	$2b$12$cRJb00e8M1W3UWsCnr.a1unQoGHNnlnZ7h5gJQeSDAtzJWNkywzzC	52400022@student.tdtu.edu.vn	Mai Thu Minh	student
5	52400044	$2b$12$Q7IyNd6DteSAaFNX4AXnBOjbt4AHe4ewvQm9LY4Wq3Y8.a6kgaFuS	52400044@student.tdtu.edu.vn	Nguyễn Ngọc Đức	student
6	52400074	$2b$12$zGMEy8dUjDgSWD1Gj47Z1eOsrjgGzTukYlsokmcNltA6BFJscEj3K	52400074@student.tdtu.edu.vn	Hồ Thị Gia Hân	student
15	2025002	$2b$12$s6fc5oYyt0Gw17QxOMYEdeR8bd3cs1MBSUaoHSsxRmCE4cf/jjh6.	tranvana@truong.edu.vn	 Trần Văn A	teacher
\.


--
-- TOC entry 3682 (class 0 OID 24678)
-- Dependencies: 227
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, student_id, class_id, "time", status, session_no) FROM stdin;
\.


--
-- TOC entry 3679 (class 0 OID 24649)
-- Dependencies: 224
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (class_id, subject_id, group_id, sub_id, teacher_id, semester) FROM stdin;
11	504	1	\N	2025001	2/2025-2026
13	306104	13	\N	2025002	2/2025-2026
\.


--
-- TOC entry 3680 (class 0 OID 24655)
-- Dependencies: 225
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (student_id, class_id, enrollment_date, status) FROM stdin;
52400046	11	2026-03-25	active
52400056	11	2026-03-25	active
52400319	11	2026-03-25	active
52400044	11	2026-03-25	active
52400022	11	2026-03-25	active
52400074	11	2026-03-25	active
52400078	11	2026-03-25	active
52400046	13	2026-03-27	active
\.


--
-- TOC entry 3677 (class 0 OID 24627)
-- Dependencies: 222
-- Data for Name: faces_embedding; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faces_embedding (id, student_id, created_at, vector_straight, vector_left, vector_right) FROM stdin;
\.


--
-- TOC entry 3673 (class 0 OID 24598)
-- Dependencies: 218
-- Data for Name: majors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.majors (major_code, major_name, department_name) FROM stdin;
7480101	Khoa học máy tính	Công nghệ thông tin
7480102	Mạng máy tính và truyền thông dữ liệu	Công nghệ thông tin
7480103	Kỹ thuật phần mềm	Công nghệ thông tin
\.


--
-- TOC entry 3674 (class 0 OID 24603)
-- Dependencies: 219
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (student_id, class_name, major_code, is_active, created_at) FROM stdin;
52400046	24050302	7480101	t	2026-01-26 03:35:04.111869
52400056	24050302	7480101	t	2026-01-26 03:39:57.719698
52400319	24050402	7480102	t	2026-01-26 03:39:57.719698
52400074	24050402	7480102	t	2026-01-26 17:19:57.071339
52400022	24050201	7480103	t	2026-01-26 17:20:55.554083
52400044	24050301	7480101	t	2026-01-26 17:20:55.554083
\.


--
-- TOC entry 3675 (class 0 OID 24620)
-- Dependencies: 220
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (subject_id, subject_name, created_at) FROM stdin;
306104	Chủ nghĩa Xã hội khoa học	2026-01-26 03:46:45.959545
502051	Hệ cơ sở dữ liệu	2026-01-26 03:46:45.959545
502061	Xác suất và thống kê ứng dụng cho Công nghệ thông tin	2026-01-26 03:46:45.959545
503043	Nhập môn Trí tuệ nhân tạo	2026-01-26 03:46:45.959545
503109	Quản trị hệ thống thông tin	2026-01-26 03:46:45.959545
504	Test	2026-01-26 03:46:45.959545
504008	Cấu trúc dữ liệu và giải thuật	2026-01-26 03:46:45.959545
\.


--
-- TOC entry 3683 (class 0 OID 41006)
-- Dependencies: 228
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (teacher_id, department, degree, is_active, created_at) FROM stdin;
2025001	Công nghệ thông tin	Tiến sĩ	t	2026-03-25 15:13:12.544084
2025002	Khoa học xã hội và nhân văn	Thạc sĩ	t	2026-03-27 13:11:28.113338
\.


--
-- TOC entry 3693 (class 0 OID 0)
-- Dependencies: 216
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_id_seq', 2, true);


--
-- TOC entry 3694 (class 0 OID 0)
-- Dependencies: 226
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 9, true);


--
-- TOC entry 3695 (class 0 OID 0)
-- Dependencies: 223
-- Name: classes_class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_class_id_seq', 13, true);


--
-- TOC entry 3696 (class 0 OID 0)
-- Dependencies: 221
-- Name: faces_embedding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faces_embedding_id_seq', 1, false);


--
-- TOC entry 3497 (class 2606 OID 16405)
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- TOC entry 3499 (class 2606 OID 16401)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3501 (class 2606 OID 16403)
-- Name: accounts accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);


--
-- TOC entry 3517 (class 2606 OID 24684)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 3511 (class 2606 OID 24654)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (class_id);


--
-- TOC entry 3513 (class 2606 OID 24668)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (student_id, class_id);


--
-- TOC entry 3509 (class 2606 OID 24635)
-- Name: faces_embedding faces_embedding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faces_embedding
    ADD CONSTRAINT faces_embedding_pkey PRIMARY KEY (id);


--
-- TOC entry 3503 (class 2606 OID 24602)
-- Name: majors majors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.majors
    ADD CONSTRAINT majors_pkey PRIMARY KEY (major_code);


--
-- TOC entry 3505 (class 2606 OID 24609)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- TOC entry 3507 (class 2606 OID 24625)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (subject_id);


--
-- TOC entry 3519 (class 2606 OID 41012)
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (teacher_id);


--
-- TOC entry 3515 (class 2606 OID 24661)
-- Name: enrollments unique_student_class; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT unique_student_class UNIQUE (student_id, class_id);


--
-- TOC entry 3520 (class 2606 OID 24610)
-- Name: students fk_accounts; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_accounts FOREIGN KEY (student_id) REFERENCES public.accounts(username) ON DELETE CASCADE;


--
-- TOC entry 3525 (class 2606 OID 24690)
-- Name: attendance fk_attendance_class; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;


--
-- TOC entry 3526 (class 2606 OID 24685)
-- Name: attendance fk_attendance_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 3524 (class 2606 OID 24662)
-- Name: enrollments fk_class; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES public.classes(class_id) ON DELETE CASCADE;


--
-- TOC entry 3523 (class 2606 OID 41054)
-- Name: classes fk_classes_teacher; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(teacher_id);


--
-- TOC entry 3521 (class 2606 OID 24615)
-- Name: students fk_majors; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_majors FOREIGN KEY (major_code) REFERENCES public.majors(major_code) ON DELETE SET NULL;


--
-- TOC entry 3522 (class 2606 OID 24636)
-- Name: faces_embedding fk_student_code; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faces_embedding
    ADD CONSTRAINT fk_student_code FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 3527 (class 2606 OID 41013)
-- Name: teachers fk_teacher_account; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT fk_teacher_account FOREIGN KEY (teacher_id) REFERENCES public.accounts(username) ON DELETE CASCADE;


-- Completed on 2026-03-29 12:38:47

--
-- PostgreSQL database dump complete
--

\unrestrict bhL6EYgLCpxCZJm8qST4miNucgf2eKh0wt6RhlZsiKyzrJUQbOIEfqAdRjaN9mE

