// ============================================================
//  LOMPAT BINTANG by erine
//  game.js — Tahap 1 MVP: gerakan pemain, lompat, platform, kamera
// ============================================================

// ============================================================
// [1] CONFIG — konstanta fisika dan ukuran
// ============================================================
const CONFIG = {
  gravity:       0.55,    // percepatan jatuh per frame
  maxFallSpeed:  14,      // kecepatan jatuh maksimal
  moveAccel:     1.1,     // percepatan gerak horizontal
  moveFriction:  0.78,    // gesekan saat tidak menekan tombol
  maxMoveSpeed:  5.5,     // kecepatan maksimal horizontal
  jumpForce:     -12.5,   // kecepatan awal lompat
  jumpHold:      -0.4,    // tambahan kecepatan saat tahan tombol lompat
  jumpHoldFrames:12,      // berapa frame tahan lompat bisa diperpanjang
  coyoteTime:    8,       // frame masih bisa lompat setelah meninggalkan platform
  jumpBuffer:    10,      // frame buffer tekan lompat sebelum mendarat
  playerW:       28,
  playerH:       28,
  levelW:        2400,
  levelH:        450,
};

// ============================================================
// [2] LEVEL DATA — tanah, jurang, platform
// ============================================================

// Tanah didefinisikan sebagai segmen (ada 3 jurang)
// Setiap segmen: { x, y, w, h }
const GROUND_SEGMENTS = [
  { x: 0,    y: 380, w: 300,  h: 70 },   // segmen kiri
  { x: 360,  y: 380, w: 280,  h: 70 },   // setelah jurang 1
  { x: 700,  y: 380, w: 320,  h: 70 },   // setelah jurang 2
  { x: 1080, y: 380, w: 400,  h: 70 },   // segmen tengah
  { x: 1540, y: 380, w: 280,  h: 70 },   // setelah jurang 3
  { x: 1870, y: 380, w: 530,  h: 70 },   // segmen menuju bendera
];

// Platform melayang: { x, y, w, h }
const PLATFORMS = [
  { x: 160,  y: 300, w: 100, h: 16 },
  { x: 380,  y: 260, w: 120, h: 16 },
  { x: 560,  y: 220, w: 100, h: 16 },
  { x: 730,  y: 300, w: 90,  h: 16 },
  { x: 870,  y: 240, w: 110, h: 16 },
  { x: 1020, y: 300, w: 100, h: 16 },
  { x: 1130, y: 220, w: 120, h: 16 },
  { x: 1300, y: 280, w: 100, h: 16 },
  { x: 1460, y: 230, w: 110, h: 16 },
  { x: 1600, y: 290, w: 90,  h: 16 },
  { x: 1710, y: 230, w: 100, h: 16 },
  { x: 1850, y: 300, w: 110, h: 16 },
  { x: 2050, y: 240, w: 120, h: 16 },
  { x: 2220, y: 300, w: 100, h: 16 },
];

// Semua platform solid (tanah + platform melayang)
function getAllPlatforms() {
  return [...GROUND_SEGMENTS, ...PLATFORMS];
}

// Bintang: { x, y, collected, bobOffset }
const STARS_DATA = [
  { x: 185, y: 270 }, { x: 405, y: 230 }, { x: 580, y: 190 },
  { x: 760, y: 268 }, { x: 890, y: 210 }, { x: 1050, y: 268 },
  { x: 1160, y: 190 }, { x: 1320, y: 248 }, { x: 1480, y: 200 },
  { x: 1620, y: 258 }, { x: 1730, y: 200 }, { x: 2060, y: 210 },
  { x: 2240, y: 268 },
];

// Musuh: { x, y, w, h, dir, speed, patrolLeft, patrolRight, alive }
const ENEMIES_DATA = [
  { x: 500,  y: 356, patrolLeft: 380, patrolRight: 640  },
  { x: 1200, y: 356, patrolLeft: 1090, patrolRight: 1450 },
  { x: 1900, y: 356, patrolLeft: 1870, patrolRight: 2100 },
];

// Bendera: { x, y }
const FLAG = { x: 2330, y: 300 };

// ============================================================
// [3] STATE GAME
// ============================================================
const GAME_STATES = { START: 'start', PLAYING: 'playing', WIN: 'win', LOSE: 'lose' };

