/* ══════════════════════════════════════════════════════════════════════════════
   admin.js — Admin Login & Dashboard
   ══════════════════════════════════════════════════════════════════════════════ */

// ── Admin Page Router ─────────────────────────────────────────────────────────

async function renderAdminPage() {
    try {
        const check = await api('/api/admin/check');
        if (check.logged_in) {
            renderDashboard(check.username);
        } else {
            renderLoginPage();
        }
    } catch {
        renderLoginPage();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

function renderLoginPage() {
    const app = $('#app');
    app.innerHTML = `
        <div class="page-transition admin-login">
            <div class="admin-login-card">
                <div class="admin-login-header">
                    <span class="material-icons-round">admin_panel_settings</span>
                    <h2 data-i18n="admin_login_title">${t('admin_login_title')}</h2>
                    <p data-i18n="admin_login_subtitle">${t('admin_login_subtitle')}</p>
                </div>

                <form id="login-form" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label class="form-label" data-i18n="admin_email">${t('admin_email')}</label>
                        <input type="email" class="form-input" id="login-email" required
                               placeholder="Enter your ID" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label class="form-label" data-i18n="admin_password">${t('admin_password')}</label>
                        <div style="position:relative;">
                            <input type="password" class="form-input" id="login-password" required
                                   placeholder="••••••••" autocomplete="current-password" style="padding-right: 2.5rem;">
                            <button type="button" tabindex="-1" onclick="const input = this.previousElementSibling; if(input.type === 'password') { input.type = 'text'; this.querySelector('span').textContent = 'visibility'; } else { input.type = 'password'; this.querySelector('span').textContent = 'visibility_off'; }" style="position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; padding:0;">
                                <span class="material-icons-round" style="font-size:1.2rem;">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <div id="login-error" class="form-error" style="display:none; margin-bottom:1rem;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;" id="login-btn">
                        <span class="material-icons-round" style="font-size:1.1rem;">login</span>
                        <span data-i18n="admin_login_btn">${t('admin_login_btn')}</span>
                    </button>
                </form>

                <div style="text-align:center; margin-top:1.25rem;">
                    <button type="button" class="btn-link" onclick="renderForgotPasswordPage()" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:0.9rem; text-decoration:underline; padding:0;">
                        <span class="material-icons-round" style="font-size:0.9rem; vertical-align:middle;">lock_reset</span>
                        Forgot Password?
                    </button>
                </div>
            </div>
        </div>
    `;

    setLanguage(currentLang);
}

async function handleLogin(e) {
    e.preventDefault();

    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const errorEl = $('#login-error');
    const btn = $('#login-btn');

    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">hourglass_empty</span> Signing in...';

    try {
        await api('/api/admin/login', {
            method: 'POST',
            body: { username: email, password }
        });
        showToast('Login successful!', 'success');
        renderAdminPage();
    } catch (err) {
        errorEl.textContent = err.message || 'Invalid email or password';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = `<span class="material-icons-round" style="font-size:1.1rem;">login</span> ${t('admin_login_btn')}`;
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD FLOW
// ══════════════════════════════════════════════════════════════════════════════

let forgotPasswordEmail = '';
let forgotPasswordResetToken = '';

function renderForgotPasswordPage() {
    const app = $('#app');
    app.innerHTML = `
        <div class="page-transition admin-login">
            <div class="admin-login-card">
                <div class="admin-login-header">
                    <span class="material-icons-round" style="color:var(--accent);">lock_reset</span>
                    <h2>Reset Password</h2>
                    <p>Enter your admin email to receive a verification code</p>
                </div>

                <form id="forgot-form">
                    <div class="form-group">
                        <label class="form-label">Admin Email</label>
                        <input type="email" class="form-input" id="forgot-email" required
                               placeholder="Enter your admin email" autocomplete="email">
                    </div>
                    <div id="forgot-message" style="margin-bottom:1rem;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;" id="forgot-btn">
                        <span class="material-icons-round" style="font-size:1.1rem;">send</span>
                        Send Verification Code
                    </button>
                </form>

                <div style="text-align:center; margin-top:1.25rem;">
                    <button type="button" onclick="renderLoginPage()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem; padding:0;">
                        <span class="material-icons-round" style="font-size:0.9rem; vertical-align:middle;">arrow_back</span>
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    `;

    const form = document.getElementById('forgot-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();
        const btn = document.getElementById('forgot-btn');
        const msg = document.getElementById('forgot-message');

        if (!email) {
            msg.innerHTML = '<p class="form-error">Please enter your email</p>';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">hourglass_empty</span> Sending...';

        try {
            await api('/api/admin/forgot-password', {
                method: 'POST',
                body: { email }
            });
            forgotPasswordEmail = email;
            showToast('Verification code sent!', 'success');
            renderOtpVerifyPage();
        } catch (err) {
            msg.innerHTML = `<p class="form-error">${escapeHtml(err.message || 'Failed to send code')}</p>`;
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">send</span> Send Verification Code';
        }
    });
}

function renderOtpVerifyPage() {
    const app = $('#app');
    const maskedEmail = forgotPasswordEmail.replace(/(.{3})(.*)(@.*)/, '$1***$3');

    app.innerHTML = `
        <div class="page-transition admin-login">
            <div class="admin-login-card">
                <div class="admin-login-header">
                    <span class="material-icons-round" style="color:var(--accent);">verified</span>
                    <h2>Enter Verification Code</h2>
                    <p>A 6-digit code was sent to <strong>${escapeHtml(maskedEmail)}</strong></p>
                </div>

                <form id="otp-form">
                    <div class="form-group">
                        <label class="form-label">Verification Code</label>
                        <div style="display:flex; gap:0.5rem; justify-content:center;">
                            <input type="text" class="form-input otp-input" id="otp-code" maxlength="6"
                                   placeholder="000000" autocomplete="one-time-code"
                                   style="text-align:center; font-size:1.8rem; font-weight:700; letter-spacing:0.5rem; font-family:monospace; padding:0.75rem;">
                        </div>
                    </div>
                    <div id="otp-message" style="margin-bottom:1rem;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;" id="otp-btn">
                        <span class="material-icons-round" style="font-size:1.1rem;">check_circle</span>
                        Verify Code
                    </button>
                </form>

                <div style="text-align:center; margin-top:1.25rem; display:flex; justify-content:center; gap:1.5rem;">
                    <button type="button" onclick="renderForgotPasswordPage()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem; padding:0;">
                        <span class="material-icons-round" style="font-size:0.85rem; vertical-align:middle;">refresh</span>
                        Resend Code
                    </button>
                    <button type="button" onclick="renderLoginPage()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.85rem; padding:0;">
                        <span class="material-icons-round" style="font-size:0.85rem; vertical-align:middle;">arrow_back</span>
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    `;

    // Auto-focus on the OTP input
    setTimeout(() => {
        const otpInput = document.getElementById('otp-code');
        if (otpInput) otpInput.focus();
    }, 100);

    const form = document.getElementById('otp-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('otp-code').value.trim();
        const btn = document.getElementById('otp-btn');
        const msg = document.getElementById('otp-message');

        if (!code || code.length < 6) {
            msg.innerHTML = '<p class="form-error">Please enter the 6-digit code</p>';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">hourglass_empty</span> Verifying...';

        try {
            const result = await api('/api/admin/verify-otp', {
                method: 'POST',
                body: { email: forgotPasswordEmail, code }
            });
            forgotPasswordResetToken = result.reset_token;
            showToast('Code verified!', 'success');
            renderNewPasswordPage();
        } catch (err) {
            msg.innerHTML = `<p class="form-error">${escapeHtml(err.message || 'Invalid code')}</p>`;
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">check_circle</span> Verify Code';
        }
    });
}

function renderNewPasswordPage() {
    const app = $('#app');
    app.innerHTML = `
        <div class="page-transition admin-login">
            <div class="admin-login-card">
                <div class="admin-login-header">
                    <span class="material-icons-round" style="color:var(--success, #22c55e);">lock_open</span>
                    <h2>Set New Password</h2>
                    <p>Create a new password for your account</p>
                </div>

                <form id="reset-form">
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <div style="position:relative;">
                            <input type="password" class="form-input" id="reset-new-pw" required minlength="6"
                                   placeholder="Enter new password (min 6 characters)" style="padding-right: 2.5rem;">
                            <button type="button" tabindex="-1" onclick="const input = this.previousElementSibling; if(input.type === 'password') { input.type = 'text'; this.querySelector('span').textContent = 'visibility'; } else { input.type = 'password'; this.querySelector('span').textContent = 'visibility_off'; }" style="position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; padding:0;">
                                <span class="material-icons-round" style="font-size:1.2rem;">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <div style="position:relative;">
                            <input type="password" class="form-input" id="reset-confirm-pw" required minlength="6"
                                   placeholder="Re-enter new password" style="padding-right: 2.5rem;">
                            <button type="button" tabindex="-1" onclick="const input = this.previousElementSibling; if(input.type === 'password') { input.type = 'text'; this.querySelector('span').textContent = 'visibility'; } else { input.type = 'password'; this.querySelector('span').textContent = 'visibility_off'; }" style="position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; justify-content:center; padding:0;">
                                <span class="material-icons-round" style="font-size:1.2rem;">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <div id="reset-message" style="margin-bottom:1rem;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;" id="reset-btn">
                        <span class="material-icons-round" style="font-size:1.1rem;">save</span>
                        Reset Password
                    </button>
                </form>

                <div style="text-align:center; margin-top:1.25rem;">
                    <button type="button" onclick="renderLoginPage()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.9rem; padding:0;">
                        <span class="material-icons-round" style="font-size:0.9rem; vertical-align:middle;">arrow_back</span>
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    `;

    const form = document.getElementById('reset-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPw = document.getElementById('reset-new-pw').value;
        const confirmPw = document.getElementById('reset-confirm-pw').value;
        const btn = document.getElementById('reset-btn');
        const msg = document.getElementById('reset-message');

        if (newPw.length < 6) {
            msg.innerHTML = '<p class="form-error">Password must be at least 6 characters</p>';
            return;
        }

        if (newPw !== confirmPw) {
            msg.innerHTML = '<p class="form-error">Passwords do not match</p>';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">hourglass_empty</span> Resetting...';

        try {
            const result = await api('/api/admin/reset-password', {
                method: 'POST',
                body: {
                    email: forgotPasswordEmail,
                    reset_token: forgotPasswordResetToken,
                    new_password: newPw
                }
            });
            showToast(result.message || 'Password reset successfully!', 'success');
            forgotPasswordEmail = '';
            forgotPasswordResetToken = '';
            renderLoginPage();
        } catch (err) {
            msg.innerHTML = `<p class="form-error">${escapeHtml(err.message || 'Failed to reset password')}</p>`;
            btn.disabled = false;
            btn.innerHTML = '<span class="material-icons-round" style="font-size:1.1rem;">save</span> Reset Password';
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

async function renderDashboard(username = 'Admin') {
    const app = $('#app');

    app.innerHTML = `
        <div class="page-transition dashboard">
            <div class="dashboard-header">
                <div>
                    <h2 data-i18n="admin_dashboard">${t('admin_dashboard')}</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Welcome, ${escapeHtml(username)}</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="handleLogout()">
                    <span class="material-icons-round" style="font-size:1rem;">logout</span>
                    <span data-i18n="admin_logout">${t('admin_logout')}</span>
                </button>
            </div>

            <div class="dashboard-tabs" id="dashboard-tabs">
                <button class="tab-btn active" data-tab="songs">
                    <span class="material-icons-round" style="font-size:1rem;">library_music</span>
                    <span data-i18n="admin_tab_songs">${t('admin_tab_songs')}</span>
                </button>
                <button class="tab-btn" data-tab="add">
                    <span class="material-icons-round" style="font-size:1rem;">add_circle</span>
                    <span data-i18n="admin_tab_add">${t('admin_tab_add')}</span>
                </button>
                <button class="tab-btn" data-tab="upload">
                    <span class="material-icons-round" style="font-size:1rem;">upload_file</span>
                    <span data-i18n="admin_tab_upload">${t('admin_tab_upload')}</span>
                </button>
                <button class="tab-btn" data-tab="images">
                    <span class="material-icons-round" style="font-size:1rem;">collections</span>
                    <span data-i18n="admin_tab_images">${t('admin_tab_images')}</span>
                </button>
                <button class="tab-btn" data-tab="settings">
                    <span class="material-icons-round" style="font-size:1rem;">settings</span>
                    <span data-i18n="admin_tab_settings">${t('admin_tab_settings')}</span>
                </button>
                <button class="tab-btn" data-tab="categories">
                    <span class="material-icons-round" style="font-size:1rem;">label</span>
                    <span data-i18n="admin_tab_categories">${t('admin_tab_categories')}</span>
                </button>
                <button class="tab-btn" data-tab="articles">
                    <span class="material-icons-round" style="font-size:1rem;">auto_stories</span>
                    <span data-i18n="admin_tab_articles">${t('admin_tab_articles')}</span>
                </button>
                <button class="tab-btn" data-tab="add-article">
                    <span class="material-icons-round" style="font-size:1rem;">post_add</span>
                    <span data-i18n="admin_tab_add_article">${t('admin_tab_add_article')}</span>
                </button>
                <button class="tab-btn" data-tab="password">
                    <span class="material-icons-round" style="font-size:1rem;">key</span>
                    <span data-i18n="admin_tab_password">${t('admin_tab_password')}</span>
                </button>
            </div>

            <div id="tab-content"></div>
        </div>
    `;

    // Tab switching
    const tabBtns = $$('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchTab(btn.dataset.tab);
        });
    });

    // Load first tab
    switchTab('songs');
    setLanguage(currentLang);
}

async function switchTab(tab) {
    const content = $('#tab-content');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center; padding:3rem;"><div class="skeleton" style="height:200px;"></div></div>';

    switch (tab) {
        case 'songs': await renderAdminSongs(content); break;
        case 'add': renderAddSongForm(content); break;
        case 'upload': renderBulkUpload(content); break;
        case 'images': await renderAdminImages(content); break;
        case 'settings': await renderAdminSettings(content); break;
        case 'categories': await renderAdminCategories(content); break;
        case 'articles': await renderAdminArticles(content); break;
        case 'add-article': renderAddArticleForm(content); break;
        case 'password': renderChangePassword(content); break;
    }
}

async function handleLogout() {
    try {
        await api('/api/admin/logout', { method: 'POST' });
        showToast('Logged out', 'info');
        navigateTo('/');
    } catch {
        showToast('Logout failed', 'error');
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: MANAGE SONGS
// ══════════════════════════════════════════════════════════════════════════════

async function renderAdminSongs(container) {
    try {
        const songs = await api('/api/songs');
        if (songs.length === 0) {
            container.innerHTML = EmptyState('music_off', 'No songs yet', 'Add your first song using the Add Song tab');
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom:1rem; color: var(--text-muted); font-size:0.9rem;">
                ${songs.length} song${songs.length !== 1 ? 's' : ''} total
            </div>
            <ul class="admin-song-list">
                ${songs.map(s => `
                    <li class="admin-song-item">
                        <div class="admin-song-info">
                            <div class="admin-song-title">${escapeHtml(s.title)}</div>
                            <div class="admin-song-cat">${escapeHtml(s.category)} · ${s.slug}</div>
                        </div>
                        <div class="admin-song-actions">
                            <button class="icon-btn" title="Edit" onclick="openEditSong(${s.id})">
                                <span class="material-icons-round">edit</span>
                            </button>
                            <button class="icon-btn danger" title="Delete" onclick="deleteSong(${s.id}, '${escapeHtml(s.title).replace(/'/g, "\\'")}')">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    } catch {
        container.innerHTML = EmptyState('error', t('error_generic'));
    }
}

async function openEditSong(songId) {
    try {
        const songs = await api('/api/songs');
        const song = songs.find(s => s.id === songId);
        if (!song) return showToast('Song not found', 'error');

        const categories = await getCategories();
        const catOptions = categories.map(c =>
            `<option value="${escapeHtml(c.name)}" ${c.name === song.category ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
        ).join('');

        const body = `
            <form id="edit-song-form">
                <div class="form-group">
                    <label class="form-label">Song Title in Telugu</label>
                    <input type="text" class="form-input" id="edit-title-te" value="${escapeHtml(song.title_te || '')}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Song Title in English (Transliteration)</label>
                    <input type="text" class="form-input" id="edit-title-en" value="${escapeHtml(song.title_en || '')}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_song_category')}</label>
                    <select class="form-select" id="edit-category" required>
                        ${catOptions}
                        <option value="General" ${!categories.find(c => c.name === song.category) ? 'selected' : ''}>General</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_song_lyrics')}</label>
                    <textarea class="form-textarea" id="edit-lyrics" rows="10" required>${escapeHtml(song.lyrics)}</textarea>
                </div>
                <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">${t('admin_cancel')}</button>
                    <button type="submit" class="btn btn-primary btn-sm">
                        <span class="material-icons-round" style="font-size:1rem;">save</span>
                        ${t('admin_save')}
                    </button>
                </div>
            </form>
        `;

        openModal('Edit Song', body);

        setTimeout(() => {
            const form = $('#edit-song-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    try {
                        await api(`/api/admin/songs/${songId}`, {
                            method: 'PUT',
                            body: {
                                title_te: $('#edit-title-te').value.trim(),
                                title_en: $('#edit-title-en').value.trim(),
                                lyrics: $('#edit-lyrics').value.trim(),
                                category: $('#edit-category').value
                            }
                        });
                        closeModal();
                        showToast('Song updated!', 'success');
                        switchTab('songs');
                    } catch (err) {
                        showToast(err.message || 'Failed to update', 'error');
                    }
                });
            }
        }, 50);
    } catch (err) {
        showToast(err.message || 'Failed to load song', 'error');
    }
}

function deleteSong(songId, title) {
    confirmDialog(`Delete "${title}"? This cannot be undone.`, async () => {
        try {
            await api(`/api/admin/songs/${songId}`, { method: 'DELETE' });
            showToast('Song deleted', 'success');
            switchTab('songs');
        } catch (err) {
            showToast(err.message || 'Failed to delete', 'error');
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: ADD SONG
// ══════════════════════════════════════════════════════════════════════════════

async function renderAddSongForm(container) {
    const categories = await getCategories();
    const catOptions = categories.map(c =>
        `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
    ).join('');

    container.innerHTML = `
        <div style="max-width:700px;">
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">add_circle</span>
                ${t('admin_tab_add')}
            </h3>
            <form id="add-song-form">
                <div class="form-group">
                    <label class="form-label">Song Title in Telugu</label>
                    <input type="text" class="form-input" id="add-title-te" required placeholder="e.g., యేసు నామం">
                </div>
                <div class="form-group">
                    <label class="form-label">Song Title in English (Transliteration)</label>
                    <input type="text" class="form-input" id="add-title-en" required placeholder="e.g., yesu namam">
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_song_category')}</label>
                    <select class="form-select" id="add-category" required>
                        <option value="">Select a category...</option>
                        ${catOptions}
                        <option value="General">General</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_song_lyrics')}</label>
                    <textarea class="form-textarea" id="add-lyrics" rows="12" required
                              placeholder="Enter song lyrics&#10;&#10;Use blank lines to separate verses"></textarea>
                </div>
                <div id="add-song-message"></div>
                <button type="submit" class="btn btn-primary" id="add-song-btn">
                    <span class="material-icons-round" style="font-size:1rem;">save</span>
                    ${t('admin_save')}
                </button>
            </form>
        </div>
    `;

    const form = $('#add-song-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('#add-song-btn');
        btn.disabled = true;

        try {
            const titleTe = $('#add-title-te').value.trim();
            const titleEn = $('#add-title-en').value.trim();
            const lyrics = $('#add-lyrics').value.trim();
            const category = $('#add-category').value;

            if (!category) {
                throw new Error('Please select a category');
            }

            await api('/api/admin/songs', {
                method: 'POST',
                body: {
                    title_te: titleTe,
                    title_en: titleEn,
                    lyrics: lyrics,
                    category: category
                }
            });
            showToast('Song added successfully!', 'success');
            form.reset();
            invalidateCache();
        } catch (err) {
            showToast(err.message || 'Failed to add song', 'error');
        } finally {
            btn.disabled = false;
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: BULK UPLOAD
// ══════════════════════════════════════════════════════════════════════════════

function renderBulkUpload(container) {
    container.innerHTML = `
        <div style="max-width:600px;">
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">upload_file</span>
                ${t('admin_tab_upload')}
            </h3>

            <div class="file-upload-area" id="upload-area">
                <input type="file" id="upload-file" accept=".txt,.json,.csv" style="display:none;">
                <span class="material-icons-round">cloud_upload</span>
                <p data-i18n="admin_upload_desc">${t('admin_upload_desc')}</p>
                <p style="font-size:0.8rem; color: var(--text-muted); margin-top:0.5rem;">Supported: .txt, .json, .csv</p>
            </div>

            <div id="upload-status" style="margin-top:1rem;"></div>

            <div style="margin-top:2rem; padding:1.5rem; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md);">
                <h4 style="margin-bottom:0.75rem; font-size:0.95rem;">File Format Guide</h4>
                <div style="font-size:0.85rem; color: var(--text-secondary); line-height:1.8;">
                    <p><strong>JSON:</strong> <code>[{"title":"...", "lyrics":"...", "category":"..."}]</code></p>
                    <p><strong>CSV:</strong> Headers: title, lyrics, category</p>
                    <p><strong>TXT:</strong> Title on first line, lyrics below, songs separated by <code>---</code></p>
                </div>
            </div>
        </div>
    `;

    const area = $('#upload-area');
    const fileInput = $('#upload-file');

    area.addEventListener('click', () => fileInput.click());

    // Drag & drop
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            uploadSongFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            uploadSongFile(fileInput.files[0]);
        }
    });
}

async function uploadSongFile(file) {
    const status = $('#upload-status');
    status.innerHTML = `<p style="color: var(--accent);">Uploading ${escapeHtml(file.name)}...</p>`;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await api('/api/admin/songs/upload', {
            method: 'POST',
            body: formData
        });
        status.innerHTML = `<p class="form-success">${escapeHtml(result.message)}</p>`;
        showToast(`${result.count} songs imported!`, 'success');
        invalidateCache();
    } catch (err) {
        status.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
        showToast(err.message || 'Upload failed', 'error');
    }
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: IMAGES
// ══════════════════════════════════════════════════════════════════════════════

async function renderAdminImages(container) {
    container.innerHTML = `
        <div>
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">collections</span>
                ${t('admin_tab_images')}
            </h3>

            <!-- Upload Area -->
            <div style="margin-bottom:2rem;">
                <div class="file-upload-area" id="image-upload-area">
                    <input type="file" id="image-file" accept="image/*" style="display:none;">
                    <span class="material-icons-round">add_photo_alternate</span>
                    <p>Click or drag to upload an image</p>
                </div>
                <div class="form-group" style="margin-top:0.75rem; max-width:400px;">
                    <input type="text" class="form-input" id="image-caption" placeholder="Image caption (optional)">
                </div>
            </div>

            <!-- Logo Upload -->
            <div style="margin-bottom:2rem; padding:1.5rem; background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md);">
                <h4 style="margin-bottom:0.75rem;">${t('admin_settings_logo')}</h4>
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div class="file-upload-area" style="padding:1rem; flex:1;" id="logo-upload-area">
                        <input type="file" id="logo-file" accept="image/*" style="display:none;">
                        <span class="material-icons-round" style="font-size:1.5rem;">image</span>
                        <p style="font-size:0.85rem;">Upload church logo</p>
                    </div>
                    <div id="current-logo"></div>
                </div>
            </div>

            <!-- Image Grid -->
            <div class="admin-image-grid" id="admin-images-grid"></div>
        </div>
    `;

    // Image upload
    const imgArea = $('#image-upload-area');
    const imgFile = $('#image-file');

    imgArea.addEventListener('click', () => imgFile.click());
    imgArea.addEventListener('dragover', (e) => { e.preventDefault(); imgArea.classList.add('dragover'); });
    imgArea.addEventListener('dragleave', () => imgArea.classList.remove('dragover'));
    imgArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imgArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) uploadImage(e.dataTransfer.files[0]);
    });
    imgFile.addEventListener('change', () => {
        if (imgFile.files.length > 0) uploadImage(imgFile.files[0]);
    });

    // Logo upload
    const logoArea = $('#logo-upload-area');
    const logoFile = $('#logo-file');

    logoArea.addEventListener('click', () => logoFile.click());
    logoFile.addEventListener('change', () => {
        if (logoFile.files.length > 0) uploadLogo(logoFile.files[0]);
    });

    // Show current logo
    try {
        const settings = await getSettings();
        if (settings.logo_url) {
            $('#current-logo').innerHTML = `<img src="${settings.logo_url}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--accent);">`;
        }
    } catch { /* ignore */ }

    // Load images
    await loadAdminImages();
}

async function uploadImage(file) {
    const caption = ($('#image-caption') || {}).value || '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);

    try {
        await api('/api/admin/images', { method: 'POST', body: formData });
        showToast('Image uploaded!', 'success');
        if ($('#image-caption')) $('#image-caption').value = '';
        await loadAdminImages();
        loadFooterData(); // Refresh footer gallery
    } catch (err) {
        showToast(err.message || 'Upload failed', 'error');
    }
}

async function uploadLogo(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await api('/api/admin/logo', { method: 'POST', body: formData });
        showToast('Logo updated!', 'success');
        invalidateCache();
        // Update nav logo
        const navLogo = $('#nav-logo');
        if (navLogo && result.logo_url) {
            navLogo.src = result.logo_url;
            navLogo.style.display = '';
        }
        // Update current logo display
        const currentLogo = $('#current-logo');
        if (currentLogo && result.logo_url) {
            currentLogo.innerHTML = `<img src="${result.logo_url}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid var(--accent);">`;
        }
    } catch (err) {
        showToast(err.message || 'Logo upload failed', 'error');
    }
}

async function loadAdminImages() {
    const grid = $('#admin-images-grid');
    if (!grid) return;

    try {
        const images = await api('/api/images');
        if (images.length === 0) {
            grid.innerHTML = EmptyState('photo_library', 'No images uploaded yet');
            return;
        }

        grid.innerHTML = images.map(img => `
            <div class="admin-image-card">
                <img src="/uploads/${img.filename}" alt="${escapeHtml(img.caption)}"
                     onclick="openLightbox('/uploads/${img.filename}')">
                <button class="admin-image-delete" onclick="deleteImage(${img.id})" title="Delete">
                    <span class="material-icons-round" style="font-size:0.9rem;">close</span>
                </button>
            </div>
        `).join('');
    } catch {
        grid.innerHTML = EmptyState('error', t('error_generic'));
    }
}

function deleteImage(imageId) {
    confirmDialog('Delete this image?', async () => {
        try {
            await api(`/api/admin/images/${imageId}`, { method: 'DELETE' });
            showToast('Image deleted', 'success');
            await loadAdminImages();
            loadFooterData();
        } catch (err) {
            showToast(err.message || 'Failed to delete', 'error');
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

async function renderAdminSettings(container) {
    const settings = await getSettings();
    const social = settings.social_links || {};

    container.innerHTML = `
        <div style="max-width:700px;">
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">settings</span>
                ${t('admin_tab_settings')}
            </h3>
            <form id="settings-form">
                <div class="form-group">
                    <label class="form-label">${t('admin_settings_name')}</label>
                    <input type="text" class="form-input" id="set-name" value="${escapeHtml(settings.church_name || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_settings_tagline')}</label>
                    <input type="text" class="form-input" id="set-tagline" value="${escapeHtml(settings.tagline || '')}">
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_settings_about')}</label>
                    <textarea class="form-textarea" id="set-about" rows="6">${escapeHtml(settings.about || '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_settings_contact')}</label>
                    <textarea class="form-textarea" id="set-contact" rows="4">${escapeHtml(settings.contact || '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_settings_address')}</label>
                    <textarea class="form-textarea" id="set-address" rows="3">${escapeHtml(settings.address || '')}</textarea>
                </div>

                <h4 style="margin:1.5rem 0 1rem; font-size:1rem;">${t('admin_settings_social')}</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div class="form-group">
                        <label class="form-label">Facebook</label>
                        <input type="text" class="form-input" id="set-facebook" value="${escapeHtml(social.facebook || '')}" placeholder="https://facebook.com/...">
                    </div>
                    <div class="form-group">
                        <label class="form-label">YouTube</label>
                        <input type="text" class="form-input" id="set-youtube" value="${escapeHtml(social.youtube || '')}" placeholder="https://youtube.com/...">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Instagram</label>
                        <input type="text" class="form-input" id="set-instagram" value="${escapeHtml(social.instagram || '')}" placeholder="https://instagram.com/...">
                    </div>
                    <div class="form-group">
                        <label class="form-label">WhatsApp</label>
                        <input type="text" class="form-input" id="set-whatsapp" value="${escapeHtml(social.whatsapp || '')}" placeholder="https://wa.me/...">
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" id="save-settings-btn">
                    <span class="material-icons-round" style="font-size:1rem;">save</span>
                    ${t('admin_save')}
                </button>
            </form>
        </div>
    `;

    const form = $('#settings-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = $('#save-settings-btn');
        btn.disabled = true;

        try {
            await api('/api/admin/settings', {
                method: 'PUT',
                body: {
                    church_name: $('#set-name').value.trim(),
                    tagline: $('#set-tagline').value.trim(),
                    about: $('#set-about').value.trim(),
                    contact: $('#set-contact').value.trim(),
                    address: $('#set-address').value.trim(),
                    social_links: {
                        facebook: $('#set-facebook').value.trim(),
                        youtube: $('#set-youtube').value.trim(),
                        instagram: $('#set-instagram').value.trim(),
                        whatsapp: $('#set-whatsapp').value.trim()
                    }
                }
            });
            showToast('Settings saved!', 'success');
            invalidateCache();

            // Update nav brand name
            const navName = $('#nav-church-name');
            if (navName) navName.textContent = $('#set-name').value.trim();

            loadFooterData();
        } catch (err) {
            showToast(err.message || 'Failed to save', 'error');
        } finally {
            btn.disabled = false;
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════

async function renderAdminCategories(container) {
    container.innerHTML = `
        <div style="max-width:500px;">
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">label</span>
                ${t('admin_tab_categories')}
            </h3>

            <form id="add-cat-form" style="display:flex; gap:0.75rem; margin-bottom:2rem;">
                <input type="text" class="form-input" id="new-cat-name" placeholder="${t('admin_cat_name')}" required style="flex:1;">
                <button type="submit" class="btn btn-primary btn-sm">
                    <span class="material-icons-round" style="font-size:1rem;">add</span>
                    ${t('admin_cat_add')}
                </button>
            </form>

            <div id="categories-list"></div>
        </div>
    `;

    const form = $('#add-cat-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#new-cat-name').value.trim();
        if (!name) return;

        try {
            await api('/api/admin/categories', { method: 'POST', body: { name } });
            showToast('Category added!', 'success');
            $('#new-cat-name').value = '';
            invalidateCache();
            await loadCategoryList();
        } catch (err) {
            showToast(err.message || 'Failed to add', 'error');
        }
    });

    await loadCategoryList();
}

async function loadCategoryList() {
    const list = $('#categories-list');
    if (!list) return;

    try {
        const categories = await api('/api/categories');
        if (categories.length === 0) {
            list.innerHTML = EmptyState('label_off', 'No categories yet');
            return;
        }

        list.innerHTML = categories.map(cat => `
            <div class="admin-song-item" style="margin-bottom:0.5rem;">
                <div class="admin-song-info">
                    <div class="admin-song-title">${escapeHtml(cat.name)}</div>
                </div>
                <button class="icon-btn danger" onclick="deleteCategory(${cat.id}, '${escapeHtml(cat.name).replace(/'/g, "\\'")}')" title="Delete">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        `).join('');
    } catch {
        list.innerHTML = EmptyState('error', t('error_generic'));
    }
}

function deleteCategory(catId, name) {
    confirmDialog(`Delete category "${name}"?`, async () => {
        try {
            await api(`/api/admin/categories/${catId}`, { method: 'DELETE' });
            showToast('Category deleted', 'success');
            invalidateCache();
            await loadCategoryList();
        } catch (err) {
            showToast(err.message || 'Failed to delete', 'error');
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: CHANGE PASSWORD
// ══════════════════════════════════════════════════════════════════════════════

function renderChangePassword(container) {
    container.innerHTML = `
        <div style="max-width:440px;">
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">key</span>
                ${t('admin_tab_password')}
            </h3>
            <form id="change-pw-form">
                <div class="form-group">
                    <label class="form-label">${t('admin_pw_current')}</label>
                    <input type="password" class="form-input" id="pw-current" required>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_pw_new')}</label>
                    <input type="password" class="form-input" id="pw-new" required minlength="6">
                </div>
                <div id="pw-message"></div>
                <button type="submit" class="btn btn-primary">
                    <span class="material-icons-round" style="font-size:1rem;">lock</span>
                    ${t('admin_pw_change')}
                </button>
            </form>
        </div>
    `;

    const form = $('#change-pw-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = $('#pw-message');

        try {
            await api('/api/admin/change-password', {
                method: 'POST',
                body: {
                    current_password: $('#pw-current').value,
                    new_password: $('#pw-new').value
                }
            });
            showToast('Password changed!', 'success');
            form.reset();
            msg.innerHTML = '<p class="form-success">Password changed successfully!</p>';
        } catch (err) {
            msg.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
            showToast(err.message || 'Failed', 'error');
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: MANAGE ARTICLES
// ══════════════════════════════════════════════════════════════════════════════

async function renderAdminArticles(container) {
    try {
        const articles = await api('/api/articles');
        if (articles.length === 0) {
            container.innerHTML = EmptyState('auto_stories', 'No articles yet', 'Add your first article using the Add Article tab');
            return;
        }

        container.innerHTML = `
            <div style="margin-bottom:1rem; color: var(--text-muted); font-size:0.9rem;">
                ${articles.length} article${articles.length !== 1 ? 's' : ''} total
            </div>
            <ul class="admin-song-list">
                ${articles.map(a => `
                    <li class="admin-song-item">
                        <div class="admin-song-info">
                            <div class="admin-song-title">
                                ${escapeHtml(a.title)}
                                ${a.pdf_url ? '<span class="material-icons-round" style="font-size:0.9rem; color:var(--accent); margin-left:0.3rem; vertical-align:middle;" title="Has PDF">picture_as_pdf</span>' : ''}
                                ${a.content ? '<span class="material-icons-round" style="font-size:0.9rem; color:var(--text-muted); margin-left:0.2rem; vertical-align:middle;" title="Has text">article</span>' : ''}
                            </div>
                            <div class="admin-song-cat">${a.title_te ? escapeHtml(a.title_te) + ' · ' : ''}${a.slug}</div>
                        </div>
                        <div class="admin-song-actions">
                            <button class="icon-btn" title="Edit" onclick="openEditArticle(${a.id})">
                                <span class="material-icons-round">edit</span>
                            </button>
                            <button class="icon-btn danger" title="Delete" onclick="deleteArticle(${a.id}, '${escapeHtml(a.title).replace(/'/g, "\\'")}')">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    } catch {
        container.innerHTML = EmptyState('error', t('error_generic'));
    }
}

async function openEditArticle(articleId) {
    try {
        const articles = await api('/api/articles');
        const article = articles.find(a => a.id === articleId);
        if (!article) return showToast('Article not found', 'error');

        const body = `
            <form id="edit-article-form">
                <div class="form-group">
                    <label class="form-label">${t('admin_article_title')}</label>
                    <input type="text" class="form-input" id="edit-art-title" value="${escapeHtml(article.title)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_article_title_te')}</label>
                    <input type="text" class="form-input" id="edit-art-title-te" value="${escapeHtml(article.title_te || '')}" placeholder="తెలుగు పేరు">
                </div>

                <!-- PDF Upload Section -->
                <div class="form-group">
                    <label class="form-label" style="display:flex; align-items:center; gap:0.4rem;">
                        <span class="material-icons-round" style="font-size:1.1rem; color:var(--accent);">picture_as_pdf</span>
                        PDF File (optional)
                    </label>
                    ${article.pdf_url ? `
                        <div id="edit-art-pdf-current" style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem; background:var(--bg-elevated); border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:0.75rem;">
                            <span class="material-icons-round" style="color:var(--accent); font-size:1.5rem;">picture_as_pdf</span>
                            <span style="flex:1; font-size:0.9rem; color:var(--text-secondary);">PDF attached</span>
                            <a href="${article.pdf_url}" target="_blank" class="btn btn-sm btn-secondary" style="font-size:0.8rem;">
                                <span class="material-icons-round" style="font-size:0.9rem;">open_in_new</span>
                                View
                            </a>
                            <button type="button" class="btn btn-sm btn-danger" style="font-size:0.8rem;" onclick="document.getElementById('edit-art-remove-pdf').value='1'; this.closest('#edit-art-pdf-current').style.display='none';">
                                <span class="material-icons-round" style="font-size:0.9rem;">delete</span>
                                Remove
                            </button>
                        </div>
                    ` : ''}
                    <input type="hidden" id="edit-art-remove-pdf" value="0">
                    <div class="file-upload-area" id="edit-art-pdf-area" style="padding:1rem;">
                        <input type="file" id="edit-art-pdf-file" accept=".pdf" style="display:none;">
                        <span class="material-icons-round" style="font-size:1.5rem;">upload_file</span>
                        <p style="font-size:0.85rem;">${article.pdf_url ? 'Upload new PDF to replace' : 'Click to upload a PDF'}</p>
                    </div>
                    <div id="edit-art-pdf-name" style="font-size:0.85rem; color:var(--text-muted); margin-top:0.4rem;"></div>
                </div>

                <!-- Text Content Section -->
                <div class="form-group">
                    <label class="form-label" style="display:flex; align-items:center; gap:0.4rem;">
                        <span class="material-icons-round" style="font-size:1.1rem; color:var(--accent);">article</span>
                        Text Content (optional)
                    </label>
                    <textarea class="form-textarea" id="edit-art-content" rows="12" placeholder="Enter text content (optional if PDF is provided)">${escapeHtml(article.content || '')}</textarea>
                </div>

                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem;">
                    <span class="material-icons-round" style="font-size:0.85rem; vertical-align:middle;">info</span>
                    Provide at least one: PDF file or text content (or both)
                </p>

                <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="closeModal()">${t('admin_cancel')}</button>
                    <button type="submit" class="btn btn-primary btn-sm">
                        <span class="material-icons-round" style="font-size:1rem;">save</span>
                        ${t('admin_save')}
                    </button>
                </div>
            </form>
        `;

        openModal('Edit Article', body, { maxWidth: '650px' });

        setTimeout(() => {
            // PDF upload area
            const pdfArea = document.getElementById('edit-art-pdf-area');
            const pdfInput = document.getElementById('edit-art-pdf-file');
            const pdfName = document.getElementById('edit-art-pdf-name');
            if (pdfArea && pdfInput) {
                pdfArea.addEventListener('click', () => pdfInput.click());
                pdfInput.addEventListener('change', () => {
                    if (pdfInput.files.length > 0) {
                        pdfName.textContent = '📄 ' + pdfInput.files[0].name;
                    }
                });
            }

            const form = document.getElementById('edit-article-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    try {
                        const formData = new FormData();
                        formData.append('title', document.getElementById('edit-art-title').value.trim());
                        formData.append('title_te', document.getElementById('edit-art-title-te').value.trim());
                        formData.append('content', document.getElementById('edit-art-content').value.trim());
                        formData.append('remove_pdf', document.getElementById('edit-art-remove-pdf').value);

                        const pdfFile = document.getElementById('edit-art-pdf-file');
                        if (pdfFile && pdfFile.files.length > 0) {
                            formData.append('pdf_file', pdfFile.files[0]);
                        }

                        await api(`/api/admin/articles/${articleId}`, {
                            method: 'PUT',
                            body: formData
                        });
                        closeModal();
                        showToast('Article updated!', 'success');
                        switchTab('articles');
                    } catch (err) {
                        showToast(err.message || 'Failed to update', 'error');
                    }
                });
            }
        }, 50);
    } catch (err) {
        showToast(err.message || 'Failed to load article', 'error');
    }
}

function deleteArticle(articleId, title) {
    confirmDialog(`Delete "${title}"? This cannot be undone.`, async () => {
        try {
            await api(`/api/admin/articles/${articleId}`, { method: 'DELETE' });
            showToast('Article deleted', 'success');
            switchTab('articles');
        } catch (err) {
            showToast(err.message || 'Failed to delete', 'error');
        }
    });
}


// ══════════════════════════════════════════════════════════════════════════════
// TAB: ADD ARTICLE
// ══════════════════════════════════════════════════════════════════════════════

function renderAddArticleForm(container) {
    container.innerHTML = `
        <div style="max-width:700px;">
            <h3 style="margin-bottom:1.5rem; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-icons-round" style="color:var(--accent);">post_add</span>
                ${t('admin_tab_add_article')}
            </h3>
            <form id="add-article-form">
                <div class="form-group">
                    <label class="form-label">${t('admin_article_title')} *</label>
                    <input type="text" class="form-input" id="add-art-title" required placeholder="Enter article title">
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_article_title_te')}</label>
                    <input type="text" class="form-input" id="add-art-title-te" placeholder="తెలుగు పేరు ఇవ్వండి">
                </div>

                <!-- PDF Upload Section -->
                <div class="form-group">
                    <label class="form-label" style="display:flex; align-items:center; gap:0.4rem;">
                        <span class="material-icons-round" style="font-size:1.1rem; color:var(--accent);">picture_as_pdf</span>
                        PDF File (optional)
                    </label>
                    <div class="file-upload-area" id="add-art-pdf-area" style="padding:1.5rem;">
                        <input type="file" id="add-art-pdf-file" accept=".pdf" style="display:none;">
                        <span class="material-icons-round" style="font-size:2rem; color:var(--accent);">upload_file</span>
                        <p style="margin-top:0.5rem;">Click or drag to upload a PDF</p>
                        <p style="font-size:0.8rem; color: var(--text-muted); margin-top:0.3rem;">Max 16 MB · .pdf files only</p>
                    </div>
                    <div id="add-art-pdf-name" style="font-size:0.85rem; color:var(--accent); margin-top:0.5rem;"></div>
                </div>

                <!-- Divider -->
                <div style="display:flex; align-items:center; gap:1rem; margin:1.5rem 0; color:var(--text-muted);">
                    <div style="flex:1; height:1px; background:var(--border-color);"></div>
                    <span style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em;">and / or</span>
                    <div style="flex:1; height:1px; background:var(--border-color);"></div>
                </div>

                <!-- Text Content Section -->
                <div class="form-group">
                    <label class="form-label" style="display:flex; align-items:center; gap:0.4rem;">
                        <span class="material-icons-round" style="font-size:1.1rem; color:var(--accent);">article</span>
                        Text Content (optional)
                    </label>
                    <textarea class="form-textarea" id="add-art-content" rows="14"
                              placeholder="Write your article content here...\n\nUse blank lines to separate paragraphs\n\n(Leave empty if only uploading a PDF)"></textarea>
                </div>

                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1rem; display:flex; align-items:center; gap:0.3rem;">
                    <span class="material-icons-round" style="font-size:0.85rem;">info</span>
                    Provide at least one: PDF file or text content. You can provide both.
                </p>

                <div id="add-article-message"></div>
                <button type="submit" class="btn btn-primary" id="add-article-btn">
                    <span class="material-icons-round" style="font-size:1rem;">save</span>
                    ${t('admin_save')}
                </button>
            </form>
        </div>
    `;

    // PDF upload area interactions
    const pdfArea = document.getElementById('add-art-pdf-area');
    const pdfInput = document.getElementById('add-art-pdf-file');
    const pdfName = document.getElementById('add-art-pdf-name');

    pdfArea.addEventListener('click', () => pdfInput.click());
    pdfArea.addEventListener('dragover', (e) => { e.preventDefault(); pdfArea.classList.add('dragover'); });
    pdfArea.addEventListener('dragleave', () => pdfArea.classList.remove('dragover'));
    pdfArea.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.toLowerCase().endsWith('.pdf')) {
                // Transfer file to the input
                const dt = new DataTransfer();
                dt.items.add(file);
                pdfInput.files = dt.files;
                pdfName.innerHTML = `<span class="material-icons-round" style="font-size:0.9rem; vertical-align:middle;">picture_as_pdf</span> ${escapeHtml(file.name)}`;
            } else {
                showToast('Only PDF files are allowed', 'error');
            }
        }
    });
    pdfInput.addEventListener('change', () => {
        if (pdfInput.files.length > 0) {
            pdfName.innerHTML = `<span class="material-icons-round" style="font-size:0.9rem; vertical-align:middle;">picture_as_pdf</span> ${escapeHtml(pdfInput.files[0].name)}`;
        } else {
            pdfName.textContent = '';
        }
    });

    const form = document.getElementById('add-article-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('add-article-btn');
        btn.disabled = true;

        try {
            const title = document.getElementById('add-art-title').value.trim();
            const titleTe = document.getElementById('add-art-title-te').value.trim();
            const content = document.getElementById('add-art-content').value.trim();
            const pdfFile = document.getElementById('add-art-pdf-file');
            const hasPdf = pdfFile && pdfFile.files.length > 0;

            if (!content && !hasPdf) {
                showToast('Please provide either text content or a PDF file (or both)', 'error');
                btn.disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('title_te', titleTe);
            formData.append('content', content);
            if (hasPdf) {
                formData.append('pdf_file', pdfFile.files[0]);
            }

            await api('/api/admin/articles', {
                method: 'POST',
                body: formData
            });
            showToast('Article added successfully!', 'success');
            form.reset();
            pdfName.textContent = '';
        } catch (err) {
            showToast(err.message || 'Failed to add article', 'error');
        } finally {
            btn.disabled = false;
        }
    });
}
