# Bug Review: [PR/Branch]

> Tanggal: YYYY-MM-DD
> Reviewer: Devin

---

## PR/Branch

[Link ke PR atau nama branch]

## Summary

[Ringkasan singkat perubahan yang di-review]

## Bug Findings

### [HIGH/MEDIUM/LOW/INFO] — [Judul Finding]

- **File:** `NamaFile.gs`
- **Baris:** XX-YY
- **Deskripsi:** [Penjelasan bug/risiko]
- **Impact:** [Apa yang bisa terjadi jika tidak diperbaiki]
- **Suggested Fix:** [Saran perbaikan]

---

## Regression Risk

| Area | Risk | Detail |
|:-----|:-----|:-------|
| Auth flow | HIGH/MEDIUM/LOW | [Detail] |
| Session management | HIGH/MEDIUM/LOW | [Detail] |
| Admin API | HIGH/MEDIUM/LOW | [Detail] |

## Affected Files/Functions

| File | Fungsi | Impact |
|:-----|:-------|:-------|
| `NamaFile.gs` | `namaFungsi()` | [Impact] |

## Suggested Tests

> **Manual testing di GAS Editor:**

1. [Langkah test manual]
2. [Langkah test manual]

> **Automated test:**

- Jalankan `runAllTests()` — fokus pada suite: [nama suite]

## Recommendation

- [ ] **Safe** — Aman untuk merge
- [ ] **Safe with notes** — Aman dengan catatan: [catatan]
- [ ] **Needs revision** — Perlu perbaikan sebelum merge: [alasan]
