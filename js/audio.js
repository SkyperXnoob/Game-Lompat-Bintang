// ============================================================
//  audio.js — Modul Musik & Efek Suara
//  Fungsi publik: putarMusik(), hentikanMusik(), putarEfek(nama), setMute(bool)
// ============================================================

// ---- KONFIGURASI MUSIK ----
// Tambah file musik baru cukup dengan menambah entry di sini
const MUSIK_CONFIG = {
  default: 'assets/audio/kornevmusic-happy-latin-salsa-dance-621026.mp3',
  menu:    null,   // jika null, pakai 'default'
  game:    null,
};

// ---- KONFIGURASI EFEK SUARA (Web Audio API) ----
// type: 'sine'|'square'|'sawtooth'|'triangle'
// notes: array [{ freq, dur }] — diputar berurutan
const EFEK_CONFIG = {
  lompat: {
    volume: 0.7,
    notes: [{ freq: 480, dur: 0.04 }, { freq: 720, dur: 0.08 }],
    type: 'sine',
  },
  bintang: {
    volume: 0.7,
    notes: [{ freq: 880, dur: 0.06 }, { freq: 1200, dur: 0.10 }],
    type: 'triangle',
  },
  injak: {
    volume: 0.7,
    notes: [{ freq: 300, dur: 0.04 }, { freq: 180, dur: 0.08 }],
    type: 'square',
  },
  nyawa: {
    volume: 0.7,
    notes: [
      { freq: 400, dur: 0.08 },
      { freq: 300, dur: 0.08 },
      { freq: 200, dur: 0.14 },
    ],
    type: 'sine',
  },
  levelSelesai: {
    volume: 0.7,
    notes: [
      { freq: 520, dur: 0.08 },
      { freq: 660, dur: 0.08 },
      { freq: 780, dur: 0.08 },
      { freq: 1040, dur: 0.16 },
    ],
    type: 'triangle',
  },
  klik: {
    volume: 0.5,
    notes: [{ freq: 600, dur: 0.04 }],
    type: 'square',
  },
  gameover: {
    volume: 0.7,
    notes: [
      { freq: 440, dur: 0.10 },
      { freq: 330, dur: 0.10 },
      { freq: 220, dur: 0.20 },
    ],
    type: 'sine',
  },
};

// ---- STATE INTERNAL ----
let audioCtx = null;          // Web Audio API context
let musikElemen = null;        // HTMLAudioElement untuk musik latar
let musikSedangDiputar = '';   // nama track yang sedang diputar
let isMuted = false;
let musikVolume = 0.4;
let audioUnlocked = false;     // aturan autoplay: hanya setelah user gesture

// Baca pengaturan tersimpan
try {
  const saved = JSON.parse(localStorage.getItem('lompat_audio') || '{}');
  if (typeof saved.muted  === 'boolean') isMuted = saved.muted;
  if (typeof saved.volume === 'number')  musikVolume = saved.volume;
} catch (_) {}

// ---- INISIALISASI AUDIO CONTEXT ----
function _getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Dipanggil pertama kali setelah user gesture (klik/ketuk)
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  const ctx = _getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

// ---- MUSIK LATAR ----

// Ambil path musik berdasarkan nama layar
function _resolveMusikPath(nama) {
  const path = MUSIK_CONFIG[nama] || MUSIK_CONFIG['default'];
  return path || null;
}

// Fade in/out volume HTML audio element
function _fadeTo(elem, targetVol, durasiMs, onDone) {
  const steps = 20;
  const interval = durasiMs / steps;
  const startVol = elem.volume;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    elem.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * (step / steps)));
    if (step >= steps) {
      clearInterval(timer);
      if (onDone) onDone();
    }
  }, interval);
}

function putarMusik(nama = 'default') {
  if (!audioUnlocked) return;
  const path = _resolveMusikPath(nama);
  if (!path) return;

  // Jika track sama sudah diputar, tidak perlu restart
  if (musikSedangDiputar === path && musikElemen && !musikElemen.paused) return;

  // Hentikan musik lama dengan fade out lalu mulai baru
  if (musikElemen && !musikElemen.paused) {
    const lama = musikElemen;
    _fadeTo(lama, 0, 500, () => { lama.pause(); lama.src = ''; });
  }

  musikSedangDiputar = path;
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0;
  audio.src = path;

  // Tangani error file tidak ditemukan — game tetap jalan
  audio.addEventListener('error', () => {
    console.warn('[Audio] File musik tidak ditemukan:', path);
    musikElemen = null;
    musikSedangDiputar = '';
  });

  musikElemen = audio;

  if (!isMuted) {
    audio.play().then(() => {
      _fadeTo(audio, musikVolume, 500, null);
    }).catch(() => {
      // Autoplay dicegah browser — tidak error
    });
  }
}

function hentikanMusik() {
  if (!musikElemen) return;
  _fadeTo(musikElemen, 0, 500, () => {
    if (musikElemen) { musikElemen.pause(); musikElemen = null; }
    musikSedangDiputar = '';
  });
}

function jedaMusik() {
  if (musikElemen && !musikElemen.paused) musikElemen.pause();
}

function lanjutkanMusik() {
  if (!isMuted && musikElemen && musikElemen.paused && musikSedangDiputar) {
    musikElemen.play().catch(() => {});
  }
}

// Jeda otomatis saat tab tidak aktif
document.addEventListener('visibilitychange', () => {
  if (document.hidden) jedaMusik();
  else lanjutkanMusik();
});

// ---- EFEK SUARA (Web Audio API) ----

function putarEfek(nama) {
  if (isMuted || !audioUnlocked) return;
  const cfg = EFEK_CONFIG[nama];
  if (!cfg) return;

  const ctx = _getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  let startTime = ctx.currentTime;

  for (const note of cfg.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = cfg.type || 'sine';
    osc.frequency.setValueAtTime(note.freq, startTime);

    gain.gain.setValueAtTime(cfg.volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

    osc.start(startTime);
    osc.stop(startTime + note.dur + 0.01);

    startTime += note.dur;
  }
}

// ---- MUTE ----
function setMute(bool) {
  isMuted = bool;
  if (musikElemen) {
    musikElemen.volume = isMuted ? 0 : musikVolume;
  }
  // Simpan ke localStorage
  try {
    localStorage.setItem('lompat_audio', JSON.stringify({ muted: isMuted, volume: musikVolume }));
  } catch (_) {}
}

function toggleMute() {
  setMute(!isMuted);
  return isMuted;
}

function getMuted() { return isMuted; }

// Ekspor ke window agar bisa diakses modul lain
window.Audio_ = {
  unlockAudio,
  putarMusik,
  hentikanMusik,
  putarEfek,
  setMute,
  toggleMute,
  getMuted,
};
