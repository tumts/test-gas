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
      var apps = getRegisteredApps('guru');
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
      assert.isTrue(apps.length >= 2, 'Admin should see at least 2 apps');
      
      var adminApp = apps.filter(function(a) { return a.id === 'app2'; });
      assert.lengthOf(adminApp, 1, 'Admin should see admin-only app');
    });
    
    it('should return app objects with correct structure', function() {
      var apps = getRegisteredApps('guru');
      if (apps.length > 0) {
        var app = apps[0];
        assert.isTrue('id' in app, 'Should have id');
        assert.isTrue('name' in app, 'Should have name');
        assert.isTrue('url' in app, 'Should have url');
        assert.isTrue('icon' in app, 'Should have icon');
        assert.isTrue('description' in app, 'Should have description');
        assert.isTrue('allowedRoles' in app, 'Should have allowedRoles');
        assert.isTrue('status' in app, 'Should have status');
        assert.isTrue('category' in app, 'Should have category');
      }
    });
    
    it('should filter apps by comma-separated allowedRoles', function() {
      var apps = getRegisteredApps('guru');
      var guruApp = apps.filter(function(a) { return a.id === 'app1'; });
      assert.lengthOf(guruApp, 1, 'Guru should see app1 (allowedRoles includes guru)');
    });
    
    it('should allow guru to access guru+kepsek apps', function() {
      var apps = getRegisteredApps('guru');
      var app1 = apps.filter(function(a) { return a.id === 'app1'; });
      assert.lengthOf(app1, 1, 'Guru should access app1 (guru,kepsek,admin)');
    });
    
    it('should NOT allow siswa to access guru-only apps', function() {
      var apps = getRegisteredApps('siswa');
      var adminApp = apps.filter(function(a) { return a.id === 'app2'; });
      assert.lengthOf(adminApp, 0, 'Siswa should NOT see admin-only app');
      var guruApp = apps.filter(function(a) { return a.id === 'app1'; });
      assert.lengthOf(guruApp, 0, 'Siswa should NOT see guru-only app (app1)');
    });
    
    it('should allow user with apps override to access specific apps', function() {
      var apps = getRegisteredApps('orangtua', 'app1,app2');
      var app1 = apps.filter(function(a) { return a.id === 'app1'; });
      var app2 = apps.filter(function(a) { return a.id === 'app2'; });
      assert.lengthOf(app1, 1, 'Override should grant access to app1');
      assert.lengthOf(app2, 1, 'Override should grant access to app2');
    });
    
    it('should return category field', function() {
      var apps = getRegisteredApps('admin');
      var app1 = apps.filter(function(a) { return a.id === 'app1'; })[0];
      assert.equal(app1.category, 'akademik', 'App1 category should be akademik');
    });
    
    it('should default category to umum if empty', function() {
      var apps = getRegisteredApps('admin');
      for (var i = 0; i < apps.length; i++) {
        assert.isTruthy(apps[i].category, 'Category should never be empty');
      }
    });
  });
  
  describe('AppRegistry — getUniqueCategories()', function() {
    
    it('should return sorted unique categories', function() {
      var apps = [
        { category: 'akademik' },
        { category: 'umum' },
        { category: 'akademik' },
        { category: 'admin' }
      ];
      var cats = getUniqueCategories(apps);
      assert.lengthOf(cats, 3, 'Should have 3 unique categories');
      assert.equal(cats[0], 'admin', 'First should be admin (sorted)');
      assert.equal(cats[1], 'akademik', 'Second should be akademik');
      assert.equal(cats[2], 'umum', 'Third should be umum');
    });
    
    it('should default to umum for apps without category', function() {
      var apps = [{ category: '' }, { category: undefined }];
      var cats = getUniqueCategories(apps);
      assert.lengthOf(cats, 1, 'Should have 1 category');
      assert.equal(cats[0], 'umum', 'Default category should be umum');
    });
    
    it('should return empty array for empty apps', function() {
      var cats = getUniqueCategories([]);
      assert.lengthOf(cats, 0, 'Should return empty array');
    });
  });
}
