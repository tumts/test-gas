# Risk Register

> Area risiko berdasarkan scan aktual repo `gas-workspace-hub`.
> Terakhir diperbarui: 2026-05-01 (P5 update)

---

## HIGH Risk

### 1. Auth.gs — OTP + GOWA API + Pepper Hashing

| Aspek | Detail |
|:------|:-------|
| **File** | `Auth.gs` |
| **Fungsi kunci** | `sendOtp()`, `verifyOtp()`, `generateHash()`, `getOtpPepper()`, `getGowaConfig()` |
| **Alasan risiko** | Mengelola OTP 6-digit dengan SHA-256 + pepper hashing. Berkomunikasi dengan GOWA WhatsApp API menggunakan Basic Auth. Rate limiting (60s cooldown, max 3x per 15 menit) dan batas percobaan (5x) diimplementasikan di sini. Kesalahan bisa menyebabkan: bypass OTP, leak pepper, DoS pada API GOWA, atau bypass rate limit. |
| **Jangan ubah tanpa...** | Review menyeluruh terhadap hashing logic, rate limiting windows, dan error handling API. Pastikan pepper tidak pernah ter-log atau ter-expose. Jalankan `testSuite_Auth()` setelah perubahan. |

### 2. GoogleAuth.gs — OAuth 2.0 Flow + Client Secret

| Aspek | Detail |
|:------|:-------|
| **File** | `GoogleAuth.gs` |
| **Fungsi kunci** | `getGoogleAuthUrl()`, `exchangeCodeForToken()`, `verifyGoogleToken()`, `validateOAuthState()`, `getGoogleClientId()` |
| **Alasan risiko** | Menangani OAuth 2.0 Authorization Code flow lengkap: auth URL construction, CSRF nonce via CacheService (TTL 600s), code exchange ke token endpoint, dan ID token verification via tokeninfo. Client Secret diakses dari Script Properties. Kesalahan bisa menyebabkan: CSRF bypass, token theft, atau akun impersonation. |
| **Jangan ubah tanpa...** | Verifikasi CSRF nonce lifecycle (create → validate → remove), token exchange error handling, dan ID token verification steps. Jalankan `testSuite_GoogleAuth()` setelah perubahan. |

### 3. Code.gs baris 236+ — Admin API Endpoints (CRUD tanpa CSRF protection)

| Aspek | Detail |
|:------|:-------|
| **File** | `Code.gs` (baris 236–271) |
| **Fungsi kunci** | `doPost()` handler untuk `admin_get_users`, `admin_add_user`, `admin_update_user`, `admin_delete_user`, `admin_get_apps`, `admin_add_app`, `admin_update_app`, `admin_delete_app` |
| **Alasan risiko** | Admin API endpoints di-dispatch langsung dari `doPost()` berdasarkan `e.parameter.action`. Validasi hanya via session token (`requireAdmin()`), **tidak ada CSRF token** terpisah. `e.parameter.data` di-parse langsung dari JSON tanpa sanitasi mendalam. Potensi CSRF attack jika attacker mengetahui format request. Sejak P4, admin panel (`admin.html`) memanggil AdminAPI functions via `google.script.run` dari client-side. Validasi tetap server-side via `requireAdmin()`. |
| **Jangan ubah tanpa...** | Review auth check (`requireAdmin()`), input validation, dan pertimbangkan penambahan CSRF protection. Jalankan `testSuite_AdminAPI()` dan `testSuite_Code()` setelah perubahan. |

### 4. AdminAPI.gs — CRUD Users & Apps

| Aspek | Detail |
|:------|:-------|
| **File** | `AdminAPI.gs` |
| **Fungsi kunci** | `requireAdmin()`, `adminGetUsers()`, `adminAddUser()`, `adminUpdateUser()`, `adminDeleteUser()`, `adminGetApps()`, `adminAddApp()`, `adminUpdateApp()`, `adminDeleteApp()` |
| **Alasan risiko** | Full CRUD operations pada data user dan apps. Admin authorization hanya via `requireAdmin()` (session token + role check). Email sebagai primary key — tidak boleh diubah. Role validation terhadap `VALID_ROLES` array. Kesalahan bisa menyebabkan: privilege escalation, unauthorized data access, atau data corruption. |
| **Jangan ubah tanpa...** | Pastikan `requireAdmin()` selalu dipanggil di awal setiap fungsi. Verifikasi input validation (email uniqueness, role validation, primary key protection). Jalankan `testSuite_AdminAPI()`. |

### 5. lib/gas-auth-lib/AuthMiddleware.gs — Blast Radius Lintas Child Apps

| Aspek | Detail |
|:------|:-------|
| **File** | `lib/gas-auth-lib/AuthMiddleware.gs` |
| **Fungsi kunci** | `authenticate()`, `_validateTokenFromSheet()`, `hasRole()`, `buildSafeRedirectPage()`, `escapeHtmlAttr()` |
| **Alasan risiko** | Library ini digunakan oleh **semua child apps** untuk autentikasi. Bug di sini berdampak pada seluruh ekosistem (blast radius tinggi). Validasi token dilakukan langsung terhadap Sheet `sessions`. XSS prevention via `escapeHtmlAttr()` harus benar. Perubahan backward-incompatible bisa break semua child apps. |
| **Jangan ubah tanpa...** | Test di environment terpisah. Pastikan backward compatibility. Review `escapeHtmlAttr()` untuk XSS edge cases. Jalankan `testSuite_AuthLib()`. Setelah merge, **wajib deploy ulang library dan update versi di semua child apps**. |

### 6. Script Properties — Secrets

