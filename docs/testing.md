# Panduan Testing

Panduan menjalankan dan menulis test di GAS Workspace Hub.

---

## Framework

Project ini menggunakan **custom BDD testing framework** yang dibangun di `TestFramework.gs`. Bukan Jest, Mocha, atau library testing eksternal lainnya.

Konfigurasi test environment ada di `TestConfig.gs` — menyediakan helper untuk override Sheet ID, seed data, dan setup/teardown.

---

## Cara Menjalankan Test

> **PENTING**: Test hanya bisa dijalankan di **GAS Editor**. Tidak ada CLI test runner.

1. Buka project di [GAS Editor](https://script.google.com/).
2. Pastikan `setupTestSheet()` sudah dijalankan (cukup sekali — membuat spreadsheet terpisah untuk test).
3. Pilih fungsi `runAllTests()` dari dropdown.
4. Klik **Run**.
5. Buka **Execution Log** untuk melihat hasil.

---

## Daftar Test Suites

Project memiliki **11 test suites**:

| # | Suite | File | Fungsi Entry |
|:--|:------|:-----|:-------------|
| 1 | Auth | `Test_Auth.gs` | `testSuite_Auth()` |
| 2 | Session | `Test_Session.gs` | `testSuite_Session()` |
| 3 | UserWhitelist | `Test_UserWhitelist.gs` | `testSuite_UserWhitelist()` |
| 4 | GoogleAuth | `Test_GoogleAuth.gs` | `testSuite_GoogleAuth()` |
| 5 | AppRegistry | `Test_AppRegistry.gs` | `testSuite_AppRegistry()` |
| 6 | AuditLog | `Test_AuditLog.gs` | `testSuite_AuditLog()` |
| 7 | Code | `Test_Code.gs` | `testSuite_Code()` |
| 8 | AuthLib | `Test_AuthLib.gs` | `testSuite_AuthLib()` |
| 9 | MultiRole | `Test_MultiRole.gs` | `testSuite_MultiRole()` |
| 10 | AdminAPI | `Test_AdminAPI.gs` | `testSuite_AdminAPI()` |
| 11 | SessionIntegration | `Test_SessionIntegration.gs` | `testSuite_SessionIntegration()` |

Untuk menjalankan satu suite saja, panggil fungsi entry-nya langsung (contoh: `testSuite_Auth()`).

---

## Test Environment

- Test menggunakan **spreadsheet terpisah** dari production (ID disimpan di Script Property `TEST_SHEET_ID`).
- `setupTestSheet()` membuat spreadsheet test ini — jalankan **sekali** sebelum test pertama.
- `TestConfig.gs` menyediakan:
  - `setupTestEnvironment()` — override `getUsersSheetId()` ke test sheet + seed data dummy
  - `restoreSheetId()` — restore function asli setelah test
  - `seedTestUsers()` — data dummy: admin, guru, siswa, orangtua, inactive user
  - `seedTestApps()` — data dummy apps
  - `resetTestSheet(tabName, headers)` — bersihkan tab dan buat ulang headers

> Test **tidak pernah menyentuh** data production. Semua operasi dilakukan terhadap spreadsheet test.

---

## Cara Menulis Test Baru

### Pattern Dasar

```javascript
function testSuite_NamaFitur() {
  describe('Nama Fitur', function() {

    beforeEach(function() {
      setupTestEnvironment();
    });

    afterEach(function() {
      restoreSheetId();
    });

    it('should do something expected', function() {
      var result = someFunction('input');
      assert.equal(result.success, true, 'Harus berhasil');
      assert.isTrue(result.valid, 'Harus valid');
    });

    it('should handle error case', function() {
      assert.throws(function() {
        functionThatShouldThrow();
      }, 'Harus throw error');
    });

  });
}
```

### Langkah-langkah

1. Buat file baru: `Test_NamaFitur.gs`.
2. Buat fungsi entry: `testSuite_NamaFitur()`.
3. Gunakan `describe()` → `it()` → `assert.*` dari `TestFramework.gs`.
4. Jika test butuh akses Sheet, gunakan `setupTestEnvironment()` di `beforeEach()` dan `restoreSheetId()` di `afterEach()`.
5. Tambahkan entry `testSuite_NamaFitur()` ke fungsi `runAllTests()` di `TestFramework.gs`.
6. Jalankan `runAllTests()` untuk verifikasi.

---

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
