// ============================================================
//  menu.js — Layar Menu Utama, Cara Bermain, Pilih Game
// ============================================================

const MENU_SCREENS = {
  MAIN: 'main',
  HOW:  'howto',
  PICK: 'pick',
};

let menuScreen    = MENU_SCREENS.MAIN;
let menuSelected  = 0;              // indeks tombol yang dipilih keyboard
let menuTime      = 0;              // frame counter animasi

// Tombol menu utama
const MENU_ITEMS = ['Main', 'Pilih Game', 'Cara Bermain'];

// Warna tema
const MC = {
  bg1:      '#FFF5F8',
  bg2:      '#FFD6E4',
  accent:   '#E8609A',
  text:     '#6B4A5E',
  textMute: '#B07898',
  card:     '#FFF0F6',
  cardBorder:'#F7B6CC',
  btn:      '#F7B6CC',
  btnHover: '#F096B8',
  btnText:  '#6B2050',
  overlay:  'rgba(255,230,240,0.92)',
};

// ============================================================
// [A] RENDER MENU UTAMA
// ============================================================
function renderMenu(ctx, W, H, t) {
  menuTime = t;

  // Latar gradasi
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, MC.bg1);
  g.addColorStop(1, MC.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Awan dekoratif
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  _drawCloud(ctx, 80  + Math.sin(t * 0.005) * 6, 50, 40);
  _drawCloud(ctx, 650 + Math.sin(t * 0.004) * 8, 70, 30);
  _drawCloud(ctx, 370 + Math.sin(t * 0.006) * 5, 35, 50);

  // Bintang melayang dekoratif
  for (let i = 0; i < 6; i++) {
    const bx = 80 + i * 120 + Math.sin(t * 0.03 + i * 1.2) * 10;
    const by = 140 + Math.cos(t * 0.025 + i * 0.8) * 14;
    ctx.fillStyle = `rgba(255,233,168,${0.5 + 0.3 * Math.sin(t * 0.04 + i)})`;
    ctx.strokeStyle = '#F5C842';
    ctx.lineWidth = 1;
    _drawStar5(ctx, bx, by, 9, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Tokoh pemain naik-turun di kiri judul
  const pBob = Math.sin(t * 0.05) * 8;
  _drawPlayerMini(ctx, W / 2 - 130, H * 0.22 - 24 + pBob, 30, true);

  // Judul
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = '#C0507A';
  ctx.fillText('⭐ Lompat Bintang', W / 2, H * 0.22);

  ctx.font = '16px -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = MC.textMute;
  ctx.fillText('by erine', W / 2, H * 0.22 + 28);

  // Tagline
  ctx.font = '14px -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = MC.textMute;
  ctx.fillText('Kumpulkan bintang, kalahkan musuh, raih benderamu!', W / 2, H * 0.22 + 54);

  // Tombol menu
  const btnW = 220, btnH = 42, btnX = W / 2 - btnW / 2;
  const btnStartY = H * 0.52;
  const btnGap = 52;

  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const by = btnStartY + i * btnGap;
    const isSelected = i === menuSelected;

    // Shadow ringan
    ctx.fillStyle = 'rgba(200,100,130,0.12)';
    ctx.beginPath();
    ctx.roundRect(btnX + 2, by + 4, btnW, btnH, 14);
    ctx.fill();

    // Tombol
    ctx.fillStyle = isSelected ? MC.btnHover : MC.btn;
    ctx.strokeStyle = isSelected ? MC.accent : MC.cardBorder;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(btnX, by, btnW, btnH, 14);
    ctx.fill();
    ctx.stroke();

    // Teks tombol
    ctx.font = isSelected ? 'bold 17px sans-serif' : '16px sans-serif';
    ctx.fillStyle = MC.btnText;
    ctx.textAlign = 'center';
    ctx.fillText(MENU_ITEMS[i], W / 2, by + btnH / 2 + 6);
  }

  // Tombol musik (pojok kanan atas)
  _drawMuteBtn(ctx, W - 50, 20, 28);

  // Info keyboard
  ctx.font = '12px sans-serif';
  ctx.fillStyle = MC.textMute;
  ctx.textAlign = 'center';
  ctx.fillText('↑↓ untuk pilih   Enter untuk konfirmasi   M untuk mute', W / 2, H - 14);

  // Skor terbaik
  const best = _getBestScore();
  if (best > 0) {
    ctx.font = '13px sans-serif';
    ctx.fillStyle = MC.textMute;
    ctx.fillText(`Skor terbaik: ${best}`, W / 2, H - 32);
  }
}

// ============================================================
// [B] RENDER CARA BERMAIN
// ============================================================
function renderHowTo(ctx, W, H) {
  // Latar
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, MC.bg1);
  g.addColorStop(1, MC.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Panel
  const panW = 540, panH = 320;
  const panX = W / 2 - panW / 2;
  const panY = H / 2 - panH / 2;

  ctx.fillStyle = MC.overlay;
  ctx.strokeStyle = MC.cardBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(panX, panY, panW, panH, 18);
  ctx.fill();
  ctx.stroke();

  // Judul panel
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#C0507A';
  ctx.fillText('📖 Cara Bermain', W / 2, panY + 36);

  // Kontrol
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = MC.text;
  ctx.fillText('🎮 Kontrol', panX + 28, panY + 68);

  const kontrol = [
    ['← / A', 'Gerak ke kiri'],
    ['→ / D', 'Gerak ke kanan'],
    ['↑ / W / Spasi', 'Lompat (tahan untuk lompat lebih tinggi)'],
    ['M', 'Nyalakan / matikan musik'],
    ['Esc', 'Kembali ke menu'],
  ];
  ctx.font = '13px sans-serif';
  kontrol.forEach(([key, desc], i) => {
    const ly = panY + 90 + i * 22;
    ctx.fillStyle = MC.accent;
    ctx.fillText(key, panX + 36, ly);
    ctx.fillStyle = MC.text;
    ctx.fillText('— ' + desc, panX + 160, ly);
  });

  // Tujuan
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = MC.text;
  ctx.fillText('🎯 Tujuan', panX + 28, panY + 210);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = MC.text;
  const tujuan = [
    '• Kumpulkan ⭐ bintang untuk menambah skor.',
    '• Injak musuh dari atas untuk mengalahkannya (+2 skor).',
    '• Hindari jatuh ke jurang atau kena duri.',
    '• Sentuh 🚩 bendera di ujung level untuk menang!',
    '• Kamu punya 3 nyawa ♥ — nyawa terbawa antar-level.',
  ];
  tujuan.forEach((t, i) => {
    ctx.fillText(t, panX + 36, panY + 230 + i * 18);
  });

  // Tombol kembali
  _drawKembaliBtn(ctx, W, H);
}

// ============================================================
// [C] RENDER PILIH GAME
// ============================================================
let pickHover = -1; // indeks kartu yang di-hover

function renderPickGame(ctx, W, H, t) {
  // Latar
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, MC.bg1);
  g.addColorStop(1, MC.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Judul
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#C0507A';
  ctx.fillText('🎮 Pilih Game', W / 2, 48);

  // Kartu game
  const games = window.GAME_LIST || [];
  const cardW = 170, cardH = 200, gap = 24;
  const totalW = games.length * cardW + (games.length - 1) * gap;
  const startX = W / 2 - totalW / 2;
  const cardY   = 80;

  for (let i = 0; i < games.length; i++) {
    const gm = games[i];
    const cx = startX + i * (cardW + gap);
    const isHover = (i === pickHover);

    // Shadow
    ctx.fillStyle = 'rgba(200,100,130,0.10)';
    ctx.beginPath();
    ctx.roundRect(cx + 3, cardY + 4, cardW, cardH, 14);
    ctx.fill();

    // Kartu
    ctx.fillStyle = isHover ? gm.warna : '#FFFFFF';
    ctx.strokeStyle = isHover ? MC.accent : MC.cardBorder;
    ctx.lineWidth = isHover ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.stroke();

    // Preview area
    const prevH = 95;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx + 8, cardY + 8, cardW - 16, prevH, 8);
    ctx.clip();
    gm.drawPreview(ctx, cx + 8, cardY + 8, cardW - 16, prevH, t);
    ctx.restore();

    // Nama game
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = MC.text;
    ctx.fillText(gm.nama, cx + cardW / 2, cardY + prevH + 24);

    // Deskripsi
    ctx.font = '11px sans-serif';
    ctx.fillStyle = MC.textMute;
    const lines = gm.deskripsi.split('\n');
    lines.forEach((ln, li) => {
      ctx.fillText(ln, cx + cardW / 2, cardY + prevH + 40 + li * 15);
    });

    // Tombol Mainkan
    const btnBY = cardY + cardH - 30;
    ctx.fillStyle = isHover ? MC.btnHover : MC.btn;
    ctx.strokeStyle = MC.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx + 14, btnBY, cardW - 28, 24, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = MC.btnText;
    ctx.fillText('▶ Mainkan', cx + cardW / 2, btnBY + 16);
  }

  // Tombol kembali
  _drawKembaliBtn(ctx, W, H);
}

