/* ══════════════════════════════════════════════════════════════════════════════
   pages.js — All Public Pages
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Cached Data ───────────────────────────────────────────────────────────────

let cachedSettings = null;
let cachedCategories = null;

async function getSettings() {
    if (!cachedSettings) {
        cachedSettings = await api('/api/settings');
    }
    return cachedSettings;
}

async function getCategories() {
    if (!cachedCategories) {
        cachedCategories = await api('/api/categories');
    }
    return cachedCategories;
}

function invalidateCache() {
    cachedSettings = null;
    cachedCategories = null;
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderHomePage() {
    const app = $('#app');
    const settings = await getSettings();
    const churchName = settings.church_name || 'Parnasala Fellowship';
    const tagline = settings.tagline || t('hero_tagline');

    // Show skeleton while loading
    app.innerHTML = `
        <div class="page-transition">
            <!-- Hero -->
            <section class="hero">
                <div class="hero-bg"></div>
                <div class="hero-overlay"></div>
                <div class="hero-particles" id="hero-particles"></div>
                <div class="hero-content">
                    <div class="hero-cross"><img src="/uploads/logo.jpg" alt="Parnasala Fellowship" class="hero-logo"></div>
                    <h1 class="hero-title">${escapeHtml(churchName)}</h1>
                    <p class="hero-tagline" data-i18n="hero_tagline">${escapeHtml(tagline)}</p>
                    <div class="hero-buttons">
                        <a href="#/songs" class="btn btn-primary" data-i18n="hero_browse">
                            <span class="material-icons-round">music_note</span>
                            ${t('hero_browse')}
                        </a>
                        <a href="#/about" class="btn btn-secondary" data-i18n="hero_about">
                            <span class="material-icons-round">church</span>
                            ${t('hero_about')}
                        </a>
                    </div>
                </div>
            </section>

            <!-- Stats -->
            <section class="section">
                <div class="container">
                    <div class="stats-row" id="home-stats">
                        ${StatCard(0, t('home_stats_songs'), 'home_stats_songs')}
                        ${StatCard(0, t('home_stats_categories'), 'home_stats_categories')}
                        ${StatCard(0, t('home_stats_favorites'), 'home_stats_favorites')}
                    </div>
                </div>
            </section>

            <!-- Featured Songs -->
            <section class="section" style="padding-top:0;">
                <div class="container">
                    ${SectionHeader(t('home_featured_tag'), 'home_featured_tag', t('home_featured_title'), 'home_featured_title', t('home_featured_subtitle'), 'home_featured_subtitle')}
                    <div class="featured-songs" id="featured-songs">
                        ${SkeletonCards(6)}
                    </div>
                </div>
            </section>

            <!-- Recently Viewed -->
            <section class="section" id="recent-section" style="display:none; padding-top:0;">
                <div class="container">
                    ${SectionHeader(t('home_recent_tag'), 'home_recent_tag', t('home_recent_title'), 'home_recent_title')}
                    <div class="recent-songs" id="recent-songs"></div>
                </div>
            </section>

            <!-- Quick Nav -->
            <section class="section" style="padding-top:0;">
                <div class="container">
                    ${SectionHeader(t('home_quicknav_tag'), 'home_quicknav_tag', t('home_quicknav_title'), 'home_quicknav_title')}
                    <div class="quick-nav">
                        <a href="#/songs" class="quick-nav-card">
                            <span class="material-icons-round">library_music</span>
                            <div class="quick-nav-card-title" data-i18n="home_nav_allsongs">${t('home_nav_allsongs')}</div>
                        </a>
                        <a href="#/about" class="quick-nav-card">
                            <span class="material-icons-round">church</span>
                            <div class="quick-nav-card-title" data-i18n="home_nav_about">${t('home_nav_about')}</div>
                        </a>
                        <a href="#/contact" class="quick-nav-card">
                            <span class="material-icons-round">call</span>
                            <div class="quick-nav-card-title" data-i18n="home_nav_contact">${t('home_nav_contact')}</div>
                        </a>
                        <a href="#/address" class="quick-nav-card">
                            <span class="material-icons-round">location_on</span>
                            <div class="quick-nav-card-title" data-i18n="home_nav_address">${t('home_nav_address')}</div>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Generate hero particles
    const particlesContainer = $('#hero-particles');
    if (particlesContainer) generateParticles(particlesContainer);

    // Load featured songs
    try {
        const songs = await api('/api/songs');
        const featured = songs.slice(0, 6);
        const container = $('#featured-songs');

        if (featured.length > 0) {
            container.innerHTML = `<div class="songs-grid">${featured.map((s, i) => SongCard(s, i)).join('')}</div>`;
        } else {
            container.innerHTML = EmptyState('music_off', t('songs_no_results'));
        }

        // Update stats
        const categories = await getCategories();
        const favCount = Favorites.getAll().length;
        const statsHtml = `
            ${StatCard(songs.length, t('home_stats_songs'), 'home_stats_songs')}
            ${StatCard(categories.length, t('home_stats_categories'), 'home_stats_categories')}
            ${StatCard(favCount, t('home_stats_favorites'), 'home_stats_favorites')}
        `;
        $('#home-stats').innerHTML = statsHtml;

        setTimeout(animateCounters, 200);
    } catch (err) {
        $('#featured-songs').innerHTML = EmptyState('error', t('error_generic'));
    }

    // Recently viewed
    const recent = RecentlyViewed.getAll();
    if (recent.length > 0) {
        const recentSection = $('#recent-section');
        if (recentSection) recentSection.style.display = '';
        const recentContainer = $('#recent-songs');
        recentContainer.innerHTML = recent.map(s => `
            <a href="#/songs/${s.slug}" class="recent-song-chip">
                <span class="material-icons-round" style="font-size:1rem;">music_note</span>
                ${escapeHtml(s.title)}
            </a>
        `).join('');
    }

    // Observe scroll animations
    setTimeout(observeAnimations, 100);

    // Apply translations
    setLanguage(currentLang);
}


// ══════════════════════════════════════════════════════════════════════════════
// SONGS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderSongsPage() {
    const app = $('#app');

    app.innerHTML = `
        <div class="page-transition">
            <section class="section">
                <div class="container">
                    ${SectionHeader(t('songs_tag'), 'songs_tag', t('songs_title'), 'songs_title', t('songs_subtitle'), 'songs_subtitle')}

                    <!-- Tabs -->
                    <div class="index-tabs" id="index-tabs">
                        <button class="index-tab-btn active" data-tab="home" data-i18n="nav_home">Home</button>
                        <button class="index-tab-btn" data-tab="telugu">Telugu Index</button>
                        <button class="index-tab-btn" data-tab="english">English Index</button>
                    </div>

                    <div id="home-tab-content">
                        <div class="search-filter-bar">
                            <div class="search-wrapper">
                                <span class="material-icons-round search-icon">search</span>
                                <input type="text" class="search-input" id="song-search"
                                       placeholder="${t('songs_search_placeholder')}"
                                       data-i18n-placeholder="songs_search_placeholder">
                            </div>
                            <div class="category-pills" id="category-pills">
                                <button class="pill active" data-category="" data-i18n="songs_all_categories">${t('songs_all_categories')}</button>
                            </div>
                        </div>

                        <!-- Telugu Words Filter Section -->
                        <div style="margin-bottom: 2rem;">
                            <h3 style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Filter by Telugu Words</h3>
                            <div class="telugu-words-pills" id="telugu-words-pills" style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                                <!-- Loaded by JS -->
                            </div>
                        </div>

                        <div id="songs-container">
                            ${SkeletonCards(9)}
                        </div>
                    </div>

                    <div id="index-tab-content" style="display: none;">
                        <div class="character-grid" id="character-grid-container"></div>
                        
                        <div id="index-results-container" style="display: none;">
                            <div class="char-section">
                                <h3 class="char-section-header" id="selected-char-header"></h3>
                                <div class="char-song-list" id="char-song-list-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    `;

    // Load categories for pills
    try {
        const categories = await getCategories();
        const pillsContainer = $('#category-pills');
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'pill';
            btn.dataset.category = cat.name;
            btn.textContent = cat.name;
            btn.addEventListener('click', () => {
                $$('.pill', pillsContainer).forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                loadSongs();
            });
            pillsContainer.appendChild(btn);
        });

        // Bind "All" pill
        const allPill = pillsContainer.querySelector('[data-category=""]');
        if (allPill) {
            allPill.addEventListener('click', () => {
                $$('.pill', pillsContainer).forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                loadSongs();
            });
        }
    } catch { /* ignore */ }

    // Load Telugu words for filter pills
    try {
        const teluguWords = await api('/api/telugu-words');
        const teluguWordsContainer = $('#telugu-words-pills');
        
        if (teluguWords && teluguWords.length > 0) {
            // Add "All Words" button
            const allBtn = document.createElement('button');
            allBtn.className = 'pill active';
            allBtn.dataset.telugu_word = '';
            allBtn.style.fontFamily = 'Inter, sans-serif';
            allBtn.textContent = 'All Words';
            allBtn.addEventListener('click', () => {
                $$('.pill', teluguWordsContainer).forEach(p => p.classList.remove('active'));
                allBtn.classList.add('active');
                loadSongs();
            });
            teluguWordsContainer.appendChild(allBtn);

            // Add Telugu word buttons
            teluguWords.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'pill';
                btn.dataset.telugu_word = item.word;
                btn.style.fontFamily = 'Noto Sans Telugu, sans-serif';
                btn.innerHTML = `${escapeHtml(item.word)} <span style="margin-left: 0.5rem; opacity: 0.7; font-size: 0.85em;">(${item.count})</span>`;
                btn.addEventListener('click', () => {
                    $$('.pill', teluguWordsContainer).forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    loadSongs();
                });
                teluguWordsContainer.appendChild(btn);
            });
        } else {
            teluguWordsContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No Telugu songs found</p>';
        }
    } catch (err) {
        console.error('Failed to load Telugu words:', err);
    }

    // Full static alphabet sets for grids
    const teluguAlphabet = ["అ", "ఆ", "ఇ", "ఈ", "ఉ", "ఊ", "ఋ", "ఎ", "ఏ", "ఐ", "ఒ", "ఓ", "ఔ", "అం", "అః", "క", "ఖ", "గ", "ఘ", "ఙ", "చ", "ఛ", "జ", "ఝ", "ఞ", "ట", "ఠ", "డ", "ఢ", "ణ", "త", "థ", "ద", "ధ", "న", "ప", "ఫ", "బ", "భ", "మ", "య", "ర", "ల", "వ", "శ", "ష", "స", "హ", "ళ", "క్ష", "ఱ"];
    const englishAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    const charGridContainer = $('#character-grid-container');
    const selectedCharHeader = $('#selected-char-header');
    const charSongList = $('#char-song-list-container');
    const indexResultsContainer = $('#index-results-container');
    
    // UI Tab toggle logic
    const homeContent = $('#home-tab-content');
    const indexContent = $('#index-tab-content');

    $$('.index-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.index-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            if (tab === 'home') {
                homeContent.style.display = 'block';
                indexContent.style.display = 'none';
            } else if (tab === 'telugu') {
                homeContent.style.display = 'none';
                indexContent.style.display = 'block';
                renderCharacterGrid(teluguAlphabet, 'telugu');
            } else if (tab === 'english') {
                homeContent.style.display = 'none';
                indexContent.style.display = 'block';
                renderCharacterGrid(englishAlphabet, 'english');
            }
        });
    });

    function renderCharacterGrid(chars, langType) {
        indexResultsContainer.style.display = 'none';
        charGridContainer.innerHTML = '';
        
        chars.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'char-btn';
            btn.textContent = char;
            btn.addEventListener('click', () => {
                $$('.char-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadGroupedSongs(char, langType);
            });
            charGridContainer.appendChild(btn);
        });

        // Auto-select first character
        if (chars.length > 0) {
            const firstBtn = charGridContainer.querySelector('.char-btn');
            if (firstBtn) firstBtn.click();
        }
    }

    async function loadGroupedSongs(character, langType) {
        selectedCharHeader.textContent = character;
        charSongList.innerHTML = '<div class="skeleton" style="height:30px; margin-bottom:10px;"></div><div class="skeleton" style="height:30px;"></div>';
        indexResultsContainer.style.display = 'block';

        let url = '/api/songs?';
        if (langType === 'telugu') url += `telugu_char=${encodeURIComponent(character)}&`;
        if (langType === 'english') url += `english_char=${encodeURIComponent(character)}&`;

        try {
            const songs = await api(url);
            if (songs.length > 0) {
                // Split grid into two columns if needed, but flex column is fine as per mockup
                charSongList.innerHTML = songs.map(s => `
                    <a href="#/songs/${s.slug}" class="char-song-item">
                        ${escapeHtml(langType === 'telugu' && s.title_te ? s.title_te : s.title_en)}
                    </a>
                `).join('');
            } else {
                charSongList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No songs found</p>';
            }
        } catch {
            charSongList.innerHTML = '<p style="color: #e74c3c;">Failed to load songs</p>';
        }
    }

    // No need to load character indexes dynamically since we are using static grids

    // Load songs
    await loadSongs();

    // Search binding
    const searchInput = $('#song-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadSongs(), 300));
    }

    setLanguage(currentLang);
}


