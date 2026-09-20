const CODE = 'nanohydroxyapatite';

const landing = document.getElementById('landing');
const lockScreen = document.getElementById('lock');
const enterBtn = document.getElementById('enter-btn');
const typedDisplay = document.getElementById('typed');
const hint = document.getElementById('hint');

let buffer = '';
let locked = false;

function requestLock() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  else if (el.msRequestFullscreen) el.msRequestFullscreen();

  const target = lockScreen;
  if (target.requestPointerLock) target.requestPointerLock({ unadjustedMovement: true }).catch(() => target.requestPointerLock());
}

enterBtn.addEventListener('click', () => {
  locked = true;
  landing.classList.add('hidden');
  lockScreen.classList.add('active');
  requestLock();
});

// keep trying to re-lock
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
  document.addEventListener(ev, () => {
    if (locked && !document.fullscreenElement && !document.webkitFullscreenElement) {
      // try re-enter on next interaction if possible
      setTimeout(() => {
        if (locked) {
          const el = document.documentElement;
          if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        }
      }, 0);
    }
  });
});

document.addEventListener('pointerlockchange', () => {
  if (locked && document.pointerLockElement !== lockScreen) {
    setTimeout(() => {
      if (locked && lockScreen.requestPointerLock) lockScreen.requestPointerLock();
    }, 0);
  }
});

// block everything
const blockEvents = ['contextmenu', 'selectstart', 'dragstart', 'copy', 'cut', 'paste'];
blockEvents.forEach(ev => document.addEventListener(ev, e => e.preventDefault()));

// keydown handling
document.addEventListener('keydown', e => {
  if (!locked) return;
  e.preventDefault();
  e.stopPropagation();

  // allow nothing except typing
  if (e.key.length === 1) {
    buffer += e.key.toLowerCase();
    if (buffer.length > CODE.length) buffer = buffer.slice(-CODE.length);
    updateDisplay();
    if (buffer === CODE) unlock();
  }
}, true);

// block other events too
['mousedown', 'mouseup', 'click', 'wheel', 'touchstart', 'touchmove'].forEach(ev => {
  document.addEventListener(ev, e => {
    if (locked) {
      e.preventDefault();
      e.stopPropagation();
      // re-request pointer lock on click
      if (ev === 'mousedown' && lockScreen.requestPointerLock && document.pointerLockElement !== lockScreen) {
        lockScreen.requestPointerLock();
      }
    }
  }, true);
});

function updateDisplay() {
  const shown = buffer.slice(-Math.min(buffer.length, 24));
  typedDisplay.textContent = shown || '·';
  // progress feedback
  const idx = CODE.indexOf(buffer);
  if (idx === -1 && buffer.length > 0) {
    // partial reset
    buffer = buffer.slice(-1);
    typedDisplay.textContent = buffer;
  }
}

function unlock() {
  locked = false;
  lockScreen.classList.remove('active');
  lockScreen.classList.add('unlocked');
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  if (document.exitPointerLock) document.exitPointerLock();
  setTimeout(() => {
    lockScreen.classList.remove('unlocked');
    document.body.classList.add('freed');
  }, 600);
}
