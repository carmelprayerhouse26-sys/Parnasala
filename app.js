/*
  Telugu Christian Songbook - Frontend Logic
  ============================================
  Admin Login:   admin / admin123
  Backend:       Flask (server.py)
*/

// State
let songs = [];
let currentFontSize = 1.25;
let isSidebarOpen = false;
let isLoggedIn = false;

// DOM Elements
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const el = {
    // Header
    headerTitle: $('#header-title'),
    headerLogo: $('#header-logo'),

    // Navigation
    navBtns: $$('.nav-btn[data-view]'),
    mobileNavItems: $$('.mobile-nav-item[data-view]'),
    hamburgerBtn: $('#btn-hamburger'),
    mobileNav: $('#mobile-nav'),
    footerLinks: $$('.footer-link[data-view]'),

    // Sidebar
    searchInput: $('#search-input'),
    songList: $('#song-list'),
    sidebar: $('#sidebar'),
    btnSidebarToggle: $('#btn-sidebar-toggle'),

    // Reading
    readingArea: $('#reading-area'),
    songContent: $('#song-content'),
    btnIncreaseFont: $('#btn-increase-font'),
    btnDecreaseFont: $('#btn-decrease-font'),

    // Login Modal
    loginModal: $('#login-modal'),
    loginForm: $('#login-form'),
    usernameInput: $('#username'),
    passwordInput: $('#password'),
    loginError: $('#login-error'),

    // Admin Modal
    adminModal: $('#admin-modal'),
    btnLogout: $('#btn-logout'),
    tabBtns: $$('.tab-btn'),
    tabContents: $$('.tab-content'),

    // Church Info Form
    churchInfoForm: $('#church-info-form'),
    churchNameInput: $('#church-name'),
    churchLogoUrlInput: $('#church-logo-url'),
    churchAddressInput: $('#church-address'),
    churchPhoneInput: $('#church-phone'),
    churchEmailInput: $('#church-email'),
    churchPhoto1Input: $('#church-photo1'),
    churchPhoto2Input: $('#church-photo2'),
    churchPhoto3Input: $('#church-photo3'),

    // Song Form
    songForm: $('#song-form'),
    songIdInput: $('#song-id'),
    songNumInput: $('#song-number'),
    songTitleTeInput: $('#song-title-telugu'),
    songTitleEnInput: $('#song-title-english'),
    songLyricsInput: $('#song-lyrics'),
    btnClearForm: $('#btn-clear-form'),
    adminSongList: $('#admin-song-list'),

    // Password Form
    passwordForm: $('#password-form'),
    newPasswordInput: $('#new-password'),

    // Footer
    footerChurchName: $('#footer-church-name'),
    footerAddress: $('#footer-address'),
    footerPhone: $('#footer-phone'),
    footerEmail: $('#footer-email'),

    // Contact page
    contactAddress: $('#contact-address'),
    contactPhone: $('#contact-phone'),
    contactEmail: $('#contact-email'),

    // About page
    aboutChurchName: $('#about-church-name'),
    churchPhotosGrid: $('#church-photos'),

    // Close buttons
    closeModals: $$('.close-modal')
};

// ==========================================
// INIT
// ==========================================
function init() {
    setupNavigation();
    setupEventListeners();
    loadSettings();
    loadSongs();
}

// ==========================================
// NAVIGATION (multi-view SPA)
// ==========================================
function setupNavigation() {
    // Desktop nav buttons
    el.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Mobile nav items
    el.mobileNavItems.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
            el.mobileNav.classList.add('hidden');
            el.mobileNav.classList.remove('visible');
        });
    });

    // Hamburger
    el.hamburgerBtn.addEventListener('click', () => {
        el.mobileNav.classList.toggle('hidden');
        el.mobileNav.classList.toggle('visible');
    });

    // Footer quick links
    el.footerLinks.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Admin buttons (desktop + mobile)
    $('#btn-admin-login').addEventListener('click', () => {
        if (isLoggedIn) {
            el.adminModal.classList.remove('hidden');
        } else {
            el.loginModal.classList.remove('hidden');
        }
    });

    $('#btn-admin-login-mobile').addEventListener('click', () => {
        el.mobileNav.classList.add('hidden');
        el.mobileNav.classList.remove('visible');
        if (isLoggedIn) {
            el.adminModal.classList.remove('hidden');
        } else {
            el.loginModal.classList.remove('hidden');
        }
    });
}