async function loadSongs() {
    const container = $('#songs-container');
    if (!container) return;

    const search = ($('#song-search') || {}).value || '';
    
    // Get category from category pills
    const categoryContainer = $('#category-pills');
    const activeCategoryPill = categoryContainer ? categoryContainer.querySelector('.pill.active') : null;
    const category = activeCategoryPill ? activeCategoryPill.dataset.category || '' : '';

    // Get Telugu word from Telugu words pills
    const teluguWordsContainer = $('#telugu-words-pills');
    const activeTeluguPill = teluguWordsContainer ? teluguWordsContainer.querySelector('.pill.active') : null;
    const teluguWord = activeTeluguPill ? activeTeluguPill.dataset.telugu_word || '' : '';

    let url = '/api/songs?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (teluguWord) url += `telugu_word=${encodeURIComponent(teluguWord)}&`;

    try {
        const songs = await api(url);
        if (songs.length > 0) {
            container.innerHTML = `<div class="songs-grid">${songs.map((s, i) => SongCard(s, i)).join('')}</div>`;
            setTimeout(observeAnimations, 50);
        } else {
            container.innerHTML = EmptyState('search_off', t('songs_no_results'), t('songs_no_results_desc'));
        }
    } catch {
        container.innerHTML = EmptyState('error', t('error_generic'));
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// SONG DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderSongDetailPage(slug) {
    const app = $('#app');

    app.innerHTML = `
        <div class="page-transition song-detail">
            <div class="skeleton" style="height:30px; width:120px; margin-bottom:2rem;"></div>
            <div class="skeleton" style="height:40px; width:60%; margin-bottom:1rem;"></div>
            <div class="skeleton" style="height:20px; width:30%; margin-bottom:2rem;"></div>
            <div class="skeleton" style="height:300px; width:100%;"></div>
        </div>
    `;

    try {
        const song = await api(`/api/songs/${slug}`);
        const isFav = Favorites.isFav(song.slug);

        // Add to recently viewed
        RecentlyViewed.add(song);

        const shareUrl = `${window.location.origin}/#/songs/${song.slug}`;

        app.innerHTML = `
            <div class="page-transition song-detail">
                <a href="#/songs" class="song-detail-back" data-i18n="song_back">
                    <span class="material-icons-round">arrow_back</span>
                    ${t('song_back')}
                </a>

                <div class="song-detail-header">
                    <h1 class="song-detail-title" style="font-family: var(--font-telugu);">${escapeHtml(song.title_te || '')}</h1>
                    <h2 style="font-size: 1.3rem; color: var(--text-secondary); margin-bottom: 1rem;">${escapeHtml(song.title_en || '')}</h2>
                    <div class="song-detail-meta">
                        <span class="song-card-category">${escapeHtml(song.category)}</span>
                        ${song.created_at ? `<span style="color: var(--text-muted); font-size: 0.85rem;">${formatDate(song.created_at)}</span>` : ''}
                    </div>
                </div>

                <div class="song-detail-actions">
                    <button class="btn btn-sm btn-secondary" onclick="shareSong('${song.slug}')">
                        <span class="material-icons-round" style="font-size:1rem;">share</span>
                        <span data-i18n="song_share">${t('song_share')}</span>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="copyToClipboard(\`${song.lyrics.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">
                        <span class="material-icons-round" style="font-size:1rem;">content_copy</span>
                        <span data-i18n="song_copy">${t('song_copy')}</span>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="printContent('${escapeHtml(song.title_te + ' ' + song.title_en).replace(/'/g, "\\'")}', \`${song.lyrics.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">
                        <span class="material-icons-round" style="font-size:1rem;">print</span>
                        <span data-i18n="song_print">${t('song_print')}</span>
                    </button>
                    <button class="btn btn-sm ${isFav ? 'btn-primary' : 'btn-secondary'}" id="detail-fav-btn"
                            onclick="toggleDetailFav('${song.slug}')">
                        <span class="material-icons-round" style="font-size:1rem;">${isFav ? 'favorite' : 'favorite_border'}</span>
                        <span data-i18n="${isFav ? 'song_unfavorite' : 'song_favorite'}" id="detail-fav-text">${isFav ? t('song_unfavorite') : t('song_favorite')}</span>
                    </button>
                </div>

                <div class="song-lyrics">${escapeHtml(song.lyrics)}</div>
            </div>
        `;

        setLanguage(currentLang);
    } catch {
        app.innerHTML = `
            <div class="page-transition song-detail">
                ${EmptyState('error', 'Song not found', 'The song you are looking for does not exist.')}
                <div style="text-align:center; margin-top:1rem;">
                    <a href="#/songs" class="btn btn-secondary">← ${t('song_back')}</a>
                </div>
            </div>
        `;
    }
}

function shareSong(slug) {
    const url = `${window.location.origin}/#/songs/${slug}`;
    if (navigator.share) {
        navigator.share({ title: 'Song', url }).catch(() => {});
    } else {
        copyToClipboard(url);
    }
}

function toggleDetailFav(slug) {
    const nowFav = Favorites.toggle(slug);
    const btn = $('#detail-fav-btn');
    if (btn) {
        const icon = btn.querySelector('.material-icons-round');
        const text = $('#detail-fav-text');
        btn.className = `btn btn-sm ${nowFav ? 'btn-primary' : 'btn-secondary'}`;
        if (icon) icon.textContent = nowFav ? 'favorite' : 'favorite_border';
        if (text) text.textContent = nowFav ? t('song_unfavorite') : t('song_favorite');
    }
    showToast(nowFav ? 'Added to favorites' : 'Removed from favorites', nowFav ? 'success' : 'info');
}


// ══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderAboutPage() {
    const app = $('#app');
    app.innerHTML = `<div class="page-transition content-page"><div class="skeleton" style="height:300px;"></div></div>`;

    const settings = await getSettings();

    app.innerHTML = `
        <div class="page-transition content-page">
            ${SectionHeader(t('about_tag'), 'about_tag', t('about_title'), 'about_title')}
            <div class="content-page-body">
                <div class="content-page-icon">
                    <span class="material-icons-round">church</span>
                </div>
                ${escapeHtml(settings.about || 'Welcome to our church. We are a community of believers committed to worship, prayer, and fellowship.')}
            </div>
        </div>
    `;

    setLanguage(currentLang);
}


