/**
 * @file TestFramework.gs
 * @description Framework testing ringan untuk Google Apps Script.
 * Jalankan runAllTests() dari GAS editor untuk eksekusi semua test.
 * 
 * PENTING: File ini dan semua file Test_*.gs TERPISAH dari kode aplikasi.
 * Tidak mempengaruhi fungsi aplikasi — hanya dijalankan manual dari editor.
 */

// ============ STATE ============
var _testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  suites: []
};

var _currentSuite = '';
var _beforeEachFn = null;
var _afterEachFn = null;

// ============ FRAMEWORK FUNCTIONS ============

/**
 * Mendefinisikan test suite (grup test).
 * @param {string} name - Nama suite
 * @param {Function} fn - Fungsi berisi it() calls
 */
function describe(name, fn) {
  _currentSuite = name;
  _beforeEachFn = null;
  _afterEachFn = null;
  
  var suiteResult = { name: name, tests: [], passed: 0, failed: 0 };
  _testResults.suites.push(suiteResult);
  
  Logger.log('');
  Logger.log('━━━ ' + name + ' ━━━');
  
  try {
    fn();
  } catch (e) {
    Logger.log('  SUITE ERROR: ' + e.message);
    suiteResult.tests.push({ name: 'SUITE_ERROR', passed: false, error: e.message });
    _testResults.failed++;
    _testResults.total++;
  }
  
  suiteResult.passed = suiteResult.tests.filter(function(t) { return t.passed; }).length;
  suiteResult.failed = suiteResult.tests.filter(function(t) { return !t.passed; }).length;
  
  _currentSuite = '';
  _beforeEachFn = null;
  _afterEachFn = null;
}

/**
 * Mendefinisikan satu test case.
 * @param {string} name - Deskripsi test
 * @param {Function} fn - Fungsi test (gunakan assert di dalamnya)
 */
function it(name, fn) {
  _testResults.total++;
  var testResult = { name: name, passed: true, error: null };
  
  var afterEachRan = false;
  try {
    if (_beforeEachFn) _beforeEachFn();
    fn();
    if (_afterEachFn) { _afterEachFn(); afterEachRan = true; }
    
    _testResults.passed++;
    Logger.log('  PASS: ' + name);
  } catch (e) {
    testResult.passed = false;
    testResult.error = e.message;
    _testResults.failed++;
    _testResults.errors.push(_currentSuite + ' > ' + name + ': ' + e.message);
    Logger.log('  FAIL: ' + name);
    Logger.log('        Reason: ' + e.message);
  }
  
  if (_afterEachFn && !afterEachRan) {
    try { _afterEachFn(); } catch (cleanupErr) { /* ignore */ }
  }
  
  // Tambahkan ke suite terakhir
  var lastSuite = _testResults.suites[_testResults.suites.length - 1];
  if (lastSuite) {
    lastSuite.tests.push(testResult);
  }
}

/**
 * Setup yang dijalankan sebelum setiap test case dalam suite.
 */
function beforeEach(fn) {
  _beforeEachFn = fn;
}

/**
 * Cleanup yang dijalankan setelah setiap test case dalam suite.
 */
function afterEach(fn) {
  _afterEachFn = fn;
}

// ============ ASSERTIONS ============

