/**
 * shell.js — GNOME Shell 47 desktop interactivity
 *
 * Responsibilities:
 *  1. openApp(appId)       — calls WM.open(); placeholder content for
 *                            apps not yet built, real content injected later
 *  2. Live clock           — "Weekday Month D  HH:MM", ticks every second
 *  3. Desktop icon manager — pointer-based drag + single/double-click select
 *  4. Dock manager         — hover tooltips, dot indicators, auto-hide
 *  5. Top-bar buttons      — Activities click, power button quick-settings stub
 *
 * Load order: window-manager.js (defer) → shell.js (defer)
 * Both are deferred so they execute after the DOM is ready, in source order.
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     1. openApp  — global entry-point for launching apps
     ══════════════════════════════════════════════════════════ */

  /**
   * Per-app metadata table.
   * icon   : emoji used in the titlebar and placeholder until a real SVG is
   *          provided when that app is built.
   * width/height : default window size in px.
   * Later prompts override `content` by registering their own handler via
   * the custom event 'app:register' or by reassigning APP_META[appId].content.
   */
  const APP_META = {
    about:      { title: 'About Me',       icon: '👤', width: 660, height: 500 },
    projects:   { title: 'Projects',       icon: '📁', width: 800, height: 580 },
    resume:     { title: 'Resume.pdf',     icon: '📄', width: 700, height: 540 },
    terminal:   { title: 'Terminal',       icon: '💻', width: 740, height: 480 },
    trash:      { title: 'Trash',          icon: '🗑️', width: 640, height: 440 },
    files:      { title: 'Files',          icon: '📂', width: 740, height: 520 },
    texteditor: { title: 'Text Editor',    icon: '📝', width: 680, height: 520 },
    sysmon:     { title: 'System Monitor', icon: '📊', width: 740, height: 520 },
    settings:   { title: 'Settings',       icon: '⚙️', width: 680, height: 560 },
  };

  /**
   * APP_LAUNCHERS — registry for apps that need custom open logic.
   * terminal.js (and future app scripts) push entries here:
   *   window.APP_LAUNCHERS['terminal'] = function() { ... };
   * openApp() checks this registry before falling back to the
   * generic WM.open() placeholder path.
   */
  window.APP_LAUNCHERS = {};

  /**
   * openApp — launch (or focus) a desktop application.
   * 1. If appId is registered in APP_LAUNCHERS, delegate there.
   * 2. Otherwise call WM.open() with APP_META defaults (placeholder).
   *
   * @param {string}  appId     Matches data-app attributes on icons / dock items.
   * @param {string} [content]  Optional HTML override for the window body.
   */
  window.openApp = function openApp(appId, content) {
    if (typeof window.WM === 'undefined') {
      console.error('[SQI/OS] WM not available — window-manager.js may not have loaded.');
      return;
    }

    // ── Custom launcher (terminal, files, etc.) ────────────
    // Pass `content` through so data-driven launchers (e.g. project-detail)
    // receive their payload: openApp('project-detail', { projectId })
    if (window.APP_LAUNCHERS && window.APP_LAUNCHERS[appId]) {
      window.APP_LAUNCHERS[appId](content);
      return;
    }

    // ── Generic WM.open with placeholder ──────────────────
    const meta = APP_META[appId] || {
      title: appId,
      icon:  '📦',
      width: 600,
      height: 440,
    };

    WM.open(appId, {
      title:   meta.title,
      icon:    meta.icon,
      width:   meta.width,
      height:  meta.height,
      content: content || undefined,   // undefined → WM generates placeholder
    });
  };

  /* ══════════════════════════════════════════════════════════
     BUILT-IN APP LAUNCHERS (shell-level, no separate file)
     Registered here so they are available immediately; files.js
     may override 'files' later if it loads successfully.
     ══════════════════════════════════════════════════════════ */

  /**
   * 'projects' desktop icon  →  open Files app.
   * files.js registers APP_LAUNCHERS['files'] after shell.js runs
   * (both are deferred, in source order).  We use a tiny retry so
   * the Projects icon always finds the Files launcher even if there
   * is a tiny race between deferred scripts.
   */
  window.APP_LAUNCHERS['projects'] = function openProjects() {
    function _tryOpen() {
      if (window.APP_LAUNCHERS['files']) {
        window.APP_LAUNCHERS['files']();
      } else {
        // files.js hasn't registered yet — wait one more frame
        requestAnimationFrame(_tryOpen);
      }
    }
    _tryOpen();
  };

  /**
   * 'resume' desktop icon  →  open an inline PDF viewer window.
   * Uses <object> with <embed> fallback so the browser's native PDF
   * renderer handles the file.  A direct download link is provided
   * in case the browser blocks inline PDF rendering.
   */
  window.APP_LAUNCHERS['resume'] = function openResume() {
    if (!window.WM) return;

    const pdfPath = 'resume.pdf';

    const content = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #1e1e2e;
        font-family: var(--font-ui, 'Cantarell', 'Inter', sans-serif);
      ">
        <!-- Toolbar -->
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: #181825;
          border-bottom: 1px solid #313244;
          flex-shrink: 0;
        ">
          <svg width="16" height="16" viewBox="0 0 28 32" fill="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 2h14l6 6v22H4V2z" stroke="#a6e3a1" stroke-width="1.6"
                  fill="none" stroke-linejoin="round"/>
            <path d="M18 2v6h6" stroke="#a6e3a1" stroke-width="1.6"
                  stroke-linejoin="round" fill="none"/>
            <line x1="8" y1="14" x2="20" y2="14" stroke="#a6e3a1"
                  stroke-width="1.5" stroke-linecap="round"/>
            <line x1="8" y1="18" x2="20" y2="18" stroke="#a6e3a1"
                  stroke-width="1.5" stroke-linecap="round"/>
            <line x1="8" y1="22" x2="15" y2="22" stroke="#a6e3a1"
                  stroke-width="1.5" stroke-linecap="round"/>
          </svg>

          <span style="
            font-size: 12.5px;
            color: #cdd6f4;
            font-weight: 500;
            flex: 1;
          ">resume.pdf</span>

          <a href="${pdfPath}" download="resume.pdf" style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px;
            background: #313244;
            border: 1px solid #45475a;
            border-radius: 6px;
            color: #cdd6f4;
            font-size: 11.5px;
            font-weight: 500;
            text-decoration: none;
            transition: background 100ms;
          "
          onmouseover="this.style.background='#45475a'"
          onmouseout="this.style.background='#313244'">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                 xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 1v7M3 6l3 3 3-3" stroke="currentColor"
                    stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 10h10" stroke="currentColor"
                    stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            Download
          </a>
        </div>

        <!-- PDF viewer -->
        <div style="flex: 1; position: relative; min-height: 0;">
          <object
            data="${pdfPath}"
            type="application/pdf"
            style="width:100%; height:100%; border:none; display:block;"
            aria-label="Resume PDF document">

            <!-- Fallback: embed -->
            <embed
              src="${pdfPath}"
              type="application/pdf"
              style="width:100%; height:100%; border:none; display:block;"
              aria-label="Resume PDF document"/>

            <!-- Fallback message if neither renders -->
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              gap: 12px;
              color: #6c7086;
              font-size: 13px;
              text-align: center;
              padding: 24px;
            ">
              <span style="font-size: 36px;">📄</span>
              <span>Your browser doesn't support inline PDF viewing.</span>
              <a href="${pdfPath}" download="resume.pdf" style="
                color: #89b4fa;
                text-decoration: underline;
                font-size: 13px;
              ">Download resume.pdf</a>
            </div>

          </object>
        </div>
      </div>`;

    WM.open('resume', {
      title:   'Resume.pdf',
      icon:    '📄',
      width:   760,
      height:  600,
      content,
    });
  };



  // Listen for wm:update so the dock active-dots stay in sync
  document.addEventListener('wm:update', ({ detail }) => {
    const { openWindows } = detail;

    document.querySelectorAll('.dock-item').forEach(item => {
      const appId   = item.dataset.app;
      const isOpen  = openWindows.some(w => w.appId === appId && !w.minimized);
      const isAny   = openWindows.some(w => w.appId === appId);
      item.classList.toggle('active', isAny);
      item.querySelector('.dock-dot')?.style.setProperty(
        'opacity', isOpen ? '1' : isAny ? '0.45' : '0'
      );
    });
  });

  /* ══════════════════════════════════════════════════════════
     2. LIVE CLOCK
     ══════════════════════════════════════════════════════════ */

  const clockEl = document.getElementById('top-bar-clock');

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    // Two en-spaces (U+2002) between date and time, matching GNOME's top-bar style
    clockEl.textContent =
      `${DAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}\u2002\u2002${hh}:${mm}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* ══════════════════════════════════════════════════════════
     3. DESKTOP ICON MANAGER
     ══════════════════════════════════════════════════════════ */

  const desktopArea = document.getElementById('desktop-area');
  /** Currently selected icon element, or null */
  let selectedIcon = null;

  /** Deselect all desktop icons */
  function deselectAll() {
    if (selectedIcon) {
      selectedIcon.classList.remove('selected');
      selectedIcon = null;
    }
  }

  /** Select one icon (deselects previous) */
  function selectIcon(iconEl) {
    deselectAll();
    iconEl.classList.add('selected');
    selectedIcon = iconEl;
  }

  /**
   * Wire up drag + click + double-click on a single .desktop-icon element.
   * Uses the Pointer Events API for unified mouse / touch handling.
   */
  function initDesktopIcon(iconEl) {
    let isDragging   = false;
    let hasMoved     = false;
    let dragOffX     = 0;
    let dragOffY     = 0;
    let startClientX = 0;
    let startClientY = 0;

    // Single / double-click discrimination
    let clickCount = 0;
    let clickTimer = null;
    const DBL_CLICK_MS = 280;

    // ── Drag start ───────────────────────────────────────────
    iconEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const iconRect = iconEl.getBoundingClientRect();
      dragOffX     = e.clientX - iconRect.left;
      dragOffY     = e.clientY - iconRect.top;
      startClientX = e.clientX;
      startClientY = e.clientY;
      isDragging   = true;
      hasMoved     = false;

      iconEl.setPointerCapture(e.pointerId);
    });

    // ── Drag move ────────────────────────────────────────────
    iconEl.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startClientX;
      const dy = e.clientY - startClientY;

      if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasMoved = true;
        iconEl.classList.add('dragging');
        // Selecting while dragging feels natural
        selectIcon(iconEl);
      }

      if (!hasMoved) return;

      const areaRect = desktopArea.getBoundingClientRect();
      let newLeft = e.clientX - areaRect.left - dragOffX;
      let newTop  = e.clientY - areaRect.top  - dragOffY;

      // Clamp to desktop bounds
      newLeft = Math.max(0, Math.min(newLeft, areaRect.width  - iconEl.offsetWidth));
      newTop  = Math.max(0, Math.min(newTop,  areaRect.height - iconEl.offsetHeight));

      iconEl.style.left = `${newLeft}px`;
      iconEl.style.top  = `${newTop}px`;
    });

    // ── Drag end / click dispatch ────────────────────────────
    iconEl.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      iconEl.classList.remove('dragging');

      if (hasMoved) {
        hasMoved = false;
        return; // Pure drag — no click handling
      }
      hasMoved = false;

      // Disambiguate single vs. double click
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
          selectIcon(iconEl);
        }, DBL_CLICK_MS);
      } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        selectIcon(iconEl);
        window.openApp(iconEl.dataset.app);
      }
    });

    iconEl.addEventListener('pointercancel', () => {
      isDragging = false;
      hasMoved   = false;
      iconEl.classList.remove('dragging');
    });

    // Keyboard accessibility: Enter → open, Space → select
    iconEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { selectIcon(iconEl); window.openApp(iconEl.dataset.app); }
      if (e.key === ' ')     { e.preventDefault(); selectIcon(iconEl); }
    });
  }

  // Deselect on empty desktop click
  if (desktopArea) {
    desktopArea.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('.desktop-icon')) deselectAll();
    });

    // Initialise all desktop icons
    desktopArea.querySelectorAll('.desktop-icon').forEach(initDesktopIcon);
  }

  /* ══════════════════════════════════════════════════════════
     4. DOCK MANAGER
     ══════════════════════════════════════════════════════════ */

  const dockWrapper = document.getElementById('dock-wrapper');
  let dockHideTimer = null;

  function showDock() {
    if (!dockWrapper) return;
    clearTimeout(dockHideTimer);
    dockWrapper.classList.remove('dock-hidden');
  }

  function scheduleDockHide() {
    if (!dockWrapper) return;
    clearTimeout(dockHideTimer);
    dockHideTimer = setTimeout(() => {
      dockWrapper.classList.add('dock-hidden');
    }, 900);
  }

  if (dockWrapper) {
    dockWrapper.addEventListener('mouseenter', showDock);
    dockWrapper.addEventListener('mouseleave', scheduleDockHide);
  }

  // Reveal dock when mouse is ≤ 56px from the bottom edge
  document.addEventListener('mousemove', (e) => {
    if (window.innerHeight - e.clientY <= 56) {
      showDock();
    }
  });

  // Wire dock item clicks
  document.querySelectorAll('.dock-item').forEach((item) => {
    const btn = item.querySelector('.dock-icon-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (item.dataset.app) window.openApp(item.dataset.app);
    });
  });

  /* ══════════════════════════════════════════════════════════
     5. TOP-BAR INTERACTIONS
     ══════════════════════════════════════════════════════════ */

  // Activities button — delegates to Overview.toggle() (wired in overview.js)
  const activitiesBtn = document.getElementById('activities-btn');
  if (activitiesBtn) {
    activitiesBtn.addEventListener('click', () => {
      if (window.Overview) window.Overview.toggle();
    });
  }

  // Power button — toggle quick-settings panel stub
  const powerBtn  = document.getElementById('power-btn');
  const qsPanel   = document.getElementById('quick-settings-panel');

  if (powerBtn && qsPanel) {
    powerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      qsPanel.classList.toggle('open');
      powerBtn.setAttribute('aria-expanded', qsPanel.classList.contains('open'));
    });

    // Close when clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!qsPanel.contains(e.target) && e.target !== powerBtn) {
        qsPanel.classList.remove('open');
        powerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

})();
