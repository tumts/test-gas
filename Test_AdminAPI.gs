/**
 * @file Test_AdminAPI.gs
 * @description Test suite untuk AdminAPI.gs — Admin CRUD operations.
 * TDD approach: test ditulis sebelum implementasi.
 */

// ============ HELPERS ============

function createAdminSession() {
  return createSession({
    email: 'admin@test.com',
    phone: '6281111111111',
    name: 'Admin Test',
    role: 'admin',
    kelas: '',
    loginMethod: 'google'
  });
}

function createNonAdminSession() {
  return createSession({
    email: 'user@test.com',
    phone: '6282222222222',
    name: 'User Test',
    role: 'guru',
    kelas: '',
    loginMethod: 'whatsapp_otp'
  });
}

// ============ TEST SUITE ============

function testSuite_AdminAPI() {

  // ─── requireAdmin() ───

  describe('AdminAPI — requireAdmin()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should authorize valid admin session', function() {
      var token = createAdminSession();
      var result = requireAdmin(token);
      assert.isTrue(result.authorized, 'Admin should be authorized');
      assert.isTruthy(result.session, 'Should return session object');
      assert.equal(result.session.email, 'admin@test.com');
    });

    it('should reject non-admin session', function() {
      var token = createNonAdminSession();
      var result = requireAdmin(token);
      assert.isFalse(result.authorized, 'Non-admin should not be authorized');
      assert.contains(result.message, 'admin', 'Should mention admin in message');
    });

    it('should reject invalid token', function() {
      var result = requireAdmin('invalid_token_xyz');
      assert.isFalse(result.authorized, 'Invalid token should not be authorized');
      assert.contains(result.message, 'Session tidak valid', 'Should mention invalid session');
    });

    it('should reject null token', function() {
      var result = requireAdmin(null);
      assert.isFalse(result.authorized, 'Null token should not be authorized');
    });

    it('should reject empty string token', function() {
      var result = requireAdmin('');
      assert.isFalse(result.authorized, 'Empty token should not be authorized');
    });

    it('should reject undefined token', function() {
      var result = requireAdmin(undefined);
      assert.isFalse(result.authorized, 'Undefined token should not be authorized');
    });
  });

  // ─── adminGetUsers() ───

  describe('AdminAPI — adminGetUsers()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should return all users for admin', function() {
      var token = createAdminSession();
      var result = adminGetUsers(token);
      assert.isTrue(result.success, 'Should succeed for admin');
      assert.isTrue(Array.isArray(result.users), 'Should return array');
      assert.isTrue(result.users.length >= 6, 'Should return seeded users');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminGetUsers(token);
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should return users with kelas and apps fields', function() {
      var token = createAdminSession();
      var result = adminGetUsers(token);
      assert.isTrue(result.success, 'Should succeed');
      var siswa = result.users.filter(function(u) { return u.email === 'siswa@test.com'; })[0];
      assert.isTruthy(siswa, 'Should find siswa user');
      assert.equal(siswa.kelas, '7B', 'Should have kelas');
      var ortu = result.users.filter(function(u) { return u.email === 'ortu@test.com'; })[0];
      assert.isTruthy(ortu, 'Should find ortu user');
      assert.equal(ortu.apps, 'app1,app2', 'Should have apps');
    });

    it('should return user objects with all fields', function() {
      var token = createAdminSession();
      var result = adminGetUsers(token);
      assert.isTrue(result.success, 'Should succeed');
      var user = result.users[0];
      assert.isTrue('email' in user, 'Should have email');
      assert.isTrue('phone' in user, 'Should have phone');
      assert.isTrue('nama' in user, 'Should have nama');
      assert.isTrue('role' in user, 'Should have role');
      assert.isTrue('status' in user, 'Should have status');
      assert.isTrue('ditambahkan_oleh' in user, 'Should have ditambahkan_oleh');
      assert.isTrue('tanggal' in user, 'Should have tanggal');
      assert.isTrue('kelas' in user, 'Should have kelas');
      assert.isTrue('apps' in user, 'Should have apps');
    });
  });

  // ─── adminAddUser() ───

  describe('AdminAPI — adminAddUser()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should add new user', function() {
      var token = createAdminSession();
      var result = adminAddUser(token, {
        email: 'newuser@test.com',
        phone: '6289999999999',
        nama: 'New User',
        role: 'guru',
        status: 'active'
      });
      assert.isTrue(result.success, 'Should succeed');
      assert.contains(result.message, 'berhasil', 'Should confirm success');

      // Verify user was added
      var users = adminGetUsers(token);
      var newUser = users.users.filter(function(u) { return u.email === 'newuser@test.com'; })[0];
      assert.isTruthy(newUser, 'New user should exist');
      assert.equal(newUser.role, 'guru', 'Role should match');
    });

    it('should reject duplicate email', function() {
      var token = createAdminSession();
      var result = adminAddUser(token, {
        email: 'admin@test.com',
        role: 'guru'
      });
      assert.isFalse(result.success, 'Should fail for duplicate email');
      assert.contains(result.message, 'sudah terdaftar', 'Should mention duplicate');
    });

    it('should reject invalid role', function() {
      var token = createAdminSession();
      var result = adminAddUser(token, {
        email: 'invalid@test.com',
        role: 'superadmin'
      });
      assert.isFalse(result.success, 'Should fail for invalid role');
      assert.contains(result.message, 'Role tidak valid', 'Should mention invalid role');
    });

    it('should reject missing email', function() {
      var token = createAdminSession();
      var result = adminAddUser(token, { role: 'guru' });
      assert.isFalse(result.success, 'Should fail without email');
      assert.contains(result.message, 'Email wajib', 'Should mention email required');
    });

    it('should reject missing role', function() {
      var token = createAdminSession();
      var result = adminAddUser(token, { email: 'norole@test.com' });
      assert.isFalse(result.success, 'Should fail without role');
      assert.contains(result.message, 'Role wajib', 'Should mention role required');
    });

    it('should log audit event', function() {
      var token = createAdminSession();
      adminAddUser(token, {
        email: 'audittest@test.com',
        role: 'guru'
      });
      // Verify audit log entry
      var auditSheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('audit_log');
      var auditData = auditSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < auditData.length; i++) {
        if (auditData[i][1] === 'USER_ADDED' && String(auditData[i][5]).indexOf('audittest@test.com') !== -1) {
          found = true;
          break;
        }
      }
      assert.isTrue(found, 'Should log USER_ADDED audit event');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminAddUser(token, { email: 'x@test.com', role: 'guru' });
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should set default status to active when not provided', function() {
      var token = createAdminSession();
      adminAddUser(token, {
        email: 'defaultstatus@test.com',
        role: 'siswa'
      });
      var users = adminGetUsers(token);
      var user = users.users.filter(function(u) { return u.email === 'defaultstatus@test.com'; })[0];
      assert.equal(user.status, 'active', 'Default status should be active');
    });

    it('should normalize email to lowercase', function() {
      var token = createAdminSession();
      adminAddUser(token, {
        email: 'UpperCase@Test.COM',
        role: 'guru'
      });
      var users = adminGetUsers(token);
      var user = users.users.filter(function(u) { return u.email === 'uppercase@test.com'; })[0];
      assert.isTruthy(user, 'Email should be stored in lowercase');
    });
  });

  // ─── adminUpdateUser() ───

  describe('AdminAPI — adminUpdateUser()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should update user fields', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, 'user@test.com', {
        phone: '6289999999999',
        nama: 'Updated Name'
      });
      assert.isTrue(result.success, 'Should succeed');

      var users = adminGetUsers(token);
      var user = users.users.filter(function(u) { return u.email === 'user@test.com'; })[0];
      assert.equal(user.phone, '6289999999999', 'Phone should be updated');
      assert.equal(user.nama, 'Updated Name', 'Name should be updated');
    });

    it('should not allow email change', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, 'user@test.com', {
        email: 'newemail@test.com'
      });
      assert.isFalse(result.success, 'Should fail for email change');
      assert.contains(result.message, 'Email tidak boleh diubah', 'Should mention no email change');
    });

    it('should reject non-existent user', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, 'nobody@test.com', { nama: 'X' });
      assert.isFalse(result.success, 'Should fail for non-existent user');
      assert.contains(result.message, 'tidak ditemukan', 'Should mention not found');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminUpdateUser(token, 'user@test.com', { nama: 'X' });
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should update role field', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, 'user@test.com', { role: 'kepsek' });
      assert.isTrue(result.success, 'Should succeed');
      var users = adminGetUsers(token);
      var user = users.users.filter(function(u) { return u.email === 'user@test.com'; })[0];
      assert.equal(user.role, 'kepsek', 'Role should be updated');
    });

    it('should reject invalid role in updates', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, 'user@test.com', { role: 'invalid_role' });
      assert.isFalse(result.success, 'Should fail for invalid role');
      assert.contains(result.message, 'Role tidak valid', 'Should mention invalid role');
    });

    it('should update kelas and apps fields', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, 'user@test.com', { kelas: '8A', apps: 'app1,app3' });
      assert.isTrue(result.success, 'Should succeed');
      var users = adminGetUsers(token);
      var user = users.users.filter(function(u) { return u.email === 'user@test.com'; })[0];
      assert.equal(user.kelas, '8A', 'Kelas should be updated');
      assert.equal(user.apps, 'app1,app3', 'Apps should be updated');
    });

    it('should log audit event for update', function() {
      var token = createAdminSession();
      adminUpdateUser(token, 'user@test.com', { nama: 'Audit Update' });
      var auditSheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('audit_log');
      var auditData = auditSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < auditData.length; i++) {
        if (auditData[i][1] === 'USER_UPDATED' && String(auditData[i][5]).indexOf('user@test.com') !== -1) {
          found = true;
          break;
        }
      }
      assert.isTrue(found, 'Should log USER_UPDATED audit event');
    });

    it('should reject empty email target', function() {
      var token = createAdminSession();
      var result = adminUpdateUser(token, '', { nama: 'X' });
      assert.isFalse(result.success, 'Should fail for empty email');
    });
  });

  // ─── adminDeleteUser() ───

  describe('AdminAPI — adminDeleteUser()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should delete user', function() {
      var token = createAdminSession();
      var result = adminDeleteUser(token, 'user@test.com');
      assert.isTrue(result.success, 'Should succeed');

      var users = adminGetUsers(token);
      var deleted = users.users.filter(function(u) { return u.email === 'user@test.com'; });
      assert.lengthOf(deleted, 0, 'User should be removed');
    });

    it('should not allow self-delete', function() {
      var token = createAdminSession();
      var result = adminDeleteUser(token, 'admin@test.com');
      assert.isFalse(result.success, 'Should not allow self-delete');
      assert.contains(result.message, 'akun sendiri', 'Should mention self-delete');
    });

    it('should reject non-existent user', function() {
      var token = createAdminSession();
      var result = adminDeleteUser(token, 'nobody@test.com');
      assert.isFalse(result.success, 'Should fail for non-existent user');
      assert.contains(result.message, 'tidak ditemukan', 'Should mention not found');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminDeleteUser(token, 'user@test.com');
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should log audit event for delete', function() {
      var token = createAdminSession();
      adminDeleteUser(token, 'inactive@test.com');
      var auditSheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('audit_log');
      var auditData = auditSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < auditData.length; i++) {
        if (auditData[i][1] === 'USER_DELETED' && String(auditData[i][5]).indexOf('inactive@test.com') !== -1) {
          found = true;
          break;
        }
      }
      assert.isTrue(found, 'Should log USER_DELETED audit event');
    });

    it('should reject empty email target', function() {
      var token = createAdminSession();
      var result = adminDeleteUser(token, '');
      assert.isFalse(result.success, 'Should fail for empty email');
    });
  });

  // ─── adminGetApps() ───

  describe('AdminAPI — adminGetApps()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should return all apps for admin', function() {
      var token = createAdminSession();
      var result = adminGetApps(token);
      assert.isTrue(result.success, 'Should succeed for admin');
      assert.isTrue(Array.isArray(result.apps), 'Should return array');
      assert.isTrue(result.apps.length >= 5, 'Should return seeded apps');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminGetApps(token);
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should return app objects with all fields', function() {
      var token = createAdminSession();
      var result = adminGetApps(token);
      assert.isTrue(result.success, 'Should succeed');
      var app = result.apps[0];
      assert.isTrue('id' in app, 'Should have id');
      assert.isTrue('name' in app, 'Should have name');
      assert.isTrue('url' in app, 'Should have url');
      assert.isTrue('icon' in app, 'Should have icon');
      assert.isTrue('description' in app, 'Should have description');
      assert.isTrue('allowedRoles' in app, 'Should have allowedRoles');
      assert.isTrue('status' in app, 'Should have status');
      assert.isTrue('category' in app, 'Should have category');
    });

    it('should include both active and inactive apps', function() {
      var token = createAdminSession();
      var result = adminGetApps(token);
      assert.isTrue(result.success, 'Should succeed');
      var inactive = result.apps.filter(function(a) { return a.status === 'inactive'; });
      assert.isTrue(inactive.length >= 1, 'Should include inactive apps');
    });
  });

  // ─── adminAddApp() ───

  describe('AdminAPI — adminAddApp()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should add new app', function() {
      var token = createAdminSession();
      var result = adminAddApp(token, {
        id: 'new-app',
        name: 'New App',
        url: 'https://example.com/new',
        icon: '🆕',
        description: 'A new app',
        allowedRoles: 'guru,admin',
        status: 'active',
        category: 'akademik'
      });
      assert.isTrue(result.success, 'Should succeed');

      var apps = adminGetApps(token);
      var newApp = apps.apps.filter(function(a) { return a.id === 'new-app'; })[0];
      assert.isTruthy(newApp, 'New app should exist');
      assert.equal(newApp.name, 'New App', 'Name should match');
    });

    it('should reject duplicate id', function() {
      var token = createAdminSession();
      var result = adminAddApp(token, { id: 'app1', name: 'Duplicate' });
      assert.isFalse(result.success, 'Should fail for duplicate id');
      assert.contains(result.message, 'sudah terdaftar', 'Should mention duplicate');
    });

    it('should reject missing id', function() {
      var token = createAdminSession();
      var result = adminAddApp(token, { name: 'No ID App' });
      assert.isFalse(result.success, 'Should fail without id');
      assert.contains(result.message, 'App ID wajib', 'Should mention id required');
    });

    it('should reject missing name', function() {
      var token = createAdminSession();
      var result = adminAddApp(token, { id: 'no-name' });
      assert.isFalse(result.success, 'Should fail without name');
      assert.contains(result.message, 'App name wajib', 'Should mention name required');
    });

    it('should log audit event', function() {
      var token = createAdminSession();
      adminAddApp(token, { id: 'audit-app', name: 'Audit App' });
      var auditSheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('audit_log');
      var auditData = auditSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < auditData.length; i++) {
        if (auditData[i][1] === 'APP_ADDED' && String(auditData[i][5]).indexOf('audit-app') !== -1) {
          found = true;
          break;
        }
      }
      assert.isTrue(found, 'Should log APP_ADDED audit event');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminAddApp(token, { id: 'x', name: 'X' });
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should default status to active and category to umum', function() {
      var token = createAdminSession();
      adminAddApp(token, { id: 'default-app', name: 'Default App' });
      var apps = adminGetApps(token);
      var app = apps.apps.filter(function(a) { return a.id === 'default-app'; })[0];
      assert.equal(app.status, 'active', 'Default status should be active');
      assert.equal(app.category, 'umum', 'Default category should be umum');
    });
  });

  // ─── adminUpdateApp() ───

  describe('AdminAPI — adminUpdateApp()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should update app fields', function() {
      var token = createAdminSession();
      var result = adminUpdateApp(token, 'app1', {
        name: 'Updated App',
        description: 'Updated description'
      });
      assert.isTrue(result.success, 'Should succeed');

      var apps = adminGetApps(token);
      var app = apps.apps.filter(function(a) { return a.id === 'app1'; })[0];
      assert.equal(app.name, 'Updated App', 'Name should be updated');
      assert.equal(app.description, 'Updated description', 'Description should be updated');
    });

    it('should reject non-existent app', function() {
      var token = createAdminSession();
      var result = adminUpdateApp(token, 'nonexistent', { name: 'X' });
      assert.isFalse(result.success, 'Should fail for non-existent app');
      assert.contains(result.message, 'tidak ditemukan', 'Should mention not found');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminUpdateApp(token, 'app1', { name: 'X' });
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should log audit event for update', function() {
      var token = createAdminSession();
      adminUpdateApp(token, 'app2', { name: 'Audit Updated' });
      var auditSheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('audit_log');
      var auditData = auditSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < auditData.length; i++) {
        if (auditData[i][1] === 'APP_UPDATED' && String(auditData[i][5]).indexOf('app2') !== -1) {
          found = true;
          break;
        }
      }
      assert.isTrue(found, 'Should log APP_UPDATED audit event');
    });

    it('should reject empty app id', function() {
      var token = createAdminSession();
      var result = adminUpdateApp(token, '', { name: 'X' });
      assert.isFalse(result.success, 'Should fail for empty app id');
    });

    it('should update url and allowedRoles', function() {
      var token = createAdminSession();
      var result = adminUpdateApp(token, 'app1', {
        url: 'https://new-url.com/exec',
        allowedRoles: 'admin,guru,siswa'
      });
      assert.isTrue(result.success, 'Should succeed');
      var apps = adminGetApps(token);
      var app = apps.apps.filter(function(a) { return a.id === 'app1'; })[0];
      assert.equal(app.url, 'https://new-url.com/exec', 'URL should be updated');
      assert.equal(app.allowedRoles, 'admin,guru,siswa', 'AllowedRoles should be updated');
    });
  });

  // ─── adminDeleteApp() ───

  describe('AdminAPI — adminDeleteApp()', function() {
    beforeEach(function() { setupTestEnvironment(); });
    afterEach(function() { teardownTestEnvironment(); });

    it('should delete app', function() {
      var token = createAdminSession();
      var result = adminDeleteApp(token, 'app3');
      assert.isTrue(result.success, 'Should succeed');

      var apps = adminGetApps(token);
      var deleted = apps.apps.filter(function(a) { return a.id === 'app3'; });
      assert.lengthOf(deleted, 0, 'App should be removed');
    });

    it('should reject non-existent app', function() {
      var token = createAdminSession();
      var result = adminDeleteApp(token, 'nonexistent');
      assert.isFalse(result.success, 'Should fail for non-existent app');
      assert.contains(result.message, 'tidak ditemukan', 'Should mention not found');
    });

    it('should reject non-admin', function() {
      var token = createNonAdminSession();
      var result = adminDeleteApp(token, 'app1');
      assert.isFalse(result.authorized, 'Non-admin should be rejected');
    });

    it('should log audit event for delete', function() {
      var token = createAdminSession();
      adminDeleteApp(token, 'app2');
      var auditSheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('audit_log');
      var auditData = auditSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < auditData.length; i++) {
        if (auditData[i][1] === 'APP_DELETED' && String(auditData[i][5]).indexOf('app2') !== -1) {
          found = true;
          break;
        }
      }
      assert.isTrue(found, 'Should log APP_DELETED audit event');
    });

    it('should reject empty app id', function() {
      var token = createAdminSession();
      var result = adminDeleteApp(token, '');
      assert.isFalse(result.success, 'Should fail for empty app id');
    });
  });
}
