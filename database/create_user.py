import psycopg2
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

username = "52400046"
password = "sinhvien123"

# hash password
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute(
    """
    INSERT INTO public.users (username, password_hash, role)
    VALUES (%s, %s, %s)
    ON CONFLICT (username) DO NOTHING
    """,
    (username, password_hash, "user")
)

conn.commit()
cur.close()
conn.close()

print("✅ USER CREATED SUCCESSFULLY")
