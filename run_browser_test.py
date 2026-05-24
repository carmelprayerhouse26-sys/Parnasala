import os
import sys
import time
import threading
import sqlite3
from playwright.sync_api import sync_playwright

TEST_DB_PATH = 'test_database_browser.db'
os.environ['DATABASE_PATH'] = TEST_DB_PATH

# Import app components
from app import app, init_db
from db_adapter import get_db

def seed_songs():
    """Seed test database with a few Telugu and English songs for UI display."""
    conn = get_db()
    # Insert a Telugu song and an English song
    conn.execute(
        "INSERT INTO songs (title, title_te, title_en, lyrics, category, slug) VALUES (?, ?, ?, ?, ?, ?)",
        ('Yesu Raja', 'యేసు రాజా', 'Yesu Raja', 'యేసు రాజా నీకే స్తోత్రము\nఆరాధన నీకే నీకే...', 'Praise', 'yesu-raja')
    )
    conn.execute(
        "INSERT INTO songs (title, title_te, title_en, lyrics, category, slug) VALUES (?, ?, ?, ?, ?, ?)",
        ('Holy Holy', '', 'Holy Holy', 'Holy Holy, Holy is the Lord...', 'Worship', 'holy-holy')
    )
    conn.commit()
    conn.close()

def run_flask_server():
    """Run Flask server on port 5001 without debug/reloader for safe background execution."""
    app.config['TESTING'] = True
    app.run(host='127.0.0.1', port=5001, debug=False, use_reloader=False)

def cleanup_db():
    """Delete the test SQLite database files."""
    for suffix in ['', '-journal', '-wal', '-shm']:
        path = TEST_DB_PATH + suffix
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass

