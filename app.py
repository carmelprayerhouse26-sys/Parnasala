"""
Church Songs Book Platform — Flask Backend
==========================================
RESTful API serving the Church Songs Book SPA.
"""

import os
import json
import csv
import io
import re
import sqlite3
import uuid
import random
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

from flask import (
    Flask, request, jsonify, session,
    send_from_directory, redirect
)
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import (
    DATABASE, UPLOAD_FOLDER, SECRET_KEY,
    ALLOWED_IMAGE_EXTENSIONS, ALLOWED_SONG_EXTENSIONS,
    MAX_CONTENT_LENGTH
)

# ── App Setup ────────────────────────────────────────────────────────────────

app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
bcrypt = Bcrypt(app)
CORS(app)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ── Database Helpers ─────────────────────────────────────────────────────────

def get_db():
    """Get a database connection with Row factory."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            lyrics TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            slug TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            caption TEXT DEFAULT '',
            uploaded_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            church_name TEXT DEFAULT 'Parnasala Fellowship',
            tagline TEXT DEFAULT 'A Place of Worship and Fellowship',
            logo_url TEXT DEFAULT '',
            about TEXT DEFAULT '',
            contact TEXT DEFAULT '',
            address TEXT DEFAULT '',
            social_links TEXT DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            title_te TEXT DEFAULT '',
            content TEXT DEFAULT '',
            pdf_url TEXT DEFAULT '',
            slug TEXT UNIQUE NOT NULL,
            published_at TEXT DEFAULT (datetime('now')),
            created_at TEXT DEFAULT (datetime('now'))
        );

        INSERT OR IGNORE INTO settings (id) VALUES (1);
    ''')

    # Migration: Add pdf_url column to articles if it doesn't exist
    try:
        conn.execute("SELECT pdf_url FROM articles LIMIT 1")
    except sqlite3.OperationalError:
        conn.execute("ALTER TABLE articles ADD COLUMN pdf_url TEXT DEFAULT ''")

    conn.commit()
    conn.close()


def slugify(text):
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')


def allowed_file(filename, allowed):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed


# ── Auth Decorator ───────────────────────────────────────────────────────────

def admin_required(f):
    """Protect admin routes with session check."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Serve SPA ────────────────────────────────────────────────────────────────

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ── Public API: Songs ────────────────────────────────────────────────────────

@app.route('/api/songs')
def get_songs():
    """List songs with optional search & category filter."""
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()

    conn = get_db()
    query = "SELECT * FROM songs WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE ? OR lyrics LIKE ?)"
        params.extend([f'%{search}%', f'%{search}%'])
    if category:
        query += " AND category = ?"
        params.append(category)

    query += " ORDER BY title ASC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    songs = [dict(r) for r in rows]
    return jsonify(songs)


@app.route('/api/songs/<slug>')
def get_song(slug):
    """Get a single song by slug."""
    conn = get_db()
    row = conn.execute("SELECT * FROM songs WHERE slug = ?", (slug,)).fetchone()
    conn.close()

    if not row:
        return jsonify({'error': 'Song not found'}), 404
    return jsonify(dict(row))


# ── Public API: Categories ───────────────────────────────────────────────────

