# ⭐ Lompat Bintang by erine

Game platformer 2D dengan menu utama, 3 level, dan 2 mini game tambahan — berjalan langsung di browser tanpa library eksternal.

---

## 🚀 Cara Menjalankan

> **Penting:** Musik latar menggunakan file MP3, sehingga game perlu dijalankan lewat server lokal (bukan dibuka langsung sebagai `file://`).

### Cara Termudah — Live Server (VS Code)
1. Buka folder di VS Code.
2. Klik kanan `index.html` → **Open with Live Server**.
3. Browser akan membuka `http://localhost:5500` secara otomatis.

### Python (tanpa VS Code)
```bash
# Python 3
python -m http.server 8000
# Buka http://localhost:8000
```

### Node.js
```bash
npx serve .
# atau
npx http-server .
```

### Tanpa server (tanpa musik)
Buka `index.html` langsung di browser — game berjalan normal, hanya musik MP3 tidak akan dimuat (efek suara tetap berfungsi).

---

## 📁 File Audio yang Dibutuhkan

| Path | Deskripsi |
|------|-----------|
| `assets/audio/kornevmusic-happy-latin-salsa-dance-621026.mp3` | Musik latar utama (sudah ada) |

Untuk menambah musik terpisah per layar, edit bagian `MUSIK_CONFIG` di `js/audio.js`:
```js
const MUSIK_CONFIG = {
  default: 'assets/audio/musik.mp3',
  menu:    'assets/audio/menu.mp3',   // jika null, pakai 'default'
  game:    'assets/audio/game.mp3',
};
```

---

## 🎮 Kontrol

| Aksi       | Keyboard                        | Layar Sentuh    |
|------------|---------------------------------|-----------------|
| Gerak kiri | `← ArrowLeft` atau `A`          | Tombol ◀        |
| Gerak kanan| `→ ArrowRight` atau `D`         | Tombol ▶        |
| Lompat     | `Spasi`, `↑ ArrowUp`, atau `W`  | Tombol ⬆ Lompat |
| Pilih menu | `↑ ↓` + `Enter`                 | Klik/ketuk      |
| Mute musik | `M`                             | Tombol 🔊 di menu|
| Kembali    | `Esc`                           | Tombol Kembali  |

---

## 🎯 Gameplay Platformer

- Kumpulkan ⭐ **bintang** (+1 skor).
- **Injak musuh** dari atas (+2 skor) — pemain memantul.
- Hindari jatuh ke **jurang** atau menyentuh **duri** (Level 3).
- Pemain punya **3 nyawa** ♥ yang terbawa antar-level.
- Sentuh 🚩 **bendera** di ujung level untuk maju ke level berikutnya.
- Selesaikan semua 3 level untuk tamat!

---

## 📁 Struktur File

```
├── index.html              ← Shell HTML dan canvas
├── style.css               ← Layout, tombol sentuh, dark mode
├── assets/
│   └── audio/
│       └── kornevmusic-happy-latin-salsa-dance-621026.mp3
├── js/
│   ├── main.js             ← Entry point & screen manager
│   ├── menu.js             ← Menu utama, cara bermain, pilih game
│   ├── audio.js            ← putarMusik(), putarEfek(), setMute()
│   ├── levels.js           ← Data 3 level (tanah, platform, bintang, musuh)
│   ├── game.js             ← Logika platformer lengkap
│   ├── games.js            ← Daftar semua mini game
│   └── games/
│       ├── snake.js        ← Mini game Ular Manis
│       └── memory.js       ← Mini game Cocok Kartu
└── README.md
```

### Bagian dalam `js/game.js`

| Bagian | Isi |
|--------|-----|
| `[1] CONFIG` | Konstanta fisika |
| `[2] STATE` | Variabel status dan skor |
| `[3] INISIALISASI` | `startLevel()`, `initNewGame()` |
| `[4] INPUT` | Baca dari `window.GameInput` |
| `[5] KAMERA` | Smooth follow, clamp |
| `[6] PLATFORM` | Platform statis & bergerak |
| `[7] FISIKA` | Gravitasi, coyote time, jump buffer |
| `[8] DURI` | Deteksi tabrakan duri |
| `[9] MUSUH` | Patroli, injak, tabrakan |
| `[10] BINTANG & BENDERA` | Koleksi, cek kemenangan |
| `[11–12] RENDERING` | Semua fungsi gambar |
| `[13–14] LOOP` | `updateGame()`, `renderGame()` |

---

## 🌸 Fitur

- **Menu utama** dengan animasi bintang melayang dan tokoh bergerak
- **Cara Bermain** dalam panel ringkas
- **Pilih Game** dengan kartu preview animasi
- **3 Level** dengan kesulitan meningkat:
  - Level 1 — Padang Bunga (3 musuh, 13 bintang)
  - Level 2 — Tebing Rosy (5 musuh, platform bergerak naik-turun & kiri-kanan)
  - Level 3 — Puncak Kristal (7 musuh lebih cepat, duri, 20 bintang)
- **Musik latar** dengan fade in/out + jeda otomatis saat tab tidak aktif
- **Efek suara** (lompat, bintang, injak musuh, kehilangan nyawa, level selesai)
- **Skor & level tertinggi** tersimpan di localStorage
- **Coyote time** dan **jump buffering**
- **Parallax** awan + bukit
- Tema visual **pink-putih pastel**
- Responsif hingga layar HP, **dark mode** otomatis
- **Mini game Snake** (Ular Manis) — kendalikan ular, makan apel
- **Mini game Memory Match** (Cocok Kartu) — temukan pasangan kartu

---

Dibuat dengan ❤️ menggunakan HTML, CSS, dan JavaScript murni.

