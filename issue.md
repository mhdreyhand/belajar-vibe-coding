# Project Setup: Bun + ElysiaJS + Drizzle ORM + MySQL

## 1. Overview
Inisialisasi dan konfigurasi fondasi backend project baru menggunakan runtime Bun, web framework ElysiaJS, Drizzle ORM, dan database MySQL. Dokumen ini menyajikan panduan arsitektur tingkat tinggi bagi developer atau model AI untuk mengimplementasikan proyek ini secara terstruktur.

---

## 2. Tech Stack
- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Web Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Engine & Driver**: MySQL (`mysql2`)
- **Tooling**: Drizzle Kit (migrasi & manajemen skema), TypeScript

---

## 3. High-Level Implementation Steps

### Phase 1: Project Initialization & Environment Setup
- Inisialisasi proyek TypeScript menggunakan Bun (`bun init`).
- Pasang dependensi inti:
  - `elysia`
  - `drizzle-orm`
  - `mysql2`
- Pasang dependensi pengembangan (devDependencies):
  - `drizzle-kit`
  - `@types/node` (atau type definition terkait jika dibutuhkan)
- Siapkan konfigurasi environment:
  - Template `.env.example` dan `.env` yang memuat variabel koneksi database MySQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
  - `.gitignore` untuk mengecualikan `node_modules`, file environment (`.env`), dan build artifacts.

### Phase 2: Database Connection & Drizzle Configuration
- Konfigurasi Drizzle (`drizzle.config.ts`) dengan dialect `mysql`, direktori schema, dan kredensial koneksi.
- Buat modul inisialisasi koneksi database (singleton pool connection) yang menghubungkan Drizzle dengan MySQL.
- Daftarkan skrip `package.json` untuk alur kerja migrasi Drizzle Kit (`db:generate`, `db:migrate`, `db:push`, `db:studio`).

### Phase 3: Modular Project Structure & Schema Modeling
- Susun struktur direktori yang modular dan rapi di dalam `src/`:
  - `src/db/`: Koneksi database (`index.ts`) dan definisi skema Drizzle (`schema/`).
  - `src/routes/` atau `src/modules/`: Pengelompokan route / controller API.
  - `src/index.ts`: Entry point aplikasi server.
- Definisikan contoh skema awal (misalnya tabel `users` atau health log sederhana) sebagai representasi skema dasar.

### Phase 4: Elysia Server Setup & Routing
- Bangun entry point server menggunakan ElysiaJS di `src/index.ts`.
- Konfigurasi listener port dan host dari environment variable atau fallback default.
- Sediakan endpoint verifikasi dasar:
  - `GET /`: Status ringkas / welcome endpoint.
  - `GET /health`: Health check untuk memverifikasi server berjalan serta konektivitas query ke MySQL melalui Drizzle.

---

## 4. Acceptance Criteria
- [ ] Proyek dapat dijalankan secara lancar dengan perintah Bun (misal: `bun run dev`).
- [ ] Server Elysia aktif dan dapat merespons permintaan HTTP.
- [ ] Koneksi database MySQL berhasil terhubung dan divalidasi melalui Drizzle ORM.
- [ ] Drizzle Kit terkonfigurasi dan dapat membaca schema tanpa error.
- [ ] Struktur folder bersih, terorganisir, dan siap untuk pengembangan modul lanjutan.
