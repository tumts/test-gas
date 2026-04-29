/**
 * @file Setup.gs
 * @description Generator otomatis untuk spreadsheet dan tabel yang dibutuhkan aplikasi.
 * Jalankan setupProductionSheet() SATU KALI dari GAS editor untuk setup awal.
 * 
 * PRASYARAT sebelum menjalankan setup:
 * - Script Property 'DEFAULT_ADMIN_EMAIL' harus sudah diisi (placeholder: admin@example.com)
 * - Script Property 'DEFAULT_ADMIN_PHONE' harus sudah diisi (placeholder: 6281234567890)
 * 
 * Script Properties yang di-generate otomatis:
 * - USERS_SHEET_ID (dari setupProductionSheet)
 * - TEST_SHEET_ID (dari setupTestSheet)
 */

/**
 * Setup spreadsheet production dengan semua tab yang dibutuhkan.
 * Membuat spreadsheet baru, 4 tab (users, sessions, apps, audit_log),
 * dan menyimpan Sheet ID ke Script Properties secara otomatis.
 * 
 * JALANKAN SATU KALI dari GAS editor.
 */
function setupProductionSheet() {
  var props = PropertiesService.getScriptProperties();
  
  // Cek apakah sudah pernah di-setup
  var existingId = props.getProperty('USERS_SHEET_ID');
  if (existingId) {
    Logger.log('⚠️ USERS_SHEET_ID sudah ada: ' + existingId);
    Logger.log('Jika ingin setup ulang, hapus property USERS_SHEET_ID terlebih dahulu.');
    return existingId;
  }
  
  // Ambil data admin default dari Script Properties
  var adminEmail = props.getProperty('DEFAULT_ADMIN_EMAIL') || 'admin@example.com';
  var adminPhone = props.getProperty('DEFAULT_ADMIN_PHONE') || '6281234567890';
  
  Logger.log('=== SETUP PRODUCTION SHEET ===');
  Logger.log('Admin Email: ' + adminEmail);
  Logger.log('Admin Phone: ' + adminPhone);
  
  // 1. Buat Spreadsheet baru
  var spreadsheet = SpreadsheetApp.create('GAS Workspace Hub - Data');
  var sheetId = spreadsheet.getId();
  Logger.log('Spreadsheet dibuat: ' + sheetId);
  Logger.log('URL: https://docs.google.com/spreadsheets/d/' + sheetId + '/edit');
  
  // 2. Setup tab 'users'
  var usersSheet = spreadsheet.getActiveSheet();
  usersSheet.setName('users');
  usersSheet.appendRow(['email', 'phone', 'nama', 'role', 'status', 'ditambahkan_oleh', 'tanggal']);
  usersSheet.setFrozenRows(1);
  // Insert admin default
  usersSheet.appendRow([
    adminEmail,
    adminPhone,
    'Admin',
    'admin',
    'active',
    'system_setup',
    new Date().toISOString().split('T')[0]
  ]);
  // Format header
  usersSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
  Logger.log('✅ Tab "users" dibuat dengan admin default.');
  
  // 3. Setup tab 'sessions'
  var sessionsSheet = spreadsheet.insertSheet('sessions');
  sessionsSheet.appendRow(['token', 'email', 'phone', 'name', 'role', 'loginMethod', 'createdAt', 'expiresAt', 'status']);
  sessionsSheet.setFrozenRows(1);
  sessionsSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f3f4f6');
  Logger.log('✅ Tab "sessions" dibuat.');
  
  // 4. Setup tab 'apps'
  var appsSheet = spreadsheet.insertSheet('apps');
  appsSheet.appendRow(['id', 'name', 'url', 'icon', 'description', 'requiredRole', 'status']);
  appsSheet.setFrozenRows(1);
  // Insert placeholder hub entry
  appsSheet.appendRow([
    'hub',
    'Workspace Hub',
    '',
    '🏠',
    'Halaman utama hub (tidak perlu URL)',
    'user',
    'active'
  ]);
  // Insert contoh child app
  appsSheet.appendRow([
    'contoh-app',
    'Contoh Aplikasi',
    'https://script.google.com/macros/s/DEPLOY_ID_DISINI/exec',
    '📦',
    'Ganti URL dengan deployment ID aplikasi Anda',
    'user',
    'inactive'
  ]);
  appsSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f4f6');
  Logger.log('✅ Tab "apps" dibuat dengan contoh data.');
  
  // 5. Setup tab 'audit_log'
  var auditSheet = spreadsheet.insertSheet('audit_log');
  auditSheet.appendRow(['timestamp', 'event', 'email', 'phone', 'method', 'detail']);
  auditSheet.setFrozenRows(1);
  auditSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f4f6');
  Logger.log('✅ Tab "audit_log" dibuat.');
  
  // 6. Simpan Sheet ID ke Script Properties
  props.setProperty('USERS_SHEET_ID', sheetId);
  Logger.log('✅ USERS_SHEET_ID disimpan ke Script Properties: ' + sheetId);
  
  Logger.log('');
  Logger.log('=== SETUP SELESAI ===');
  Logger.log('Spreadsheet URL: https://docs.google.com/spreadsheets/d/' + sheetId + '/edit');
  Logger.log('');
  Logger.log('LANGKAH SELANJUTNYA:');
  Logger.log('1. Buka spreadsheet di atas dan verifikasi semua tab sudah benar');
  Logger.log('2. Edit data admin di tab "users" jika perlu');
  Logger.log('3. Tambahkan user lain di tab "users"');
  Logger.log('4. Tambahkan aplikasi di tab "apps" (ganti URL contoh-app)');
  Logger.log('5. Set Script Properties lainnya: GOWA_API_KEY, OTP_SECRET_PEPPER, GOOGLE_CLIENT_ID');
  
  return sheetId;
}

