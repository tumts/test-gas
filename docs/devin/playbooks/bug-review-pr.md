# Playbook: Bug Review PR

> **Purpose:** Review statis PR untuk mencari bug dan potensi regresi.
> **When to use:** Saat ada PR yang perlu di-review.
> **Required input:** PR number atau branch name.

---

## Procedure

### 1. Baca Diff

Review semua perubahan di PR. Fokus pada:
- Logika baru atau yang berubah
- Perubahan signature fungsi
- Penambahan/penghapusan import/dependensi antar file

### 2. Cek Area Risiko

Referensikan `docs/devin/analysis/risk-register.md`:
- Apakah perubahan menyentuh file HIGH risk?
- Apakah blast radius berubah?

### 3. Cek Common Bug Patterns

- **Null/undefined handling:** Apakah parameter bisa null? Apakah ada guard?
- **Error handling:** Apakah try-catch memadai? Apakah error di-propagate dengan benar?
- **Auth bypass:** Apakah `requireAdmin()` dipanggil di semua endpoint admin? Apakah session validation bisa di-bypass?
- **XSS:** Apakah output ke HTML di-escape? (`escapeHtmlAttr()`, `escapeJsString()`)
- **Input validation:** Apakah `e.parameter.data` di-validasi sebelum diproses?

### 4. Cek Admin API Pattern di Code.gs

Jika perubahan menyentuh `Code.gs` baris 236+:
- Apakah ada endpoint baru tanpa `requireAdmin()` check?
- Apakah `JSON.parse(e.parameter.data)` punya error handling?
- Apakah response menggunakan `ContentService.createTextOutput().setMimeType(JSON)`?

### 5. Cek Test Coverage

- Apakah ada test terkait di `Test_*.gs` yang perlu diupdate?
- Apakah perubahan menambah path baru yang belum ter-cover?
- Untuk perubahan HIGH risk, wajib ada test case baru.

### 6. Tulis Hasil Review

Buat file: `docs/devin/bugs/pr-<nomor>-review.md`

Gunakan template dari `docs/devin/bugs/_template.md`.

### 7. Cek Blast Radius Library

Jika perubahan menyentuh `lib/gas-auth-lib/`:
- **Tandai sebagai HIGH risk** — perubahan berdampak pada semua child apps
- Verifikasi backward compatibility
- Catat di review: "Setelah merge, wajib deploy ulang library dan update versi di child apps"

---

## Forbidden

- **Jangan run test** dari environment Devin — instruksikan user
- **Jangan ubah kode hanya untuk style** (formatting, naming) — fokus pada bug
- **Jangan approve auto-merge untuk area HIGH risk** — PR harus di-review manual oleh user
