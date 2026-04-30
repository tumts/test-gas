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
  
  describe('GoogleAuth — getGoogleAuthUrl()', function() {
    
    it('should return a URL string containing client_id parameter', function() {
      try {
        var url = getGoogleAuthUrl('https://script.google.com/macros/s/test/exec', '');
        assert.isType(url, 'string', 'Should return a string');
        assert.contains(url, 'https://accounts.google.com/o/oauth2/v2/auth', 'Should be Google OAuth URL');
        assert.contains(url, 'client_id=', 'Should contain client_id parameter');
        assert.contains(url, 'response_type=code', 'Should contain response_type=code');
        assert.contains(url, 'scope=', 'Should contain scope parameter');
        assert.contains(url, 'prompt=select_account', 'Should contain prompt parameter');
      } catch (e) {
        // If GOOGLE_CLIENT_ID not set, getGoogleClientId() throws — acceptable in test env
        assert.contains(e.message, 'GOOGLE_CLIENT_ID', 'Error should mention GOOGLE_CLIENT_ID');
      }
    });

    it('should include redirect_uri and state parameters', function() {
      try {
        var redirectUri = 'https://script.google.com/macros/s/test/exec';
        var state = 'https://example.com/app';
        var url = getGoogleAuthUrl(redirectUri, state);
        assert.contains(url, 'redirect_uri=', 'Should contain redirect_uri');
        assert.contains(url, 'state=', 'Should contain state');
      } catch (e) {
        assert.contains(e.message, 'GOOGLE_CLIENT_ID', 'Error should mention GOOGLE_CLIENT_ID');
      }
    });
  });

  describe('GoogleAuth — exchangeCodeForToken()', function() {

    it('should return failure for null code', function() {
      var result = exchangeCodeForToken(null, 'https://script.google.com/macros/s/test/exec');
      assert.isFalse(result.success, 'Null code should fail');
      assert.contains(result.message, 'tidak ditemukan', 'Should have descriptive message');
    });

    it('should return failure for empty code', function() {
      var result = exchangeCodeForToken('', 'https://script.google.com/macros/s/test/exec');
      assert.isFalse(result.success, 'Empty code should fail');
    });

    it('should return failure for invalid code', function() {
      var result = exchangeCodeForToken('invalid_code_xyz', 'https://script.google.com/macros/s/test/exec');
      assert.isFalse(result.success, 'Invalid code should fail');
    });

    it('should return object with expected keys on failure', function() {
      var result = exchangeCodeForToken('invalid', 'https://script.google.com/macros/s/test/exec');
      assert.isTrue('success' in result, 'Should have success key');
      assert.isTrue('message' in result, 'Should have message key');
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
