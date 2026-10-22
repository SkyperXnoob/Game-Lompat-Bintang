// ============================================================
//  js/game.js — Logika Platformer Lompat Bintang
//  Terintegrasi dengan levels.js, audio.js, dan main.js
// ============================================================

// ============================================================
// [1] CONFIG — konstanta fisika
// ============================================================
const CONFIG = {
  gravity:        0.55,
  maxFallSpeed:   14,
  moveAccel:      1.1,
  moveFriction:   0.78,
  maxMoveSpeed:   5.5,
  jumpForce:      -12.5,
  jumpHold:       -0.4,
  jumpHoldFrames: 12,
  coyoteTime:     8,
  jumpBuffer:     10,
  playerW:        28,
  playerH:        28,
};

// ============================================================
// [2] STATE GAME
// ============================================================
const GS = {
  PLAYING:      'playing',
  LEVEL_DONE:   'level_done',
  GAME_OVER:    'game_over',
  GAME_CLEAR:   'game_clear',
};

let gState       = GS.PLAYING;
let currentLevel = 0;    // indeks di array LEVELS
let score        = 0;
let totalScore   = 0;    // skor kumulatif antar-level
let lives        = 3;
let gameTime     = 0;
let bestScore    = 0;
let highestLevel = 0;    // level tertinggi yang sudah dicapai (0-based)

let levelData    = null; // referensi ke LEVELS[currentLevel]
let player       = {};
let enemies      = [];
let stars        = [];
let movPlats     = [];   // platform bergerak (salinan runtime)
let allPlatforms = [];   // cache platform solid untuk frame ini

// ============================================================
// [3] INISIALISASI
// ============================================================

function startLevel(levelIdx, keepLives = false) {
  currentLevel = levelIdx;
  levelData    = window.LEVELS[levelIdx];

  score     = 0;
  gameTime  = 0;
  gState    = GS.PLAYING;

  if (!keepLives) lives = 3;

  // Load best score & highest level dari localStorage
  try {
    bestScore    = parseInt(localStorage.getItem('lompat_best') || '0');
    highestLevel = parseInt(localStorage.getItem('lompat_hlvl') || '0');
  } catch (_) {}

  // Reset pemain
  const ps = levelData.playerStart;
  player = {
    x: ps.x, y: ps.y,
    w: CONFIG.playerW, h: CONFIG.playerH,
    vx: 0, vy: 0,
    onGround: false,
    facingRight: true,
    coyoteCounter: 0,
    jumpBufferCounter: 0,
    jumpHoldCounter: 0,
    isJumping: false,
    invincible: 0,
    dead: false,
  };

  // Reset bintang
  stars = levelData.stars.map((s, i) => ({
    x: s.x, y: s.y,
    r: 8,
    collected: false,
    bobOffset: i * 0.5,
  }));

  // Reset musuh
  enemies = levelData.enemies.map(e => ({
    x: e.x, y: e.y,
    w: 26, h: 26,
    dir: 1,
    speed: levelData.enemySpeed || 1.4,
    patrolLeft:  e.patrolLeft,
    patrolRight: e.patrolRight,
    alive: true,
    squishTimer: 0,
  }));

  // Reset platform bergerak — salinan penuh agar data asli tidak berubah
  movPlats = (levelData.movingPlatforms || []).map(p => ({
    x: p.x, y: p.y, w: p.w, h: p.h,
    axis: p.axis, min: p.min, max: p.max, speed: p.speed,
    _pos: p.axis === 'x' ? p.x : p.y,
    _dir: 1,
  }));

  // Kamera
  cam.x = 0;
  cam.y = 0;

  // Mainkan musik game
  window.Audio_.putarMusik('game');
}

function initNewGame() {
  totalScore = 0;
  startLevel(0, false);
}

// ============================================================
// [4] INPUT (dibaca dari window.GameInput)
// ============================================================
// Diisi oleh main.js lewat window.GameInput

function isLeft()  { const i = window.GameInput; return i && (i.left  || i.touchLeft);  }
function isRight() { const i = window.GameInput; return i && (i.right || i.touchRight); }
function isJump()  { const i = window.GameInput; return i && (i.jump  || i.touchJump);  }

// ============================================================
// [5] KAMERA
// ============================================================
const cam   = { x: 0, y: 0 };
const CAM_W = 800;
const CAM_H = 450;

