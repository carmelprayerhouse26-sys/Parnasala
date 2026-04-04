"""
Seed Data — Initial admin, settings, categories, and sample songs.
Run: python seed_data.py
"""

import sqlite3
import os
from flask_bcrypt import Bcrypt
from flask import Flask
from config import DATABASE

app = Flask(__name__)
bcrypt = Bcrypt(app)


def seed():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()

    # ── Create tables ────────────────────────────────────────────────────
    cur.executescript('''
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
    ''')

    # ── Admin account ────────────────────────────────────────────────────
    pw_hash = bcrypt.generate_password_hash('Parnasala@fellowship').decode('utf-8')
    cur.execute("DELETE FROM admins")
    cur.execute(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        ('carmelprayerhouse26@gmail.com', pw_hash)
    )

    # ── Categories ───────────────────────────────────────────────────────
    categories = ['Worship', 'Praise', 'Youth', 'Hymns', 'Christmas', 'Easter', 'Prayer']
    for cat in categories:
        cur.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

    # ── Settings ─────────────────────────────────────────────────────────
    cur.execute("DELETE FROM settings")
    cur.execute("""
        INSERT INTO settings (id, church_name, tagline, about, contact, address, social_links)
        VALUES (1, ?, ?, ?, ?, ?, ?)
    """, (
        'Parnasala Fellowship',
        'A Place of Worship and Fellowship | ఆరాధన మరియు సహవాసం కొరకు',
        'Welcome to Parnasala Fellowship. We are a community of believers committed to worship, prayer, and fellowship. Our church is a place where everyone is welcome to experience the love of God.\n\nపర్ణశాల ఫెలోషిప్‌కి స్వాగతం. మేము ఆరాధన, ప్రార్థన మరియు సహవాసం కోసం అంకితమైన విశ్వాసుల సమాజం.',
        'Phone: +91 98765 43210\nEmail: carmelprayerhouse26@gmail.com\nService Times:\n  Sunday Worship: 10:00 AM\n  Wednesday Prayer: 7:00 PM\n  Friday Youth Meeting: 6:30 PM',
        'Parnasala Fellowship\nAndhra Pradesh, India',
        '{"facebook":"#","youtube":"#","instagram":"#","whatsapp":"#"}'
    ))

    # ── Sample Songs (English + Telugu) ──────────────────────────────────
    songs = [
        {
            "title": "Amazing Grace",
            "title_te": "అద్భుతమైన కృప",
            "lyrics": "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now I'm found\nWas blind, but now I see\n\n'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed\n\nThrough many dangers, toils and snares\nI have already come\n'Tis grace hath brought me safe thus far\nAnd grace will lead me home",
            "category": "Hymns",
            "slug": "amazing-grace"
        },
        {
            "title": "How Great Is Our God",
            "title_te": "మన దేవుడు ఎంత గొప్పవాడు",
            "lyrics": "The splendor of the King\nClothed in majesty\nLet all the Earth rejoice\nAll the Earth rejoice\n\nHe wraps himself in light\nAnd darkness tries to hide\nAnd trembles at His voice\nTrembles at His voice\n\nHow great is our God, sing with me\nHow great is our God, and all will see\nHow great, how great is our God",
            "category": "Worship",
            "slug": "how-great-is-our-god"
        },
        {
            "title": "Blessed Assurance",
            "title_te": "ధన్య నిశ్చయత",
            "lyrics": "Blessed assurance, Jesus is mine\nOh what a foretaste of glory divine\nHeir of salvation, purchase of God\nBorn of His Spirit, washed in His blood\n\nThis is my story, this is my song\nPraising my Savior all the day long\nThis is my story, this is my song\nPraising my Savior all the day long",
            "category": "Hymns",
            "slug": "blessed-assurance"
        },
        {
            "title": "Yesayya Nee Prema",
            "title_te": "యేసయ్యా నీ ప్రేమ",
            "lyrics": "యేసయ్యా నీ ప్రేమ నన్ను చేరెను\nనీ కృప నన్ను కాచెను\nయేసయ్యా నీ ప్రేమ నన్ను చేరెను\nనీ కృప నన్ను కాచెను\n\nనీ రక్తం నా పాపం కడిగెను\nనీ సిలువ నాకు జీవం ఇచ్చెను\nహల్లెలూయ హల్లెలూయ\nస్తోత్రం చెల్లింతును",
            "category": "Worship",
            "slug": "yesayya-nee-prema"
        },
        {
            "title": "Sthotram Chellinthunu",
            "title_te": "స్తోత్రం చెల్లింతును",
            "lyrics": "స్తోత్రం చెల్లింతును నీకే నా ప్రభువా\nస్తుతి గానం చేసెదను నీకే నా దేవా\n\nనీవే నా ఆశ్రయం నీవే నా ధైర్యం\nనీవే నా బలం నీవే నా సర్వం\n\nహల్లెలూయ హల్లెలూయ\nస్తోత్రం చెల్లింతును\nహల్లెలూయ హల్లెలూయ\nస్తుతి గానం చేసెదను",
            "category": "Praise",
            "slug": "sthotram-chellinthunu"
        },
        {
            "title": "What A Beautiful Name",
            "title_te": "ఎంత అందమైన నామం",
            "lyrics": "You were the Word at the beginning\nOne with God the Lord Most High\nYour hidden glory in creation\nNow revealed in You our Christ\n\nWhat a beautiful Name it is\nWhat a beautiful Name it is\nThe Name of Jesus Christ my King\n\nWhat a beautiful Name it is\nNothing compares to this\nWhat a beautiful Name it is\nThe Name of Jesus",
            "category": "Worship",
            "slug": "what-a-beautiful-name"
        },
        {
            "title": "Nee Krupa Tho",
            "title_te": "నీ కృపతో",
            "lyrics": "నీ కృపతో బ్రతుకుచున్నాను\nనీ ప్రేమతో జీవిస్తున్నాను\nనీవే నా ప్రాణం నీవే నా గానం\nనీవే నా సర్వం యేసయ్యా\n\nస్తుతి చేతును నిన్నే పూజింతును\nనీ నామం మహిమ పరచెదను\nహల్లెలూయ స్తోత్రం\nయేసయ్యా నీకే స్తోత్రం",
            "category": "Praise",
            "slug": "nee-krupa-tho"
        },
        {
            "title": "10,000 Reasons (Bless The Lord)",
            "title_te": "10,000 కారణాలు (ప్రభువును స్తుతించు)",
            "lyrics": "Bless the Lord, O my soul\nO my soul, worship His holy name\nSing like never before, O my soul\nI'll worship Your holy name\n\nThe sun comes up, it's a new day dawning\nIt's time to sing Your song again\nWhatever may pass and whatever lies before me\nLet me be singing when the evening comes\n\nBless the Lord, O my soul\nO my soul, worship His holy name\nSing like never before, O my soul\nI'll worship Your holy name",
            "category": "Worship",
            "slug": "10000-reasons"
        },
        {
            "title": "Yesu Naamam",
            "title_te": "యేసు నామం",
            "lyrics": "యేసు నామం మధురమైన నామం\nయేసు నామం శక్తివంతమైన నామం\nయేసు నామం పరిశుద్ధ నామం\nయేసు నామం రాజాధిరాజు నామం\n\nఆ నామంలో స్వస్థత ఉంది\nఆ నామంలో విడుదల ఉంది\nఆ నామంలో విజయం ఉంది\nయేసు నామానికి మహిమ",
            "category": "Praise",
            "slug": "yesu-naamam"
        },
        {
            "title": "Oceans (Where Feet May Fail)",
            "title_te": "సముద్రాలు",
            "lyrics": "You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep, my faith will stand\n\nAnd I will call upon Your name\nAnd keep my eyes above the waves\nWhen oceans rise, my soul will rest\nIn Your embrace\nFor I am Yours and You are mine\n\nSpirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me",
            "category": "Worship",
            "slug": "oceans-where-feet-may-fail"
        },
        {
            "title": "Devuni Stuthinchanura",
            "title_te": "దేవుని స్తుతించనురా",
            "lyrics": "దేవుని స్తుతించనురా\nదేవుని స్తుతించనురా\nనిత్యం ఆయన కృపలో\nనిలిచి స్తుతించనురా\n\nపరలోక సింహాసన దేవుని\nపరిశుద్ధుడని స్తుతించనురా\nసర్వశక్తిమంతుడని\nస్తుతి పాడి మహిమ పరచనురా",
            "category": "Praise",
            "slug": "devuni-stuthinchanura"
        },
        {
            "title": "Holy Spirit You Are Welcome Here",
            "title_te": "పరిశుద్ధాత్మా నీకు స్వాగతం",
            "lyrics": "There's nothing worth more\nThat will ever come close\nNo thing can compare\nYou're our living hope\nYour presence, Lord\n\nI've tasted and seen\nOf the sweetest of loves\nWhere my heart becomes free\nAnd my shame is undone\nYour presence, Lord\n\nHoly Spirit, You are welcome here\nCome flood this place and fill the atmosphere\nYour glory, God, is what our hearts long for\nTo be overcome by Your presence, Lord",
            "category": "Worship",
            "slug": "holy-spirit-welcome"
        },
        {
            "title": "Prabhuvaa Nee Hastaalu",
            "title_te": "ప్రభువా నీ హస్తాలు",
            "lyrics": "ప్రభువా నీ హస్తాలు\nనన్ను పట్టుకున్నవి\nప్రభువా నీ కన్నులు\nనన్ను కాచుచున్నవి\n\nనేను భయపడను\nనేను కలవరపడను\nనీవు నాతో ఉన్నావు\nనాకు తోడు నీడ నీవే",
            "category": "Prayer",
            "slug": "prabhuvaa-nee-hastaalu"
        },
        {
            "title": "Reckless Love",
            "title_te": "అపారమైన ప్రేమ",
            "lyrics": "Before I spoke a word, You were singing over me\nYou have been so, so good to me\nBefore I took a breath, You breathed Your life in me\nYou have been so, so kind to me\n\nOh, the overwhelming, never-ending, reckless love of God\nOh, it chases me down, fights 'til I'm found\nLeaves the ninety-nine\nI couldn't earn it, and I don't deserve it\nStill, You give Yourself away\nOh, the overwhelming, never-ending, reckless love of God",
            "category": "Worship",
            "slug": "reckless-love"
        },
        {
            "title": "Siluvalo Nee Roopam",
            "title_te": "సిలువలో నీ రూపం",
            "lyrics": "సిలువలో నీ రూపం చూసి\nకన్నీరు కారిపోతుంది\nనా కోసం నీవు చేసిన\nత్యాగం ఎంతో గొప్పది\n\nనీ చేతులలో మేకులు\nనీ పాదములలో మేకులు\nనా పాపం కోసం నీవు\nసిలువలో వ్రేలాడితివి\n\nకృతజ్ఞతలు చెల్లించలేను\nనీ ప్రేమను కొలవలేను\nనీకే నా జీవితం\nనీకే నా ఆరాధన",
            "category": "Easter",
            "slug": "siluvalo-nee-roopam"
        },
        {
            "title": "Way Maker",
            "title_te": "మార్గం చేయువాడు",
            "lyrics": "You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You\n\nWay maker, miracle worker\nPromise keeper, light in the darkness\nMy God, that is who You are\n\nYou are here, touching every heart\nI worship You, I worship You\nYou are here, healing every heart\nI worship You, I worship You",
            "category": "Worship",
            "slug": "way-maker"
        },
        {
            "title": "Christmas Velugulanni",
            "title_te": "క్రిస్మస్ వెలుగులన్ని",
            "lyrics": "క్రిస్మస్ వెలుగులన్ని\nమన యేసు కోసమే\nఈ లోక రక్షణ కోసం\nబేత్లెహేమలో పుట్టెను\n\nదూతల గానం వినిపించెను\nగొర్రెల కాపరులకు\nరాజాధిరాజు పుట్టెను\nసంతోషం మనకందరికీ\n\nహల్లెలూయ హల్లెలూయ\nయేసు పుట్టెను మనకోసం\nహల్లెలూయ హల్లెలూయ\nమహిమ దేవునికి",
            "category": "Christmas",
            "slug": "christmas-velugulanni"
        },
        {
            "title": "Great Are You Lord",
            "title_te": "గొప్పవాడవు ప్రభువా",
            "lyrics": "You give life, You are love\nYou bring light to the darkness\nYou give hope, You restore\nEvery heart that is broken\nGreat are You, Lord\n\nIt's Your breath in our lungs\nSo we pour out our praise\nWe pour out our praise\nIt's Your breath in our lungs\nSo we pour out our praise to You only\n\nAll the earth will shout Your praise\nOur hearts will cry, these bones will sing\nGreat are You, Lord",
            "category": "Worship",
            "slug": "great-are-you-lord"
        },
        {
            "title": "Youthful Praise - Nee Sevalo",
            "title_te": "నీ సేవలో - యూత్ ప్రేయిజ్",
            "lyrics": "నీ సేవలో నిలబడాలని\nనీ రాజ్యం కొరకు పనిచేయాలని\nయవ్వనమంతా నీకే అర్పించి\nనీ కొరకే జీవించాలని\n\nYoung and free, we live for You\nEvery day is something new\nYou lead us on, You make us strong\nIn Your love we all belong\n\nనీ వెంట నడిచెదము\nనీ మాట వినెదము\nనీ ప్రేమలో ఎదుగుదము\nనీ సేవలో నిలిచెదము",
            "category": "Youth",
            "slug": "youthful-praise-nee-sevalo"
        },
        {
            "title": "Goodness of God",
            "title_te": "దేవుని మంచితనం",
            "lyrics": "I love You Lord\nOh Your mercy never fails me\nAll my days I've been held in Your hands\nFrom the moment that I wake up\nUntil I lay my head\nI will sing of the goodness of God\n\nAll my life You have been faithful\nAll my life You have been so, so good\nWith every breath that I am able\nI will sing of the goodness of God\n\nI love Your voice\nYou have led me through the fire\nIn darkest night You are close like no other\nI've known You as a father\nI've known You as a friend\nI have lived in the goodness of God",
            "category": "Worship",
            "slug": "goodness-of-god"
        }
    ]

    # Clear existing songs
    cur.execute("DELETE FROM songs")

    for song in songs:
        cur.execute(
            "INSERT INTO songs (title, lyrics, category, slug) VALUES (?, ?, ?, ?)",
            (song['title'], song['lyrics'], song['category'], song['slug'])
        )

    conn.commit()
    conn.close()
    print("✅ Database seeded successfully!")
    print(f"   Admin: carmelprayerhouse26@gmail.com / Parnasala@fellowship")
    print(f"   Songs: {len(songs)} songs added")
    print(f"   Categories: {len(categories)} categories")


if __name__ == '__main__':
    seed()
