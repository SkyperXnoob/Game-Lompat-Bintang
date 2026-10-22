// ============================================================
//  js/games/memory.js — Mini Game Cocok Kartu (Memory Match)
//  Tema: biru pastel, klik/ketuk kartu untuk membuka
// ============================================================

const MEM_COLS   = 4;
const MEM_ROWS   = 4;
const MEM_TOTAL  = MEM_COLS * MEM_ROWS;   // 16 kartu = 8 pasang
const MEM_SYMBOLS = ['⭐', '♥', '🌸', '🦋', '🍰', '🎀', '🌙', '🍓'];

const CARD_W = 80, CARD_H = 90, CARD_GAP = 12;
const BOARD_W = MEM_COLS * CARD_W + (MEM_COLS - 1) * CARD_GAP;
const BOARD_H = MEM_ROWS * CARD_H + (MEM_ROWS - 1) * CARD_GAP;

// Warna
const MC2 = {
  bg:       '#F0F4FF',
  board:    '#E8EEFF',
  cardBack: '#9BB8F0',
  cardFace: '#FFFFFF',
  cardBdr:  '#7090D0',
  matched:  '#C8F0C8',
  matchBdr: '#70C070',
  text:     '#3A4A7A',
  textMut:  '#7090C0',
  over_bg:  'rgba(220,230,255,0.93)',
};

// State
let cards = [];
let openA  = null;   // indeks kartu pertama yang terbuka
let openB  = null;   // indeks kartu kedua
let lockBoard = false; // mencegah klik saat animasi
let memScore  = 0;
let memMoves  = 0;
let memTime   = 0;
let memState  = 'start';  // 'start' | 'playing' | 'won'
let flipTimer = 0;

function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function memInit() {
  const syms = [...MEM_SYMBOLS, ...MEM_SYMBOLS]; // 16 kartu = 8 pasang
  _shuffle(syms);
  cards = syms.map((sym, i) => ({
    id: i,
    symbol: sym,
    open: false,
    matched: false,
    flipAnim: 0,   // 0..1 untuk animasi flip
  }));
  openA = null;
  openB = null;
  lockBoard = false;
  memScore = 0;
  memMoves = 0;
  memTime  = 0;
  memState = 'playing';
}

// ---- UPDATE ----
function memUpdate() {
  if (memState !== 'playing') return;
  memTime++;

  // Animasi flip
  for (const c of cards) {
    const target = (c.open || c.matched) ? 1 : 0;
    c.flipAnim += (target - c.flipAnim) * 0.25;
  }

  // Timer untuk tutup kartu yang tidak cocok
  if (flipTimer > 0) {
    flipTimer--;
    if (flipTimer === 0) {
      // Tutup kedua kartu
      if (openA !== null) cards[openA].open = false;
      if (openB !== null) cards[openB].open = false;
      openA = null;
      openB = null;
      lockBoard = false;
    }
  }

  // Cek kemenangan
  if (memState === 'playing' && cards.every(c => c.matched)) {
    memState = 'won';
    window.Audio_.putarEfek('levelSelesai');
  }
}

// ---- KLIK KARTU ----
function memClickCard(idx) {
  if (lockBoard || memState !== 'playing') return;
  const c = cards[idx];
  if (c.matched || c.open) return;

  c.open = true;
  window.Audio_.putarEfek('klik');

  if (openA === null) {
    openA = idx;
    return;
  }

  // Kartu kedua
  openB = idx;
  memMoves++;
  lockBoard = true;

  if (cards[openA].symbol === cards[openB].symbol) {
    // Cocok!
    cards[openA].matched = true;
    cards[openB].matched = true;
    memScore += 10;
    openA = null;
    openB = null;
    lockBoard = false;
    window.Audio_.putarEfek('bintang');
  } else {
    // Tidak cocok — tutup setelah 45 frame
    flipTimer = 45;
  }
}

