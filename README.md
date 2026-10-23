# klipzz.vid - Platform Clipping Campaign DiPanggil ke Ruangan

> **Platform Clipping Campaign & Metrics Tracking Engine** yang menghubungkan brand & media creator dengan para clipper TikTok & Instagram Reels untuk memperluas jangkauan video podcast komedi melalui insentif bagi hasil berbasis views.

---

## 1. MOON Design System & Palet Warna
Sistem desain mengusung estetika *Deep Purple & Glassmorphism* dengan kontras tinggi untuk pengalaman dark mode elegan:
- **Obsidian Purple (`#210635`)**: Main Dark Canvas Background
- **Surface Deep Purple (`#420D4B`)**: Card, Navbar, & Modal Container
- **Royal Violet (`#7B337E`)**: Primary Accent / Brand Color
- **Soft Slate Blue (`#6667AB`)**: Secondary Accent & Gradient Pair
- **Soft Pink (`#F5D5E0`)**: Typography, Heading, & Highlights

---

## 2. Official Campaign Partner: YouTube @DipanggilKeRuangan
Platform ini terintegrasi dengan channel YouTube resmi **DiPanggil ke Ruangan** (Host: **Arif Brata & Dara Sarasvati**) dengan episode bintang tamu populer:
1. **Abdur Arsyad & Mamat Alkatiri** - *Gara-gara Abdur, Mamat Alkatiri Udah Gamau Main Film Lagi!*
2. **Dodit Mulyanto & Laura Moane** - *Perubahan Dodit Mulyanto Bikin Laura Moane Bertanya-tanya*
3. **Duo Bahlul** - *Duo Bahlul Ternyata Seorang Duo yang Jarang Nongkrong Bareng*
4. **Aldi Taher** - *Aldi Taher Cerita Master Saiful Datang di Waktu yang Tepat!*

Hashtag kampanye wajib: `#DipanggilKeRuangan` `#KlipzzViral`

---

## 3. Proof-of-Ownership: Bio Code Challenge
Platform **tidak menggunakan OAuth resmi** media sosial (menghindari rate limits dan persyaratan akun bisnis).
1. Sistem menghasilkan kode acak 4 karakter unik (contoh: `KLIPZZ-89A2`) dengan masa berlaku 15 menit.
2. Clipper menempelkan kode tersebut di Bio profil TikTok atau Instagram Reels mereka.
3. Server memanggil Apify Low-Cost Scraper untuk membaca profil publik dan memverifikasi kecocokan string di Bio.
4. Setelah terverifikasi, akun terikat secara eksklusif (*one-to-one*) dengan clipper ID di Supabase.

---

## 4. Struktur Arsitektur Monorepo
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
│   └── seed.sql              # Official campaigns seed data (@DipanggilKeRuangan)
├── docker-compose.yml        # Orchestration untuk Self-Hosted VPS / Coolify
└── README.md
```

---

## 5. Cara Menjalankan Secara Lokal

### A. Database Setup (Supabase)
1. Buat project baru di Supabase.
2. Buka SQL Editor dan eksekusi skrip **secara berurutan**:
   - `supabase/migrations/20261021_init_schema.sql`
   - `supabase/migrations/20261023_security_hardening.sql`
   - `supabase/seed.sql` (opsional, hanya untuk data demo)
3. Salin `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` ke `.env`.
   `SUPABASE_SERVICE_ROLE_KEY` **wajib** berisi service role secret asli (bukan anon/publishable key).
4. Migrasi hardening mengaktifkan RLS, mencabut write langsung dari client, dan menyembunyikan
   `profiles.balance`/`profiles.email`. Frontend hanya membaca lewat kolom yang diizinkan dan
   RPC `get_my_profile()`; semua penulisan sensitif harus lewat backend API.
5. Jangan jalankan ulang migrasi `init_schema` di database produksi yang sudah berisi data.

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

Catatan deployment:
- Default production memakai **same-origin** `/api`: browser memanggil `https://domain-kamu/api`, lalu Next.js mem-proxy ke `API_PROXY_TARGET` (default `http://127.0.0.1:4000`). Backend tidak perlu diekspos ke internet.
- Jika backend berjalan di host/port lain, set `API_PROXY_TARGET` (contoh: `http://127.0.0.1:4100`). Di Docker Compose nilainya otomatis `http://backend:4000`.
- Alternatif: set `NEXT_PUBLIC_API_URL` ke URL API publik yang bisa diakses browser (contoh `https://api.domain.com/api`). Jangan pernah memakai `localhost` untuk build produksi.
- `NEXT_PUBLIC_*` dibaca saat build, jadi isi lewat build args / environment sebelum build/deploy.
- Isi `CORS_ORIGIN` dengan origin frontend (dipisah koma jika lebih dari satu).
- Biarkan `ALLOW_SIMULATION=false` di produksi; worker akan gagal/skip alih-alih membuat metrik palsu.

---

### Troubleshooting: detail campaign blank / chunk 404
Jika halaman `/campaign/...` kosong dan console browser menunjukkan `404` untuk file seperti
`/_next/static/chunks/app/campaign/[id]/page-xxxx.js`, berarti server menyajikan HTML dari build lama
tetapi folder `.next/static` sudah diganti build baru (atau upload build tidak lengkap).
Lakukan rebuild bersih, jangan build saat aplikasi masih berjalan:

```bash
cd frontend
rm -rf .next
npm ci
npm run build
# baru setelah build selesai: restart aplikasi (Plesk Node.js / PM2 / Docker)
```

Jika memakai Docker, jalankan `docker compose build --no-cache frontend && docker compose up -d frontend`.
Jangan menyalin sebagian isi `.next`; deploy seluruh hasil build secara atomik.

## 🔐 7. Keamanan & Rotasi Secret
- Semua penulisan campaign, submission, dan verifikasi akun sosial dilakukan oleh backend dengan
  token Supabase pengguna; backend memakai service role dan tidak mempercayai `user_id` dari body/query.
- Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, atau `APIFY_API_TOKEN` di
  `frontend/.env.local` atau variabel `NEXT_PUBLIC_*`.
- Jika secret pernah ter-commit atau terkirim di chat: rotasi service role key, database password,
  dan Apify token di dashboard masing-masing, lalu perbarui `.env` server.
- Ganti password akun seed (`admin`, `clipper_hans`) sebelum dipakai di produksi, atau buat akun baru
  lewat halaman signup. Role `admin` tidak dapat dibuat dari signup publik.
