
Sistem autentikasi OTP WhatsApp ini dibangun menggunakan **Google Apps Script (GAS)** (*backend serverless*), antarmuka **Tailwind CSS**, dan integrasi API **GOWA**.

## **Fitur Utama**

* **Pengiriman OTP WA**: Terintegrasi langsung dengan REST API GOWA.  
* **Verifikasi Internal**: *Generate* dan validasi OTP menggunakan PropertiesService GAS (tanpa basis data eksternal).  
* **Manajemen Sesi**: Sesi pengguna tersimpan selama 1 jam untuk mencegah login berulang.  
* **Keamanan API**: Menggunakan *Basic Auth* (enkripsi *Base64*) untuk transmisi data.
* **Hub Dashboard**: Dashboard terpusat setelah login, menampilkan daftar aplikasi yang bisa diakses.
* **Session Terpusat**: Session disimpan di Google Sheet, memungkinkan single sign-on ke beberapa Apps Script webapp.
* **App Registry**: Daftar aplikasi dikelola via Google Sheet, mudah ditambah/dihapus oleh admin.

## **Struktur File**

| File | Fungsi |
| :---- | :---- |
| Code.gs | *Controller* utama (rute doGet dan proses doPost). |
| Auth.gs | Modul pembuatan, pengiriman, dan validasi OTP. |
| TesKoneksi.gs | Skrip diagnostik pengujian server GOWA. |
| GoogleAuth.gs | Verifikasi Google ID Token untuk login via Google. |
| UserWhitelist.gs | Pengecekan whitelist user dari Google Sheet. |
| Session.gs | Manajemen session terpusat (create, validate, delete, cleanup). |
| AppRegistry.gs | Registry aplikasi hub, membaca dari Google Sheet tab 'apps'. |
| dashboard.html | Halaman dashboard hub setelah login berhasil. |
| \*.html | Antarmuka pengguna responsif (Login & Verifikasi). |

## **Panduan Instalasi & Deployment**

Sinkronisasikan proyek lokal ke GAS menggunakan [Clasp](https://github.com/google/clasp):

git clone \<url-repositori\> && cd \<folder\>  
clasp login  
clasp create \--type webapp \--title "WhatsApp OTP"  
clasp push

**1\. Konfigurasi Kredensial**

Di Editor GAS, buka **Project Settings \> Script Properties**, lalu tambahkan:

* **Property**: GOWA\_API\_KEY  
* **Value**: username:password *(Kredensial peladen GOWA)*

* **Property**: OTP\_SECRET\_PEPPER  
* **Value**: GowaS3cr3tP3pp3r2026!@# *(atau value baru yang diinginkan sebagai pepper untuk hashing OTP)*

> **Penting:** Property `OTP_SECRET_PEPPER` **wajib** ditambahkan sebelum deploy ulang, agar fungsi OTP tidak rusak.

**Konfigurasi Tambahan (Fase 1.5)**

Di **Project Settings > Script Properties**, tambahkan juga:

* **Property**: `GOOGLE_CLIENT_ID`
  **Value**: OAuth Client ID dari Google Cloud Console (format: `xxxxx.apps.googleusercontent.com`)

* **Property**: `USERS_SHEET_ID`
  **Value**: ID Google Sheet yang berisi whitelist user

* **Property**: `OTP_SECRET_PEPPER`
  **Value**: Secret pepper untuk hashing OTP (contoh: `GowaS3cr3tP3pp3r2026!@#`)

**Setup Google Cloud OAuth Client ID:**
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project yang terkait dengan Apps Script
3. Buka **APIs & Services > Credentials**
4. Klik **Create Credentials > OAuth Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `https://script.google.com`
7. Salin Client ID ke Script Property `GOOGLE_CLIENT_ID`

**Setup Google Sheet Whitelist User:**
1. Buat Google Sheet baru
2. Buat sheet dengan nama `users`
3. Isi header baris pertama: `email | phone | nama | role | status | ditambahkan_oleh | tanggal`
4. Contoh data: `andi@gmail.com | 6281234567890 | Andi | admin | active | owner | 2026-04-29`
5. Salin Sheet ID (dari URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`) ke Script Property `USERS_SHEET_ID`

**Tab `sessions` (otomatis dibuat):**
Tab ini akan dibuat otomatis saat pertama kali ada user login. Tidak perlu setup manual.

**Tab `apps` (registry aplikasi):**
1. Tab `apps` akan dibuat otomatis dengan contoh data saat pertama kali dashboard diakses
2. Untuk menambah aplikasi, isi baris baru di tab `apps` dengan kolom:
   - `id`: Identifier unik (misal: `inventaris`)
   - `name`: Nama tampilan (misal: `Aplikasi Inventaris`)
   - `url`: URL deployment webapp (misal: `https://script.google.com/macros/s/DEPLOY_ID/exec`)
   - `icon`: Emoji icon (misal: `📦`)
   - `description`: Deskripsi singkat
   - `requiredRole`: `user` (semua user) atau `admin` (hanya admin)
   - `status`: `active` atau `inactive`

**2\. Deployment (Web App)**

Klik **Deploy \> New deployment \> Web app**. Atur hak akses:

* Execute as: **Me**  
* Who has access: **Anyone**

## **Pengujian Koneksi API**

Buka TesKoneksi.gs di editor GAS, jalankan fungsi testGowaConnection. Tinjau **Execution Log** untuk memastikan kemunculan Status HTTP 200 (Berhasil).

## **Lisensi**

[MIT License](https://opensource.org/licenses/MIT).