// ---- RENDER ----
function memRender(ctx, W, H) {
  // Latar
  ctx.fillStyle = MC2.bg;
  ctx.fillRect(0, 0, W, H);

  const offX = (W - BOARD_W) / 2;
  const offY = (H - BOARD_H) / 2 + 10;

  // Panel board
  ctx.fillStyle = MC2.board;
  ctx.strokeStyle = MC2.cardBdr;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(offX - 12, offY - 12, BOARD_W + 24, BOARD_H + 24, 14);
  ctx.fill();
  ctx.stroke();

  // Kartu
  for (let i = 0; i < cards.length; i++) {
    const c   = cards[i];
    const col = i % MEM_COLS;
    const row = Math.floor(i / MEM_COLS);
    const cx  = offX + col * (CARD_W + CARD_GAP);
    const cy  = offY + row * (CARD_H + CARD_GAP);

    _drawCard(ctx, c, cx, cy);
  }

  // HUD
  ctx.textAlign = 'left';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = MC2.text;
  ctx.fillText(`✅ Pasangan: ${memScore / 10}/8`, offX, offY - 22);

  ctx.textAlign = 'right';
  ctx.font = '13px sans-serif';
  ctx.fillStyle = MC2.textMut;
  ctx.fillText(`Gerakan: ${memMoves}   Esc = Menu`, offX + BOARD_W, offY - 22);

  // Overlay menang
  if (memState === 'won') {
    ctx.fillStyle = MC2.over_bg;
    ctx.strokeStyle = MC2.cardBdr;
    ctx.lineWidth = 2;
    const ox = W / 2 - 170, oy = H / 2 - 65;
    ctx.beginPath();
    ctx.roundRect(ox, oy, 340, 130, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#3A4A7A';
    ctx.fillText('🎉 Semua Pasangan Cocok!', W / 2, oy + 36);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = MC2.text;
    ctx.fillText(`Gerakan: ${memMoves}`, W / 2, oy + 64);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = MC2.textMut;
    ctx.fillText('Enter / Spasi = Main Lagi   Esc = Menu', W / 2, oy + 92);
  }

  // Overlay start
  if (memState === 'start') {
    ctx.fillStyle = MC2.over_bg;
    ctx.strokeStyle = MC2.cardBdr;
    ctx.lineWidth = 2;
    const ox = W / 2 - 160, oy = H / 2 - 50;
    ctx.beginPath();
    ctx.roundRect(ox, oy, 320, 100, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#3A4A7A';
    ctx.fillText('🃏 Cocok Kartu', W / 2, oy + 30);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = MC2.textMut;
    ctx.fillText('Klik / Ketuk dua kartu untuk mencocokkan', W / 2, oy + 55);
    ctx.fillText('Enter / Spasi / Ketuk untuk mulai', W / 2, oy + 76);
  }
}

function _drawCard(ctx, c, cx, cy) {
  // Animasi flip: scale horizontal berdasarkan flipAnim
  const flip = c.flipAnim;
  const scaleX = Math.abs(Math.cos(flip * Math.PI));
  const midX   = cx + CARD_W / 2;

  ctx.save();
  ctx.translate(midX, cy + CARD_H / 2);
  ctx.scale(scaleX, 1);
  ctx.translate(-CARD_W / 2, -CARD_H / 2);

  // Warna muka/belakang berdasarkan fase flip
  const isShowingFace = flip > 0.5;
  ctx.fillStyle = c.matched ? MC2.matched : (isShowingFace ? MC2.cardFace : MC2.cardBack);
  ctx.strokeStyle = c.matched ? MC2.matchBdr : MC2.cardBdr;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_W, CARD_H, 10);
  ctx.fill();
  ctx.stroke();

  if (isShowingFace) {
    // Simbol
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '32px sans-serif';
    ctx.fillText(c.symbol, CARD_W / 2, CARD_H / 2);
    ctx.textBaseline = 'alphabetic';
  } else {
    // Corak belakang kartu
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12);
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('?', CARD_W / 2, CARD_H / 2);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();
}

// ---- HITUNG POSISI KARTU DARI KOORDINAT LAYAR ----
function _cardAtPos(px, py, W, H) {
  const offX = (W - BOARD_W) / 2;
  const offY = (H - BOARD_H) / 2 + 10;
  for (let i = 0; i < cards.length; i++) {
    const col = i % MEM_COLS;
    const row = Math.floor(i / MEM_COLS);
    const cx  = offX + col * (CARD_W + CARD_GAP);
    const cy  = offY + row * (CARD_H + CARD_GAP);
    if (px >= cx && px <= cx + CARD_W && py >= cy && py <= cy + CARD_H) return i;
  }
  return -1;
}

// ---- INPUT ----
function memKeyDown(code) {
  if (code === 'Escape') { window.Main.goMenu(); return; }
  if (code === 'Enter' || code === 'Space') {
    if (memState === 'start' || memState === 'won') memInit();
  }
}

function memPointerDown(px, py, W, H) {
  window.Audio_.unlockAudio();
  if (memState === 'start') { memInit(); return; }
  if (memState === 'won')   { memInit(); return; }
  const idx = _cardAtPos(px, py, W, H);
  if (idx >= 0) memClickCard(idx);
}

// Inisialisasi awal
memState = 'start';

// Ekspor
window.MemoryGame = {
  init()  { memState = 'start'; },
  update: memUpdate,
  render: memRender,
  keyDown: memKeyDown,
  pointerDown: memPointerDown,
};