@app.route('/api/categories')
def get_categories():
    conn = get_db()
    rows = conn.execute("SELECT * FROM categories ORDER BY name ASC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── Public API: Settings ─────────────────────────────────────────────────────

@app.route('/api/settings')
def get_settings():
    conn = get_db()
    row = conn.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    conn.close()
    if not row:
        return jsonify({})
    data = dict(row)
    # Parse social_links JSON
    try:
        data['social_links'] = json.loads(data.get('social_links', '{}'))
    except (json.JSONDecodeError, TypeError):
        data['social_links'] = {}
    return jsonify(data)


# ── Public API: Articles ─────────────────────────────────────────────────────

@app.route('/api/articles')
def get_articles():
    """List all published articles."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM articles ORDER BY published_at DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/articles/<slug>')
def get_article(slug):
    """Get a single article by slug."""
    conn = get_db()
    row = conn.execute("SELECT * FROM articles WHERE slug = ?", (slug,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Article not found'}), 404
    return jsonify(dict(row))


# ── Public API: Images ───────────────────────────────────────────────────────

@app.route('/api/images')
def get_images():
    conn = get_db()
    rows = conn.execute("SELECT * FROM images ORDER BY uploaded_at DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ── Admin Auth ───────────────────────────────────────────────────────────────

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    print(f"\n[DEBUG LOGIN] Attempting login for username: '{username}', password length: {len(password)}")

    conn = get_db()
    admin = conn.execute(
        "SELECT * FROM admins WHERE LOWER(username) = ?", (username,)
    ).fetchone()
    conn.close()

    if not admin:
        print(f"[DEBUG LOGIN] Admin username '{username}' not found in database!")
        return jsonify({'error': 'Invalid email or password'}), 401
    
    print(f"[DEBUG LOGIN] Admin found in DB: '{admin['username']}'")
    
    if bcrypt.check_password_hash(admin['password_hash'], password):
        print("[DEBUG LOGIN] Password match! Logging in.")
        session['admin_logged_in'] = True
        session['admin_id'] = admin['id']
        session['admin_username'] = admin['username']
        return jsonify({'message': 'Login successful', 'username': admin['username']})
    
    print(f"[DEBUG LOGIN] Password mismatch! Provided password: '{password}'")
    return jsonify({'error': 'Invalid email or password'}), 401


@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


@app.route('/api/admin/check')
def admin_check():
    if session.get('admin_logged_in'):
        return jsonify({
            'logged_in': True,
            'username': session.get('admin_username', '')
        })
    return jsonify({'logged_in': False})


# ── Forgot Password ─────────────────────────────────────────────────────────

# In-memory OTP store: { email: { code, expires_at } }
password_reset_otps = {}

ADMIN_EMAIL = 'carmelprayerhouse26@gmail.com'
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', ADMIN_EMAIL)
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')


def send_otp_email(to_email, otp_code):
    """Send OTP code via Gmail SMTP."""
    if not SMTP_PASSWORD:
        print(f"\n  ⚠️  SMTP_PASSWORD not set. OTP code for {to_email}: {otp_code}\n")
        return True  # Allow in dev mode

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = 'Parnasala Fellowship - Password Reset Code'

        body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h2 style="color: #7c3aed; margin: 0;">Parnasala Fellowship</h2>
                <p style="color: #666; font-size: 0.9rem;">Password Reset Request</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
                <p style="color: #333; margin: 0 0 1rem;">Your verification code is:</p>
                <div style="font-size: 2.5rem; font-weight: 700; letter-spacing: 0.5rem; color: #7c3aed; font-family: monospace;">
                    {otp_code}
                </div>
            </div>
            <p style="color: #888; font-size: 0.85rem; text-align: center;">
                This code expires in <strong>10 minutes</strong>.<br>
                If you did not request this, please ignore this email.
            </p>
        </div>
        """

        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"  ❌ Email send failed: {e}")
        print(f"  ⚠️  OTP code for {to_email}: {otp_code}")
        return False