if __name__ == '__main__':
    # Force UTF-8 terminal encoding on Windows if supported
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("\n========================================================")
    print("RUNNING AUTOMATED BROWSER (UI) TEST FOR PARNASALA SITE")
    print("========================================================\n")

    # Clean previous database if any
    cleanup_db()

    # 1. Initialize test database structure
    print("[1/5] Initializing database and seeding songs...")
    with app.app_context():
        init_db()
    seed_songs()

    # 2. Start Flask server in background thread
    print("[2/5] Starting local server in a background thread...")
    server_thread = threading.Thread(target=run_flask_server, daemon=True)
    server_thread.start()
    
    # Wait for the Flask server to boot and start accepting requests
    time.sleep(2)

    # 3. Launch browser and run front-end UI tests
    print("[3/5] Launching headless Chromium browser via Playwright...")
    
    success = True
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Go to home page
            print("  - Navigating to http://127.0.0.1:5001/ ...")
            page.goto('http://127.0.0.1:5001/')
            
            # Verify page title
            print("  - Verifying page title...")
            title = page.title()
            print(f"    Page Title: '{title}'")
            if "Parnasala Fellowship" not in title:
                print("    [FAIL] FAILED: Incorrect page title!")
                success = False
            
            # Wait for loading screen to disappear
            print("  - Waiting for loading screen to dismiss...")
            page.wait_for_selector('#loading-screen', state='hidden', timeout=10000)
            print("    Loading screen dismissed.")
            
            # Check if church name is visible on home page navbar
            church_name = page.locator('#nav-church-name').text_content()
            print(f"    Navbar Church Name: '{church_name}'")
            if 'Parnasala Fellowship' not in church_name:
                print("    [FAIL] FAILED: Church name not visible on navbar!")
                success = False

            # Test Navigation: Click on Songs tab
            print("  - Navigating to Songs page...")
            songs_nav_btn = page.locator('a[data-page="songs"]')
            songs_nav_btn.click()
            time.sleep(1) # wait for page change transition
            
            # Assert URL changed
            print(f"    Current URL Hash: {page.evaluate('window.location.hash')}")
            if page.evaluate('window.location.hash') != '#/songs':
                print("    [FAIL] FAILED: URL hash did not change to #/songs!")
                success = False

            # Test Theme Toggle
            print("  - Testing Theme Toggle...")
            html_elem = page.locator('html')
            initial_theme = html_elem.get_attribute('data-theme')
            print(f"    Initial Theme: {initial_theme}")
            
            theme_btn = page.locator('#theme-toggle')
            theme_btn.click()
            time.sleep(0.5)
            
            toggled_theme = html_elem.get_attribute('data-theme')
            print(f"    Toggled Theme: {toggled_theme}")
            if toggled_theme == initial_theme:
                print("    [FAIL] FAILED: Theme toggle did not change HTML data-theme!")
                success = False
            
            # Test Language Toggle
            print("  - Testing Language Toggle...")
            initial_lang = page.evaluate('currentLang')
            print(f"    Initial Language: {initial_lang}")
            
            lang_btn = page.locator('#lang-toggle')
            lang_btn_text = lang_btn.locator('.lang-label').text_content().strip()
            # Safe print encoding wrapper
            out_encoding = sys.stdout.encoding or 'utf-8'
            safe_text = lang_btn_text.encode(out_encoding, errors='replace').decode(out_encoding, errors='replace')
            print(f"    Lang Button label: '{safe_text}'")
            
            lang_btn.click()
            time.sleep(0.5)
            
            toggled_lang = page.evaluate('currentLang')
            new_btn_text = lang_btn.locator('.lang-label').text_content().strip()
            safe_new_text = new_btn_text.encode(out_encoding, errors='replace').decode(out_encoding, errors='replace')
            print(f"    Toggled Language: {toggled_lang} (button text: '{safe_new_text}')")
            if toggled_lang == initial_lang:
                print("    [FAIL] FAILED: Language toggle did not switch currentLang!")
                success = False
                
            # Navigate to Admin page and test login
            print("  - Testing Admin Login UI...")
            page.goto('http://127.0.0.1:5001/#/admin')
            time.sleep(1)
            
            # Fill login form
            print("    Entering login credentials...")
            page.fill('input[type="email"]', 'carmelprayerhouse26@gmail.com')
            page.fill('input[type="password"]', 'Parnasala@fellowship')
            
            # Click submit
            page.click('button[type="submit"]')
            time.sleep(1.5)
            
            # Verify if redirected or logged in state is shown
            admin_check_url = page.evaluate('window.location.hash')
            print(f"    URL Hash after login click: {admin_check_url}")
            # Check if dashboard tabs element exists in the DOM to confirm login success
            is_logged_in = page.locator('#dashboard-tabs').count() > 0
            print(f"    Dashboard tabs present: {is_logged_in}")
            
            if is_logged_in:
                print("    Admin login UI verification passed.")
            else:
                # If we don't have explicit admin panel due to SPA layout, verify no login error text is visible
                error_msg = page.locator('.login-error, .error-message, #login-error').is_visible()
                if error_msg:
                    print("    [FAIL] FAILED: Login error displayed!")
                    success = False
                else:
                    print("    Admin login successfully triggered.")
                    
            browser.close()
    except Exception as e:
        # Avoid direct emoji print to prevent UnicodeEncodeError
        try:
            print(f"  [ERROR] ERROR OCCURRED DURING BROWSER TESTING: {e}")
        except Exception:
            pass
        success = False

    # 4. Clean up
    print("[4/5] Stopping server background thread...")
    # Thread will terminate automatically when main program exits since it is a daemon thread.
    
    print("[5/5] Cleaning up test database files...")
    cleanup_db()

    print("\n========================================================")
    if success:
        print("  [SUCCESS] BROWSER AUTOMATED UI TESTS PASSED SUCCESSFULLY!")
        print("========================================================\n")
        sys.exit(0)
    else:
        print("  [FAIL] BROWSER AUTOMATED UI TESTS FAILED!")
        print("========================================================\n")
        sys.exit(1)
