/**
 * @file Code.gs
 * @description Entry point utama Auth Hub. Menangani routing (doGet), 
 * pemrosesan login (doPost), dan rendering halaman.
 */

/**
 * Handler GET — cek session token, render dashboard atau login.
 * @param {Object} e - Event object dari Google Apps Script.
 * @returns {HtmlService.HtmlOutput}
 */
function doGet(e) {
  const token = e.parameter.token || '';
  const redirectUrl = e.parameter.redirect || '';
  
  // Jika ada token, validasi session dari Sheet
  if (token) {
    const session = validateSession(token);
    
    if (session.valid) {
      // Jika ada redirect URL (dari child app), validasi dan redirect ke sana dengan token
      if (redirectUrl && isAllowedRedirect(redirectUrl)) {
        const targetUrl = buildAppUrl(redirectUrl, token);
        return buildRedirectPage(targetUrl);
      }
      
      // Render dashboard
      const apps = getRegisteredApps(session.role);
      // Build app URLs dengan token
      const appsWithToken = apps.map(function(app) {
        return {
          id: app.id,
          name: app.name,
          url: buildAppUrl(app.url, token),
          icon: app.icon,
          description: app.description
        };
      });
      
      return render('dashboard', {
        sessionData: {
          token: token,
          email: session.email,
          phone: session.phone,
          name: session.name,
          role: session.role,
          loginMethod: session.loginMethod
        },
        apps: appsWithToken
      });
    }
    // Token invalid — jatuh ke login page
  }

  // Handle Google OAuth callback
  if (e.parameter.code) {
    var redirectUri = ScriptApp.getService().getUrl();
    var googleResult = exchangeCodeForToken(e.parameter.code, redirectUri);
    var stateRedirect = e.parameter.state || '';

    if (!googleResult.success) {
      return render('login', { phone: '', error: googleResult.message, redirect: stateRedirect });
    }

    var access = checkUserByEmail(googleResult.email);
    if (!access.found) {
      logAuditEvent('LOGIN_FAILED', { email: googleResult.email, method: 'google', detail: 'Email tidak terdaftar' });
      return render('login', { phone: '', error: 'Email ' + googleResult.email + ' belum terdaftar. Hubungi admin.', redirect: stateRedirect });
    }
    if (!access.allowed) {
      logAuditEvent('LOGIN_FAILED', { email: googleResult.email, method: 'google', detail: 'Akun dinonaktifkan' });
      return render('login', { phone: '', error: 'Akun Anda dinonaktifkan. Hubungi admin.', redirect: stateRedirect });
    }

    var sessionToken = createSession({
      email: googleResult.email,
      phone: access.phone || '',
      name: access.name || googleResult.name,
      role: access.role,
      loginMethod: 'google'
    });
    logAuditEvent('LOGIN_SUCCESS', { email: googleResult.email, method: 'google' });
    return redirectAfterLogin(sessionToken, stateRedirect);
  }
  
  // Render login page
  const page = e.parameter.page || 'login';
  const phone = e.parameter.phone || '';
  const error = e.parameter.error || '';

  var googleAuthUrl = '';
  try { googleAuthUrl = getGoogleAuthUrl(ScriptApp.getService().getUrl(), redirectUrl); } catch(err) {}
  return render(page, { phone: phone, error: error, redirect: redirectUrl, googleAuthUrl: googleAuthUrl });
}

/**
 * Handler POST — proses login (Google/OTP) dan logout.
 * @param {Object} e - Event object yang berisi parameter form.
 * @returns {HtmlService.HtmlOutput}
 */
