/* ══════════════════════════════════════════════════════════════════════════════
   utils.js — Core Utilities & Helpers
   ══════════════════════════════════════════════════════════════════════════════ */

// ── DOM Shortcuts ─────────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── API Wrapper ───────────────────────────────────────────────────────────────

async function api(url, options = {}) {
    try {
        const defaults = {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        };

        // Don't set Content-Type for FormData
        if (options.body instanceof FormData) {
            delete defaults.headers['Content-Type'];
        }

        const config = { ...defaults, ...options };
        if (options.body && !(options.body instanceof FormData)) {
            config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        }

        const res = await fetch(url, config);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || `Request failed (${res.status})`);
        }
        return data;
    } catch (err) {
        console.error(`API Error [${url}]:`, err);
        throw err;
    }
}

// ── Toast Notifications ───────────────────────────────────────────────────────

function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = $('#toast-container');
    if (existing) existing.remove();

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };

    const toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="material-icons-round" style="font-size:1.2rem;">${icons[type] || icons.info}</span>
        <span>${escapeHtml(message)}</span>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ── Debounce ──────────────────────────────────────────────────────────────────

function debounce(fn, ms = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

// ── Escape HTML ───────────────────────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Format Date ───────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// ── LocalStorage Helpers ──────────────────────────────────────────────────────

const Storage = {
    get(key, fallback = null) {
        try {
            const v = localStorage.getItem(key);
            return v !== null ? JSON.parse(v) : fallback;
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch { /* quota exceeded */ }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

// ── Favorites ─────────────────────────────────────────────────────────────────

const Favorites = {
    KEY: 'songbook_favorites',
    getAll() {
        return Storage.get(this.KEY, []);
    },
    isFav(slug) {
        return this.getAll().includes(slug);
    },
    toggle(slug) {
        const favs = this.getAll();
        const idx = favs.indexOf(slug);
        if (idx > -1) {
            favs.splice(idx, 1);
        } else {
            favs.push(slug);
        }
        Storage.set(this.KEY, favs);
        return idx === -1; // returns true if now favorited
    }
};

// ── Recently Viewed ───────────────────────────────────────────────────────────

const RecentlyViewed = {
    KEY: 'songbook_recent',
    MAX: 10,
    getAll() {
        return Storage.get(this.KEY, []);
    },
    add(song) {
        let recent = this.getAll();
        // Remove if exists
        recent = recent.filter(s => s.slug !== song.slug);
        // Add to front
        recent.unshift({ slug: song.slug, title: song.title });
        // Trim
        if (recent.length > this.MAX) recent = recent.slice(0, this.MAX);
        Storage.set(this.KEY, recent);
    }
};

// ── Theme ─────────────────────────────────────────────────────────────────────

const Theme = {
    KEY: 'songbook_theme',
    get() {
        return Storage.get(this.KEY, 'dark');
    },
    set(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.set(this.KEY, theme);
        const icon = $('#theme-icon');
        if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    },
    toggle() {
        this.set(this.get() === 'dark' ? 'light' : 'dark');
    },
    init() {
        this.set(this.get());
    }
};

// ── Text Truncate ─────────────────────────────────────────────────────────────

function truncate(str, maxLen = 120) {
    if (!str || str.length <= maxLen) return str || '';
    return str.substring(0, maxLen).trim() + '…';
}

// ── Copy to Clipboard ─────────────────────────────────────────────────────────

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied to clipboard!', 'success');
    }
}

// ── Print Content ─────────────────────────────────────────────────────────────

function printContent(title, content) {
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 2rem; max-width: 700px; margin: 0 auto; }
                h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #333; }
                .meta { color: #888; margin-bottom: 2rem; font-size: 0.9rem; }
                .lyrics { white-space: pre-wrap; line-height: 2; font-size: 1.1rem; color: #222; }
                @media print { body { padding: 1rem; } }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(title)}</h1>
            <div class="meta">Parnasala Fellowship — Songs Book</div>
            <div class="lyrics">${escapeHtml(content)}</div>
        </body>
        </html>
    `);
    win.document.close();
    win.print();
}