function updateCamera() {
  const lw = levelData ? levelData.levelW : 2400;
  const targetX = player.x + player.w / 2 - CAM_W / 2;
  cam.x += (targetX - cam.x) * 0.12;
  cam.x = Math.max(0, Math.min(cam.x, lw - CAM_W));
}

// ============================================================
// [6] PLATFORM — termasuk yang bergerak
// ============================================================

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function buildPlatformList() {
  if (!levelData) { allPlatforms = []; return; }
  allPlatforms = [
    ...(levelData.groundSegments || []),
    ...(levelData.platforms || []),
    ...movPlats,
  ];
}

function updateMovingPlatforms() {
  for (const p of movPlats) {
    if (p.axis === 'x') {
      p._pos += p.speed * p._dir;
      if (p._pos <= p.min) { p._pos = p.min; p._dir = 1; }
      if (p._pos >= p.max) { p._pos = p.max; p._dir = -1; }
      p.x = p._pos;
    } else {
      p._pos += p.speed * p._dir;
      if (p._pos <= p.min) { p._pos = p.min; p._dir = 1; }
      if (p._pos >= p.max) { p._pos = p.max; p._dir = -1; }
      p.y = p._pos;
    }
  }
}

// ============================================================
// [7] FISIKA & TABRAKAN
// ============================================================
function updatePhysics() {
  const p = player;
  if (p.dead) return;

  if (isLeft())  p.vx -= CONFIG.moveAccel;
  if (isRight()) p.vx += CONFIG.moveAccel;
  p.vx = Math.max(-CONFIG.maxMoveSpeed, Math.min(CONFIG.maxMoveSpeed, p.vx));

  if (!isLeft() && !isRight()) {
    p.vx *= CONFIG.moveFriction;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;
  }

  if (p.vx > 0.2) p.facingRight = true;
  else if (p.vx < -0.2) p.facingRight = false;

  // Jump buffer
  if (isJump()) p.jumpBufferCounter = CONFIG.jumpBuffer;
  else p.jumpBufferCounter = Math.max(0, p.jumpBufferCounter - 1);

  // Coyote time
  if (p.onGround) p.coyoteCounter = CONFIG.coyoteTime;
  else p.coyoteCounter = Math.max(0, p.coyoteCounter - 1);

  // Lompat
  if (p.jumpBufferCounter > 0 && p.coyoteCounter > 0 && !p.isJumping) {
    p.vy = CONFIG.jumpForce;
    p.isJumping = true;
    p.jumpHoldCounter = CONFIG.jumpHoldFrames;
    p.jumpBufferCounter = 0;
    p.coyoteCounter = 0;
    p.onGround = false;
    window.Audio_.putarEfek('lompat');
  }

  if (p.isJumping && p.jumpHoldCounter > 0 && isJump()) {
    p.vy += CONFIG.jumpHold;
    p.jumpHoldCounter--;
  }
  if (!isJump()) {
    p.isJumping = false;
    p.jumpHoldCounter = 0;
  }

  p.vy += CONFIG.gravity;
  p.vy = Math.min(p.vy, CONFIG.maxFallSpeed);

  p.x += p.vx;
  p.y += p.vy;

  const lw = levelData ? levelData.levelW : 2400;
  p.x = Math.max(0, Math.min(p.x, lw - p.w));

  // Tabrakan platform
  p.onGround = false;
  for (const plat of allPlatforms) {
    if (!rectsOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) continue;

    const prevBottom = p.y + p.h - p.vy;
    if (p.vy >= 0 && prevBottom <= plat.y + 2) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.onGround = true;
    } else if (p.vy < 0) {
      if ((p.y - p.vy) >= plat.y + plat.h) {
        p.y = plat.y + plat.h;
        p.vy = 0;
      }
    }
    if (!p.onGround) {
      const prevRight = p.x + p.w - p.vx;
      const prevLeft  = p.x - p.vx;
      if (prevRight <= plat.x + 2)        { p.x = plat.x - p.w; p.vx = 0; }
      else if (prevLeft >= plat.x + plat.w - 2) { p.x = plat.x + plat.w; p.vx = 0; }
    }
  }

  // Jatuh ke jurang
  if (p.y > 510) handlePlayerHurt(true);

  if (p.invincible > 0) p.invincible--;
}