/**
 * Setup spreadsheet test (untuk automated testing).
 * Struktur identik dengan production, tapi dengan data dummy.
 * 
 * JALANKAN SATU KALI dari GAS editor (opsional, hanya jika ingin menjalankan test suite).
 */
function setupTestSheet() {
  var props = PropertiesService.getScriptProperties();
  
  // Cek apakah sudah pernah di-setup
  var existingId = props.getProperty('TEST_SHEET_ID');
  if (existingId) {
    Logger.log('⚠️ TEST_SHEET_ID sudah ada: ' + existingId);
    Logger.log('Jika ingin setup ulang, hapus property TEST_SHEET_ID terlebih dahulu.');
    return existingId;
  }
  
  Logger.log('=== SETUP TEST SHEET ===');
  
  // 1. Buat Spreadsheet test
  var spreadsheet = SpreadsheetApp.create('GAS Workspace Hub - TEST DATA (jangan edit manual)');
  var sheetId = spreadsheet.getId();
  Logger.log('Test Spreadsheet dibuat: ' + sheetId);
  
  // 2. Setup tab 'users' dengan test data
  var usersSheet = spreadsheet.getActiveSheet();
  usersSheet.setName('users');
  usersSheet.appendRow(['email', 'phone', 'nama', 'role', 'status', 'ditambahkan_oleh', 'tanggal']);
  usersSheet.setFrozenRows(1);
  // Test users
  usersSheet.appendRow(['testadmin@example.com', '6280000000001', 'Test Admin', 'admin', 'active', 'system', '2026-01-01']);
  usersSheet.appendRow(['testuser@example.com', '6280000000002', 'Test User', 'user', 'active', 'system', '2026-01-01']);
  usersSheet.appendRow(['inactive@example.com', '6280000000003', 'Inactive User', 'user', 'inactive', 'system', '2026-01-01']);
  Logger.log('✅ Tab "users" dibuat dengan 3 test users.');
  
  // 3. Setup tab 'sessions'
  var sessionsSheet = spreadsheet.insertSheet('sessions');
  sessionsSheet.appendRow(['token', 'email', 'phone', 'name', 'role', 'loginMethod', 'createdAt', 'expiresAt', 'status']);
  sessionsSheet.setFrozenRows(1);
  Logger.log('✅ Tab "sessions" dibuat.');
  
  // 4. Setup tab 'apps'
  var appsSheet = spreadsheet.insertSheet('apps');
  appsSheet.appendRow(['id', 'name', 'url', 'icon', 'description', 'requiredRole', 'status']);
  appsSheet.setFrozenRows(1);
  appsSheet.appendRow(['test-app-1', 'Test App 1', 'https://example.com/app1', '🧪', 'Aplikasi test 1', 'user', 'active']);
  appsSheet.appendRow(['test-app-2', 'Test App Admin', 'https://example.com/app2', '🔧', 'Aplikasi test admin only', 'admin', 'active']);
  appsSheet.appendRow(['test-app-inactive', 'Inactive App', 'https://example.com/app3', '❌', 'Aplikasi nonaktif', 'user', 'inactive']);
  Logger.log('✅ Tab "apps" dibuat dengan 3 test apps.');
  
  // 5. Setup tab 'audit_log'
  var auditSheet = spreadsheet.insertSheet('audit_log');
  auditSheet.appendRow(['timestamp', 'event', 'email', 'phone', 'method', 'detail']);
  auditSheet.setFrozenRows(1);
  Logger.log('✅ Tab "audit_log" dibuat.');
  
  // 6. Simpan Sheet ID ke Script Properties
  props.setProperty('TEST_SHEET_ID', sheetId);
  Logger.log('✅ TEST_SHEET_ID disimpan ke Script Properties: ' + sheetId);
  
  Logger.log('');
  Logger.log('=== SETUP TEST SELESAI ===');
  Logger.log('Test Sheet URL: https://docs.google.com/spreadsheets/d/' + sheetId + '/edit');
  
  return sheetId;
}

