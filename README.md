# EduRaport Frontend Workspace

Monorepo frontend berbasis `pnpm` workspace dan `Turborepo` menggunakan `Nuxt 4`, `Vue 3`, dan `Tailwind CSS`.

## Struktur Workspace

- `apps/web` (`@eduraport/web`): Aplikasi utama EduRaport (portal yayasan, sekolah, guru, absensi, keuangan, ekstrakurikuler, scanner PWA). Default `.env` port `3001`.
- `apps/platform-admin` (`@eduraport/platform-admin`): Dashboard Superadmin platform (`nuxt dev --port 3002`).
- `packages/ui` (`@eduraport/ui`): Library komponen UI bersama (`BaseInput`, `BaseDateInput`, `BaseModal`, dll.).
- `packages/shared` (`@eduraport/shared`): Tipe dan utilitas bersama lintas aplikasi frontend.

## Prasyarat

- **Node.js** & **pnpm** (`packageManager: pnpm@11.7.0`)
- Backend API (`@eduraport/api`) sudah berjalan (default lokal di `http://localhost:3000`).

## Konfigurasi Environment

1. Salin file `.env.example` di `apps/web`:

```bash
cp apps/web/.env.example apps/web/.env
```

2. Sesuaikan isi `apps/web/.env`:
   - `NUXT_PUBLIC_API_BASE`: Endpoint API backend.
     - Untuk development lokal langsung ke backend port `3000`, gunakan `http://localhost:3000/api/v1` (karena default `routeRules` proxy `/api/v1/**` di `apps/web/nuxt.config.ts` mengarah ke host container staging `eduraport_backend_staging:3002`).
     - Untuk deployment di belakang reverse proxy dengan path `/api/v1`, gunakan `/api/v1`.
   - `PORT`: Port server dev `apps/web` (default contoh: `3001`).
   - `HTTPS`: Set `true` jika ingin dev server berjalan dengan HTTPS lokal (dibutuhkan untuk menguji kamera QR scanner di browser non-localhost).
   - `NUXT_PUBLIC_PLATFORM_ADMIN_URL`: URL dashboard `platform-admin` (default `http://localhost:3002`).

## Instalasi

Jalankan dari direktori `frontend/`:

```bash
pnpm install
```

## Menjalankan Aplikasi (Development)

Jalankan dari direktori `frontend/`:

```bash
# Jalankan aplikasi utama @eduraport/web (port 3001 sesuai .env)
pnpm dev:web

# Jalankan dashboard Superadmin @eduraport/platform-admin (port 3002)
pnpm dev:admin

# Jalankan seluruh app workspace secara paralel via Turborepo
# (Catatan: pada server dengan RAM terbatas, jalankan satu app saja seperti pnpm dev:web)
pnpm dev
```

## Build, Preview & Check

```bash
# Build aplikasi web saja (lebih hemat RAM daripada build semua workspace)
pnpm build:web

# Build platform-admin saja
pnpm build:admin

# Build seluruh app & package via Turborepo
pnpm build

# Lint & test workspace
pnpm lint
pnpm test
```

Untuk menjalankan preview hasil build `apps/web`:

```bash
pnpm --filter @eduraport/web preview
```

## Menjalankan via Docker Compose

Dari root repositori (`eduraport/`), `docker-compose.yml` membangun service `frontend` dan mengekspos container ke port host `3001` (`3001:3000`):

```bash
docker compose up -d frontend
```
