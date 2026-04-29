/**
 * @file Test_AppRegistry.gs
 * @description Test suite untuk AppRegistry.gs
 */

function testSuite_AppRegistry() {
  
  describe('AppRegistry — buildAppUrl()', function() {
    
    it('should append token as query parameter', function() {
      var url = buildAppUrl('https://example.com/app', 'mytoken123');
      assert.contains(url, 'auth_token=mytoken123', 'Should contain token');
      assert.contains(url, '?', 'Should use ? separator');
    });
    
    it('should use & separator if URL already has query params', function() {
      var url = buildAppUrl('https://example.com/app?page=1', 'mytoken123');
      assert.contains(url, '&auth_token=mytoken123', 'Should use & separator');
    });
    
    it('should encode token in URL', function() {
      var url = buildAppUrl('https://example.com/app', 'token with spaces');
      assert.contains(url, 'auth_token=token', 'Should contain encoded token');
    });
    
    it('should handle empty token', function() {
      var url = buildAppUrl('https://example.com/app', '');
      assert.contains(url, 'auth_token=', 'Should still append parameter');
    });
  });
  
  describe('AppRegistry — getRegisteredApps()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should return array', function() {
      var apps = getRegisteredApps('user');
      assert.isTrue(Array.isArray(apps), 'Should return array');
    });
    
    it('should filter out inactive apps', function() {
      var apps = getRegisteredApps('admin');
      var inactiveApps = apps.filter(function(a) { return a.id === 'app3'; });
      assert.lengthOf(inactiveApps, 0, 'Should not include inactive apps');
    });
    
    it('should filter out apps without URL', function() {
      var apps = getRegisteredApps('admin');
      var noUrlApps = apps.filter(function(a) { return a.id === 'app4'; });
      assert.lengthOf(noUrlApps, 0, 'Should not include apps without URL');
    });
    
    it('should show all active apps for admin role', function() {
      var apps = getRegisteredApps('admin');
      assert.isTrue(apps.length >= 2, 'Admin should see at least 2 apps (user + admin)');
      
      var adminApp = apps.filter(function(a) { return a.id === 'app2'; });
      assert.lengthOf(adminApp, 1, 'Admin should see admin-only app');
    });
    
    it('should only show user-level apps for user role', function() {
      var apps = getRegisteredApps('user');
      var adminApps = apps.filter(function(a) { return a.requiredRole === 'admin'; });
      assert.lengthOf(adminApps, 0, 'User should NOT see admin-only apps');
    });
    
    it('should return app objects with correct structure', function() {
      var apps = getRegisteredApps('user');
      if (apps.length > 0) {
        var app = apps[0];
        assert.isTrue('id' in app, 'Should have id');
        assert.isTrue('name' in app, 'Should have name');
        assert.isTrue('url' in app, 'Should have url');
        assert.isTrue('icon' in app, 'Should have icon');
        assert.isTrue('description' in app, 'Should have description');
        assert.isTrue('requiredRole' in app, 'Should have requiredRole');
        assert.isTrue('status' in app, 'Should have status');
      }
    });
  });
}