/**
 * Verifikasi semua konfigurasi sudah benar.
 * Jalankan untuk mengecek status setup.
 */
function verifySetup() {
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  
  Logger.log('=== VERIFIKASI SETUP ===');
  Logger.log('');
  
  // Daftar property yang dibutuhkan
  var required = [
    { key: 'USERS_SHEET_ID', desc: 'ID Spreadsheet production', critical: true },
    { key: 'DEFAULT_ADMIN_EMAIL', desc: 'Email admin default', critical: false },
    { key: 'DEFAULT_ADMIN_PHONE', desc: 'Phone admin default', critical: false },
    { key: 'GOWA_API_KEY', desc: 'Kredensial API GOWA (username:password)', critical: true },
    { key: 'OTP_SECRET_PEPPER', desc: 'Pepper untuk hashing OTP', critical: true },
    { key: 'GOOGLE_CLIENT_ID', desc: 'OAuth Client ID (opsional, untuk login Google)', critical: false },
    { key: 'TEST_SHEET_ID', desc: 'ID Spreadsheet test (opsional)', critical: false }
  ];
  
  var allOk = true;
  
  required.forEach(function(prop) {
    var value = allProps[prop.key];
    var status = value ? '✅' : (prop.critical ? '❌' : '⚠️');
    var isSensitive = (prop.key === 'GOWA_API_KEY' || prop.key === 'OTP_SECRET_PEPPER' || prop.key === 'GOOGLE_CLIENT_ID');
    var display = value ? (isSensitive ? '***SET***' : (value.substring(0, 10) + '...')) : 'BELUM DIISI';
    Logger.log(status + ' ' + prop.key + ': ' + display);
    Logger.log('   → ' + prop.desc);
    if (!value && prop.critical) allOk = false;
  });
  
  Logger.log('');
  
  // Cek tab spreadsheet
  var sheetId = allProps['USERS_SHEET_ID'];
  if (sheetId) {
    Logger.log('--- Verifikasi Tab Spreadsheet ---');
    try {
      var spreadsheet = SpreadsheetApp.openById(sheetId);
      var tabs = ['users', 'sessions', 'apps', 'audit_log'];
      tabs.forEach(function(tabName) {
        var sheet = spreadsheet.getSheetByName(tabName);
        if (sheet) {
          var rowCount = sheet.getLastRow() - 1; // minus header
          Logger.log('✅ Tab "' + tabName + '": ' + rowCount + ' baris data');
        } else {
          Logger.log('❌ Tab "' + tabName + '": TIDAK DITEMUKAN');
          allOk = false;
        }
      });
    } catch (e) {
      Logger.log('❌ Gagal membuka spreadsheet: ' + e.message);
      allOk = false;
    }
  }
  
  Logger.log('');
  Logger.log('=== HASIL: ' + (allOk ? '✅ SEMUA OK' : '❌ ADA YANG BELUM LENGKAP') + ' ===');
  
  if (!allOk) {
    Logger.log('');
    Logger.log('LANGKAH PERBAIKAN:');
    if (!allProps['USERS_SHEET_ID']) {
      Logger.log('→ Jalankan setupProductionSheet() untuk membuat spreadsheet');
    }
    if (!allProps['GOWA_API_KEY']) {
      Logger.log('→ Tambahkan GOWA_API_KEY di Script Properties (format: username:password)');
    }
    if (!allProps['OTP_SECRET_PEPPER']) {
      Logger.log('→ Tambahkan OTP_SECRET_PEPPER di Script Properties');
    }
  }
  
  return allOk;
}

/**
 * Reset setup (HATI-HATI: menghapus property Sheet ID, TIDAK menghapus spreadsheet).
 * Gunakan jika ingin menjalankan setup ulang.
 */
function resetSetup() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('USERS_SHEET_ID');
  props.deleteProperty('TEST_SHEET_ID');
  Logger.log('✅ USERS_SHEET_ID dan TEST_SHEET_ID dihapus dari Script Properties.');
  Logger.log('Spreadsheet TIDAK dihapus dari Google Drive (hapus manual jika perlu).');
  Logger.log('Jalankan setupProductionSheet() untuk setup ulang.');
}
