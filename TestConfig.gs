/**
 * @file TestConfig.gs
 * @description Konfigurasi dan helper untuk test suite.
 * Menggunakan Google Sheet TERPISAH dari production (TEST_SHEET_ID).
 */

/**
 * Mendapatkan Sheet ID khusus testing.
 * WAJIB dikonfigurasi di Script Properties sebelum menjalankan test.
 */
function getTestSheetId() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('TEST_SHEET_ID');
  if (!sheetId) {
    throw new Error('TEST_SHEET_ID belum dikonfigurasi di Script Properties. Buat Google Sheet baru untuk testing.');
  }
  return sheetId;
}

/**
 * Mendapatkan atau membuat sheet tab untuk testing.
 * @param {string} tabName - Nama tab (misal: 'test_users', 'test_sessions')
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getTestSheet(tabName) {
  var spreadsheet = SpreadsheetApp.openById(getTestSheetId());
  var sheet = spreadsheet.getSheetByName(tabName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(tabName);
  }
  
  return sheet;
}

/**
 * Bersihkan sheet tab testing (hapus semua data kecuali header).
 * @param {string} tabName
 * @param {Array<string>} headers - Header kolom
 */
function resetTestSheet(tabName, headers) {
  var spreadsheet = SpreadsheetApp.openById(getTestSheetId());
  var sheet = spreadsheet.getSheetByName(tabName);
  
  if (sheet) {
    spreadsheet.deleteSheet(sheet);
  }
  
  sheet = spreadsheet.insertSheet(tabName);
  if (headers && headers.length > 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Seed data user untuk testing.
 * Membuat tab 'test_users' dengan data dummy.
 */
function seedTestUsers() {
  var sheet = resetTestSheet('test_users', ['email', 'phone', 'nama', 'role', 'status', 'ditambahkan_oleh', 'tanggal']);
  
  // Test data
  sheet.appendRow(['admin@test.com', '6281111111111', 'Admin Test', 'admin', 'active', 'system', '2026-01-01']);
  sheet.appendRow(['user@test.com', '6282222222222', 'User Test', 'user', 'active', 'admin@test.com', '2026-01-01']);
  sheet.appendRow(['inactive@test.com', '6283333333333', 'Inactive User', 'user', 'inactive', 'admin@test.com', '2026-01-01']);
  sheet.appendRow(['UPPERCASE@TEST.COM', '6284444444444', 'Case Test', 'user', 'active', 'admin@test.com', '2026-01-01']);
  
  return sheet;
}

/**
 * Seed data apps untuk testing.
 */
function seedTestApps() {
  var sheet = resetTestSheet('test_apps', ['id', 'name', 'url', 'icon', 'description', 'requiredRole', 'status']);
  
  sheet.appendRow(['app1', 'App User', 'https://script.google.com/macros/s/FAKE_ID_1/exec', '\uD83D\uDCE6', 'App for users', 'user', 'active']);
  sheet.appendRow(['app2', 'App Admin', 'https://script.google.com/macros/s/FAKE_ID_2/exec', '\uD83D\uDD27', 'App for admins', 'admin', 'active']);
  sheet.appendRow(['app3', 'App Inactive', 'https://script.google.com/macros/s/FAKE_ID_3/exec', '\u274C', 'Disabled app', 'user', 'inactive']);
  sheet.appendRow(['app4', 'App No URL', '', '\uD83C\uDFE0', 'Hub itself', 'user', 'active']);
  
  return sheet;
}

/**
 * Override getUsersSheetId() untuk testing.
 * Simpan original dan restore setelah test.
 */
var _originalGetUsersSheetId = null;

function overrideSheetIdForTest() {
  // Simpan referensi original
  _originalGetUsersSheetId = getUsersSheetId;
  
  // Override global function
  getUsersSheetId = function() {
    return getTestSheetId();
  };
}

function restoreSheetId() {
  if (_originalGetUsersSheetId) {
    getUsersSheetId = _originalGetUsersSheetId;
    _originalGetUsersSheetId = null;
  }
}

/**
 * Setup test environment: override Sheet ID + seed data.
 * Panggil di awal setiap test suite yang butuh Sheet.
 */
function setupTestEnvironment() {
  overrideSheetIdForTest();
  
  // Rename test tabs to match production tab names
  var spreadsheet = SpreadsheetApp.openById(getTestSheetId());
  
  // Clean up existing tabs
  var tabsToClean = ['users', 'sessions', 'apps', 'audit_log'];
  for (var i = 0; i < tabsToClean.length; i++) {
    var existing = spreadsheet.getSheetByName(tabsToClean[i]);
    if (existing) {
      spreadsheet.deleteSheet(existing);
    }
  }
  
  // Create fresh tabs with production-matching names
  var usersSheet = spreadsheet.insertSheet('users');
  usersSheet.appendRow(['email', 'phone', 'nama', 'role', 'status', 'ditambahkan_oleh', 'tanggal']);
  usersSheet.setFrozenRows(1);
  usersSheet.appendRow(['admin@test.com', '6281111111111', 'Admin Test', 'admin', 'active', 'system', '2026-01-01']);
  usersSheet.appendRow(['user@test.com', '6282222222222', 'User Test', 'user', 'active', 'admin@test.com', '2026-01-01']);
  usersSheet.appendRow(['inactive@test.com', '6283333333333', 'Inactive User', 'user', 'inactive', 'admin@test.com', '2026-01-01']);
  usersSheet.appendRow(['UPPERCASE@TEST.COM', '6284444444444', 'Case Test', 'user', 'active', 'admin@test.com', '2026-01-01']);
  
  var sessionsSheet = spreadsheet.insertSheet('sessions');
  sessionsSheet.appendRow(['token', 'email', 'phone', 'name', 'role', 'loginMethod', 'createdAt', 'expiresAt', 'status']);
  sessionsSheet.setFrozenRows(1);
  
  var appsSheet = spreadsheet.insertSheet('apps');
  appsSheet.appendRow(['id', 'name', 'url', 'icon', 'description', 'requiredRole', 'status']);
  appsSheet.setFrozenRows(1);
  appsSheet.appendRow(['app1', 'App User', 'https://script.google.com/macros/s/FAKE_ID_1/exec', '\uD83D\uDCE6', 'App for users', 'user', 'active']);
  appsSheet.appendRow(['app2', 'App Admin', 'https://script.google.com/macros/s/FAKE_ID_2/exec', '\uD83D\uDD27', 'App for admins', 'admin', 'active']);
  appsSheet.appendRow(['app3', 'App Inactive', 'https://script.google.com/macros/s/FAKE_ID_3/exec', '\u274C', 'Disabled app', 'user', 'inactive']);
  appsSheet.appendRow(['app4', 'App No URL', '', '\uD83C\uDFE0', 'Hub itself', 'user', 'active']);
  
  var auditSheet = spreadsheet.insertSheet('audit_log');
  auditSheet.appendRow(['timestamp', 'event', 'email', 'phone', 'method', 'detail']);
  auditSheet.setFrozenRows(1);
}

/**
 * Teardown test environment: restore original Sheet ID.
 */
function teardownTestEnvironment() {
  restoreSheetId();
}
