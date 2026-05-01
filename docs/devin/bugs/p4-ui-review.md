# Bug Review: P4 — Mobile UI (admin, profile, navbar, dashboard redesign)

> Tanggal: 2026-05-01
> Reviewer: Devin

---

## PR/Branch

`devin/p4-mobile-ui` → `[feat] P4: mobile UI — admin.html, profile.html, navbar, dashboard redesign`

## Summary

Membuat 4 file baru (`_navbar_styles.html`, `_navbar.html`, `admin.html`, `profile.html`), redesign `dashboard.html`, dan menambahkan test cases di `Test_Code.gs`. Semua perubahan hanya pada file `.html` dan docs — tidak menyentuh file `.gs` high-risk.

## Bug Findings

### [INFO] — Inkonsistensi auto-merge rule untuk `.html` files

- **File:** `docs/devin/knowledge/project-overview.md`
- **Baris:** 215
- **Deskripsi:** `project-overview.md` menyatakan HTML dengan logic tidak boleh auto-merge, namun workflow `auto-merge-devin.yml` tidak memiliki path filter yang secara eksplisit memblokir file `.html`.
- **Impact:** PR yang mengandung `.html` dengan logic (scriptlets, `google.script.run`) bisa ter-auto-merge tanpa human review.
- **Suggested Fix:** Tambahkan path filter di workflow untuk mengecualikan `.html` files dari auto-merge, atau tambahkan safety check di workflow yang memeriksa apakah ada `<script>` tag di file HTML yang diubah.

---

### [INFO] — Token di URL query parameter (existing pattern)

- **File:** `_navbar.html`
- **Baris:** 30-32
- **Deskripsi:** Navbar menyisipkan session token di query parameter URL (`?token=xxx`). Token bisa bocor melalui browser history, Referer header, dan server logs.
- **Impact:** Session hijacking jika URL ter-expose. Ini adalah pattern existing dari `Code.gs:335` (`redirectAfterLogin`), bukan bug baru yang diperkenalkan oleh PR ini.
- **Suggested Fix:** Jangka panjang: migrasi ke cookie-based session atau POST-based token passing. Jangka pendek: tambahkan `<meta name="referrer" content="no-referrer">` di setiap halaman post-login.

---

### [MEDIUM] — `google.script.run` error handling perlu user-friendly message

- **File:** `admin.html`
- **Baris:** (script section — `withFailureHandler` callbacks)
- **Deskripsi:** `withFailureHandler` callbacks menampilkan generic message ("Terjadi kesalahan saat memuat data." / "Terjadi kesalahan saat menyimpan data."). Ini sudah cukup baik sebagai baseline, namun raw error dari GAS server bisa lebih informatif untuk debugging.
- **Impact:** User mungkin tidak tahu penyebab error. Namun menampilkan raw server error bisa membocorkan informasi internal.
- **Suggested Fix:** Saat ini sudah menggunakan generic messages yang user-friendly. Untuk improvement: log detailed error ke console untuk admin debugging (`console.error(err)`) di dalam `withFailureHandler`.

---

### [LOW] — XSS prevention via client-side `escapeHtml()`

- **File:** `admin.html`
- **Baris:** (script section — `escapeHtml` dan `escapeHtmlAttr` functions)
- **Deskripsi:** Admin panel menggunakan client-side `escapeHtml()` dan `escapeHtmlAttr()` untuk semua data yang di-render ke DOM. Ini adalah best practice yang sudah diterapkan.
- **Impact:** N/A — mitigasi sudah ada.
- **Suggested Fix:** Sudah baik. Pertahankan pattern ini.

---

## File Baru & Status Review

| File | Tipe | Status Review |
|:-----|:-----|:-------------|
| `_navbar_styles.html` | CSS partial (style only) | Reviewed — aman, tidak ada logic |
| `_navbar.html` | HTML + JS partial | Reviewed — pure HTML/JS, membaca dari `window.__HUB__`, tidak ada scriptlet |
| `admin.html` | Full page + scriptlet + AJAX | Reviewed — menggunakan `escapeHtml`/`escapeHtmlAttr`, `google.script.run` dengan error handlers |
| `profile.html` | Full page + scriptlet | Reviewed — read-only display, logout form mengikuti pattern existing |
| `dashboard.html` | Full page + scriptlet (modified) | Reviewed — ditambahkan navbar, category pills, grid 2-col |
| `Test_Code.gs` | Test file (modified) | Reviewed — 6 test cases baru untuk render admin/profile/dashboard |
| `docs/devin/bugs/p4-ui-review.md` | Documentation (new) | N/A — file ini sendiri |

## Regression Risk

| Area | Risk | Detail |
|:-----|:-----|:-------|
| Auth flow | LOW | Tidak ada perubahan di Code.gs atau Auth.gs |
| Session management | LOW | Tidak ada perubahan — hanya membaca session data via scriptlet |
| Admin API | LOW | admin.html memanggil AdminAPI.gs functions via `google.script.run` — tidak mengubah backend |
| Dashboard | MEDIUM | dashboard.html di-redesign — layout berubah, tapi data flow sama |
| Navigation | LOW | Navbar baru ditambahkan — jika gagal load, halaman tetap fungsional |

## Affected Files/Functions

| File | Fungsi | Impact |
|:-----|:-------|:-------|
| `_navbar_styles.html` | (CSS only) | Style untuk bottom nav dan pill tabs |
| `_navbar.html` | (JS: reads `window.__HUB__`) | Bottom navigation bar |
| `admin.html` | `google.script.run.adminGet/Add/Update/DeleteUsers/Apps()` | Admin CRUD UI |
| `profile.html` | (scriptlet: reads `sessionData`) | User profile display + logout |
| `dashboard.html` | `filterApps()` | Category filtering + redesigned grid |
| `Test_Code.gs` | `testSuite_Code()` | 6 new test cases |

## Suggested Tests

> **Manual testing di GAS Editor:**

1. Jalankan `runAllTests()` — pastikan semua test pass termasuk 6 test baru di suite "Code — render() new pages"
2. Deploy webapp, login sebagai admin → navigasi ke `?page=admin` → verify Admin Panel loads
3. Navigasi ke `?page=profile` → verify profil user tampil dengan info yang benar
4. Login sebagai non-admin → verify navbar hanya menampilkan Home dan Profil (tanpa Admin)
5. Verify category pills di dashboard jika ada >1 category
6. Test responsive di mobile — bottom nav dan 2-column grid

> **Automated test:**

- Jalankan `runAllTests()` — fokus pada suite: Code — render() new pages

## Recommendation

- [x] **Safe with notes** — Aman dengan catatan:
  1. Token di URL adalah known risk (existing pattern), pertimbangkan migrasi ke cookie-based session di future iteration
  2. Auto-merge workflow perlu diperbarui untuk memblokir `.html` files dengan logic
  3. Jalankan `runAllTests()` setelah `clasp push` untuk memverifikasi semua render test pass