// ============================================================
// [D] INTERAKSI MENU
// ============================================================

// Navigasi keyboard di menu utama
function menuKeyDown(code) {
  if (menuScreen === MENU_SCREENS.MAIN) {
    if (code === 'ArrowUp' || code === 'KeyW') {
      menuSelected = (menuSelected - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      window.Audio_.putarEfek('klik');
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      menuSelected = (menuSelected + 1) % MENU_ITEMS.length;
      window.Audio_.putarEfek('klik');
    }
    if (code === 'Enter' || code === 'Space') {
      _menuConfirm();
    }
  } else if (menuScreen === MENU_SCREENS.HOW || menuScreen === MENU_SCREENS.PICK) {
    if (code === 'Escape' || code === 'Backspace') {
      menuScreen = MENU_SCREENS.MAIN;
      window.Audio_.putarEfek('klik');
    }
  }
  if (code === 'KeyM') {
    window.Audio_.toggleMute();
  }
}

function _menuConfirm() {
  window.Audio_.putarEfek('klik');
  if (menuSelected === 0) {
    // Main
    window.Audio_.unlockAudio();
    window.Main.launchGame('lompat');
  } else if (menuSelected === 1) {
    menuScreen = MENU_SCREENS.PICK;
  } else if (menuSelected === 2) {
    menuScreen = MENU_SCREENS.HOW;
  }
}

// Klik / ketuk canvas di menu
function menuPointerDown(px, py, W, H) {
  if (menuScreen === MENU_SCREENS.MAIN) {
    window.Audio_.unlockAudio();
    const btnW = 220, btnH = 42;
    const btnX = W / 2 - btnW / 2;
    const btnStartY = H * 0.52;
    const btnGap = 52;

    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const by = btnStartY + i * btnGap;
      if (px >= btnX && px <= btnX + btnW && py >= by && py <= by + btnH) {
        menuSelected = i;
        _menuConfirm();
        return;
      }
    }
    // Tombol mute
    if (Math.hypot(px - (W - 50), py - 20) < 20) {
      window.Audio_.toggleMute();
    }
  } else if (menuScreen === MENU_SCREENS.HOW) {
    // Tombol kembali
    if (_hitKembali(px, py, W, H)) {
      menuScreen = MENU_SCREENS.MAIN;
      window.Audio_.putarEfek('klik');
    }
  } else if (menuScreen === MENU_SCREENS.PICK) {
    if (_hitKembali(px, py, W, H)) {
      menuScreen = MENU_SCREENS.MAIN;
      window.Audio_.putarEfek('klik');
      return;
    }
    // Klik kartu game
    const games = window.GAME_LIST || [];
    const cardW = 170, cardH = 200, gap = 24;
    const totalW = games.length * cardW + (games.length - 1) * gap;
    const startX = W / 2 - totalW / 2;
    const cardY   = 80;

    for (let i = 0; i < games.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (px >= cx && px <= cx + cardW && py >= cardY && py <= cardY + cardH) {
        window.Audio_.putarEfek('klik');
        games[i].launch();
        return;
      }
    }
  }
}