function doPost(e) {
  const action = e.parameter.action;
  const phone = e.parameter.phone || '';
  const redirectParam = e.parameter.redirect || '';

  try {
    // === LOGOUT ===
    if (action === 'logout') {
      const token = e.parameter.token || '';
      if (token) {
        const session = validateSession(token);
        deleteSession(token);
        logAuditEvent('LOGOUT', {
          email: session.email || '',
          phone: session.phone || '',
          method: session.loginMethod || '',
          detail: 'User logout via dashboard'
        });
      }
      return render('login', { phone: '', error: '', redirect: '' });
    }

    // === GOOGLE LOGIN (deprecated — kept for backward compatibility) ===
    // New OAuth 2.0 flow handles Google login via doGet() callback.
    if (action === 'google_login') {
      const idToken = e.parameter.id_token;
      const googleResult = verifyGoogleToken(idToken);

      if (!googleResult.success) {
        return render('login', { phone: '', error: googleResult.message, redirect: redirectParam });
      }

      // Cek whitelist
      const access = checkUserByEmail(googleResult.email);

      if (!access.found) {
        logAuditEvent('LOGIN_FAILED', { email: googleResult.email, method: 'google', detail: 'Email tidak terdaftar' });
        return render('login', { phone: '', error: 'Email ' + googleResult.email + ' belum terdaftar. Hubungi admin untuk mendapatkan akses.', redirect: redirectParam });
      }
      if (!access.allowed) {
        logAuditEvent('LOGIN_FAILED', { email: googleResult.email, method: 'google', detail: 'Akun dinonaktifkan' });
        return render('login', { phone: '', error: 'Akun Anda dinonaktifkan. Hubungi admin.', redirect: redirectParam });
      }

      // Buat session di Sheet
      const token = createSession({
        email: googleResult.email,
        phone: access.phone || '',
        name: access.name || googleResult.name,
        role: access.role,
        loginMethod: 'google'
      });

      logAuditEvent('LOGIN_SUCCESS', { email: googleResult.email, method: 'google' });

      // Redirect ke dashboard (atau child app) dengan token
      return redirectAfterLogin(token, redirectParam);
    }

    // === WHATSAPP OTP: SEND ===
    if (action === 'send_otp') {
      if (!phone || phone.trim() === '') {
        return render('login', { phone: '', error: 'Nomor telepon harus diisi.', redirect: redirectParam });
      }

      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }

      // Cek whitelist nomor telepon
      const access = checkUserByPhone(cleanPhone);

      if (!access.found) {
        logAuditEvent('LOGIN_FAILED', { phone: cleanPhone, method: 'whatsapp_otp', detail: 'Nomor tidak terdaftar' });
        return render('login', { phone: cleanPhone, error: 'Nomor ' + cleanPhone + ' belum terdaftar. Hubungi admin untuk mendapatkan akses.', redirect: redirectParam });
      }
      if (!access.allowed) {
        logAuditEvent('LOGIN_FAILED', { phone: cleanPhone, method: 'whatsapp_otp', detail: 'Akun dinonaktifkan' });
        return render('login', { phone: cleanPhone, error: 'Akun Anda dinonaktifkan. Hubungi admin.', redirect: redirectParam });
      }

      const result = sendOtp(cleanPhone);

      if (result.success) {
        return render('verify', { phone: cleanPhone, error: '', redirect: redirectParam });
      } else {
        return render('login', { phone: cleanPhone, error: 'Gagal mengirim OTP: ' + result.message, redirect: redirectParam });
      }
    }

    // === WHATSAPP OTP: VERIFY ===
    if (action === 'verify_otp') {
      if (!phone || phone.trim() === '') {
        return render('login', { phone: '', error: 'Sesi tidak valid. Silakan login ulang.', redirect: redirectParam });
      }

      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }

      const otp = e.parameter.otp;
      const result = verifyOtp(cleanPhone, otp);

      if (result.success) {
        const userData = checkUserByPhone(cleanPhone);

        // Buat session di Sheet
        const token = createSession({
          email: userData.found ? userData.email : '',
          phone: cleanPhone,
          name: userData.found ? userData.name : cleanPhone,
          role: userData.found ? userData.role : 'user',
          loginMethod: 'whatsapp_otp'
        });

        logAuditEvent('LOGIN_SUCCESS', { phone: cleanPhone, email: userData.found ? userData.email : '', method: 'whatsapp_otp' });

        // Redirect ke dashboard (atau child app) dengan token
        return redirectAfterLogin(token, redirectParam);
      } else {
        logAuditEvent('LOGIN_FAILED', { phone: cleanPhone, method: 'whatsapp_otp', detail: 'OTP salah/kadaluwarsa' });
        return render('verify', { phone: cleanPhone, error: 'OTP Salah atau Kadaluwarsa.', redirect: redirectParam });
      }
    }

    // Action tidak dikenali
    return render('login', { phone: '', error: 'Aksi tidak valid.', redirect: '' });

  } catch (err) {
    console.error('Error in doPost: ' + err.toString());
    return render('login', { phone: phone, error: 'Terjadi kesalahan sistem internal.', redirect: redirectParam });
  }
}

