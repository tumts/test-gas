/**
 * @file Session.gs
 * @description Manajemen session terpusat menggunakan Google Sheet.
 * Menggunakan Sheet yang sama dengan whitelist user (USERS_SHEET_ID), tab 'sessions'.
 * 
 * Kolom Sheet 'sessions':
 * A: token | B: email | C: phone | D: name | E: role | F: loginMethod | G: createdAt | H: expiresAt | I: status
 */

const SESSION_DURATION_MS = 3600000; // 1 jam

/**
 * Mendapatkan sheet 'sessions'. Buat otomatis jika belum ada.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSessionsSheet() {
  const sheetId = getUsersSheetId(); // Reuse dari UserWhitelist.gs
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  let sheet = spreadsheet.getSheetByName('sessions');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('sessions');
    sheet.appendRow(['token', 'email', 'phone', 'name', 'role', 'loginMethod', 'createdAt', 'expiresAt', 'status']);
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Membuat session baru dan menyimpannya di Sheet.
 * @param {Object} userData - Data user dari login (email, phone, name, role, loginMethod)
 * @returns {string} Session token
 */
function createSession(userData) {
  const sheet = getSessionsSheet();
  const token = generateSessionToken();
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;
  
  sheet.appendRow([
    token,
    userData.email || '',
    userData.phone || '',
    userData.name || '',
    userData.role || 'user',
    userData.loginMethod || 'unknown',
    now,
    expiresAt,
    'active'
  ]);
  
  return token;
}

/**
 * Validasi session token dari Sheet.
 * @param {string} token - Session token dari URL parameter.
 * @returns {Object} { valid, email, phone, name, role, loginMethod } atau { valid: false }
 */
function validateSession(token) {
  if (!token) return { valid: false };
  
  try {
    const sheet = getSessionsSheet();
    const data = sheet.getDataRange().getValues();
    const now = Date.now();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === token && data[i][8] === 'active') {
        const expiresAt = Number(data[i][7]);
        
        if (now > expiresAt) {
          // Session expired — mark as expired
          sheet.getRange(i + 1, 9).setValue('expired');
          return { valid: false, reason: 'expired' };
        }
        
        return {
          valid: true,
          token: token,
          email: data[i][1],
          phone: data[i][2],
          name: data[i][3],
          role: data[i][4],
          loginMethod: data[i][5],
          createdAt: data[i][6],
          expiresAt: expiresAt
        };
      }
    }
    
    return { valid: false, reason: 'not_found' };
  } catch (e) {
    console.error('validateSession error: ' + e.message);
    return { valid: false, reason: 'error' };
  }
}

/**
 * Hapus (invalidasi) session — untuk logout.
 * @param {string} token - Session token.
 * @returns {boolean} true jika berhasil
 */
function deleteSession(token) {
  if (!token) return false;
  
  try {
    const sheet = getSessionsSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === token) {
        sheet.getRange(i + 1, 9).setValue('logged_out');
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('deleteSession error: ' + e.message);
    return false;
  }
}

/**
 * Bersihkan session yang sudah expired dari Sheet.
 * Dipanggil via time-driven trigger (opsional).
 * @returns {number} Jumlah session yang dihapus
 */
function cleanExpiredSessions() {
  try {
    const sheet = getSessionsSheet();
    const data = sheet.getDataRange().getValues();
    const now = Date.now();
    let deletedCount = 0;
    
    // Iterasi dari bawah ke atas agar index tidak bergeser saat delete
    for (let i = data.length - 1; i >= 1; i--) {
      const expiresAt = Number(data[i][7]);
      const status = data[i][8];
      
      // Hapus session yang expired lebih dari 24 jam atau sudah logged_out
      if ((now > expiresAt + 86400000) || status === 'logged_out' || status === 'expired') {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    console.log('cleanExpiredSessions: ' + deletedCount + ' sessions cleaned');
    return deletedCount;
  } catch (e) {
    console.error('cleanExpiredSessions error: ' + e.message);
    return 0;
  }
}

/**
 * Generate session token yang unik dan aman.
 * @returns {string} Token hash
 */
function generateSessionToken() {
  const raw = Utilities.getUuid() + '-' + Date.now() + '-' + Math.random();
  return generateHash(raw); // Reuse generateHash() dari Auth.gs
}
