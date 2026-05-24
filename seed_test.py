import sqlite3, requests

conn = sqlite3.connect('database.db')

# Clean old test songs
conn.execute("DELETE FROM songs WHERE slug LIKE 'test-%'")
conn.commit()

# Insert test songs covering various Telugu first letters with matras
test_songs = [
    ('test-ja-u', 'జుంటె తేనె', 'Junte Thene', 'lyrics...', 'Worship'),      # జ + ు matra
    ('test-ya-a', 'యేసు రాజా', 'Yesu Raja', 'lyrics...', 'Praise'),           # య + ే matra
    ('test-ka-a', 'కాపరి దేవుడా', 'Kapari Devuda', 'lyrics...', 'Worship'),  # క + ా matra
    ('test-a-plain', 'అద్భుత దేవుడా', 'Adbhuta Devuda', 'lyrics...', 'Hymns'), # అ plain vowel
    ('test-na', 'నా జీవితం', 'Naa Jeevitham', 'lyrics...', 'Prayer'),          # న plain
    ('test-pa-u', 'పులి వచ్చింది', 'Puli Vachhindi', 'lyrics...', 'Youth'),   #ప + ు matra
    ('test-en-p', '', 'Praise the Lord', 'lyrics...', 'Praise'),               # English P
    ('test-en-h', '', 'Holy Holy', 'lyrics...', 'Worship'),                    # English H
]

for slug, title_te, title_en, lyrics, cat in test_songs:
    try:
        conn.execute(
            'INSERT INTO songs (title, title_te, title_en, lyrics, category, slug) VALUES (?, ?, ?, ?, ?, ?)',
            (title_en, title_te, title_en, lyrics, cat, slug)
        )
    except Exception as e:
        print(f'Skip {slug}: {e}')

conn.commit()
conn.close()

# Verify via API
r = requests.get('http://127.0.0.1:5000/api/songs')
data = r.json()
print(f'Total songs now: {len(data)}')
for s in data:
    te = s.get('title_te', '')
    en = s.get('title_en', '')
    first = hex(ord(te[0])) if te else 'EMPTY'
    print(f'  {en} | te_first={first}')