/**
 * Helper: Redirect ke dashboard atau child app setelah login berhasil.
 * GAS webapp tidak bisa HTTP redirect, jadi gunakan JavaScript redirect.
 * @param {string} token - Session token
 * @param {string} redirectUrl - URL child app (opsional)
 * @returns {HtmlService.HtmlOutput}
 */
function redirectAfterLogin(token, redirectUrl) {
  const hubUrl = ScriptApp.getService().getUrl();
  let targetUrl;
  
  if (redirectUrl && isAllowedRedirect(redirectUrl)) {
    // Redirect ke child app dengan auth_token
    targetUrl = buildAppUrl(redirectUrl, token);
  } else {
    // Redirect ke dashboard hub
    targetUrl = hubUrl + '?token=' + encodeURIComponent(token);
  }
  
  return buildRedirectPage(targetUrl);
}

/**
 * Helper: Bangun halaman redirect dengan URL yang di-escape untuk mencegah XSS.
 * @param {string} url - Target URL (sudah divalidasi)
 * @returns {HtmlService.HtmlOutput}
 */
function buildRedirectPage(url) {
  const safeUrl = escapeJsString(url);
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb;}</style>' +
    '</head><body><div style="text-align:center;">' +
    '<p style="color:#666;">Mengalihkan...</p>' +
    '<script>window.top.location.href="' + safeUrl + '";</script>' +
    '</div></body></html>'
  ).setTitle('Redirecting...');
}

/**
 * Escape string untuk embedding aman di JavaScript string literal.
 * Mencegah XSS via injection di tag <script>.
 * @param {string} str - String yang akan di-escape
 * @returns {string} Escaped string
 */
function escapeJsString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'") 
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Validasi redirect URL terhadap daftar app yang terdaftar di registry.
 * Mencegah open redirect ke domain arbitrary.
 * @param {string} url - URL redirect yang akan divalidasi
 * @returns {boolean} true jika URL diizinkan
 */
function isAllowedRedirect(url) {
  if (!url) return false;
  
  try {
    // Hanya izinkan https:// URLs
    if (!url.startsWith('https://')) return false;
    
    // Cek apakah URL cocok dengan salah satu registered app URL
    const sheet = getAppsSheet();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const appUrl = data[i][2].toString().trim();
      const normalizedAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
      if (appUrl && (url === appUrl || url === normalizedAppUrl || url.startsWith(normalizedAppUrl + '/') || url.startsWith(normalizedAppUrl + '?') || url.startsWith(normalizedAppUrl + '#'))) {
        return true;
      }
    }
    
    // Izinkan redirect ke script.google.com (GAS webapp)
    if (url.startsWith('https://script.google.com/')) return true;
    
    return false;
  } catch (e) {
    console.error('isAllowedRedirect error: ' + e.message);
    return false;
  }
}

/**
 * Helper untuk merender file HTML dengan evaluasi scriptlet.
 * @param {string} filename - Nama file HTML (tanpa ekstensi).
 * @param {Object} args - Objek data untuk dipassing ke template HTML.
 * @returns {HtmlService.HtmlOutput}
 */
function render(filename, args = {}) {
  try {
    const template = HtmlService.createTemplateFromFile(filename);

    // Default values pencegah crash
    template.error = '';
    template.phone = '';
    template.redirect = '';
    template.googleAuthUrl = '';
    template.sessionData = {};
    template.apps = [];

    // Assign properti dari args ke template
    Object.keys(args).forEach(key => {
      template[key] = args[key];
    });

    return template.evaluate()
      .setTitle('Auth Hub')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    console.error('Render Error: ' + e.toString());
    return HtmlService.createHtmlOutput('Error loading page "' + filename + '": ' + e.toString());
  }
}

/**
 * Helper untuk menyisipkan konten file lain ke dalam HTML.
 * @param {string} filename - Nama file.
 * @returns {string} Konten file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
