# Feature Plan: User Login & Session Management API (ElysiaJS + Drizzle + MySQL)

Dokumen ini berisi panduan perencanaan dan spesifikasi teknis untuk mengimplementasikan fitur autentikasi (login) dan pembuatan sesi pengguna (session token). Panduan ini dirancang agar dapat diimplementasikan secara terstruktur dan jelas oleh junior programmer atau model AI lainnya.

---

## 1. Spesifikasi Database (Tabel `sessions`)

Tabel `sessions` didefinisikan menggunakan Drizzle ORM (MySQL Core) dengan struktur kolom sebagai berikut:

| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `INT` / `serial` | Primary Key, Auto Increment | Identitas unik record sesi |
| `token` | `VARCHAR(255)` | Not Null, Unique | Token UUID unik sesi login pengguna |
| `user_id` | `INT` / `bigint unsigned` | Not Null, Foreign Key | Merujuk ke kolom `id` pada tabel `users` |
| `created_at`| `TIMESTAMP` | Not Null, Default `CURRENT_TIMESTAMP` | Waktu sesi dibuat |

### Catatan Skema:
- Pastikan relasi foreign key mengarah ke `users.id` dengan referensi cascade (misal: `onDelete: "cascade"`).
- Token dibuat menggunakan format **UUID** (misal menggunakan bawaan Web Crypto API: `crypto.randomUUID()`).

---

## 2. Kontrak API (API Contract)

### Endpoint
`POST /api/users/login`

### Request Body (JSON)
```json
{
  "email": "reyhan@email.com",
  "password": "rahasia"
}
```

### Validasi Request
- `email`: String bertipe email, tidak boleh kosong.
- `password`: String, tidak boleh kosong.

### Response

