/**
 * texteditor.js — Portfolio Text Editor
 *
 * Registers window.APP_LAUNCHERS['texteditor'] AND
 * window.APP_LAUNCHERS['about'] (so the "About Me" desktop icon
 * opens this editor automatically).
 *
 * The editor is purely a presentation surface — read-only,
 * styled to look like a real code editor (gedit / VS Code hybrid)
 * with fake Markdown syntax highlighting.
 *
 * ── Editing the bio ─────────────────────────────────────────
 *   Find the ABOUT_ME_MD constant below and replace the
 *   [PLACEHOLDER] tokens with your real content.
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     ABOUT-ME CONTENT
     Replace every [PLACEHOLDER] with real text.
     ══════════════════════════════════════════════════════════ */

  const ABOUT_ME_MD =
`# About Me
──────────────────────────────────────────────────────

Hello! I'm Siyanbola Adeola Olaoluwa, a passionate Full-Stack
Software Developer based in Lagos.

I craft elegant, performant interfaces and robust
backend systems that solve real-world problems.

I care about developer experience, clean code, and
the art of software engineering.


## Currently

- Working on a clone of Cowrywise
- Levelling up in Software Engineering (Full Stack Web Development)
- Available for **remote opportunities** worldwide


## Stack

**Frontend**   TypeScript · React · Next.js · Tailwind CSS
**Backend**    Node.js · Express · PostgreSQL · Spring Boot · Redis
**DevOps**     Docker · Linux · CI/CD · Nginx
**Tools**      Git · VS Code · WebStorm IDE · IntelliJ IDEA · Postman  


## Find Me

- GitHub    →  https://github.com/ShimboJr
- LinkedIn  →  https://linkedin.com/in/shimbojr
- Email     →  siyanbolaolaoluwa92@gmail.com
- Twitter   →  https://x.com/AdeolaSiyanbola


---
> "Discipline is the bridge between goals and accomplishment"\`
> "Formal education will make you a living; self-education will make you a fortune"`;


  /* ══════════════════════════════════════════════════════════
     INSTANCE COUNTER
     ══════════════════════════════════════════════════════════ */

  let _counter = 0;

  /* ══════════════════════════════════════════════════════════
     HTML HELPERS
     ══════════════════════════════════════════════════════════ */

  /** Escape HTML entities in raw text */
  function _e(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ══════════════════════════════════════════════════════════
     INLINE FORMATTER
     Processes a single string of text, handling:
       **bold** → .te-bold
       `code`   → .te-icode
       →        → .te-arrow
       [PLACEHOLDER] → .te-placeholder
       ·        → .te-dot
     ══════════════════════════════════════════════════════════ */

  function _inlineFmt(raw) {
    let result = '';
    let i = 0;

    while (i < raw.length) {
      const ch = raw[i];

      /* Bold  **...** */
      if (ch === '*' && raw[i + 1] === '*') {
        const close = raw.indexOf('**', i + 2);
        if (close > i + 1) {
          const inner = raw.slice(i + 2, close);
          // Check if it's a [PLACEHOLDER] inside bold
          if (/^\[.+\]$/.test(inner.trim())) {
            result += `<span class="te-bold">**</span>`
                    + `<span class="te-placeholder">${_e(inner)}</span>`
                    + `<span class="te-bold">**</span>`;
          } else {
            result += `<span class="te-bold">**${_e(inner)}**</span>`;
          }
          i = close + 2;
          continue;
        }
      }

      /* Inline code  `...` */
      if (ch === '`') {
        const close = raw.indexOf('`', i + 1);
        if (close > i) {
          result += `<span class="te-icode">\`${_e(raw.slice(i + 1, close))}\`</span>`;
          i = close + 1;
          continue;
        }
      }

      /* Arrow → */
      if (ch === '\u2192') {
        result += `<span class="te-arrow">\u2192</span>`;
        i++;
        continue;
      }

      /* Middle dot · (section separator in Stack) */
      if (ch === '\u00B7') {
        result += `<span class="te-dot"> \u00B7 </span>`;
        i++;
        continue;
      }

      /* [PLACEHOLDER] tokens — must start at word boundary */
      if (ch === '[') {
        const close = raw.indexOf(']', i + 1);
        if (close > i) {
          const token = raw.slice(i, close + 1);
          if (/^\[[A-Z_\s]+\]$/.test(token)) {
            result += `<span class="te-placeholder">${_e(token)}</span>`;
            i = close + 1;
            continue;
          }
        }
      }

      result += _e(ch);
      i++;
    }

    return result;
  }

  /* ══════════════════════════════════════════════════════════
     LINE HIGHLIGHTER
     ══════════════════════════════════════════════════════════ */

  function _highlightLine(raw) {
    /* Empty line */
    if (!raw.trim()) return '&nbsp;';

    /* Horizontal rule  ---  or  ──────  */
    if (/^[-─═]{3,}$/.test(raw.trim())) {
      return `<span class="te-sep">${_e(raw)}</span>`;
    }

    /* Headings  #  ##  ###  */
    const hMatch = raw.match(/^(#{1,3}) (.*)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const cls   = level === 1 ? 'te-h1' : level === 2 ? 'te-h2' : 'te-h3';
      const hashSpan = `<span class="${cls}">${_e(hMatch[1])} `;
      return `${hashSpan}${_inlineFmt(hMatch[2])}</span>`;
    }

    /* Blockquote  >  */
    if (raw.startsWith('> ')) {
      return `<span class="te-quote">${_inlineFmt(raw)}</span>`;
    }

    /* Bullet list  -  *  */
    if (/^[-*] /.test(raw)) {
      const bullet = raw[0];
      const rest   = raw.slice(2);
      return `<span class="te-bullet">${_e(bullet)} </span>${_inlineFmt(rest)}`;
    }

    /* Regular line — might contain inline formatting */
    return _inlineFmt(raw) || '&nbsp;';
  }

  /* ══════════════════════════════════════════════════════════
     RENDERER
     Splits ABOUT_ME_MD into lines, builds gutter + content HTML.
     ══════════════════════════════════════════════════════════ */

  function _renderDocument(src) {
    const lines = src.split('\n');
    const total = lines.length;

    const gutterParts  = [];
    const contentParts = [];

    lines.forEach((raw, idx) => {
      gutterParts.push(`<span class="te-ln">${idx + 1}</span>`);
      contentParts.push(
        `<span class="te-line" data-line="${idx + 1}">${_highlightLine(raw)}</span>`
      );
    });

    return {
      gutterHTML:  gutterParts.join(''),
      contentHTML: contentParts.join(''),
      lineCount:   total,
    };
  }

  /* ══════════════════════════════════════════════════════════
     INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createEditorInstance() {
    const iid = `te-${++_counter}`;
    const { gutterHTML, contentHTML, lineCount } = _renderDocument(ABOUT_ME_MD);

    /* ── Markup ─────────────────────────────────────────────── */

    const html = `
      <div class="te-root" id="${iid}">

        <!-- VS Code-style tab bar -->
        <div class="te-tabbar">
          <div class="te-tab">
            <span class="te-tab-icon" aria-hidden="true">📝</span>
            <span class="te-tab-name">about-me.md</span>
            <span class="te-tab-dot" title="Read-only"></span>
          </div>
          <div class="te-tabbar-bg"></div>
        </div>

        <!-- Editor: gutter + content (scroll together) -->
        <div class="te-editor" id="${iid}-editor" role="region" aria-label="Editor content">
          <div class="te-gutter" aria-hidden="true">${gutterHTML}</div>
          <div class="te-content" tabindex="0" role="document"
               aria-label="about-me.md — read-only">${contentHTML}</div>
        </div>

        <!-- Status bar -->
        <div class="te-statusbar" role="status" aria-live="off">
          <span class="te-sb-item">Markdown</span>
          <span class="te-sb-sep">•</span>
          <span class="te-sb-item">UTF-8</span>
          <span class="te-sb-sep">•</span>
          <span class="te-sb-item">LF</span>
          <span class="te-sb-sep">•</span>
          <span class="te-sb-item">Ln 1, Col 1</span>
          <span class="te-sb-sep">•</span>
          <span class="te-sb-item">${lineCount} lines</span>
          <span class="te-sb-right">100%</span>
        </div>

      </div>`;

    /* ── Init ────────────────────────────────────────────────── */

    function init(windowId) {
      const rootEl = document.getElementById(iid);
      if (!rootEl) {
        console.error('[TextEditor] Root element not found:', iid);
        return;
      }

      // Make content selectable but not editable
      const contentEl = rootEl.querySelector('.te-content');
      if (contentEl) {
        contentEl.style.userSelect = 'text';
        contentEl.style.cursor     = 'text';
        // Prevent any accidental editing if browser allows it
        contentEl.setAttribute('contenteditable', 'false');
      }
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     REGISTER LAUNCHERS
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  function _launch() {
    if (!window.WM) {
      console.error('[TextEditor] WM not loaded — cannot open editor.');
      return;
    }

    const instance = createEditorInstance();

    const winId = window.WM.open('texteditor', {
      title:   'Text Editor — about-me.md',
      icon:    '📝',
      width:   760,
      height:  560,
      content: instance.html,
    });

    if (winId !== null) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  }

  /* 'texteditor' — opened from dock, overview, or directly */
  window.APP_LAUNCHERS['texteditor'] = _launch;

  /* 'about'      — opened from "About Me" desktop icon */
  window.APP_LAUNCHERS['about'] = _launch;

})();
