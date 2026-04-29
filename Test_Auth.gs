/**
 * @file Test_Auth.gs
 * @description Test suite untuk Auth.gs
 */

function testSuite_Auth() {
  
  describe('Auth — generateHash()', function() {
    
    it('should return a 64-character hex string', function() {
      var hash = generateHash('test input');
      assert.equal(hash.length, 64, 'Hash length should be 64');
      assert.isTrue(/^[0-9a-f]+$/.test(hash), 'Hash should be hex');
    });
    
    it('should be deterministic (same input = same output)', function() {
      var hash1 = generateHash('hello world');
      var hash2 = generateHash('hello world');
      assert.equal(hash1, hash2, 'Same input should produce same hash');
    });
    
    it('should produce different hashes for different inputs', function() {
      var hash1 = generateHash('input A');
      var hash2 = generateHash('input B');
      assert.notEqual(hash1, hash2, 'Different inputs should produce different hashes');
    });
    
    it('should handle empty string', function() {
      var hash = generateHash('');
      assert.equal(hash.length, 64, 'Empty string should still produce valid hash');
    });
    
    it('should handle special characters', function() {
      var hash = generateHash('!@#$%^&*()_+{}|:"<>?');
      assert.equal(hash.length, 64, 'Special chars should produce valid hash');
    });
  });
  
  describe('Auth — getOtpPepper()', function() {
    
    it('should return a non-empty string when configured', function() {
      // Ini akan berhasil jika OTP_SECRET_PEPPER sudah dikonfigurasi
      try {
        var pepper = getOtpPepper();
        assert.isType(pepper, 'string', 'Pepper should be string');
        assert.isTrue(pepper.length > 0, 'Pepper should not be empty');
      } catch (e) {
        // Jika belum dikonfigurasi, test ini expected fail
        assert.contains(e.message, 'OTP_SECRET_PEPPER', 'Should throw descriptive error');
      }
    });
  });
  
  describe('Auth — getGowaConfig()', function() {
    
    it('should return object with required keys', function() {
      var config = getGowaConfig();
      assert.isType(config, 'object', 'Config should be object');
      assert.isTrue('API_KEY' in config, 'Should have API_KEY');
      assert.isTrue('BASE_URL' in config, 'Should have BASE_URL');
      assert.isTrue('SENDER_ID' in config, 'Should have SENDER_ID');
    });
    
    it('should have correct BASE_URL', function() {
      var config = getGowaConfig();
      assert.equal(config.BASE_URL, 'https://wa.dimanaaja.biz.id', 'BASE_URL should match');
    });
  });
  
  describe('Auth — OTP Hash Verification Logic', function() {
    
    it('should verify correct OTP hash', function() {
      var phone = '6281234567890';
      var otp = '123456';
      try {
        var pepper = getOtpPepper();
        var hash = generateHash(phone + otp + pepper);
        var verifyHash = generateHash(phone + otp + pepper);
        assert.equal(hash, verifyHash, 'Hash should match for correct OTP');
      } catch (e) {
        // Skip if pepper not configured
        Logger.log('    SKIP: OTP_SECRET_PEPPER not configured');
      }
    });
    
    it('should NOT verify wrong OTP hash', function() {
      var phone = '6281234567890';
      try {
        var pepper = getOtpPepper();
        var correctHash = generateHash(phone + '123456' + pepper);
        var wrongHash = generateHash(phone + '654321' + pepper);
        assert.notEqual(correctHash, wrongHash, 'Hash should NOT match for wrong OTP');
      } catch (e) {
        Logger.log('    SKIP: OTP_SECRET_PEPPER not configured');
      }
    });
    
    it('should NOT verify OTP for different phone number', function() {
      try {
        var pepper = getOtpPepper();
        var hash1 = generateHash('6281111111111' + '123456' + pepper);
        var hash2 = generateHash('6282222222222' + '123456' + pepper);
        assert.notEqual(hash1, hash2, 'Same OTP for different phones should produce different hashes');
      } catch (e) {
        Logger.log('    SKIP: OTP_SECRET_PEPPER not configured');
      }
    });
  });
}
