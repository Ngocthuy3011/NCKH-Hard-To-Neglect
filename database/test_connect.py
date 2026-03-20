import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

cur.execute("SELECT current_database(), current_schema();")
print(cur.fetchone())

cur.close()
conn.close()
print("✅ CONNECT OK")

cur.execute("""
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
""")
print(cur.fetchall())
