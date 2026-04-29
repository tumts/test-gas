# **Changelog**

## **Unreleased**

### **Added — Fase 2: Centralized Session Store**

* **Session Store (Google Sheet)**: Mengganti `UserProperties` dengan Google Sheet tab `sessions` sebagai penyimpanan session terpusat. File baru: `Session.gs`. Session kini bisa diakses oleh child apps melalui Sheet yang sama.
* **Session Token**: Setiap login menghasilkan token unik (SHA-256 hash dari UUID) yang digunakan sebagai identifier session di URL parameter.
* **Session Cleanup**: Fungsi `cleanExpiredSessions()` untuk membersihkan session expired dari Sheet (bisa dipanggil via time-driven trigger).

### **Added — Fase 3: Hub Dashboard & App Registry**

* **Dashboard Hub**: Halaman dashboard (`dashboard.html`) menampilkan daftar aplikasi dalam card grid setelah login berhasil.
* **App Registry**: Daftar aplikasi dibaca dari Google Sheet tab `apps`. File baru: `AppRegistry.gs`. Admin bisa menambah/menghapus app langsung di Sheet.
* **Role-based App Access**: Aplikasi ditampilkan berdasarkan role user (`admin` bisa akses semua, `user` hanya app dengan `requiredRole=user`).
* **Logout**: Tombol logout di dashboard yang menginvalidasi session di Sheet.
* **Child App Redirect Flow**: Support parameter `?redirect=URL` agar child app bisa redirect ke hub untuk login, lalu kembali ke child app dengan token.

### **Changed**

* **Session Storage**: Migrasi dari `UserProperties` (terisolasi per-script) ke Google Sheet (bisa diakses lintas project).
* **Login Flow**: Setelah login berhasil, user di-redirect ke dashboard (bukan halaman statis "Login Berhasil").
* **URL Token**: Session diidentifikasi via `?token=xxx` di URL, bukan via `UserProperties`.
* **render() defaults**: Menambahkan default values untuk `redirect`, `sessionData`, dan `apps` di fungsi render.

### **Added — Fase 1.5**

* **Login Google (GIS)**: Menambahkan opsi login menggunakan akun Google via Google Identity Services. File baru: `GoogleAuth.gs`.
* **Whitelist User**: Menambahkan sistem whitelist user berbasis Google Sheet untuk kontrol akses. File baru: `UserWhitelist.gs`. Hanya email/nomor yang terdaftar dan berstatus `active` yang bisa login.
* **Whitelist OTP WhatsApp**: Nomor telepon dicek terhadap whitelist sebelum OTP dikirim. Nomor yang tidak terdaftar akan ditolak.
* **Dual Login UI**: Halaman login (`login.html`) kini menampilkan dua opsi: tombol "Sign in with Google" dan form OTP WhatsApp.

### **Changed**

* **Session Data**: Struktur session diperluas untuk mendukung `email`, `name`, `role`, dan `loginMethod` selain `phone`.
* **doPost() Guard**: Menambahkan null/empty guard pada parameter `phone` agar tidak crash saat login Google (yang tidak mengirim phone).
* **Judul Webapp**: Diubah dari "Login OTP Gowa" menjadi "Auth Hub".

### **Fixed**

* **Timezone**: Diubah dari `America/New_York` ke `Asia/Makassar` (jika belum diterapkan dari Fase 1).
* **OTP_SECRET_PEPPER**: Dipindahkan dari hardcode ke Script Properties (jika belum diterapkan dari Fase 1).
* **Bug TesKoneksi.gs**: Variabel `GOWA_CONFIG` diganti dengan `getGowaConfig()` (jika belum diterapkan dari Fase 1).
* **Akses Webapp**: Diubah dari `MYSELF` ke `ANYONE` (jika belum diterapkan dari Fase 1).

## **0.2.0**

2026-04-08

### **Changed**

* Desain Penyimpanan OTP: Mengubah arsitektur penyimpanan OTP di Auth.gs dari plain-text string menjadi objek JSON terstruktur (menyimpan hash, waktu pembuatan, masa berlaku, dan jumlah percobaan).

* Validasi Kredensial: Menambahkan pengecekan format username:password pada GOWA_API_KEY saat inisialisasi untuk mencegah kegagalan otentikasi semantik di runtime.

* Normalisasi Input: Mengonsolidasikan normalisasi nomor telepon di awal doPost untuk memastikan konsistensi format 62xxxxxxxxxx sebagai key penyimpanan.

* Penyempurnaan Dokumentasi: Meringkas isi file README.md secara signifikan (lebih dari 50%) untuk meningkatkan keterbacaan, efisiensi penyampaian informasi, dan kejelasan instruksi deployment tanpa menghilangkan detail esensial.

**Security**

* Hashing OTP: Mengimplementasikan algoritma SHA-256 dipadukan dengan rahasia sistem (pepper) dan nomor telepon untuk mengamankan OTP yang tersimpan di ScriptProperties. OTP asli tidak lagi terekspos.

* Masa Berlaku Valid (Expiry): Menambahkan limitasi masa berlaku OTP secara ketat selama 5 menit.

* Proteksi Rate Limiting & Cooldown: Mencegah eksploitasi fitur resend dengan memberlakukan jeda 60 detik antar pengiriman dan batas maksimal 3 kali pengiriman dalam rentang 15 menit.

* Proteksi Brute-Force: Membatasi percobaan input kode verifikasi maksimal 5 kali sebelum sesi OTP dibatalkan secara otomatis.
## **0.1.0**

\- 2026-04-08

### **Added**

* Inisialisasi project Google Apps Script dengan clasp.  
* Menambahkan Auth.gs, TesKoneksi.gs, login.html, verify.html.  
* **Sistem Sesi Login (Session Management)**: Mengecek getUserProperties() di doGet() agar sesi pengguna aktif hingga 1 jam tanpa perlu input OTP ulang.  
* **Validasi OTP Internal**: Membuat alur *generate* dan validasi OTP secara mandiri menggunakan PropertiesService.getScriptProperties().

### **Changed**

* Update konfigurasi .clasp.json dan appsscript.json.  
* **Metode Autentikasi API GOWA**: Mengubah format dari Bearer Token ke Basic Auth (Base64 Encode) sesuai spesifikasi server GOWA.  
* **Endpoint Pengiriman**: Mengganti rute endpoint dari yang sebelumnya /otp/send menjadi /send/message (endpoint pengiriman teks standar).  
* **Struktur Script HTML**: Memisahkan tag \<script\> Tailwind dan JS bawaan di UI agar animasi *loading* dan *disable* tombol berjalan lancar saat *submit*.

### **Fixed**

* **Bug Render Halaman**: Mencegah *crash* Error loading page: verify dengan mengirim parameter default error: '' saat merender antarmuka.  
* **Bug Variabel Konstan**: Mengubah deklarasi variabel dari const cleanPhone menjadi let cleanPhone di dalam doPost(). Ini menyelesaikan masalah *runtime crash* saat sistem mengubah awalan nomor 0 menjadi 62\.  
* **Sanitasi Nomor Telepon**: Memastikan semua input nomor HP dari *user* dibersihkan dari karakter non-angka (\\D) sebelum dilempar ke API GOWA.
