/* ══════════════════════════════════════════════════════════════════════════════
   app.js — SPA Router, Initialization & Global Event Bindings
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Global App Object ─────────────────────────────────────────────────────────

const App = {
    currentPage: null,

    // Re-render current page (used by language toggle)
    rerender() {
        router();
    }
};

// ── SPA Router ────────────────────────────────────────────────────────────────

function navigateTo(path) {
    window.location.hash = path;
}

function getRoute() {
    const hash = window.location.hash.replace('#', '') || '/';
    return hash;
}

async function router() {
    const route = getRoute();
    const app = $('#app');

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile menu
    closeMobileMenu();

    // Update active nav link
    updateActiveNav(route);

    try {
        if (route === '/') {
            App.currentPage = 'home';
            await renderHomePage();
        } else if (route === '/songs') {
            App.currentPage = 'songs';
            await renderSongsPage();
        } else if (route.startsWith('/songs/')) {
            const slug = route.replace('/songs/', '');
            App.currentPage = 'song-detail';
            await renderSongDetailPage(slug);
        } else if (route === '/about') {
            App.currentPage = 'about';
            await renderAboutPage();
        } else if (route === '/contact') {
            App.currentPage = 'contact';
            await renderContactPage();
        } else if (route === '/address') {
            App.currentPage = 'address';
            await renderAddressPage();
        } else if (route === '/articles') {
            App.currentPage = 'articles';
            await renderArticlesPage();
        } else if (route.startsWith('/articles/')) {
            const slug = route.replace('/articles/', '');
            App.currentPage = 'article-detail';
            await renderArticleDetailPage(slug);
        } else if (route === '/admin') {
            App.currentPage = 'admin';
            await renderAdminPage();
        } else {
            // 404 - redirect to home
            App.currentPage = 'home';
            await renderHomePage();
        }
    } catch (err) {
        console.error('Router error:', err);
        app.innerHTML = `
            <div class="page-transition" style="min-height:60vh; display:flex; align-items:center; justify-content:center;">
                ${EmptyState('error', 'Something went wrong', 'Please try refreshing the page.')}
            </div>
        `;
    }
}

// ── Update Active Nav Link ────────────────────────────────────────────────────

function updateActiveNav(route) {
    $$('.nav-link').forEach(link => {
        link.classList.remove('active');
        const page = link.dataset.page;
        if (
            (page === 'home' && route === '/') ||
            (page === 'songs' && (route === '/songs' || route.startsWith('/songs/'))) ||
            (page === 'articles' && (route === '/articles' || route.startsWith('/articles/'))) ||
            (page === 'about' && route === '/about') ||
            (page === 'contact' && route === '/contact') ||
            (page === 'address' && route === '/address')
        ) {
            link.classList.add('active');
        }
    });
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────

function initMobileMenu() {
    const hamburger = $('#hamburger');
    const navLinks = $('#nav-links');
    const overlay = $('#mobile-overlay');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }

    // Close on nav link click
    $$('.nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}

function closeMobileMenu() {
    const hamburger = $('#hamburger');
    const navLinks = $('#nav-links');
    const overlay = $('#mobile-overlay');

    if (hamburger) hamburger.classList.remove('active');
    if (navLinks) navLinks.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ── Navbar Scroll Effect ──────────────────────────────────────────────────────

function initNavbarScroll() {
    const navbar = $('#navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ── Scroll to Top Button ──────────────────────────────────────────────────────

function initScrollToTop() {
    const btn = $('#scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── Theme Toggle ──────────────────────────────────────────────────────────────

function initThemeToggle() {
    const btn = $('#theme-toggle');
    if (btn) {
        btn.addEventListener('click', () => Theme.toggle());
    }
}

// ── Language Toggle ───────────────────────────────────────────────────────────

function initLanguageToggle() {
    const btn = $('#lang-toggle');
    if (btn) {
        btn.addEventListener('click', () => toggleLanguage());
    }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function openLightbox(src) {
    const lightbox = $('#lightbox');
    const img = $('#lightbox-img');
    if (lightbox && img) {
        img.src = src;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function initLightbox() {
    const lightbox = $('#lightbox');
    const closeBtn = $('#lightbox-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

// ── Footer Data ───────────────────────────────────────────────────────────────

async function loadFooterData() {
    try {
        // Settings
        const settings = await getSettings();

        // Update footer name
        const footerName = $('#footer-name');
        if (footerName) footerName.textContent = settings.church_name || 'Parnasala Fellowship';

        // Update nav church name
        const navName = $('#nav-church-name');
        if (navName) navName.textContent = settings.church_name || 'Parnasala Fellowship';

        // Update nav logo
        const navLogo = $('#nav-logo');
        if (navLogo && settings.logo_url) {
            navLogo.src = settings.logo_url;
            navLogo.style.display = '';
        }

        // Footer contact
        const footerContact = $('#footer-contact');
        if (footerContact) {
            footerContact.textContent = settings.contact || 'Contact info coming soon.';
        }

        // Social links
        const socialContainer = $('#footer-social');
        if (socialContainer && settings.social_links) {
            const social = settings.social_links;
            const socialIcons = {
                facebook: '📘',
                youtube: '▶️',
                instagram: '📷',
                whatsapp: '💬'
            };

            let socialHtml = '';
            for (const [platform, url] of Object.entries(social)) {
                if (url && url !== '#') {
                    socialHtml += `
                        <a href="${escapeHtml(url)}" class="social-link" target="_blank" rel="noopener" title="${platform}">
                            ${socialIcons[platform] || '🔗'}
                        </a>
                    `;
                }
            }

            if (socialHtml) {
                socialContainer.innerHTML = socialHtml;
            } else {
                socialContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Coming soon</p>';
            }
        }

        // Footer year
        const footerYear = $('#footer-year');
        if (footerYear) footerYear.textContent = new Date().getFullYear();

    } catch (err) {
        console.error('Footer data error:', err);
    }

    // Gallery images
    try {
        const images = await api('/api/images');
        const gallery = $('#footer-gallery');
        if (gallery) {
            if (images.length > 0) {
                const displayImages = images.slice(0, 6);
                gallery.innerHTML = displayImages.map(img =>
                    `<img src="/uploads/${img.filename}" alt="${escapeHtml(img.caption)}"
                          onclick="openLightbox('/uploads/${img.filename}')">`
                ).join('');
            } else {
                gallery.innerHTML = `<p class="footer-empty" data-i18n="footer_no_images">${t('footer_no_images')}</p>`;
            }
        }
    } catch {
        // ignore
    }
}

// ── Loading Screen ────────────────────────────────────────────────────────────

function dismissLoadingScreen() {
    const loading = $('#loading-screen');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
            setTimeout(() => loading.remove(), 600);
        }, 1200);
    }
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape to close modal/lightbox
        if (e.key === 'Escape') {
            closeModal();
            const lightbox = $('#lightbox');
            if (lightbox && lightbox.style.display !== 'none') {
                lightbox.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    Theme.init();

    // Initialize i18n
    initI18n();

    // Initialize all UI bindings
    initMobileMenu();
    initNavbarScroll();
    initScrollToTop();
    initThemeToggle();
    initLanguageToggle();
    initLightbox();
    initKeyboardShortcuts();

    // Load footer data
    loadFooterData();

    // Listen for hash changes
    window.addEventListener('hashchange', router);

    // Initial route
    await router();

    // Dismiss loading screen
    dismissLoadingScreen();
});
