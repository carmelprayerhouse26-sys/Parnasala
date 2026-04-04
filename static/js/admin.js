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
                        <input type="password" class="form-input" id="login-password" required
                               placeholder="••••••••" autocomplete="current-password">
                    </div>
                    <div id="login-error" class="form-error" style="display:none; margin-bottom:1rem;"></div>
                    <button type="submit" class="btn btn-primary" style="width:100%;" id="login-btn">
                        <span class="material-icons-round" style="font-size:1.1rem;">login</span>
                        <span data-i18n="admin_login_btn">${t('admin_login_btn')}</span>
                    </button>
                </form>
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
                    <label class="form-label">${t('admin_song_title')}</label>
                    <input type="text" class="form-input" id="edit-title" value="${escapeHtml(song.title)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_song_category')}</label>
                    <select class="form-select" id="edit-category">
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
                                title: $('#edit-title').value.trim(),
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
                    <label class="form-label">${t('admin_song_title')}</label>
                    <input type="text" class="form-input" id="add-title" required placeholder="Enter song title">
                </div>
                <div class="form-group">
                    <label class="form-label">${t('admin_song_category')}</label>
                    <select class="form-select" id="add-category">
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
            await api('/api/admin/songs', {
                method: 'POST',
                body: {
                    title: $('#add-title').value.trim(),
                    lyrics: $('#add-lyrics').value.trim(),
                    category: $('#add-category').value
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
