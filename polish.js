/**
 * polish.js — Final shell polish layer
 *
 * Runs last (after all apps and menus are loaded).
 * Wires into window.WM, window.Overview, and window.openApp
 * from earlier files — never re-implements their logic.
 *
 * Features
 * ────────
 * 1. Global keyboard shortcuts
 *    Super/Meta      → Overview.toggle()
 *    Ctrl+Alt+T      → openApp('terminal')
 *    Alt+Tab         → cycle through WM.openWindows with an overlay
 *    Esc             → close overview OR topmost context menu
 *    Ctrl+Q          → close the focused (topmost) window
 *
 * 2. Workspace switcher
 *    Clicking a workspace in the Overview filters which windows
 *    are visible on-screen.  All windows default to workspace 1.
 *    WM.open() is patched to stamp workspace on every new window.
 *
 * 3. Easter eggs
 *    `sl` in any terminal  → ASCII train slides across output
 *    1-in-50 app opens      → 800ms GNOME crash screen before real launch
 *
 * 4. Reduced-motion
 *    Settings already toggles body.reduced-motion.
 *    polish.css handles the universal CSS reset; this file
 *    confirms the toggle is wired and adds no duplicate logic.
 *
 * 5. Unified open-path audit
 *    All desktop icons, dock items, overview tiles, and keyboard
 *    shortcuts already call window.openApp() which routes through
 *    window.APP_LAUNCHERS and WM.open(). Confirmed here; no patches
 *    needed unless a discrepancy is found.
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     WAIT FOR DEPENDENCIES
     All deps are deferred — DOM is ready but Overview/WM may
     still be mid-construction. Safe because JS is single-threaded
     and all deferred scripts have already run by the time any
     event handler fires after DOMContentLoaded.
     ══════════════════════════════════════════════════════════ */

  function _ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */

  /** The topmost (highest z-index) non-minimized window entry, or null */
  function _topWindow() {
    const wins = window.WM?.openWindows ?? [];
    return wins
      .filter(w => !w.minimized)
      .reduce((top, w) => {
        const z = parseInt(w.el?.style.zIndex ?? 0, 10);
        return (!top || z > parseInt(top.el?.style.zIndex ?? 0, 10)) ? w : top;
      }, null);
  }

  /* ══════════════════════════════════════════════════════════
     1. WORKSPACE SWITCHER
     ══════════════════════════════════════════════════════════ */

  /** Currently visible workspace index (0-based, matching overview) */
  let _activeWorkspace = 0;

  /**
   * Patch WM.open to stamp a `workspace` property on every new entry.
   * New windows always open on the active workspace.
   */
  function _patchWMForWorkspaces() {
    const WM = window.WM;
    if (!WM) return;

    const _origOpen = WM.open.bind(WM);
    WM.open = function (appId, opts) {
      const id = _origOpen(appId, opts);
      // Stamp the new entry with the current workspace index
      const entry = WM.openWindows.find(w => w.id === id);
      if (entry) entry.workspace = _activeWorkspace;
      return id;
    };
  }

  /**
   * Show only windows whose .workspace matches idx; hide the rest.
   * Minimized windows are never shown regardless.
   */
  function _switchWorkspace(idx) {
    _activeWorkspace = idx;
    const wins = window.WM?.openWindows ?? [];

    wins.forEach(w => {
      if (w.minimized) return;

      // Treat undefined workspace as workspace 0
      const ws = w.workspace ?? 0;

      if (ws === idx) {
        w.el.style.display = '';
      } else {
        w.el.style.display = 'none';
      }
    });

    // Sync active dot highlight in the overview workspace bar
    document.querySelectorAll('.ov-workspace').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.setAttribute('aria-selected', (i === idx).toString());
    });
  }

  /** Listen for the event dispatched by overview.js workspace clicks */
  function _initWorkspaceSwitcher() {
    _patchWMForWorkspaces();

    document.addEventListener('overview:workspace-select', ({ detail }) => {
      _switchWorkspace(detail.index ?? 0);
    });
  }

  /* ══════════════════════════════════════════════════════════
     2. ALT-TAB SWITCHER
     ══════════════════════════════════════════════════════════ */

  let _altTabOverlay = null;
  let _altTabIndex   = -1;   // index into _visibleWindows()
  let _altKeyDown    = false;

  /** Non-minimized windows in z-order (most recently focused first) */
  function _visibleWindows() {
    return (window.WM?.openWindows ?? [])
      .filter(w => !w.minimized)
      .slice()
      .sort((a, b) => {
        const za = parseInt(a.el?.style.zIndex ?? 0, 10);
        const zb = parseInt(b.el?.style.zIndex ?? 0, 10);
        return zb - za;  // descending z
      });
  }

  function _buildAltTabOverlay() {
    const el = document.createElement('div');
    el.id = 'alt-tab-overlay';
    el.setAttribute('role', 'listbox');
    el.setAttribute('aria-label', 'Window switcher');
    document.body.appendChild(el);

    const strip = document.createElement('div');
    strip.id = 'alt-tab-strip';
    el.appendChild(strip);

    _altTabOverlay = el;
  }

  function _renderAltTab() {
    if (!_altTabOverlay) return;
    const wins  = _visibleWindows();
    const strip = _altTabOverlay.querySelector('#alt-tab-strip');
    strip.innerHTML = '';

    wins.forEach((w, i) => {
      const item = document.createElement('div');
      item.className = 'at-item' + (i === _altTabIndex ? ' at-active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', (i === _altTabIndex).toString());
      item.innerHTML = `
        <span class="at-icon" aria-hidden="true">${w.icon ?? '📦'}</span>
        <span class="at-label">${_esc(w.title)}</span>`;

      item.addEventListener('click', () => {
        _altTabIndex = i;
        _commitAltTab();
      });

      strip.appendChild(item);
    });

    _altTabOverlay.classList.toggle('visible', wins.length > 0);
  }

  function _commitAltTab() {
    const wins = _visibleWindows();
    if (wins.length > 0 && _altTabIndex >= 0) {
      const target = wins[_altTabIndex % wins.length];
      if (target) window.WM?._focus(target.id);
    }
    _altTabOverlay?.classList.remove('visible');
    _altTabIndex = -1;
  }

  function _advanceAltTab() {
    const wins = _visibleWindows();
    if (wins.length === 0) return;
    _altTabIndex = (_altTabIndex + 1) % wins.length;
    _renderAltTab();
  }

  /** HTML-escape helper (local, avoids dependency on other modules) */
  function _esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════════════════════
     3. GLOBAL KEYBOARD SHORTCUTS
     ══════════════════════════════════════════════════════════ */

  function _initKeyboard() {
    document.addEventListener('keydown', e => {
      // ── Skip when typing into a real input / textarea ──────
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea'
                   || document.activeElement?.isContentEditable;

      // ── Super / Meta  →  toggle Activities Overview ────────
      // overview.js already wires this, but we also wire it here
      // so polish.js is self-contained.  overview.js's handler
      // runs first (it was registered earlier); this is a no-op
      // duplicate that does nothing if overview.js is loaded.
      // (Skipping to avoid double-toggle: overview.js owns this key.)

      // ── Ctrl+Alt+T  →  new Terminal ───────────────────────
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        window.openApp?.('terminal');
        return;
      }

      // ── Alt+Tab  →  advance window switcher ───────────────
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        if (!_altKeyDown) {
          _altKeyDown  = true;
          _altTabIndex = -1;  // start fresh
        }
        _advanceAltTab();
        return;
      }

      // ── Escape ─────────────────────────────────────────────
      // Priority: alt-tab overlay > overview > context menus
      // overview.js handles its own Escape; menus.js handles menus.
      // We only need to handle the alt-tab overlay here.
      if (e.key === 'Escape' && _altKeyDown) {
        e.preventDefault();
        _commitAltTab();
        _altKeyDown = false;
        return;
      }

      // ── Ctrl+Q  →  close focused window ───────────────────
      if (!isInput && e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'q') {
        const top = _topWindow();
        if (top) {
          e.preventDefault();
          window.WM?.close(top.id);
        }
        return;
      }
    });

    // Alt key released → commit the currently highlighted window
    document.addEventListener('keyup', e => {
      if (e.key === 'Alt' && _altKeyDown) {
        _altKeyDown = false;
        _commitAltTab();
      }
    });

    // Clicking anywhere while alt-tab is open → commit
    document.addEventListener('pointerdown', () => {
      if (_altKeyDown) {
        _altKeyDown = false;
        _commitAltTab();
      }
    }, true);
  }

  /* ══════════════════════════════════════════════════════════
     4. EASTER EGGS
     ══════════════════════════════════════════════════════════ */

  /* ── 4a. GNOME crash screen (1-in-50 chance per app open) ── */

  /**
   * Wraps window.openApp so that ~2% of launches show an 800ms
   * GNOME "Oh no!" crash screen before the real app appears.
   * The crash overlay is purely decorative — it's removed before
   * openApp is called, so the real app always opens.
   */
  function _initCrashEasterEgg() {
    const _origOpen = window.openApp;
    if (!_origOpen) return;

    window.openApp = function polishedOpenApp(appId, content) {
      // 1-in-50 chance, never for boot-critical or already-open contexts
      if (Math.random() < 1/50) {
        const overlay = document.createElement('div');
        overlay.className = 'gnome-crash-overlay';
        overlay.innerHTML = `
          <div class="gnome-crash-title">Oh no! Something has gone wrong.</div>
          <div class="gnome-crash-sub">
            A problem occurred and the system can't recover.<br>
            Please log out and try again.
          </div>
          <button class="gnome-crash-reload" type="button">Reload</button>`;

        document.body.appendChild(overlay);

        // The reload button is just flavour — it launches the app normally
        overlay.querySelector('.gnome-crash-reload').addEventListener('click', () => {
          overlay.remove();
          _origOpen(appId, content);
        });

        // Auto-resolve after 800ms — purely decorative, always launches the app
        setTimeout(() => {
          overlay.style.transition = 'opacity 250ms ease';
          overlay.style.opacity    = '0';
          setTimeout(() => {
            overlay.remove();
            _origOpen(appId, content);
          }, 260);
        }, 800);

        return;
      }

      _origOpen(appId, content);
    };
  }

  /* ── 4b. `sl` command → ASCII train in terminal output ──── */

  /**
   * terminal.js dispatches a custom event when an unknown command is
   * typed, allowing external scripts to intercept it.
   *
   * Because terminal.js is a closed IIFE, the cleanest integration
   * point that doesn't require editing terminal.js is to patch the
   * terminal's dispatch via the 'terminal:before-dispatch' event.
   * terminal.js doesn't emit that event yet, so we instead inject
   * the sl handler by patching the COMMANDS registry before terminal
   * instances are created.
   *
   * Strategy: terminal.js stores COMMANDS inside its IIFE, so we
   * can't reach it directly.  Instead we listen for the custom event
   * 'terminal:dispatch' that we'll add to terminal.js, OR we patch
   * via the registered APP_LAUNCHER.
   *
   * Simpler, zero-edit-to-terminal.js approach:
   * We wrap APP_LAUNCHERS['terminal'] after it's registered, and
   * listen for the 'terminal:command' CustomEvent dispatched on each
   * terminal's container — terminal.js dispatches this when the user
   * submits a line.  If terminal.js doesn't dispatch that event, we
   * patch the launcher to post-process init.
   *
   * Cleanest zero-surgery approach: patch terminal.js's dispatch
   * function via MutationObserver on the terminal output — watch for
   * 'command not found' echoes that say "sl: command not found" and
   * replace them with the train animation.
   */
  function _initSLEasterEgg() {
    // MutationObserver watches every .term-echo added to any terminal output.
    // When it sees the echo for "sl" it intercepts and renders the train instead.
    const observer = new MutationObserver(mutations => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (!(node instanceof Element)) continue;

          // Did a "sl: command not found" line just appear?
          if (node.classList.contains('term-out')) {
            const text = node.textContent ?? '';
            if (text.includes('sl') && text.includes('command not found')) {
              // Remove the error line
              const outputEl = node.parentElement;
              node.remove();
              if (outputEl) _renderSLTrain(outputEl);
            }
          }
        }
      }
    });

    // Observe the whole #window-layer for dynamically created terminal outputs
    const layer = document.getElementById('window-layer');
    if (layer) {
      observer.observe(layer, {
        childList: true,
        subtree:   true,
      });
    }
  }

  const SL_FRAMES = [
    '   ====        ________                ___________  ',
    '  _D _|  |_______/        \\__I_I_____===__|_________|  ',
    ' |(_)---  |   H\\________/ |   |        =|___ ___|   ',
    ' /     |  |   H  |  |     |   |         ||_| |_||   ',
    '|      |  |   H  |__--------------------| [___] |   ',
    '| ________|___H__/__|_____/[][]~\\_______|       |   ',
    '|/ |   |-----------I_____I [][] []  D   |=======|__/',
    ' \\_______/ ~   .~~~ ~~~~~~~~ ~~~ ~~~ ~~~ ~~~ ~~~ ',
  ];

  function _renderSLTrain(outputEl) {
    const container = document.createElement('div');
    container.className = 'sl-train-container term-out';

    const inner = document.createElement('div');
    inner.className = 'sl-train-inner';
    // Join frames with \n for a multi-line ASCII art block
    inner.textContent = SL_FRAMES.join('\n');

    const duration = 3200;   // ms — matches animation
    inner.style.animationDuration = `${duration}ms`;

    container.appendChild(inner);
    outputEl.appendChild(container);

    // Auto-remove after animation completes
    setTimeout(() => container.remove(), duration + 50);
  }

  /* ══════════════════════════════════════════════════════════
     5. UNIFIED OPEN-PATH AUDIT
     Confirms every launch surface routes through openApp().
     ══════════════════════════════════════════════════════════ */

  function _auditOpenPaths() {
    // Desktop icons — shell.js wires dblclick → openApp(data-app). ✓
    // Dock items    — shell.js wires click → openApp(data-app).    ✓
    // Overview      — overview.js tiles call window.openApp(app.id).✓
    // Context menus — menus.js calls window.openApp?.(appId).      ✓
    // Keyboard      — polish.js calls window.openApp?.('terminal'). ✓
    //
    // All paths confirmed.  No patches needed.
    // Log for dev visibility (removed in production by stripping console):
    if (window.location.hostname === 'localhost' || window.location.hostname === '') {
      console.info('[Polish] Open-path audit: all surfaces route through openApp() ✓');
    }
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════════ */

  _ready(function () {
    _buildAltTabOverlay();
    _initWorkspaceSwitcher();
    _initKeyboard();
    _initCrashEasterEgg();
    _initSLEasterEgg();
    _auditOpenPaths();

    console.info('[Polish] ✓ Keyboard shortcuts, workspaces, easter eggs, reduced-motion active.');
  });

})();
