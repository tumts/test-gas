/**
 * @file AppRegistry.gs
 * @description Registry aplikasi yang terdaftar di hub.
 * Membaca dari Google Sheet tab 'apps'.
 * 
 * Kolom Sheet 'apps':
 * A: id | B: name | C: url | D: icon | E: description | F: allowedRoles | G: status | H: category
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
    sheet.appendRow(['id', 'name', 'url', 'icon', 'description', 'allowedRoles', 'status', 'category']);
    sheet.setFrozenRows(1);
    // Tambah contoh data
    sheet.appendRow(['hub', 'Auth Hub', '', '🏠', 'Pusat autentikasi dan manajemen akses', 'admin,guru,siswa,orangtua,kepsek', 'active', 'umum']);
  }
  
  return sheet;
}

/**
 * Mendapatkan daftar aplikasi yang bisa diakses oleh user berdasarkan role dan override.
 * @param {string} userRole - Role user (comma-separated, misal: 'guru', 'admin')
 * @param {string} userAppsOverride - Comma-separated app IDs untuk override akses (opsional)
 * @returns {Array<Object>} Daftar aplikasi
 */
function getRegisteredApps(userRole, userAppsOverride) {
  try {
    var sheet = getAppsSheet();
    var data = sheet.getDataRange().getValues();
    var apps = [];
    
    // Parse user's app override list
    var overrideList = [];
    if (userAppsOverride && userAppsOverride.trim() !== '') {
      overrideList = userAppsOverride.split(',').map(function(id) { return id.trim().toLowerCase(); });
    }
    
    // Parse user roles (comma-separated)
    var userRoles = userRole.split(',').map(function(r) { return r.trim().toLowerCase(); });
    var isAdmin = userRoles.indexOf('admin') !== -1;
    
    for (var i = 1; i < data.length; i++) {
      var app = {
        id: data[i][0].toString().trim(),
        name: data[i][1].toString().trim(),
        url: data[i][2].toString().trim(),
        icon: data[i][3].toString().trim(),
        description: data[i][4].toString().trim(),
        allowedRoles: data[i][5].toString().trim().toLowerCase(),
        status: data[i][6].toString().trim().toLowerCase(),
        category: (data[i][7] || '').toString().trim() || 'umum'
      };
      
      if (app.status !== 'active') continue;
      if (app.url === '') continue;
      
      // Admin bisa akses semua
      if (isAdmin) { apps.push(app); continue; }
      
      // Cek user-specific override
      if (overrideList.length > 0 && overrideList.indexOf(app.id.toLowerCase()) !== -1) {
        apps.push(app); continue;
      }
      
      // Cek role-based access (comma-separated allowedRoles)
      if (overrideList.length === 0) {
        var appRoles = app.allowedRoles.split(',').map(function(r) { return r.trim(); });
        for (var j = 0; j < userRoles.length; j++) {
          if (appRoles.indexOf(userRoles[j]) !== -1) {
            apps.push(app); break;
          }
        }
      }
    }
    
    return apps;
  } catch (e) {
    console.error('getRegisteredApps error: ' + e.message);
    return [];
  }
}

/**
 * Mendapatkan daftar kategori unik dari list apps.
 * @param {Array<Object>} apps - Daftar aplikasi
 * @returns {Array<string>} Kategori unik, sorted
 */
function getUniqueCategories(apps) {
  var cats = {};
  for (var i = 0; i < apps.length; i++) {
    var cat = apps[i].category || 'umum';
    cats[cat] = true;
  }
  return Object.keys(cats).sort();
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
