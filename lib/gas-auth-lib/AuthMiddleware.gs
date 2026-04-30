/**
 * @file AuthMiddleware.gs
 * @description Auth Library untuk child apps.
 * Import library ini di child app GAS project, lalu panggil authenticate(e) di doGet().
 * 
 * Setup di child app:
 * 1. Di GAS editor, buka Project Settings > Script Properties
 * 2. Tambahkan: AUTH_SESSION_SHEET_ID = (Sheet ID yang sama dengan hub)
 * 3. Tambahkan: AUTH_HUB_URL = (URL deployment hub webapp)
 * 4. Di Libraries, tambahkan script ID library ini
 */

/**
 * Autentikasi request dari child app.
 * Cek auth_token di URL parameter, validasi terhadap session Sheet.
 * 
 * @param {Object} e - Event object dari doGet(e) child app
 * @returns {Object} { authenticated, email, phone, name, role, token, redirectUrl }
 * 
 * Contoh penggunaan di child app:
 * function doGet(e) {
 *   var auth = GasAuthLib.authenticate(e);
 *   if (!auth.authenticated) {
 *     return GasAuthLib.buildSafeRedirectPage(auth.redirectUrl);
 *   }
 *   return renderApp(auth);
 * }
 */
function authenticate(e) {
  var token = '';
  if (e && e.parameter && e.parameter.auth_token) {
    token = e.parameter.auth_token;
  }
  
  if (!token) {
    return {
      authenticated: false,
      redirectUrl: _buildHubLoginUrl(e)
    };
  }
  
  var session = _validateTokenFromSheet(token);
  
  if (!session.valid) {
    return {
      authenticated: false,
      redirectUrl: _buildHubLoginUrl(e)
    };
  }
  
  return {
    authenticated: true,
    email: session.email,
    phone: session.phone,
    name: session.name,
    role: session.role,
    loginMethod: session.loginMethod,
    token: token
  };
}

/**
 * Validasi token terhadap session Sheet.
 * @param {string} token
 * @returns {Object}
 * @private
 */
function _validateTokenFromSheet(token) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('AUTH_SESSION_SHEET_ID');
    if (!sheetId) {
      console.error('AUTH_SESSION_SHEET_ID belum dikonfigurasi.');
      return { valid: false };
    }
    
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName('sessions');
    if (!sheet) return { valid: false };
    
    var data = sheet.getDataRange().getValues();
    var now = Date.now();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === token && data[i][8] === 'active') {
        var expiresAt = Number(data[i][7]);
        
        if (now > expiresAt) {
          return { valid: false, reason: 'expired' };
        }
        
        return {
          valid: true,
          email: data[i][1],
          phone: data[i][2],
          name: data[i][3],
          role: data[i][4],
          loginMethod: data[i][5]
        };
      }
    }
    
    return { valid: false, reason: 'not_found' };
  } catch (e) {
    console.error('_validateTokenFromSheet error: ' + e.message);
    return { valid: false, reason: 'error' };
  }
}

/**
 * Bangun URL login hub dengan redirect kembali ke child app.
 * @param {Object} e - Event object dari child app
 * @returns {string} URL hub login
 * @private
 */
function _buildHubLoginUrl(e) {
  var hubUrl = PropertiesService.getScriptProperties().getProperty('AUTH_HUB_URL');
  if (!hubUrl) {
    console.error('AUTH_HUB_URL belum dikonfigurasi.');
    return '';
  }
  
  // Dapatkan URL child app saat ini untuk redirect balik
  var childAppUrl = ScriptApp.getService().getUrl();
  
  return hubUrl + '?redirect=' + encodeURIComponent(childAppUrl);
}

/**
 * Cek apakah user memiliki role tertentu.
 * @param {Object} authResult - Hasil dari authenticate()
 * @param {string} requiredRole - Role yang dibutuhkan ('admin', 'user', dll)
 * @returns {boolean}
 */
function hasRole(authResult, requiredRole) {
  if (!authResult || !authResult.authenticated) return false;
  if (authResult.role && authResult.role.trim().toLowerCase() === 'admin') return true; // Admin bisa semua
  if (!authResult.role) return false;
  // Support comma-separated roles (e.g., "guru,kepsek")
  var userRoles = authResult.role.split(',').map(function(r) { return r.trim().toLowerCase(); });
  var requiredRoles = requiredRole.split(',').map(function(r) { return r.trim().toLowerCase(); });
  for (var i = 0; i < requiredRoles.length; i++) {
    if (userRoles.indexOf(requiredRoles[i]) !== -1) return true;
  }
  return false;
}

/**
 * Bangun URL logout ke hub.
 * @param {string} token - Session token
 * @returns {string} URL logout
 */
function getLogoutUrl(token) {
  var hubUrl = PropertiesService.getScriptProperties().getProperty('AUTH_HUB_URL');
  if (!hubUrl) return '';
  // Logout dilakukan via POST di hub, tapi kita bisa redirect ke hub tanpa token
  return hubUrl;
}

/**
 * Escape string untuk digunakan di HTML attribute (pencegahan XSS).
 * @param {string} str - String yang akan di-escape
 * @returns {string} String yang sudah di-escape
 */
function escapeHtmlAttr(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Bangun halaman redirect yang aman menggunakan <a target="_top">.
 * Menghindari window.top.location.href yang diblokir oleh iframe sandbox GAS.
 * @param {string} url - URL tujuan redirect
 * @returns {HtmlService.HtmlOutput}
 */
function buildSafeRedirectPage(url) {
  var safeUrl = escapeHtmlAttr(url);
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<base target="_top">' +
    '<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;' +
    'min-height:100vh;background:#f9fafb;margin:0;}' +
    '.card{text-align:center;background:#fff;padding:2rem;border-radius:1rem;' +
    'box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:360px;width:100%;}' +
    '.btn{display:inline-block;background:#2563eb;color:#fff;font-weight:700;' +
    'padding:0.875rem 2rem;border-radius:0.75rem;text-decoration:none;' +
    'transition:background 0.2s;}' +
    '.btn:hover{background:#1d4ed8;}</style>' +
    '</head><body><div class="card">' +
    '<p style="color:#666;font-size:0.875rem;margin:0 0 1.5rem;">Klik tombol di bawah untuk melanjutkan</p>' +
    '<a href="' + safeUrl + '" class="btn" target="_top">Masuk ke Aplikasi &rarr;</a>' +
    '</div></body></html>'
  ).setTitle('Login Required');
}
