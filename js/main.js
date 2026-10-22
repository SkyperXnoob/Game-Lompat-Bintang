// ============================================================
//  js/main.js — Entry Point & Screen Manager
//  Mengelola perpindahan antar: menu, platformer, snake, memory
// ============================================================

// ---- SCREEN ENUM ----
const SCREENS = {
  MENU:   'menu',
  GAME:   'game',
  SNAKE:  'snake',
  MEMORY: 'memory',
};

let currentScreen = SCREENS.MENU;
let mainTime      = 0;   // frame counter global

// ---- CANVAS ----
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
// CAM_W dan CAM_H didefinisikan di js/game.js (800 x 450)

// ---- INPUT ----
// GameInput dibaca oleh js/game.js lewat window.GameInput
window.GameInput = {
  left: false, right: false, jump: false,
  touchLeft: false, touchRight: false, touchJump: false,
};

const keys = {};

document.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = true;
  window.GameInput.left  = !!(keys['ArrowLeft']  || keys['KeyA']);
  window.GameInput.right = !!(keys['ArrowRight'] || keys['KeyD']);
  window.GameInput.jump  = !!(keys['Space'] || keys['ArrowUp'] || keys['KeyW']);

  // Routing tombol ke layar aktif
  if (currentScreen === SCREENS.MENU) {
    window.Menu.keyDown(e.code);
  } else if (currentScreen === SCREENS.GAME) {
    window.Game.gameHandleKey(e.code);
    if (e.code === 'Escape') goMenu();
  } else if (currentScreen === SCREENS.SNAKE) {
    window.SnakeGame.keyDown(e.code);
  } else if (currentScreen === SCREENS.MEMORY) {
    window.MemoryGame.keyDown(e.code);
  }
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
  window.GameInput.left  = !!(keys['ArrowLeft']  || keys['KeyA']);
  window.GameInput.right = !!(keys['ArrowRight'] || keys['KeyD']);
  window.GameInput.jump  = !!(keys['Space'] || keys['ArrowUp'] || keys['KeyW']);
});

// ---- POINTER (mouse & sentuh canvas) ----
canvas.addEventListener('pointerdown', e => {
  window.Audio_.unlockAudio();
  const { x: px, y: py } = _canvasPos(e);

  if (currentScreen === SCREENS.MENU) {
    window.Menu.pointerDown(px, py, CAM_W, CAM_H);
  } else if (currentScreen === SCREENS.GAME) {
    window.Game.gameHandlePointer(px, py);
  } else if (currentScreen === SCREENS.SNAKE) {
    window.SnakeGame.pointerDown(px, py);
    window.SnakeGame.touchStart(px, py);
  } else if (currentScreen === SCREENS.MEMORY) {
    window.MemoryGame.pointerDown(px, py, CAM_W, CAM_H);
  }
});

canvas.addEventListener('pointerup', e => {
  if (currentScreen === SCREENS.SNAKE) {
    const { x: px, y: py } = _canvasPos(e);
    window.SnakeGame.touchEnd(px, py);
  }
});

canvas.addEventListener('pointermove', e => {
  const { x: px, y: py } = _canvasPos(e);
  if (currentScreen === SCREENS.MENU) {
    window.Menu.pointerMove(px, py, CAM_W, CAM_H);
  }
});

// ---- TOMBOL SENTUH ----
function bindTouch(id, prop) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const on  = () => { window.Audio_.unlockAudio(); window.GameInput[prop] = true;  btn.classList.add('pressed'); };
  const off = () => { window.GameInput[prop] = false; btn.classList.remove('pressed'); };
  btn.addEventListener('pointerdown',  e => { e.preventDefault(); on(); });
  btn.addEventListener('pointerup',    e => { e.preventDefault(); off(); });
  btn.addEventListener('pointerleave', e => { e.preventDefault(); off(); });
  btn.addEventListener('touchstart',   e => { e.preventDefault(); on(); }, { passive: false });
  btn.addEventListener('touchend',     e => { e.preventDefault(); off(); });
}
bindTouch('btnLeft',  'touchLeft');
bindTouch('btnRight', 'touchRight');
bindTouch('btnJump',  'touchJump');

// ---- KONVERSI KOORDINAT CANVAS ----
function _canvasPos(e) {
  const rect  = canvas.getBoundingClientRect();
  const scaleX = CAM_W / rect.width;
  const scaleY = CAM_H / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top)  * scaleY,
  };
}

// ---- NAVIGASI ----
function goMenu() {
  currentScreen = SCREENS.MENU;
  window.Menu.setScreen(window.Menu.SCREENS.MAIN);
  showTouchControls(false);
  window.Audio_.putarMusik('menu');
}

function launchGame(id) {
  if (id === 'lompat') {
    currentScreen = SCREENS.GAME;
    showTouchControls(true);
    window.Game.initNewGame();
  } else if (id === 'snake') {
    currentScreen = SCREENS.SNAKE;
    showTouchControls(false);
    window.SnakeGame.init();
    window.Audio_.putarMusik('game');
  } else if (id === 'memory') {
    currentScreen = SCREENS.MEMORY;
    showTouchControls(false);
    window.MemoryGame.init();
    window.Audio_.putarMusik('menu');
  }
}

function showTouchControls(visible) {
  const tc = document.getElementById('touchControls');
  if (!tc) return;
  tc.style.display = visible ? 'flex' : 'none';
}

// ---- GAME LOOP ----
function loop() {
  mainTime++;

  if (currentScreen === SCREENS.MENU) {
    window.Menu.render(ctx, CAM_W, CAM_H, mainTime);
  } else if (currentScreen === SCREENS.GAME) {
    window.Game.updateGame();
    window.Game.renderGame(ctx);
  } else if (currentScreen === SCREENS.SNAKE) {
    window.SnakeGame.update();
    window.SnakeGame.render(ctx, CAM_W, CAM_H);
  } else if (currentScreen === SCREENS.MEMORY) {
    window.MemoryGame.update();
    window.MemoryGame.render(ctx, CAM_W, CAM_H);
  }

  requestAnimationFrame(loop);
}

// ---- RESPONSIF ----
function resizeCanvas() {
  const wrapper = document.getElementById('wrapper');
  if (!wrapper) return;
  const maxW = Math.min(wrapper.clientWidth - 16, 800);
  canvas.style.width  = maxW + 'px';
  canvas.style.height = (maxW * (CAM_H / CAM_W)) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---- EKSPOR ----
window.Main = { goMenu, launchGame };

// ---- MULAI ----
goMenu();  // tampilkan menu utama dulu
loop();
