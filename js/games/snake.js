// ============================================================
//  js/games/snake.js — Mini Game Ular Manis
//  Tema: hijau pastel, kontrol panah/WASD, swipe layar HP
// ============================================================

const SNAKE_CELL  = 20;    // ukuran satu sel grid
const SNAKE_COLS  = 20;    // 400px lebar
const SNAKE_ROWS  = 18;    // 360px tinggi
const SNAKE_SPEED = 8;     // frame per gerak

const SNAKE_W = SNAKE_CELL * SNAKE_COLS;  // 400
const SNAKE_H = SNAKE_CELL * SNAKE_ROWS;  // 360

// Warna
const SC = {
  bg:      '#F0FFF0',
  grid:    'rgba(160,210,160,0.25)',
  snake:   '#5CB85C',
  snakeH:  '#3A9A3A',
  snakeB:  '#78C878',
  apple:   '#FF7070',
  appleH:  '#CC4040',
  text:    '#3A5A3A',
  textMut: '#7A9A7A',
  over_bg: 'rgba(220,255,220,0.92)',
  border:  '#A0D0A0',
};

// State
let snake, dir, nextDir, apple, snakeScore, snakeTime;
let snakeState;  // 'start' | 'playing' | 'over'
let snakeFrame;

// Swipe touch
let touchStartX = 0, touchStartY = 0;

function snakeInit() {
  snake = [
    { x: 10, y: 9 },
    { x: 9,  y: 9 },
    { x: 8,  y: 9 },
  ];
  dir      = { x: 1, y: 0 };
  nextDir  = { x: 1, y: 0 };
  snakeScore = 0;
  snakeTime  = 0;
  snakeFrame = 0;
  snakeState = 'playing';
  _spawnApple();
}

function _spawnApple() {
  let ax, ay, ok;
  do {
    ax = Math.floor(Math.random() * SNAKE_COLS);
    ay = Math.floor(Math.random() * SNAKE_ROWS);
    ok = !snake.some(s => s.x === ax && s.y === ay);
  } while (!ok);
  apple = { x: ax, y: ay };
}

// ---- UPDATE ----
function snakeUpdate() {
  if (snakeState !== 'playing') return;
  snakeTime++;
  if (snakeTime % SNAKE_SPEED !== 0) return;

  // Terapkan arah baru (tidak boleh berbalik langsung)
  if (!(nextDir.x === -dir.x && nextDir.y === -dir.y)) {
    dir = { ...nextDir };
  }

  const head = snake[0];
  const newHead = {
    x: (head.x + dir.x + SNAKE_COLS) % SNAKE_COLS,
    y: (head.y + dir.y + SNAKE_ROWS) % SNAKE_ROWS,
  };

  // Cek tabrakan diri
  if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
    snakeState = 'over';
    window.Audio_.putarEfek('gameover');
    return;
  }

  snake.unshift(newHead);

  // Makan apel
  if (newHead.x === apple.x && newHead.y === apple.y) {
    snakeScore++;
    window.Audio_.putarEfek('bintang');
    _spawnApple();
  } else {
    snake.pop();
  }
}