function switchView(viewId) {
    // Hide all views
    $$('.view-section').forEach(v => v.classList.remove('active'));
    // Show target
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    // Update nav active states
    el.navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
    el.mobileNavItems.forEach(b => b.classList.toggle('active', b.dataset.view === viewId));

    // Show footer only on About and Contact views
    const footer = $('#app-footer');
    if (viewId === 'about-view' || viewId === 'contact-view') {
        footer.style.display = 'block';
    } else {
        footer.style.display = 'none';
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Search
    el.searchInput.addEventListener('input', handleSearch);

    // Font controls
    el.btnIncreaseFont.addEventListener('click', () => adjustFontSize(0.1));
    el.btnDecreaseFont.addEventListener('click', () => adjustFontSize(-0.1));

    // Sidebar toggle (mobile)
    el.btnSidebarToggle.addEventListener('click', toggleSidebar);

    // Close modals
    el.closeModals.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    // Admin tabs
    el.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Login form
    el.loginForm.addEventListener('submit', handleLogin);

    // Logout
    el.btnLogout.addEventListener('click', handleLogout);

    // Church Info form
    el.churchInfoForm.addEventListener('submit', handleSaveSettings);

    // Song form
    el.songForm.addEventListener('submit', handleSaveSong);
    el.btnClearForm.addEventListener('click', clearSongForm);

    // Password form
    el.passwordForm.addEventListener('submit', handleChangePassword);

    // Hide footer by default (songs view)
    $('#app-footer').style.display = 'none';
}

// ==========================================
// UI HELPERS
// ==========================================
function adjustFontSize(change) {
    currentFontSize = Math.max(0.8, Math.min(3, currentFontSize + change));
    const lyricsEl = document.querySelector('.song-lyrics-display');
    if (lyricsEl) lyricsEl.style.fontSize = `${currentFontSize}rem`;
}

function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    el.sidebar.classList.toggle('open', isSidebarOpen);
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderSongList(songs); return; }

    const filtered = songs.filter(s => {
        return String(s.number).includes(term)
            || s.title_te.toLowerCase().includes(term)
            || s.title_en.toLowerCase().includes(term);
    });
    renderSongList(filtered);
}

function switchTab(tabId) {
    el.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    el.tabContents.forEach(c => {
        if (c.id === tabId) { c.classList.remove('hidden'); c.classList.add('active'); }
        else { c.classList.add('hidden'); c.classList.remove('active'); }
    });
}

function showToast(msg) {
    alert(msg); // Simple; replace with a nicer toast if desired
}

// ==========================================
// RENDER: Song List (Public)
// ==========================================
function renderSongList(list) {
    el.songList.innerHTML = '';

    if (list.length === 0) {
        el.songList.innerHTML = '<li style="padding:1.25rem;color:#64748b;text-align:center;">No songs found.</li>';
        return;
    }

    const sorted = [...list].sort((a, b) => a.number - b.number);

    sorted.forEach(song => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
            <span class="song-number">${song.number}</span>
            <div class="song-title-te">${song.title_te}</div>
            <div class="song-title-en">${song.title_en}</div>
        `;

        li.addEventListener('click', () => {
            $$('.song-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            displaySong(song);
            if (window.innerWidth <= 768) toggleSidebar();
        });

        el.songList.appendChild(li);
    });
}

function displaySong(song) {
    el.songContent.classList.remove('fade-in');
    void el.songContent.offsetWidth;

    el.songContent.innerHTML = `
        <div class="song-detail-header">
            <div class="song-detail-number">Song ${song.number}</div>
            <h2 class="song-detail-title-te">${song.title_te}</h2>
            <div class="song-detail-title-en">${song.title_en}</div>
        </div>
        <div class="song-lyrics-display" style="font-size:${currentFontSize}rem;">${song.lyrics}</div>
    `;

    el.songContent.classList.add('fade-in');
    el.readingArea.scrollTop = 0;
}

// ==========================================
// RENDER: Admin Song List
// ==========================================
function renderAdminSongList() {
    el.adminSongList.innerHTML = '';
    const sorted = [...songs].sort((a, b) => a.number - b.number);

    sorted.forEach(song => {
        const li = document.createElement('li');
        li.className = 'admin-song-item';
        li.innerHTML = `
            <div class="admin-song-details">
                <span class="song-number">${song.number}</span>
                <span>${song.title_te} (${song.title_en})</span>
            </div>
            <div class="admin-song-actions">
                <button type="button" class="icon-btn btn-edit" data-id="${song.id}" aria-label="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="icon-btn btn-delete" data-id="${song.id}" aria-label="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;

        // Edit
        li.querySelector('.btn-edit').addEventListener('click', () => editSong(song));
        // Delete
        li.querySelector('.btn-delete').addEventListener('click', () => deleteSong(song.id));

        el.adminSongList.appendChild(li);
    });
}

function editSong(song) {
    el.songIdInput.value = song.id;
    el.songNumInput.value = song.number;
    el.songTitleTeInput.value = song.title_te;
    el.songTitleEnInput.value = song.title_en;
    el.songLyricsInput.value = song.lyrics;
    switchTab('manage-songs');
    el.songForm.scrollIntoView({ behavior: 'smooth' });
}

function clearSongForm() {
    el.songForm.reset();
    el.songIdInput.value = '';
}

// ==========================================
// API CALLS
// ==========================================

// Load Songs
async function loadSongs() {
    try {
        const res = await fetch('/api/songs');
        songs = await res.json();
        renderSongList(songs);
        renderAdminSongList();
    } catch (err) {
        console.error('Could not load songs from server.', err);
        // Fallback
        songs = [
            { id: 1, number: 1, title_te: 'దేవా నీకు స్తోత్రము', title_en: 'Deva Neeku Sthothramu', lyrics: 'దేవా నీకు స్తోత్రము\nనా దేవా నీకు స్తోత్రము' },
            { id: 2, number: 2, title_te: 'రాజ రాజ యేసు రాజా', title_en: 'Raja Raja Yesu Raja', lyrics: 'రాజ రాజ యేసు రాజా\nస్తుతి మహిమలు నీకేనయ్యా' }
        ];
        renderSongList(songs);
        renderAdminSongList();
    }
}

