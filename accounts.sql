--
-- PostgreSQL database dump
--

\restrict IySbLsbTft3gvyrTxD9VfqQIGYt0Upad1haJCBEzxeYnQPew8HEykKEaE0TK9FF

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-18 16:04:34

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16415)
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
-- TOC entry 219 (class 1259 OID 16414)
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
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 219
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- TOC entry 4857 (class 2604 OID 16418)
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- TOC entry 5012 (class 0 OID 16415)
-- Dependencies: 220
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, username, password, email, full_name, role) FROM stdin;
1	52400046	$2b$12$GeIZABj2gAf1Lm0L2.L2b.Kau7WiKFZf9op5.MmW3YjyX9XmhHgkW	52400046@student.tdtu.edu.vn	Nguyễn Thị Diệu Hiền	student
2	 2025001	$2b$12$u9zAZMwH2BureBJNvLWXqeVb3I.DOfyt1Mr185hISGHebLJ.76woi	giangvien@truong.edu.vn 	Nguyễn Văn A	teacher
3	52400001	$2b$12$s6fc5oYyt0Gw17QxOMYEdeR8bd3cs1MBSUaoHSsxRmCE4cf/jjh6.	52400001@student.edu.vn	Nguyễn Văn A	student
4	52400002	$2b$12$cRJb00e8M1W3UWsCnr.a1unQoGHNnlnZ7h5gJQeSDAtzJWNkywzzC	52400002@student.edu.vn	Nguyễn Văn B	student
5	52400003	$2b$12$Q7IyNd6DteSAaFNX4AXnBOjbt4AHe4ewvQm9LY4Wq3Y8.a6kgaFuS	52400003@student.edu.vn	Nguyễn Văn C	student
6	52400004	$2b$12$zGMEy8dUjDgSWD1Gj47Z1eOsrjgGzTukYlsokmcNltA6BFJscEj3K	52400004@student.edu.vn	Nguyễn Văn D	student
7	52400005	$2b$12$9ixlY/SDp5xKp.WV6Nik1.rCS2StX3x5V7mVwuW9Kg80mVMAA6oem	52400005@student.edu.vn	Nguyễn Văn E	student
8	52400006	$2b$12$xqZYK800NBKFJ7jZDBKnRu8kW3DqrIjQdOdEXbebMRs54v6wk5OEa	52400006@student.edu.vn	Nguyễn Văn F	student
9	52400007	$2b$12$x4iEoZhtIfWAaPVuJtaQ0..M19Nz8YriCqUVq/KPag0xNQPQryxbm	52400007@student.edu.vn	Nguyễn Văn G	student
10	52400008	$2b$12$dRmtnGPywHwub9yxMU4YpODNmXauI7mivjD7PtQnLSpg6KQP15X6W	52400008@student.edu.vn	Nguyễn Văn H	student
11	52400009	$2b$12$TRRwJKtxS0Syr9xdNyBSHu1tS4K2M9Ch0tXIT4WHfWDXIS50XTBw2	52400009@student.edu.vn	Nguyễn Văn I	student
12	52400010	$2b$12$Y4N8NGqnNmyQWAkBEl/ZmeMPQGMW6PEwyuumkBxzCPnWdVvynXafK	52400010@student.edu.vn	Nguyễn Văn J	student
13	52400056	$2b$12$AOU0VdhUfH1pfnQqPJblsuKDJeEn.gupkk5c16wWpOj6wXxkWBzku	52400056@student.tdtu.edu.vn 	Chu Đức Thành Nhân	student
14	52400319	$2b$12$AOU0VdhUfH1pfnQqPJblsuKDJeEn.gupkk5c16wWpOj6wXxkWBzku	52400319@student.tdtu.edu.vn	Huỳnh Nguyễn Ngọc Thùy	student
\.


--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 219
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_id_seq', 14, true);


--
-- TOC entry 4859 (class 2606 OID 16430)
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- TOC entry 4861 (class 2606 OID 16426)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4863 (class 2606 OID 16428)
-- Name: accounts accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);


-- Completed on 2026-01-18 16:04:35

--
-- PostgreSQL database dump complete
--

\unrestrict IySbLsbTft3gvyrTxD9VfqQIGYt0Upad1haJCBEzxeYnQPew8HEykKEaE0TK9FF