| Aspek | Detail |
|:------|:-------|
| **Properties** | `GOWA_API_KEY`, `OTP_SECRET_PEPPER`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `USERS_SHEET_ID`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PHONE` |
| **Alasan risiko** | Menyimpan kredensial sensitif (API key, OAuth secret, pepper). Diakses via `PropertiesService.getScriptProperties()`. Tidak boleh di-hardcode atau di-log. Child apps punya properties terpisah: `AUTH_SESSION_SHEET_ID`, `AUTH_HUB_URL`. |
| **Jangan ubah tanpa...** | Jangan pernah set/ubah Script Properties dari kode Devin. Jangan log atau expose nilai properties. Jika perubahan kode menambahkan usage property baru, dokumentasikan di PR description. |

---

## MEDIUM Risk

### 7. Session.gs — Session Management

| Aspek | Detail |
|:------|:-------|
| **File** | `Session.gs` |
| **Fungsi kunci** | `createSession()`, `validateSession()`, `deleteSession()`, `cleanExpiredSessions()`, `generateSessionToken()` |
| **Alasan risiko** | Session token = SHA-256 hash dari UUID + timestamp + random. Duration 1 jam (`SESSION_DURATION_MS = 3600000`). Data disimpan di Google Sheet (tidak terenkripsi). Cleanup menghapus row dari Sheet — iterasi dari bawah ke atas untuk stabilitas index. Race condition mungkin terjadi pada concurrent access. |
| **Jangan ubah tanpa...** | Verifikasi token generation uniqueness, expiry logic, dan cleanup safety. Jalankan `testSuite_Session()` dan `testSuite_SessionIntegration()`. |

### 8. CacheService Usage di GoogleAuth.gs — OAuth Nonce

| Aspek | Detail |
|:------|:-------|
| **File** | `GoogleAuth.gs` (baris 37, 64, 68) |
| **Fungsi kunci** | `getGoogleAuthUrl()` (create nonce), `validateOAuthState()` (validate & remove nonce) |
| **Alasan risiko** | OAuth CSRF nonce disimpan di `CacheService.getScriptCache()` dengan TTL 600 detik (10 menit). Nonce one-time-use (dihapus setelah validasi). Jika CacheService flush atau TTL terlalu pendek, user mendapat error "CSRF nonce tidak valid". |
| **Jangan ubah tanpa...** | Pastikan nonce lifecycle tetap: create → put with TTL → validate → remove. Jangan ubah TTL tanpa pertimbangan UX. |

### 9. Setup.gs — One-Time Setup Functions

| Aspek | Detail |
|:------|:-------|
| **File** | `Setup.gs` |
| **Fungsi kunci** | `setupProductionSheet()`, `setupTestSheet()`, `verifySetup()` |
| **Alasan risiko** | `setupProductionSheet()` membuat spreadsheet baru dan set `USERS_SHEET_ID`. Ada guard untuk mencegah duplikasi (cek existing property). `setupTestSheet()` membuat spreadsheet terpisah untuk testing. **JANGAN jalankan ulang** — bisa membuat spreadsheet duplikat atau overwrite ID. |
| **Jangan ubah tanpa...** | Pastikan idempotency guard tetap ada. Jangan jalankan fungsi setup dari environment Devin. Jalankan `verifySetup()` dari GAS Editor untuk validasi. |

---

## LOW Risk

### 10. AuditLog.gs — Pencatatan Aktivitas

| Aspek | Detail |
|:------|:-------|
| **File** | `AuditLog.gs` |
| **Fungsi kunci** | `logAuditEvent()`, `cleanOldAuditLogs()`, `getAuditSheet()` |
| **Alasan risiko** | Append-only log ke Sheet. Cleanup menghapus baris > 90 hari. Kegagalan log tidak mempengaruhi auth flow (wrapped in try-catch). |
| **Jangan ubah tanpa...** | Pastikan error handling tidak throw ke caller. Verifikasi cleanup threshold (90 hari). |

### 11. AppRegistry.gs — Registry Aplikasi

| Aspek | Detail |
|:------|:-------|
| **File** | `AppRegistry.gs` |
| **Fungsi kunci** | `getRegisteredApps()`, `getUniqueCategories()`, `buildAppUrl()`, `getAppsSheet()` |
| **Alasan risiko** | Read-only dari Sheet tab `apps`. Role-based filtering dengan admin override. `buildAppUrl()` menambahkan `auth_token` ke URL. Risiko rendah karena tidak mengubah data sensitif. |
| **Jangan ubah tanpa...** | Verifikasi role matching logic (case-insensitive, comma-separated). Jalankan `testSuite_AppRegistry()`. |

### 12. Triggers.gs — Scheduled Cleanup

| Aspek | Detail |
|:------|:-------|
| **File** | `Triggers.gs` |
| **Fungsi kunci** | `setupTriggers()`, `scheduledCleanup()` |
| **Alasan risiko** | Orchestrator untuk `cleanExpiredSessions()` + `cleanOldAuditLogs()`. `setupTriggers()` menghapus trigger lama sebelum buat baru — **jalankan SATU KALI**. |
| **Jangan ubah tanpa...** | Pastikan idempotency (hapus trigger lama). Jangan ubah interval tanpa pertimbangan. |

### 13. UserWhitelist.gs — Lookup User

| Aspek | Detail |
|:------|:-------|
| **File** | `UserWhitelist.gs` |
| **Fungsi kunci** | `getUsersSheetId()`, `checkUserByEmail()`, `checkUserByPhone()` |
| **Alasan risiko** | Read-only lookup terhadap Sheet tab `users`. `getUsersSheetId()` digunakan oleh hampir semua modul lain sebagai shared Sheet ID accessor. Normalisasi case-insensitive dan phone digit cleanup. |
| **Jangan ubah tanpa...** | Perubahan pada `getUsersSheetId()` berdampak pada semua modul. Jalankan `testSuite_UserWhitelist()`. |