// Gerak mouse untuk hover kartu di pilih game
function menuPointerMove(px, py, W, H) {
  if (menuScreen !== MENU_SCREENS.PICK) return;
  const games = window.GAME_LIST || [];
  const cardW = 170, cardH = 200, gap = 24;
  const totalW = games.length * cardW + (games.length - 1) * gap;
  const startX = W / 2 - totalW / 2;
  const cardY   = 80;

  pickHover = -1;
  for (let i = 0; i < games.length; i++) {
    const cx = startX + i * (cardW + gap);
    if (px >= cx && px <= cx + cardW && py >= cardY && py <= cardY + cardH) {
      pickHover = i;
      break;
    }
  }
}

// ============================================================
// [E] HELPER GAMBAR
// ============================================================

function _drawCloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x - r * 0.8, y + r * 0.25, r * 0.65, 0, Math.PI * 2);
  ctx.fill();
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

function _drawPlayerMini(ctx, x, y, size, facingRight) {
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E8A0B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFBCCC';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(facingRight ? x + size - 6 : x + 6, y + size - 6, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#5A3A4A';
  const ex = facingRight ? x + size - 10 : x + 10;
  ctx.beginPath(); ctx.ellipse(ex, y + 10, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(ex - (facingRight ? 8 : -8), y + 10, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
}

function _drawMuteBtn(ctx, x, y, size) {
  const muted = window.Audio_.getMuted();
  ctx.fillStyle = 'rgba(255,230,240,0.85)';
  ctx.strokeStyle = MC.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = `${size * 0.55}px sans-serif`;
  ctx.fillStyle = MC.text;
  ctx.fillText(muted ? '🔇' : '🔊', x, y + size * 0.2);
}

function _drawKembaliBtn(ctx, W, H) {
  const bw = 120, bh = 34;
  const bx = W / 2 - bw / 2;
  const by = H - 52;

  ctx.fillStyle = MC.btn;
  ctx.strokeStyle = MC.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = MC.btnText;
  ctx.fillText('← Kembali', W / 2, by + bh / 2 + 5);
}

function _hitKembali(px, py, W, H) {
  const bw = 120, bh = 34;
  const bx = W / 2 - bw / 2;
  const by = H - 52;
  return px >= bx && px <= bx + bw && py >= by && py <= by + bh;
}

function _getBestScore() {
  try { return parseInt(localStorage.getItem('lompat_best') || '0'); }
  catch (_) { return 0; }
}

// ---- Ekspor ----
window.Menu = {
  render(ctx, W, H, t) {
    if (menuScreen === MENU_SCREENS.MAIN) renderMenu(ctx, W, H, t);
    else if (menuScreen === MENU_SCREENS.HOW) renderHowTo(ctx, W, H);
    else if (menuScreen === MENU_SCREENS.PICK) renderPickGame(ctx, W, H, t);
  },
  keyDown: menuKeyDown,
  pointerDown: menuPointerDown,
  pointerMove: menuPointerMove,
  getScreen: () => menuScreen,
  setScreen: (s) => { menuScreen = s; },
  SCREENS: MENU_SCREENS,
};
