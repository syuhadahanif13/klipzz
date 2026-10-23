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

## 4. Struktur Arsitektur (Single Next.js App)
```
klipzz_vid/
├── frontend/                 # Next.js 14: UI + API Route Handlers (satu proses)
│   ├── src/
│   │   ├── app/              # Home, Dashboard, Leaderboard, Campaign Detail
│   │   ├── app/api/          # health, social, campaigns, submissions, leaderboard, cron
│   │   ├── server/           # Supabase admin, Apify, rate limit, sync, cleanup
│   │   ├── components/       # Navbar, BioChallengeModal, SubmitClipModal, etc.
│   │   └── types/
│   └── Dockerfile
├── supabase/
│   ├── migrations/           # SQL Schema, Triggers, RLS Policies, Functions
│   └── seed.sql              # Official campaigns seed data (@DipanggilKeRuangan)
├── backend/                  # LEGACY: tidak dipakai/di-deploy lagi (referensi)
├── worker/                   # LEGACY: diganti Plesk Scheduled Tasks
├── docker-compose.yml        # Satu container Next.js
└── README.md
```

Semua endpoint API sekarang berada di `frontend/src/app/api/`. Frontend memanggil
`/api/...` secara same-origin; tidak ada Express server, PM2, subdomain API, atau
reverse proxy terpisah. Supabase tetap menjadi database & auth provider.

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
   RPC `get_my_profile()`; semua penulisan sensitif harus lewat Next.js Route Handlers.
5. Jangan jalankan ulang migrasi `init_schema` di database produksi yang sudah berisi data.

### B. Menjalankan Frontend + API (satu proses)
```bash
cd frontend
npm install
npm run dev
```
Buka browser di `http://localhost:3001`.

Buat `frontend/.env.local` berisi:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=/api

# Server-only (jangan pakai prefix NEXT_PUBLIC_)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
APIFY_API_TOKEN=...
ALLOW_SIMULATION=false
APIFY_TIMEOUT_MS=120000
CRON_SECRET=secret-lokal-panjang
```

Endpoint API berjalan di proses Next.js yang sama:
- `GET  /api/health`
- `POST /api/social/challenge`
- `POST /api/social/verify`
- `GET  /api/social/accounts`
- `GET/POST /api/campaigns`
- `GET  /api/campaigns/:id`
- `POST /api/submissions`
- `GET  /api/submissions/clipper/:clipperId`
- `GET  /api/leaderboard`
- `GET/POST /api/cron/sync-metrics` (butuh `Authorization: Bearer $CRON_SECRET`)
- `GET/POST /api/cron/cleanup` (butuh `Authorization: Bearer $CRON_SECRET`)

Contoh menjalankan sync manual saat development:
```bash
curl -H "Authorization: Bearer secret-lokal-panjang" \
  http://localhost:3001/api/cron/sync-metrics
```

---

## 🐳 6. Self-Hosted Deployment (Docker Compose / Coolify)
```bash
cp .env.example .env
# Isi kredensial Supabase, Apify, dan CRON_SECRET di .env
docker compose up -d --build
```
Hanya ada satu container: `klipzz_frontend` (UI + `/api` Route Handlers).

Catatan deployment:
- Production memakai **same-origin** `/api`: browser memanggil `https://domain-kamu/api`, dan request itu ditangani langsung oleh Next.js. Tidak ada proxy ke Express.
- `NEXT_PUBLIC_*` dibaca saat build, jadi isi lewat build args / environment sebelum build/deploy.
- `SUPABASE_SERVICE_ROLE_KEY`, `APIFY_API_TOKEN`, dan `CRON_SECRET` hanya untuk server. Jangan pernah memakai prefix `NEXT_PUBLIC_`.
- Biarkan `ALLOW_SIMULATION=false` di produksi; cron akan gagal/skip alih-alih membuat metrik palsu.
- Apify bisa memakan waktu sampai ~120 detik. Pastikan reverse proxy/Plesk mengizinkan timeout lebih besar:
  ```nginx
  proxy_read_timeout 180s;
  proxy_send_timeout 180s;
  ```
- **Plesk Scheduled Tasks** menggantikan worker selalu-hidup:
  - Tiap 15 menit: `GET https://klipzz.rajaemas.dev/api/cron/sync-metrics`
  - Tiap jam: `GET https://klipzz.rajaemas.dev/api/cron/cleanup`
  - Kirim header `Authorization: Bearer <CRON_SECRET>`.
- Setelah deploy, subdomain `apiklip.rajaemas.dev`, proses PM2 backend/worker, dan konfigurasi reverse proxy API lama boleh dihentikan.

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
- Semua penulisan campaign, submission, dan verifikasi akun sosial dilakukan oleh Next.js Route
  Handlers dengan token Supabase pengguna; handler memakai service role dan tidak mempercayai
  `user_id` dari body/query.
- Secret server (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `APIFY_API_TOKEN`, `CRON_SECRET`)
  hanya boleh ada di environment server / `frontend/.env.local` (lokal). Jangan pernah memakai
  prefix `NEXT_PUBLIC_` untuk nilai tersebut.
- Jika secret pernah ter-commit atau terkirim di chat: rotasi service role key, database password,
  Apify token, dan `CRON_SECRET` di dashboard masing-masing, lalu perbarui environment server.
- Ganti password akun seed (`admin`, `clipper_hans`) sebelum dipakai di produksi, atau buat akun baru
  lewat halaman signup. Role `admin` tidak dapat dibuat dari signup publik.
