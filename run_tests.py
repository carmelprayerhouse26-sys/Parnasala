import os
import sys
import json
import sqlite3
import unittest
import io

# Set test database path before importing app or config
TEST_DB_PATH = 'test_database.db'
os.environ['DATABASE_PATH'] = TEST_DB_PATH

# Import application components
from app import app, init_db
from config import DATABASE

class ParnasalaFellowshipTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test environment and initialize a clean test database."""
        # Clean up any leftover test database files
        self._cleanup_db_files()
        
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key-123'
        self.client = app.test_client()
        
        # Initialize test database
        with app.app_context():
            init_db()

    def tearDown(self):
        """Clean up database files after tests."""
        self._cleanup_db_files()

    def _cleanup_db_files(self):
        """Helper to delete test SQLite files."""
        for suffix in ['', '-journal', '-wal', '-shm']:
            path = TEST_DB_PATH + suffix
            if os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

    def _login_admin(self):
        """Helper to log in as the default admin."""
        return self.client.post('/api/admin/login', json={
            'username': 'carmelprayerhouse26@gmail.com',
            'password': 'Parnasala@fellowship'
        })

    def test_public_routes_initial_state(self):
        """Test public endpoints return default seeded data or empty results correctly."""
        print("\n  - Testing public routes initial state...")
        
        # 1. Test index page serving
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        
        # 2. Test initial empty songs listing
        response = self.client.get('/api/songs')
        self.assertEqual(response.status_code, 200)
        songs = response.get_json()
        self.assertEqual(len(songs), 0)

        # 3. Test seeded default categories
        response = self.client.get('/api/categories')
        self.assertEqual(response.status_code, 200)
        categories = response.get_json()
        self.assertTrue(len(categories) > 0)
        category_names = [c['name'] for c in categories]
        self.assertIn('Worship', category_names)
        self.assertIn('Praise', category_names)

        # 4. Test default settings
        response = self.client.get('/api/settings')
        self.assertEqual(response.status_code, 200)
        settings = response.get_json()
        self.assertEqual(settings.get('church_name'), 'Parnasala Fellowship')

    def test_admin_authentication(self):
        """Test admin authentication flows including login, checks, and logout."""
        print("  - Testing admin authentication...")

        # 1. Check initially not logged in
        response = self.client.get('/api/admin/check')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()['logged_in'])

        # 2. Try login with invalid password
        response = self.client.post('/api/admin/login', json={
            'username': 'carmelprayerhouse26@gmail.com',
            'password': 'WrongPassword123'
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.get_json())

        # 3. Login with correct credentials
        response = self._login_admin()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['username'], 'carmelprayerhouse26@gmail.com')

        # 4. Verify login check is now true
        response = self.client.get('/api/admin/check')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()['logged_in'])

        # 5. Logout
        response = self.client.post('/api/admin/logout')
        self.assertEqual(response.status_code, 200)

        # 6. Verify logged out state
        response = self.client.get('/api/admin/check')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()['logged_in'])

    def test_songs_crud_operations(self):
        """Test full CRUD operations on songs under authenticated admin."""
        print("  - Testing songs CRUD operations...")

        # 1. Attempt adding song without authentication (should fail)
        response = self.client.post('/api/admin/songs', json={
            'title_te': 'ఆరాధన',
            'title_en': 'Aradhana',
            'lyrics': 'Lyrics of Aradhana',
            'category': 'Worship'
        })
        self.assertEqual(response.status_code, 401)

        # 2. Login as admin
        self._login_admin()

        # 3. Add song successfully
        response = self.client.post('/api/admin/songs', json={
            'title_te': 'ఆరాధన',
            'title_en': 'Aradhana',
            'lyrics': 'Lyrics of Aradhana',
            'category': 'Worship'
        })
        self.assertEqual(response.status_code, 201)
        res_data = response.get_json()
        self.assertEqual(res_data['slug'], 'aradhana')

        # 4. Read songs list and verify the song is there
        response = self.client.get('/api/songs')
        self.assertEqual(response.status_code, 200)
        songs = response.get_json()
        self.assertEqual(len(songs), 1)
        song_id = songs[0]['id']
        self.assertEqual(songs[0]['title_te'], 'ఆరాధన')
        self.assertEqual(songs[0]['title_en'], 'Aradhana')
        self.assertEqual(songs[0]['category'], 'Worship')

        # 5. Read a single song by slug
        response = self.client.get('/api/songs/aradhana')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['lyrics'], 'Lyrics of Aradhana')

        # 6. Update the song
        response = self.client.put(f'/api/admin/songs/{song_id}', json={
            'title_te': 'ఆరాధన పరిశుద్ధునికి',
            'title_en': 'Aradhana Parishudhuniki',
            'lyrics': 'New lyrics of Aradhana',
            'category': 'Praise'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['slug'], 'aradhana-parishudhuniki')

        # 7. Check the updated song
        response = self.client.get('/api/songs/aradhana-parishudhuniki')
        self.assertEqual(response.status_code, 200)
        song = response.get_json()
        self.assertEqual(song['title_te'], 'ఆరాధన పరిశుద్ధునికి')
        self.assertEqual(song['lyrics'], 'New lyrics of Aradhana')
        self.assertEqual(song['category'], 'Praise')

        # 8. Delete the song
        response = self.client.delete(f'/api/admin/songs/{song_id}')
        self.assertEqual(response.status_code, 200)

        # 9. Verify song is gone
        response = self.client.get('/api/songs')
        self.assertEqual(len(response.get_json()), 0)

    def test_telugu_characters_and_words_indexing_and_filtering(self):
        """Test precise Telugu Unicode character and starting word extraction, indexing, and filtering."""
        print("  - Testing Telugu Unicode indexing and search filters...")

        self._login_admin()

        # Add songs with various Telugu characters and matras
        # Song 1: "యేసు రాజా" starting with "య" vowel-sign "ే" (ye)
        self.client.post('/api/admin/songs', json={
            'title_te': 'యేసు రాజా',
            'title_en': 'Yesu Raja',
            'lyrics': 'యేసు రాజా నీకే స్తోత్రము',
            'category': 'Praise'
        })
        # Song 2: "కాపరి దేవుడా" starting with "క" vowel-sign "ా" (ka)
        self.client.post('/api/admin/songs', json={
            'title_te': 'కాపరి దేవుడా',
            'title_en': 'Kapari Devuda',
            'lyrics': 'కాపరి నా కాపరి',
            'category': 'Worship'
        })
        # Song 3: "అద్భుత దేవుడా" starting with "అ" plain vowel (a)
        self.client.post('/api/admin/songs', json={
            'title_te': 'అద్భుత దేవుడా',
            'title_en': 'Adbhuta Devuda',
            'lyrics': 'అద్భుత కరుడా ఆలోచన కర్త',
            'category': 'Worship'
        })

        # 1. Test Telugu character index endpoint U+0C00 range
        response = self.client.get('/api/telugu-char-index')
        self.assertEqual(response.status_code, 200)
        chars = response.get_json()
        
        # Verify characters returned correspond to the first plain Telugu character
        char_list = [item['character'] for item in chars]
        self.assertIn('య', char_list)
        self.assertIn('క', char_list)
        self.assertIn('అ', char_list)
        
        # Verify count is 1 for each
        for item in chars:
            if item['character'] in ['య', 'క', 'అ']:
                self.assertEqual(item['count'], 1)

        # 2. Test Telugu words index
        response = self.client.get('/api/telugu-words')
        self.assertEqual(response.status_code, 200)
        words = response.get_json()
        word_list = [w['word'] for w in words]
        self.assertIn('యేసు', word_list)
        self.assertIn('కాపరి', word_list)
        self.assertIn('అద్భుత', word_list)

        # 3. Test filtering songs list by Telugu Character
        response = self.client.get('/api/songs?telugu_char=య')
        self.assertEqual(response.status_code, 200)
        filtered = response.get_json()
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0]['title_en'], 'Yesu Raja')

        # 4. Test filtering songs list by Telugu Word
        response = self.client.get('/api/songs?telugu_word=కాపరి')
        self.assertEqual(response.status_code, 200)
        filtered = response.get_json()
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered[0]['title_en'], 'Kapari Devuda')

    def test_backup_export_and_import(self):
        """Test database export backup, modifying database, and restoring database completely via import."""
        print("  - Testing database backup export and import...")

        self._login_admin()

        # Add initial songs
        self.client.post('/api/admin/songs', json={
            'title_te': 'స్తుతి మహిమ',
            'title_en': 'Stuthi Mahima',
            'lyrics': 'స్తుతి మహిమలు నీకే...',
            'category': 'Praise'
        })
        self.client.post('/api/admin/songs', json={
            'title_te': 'ప్రభు యేసు',
            'title_en': 'Prabhu Yesu',
            'lyrics': 'ప్రభు యేసు నామమున...',
            'category': 'Worship'
        })

        # 1. Export database backup
        response = self.client.get('/api/admin/db/export')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content_type, 'application/json')
        backup_content = response.data

        backup_data = json.loads(backup_content.decode('utf-8'))
        self.assertEqual(backup_data['version'], '1.0')
        self.assertTrue(len(backup_data['songs']) >= 2)

        # 2. Empty the database of songs using raw connections or CRUD
        response = self.client.get('/api/songs')
        songs = response.get_json()
        for song in songs:
            self.client.delete(f'/api/admin/songs/{song["id"]}')

        # Verify songs are 0
        response = self.client.get('/api/songs')
        self.assertEqual(len(response.get_json()), 0)

        # 3. Restore database by uploading the backup JSON file
        response = self.client.post('/api/admin/db/import', data={
            'file': (io.BytesIO(backup_content), 'backup.json')
        }, content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('Import complete', response.get_json()['message'])

        # 4. Verify songs have been successfully restored
        response = self.client.get('/api/songs')
        restored_songs = response.get_json()
        self.assertEqual(len(restored_songs), 2)
        restored_titles = [s['title_en'] for s in restored_songs]
        self.assertIn('Stuthi Mahima', restored_titles)
        self.assertIn('Prabhu Yesu', restored_titles)

    def test_articles_crud(self):
        """Test full CRUD operations on Articles."""
        print("  - Testing articles CRUD operations...")

        self._login_admin()

        # 1. Add article
        response = self.client.post('/api/admin/articles', json={
            'title': 'The Importance of Praise',
            'title_te': 'స్తుతి యొక్క ప్రాముఖ్యత',
            'content': 'Praising God brings joy and strength...',
            'pdf_url': ''
        })
        self.assertEqual(response.status_code, 201)
        res_data = response.get_json()
        self.assertEqual(res_data['slug'], 'the-importance-of-praise')

        # 2. List articles
        response = self.client.get('/api/articles')
        self.assertEqual(response.status_code, 200)
        articles = response.get_json()
        self.assertEqual(len(articles), 1)
        article_id = articles[0]['id']
        self.assertEqual(articles[0]['title'], 'The Importance of Praise')

        # 3. Get single article
        response = self.client.get('/api/articles/the-importance-of-praise')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['title_te'], 'స్తుతి యొక్క ప్రాముఖ్యత')

        # 4. Edit article
        response = self.client.put(f'/api/admin/articles/{article_id}', json={
            'title': 'The Power of Praise',
            'title_te': 'స్తుతి యొక్క శక్తి',
            'content': 'Updated content regarding praising God...',
            'pdf_url': ''
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['slug'], 'the-power-of-praise')

        # 5. Check updated article
        response = self.client.get('/api/articles/the-power-of-praise')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['title'], 'The Power of Praise')

        # 6. Delete article
        response = self.client.delete(f'/api/admin/articles/{article_id}')
        self.assertEqual(response.status_code, 200)

        # 7. Check articles are empty
        response = self.client.get('/api/articles')
        self.assertEqual(len(response.get_json()), 0)

if __name__ == '__main__':
    print("\n========================================================")
    print("RUNNING AUTOMATED TEST SUITE FOR PARNASALA SONGS APP")
    print("========================================================\n")
    
    # Run tests using the unittest framework with verbose output
    suite = unittest.TestLoader().loadTestsFromTestCase(ParnasalaFellowshipTestCase)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Exit with code 0 if successful, 1 if failures/errors occurred
    sys.exit(not result.wasSuccessful())
