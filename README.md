# Bun + ElysiaJS + Drizzle ORM + MySQL

Backend starter project yang dibangun menggunakan runtime Bun, framework ElysiaJS, Drizzle ORM, dan MySQL database.

---

## 🛠️ Tech Stack
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Driver**: `mysql2`
- **Migration & Tooling**: Drizzle Kit, TypeScript

---

## 📁 Struktur Proyek
```text
.
├── drizzle/              # File migrasi SQL hasil generate Drizzle Kit
├── src/
│   ├── db/
│   │   ├── schema/       # Definisi skema tabel database Drizzle
│   │   │   ├── index.ts
│   │   │   ├── users.ts
│   │   │   └── sessions.ts
│   │   └── index.ts      # Koneksi singleton client database MySQL
│   ├── routes/           # Modul route Elysia (*-route.ts)
│   │   ├── health-route.ts
│   │   └── users-route.ts
│   ├── services/         # Logic bisnis aplikasi (*-service.ts)
│   │   └── users-service.ts
│   └── index.ts          # Entry point server Elysia
├── test/
│   └── index.test.ts     # Unit testing menggunakan Bun test runner
├── .env.example          # Contoh variabel environment
├── drizzle.config.ts     # Konfigurasi Drizzle Kit untuk MySQL
├── package.json
└── tsconfig.json
```

---

## 🚀 Memulai

### 1. Instalasi Dependensi
```bash
bun install
```

### 2. Konfigurasi Environment
Salin file `.env.example` ke `.env` dan sesuaikan kredensial MySQL Anda:
```bash
cp .env.example .env
```

### 3. Skrip Perintah

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run dev` | Menjalankan server development dengan mode auto-reload/watch |
| `bun run start` | Menjalankan server aplikasi |
| `bun run test` | Menjalankan test suite menggunakan Bun test runner |
| `bun run typecheck` | Menjalankan type checking dengan TypeScript compiler |
| `bun run db:generate` | Membuat file migrasi SQL baru dari schema Drizzle |
| `bun run db:push` | Mendorong perubahan skema langsung ke database MySQL |
| `bun run db:migrate` | Menjalankan migrasi database yang tersimpan di folder `drizzle/` |
| `bun run db:studio` | Membuka web UI Drizzle Studio untuk eksplorasi data |

---

## 🔌 API Endpoints

### 1. General & Health
- `GET /`: Status umum server dan info welcome.
- `GET /health`: Pemeriksaan kesehatan server dan konektivitas ke database MySQL.

### 2. Users & Authentication
- `POST /api/users`: Registrasi user baru dengan password yang di-hash bcrypt.
  - **Body (JSON)**:
    ```json
    {
      "name": "Reyhan",
      "email": "reyhan@email.com",
      "password": "rahasia"
    }
    ```
  - **Response Success (200)**:
    ```json
    {
      "data": "OK"
    }
    ```
  - **Response Error (400)**:
    ```json
    {
      "error": "Email sudah terdaftar"
    }
    ```

- `POST /api/users/login`: Login pengguna dan pembuatan sesi token UUID.
  - **Body (JSON)**:
    ```json
    {
      "email": "reyhan@email.com",
      "password": "rahasia"
    }
    ```
  - **Response Success (200)**:
    ```json
    {
      "data": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```
  - **Response Error (400)**:
    ```json
    {
      "error": "Email atau password salah"
    }
    ```

- `GET /api/users/current`: Mengambil profil user yang sedang login menggunakan session token.
  - **Headers**:
    - `Authorization: Bearer <token>`
  - **Response Success (200)**:
    ```json
    {
      "data": {
        "id": 1,
        "name": "Reyhan",
        "email": "reyhan@email.com",
        "created_at": "2026-10-16T14:45:00.000Z"
      }
    }
    ```
  - **Response Error (401)**:
    ```json
    {
      "error": "Unauthorized"
    }
    ```
