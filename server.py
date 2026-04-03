"""
Telugu Christian Songbook - Flask Backend
==========================================
Admin Login:  admin / admin123
Run:          python server.py
Visit:        http://localhost:5000
"""

from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os

app = Flask(__name__, static_folder='.', static_url_path='')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'songbook.db')

# ==========================================
# Database Setup
# ==========================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Admin table
    c.execute('''CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )''')

    # Songs table
    c.execute('''CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER UNIQUE NOT NULL,
        title_te TEXT NOT NULL,
        title_en TEXT NOT NULL,
        lyrics TEXT NOT NULL
    )''')

    # Church settings table
    c.execute('''CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        church_name TEXT,
        logo_url TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        photo1_url TEXT,
        photo2_url TEXT,
        photo3_url TEXT
    )''')

    # Seed default admin (admin / admin123)
    c.execute("SELECT COUNT(*) FROM admin")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO admin (username, password) VALUES (?, ?)", ('Parnasala_admin', 'Parnasala@fellowship2026'))

    # Seed default church settings
    c.execute("SELECT COUNT(*) FROM settings")
    if c.fetchone()[0] == 0:
        c.execute("""INSERT INTO settings 
            (id, church_name, logo_url, address, phone, email, photo1_url, photo2_url, photo3_url) 
            VALUES (1, 'Telugu Christian Songbook', '', 
            'Main Road, Your City, State - 500001', 
            '+91 98765 43210', 
            'info@church.com',
            '', '', '')""")

    # Seed sample songs
    c.execute("SELECT COUNT(*) FROM songs")
    if c.fetchone()[0] == 0:
        sample_songs = [
            (1, 'దేవా నీకు స్తోత్రము', 'Deva Neeku Sthothramu',
             'దేవా నీకు స్తోత్రము\nనా దేవా నీకు స్తోత్రము\n\n1. పగటి ఎండకైనను రాత్రి వెన్నెలకైనను\nనన్ను కాపాడు వాడవు నీవే నా దేవా'),
            (2, 'రాజ రాజ యేసు రాజా', 'Raja Raja Yesu Raja',
             'రాజ రాజ యేసు రాజా\nస్తుతి మహిమలు నీకేనయ్యా\n\nజీవమిచ్చిన నా యేసయ్యా\nకృప చూపిన నా యేసయ్యా'),
            (3, 'నా యేసయ్యా నాకు ధైర్యం', 'Naa Yesayya Naaku Dhairyam',
             'నా యేసయ్యా నాకు ధైర్యం\nనా యేసయ్యా నాకు బలం\n\n1. కష్టాలలో నన్ను కాచిన దేవా\nనష్టాలలో నన్ను నడిపిన దేవా'),
            (4, 'స్తుతి చేయండి ప్రభుని', 'Stuti Cheyandi Prabhuni',
             'స్తుతి చేయండి ప్రభుని\nస్తుతి చేయండి ప్రభుని\n\n1. ఆయన కృప గొప్పది\nఆయన ప్రేమ నిత్యమైనది'),
            (5, 'హల్లెలూయ హల్లెలూయ', 'Hallelujah Hallelujah',
             'హల్లెలూయ హల్లెలూయ\nహల్లెలూయ హల్లెలూయ\n\n1. ప్రభువును స్తుతించండి\nఆయన నామము ఘనపరచండి')
        ]
        c.executemany("INSERT INTO songs (number, title_te, title_en, lyrics) VALUES (?, ?, ?, ?)", sample_songs)

    conn.commit()
    conn.close()

# ==========================================
# Serve Frontend
# ==========================================
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# ==========================================
# API: Admin Login
# ==========================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')

    conn = get_db()
    user = conn.execute("SELECT * FROM admin WHERE username = ? AND password = ?", (username, password)).fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "message": "Login successful"})
    else:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

# ==========================================
# API: Songs CRUD
# ==========================================
@app.route('/api/songs', methods=['GET'])
def get_songs():
    conn = get_db()
    songs = conn.execute("SELECT * FROM songs ORDER BY number ASC").fetchall()
    conn.close()
    return jsonify([dict(s) for s in songs])

@app.route('/api/songs', methods=['POST'])
def add_song():
    data = request.get_json()
    conn = get_db()
    try:
        conn.execute("INSERT INTO songs (number, title_te, title_en, lyrics) VALUES (?, ?, ?, ?)",
                     (data['number'], data['title_te'], data['title_en'], data['lyrics']))
        conn.commit()
        return jsonify({"success": True, "message": "Song added!"})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Song number already exists!"}), 400
    finally:
        conn.close()

@app.route('/api/songs/<int:song_id>', methods=['PUT'])
def update_song(song_id):
    data = request.get_json()
    conn = get_db()
    conn.execute("UPDATE songs SET number=?, title_te=?, title_en=?, lyrics=? WHERE id=?",
                 (data['number'], data['title_te'], data['title_en'], data['lyrics'], song_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Song updated!"})

@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    conn = get_db()
    conn.execute("DELETE FROM songs WHERE id=?", (song_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Song deleted!"})

# ==========================================
# API: Church Settings
# ==========================================
@app.route('/api/settings', methods=['GET'])
def get_settings():
    conn = get_db()
    settings = conn.execute("SELECT * FROM settings WHERE id=1").fetchone()
    conn.close()
    if settings:
        return jsonify(dict(settings))
    return jsonify({})

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    data = request.get_json()
    conn = get_db()
    conn.execute("""UPDATE settings SET 
        church_name=?, logo_url=?, address=?, phone=?, email=?,
        photo1_url=?, photo2_url=?, photo3_url=?
        WHERE id=1""",
        (data.get('church_name', ''), data.get('logo_url', ''),
         data.get('address', ''), data.get('phone', ''), data.get('email', ''),
         data.get('photo1_url', ''), data.get('photo2_url', ''), data.get('photo3_url', '')))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Settings updated!"})

# ==========================================
# API: Update Admin Password
# ==========================================
@app.route('/api/admin/password', methods=['PUT'])
def update_password():
    data = request.get_json()
    conn = get_db()
    conn.execute("UPDATE admin SET password=? WHERE username='Parnasala_admin'", (data['password'],))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Password updated!"})

# Initialize DB at module level (needed for gunicorn on Render)
init_db()

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  Telugu Christian Songbook Server")
    print("  Admin Login:  Parnasala_admin / Parnasala@fellowship2026")
    print("  URL: http://localhost:5000")
    print("="*50 + "\n")
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
