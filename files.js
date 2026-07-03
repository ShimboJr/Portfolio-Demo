/**
 * files.js — Nautilus-style Files App
 *
 * Registers window.APP_LAUNCHERS['files'] so openApp('files') opens
 * a fully functional file manager window.
 *
 * ── LocalStorage key ─────────────────────────────────────────
 *   'portfolio_projects'  (same schema as terminal.js)
 *
 * ── Features ─────────────────────────────────────────────────
 *   · Sidebar navigation: Home / Projects / Recent / Trash
 *   · Grid & list view (toggle)
 *   · Live search filter
 *   · Single-click select, double-click open
 *   · Right-click context menu: Open / Copy GitHub / Delete
 *   · Delete with inline confirmation (no browser dialogs)
 *   · Re-renders on window focus via MutationObserver
 *   · Empty state when no projects exist
 */

(function () {
  'use strict';

  const LS_KEY = 'portfolio_projects';
  let _counter = 0;

  /* ══════════════════════════════════════════════════════════
     SHARED SVG ASSETS
     ══════════════════════════════════════════════════════════ */

  const FOLDER_LG = `<svg class="files-folder-svg" viewBox="0 0 56 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0 9C0 6.8 1.8 5 4 5H21L27 12H52C54.2 12 56 13.8 56 16V38
             C56 40.2 54.2 42 52 42H4C1.8 42 0 40.2 0 38V9Z"
          fill="#74c7ec" opacity="0.45"/>
    <path d="M0 17H56V38C56 40.2 54.2 42 52 42H4C1.8 42 0 40.2 0 38V17Z"
          fill="#89b4fa"/>
    <path d="M0 17H56V21H0Z" fill="rgba(255,255,255,0.06)"/>
  </svg>`;

  const FOLDER_SM = `<svg class="files-folder-svg-sm" viewBox="0 0 56 44" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0 9C0 6.8 1.8 5 4 5H21L27 12H52C54.2 12 56 13.8 56 16V38
             C56 40.2 54.2 42 52 42H4C1.8 42 0 40.2 0 38V9Z"
          fill="#74c7ec" opacity="0.45"/>
    <path d="M0 17H56V38C56 40.2 54.2 42 52 42H4C1.8 42 0 40.2 0 38V17Z"
          fill="#89b4fa"/>
  </svg>`;

  const ICON_GRID = `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="1" width="5.5" height="5.5" rx="1"/>
    <rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/>
    <rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/>
    <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/>
  </svg>`;

  const ICON_LIST = `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1" y="2"   width="13" height="2.2" rx="1"/>
    <rect x="1" y="6.4" width="13" height="2.2" rx="1"/>
    <rect x="1" y="10.8" width="13" height="2.2" rx="1"/>
  </svg>`;

  const ICON_HOME = `<svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"
      xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 1.5L1 7H3V13.5H6.5V9.5H8.5V13.5H12V7H14L7.5 1.5Z"/>
  </svg>`;

  const ICON_FOLDER = `<svg width="15" height="15" viewBox="0 0 56 44" fill="currentColor"
      xmlns="http://www.w3.org/2000/svg">
    <path d="M0 9C0 6.8 1.8 5 4 5H21L27 12H52C54.2 12 56 13.8 56 16V38
             C56 40.2 54.2 42 52 42H4C1.8 42 0 40.2 0 38V9Z" opacity="0.55"/>
    <path d="M0 17H56V38C56 40.2 54.2 42 52 42H4C1.8 42 0 40.2 0 38V17Z"/>
  </svg>`;

  const ICON_CLOCK = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="7.5" r="6.2" stroke="currentColor" stroke-width="1.4"/>
    <path d="M7.5 4V7.5L10 9.5" stroke="currentColor" stroke-width="1.4"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const ICON_TRASH = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.5H12.5M5 4.5V3.5C5 3.2 5.2 3 5.5 3H9.5C9.8 3 10 3.2 10 3.5V4.5
             M5.5 7V11M9.5 7V11M3.5 4.5L4.5 12.5H10.5L11.5 4.5"
          stroke="currentColor" stroke-width="1.3" stroke-linecap="round"
          stroke-linejoin="round"/>
  </svg>`;

  const ICON_GITHUB = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
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

  /* ══════════════════════════════════════════════════════════
     SIDEBAR LOCATION DEFINITIONS
     ══════════════════════════════════════════════════════════ */

  const LOCATIONS = [
    { id: 'home',     label: 'Home',     icon: ICON_HOME   },
    { id: 'projects', label: 'Projects', icon: ICON_FOLDER },
    { id: 'recent',   label: 'Recent',   icon: ICON_CLOCK  },
    { id: 'trash',    label: 'Trash',    icon: ICON_TRASH  },
  ];

  /* ══════════════════════════════════════════════════════════
     GLOBAL CONTEXT MENU  (one instance shared across all files
     windows — destroyed/recreated cleanly on each show)
     ══════════════════════════════════════════════════════════ */

  let _ctxEl       = null;  // the floating menu DOM node
  let _ctxProject  = null;  // project the menu is acting on
  let _ctxCallback = null;  // fn(action, project)

  function _ensureCtxMenu() {
    if (_ctxEl) return;

    _ctxEl = document.createElement('div');
    _ctxEl.className = 'files-ctx-menu';
    _ctxEl.id = 'files-global-ctx';
    document.body.appendChild(_ctxEl);

    // Close on any outside click (capture phase so it fires before the event bubbles)
    document.addEventListener('click', e => {
      if (_ctxEl && !_ctxEl.contains(e.target)) _hideCtx();
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') _hideCtx();
    });
  }

  function _showCtx(x, y, project, onAction) {
    _ensureCtxMenu();
    _ctxProject  = project;
    _ctxCallback = onAction;

    _ctxEl.innerHTML = _ctxNormalHTML(project);
    _ctxEl.style.cssText = `display:block; left:${x}px; top:${y}px;`;

    // Wire action buttons
    _ctxEl.querySelectorAll('[data-ctx-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.dataset.ctxAction;
        if (_ctxCallback) _ctxCallback(action, _ctxProject);
      });
    });

    // Clamp to viewport (after layout)
    requestAnimationFrame(() => {
      if (!_ctxEl) return;
      const r = _ctxEl.getBoundingClientRect();
      if (r.right  > window.innerWidth)  _ctxEl.style.left = `${x - r.width  - 4}px`;
      if (r.bottom > window.innerHeight) _ctxEl.style.top  = `${y - r.height - 4}px`;
    });
  }

  function _showCtxConfirm(project, onConfirm) {
    if (!_ctxEl) return;
    _ctxEl.innerHTML = `
      <div class="files-ctx-confirm">
        <div class="files-ctx-confirm-msg">
          Delete <strong>${_esc(project.title)}</strong>?
          <small>This cannot be undone.</small>
        </div>
        <div class="files-ctx-confirm-btns">
          <button class="files-ctx-btn" data-ctx-action="cancel">Cancel</button>
          <button class="files-ctx-btn danger" data-ctx-action="confirm-delete">Delete</button>
        </div>
      </div>`;

    _ctxEl.querySelector('[data-ctx-action="cancel"]')
      .addEventListener('click', e => { e.stopPropagation(); _hideCtx(); });

    _ctxEl.querySelector('[data-ctx-action="confirm-delete"]')
      .addEventListener('click', e => { e.stopPropagation(); onConfirm(); _hideCtx(); });
  }

  function _hideCtx() {
    if (_ctxEl) _ctxEl.style.display = 'none';
    _ctxProject  = null;
    _ctxCallback = null;
  }

  function _ctxNormalHTML(project) {
    const hasGH = project.github && project.github.trim();
    return `
      <button class="files-ctx-btn" data-ctx-action="open">
        ${ICON_FOLDER} Open
      </button>
      <button class="files-ctx-btn" data-ctx-action="github" ${hasGH ? '' : 'disabled'}>
        ${ICON_GITHUB} Copy GitHub Link
      </button>
      <div class="files-ctx-sep"></div>
      <button class="files-ctx-btn danger" data-ctx-action="delete">
        ${ICON_TRASH} Delete Project
      </button>`;
  }

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

  function _saveProjects(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (_) {}
  }

  function _fmtDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) { return iso.slice(0, 10); }
  }

  function _techStr(tech, max = 3) {
    if (!Array.isArray(tech) || !tech.length) return '—';
    const shown = tech.slice(0, max).join(', ');
    return tech.length > max ? `${shown} +${tech.length - max}` : shown;
  }

  /* ══════════════════════════════════════════════════════════
     INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createFilesInstance() {
    const iid = `files-${++_counter}`;

    // ── Per-instance mutable state ─────────────────────────
    let loc       = 'projects';  // active sidebar location
    let view      = 'grid';      // 'grid' | 'list'
    let query     = '';          // current search filter
    let selectedId = null;       // highlighted project id

    // DOM refs — set in init()
    let rootEl, areaEl, statusEl, searchEl, bcEl;

    /* ── HTML template ─────────────────────────────────────── */

    const html = `
      <div class="files-root" id="${iid}">

        <!-- Toolbar -->
        <div class="files-toolbar">

          <div class="files-breadcrumb" id="${iid}-bc">
            <span class="files-bc-item" data-bc="home">Home</span>
            <span class="files-bc-sep">›</span>
            <span class="files-bc-item files-bc-cur" data-bc="projects">Projects</span>
          </div>

          <div class="files-toolbar-right">
            <div class="files-search-wrap">
              <svg class="files-search-icon" width="14" height="14" viewBox="0 0 14 14"
                   fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="5.8" cy="5.8" r="4.4" stroke="currentColor" stroke-width="1.4"/>
                <line x1="9.2" y1="9.2" x2="13" y2="13"
                      stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              <input class="files-search" id="${iid}-search" type="search"
                     placeholder="Search…" autocomplete="off" aria-label="Filter projects"/>
            </div>
            <div class="files-view-btns" role="group" aria-label="View mode">
              <button class="files-view-btn active" data-view="grid" title="Grid view"
                      aria-pressed="true">${ICON_GRID}</button>
              <button class="files-view-btn" data-view="list" title="List view"
                      aria-pressed="false">${ICON_LIST}</button>
            </div>
          </div>

        </div><!-- /.files-toolbar -->

        <!-- Content -->
        <div class="files-content">

          <!-- Sidebar -->
          <aside class="files-sidebar" role="navigation" aria-label="Locations">
            <div class="files-sidebar-label">Places</div>
            ${LOCATIONS.map(l => `
              <div class="files-loc-item ${l.id === 'projects' ? 'active' : ''}"
                   data-loc="${l.id}" role="button" tabindex="0" aria-current="${l.id === 'projects' ? 'page' : 'false'}">
                ${l.icon}
                <span>${l.label}</span>
              </div>`).join('')}
          </aside>

          <!-- Main -->
          <div class="files-main">
            <div class="files-grid-area" id="${iid}-area" role="listbox"
                 aria-label="Projects" aria-multiselectable="false"></div>
            <div class="files-statusbar" id="${iid}-status" aria-live="polite">0 items</div>
          </div>

        </div><!-- /.files-content -->

      </div><!-- /.files-root -->
    `;

    /* ── Rendering ─────────────────────────────────────────── */

    function render() {
      switch (loc) {
        case 'home':    renderHome();    break;
        case 'recent':  renderRecent();  break;
        case 'trash':   renderTrash();   break;
        default:        renderProjects();
      }
    }

    function renderProjects() {
      let projects = _getProjects();

      // Apply search filter
      const q = query.toLowerCase().trim();
      if (q) projects = projects.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (Array.isArray(p.tech) ? p.tech.join(' ').toLowerCase() : '').includes(q)
      );

      if (projects.length === 0) {
        renderEmpty(
          q ? 'No matches found' : 'No projects yet',
          q ? `No projects match "<strong>${_esc(q)}</strong>".`
            : 'Open the Terminal and type <code>add-project</code>'
        );
        setStatus(q ? '0 items (filtered)' : '0 items');
        return;
      }

      if (view === 'list') {
        renderListView(projects);
      } else {
        renderGridView(projects);
      }

      const sel = selectedId && projects.find(p => p.id === selectedId);
      setStatus(sel ? `"${sel.title}" selected` : `${projects.length} item${projects.length !== 1 ? 's' : ''}`);
    }

    function renderGridView(projects) {
      const grid = document.createElement('div');
      grid.className = 'files-grid';
      grid.setAttribute('role', 'presentation');

      projects.forEach(p => {
        const item = document.createElement('div');
        item.className = 'files-item' + (selectedId === p.id ? ' selected' : '');
        item.dataset.projectId = p.id;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', selectedId === p.id ? 'true' : 'false');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', p.title);
        item.innerHTML = `${FOLDER_LG}<div class="files-item-label">${_esc(p.title)}</div>`;
        grid.appendChild(item);
      });

      areaEl.innerHTML = '';
      areaEl.appendChild(grid);
    }

    function renderListView(projects) {
      const list = document.createElement('div');
      list.className = 'files-list';
      list.setAttribute('role', 'presentation');

      // Header row
      const hdr = document.createElement('div');
      hdr.className = 'files-list-header';
      hdr.innerHTML = '<span>Name</span><span>Technologies</span><span>Added</span>';
      list.appendChild(hdr);

      projects.forEach(p => {
        const row = document.createElement('div');
        row.className = 'files-list-row' + (selectedId === p.id ? ' selected' : '');
        row.dataset.projectId = p.id;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', selectedId === p.id ? 'true' : 'false');
        row.setAttribute('tabindex', '0');
        row.innerHTML = `
          <div class="files-list-name">
            ${FOLDER_SM}
            <span>${_esc(p.title)}</span>
          </div>
          <div class="files-list-tech">${_esc(_techStr(p.tech))}</div>
          <div class="files-list-date">${_fmtDate(p.dateAdded)}</div>
        `;
        list.appendChild(row);
      });

      areaEl.innerHTML = '';
      areaEl.appendChild(list);
    }

    function renderEmpty(title, sub) {
      areaEl.innerHTML = `
        <div class="files-empty">
          <div class="files-empty-icon">${FOLDER_LG}</div>
          <div class="files-empty-title">${_esc(title)}</div>
          <div class="files-empty-sub">${sub}</div>
        </div>`;
    }

    function renderHome() {
      const projects  = _getProjects();
      const allTech   = [...new Set(projects.flatMap(p => p.tech || []))];
      const latest    = [...projects].sort((a, b) =>
        new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0)
      ).slice(0, 3);

      areaEl.innerHTML = `
        <div class="files-home">
          <div class="files-home-title">📁 Portfolio File System</div>
          <div class="files-stat-row">
            <div class="files-stat-card">
              <div class="files-stat-value">${projects.length}</div>
              <div class="files-stat-label">Projects</div>
            </div>
            <div class="files-stat-card">
              <div class="files-stat-value">${allTech.length}</div>
              <div class="files-stat-label">Technologies</div>
            </div>
          </div>
          ${latest.length ? `
            <div>
              <div class="files-sidebar-label" style="padding-left:0;margin-bottom:8px;">
                Recently Added
              </div>
              <div class="files-grid" style="padding:0;max-width:420px">
                ${latest.map(p => `
                  <div class="files-item" data-project-id="${_esc(p.id)}" role="button" tabindex="0">
                    ${FOLDER_LG}
                    <div class="files-item-label">${_esc(p.title)}</div>
                  </div>`).join('')}
              </div>
            </div>` : ''}
          <div class="files-home-hint">
            Open the <strong>Terminal</strong> and type <code>add-project</code>
            to add projects here, or use the one-liner:<br>
            <code>add-project --title "My App" --tech "React,Node"</code>
          </div>
        </div>`;

      setStatus('Home');
    }

    function renderRecent() {
      const projects = _getProjects()
        .sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
        .slice(0, 10);

      if (!projects.length) {
        renderEmpty('No recent projects', 'Projects you add will appear here.');
        setStatus('0 items');
        return;
      }

      if (view === 'list') renderListView(projects);
      else                  renderGridView(projects);
      setStatus(`${projects.length} recent item${projects.length !== 1 ? 's' : ''}`);
    }

    function renderTrash() {
      areaEl.innerHTML = `
        <div class="files-empty">
          <div class="files-empty-icon">${FOLDER_LG}</div>
          <div class="files-empty-title">Trash is empty</div>
          <div class="files-empty-sub">Deleted projects are removed permanently.</div>
        </div>`;
      setStatus('Trash — 0 items');
    }

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    /* ── Breadcrumb update ─────────────────────────────────── */

    function updateBreadcrumb() {
      if (!bcEl) return;
      const locLabel = LOCATIONS.find(l => l.id === loc)?.label || loc;
      if (loc === 'home') {
        bcEl.innerHTML = `<span class="files-bc-item files-bc-cur" data-bc="home">Home</span>`;
      } else {
        bcEl.innerHTML = `
          <span class="files-bc-item" data-bc="home">Home</span>
          <span class="files-bc-sep">›</span>
          <span class="files-bc-item files-bc-cur" data-bc="${loc}">${_esc(locLabel)}</span>`;
        // wire home click
        bcEl.querySelector('[data-bc="home"]')?.addEventListener('click', () => switchLoc('home'));
      }
    }

    function switchLoc(newLoc) {
      loc        = newLoc;
      selectedId = null;
      query      = '';
      if (searchEl) searchEl.value = '';

      // Update sidebar active class
      rootEl.querySelectorAll('.files-loc-item').forEach(el => {
        const active = el.dataset.loc === newLoc;
        el.classList.toggle('active', active);
        el.setAttribute('aria-current', active ? 'page' : 'false');
      });

      updateBreadcrumb();
      render();
    }

    /* ── Item interaction ──────────────────────────────────── */

    /** Select an item; deselects previous */
    function selectItem(projectId) {
      selectedId = projectId;
      // Toggle .selected class
      areaEl.querySelectorAll('[data-project-id]').forEach(el => {
        const active = el.dataset.projectId === projectId;
        el.classList.toggle('selected', active);
        el.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      const proj = _getProjects().find(p => p.id === projectId);
      if (proj) setStatus(`"${proj.title}" selected`);
    }

    /** Open a project detail window */
    function openProject(project) {
      // Delegate to registered launcher (project-detail built in next prompt)
      // or fall back to a placeholder window via WM directly.
      if (window.APP_LAUNCHERS?.['project-detail']) {
        window.APP_LAUNCHERS['project-detail']({ projectId: project.id, project });
      } else if (window.WM) {
        window.WM.open('project-detail', {
          title:   project.title,
          icon:    '📁',
          width:   720,
          height:  540,
          content: `<div class="wm-placeholder">
                      <div class="wm-placeholder-icon">📁</div>
                      <h2 class="wm-placeholder-title">${_esc(project.title)}</h2>
                      <p class="wm-placeholder-sub">${_esc(project.description || '')}</p>
                      <span class="wm-placeholder-badge">⚡ Full detail view coming soon</span>
                    </div>`,
        });
      }
    }

    /** Delete a project from localStorage then re-render */
    function deleteProject(project) {
      const all = _getProjects().filter(p => p.id !== project.id);
      _saveProjects(all);
      selectedId = null;
      render();
    }

    /** Handle context menu action */
    function onCtxAction(action, project) {
      switch (action) {
        case 'open':
          openProject(project);
          _hideCtx();
          break;

        case 'github':
          if (project.github) {
            navigator.clipboard?.writeText(project.github).catch(() => {
              // Fallback: select text
            });
            // Brief visual feedback
            const btn = _ctxEl?.querySelector('[data-ctx-action="github"]');
            if (btn) { btn.textContent = '✓ Copied!'; setTimeout(_hideCtx, 900); }
          }
          break;

        case 'delete':
          // Show inline confirm
          _showCtxConfirm(project, () => deleteProject(project));
          break;
      }
    }

    /* ── Event delegation on the grid area ─────────────────── */

    function wireAreaEvents() {
      // ── Left-click → select ───────────────────────────────
      areaEl.addEventListener('click', e => {
        const target = e.target.closest('[data-project-id]');
        if (!target) { selectedId = null; return; }
        selectItem(target.dataset.projectId);
      });

      // ── Double-click → open ────────────────────────────────────
      areaEl.addEventListener('dblclick', e => {
        // Read projectId first — the element may be detached if a re-render
        // fired between the click and dblclick events (MutationObserver).
        const target = e.target.closest('[data-project-id]')
                    || (e.target.dataset?.projectId ? e.target : null);
        const projectId = target?.dataset?.projectId;
        if (!projectId) return;
        const project = _getProjects().find(p => p.id === projectId);
        if (project) openProject(project);
      });

      // ── Enter/Space on keyboard-focused items ──────────────
      areaEl.addEventListener('keydown', e => {
        const target = e.target.closest('[data-project-id]');
        if (!target) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const project = _getProjects().find(p => p.id === target.dataset.projectId);
          if (project) openProject(project);
        }
      });

      // ── Right-click → context menu ─────────────────────────
      areaEl.addEventListener('contextmenu', e => {
        const target = e.target.closest('[data-project-id]');
        if (!target) return;
        e.preventDefault();

        const project = _getProjects().find(p => p.id === target.dataset.projectId);
        if (!project) return;

        selectItem(project.id);
        _showCtx(e.clientX, e.clientY, project, onCtxAction);
      });
    }

    /* ── Init ──────────────────────────────────────────────── */

    function init(windowId) {
      rootEl   = document.getElementById(iid);
      areaEl   = document.getElementById(`${iid}-area`);
      statusEl = document.getElementById(`${iid}-status`);
      searchEl = document.getElementById(`${iid}-search`);
      bcEl     = document.getElementById(`${iid}-bc`);

      if (!rootEl || !areaEl) {
        console.error('[Files] Root/area element not found:', iid);
        return;
      }

      // ── Sidebar location clicks ─────────────────────────────
      rootEl.querySelectorAll('.files-loc-item').forEach(el => {
        el.addEventListener('click', () => switchLoc(el.dataset.loc));
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') switchLoc(el.dataset.loc);
        });
      });

      // ── View toggle ─────────────────────────────────────────
      rootEl.querySelectorAll('.files-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          view = btn.dataset.view;
          rootEl.querySelectorAll('.files-view-btn').forEach(b => {
            const active = b.dataset.view === view;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          render();
        });
      });

      // ── Live search ─────────────────────────────────────────
      searchEl?.addEventListener('input', () => {
        query = searchEl.value;
        selectedId = null;
        // Only filter in Projects and Recent
        if (loc === 'projects' || loc === 'recent') render();
      });

      // ── Breadcrumb "Home" click (initial state) ─────────────
      bcEl?.querySelector('[data-bc="home"]')?.addEventListener('click', () => switchLoc('home'));

      // ── Grid area events ────────────────────────────────────
      wireAreaEvents();

      // ── Re-render on window focus via MutationObserver ──────
      // Debounced: only fires after 200ms idle, and only when the window
      // *transitions* to active (not on every internal pointerdown).
      // This prevents the DOM being wiped mid click→dblclick sequence.
      const winEl = rootEl.closest('.wm-window');
      if (winEl) {
        let _wasActive = false;
        let _renderTimer = null;

        new MutationObserver(() => {
          const nowActive = winEl.classList.contains('active');
          if (nowActive && !_wasActive) {
            // Window just came to front from another window — schedule re-render
            clearTimeout(_renderTimer);
            _renderTimer = setTimeout(() => render(), 200);
          }
          _wasActive = nowActive;
        }).observe(winEl, { attributes: true, attributeFilter: ['class'] });
      }

      // ── Initial render ──────────────────────────────────────
      render();
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     REGISTER LAUNCHER
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  window.APP_LAUNCHERS['files'] = function openFiles(data) {
    if (!window.WM) {
      console.error('[Files] WM not loaded — cannot open Files.');
      return;
    }

    const instance = createFilesInstance();

    const winId = window.WM.open('files', {
      title:  'Files',
      icon:   '📂',
      width:  840,
      height: 560,
      content: instance.html,
    });

    if (winId !== null) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  };

})();
