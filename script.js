(() => {
  'use strict';

  const CODE = 'nanohydroxyapatite';

  const landing  = document.getElementById('landing');
  const lock     = document.getElementById('lock');
  const enterBtn = document.getElementById('enter-btn');
  const typedEl  = document.getElementById('typed');
  const progress = document.getElementById('progress-fill');
  const hintEl   = document.getElementById('hint');
  const hiddenIn = document.getElementById('hidden-input');

  const HINT_TEXT = 'hint: it is the mineral in your bones and teeth.';

  let locked  = false;
  let buffer  = '';
  let hintTO  = null;

  /* ---------- fullscreen / pointer lock ---------- */

  function enterFullscreen() {
    const el = document.documentElement;
    const fn = el.requestFullscreen ||
               el.webkitRequestFullscreen ||
               el.mozRequestFullScreen ||
               el.msRequestFullscreen;
    if (!fn) return;
    try {
      const r = fn.call(el, { navigationUI: 'hide' });
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch (_) {}
  }

  function lockPointer() {
    if (!lock.requestPointerLock) return;
    try {
      const r = lock.requestPointerLock({ unadjustedMovement: true });
      if (r && typeof r.catch === 'function') {
        r.catch(() => { try { lock.requestPointerLock(); } catch (_) {} });
      }
    } catch (_) {
      try { lock.requestPointerLock(); } catch (_) {}
    }
  }

  function reacquire() {
    if (!locked) return;
    const inFs = document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement;
    if (!inFs) enterFullscreen();
    if (document.pointerLockElement !== lock) lockPointer();
  }

  /* ---------- state ---------- */

  function engage() {
    if (locked) return;
    locked = true;
    buffer = '';
    render();

    landing.classList.add('hidden');
    lock.classList.add('active');
    lock.setAttribute('aria-hidden', 'false');

    enterFullscreen();
    lockPointer();

    // mobile keyboard
    try { hiddenIn.focus({ preventScroll: true }); } catch (_) { hiddenIn.focus(); }

    hintTO = setTimeout(() => { hintEl.textContent = HINT_TEXT; }, 45000);
  }

  function release() {
    locked = false;
    clearTimeout(hintTO);
    hintEl.textContent = '';

    lock.classList.remove('active');
    lock.classList.add('released');

    try { document.exitFullscreen && document.exitFullscreen(); } catch (_) {}
    try { document.exitPointerLock && document.exitPointerLock(); } catch (_) {}

    setTimeout(() => {
      lock.classList.remove('released');
      lock.setAttribute('aria-hidden', 'true');
      landing.classList.remove('hidden');
      landing.classList.add('done');
      try { hiddenIn.blur(); } catch (_) {}
    }, 850);
  }

  function render() {
    // reset buffer if it diverges from the code prefix
    if (!CODE.startsWith(buffer)) {
      const last = buffer.slice(-1);
      buffer = CODE.startsWith(last) ? last : '';
    }
    typedEl.textContent = buffer || '·';
    progress.style.width = (buffer.length / CODE.length * 100) + '%';
  }

  function feed(ch) {
    if (!locked) return;
    buffer += ch.toLowerCase();
    // cap length so a stuck buffer can't grow forever
    if (buffer.length > CODE.length) buffer = buffer.slice(-CODE.length);
    render();
    if (buffer === CODE) release();
  }

  /* ---------- wire up ---------- */

  enterBtn.addEventListener('click', engage);

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
    .forEach(ev => {
      document.addEventListener(ev, () => {
        if (!locked) return;
        const inFs = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement;
        if (!inFs) setTimeout(reacquire, 220);
      });
    });

  document.addEventListener('pointerlockchange', () => {
    if (!locked) return;
    if (document.pointerLockElement !== lock) setTimeout(reacquire, 120);
  });

  /* ---------- input suppression ---------- */

  const hardBlock = [
    'contextmenu', 'selectstart', 'dragstart', 'drag', 'drop',
    'copy', 'cut', 'paste',
    'auxclick', 'wheel',
    'touchstart', 'touchmove', 'touchend', 'touchcancel',
    'gesturestart', 'gesturechange', 'gestureend'
  ];

  hardBlock.forEach(ev => {
    document.addEventListener(ev, e => {
      if (!locked) return;
      e.preventDefault();
      e.stopPropagation();
    }, { capture: true, passive: false });
  });

  ['mousedown', 'mouseup', 'click', 'dblclick'].forEach(ev => {
    document.addEventListener(ev, e => {
      if (!locked) return;
      e.preventDefault();
      e.stopPropagation();
      // fresh user gesture -> re-take fullscreen + pointer lock
      reacquire();
    }, { capture: true });
  });

  window.addEventListener('keydown', e => {
    if (!locked) return;

    // These are browser-owned. We can't stop them; reacquire right after.
    if (e.key === 'Escape' || e.key === 'F11' ||
        (e.ctrlKey && (e.key === 'w' || e.key === 'W' || e.key === 't' || e.key === 'T' || e.key === 'n' || e.key === 'N')) ||
        (e.altKey && e.key === 'F4') ||
        (e.metaKey && e.key === 'q')) {
      setTimeout(reacquire, 260);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Backspace') {
      buffer = buffer.slice(0, -1);
      render();
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') return;
    if (e.key.length === 1) feed(e.key);
  }, { capture: true });

  window.addEventListener('keyup', e => {
    if (!locked) return;
    e.preventDefault();
    e.stopPropagation();
  }, { capture: true });

  /* ---------- mobile keyboard path ---------- */
  // soft keyboards often don't produce reliable keydown events; use `input`.
  hiddenIn.addEventListener('input', () => {
    if (!locked) { hiddenIn.value = ''; return; }
    const v = hiddenIn.value;
    hiddenIn.value = '';
    for (const ch of v) {
      if (ch.length === 1) feed(ch);
      if (!locked) return;
    }
  });

  /* ---------- keep focus on hidden input for mobile ---------- */
  document.addEventListener('focusin', e => {
    if (locked && e.target !== hiddenIn) {
      try { hiddenIn.focus({ preventScroll: true }); } catch (_) {}
    }
  });

  /* ---------- tab blur / visibility: reacquire on return ---------- */
  window.addEventListener('blur', () => { if (locked) setTimeout(reacquire, 320); });
  window.addEventListener('focus', () => { if (locked) reacquire(); });

  /* ---------- block navigation attempts ---------- */
  window.addEventListener('beforeunload', e => {
    if (!locked) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  });

  // disable drag/select globally (harmless when unlocked)
  document.addEventListener('dragstart', e => e.preventDefault());
})();
