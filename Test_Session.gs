/**
 * @file Test_Session.gs
 * @description Test suite untuk Session.gs
 */

function testSuite_Session() {
  
  describe('Session — createSession()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should return a non-empty token string', function() {
      var token = createSession({
        email: 'test@test.com',
        phone: '6281234567890',
        name: 'Test User',
        role: 'user',
        loginMethod: 'google'
      });
      assert.isType(token, 'string', 'Token should be string');
      assert.isTrue(token.length > 0, 'Token should not be empty');
    });
    
    it('should create unique tokens for each session', function() {
      var token1 = createSession({ email: 'a@test.com', loginMethod: 'google' });
      var token2 = createSession({ email: 'b@test.com', loginMethod: 'google' });
      assert.notEqual(token1, token2, 'Tokens should be unique');
    });
    
    it('should store session data in Sheet', function() {
      var token = createSession({
        email: 'stored@test.com',
        phone: '6281234567890',
        name: 'Stored User',
        role: 'admin',
        loginMethod: 'whatsapp_otp'
      });
      
      // Verify by reading back
      var result = validateSession(token);
      assert.isTrue(result.valid, 'Session should be valid');
      assert.equal(result.email, 'stored@test.com', 'Email should match');
      assert.equal(result.role, 'admin', 'Role should match');
      assert.equal(result.loginMethod, 'whatsapp_otp', 'Login method should match');
    });
    
    it('should handle missing optional fields', function() {
      var token = createSession({ email: 'minimal@test.com' });
      assert.isType(token, 'string', 'Should create session with minimal data');
      
      var result = validateSession(token);
      assert.isTrue(result.valid, 'Minimal session should be valid');
      assert.equal(result.role, 'user', 'Default role should be user');
    });
  });
  
  describe('Session — validateSession()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should return valid=false for null token', function() {
      var result = validateSession(null);
      assert.isFalse(result.valid, 'Null token should be invalid');
    });
    
    it('should return valid=false for empty string token', function() {
      var result = validateSession('');
      assert.isFalse(result.valid, 'Empty token should be invalid');
    });
    
    it('should return valid=false for non-existent token', function() {
      var result = validateSession('nonexistent_token_12345');
      assert.isFalse(result.valid, 'Non-existent token should be invalid');
      assert.equal(result.reason, 'not_found', 'Reason should be not_found');
    });
    
    it('should return valid=true for active session', function() {
      var token = createSession({ email: 'valid@test.com', loginMethod: 'google' });
      var result = validateSession(token);
      assert.isTrue(result.valid, 'Active session should be valid');
    });
    
    it('should return valid=false for expired session', function() {
      // Manually insert expired session
      var sheet = getSessionsSheet();
      var expiredToken = 'expired_test_token_' + Date.now();
      sheet.appendRow([
        expiredToken, 'expired@test.com', '', 'Expired', 'user', 'google',
        Date.now() - 7200000, // created 2 hours ago
        Date.now() - 3600000, // expired 1 hour ago
        'active'
      ]);
      
      var result = validateSession(expiredToken);
      assert.isFalse(result.valid, 'Expired session should be invalid');
      assert.equal(result.reason, 'expired', 'Reason should be expired');
    });
  });
  
  describe('Session — deleteSession()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should return true when deleting existing session', function() {
      var token = createSession({ email: 'delete@test.com', loginMethod: 'google' });
      var result = deleteSession(token);
      assert.isTrue(result, 'Should return true for successful delete');
    });
    
    it('should invalidate session after delete', function() {
      var token = createSession({ email: 'delete2@test.com', loginMethod: 'google' });
      deleteSession(token);
      var result = validateSession(token);
      assert.isFalse(result.valid, 'Deleted session should be invalid');
    });
    
    it('should return false for null token', function() {
      var result = deleteSession(null);
      assert.isFalse(result, 'Should return false for null token');
    });
    
    it('should return false for non-existent token', function() {
      var result = deleteSession('nonexistent_token');
      assert.isFalse(result, 'Should return false for non-existent token');
    });
  });
  
  describe('Session — generateSessionToken()', function() {
    
    it('should return a 64-character hex string', function() {
      var token = generateSessionToken();
      assert.equal(token.length, 64, 'Token should be 64 chars');
      assert.isTrue(/^[0-9a-f]+$/.test(token), 'Token should be hex');
    });
    
    it('should generate unique tokens', function() {
      var tokens = [];
      for (var i = 0; i < 10; i++) {
        tokens.push(generateSessionToken());
      }
      // Check all unique
      var unique = tokens.filter(function(t, idx) { return tokens.indexOf(t) === idx; });
      assert.equal(unique.length, 10, 'All 10 tokens should be unique');
    });
  });
  
  describe('Session — cleanExpiredSessions()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should clean expired sessions older than 24 hours', function() {
      var sheet = getSessionsSheet();
      
      // Insert old expired session (expired 25 hours ago)
      sheet.appendRow([
        'old_expired_token', 'old@test.com', '', 'Old', 'user', 'google',
        Date.now() - 90000000, // created 25+ hours ago
        Date.now() - 86500000, // expired 24+ hours ago
        'active'
      ]);
      
      // Insert recent active session
      var activeToken = createSession({ email: 'active@test.com', loginMethod: 'google' });
      
      var deleted = cleanExpiredSessions();
      assert.greaterThan(deleted, 0, 'Should delete at least 1 session');
      
      // Active session should still be valid
      var result = validateSession(activeToken);
      assert.isTrue(result.valid, 'Active session should survive cleanup');
    });
    
    it('should clean logged_out sessions', function() {
      var token = createSession({ email: 'logout@test.com', loginMethod: 'google' });
      deleteSession(token); // marks as logged_out
      
      var deleted = cleanExpiredSessions();
      assert.greaterThan(deleted, 0, 'Should delete logged_out sessions');
    });
  });
}
