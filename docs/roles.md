# Sistem Multi-Role

Dokumentasi lengkap sistem role dan akses kontrol di GAS Workspace Hub.

---

## Daftar Roles

Sistem mendukung 5 role bawaan (didefinisikan di `VALID_ROLES` di `AdminAPI.gs`):

| Role | Deskripsi |
|:-----|:----------|
| `admin` | Administrator — akses penuh ke semua fitur dan semua apps |
| `kepsek` | Kepala sekolah |
| `guru` | Guru / pengajar |
| `orangtua` | Orang tua / wali murid |
| `siswa` | Siswa |

---

## Hierarki Akses

- **Admin**: Bisa mengakses **semua** apps tanpa memperhatikan `allowedRoles`. Admin juga bisa mengakses admin panel untuk CRUD users & apps.
- **Role lain**: Hanya bisa mengakses apps yang mencantumkan role mereka di kolom `allowedRoles` di tab `apps`, **kecuali** ada override per user (lihat bagian Hybrid Access Control).

Role bersifat **flat** (tidak ada hierarki selain admin override). `kepsek` tidak otomatis punya akses lebih dari `guru`.

---

## Kolom `kelas`

- **Lokasi**: Kolom H di tab `users`, kolom J di tab `sessions`.
- **Fungsi**: Identifikasi kelas siswa (contoh: `7A`, `8B`, `9C`).
- **Terpisah dari role**: `kelas` bukan role — seorang `siswa` punya role `siswa` dan kelas `7A`.
- **Opsional**: Tidak wajib diisi. Berguna untuk filtering atau identifikasi tambahan di child apps.

---

## Kolom `apps` (Override per User)

- **Lokasi**: Kolom I di tab `users`.
- **Format**: Comma-separated app IDs (contoh: `app1,app3,app5`).
- **Fungsi**: Memberikan akses tambahan ke apps tertentu di luar role default user.
- **Opsional**: Jika kosong, user hanya bisa mengakses apps sesuai role-nya.

---

## Hybrid Access Control

Sistem menggunakan **hybrid approach**: role-based default + user-specific override.

### Algoritma Penentuan Akses

```
Untuk setiap app di tab 'apps':
  1. Jika user.role == 'admin' → AKSES (admin bypass semua)
  2. Jika user.apps berisi app.id → AKSES (override per user)
  3. Jika app.allowedRoles berisi user.role → AKSES (role-based default)
  4. Selain itu → TIDAK ADA AKSES
```

### Kolom `allowedRoles` di Tab `apps`

- **Lokasi**: Kolom F di tab `apps`.
- **Format**: Comma-separated roles (contoh: `guru,siswa`).
- **Fungsi**: Menentukan role mana yang secara default bisa mengakses app ini.
- **Sebelumnya**: Kolom ini bernama `requiredRole` (single role). Diubah ke `allowedRoles` (multi-role) di P2.

---

## Cara Assign Role

### Via Admin Panel (`admin.html`)

1. Login sebagai admin.
2. Buka admin panel (akses via bottom navbar atau URL `?token=xxx&page=admin`).
3. Di tab **Users**, klik "Tambah User" atau edit user yang ada.
4. Pilih role dari daftar `VALID_ROLES`.
5. (Opsional) Isi kolom `kelas` dan `apps`.

### Via Google Sheet (Edit Langsung)

1. Buka Google Spreadsheet (ID di Script Property `USERS_SHEET_ID`).
2. Di tab `users`, edit kolom `role` (D) langsung.
3. Pastikan nilai role sesuai dengan `VALID_ROLES`: `admin`, `kepsek`, `guru`, `orangtua`, `siswa`.

---

## Contoh Skenario

### Guru Kelas 7A

| Kolom | Nilai |
|:------|:------|
| email | `guru.ani@sekolah.id` |
| phone | `6281234567001` |
| nama | `Ani Guru` |
| role | `guru` |
| kelas | `7A` |
| apps | *(kosong)* |

→ Bisa mengakses semua apps dengan `allowedRoles` yang berisi `guru`.

### Siswa dengan Akses App Tambahan

| Kolom | Nilai |
|:------|:------|
| email | `siswa.budi@sekolah.id` |
| phone | `6281234567002` |
| nama | `Budi Siswa` |
| role | `siswa` |
| kelas | `8B` |
| apps | `perpustakaan,lab-komputer` |

→ Bisa mengakses apps untuk role `siswa` **plus** apps `perpustakaan` dan `lab-komputer` (meskipun apps tersebut mungkin tidak mencantumkan `siswa` di `allowedRoles`).

### Orang Tua

| Kolom | Nilai |
|:------|:------|
| email | `wali.citra@gmail.com` |
| phone | `6281234567003` |
| nama | `Citra Wali` |
| role | `orangtua` |
| kelas | *(kosong)* |
| apps | *(kosong)* |

→ Bisa mengakses apps dengan `allowedRoles` yang berisi `orangtua`. Kolom `kelas` tidak relevan untuk orang tua.

### Admin

| Kolom | Nilai |
|:------|:------|
| email | `admin@sekolah.id` |
| phone | `6281234567000` |
| nama | `Admin Sekolah` |
| role | `admin` |
| kelas | *(kosong)* |
| apps | *(kosong)* |

→ Bisa mengakses **semua** apps + admin panel. Tidak perlu kolom `apps` karena admin bypass semua.
