/**
 * @file Test_AuditLog.gs
 * @description Test suite untuk AuditLog.gs
 */

function testSuite_AuditLog() {
  
  describe('AuditLog — logAuditEvent()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should log event to audit sheet', function() {
      logAuditEvent('LOGIN_SUCCESS', { email: 'test@test.com', method: 'google', detail: 'Test login' });
      
      var sheet = SpreadsheetApp.openById(getTestSheetId()).getSheetByName('audit_log');
      var data = sheet.getDataRange().getValues();
      
      // Baris 0 = header, baris 1 = data yang baru dilog
      assert.isTrue(data.length >= 2, 'Should have at least 1 data row');
      assert.equal(data[1][1], 'LOGIN_SUCCESS', 'Event should match');
      assert.equal(data[1][2], 'test@test.com', 'Email should match');
    });
    
    it('should handle null data gracefully', function() {
      assert.doesNotThrow(function() {
        logAuditEvent('TEST_EVENT', null);
      }, 'Should not throw for null data');
    });
    
    it('should handle empty data object', function() {
      assert.doesNotThrow(function() {
        logAuditEvent('TEST_EVENT', {});
      }, 'Should not throw for empty data');
    });
    
    it('should include ISO timestamp', function() {
      logAuditEvent('TIMESTAMP_TEST', { detail: 'check timestamp' });
      
      var sheet = SpreadsheetApp.openById(getTestSheetId()).getSheetByName('audit_log');
      var data = sheet.getDataRange().getValues();
      var lastRow = data[data.length - 1];
      
      // Timestamp should be ISO format
      assert.isTrue(lastRow[0].toString().indexOf('T') > -1, 'Timestamp should be ISO format');
    });
  });
  
  describe('AuditLog — cleanOldAuditLogs()', function() {
    
    beforeEach(function() {
      setupTestEnvironment();
    });
    
    afterEach(function() {
      teardownTestEnvironment();
    });
    
    it('should delete logs older than 90 days', function() {
      var sheet = SpreadsheetApp.openById(getTestSheetId()).getSheetByName('audit_log');
      
      // Insert old log (91 days ago)
      var oldDate = new Date(Date.now() - (91 * 24 * 60 * 60 * 1000)).toISOString();
      sheet.appendRow([oldDate, 'OLD_EVENT', 'old@test.com', '', 'google', 'old log']);
      
      // Insert recent log
      var recentDate = new Date().toISOString();
      sheet.appendRow([recentDate, 'RECENT_EVENT', 'recent@test.com', '', 'google', 'recent log']);
      
      var deleted = cleanOldAuditLogs();
      assert.greaterThan(deleted, 0, 'Should delete at least 1 old log');
      
      // Recent log should survive
      var data = sheet.getDataRange().getValues();
      var recentExists = false;
      for (var i = 1; i < data.length; i++) {
        if (data[i][1] === 'RECENT_EVENT') recentExists = true;
      }
      assert.isTrue(recentExists, 'Recent log should survive cleanup');
    });
    
    it('should return 0 when no old logs exist', function() {
      // Sheet is fresh from setup, no old logs
      var deleted = cleanOldAuditLogs();
      assert.equal(deleted, 0, 'Should return 0 when nothing to clean');
    });
  });
}
