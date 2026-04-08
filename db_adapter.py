import sqlite3
import os
import re

DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        psycopg2 = None
else:
    from config import DATABASE

class DBConnection:
    def __init__(self):
        self.is_postgres = bool(DATABASE_URL)
        if self.is_postgres:
            self.conn = psycopg2.connect(DATABASE_URL)
            self.conn.autocommit = False
        else:
            self.conn = sqlite3.connect(DATABASE)
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA journal_mode=WAL")
            self.conn.execute("PRAGMA foreign_keys=ON")

    def _convert_query(self, query):
        if self.is_postgres:
            # Convert SQLite placeholders back to Postgres placeholders
            query = query.replace('?', '%s')
            # SQLite Auto increment
            query = query.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
            # SQLite datetime
            query = query.replace("datetime('now')", "CURRENT_TIMESTAMP")
        return query

    def execute(self, query, params=None):
        query = self._convert_query(query)
        if self.is_postgres:
            cursor = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            cursor.execute(query, params or ())
            return PostgresCursorWrapper(cursor)
        else:
            if params:
                return self.conn.execute(query, params)
            return self.conn.execute(query)

    def executescript(self, script):
        script = self._convert_query(script)
        if self.is_postgres:
            cursor = self.conn.cursor()
            # postgres uses simple execute for multiple statements separated by ';'
            cursor.execute(script)
        else:
            self.conn.executescript(script)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

class PostgresCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def fetchone(self):
        row = self.cursor.fetchone()
        return row

    def fetchall(self):
        rows = self.cursor.fetchall()
        return rows

def get_db():
    return DBConnection()
