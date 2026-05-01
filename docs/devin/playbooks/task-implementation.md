# Playbook: Task Implementation

> **Purpose:** Implementasi task/feature baru.
> **When to use:** Saat ada issue yang perlu dikerjakan.

---

## Procedure

### 1. Baca Issue dan Pahami Requirement

- Identifikasi scope perubahan
- Tentukan file yang perlu diubah
- Cek apakah ada dependensi dengan modul lain

### 2. Baca Knowledge Files untuk Konteks

```
docs/devin/knowledge/project-overview.md    → arsitektur & conventions
docs/devin/analysis/risk-register.md        → area yang perlu hati-hati
docs/devin/knowledge/testing-rules.md       → cara menulis test
docs/devin/knowledge/sync-and-deployment.md → apa yang harus diinstruksikan ke user
```

### 3. Buat Branch

Format: `devin/task-<id>-<slug>`

```bash
git checkout -b devin/task-42-add-csrf-token
```

### 4. Implementasi Perubahan

- Ikuti conventions yang ada di file sekitar
- Gunakan fungsi yang sudah ada (jangan duplikasi)
- Pastikan error handling memadai
- Escape output ke HTML jika diperlukan

### 5. Tulis/Update Test di `Test_*.gs`

Jika perubahan relevan untuk di-test:

- Buat test baru mengikuti pattern `describe()` → `it()` → `assert.*`
- Gunakan `setupTestEnvironment()` + `restoreSheetId()` untuk test yang butuh Sheet
- Tambahkan entry ke `runAllTests()` di `TestFramework.gs` jika membuat suite baru

### 6. Update Docs jika Ada Perubahan Arsitektur

- `docs/devin/analysis/codebase-map.md` — jika ada file baru atau perubahan hubungan
- `docs/devin/analysis/risk-register.md` — jika ada area risiko baru
- `docs/devin/knowledge/project-overview.md` — jika ada Script Property baru atau perubahan flow

### 7. Buat Draft PR

Format PR description:

```markdown
## Tujuan
[Deskripsi singkat perubahan]

## File yang Diubah
- `NamaFile.gs` — [apa yang berubah]

## Area Risiko
- [Referensi risk-register.md jika menyentuh area HIGH/MEDIUM]

## Test yang Perlu Dijalankan
> Jalankan `runAllTests()` di GAS Editor dan pastikan semua test pass.

## Langkah Verifikasi Setelah Merge
1. `clasp push` dari folder root
2. [Langkah tambahan jika perlu, misal: deploy ulang library]
```

### 8. Instruksikan User

Setelah PR siap:

> "Jalankan `runAllTests()` di GAS Editor. Jika semua pass, merge PR lalu jalankan `clasp push` untuk sync ke Apps Script."

Jika perubahan menyentuh `lib/gas-auth-lib/`:

> "Setelah merge, jalankan juga `clasp push` di folder `lib/gas-auth-lib/`, deploy ulang library, dan update versi di child apps."

---

## Forbidden

- **Jangan sentuh Script Properties** — dikelola oleh user di GAS Editor
- **Jangan jalankan setup functions** (`setupProductionSheet()`, `setupTestSheet()`, `setupTriggers()`)
- **Jangan ubah `.clasp.json`** — di-gitignore by design
- **Jangan jalankan `clasp` dari environment Devin**
- **Jangan ubah file `.gs`, `.html`, atau `appsscript.json` yang sudah ada kecuali itu bagian dari task**
