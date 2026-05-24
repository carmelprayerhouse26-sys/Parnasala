import sqlite3, requests

# Check what songs exist
conn = sqlite3.connect('database.db')
conn.row_factory = sqlite3.Row
songs = conn.execute('SELECT title_te, title_en, slug FROM songs').fetchall()
print(f'Songs in DB: {len(songs)}')
for s in songs:
    te = s['title_te']
    en = s['title_en']
    slug = s['slug']
    print(f'  slug={slug}, title_en={en}')

# Also check via API
r = requests.get('http://127.0.0.1:5000/api/songs')
data = r.json()
print(f'API returns: {len(data)} songs')
for s in data:
    te = s.get('title_te', '')
    en = s.get('title_en', '')
    print(f'  API: en={en} te_first_char={hex(ord(te[0])) if te else "EMPTY"}')

conn.close()
