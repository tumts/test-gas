# **Changelog**

## **Unreleased**

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