#### Success (`200 OK`)
Mengembalikan token UUID sesi:
```json
{
  "data": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Error - Kredensial Tidak Cocok (`400 Bad Request` / `401 Unauthorized`)
Jika email tidak ditemukan ATAU password tidak cocok:
```json
{
  "error": "Email atau password salah"
}
```

> **Keamanan**: Pesan error sengaja dibuat generik (`"Email atau password salah"`) untuk mencegah *user enumeration attack*.

---

## 3. Konvensi Struktur Folder & Penamaan File

Tetap pertahankan arsitektur pemisahan tanggung jawab (*separation of concerns*):

```text
src/
├── db/
│   ├── schema/
│   │   ├── index.ts            # Barrel file export schema
│   │   ├── users.ts            # Skema tabel users
│   │   └── sessions.ts         # Skema tabel sessions (baru)
│   └── index.ts                # Singleton MySQL client connection
├── routes/                     # Penanganan HTTP request & response (Elysia)
│   ├── health-route.ts         # Format: *-route.ts
│   └── users-route.ts          # Format: *-route.ts (tambahkan endpoint /login)
├── services/                   # Logic bisnis, verifikasi password & query database
│   └── users-service.ts        # Format: *-service.ts (tambahkan method loginUser)
└── index.ts                    # Entry point server Elysia
```

---

## 4. Tahapan Implementasi (Step-by-Step)

### Tahap 1: Pembuatan Skema Database `sessions` (`src/db/schema/sessions.ts`)
1. Buat file baru `src/db/schema/sessions.ts`.
2. Definisikan tabel `sessions` menggunakan `mysqlTable`:
   - `id`: `serial("id").primaryKey()`
   - `token`: `varchar("token", { length: 255 }).notNull().unique()`
   - `userId`: `bigint("user_id", { mode: "number", unsigned: true }).notNull().references(() => users.id, { onDelete: "cascade" })`
   - `createdAt`: `timestamp("created_at").defaultNow().notNull()`
3. Ekspor tipe `Session` dan `NewSession` menggunakan inferensi Drizzle (`$inferSelect`, `$inferInsert`).
4. Daftarkan dan ekspor skema tabel `sessions` pada `src/db/schema/index.ts`.
5. Generate migrasi baru dan sinkronkan dengan database:
   ```bash
   bun run db:generate
   bun run db:push
   ```

### Tahap 2: Menambahkan Logika Bisnis Login (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Tambahkan method `loginUser(input: LoginUserInput)`:
   - **Query User**: Cari user berdasarkan email (`where(eq(users.email, input.email))`).
   - **Verifikasi Keberadaan User**: Jika tidak ditemukan, lemparkan error dengan pesan `"Email atau password salah"`.
   - **Verifikasi Password**: Bandingkan input password plain text dengan hash bcrypt yang ada di database menggunakan `Bun.password.verify(input.password, user.password)`.
   - Jika verifikasi password gagal (`false`), lemparkan error yang sama: `"Email atau password salah"`.
   - **Generate Token**: Buat token UUID baru menggunakan `crypto.randomUUID()`.
   - **Simpan Sesi**: Masukkan record sesi baru ke tabel `sessions` dengan field `token` dan `user_id`.
   - Kembalikan objek `{ data: token }`.

### Tahap 3: Menambahkan Endpoint Login ke Route (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Tambahkan handler route `POST /login`:
   - Definisikan validasi body request menggunakan Elysia `t.Object({ email: t.String(), password: t.String() })`.
   - Panggil service `usersService.loginUser(body)`.
   - Jika sukses, kembalikan response `{ data: token }` dengan status code `200`.
   - Tangkap error (misal: instance `UserRegistrationError` atau buat class custom `AuthError`), set status code `400` (atau `401`), dan kembalikan `{ error: "Email atau password salah" }`.

### Tahap 4: Verifikasi Integrasi Server (`src/index.ts`)
1. Pastikan `usersRoute` terpasang di bawah grup `/api`:
   - Route `POST /login` di dalam `usersRoute` yang memiliki prefix `/users` secara otomatis dapat diakses melalui `POST /api/users/login`.

### Tahap 5: Pengujian & Validasi
1. **Unit & Integration Test (`test/index.test.ts`)**:
   - Buat test case untuk skenario login berhasil:
     - Registrasikan user (jika belum ada).
     - Kirim request `POST /api/users/login` dengan kredensial yang benar.
     - Verifikasi status response `200` dan field `data` berisi string token UUID.
     - Verifikasi token tersebut tersimpan di tabel `sessions`.
   - Buat test case untuk skenario login gagal (email tidak terdaftar):
     - Kirim request dengan email acak.
     - Verifikasi response error `{ error: "Email atau password salah" }` dengan status `400` / `401`.
   - Buat test case untuk skenario login gagal (password salah):
     - Kirim request dengan email valid tetapi password keliru.
     - Verifikasi response error `{ error: "Email atau password salah" }`.
2. **Pengecekan Tipe TypeScript**:
   - Jalankan `bun run typecheck` (`tsc --noEmit`) untuk memastikan tidak ada kesalahan tipe.
3. **Menjalankan Test Suite**:
   - Jalankan `bun test` untuk memastikan semua pengujian lulus.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Tabel `sessions` dibuat dengan kolom `id`, `token`, `user_id` (foreign key ke `users.id`), dan `created_at`.
- [ ] Endpoint `POST /api/users/login` aktif dan menerima body `{ "email": "...", "password": "..." }`.
- [ ] Saat kredensial valid, endpoint merespons dengan status 200 dan body `{ "data": "<token_uuid>" }`.
- [ ] Token yang dihasilkan tersimpan di tabel `sessions` dengan relasi `user_id` yang sesuai.
- [ ] Saat email tidak ditemukan atau password tidak cocok, endpoint merespons `{ "error": "Email atau password salah" }`.
- [ ] Struktur direktori dan konvensi penamaan file `*-route.ts` dan `*-service.ts` tetap konsisten.
- [ ] Seluruh pengujian otomatis lulus (`bun test`) dan lulus type checking (`bun run typecheck`).
