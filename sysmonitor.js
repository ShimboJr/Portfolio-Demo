/**
 * sysmonitor.js — Portfolio System Monitor
 *
 * Reframes skills as system resources, styled like GNOME System Monitor.
 *
 * ── Editing skills ──────────────────────────────────────────
 *   Edit SKILL_CATEGORIES and SKILL_PROCESSES at the top of
 *   this file. No localStorage involved — skills rarely change.
 *
 * ── Tabs ────────────────────────────────────────────────────
 *   Resources  — proficiency bars per skill category (default)
 *   Processes  — GNOME-style process table of individual tools
 *
 * Registers: APP_LAUNCHERS['sysmonitor']
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     SKILL DATA  ← edit these two constants to personalise
     ══════════════════════════════════════════════════════════ */

  /**
   * Shown in the Resources tab as animated proficiency bars.
   * pct: 0–100 (how full the bar fills)
   */
  const SKILL_CATEGORIES = [
    { name: 'JavaScript / TypeScript', pct: 92 },
    { name: 'React & Next.js',         pct: 88 },
    { name: 'CSS & Design Systems',    pct: 85 },
    { name: 'Node.js & Databases',     pct: 80 },
    { name: 'Spring Boot',           pct: 75 },
    { name: 'DevOps & Tooling',        pct: 70 },
  ];

  /**
   * Shown in the Processes tab.
   * status: 'Running'  → core skill you use daily    (green badge)
   *         'Sleeping' → skill you know but use less (muted badge)
   */
  const SKILL_PROCESSES = [
    // ── Core (Running) ───────────────────────────────────────
    { name: 'git.exe',        pct: 95, status: 'Running'  },
    { name: 'react.exe',      pct: 88, status: 'Running'  },
    { name: 'typescript.exe', pct: 86, status: 'Running'  },
    { name: 'node.exe',       pct: 82, status: 'Running'  },
    { name: 'springboot.exe',      pct: 76, status: 'Running'  },
    { name: 'docker.exe',     pct: 70, status: 'Running'  },
    // ── Secondary (Sleeping) ─────────────────────────────────
    { name: 'postgresql.exe', pct: 65, status: 'Sleeping' },
    { name: 'redux.exe',      pct: 62, status: 'Sleeping' },
    { name: 'python.exe',     pct: 55, status: 'Sleeping' },
    { name: 'graphql.exe',    pct: 50, status: 'Sleeping' },
    { name: 'vim.exe',        pct: 42, status: 'Sleeping' },
  ];

  /* ══════════════════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════════════════ */

  let _counter = 0;

  function _esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Calculate fake OS uptime from a fixed "install date" */
  function _uptime() {
    const start = new Date('2025-01-15T00:00:00Z');
    const ms    = Date.now() - start.getTime();
    const d     = Math.floor(ms / 86_400_000);
    const h     = Math.floor((ms % 86_400_000) / 3_600_000);
    return `${d}d ${h}h`;
  }

  /* ══════════════════════════════════════════════════════════
     RENDERERS
     ══════════════════════════════════════════════════════════ */

  function _renderInfoCard() {
    return `
      <div class="sm-info-card">
        <div class="sm-info-row">
          <span class="sm-info-key">Hostname</span>
          <span class="sm-info-val">portfolio.local</span>
        </div>
        <div class="sm-info-row">
          <span class="sm-info-key">OS</span>
          <span class="sm-info-val">ShimboJr PortfolioOS 2.0</span>
        </div>
        <div class="sm-info-row">
          <span class="sm-info-key">Kernel</span>
          <span class="sm-info-val">js-5.0.0-gnome-47</span>
        </div>
        <div class="sm-info-row">
          <span class="sm-info-key">Uptime</span>
          <span class="sm-info-val">${_uptime()}</span>
        </div>
        <div class="sm-info-row">
          <span class="sm-info-key">Skills loaded</span>
          <span class="sm-info-val">${SKILL_PROCESSES.length} processes</span>
        </div>
        <div class="sm-info-row">
          <span class="sm-info-key">Architecture</span>
          <span class="sm-info-val">x86_64</span>
        </div>
      </div>`;
  }

  function _renderResources() {
    const bars = SKILL_CATEGORIES.map((cat, i) => `
      <div class="sm-resource-row">
        <div class="sm-res-meta">
          <span class="sm-res-name">${_esc(cat.name)}</span>
          <span class="sm-res-pct">${cat.pct}%</span>
        </div>
        <div class="sm-res-track" title="${_esc(cat.name)}: ${cat.pct}%">
          <div class="sm-res-bar"
               style="--target:${cat.pct}%; --delay:${i * 90}ms;"></div>
        </div>
      </div>`).join('');

    return `
      ${_renderInfoCard()}
      <div class="sm-res-area">
        <div class="sm-section-label">Skill Proficiency</div>
        ${bars}
      </div>`;
  }

  function _renderProcesses() {
    const rows = SKILL_PROCESSES.map(proc => {
      const running    = proc.status === 'Running';
      const statusCls  = running ? 'sm-status-running' : 'sm-status-sleeping';
      const dot        = running ? '●' : '○';
      return `
        <tr>
          <td><span class="sm-proc-name">${_esc(proc.name)}</span></td>
          <td>
            <div class="sm-proc-bar-wrap">
              <div class="sm-proc-mini-track">
                <div class="sm-proc-mini-bar"
                     style="width:${proc.pct}%"></div>
              </div>
              <span class="sm-proc-pct">${proc.pct}%</span>
            </div>
          </td>
          <td>
            <span class="sm-proc-status ${statusCls}">${dot} ${_esc(proc.status)}</span>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="sm-proc-wrap">
        <table class="sm-proc-table">
          <thead class="sm-proc-thead">
            <tr>
              <th style="width:48%">Process Name</th>
              <th style="width:28%">% Used</th>
              <th style="width:24%">Status</th>
            </tr>
          </thead>
          <tbody class="sm-proc-tbody">
            ${rows}
          </tbody>
        </table>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════
     INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createInstance() {
    const iid = `sm-${++_counter}`;

    /* ── HTML ─────────────────────────────────────────────── */
    const html = `
      <div class="sm-root" id="${iid}">

        <!-- Segmented tab control -->
        <div class="sm-tabbar">
          <div class="sm-tab-group" role="tablist" aria-label="System Monitor views">
            <button class="sm-tab-btn" data-tab="resources"
                    role="tab" aria-selected="false"
                    aria-controls="${iid}-resources"
                    id="${iid}-tab-res">Resources</button>
            <button class="sm-tab-btn" data-tab="processes"
                    role="tab" aria-selected="false"
                    aria-controls="${iid}-processes"
                    id="${iid}-tab-proc">Processes</button>
          </div>
        </div>

        <!-- Resources panel (default) -->
        <div class="sm-panel" id="${iid}-resources"
             role="tabpanel" aria-labelledby="${iid}-tab-res">
          ${_renderResources()}
        </div>

        <!-- Processes panel -->
        <div class="sm-panel" id="${iid}-processes"
             role="tabpanel" aria-labelledby="${iid}-tab-proc">
          ${_renderProcesses()}
        </div>

        <!-- Footer status bar -->
        <div class="sm-footer" aria-hidden="true">
          <span>PortfolioOS 2.0 — System Monitor</span>
          <span>${SKILL_PROCESSES.length} processes · ${SKILL_CATEGORIES.length} resource groups</span>
        </div>

      </div>`;

    /* ── Tab switching ─────────────────────────────────────── */

    function _activate(rootEl, tabId) {
      rootEl.querySelectorAll('.sm-tab-btn').forEach(btn => {
        const active = btn.dataset.tab === tabId;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      rootEl.querySelectorAll('.sm-panel').forEach(p => {
        p.classList.toggle('active', p.id === `${iid}-${tabId}`);
      });
    }

    /** Re-trigger bar fill animations (used when switching back to Resources) */
    function _retriggerBars(rootEl) {
      rootEl.querySelectorAll(`#${iid}-resources .sm-res-bar`).forEach(bar => {
        bar.style.animation = 'none';
        void bar.offsetWidth;   // force reflow to reset animation state
        bar.style.animation = '';
      });
    }

    /* ── Init ─────────────────────────────────────────────── */

    function init(windowId) {
      const rootEl = document.getElementById(iid);
      if (!rootEl) {
        console.error('[SysMonitor] Root element not found:', iid);
        return;
      }

      // Show Resources tab by default
      _activate(rootEl, 'resources');

      // Wire tab buttons
      rootEl.querySelectorAll('.sm-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.dataset.tab;
          _activate(rootEl, tabId);
          if (tabId === 'resources') {
            // Panel just became visible — re-trigger the bar fill animations
            requestAnimationFrame(() => _retriggerBars(rootEl));
          }
        });
      });
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     REGISTER LAUNCHER
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  function _launch() {
    if (!window.WM) {
      console.error('[SysMonitor] WM not loaded.');
      return;
    }

    const instance = createInstance();

    const winId = window.WM.open('sysmonitor', {
      title:   'System Monitor',
      icon:    '📊',
      width:   660,
      height:  520,
      content: instance.html,
    });

    if (winId !== null) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  }

  window.APP_LAUNCHERS['sysmonitor']     = _launch;
  window.APP_LAUNCHERS['system-monitor'] = _launch; // alias
  window.APP_LAUNCHERS['sysmon']         = _launch; // dock icon alias

})();