var assert = {
  equal: function(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error((msg || 'assertEqual') + ' — Expected: ' + JSON.stringify(expected) + ', Got: ' + JSON.stringify(actual));
    }
  },
  
  notEqual: function(actual, expected, msg) {
    if (actual === expected) {
      throw new Error((msg || 'assertNotEqual') + ' — Expected NOT: ' + JSON.stringify(expected) + ', Got: ' + JSON.stringify(actual));
    }
  },
  
  isTrue: function(value, msg) {
    if (value !== true) {
      throw new Error((msg || 'assertTrue') + ' — Expected true, Got: ' + JSON.stringify(value));
    }
  },
  
  isFalse: function(value, msg) {
    if (value !== false) {
      throw new Error((msg || 'assertFalse') + ' — Expected false, Got: ' + JSON.stringify(value));
    }
  },
  
  isTruthy: function(value, msg) {
    if (!value) {
      throw new Error((msg || 'assertTruthy') + ' — Expected truthy, Got: ' + JSON.stringify(value));
    }
  },
  
  isFalsy: function(value, msg) {
    if (value) {
      throw new Error((msg || 'assertFalsy') + ' — Expected falsy, Got: ' + JSON.stringify(value));
    }
  },
  
  contains: function(str, substring, msg) {
    if (typeof str !== 'string' || str.indexOf(substring) === -1) {
      throw new Error((msg || 'assertContains') + ' — "' + str + '" does not contain "' + substring + '"');
    }
  },
  
  isType: function(value, type, msg) {
    if (typeof value !== type) {
      throw new Error((msg || 'assertType') + ' — Expected type: ' + type + ', Got: ' + typeof value);
    }
  },
  
  throws: function(fn, msg) {
    var threw = false;
    try { fn(); } catch (e) { threw = true; }
    if (!threw) {
      throw new Error((msg || 'assertThrows') + ' — Expected function to throw, but it did not');
    }
  },
  
  doesNotThrow: function(fn, msg) {
    try { fn(); } catch (e) {
      throw new Error((msg || 'assertDoesNotThrow') + ' — Expected no throw, but got: ' + e.message);
    }
  },
  
  greaterThan: function(actual, expected, msg) {
    if (actual <= expected) {
      throw new Error((msg || 'assertGreaterThan') + ' — Expected ' + actual + ' > ' + expected);
    }
  },
  
  lengthOf: function(arr, len, msg) {
    if (!arr || arr.length !== len) {
      throw new Error((msg || 'assertLength') + ' — Expected length: ' + len + ', Got: ' + (arr ? arr.length : 'null'));
    }
  }
};

// ============ RUNNER ============

/**
 * Jalankan SEMUA test suite. Panggil fungsi ini dari GAS editor.
 */
function runAllTests() {
  // Reset state
  _testResults = { total: 0, passed: 0, failed: 0, errors: [], suites: [] };
  
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║     AUTH HUB — AUTOMATED TESTS       ║');
  Logger.log('║     ' + new Date().toISOString() + '  ║');
  Logger.log('╚══════════════════════════════════════╝');
  
  // Jalankan semua test suite
  testSuite_Auth();
  testSuite_Session();
  testSuite_UserWhitelist();
  testSuite_GoogleAuth();
  testSuite_AppRegistry();
  testSuite_AuditLog();
  testSuite_Code();
  testSuite_AuthLib();
  testSuite_MultiRole();
  testSuite_AdminAPI();
  testSuite_SessionIntegration();
  
  // Print summary
  Logger.log('');
  Logger.log('╔══════════════════════════════════════╗');
  Logger.log('║            TEST SUMMARY              ║');
  Logger.log('╠══════════════════════════════════════╣');
  Logger.log('║  Total  : ' + padRight(_testResults.total.toString(), 26) + '║');
  Logger.log('║  Passed : ' + padRight(_testResults.passed.toString(), 26) + '║');
  Logger.log('║  Failed : ' + padRight(_testResults.failed.toString(), 26) + '║');
  Logger.log('╠══════════════════════════════════════╣');
  
  for (var s = 0; s < _testResults.suites.length; s++) {
    var suite = _testResults.suites[s];
    var status = suite.failed === 0 ? 'PASS' : 'FAIL';
    Logger.log('║  ' + padRight(status + ' ' + suite.name + ' (' + suite.passed + '/' + (suite.passed + suite.failed) + ')', 36) + '║');
  }
  
  Logger.log('╠══════════════════════════════════════╣');
  
  if (_testResults.failed === 0) {
    Logger.log('║  RESULT: ALL TESTS PASSED            ║');
  } else {
    Logger.log('║  RESULT: ' + padRight(_testResults.failed + ' TEST(S) FAILED', 28) + '║');
    Logger.log('╠══════════════════════════════════════╣');
    for (var e = 0; e < _testResults.errors.length; e++) {
      Logger.log('║  ' + padRight(_testResults.errors[e].substring(0, 36), 36) + '║');
    }
  }
  
  Logger.log('╚══════════════════════════════════════╝');
  
  return _testResults;
}

function padRight(str, len) {
  while (str.length < len) str += ' ';
  return str.substring(0, len);
}
