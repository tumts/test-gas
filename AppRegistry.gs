/**
 * @file AppRegistry.gs
 * @description Registry aplikasi yang terdaftar di hub.
 * Membaca dari Google Sheet tab 'apps'.
 * 
 * Kolom Sheet 'apps':
 * A: id | B: name | C: url | D: icon | E: description | F: requiredRole | G: status
 */

/**
 * Mendapatkan sheet 'apps'. Buat otomatis jika belum ada.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getAppsSheet() {
  const sheetId = getUsersSheetId(); // Reuse dari UserWhitelist.gs
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  let sheet = spreadsheet.getSheetByName('apps');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('apps');
    sheet.appendRow(['id', 'name', 'url', 'icon', 'description', 'requiredRole', 'status']);
    sheet.setFrozenRows(1);
    // Tambah contoh data
    sheet.appendRow(['hub', 'Auth Hub', '', '🏠', 'Pusat autentikasi dan manajemen akses', 'user', 'active']);
  }
  
  return sheet;
}

/**
 * Mendapatkan daftar aplikasi yang bisa diakses oleh user berdasarkan role.
 * @param {string} userRole - Role user (misal: 'admin', 'user')
 * @returns {Array<Object>} Daftar aplikasi
 */
function getRegisteredApps(userRole) {
  try {
    const sheet = getAppsSheet();
    const data = sheet.getDataRange().getValues();
    const apps = [];
    
    for (let i = 1; i < data.length; i++) {
      const app = {
        id: data[i][0].toString().trim(),
        name: data[i][1].toString().trim(),
        url: data[i][2].toString().trim(),
        icon: data[i][3].toString().trim(),
        description: data[i][4].toString().trim(),
        requiredRole: data[i][5].toString().trim().toLowerCase(),
        status: data[i][6].toString().trim().toLowerCase()
      };
      
      // Filter: hanya tampilkan app yang active dan sesuai role
      if (app.status !== 'active') continue;
      if (app.url === '') continue; // Skip app tanpa URL (seperti hub sendiri)
      
      // Admin bisa akses semua, user hanya yang requiredRole = 'user'
      if (userRole === 'admin' || app.requiredRole === 'user' || app.requiredRole === userRole) {
        apps.push(app);
      }
    }
    
    return apps;
  } catch (e) {
    console.error('getRegisteredApps error: ' + e.message);
    return [];
  }
}

/**
 * Buat URL child app dengan session token.
 * @param {string} appUrl - Base URL child app
 * @param {string} token - Session token
 * @returns {string} URL lengkap dengan token
 */
function buildAppUrl(appUrl, token) {
  const separator = appUrl.includes('?') ? '&' : '?';
  return appUrl + separator + 'auth_token=' + encodeURIComponent(token);
}
