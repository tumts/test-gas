# Codebase Map

> Dihasilkan dari scan aktual repo `gas-workspace-hub`.
> Terakhir diperbarui: 2026-05-01 (P5 update)

---

## 1. File `.gs` di Root (Auth Hub — GAS Project utama)

| File | Peran |
|:-----|:------|
| `Code.gs` | Controller utama — routing `doGet(e)` dan `doPost(e)`, redirect, session check, render HTML, Admin API endpoint. |
| `Auth.gs` | Modul OTP WhatsApp — generate OTP 6 digit, hash SHA-256 + pepper, kirim via GOWA API, verifikasi, rate limiting. |
| `GoogleAuth.gs` | Google OAuth 2.0 Authorization Code flow — build auth URL, exchange code for token, verify ID token via tokeninfo. |
| `UserWhitelist.gs` | Pengecekan whitelist user dari Google Sheet tab `users` — lookup by email dan by phone. |
| `Session.gs` | Manajemen session terpusat di Google Sheet tab `sessions` — create, validate, delete, cleanup expired. |
| `AppRegistry.gs` | Registry aplikasi hub dari Google Sheet tab `apps` — role-based access, kategori, build app URL dengan token. |
| `AuditLog.gs` | Pencatatan aktivitas ke Google Sheet tab `audit_log` — login, logout, OTP events. Cleanup > 90 hari. |
| `AdminAPI.gs` | Backend API admin panel — CRUD users & apps, validasi admin role via session token, role validation. |
| `Triggers.gs` | Setup time-driven triggers — `scheduledCleanup()` setiap 6 jam (session + audit log cleanup). |
| `Setup.gs` | Generator otomatis spreadsheet + tab (production & test). Jalankan `setupProductionSheet()` SATU KALI. |
| `TesKoneksi.gs` | Script diagnostik untuk menguji koneksi ke API GOWA (Basic Auth). |
| `TestFramework.gs` | Framework testing BDD ringan — `describe()`, `it()`, `assert.*`, `runAllTests()`. |
| `TestConfig.gs` | Konfigurasi test — override Sheet ID ke TEST_SHEET_ID, seed data dummy, helper setup/teardown. |
| `Test_Auth.gs` | Test suite: Auth (OTP flow). |
| `Test_Session.gs` | Test suite: Session management. |
| `Test_UserWhitelist.gs` | Test suite: User whitelist lookup. |
| `Test_GoogleAuth.gs` | Test suite: Google OAuth flow. |
| `Test_AppRegistry.gs` | Test suite: App registry & role-based access. |
| `Test_AuditLog.gs` | Test suite: Audit log pencatatan. |
| `Test_Code.gs` | Test suite: Code.gs routing (doGet/doPost). |
| `Test_AuthLib.gs` | Test suite: Auth Library (AuthMiddleware). |
| `Test_MultiRole.gs` | Test suite: Multi-role access patterns. |
| `Test_AdminAPI.gs` | Test suite: Admin API CRUD operations. |
| `Test_SessionIntegration.gs` | Test suite: Session integration end-to-end. |

## 2. File di `lib/gas-auth-lib/` (GAS Library terpisah untuk child apps)

| File | Peran |
|:-----|:------|
| `AuthMiddleware.gs` | Library utama — `authenticate(e)`, `_validateTokenFromSheet()`, `hasRole()`, `buildSafeRedirectPage()`, `getLogoutUrl()`, `escapeHtmlAttr()`. Diimport oleh child apps via GAS Libraries. |
| `ChildAppTemplate.gs` | Template contoh implementasi `doGet(e)` di child app — demo `authenticate()`, `hasRole()`, logout link. |
| `README.md` | Dokumentasi setup & API reference untuk library. |
| `appsscript.json` | Manifest GAS project library (timezone, dependencies). |

> **Catatan:** `lib/gas-auth-lib/` adalah GAS project **terpisah** dengan `.clasp.json` sendiri (di-gitignore). Deploy dan versioning dilakukan independen dari hub.

## 3. File HTML

| File | Peran |
|:-----|:------|
| `login.html` | Halaman login — dual mode: tombol "Sign in with Google" (OAuth redirect) + form OTP WhatsApp. Tailwind CSS. |
| `verify.html` | Halaman verifikasi kode OTP — input 6 digit, countdown timer. |
| `dashboard.html` | Dashboard hub setelah login — compact header, category pill bar, 2-column app grid, bottom navigation. Mobile-first responsive. |
| `admin.html` | Admin panel — pill tabs (Users/Apps), CRUD via `google.script.run` ke `AdminAPI.gs`. |
| `profile.html` | Profil user — informasi session aktif + tombol logout. |
| `_navbar.html` | Bottom navigation bar — JavaScript-based, membaca data dari `window.__HUB__`. |
| `_navbar_styles.html` | CSS untuk bottom navigation bar dan pill tabs. |

## 4. File Konfigurasi

| File | Peran |
|:-----|:------|
| `appsscript.json` | Manifest GAS project hub — timezone `Asia/Jakarta`, webapp access `ANYONE_ANONYMOUS`. |
| `.gitignore` | Mengabaikan `GEMINI.md`, `.analysis`, `.clasp.json`. |
| `.gitattributes` | Git line ending configuration. |

