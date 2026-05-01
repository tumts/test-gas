# Playbook: Codebase Analysis

> **Purpose:** Panduan untuk sesi Devin baru yang perlu memahami repo.
> **When to use:** Sesi pertama di repo, atau setelah perubahan besar pada arsitektur.

---

## Procedure

### 1. Baca Knowledge Files

```
docs/devin/knowledge/project-overview.md
```

Pahami tujuan repo, arsitektur, entry points, dan Script Properties.

### 2. Baca Analysis Files

```
docs/devin/analysis/codebase-map.md
docs/devin/analysis/risk-register.md
```

Pahami struktur file, hubungan antar modul, dan area risiko.

### 3. Scan File yang Relevan dengan Task

Berdasarkan task yang diberikan, baca file `.gs` dan `.html` yang terkait. Gunakan `codebase-map.md` sebagai panduan untuk menemukan file yang tepat.

### 4. Update Codebase Map (jika ada perubahan struktur)

Jika task melibatkan penambahan/penghapusan file atau perubahan signifikan pada hubungan antar modul:

- Update `docs/devin/analysis/codebase-map.md`
- Update `docs/devin/analysis/risk-register.md` jika ada area risiko baru

---

## Forbidden

- **Jangan ubah `.clasp.json`** — file ini di-gitignore by design
- **Jangan jalankan setup functions** (`setupProductionSheet()`, `setupTestSheet()`, `setupTriggers()`) — sudah dilakukan oleh user
- **Jangan set Script Properties** — dikelola oleh user di GAS Editor
- **Jangan jalankan `clasp push/pull`** dari environment Devin
