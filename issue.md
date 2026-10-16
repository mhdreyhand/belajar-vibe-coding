# Feature Plan: Get Current User API (ElysiaJS + Drizzle + MySQL)

Dokumen ini berisi panduan perencanaan dan spesifikasi teknis untuk mengimplementasikan endpoint API pengambilan profil user yang sedang aktif login (*Get Current User*). Panduan ini dirancang agar dapat diimplementasikan secara terstruktur dan mudah dipahami oleh junior programmer atau model AI lainnya.

---

## 1. Overview & Alur Autentikasi

Pengguna yang telah melakukan login akan menyertakan token sesi pada header `Authorization` dengan format `Bearer <token>`. Server akan memvalidasi token tersebut ke tabel `sessions` untuk menemukan user yang terkait di tabel `users`, kemudian mengembalikan data profil pengguna tanpa menyertakan password.

---

## 2. Kontrak API (API Contract)

### Endpoint
`GET /api/users/current`

### Request Headers
| Header | Nilai / Format | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `Authorization` | `Bearer <token>` | Ya | Token sesi UUID yang diperoleh saat login |

### Response

#### Success (`200 OK`)
Mengembalikan data profil user yang sedang login (tanpa kolom `password`):
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

#### Error - Unauthorized (`401 Unauthorized`)
Terjadi jika:
1. Header `Authorization` tidak dikirim.
2. Format header tidak valid (tidak diawali `Bearer `).
3. Token tidak ditemukan di database (tabel `sessions`).
4. User yang terkait dengan token tidak ditemukan di tabel `users`.

```json
{
  "error": "Unauthorized"
}
```

---

## 3. Konvensi Struktur Folder & Penamaan File

Tetap pertahankan arsitektur pemisahan tanggung jawab (*separation of concerns*):

```text
src/
├── db/
│   ├── schema/
│   │   ├── index.ts            # Barrel file export schema
│   │   ├── users.ts            # Skema tabel users
│   │   └── sessions.ts         # Skema tabel sessions
│   └── index.ts                # Singleton MySQL client connection
├── routes/                     # Penanganan HTTP request & response (Elysia)
│   ├── health-route.ts         # Format: *-route.ts
│   └── users-route.ts          # Format: *-route.ts (tambahkan endpoint GET /current)
├── services/                   # Logic bisnis, query database & validasi sesi
│   └── users-service.ts        # Format: *-service.ts (tambahkan method getCurrentUser)
└── index.ts                    # Entry point server Elysia
```

---

## 4. Tahapan Implementasi (Step-by-Step)

### Tahap 1: Implementasi Logika Bisnis di Service (`src/services/users-service.ts`)
1. Buka file `src/services/users-service.ts`.
2. Tambahkan method `getCurrentUser(token: string)`:
   - **Query Sesi & User**: Lakukan query ke database untuk mencari sesi berdasarkan `token`.
     - Bisa menggunakan relasi `innerJoin` antara tabel `sessions` dan `users` berdasarkan `sessions.userId = users.id`.
     - Atau query ke tabel `sessions` terlebih dahulu, lalu query ke tabel `users` berdasarkan `user_id`.
   - **Validasi Keberadaan Sesi**:
     - Jika token tidak ditemukan di tabel `sessions`, lemparkan `AuthError("Unauthorized", 401)`.
     - Jika user yang berelasi tidak ditemukan, lemparkan `AuthError("Unauthorized", 401)`.
   - **Sanitasi Data**:
     - Ambil hanya kolom yang dibutuhkan: `id`, `name`, `email`, dan `createdAt`.
     - **PENTING**: Jangan pernah menyertakan kolom `password` pada output kembalian.
   - Kembalikan objek `{ data: { id, name, email, created_at: createdAt } }`.

### Tahap 2: Menambahkan Endpoint GET `/current` di Router (`src/routes/users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Tambahkan handler route `GET /current` di dalam `usersRoute`:
   - Ambil header `authorization` dari parameter request context: `{ headers, set }`.
   - Lakukan parsing token:
     ```typescript
     const authHeader = headers["authorization"];
     if (!authHeader || !authHeader.startsWith("Bearer ")) {
       set.status = 401;
       return { error: "Unauthorized" };
     }
     const token = authHeader.slice(7).trim();
     if (!token) {
       set.status = 401;
       return { error: "Unauthorized" };
     }
     ```
   - Panggil service `usersService.getCurrentUser(token)`.
   - Jika berhasil, kembalikan objek data dengan status `200`.
   - Jika service melempar `AuthError`, set status code sesuai error (`401`) dan kembalikan `{ error: error.message }`.

### Tahap 3: Verifikasi Integrasi Server (`src/index.ts`)
1. Karena `usersRoute` sudah di-*mount* di bawah `/api` dengan prefix `/users`, route `GET /current` otomatis dapat diakses melalui `GET /api/users/current`.
2. Pastikan tidak ada konflik route dengan route lainnya.

### Tahap 4: Pengujian & Validasi (`test/index.test.ts`)
1. **Test Case 1: GET `/api/users/current` Sukses**:
   - Lakukan registrasi user baru (atau gunakan user yang sudah ada).
   - Lakukan login `POST /api/users/login` untuk mendapatkan token sesi UUID.
   - Kirim request `GET /api/users/current` dengan header `Authorization: Bearer <token>`.
   - Verifikasi status response `200`.
   - Verifikasi body response memuat `data.id`, `data.name`, `data.email`, dan `data.created_at`.
   - Pastikan field `password` **TIDAK ADA** di dalam response.
2. **Test Case 2: GET `/api/users/current` Gagal Tanpa Header Authorization**:
   - Kirim request tanpa menyertakan header `Authorization`.
   - Verifikasi response status `401` dan body `{ "error": "Unauthorized" }`.
3. **Test Case 3: GET `/api/users/current` Gagal Dengan Token Invalid**:
   - Kirim request dengan header `Authorization: Bearer token-ngawur-yang-tidak-ada`.
   - Verifikasi response status `401` dan body `{ "error": "Unauthorized" }`.
4. **Pengecekan Tipe TypeScript**:
   - Jalankan `bun run typecheck` (`tsc --noEmit`) untuk memastikan tidak ada kesalahan tipe data.
5. **Menjalankan Test Suite**:
   - Jalankan `bun test` untuk memastikan semua pengujian lulus.

---

## 5. Kriteria Penerimaan (Acceptance Criteria)

- [ ] Endpoint `GET /api/users/current` dapat diakses dan membaca token dari header `Authorization: Bearer <token>`.
- [ ] Response sukses berstatus `200` dengan body:
  ```json
  {
    "data": {
      "id": 1,
      "name": "Reyhan",
      "email": "reyhan@email.com",
      "created_at": "timestamp"
    }
  }
  ```
- [ ] Kolom `password` tidak ikut terekspos di dalam response data pengguna.
- [ ] Jika header `Authorization` tidak ada, tidak valid, atau token tidak ditemukan di tabel `sessions`, API merespons dengan status `401` dan body `{ "error": "Unauthorized" }`.
- [ ] Struktur direktori dan konvensi penamaan file `*-route.ts` dan `*-service.ts` tetap konsisten.
- [ ] Seluruh pengujian otomatis lulus (`bun test`) dan lulus type checking (`bun run typecheck`).
