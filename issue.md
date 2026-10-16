# Feature Plan: User Registration API (ElysiaJS + Drizzle + MySQL)

Dokumen ini berisi panduan perencanaan dan spesifikasi teknis untuk mengimplementasikan fitur registrasi user baru. Panduan ini dirancang agar dapat diimplementasikan secara mudah dan terstruktur oleh junior programmer atau model AI lainnya.

---

## 1. Spesifikasi Database (Tabel `users`)

Tabel `users` didefinisikan menggunakan Drizzle ORM (MySQL Core) dengan struktur kolom sebagai berikut:

| Kolom | Tipe Data | Atribut | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `INT` / `serial` | Primary Key, Auto Increment | Identitas unik user |
| `name` | `VARCHAR(255)` | Not Null | Nama lengkap user |
| `email` | `VARCHAR(255)` | Not Null, Unique | Alamat email user |
| `password` | `VARCHAR(255)` | Not Null | Password yang telah di-hash menggunakan **bcrypt** |
| `created_at`| `TIMESTAMP` | Not Null, Default `CURRENT_TIMESTAMP` | Waktu data dibuat |

---

## 2. Kontrak API (API Contract)

### Endpoint
`POST /api/users`

### Request Body (JSON)
```json
{
  "name": "Reyhan",
  "email": "reyhan@email.com",
  "password": "rahasia"
}
```

### Validasi Request
- `name`: String, minimal 1 karakter, wajib diisi.
- `email`: String bertipe format email valid, wajib diisi.
- `password`: String, minimal panjang tertentu (misal: min 6 karakter), wajib diisi.

### Response

#### Success (`201 Created` atau `200 OK`)
```json
{
  "data": "OK"
}
```

#### Error - Email Sudah Terdaftar (`400 Bad Request` / `409 Conflict`)
```json
{
  "error": "Email sudah terdaftar"
}
```

---

## 3. Konvensi Struktur Folder & Penamaan File

Proyek menggunakan pemisahan tanggung jawab (*separation of concerns*) antara routing dan *business logic*:

```text
src/
├── db/
│   ├── schema/
│   │   ├── index.ts
│   │   └── users.ts            # Skema Drizzle untuk tabel users
│   └── index.ts                # Koneksi database MySQL
├── routes/                     # Definisi HTTP endpoint dan validasi request (Elysia)
│   └── users-route.ts          # Format penamaan: *-route.ts
├── services/                   # Business logic, query database, hashing password
│   └── users-service.ts        # Format penamaan: *-service.ts
└── index.ts                    # Entry point server Elysia (mounting router)
```

---

## 4. Tahapan Implementasi (Step-by-Step)

### Tahap 1: Pembaruan Skema Database (`src/db/schema/users.ts`)
1. Buka atau perbarui file skema tabel `users` di `src/db/schema/users.ts`.
2. Pastikan field `password` (`varchar("password", { length: 255 }).notNull()`) sudah ditambahkan ke dalam definisi tabel.
3. Ekspor tipe `User` dan `NewUser` menggunakan inferensi tipe Drizzle (`$inferSelect` dan `$inferInsert`).
4. Generate file migrasi baru menggunakan perintah:
   ```bash
   bun run db:generate
   ```

### Tahap 2: Implementasi Business Logic (`src/services/users-service.ts`)
1. Buat file baru `src/services/users-service.ts`.
2. Implementasikan fungsi untuk registrasi user (misalnya `registerUser`):
   - **Cek Duplikasi Email**: Query ke database untuk memastikan apakah email sudah terdaftar di tabel `users`.
   - **Error Handling Duplikasi**: Jika email sudah ada, lemparkan error atau kembalikan response error dengan pesan `"Email sudah terdaftar"`.
   - **Hashing Password**: Hash plain text password menggunakan algoritma **bcrypt**.
     > *Catatan*: Di runtime Bun, dapat memanfaatkan `Bun.password.hash(password, { algorithm: "bcrypt" })` secara bawaan tanpa dependensi eksternal, atau menggunakan library seperti `bcryptjs`.
   - **Insert ke Database**: Simpan record baru ke database menggunakan Drizzle ORM (`db.insert(users).values(...)`).
   - Kembalikan hasil sukses.

### Tahap 3: Implementasi Routing & Validasi (`src/routes/users-route.ts`)
1. Buat file baru `src/routes/users-route.ts`.
2. Inisialisasi instance Elysia dengan prefix `/users`:
   ```typescript
   export const usersRoute = new Elysia({ prefix: "/users" })
   ```
3. Definisikan handler untuk method `POST /`:
   - Gunakan skema validasi tipe data bawaan Elysia (`t.Object`) untuk memastikan body request memiliki field `name`, `email`, dan `password`.
   - Panggil service `registerUser` dari `src/services/users-service.ts`.
   - Jika proses registrasi berhasil, set status code HTTP yang sesuai (misal: `201`) dan kembalikan `{ "data": "OK" }`.
   - Tangkap kemungkinan error (seperti email duplikat), lalu set status code HTTP (misal: `400`) dan kembalikan format `{ "error": "Email sudah terdaftar" }`.

### Tahap 4: Integrasi Router ke Server Utama (`src/index.ts`)
1. Buka file `src/index.ts`.
2. Daftarkan router `usersRoute` di bawah prefix `/api`:
   ```typescript
   import { usersRoute } from "./routes/users-route";

   app.group("/api", (api) => api.use(usersRoute));
   ```
3. Pastikan server tetap menyala dan mendengarkan port yang sesuai.

### Tahap 5: Pengujian & Verifikasi
1. **Unit / Integration Test (`test/users.test.ts`)**:
   - Buat test case untuk skenario sukses registrasi user baru.
   - Buat test case untuk skenario gagal saat mendaftarkan email yang sama (memastikan pesan error `"Email sudah terdaftar"`).
   - Jalankan `bun test` untuk memastikan semua pengujian lulus.
2. **Type Checking**:
   - Jalankan `bun run typecheck` untuk memastikan tidak ada kesalahan tipe TypeScript.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Tabel `users` memiliki kolom `id`, `name`, `email`, `password`, dan `created_at` sesuai spesifikasi.
- [ ] Endpoint `POST /api/users` berhasil merespons `{ "data": "OK" }` jika data valid dan email belum pernah digunakan.
- [ ] Endpoint `POST /api/users` merespons `{ "error": "Email sudah terdaftar" }` jika email sudah ada di database.
- [ ] Password yang tersimpan di database adalah hash bcrypt yang valid (bukan plain text).
- [ ] Struktur direktori dan penamaan file mematuhi konvensi `src/routes/*-route.ts` dan `src/services/*-service.ts`.
- [ ] Kode lulus pengecekan TypeScript (`bun run typecheck`) dan unit test (`bun test`).
