# Sync & Deployment Guide

> Panduan sinkronisasi dan deployment untuk Devin.
> Berdasarkan `docs/sync-guide.md` yang sudah ada di repo.

---

## Sync Tool

- **clasp** — CLI tool untuk push/pull file antara lokal dan Google Apps Script
- Ada 2 project terpisah, masing-masing punya `.clasp.json` sendiri:
  1. **Hub** (root) — project utama Auth Hub
  2. **Library** (`lib/gas-auth-lib/`) — library untuk child apps

## Prinsip Utama

> **"Pengujian dulu, commit belakangan"**

Perubahan dianggap "siap commit" hanya setelah lolos uji di Apps Script.

## Alur dari Lokal (edit code → push → test → commit)

```
1. Edit file .gs / .html di lokal
2. clasp push           → kirim ke GAS
3. Test di GAS Editor   → runAllTests() atau manual test
4. git add <files>      → stage perubahan
5. git commit           → commit dengan pesan deskriptif
6. git push             → push ke GitHub
```

## Alur dari GAS Editor (edit di online → pull → commit)

```
1. Edit di GAS Editor online
2. clasp pull           → tarik ke lokal
3. git diff             → review perubahan
4. git add <files>      → stage
5. git commit           → commit
6. git push             → push ke GitHub
```

## Deployment

- **Web app:** Deploy > New deployment > Web app di GAS Editor
  - Execute as: **Me**
  - Who has access: **Anyone** (termasuk tanpa akun Google)
- **CLI:** `clasp deploy --description "versi X.Y"`
- **Library:** Deploy sebagai GAS Library (bukan web app) — child apps import via Script ID

## Ada 2 Project Terpisah

| Project | Lokasi | Tipe Deploy |
|:--------|:-------|:------------|
| Hub | Root (`/`) | Web app |
| Library | `lib/gas-auth-lib/` | GAS Library |

Masing-masing punya `.clasp.json` terpisah (keduanya di-gitignore).

---

## Aturan untuk Devin

### Dilarang:
- **Jangan pernah membuat atau mengubah `.clasp.json`** — file ini di-gitignore dan dikelola oleh user
- **Jangan berasumsi bisa menjalankan `clasp` dari environment Devin** — `clasp` butuh autentikasi Google dan akses ke project GAS
- **Jangan deploy dari environment Devin** — deployment dilakukan oleh user

### Wajib (instruksi ke user):

**Setelah PR di-merge:**
> "Jalankan `clasp push` dari folder root untuk sync perubahan ke Apps Script."

**Jika perubahan menyentuh `lib/gas-auth-lib/`:**
> "Setelah `clasp push` di folder `lib/gas-auth-lib/`:
> 1. Deploy ulang library (buat versi baru)
> 2. Update nomor versi library di semua child apps yang menggunakannya"

**Jika perubahan menyentuh test:**
> "Jalankan `runAllTests()` di GAS Editor untuk verifikasi semua test masih pass."

**Jika perubahan menambah Script Property baru:**
> "Tambahkan Script Property `NAMA_PROPERTY` di GAS Editor > Project Settings > Script Properties."
