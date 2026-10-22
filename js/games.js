// ============================================================
//  games.js — Daftar semua mini game yang tersedia di Pilih Game
//  Tambah game baru: cukup push satu objek ke array GAME_LIST
// ============================================================

// Setiap entry: { id, nama, deskripsi, warna, drawPreview(ctx,x,y,w,h,t), launch() }
// launch() dipanggil saat tombol "Mainkan" ditekan

window.GAME_LIST = [
  {
    id: 'lompat',
    nama: 'Lompat Bintang',
    deskripsi: 'Kumpulkan bintang, kalahkan\nmusuh, dan raih bendera!',
    warna: '#FFD6E4',
    drawPreview(ctx, x, y, w, h, t) {
      // Langit mini
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#FFF5F8');
      g.addColorStop(1, '#FFD6E4');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      // Tanah
      ctx.fillStyle = '#F7B6CC';
      ctx.fillRect(x, y + h - 18, w, 18);

      // Bintang
      ctx.fillStyle = '#FFE9A8';
      ctx.strokeStyle = '#F5C842';
      ctx.lineWidth = 1;
      _drawStar5Mini(ctx, x + w * 0.5, y + h * 0.35 + Math.sin(t * 0.06) * 4, 10, 4);
      ctx.fill();
      ctx.stroke();

      // Pemain mini
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#E8A0B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x + 14, y + h - 36, 18, 18, 4);
      ctx.fill();
      ctx.stroke();
    },
    launch() { window.Main.launchGame('lompat'); },
  },

  {
    id: 'snake',
    nama: 'Ular Manis',
    deskripsi: 'Kendalikan ular, makan apel,\njangan menabrak dirimu!',
    warna: '#D6F0D6',
    drawPreview(ctx, x, y, w, h, t) {
      // BG hijau pastel
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#F0FFF0');
      g.addColorStop(1, '#C8F0C8');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      // Grid samar
      ctx.strokeStyle = 'rgba(160,210,160,0.4)';
      ctx.lineWidth = 0.5;
      const cell = 12;
      for (let gx = x; gx < x + w; gx += cell) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }
      for (let gy = y; gy < y + h; gy += cell) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }

      // Ular (segmen)
      const segs = [
        { cx: x + 60, cy: y + h / 2 + 4 },
        { cx: x + 48, cy: y + h / 2 + 4 },
        { cx: x + 36, cy: y + h / 2 + 4 },
        { cx: x + 36, cy: y + h / 2 - 8 },
        { cx: x + 48, cy: y + h / 2 - 8 },
      ];
      ctx.fillStyle = '#5CB85C';
      for (const s of segs) {
        ctx.beginPath();
        ctx.roundRect(s.cx - 5, s.cy - 5, 10, 10, 3);
        ctx.fill();
      }
      // Kepala
      ctx.fillStyle = '#3A9A3A';
      ctx.beginPath();
      ctx.roundRect(x + 60, y + h / 2 - 5, 14, 14, 4);
      ctx.fill();

      // Apel bergoyang
      const ax = x + w - 24;
      const ay = y + h / 2 - 8 + Math.sin(t * 0.07) * 3;
      ctx.fillStyle = '#FF7070';
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      ctx.fill();
    },
    launch() { window.Main.launchGame('snake'); },
  },

  {
    id: 'memory',
    nama: 'Cocok Kartu',
    deskripsi: 'Temukan pasangan kartu,\nuji daya ingatmu!',
    warna: '#D6E4FF',
    drawPreview(ctx, x, y, w, h, t) {
      // BG biru pastel
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#F0F4FF');
      g.addColorStop(1, '#D6E4FF');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      // Kartu-kartu mini
      const kartu = [
        { gx: 0, gy: 0, terbuka: true,  simbol: '⭐' },
        { gx: 1, gy: 0, terbuka: false, simbol: '♥' },
        { gx: 2, gy: 0, terbuka: true,  simbol: '⭐' },
        { gx: 0, gy: 1, terbuka: false, simbol: '🌸' },
        { gx: 1, gy: 1, terbuka: false, simbol: '♥' },
        { gx: 2, gy: 1, terbuka: false, simbol: '🌸' },
      ];
      const cw = 28, ch = 34, gap = 6;
      const startX = x + (w - (cw * 3 + gap * 2)) / 2;
      const startY = y + (h - (ch * 2 + gap)) / 2;

      for (const k of kartu) {
        const kx = startX + k.gx * (cw + gap);
        const ky = startY + k.gy * (ch + gap);
        ctx.fillStyle = k.terbuka ? '#FFFFFF' : '#9BB8F0';
        ctx.strokeStyle = '#7090D0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(kx, ky, cw, ch, 4);
        ctx.fill();
        ctx.stroke();
        if (k.terbuka) {
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(k.simbol, kx + cw / 2, ky + ch / 2);
        }
      }
      ctx.textBaseline = 'alphabetic';
    },
    launch() { window.Main.launchGame('memory'); },
  },
];

// Helper untuk preview bintang 5 titik
function _drawStar5Mini(ctx, cx, cy, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  ctx.closePath();
}
