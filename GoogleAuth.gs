/**
 * @file GoogleAuth.gs
 * @description Google OAuth 2.0 Authorization Code flow + ID Token verification.
 * Memerlukan Script Properties: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 */

/**
 * Mendapatkan Google Client ID dari Script Properties.
 * @returns {string} Google OAuth Client ID
 */
function getGoogleClientId() {
  const clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID belum dikonfigurasi di Script Properties.');
  }
  return clientId;
}

/**
 * Mendapatkan Google Client ID tanpa throw error.
 * Digunakan di template HTML agar halaman tetap render meski belum dikonfigurasi.
 * @returns {string} Google OAuth Client ID atau string kosong
 */
function getGoogleClientIdSafe() {
  return PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '';
}

/**
 * Membangun Google OAuth 2.0 authorization URL untuk redirect-based login.
 * @param {string} redirectUri - URI redirect (URL web app GAS).
 * @param {string} state - State parameter untuk menyimpan redirect URL child app.
 * @returns {string} Google OAuth authorization URL
 */
function getGoogleAuthUrl(redirectUri, state) {
  var clientId = getGoogleClientId();
  var params = [
    'client_id=' + encodeURIComponent(clientId),
    'redirect_uri=' + encodeURIComponent(redirectUri),
    'response_type=code',
    'scope=' + encodeURIComponent('openid email profile'),
    'state=' + encodeURIComponent(state || ''),
    'prompt=select_account'
  ];
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.join('&');
}

/**
 * Menukar authorization code dengan token, lalu verifikasi id_token.
 * @param {string} code - Authorization code dari Google OAuth callback.
 * @param {string} redirectUri - URI redirect yang sama dengan saat authorization request.
 * @returns {Object} { success, email, name, picture, message }
 */
function exchangeCodeForToken(code, redirectUri) {
  try {
    if (!code) {
      return { success: false, message: 'Authorization code tidak ditemukan.' };
    }

    var clientId = getGoogleClientId();
    var clientSecret = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_SECRET');
    if (!clientSecret) {
      return { success: false, message: 'GOOGLE_CLIENT_SECRET belum dikonfigurasi di Script Properties.' };
    }

    var tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
      method: 'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: {
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      muteHttpExceptions: true
    });

    var tokenCode = tokenResponse.getResponseCode();
    if (tokenCode !== 200) {
      console.error('Token exchange error: HTTP ' + tokenCode + ' - ' + tokenResponse.getContentText());
      return { success: false, message: 'Gagal menukar authorization code. Silakan coba lagi.' };
    }

    var tokenData = JSON.parse(tokenResponse.getContentText());
    if (!tokenData.id_token) {
      return { success: false, message: 'Response token tidak mengandung id_token.' };
    }

    return verifyGoogleToken(tokenData.id_token);
  } catch (e) {
    console.error('exchangeCodeForToken error: ' + e.message);
    return { success: false, message: 'Gagal memproses login Google: ' + e.message };
  }
}

/**
 * Verifikasi Google ID Token menggunakan Google tokeninfo endpoint.
 * @param {string} idToken - JWT token dari Google Sign-In client-side.
 * @returns {Object} { success, email, name, picture, message }
 */
function verifyGoogleToken(idToken) {
  try {
    if (!idToken) {
      return { success: false, message: 'Token Google tidak ditemukan.' };
    }

    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const code = response.getResponseCode();

    if (code !== 200) {
      console.error('Google tokeninfo error: HTTP ' + code + ' - ' + response.getContentText());
      return { success: false, message: 'Token Google tidak valid atau sudah kadaluwarsa.' };
    }

    const payload = JSON.parse(response.getContentText());
    const clientId = getGoogleClientId();

    // Verifikasi audience (client ID) cocok
    if (payload.aud !== clientId) {
      console.error('Token audience mismatch. Expected: ' + clientId + ', Got: ' + payload.aud);
      return { success: false, message: 'Token tidak ditujukan untuk aplikasi ini.' };
    }

    // Verifikasi token belum expired
    if (parseInt(payload.exp) < Math.floor(Date.now() / 1000)) {
      return { success: false, message: 'Token Google sudah kadaluwarsa.' };
    }

    // Verifikasi email terverifikasi
    if (payload.email_verified !== 'true') {
      return { success: false, message: 'Email Google belum terverifikasi.' };
    }

    return {
      success: true,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
      message: 'Verifikasi berhasil'
    };
  } catch (e) {
    console.error('verifyGoogleToken error: ' + e.message);
    return { success: false, message: 'Gagal memverifikasi token Google: ' + e.message };
  }
}
