/**
 * overview.js — GNOME Activities Overview
 *
 * Opens via: Activities button click | Super/Meta keydown | top-left hot corner
 * Closes via: Esc keydown | backdrop click
 *
 * Exposes `window.Overview = { open, close, toggle }` for use by shell.js.
 *
 * Load order: window-manager.js (defer) → shell.js (defer) → overview.js (defer)
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     APP REGISTRY
     All unique apps across desktop icons + dock.
     bgDark / bgLight mirror the gradient pairs in shell.css
     and window-manager.css so the overview tiles are visually
     consistent with the rest of the shell.
     ══════════════════════════════════════════════════════════ */

  const APPS = [
    { id: 'about',      label: 'About Me',       icon: '👤', bgDark: '#1a2248', bgLight: '#252d5a' },
    { id: 'projects',   label: 'Projects',       icon: '📁', bgDark: '#1e1438', bgLight: '#2c1f4e' },
    { id: 'resume',     label: 'Resume.pdf',     icon: '📄', bgDark: '#0e2418', bgLight: '#182f22' },
    { id: 'terminal',   label: 'Terminal',       icon: '💻', bgDark: '#0c2424', bgLight: '#183030' },
    { id: 'files',      label: 'Files',          icon: '📂', bgDark: '#2a1e08', bgLight: '#3a2c12' },
    { id: 'texteditor', label: 'Text Editor',    icon: '📝', bgDark: '#0d1f30', bgLight: '#162a3c' },
    { id: 'sysmon',     label: 'System Monitor', icon: '📊', bgDark: '#0f2018', bgLight: '#192c20' },
    { id: 'settings',   label: 'Settings',       icon: '⚙️',  bgDark: '#1a1a28', bgLight: '#242438' },
    { id: 'trash',      label: 'Trash',          icon: '🗑️', bgDark: '#1e1e2e', bgLight: '#28283a' },
  ];

  /* ══════════════════════════════════════════════════════════
     SEARCH DATA  (stub — real project data injected in a
     later prompt by dispatching 'overview:register-data')
     ══════════════════════════════════════════════════════════ */

  let SEARCH_DATA = [
    // ── Projects ─────────────────────────────────────────────
    {
      type: 'project',
      title: 'Portfolio OS',
      tags: ['gnome', 'javascript', 'css', 'html', 'ui', 'simulation'],
      desc: 'Browser-based OS simulation — this very site.',
    },
    {
      type: 'project',
      title: 'E-Commerce Platform',
      tags: ['react', 'nextjs', 'typescript', 'stripe', 'fintech', 'postgresql'],
      desc: 'Full-stack storefront with payment processing.',
    },
    {
      type: 'project',
      title: 'Banking Dashboard',
      tags: ['fintech', 'react', 'd3', 'charts', 'realtime', 'websocket'],
      desc: 'Real-time financial analytics and reporting tool.',
    },
    {
      type: 'project',
      title: 'CLI Tool Suite',
      tags: ['python', 'node', 'cli', 'automation', 'devtools', 'bash'],
      desc: 'Developer productivity scripts and scaffolding tools.',
    },
    {
      type: 'project',
      title: 'Mobile Application',
      tags: ['react native', 'expo', 'ios', 'android', 'mobile'],
      desc: 'Cross-platform mobile app for personal finance.',
    },
    // ── Skills ───────────────────────────────────────────────
    {
      type: 'skill',
      title: 'JavaScript',
      tags: ['js', 'es2024', 'vanilla', 'frontend', 'async', 'promises'],
    },
    {
      type: 'skill',
      title: 'TypeScript',
      tags: ['ts', 'typed', 'generics', 'frontend', 'types'],
    },
    {
      type: 'skill',
      title: 'React',
      tags: ['react', 'hooks', 'context', 'suspense', 'frontend', 'ui'],
    },
    {
      type: 'skill',
      title: 'Node.js',
      tags: ['node', 'backend', 'express', 'api', 'server', 'runtime'],
    },
    {
      type: 'skill',
      title: 'Python',
      tags: ['python', 'backend', 'scripting', 'data', 'ml', 'fastapi'],
    },
    {
      type: 'skill',
      title: 'CSS / SCSS',
      tags: ['css', 'scss', 'styling', 'animations', 'grid', 'flexbox'],
    },
    {
      type: 'skill',
      title: 'PostgreSQL',
      tags: ['sql', 'database', 'postgres', 'queries', 'schema', 'orm'],
    },
    {
      type: 'skill',
      title: 'Docker',
      tags: ['containers', 'devops', 'docker-compose', 'deployment', 'linux'],
    },
    {
      type: 'skill',
      title: 'Git & GitHub',
      tags: ['git', 'version control', 'github', 'ci', 'pull requests'],
    },
    {
      type: 'skill',
      title: 'UI / UX Design',
      tags: ['design', 'figma', 'prototyping', 'accessibility', 'gnome', 'hig'],
    },
  ];

  /* ══════════════════════════════════════════════════════════
     DOM REFS
     ══════════════════════════════════════════════════════════ */

  const overviewEl  = document.getElementById('overview');
  const searchEl    = document.getElementById('ov-search');
  const appGridEl   = document.getElementById('ov-app-grid');
  const projSect    = document.getElementById('ov-projects-section');
  const projCards   = document.getElementById('ov-project-cards');
  const workspacesEl = document.getElementById('ov-workspaces');
  const hotCorner   = document.getElementById('hot-corner');

  if (!overviewEl || !searchEl) {
    console.error('[Overview] Required DOM elements not found.');
    return;
  }

  /* ══════════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════════ */

  let isOpen    = false;
  let activeWs  = 0;       // currently highlighted workspace index

  /* ══════════════════════════════════════════════════════════
     RENDER — APP TILES
     ══════════════════════════════════════════════════════════ */

  function renderApps(query = '') {
    const q = query.toLowerCase().trim();

    const visible = q
      ? APPS.filter(a => a.label.toLowerCase().includes(q) || a.id.includes(q))
      : APPS;

    appGridEl.innerHTML = '';

    if (visible.length === 0) {
      appGridEl.innerHTML =
        '<p class="ov-empty-notice">No apps match your search.</p>';
      return;
    }

    visible.forEach(app => {
      const tile = document.createElement('div');
      tile.className = 'ov-app-tile';
      tile.setAttribute('data-app-id', app.id);
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-label', `Open ${app.label}`);
      tile.innerHTML = `
        <div class="ov-app-icon-wrap"
             style="background:linear-gradient(145deg,${app.bgDark},${app.bgLight});">
          <span class="ov-app-icon-glyph" aria-hidden="true">${app.icon}</span>
        </div>
        <span class="ov-app-label">${_esc(app.label)}</span>
      `;

      const launch = () => {
        close();
        if (window.openApp) window.openApp(app.id);
      };

      tile.addEventListener('click', launch);
      tile.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch(); }
      });

      appGridEl.appendChild(tile);
    });
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — PROJECT / SKILL RESULT CARDS
     ══════════════════════════════════════════════════════════ */

  function renderResults(query) {
    if (!query.trim()) {
      projSect.hidden = true;
      return;
    }

    const q = query.toLowerCase().trim();

    const hits = SEARCH_DATA.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    );

    if (hits.length === 0) {
      projSect.hidden = true;
      return;
    }

    projCards.innerHTML = '';
    hits.forEach(item => {
      const card = document.createElement('div');
      card.className = `ov-result-card ov-result-${item.type}`;
      card.innerHTML = `
        <span class="ov-result-type-badge">${item.type}</span>
        <div class="ov-result-title">${_esc(item.title)}</div>
        ${item.desc ? `<div class="ov-result-desc">${_esc(item.desc)}</div>` : ''}
        <div class="ov-result-tags">
          ${item.tags.map(t => `<span>${_esc(t)}</span>`).join('')}
        </div>
      `;
      projCards.appendChild(card);
    });

    projSect.hidden = false;
  }

  /* ══════════════════════════════════════════════════════════
     OPEN / CLOSE / TOGGLE
     ══════════════════════════════════════════════════════════ */

  function open() {
    if (isOpen) return;
    isOpen = true;

    overviewEl.classList.add('ov-visible');
    overviewEl.setAttribute('aria-hidden', 'false');

    // Reset search and render full app grid
    searchEl.value = '';
    projSect.hidden = true;
    renderApps();

    // Auto-focus search after the GPU has composited the first frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => searchEl.focus());
    });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    overviewEl.classList.remove('ov-visible');
    overviewEl.setAttribute('aria-hidden', 'true');
    searchEl.blur();
  }

  function toggle() {
    if (isOpen) close(); else open();
  }

  /* ══════════════════════════════════════════════════════════
     EVENT WIRING
     ══════════════════════════════════════════════════════════ */

  // ── Search input → filter apps + show result cards ────────
  searchEl.addEventListener('input', () => {
    const q = searchEl.value;
    renderApps(q);
    renderResults(q);
  });

  // Stop clicks inside the content from bubbling to the backdrop
  document.getElementById('ov-search-wrap').addEventListener('click',  e => e.stopPropagation());
  document.getElementById('ov-scroll').addEventListener('click',       e => e.stopPropagation());
  document.getElementById('ov-workspaces').addEventListener('click',   e => e.stopPropagation());

  // ── Backdrop click → close ────────────────────────────────
  overviewEl.addEventListener('click', e => {
    if (e.target === overviewEl) close();
  });

  // ── Keyboard shortcuts ────────────────────────────────────
  document.addEventListener('keydown', e => {
    // Super / Meta — toggle overview (Windows key on Windows, ⌘ on Mac)
    if (e.key === 'Meta' || e.key === 'Super') {
      e.preventDefault();
      toggle();
      return;
    }
    // Escape — close if open
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      close();
      return;
    }
    // While overview is open, typing routes to the search box automatically
    if (isOpen && searchEl !== document.activeElement) {
      const printable = e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
      if (printable) searchEl.focus();
    }
  });

  // ── Hot corner (top-left 4×4 px) → open ──────────────────
  if (hotCorner) {
    hotCorner.addEventListener('mouseenter', () => {
      if (!isOpen) open();
    });
  }

  // ── Activities button in the top bar ─────────────────────
  // (shell.js delegates to window.Overview.toggle; see below)

  // ── Workspace switcher ────────────────────────────────────
  if (workspacesEl) {
    workspacesEl.querySelectorAll('.ov-workspace').forEach((ws, idx) => {
      ws.addEventListener('click', () => {
        // Deactivate all
        workspacesEl.querySelectorAll('.ov-workspace').forEach(w => {
          w.classList.remove('active');
          w.setAttribute('aria-selected', 'false');
          w.setAttribute('tabindex', '-1');
        });
        // Activate clicked
        ws.classList.add('active');
        ws.setAttribute('aria-selected', 'true');
        ws.setAttribute('tabindex', '0');
        activeWs = idx;

        // Dispatch for future workspace-manager integration
        document.dispatchEvent(new CustomEvent('overview:workspace-select', {
          detail: { index: idx, label: ws.querySelector('.ov-workspace-label')?.textContent },
        }));
      });

      // Keyboard navigation between workspaces
      ws.addEventListener('keydown', e => {
        const tabs = [...workspacesEl.querySelectorAll('.ov-workspace')];
        let next;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          next = tabs[(tabs.indexOf(ws) + 1) % tabs.length];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next = tabs[(tabs.indexOf(ws) - 1 + tabs.length) % tabs.length];
        } else if (e.key === 'Enter' || e.key === ' ') {
          ws.click();
        }
        if (next) { e.preventDefault(); next.focus(); next.click(); }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     EXTENSION HOOK
     Later prompts can push real project data:
       document.dispatchEvent(new CustomEvent('overview:register-data', {
         detail: { items: [...] }   // same shape as SEARCH_DATA entries
       }));
     ══════════════════════════════════════════════════════════ */

  document.addEventListener('overview:register-data', ({ detail }) => {
    if (Array.isArray(detail?.items)) {
      SEARCH_DATA = [...SEARCH_DATA, ...detail.items];
    }
  });

  /* ══════════════════════════════════════════════════════════
     GLOBAL EXPORT
     ══════════════════════════════════════════════════════════ */

  window.Overview = { open, close, toggle };

  /* ── Tiny HTML-escape helper ─────────────────────────────── */
  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
