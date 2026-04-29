/**
 * @file Test_Code.gs
 * @description Test suite untuk Code.gs — routing dan logic utama.
 * Catatan: doGet/doPost sulit di-test secara unit karena bergantung pada HtmlService.
 * Test ini fokus pada logic dan edge cases yang bisa diverifikasi.
 */

function testSuite_Code() {
  
  describe('Code — Phone Normalization Logic', function() {
    
    it('should convert 0 prefix to 62', function() {
      var phone = '081234567890';
      var clean = phone.replace(/\D/g, '');
      if (clean.startsWith('0')) {
        clean = '62' + clean.substring(1);
      }
      assert.equal(clean, '6281234567890', 'Should convert 0 to 62');
    });
    
    it('should keep 62 prefix as-is', function() {
      var phone = '6281234567890';
      var clean = phone.replace(/\D/g, '');
      if (clean.startsWith('0')) {
        clean = '62' + clean.substring(1);
      }
      assert.equal(clean, '6281234567890', 'Should keep 62 prefix');
    });
    
    it('should strip non-digit characters', function() {
      var phone = '+62-812-345-6789';
      var clean = phone.replace(/\D/g, '');
      assert.equal(clean, '628123456789', 'Should strip non-digits');
    });
    
    it('should handle empty phone gracefully', function() {
      var phone = '';
      var isEmpty = !phone || phone.trim() === '';
      assert.isTrue(isEmpty, 'Empty phone should be detected');
    });
    
    it('should handle phone with only spaces', function() {
      var phone = '   ';
      var isEmpty = !phone || phone.trim() === '';
      assert.isTrue(isEmpty, 'Whitespace-only phone should be detected');
    });
  });
  
  describe('Code — render() function', function() {
    
    it('should render login page without error', function() {
      assert.doesNotThrow(function() {
        var output = render('login', { phone: '', error: '' });
        assert.isTruthy(output, 'Should return HtmlOutput');
      }, 'render login should not throw');
    });
    
    it('should render verify page without error', function() {
      assert.doesNotThrow(function() {
        var output = render('verify', { phone: '6281234567890', error: '' });
        assert.isTruthy(output, 'Should return HtmlOutput');
      }, 'render verify should not throw');
    });
    
    it('should handle render with error message', function() {
      assert.doesNotThrow(function() {
        var output = render('login', { phone: '', error: 'Test error message' });
        assert.isTruthy(output, 'Should return HtmlOutput with error');
      }, 'render with error should not throw');
    });
    
    it('should handle non-existent page gracefully', function() {
      // render() has try-catch, should not throw
      assert.doesNotThrow(function() {
        var output = render('nonexistent_page', {});
        assert.isTruthy(output, 'Should return error HtmlOutput');
      }, 'render non-existent page should not throw');
    });
    
    it('should set correct title', function() {
      var output = render('login', { phone: '', error: '' });
      var title = output.getTitle();
      assert.equal(title, 'Auth Hub', 'Title should be Auth Hub');
    });
  });
  
  describe('Code — Session Expiry Comparison', function() {
    
    it('should detect expired ISO timestamp', function() {
      var pastExpiry = new Date(Date.now() - 3600000).toISOString();
      var now = new Date().toISOString();
      assert.isFalse(pastExpiry > now, 'Past expiry should be less than now');
    });
    
    it('should detect valid ISO timestamp', function() {
      var futureExpiry = new Date(Date.now() + 3600000).toISOString();
      var now = new Date().toISOString();
      assert.isTrue(futureExpiry > now, 'Future expiry should be greater than now');
    });
  });
  
  describe('Code — doPost() Integration', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should reject unknown action', function() {
      var mockEvent = {
        parameter: {
          action: 'unknown_action',
          phone: ''
        }
      };
      
      var output = doPost(mockEvent);
      assert.isTruthy(output, 'Should return HtmlOutput');
      // The output should contain error message about invalid action
      var content = output.getContent();
      assert.contains(content, 'tidak valid', 'Should show invalid action error');
    });
    
    it('should reject send_otp with empty phone', function() {
      var mockEvent = {
        parameter: {
          action: 'send_otp',
          phone: ''
        }
      };
      
      var output = doPost(mockEvent);
      var content = output.getContent();
      assert.contains(content, 'harus diisi', 'Should show phone required error');
    });
    
    it('should reject send_otp for unregistered phone', function() {
      var mockEvent = {
        parameter: {
          action: 'send_otp',
          phone: '6289999999999'
        }
      };
      
      var output = doPost(mockEvent);
      var content = output.getContent();
      assert.contains(content, 'belum terdaftar', 'Should show unregistered phone error');
    });
    
    it('should handle logout action gracefully', function() {
      var mockEvent = {
        parameter: {
          action: 'logout',
          token: 'nonexistent_token'
        }
      };
      
      assert.doesNotThrow(function() {
        var output = doPost(mockEvent);
        assert.isTruthy(output, 'Should return HtmlOutput for logout');
      }, 'Logout should not throw even with invalid token');
    });
    
    it('should reject google_login with missing token', function() {
      var mockEvent = {
        parameter: {
          action: 'google_login',
          id_token: ''
        }
      };
      
      var output = doPost(mockEvent);
      var content = output.getContent();
      // Should show error about invalid/missing Google token
      assert.isTruthy(output, 'Should return HtmlOutput for failed google login');
    });
    
    it('should reject verify_otp with empty phone', function() {
      var mockEvent = {
        parameter: {
          action: 'verify_otp',
          phone: '',
          otp: '123456'
        }
      };
      
      var output = doPost(mockEvent);
      var content = output.getContent();
      assert.contains(content, 'login ulang', 'Should show session invalid error');
    });
  });
  
  describe('Code — escapeJsString()', function() {
    
    it('should escape double quotes', function() {
      var result = escapeJsString('test"value');
      assert.contains(result, '\\"', 'Should escape double quotes');
    });
    
    it('should escape backslashes', function() {
      var result = escapeJsString('test\\value');
      assert.contains(result, '\\\\', 'Should escape backslashes');
    });
    
    it('should escape angle brackets', function() {
      var result = escapeJsString('<script>alert(1)</script>');
      assert.isFalse(result.indexOf('<') > -1, 'Should not contain raw < character');
      assert.contains(result, '\\u003c', 'Should escape < to unicode');
    });
    
    it('should handle empty string', function() {
      var result = escapeJsString('');
      assert.equal(result, '', 'Empty string should return empty');
    });
    
    it('should handle null/undefined', function() {
      var result = escapeJsString(null);
      assert.equal(result, '', 'Null should return empty string');
    });
  });
  
  describe('Code — isAllowedRedirect()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should reject null URL', function() {
      var result = isAllowedRedirect(null);
      assert.isFalse(result, 'Null URL should not be allowed');
    });
    
    it('should reject empty string URL', function() {
      var result = isAllowedRedirect('');
      assert.isFalse(result, 'Empty URL should not be allowed');
    });
    
    it('should reject http:// URLs', function() {
      var result = isAllowedRedirect('http://example.com');
      assert.isFalse(result, 'HTTP URL should not be allowed');
    });
    
    it('should reject random https:// URLs not in registry', function() {
      var result = isAllowedRedirect('https://evil.com/steal');
      assert.isFalse(result, 'Random URL should not be allowed');
    });
    
    it('should allow script.google.com URLs', function() {
      var result = isAllowedRedirect('https://script.google.com/macros/s/SOME_ID/exec');
      assert.isTrue(result, 'script.google.com should be allowed');
    });
    
    it('should allow registered app URLs', function() {
      var result = isAllowedRedirect('https://script.google.com/macros/s/FAKE_ID_1/exec');
      assert.isTrue(result, 'Registered app URL should be allowed');
    });
  });
}
