import psycopg2

try:
    conn = psycopg2.connect(
        host="localhost",
        port="5433",
        database="postgres",
        user="postgres",
        password="nckh@HTN"
    )
    
    print("✅ Kết nối thành công!")

    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone())

    cur.close()
    conn.close()

except Exception as e:
    print("❌ Lỗi:", e)