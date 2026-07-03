/**
 * window-manager.js — GNOME-style CSD window manager
 *
 * Exposes `window.WM` globally before shell.js runs (load order
 * in index.html: window-manager.js defer → shell.js defer).
 *
 * ── Public API ───────────────────────────────────────────────
 *   WM.open(appId, { title, icon, width, height, content })
 *     → windowId  (number)  — creates, centres & focuses a window
 *
 *   WM.close(windowId)      — animates out then removes from DOM
 *   WM.minimize(windowId)   — hides window (stays in openWindows)
 *   WM.maximize(windowId)   — toggle maximise/restore
 *
 *   WM.openWindows           — live array of window descriptors
 *     Each entry: { id, appId, title, icon, minimized, maximized }
 *
 * ── Events (dispatched on document) ─────────────────────────
 *   'wm:update'  detail: { openWindows }
 *     Fired on every open / close / minimize / maximize so the
 *     taskbar (built in a later prompt) can stay in sync.
 */

(function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────────── */
  const MIN_W        = 320;
  const MIN_H        = 240;
  const TITLEBAR_H   = 36;   // matches .wm-titlebar height in CSS
  const CASCADE_STEP = 24;   // px offset per stacked window

  /* ── SVG icons for the three control buttons ────────────────── */
  const ICON = {
    minimize: `<svg width="10" height="2" viewBox="0 0 10 2" fill="none"
                    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                 <line x1="1" y1="1" x2="9" y2="1"
                       stroke="currentColor" stroke-width="1.8"
                       stroke-linecap="round"/>
               </svg>`,

    maximize: `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                 <rect x="1" y="1" width="8" height="8" rx="1.5"
                       stroke="currentColor" stroke-width="1.6" fill="none"/>
               </svg>`,

    restore:  `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                 <rect x="4" y="1" width="7" height="7" rx="1.5"
                       stroke="currentColor" stroke-width="1.5" fill="none"/>
                 <rect x="1" y="4" width="7" height="7" rx="1.5"
                       stroke="currentColor" stroke-width="1.5"
                       fill="var(--ctp-mantle)"/>
               </svg>`,

    close:    `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                 <line x1="1" y1="1" x2="9" y2="9"
                       stroke="currentColor" stroke-width="1.8"
                       stroke-linecap="round"/>
                 <line x1="9" y1="1" x2="1" y2="9"
                       stroke="currentColor" stroke-width="1.8"
                       stroke-linecap="round"/>
               </svg>`,
  };

  /* ── Helpers ───────────────────────────────────────────────── */

  /** Get the #window-layer element (must be called after DOMContentLoaded) */
  function layer() {
    return document.getElementById('window-layer');
  }

  /** Build the "coming soon" placeholder HTML for unimplemented apps */
  function placeholderHTML(icon, title) {
    return `<div class="wm-placeholder">
              <div class="wm-placeholder-icon">${icon}</div>
              <h2 class="wm-placeholder-title">${title}</h2>
              <p class="wm-placeholder-sub">
                This application is still being crafted.<br>
                It will appear here in a future update.
              </p>
              <span class="wm-placeholder-badge">⚡ Coming soon</span>
            </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     THE WINDOW MANAGER
     ══════════════════════════════════════════════════════════════ */

  const WM = {

    /**
     * Canonical list of open (including minimized) windows.
     * Shape: { id, appId, title, icon, el, minimized, maximized, _prevRect }
     * @type {Array<Object>}
     */
    openWindows: [],

    _nextId: 1,     // auto-incrementing window ID
    _zTop:   1,     // current highest z-index within #window-layer


    /* ── open ──────────────────────────────────────────────────
       Create, position and focus a new window.
       Returns the numeric windowId.
       ──────────────────────────────────────────────────────── */
    open(appId, opts = {}) {
      const {
        title   = appId,
        icon    = '📦',
        width   = 600,
        height  = 460,
        content,               // caller can pass custom HTML; else placeholder
      } = opts;

      const body = content || placeholderHTML(icon, title);
      const id   = WM._nextId++;
      const lyr  = layer();

      if (!lyr) {
        console.error('[WM] #window-layer not in DOM — cannot open window.');
        return null;
      }

      /* ── Cascade position ─────────────────────────────────── */
      const visible    = WM.openWindows.filter(w => !w.minimized).length;
      const layerW     = lyr.offsetWidth  || window.innerWidth;
      const layerH     = lyr.offsetHeight || (window.innerHeight - TITLEBAR_H);
      const cascade    = visible * CASCADE_STEP;

      const baseLeft   = Math.max(0, (layerW - width)  / 2 + cascade);
      const baseTop    = Math.max(0, (layerH - height) / 2 + cascade);

      // Ensure at least some of the window stays on-screen
      const left = Math.min(baseLeft, layerW - 200);
      const top  = Math.min(baseTop,  layerH - 60);

      /* ── Build element ────────────────────────────────────── */
      const winEl = WM._createElement(id, { title, icon, width, height, body, left, top });
      lyr.appendChild(winEl);

      /* ── Register ─────────────────────────────────────────── */
      const entry = {
        id, appId, title, icon,
        el: winEl,
        minimized:  false,
        maximized:  false,
        _prevRect:  null,
      };
      WM.openWindows.push(entry);

      /* ── Wire up ──────────────────────────────────────────── */
      WM._wireButtons(id, winEl);
      WM._makeDraggable(id, winEl);
      WM._makeResizable(id, winEl);

      // Any click inside the window brings it to front
      winEl.addEventListener('pointerdown', () => WM._focus(id), { capture: true });

      WM._focus(id);
      WM._notify();
      return id;
    },


    /* ── close ─────────────────────────────────────────────────
       Animate out, remove from DOM, deregister.
       ──────────────────────────────────────────────────────── */
    close(windowId) {
      const entry = WM._find(windowId);
      if (!entry) return;

      // Play close animation then remove element
      const winEl = entry.el;
      winEl.classList.add('closing');
      winEl.addEventListener('animationend', () => winEl.remove(), { once: true });

      WM.openWindows = WM.openWindows.filter(w => w.id !== windowId);

      // Focus whatever is on top next
      const next = [...WM.openWindows].reverse().find(w => !w.minimized);
      if (next) WM._focus(next.id);

      WM._notify();
    },


    /* ── minimize ──────────────────────────────────────────────
       Hide window; it stays in openWindows until closed.
       ──────────────────────────────────────────────────────── */
    minimize(windowId) {
      const entry = WM._find(windowId);
      if (!entry || entry.minimized) return;

      entry.minimized = true;
      entry.el.style.display = 'none';
      entry.el.classList.remove('active');

      // Focus the next visible window
      const next = [...WM.openWindows].reverse().find(w => !w.minimized && w.id !== windowId);
      if (next) WM._focus(next.id);

      WM._notify();
    },


    /* ── maximize ──────────────────────────────────────────────
       Toggle between maximized (fills layer) and restored.
       ──────────────────────────────────────────────────────── */
    maximize(windowId) {
      const entry = WM._find(windowId);
      if (!entry) return;

      const winEl  = entry.el;
      const maxBtn = winEl.querySelector('.wm-btn-maximize');

      if (entry.maximized) {
        /* ── Restore ── */
        const r = entry._prevRect;
        if (r) {
          winEl.style.left   = `${r.left}px`;
          winEl.style.top    = `${r.top}px`;
          winEl.style.width  = `${r.width}px`;
          winEl.style.height = `${r.height}px`;
        }
        winEl.classList.remove('maximized');
        entry.maximized = false;

        if (maxBtn) {
          maxBtn.innerHTML = ICON.maximize;
          maxBtn.setAttribute('aria-label', 'Maximize');
          maxBtn.setAttribute('title', 'Maximize');
        }
      } else {
        /* ── Maximize ── */
        // Save current geometry so we can restore it later
        entry._prevRect = {
          left:   winEl.offsetLeft,
          top:    winEl.offsetTop,
          width:  winEl.offsetWidth,
          height: winEl.offsetHeight,
        };
        winEl.style.left   = '0';
        winEl.style.top    = '0';
        winEl.style.width  = '100%';
        winEl.style.height = '100%';
        winEl.classList.add('maximized');
        entry.maximized = true;

        if (maxBtn) {
          maxBtn.innerHTML = ICON.restore;
          maxBtn.setAttribute('aria-label', 'Restore');
          maxBtn.setAttribute('title', 'Restore');
        }
      }

      WM._focus(windowId);
      WM._notify();
    },


    /* ── _focus ────────────────────────────────────────────────
       Raise a window to the top of the z-stack and mark active.
       ──────────────────────────────────────────────────────── */
    _focus(windowId) {
      // Strip active class from every window
      WM.openWindows.forEach(w => w.el.classList.remove('active'));

      const entry = WM._find(windowId);
      if (!entry) return;

      // Unhide if it was minimized via a taskbar click (future use)
      if (entry.minimized) {
        entry.minimized = true; // taskbar "restore" will set this false
        return;
      }

      WM._zTop++;
      entry.el.style.zIndex = WM._zTop;
      entry.el.classList.add('active');
    },


    /* ── _find ─────────────────────────────────────────────────
       Look up an entry by numeric id.
       ──────────────────────────────────────────────────────── */
    _find(windowId) {
      return WM.openWindows.find(w => w.id === windowId) || null;
    },


    /* ── _notify ───────────────────────────────────────────────
       Broadcast a 'wm:update' event so other modules (taskbar,
       dock indicators, etc.) can react without tight coupling.
       ──────────────────────────────────────────────────────── */
    _notify() {
      document.dispatchEvent(new CustomEvent('wm:update', {
        detail: {
          openWindows: WM.openWindows.map(({ id, appId, title, icon, minimized, maximized }) =>
            ({ id, appId, title, icon, minimized, maximized })),
        },
      }));
    },


    /* ── _createElement ────────────────────────────────────────
       Build the full window DOM node.
       ──────────────────────────────────────────────────────── */
    _createElement(id, { title, icon, width, height, body, left, top }) {
      const winEl = document.createElement('div');
      winEl.className = 'wm-window';
      winEl.id        = `wm-win-${id}`;
      winEl.setAttribute('data-window-id', id);
      winEl.setAttribute('role', 'dialog');
      winEl.setAttribute('aria-label', title);
      winEl.setAttribute('aria-modal', 'false');
      winEl.style.cssText =
        `left:${left}px; top:${top}px; width:${width}px; height:${height}px;`;

      winEl.innerHTML = `
        <!-- ── Resize handles (8 directions) ──────────────── -->
        <div class="wm-resize wm-resize-n"  data-dir="n"></div>
        <div class="wm-resize wm-resize-ne" data-dir="ne"></div>
        <div class="wm-resize wm-resize-e"  data-dir="e"></div>
        <div class="wm-resize wm-resize-se" data-dir="se"></div>
        <div class="wm-resize wm-resize-s"  data-dir="s"></div>
        <div class="wm-resize wm-resize-sw" data-dir="sw"></div>
        <div class="wm-resize wm-resize-w"  data-dir="w"></div>
        <div class="wm-resize wm-resize-nw" data-dir="nw"></div>

        <!-- ── Titlebar ───────────────────────────────────── -->
        <div class="wm-titlebar" role="heading" aria-level="2">
          <div class="wm-title-left">
            <span class="wm-app-icon" aria-hidden="true">${icon}</span>
            <span class="wm-title-text">${_esc(title)}</span>
          </div>
          <div class="wm-controls" role="toolbar" aria-label="Window controls">
            <button class="wm-btn wm-btn-minimize"
                    type="button" aria-label="Minimize" title="Minimize">
              ${ICON.minimize}
            </button>
            <button class="wm-btn wm-btn-maximize"
                    type="button" aria-label="Maximize" title="Maximize">
              ${ICON.maximize}
            </button>
            <button class="wm-btn wm-btn-close"
                    type="button" aria-label="Close" title="Close">
              ${ICON.close}
            </button>
          </div>
        </div>

        <!-- ── Content body ───────────────────────────────── -->
        <div class="wm-body">${body}</div>
      `;

      return winEl;
    },


    /* ── _wireButtons ──────────────────────────────────────────
       Attach click handlers to the three CSD buttons and the
       titlebar double-click shortcut.
       ──────────────────────────────────────────────────────── */
    _wireButtons(id, winEl) {
      winEl.querySelector('.wm-btn-minimize')
           .addEventListener('click', e => { e.stopPropagation(); WM.minimize(id); });

      winEl.querySelector('.wm-btn-maximize')
           .addEventListener('click', e => { e.stopPropagation(); WM.maximize(id); });

      winEl.querySelector('.wm-btn-close')
           .addEventListener('click', e => { e.stopPropagation(); WM.close(id); });

      // Double-click titlebar = maximize / restore
      winEl.querySelector('.wm-titlebar')
           .addEventListener('dblclick', e => {
             if (e.target.closest('.wm-controls')) return;
             WM.maximize(id);
           });
    },


    /* ── _makeDraggable ────────────────────────────────────────
       Titlebar drag → repositions window, clamped so the
       titlebar never goes above the layer top or fully off-screen.
       Uses Pointer Capture so the drag survives cursor excursions.
       ──────────────────────────────────────────────────────── */
    _makeDraggable(id, winEl) {
      const titlebar = winEl.querySelector('.wm-titlebar');
      let dragging   = false;
      let offX = 0, offY = 0;

      titlebar.addEventListener('pointerdown', e => {
        if (e.button !== 0)                  return;
        if (e.target.closest('.wm-controls')) return;

        const entry = WM._find(id);
        if (entry && entry.maximized)         return;

        e.preventDefault();
        dragging = true;
        offX = e.clientX - winEl.offsetLeft;
        offY = e.clientY - winEl.offsetTop;

        titlebar.setPointerCapture(e.pointerId);
        // Suppress CSS transitions during drag for smoothness
        winEl.style.transition = 'none';
      });

      titlebar.addEventListener('pointermove', e => {
        if (!dragging) return;

        const lyr   = layer();
        const layerW = lyr ? lyr.offsetWidth  : window.innerWidth;
        const layerH = lyr ? lyr.offsetHeight : window.innerHeight - TITLEBAR_H;

        let newLeft = e.clientX - offX;
        let newTop  = e.clientY - offY;

        // ── Clamp ─────────────────────────────────────────────
        // Can't drag above the layer top (= top-bar)
        newTop  = Math.max(0, newTop);
        // At least 100 px of titlebar must stay inside each side
        newLeft = Math.max(100 - winEl.offsetWidth, newLeft);
        newLeft = Math.min(layerW - 100, newLeft);
        // Can't drag below so only close button is gone
        newTop  = Math.min(layerH - TITLEBAR_H, newTop);

        winEl.style.left = `${newLeft}px`;
        winEl.style.top  = `${newTop}px`;
      });

      const stopDrag = () => {
        dragging = false;
        winEl.style.transition = '';
      };
      titlebar.addEventListener('pointerup',     stopDrag);
      titlebar.addEventListener('pointercancel', stopDrag);
    },


    /* ── _makeResizable ────────────────────────────────────────
       Attaches pointer-capture resize logic to all 8 handles.
       Direction strings ('n', 'ne', 'e', …) drive the math:
         includes 'e' → grow/shrink right edge
         includes 's' → grow/shrink bottom edge
         includes 'w' → move left edge (adjusts left + width)
         includes 'n' → move top  edge (adjusts top  + height)
       ──────────────────────────────────────────────────────── */
    _makeResizable(id, winEl) {
      winEl.querySelectorAll('.wm-resize').forEach(handle => {
        const dir = handle.dataset.dir;

        handle.addEventListener('pointerdown', e => {
          const entry = WM._find(id);
          if (entry && entry.maximized) return;

          e.preventDefault();
          e.stopPropagation();
          WM._focus(id);

          handle.setPointerCapture(e.pointerId);
          winEl.style.transition = 'none';

          const startX = e.clientX;
          const startY = e.clientY;
          const orig   = {
            left:   winEl.offsetLeft,
            top:    winEl.offsetTop,
            width:  winEl.offsetWidth,
            height: winEl.offsetHeight,
          };

          function onMove(ev) {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            let { left, top, width, height } = orig;

            if (dir.includes('e')) {
              width  = Math.max(MIN_W, width + dx);
            }
            if (dir.includes('s')) {
              height = Math.max(MIN_H, height + dy);
            }
            if (dir.includes('w')) {
              const nw = Math.max(MIN_W, width - dx);
              left     = left + (width - nw);
              width    = nw;
            }
            if (dir.includes('n')) {
              const nh = Math.max(MIN_H, height - dy);
              top      = Math.max(0, top + (height - nh));
              height   = nh;
            }

            winEl.style.left   = `${left}px`;
            winEl.style.top    = `${top}px`;
            winEl.style.width  = `${width}px`;
            winEl.style.height = `${height}px`;
          }

          function onUp() {
            winEl.style.transition = '';
            handle.removeEventListener('pointermove',   onMove);
            handle.removeEventListener('pointerup',     onUp);
            handle.removeEventListener('pointercancel', onUp);
          }

          handle.addEventListener('pointermove',   onMove);
          handle.addEventListener('pointerup',     onUp);
          handle.addEventListener('pointercancel', onUp);
        });
      });
    },

  }; // end WM


  /* ── Tiny HTML escape helper ───────────────────────────────── */
  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Expose globally ───────────────────────────────────────── */
  window.WM = WM;

})();