function handlePlayerHurt(fell = false) {
  if (player.invincible > 0) return;
  window.Audio_.putarEfek('nyawa');
  lives--;
  if (lives <= 0) {
    gState = GS.GAME_OVER;
    return;
  }
  if (!levelData) return;
  const ps = levelData.playerStart;
  player.x = ps.x; player.y = ps.y;
  player.vx = 0; player.vy = 0;
  player.invincible = 90;
}

// ============================================================
// [8] DURI
// ============================================================
function checkSpikes() {
  if (player.invincible > 0) return;
  for (const sp of (levelData.spikes || [])) {
    if (rectsOverlap(player.x, player.y, player.w, player.h, sp.x, sp.y, sp.w, sp.h)) {
      handlePlayerHurt(false);
      return;
    }
  }
}

// ============================================================
// [9] MUSUH
// ============================================================
function updateEnemies() {
  for (const e of enemies) {
    if (!e.alive) {
      e.squishTimer = Math.max(0, e.squishTimer - 1);
      continue;
    }

    e.x += e.dir * e.speed;
    if (e.x <= e.patrolLeft)          { e.x = e.patrolLeft;           e.dir = 1; }
    if (e.x + e.w >= e.patrolRight)   { e.x = e.patrolRight - e.w;   e.dir = -1; }
    e.y = 380 - e.h;

    if (player.invincible > 0 || player.dead) continue;
    if (!rectsOverlap(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) continue;

    const prevBottom = player.y + player.h - player.vy;
    if (player.vy > 0 && prevBottom <= e.y + 6) {
      e.alive = false;
      e.squishTimer = 30;
      player.vy = -8;
      score += 2;
      window.Audio_.putarEfek('injak');
    } else {
      handlePlayerHurt(false);
    }
  }
}

// ============================================================
// [10] BINTANG & BENDERA
// ============================================================
function updateStars() {
  for (const s of stars) {
    if (s.collected) continue;
    if (rectsOverlap(player.x, player.y, player.w, player.h,
                     s.x - s.r, s.y - s.r, s.r * 2, s.r * 2)) {
      s.collected = true;
      score++;
      window.Audio_.putarEfek('bintang');
    }
  }
}

function checkFlag() {
  if (!levelData) return;
  const f = levelData.flag;
  if (!rectsOverlap(player.x, player.y, player.w, player.h, f.x, f.y - 60, 12, 80)) return;

  totalScore += score;
  window.Audio_.putarEfek('levelSelesai');

  // Simpan progress ke localStorage
  try {
    if (totalScore > bestScore) {
      bestScore = totalScore;
      localStorage.setItem('lompat_best', bestScore);
    }
    if (currentLevel > highestLevel) {
      highestLevel = currentLevel;
      localStorage.setItem('lompat_hlvl', highestLevel);
    }
  } catch (_) {}

  // Cek apakah ini level terakhir
  if (currentLevel >= window.LEVELS.length - 1) {
    gState = GS.GAME_CLEAR;
  } else {
    gState = GS.LEVEL_DONE;
  }
}

// ============================================================
// [11] WARNA & ASET VISUAL
// ============================================================
const C = {
  sky1: '#FFF5F8', sky2: '#FFD6E4',
  ground: '#F7B6CC', groundTop: '#FFE3EC',
  platform: '#F7B6CC', platTop: '#FFE3EC',
  movPlat: '#E8A0C8', movPlatTop: '#F5C8DC',
  player: '#FFFFFF', playerCheek: '#FFBCCC', playerEye: '#5A3A4A',
  star: '#FFE9A8', starStroke: '#F5C842',
  enemy: '#C9B6F2', enemyEye: '#FFFFFF',
  flag: '#FFFFFF', flagCloth: '#F7B6CC',
  hud: '#6B4A5E',
  spike: '#B8A0C8', spikeStroke: '#8A6A9A',
};

const CLOUDS = [
  { x: 80,   y: 40,  r: 38, layer: 0.3 },
  { x: 320,  y: 60,  r: 28, layer: 0.3 },
  { x: 550,  y: 30,  r: 45, layer: 0.5 },
  { x: 800,  y: 55,  r: 32, layer: 0.5 },
  { x: 1050, y: 35,  r: 40, layer: 0.3 },
  { x: 1300, y: 65,  r: 28, layer: 0.5 },
  { x: 1600, y: 40,  r: 38, layer: 0.3 },
  { x: 1900, y: 55,  r: 34, layer: 0.5 },
  { x: 2200, y: 38,  r: 42, layer: 0.3 },
  { x: 2500, y: 50,  r: 36, layer: 0.3 },
  { x: 2800, y: 40,  r: 44, layer: 0.5 },
];

const HILLS = [
  { x: 0,    y: 330, rx: 220, ry: 80,  layer: 0.2 },
  { x: 350,  y: 360, rx: 180, ry: 60,  layer: 0.2 },
  { x: 700,  y: 340, rx: 240, ry: 90,  layer: 0.35 },
  { x: 1100, y: 355, rx: 200, ry: 70,  layer: 0.35 },
  { x: 1500, y: 330, rx: 260, ry: 85,  layer: 0.2 },
  { x: 1900, y: 350, rx: 200, ry: 75,  layer: 0.35 },
  { x: 2400, y: 335, rx: 230, ry: 80,  layer: 0.2 },
  { x: 2750, y: 355, rx: 210, ry: 70,  layer: 0.35 },
];

// ============================================================
// [12] RENDERING
// ============================================================

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, CAM_H);
  grad.addColorStop(0, C.sky1);
  grad.addColorStop(1, C.sky2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CAM_W, CAM_H);

  ctx.fillStyle = '#FFD0DF';
  for (const h of HILLS) {
    const hx = h.x - cam.x * h.layer;
    ctx.beginPath();
    ctx.ellipse(hx, h.y, h.rx, h.ry, 0, Math.PI, 0, true);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  for (const cl of CLOUDS) {
    const cx = cl.x - cam.x * cl.layer;
    drawCloud(ctx, cx, cl.y, cl.r);
  }
}

function drawCloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x - r * 0.8, y + r * 0.25, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms(ctx) {
  // Tanah
  for (const seg of (levelData.groundSegments || [])) {
    const sx = seg.x - cam.x;
    ctx.fillStyle = C.ground;
    ctx.beginPath(); ctx.roundRect(sx, seg.y, seg.w, seg.h, 8); ctx.fill();
    ctx.fillStyle = C.groundTop;
    ctx.fillRect(sx, seg.y, seg.w, 5);
  }
  // Platform statis
  for (const plat of (levelData.platforms || [])) {
    const px = plat.x - cam.x;
    ctx.fillStyle = C.platform;
    ctx.beginPath(); ctx.roundRect(px, plat.y, plat.w, plat.h, 6); ctx.fill();
    ctx.fillStyle = C.platTop;
    ctx.fillRect(px, plat.y, plat.w, 5);
  }
  // Platform bergerak (warna berbeda)
  for (const plat of movPlats) {
    const px = plat.x - cam.x;
    ctx.fillStyle = C.movPlat;
    ctx.beginPath(); ctx.roundRect(px, plat.y, plat.w, plat.h, 6); ctx.fill();
    ctx.fillStyle = C.movPlatTop;
    ctx.fillRect(px, plat.y, plat.w, 5);
  }
}

