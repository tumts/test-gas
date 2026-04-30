/**
 * @file Test_SessionIntegration.gs
 * @description Test integrasi sesi antara hub dan child app (simulasi).
 * Memastikan session flow bekerja end-to-end.
 */

function testSuite_SessionIntegration() {

  describe('SessionIntegration — Hub to Child App Flow', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should create session in hub and validate in child app context', function() {
      var token = createSession({
        email: 'admin@test.com',
        phone: '6281111111111',
        name: 'Admin',
        role: 'admin',
        kelas: '',
        loginMethod: 'google'
      });

      // Simulasi child app membaca session dari Sheet yang sama
      var session = validateSession(token);
      assert.isTrue(session.valid, 'Session should be valid');
      assert.equal(session.email, 'admin@test.com');
      assert.equal(session.role, 'admin');
    });

    it('should invalidate session after logout from hub', function() {
      var token = createSession({
        email: 'admin@test.com',
        phone: '6281111111111',
        name: 'Admin',
        role: 'admin',
        kelas: '',
        loginMethod: 'google'
      });

      deleteSession(token);
      var session = validateSession(token);
      assert.isFalse(session.valid, 'Session should be invalid after logout');
    });

    it('should pass kelas through session', function() {
      var token = createSession({
        email: 'siswa@test.com',
        phone: '6285555555555',
        name: 'Siswa',
        role: 'siswa',
        kelas: '7A',
        loginMethod: 'whatsapp_otp'
      });

      var session = validateSession(token);
      assert.equal(session.kelas, '7A', 'Kelas should be preserved in session');
    });

    it('should expire session after duration', function() {
      var token = createSession({
        email: 'admin@test.com',
        phone: '6281111111111',
        name: 'Admin',
        role: 'admin',
        kelas: '',
        loginMethod: 'google'
      });

      // Manually set expiresAt to past
      var sheet = getSessionsSheet();
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === token) {
          sheet.getRange(i + 1, 8).setValue(Date.now() - 1000); // expired
          break;
        }
      }

      var session = validateSession(token);
      assert.isFalse(session.valid, 'Expired session should be invalid');
    });

    it('should build correct app URL with auth_token', function() {
      var url = buildAppUrl('https://script.google.com/macros/s/FAKE/exec', 'mytoken123');
      assert.contains(url, 'auth_token=mytoken123');
    });

    it('should preserve loginMethod across session lifecycle', function() {
      var tokenGoogle = createSession({
        email: 'admin@test.com',
        phone: '6281111111111',
        name: 'Admin',
        role: 'admin',
        kelas: '',
        loginMethod: 'google'
      });
      var tokenWa = createSession({
        email: 'user@test.com',
        phone: '6282222222222',
        name: 'User',
        role: 'guru',
        kelas: '',
        loginMethod: 'whatsapp_otp'
      });

      var sessionGoogle = validateSession(tokenGoogle);
      var sessionWa = validateSession(tokenWa);
      assert.equal(sessionGoogle.loginMethod, 'google', 'Google login method should be preserved');
      assert.equal(sessionWa.loginMethod, 'whatsapp_otp', 'WA OTP login method should be preserved');
    });

    it('should allow admin API access with hub-created session', function() {
      var token = createSession({
        email: 'admin@test.com',
        phone: '6281111111111',
        name: 'Admin',
        role: 'admin',
        kelas: '',
        loginMethod: 'google'
      });

      // Admin API should work with the session created via hub login flow
      var result = adminGetUsers(token);
      assert.isTrue(result.success, 'Admin API should work with hub session');
      assert.isTrue(result.users.length >= 1, 'Should return users');
    });
  });
}
