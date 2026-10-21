# 🎬 klipzz.vid - Platform Clipping Campaign DiPanggil ke Ruangan

> **Platform Clipping Campaign & Metrics Tracking Engine** yang menghubungkan brand & media creator dengan para clipper TikTok & Instagram Reels untuk memperluas jangkauan video podcast komedi melalui insentif bagi hasil berbasis views.

---

## 🌌 1. MOON Design System & Palet Warna
Sistem desain mengusung estetika *Deep Purple & Glassmorphism* dengan kontras tinggi untuk pengalaman dark mode elegan:
- **Obsidian Purple (`#210635`)**: Main Dark Canvas Background
- **Surface Deep Purple (`#420D4B`)**: Card, Navbar, & Modal Container
- **Royal Violet (`#7B337E`)**: Primary Accent / Brand Color
- **Soft Slate Blue (`#6667AB`)**: Secondary Accent & Gradient Pair
- **Soft Pink (`#F5D5E0`)**: Typography, Heading, & Highlights

---

## 🎯 2. Pilot Campaign: YouTube @DipanggilKeRuangan
Platform ini dirancang khusus dengan kampanye pilot dari channel YouTube resmi **DiPanggil ke Ruangan** (Host: **Arif Brata & Dara Sarasvati**) dengan episode bintang tamu populer:
1. **Abdur Arsyad & Mamat Alkatiri** - *Debat Panas Politik & Sketsa Timur*
2. **Coki Pardede & Onad** - *Dark Comedy, Pengalaman Rehabilitasi & Industri*
3. **Praz Teguh & Tretan Muslim** - *Madura Pride vs Padang Sambalado*
4. **Dodit Mulyanto** - *Biola Maut & Trik PDKT Gadis Desa*

Hashtag kampanye wajib: `#DipanggilKeRuangan` `#KlipzzViral`

---

## 🔒 3. Proof-of-Ownership: Bio Code Challenge
Platform **tidak menggunakan OAuth resmi** media sosial (menghindari rate limits dan persyaratan akun bisnis).
1. Sistem menghasilkan kode acak 4 karakter unik (contoh: `KLIPZZ-89A2`) dengan masa berlaku 15 menit.
2. Clipper menempelkan kode tersebut di Bio profil TikTok atau Instagram Reels mereka.
3. Server memanggil Apify Low-Cost Scraper untuk membaca profil publik dan memverifikasi kecocokan string di Bio.
4. Setelah terverifikasi, akun terikat secara eksklusif (*one-to-one*) dengan clipper ID di Supabase.

---

## 🛠️ 4. Struktur Arsitektur Monorepo
```
klipzz_vid/
├── backend/                  # Express.js REST API & Apify Webhook Handler
│   ├── src/
│   │   ├── controllers/      # Social, Campaign, Submission, Leaderboard
│   │   ├── services/         # Apify Scraper & Supabase Admin
│   │   └── routes/
│   └── Dockerfile
├── worker/                   # Background Cron Job Engine
│   ├── src/
│   │   ├── tasks/            # Sync metrics berkala & cleanup challenge expired
│   │   └── index.ts
│   └── Dockerfile
├── frontend/                 # Next.js 14 App Router (Tailwind MOON Palette)
│   ├── src/
│   │   ├── app/              # Home, Dashboard, Leaderboard, Campaign Detail
│   │   ├── components/       # Navbar, BioChallengeModal, SubmitClipModal, etc.
│   │   └── types/
│   └── Dockerfile
├── supabase/
│   ├── migrations/           # SQL Schema, Triggers, RLS Policies, Functions
│   └── seed.sql              # Pilot data @DipanggilKeRuangan
├── docker-compose.yml        # Orchestration untuk Self-Hosted VPS / Coolify
└── README.md
```

---

## 🚀 5. Cara Menjalankan Secara Lokal

### A. Database Setup (Supabase)
1. Buat project baru di Supabase.
2. Buka SQL Editor dan eksekusi skrip:
   - `supabase/migrations/20261021_init_schema.sql`
   - `supabase/seed.sql`
3. Salin `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` ke `.env`.

### B. Menjalankan Backend & Worker
```bash
# Terminal 1: Backend API
cd backend
npm install
npm run dev

# Terminal 2: Worker Cron Sync
cd worker
npm install
npm run dev
```

### C. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

---

## 🐳 6. Self-Hosted Deployment (Docker Compose / Coolify)
```bash
cp .env.example .env
# Isi kredensial Supabase & Apify di .env
docker compose up -d --build
```
Semua kontainer (`klipzz_frontend`, `klipzz_backend`, `klipzz_worker`) akan aktif secara mandiri di server Anda.
