/**
 * contact.js — Portfolio Contact App
 *
 * Compact mail-composer style window.
 *
 * ── Adding a real mail service ────────────────────────────────
 *   Find the function _sendMessage() below. It currently just
 *   simulates a network delay then shows the success state.
 *   Replace the body of _sendMessage() with a Formspree fetch,
 *   EmailJS call, or any other service — the rest of the wiring
 *   (validation, loading state, success/error UI) stays as-is.
 *
 * Registers: APP_LAUNCHERS['contact']
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     INSTANCE COUNTER
     ══════════════════════════════════════════════════════════ */

  let _counter = 0;

  /* ══════════════════════════════════════════════════════════
     MAIL SENDER  ← replace this function to add a real backend
     ══════════════════════════════════════════════════════════ */

  /**
   * _sendMessage({ name, email, message })
   *
   * Returns a Promise that resolves on success and rejects on failure.
   * Swap this implementation for your mail service of choice:
   *
   *   Formspree example:
   *     return fetch('https://formspree.io/f/YOUR_FORM_ID', {
   *       method: 'POST',
   *       headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
   *       body: JSON.stringify(data),
   *     }).then(r => { if (!r.ok) throw new Error('Send failed'); });
   *
   *   EmailJS example:
   *     return emailjs.send('SERVICE_ID', 'TEMPLATE_ID', data);
   */
  async function _sendMessage(data) {
    // ── STUB: remove this block and add your real service above ──
    console.log('[Contact] Message payload:', data);
    await new Promise(resolve => setTimeout(resolve, 900)); // simulate network
    // Uncomment the line below to test the error path:
    // throw new Error('Simulated send failure');
    // ─────────────────────────────────────────────────────────────
  }

  /* ══════════════════════════════════════════════════════════
     HTML HELPER
     ══════════════════════════════════════════════════════════ */

  function _esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ══════════════════════════════════════════════════════════
     INSTANCE FACTORY
     ══════════════════════════════════════════════════════════ */

  function createInstance() {
    const iid = `ct-${++_counter}`;

    /* ── Markup ─────────────────────────────────────────────── */

    const html = `
      <div class="ct-root" id="${iid}">

        <!-- Header -->
        <div class="ct-header">
          <h2 class="ct-title">Get in touch</h2>
          <p class="ct-subtitle">
            Fill out the form and I'll get back to you as soon as I can.
          </p>
        </div>

        <!-- Contact form -->
        <form class="ct-form" id="${iid}-form" novalidate>

          <!-- Name + Email: two columns -->
          <div class="ct-row-2">
            <div class="ct-field-group">
              <label class="ct-label" for="${iid}-name">Name</label>
              <input class="ct-input" id="${iid}-name" name="name"
                     type="text" autocomplete="name"
                     placeholder="Your name" required />
              <span class="ct-error-msg" id="${iid}-name-err">Please enter your name.</span>
            </div>
            <div class="ct-field-group">
              <label class="ct-label" for="${iid}-email">Email</label>
              <input class="ct-input" id="${iid}-email" name="email"
                     type="email" autocomplete="email"
                     placeholder="you@example.com" required />
              <span class="ct-error-msg" id="${iid}-email-err">Please enter a valid email.</span>
            </div>
          </div>

          <!-- Message -->
          <div class="ct-field-group">
            <label class="ct-label" for="${iid}-msg">Message</label>
            <textarea class="ct-textarea" id="${iid}-msg" name="message"
                      placeholder="What's on your mind?" required></textarea>
            <span class="ct-error-msg" id="${iid}-msg-err">Please write a message.</span>
          </div>

          <!-- Footer row: note + submit -->
          <div class="ct-form-footer">
            <span class="ct-form-note">All fields are required.</span>
            <button class="ct-submit" id="${iid}-submit" type="submit">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.5 7h11M8.5 3.5L12 7l-3.5 3.5"
                      stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Send message
            </button>
          </div>

        </form>

      </div>`;

    /* ── Validation ─────────────────────────────────────────── */

    /**
     * Validate a single field.  Returns true if valid.
     * Marks the field with .ct-error and shows the error message.
     */
    function _validateField(input, errEl) {
      let valid = true;

      if (input.type === 'email') {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      } else {
        valid = input.value.trim().length > 0;
      }

      input.classList.toggle('ct-error', !valid);
      if (errEl) errEl.classList.toggle('visible', !valid);
      return valid;
    }

    /** Validate all fields; returns true if the whole form is valid. */
    function _validateAll(nameEl, emailEl, msgEl, nameErr, emailErr, msgErr) {
      const a = _validateField(nameEl,  nameErr);
      const b = _validateField(emailEl, emailErr);
      const c = _validateField(msgEl,   msgErr);
      return a && b && c;
    }

    /* ── Success / error UI ─────────────────────────────────── */

    function _showSuccess(rootEl) {
      rootEl.innerHTML = `
        <div class="ct-success" role="status" aria-live="polite">
          <div class="ct-success-icon" aria-hidden="true">✉️</div>
          <p class="ct-success-title">Message noted — I'll get back to you!</p>
          <p class="ct-success-msg">
            Thanks for reaching out. I usually reply within a day or two.
          </p>
          <button class="ct-success-back" id="${iid}-back" type="button">
            ← Send another
          </button>
        </div>`;

      // "Send another" — recreate the form by re-initialising
      document.getElementById(`${iid}-back`)?.addEventListener('click', () => {
        rootEl.innerHTML = _formInnerHTML();
        _wireForm(rootEl);
      });
    }

    function _showSending(submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="ct-spinner" aria-hidden="true"></span>
        Sending…`;
    }

    function _resetSubmit(submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
             xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M1.5 7h11M8.5 3.5L12 7l-3.5 3.5"
                stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Send message`;
    }

    /* ── Form HTML factory (used for "send another") ─────────── */

    function _formInnerHTML() {
      return `
        <div class="ct-header">
          <h2 class="ct-title">Get in touch</h2>
          <p class="ct-subtitle">
            Fill out the form and I'll get back to you as soon as I can.
          </p>
        </div>
        <form class="ct-form" id="${iid}-form" novalidate>
          <div class="ct-row-2">
            <div class="ct-field-group">
              <label class="ct-label" for="${iid}-name">Name</label>
              <input class="ct-input" id="${iid}-name" name="name"
                     type="text" autocomplete="name"
                     placeholder="Your name" required />
              <span class="ct-error-msg" id="${iid}-name-err">Please enter your name.</span>
            </div>
            <div class="ct-field-group">
              <label class="ct-label" for="${iid}-email">Email</label>
              <input class="ct-input" id="${iid}-email" name="email"
                     type="email" autocomplete="email"
                     placeholder="you@example.com" required />
              <span class="ct-error-msg" id="${iid}-email-err">Please enter a valid email.</span>
            </div>
          </div>
          <div class="ct-field-group">
            <label class="ct-label" for="${iid}-msg">Message</label>
            <textarea class="ct-textarea" id="${iid}-msg" name="message"
                      placeholder="What's on your mind?" required></textarea>
            <span class="ct-error-msg" id="${iid}-msg-err">Please write a message.</span>
          </div>
          <div class="ct-form-footer">
            <span class="ct-form-note">All fields are required.</span>
            <button class="ct-submit" id="${iid}-submit" type="submit">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1.5 7h11M8.5 3.5L12 7l-3.5 3.5"
                      stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Send message
            </button>
          </div>
        </form>`;
    }

    /* ── Wire submit logic ──────────────────────────────────── */

    function _wireForm(rootEl) {
      const form     = document.getElementById(`${iid}-form`);
      const nameEl   = document.getElementById(`${iid}-name`);
      const emailEl  = document.getElementById(`${iid}-email`);
      const msgEl    = document.getElementById(`${iid}-msg`);
      const nameErr  = document.getElementById(`${iid}-name-err`);
      const emailErr = document.getElementById(`${iid}-email-err`);
      const msgErr   = document.getElementById(`${iid}-msg-err`);
      const submitBtn = document.getElementById(`${iid}-submit`);

      if (!form) return;

      // Clear error state on input
      [nameEl, emailEl, msgEl].forEach(el => {
        el?.addEventListener('input', () => {
          el.classList.remove('ct-error');
          const err = document.getElementById(`${el.id}-err`);
          if (err) err.classList.remove('visible');
        });
      });

      // Submit
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const valid = _validateAll(nameEl, emailEl, msgEl, nameErr, emailErr, msgErr);
        if (!valid) {
          // Focus the first invalid field
          form.querySelector('.ct-error')?.focus();
          return;
        }

        const payload = {
          name:    nameEl.value.trim(),
          email:   emailEl.value.trim(),
          message: msgEl.value.trim(),
        };

        _showSending(submitBtn);

        try {
          await _sendMessage(payload);
          _showSuccess(rootEl);
        } catch (err) {
          console.error('[Contact] Send failed:', err);
          _resetSubmit(submitBtn);

          // Show a brief inline error below the form
          let errBanner = document.getElementById(`${iid}-send-err`);
          if (!errBanner) {
            errBanner = document.createElement('p');
            errBanner.id = `${iid}-send-err`;
            errBanner.style.cssText = 'color:#f38ba8;font-size:12px;margin-top:4px;';
            form.appendChild(errBanner);
          }
          errBanner.textContent = 'Something went wrong — please try again.';
        }
      });
    }

    /* ── Init ────────────────────────────────────────────────── */

    function init(windowId) {
      const rootEl = document.getElementById(iid);
      if (!rootEl) {
        console.error('[Contact] Root element not found:', iid);
        return;
      }
      _wireForm(rootEl);
    }

    return { html, init };
  }

  /* ══════════════════════════════════════════════════════════
     REGISTER LAUNCHER
     ══════════════════════════════════════════════════════════ */

  window.APP_LAUNCHERS = window.APP_LAUNCHERS || {};

  window.APP_LAUNCHERS['contact'] = function openContact() {
    if (!window.WM) { console.error('[Contact] WM not loaded.'); return; }

    const instance = createInstance();

    const winId = window.WM.open('contact', {
      title:   'Contact',
      icon:    '✉️',
      width:   560,
      height:  460,
      content: instance.html,
    });

    if (winId !== null) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => instance.init(winId))
      );
    }
  };

})();
