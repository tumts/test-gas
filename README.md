
Sistem autentikasi OTP WhatsApp ini dibangun menggunakan **Google Apps Script (GAS)** (*backend serverless*), antarmuka **Tailwind CSS**, dan integrasi API **GOWA**.

## **Fitur Utama**

* **Pengiriman OTP WA**: Terintegrasi langsung dengan REST API GOWA.  
* **Verifikasi Internal**: *Generate* dan validasi OTP menggunakan PropertiesService GAS (tanpa basis data eksternal).  
* **Manajemen Sesi**: Sesi pengguna tersimpan selama 1 jam untuk mencegah login berulang.  
* **Keamanan API**: Menggunakan *Basic Auth* (enkripsi *Base64*) untuk transmisi data.

## **Struktur File**

| File | Fungsi |
| :---- | :---- |
| Code.gs | *Controller* utama (rute doGet dan proses doPost). |
| Auth.gs | Modul pembuatan, pengiriman, dan validasi OTP. |
| TesKoneksi.gs | Skrip diagnostik pengujian server GOWA. |
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

**2\. Deployment (Web App)**

Klik **Deploy \> New deployment \> Web app**. Atur hak akses:

* Execute as: **Me**  
* Who has access: **Anyone**

## **Pengujian Koneksi API**

Buka TesKoneksi.gs di editor GAS, jalankan fungsi testGowaConnection. Tinjau **Execution Log** untuk memastikan kemunculan Status HTTP 200 (Berhasil).

## **Lisensi**

[MIT License](https://opensource.org/licenses/MIT).
