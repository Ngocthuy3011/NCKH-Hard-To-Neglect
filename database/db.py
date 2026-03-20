import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        db_url = os.getenv("DATABASE_URL")
        self.conn = psycopg2.connect(db_url)
        self.conn.autocommit = True
        self.cursor = self.conn.cursor()

        # DEBUG
        self.cursor.execute("SELECT current_database(), current_schema();")
        print(">>> DB INFO:", self.cursor.fetchone())

        self.cursor.execute("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_name = 'users';
        """)
        print(">>> USERS TABLE FOUND:", self.cursor.fetchall())

    def get_user_by_username(self, username):
        self.cursor.execute(
            """
            SELECT id, username, password_hash, role
            FROM public.users
            WHERE username = %s
            """,
            (username,)
        )

        row = self.cursor.fetchone()
        if not row:
            return None

        return {
            "id": row[0],
            "username": row[1],
            "password": row[2],
            "role": row[3]
        }