let gameState = GAME_STATES.START;
let score = 0;
let bestScore = 0;
let lives = 3;
let gameTime = 0; // frame counter

// Pemain
let player = {};
// Musuh (salinan dari ENEMIES_DATA)
let enemies = [];
// Bintang (salinan dari STARS_DATA)
let stars = [];

function initGame() {
  score = 0;
  lives = 3;
  gameTime = 0;

  // Reset pemain
  player = {
    x: 40, y: 340,
    w: CONFIG.playerW, h: CONFIG.playerH,
    vx: 0, vy: 0,
    onGround: false,
    facingRight: true,
    coyoteCounter: 0,
    jumpBufferCounter: 0,
    jumpHoldCounter: 0,
    isJumping: false,    // sedang menekan tombol lompat
    invincible: 0,       // frame invincibility setelah kena musuh
    dead: false,
  };

  // Reset bintang
  stars = STARS_DATA.map((s, i) => ({
    ...s,
    r: 8, // radius
    collected: false,
    bobOffset: i * 0.5, // agar tiap bintang bergerak naik-turun beda fase
  }));

  // Reset musuh
  enemies = ENEMIES_DATA.map(e => ({
    x: e.x, y: e.y,
    w: 26, h: 26,
    dir: 1,
    speed: 1.4,
    patrolLeft: e.patrolLeft,
    patrolRight: e.patrolRight,
    alive: true,
    squishTimer: 0, // animasi ketika diinjak
  }));
}

// ============================================================
// [4] INPUT
// ============================================================
const keys = {};

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  // Mulai/restart dengan Enter atau Space
  if (['Enter', 'Space'].includes(e.code)) {
    handleStartOrRestart();
  }
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Sentuh layar (klik) untuk mulai / restart
const canvas = document.getElementById('gameCanvas');
canvas.addEventListener('pointerdown', () => {
  handleStartOrRestart();
});

// Tombol sentuh
const touch = { left: false, right: false, jump: false };

function bindTouchBtn(id, prop) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('pointerdown',  e => { e.preventDefault(); touch[prop] = true;  btn.classList.add('pressed'); });
  btn.addEventListener('pointerup',    e => { e.preventDefault(); touch[prop] = false; btn.classList.remove('pressed'); });
  btn.addEventListener('pointerleave', e => { e.preventDefault(); touch[prop] = false; btn.classList.remove('pressed'); });
  btn.addEventListener('touchstart',   e => { e.preventDefault(); touch[prop] = true;  btn.classList.add('pressed'); }, { passive: false });
  btn.addEventListener('touchend',     e => { e.preventDefault(); touch[prop] = false; btn.classList.remove('pressed'); });
}
bindTouchBtn('btnLeft',  'left');
bindTouchBtn('btnRight', 'right');
bindTouchBtn('btnJump',  'jump');

function isLeft()  { return keys['ArrowLeft']  || keys['KeyA'] || touch.left; }
function isRight() { return keys['ArrowRight'] || keys['KeyD'] || touch.right; }
function isJump()  { return keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || touch.jump; }

function handleStartOrRestart() {
  if (gameState === GAME_STATES.START || gameState === GAME_STATES.WIN || gameState === GAME_STATES.LOSE) {
    initGame();
    gameState = GAME_STATES.PLAYING;
  }
}

// ============================================================
// [5] KAMERA
// ============================================================
const cam = { x: 0, y: 0 };
const CAM_W = 800;
const CAM_H = 450;

function updateCamera() {
  // Kamera mengikuti pemain secara horizontal, terpusat
  const targetX = player.x + player.w / 2 - CAM_W / 2;
  cam.x += (targetX - cam.x) * 0.12;  // smooth follow
  // Clamp agar tidak keluar level
  cam.x = Math.max(0, Math.min(cam.x, CONFIG.levelW - CAM_W));
  cam.y = 0;
}

// ============================================================
// [6] FISIKA & TABRAKAN
// ============================================================

