# Testing Rules

> Aturan dan panduan testing untuk Devin di repo `gas-workspace-hub`.

---

## Framework

- **File:** `TestFramework.gs` — custom BDD framework, bukan library eksternal
- **Config:** `TestConfig.gs` — helper untuk override Sheet ID, seed data, setup/teardown
- **Runner:** `runAllTests()` — dijalankan di GAS Editor, **TIDAK ADA CLI test runner**

## Pattern

```javascript
describe('Nama Suite', function() {
  
  beforeEach(function() {
    // Setup sebelum setiap test case (opsional)
    setupTestEnvironment();
  });
  
  afterEach(function() {
    // Cleanup setelah setiap test case (opsional)
    restoreSheetId();
  });
  
  it('should do something specific', function() {
    var result = someFunction();
    assert.equal(result.success, true, 'Harus berhasil');
    assert.isTrue(result.valid, 'Harus valid');
  });
  
  it('should handle error case', function() {
    assert.throws(function() {
      functionThatShouldThrow();
    }, 'Harus throw error');
  });
});
```

## Assert Methods

| Method | Deskripsi |
|:-------|:----------|
| `assert.equal(actual, expected, msg)` | Strict equality (`===`) |
| `assert.notEqual(actual, expected, msg)` | Strict inequality (`!==`) |
| `assert.isTrue(value, msg)` | Value harus `true` |
| `assert.isFalse(value, msg)` | Value harus `false` |
| `assert.isTruthy(value, msg)` | Value harus truthy |
| `assert.isFalsy(value, msg)` | Value harus falsy |
| `assert.contains(str, substring, msg)` | String harus mengandung substring |
| `assert.isType(value, type, msg)` | `typeof value` harus sama dengan `type` |
| `assert.throws(fn, msg)` | Function harus throw error |
| `assert.doesNotThrow(fn, msg)` | Function tidak boleh throw |
| `assert.greaterThan(actual, expected, msg)` | `actual > expected` |
| `assert.lengthOf(arr, len, msg)` | `arr.length === len` |

## Test Suites yang Ada (11 suites)

| Suite | File | Fungsi entry |
|:------|:-----|:-------------|
| Auth | `Test_Auth.gs` | `testSuite_Auth()` |
| Session | `Test_Session.gs` | `testSuite_Session()` |
| UserWhitelist | `Test_UserWhitelist.gs` | `testSuite_UserWhitelist()` |
| GoogleAuth | `Test_GoogleAuth.gs` | `testSuite_GoogleAuth()` |
| AppRegistry | `Test_AppRegistry.gs` | `testSuite_AppRegistry()` |
| AuditLog | `Test_AuditLog.gs` | `testSuite_AuditLog()` |
| Code | `Test_Code.gs` | `testSuite_Code()` |
| AuthLib | `Test_AuthLib.gs` | `testSuite_AuthLib()` |
| MultiRole | `Test_MultiRole.gs` | `testSuite_MultiRole()` |
| AdminAPI | `Test_AdminAPI.gs` | `testSuite_AdminAPI()` |
| SessionIntegration | `Test_SessionIntegration.gs` | `testSuite_SessionIntegration()` |

## Test Environment

- Test menggunakan **spreadsheet terpisah** dari production (`TEST_SHEET_ID`)
- `TestConfig.gs` menyediakan:
  - `setupTestEnvironment()` — override `getUsersSheetId()` ke test sheet + seed data
  - `restoreSheetId()` — restore original function setelah test
  - `seedTestUsers()` — data dummy users (admin, guru, siswa, orangtua, inactive)
  - `seedTestApps()` — data dummy apps
  - `resetTestSheet(tabName, headers)` — bersihkan tab dan buat ulang

## Aturan untuk Devin

### Boleh:
- Menulis test baru mengikuti pattern yang ada (`describe()` → `it()` → `assert.*`)
- Membuat file `Test_NamaFitur.gs` baru
- Menambahkan test case ke suite yang sudah ada
- Menambahkan entry `testSuite_NamaFitur()` ke `runAllTests()` di `TestFramework.gs`

### Harus:
- Menggunakan `describe()` / `it()` / `assert.*` dari `TestFramework.gs`
- Menggunakan `setupTestEnvironment()` + `restoreSheetId()` jika test butuh akses Sheet
- Setelah menulis test, instruksikan user:
  > "Jalankan `runAllTests()` di GAS Editor dan laporkan hasilnya."

### Dilarang:
- Jangan mencoba menjalankan test dari terminal/CLI — **tidak akan bekerja**
- Jangan install test framework eksternal (Jest, Mocha, dll.)
- Jangan ubah `TestFramework.gs` kecuali menambahkan entry suite baru ke `runAllTests()`
- Jangan ubah data di production sheet — selalu gunakan `TEST_SHEET_ID`
