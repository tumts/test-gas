# GAS Workspace Hub

Sistem autentikasi terpusat (Single Sign-On) untuk aplikasi **Google Apps Script** webapp. Mendukung login via **akun Google** dan **OTP WhatsApp**, dengan manajemen session dan dashboard hub.

## **Fitur Utama**

* **Dual Login**: Login via Google OAuth 2.0 (Authorization Code flow) atau OTP WhatsApp (GOWA API).
* **Whitelist User**: Hanya email/nomor terdaftar yang bisa login.
* **Hub Dashboard**: Dashboard terpusat menampilkan daftar aplikasi yang bisa diakses.
* **Session Terpusat**: Session disimpan di Google Sheet, memungkinkan SSO ke beberapa Apps Script webapp.
* **App Registry**: Daftar aplikasi dikelola via Google Sheet.
* **Audit Log**: Pencatatan aktivitas login/logout/akses.
* **Auto Cleanup**: Scheduled trigger untuk membersihkan session expired dan log lama.

## **Struktur File**

| File | Fungsi |
| :---- | :---- |
| Code.gs | Controller utama (routing doGet/doPost, redirect, session check). |
| Auth.gs | Modul OTP: generate, hash (SHA-256 + pepper), kirim via GOWA API, verifikasi. |
| GoogleAuth.gs | Google OAuth 2.0 Authorization Code flow + ID Token verification. |
| UserWhitelist.gs | Pengecekan whitelist user dari Google Sheet tab 'users'. |
| Session.gs | Manajemen session terpusat (create, validate, delete, cleanup). |
| AppRegistry.gs | Registry aplikasi hub dari Google Sheet tab 'apps'. |
| AuditLog.gs | Pencatatan aktivitas ke Google Sheet tab 'audit_log'. |
| Triggers.gs | Setup time-driven triggers untuk maintenance otomatis. |
| Setup.gs | Generator otomatis spreadsheet dan tabel. Jalankan sekali untuk setup awal. |
| TesKoneksi.gs | Skrip diagnostik pengujian koneksi server GOWA. |
| login.html | Halaman login (Google Sign-In + form OTP). |
| verify.html | Halaman verifikasi kode OTP. |
| dashboard.html | Halaman dashboard hub setelah login. |

## **Quick Start (Setup Awal)**

### 1. Clone & Push ke GAS

```bash
git clone https://github.com/tumts/gas-workspace-hub.git
cd gas-workspace-hub
clasp login
clasp create --type webapp --title "GAS Workspace Hub"
clasp push
```

### 2. Set Script Properties Minimal

Buka **GAS Editor > Project Settings > Script Properties**, tambahkan:

| Property | Value | Keterangan |
| :---- | :---- | :---- |
| `DEFAULT_ADMIN_EMAIL` | `admin@example.com` | Ganti dengan email admin Anda |
| `DEFAULT_ADMIN_PHONE` | `6281234567890` | Ganti dengan nomor WA admin (format 62xxx) |
| `GOWA_API_KEY` | `username:password` | Kredensial API GOWA |
| `OTP_SECRET_PEPPER` | `(string rahasia)` | Pepper untuk hashing OTP |

### 3. Jalankan Setup Generator

Di GAS Editor, buka `Setup.gs` lalu jalankan:

```
setupProductionSheet()
```

Fungsi ini akan **otomatis**:
- Membuat Google Spreadsheet baru di Drive Anda
- Membuat 4 tab: `users`, `sessions`, `apps`, `audit_log`
- Mengisi header dan data admin default
- Menyimpan Sheet ID ke Script Property `USERS_SHEET_ID`

### 4. (Opsional) Setup Google Login

Jika ingin mengaktifkan tombol "Sign in with Google":

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project yang terkait dengan Apps Script (lihat di GAS Editor > Project Settings > Google Cloud Platform Project)
3. Buka **APIs & Services > Credentials**
4. Klik **Create Credentials > OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs — tambahkan URL web app GAS Anda:
   - `https://script.google.com/macros/s/DEPLOYMENT_ID/exec` (production)
   - `https://script.google.com/macros/s/DEPLOYMENT_ID/dev` (development, opsional)
7. Salin **Client ID** → tambahkan Script Property `GOOGLE_CLIENT_ID`
8. Salin **Client Secret** → tambahkan Script Property `GOOGLE_CLIENT_SECRET`

> **Catatan:** Authorized JavaScript Origins **tidak diperlukan** — flow ini menggunakan server-side OAuth redirect, bukan client-side GIS button.

> Jika `GOOGLE_CLIENT_ID` tidak di-set, tombol Google otomatis disembunyikan. Hanya login OTP yang tersedia.

### 5. Verifikasi Setup

Jalankan di GAS Editor:

```
verifySetup()
```

Cek Execution Log untuk memastikan semua property dan tab sudah benar.

### 6. Deploy

Klik **Deploy > New deployment > Web app**:
- Execute as: **Me**
- Who has access: **Anyone** (termasuk tanpa akun Google)

## **Setup Test (Opsional)**

Untuk menjalankan automated test suite:

```
setupTestSheet()
```

Ini membuat spreadsheet terpisah dengan data dummy untuk testing.

## **Auth Library untuk Child Apps**

Modul autentikasi untuk child apps tersedia di `lib/gas-auth-lib/`.

**Quick Start:**
1. Deploy `lib/gas-auth-lib/` sebagai GAS project terpisah
2. Di child app, tambahkan library via Script ID
3. Tambahkan Script Properties: `AUTH_SESSION_SHEET_ID` (sama dengan `USERS_SHEET_ID` hub) dan `AUTH_HUB_URL`
4. Panggil `GasAuthLib.authenticate(e)` di `doGet()`

## **Maintenance**

Jalankan `setupTriggers()` SATU KALI dari GAS editor untuk mengaktifkan:
- **Session Cleanup**: Setiap 6 jam, hapus session expired
- **Audit Log Cleanup**: Setiap 6 jam, hapus log > 90 hari

## **Lisensi**

[MIT License](https://opensource.org/licenses/MIT).