@app.route('/api/admin/forgot-password', methods=['POST'])
def forgot_password():
    """Send OTP to admin email for password reset."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Check if admin exists with this email
    conn = get_db()
    admin = conn.execute(
        "SELECT * FROM admins WHERE LOWER(username) = ?", (email,)
    ).fetchone()
    conn.close()

    if not admin:
        # Don't reveal if email exists or not (security best practice)
        return jsonify({'message': 'If this email is registered, a verification code has been sent.'})

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    password_reset_otps[email] = {
        'code': otp_code,
        'expires_at': time.time() + 600  # 10 minutes
    }

    # Send email
    send_otp_email(email, otp_code)

    return jsonify({'message': 'If this email is registered, a verification code has been sent.'})


@app.route('/api/admin/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP code for password reset."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()

    if not email or not code:
        return jsonify({'error': 'Email and code are required'}), 400

    otp_data = password_reset_otps.get(email)

    if not otp_data:
        return jsonify({'error': 'No reset code found. Please request a new one.'}), 400

    if time.time() > otp_data['expires_at']:
        del password_reset_otps[email]
        return jsonify({'error': 'Code has expired. Please request a new one.'}), 400

    if otp_data['code'] != code:
        return jsonify({'error': 'Invalid code. Please try again.'}), 400

    # OTP is valid — generate a reset token
    reset_token = uuid.uuid4().hex
    password_reset_otps[email] = {
        'reset_token': reset_token,
        'expires_at': time.time() + 300  # 5 minutes to set new password
    }

    return jsonify({'message': 'Code verified', 'reset_token': reset_token})


@app.route('/api/admin/reset-password', methods=['POST'])
def reset_password():
    """Reset password using verified reset token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    reset_token = data.get('reset_token', '').strip()
    new_password = data.get('new_password', '')

    if not email or not reset_token or not new_password:
        return jsonify({'error': 'All fields are required'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    otp_data = password_reset_otps.get(email)

    if not otp_data or otp_data.get('reset_token') != reset_token:
        return jsonify({'error': 'Invalid or expired reset session. Please start over.'}), 400

    if time.time() > otp_data['expires_at']:
        del password_reset_otps[email]
        return jsonify({'error': 'Reset session expired. Please start over.'}), 400

    # Update password
    conn = get_db()
    admin = conn.execute(
        "SELECT * FROM admins WHERE LOWER(username) = ?", (email,)
    ).fetchone()

    if not admin:
        conn.close()
        return jsonify({'error': 'Account not found'}), 404

    new_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    conn.execute("UPDATE admins SET password_hash = ? WHERE id = ?", (new_hash, admin['id']))
    conn.commit()
    conn.close()

    # Clean up OTP
    del password_reset_otps[email]

    return jsonify({'message': 'Password reset successfully! You can now login with your new password.'})

@app.route('/api/admin/change-password', methods=['POST'])
@admin_required
def change_password():
    """Allow admin to change their password."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    conn = get_db()
    admin = conn.execute(
        "SELECT * FROM admins WHERE id = ?", (session['admin_id'],)
    ).fetchone()

    if not admin or not bcrypt.check_password_hash(admin['password_hash'], current_password):
        conn.close()
        return jsonify({'error': 'Current password is incorrect'}), 401

    new_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    conn.execute("UPDATE admins SET password_hash = ? WHERE id = ?", (new_hash, admin['id']))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Password changed successfully'})


# ── Admin: Songs CRUD ────────────────────────────────────────────────────────

@app.route('/api/admin/songs', methods=['POST'])
@admin_required
def add_song():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('lyrics'):
        return jsonify({'error': 'Title and lyrics are required'}), 400

    title = data['title'].strip()
    lyrics = data['lyrics'].strip()
    category = data.get('category', 'General').strip()
    slug = slugify(title)

    conn = get_db()
    # Ensure unique slug
    existing = conn.execute("SELECT id FROM songs WHERE slug = ?", (slug,)).fetchone()
    counter = 1
    original_slug = slug
    while existing:
        slug = f"{original_slug}-{counter}"
        existing = conn.execute("SELECT id FROM songs WHERE slug = ?", (slug,)).fetchone()
        counter += 1

    conn.execute(
        "INSERT INTO songs (title, lyrics, category, slug) VALUES (?, ?, ?, ?)",
        (title, lyrics, category, slug)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'Song added', 'slug': slug}), 201


@app.route('/api/admin/songs/<int:song_id>', methods=['PUT'])
@admin_required
def edit_song(song_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    conn = get_db()
    song = conn.execute("SELECT * FROM songs WHERE id = ?", (song_id,)).fetchone()
    if not song:
        conn.close()
        return jsonify({'error': 'Song not found'}), 404

    title = data.get('title', song['title']).strip()
    lyrics = data.get('lyrics', song['lyrics']).strip()
    category = data.get('category', song['category']).strip()

    # Regenerate slug if title changed
    slug = song['slug']
    if title != song['title']:
        slug = slugify(title)
        existing = conn.execute(
            "SELECT id FROM songs WHERE slug = ? AND id != ?", (slug, song_id)
        ).fetchone()
        counter = 1
        original_slug = slug
        while existing:
            slug = f"{original_slug}-{counter}"
            existing = conn.execute(
                "SELECT id FROM songs WHERE slug = ? AND id != ?", (slug, song_id)
            ).fetchone()
            counter += 1

    conn.execute(
        "UPDATE songs SET title=?, lyrics=?, category=?, slug=? WHERE id=?",
        (title, lyrics, category, slug, song_id)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'Song updated', 'slug': slug})


@app.route('/api/admin/songs/<int:song_id>', methods=['DELETE'])
@admin_required
def delete_song(song_id):
    conn = get_db()
    conn.execute("DELETE FROM songs WHERE id = ?", (song_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Song deleted'})


# ── Admin: Bulk Song Upload ──────────────────────────────────────────────────

@app.route('/api/admin/songs/upload', methods=['POST'])
@admin_required
def upload_songs():
    """Upload songs from TXT, JSON, or CSV file."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename or not allowed_file(file.filename, ALLOWED_SONG_EXTENSIONS):
        return jsonify({'error': 'Invalid file type. Use TXT, JSON, or CSV'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    content = file.read().decode('utf-8', errors='ignore')
    songs_to_add = []

    try:
        if ext == 'json':
            data = json.loads(content)
            if isinstance(data, list):
                songs_to_add = data
            elif isinstance(data, dict) and 'songs' in data:
                songs_to_add = data['songs']
            else:
                return jsonify({'error': 'JSON must be an array of songs or {songs: [...]}'}), 400

        elif ext == 'csv':
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                songs_to_add.append({
                    'title': row.get('title', '').strip(),
                    'lyrics': row.get('lyrics', '').strip(),
                    'category': row.get('category', 'General').strip()
                })

        elif ext == 'txt':
            # Format: songs separated by "---" or "==="
            # First line = title, rest = lyrics
            blocks = re.split(r'\n-{3,}\n|\n={3,}\n', content)
            for block in blocks:
                lines = block.strip().split('\n')
                if len(lines) >= 2:
                    title = lines[0].strip()
                    # Check if second line is category
                    category = 'General'
                    lyrics_start = 1
                    if lines[1].strip().startswith('Category:'):
                        category = lines[1].strip().replace('Category:', '').strip()
                        lyrics_start = 2
                    lyrics = '\n'.join(lines[lyrics_start:]).strip()
                    songs_to_add.append({
                        'title': title,
                        'lyrics': lyrics,
                        'category': category
                    })

    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 400

    if not songs_to_add:
        return jsonify({'error': 'No songs found in file'}), 400

    conn = get_db()
    added = 0
    for song in songs_to_add:
        title = song.get('title', '').strip()
        lyrics = song.get('lyrics', '').strip()
        category = song.get('category', 'General').strip()

        if not title or not lyrics:
            continue

        slug = slugify(title)
        existing = conn.execute("SELECT id FROM songs WHERE slug = ?", (slug,)).fetchone()
        counter = 1
        original_slug = slug
        while existing:
            slug = f"{original_slug}-{counter}"
            existing = conn.execute("SELECT id FROM songs WHERE slug = ?", (slug,)).fetchone()
            counter += 1

        conn.execute(
            "INSERT INTO songs (title, lyrics, category, slug) VALUES (?, ?, ?, ?)",
            (title, lyrics, category, slug)
        )

        # Auto-add category if it doesn't exist
        conn.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (category,))
        added += 1

    conn.commit()
    conn.close()

    return jsonify({'message': f'{added} songs imported successfully', 'count': added})


# ── Admin: Images ────────────────────────────────────────────────────────────

@app.route('/api/admin/images', methods=['POST'])
@admin_required
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename or not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'error': 'Invalid image type'}), 400

    caption = request.form.get('caption', '')
    ext = file.filename.rsplit('.', 1)[1].lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"img_{timestamp}.{ext}"

    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    conn = get_db()
    conn.execute(
        "INSERT INTO images (filename, caption) VALUES (?, ?)",
        (filename, caption)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': 'Image uploaded', 'filename': filename}), 201


@app.route('/api/admin/images/<int:image_id>', methods=['DELETE'])
@admin_required
def delete_image(image_id):
    conn = get_db()
    img = conn.execute("SELECT * FROM images WHERE id = ?", (image_id,)).fetchone()
    if img:
        filepath = os.path.join(UPLOAD_FOLDER, img['filename'])
        if os.path.exists(filepath):
            os.remove(filepath)
        conn.execute("DELETE FROM images WHERE id = ?", (image_id,))
        conn.commit()
    conn.close()
    return jsonify({'message': 'Image deleted'})


# ── Admin: Logo Upload ───────────────────────────────────────────────────────

@app.route('/api/admin/logo', methods=['POST'])
@admin_required
def upload_logo():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename or not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({'error': 'Invalid image type'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"logo.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    conn = get_db()
    conn.execute("UPDATE settings SET logo_url = ? WHERE id = 1", (f"/uploads/{filename}",))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Logo updated', 'logo_url': f"/uploads/{filename}"})


# ── Admin: Settings ──────────────────────────────────────────────────────────

@app.route('/api/admin/settings', methods=['PUT'])
@admin_required
def update_settings():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    conn = get_db()
    fields = ['church_name', 'tagline', 'about', 'contact', 'address']
    updates = []
    params = []

    for field in fields:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])

    if 'social_links' in data:
        updates.append("social_links = ?")
        params.append(json.dumps(data['social_links']))

    if updates:
        params.append(1)
        conn.execute(
            f"UPDATE settings SET {', '.join(updates)} WHERE id = ?",
            params
        )
        conn.commit()

    conn.close()
    return jsonify({'message': 'Settings updated'})


# ── Admin: Categories ────────────────────────────────────────────────────────

@app.route('/api/admin/categories', methods=['POST'])
@admin_required
def add_category():
    data = request.get_json()
    name = data.get('name', '').strip() if data else ''
    if not name:
        return jsonify({'error': 'Category name is required'}), 400

    conn = get_db()
    try:
        conn.execute("INSERT INTO categories (name) VALUES (?)", (name,))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Category already exists'}), 409
    conn.close()

    return jsonify({'message': 'Category added'}), 201


@app.route('/api/admin/categories/<int:cat_id>', methods=['DELETE'])
@admin_required
def delete_category(cat_id):
    conn = get_db()
    conn.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Category deleted'})


# ── Admin: Articles CRUD ─────────────────────────────────────────────────────

ALLOWED_PDF_EXTENSIONS = {'pdf'}


@app.route('/api/admin/articles', methods=['POST'])
@admin_required
def add_article():
    # Support both JSON and multipart/form-data
    if request.content_type and 'multipart/form-data' in request.content_type:
        title = request.form.get('title', '').strip()
        title_te = request.form.get('title_te', '').strip()
        content = request.form.get('content', '').strip()
        pdf_url = ''

        # Handle PDF upload
        if 'pdf_file' in request.files:
            pdf_file = request.files['pdf_file']
            if pdf_file.filename and allowed_file(pdf_file.filename, ALLOWED_PDF_EXTENSIONS):
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_id = uuid.uuid4().hex[:6]
                pdf_filename = f"article_{timestamp}_{unique_id}.pdf"
                pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
                pdf_file.save(pdf_path)
                pdf_url = f"/uploads/{pdf_filename}"
    else:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        title = data.get('title', '').strip()
        title_te = data.get('title_te', '').strip()
        content = data.get('content', '').strip()
        pdf_url = data.get('pdf_url', '').strip()

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    if not content and not pdf_url:
        return jsonify({'error': 'Please provide either text content or a PDF file (or both)'}), 400

    slug = slugify(title)

    conn = get_db()
    existing = conn.execute("SELECT id FROM articles WHERE slug = ?", (slug,)).fetchone()
    counter = 1
    original_slug = slug
    while existing:
        slug = f"{original_slug}-{counter}"
        existing = conn.execute("SELECT id FROM articles WHERE slug = ?", (slug,)).fetchone()
        counter += 1

    conn.execute(
        "INSERT INTO articles (title, title_te, content, pdf_url, slug) VALUES (?, ?, ?, ?, ?)",
        (title, title_te, content, pdf_url, slug)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Article added', 'slug': slug}), 201


@app.route('/api/admin/articles/<int:article_id>', methods=['PUT'])
@admin_required
def edit_article(article_id):
    conn = get_db()
    article = conn.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
    if not article:
        conn.close()
        return jsonify({'error': 'Article not found'}), 404

    # Support both JSON and multipart/form-data
    if request.content_type and 'multipart/form-data' in request.content_type:
        title = request.form.get('title', article['title']).strip()
        title_te = request.form.get('title_te', article['title_te'] or '').strip()
        content = request.form.get('content', article['content'] or '').strip()
        pdf_url = article['pdf_url'] or ''

        # Handle PDF upload
        if 'pdf_file' in request.files:
            pdf_file = request.files['pdf_file']
            if pdf_file.filename and allowed_file(pdf_file.filename, ALLOWED_PDF_EXTENSIONS):
                # Delete old PDF if exists
                if article['pdf_url']:
                    old_pdf = article['pdf_url'].replace('/uploads/', '')
                    old_path = os.path.join(UPLOAD_FOLDER, old_pdf)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                unique_id = uuid.uuid4().hex[:6]
                pdf_filename = f"article_{timestamp}_{unique_id}.pdf"
                pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
                pdf_file.save(pdf_path)
                pdf_url = f"/uploads/{pdf_filename}"

        # Check if user wants to remove PDF
        if request.form.get('remove_pdf') == '1':
            if article['pdf_url']:
                old_pdf = article['pdf_url'].replace('/uploads/', '')
                old_path = os.path.join(UPLOAD_FOLDER, old_pdf)
                if os.path.exists(old_path):
                    os.remove(old_path)
            pdf_url = ''
    else:
        data = request.get_json()
        if not data:
            conn.close()
            return jsonify({'error': 'No data provided'}), 400
        title = data.get('title', article['title']).strip()
        title_te = data.get('title_te', article['title_te'] or '').strip()
        content = data.get('content', article['content'] or '').strip()
        pdf_url = data.get('pdf_url', article['pdf_url'] or '').strip()

        # Check if user wants to remove PDF
        if data.get('remove_pdf'):
            if article['pdf_url']:
                old_pdf = article['pdf_url'].replace('/uploads/', '')
                old_path = os.path.join(UPLOAD_FOLDER, old_pdf)
                if os.path.exists(old_path):
                    os.remove(old_path)
            pdf_url = ''

    if not title:
        conn.close()
        return jsonify({'error': 'Title is required'}), 400

    if not content and not pdf_url:
        conn.close()
        return jsonify({'error': 'Please provide either text content or a PDF file (or both)'}), 400

    slug = article['slug']
    if title != article['title']:
        slug = slugify(title)
        existing = conn.execute(
            "SELECT id FROM articles WHERE slug = ? AND id != ?", (slug, article_id)
        ).fetchone()
        counter = 1
        original_slug = slug
        while existing:
            slug = f"{original_slug}-{counter}"
            existing = conn.execute(
                "SELECT id FROM articles WHERE slug = ? AND id != ?", (slug, article_id)
            ).fetchone()
            counter += 1

    conn.execute(
        "UPDATE articles SET title=?, title_te=?, content=?, pdf_url=?, slug=? WHERE id=?",
        (title, title_te, content, pdf_url, slug, article_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Article updated', 'slug': slug})


@app.route('/api/admin/articles/<int:article_id>', methods=['DELETE'])
@admin_required
def delete_article(article_id):
    conn = get_db()
    article = conn.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
    if article and article['pdf_url']:
        pdf_name = article['pdf_url'].replace('/uploads/', '')
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_name)
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
    conn.execute("DELETE FROM articles WHERE id = ?", (article_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Article deleted'})


# ── Initialize & Run ─────────────────────────────────────────────────────────

with app.app_context():
    init_db()

if __name__ == '__main__':
    print("\n  🎵 Parnasala Fellowship Songs Book")
    print("  ─────────────────────────────")
    print("  Open: http://localhost:5000\n")
    app.run(debug=True, port=5000)
