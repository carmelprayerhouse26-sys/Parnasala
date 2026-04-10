import sqlite3
import os

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
            # Convert SQLite placeholders to Postgres placeholders
            query = query.replace('?', '%s')
            # SQLite Auto increment
            query = query.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
            # SQLite datetime
            query = query.replace("datetime('now')", "CURRENT_TIMESTAMP")
            # SQLite INSERT OR IGNORE -> PostgreSQL ON CONFLICT DO NOTHING
            if 'INSERT OR IGNORE' in query.upper() or 'INSERT OR IGNORE' in query:
                query = query.replace('INSERT OR IGNORE', 'INSERT')
                query = query.replace('insert or ignore', 'INSERT')
                # Add ON CONFLICT DO NOTHING at the end
                query = query.rstrip().rstrip(';')
                query += ' ON CONFLICT DO NOTHING'
        return query

    def execute(self, query, params=None):
        query = self._convert_query(query)
        if self.is_postgres:
            cursor = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            try:
                cursor.execute(query, params or ())
            except Exception as e:
                # Auto-rollback on error so connection isn't stuck
                self.conn.rollback()
                raise e
            return PostgresCursorWrapper(cursor)
        else:
            if params:
                return self.conn.execute(query, params)
            return self.conn.execute(query)

    def executescript(self, script):
        script = self._convert_query(script)
        if self.is_postgres:
            cursor = self.conn.cursor()
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
        self.lastrowid = getattr(cursor, 'lastrowid', None)

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row else None

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    def __getitem__(self, key):
        """Allow index access for COUNT(*) etc."""
        row = self.cursor.fetchone()
        if row:
            if isinstance(key, int):
                return list(row.values())[key]
            return row[key]
        return None

def get_db():
    return DBConnection()
