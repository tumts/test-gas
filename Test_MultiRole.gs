/**
 * @file Test_MultiRole.gs
 * @description Test suite khusus untuk skenario multi-role sekolah.
 * Menguji akses berbasis role (guru, siswa, orangtua, kepsek, admin),
 * kelas field, dan hybrid access (role-based + user override).
 */

function testSuite_MultiRole() {
  
  describe('MultiRole — Role-based App Access', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('admin should access all apps', function() {
      var apps = getRegisteredApps('admin');
      // Admin sees all active apps with URLs (app1, app2, app5)
      assert.isTrue(apps.length >= 3, 'Admin should see all active apps with URLs');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Admin should see app1');
      assert.isTrue(ids.indexOf('app2') !== -1, 'Admin should see app2');
      assert.isTrue(ids.indexOf('app5') !== -1, 'Admin should see app5');
    });
    
    it('guru should access guru+siswa apps but not admin apps', function() {
      var apps = getRegisteredApps('guru');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Guru should see app1 (guru,kepsek,admin)');
      assert.isTrue(ids.indexOf('app5') !== -1, 'Guru should see app5 (siswa,guru,admin)');
      assert.isTrue(ids.indexOf('app2') === -1, 'Guru should NOT see app2 (admin only)');
    });
    
    it('siswa should only access siswa apps', function() {
      var apps = getRegisteredApps('siswa');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app5') !== -1, 'Siswa should see app5 (siswa,guru,admin)');
      assert.isTrue(ids.indexOf('app1') === -1, 'Siswa should NOT see app1 (guru,kepsek,admin)');
      assert.isTrue(ids.indexOf('app2') === -1, 'Siswa should NOT see app2 (admin only)');
    });
    
    it('orangtua should only access orangtua apps', function() {
      var apps = getRegisteredApps('orangtua');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') === -1, 'Orangtua should NOT see app1');
      assert.isTrue(ids.indexOf('app2') === -1, 'Orangtua should NOT see app2');
      assert.isTrue(ids.indexOf('app5') === -1, 'Orangtua should NOT see app5');
    });
    
    it('orangtua with apps override should access overridden apps', function() {
      var apps = getRegisteredApps('orangtua', 'app1,app5');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Override should grant access to app1');
      assert.isTrue(ids.indexOf('app5') !== -1, 'Override should grant access to app5');
    });
    
    it('should handle unknown role gracefully', function() {
      var apps = getRegisteredApps('unknown_role');
      assert.isTrue(Array.isArray(apps), 'Should return array');
      assert.equal(apps.length, 0, 'Unknown role should see no apps');
    });
    
    it('kepsek should access guru+kepsek apps', function() {
      var apps = getRegisteredApps('kepsek');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Kepsek should see app1 (guru,kepsek,admin)');
      assert.isTrue(ids.indexOf('app2') === -1, 'Kepsek should NOT see app2 (admin only)');
    });
  });
  
  describe('MultiRole — Kelas Field', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should store kelas in session for siswa', function() {
      var token = createSession({
        email: 'siswa@test.com',
        phone: '6285555555555',
        name: 'Siswa Test',
        role: 'siswa',
        kelas: '7B',
        loginMethod: 'whatsapp_otp'
      });
      var session = validateSession(token);
      assert.isTrue(session.valid, 'Session should be valid');
      assert.equal(session.kelas, '7B', 'Session should have kelas 7B');
    });
    
    it('should return empty kelas for guru', function() {
      var token = createSession({
        email: 'guru@test.com',
        name: 'Guru Test',
        role: 'guru',
        kelas: '',
        loginMethod: 'google'
      });
      var session = validateSession(token);
      assert.isTrue(session.valid, 'Session should be valid');
      assert.equal(session.kelas, '', 'Guru kelas should be empty');
    });
    
    it('should read kelas from user whitelist', function() {
      var result = checkUserByEmail('siswa@test.com');
      assert.isTrue(result.found, 'Should find siswa');
      assert.equal(result.kelas, '7B', 'Should return kelas from whitelist');
    });
    
    it('should read kelas from inactive user', function() {
      var result = checkUserByEmail('inactive@test.com');
      assert.isTrue(result.found, 'Should find inactive siswa');
      assert.equal(result.kelas, '7A', 'Should return kelas 7A');
    });
  });
  
  describe('MultiRole — Hybrid Access', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('user with apps override should ONLY see overridden apps (not role-based)', function() {
      // orangtua with override app1,app2 — should see app1 and app2, not role-based orangtua apps
      var apps = getRegisteredApps('orangtua', 'app1,app2');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Should see overridden app1');
      assert.isTrue(ids.indexOf('app2') !== -1, 'Should see overridden app2');
      // Should NOT fall through to role-based for non-overridden apps
      assert.isTrue(ids.indexOf('app5') === -1, 'Should NOT see app5 (not in override list)');
    });
    
    it('user without apps override should see role-based apps', function() {
      var apps = getRegisteredApps('guru', '');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Guru should see role-based app1');
      assert.isTrue(ids.indexOf('app5') !== -1, 'Guru should see role-based app5');
    });
    
    it('admin with override should still see all apps (admin bypasses override)', function() {
      var apps = getRegisteredApps('admin', 'app1');
      var ids = apps.map(function(a) { return a.id; });
      assert.isTrue(ids.indexOf('app1') !== -1, 'Admin should see app1');
      assert.isTrue(ids.indexOf('app2') !== -1, 'Admin should still see app2');
      assert.isTrue(ids.indexOf('app5') !== -1, 'Admin should still see app5');
    });
    
    it('override with non-existent app ID should return empty for that app', function() {
      var apps = getRegisteredApps('orangtua', 'nonexistent_app');
      assert.equal(apps.length, 0, 'Non-existent override app should return empty');
    });
    
    it('user data apps field should be readable from whitelist', function() {
      var user = checkUserByEmail('ortu@test.com');
      assert.equal(user.apps, 'app1,app2', 'Ortu should have apps override in whitelist');
    });
    
    it('empty apps field should trigger role-based access', function() {
      var user = checkUserByEmail('user@test.com');
      assert.equal(user.apps, '', 'Guru user should have empty apps field');
      var apps = getRegisteredApps(user.role, user.apps);
      assert.isTrue(apps.length > 0, 'Role-based access should return apps for guru');
    });
  });
}