// Deteksi AABB sederhana
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function updatePhysics() {
  const p = player;
  if (p.dead) return;

  // ---- INPUT HORIZONTAL ----
  if (isLeft())  p.vx -= CONFIG.moveAccel;
  if (isRight()) p.vx += CONFIG.moveAccel;

  // Clamp kecepatan horizontal
  p.vx = Math.max(-CONFIG.maxMoveSpeed, Math.min(CONFIG.maxMoveSpeed, p.vx));

  // Gesekan horizontal saat tidak menekan tombol
  if (!isLeft() && !isRight()) {
    p.vx *= CONFIG.moveFriction;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;
  }

  // ---- ARAH HADAP ----
  if (p.vx > 0.2) p.facingRight = true;
  else if (p.vx < -0.2) p.facingRight = false;

  // ---- JUMP BUFFER ----
  if (isJump()) {
    p.jumpBufferCounter = CONFIG.jumpBuffer;
  } else {
    p.jumpBufferCounter = Math.max(0, p.jumpBufferCounter - 1);
  }

  // ---- COYOTE TIME ----
  if (p.onGround) {
    p.coyoteCounter = CONFIG.coyoteTime;
  } else {
    p.coyoteCounter = Math.max(0, p.coyoteCounter - 1);
  }

  // ---- LOMPAT ----
  const canJump = p.coyoteCounter > 0 && !p.isJumping;
  if (p.jumpBufferCounter > 0 && canJump) {
    p.vy = CONFIG.jumpForce;
    p.isJumping = true;
    p.jumpHoldCounter = CONFIG.jumpHoldFrames;
    p.jumpBufferCounter = 0;
    p.coyoteCounter = 0;
    p.onGround = false; // segera tandai meninggalkan tanah
  }

  // Perpanjang lompatan saat tahan tombol
  if (p.isJumping && p.jumpHoldCounter > 0 && isJump()) {
    p.vy += CONFIG.jumpHold;
    p.jumpHoldCounter--;
  }
  if (!isJump()) {
    p.isJumping = false;
    p.jumpHoldCounter = 0;
  }

  // ---- GRAVITASI ----
  p.vy += CONFIG.gravity;
  p.vy = Math.min(p.vy, CONFIG.maxFallSpeed);

  // ---- GERAK POSISI ----
  p.x += p.vx;
  p.y += p.vy;

  // Clamp horizontal di level
  p.x = Math.max(0, Math.min(p.x, CONFIG.levelW - p.w));

  // ---- TABRAKAN PLATFORM ----
  p.onGround = false;
  const platforms = getAllPlatforms();

  for (const plat of platforms) {
    if (!rectsOverlap(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) continue;

    const prevBottom = p.y + p.h - p.vy; // posisi bawah sebelum update
    const platTop    = plat.y;

    if (p.vy >= 0 && prevBottom <= platTop + 2) {
      // Mendarat dari atas
      p.y = platTop - p.h;
      p.vy = 0;
      p.onGround = true;
    } else if (p.vy < 0) {
      // Benturan dari bawah
      const platBottom = plat.y + plat.h;
      const prevTop = p.y - p.vy;
      if (prevTop >= platBottom) {
        p.y = platBottom;
        p.vy = 0;
      }
    }
    // Benturan samping
    const prevRight = p.x + p.w - p.vx;
    const prevLeft  = p.x - p.vx;
    if (!p.onGround) {
      if (prevRight <= plat.x + 2) {
        p.x = plat.x - p.w;
        p.vx = 0;
      } else if (prevLeft >= plat.x + plat.w - 2) {
        p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }
  }

  // ---- JATUH KE JURANG ----
  if (p.y > CONFIG.levelH + 60) {
    handlePlayerHurt(true);
  }

  // ---- INVINCIBILITY COUNTDOWN ----
  if (p.invincible > 0) p.invincible--;
}

// Pemain terkena bahaya
function handlePlayerHurt(fell = false) {
  if (player.invincible > 0) return;
  lives--;
  if (lives <= 0) {
    gameState = GAME_STATES.LOSE;
    return;
  }
  // Respawn
  player.x = 40;
  player.y = 340;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 90; // ~1.5 detik kebal
}

// ============================================================
// [7] LOGIKA MUSUH
// ============================================================
function updateEnemies() {
  for (const e of enemies) {
    if (!e.alive) {
      e.squishTimer = Math.max(0, e.squishTimer - 1);
      continue;
    }

    // Patroli bolak-balik
    e.x += e.dir * e.speed;
    if (e.x <= e.patrolLeft)  { e.x = e.patrolLeft;  e.dir = 1; }
    if (e.x + e.w >= e.patrolRight) { e.x = e.patrolRight - e.w; e.dir = -1; }

    // Selalu di tanah (snap ke permukaan segmen tanah)
    e.y = 380 - e.h;

    if (player.invincible > 0 || player.dead) continue;

    // Tabrakan pemain vs musuh
    if (!rectsOverlap(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) continue;

    // Cek injak dari atas: pemain jatuh dari atas musuh
    const prevPlayerBottom = player.y + player.h - player.vy;
    if (player.vy > 0 && prevPlayerBottom <= e.y + 6) {
      // Injak musuh
      e.alive = false;
      e.squishTimer = 30;
      player.vy = -8; // pemain memantul
      score += 2;
    } else {
      // Kena dari samping
      handlePlayerHurt(false);
    }
  }
}

// ============================================================
// [8] LOGIKA BINTANG & BENDERA
// ============================================================
function updateStars() {
  for (const s of stars) {
    if (s.collected) continue;
    const sr = s.r;
    // Bounding box sederhana untuk bintang
    if (rectsOverlap(player.x, player.y, player.w, player.h,
                     s.x - sr, s.y - sr, sr * 2, sr * 2)) {
      s.collected = true;
      score++;
    }
  }
}

function checkFlag() {
  // Bendera: kolom 12px lebar, mulai dari atas
  if (rectsOverlap(player.x, player.y, player.w, player.h,
                   FLAG.x, FLAG.y - 60, 12, 80)) {
    if (score > bestScore) bestScore = score;
    gameState = GAME_STATES.WIN;
  }
}

// ============================================================
// [9] RENDERING
// ============================================================
const ctx = canvas.getContext('2d');

// -- Warna tema --
const C = {
  sky1:       '#FFF5F8',
  sky2:       '#FFD6E4',
  ground:     '#F7B6CC',
  groundTop:  '#FFE3EC',
  platform:   '#F7B6CC',
  platTop:    '#FFE3EC',
  player:     '#FFFFFF',
  playerCheek:'#FFBCCC',
  playerEye:  '#5A3A4A',
  star:       '#FFE9A8',
  starStroke: '#F5C842',
  enemy:      '#C9B6F2',
  enemyEye:   '#FFFFFF',
  flag:       '#FFFFFF',
  flagCloth:  '#F7B6CC',
  hud:        '#6B4A5E',
  cloud:      '#FFFFFF',
};

// -- Awan --
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
];

// -- Bukit parallax --
const HILLS = [
  { x: 0,    y: 330, rx: 220, ry: 80,  layer: 0.2 },
  { x: 350,  y: 360, rx: 180, ry: 60,  layer: 0.2 },
  { x: 700,  y: 340, rx: 240, ry: 90,  layer: 0.35 },
  { x: 1100, y: 355, rx: 200, ry: 70,  layer: 0.35 },
  { x: 1500, y: 330, rx: 260, ry: 85,  layer: 0.2 },
  { x: 1900, y: 350, rx: 200, ry: 75,  layer: 0.35 },
];

function drawBackground() {
  // Langit gradasi
  const grad = ctx.createLinearGradient(0, 0, 0, CAM_H);
  grad.addColorStop(0, C.sky1);
  grad.addColorStop(1, C.sky2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CAM_W, CAM_H);

  // Bukit parallax
  ctx.fillStyle = '#FFD0DF';
  for (const h of HILLS) {
    const hx = h.x - cam.x * h.layer;
    ctx.beginPath();
    ctx.ellipse(hx, h.y, h.rx, h.ry, 0, Math.PI, 0, true);
    ctx.fill();
  }

  // Awan
  ctx.fillStyle = C.cloud;
  for (const cl of CLOUDS) {
    const cx = cl.x - cam.x * cl.layer;
    ctx.globalAlpha = 0.82;
    drawCloud(cx, cl.y, cl.r);
    ctx.globalAlpha = 1;
  }
}

function drawCloud(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x - r * 0.8, y + r * 0.25, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  // Tanah
  for (const seg of GROUND_SEGMENTS) {
    const sx = seg.x - cam.x;
    ctx.fillStyle = C.ground;
    ctx.beginPath();
    ctx.roundRect(sx, seg.y, seg.w, seg.h, 8);
    ctx.fill();
    // Garis atas lebih terang
    ctx.fillStyle = C.groundTop;
    ctx.fillRect(sx, seg.y, seg.w, 5);
  }

  // Platform melayang
  for (const plat of PLATFORMS) {
    const px = plat.x - cam.x;
    ctx.fillStyle = C.platform;
    ctx.beginPath();
    ctx.roundRect(px, plat.y, plat.w, plat.h, 6);
    ctx.fill();
    ctx.fillStyle = C.platTop;
    ctx.fillRect(px, plat.y, plat.w, 5);
  }
}

function drawPlayer() {
  const p = player;
  const px = p.x - cam.x;
  const py = p.y;

  // Kedip saat invincible
  if (p.invincible > 0 && Math.floor(p.invincible / 5) % 2 === 0) return;

  ctx.save();

  // Tubuh
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
  if (p.facingRight) {
    ctx.beginPath();
    ctx.ellipse(px + p.w - 6, py + p.h - 8, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(px + 6, py + p.h - 8, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Mata (menghadap arah gerak)
  ctx.fillStyle = C.playerEye;
  if (p.facingRight) {
    ctx.beginPath();
    ctx.ellipse(px + p.w - 8,  py + 10, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + p.w - 16, py + 10, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(px + 8,  py + 10, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 10, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sorot mata (spekuler kecil)
  ctx.fillStyle = '#FFFFFF';
  if (p.facingRight) {
    ctx.beginPath();
    ctx.ellipse(px + p.w - 7, py + 9, 1.2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + p.w - 15, py + 9, 1.2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(px + 9,  py + 9, 1.2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 17, py + 9, 1.2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStars() {
  for (const s of stars) {
    if (s.collected) continue;
    const sx = s.x - cam.x;
    // Gerak naik-turun (bob)
    const bob = Math.sin(gameTime * 0.06 + s.bobOffset) * 4;
    const sy = s.y + bob;

    ctx.save();
    ctx.fillStyle = C.star;
    ctx.strokeStyle = C.starStroke;
    ctx.lineWidth = 1.5;
    drawStar5(sx, sy, s.r, s.r * 0.45);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Gambar bintang 5 titik
function drawStar5(cx, cy, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawEnemies() {
  for (const e of enemies) {
    const ex = e.x - cam.x;
    let ey = e.y;

    if (!e.alive) {
      if (e.squishTimer > 0) {
        // Animasi gepeng
        ctx.save();
        ctx.globalAlpha = e.squishTimer / 30;
        ctx.fillStyle = C.enemy;
        ctx.beginPath();
        ctx.ellipse(ex + e.w / 2, ey + e.h, e.w / 2 + 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      continue;
    }

    ctx.save();
    // Tubuh musuh
    ctx.fillStyle = C.enemy;
    ctx.strokeStyle = '#A898D8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ex, ey, e.w, e.h, 8);
    ctx.fill();
    ctx.stroke();

    // Mata musuh
    ctx.fillStyle = C.enemyEye;
    const eyeOffX = e.dir > 0 ? e.w - 8 : 8;
    ctx.beginPath();
    ctx.ellipse(ex + eyeOffX,     ey + 10, 4, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ex + eyeOffX - 9, ey + 10, 4, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#5A3A4A';
    ctx.beginPath();
    ctx.ellipse(ex + eyeOffX + (e.dir > 0 ? 1 : -1), ey + 10.5, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ex + eyeOffX - 9 + (e.dir > 0 ? 1 : -1), ey + 10.5, 2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawFlag() {
  const fx = FLAG.x - cam.x;
  const fy = FLAG.y;

  // Tiang
  ctx.strokeStyle = '#D4A0B8';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx + 6, fy + 80);
  ctx.lineTo(fx + 6, fy - 20);
  ctx.stroke();

  // Kain bendera
  ctx.fillStyle = C.flagCloth;
  ctx.beginPath();
  ctx.moveTo(fx + 6,  fy - 20);
  ctx.lineTo(fx + 38, fy - 8);
  ctx.lineTo(fx + 6,  fy + 10);
  ctx.closePath();
  ctx.fill();

  // Outline kain
  ctx.strokeStyle = '#E890AA';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawHUD() {
  ctx.save();
  ctx.font = 'bold 16px -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = C.hud;

  // Skor
  ctx.fillText(`⭐ Skor: ${score}`, 14, 28);

  // Nyawa (hati)
  let heartStr = '';
  for (let i = 0; i < lives; i++) heartStr += '♥ ';
  ctx.fillText(heartStr, 14, 50);

  // Best score
  if (bestScore > 0) {
    ctx.font = '13px -apple-system, Segoe UI, sans-serif';
    ctx.fillStyle = '#A07898';
    ctx.fillText(`Terbaik: ${bestScore}`, 14, 70);
  }
  ctx.restore();
}

// Overlay semi-transparan (layar awal, menang, kalah)
function drawOverlay(lines) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 230, 240, 0.88)';
  ctx.beginPath();
  ctx.roundRect(CAM_W / 2 - 180, CAM_H / 2 - 90, 360, 190, 20);
  ctx.fill();

  ctx.strokeStyle = '#F7B6CC';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.font = line.font;
    ctx.fillStyle = line.color || C.hud;
    ctx.fillText(line.text, CAM_W / 2, CAM_H / 2 - 50 + i * line.gap);
  });
  ctx.restore();
}

function drawStartScreen() {
  drawOverlay([
    { text: '⭐ Lompat Bintang', font: 'bold 26px sans-serif', gap: 40, color: '#8B4070' },
    { text: 'by erine',          font: '15px sans-serif',       gap: 34, color: '#B07898' },
    { text: '',                  font: '1px sans-serif',        gap: 30 },
    { text: 'Tekan Enter / Spasi / Ketuk untuk mulai',
                                 font: '13px sans-serif',       gap: 30, color: '#7A5068' },
    { text: '← → untuk gerak   ↑ / Spasi untuk lompat',
                                 font: '12px sans-serif',       gap: 28, color: '#A07898' },
  ]);
}

function drawWinScreen() {
  drawOverlay([
    { text: '🎉 Selamat! Kamu Menang!', font: 'bold 22px sans-serif', gap: 40, color: '#7A3060' },
    { text: `Skor: ${score}  |  Terbaik: ${bestScore}`,
                                       font: '16px sans-serif',       gap: 36, color: '#8B4070' },
    { text: '',                        font: '1px sans-serif',        gap: 26 },
    { text: 'Tekan Enter / Spasi untuk main lagi',
                                       font: '13px sans-serif',       gap: 30, color: '#7A5068' },
  ]);
}

function drawLoseScreen() {
  drawOverlay([
    { text: '💔 Game Over',     font: 'bold 26px sans-serif', gap: 40, color: '#8B2050' },
    { text: `Skor: ${score}`,   font: '16px sans-serif',       gap: 36, color: '#8B4070' },
    { text: '',                 font: '1px sans-serif',        gap: 26 },
    { text: 'Tekan Enter / Spasi untuk main lagi',
                                font: '13px sans-serif',       gap: 30, color: '#7A5068' },
  ]);
}

function render() {
  ctx.clearRect(0, 0, CAM_W, CAM_H);
  drawBackground();
  drawPlatforms();
  drawFlag();
  drawStars();
  drawEnemies();
  drawPlayer();
  drawHUD();

  if (gameState === GAME_STATES.START)   drawStartScreen();
  if (gameState === GAME_STATES.WIN)     drawWinScreen();
  if (gameState === GAME_STATES.LOSE)    drawLoseScreen();
}

// ============================================================
// [10] GAME LOOP
// ============================================================
function update() {
  if (gameState !== GAME_STATES.PLAYING) return;
  gameTime++;
  updatePhysics();
  updateEnemies();
  updateStars();
  checkFlag();
  updateCamera();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// ============================================================
// [11] RESPONSIF — skala canvas ke lebar layar
// ============================================================
function resizeCanvas() {
  const wrapper = document.getElementById('wrapper');
  const maxW = Math.min(wrapper.clientWidth - 16, 800);
  canvas.style.width  = maxW + 'px';
  canvas.style.height = (maxW * (CAM_H / CAM_W)) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ============================================================
// [12] MULAI
// ============================================================
initGame();
loop();
