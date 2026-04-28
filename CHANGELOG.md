# **Changelog**

## **Unreleased**

### **Fixed**

* Timezone diubah dari `America/New_York` ke `Asia/Makassar`.
* Bug variabel `GOWA_CONFIG` di `TesKoneksi.gs` — variabel global tidak ada, diganti dengan pemanggilan `getGowaConfig()`.

### **Security**

* `OTP_SECRET_PEPPER` dipindahkan dari hardcode di `Auth.gs` ke ScriptProperties untuk keamanan kredensial.

### **Changed**

* Akses webapp diubah dari `MYSELF` ke `ANYONE` untuk production readiness.

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