// ══════════════════════════════════════════════════════════════════════════════
// CONTACT PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderContactPage() {
    const app = $('#app');
    app.innerHTML = `<div class="page-transition content-page"><div class="skeleton" style="height:300px;"></div></div>`;

    const settings = await getSettings();

    app.innerHTML = `
        <div class="page-transition content-page">
            ${SectionHeader(t('contact_tag'), 'contact_tag', t('contact_title'), 'contact_title')}
            <div class="content-page-body">
                <div class="content-page-icon">
                    <span class="material-icons-round">call</span>
                </div>
                ${escapeHtml(settings.contact || 'Contact information coming soon.')}
            </div>
        </div>
    `;

    setLanguage(currentLang);
}


// ══════════════════════════════════════════════════════════════════════════════
// ADDRESS PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderAddressPage() {
    const app = $('#app');
    app.innerHTML = `<div class="page-transition content-page"><div class="skeleton" style="height:300px;"></div></div>`;

    const settings = await getSettings();

    app.innerHTML = `
        <div class="page-transition content-page">
            ${SectionHeader(t('address_tag'), 'address_tag', t('address_title'), 'address_title')}
            <div class="content-page-body">
                <div class="content-page-icon">
                    <span class="material-icons-round">location_on</span>
                </div>
                ${escapeHtml(settings.address || 'Our address will be updated shortly.')}
            </div>
        </div>
    `;

    setLanguage(currentLang);
}


