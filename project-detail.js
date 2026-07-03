/**
 * project-detail.js — Project Detail Window
 *
 * Registers window.APP_LAUNCHERS['project-detail'] so both
 * Files (double-click) and Terminal (`open <name>`) open it.
 *
 * Caller passes:  { projectId, project? }
 *   projectId — used to look up the freshest data from localStorage
 *   project   — optional fallback if localStorage lookup misses
 *
 * LocalStorage key: 'portfolio_projects'  (same schema as terminal.js)
 */

(function () {
  'use strict';

  const LS_KEY = 'portfolio_projects';
  let _counter = 0;

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */

  function _esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _getProjects() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) return p;
      }
    } catch (_) {}
    return [];
  }

  function _fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
    } catch (_) { return iso.slice(0, 10); }
  }

  /** Ensure a URL has a scheme so window.open works correctly */
  function _url(raw) {
    if (!raw || !raw.trim()) return '';
    const s = raw.trim();
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  }

  /* ══════════════════════════════════════════════════════════
     SVG ASSETS
     ══════════════════════════════════════════════════════════ */

  // Code-bracket icon for the placeholder panel
  const CODE_ICON = `
    <svg width="54" height="54" viewBox="0 0 54 54" fill="none"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 13L7 27L21 41" stroke="#585b70" stroke-width="4"
            stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M33 13L47 27L33 41" stroke="#585b70" stroke-width="4"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  const GITHUB_ICON = `
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"
         xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 .5C3.86.5.5 3.86.5 8a7.5 7.5 0 005.14 7.13c.37.07.5-.16.5-.36v-1.26
               c-2.08.45-2.52-.99-2.52-.99-.34-.87-.83-1.1-.83-1.1-.68-.46.05-.45.05-.45
               .75.05 1.15.77 1.15.77.67 1.14 1.75.81 2.18.62.07-.48.26-.81.47-.99
               -1.66-.19-3.41-.83-3.41-3.7 0-.82.29-1.49.77-2.01-.08-.19-.34-.95.07-1.99
               0 0 .63-.2 2.06.77a7.17 7.17 0 013.74 0c1.43-.97 2.06-.77 2.06-.77
               .41 1.04.15 1.8.07 1.99.48.52.77 1.19.77 2.01 0 2.88-1.75 3.51-3.42 3.7
               .27.23.51.69.51 1.39v2.06c0 .2.13.44.51.37A7.5 7.5 0 0015.5 8
               C15.5 3.86 12.14.5 8 .5Z"/>
    </svg>`;

  const EXTERNAL_ICON = `
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
         stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
         stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7"/>
      <path d="M8 1h3v3M11 1L6 6"/>
    </svg>`;

  /* ══════════════════════════════════════════════════════════
     HTML RENDERERS
     ══════════════════════════════════════════════════════════ */

  function _renderFound(iid, project) {
    const { title = '', description = '', tech = [], github = '',
            live = '', image = '', dateAdded = '' } = project;

    const githubUrl = _url(github);
    const liveUrl   = _url(live);
    const dateStr   = _fmtDate(dateAdded);

    // Hero: image or placeholder
    const heroHTML = image
      ? `<img class="pd-image"
              src="${_esc(image)}"
              alt="${_esc(title)} screenshot"
              id="${iid}-img" />`
      : `<div class="pd-placeholder" aria-hidden="true">${CODE_ICON}</div>`;

    // Tech badges
    const techHTML = Array.isArray(tech) && tech.length
      ? `<div class="pd-section">
           <div class="pd-section-label">Tech Stack</div>
           <div class="pd-tech-row">
             ${tech.map(t => `<span class="pd-tech-badge">${_esc(t)}</span>`).join('')}
           </div>
         </div>`
      : '';

    // Action buttons (hidden when URL is blank)
    const actionsHTML = (githubUrl || liveUrl)
      ? `<div class="pd-actions">
           ${githubUrl
             ? `<button class="pd-action-btn pd-btn-outline"
                        data-href="${_esc(githubUrl)}"
                        aria-label="Open project on GitHub in a new tab">
                  ${GITHUB_ICON} View on GitHub
                </button>`
             : ''}
           ${liveUrl
             ? `<button class="pd-action-btn pd-btn-filled"
                        data-href="${_esc(liveUrl)}"
                        aria-label="Open live project in a new tab">
                  ${EXTERNAL_ICON} View live
                </button>`
             : ''}
         </div>`
      : '';

    return `
      <div class="pd-root" id="${iid}" data-project-id="${_esc(project.id || '')}">

        <div class="pd-header">
          <h1 class="pd-title">${_esc(title)}</h1>
          ${dateStr
            ? `<span class="pd-date">Added ${_esc(dateStr)}</span>`
            : ''}
        </div>

        ${heroHTML}

        ${description
          ? `<p class="pd-description">${_esc(description)}</p>`
          : ''}

        ${techHTML}
        ${actionsHTML}

      </div>`;
  }

  function _renderNotFound(iid) {
    return `
      <div class="pd-not-found" id="${iid}" role="alert">
        <div class="pd-nf-icon" aria-hidden="true">🔍</div>
        <h2 class="pd-nf-title">This project isn't here anymore</h2>
        <p class="pd-nf-msg">
          It may have been deleted or its ID has changed.
          Open the Files app or Terminal to browse available projects.
        </p>
        <button class="pd-nf-close" id="${iid}-close">
          Close window
        </button>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════
     INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createInstance(project) {
    const iid = `pd-${++_counter}`;

    const html = project ? _renderFound(iid, project) : _renderNotFound(iid);

    function init(windowId) {
      const rootEl = document.getElementById(iid);
      if (!rootEl) {
        console.error('[ProjectDetail] Root element not found:', iid);
        return;
      }

      // ── Close button (not-found state) ──────────────────────
      document.getElementById(`${iid}-close`)?.addEventListener('click', () => {
        if (window.WM) window.WM.close(windowId);
      });

      // ── Action buttons → open URL in new tab ────────────────
      rootEl.querySelectorAll('.pd-action-btn[data-href]').forEach(btn => {
        btn.addEventListener('click', () => {
          const href = btn.dataset.href;
          if (href) window.open(href, '_blank', 'noopener,noreferrer');
        });
      });

      // ── Image error → replace with placeholder ──────────────
      const imgEl = document.getElementById(`${iid}-img`);
      if (imgEl) {
        imgEl.addEventListener('error', () => {
          const ph = document.createElement('div');
          ph.className = 'pd-placeholder';
          ph.setAttribute('aria-hidden', 'true');
          ph.innerHTML = CODE_ICON;
          imgEl.replaceWith(ph);
        });
      }
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     REGISTER LAUNCHER
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  window.APP_LAUNCHERS['project-detail'] = function openProjectDetail(data) {
    if (!window.WM) {
      console.error('[ProjectDetail] WM not loaded.');
      return;
    }

    const { projectId, project: passedProject } = data || {};

    // Always prefer a fresh localStorage read over the passed snapshot
    let project = null;
    if (projectId) {
      project = _getProjects().find(p => p.id === projectId) || null;
    }
    // Fall back to the passed object (may be a snapshot, but better than nothing)
    if (!project && passedProject) project = passedProject;

    const instance = createInstance(project);

    const winId = window.WM.open('project-detail', {
      title:   project?.title || 'Project Detail',
      icon:    '📁',
      width:   560,
      height:  520,
      content: instance.html,
    });

    if (winId !== null) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  };

})();
