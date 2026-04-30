/**
 * @file Test_AuthLib.gs
 * @description Test suite untuk lib/gas-auth-lib/ (AuthMiddleware.gs).
 * Karena library belum di-deploy sebagai GAS library terpisah,
 * fungsi-fungsi di-copy sebagai local references untuk testing.
 */

// ============ LOCAL COPIES UNTUK TESTING ============
// Fungsi-fungsi ini di-copy dari lib/gas-auth-lib/AuthMiddleware.gs
// agar bisa ditest langsung tanpa perlu deploy library.

function _authLib_escapeHtmlAttr(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _authLib_hasRole(authResult, requiredRole) {
  if (!authResult || !authResult.authenticated) return false;
  if (authResult.role && authResult.role.trim().toLowerCase() === 'admin') return true;
  if (!authResult.role) return false;
  var userRoles = authResult.role.split(',').map(function(r) { return r.trim().toLowerCase(); });
  var requiredRoles = requiredRole.split(',').map(function(r) { return r.trim().toLowerCase(); });
  for (var i = 0; i < requiredRoles.length; i++) {
    if (userRoles.indexOf(requiredRoles[i]) !== -1) return true;
  }
  return false;
}

function _authLib_buildSafeRedirectPage(url) {
  var safeUrl = _authLib_escapeHtmlAttr(url);
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

// ============ TEST SUITE ============

function testSuite_AuthLib() {

  // ──── escapeHtmlAttr ────
  describe('AuthLib — escapeHtmlAttr()', function() {

    it('should escape double quotes', function() {
      var result = _authLib_escapeHtmlAttr('test"value');
      assert.equal(result, 'test&quot;value', 'Double quotes should be escaped');
    });

    it('should escape angle brackets', function() {
      var result = _authLib_escapeHtmlAttr('<script>alert(1)</script>');
      assert.equal(result, '&lt;script&gt;alert(1)&lt;/script&gt;', 'Angle brackets should be escaped');
      assert.isFalse(result.indexOf('<') !== -1, 'Should not contain raw <');
      assert.isFalse(result.indexOf('>') !== -1, 'Should not contain raw >');
    });

    it('should escape ampersand', function() {
      var result = _authLib_escapeHtmlAttr('a&b');
      assert.equal(result, 'a&amp;b', 'Ampersand should be escaped');
    });

    it('should escape single quotes', function() {
      var result = _authLib_escapeHtmlAttr("test'value");
      assert.equal(result, 'test&#39;value', 'Single quotes should be escaped');
    });

    it('should handle empty string', function() {
      var result = _authLib_escapeHtmlAttr('');
      assert.equal(result, '', 'Empty string should return empty string');
    });

    it('should handle null/undefined', function() {
      var resultNull = _authLib_escapeHtmlAttr(null);
      assert.equal(resultNull, '', 'null should return empty string');
      var resultUndefined = _authLib_escapeHtmlAttr(undefined);
      assert.equal(resultUndefined, '', 'undefined should return empty string');
    });

    it('should escape all special chars in combination', function() {
      var malicious = '"><img src=x onerror=alert(1)>';
      var result = _authLib_escapeHtmlAttr(malicious);
      assert.isFalse(result.indexOf('"') !== -1, 'Should not contain raw double quote');
      assert.isFalse(result.indexOf('<') !== -1, 'Should not contain raw <');
      assert.isFalse(result.indexOf('>') !== -1, 'Should not contain raw >');
    });
  });

  // ──── hasRole (multi-role) ────
  describe('AuthLib — hasRole()', function() {

    it('should return true for admin regardless of required role', function() {
      var auth = { authenticated: true, role: 'admin' };
      assert.isTrue(_authLib_hasRole(auth, 'guru'), 'Admin should have guru access');
      assert.isTrue(_authLib_hasRole(auth, 'kepsek'), 'Admin should have kepsek access');
      assert.isTrue(_authLib_hasRole(auth, 'anything'), 'Admin should have any access');
    });

    it('should return true for admin case-insensitively', function() {
      var authUpper = { authenticated: true, role: 'ADMIN' };
      assert.isTrue(_authLib_hasRole(authUpper, 'guru'), 'ADMIN should have guru access');
      var authMixed = { authenticated: true, role: 'Admin' };
      assert.isTrue(_authLib_hasRole(authMixed, 'kepsek'), 'Admin should have kepsek access');
    });

    it('should return true for exact role match', function() {
      var auth = { authenticated: true, role: 'guru' };
      assert.isTrue(_authLib_hasRole(auth, 'guru'), 'Exact match should return true');
    });

    it('should return false for non-matching role', function() {
      var auth = { authenticated: true, role: 'guru' };
      assert.isFalse(_authLib_hasRole(auth, 'kepsek'), 'Non-matching role should return false');
    });

    it('should return false for null authResult', function() {
      assert.isFalse(_authLib_hasRole(null, 'guru'), 'null auth should return false');
      assert.isFalse(_authLib_hasRole(undefined, 'guru'), 'undefined auth should return false');
    });

    it('should return false when role is null or undefined', function() {
      var authNull = { authenticated: true, role: null };
      assert.isFalse(_authLib_hasRole(authNull, 'guru'), 'null role should return false');
      var authUndef = { authenticated: true, role: undefined };
      assert.isFalse(_authLib_hasRole(authUndef, 'guru'), 'undefined role should return false');
    });

    it('should return false for unauthenticated result', function() {
      var auth = { authenticated: false, role: 'guru' };
      assert.isFalse(_authLib_hasRole(auth, 'guru'), 'Unauthenticated should return false');
    });

    it('should support comma-separated user roles', function() {
      var auth = { authenticated: true, role: 'guru,bendahara' };
      assert.isTrue(_authLib_hasRole(auth, 'guru'), 'Should match first role');
      assert.isTrue(_authLib_hasRole(auth, 'bendahara'), 'Should match second role');
      assert.isFalse(_authLib_hasRole(auth, 'kepsek'), 'Should not match absent role');
    });

    it('should support comma-separated required roles', function() {
      var auth = { authenticated: true, role: 'guru' };
      assert.isTrue(_authLib_hasRole(auth, 'guru,kepsek'), 'Should match if user has one of required');
      assert.isFalse(_authLib_hasRole(auth, 'kepsek,bendahara'), 'Should not match if user has none');
    });

    it('should be case-insensitive', function() {
      var auth = { authenticated: true, role: 'Guru' };
      assert.isTrue(_authLib_hasRole(auth, 'guru'), 'Should match case-insensitively');
      assert.isTrue(_authLib_hasRole(auth, 'GURU'), 'Should match uppercase');
    });

    it('should handle whitespace in comma-separated roles', function() {
      var auth = { authenticated: true, role: ' guru , bendahara ' };
      assert.isTrue(_authLib_hasRole(auth, 'guru'), 'Should trim whitespace from user roles');
      assert.isTrue(_authLib_hasRole(auth, ' guru , kepsek '), 'Should trim whitespace from required roles');
    });
  });

  // ──── buildSafeRedirectPage ────
  describe('AuthLib — buildSafeRedirectPage()', function() {

    it('should return HtmlOutput object', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com');
      assert.isTruthy(output, 'Should return a value');
      assert.isTrue(typeof output.getContent === 'function', 'Should have getContent method (HtmlOutput)');
    });

    it('should contain target="_top" attribute', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com');
      var html = output.getContent();
      assert.contains(html, 'target="_top"', 'Should contain target="_top"');
    });

    it('should contain base target="_top" tag', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com');
      var html = output.getContent();
      assert.contains(html, '<base target="_top">', 'Should contain <base target="_top">');
    });

    it('should NOT contain window.top.location.href', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com');
      var html = output.getContent();
      assert.isFalse(html.indexOf('window.top.location.href') !== -1, 'Should NOT use window.top.location.href');
    });

    it('should escape URL in href attribute', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com/test?a=1&b=2"<>');
      var html = output.getContent();
      assert.isFalse(html.indexOf('href="https://example.com/test?a=1&b=2"<>"') !== -1, 'URL should be escaped in href');
      assert.contains(html, '&amp;', 'Ampersand in URL should be escaped');
    });

    it('should contain clickable button', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com');
      var html = output.getContent();
      assert.contains(html, 'class="btn"', 'Should contain button with btn class');
      assert.contains(html, 'href="https://example.com"', 'Button href should contain URL');
    });

    it('should have title "Login Required"', function() {
      var output = _authLib_buildSafeRedirectPage('https://example.com');
      var title = output.getTitle();
      assert.equal(title, 'Login Required', 'Title should be "Login Required"');
    });
  });
}