// Load Church Settings
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        applySettings(data);
    } catch (err) {
        console.error('Could not load settings.', err);
    }
}

function applySettings(data) {
    // Header
    if (data.church_name) el.headerTitle.textContent = data.church_name;
    if (data.logo_url) el.headerLogo.src = data.logo_url;

    // About page
    if (data.church_name) el.aboutChurchName.textContent = data.church_name;

    // Contact page
    if (data.address) el.contactAddress.textContent = data.address;
    if (data.phone) el.contactPhone.textContent = data.phone;
    if (data.email) el.contactEmail.textContent = data.email;

    // Footer
    if (data.church_name) el.footerChurchName.textContent = data.church_name;
    if (data.address) el.footerAddress.textContent = data.address;
    if (data.phone) el.footerPhone.textContent = data.phone;
    if (data.email) el.footerEmail.textContent = data.email;

    // Church photos
    renderChurchPhotos(data.photo1_url, data.photo2_url, data.photo3_url);

    // Admin form
    el.churchNameInput.value = data.church_name || '';
    el.churchLogoUrlInput.value = data.logo_url || '';
    el.churchAddressInput.value = data.address || '';
    el.churchPhoneInput.value = data.phone || '';
    el.churchEmailInput.value = data.email || '';
    el.churchPhoto1Input.value = data.photo1_url || '';
    el.churchPhoto2Input.value = data.photo2_url || '';
    el.churchPhoto3Input.value = data.photo3_url || '';
}

function renderChurchPhotos(p1, p2, p3) {
    const urls = [p1, p2, p3];
    el.churchPhotosGrid.innerHTML = '';

    urls.forEach((url, i) => {
        if (url) {
            const div = document.createElement('div');
            div.className = 'church-photo-card';
            div.innerHTML = `<img src="${url}" alt="Church Photo ${i + 1}" loading="lazy">`;
            el.churchPhotosGrid.appendChild(div);
        } else {
            const div = document.createElement('div');
            div.className = 'photo-placeholder';
            div.innerHTML = `<i class="fa-solid fa-image"></i><span>Church Photo ${i + 1}</span>`;
            el.churchPhotosGrid.appendChild(div);
        }
    });
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    const username = el.usernameInput.value;
    const password = el.passwordInput.value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (data.success) {
            isLoggedIn = true;
            el.loginError.textContent = '';
            el.loginForm.reset();
            el.loginModal.classList.add('hidden');
            el.adminModal.classList.remove('hidden');
        } else {
            el.loginError.textContent = data.message || 'Invalid credentials.';
        }
    } catch (err) {
        el.loginError.textContent = 'Server not running. Start the Flask server first.';
        console.error(err);
    }
}

// Logout
function handleLogout() {
    isLoggedIn = false;
    el.adminModal.classList.add('hidden');
}

// Save settings
async function handleSaveSettings(e) {
    e.preventDefault();

    const payload = {
        church_name: el.churchNameInput.value,
        logo_url: el.churchLogoUrlInput.value,
        address: el.churchAddressInput.value,
        phone: el.churchPhoneInput.value,
        email: el.churchEmailInput.value,
        photo1_url: el.churchPhoto1Input.value,
        photo2_url: el.churchPhoto2Input.value,
        photo3_url: el.churchPhoto3Input.value
    };

    try {
        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        showToast(data.message);
        applySettings(payload);
    } catch (err) {
        showToast('Error saving settings.');
        console.error(err);
    }
}

// Save Song (Add or Edit)
async function handleSaveSong(e) {
    e.preventDefault();

    const songId = el.songIdInput.value;
    const payload = {
        number: parseInt(el.songNumInput.value),
        title_te: el.songTitleTeInput.value,
        title_en: el.songTitleEnInput.value,
        lyrics: el.songLyricsInput.value
    };

    try {
        let res;
        if (songId) {
            // Edit
            res = await fetch(`/api/songs/${songId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Add
            res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        const data = await res.json();
        showToast(data.message);
        clearSongForm();
        loadSongs(); // Refresh
    } catch (err) {
        showToast('Error saving song.');
        console.error(err);
    }
}

// Delete Song
async function deleteSong(id) {
    if (!confirm('Are you sure you want to delete this song?')) return;

    try {
        const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
        const data = await res.json();
        showToast(data.message);
        loadSongs();
    } catch (err) {
        showToast('Error deleting song.');
        console.error(err);
    }
}

// Change password
async function handleChangePassword(e) {
    e.preventDefault();
    const newPassword = el.newPasswordInput.value;

    try {
        const res = await fetch('/api/admin/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        const data = await res.json();
        showToast(data.message);
        el.passwordForm.reset();
    } catch (err) {
        showToast('Error changing password.');
        console.error(err);
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
