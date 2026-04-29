/**
 * @file Test_GoogleAuth.gs
 * @description Test suite untuk GoogleAuth.gs
 */

function testSuite_GoogleAuth() {
  
  describe('GoogleAuth — getGoogleClientId()', function() {
    
    it('should return string or throw descriptive error', function() {
      try {
        var clientId = getGoogleClientId();
        assert.isType(clientId, 'string', 'Client ID should be string');
        assert.isTrue(clientId.length > 0, 'Client ID should not be empty');
      } catch (e) {
        assert.contains(e.message, 'GOOGLE_CLIENT_ID', 'Error should mention GOOGLE_CLIENT_ID');
      }
    });
  });
  
  describe('GoogleAuth — verifyGoogleToken()', function() {
    
    it('should reject null token', function() {
      var result = verifyGoogleToken(null);
      assert.isFalse(result.success, 'Null token should fail');
      assert.contains(result.message, 'tidak ditemukan', 'Should have descriptive message');
    });
    
    it('should reject empty string token', function() {
      var result = verifyGoogleToken('');
      assert.isFalse(result.success, 'Empty token should fail');
    });
    
    it('should reject invalid/garbage token', function() {
      var result = verifyGoogleToken('this_is_not_a_valid_jwt_token');
      assert.isFalse(result.success, 'Invalid token should fail');
    });
    
    it('should reject expired token gracefully', function() {
      // Menggunakan token yang pasti expired/invalid
      var result = verifyGoogleToken('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiZXhwIjoxMDAwMDAwMDAwfQ.fake');
      assert.isFalse(result.success, 'Expired/invalid token should fail');
    });
    
    it('should return object with expected keys on failure', function() {
      var result = verifyGoogleToken('invalid');
      assert.isTrue('success' in result, 'Should have success key');
      assert.isTrue('message' in result, 'Should have message key');
    });
  });
}