## 5. Entry Points

### `doGet(e)` — `Code.gs:12`

Routing utama untuk HTTP GET:

1. Jika `?token=xxx` valid → render `dashboard` (atau `admin`/`profile` page)
2. Jika `?token=xxx` valid + `?redirect=URL` → redirect ke child app dengan token
3. Jika `?code=xxx` → handle Google OAuth callback (exchange code, create session)
4. Default → render `login` page

### `doPost(e)` — `Code.gs:143`

Routing utama untuk HTTP POST (form actions):

- `action=logout` → invalidasi session, render login
- `action=google_login` → deprecated legacy Google login (kept for backward compat)
- `action=send_otp` → kirim OTP via GOWA API
- `action=admin_get_users|admin_add_user|admin_update_user|admin_delete_user` → Admin user CRUD
- `action=admin_get_apps|admin_add_app|admin_update_app|admin_delete_app` → Admin app CRUD
- `action=verify_otp` → verifikasi OTP, buat session, redirect

## 6. Test Infrastructure

- **Framework:** `TestFramework.gs` — custom BDD (bukan library eksternal)
- **Pattern:** `describe()` → `it()` → `assert.*` (equal, isTrue, isFalse, isTruthy, contains, throws, dll.)
- **Runner:** `runAllTests()` di GAS Editor — **TIDAK ADA CLI test runner**
- **Config:** `TestConfig.gs` — override `getUsersSheetId()` ke `TEST_SHEET_ID`, seed data dummy
- **Suites:** 11 test suites (Auth, Session, UserWhitelist, GoogleAuth, AppRegistry, AuditLog, Code, AuthLib, MultiRole, AdminAPI, SessionIntegration)
- **File pattern:** `Test_*.gs` — terpisah dari kode aplikasi

## 7. Hubungan Antar File

```
Code.gs (controller utama)
├── memanggil → Auth.gs (sendOtp, verifyOtp)
├── memanggil → GoogleAuth.gs (getGoogleAuthUrl, exchangeCodeForToken, verifyGoogleToken, validateOAuthState)
├── memanggil → UserWhitelist.gs (checkUserByEmail, checkUserByPhone, getUsersSheetId)
├── memanggil → Session.gs (createSession, validateSession, deleteSession)
├── memanggil → AppRegistry.gs (getRegisteredApps, getUniqueCategories, buildAppUrl)
├── memanggil → AuditLog.gs (logAuditEvent)
├── memanggil → AdminAPI.gs (adminGetUsers, adminAddUser, adminUpdateUser, adminDeleteUser, adminGetApps, adminAddApp, adminUpdateApp, adminDeleteApp)
└── render → login.html, verify.html, dashboard.html, admin.html, profile.html

Auth.gs
├── menggunakan → ScriptProperties (OTP_SECRET_PEPPER, GOWA_API_KEY)
└── memanggil → Utilities.computeDigest (SHA-256 hashing)

GoogleAuth.gs
├── menggunakan → ScriptProperties (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
├── menggunakan → CacheService (OAuth nonce, TTL 600s)
└── memanggil → UrlFetchApp (Google token endpoint, tokeninfo)

Session.gs
├── memanggil → UserWhitelist.gs (getUsersSheetId — reuse Sheet ID)
├── memanggil → Auth.gs (generateHash — reuse untuk token generation)
└── menggunakan → SpreadsheetApp (tab 'sessions')

AdminAPI.gs
├── memanggil → Session.gs (validateSession — via requireAdmin)
├── memanggil → UserWhitelist.gs (getUsersSheetId)
├── memanggil → AuditLog.gs (logAuditEvent)
└── menggunakan → SpreadsheetApp (tab 'users', 'apps')

AppRegistry.gs
└── memanggil → UserWhitelist.gs (getUsersSheetId — reuse Sheet ID)

AuditLog.gs
└── memanggil → UserWhitelist.gs (getUsersSheetId — reuse Sheet ID)

Triggers.gs
├── memanggil → Session.gs (cleanExpiredSessions)
└── memanggil → AuditLog.gs (cleanOldAuditLogs)

dashboard.html, admin.html, profile.html
└── include → _navbar_styles.html, _navbar.html

lib/gas-auth-lib/AuthMiddleware.gs (LIBRARY TERPISAH)
├── menggunakan → ScriptProperties child app (AUTH_SESSION_SHEET_ID, AUTH_HUB_URL)
└── menggunakan → SpreadsheetApp (tab 'sessions' — shared Sheet dengan hub)
```

## 8. Catatan Penting

- **`.clasp.json` di-gitignore** (by design) — ada 2 file `.clasp.json` terpisah: satu di root (hub), satu di `lib/gas-auth-lib/` (library). Keduanya tidak di-track di git.
- **`.github/workflows/`** berisi `auto-merge-devin.yml` — workflow auto-merge untuk PR dari Devin bot (approve + squash merge).
- **Tidak ada CI/CD test runner** — semua test dijalankan manual via `runAllTests()` di GAS Editor.
- **Tidak ada `package.json` atau npm** — project ini murni GAS, tidak ada build step atau dependency manager.
