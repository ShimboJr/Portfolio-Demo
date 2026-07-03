/**
 * menus.js — Desktop & dock context menus + quick-settings + wallpaper picker
 *
 * Handles four UI surfaces:
 *   1. Desktop right-click context menu
 *   2. Dock icon right-click context menu
 *   3. Quick-settings dropdown (fills in the panel stub from index.html)
 *   4. Wallpaper picker (floats at cursor, opened via "Change Background")
 *
 * Design rules:
 *   · Only ONE context menu / picker open at a time.
 *   · All menus close on outside click (global bubble handler) or Escape.
 *   · Wallpaper choice is persisted in localStorage and restored on boot.
 *   · Does NOT re-wire the power-btn toggle — shell.js already owns that
 *     via the `.open` class; this file only populates panel content.
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     WALLPAPER COLOUR PRESETS  ← add / edit as needed
     ══════════════════════════════════════════════════════════ */

  const COLOR_PRESETS = [
    { color: '#1e1e2e', label: 'Mocha Base'  },
    { color: '#11111b', label: 'Crust'       },
    { color: '#1a1a2e', label: 'Midnight'    },
    { color: '#0d1117', label: 'GitHub Dark' },
    { color: '#0f172a', label: 'Navy'        },
    { color: '#1c1c1c', label: 'Void'        },
  ];

  /** localStorage key for persisted wallpaper data */
  const WP_KEY = 'portfolio_wallpaper';

  /* ══════════════════════════════════════════════════════════
     GLOBAL CONTEXT-MENU MANAGER
     ══════════════════════════════════════════════════════════ */

  /** Every .ctx-menu created via _makeCtxMenu() is registered here */
  const _ctxMenus = [];

  /** Hide all registered context menus */
  function _closeAllCtx() {
    _ctxMenus.forEach(m => m.classList.remove('visible'));
  }

  /**
   * Position and show a context menu at (x, y), clamping to viewport.
   * Automatically closes any other open context menu first.
   */
  function _showCtx(menuEl, x, y) {
    _closeAllCtx();
    menuEl.style.left = `${x}px`;
    menuEl.style.top  = `${y}px`;
    menuEl.classList.add('visible');

    // Clamp to viewport after layout
    requestAnimationFrame(() => {
      const r = menuEl.getBoundingClientRect();
      if (r.right  > window.innerWidth)  menuEl.style.left = `${x - r.width  - 2}px`;
      if (r.bottom > window.innerHeight) menuEl.style.top  = `${y - r.height - 2}px`;
    });
  }

  /** Create a .ctx-menu element, append to body, and register it */
  function _makeCtxMenu(id) {
    const el = document.createElement('div');
    el.className = 'ctx-menu';
    el.id = id;
    el.setAttribute('role', 'menu');
    document.body.appendChild(el);
    _ctxMenus.push(el);
    return el;
  }

  /** HTML-escape a string */
  function _esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Close all context menus on any outside click (bubble phase)
  document.addEventListener('click', _closeAllCtx);

  // Escape key closes all menus + quick-settings panel
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    _closeAllCtx();
    const qs  = document.getElementById('quick-settings-panel');
    const pb  = document.getElementById('power-btn');
    if (qs?.classList.contains('open')) {
      qs.classList.remove('open');
      pb?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ══════════════════════════════════════════════════════════
     WALLPAPER UTILITIES
     ══════════════════════════════════════════════════════════ */

  /**
   * Apply a wallpaper to #desktop-area (where the background CSS lives).
   * data = { type: 'color' | 'image', value: '#hex' | 'data:...' | 'https://...' }
   */
  function _applyWallpaper(data) {
    // #desktop-area is the element that carries background-color + background-image
    // in shell.css (the dot-grid pattern lives there, not on #desktop-shell)
    const area = document.getElementById('desktop-area');
    if (!area) { console.error('[Wallpaper] #desktop-area not found'); return; }

    if (data.type === 'color') {
      // Clear the dot-grid pattern and any previous image
      area.style.backgroundImage    = 'none';
      area.style.backgroundSize     = '';
      area.style.backgroundPosition = '';
      area.style.backgroundColor    = data.value;
    } else {
      area.style.backgroundImage    = `url("${data.value}")`;
      area.style.backgroundSize     = 'cover';
      area.style.backgroundPosition = 'center';
      area.style.backgroundColor    = '#000';
    }
  }

  /**
   * Apply AND persist a wallpaper to localStorage.
   * For data-URLs >2 MB (large photos), skips localStorage with a warning
   * but still applies visually.
   */
  function _applyAndSave(data) {
    _applyWallpaper(data);

    const tooLarge = data.type === 'image'
                  && data.value.startsWith('data:')
                  && data.value.length > 2_000_000;   // ~1.5 MB base64

    if (tooLarge) {
      console.warn('[Wallpaper] Image >2 MB — applied but not saved (localStorage limit).');
      return;
    }

    try {
      localStorage.setItem(WP_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[Wallpaper] Could not save to localStorage:', e.message);
    }
  }

  /** Read and re-apply wallpaper saved in previous session */
  function _restoreWallpaper() {
    try {
      const raw = localStorage.getItem(WP_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.type && data?.value) _applyWallpaper(data);
    } catch (e) { /* ignore */ }
  }

  /* ══════════════════════════════════════════════════════════
     WALLPAPER PICKER PANEL
     ══════════════════════════════════════════════════════════ */

  /**
   * Build and return the wallpaper picker panel.
   * The panel is a .ctx-menu so it participates in the
   * global close-all mechanism.
   */
  function _buildWallpaperPanel() {
    const panel = _makeCtxMenu('wp-panel');
    panel.classList.add('wp-panel');
    panel.setAttribute('aria-label', 'Set Wallpaper');

    // ── Static HTML ─────────────────────────────────────────
    const swatches = COLOR_PRESETS.map(p => `
      <button class="wp-swatch" type="button"
              data-wp-color="${_esc(p.color)}"
              style="background:${_esc(p.color)}"
              title="${_esc(p.label)}"
              aria-label="${_esc(p.label)}"></button>`).join('');

    panel.innerHTML = `
      <!-- Header -->
      <div class="wp-header">
        <span class="wp-header-title">Set Wallpaper</span>
        <button class="wp-close-btn" id="wp-close" type="button"
                aria-label="Close wallpaper picker">✕</button>
      </div>

      <!-- Body -->
      <div class="wp-body">

        <!-- Color swatches -->
        <div class="wp-label">Solid Colors</div>
        <div class="wp-swatches" role="group" aria-label="Color presets">
          ${swatches}
        </div>

        <!-- File upload -->
        <div class="wp-label">Upload Image</div>
        <div class="wp-file-row">
          <button class="wp-choose-btn" id="wp-choose-btn" type="button">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                 xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 9v2.5h9V9" stroke="currentColor" stroke-width="1.3"
                    stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6.5 2v6M4 4.5l2.5-2.5 2.5 2.5"
                    stroke="currentColor" stroke-width="1.3"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Upload File
          </button>
          <span class="wp-filename" id="wp-filename">No file chosen</span>
        </div>
        <!-- Hidden file input — triggered by the button above -->
        <input type="file" id="wp-file-input" accept="image/*"
               style="display:none" aria-hidden="true" tabindex="-1"/>

        <!-- URL -->
        <div class="wp-label">Image URL</div>
        <div class="wp-url-row">
          <input class="wp-url-input" id="wp-url-input" type="url"
                 placeholder="https://example.com/wallpaper.jpg"
                 aria-label="Wallpaper image URL"
                 spellcheck="false" autocomplete="off"/>
          <button class="wp-apply-btn" id="wp-apply-btn" type="button">Apply</button>
        </div>

        <!-- Status message (error / success) -->
        <div class="wp-msg" id="wp-msg" role="status" aria-live="polite"></div>

      </div>`;

    // ── Refs ───────────────────────────────────────────────
    const closeBtn  = panel.querySelector('#wp-close');
    const fileInput = panel.querySelector('#wp-file-input');
    const chooseBtn = panel.querySelector('#wp-choose-btn');
    const filenameEl = panel.querySelector('#wp-filename');
    const urlInput  = panel.querySelector('#wp-url-input');
    const applyBtn  = panel.querySelector('#wp-apply-btn');
    const msgEl     = panel.querySelector('#wp-msg');
    let _msgTimer   = null;

    // ── Helpers ────────────────────────────────────────────

    function _showMsg(text, type /* 'error' | 'info' */) {
      msgEl.textContent = text;
      msgEl.className = `wp-msg wp-msg-${type}`;
      clearTimeout(_msgTimer);
      _msgTimer = setTimeout(() => {
        msgEl.textContent = '';
        msgEl.className   = 'wp-msg';
      }, 4000);
    }

    function _markActive(color /* null for image */) {
      panel.querySelectorAll('.wp-swatch').forEach(btn => {
        btn.classList.toggle('wp-active', btn.dataset.wpColor === color);
      });
    }

    // Restore active swatch from localStorage on first show
    function _syncActiveFromStorage() {
      try {
        const raw  = localStorage.getItem(WP_KEY);
        const data = raw ? JSON.parse(raw) : null;
        _markActive(data?.type === 'color' ? data.value : null);
        if (data?.type === 'image' && data.value?.startsWith('http')) {
          urlInput.value = data.value;
        }
      } catch (e) { /* ignore */ }
    }

    // ── Close button ───────────────────────────────────────
    closeBtn?.addEventListener('click', e => {
      e.stopPropagation();
      _closeAllCtx();
    });

    // ── Prevent panel clicks from bubbling to global closer ─
    panel.addEventListener('click', e => e.stopPropagation());

    // ── Color swatches ─────────────────────────────────────
    panel.querySelectorAll('.wp-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.wpColor;
        _applyAndSave({ type: 'color', value: color });
        _markActive(color);
        _showMsg(`Background set to ${btn.title}`, 'info');
        // Keep panel open so user can try swatches
      });
    });

    // ── File upload ────────────────────────────────────────
    chooseBtn?.addEventListener('click', e => {
      e.stopPropagation();
      fileInput?.click();
    });

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        _showMsg('Please choose an image file (jpg, png, gif, webp…)', 'error');
        return;
      }

      filenameEl.textContent = file.name;

      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        _applyAndSave({ type: 'image', value: dataUrl });
        _markActive(null);
        _showMsg('Wallpaper applied ✓', 'info');
      };
      reader.onerror = () => _showMsg('Failed to read file — please try again.', 'error');
      reader.readAsDataURL(file);

      // Reset input so the same file can be re-chosen
      fileInput.value = '';
    });

    // ── URL apply ──────────────────────────────────────────
    function _applyUrl() {
      const raw = urlInput.value.trim();
      if (!raw) { _showMsg('Please enter an image URL.', 'error'); return; }

      // Basic URL sanity check
      let url;
      try { url = new URL(raw).href; }
      catch { _showMsg('That doesn\'t look like a valid URL.', 'error'); return; }

      // Test load — catches CORS errors silently; worst-case the bg just won't show
      applyBtn.disabled = true;
      applyBtn.innerHTML = '<span class="wp-spinner"></span>';

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        _applyAndSave({ type: 'image', value: url });
        _markActive(null);
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply';
        _showMsg('Wallpaper applied ✓', 'info');
      };

      img.onerror = () => {
        // Some hosts block cross-origin probing but the URL still works as
        // a CSS background.  Try applying directly and let the browser decide.
        _applyAndSave({ type: 'image', value: url });
        _markActive(null);
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply';
        _showMsg('Applied (image may be blocked by CORS — try another URL if blank)', 'info');
      };

      img.src = url;
    }

    applyBtn?.addEventListener('click', e => { e.stopPropagation(); _applyUrl(); });
    urlInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.stopPropagation(); _applyUrl(); }
    });
    urlInput?.addEventListener('click', e => e.stopPropagation());

    // Expose the sync helper so _showWallpaperPanel() can call it each time
    panel._syncActive = _syncActiveFromStorage;

    return panel;
  }

  // Panel singleton — created once in _init()
  let _wpPanel = null;

  /** Open the wallpaper picker at (x, y), syncing the active swatch first */
  function _showWallpaperPanel(x, y) {
    if (!_wpPanel) return;
    _wpPanel._syncActive?.();
    _showCtx(_wpPanel, x, y);
  }

  /* ══════════════════════════════════════════════════════════
     1. DESKTOP RIGHT-CLICK CONTEXT MENU
     ══════════════════════════════════════════════════════════ */

  function _initDesktopMenu() {
    const desktopArea = document.getElementById('desktop-area');
    if (!desktopArea) return;

    const menu = _makeCtxMenu('ctx-desktop');

    let iconsVisible = true;

    function _rebuildDesktopMenu() {
      menu.innerHTML = `
        <button class="ctx-item" data-action="terminal" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="12" height="10" rx="2"
                  stroke="currentColor" stroke-width="1.2"/>
            <path d="M3.5 4.5L6 6.5 3.5 8.5"
                  stroke="currentColor" stroke-width="1.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="7" y1="8.5" x2="10.5" y2="8.5"
                  stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          Open Terminal Here
        </button>

        <button class="ctx-item" data-action="change-bg" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5"
                    stroke="currentColor" stroke-width="1.2"/>
            <circle cx="5" cy="5.5" r="1" fill="currentColor"/>
            <circle cx="8.5" cy="4.5" r="1" fill="currentColor"/>
            <circle cx="10" cy="7.5" r="1" fill="currentColor"/>
            <circle cx="5" cy="9" r="1" fill="currentColor"/>
          </svg>
          Change Background…
        </button>

        <div class="ctx-sep" role="separator"></div>

        <button class="ctx-item" data-action="display-settings" role="menuitem">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="12" height="9" rx="1.5"
                  stroke="currentColor" stroke-width="1.2"/>
            <line x1="4.5" y1="12.5" x2="9.5" y2="12.5"
                  stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="7" y1="10" x2="7" y2="12.5"
                  stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Display Settings
        </button>

        <div class="ctx-sep" role="separator"></div>

        <button class="ctx-item ${iconsVisible ? 'ctx-checked' : ''}"
                data-action="toggle-icons" role="menuitem"
                aria-checked="${iconsVisible}">
          ${iconsVisible ? 'Hide' : 'Show'} Desktop Icons
        </button>`;
    }

    desktopArea.addEventListener('contextmenu', e => {
      if (e.target.closest('.desktop-icon')) return;  // let icon handle its own
      e.preventDefault();
      e.stopPropagation();
      _rebuildDesktopMenu();
      _showCtx(menu, e.clientX, e.clientY);
    });

    menu.addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      // "Change Background" opens the picker at the SAME position as the ctx menu
      if (action === 'change-bg') {
        const rect = menu.getBoundingClientRect();
        _closeAllCtx();
        // Show picker to the right of where the ctx menu was
        _showWallpaperPanel(rect.right + 4, rect.top);
        return;
      }

      _closeAllCtx();

      switch (action) {
        case 'terminal':
          window.openApp?.('terminal');
          break;

        case 'display-settings':
          window.openApp?.('settings');
          break;

        case 'toggle-icons':
          iconsVisible = !iconsVisible;
          document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.style.display = iconsVisible ? '' : 'none';
          });
          break;
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     2. DOCK ICON RIGHT-CLICK CONTEXT MENU
     ══════════════════════════════════════════════════════════ */

  function _initDockMenu() {
    const dock = document.getElementById('dock');
    if (!dock) return;

    const menu  = _makeCtxMenu('ctx-dock');
    let _appId  = null;

    function _rebuildDockMenu(appId) {
      const isTerminal = appId === 'terminal';
      menu.innerHTML = `
        <button class="ctx-item" data-action="open" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 13 13"
               fill="currentColor" aria-hidden="true">
            <path d="M3 2.5l7 4-7 4V2.5z"/>
          </svg>
          Open
        </button>

        ${isTerminal ? `
        <button class="ctx-item" data-action="new-window" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <rect x="1" y="3" width="9" height="9" rx="1.5"
                  stroke="currentColor" stroke-width="1.2"/>
            <path d="M4 1h8v8" stroke="currentColor" stroke-width="1.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Open New Window
        </button>` : ''}

        <div class="ctx-sep" role="separator"></div>

        <button class="ctx-item ctx-danger" data-action="remove-fav" role="menuitem">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 2l9 9M11 2l-9 9"
                  stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Remove from Favorites
        </button>`;
    }

    dock.addEventListener('contextmenu', e => {
      const dockItem = e.target.closest('.dock-item');
      if (!dockItem?.dataset.app) return;
      e.preventDefault();
      e.stopPropagation();
      _appId = dockItem.dataset.app;
      _rebuildDockMenu(_appId);
      _showCtx(menu, e.clientX, e.clientY);
    });

    document.getElementById('dock-wrapper')
      ?.addEventListener('contextmenu', e => e.preventDefault());

    menu.addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      _closeAllCtx();

      switch (btn.dataset.action) {
        case 'open':
          window.openApp?.(_appId);
          break;

        case 'new-window':
          window.openApp?.('terminal');
          break;

        case 'remove-fav': {
          const dockItem = dock.querySelector(`.dock-item[data-app="${_appId}"]`);
          if (dockItem) {
            dockItem.classList.add('ctx-faded');
            // Auto-restore after 8 s so demo stays usable
            setTimeout(() => dockItem.classList.remove('ctx-faded'), 8000);
          }
          break;
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     3. QUICK-SETTINGS PANEL CONTENT
     shell.js owns the #power-btn `.open` toggle.
     This function only populates the inner HTML and wires
     buttons inside the panel.
     ══════════════════════════════════════════════════════════ */

  function _initQuickSettings() {
    const panel    = document.getElementById('quick-settings-panel');
    const powerBtn = document.getElementById('power-btn');
    const trayBtn  = document.getElementById('tray-indicators');
    if (!panel) return;

    // Wire tray-indicators to the same toggle as power-btn
    if (trayBtn && powerBtn) {
      trayBtn.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('open');
        powerBtn.setAttribute('aria-expanded', panel.classList.contains('open').toString());
      });
    }

    // ── Fill panel content ─────────────────────────────────
    panel.innerHTML = `

      <!-- Wi-Fi / Bluetooth / DND toggles -->
      <div class="qs-toggles">

        <button class="qs-toggle-btn qs-on" data-qs-toggle="wifi"
                type="button" aria-pressed="true">
          <svg class="qs-toggle-icon" width="22" height="22" viewBox="0 0 22 22"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="11" cy="18" r="2" fill="currentColor"/>
            <path d="M6.2 13.5a6.8 6.8 0 0 1 9.6 0"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M2.2 9.5a12.5 12.5 0 0 1 17.6 0"
                  stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" opacity=".55"/>
          </svg>
          Wi-Fi
        </button>

        <button class="qs-toggle-btn" data-qs-toggle="bluetooth"
                type="button" aria-pressed="false">
          <svg class="qs-toggle-icon" width="22" height="22" viewBox="0 0 22 22"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8 7l6 5-6 5V3l6 5-6 5"
                  stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Bluetooth
        </button>

        <button class="qs-toggle-btn" data-qs-toggle="dnd"
                type="button" aria-pressed="false">
          <svg class="qs-toggle-icon" width="22" height="22" viewBox="0 0 22 22"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M19 13.5A8 8 0 1 1 8.5 3a5.5 5.5 0 0 0 10.5 10.5z"
                  stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Do Not Disturb
        </button>

      </div>

      <!-- Volume + Brightness sliders -->
      <div class="qs-sliders">

        <div class="qs-slider-row">
          <svg class="qs-slider-label" width="16" height="16" viewBox="0 0 16 16"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 5.8v4.4h2.5L8 12.5V3.5L4.5 5.8H2z" fill="currentColor"/>
            <path d="M10.2 6.2a3 3 0 0 1 0 3.6"
                  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M12 4.2a5.8 5.8 0 0 1 0 7.6"
                  stroke="currentColor" stroke-width="1.3"
                  stroke-linecap="round" opacity=".5"/>
          </svg>
          <input class="qs-slider" type="range" min="0" max="100" value="70"
                 aria-label="System volume"/>
        </div>

        <div class="qs-slider-row">
          <svg class="qs-slider-label" width="16" height="16" viewBox="0 0 16 16"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5
                     M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1
                     M11.3 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1"
                  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input class="qs-slider" type="range" min="0" max="100" value="85"
                 aria-label="Screen brightness"/>
        </div>

      </div>

      <div class="qs-divider" role="separator"></div>

      <!-- Power section -->
      <div class="qs-section-label">Power</div>
      <div class="qs-power-row">

        <button class="qs-power-btn" data-qs-power="restart" type="button">
          <svg class="qs-power-icon" width="22" height="22" viewBox="0 0 22 22"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 11a7 7 0 1 0 1.4-4.2"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <polyline points="1,7 5.5,7 5.5,3"
                      stroke="currentColor" stroke-width="1.6"
                      stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          Restart
        </button>

        <button class="qs-power-btn" data-qs-power="suspend" type="button">
          <svg class="qs-power-icon" width="22" height="22" viewBox="0 0 22 22"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M19 13.5A8 8 0 1 1 8.5 3a5.5 5.5 0 0 0 10.5 10.5z"
                  stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Suspend
        </button>

        <button class="qs-power-btn qs-danger" data-qs-power="poweroff" type="button">
          <svg class="qs-power-icon" width="22" height="22" viewBox="0 0 22 22"
               fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7.5 4.8A8 8 0 1 0 14.5 4.8"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="11" y1="2" x2="11" y2="10"
                  stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          Power Off
        </button>

      </div>`;

    // Wire toggle buttons (visual only — set dressing)
    panel.querySelectorAll('[data-qs-toggle]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const on = btn.classList.toggle('qs-on');
        btn.setAttribute('aria-pressed', on.toString());
      });
    });

    // Wire power buttons
    panel.addEventListener('click', e => {
      const btn = e.target.closest('[data-qs-power]');
      if (!btn) return;

      // Close panel first
      panel.classList.remove('open');
      powerBtn?.setAttribute('aria-expanded', 'false');

      switch (btn.dataset.qsPower) {
        case 'restart':
          setTimeout(() => location.reload(), 200);
          break;
        case 'suspend':
          _showSuspendOverlay();
          break;
        case 'poweroff':
          _showPowerOffOverlay();
          break;
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     POWER OVERLAYS
     ══════════════════════════════════════════════════════════ */

  function _makeOverlay(icon, title, hint) {
    const el = document.createElement('div');
    el.className = 'power-overlay';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-label', title);
    el.innerHTML = `
      <div class="power-overlay-icon"  aria-hidden="true">${icon}</div>
      <div class="power-overlay-title">${title}</div>
      ${hint ? `<div class="power-overlay-hint">${hint}</div>` : ''}`;
    document.body.appendChild(el);
    return el;
  }

  function _showSuspendOverlay() {
    const el = _makeOverlay('🔒', 'Suspended', 'Click anywhere to wake');
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      el.style.transition = 'opacity 300ms ease';
      el.style.opacity    = '0';
      setTimeout(() => el.remove(), 320);
    }, { once: true });
  }

  function _showPowerOffOverlay() {
    _makeOverlay('⏻', 'Thanks for visiting', 'Refresh the page to boot again');
  }

  /* ══════════════════════════════════════════════════════════
     BOOTSTRAP
     ══════════════════════════════════════════════════════════ */

  function _init() {
    // Restore any wallpaper saved from a previous session
    _restoreWallpaper();

    // Build the wallpaper picker singleton (not shown yet)
    _wpPanel = _buildWallpaperPanel();

    // Wire all three menus
    _initDesktopMenu();
    _initDockMenu();
    _initQuickSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
