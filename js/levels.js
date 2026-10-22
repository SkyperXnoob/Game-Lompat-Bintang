// ============================================================
//  levels.js — Data 3 Level Lompat Bintang
//  Struktur: array LEVELS, tiap level berisi groundSegments,
//  platforms (termasuk platform bergerak), stars, enemies, flag, config
// ============================================================

// Platform bergerak: type:'moving', axis:'x'|'y', min, max, speed
// Duri: { x, y, w, h } — menyentuh = kehilangan nyawa

const LEVELS = [

  // ============================================================
  // LEVEL 1 — Level Awal (dari game.js lama)
  // ============================================================
  {
    id: 1,
    nama: 'Padang Bunga',
    levelW: 2400,
    enemySpeed: 1.4,

    groundSegments: [
      { x: 0,    y: 380, w: 300,  h: 70 },
      { x: 360,  y: 380, w: 280,  h: 70 },
      { x: 700,  y: 380, w: 320,  h: 70 },
      { x: 1080, y: 380, w: 400,  h: 70 },
      { x: 1540, y: 380, w: 280,  h: 70 },
      { x: 1870, y: 380, w: 530,  h: 70 },
    ],

    platforms: [
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
    ],

    movingPlatforms: [], // tidak ada di level 1

    stars: [
      { x: 185, y: 270 }, { x: 405, y: 230 }, { x: 580, y: 190 },
      { x: 760, y: 268 }, { x: 890, y: 210 }, { x: 1050, y: 268 },
      { x: 1160, y: 190 }, { x: 1320, y: 248 }, { x: 1480, y: 200 },
      { x: 1620, y: 258 }, { x: 1730, y: 200 }, { x: 2060, y: 210 },
      { x: 2240, y: 268 },
    ],

    enemies: [
      { x: 500,  y: 356, patrolLeft: 380,  patrolRight: 640  },
      { x: 1200, y: 356, patrolLeft: 1090, patrolRight: 1450 },
      { x: 1900, y: 356, patrolLeft: 1870, patrolRight: 2100 },
    ],

    spikes: [], // tidak ada duri di level 1

    flag: { x: 2330, y: 300 },

    playerStart: { x: 40, y: 340 },
  },

  // ============================================================
  // LEVEL 2 — Tebing Rosy (lebih sulit, platform bergerak)
  // ============================================================
  {
    id: 2,
    nama: 'Tebing Rosy',
    levelW: 2600,
    enemySpeed: 1.9,

    groundSegments: [
      { x: 0,    y: 380, w: 200, h: 70 },   // pendek
      { x: 280,  y: 380, w: 160, h: 70 },   // jurang 1 (80px)
      { x: 520,  y: 380, w: 140, h: 70 },   // jurang 2 (80px)
      { x: 740,  y: 380, w: 180, h: 70 },
      { x: 1000, y: 380, w: 140, h: 70 },   // jurang (80px)
      { x: 1220, y: 380, w: 160, h: 70 },
      { x: 1460, y: 380, w: 140, h: 70 },   // jurang lebih lebar
      { x: 1680, y: 380, w: 160, h: 70 },
      { x: 1940, y: 380, w: 120, h: 70 },   // kecil
      { x: 2140, y: 380, w: 460, h: 70 },   // akhir
    ],

    platforms: [
      { x: 60,   y: 300, w: 80,  h: 14 },   // platform lebih kecil
      { x: 290,  y: 260, w: 90,  h: 14 },
      { x: 440,  y: 210, w: 70,  h: 14 },
      { x: 600,  y: 270, w: 80,  h: 14 },
      { x: 760,  y: 220, w: 80,  h: 14 },
      { x: 870,  y: 300, w: 75,  h: 14 },
      { x: 1010, y: 250, w: 80,  h: 14 },
      { x: 1140, y: 200, w: 75,  h: 14 },
      { x: 1310, y: 270, w: 80,  h: 14 },
      { x: 1470, y: 220, w: 70,  h: 14 },
      { x: 1600, y: 290, w: 70,  h: 14 },
      { x: 1720, y: 230, w: 80,  h: 14 },
      { x: 1840, y: 280, w: 75,  h: 14 },
      { x: 2000, y: 240, w: 80,  h: 14 },
      { x: 2160, y: 300, w: 80,  h: 14 },
      { x: 2380, y: 250, w: 90,  h: 14 },
    ],

    // Platform bergerak
    movingPlatforms: [
      // Bergerak vertikal (naik-turun)
      { x: 380,  y: 310, w: 85, h: 14, axis: 'y', min: 240, max: 340, speed: 1.2, _pos: 310, _dir: 1 },
      { x: 920,  y: 260, w: 80, h: 14, axis: 'y', min: 200, max: 320, speed: 1.0, _pos: 260, _dir: 1 },
      { x: 1560, y: 280, w: 80, h: 14, axis: 'y', min: 220, max: 330, speed: 1.4, _pos: 280, _dir: 1 },
      // Bergerak horizontal (kiri-kanan)
      { x: 650,  y: 330, w: 85, h: 14, axis: 'x', min: 620, max: 800, speed: 1.3, _pos: 650, _dir: 1 },
      { x: 1200, y: 330, w: 80, h: 14, axis: 'x', min: 1180, max: 1380, speed: 1.2, _pos: 1200, _dir: 1 },
      { x: 2050, y: 300, w: 80, h: 14, axis: 'x', min: 2030, max: 2210, speed: 1.5, _pos: 2050, _dir: 1 },
    ],

    stars: [
      { x: 80,   y: 270 }, { x: 310, y: 230 }, { x: 460,  y: 180 },
      { x: 620,  y: 240 }, { x: 780, y: 190 }, { x: 900,  y: 270 },
      { x: 1020, y: 220 }, { x: 1160, y: 170 }, { x: 1330, y: 240 },
      { x: 1490, y: 190 }, { x: 1620, y: 260 }, { x: 1860, y: 250 },
      { x: 2020, y: 210 }, { x: 2170, y: 270 }, { x: 2400, y: 220 },
    ],

    enemies: [
      { x: 300,  y: 356, patrolLeft: 280,  patrolRight: 430  },
      { x: 620,  y: 356, patrolLeft: 520,  patrolRight: 720  },
      { x: 1060, y: 356, patrolLeft: 1000, patrolRight: 1210 },
      { x: 1380, y: 356, patrolLeft: 1220, patrolRight: 1450 },
      { x: 2200, y: 356, patrolLeft: 2140, patrolRight: 2360 },
    ],

    spikes: [], // tidak ada duri di level 2

    flag: { x: 2520, y: 300 },

    playerStart: { x: 40, y: 340 },
  },

  // ============================================================
  // LEVEL 3 — Puncak Kristal (paling sulit, duri + musuh cepat)
  // ============================================================
  {
    id: 3,
    nama: 'Puncak Kristal',
    levelW: 3000,
    enemySpeed: 2.5,

    groundSegments: [
      { x: 0,    y: 380, w: 180, h: 70 },
      { x: 280,  y: 380, w: 130, h: 70 },   // jurang lebar
      { x: 520,  y: 380, w: 120, h: 70 },
      { x: 760,  y: 380, w: 130, h: 70 },
      { x: 1020, y: 380, w: 120, h: 70 },
      { x: 1260, y: 380, w: 140, h: 70 },
      { x: 1520, y: 380, w: 120, h: 70 },
      { x: 1780, y: 380, w: 130, h: 70 },
      { x: 2060, y: 380, w: 120, h: 70 },
      { x: 2310, y: 380, w: 130, h: 70 },
      { x: 2570, y: 380, w: 430, h: 70 },   // akhir panjang
    ],

    platforms: [
      { x: 50,   y: 310, w: 70, h: 14 },
      { x: 190,  y: 260, w: 65, h: 14 },
      { x: 330,  y: 210, w: 65, h: 14 },
      { x: 590,  y: 270, w: 70, h: 14 },
      { x: 700,  y: 210, w: 65, h: 14 },
      { x: 830,  y: 280, w: 70, h: 14 },
      { x: 950,  y: 220, w: 65, h: 14 },
      { x: 1090, y: 280, w: 70, h: 14 },
      { x: 1200, y: 220, w: 65, h: 14 },
      { x: 1330, y: 280, w: 70, h: 14 },
      { x: 1450, y: 220, w: 65, h: 14 },
      { x: 1590, y: 280, w: 70, h: 14 },
      { x: 1700, y: 220, w: 65, h: 14 },
      { x: 1840, y: 280, w: 70, h: 14 },
      { x: 1960, y: 220, w: 65, h: 14 },
      { x: 2120, y: 280, w: 70, h: 14 },
      { x: 2240, y: 220, w: 65, h: 14 },
      { x: 2380, y: 280, w: 70, h: 14 },
      { x: 2490, y: 220, w: 65, h: 14 },
      { x: 2680, y: 260, w: 70, h: 14 },
      { x: 2800, y: 300, w: 70, h: 14 },
    ],

    movingPlatforms: [
      { x: 430,  y: 280, w: 70, h: 14, axis: 'y', min: 210, max: 340, speed: 1.8, _pos: 280, _dir: 1 },
      { x: 460,  y: 310, w: 70, h: 14, axis: 'x', min: 440, max: 620, speed: 2.0, _pos: 460, _dir: 1 },
      { x: 1100, y: 290, w: 65, h: 14, axis: 'y', min: 220, max: 350, speed: 1.6, _pos: 290, _dir: 1 },
      { x: 1640, y: 260, w: 65, h: 14, axis: 'x', min: 1600, max: 1780, speed: 2.2, _pos: 1640, _dir: 1 },
      { x: 2180, y: 270, w: 65, h: 14, axis: 'y', min: 200, max: 340, speed: 2.0, _pos: 270, _dir: 1 },
      { x: 2620, y: 300, w: 65, h: 14, axis: 'x', min: 2590, max: 2780, speed: 2.4, _pos: 2620, _dir: 1 },
    ],

    stars: [
      { x: 60,   y: 280 }, { x: 200, y: 230 }, { x: 345,  y: 180 },
      { x: 605,  y: 240 }, { x: 715, y: 180 }, { x: 845,  y: 250 },
      { x: 960,  y: 190 }, { x: 1105, y: 250 }, { x: 1215, y: 190 },
      { x: 1340, y: 250 }, { x: 1460, y: 190 }, { x: 1600, y: 250 },
      { x: 1715, y: 190 }, { x: 1855, y: 250 }, { x: 1970, y: 190 },
      { x: 2135, y: 250 }, { x: 2255, y: 190 }, { x: 2395, y: 250 },
      { x: 2695, y: 230 }, { x: 2815, y: 270 },
    ],

    enemies: [
      { x: 290,  y: 356, patrolLeft: 280,  patrolRight: 400  },
      { x: 530,  y: 356, patrolLeft: 520,  patrolRight: 640  },
      { x: 770,  y: 356, patrolLeft: 760,  patrolRight: 880  },
      { x: 1030, y: 356, patrolLeft: 1020, patrolRight: 1150 },
      { x: 1270, y: 356, patrolLeft: 1260, patrolRight: 1390 },
      { x: 1540, y: 356, patrolLeft: 1520, patrolRight: 1650 },
      { x: 2320, y: 356, patrolLeft: 2310, patrolRight: 2440 },
    ],

    // Duri di tanah: menyentuh = kehilangan nyawa
    spikes: [
      { x: 400,  y: 362, w: 24, h: 18 },
      { x: 640,  y: 362, w: 24, h: 18 },
      { x: 900,  y: 362, w: 24, h: 18 },
      { x: 1160, y: 362, w: 24, h: 18 },
      { x: 1420, y: 362, w: 24, h: 18 },
      { x: 1680, y: 362, w: 24, h: 18 },
      { x: 1940, y: 362, w: 24, h: 18 },
      { x: 2200, y: 362, w: 24, h: 18 },
      { x: 2460, y: 362, w: 24, h: 18 },
      { x: 2720, y: 362, w: 24, h: 18 },
      { x: 2870, y: 362, w: 24, h: 18 },
    ],

    flag: { x: 2920, y: 300 },

    playerStart: { x: 40, y: 340 },
  },
];

// Tambah level baru cukup push ke array LEVELS di atas

window.LEVELS = LEVELS;
