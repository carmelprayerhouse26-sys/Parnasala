/* ══════════════════════════════════════════════════════════════════════════════
   components.js — Reusable UI Components
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Song Card ─────────────────────────────────────────────────────────────────

function SongCard(song, index = 0) {
    const isFav = Favorites.isFav(song.slug);
    const preview = truncate(song.lyrics, 100);
    const num = String(index + 1).padStart(2, '0');

    return `
        <div class="song-card animate-in" onclick="navigateTo('/songs/${song.slug}')" style="animation-delay: ${index * 0.05}s">
            <span class="song-card-number">${num}</span>
            <div class="song-card-header">
                <h3 class="song-card-title">${escapeHtml(song.title)}</h3>
                <button class="song-card-fav ${isFav ? 'active' : ''}"
                        onclick="event.stopPropagation(); toggleFavorite('${song.slug}', this)"
                        title="${isFav ? t('song_unfavorite') : t('song_favorite')}">
                    <span class="material-icons-round">${isFav ? 'favorite' : 'favorite_border'}</span>
                </button>
            </div>
            <span class="song-card-category">${escapeHtml(song.category)}</span>
            <p class="song-card-preview">${escapeHtml(preview)}</p>
        </div>
    `;
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard(article, index = 0) {
    const preview = truncate(article.content, 120);
    const num = String(index + 1).padStart(2, '0');
    const displayTitle = currentLang === 'te' && article.title_te ? article.title_te : article.title;
    const subTitle = currentLang === 'te' ? article.title : article.title_te;
    const pubDate = article.published_at ? formatDate(article.published_at) : '';

    return `
        <div class="article-card animate-in" onclick="navigateTo('/articles/${article.slug}')" style="animation-delay: ${index * 0.05}s">
            <span class="article-card-number">${num}</span>
            <div class="article-card-icon">
                <span class="material-icons-round">auto_stories</span>
            </div>
            <div class="article-card-body">
                <h3 class="article-card-title">${escapeHtml(displayTitle)}</h3>
                ${subTitle ? `<p class="article-card-subtitle">${escapeHtml(subTitle)}</p>` : ''}
                ${pubDate ? `<span class="article-card-date"><span class="material-icons-round" style="font-size:0.85rem;">calendar_today</span> ${pubDate}</span>` : ''}
                <p class="article-card-preview">${escapeHtml(preview)}</p>
            </div>
        </div>
    `;
}

// ── Toggle Favorite (global handler) ──────────────────────────────────────────

function toggleFavorite(slug, btn) {
    const nowFav = Favorites.toggle(slug);
    if (btn) {
        const icon = btn.querySelector('.material-icons-round');
        btn.classList.toggle('active', nowFav);
        if (icon) icon.textContent = nowFav ? 'favorite' : 'favorite_border';
    }
    showToast(nowFav ? 'Added to favorites' : 'Removed from favorites', nowFav ? 'success' : 'info');
}

// ── Skeleton Cards ────────────────────────────────────────────────────────────

function SkeletonCards(count = 6) {
    let html = '<div class="songs-grid">';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="song-card skeleton-card">
                <div class="skeleton skeleton-text" style="width:60%; height:18px; margin-bottom:0.75rem;"></div>
                <div class="skeleton skeleton-text short" style="width:30%; height:14px; margin-bottom:0.75rem;"></div>
                <div class="skeleton skeleton-text" style="width:90%; height:12px;"></div>
                <div class="skeleton skeleton-text" style="width:70%; height:12px;"></div>
                <div class="skeleton skeleton-text short" style="width:50%; height:12px;"></div>
            </div>
        `;
    }
    html += '</div>';
    return html;
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState(icon, title, subtitle = '') {
    return `
        <div class="empty-state">
            <span class="material-icons-round">${icon}</span>
            <h3>${escapeHtml(title)}</h3>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
    `;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function openModal(title, bodyHtml, options = {}) {
    closeModal(); // Close any existing

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'app-modal';
    modal.innerHTML = `
        <div class="modal" style="${options.maxWidth ? 'max-width:' + options.maxWidth : ''}">
            <div class="modal-header">
                <h3>${escapeHtml(title)}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
        </div>
    `;

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = $('#app-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function confirmDialog(message, onConfirm) {
    const body = `
        <p style="margin-bottom:1.5rem; color: var(--text-secondary);">${escapeHtml(message)}</p>
        <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="closeModal()">
                <span class="material-icons-round" style="font-size:1rem;">close</span>
                ${t('admin_cancel')}
            </button>
            <button class="btn btn-danger btn-sm" id="confirm-btn">
                <span class="material-icons-round" style="font-size:1rem;">delete</span>
                Delete
            </button>
        </div>
    `;

    openModal('Confirm Action', body);

    // Bind confirm action
    setTimeout(() => {
        const btn = $('#confirm-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                closeModal();
                onConfirm();
            });
        }
    }, 50);
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader(tag, tagKey, title, titleKey, subtitle = '', subtitleKey = '') {
    return `
        <div class="section-header">
            <span class="section-tag" ${tagKey ? `data-i18n="${tagKey}"` : ''}>${tag}</span>
            <h2 class="section-title" ${titleKey ? `data-i18n="${titleKey}"` : ''}>${title}</h2>
            ${subtitle ? `<p class="section-subtitle" ${subtitleKey ? `data-i18n="${subtitleKey}"` : ''}>${subtitle}</p>` : ''}
        </div>
    `;
}

// ── Stats Card ────────────────────────────────────────────────────────────────

function StatCard(number, label, labelKey = '') {
    return `
        <div class="stat-card animate-in">
            <div class="stat-number" data-count="${number}">0</div>
            <div class="stat-label" ${labelKey ? `data-i18n="${labelKey}"` : ''}>${label}</div>
        </div>
    `;
}

// ── Animate Stat Counters ─────────────────────────────────────────────────────

function animateCounters() {
    $$('.stat-number[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        if (isNaN(target)) return;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = current;
        }, 30);
    });
}

// ── Particle Generator ────────────────────────────────────────────────────────

function generateParticles(container, count = 25) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 8}s`;
        particle.style.animationDuration = `${6 + Math.random() * 6}s`;
        particle.style.width = `${2 + Math.random() * 3}px`;
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// ── Intersection Observer for Animations ──────────────────────────────────────

function observeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    $$('.animate-in').forEach(el => observer.observe(el));
}
