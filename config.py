import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Use persistent disk on Render, local directory in development
DATA_DIR = '/data' if os.path.exists('/data') else BASE_DIR

DATABASE = os.path.join(DATA_DIR, 'database.db')
UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
ALLOWED_SONG_EXTENSIONS = {'txt', 'json', 'csv'}
SECRET_KEY = os.environ.get('SECRET_KEY', 'parnasala-fellowship-secret-key-2026')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