// ---- RENDER ----
function snakeRender(ctx, W, H) {
  // Tengahkan area game di canvas 800x450
  const offX = (W - SNAKE_W) / 2;
  const offY = (H - SNAKE_H) / 2 - 10;

  // Latar halaman
  ctx.fillStyle = '#F4FFF4';
  ctx.fillRect(0, 0, W, H);

  // Panel game
  ctx.fillStyle = SC.bg;
  ctx.strokeStyle = SC.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(offX - 2, offY - 2, SNAKE_W + 4, SNAKE_H + 4, 10);
  ctx.fill();
  ctx.stroke();

  // Grid
  ctx.strokeStyle = SC.grid;
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= SNAKE_COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(offX + c * SNAKE_CELL, offY);
    ctx.lineTo(offX + c * SNAKE_CELL, offY + SNAKE_H);
    ctx.stroke();
  }
  for (let r = 0; r <= SNAKE_ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(offX, offY + r * SNAKE_CELL);
    ctx.lineTo(offX + SNAKE_W, offY + r * SNAKE_CELL);
    ctx.stroke();
  }

  // Ular
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    const sx = offX + s.x * SNAKE_CELL;
    const sy = offY + s.y * SNAKE_CELL;
    ctx.fillStyle = i === 0 ? SC.snakeH : (i % 2 === 0 ? SC.snake : SC.snakeB);
    ctx.beginPath();
    ctx.roundRect(sx + 1, sy + 1, SNAKE_CELL - 2, SNAKE_CELL - 2, 5);
    ctx.fill();
    if (i === 0) {
      // Mata ular
      ctx.fillStyle = '#FFFFFF';
      const ex = dir.x >= 0 ? sx + SNAKE_CELL - 7 : sx + 4;
      ctx.beginPath(); ctx.arc(ex, sy + 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1A4A1A';
      ctx.beginPath(); ctx.arc(ex + dir.x, sy + 5, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Apel
  const ax = offX + apple.x * SNAKE_CELL;
  const ay = offY + apple.y * SNAKE_CELL;
  ctx.fillStyle = SC.apple;
  ctx.beginPath();
  ctx.arc(ax + SNAKE_CELL / 2, ay + SNAKE_CELL / 2, SNAKE_CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SC.appleH;
  ctx.beginPath();
  ctx.arc(ax + SNAKE_CELL / 2 - 2, ay + SNAKE_CELL / 2 - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  // Tangkai apel
  ctx.strokeStyle = '#7A4A20';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax + SNAKE_CELL / 2, ay + 2);
  ctx.lineTo(ax + SNAKE_CELL / 2 + 3, ay - 3);
  ctx.stroke();

  // Skor & info
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = SC.text;
  ctx.fillText(`🍎 Skor: ${snakeScore}`, offX, offY - 14);

  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = SC.textMut;
  ctx.fillText('← → ↑ ↓  untuk gerak  |  Esc = Menu', offX + SNAKE_W, offY - 14);

  // Overlay game over
  if (snakeState === 'over') {
    ctx.fillStyle = SC.over_bg;
    ctx.strokeStyle = SC.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(offX + SNAKE_W / 2 - 150, offY + SNAKE_H / 2 - 60, 300, 120, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#4A7A4A';
    ctx.fillText('🐍 Game Over!', offX + SNAKE_W / 2, offY + SNAKE_H / 2 - 18);
    ctx.font = '15px sans-serif';
    ctx.fillText(`Skor: ${snakeScore}`, offX + SNAKE_W / 2, offY + SNAKE_H / 2 + 10);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = SC.textMut;
    ctx.fillText('Enter / Spasi = Main Lagi   Esc = Menu', offX + SNAKE_W / 2, offY + SNAKE_H / 2 + 36);
  }

  // Layar start
  if (snakeState === 'start') {
    ctx.fillStyle = SC.over_bg;
    ctx.strokeStyle = SC.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(offX + SNAKE_W / 2 - 160, offY + SNAKE_H / 2 - 50, 320, 100, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#4A7A4A';
    ctx.fillText('🐍 Ular Manis', offX + SNAKE_W / 2, offY + SNAKE_H / 2 - 12);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = SC.textMut;
    ctx.fillText('Enter / Spasi / Ketuk untuk mulai', offX + SNAKE_W / 2, offY + SNAKE_H / 2 + 20);
  }
}

// ---- INPUT ----
function snakeKeyDown(code) {
  const map = {
    ArrowUp:    { x: 0, y: -1 },
    KeyW:       { x: 0, y: -1 },
    ArrowDown:  { x: 0, y:  1 },
    KeyS:       { x: 0, y:  1 },
    ArrowLeft:  { x: -1, y: 0 },
    KeyA:       { x: -1, y: 0 },
    ArrowRight: { x:  1, y: 0 },
    KeyD:       { x:  1, y: 0 },
  };
  if (code === 'Escape') { window.Main.goMenu(); return; }
  if ((code === 'Enter' || code === 'Space')) {
    if (snakeState === 'start' || snakeState === 'over') { snakeInit(); return; }
  }
  if (map[code]) nextDir = map[code];
}

function snakePointerDown(px, py) {
  window.Audio_.unlockAudio();
  if (snakeState !== 'playing') snakeInit();
}

function snakeTouchStart(px, py) { touchStartX = px; touchStartY = py; }
function snakeTouchEnd(px, py) {
  const dx = px - touchStartX;
  const dy = py - touchStartY;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
    if (snakeState !== 'playing') snakeInit();
    return;
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    nextDir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  } else {
    nextDir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
  }
}

// Inisialisasi awal (tampilkan layar start)
snakeState = 'start';
snake      = [];
apple      = { x: 10, y: 9 };

// Ekspor
window.SnakeGame = {
  init()  { snakeState = 'start'; },
  update: snakeUpdate,
  render: snakeRender,
  keyDown: snakeKeyDown,
  pointerDown: snakePointerDown,
  touchStart: snakeTouchStart,
  touchEnd: snakeTouchEnd,
};