// ══════════════════════════════════════════════════════════════════════════════
// ARTICLES PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderArticlesPage() {
    const app = $('#app');

    app.innerHTML = `
        <div class="page-transition">
            <section class="section">
                <div class="container">
                    ${SectionHeader(t('articles_tag'), 'articles_tag', t('articles_title'), 'articles_title', t('articles_subtitle'), 'articles_subtitle')}
                    <div id="articles-container">
                        ${SkeletonCards(4)}
                    </div>
                </div>
            </section>
        </div>
    `;

    try {
        const articles = await api('/api/articles');
        const container = $('#articles-container');

        if (articles.length > 0) {
            container.innerHTML = `<div class="articles-grid">${articles.map((a, i) => ArticleCard(a, i)).join('')}</div>`;
            setTimeout(observeAnimations, 50);
        } else {
            container.innerHTML = EmptyState('auto_stories', t('articles_no_results'), t('articles_no_results_desc'));
        }
    } catch {
        $('#articles-container').innerHTML = EmptyState('error', t('error_generic'));
    }

    setLanguage(currentLang);
}


// ══════════════════════════════════════════════════════════════════════════════
// ARTICLE DETAIL PAGE
// ══════════════════════════════════════════════════════════════════════════════

async function renderArticleDetailPage(slug) {
    const app = $('#app');

    app.innerHTML = `
        <div class="page-transition article-detail">
            <div class="skeleton" style="height:30px; width:120px; margin-bottom:2rem;"></div>
            <div class="skeleton" style="height:40px; width:60%; margin-bottom:1rem;"></div>
            <div class="skeleton" style="height:20px; width:30%; margin-bottom:2rem;"></div>
            <div class="skeleton" style="height:300px; width:100%;"></div>
        </div>
    `;

    try {
        const article = await api(`/api/articles/${slug}`);
        const displayTitle = currentLang === 'te' && article.title_te ? article.title_te : article.title;
        const subTitle = currentLang === 'te' ? article.title : article.title_te;
        const pubDate = article.published_at ? formatDate(article.published_at) : '';
        const hasContent = article.content && article.content.trim();
        const hasPdf = article.pdf_url && article.pdf_url.trim();

        // Build action buttons
        let actionButtons = `
            <button class="btn btn-sm btn-secondary" onclick="shareArticle('${article.slug}')">
                <span class="material-icons-round" style="font-size:1rem;">share</span>
                <span data-i18n="article_share">${t('article_share')}</span>
            </button>
        `;

        if (hasContent) {
            actionButtons += `
                <button class="btn btn-sm btn-secondary" onclick="copyToClipboard(\`${article.content.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">
                    <span class="material-icons-round" style="font-size:1rem;">content_copy</span>
                    <span data-i18n="article_copy">${t('article_copy')}</span>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="printContent('${escapeHtml(displayTitle).replace(/'/g, "\\'")}', \`${article.content.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">
                    <span class="material-icons-round" style="font-size:1rem;">print</span>
                    <span data-i18n="article_print">${t('article_print')}</span>
                </button>
            `;
        }

        if (hasPdf) {
            actionButtons += `
                <a href="${article.pdf_url}" target="_blank" class="btn btn-sm btn-secondary" download>
                    <span class="material-icons-round" style="font-size:1rem;">download</span>
                    Download PDF
                </a>
            `;
        }

        // Build content sections
        let contentSection = '';

        if (hasPdf) {
            contentSection += `
                <div class="article-pdf-section" style="margin-bottom:${hasContent ? '2rem' : '0'};">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
                        <span class="material-icons-round" style="color:var(--accent);">picture_as_pdf</span>
                        <span style="font-weight:600; font-size:1rem;">PDF Document</span>
                    </div>
                    <div style="border-radius:var(--radius-lg); overflow:hidden; border:1px solid var(--border-color); background:var(--bg-card);">
                        <iframe src="${article.pdf_url}" style="width:100%; height:600px; border:none; display:block;" title="PDF Viewer"></iframe>
                    </div>
                    <div style="text-align:center; margin-top:0.75rem;">
                        <a href="${article.pdf_url}" target="_blank" class="btn btn-sm btn-primary" style="font-size:0.85rem;">
                            <span class="material-icons-round" style="font-size:1rem;">open_in_new</span>
                            Open PDF in New Tab
                        </a>
                    </div>
                </div>
            `;
        }

        if (hasContent) {
            if (hasPdf) {
                contentSection += `
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
                        <span class="material-icons-round" style="color:var(--accent);">article</span>
                        <span style="font-weight:600; font-size:1rem;">Text Content</span>
                    </div>
                `;
            }
            contentSection += `<div class="song-lyrics">${escapeHtml(article.content)}</div>`;
        }

        app.innerHTML = `
            <div class="page-transition article-detail">
                <a href="#/articles" class="song-detail-back" data-i18n="article_back">
                    <span class="material-icons-round">arrow_back</span>
                    ${t('article_back')}
                </a>

                <div class="song-detail-header">
                    <h1 class="song-detail-title">${escapeHtml(displayTitle)}</h1>
                    ${subTitle ? `<p style="color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 0.5rem; font-family: var(--font-telugu);">${escapeHtml(subTitle)}</p>` : ''}
                    <div class="song-detail-meta">
                        <span class="song-card-category">
                            <span class="material-icons-round" style="font-size:0.8rem;">auto_stories</span>
                            Article
                        </span>
                        ${hasPdf ? '<span class="song-card-category" style="background:rgba(239,68,68,0.15); color:#ef4444;"><span class="material-icons-round" style="font-size:0.8rem;">picture_as_pdf</span> PDF</span>' : ''}
                        ${pubDate ? `<span style="color: var(--text-muted); font-size: 0.85rem;">${pubDate}</span>` : ''}
                    </div>
                </div>

                <div class="song-detail-actions">
                    ${actionButtons}
                </div>

                ${contentSection}
            </div>
        `;

        setLanguage(currentLang);
    } catch {
        app.innerHTML = `
            <div class="page-transition article-detail">
                ${EmptyState('error', 'Article not found', 'The article you are looking for does not exist.')}
                <div style="text-align:center; margin-top:1rem;">
                    <a href="#/articles" class="btn btn-secondary">← ${t('article_back')}</a>
                </div>
            </div>
        `;
    }
}

function shareArticle(slug) {
    const url = `${window.location.origin}/#/articles/${slug}`;
    if (navigator.share) {
        navigator.share({ title: 'Article', url }).catch(() => {});
    } else {
        copyToClipboard(url);
    }
}
