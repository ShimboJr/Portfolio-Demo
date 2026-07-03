/**
 * settings.js — Portfolio Settings App
 *
 * Styled like GNOME Settings: left sidebar + right content panels.
 * Panels: About | Appearance | Links
 *
 * ── Editing ──────────────────────────────────────────────────
 *   Update the ABOUT and SOCIAL_LINKS constants below.
 *   The Appearance toggle wires a `reduced-motion` class on
 *   <body>; individual apps can respect it with:
 *     @media (not) :root.reduced-motion { ... }
 *   or the JS check:  document.body.classList.contains('reduced-motion')
 *
 * Registers: APP_LAUNCHERS['settings']
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     PERSONAL CONSTANTS  ← edit these
     ══════════════════════════════════════════════════════════ */

  const ABOUT = {
    name: 'Siyanbola Adeola Olaoluwa',
    initials: 'AO',             // 2-letter avatar initials
    role: 'Software Engineer',
    location: 'Ogbomoso, Oyo State, Nigeria',
    resumeHref: 'resume.pdf',   // path or URL to your CV
  };

  const SOCIAL_LINKS = [
    {
      label: 'GitHub',
      handle: '@ShimboJr',
      href: 'https://github.com/ShimboJr',
      icon: 'github',
    },
    {
      label: 'LinkedIn',
      handle: '@[YOUR_LINKEDIN_URL]',
      href: 'https://linkedin.com/in/[YOUR_LINKEDIN]',
      icon: 'linkedin',
    },
    {
      label: 'X / Twitter',
      handle: '@AdeolaSiyanbola',
      href: 'https://x.com/AdeolaSiyanbola',
      icon: 'x',
    },
    {
      label: 'Email',
      handle: 'siyanbolaolaoluwa92@gmail.com',
      href: 'mailto:siyanbolaolaoluwa92@gmail.com',
      icon: 'email',
    },
  ];

  /* ══════════════════════════════════════════════════════════
     SVG ICON LIBRARY
     ══════════════════════════════════════════════════════════ */

  const ICON = {
    person: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.4"/>
      <path d="M2 14.5c0-3.31 2.69-6 6-6s6 2.69 6 6"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    </svg>`,

    palette: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="5.5" cy="7"   r="1.1" fill="currentColor"/>
      <circle cx="10"  cy="5.8" r="1.1" fill="currentColor"/>
      <circle cx="11.5" cy="9.5" r="1.1" fill="currentColor"/>
      <circle cx="5.5" cy="10.5" r="1.1" fill="currentColor"/>
    </svg>`,

    link: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6.5 9.5l3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M9 6.5l1.5-1.5a2.12 2.12 0 013 3L12 9.5"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M7.5 9.5l-1 1a2.12 2.12 0 01-3-3L5 6"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,

    download: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7 2v7M4 7l3 3 3-3" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 11.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,

    externalLink: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 1h3v3M11 1L6 6"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    // Platform icons
    github: `<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 .5C3.86.5.5 3.86.5 8a7.5 7.5 0 005.14 7.13c.37.07.5-.16.5-.36
               v-1.26c-2.08.45-2.52-.99-2.52-.99-.34-.87-.83-1.1-.83-1.1-.68-.46
               .05-.45.05-.45.75.05 1.15.77 1.15.77.67 1.14 1.75.81 2.18.62
               .07-.48.26-.81.47-.99-1.66-.19-3.41-.83-3.41-3.7 0-.82.29-1.49
               .77-2.01-.08-.19-.34-.95.07-1.99 0 0 .63-.2 2.06.77a7.17 7.17
               0 013.74 0c1.43-.97 2.06-.77 2.06-.77.41 1.04.15 1.8.07 1.99
               .48.52.77 1.19.77 2.01 0 2.88-1.75 3.51-3.42 3.7.27.23.51.69
               .51 1.39v2.06c0 .2.13.44.51.37A7.5 7.5 0 0015.5 8C15.5 3.86 12.14.5 8 .5Z"/>
    </svg>`,

    linkedin: `<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M13.5 1.5h-11A1 1 0 001.5 2.5v11a1 1 0 001 1h11a1 1 0 001-1v-11a1
               1 0 00-1-1zM5.5 12.5h-2V6.5h2v6zm-1-6.82a1.18 1.18 0 110-2.36 1.18
               1.18 0 010 2.36zm8 6.82h-2V9.24c0-.77-.02-1.76-1.07-1.76-1.08 0-1.24
               .84-1.24 1.71v3.31h-2V6.5h1.92v.82h.03c.27-.5.92-1.03 1.89-1.03 2.02
               0 2.39 1.33 2.39 3.06v3.15z"/>
    </svg>`,

    x: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12.6 1.5h2.3l-5 5.7 5.9 7.8H11l-3.6-4.7-4.2 4.7H.9l5.4-6.1L.6 1.5H5.1
               l3.3 4.3 4.2-4.3zm-.8 12.1h1.3L4.3 2.8H2.9l8.9 10.8z"/>
    </svg>`,

    email: `<svg width="17" height="17" viewBox="0 0 16 16" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5"
            stroke="currentColor" stroke-width="1.4"/>
      <path d="M1.5 4.5l6.5 5 6.5-5"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  };

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */

  let _counter = 0;
  function _esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ══════════════════════════════════════════════════════════
     PANEL RENDERERS
     ══════════════════════════════════════════════════════════ */

  function _renderAbout() {
    return `
      <h2 class="gs-section-title">About</h2>
      <div class="gs-about-card">
        <div class="gs-about-avatar-row">
          <div class="gs-avatar-circle" aria-hidden="true">${_esc(ABOUT.initials)}</div>
          <div>
            <div class="gs-avatar-name">${_esc(ABOUT.name)}</div>
            <div class="gs-avatar-role">${_esc(ABOUT.role)}</div>
          </div>
        </div>
        <div class="gs-info-row">
          <span class="gs-info-key">Location</span>
          <span class="gs-info-val">${_esc(ABOUT.location)}</span>
        </div>
        <div class="gs-info-row">
          <span class="gs-info-key">Resume</span>
          <span class="gs-info-val">
            <a class="gs-resume-btn" href="${_esc(ABOUT.resumeHref)}" download
               target="_blank" rel="noopener noreferrer">
              ${ICON.download} Download PDF
            </a>
          </span>
        </div>
      </div>`;
  }

  function _renderAppearance(switchId) {
    return `
      <h2 class="gs-section-title">Appearance</h2>
      <div class="gs-toggle-card">
        <div class="gs-toggle-row">
          <div class="gs-toggle-info">
            <div class="gs-toggle-label">Reduce motion</div>
            <div class="gs-toggle-desc">
              Disables non-essential animations across all apps.
              Adds <code>reduced-motion</code> to &lt;body&gt;.
            </div>
          </div>
          <label class="gs-switch" aria-label="Reduce motion">
            <input type="checkbox" id="${switchId}"
                   ${document.body.classList.contains('reduced-motion') ? 'checked' : ''}/>
            <span class="gs-switch-track"></span>
          </label>
        </div>
      </div>`;
  }

  function _renderLinks() {
    const rows = SOCIAL_LINKS.map(link => `
      <a class="gs-link-row" href="${_esc(link.href)}"
         target="_blank" rel="noopener noreferrer"
         aria-label="Open ${_esc(link.label)} profile">
        <div class="gs-link-platform-icon">
          ${ICON[link.icon] ?? ICON.link}
        </div>
        <div class="gs-link-body">
          <div class="gs-link-name">${_esc(link.label)}</div>
          <div class="gs-link-handle">${_esc(link.handle)}</div>
        </div>
        <span class="gs-link-ext-icon">${ICON.externalLink}</span>
      </a>`).join('');

    return `
      <h2 class="gs-section-title">Links</h2>
      <div class="gs-links-list">${rows}</div>`;
  }

  /* ══════════════════════════════════════════════════════════
     SIDEBAR DEFINITIONS
     ══════════════════════════════════════════════════════════ */

  const SECTIONS = [
    { id: 'about', label: 'About', icon: ICON.person },
    { id: 'appearance', label: 'Appearance', icon: ICON.palette },
    { id: 'links', label: 'Links', icon: ICON.link },
  ];

  /* ══════════════════════════════════════════════════════════
     INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createInstance() {
    const iid = `gs-${++_counter}`;
    const switchId = `${iid}-reduce-motion`;

    const sidebarItems = SECTIONS.map(s => `
      <button class="gs-sidebar-item" data-section="${s.id}"
              role="tab" aria-selected="false" aria-controls="${iid}-${s.id}">
        <span class="gs-sidebar-icon" aria-hidden="true">${s.icon}</span>
        ${_esc(s.label)}
      </button>`).join('');

    const html = `
      <div class="gs-root" id="${iid}">

        <!-- Sidebar -->
        <nav class="gs-sidebar" role="tablist" aria-label="Settings sections">
          <div class="gs-sidebar-header">Settings</div>
          ${sidebarItems}
        </nav>

        <!-- Content panels -->
        <div class="gs-content">

          <div class="gs-section" id="${iid}-about"
               role="tabpanel">
            ${_renderAbout()}
          </div>

          <div class="gs-section" id="${iid}-appearance"
               role="tabpanel">
            ${_renderAppearance(switchId)}
          </div>

          <div class="gs-section" id="${iid}-links"
               role="tabpanel">
            ${_renderLinks()}
          </div>

        </div>

      </div>`;

    /* ── Init ───────────────────────────────────────────────── */

    function _activateSection(rootEl, sectionId) {
      rootEl.querySelectorAll('.gs-sidebar-item').forEach(btn => {
        const active = btn.dataset.section === sectionId;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      rootEl.querySelectorAll('.gs-section').forEach(p => {
        p.classList.toggle('active', p.id === `${iid}-${sectionId}`);
      });
    }

    function init(windowId) {
      const rootEl = document.getElementById(iid);
      if (!rootEl) {
        console.error('[Settings] Root element not found:', iid);
        return;
      }

      // Default: About
      _activateSection(rootEl, 'about');

      // Sidebar navigation
      rootEl.querySelectorAll('.gs-sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => _activateSection(rootEl, btn.dataset.section));
      });

      // Reduce-motion toggle
      const motionSwitch = document.getElementById(switchId);
      if (motionSwitch) {
        motionSwitch.addEventListener('change', () => {
          document.body.classList.toggle('reduced-motion', motionSwitch.checked);
        });
      }
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     REGISTER LAUNCHER
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  window.APP_LAUNCHERS['settings'] = function openSettings() {
    if (!window.WM) { console.error('[Settings] WM not loaded.'); return; }

    const instance = createInstance();

    const winId = window.WM.open('settings', {
      title: 'Settings',
      icon: '⚙️',
      width: 640,
      height: 480,
      content: instance.html,
    });

    if (winId !== null) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  };

})();
