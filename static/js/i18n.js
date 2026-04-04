/* ══════════════════════════════════════════════════════════════════════════════
   i18n.js — English / Telugu Internationalization
   ══════════════════════════════════════════════════════════════════════════════ */

const I18N_KEY = 'songbook_lang';

const translations = {
    en: {
        // Navigation
        nav_home: 'Home',
        nav_songs: 'Songs',
        nav_about: 'About',
        nav_articles: 'Articles',
        nav_contact: 'Contact',
        nav_address: 'Address',

        // Hero
        hero_tagline: 'A Place of Worship and Fellowship',
        hero_browse: 'Browse Songs',
        hero_about: 'About Us',

        // Home sections
        home_featured_tag: '♪ Featured Songs',
        home_featured_title: 'Popular Worship Songs',
        home_featured_subtitle: 'Explore our most loved songs of praise and worship',
        home_quicknav_tag: '✦ Quick Navigation',
        home_quicknav_title: 'Explore More',
        home_nav_allsongs: 'All Songs',
        home_nav_about: 'About Church',
        home_nav_contact: 'Contact Us',
        home_nav_address: 'Our Address',
        home_recent_tag: '⏱ Recently Viewed',
        home_recent_title: 'Continue Listening',
        home_stats_songs: 'Total Songs',
        home_stats_categories: 'Categories',
        home_stats_favorites: 'Your Favorites',

        // Songs page
        songs_tag: '♪ Song Collection',
        songs_title: 'All Songs',
        songs_subtitle: 'Search, filter, and explore our worship songs',
        songs_search_placeholder: 'Search songs by title or lyrics…',
        songs_all_categories: 'All',
        songs_no_results: 'No songs found',
        songs_no_results_desc: 'Try adjusting your search or filters',

        // Song detail
        song_back: 'Back to Songs',
        song_share: 'Share',
        song_copy: 'Copy Lyrics',
        song_print: 'Print',
        song_favorite: 'Favorite',
        song_unfavorite: 'Unfavorite',

        // Articles
        articles_tag: '📖 Monthly Articles',
        articles_title: 'Articles',
        articles_subtitle: 'Read our monthly publications and spiritual writings',
        articles_no_results: 'No articles yet',
        articles_no_results_desc: 'Articles will be published soon',
        article_back: 'Back to Articles',
        article_share: 'Share',
        article_copy: 'Copy Content',
        article_print: 'Print',

        // About / Contact / Address
        about_tag: 'ℹ About',
        about_title: 'About Our Church',
        contact_tag: '☎ Contact',
        contact_title: 'Contact Us',
        address_tag: '📍 Location',
        address_title: 'Our Address',

        // Footer
        footer_gallery: 'Church Gallery',
        footer_contact: 'Contact Us',
        footer_follow: 'Follow Us',
        footer_no_images: 'No images yet',
        footer_rights: 'All rights reserved.',

        // Admin
        admin_login_title: 'Admin Login',
        admin_login_subtitle: 'Sign in to manage your church songbook',
        admin_email: 'Email Address',
        admin_password: 'Password',
        admin_login_btn: 'Sign In',
        admin_dashboard: 'Dashboard',
        admin_logout: 'Logout',
        admin_tab_songs: 'Songs',
        admin_tab_add: 'Add Song',
        admin_tab_upload: 'Bulk Upload',
        admin_tab_images: 'Images',
        admin_tab_settings: 'Settings',
        admin_tab_categories: 'Categories',
        admin_tab_articles: 'Articles',
        admin_tab_add_article: 'Add Article',
        admin_article_title: 'Article Title',
        admin_article_title_te: 'Telugu Title',
        admin_article_content: 'Article Content',
        admin_tab_password: 'Password',
        admin_song_title: 'Song Title',
        admin_song_lyrics: 'Song Lyrics',
        admin_song_category: 'Category',
        admin_save: 'Save',
        admin_cancel: 'Cancel',
        admin_delete_confirm: 'Are you sure you want to delete this?',
        admin_upload_desc: 'Drag & drop or click to upload a TXT, JSON, or CSV file',
        admin_settings_name: 'Church Name',
        admin_settings_tagline: 'Tagline',
        admin_settings_about: 'About',
        admin_settings_contact: 'Contact Info',
        admin_settings_address: 'Address',
        admin_settings_social: 'Social Links',
        admin_settings_logo: 'Church Logo',
        admin_cat_name: 'Category Name',
        admin_cat_add: 'Add Category',
        admin_pw_current: 'Current Password',
        admin_pw_new: 'New Password',
        admin_pw_change: 'Change Password',

        // Misc
        loading: 'Loading...',
        error_generic: 'Something went wrong. Please try again.'
    },

    te: {
        // Navigation
        nav_home: 'హోమ్',
        nav_songs: 'పాటలు',
        nav_about: 'గురించి',
        nav_articles: 'వ్యాసాలు',
        nav_contact: 'సంప్రదించండి',
        nav_address: 'చిరునామా',

        // Hero
        hero_tagline: 'ఆరాధన మరియు సహవాసం కొరకు',
        hero_browse: 'పాటలు చూడండి',
        hero_about: 'మా గురించి',

        // Home sections
        home_featured_tag: '♪ ప్రముఖ పాటలు',
        home_featured_title: 'ప్రసిద్ధ ఆరాధన పాటలు',
        home_featured_subtitle: 'మా అత్యంత ఇష్టమైన స్తుతి ఆరాధన పాటలను అన్వేషించండి',
        home_quicknav_tag: '✦ త్వరిత నావిగేషన్',
        home_quicknav_title: 'మరింత అన్వేషించండి',
        home_nav_allsongs: 'అన్ని పాటలు',
        home_nav_about: 'సంఘం గురించి',
        home_nav_contact: 'సంప్రదించండి',
        home_nav_address: 'మా చిరునామా',
        home_recent_tag: '⏱ ఇటీవల చూసినవి',
        home_recent_title: 'మళ్ళీ వినండి',
        home_stats_songs: 'మొత్తం పాటలు',
        home_stats_categories: 'వర్గాలు',
        home_stats_favorites: 'మీ ఇష్టమైనవి',

        // Songs page
        songs_tag: '♪ పాటల సేకరణ',
        songs_title: 'అన్ని పాటలు',
        songs_subtitle: 'మా ఆరాధన పాటలను శోధించండి, ఫిల్టర్ చేయండి',
        songs_search_placeholder: 'పాట పేరు లేదా సాహిత్యం ద్వారా శోధించండి…',
        songs_all_categories: 'అన్నీ',
        songs_no_results: 'పాటలు కనుగొనబడలేదు',
        songs_no_results_desc: 'మీ శోధన లేదా ఫిల్టర్‌లను సర్దుబాటు చేయండి',

        // Song detail
        song_back: 'పాటలకు తిరిగి',
        song_share: 'భాగస్వామ్యం',
        song_copy: 'సాహిత్యం కాపీ',
        song_print: 'ముద్రణ',
        song_favorite: 'ఇష్టమైనది',
        song_unfavorite: 'ఇష్టం తీసివేయి',

        // Articles
        articles_tag: '📖 నెలవారీ వ్యాసాలు',
        articles_title: 'వ్యాసాలు',
        articles_subtitle: 'మా నెలవారీ ప్రచురణలు మరియు ఆధ్యాత్మిక రచనలు చదవండి',
        articles_no_results: 'ఇంకా వ్యాసాలు లేవు',
        articles_no_results_desc: 'వ్యాసాలు త్వరలో ప్రచురించబడతాయి',
        article_back: 'వ్యాసాలకు తిరిగి',
        article_share: 'భాగస్వామ్యం',
        article_copy: 'కంటెంట్ కాపీ',
        article_print: 'ముద్రణ',

        // About / Contact / Address
        about_tag: 'ℹ గురించి',
        about_title: 'మా సంఘం గురించి',
        contact_tag: '☎ సంప్రదించండి',
        contact_title: 'మమ్మల్ని సంప్రదించండి',
        address_tag: '📍 స్థానం',
        address_title: 'మా చిరునామా',

        // Footer
        footer_gallery: 'చర్చి గ్యాలరీ',
        footer_contact: 'సంప్రదించండి',
        footer_follow: 'మమ్మల్ని అనుసరించండి',
        footer_no_images: 'ఇంకా చిత్రాలు లేవు',
        footer_rights: 'అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.',

        // Admin
        admin_login_title: 'అడ్మిన్ లాగిన్',
        admin_login_subtitle: 'మీ సంఘ పాటల పుస్తకాన్ని నిర్వహించడానికి సైన్ ఇన్ చేయండి',
        admin_email: 'ఇమెయిల్ చిరునామా',
        admin_password: 'పాస్‌వర్డ్',
        admin_login_btn: 'సైన్ ఇన్',
        admin_dashboard: 'డాష్‌బోర్డ్',
        admin_logout: 'లాగౌట్',
        admin_tab_songs: 'పాటలు',
        admin_tab_add: 'పాట జోడించు',
        admin_tab_upload: 'బల్క్ అప్‌లోడ్',
        admin_tab_images: 'చిత్రాలు',
        admin_tab_settings: 'సెట్టింగ్‌లు',
        admin_tab_categories: 'వర్గాలు',
        admin_tab_articles: 'వ్యాసాలు',
        admin_tab_add_article: 'వ్యాసం జోడించు',
        admin_article_title: 'వ్యాసం పేరు',
        admin_article_title_te: 'తెలుగు పేరు',
        admin_article_content: 'వ్యాసం విషయం',
        admin_tab_password: 'పాస్‌వర్డ్',
        admin_song_title: 'పాట పేరు',
        admin_song_lyrics: 'పాట సాహిత్యం',
        admin_song_category: 'వర్గం',
        admin_save: 'సేవ్ చేయండి',
        admin_cancel: 'రద్దు చేయండి',
        admin_delete_confirm: 'మీరు ఖచ్చితంగా దీన్ని తొలగించాలనుకుంటున్నారా?',
        admin_upload_desc: 'TXT, JSON, లేదా CSV ఫైల్‌ను డ్రాగ్ & డ్రాప్ చేయండి',
        admin_settings_name: 'సంఘం పేరు',
        admin_settings_tagline: 'ట్యాగ్‌లైన్',
        admin_settings_about: 'గురించి',
        admin_settings_contact: 'సంప్రదింపు సమాచారం',
        admin_settings_address: 'చిరునామా',
        admin_settings_social: 'సోషల్ లింక్‌లు',
        admin_settings_logo: 'చర్చ్ లోగో',
        admin_cat_name: 'వర్గం పేరు',
        admin_cat_add: 'వర్గం జోడించండి',
        admin_pw_current: 'ప్రస్తుత పాస్‌వర్డ్',
        admin_pw_new: 'కొత్త పాస్‌వర్డ్',
        admin_pw_change: 'పాస్‌వర్డ్ మార్చండి',

        // Misc
        loading: 'లోడ్ అవుతోంది...',
        error_generic: 'ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.'
    }
};

// ── Current Language ──────────────────────────────────────────────────────────

let currentLang = Storage.get(I18N_KEY, 'en');

function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) ||
           (translations.en[key]) || key;
}

function setLanguage(lang) {
    currentLang = lang;
    Storage.set(I18N_KEY, lang);

    // Update all elements with data-i18n attribute
    $$('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Update placeholder for search inputs
    $$('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Update language toggle button label
    const langToggle = $('#lang-toggle');
    if (langToggle) {
        const label = langToggle.querySelector('.lang-label');
        if (label) {
            label.textContent = lang === 'en' ? 'తె' : 'EN';
        }
    }

    // Set document lang attribute
    document.documentElement.lang = lang === 'te' ? 'te' : 'en';
}

function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'te' : 'en');
    // Re-render current page if router exists
    if (window.App && App.rerender) {
        App.rerender();
    }
}

function initI18n() {
    setLanguage(currentLang);
}