function drawSpikes(ctx) {
  for (const sp of (levelData.spikes || [])) {
    const sx = sp.x - cam.x;
    // Gambar duri sebagai segitiga-segitiga
    ctx.fillStyle = C.spike;
    ctx.strokeStyle = C.spikeStroke;
    ctx.lineWidth = 1;
    const count = Math.floor(sp.w / 8);
    for (let i = 0; i < count; i++) {
      const tx = sx + i * 8;
      ctx.beginPath();
      ctx.moveTo(tx, sp.y + sp.h);
      ctx.lineTo(tx + 4, sp.y);
      ctx.lineTo(tx + 8, sp.y + sp.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx) {
  const p = player;
  const px = p.x - cam.x;
  const py = p.y;

  if (p.invincible > 0 && Math.floor(p.invincible / 5) % 2 === 0) return;

  ctx.save();
  ctx.fillStyle = C.player;
  ctx.strokeStyle = '#E8A0B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, py, p.w, p.h, 6);
  ctx.fill();
  ctx.stroke();

  // Pipi
  ctx.fillStyle = C.playerCheek;
  ctx.globalAlpha = 0.6;
  const cheekX = p.facingRight ? px + p.w - 6 : px + 6;
  ctx.beginPath();
  ctx.ellipse(cheekX, py + p.h - 8, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Mata
  ctx.fillStyle = C.playerEye;
  const eBase = p.facingRight ? px + p.w - 8 : px + 8;
  const eOff  = p.facingRight ? -8 : 8;
  ctx.beginPath(); ctx.ellipse(eBase,        py + 10, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eBase + eOff, py + 10, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.ellipse(eBase + 1,        py + 9, 1.2, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(eBase + eOff + 1, py + 9, 1.2, 1.2, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawStars(ctx) {
  ctx.save();
  for (const s of stars) {
    if (s.collected) continue;
    const sx = s.x - cam.x;
    const bob = Math.sin(gameTime * 0.06 + s.bobOffset) * 4;
    ctx.fillStyle = C.star;
    ctx.strokeStyle = C.starStroke;
    ctx.lineWidth = 1.5;
    _drawStar5(ctx, sx, s.y + bob, s.r, s.r * 0.45);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemies(ctx) {
  for (const e of enemies) {
    const ex = e.x - cam.x;
    if (!e.alive) {
      if (e.squishTimer > 0) {
        ctx.save();
        ctx.globalAlpha = e.squishTimer / 30;
        ctx.fillStyle = C.enemy;
        ctx.beginPath();
        ctx.ellipse(ex + e.w / 2, e.y + e.h, e.w / 2 + 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      continue;
    }
    ctx.save();
    ctx.fillStyle = C.enemy;
    ctx.strokeStyle = '#A898D8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ex, e.y, e.w, e.h, 8);
    ctx.fill();
    ctx.stroke();

    const eyeOffX = e.dir > 0 ? e.w - 8 : 8;
    ctx.fillStyle = C.enemyEye;
    ctx.beginPath(); ctx.ellipse(ex + eyeOffX,     e.y + 10, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ex + eyeOffX - 9, e.y + 10, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5A3A4A';
    const pd = e.dir > 0 ? 1 : -1;
    ctx.beginPath(); ctx.ellipse(ex + eyeOffX + pd,     e.y + 10.5, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(ex + eyeOffX - 9 + pd, e.y + 10.5, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawFlag(ctx) {
  if (!levelData) return;
  const f = levelData.flag;
  const fx = f.x - cam.x;
  const fy = f.y;

  ctx.strokeStyle = '#D4A0B8';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx + 6, fy + 80);
  ctx.lineTo(fx + 6, fy - 20);
  ctx.stroke();

  ctx.fillStyle = C.flagCloth;
  ctx.beginPath();
  ctx.moveTo(fx + 6, fy - 20);
  ctx.lineTo(fx + 38, fy - 8);
  ctx.lineTo(fx + 6, fy + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#E890AA';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawHUD(ctx) {
  ctx.save();
  // Background HUD
  ctx.fillStyle = 'rgba(255,240,248,0.75)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 190, 72, 10);
  ctx.fill();

  ctx.font = 'bold 15px -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = C.hud;
  ctx.textAlign = 'left';

  // Level
  const ln = levelData ? levelData.nama : '';
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#B07898';
  ctx.fillText(`Level ${currentLevel + 1}: ${ln}`, 16, 24);

  // Skor
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = C.hud;
  ctx.fillText(`⭐ ${score}  (+${totalScore})`, 16, 44);

  // Nyawa
  let hearts = '';
  for (let i = 0; i < lives; i++) hearts += '♥';
  ctx.fillText(hearts, 16, 64);

  // Tombol mute kecil di kanan
  const muted = window.Audio_.getMuted();
  ctx.font = '18px sans-serif';
  ctx.fillText(muted ? '🔇' : '🔊', CAM_W - 34, 30);

  ctx.restore();
}

function drawOverlay(ctx, lines, boxH = 200) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,230,240,0.90)';
  ctx.strokeStyle = '#F7B6CC';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(CAM_W / 2 - 200, CAM_H / 2 - boxH / 2, 400, boxH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.font = line.font;
    ctx.fillStyle = line.color || C.hud;
    ctx.fillText(line.text, CAM_W / 2, CAM_H / 2 - boxH / 2 + 42 + i * line.gap);
  });
  ctx.restore();
}

function drawLevelDone(ctx) {
  const nextIdx = currentLevel + 1;
  const hasNext = nextIdx < window.LEVELS.length;
  drawOverlay(ctx, [
    { text: '🎉 Level Selesai!',   font: 'bold 26px sans-serif', gap: 38, color: '#7A3060' },
    { text: `Skor level: ${score}`, font: '16px sans-serif',       gap: 34, color: '#8B4070' },
    { text: hasNext
        ? `Tekan Enter / Spasi untuk lanjut ke Level ${nextIdx + 1}`
        : 'Tekan Enter / Spasi untuk lanjut',
                                   font: '13px sans-serif',       gap: 28, color: '#7A5068' },
  ], 170);
}

function drawGameOver(ctx) {
  drawOverlay(ctx, [
    { text: '💔 Game Over',       font: 'bold 26px sans-serif', gap: 38, color: '#8B2050' },
    { text: `Skor: ${score}`,     font: '16px sans-serif',       gap: 34, color: '#8B4070' },
    { text: 'Enter / Spasi = Coba lagi   Esc = Menu',
                                  font: '13px sans-serif',       gap: 28, color: '#7A5068' },
  ], 160);
}

function drawGameClear(ctx) {
  drawOverlay(ctx, [
    { text: '🌟 Selamat! Game Tamat!', font: 'bold 24px sans-serif',  gap: 36, color: '#7A3060' },
    { text: `Total skor: ${totalScore}`,font: '17px sans-serif',       gap: 32, color: '#8B4070' },
    { text: `Terbaik: ${bestScore}`,   font: '14px sans-serif',        gap: 28, color: '#A07898' },
    { text: 'Enter = Main lagi   Esc = Menu',
                                       font: '13px sans-serif',        gap: 26, color: '#7A5068' },
  ], 190);
}

function _drawStar5(ctx, cx, cy, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  ctx.closePath();
}

// ============================================================
// [13] RENDER UTAMA
// ============================================================
function renderGame(ctx) {
  if (!levelData) return;
  ctx.clearRect(0, 0, CAM_W, CAM_H);
  drawBackground(ctx);
  drawPlatforms(ctx);
  drawSpikes(ctx);
  drawFlag(ctx);
  drawStars(ctx);
  drawEnemies(ctx);
  drawPlayer(ctx);
  drawHUD(ctx);

  if (gState === GS.LEVEL_DONE)  drawLevelDone(ctx);
  if (gState === GS.GAME_OVER)   drawGameOver(ctx);
  if (gState === GS.GAME_CLEAR)  drawGameClear(ctx);
}

// ============================================================
// [14] UPDATE UTAMA
// ============================================================
function updateGame() {
  if (!levelData || gState !== GS.PLAYING) return;
  gameTime++;
  updateMovingPlatforms();
  buildPlatformList();
  updatePhysics();
  checkSpikes();
  updateEnemies();
  updateStars();
  checkFlag();
  updateCamera();
}

// Tangani input saat overlay ditampilkan
function gameHandleKey(code) {
  if (code === 'KeyM') {
    window.Audio_.toggleMute();
    return;
  }
  // Tombol mute di canvas (diklik bagian kanan atas)
  if (gState === GS.LEVEL_DONE) {
    if (code === 'Enter' || code === 'Space') {
      startLevel(currentLevel + 1, true); // bawa nyawa
    }
    if (code === 'Escape') window.Main.goMenu();
    return;
  }
  if (gState === GS.GAME_OVER) {
    if (code === 'Enter' || code === 'Space') initNewGame();
    if (code === 'Escape') window.Main.goMenu();
    return;
  }
  if (gState === GS.GAME_CLEAR) {
    if (code === 'Enter' || code === 'Space') initNewGame();
    if (code === 'Escape') window.Main.goMenu();
    return;
  }
}

function gameHandlePointer(px, py) {
  // Klik tombol mute kecil di HUD
  if (px >= CAM_W - 50 && px <= CAM_W - 14 && py >= 8 && py <= 44) {
    window.Audio_.toggleMute();
    return;
  }
  // Klik di overlay
  if (gState !== GS.PLAYING) {
    if (gState === GS.LEVEL_DONE) startLevel(currentLevel + 1, true);
    else if (gState === GS.GAME_OVER) initNewGame();
    else if (gState === GS.GAME_CLEAR) initNewGame();
  }
}

// ============================================================
// [15] EKSPOR
// ============================================================
window.Game = {
  initNewGame,
  startLevel,
  updateGame,
  renderGame,
  gameHandleKey,
  gameHandlePointer,
  CAM_W,
  CAM_H,
};
