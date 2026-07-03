/**
 * boot.js — BIOS POST sequence + spinner + desktop reveal
 *
 * Flow:
 *  1. Page load  →  type POST lines one-by-one (~40-80 ms delay each)
 *  2. Last line  →  show blinking cursor, hold 400 ms
 *  3. BIOS screen fades to black over 300 ms, then hides
 *  4. Boot spinner visible on #1e1e2e for ~600 ms
 *  5. Spinner fades out; desktop shell fades in
 *
 * Skip: any keypress or click while BIOS screen is visible
 *       jumps straight to end of POST, then continues normally.
 */

(() => {
  'use strict';

  /* ── POST line definitions ───────────────────────────────────
     Each entry:
       text   : string | function → string (supports HTML spans)
       delay  : ms after previous line before this one appears
       pause  : optional extra hold after this line (ms)
  ─────────────────────────────────────────────────────────── */
  const POST_LINES = [
    {
      text: '<hr class="bios-rule">',
      delay: 0,
    },
    {
      text: 'Portfolio Systems Inc. — Hardware Initialisation Routine',
      delay: 60,
    },
    {
      text: '<hr class="bios-rule">',
      delay: 20,
    },
    {
      text: 'CPU0: <span class="val">CortexDev™ i9-XP "Nocturne" @ 3.84 GHz</span>   <span class="ok">[ ONLINE ]</span>',
      delay: 70,
    },
    {
      text: 'CPU1: Hyperthreading <span class="info">ENABLED</span>  •  Cores: <span class="val">8</span>  •  Threads: <span class="val">16</span>',
      delay: 55,
    },
    {
      text: 'FPU:  Extended precision <span class="ok">[ PASS ]</span>   Cache: L1 <span class="val">512K</span>  L2 <span class="val">4M</span>  L3 <span class="val">32M</span>',
      delay: 65,
    },
    {
      text: '<hr class="bios-rule">',
      delay: 30,
    },
    {
      text: 'RAM:  Counting skills… <span class="val">640K</span> ought to be enough for anybody.',
      delay: 80,
    },
    {
      text: '      Extended skills: <span class="val">32768 MB</span> detected   <span class="ok">[ VERIFIED ]</span>',
      delay: 70,
    },
    {
      text: '      ECC: <span class="info">ENABLED</span>   Refresh: <span class="val">7680 Hz</span>   XMP Profile: <span class="val">DDR5-6400</span>',
      delay: 60,
    },
    {
      text: '<hr class="bios-rule">',
      delay: 25,
    },
    {
      text: 'PCI:  Enumerating creative subsystems…',
      delay: 75,
    },
    {
      text: '      Bus 00:00.0  <span class="val">DesignEngine™ RX 9070 XT</span>   VRAM <span class="val">24 GB</span>   <span class="ok">[ OK ]</span>',
      delay: 60,
    },
    {
      text: '      Bus 00:01.0  <span class="val">SoundWave AudioFX Pro</span>            <span class="ok">[ OK ]</span>',
      delay: 55,
    },
    {
      text: '      Bus 00:02.0  <span class="val">NullPointer™ NIC 10GbE</span>           <span class="ok">[ OK ]</span>',
      delay: 55,
    },
    {
      text: '<hr class="bios-rule">',
      delay: 20,
    },
    {
      text: 'NVMe: <span class="val">PortfolioVault SSD</span>  <span class="val">2 TB</span>   Projects: <span class="val">∞</span>   Bugs: <span class="warn">2</span>',
      delay: 80,
    },
    {
      text: 'USB:  Input devices ready  •  Keyboard <span class="ok">[ PRESENT ]</span>   Mouse <span class="ok">[ PRESENT ]</span>',
      delay: 65,
    },
    {
      text: '<hr class="bios-rule">',
      delay: 25,
    },
    {
      text: 'Security: Secure Boot <span class="info">ACTIVE</span>   TPM <span class="val">2.0</span>   Integrity: <span class="ok">[ INTACT ]</span>',
      delay: 70,
    },
    {
      text: 'ACPI: S0/S3/S4/S5 states configured   Wake timer: <span class="dim">disabled</span>',
      delay: 55,
    },
    {
      text: '<hr class="bios-rule">',
      delay: 20,
    },
    {
      text: 'All systems nominal. Handing control to portfolio kernel…',
      delay: 90,
      pause: 150,
    },
    {
      text: '<span class="ok">POST complete.</span>  Booting <span class="val">SQI/OS</span> — have a great session.',
      delay: 80,
      pause: 400,  // final hold before fade
    },
  ];

  /* ── DOM refs ────────────────────────────────────────────── */
  const biosScreen  = document.getElementById('bios-screen');
  const biosLog     = document.getElementById('bios-log');
  const biosCursor  = document.getElementById('bios-cursor');
  const bootSpinner = document.getElementById('boot-spinner');
  const desktop     = document.getElementById('desktop-shell');

  /* ── State ───────────────────────────────────────────────── */
  let skipped   = false;
  let postDone  = false;

  /* ── Helpers ─────────────────────────────────────────────── */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function appendLine(html) {
    const span = document.createElement('span');
    span.className = 'post-line';
    span.innerHTML = html;
    biosLog.appendChild(span);
    // keep the log scrolled to the bottom
    biosLog.scrollTop = biosLog.scrollHeight;
  }

  /* ── Skip handler ────────────────────────────────────────── */
  function enableSkip() {
    function doSkip() {
      if (postDone) return;
      skipped = true;
    }
    document.addEventListener('keydown', doSkip, { once: false });
    document.addEventListener('pointerdown', doSkip, { once: false });
  }

  /* ── Phase 1 – POST sequence ─────────────────────────────── */
  async function runPost() {
    for (const line of POST_LINES) {
      if (skipped) break;

      // Clamp delay slightly when skip requested mid-sequence
      const d = skipped ? 0 : line.delay;
      await sleep(d);
      if (skipped) break;

      appendLine(line.text);

      if (line.pause && !skipped) {
        await sleep(line.pause);
      }
    }

    // If skipped mid-way, flush all remaining lines instantly
    if (skipped) {
      biosLog.innerHTML = '';
      for (const line of POST_LINES) {
        appendLine(line.text);
      }
      await sleep(20);
    }

    postDone = true;
  }

  /* ── Phase 2 – cursor hold ───────────────────────────────── */
  async function showCursorHold() {
    biosCursor.style.display = 'inline-block';
    await sleep(skipped ? 0 : 400);
  }

  /* ── Phase 3 – BIOS fade to black ───────────────────────── */
  async function fadeBiosOut() {
    biosScreen.classList.add('hidden');            // opacity → 0 over 300ms
    await sleep(350);
    biosScreen.classList.add('gone');              // remove from layout
  }

  /* ── Phase 4 – Boot spinner ──────────────────────────────── */
  async function runSpinner() {
    bootSpinner.classList.remove('hidden');
    await sleep(skipped ? 200 : 600);
    bootSpinner.classList.add('hidden');
    await sleep(320);                              // wait for fade
    bootSpinner.classList.add('gone');
  }

  /* ── Phase 5 – Reveal desktop ───────────────────────────── */
  function revealDesktop() {
    desktop.classList.add('active');
  }

  /* ── Main boot sequence ──────────────────────────────────── */
  async function boot() {
    enableSkip();
    await runPost();
    await showCursorHold();
    await fadeBiosOut();
    await runSpinner();
    revealDesktop();
  }

  /* ── Kick off once DOM is ready ──────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
