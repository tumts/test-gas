# Panduan Sinkron Kode
## Google Apps Script ⇄ Lokal (Zed) ⇄ GitHub

Dokumen ini menjelaskan alur sinkron standar untuk project ini yang menggunakan:
- Google Apps Script (editor online)
- `clasp` untuk sinkronisasi & deployment
- Git + GitHub untuk version control
- Zed sebagai editor lokal utama

Tujuan: 
- mencegah kode tertimpa,
- memastikan perubahan **selalu diuji di Apps Script terlebih dahulu** sebelum di-commit ke Git,
- menjaga histori Git tetap rapi.

---

## 1. Prinsip Umum

1. **Satu sumber kebenaran per sesi kerja**
   - Jika terakhir mengedit di **Apps Script editor**, anggap kode di Apps Script sebagai versi paling baru.
   - Jika terakhir mengedit di **lokal (Zed)**, anggap repo lokal (dan GitHub) sebagai versi paling baru.

2. **Jangan mengedit file yang sama di dua tempat sekaligus**
   - Hindari mengubah file yang sama di Apps Script editor dan di lokal tanpa sinkron di antaranya.

3. **Selalu sinkron sebelum dan sesudah kerja**
   - Sebelum mulai kerja di lokal: tarik perubahan dari Apps Script dan GitHub.
   - Setelah selesai kerja dan pengujian: commit & push ke GitHub.

4. **Pengujian dulu, commit belakangan**
   - Perubahan dianggap “siap commit” hanya setelah lolos uji di Apps Script (minimal melalui `clasp push`, idealnya melalui deployment test).

---

## 2. Perintah Utama

- `clasp pull`  
  Menarik semua file project dari Apps Script ke folder lokal.

- `clasp push`  
  Mengirim semua file dari folder lokal ke Apps Script (dapat menimpa isi editor online).

- `clasp deploy`  
  Membuat atau memperbarui deployment yang mengacu ke version tertentu, biasanya untuk web app / uji di URL deployment.

- `git pull`  
  Mengambil dan menggabungkan update dari GitHub ke repo lokal.

- `git add`, `git commit`, `git push`  
  Menyimpan perubahan ke histori Git dan mengirimnya ke GitHub.

---

## 3. Alur: Perubahan Dimulai dari Apps Script Editor

Gunakan alur ini jika Anda mengubah kode di editor online Apps Script, lalu ingin menyelaraskan ke lokal dan GitHub.

1. Masuk ke folder repo:
   ```bash
   cd /path/ke/repo
   ```

2. Pastikan repositori bersih (tidak ada perubahan lokal yang belum aman):
   ```bash
   git status
   ```
   Jika ada perubahan lokal penting:
   ```bash
   git add .
   git commit -m "wip: simpan perubahan lokal sebelum pull"
   # atau, jika belum ingin commit:
   git stash
   ```

3. Tarik perubahan dari Apps Script:
   ```bash
   clasp pull
   ```

4. Cek perubahan hasil pull:
   ```bash
   git status
   git diff
   ```

5. Uji di Apps Script (opsional tapi disarankan):
   - Jika perlu, lakukan `clasp push` (misal setelah penggabungan manual).
   - Gunakan editor/deployment Apps Script untuk memastikan kode hasil gabungan berjalan baik.

6. Jika sudah OK, simpan ke Git:
   ```bash
   git add .
   git commit -m "sync: update dari Apps Script editor"
   git push origin main
   ```

7. Jika tadi memakai `git stash`:
   ```bash
   git stash pop
   ```
   Selesaikan konflik bila ada, lalu ulangi langkah commit/push bila perlu.

---

## 4. Alur: Perubahan Dimulai dari Lokal (Zed) – Uji Dulu, Baru Commit

Gunakan alur ini jika Anda mengedit melalui Zed dan ingin **mengujinya di Apps Script terlebih dahulu sebelum commit ke Git**.

1. Pastikan repo lokal up to date dengan GitHub:
   ```bash
   git pull origin main
   ```

2. Jika ada kemungkinan perubahan terbaru dibuat langsung di Apps Script editor, tarik dulu:
   ```bash
   clasp pull
   ```

3. Lakukan edit di Zed pada file `.gs`, `.html`, atau `appsscript.json`.

4. Cek perubahan lokal:
   ```bash
   git status
   git diff
   ```

5. Kirim perubahan ke Apps Script untuk pengujian:
   ```bash
   clasp push
   ```

6. (Opsional tapi disarankan) Buat atau perbarui deployment untuk pengujian:
   ```bash
   clasp deploy --description "test sebelum commit"
   ```
   - Gunakan deployment dev/staging jika sudah disiapkan.
   - Uji web app / fungsi yang relevan melalui URL deployment atau dari menu Apps Script.

7. Lakukan pengujian:
   - Pastikan fungsi utama (misal login, verify, koneksi ke layanan lain) berjalan sesuai harapan.
   - Perbaiki di lokal jika ditemukan bug, lalu ulangi:
     ```bash
     clasp push
     # (opsional) clasp deploy ...
     # uji lagi
     ```

8. Jika pengujian sudah lolos, **baru simpan ke Git**:
   ```bash
   git add .
   git commit -m "feat: deskripsi singkat perubahan yang sudah diuji"
   git push origin main
   ```

---

## 5. Menangani Perubahan Lokal yang Bertabrakan

Jika tanpa sengaja Anda mengedit file yang sama di Apps Script editor dan di lokal, gunakan langkah berikut agar tidak ada perubahan hilang:

1. Simpan perubahan lokal sementara:
   ```bash
   git stash
   ```

2. Tarik versi terbaru dari Apps Script:
   ```bash
   clasp pull
   ```

3. Cek perubahan yang datang dari Apps Script:
   ```bash
   git diff
   ```

4. Kembalikan perubahan lokal:
   ```bash
   git stash pop
   ```

5. Selesaikan konflik di Zed (merge manual pada file `.gs`/`.html` yang bentrok).

6. Setelah konflik selesai, uji dengan alur lokal:
   ```bash
   clasp push
   # (opsional) clasp deploy --description "test setelah resolve konflik"
   # uji di Apps Script / web app
   ```

7. Jika sudah aman:
   ```bash
   git add .
   git commit -m "fix: resolve konflik lokal vs Apps Script"
   git push origin main
   ```

---

## 6. Rekomendasi Praktik Harian

Sebelum mulai kerja:
```bash
cd /path/ke/repo
git pull origin main
clasp pull   # jika ada kemungkinan ada yang mengedit di Apps Script
```

Saat mengembangkan fitur/bugfix:
1. Edit di Zed.
2. `git diff` sesekali untuk memantau perubahan.
3. Selesai satu unit kerja → `clasp push` → (opsional) `clasp deploy` → uji sampai lolos.

Sesudah pengujian berhasil:
```bash
git add .
git commit -m "feat/fix: [deskripsi perubahan yang sudah diuji]"
git push origin main
```

Hal yang dihindari:
- Commit ke Git tanpa pernah diuji di Apps Script.
- `clasp push` dari lokal yang belum sinkron dengan perubahan terbaru di Apps Script editor.
- Mengedit file yang sama di dua tempat tanpa `clasp pull` / `clasp push` di antaranya.

---

## 7. Lokasi Dokumen Ini

File ini: `docs/sync-guide.md`

- `README.md` sebaiknya menautkan ke panduan ini sebagai referensi workflow resmi.
- Bila alur berubah (misalnya tambah CI/CD atau environment staging/production), **update dokumen ini terlebih dahulu** dan komunikasikan ke semua yang mengerjakan repo.
