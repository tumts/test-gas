/**
 * @file Test_UserWhitelist.gs
 * @description Test suite untuk UserWhitelist.gs
 */

function testSuite_UserWhitelist() {
  
  describe('UserWhitelist — checkUserByEmail()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should find active user by email', function() {
      var result = checkUserByEmail('admin@test.com');
      assert.isTrue(result.found, 'Should find admin');
      assert.isTrue(result.allowed, 'Admin should be allowed');
      assert.equal(result.role, 'admin', 'Role should be admin');
      assert.equal(result.name, 'Admin Test', 'Name should match');
    });
    
    it('should find user but NOT allow inactive user', function() {
      var result = checkUserByEmail('inactive@test.com');
      assert.isTrue(result.found, 'Should find inactive user');
      assert.isFalse(result.allowed, 'Inactive user should NOT be allowed');
    });
    
    it('should return found=false for unknown email', function() {
      var result = checkUserByEmail('unknown@test.com');
      assert.isFalse(result.found, 'Unknown email should not be found');
      assert.isFalse(result.allowed, 'Unknown email should not be allowed');
    });
    
    it('should be case-insensitive for email', function() {
      var result = checkUserByEmail('ADMIN@TEST.COM');
      assert.isTrue(result.found, 'Should find email regardless of case');
      assert.isTrue(result.allowed, 'Should be allowed');
    });
    
    it('should handle email with leading/trailing spaces', function() {
      var result = checkUserByEmail('  admin@test.com  ');
      assert.isTrue(result.found, 'Should find email with spaces trimmed');
    });
    
    it('should return phone number from whitelist', function() {
      var result = checkUserByEmail('admin@test.com');
      assert.equal(result.phone, '6281111111111', 'Should return associated phone');
    });
    
    it('should handle empty string email', function() {
      var result = checkUserByEmail('');
      assert.isFalse(result.found, 'Empty email should not be found');
    });
  });
  
  describe('UserWhitelist — checkUserByPhone()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should find active user by phone', function() {
      var result = checkUserByPhone('6281111111111');
      assert.isTrue(result.found, 'Should find user by phone');
      assert.isTrue(result.allowed, 'Should be allowed');
      assert.equal(result.email, 'admin@test.com', 'Should return associated email');
    });
    
    it('should find user but NOT allow inactive', function() {
      var result = checkUserByPhone('6283333333333');
      assert.isTrue(result.found, 'Should find inactive user');
      assert.isFalse(result.allowed, 'Inactive should not be allowed');
    });
    
    it('should return found=false for unknown phone', function() {
      var result = checkUserByPhone('6289999999999');
      assert.isFalse(result.found, 'Unknown phone should not be found');
    });
    
    it('should handle empty string phone', function() {
      var result = checkUserByPhone('');
      assert.isFalse(result.found, 'Empty phone should not be found');
    });
    
    it('should strip non-digit characters from input', function() {
      var result = checkUserByPhone('+62-811-1111-1111');
      assert.isTrue(result.found, 'Should find phone after stripping non-digits');
    });
  });
}
