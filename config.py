import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.path.join(BASE_DIR, 'database.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
ALLOWED_SONG_EXTENSIONS = {'txt', 'json', 'csv'}
SECRET_KEY = 'parnasala-fellowship-secret-key-2026'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
