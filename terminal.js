/**
 * terminal.js — Interactive Portfolio Terminal
 *
 * Registers window.APP_LAUNCHERS['terminal'] so that
 * openApp('terminal') creates a fully functional terminal window.
 *
 * ── LocalStorage schema ──────────────────────────────────────
 *   Key:  'portfolio_projects'
 *   Type: Array of:
 *   {
 *     id:          string   (crypto.randomUUID())
 *     title:       string
 *     description: string
 *     tech:        string[]
 *     github:      string
 *     live:        string
 *     image:       string   (URL or '')
 *     dateAdded:   string   (ISO 8601)
 *   }
 *
 * ── Supported commands ───────────────────────────────────────
 *   help · whoami · neofetch · ls [projects/] · projects
 *   open <name> · contact · clear
 *   sudo <anything> · date · uname · pwd · echo <text>
 *   [hidden] add-project  (wizard or --flag mode)
 *
 * ── Multiple-window support ──────────────────────────────────
 *   createTerminalInstance() returns an isolated { html, init }
 *   pair, so several terminal windows can coexist.
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     PERSONALISATION CONSTANTS
     Edit these to change the terminal's identity text.
     ══════════════════════════════════════════════════════════ */

  const USER = 'shimbojr';
  const HOST = 'portfolio';
  const LS_KEY = 'portfolio_projects';
  const INSTALL_DATE = new Date('2025-01-15T00:00:00Z');  // fake OS install date

  const BIO_LINES = [
    '<span class="term-bold term-green">ShimboJr</span> — Full-Stack Developer &amp; DevOps',
    'Specialised in JavaScript / TypeScript, Java / SpringBoot, React, Node.js, and Fintech solutions.',
    'Passionate about clean UIs and developer tooling. Open to remote opportunities.',
    '',
    '<span class="term-dim">Run </span><span class="term-blue">ls projects/</span>'
    + '<span class="term-dim"> to see my work, or </span>'
    + '<span class="term-blue">contact</span>'
    + '<span class="term-dim"> to get in touch.</span>',
  ];

  const CONTACT_LINES = [
    '<span class="term-bold">Contact</span>',
    '<span class="term-dim">──────────────────────────────────────</span>',
    '<span class="term-mauve">Email   </span>  siyanbolaolaoluwa92@gmail.com',
    '<span class="term-mauve">GitHub  </span>  github.com/ShimboJr',
    '<span class="term-mauve">LinkedIn</span>  linkedin.com/in/shimbojr',
    '<span class="term-mauve">Twitter </span>  @AdeolaSiyanbola',
    '',
    '<span class="term-dim">Or double-click the Contact icon on the desktop.</span>',
  ];

  /* ══════════════════════════════════════════════════════════
     STUB PROJECTS  (seeded every time the page opens)
     ══════════════════════════════════════════════════════════ */

  const STUB_PROJECTS = [
    {
      id: 'stub-cowrywise',
      title: 'Cowrywise Demo',
      description: 'A savings and investments platform, trusted by individuals, HNIs, and corporates.',
      tech: ['CSS', 'HTML5', 'BootStrap', 'JavaScript', 'Firebase'],
      github: 'https://github.com/ShimboJr/Cowrywise-Demo',
      live: 'https://sjr-cowrywise.vercel.app',
      image: './images/cowrywise.jpg',
      dateAdded: '2026-07-08T10:20:00Z',
    },
    {
      id: 'stub-portfolio-os',
      title: 'ShimboJr Portfolio OS',
      description: 'A browser-based Kali Linux GNOME-shell simulation used as an interactive portfolio.',
      tech: ['JavaScript', 'CSS3', 'HTML5', 'Bootstrap 5'],
      github: 'https://github.com/ShimboJr/Portfolio-Demo',
      live: 'https://shimbojr-portfolio.vercel.app/',
      image: './images/portfolio-os.jpg',
      dateAdded: '2026-07-07T07:07:00Z',
    },
    {
      id: 'stub-weather',
      title: 'Weather API',
      description: 'A fully functioning Weather API Demo',
      tech: ['CSS', 'HTML5', 'BootStrap', 'JavaScript'],
      github: 'https://github.com/ShimboJr/WeatherApp-Demo-UI',
      live: 'https://shimbojr.github.io/WeatherApp-Demo-UI/',
      image: './images/weather.jpg',
      dateAdded: '2026-07-06T12:30:00Z',
    },
    {
      id: 'stub-calculator',
      title: 'Simple Calculator',
      description: 'Simple Calculator for performing basic arithmetic operations',
      tech: ['CSS', 'HTML5', 'BootStrap', 'JavaScript'],
      github: 'https://github.com/ShimboJr/Simple-Calculator-Demo',
      live: 'https://sjr-simplecalculator.vercel.app/',
      image: './images/calculator.jpg',
      dateAdded: '2026-07-06T13:11:00Z',
    },
    {
      id: 'stub-password-encryptor',
      title: 'Password Encryptor',
      description: 'Simple Password Encrption Software to demonstrate the working principles of a password encryptor for securing it from cracking',
      tech: ['CSS', 'HTML5', 'BootStrap', 'JavaScript'],
      github: 'https://github.com/ShimboJr/Password-Encryptor-Demo',
      live: 'https://shimbojr.github.io/Password-Encryptor-Demo/',
      image: './images/password-encryptor.jpg',
      dateAdded: '2026-07-06T13:40:00Z',
    },
    {
      id: 'stub-object',
      title: 'Object Demo',
      description: 'A demonstration of how to store multiple data as an object',
      tech: ['CSS', 'HTML5', 'BootStrap', 'JavaScript'],
      github: 'https://github.com/ShimboJr/Object-Demo',
      live: 'https://shimbojr.github.io/Object-Demo/',
      image: './images/object-practice.jpg',
      dateAdded: '2026-07-06T13:45:00Z',
    },
    {
      id: 'stub-array',
      title: 'Array Demo',
      description: 'A demonstration of how array works and how to loop through an array',
      tech: ['CSS', 'HTML5', 'BootStrap', 'JavaScript'],
      github: 'https://github.com/ShimboJr/Array-Demo',
      live: 'https://shimbojr.github.io/Array-Demo/',
      image: './images/array-practice.jpg',
      dateAdded: '2026-07-06T13:55:00Z',
    },
    {
      id: 'stub-table',
      title: 'ArithmeticTable Demo',
      description: 'A demonstration of how to perform various basic various Arithmetic Operations using Table',
      tech: ['HTML5', 'JavaScript'],
      github: 'https://github.com/ShimboJr/ArithmeticTable-Demo',
      live: 'https://shimbojr.github.io/ArithmeticTable-Demo/',
      image: './images/arithmetic-table.jpg',
      dateAdded: '2026-07-06T14:40:00Z',
    },
    {
      id: 'stub-assignment3',
      title: 'Javascript Assignment',
      description: 'A demonstration of different functionalities that can be done with Javascript',
      tech: ['HTML5', 'CSS', 'JavaScript'],
      github: 'https://github.com/ShimboJr/JS-Assignment3',
      live: 'https://shimbojr.github.io/JS-Assignment3/',
      image: './images/assignment3.jpg',
      dateAdded: '2026-07-06T14:48:00Z',
    },
  ];

  /* ══════════════════════════════════════════════════════════
     INSTANCE COUNTER  (prevents id collisions if two terminals
     open within the same millisecond)
     ══════════════════════════════════════════════════════════ */

  let _instanceCounter = 0;

  /* ══════════════════════════════════════════════════════════
     GLOBAL HELPERS  (shared, stateless)
     ══════════════════════════════════════════════════════════ */

  /** Escape HTML entities in user-supplied strings */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Calculate uptime from INSTALL_DATE to now */
  function uptime() {
    const ms = Date.now() - INSTALL_DATE.getTime();
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${d}d ${h}h ${m}m`;
  }

  /** Build the bash-style prompt as an HTML string */
  function promptHTML() {
    return `<span class="term-prompt-inline">`
      + `<span class="term-user-host">${USER}@${HOST}</span>`
      + `<span class="term-sep">:</span>`
      + `<span class="term-path">~</span>`
      + `<span class="term-dollar">$ </span>`
      + `</span>`;
  }

  /* ── localStorage helpers ─────────────────────────────── */

  function getProjects() {
    // Always seed stubs on every page load so portfolio projects are always visible.
    // Any projects added via `add-project` persist only for the current session.
    saveProjects(STUB_PROJECTS);
    return JSON.parse(JSON.stringify(STUB_PROJECTS)); // defensive copy
  }

  function saveProjects(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('[Terminal] localStorage write failed:', e);
    }
  }

  /* ── Flag parser for one-liner add-project mode ──────── */

  function parseFlags(str) {
    const result = {};
    // Match --key "quoted value" or --key unquotedValue
    const re = /--(\w+)\s+"([^"]*?)"|--(\w+)\s+([^\s"]+(?:\s+(?!--)[^\s"]+)*)/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      const key = (m[1] || m[3]).toLowerCase();
      const val = m[2] !== undefined ? m[2] : m[4];
      result[key] = val.trim();
    }
    return result;
  }

  /** Build a project object from wizard/flag data */
  function buildProject(data) {
    return {
      id: (crypto?.randomUUID?.() ?? `proj-${Date.now()}-${Math.random()}`),
      title: data.title || 'Untitled Project',
      description: data.description || data.desc || '',
      tech: data.tech
        ? data.tech.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      github: data.github || '',
      live: data.live || '',
      image: data.image || '',
      dateAdded: new Date().toISOString(),
    };
  }

  /* ══════════════════════════════════════════════════════════
     COMMAND HANDLERS
     Each returns string | string[] — trusted HTML.
     ctx.clearOutput() is available for 'clear'.
     ══════════════════════════════════════════════════════════ */

  const COMMANDS = {

    /* ── help ─────────────────────────────────────────────── */
    help(args, ctx) {
      return [
        '<span class="term-bold">Available commands</span>',
        '<span class="term-dim">──────────────────────────────────────────────────────</span>',
        '  <span class="term-blue">help</span>                 Show this message',
        '  <span class="term-blue">whoami</span>               Bio and skills summary',
        '  <span class="term-blue">neofetch</span>             System information',
        '  <span class="term-blue">ls projects/</span>         List all portfolio projects',
        '  <span class="term-blue">open</span> <span class="term-mauve">&lt;project name&gt;</span>  Open a project detail window',
        '  <span class="term-blue">contact</span>              Display contact information',
        '  <span class="term-blue">clear</span>                Clear the terminal output',
        '  <span class="term-blue">sudo</span> <span class="term-mauve">&lt;anything&gt;</span>     Try your luck 😄',
        '',
        '<span class="term-dim">Tip: use ↑ ↓ arrows to cycle through command history.</span>',
      ];
    },

    /* ── whoami ───────────────────────────────────────────── */
    whoami(args, ctx) {
      return BIO_LINES;
    },

    /* ── neofetch ─────────────────────────────────────────── */
    neofetch(args, ctx) {
      const res = `${window.innerWidth}x${window.innerHeight}`;
      const ua = (navigator.userAgentData?.brands?.[0]?.brand) ||
        navigator.userAgent.split(' ').pop() || 'Browser';

      // Two rows of colour swatches (dark then bright Catppuccin Mocha)
      const dark = ['#1e1e2e', '#313244', '#45475a', '#585b70', '#6c7086', '#7f849c', '#9399b2', '#bac2de'];
      const bright = ['#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa', '#cba6f7', '#94e2d5', '#f5c2e7', '#cdd6f4'];
      const swatch = (colors) => colors.map(c =>
        `<span style="color:${c}; font-size:1.1em">██</span>`
      ).join('');

      return [
        `<span class="term-green term-bold">${USER}</span><span class="term-sep">@</span><span class="term-green term-bold">${HOST}</span>`,
        '<span class="term-dim">─────────────────────────────────────</span>',
        `<span class="term-blue">OS          </span> PortfolioOS 2.0 GNU/Linux x86_64`,
        `<span class="term-blue">Host        </span> ${esc(ua)}`,
        `<span class="term-blue">Kernel      </span> js-5.0.0-gnome-47`,
        `<span class="term-blue">Uptime      </span> ${uptime()}`,
        `<span class="term-blue">Shell       </span> portfolio-sh 2.0.0`,
        `<span class="term-blue">Resolution  </span> ${res}`,
        `<span class="term-blue">WM          </span> GNOME Shell 47 (Wayland)`,
        `<span class="term-blue">Theme       </span> Catppuccin Mocha [GTK3]`,
        `<span class="term-blue">Terminal    </span> portfolio-term 1.0.0`,
        `<span class="term-blue">Colors      </span> ${swatch(dark)}`,
        `            ${swatch(bright)}`,
      ];
    },

    /* ── ls / projects ────────────────────────────────────── */
    ls(args, ctx) {
      const projects = getProjects();
      const lines = [
        `<span class="term-dim">Found </span><span class="term-yellow">${projects.length}</span>`
        + `<span class="term-dim"> project(s) in </span><span class="term-blue">projects/</span>`,
        '',
      ];
      projects.forEach(p => {
        const tech = p.tech?.length
          ? `<span class="term-dim"> [${esc(p.tech.join(', '))}]</span>`
          : '';
        const live = p.live
          ? `  <span class="term-dim">→</span> <span class="term-teal">${esc(p.live)}</span>`
          : '';
        lines.push(
          `  <span class="term-bold term-green">${esc(p.title)}</span>${tech}${live}`,
          p.description
            ? `  <span class="term-subtext">${esc(p.description)}</span>`
            : '',
          '',
        );
      });
      lines.push(
        `<span class="term-dim">Run </span><span class="term-blue">open "&lt;project name&gt;"</span><span class="term-dim"> to open a detail window.</span>`
      );
      return lines;
    },

    /* ── open ─────────────────────────────────────────────── */
    open(args, ctx) {
      if (!args.length) {
        return [
          `<span class="term-error">Usage: open &lt;project name&gt;</span>`,
          `<span class="term-dim">Run </span><span class="term-blue">ls projects/</span><span class="term-dim"> to see available projects.</span>`,
        ];
      }

      const query = args.join(' ').replace(/^["']|["']$/g, '').toLowerCase();
      const project = getProjects().find(p =>
        p.title.toLowerCase().includes(query)
      );

      if (!project) {
        return [
          `<span class="term-error">No project matching "<span class="term-yellow">${esc(args.join(' '))}</span>".</span>`,
          `<span class="term-dim">Run </span><span class="term-blue">ls projects/</span><span class="term-dim"> to see available titles.</span>`,
        ];
      }

      // Delegate to project-detail launcher (project-detail.js) when loaded,
      // otherwise fall back to a simple placeholder window.
      if (window.APP_LAUNCHERS?.['project-detail']) {
        window.APP_LAUNCHERS['project-detail']({ projectId: project.id, project });
      } else if (window.WM) {
        window.WM.open('project-detail', {
          title: project.title,
          icon: '📁',
          width: 560,
          height: 520,
        });
      }

      return [
        `<span class="term-green">Opening</span> <span class="term-bold">${esc(project.title)}</span> …`,
      ];
    },

    /* ── contact ─────────────────────────────────────────── */
    contact(args, ctx) {
      return CONTACT_LINES;
    },

    /* ── clear ───────────────────────────────────────────── */
    clear(args, ctx) {
      ctx.clearOutput();
      return [];
    },

    /* ── sudo ────────────────────────────────────────────── */
    sudo(args, ctx) {
      const jokes = [
        `<span class="term-error">Permission denied.</span> This portfolio is not a production server. 😄`,
        `<span class="term-error">shimbojr is not in the sudoers file. This incident will be reported.</span>`,
        `[sudo] password for ${USER}: \n<span class="term-error">sudo: 3 incorrect password attempts</span>`,
        `<span class="term-error">Nice try.</span> sudo is disabled on PortfolioOS for obvious reasons.`,
        `<span class="term-error">Access denied.</span> Have you tried turning it off and on again?`,
      ];
      return [jokes[Math.floor(Math.random() * jokes.length)]];
    },
  };

  /* ══════════════════════════════════════════════════════════
     ADD-PROJECT WIZARD CONFIG
     (hidden — intentionally excluded from `help` output)
     ══════════════════════════════════════════════════════════ */

  const WIZARD_STEPS = [
    { key: 'title', label: 'Project title', required: true },
    { key: 'description', label: 'Short description', required: true },
    { key: 'tech', label: 'Tech stack  (comma-separated)', required: false },
    { key: 'github', label: 'GitHub URL', required: false },
    { key: 'live', label: 'Live URL', required: false },
    { key: 'image', label: 'Image URL  (Enter to skip)', required: false },
  ];

  /* ══════════════════════════════════════════════════════════
     TERMINAL INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createTerminalInstance() {
    const iid = `term-${++_instanceCounter}`;  // unique DOM id prefix
    let outputEl = null;
    let inputEl = null;

    // Per-instance mutable state
    const history = [];   // command strings (newest first)
    let histIdx = -1;   // -1 = "present" (live draft)
    let draft = '';   // saved text while browsing history
    let wizard = null; // null | { stepIndex: number, data: {} }

    /* ── HTML ─────────────────────────────────────────────── */

    const html = `
      <div class="term-root" id="${iid}">
        <div class="term-output" id="${iid}-out"></div>
        <div class="term-input-row">
          ${promptHTML()}
          <input class="term-input" id="${iid}-in"
                 type="text"
                 autocomplete="off"
                 autocorrect="off"
                 autocapitalize="off"
                 spellcheck="false"
                 aria-label="Terminal input" />
        </div>
      </div>
    `;

    /* ── Output helpers ───────────────────────────────────── */

    function scrollBottom() {
      if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
    }

    function clearOutput() {
      if (outputEl) outputEl.innerHTML = '';
    }

    /** Append an array (or single) of HTML strings as .term-out divs */
    function appendLines(lines) {
      if (!outputEl) return;
      const arr = Array.isArray(lines) ? lines : [lines];
      const frag = document.createDocumentFragment();
      arr.forEach(line => {
        const div = document.createElement('div');
        div.className = 'term-out';
        div.innerHTML = line;   // lines are trusted HTML from our handlers
        frag.appendChild(div);
      });
      outputEl.appendChild(frag);
      scrollBottom();
    }

    /** Echo a command line (prompt + cmd text) to the output */
    function echoCmd(cmdStr) {
      if (!outputEl) return;
      const div = document.createElement('div');
      div.className = 'term-echo';
      div.innerHTML = `${promptHTML()}<span class="term-cmd-text">${esc(cmdStr)}</span>`;
      outputEl.appendChild(div);
    }

    /** Append a wizard-prompt line (field label) to the output */
    function appendWizardQ(label, required) {
      if (!outputEl) return;
      const req = required
        ? `<span class="term-red"> *</span>`
        : `<span class="term-dim"> (optional)</span>`;
      const div = document.createElement('div');
      div.className = 'term-out';
      div.innerHTML = `  <span class="term-wizard-q">${esc(label)}</span>${req}:`;
      outputEl.appendChild(div);
      scrollBottom();
    }

    /* ── Context object passed to command handlers ──────── */

    const ctx = { clearOutput, appendLines };

    /* ── Command dispatch ─────────────────────────────────── */

    function dispatch(raw) {
      const trimmed = raw.trim();
      if (!trimmed) return;

      // Push to session history (no consecutive duplicates)
      if (history[0] !== trimmed) history.unshift(trimmed);
      histIdx = -1;
      draft = '';

      echoCmd(trimmed);

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      const fullLower = trimmed.toLowerCase();

      // ── add-project (hidden) ─────────────────────────────
      if (cmd === 'add-project') {
        const rest = args.join(' ');
        if (rest.includes('--')) {
          handleFastAdd(rest);
        } else {
          startWizard();
        }
        return;
      }

      // ── ls variants ──────────────────────────────────────
      if (cmd === 'ls') {
        const target = args[0]?.toLowerCase() ?? '';
        if (!target || target.startsWith('project')) {
          appendLines(COMMANDS.ls(args, ctx));
        } else {
          appendLines([
            `<span class="term-error">ls: ${esc(args[0])}: No such file or directory</span>`,
            `<span class="term-dim">Try: <span class="term-blue">ls projects/</span></span>`,
          ]);
        }
        return;
      }

      // ── projects alias ────────────────────────────────────
      if (cmd === 'projects' || fullLower.startsWith('ls project')) {
        appendLines(COMMANDS.ls(args, ctx));
        return;
      }

      // ── registered commands ───────────────────────────────
      if (COMMANDS[cmd]) {
        const result = COMMANDS[cmd](args, ctx);
        if (result && result.length > 0) appendLines(result);
        return;
      }

      // ── bonus built-ins ──────────────────────────────────
      if (cmd === 'pwd') { appendLines([`<span class="term-blue">/home/${USER}</span>`]); return; }
      if (cmd === 'date') { appendLines([new Date().toString()]); return; }
      if (cmd === 'uname') { appendLines(['PortfolioOS 2.0.0-gnome-47 GNU/Linux x86_64']); return; }
      if (cmd === 'echo') { appendLines([esc(args.join(' '))]); return; }
      if (cmd === 'exit' || cmd === 'quit') {
        appendLines([`<span class="term-dim">Close the window (✕) to exit, or type <span class="term-blue">clear</span> to clear output.</span>`]);
        return;
      }
      if (cmd === 'cat' && args[0] === 'resume.pdf') {
        appendLines([
          `<span class="term-warn">binary: PDF  (open "Resume.pdf" from the desktop for the full document)</span>`,
        ]);
        return;
      }

      // ── Unknown ───────────────────────────────────────────
      appendLines([
        `<span class="term-error">${esc(parts[0])}: command not found</span>`,
        `<span class="term-dim">Type <span class="term-blue">help</span> to see available commands.</span>`,
      ]);
    }

    /* ── add-project: fast (flag) mode ───────────────────── */

    function handleFastAdd(rawFlags) {
      const flags = parseFlags(rawFlags.startsWith('--') ? rawFlags : '--' + rawFlags);
      if (!flags.title) {
        appendLines([
          `<span class="term-error">Missing --title flag.</span>`,
          `<span class="term-dim">Usage: add-project --title "My App" --desc "..." --tech "React,Node" --github "url" --live "url"</span>`,
        ]);
        return;
      }
      const proj = buildProject(flags);
      const all = getProjects();
      all.push(proj);
      saveProjects(all);
      appendLines([
        `<span class="term-success">✓ Added: <span class="term-bold">${esc(proj.title)}</span></span>`,
        `<span class="term-dim">  Tech: ${proj.tech.join(', ') || '—'}</span>`,
        `<span class="term-dim">  Total projects: ${all.length}  — run </span><span class="term-blue">ls projects/</span><span class="term-dim"> to verify.</span>`,
      ]);
    }

    /* ── add-project: interactive wizard ─────────────────── */

    function startWizard() {
      wizard = { stepIndex: 0, data: {} };
      appendLines([
        '',
        `<span class="term-mauve term-bold">add-project</span> <span class="term-dim">— interactive wizard (Ctrl+C to cancel)</span>`,
        `<span class="term-dim">Fill in each field and press Enter. Optional fields can be left blank.</span>`,
        '',
      ]);
      showNextWizardQ();
    }

    function showNextWizardQ() {
      if (!wizard) return;
      const step = WIZARD_STEPS[wizard.stepIndex];
      if (!step) { finishWizard(); return; }
      appendWizardQ(step.label, step.required);
    }

    function handleWizardInput(raw) {
      if (!wizard) return;
      const step = WIZARD_STEPS[wizard.stepIndex];
      const value = raw.trim();

      if (step.required && !value) {
        appendLines([`<span class="term-warn">  ⚠ This field is required.</span>`]);
        showNextWizardQ();
        return;
      }

      // Echo the user's answer
      const div = document.createElement('div');
      div.className = 'term-out';
      div.innerHTML = `  <span class="term-subtext">${esc(value || '(skipped)')}</span>`;
      outputEl.appendChild(div);

      wizard.data[step.key] = value;
      wizard.stepIndex++;

      scrollBottom();

      if (wizard.stepIndex < WIZARD_STEPS.length) {
        showNextWizardQ();
      } else {
        finishWizard();
      }
    }

    function finishWizard() {
      const data = wizard.data;
      wizard = null;

      const proj = buildProject(data);
      const all = getProjects();
      all.push(proj);
      saveProjects(all);

      const lines = [
        '',
        `<span class="term-success term-bold">✓ Project added!</span>`,
        `<span class="term-dim">  Title:  </span>${esc(proj.title)}`,
        `<span class="term-dim">  ID:     </span><span class="term-overlay">${proj.id}</span>`,
      ];
      if (proj.tech.length) lines.push(`<span class="term-dim">  Tech:   </span>${esc(proj.tech.join(', '))}`);
      if (proj.github) lines.push(`<span class="term-dim">  GitHub: </span><span class="term-teal">${esc(proj.github)}</span>`);
      if (proj.live) lines.push(`<span class="term-dim">  Live:   </span><span class="term-teal">${esc(proj.live)}</span>`);
      lines.push(
        '',
        `<span class="term-dim">Total: ${all.length} projects. Run </span><span class="term-blue">ls projects/</span><span class="term-dim"> to see all.</span>`,
      );
      appendLines(lines);
    }

    /* ── Welcome banner ───────────────────────────────────── */

    function showWelcome() {
      appendLines([
        `<span class="term-teal">╭─────────────────────────────────────────────────╮</span>`,
        `<span class="term-teal">│</span>  <span class="term-bold">Portfolio Terminal</span>  ·   PortfolioOS v2.0.0       <span class="term-teal">│</span>`,
        `<span class="term-teal">│</span>  <span class="term-dim">Interactive CLI for exploring my work            </span><span class="term-teal">│</span>`,
        `<span class="term-teal">╰─────────────────────────────────────────────────╯</span>`,
        '',
        `Type <span class="term-blue">help</span> for a list of commands.`
        + `  Use <span class="term-dim">↑ ↓</span> for history.`,
        '',
      ]);
    }

    /* ── Keyboard handler ─────────────────────────────────── */

    function onKeydown(e) {
      /* Enter — submit ──────────────────────────────────────── */
      if (e.key === 'Enter') {
        e.preventDefault();
        const raw = inputEl.value;
        inputEl.value = '';
        histIdx = -1;
        draft = '';

        if (wizard) {
          handleWizardInput(raw);
        } else {
          dispatch(raw);
        }
        return;
      }

      /* ↑ — older history ────────────────────────────────────── */
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!history.length || wizard) return;
        if (histIdx === -1) draft = inputEl.value;
        histIdx = Math.min(histIdx + 1, history.length - 1);
        inputEl.value = history[histIdx] ?? '';
        const n = inputEl.value.length;
        inputEl.setSelectionRange(n, n);
        return;
      }

      /* ↓ — newer / draft ────────────────────────────────────── */
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (wizard) return;
        if (histIdx <= 0) { histIdx = -1; inputEl.value = draft; return; }
        histIdx--;
        inputEl.value = history[histIdx] ?? draft;
        const n = inputEl.value.length;
        inputEl.setSelectionRange(n, n);
        return;
      }

      /* Ctrl+C — cancel wizard or current line ────────────────── */
      if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        if (wizard) {
          echoCmd('^C');
          appendLines([`<span class="term-dim">Wizard cancelled.</span>`, '']);
          wizard = null;
        } else {
          echoCmd(inputEl.value.length ? inputEl.value + '^C' : '^C');
          inputEl.value = '';
        }
        return;
      }

      /* Ctrl+L — clear ─────────────────────────────────────────── */
      if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        clearOutput();
        return;
      }

      /* Tab — rudimentary command completion ───────────────────── */
      if (e.key === 'Tab') {
        e.preventDefault();
        const val = inputEl.value;
        if (!val) return;
        const known = Object.keys(COMMANDS).concat(['ls projects/', 'add-project', 'pwd', 'date', 'uname', 'echo', 'exit']);
        const match = known.find(c => c.startsWith(val) && c !== val);
        if (match) {
          inputEl.value = match + (match.endsWith('/') ? '' : ' ');
          const n = inputEl.value.length;
          inputEl.setSelectionRange(n, n);
        }
        return;
      }
    }

    /* ── init  (called after WM has inserted the HTML into DOM) */

    function init(windowId) {
      const rootEl = document.getElementById(iid);
      if (!rootEl) {
        console.error('[Terminal] Root element not found:', iid);
        return;
      }

      outputEl = document.getElementById(`${iid}-out`);
      inputEl = document.getElementById(`${iid}-in`);

      if (!outputEl || !inputEl) {
        console.error('[Terminal] Could not find output/input elements');
        return;
      }

      showWelcome();
      inputEl.addEventListener('keydown', onKeydown);

      // Click anywhere in the terminal body → refocus input
      rootEl.addEventListener('click', e => {
        if (!e.target.closest('a')) inputEl.focus();
      });

      // Auto-focus after two animation frames (DOM settled + transition)
      requestAnimationFrame(() => requestAnimationFrame(() => inputEl.focus()));
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     EAGER SEED
     Runs immediately when terminal.js executes (deferred, so after
     DOMContentLoaded but before any user interaction).  Writing
     STUB_PROJECTS here ensures localStorage is populated for every
     app that reads 'portfolio_projects' (files.js, project-detail.js,
     terminal commands) regardless of whether the terminal is ever opened.
     ══════════════════════════════════════════════════════════ */

  (function _eagerSeed() {
    try {
      localStorage.setItem('portfolio_projects', JSON.stringify(STUB_PROJECTS));
    } catch (e) {
      console.warn('[Terminal] Could not seed projects to localStorage:', e.message);
    }
  })();

  /* ══════════════════════════════════════════════════════════
     REGISTER AS APP LAUNCHER
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  window.APP_LAUNCHERS['terminal'] = function openTerminal() {
    if (!window.WM) {
      console.error('[Terminal] WM not loaded — cannot open terminal.');
      return;
    }

    const instance = createTerminalInstance();

    const winId = window.WM.open('terminal', {
      title: 'Terminal',
      icon: '💻',
      width: 760,
      height: 500,
      content: instance.html,
    });

    if (winId !== null) {
      // Two frames: first for DOM insertion, second for layout pass
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  };

})();
