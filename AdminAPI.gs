/**
 * @file AdminAPI.gs
 * @description Backend API untuk admin panel CRUD.
 * Hanya bisa diakses oleh user dengan role 'admin'.
 * 
 * Semua fungsi menerima session token untuk validasi admin.
 */

// ============ VALID ROLES ============

var VALID_ROLES = ['admin', 'kepsek', 'guru', 'orangtua', 'siswa'];

// ============ AUTH CHECK ============

/**
 * Validasi bahwa token milik session admin yang aktif.
 * @param {string} token - Session token
 * @returns {Object} { authorized, message, session }
 */
function requireAdmin(token) {
  if (!token) return { authorized: false, message: 'Token tidak diberikan.' };

  var session = validateSession(token);
  if (!session.valid) return { authorized: false, message: 'Session tidak valid.' };
  if (String(session.role).toLowerCase() !== 'admin') return { authorized: false, message: 'Akses ditolak. Hanya admin.' };
  return { authorized: true, session: session };
}

// ============ USER CRUD ============

/**
 * Ambil semua data user dari tab 'users'.
 * @param {string} token - Admin session token
 * @returns {Object} { success, users } atau { authorized: false, message }
 */
function adminGetUsers(token) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('users');
    if (!sheet) return { success: false, message: 'Sheet "users" tidak ditemukan.' };

    var data = sheet.getDataRange().getValues();
    var users = [];
    for (var i = 1; i < data.length; i++) {
      users.push({
        email: String(data[i][0] || '').trim(),
        phone: String(data[i][1] || '').trim(),
        nama: String(data[i][2] || '').trim(),
        role: String(data[i][3] || '').trim(),
        status: String(data[i][4] || '').trim(),
        ditambahkan_oleh: String(data[i][5] || '').trim(),
        tanggal: String(data[i][6] || '').trim(),
        kelas: String(data[i][7] || '').trim(),
        apps: String(data[i][8] || '').trim()
      });
    }
    return { success: true, users: users };
  } catch (e) {
    return { success: false, message: 'Gagal membaca data user: ' + e.message };
  }
}

/**
 * Tambah user baru ke tab 'users'.
 * @param {string} token - Admin session token
 * @param {Object} userData - { email, phone, nama, role, status, kelas, apps }
 * @returns {Object} { success, message }
 */
function adminAddUser(token, userData) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  if (!userData || !userData.email || !userData.email.trim()) {
    return { success: false, message: 'Email wajib diisi.' };
  }
  if (!userData.role || !userData.role.trim()) {
    return { success: false, message: 'Role wajib diisi.' };
  }

  var role = userData.role.trim().toLowerCase();
  if (VALID_ROLES.indexOf(role) === -1) {
    return { success: false, message: 'Role tidak valid. Pilih salah satu: ' + VALID_ROLES.join(', ') };
  }

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('users');
    if (!sheet) return { success: false, message: 'Sheet "users" tidak ditemukan.' };

    var email = userData.email.trim().toLowerCase();

    // Cek duplikasi email
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === email) {
        return { success: false, message: 'Email sudah terdaftar.' };
      }
    }

    sheet.appendRow([
      email,
      (userData.phone || '').trim(),
      (userData.nama || '').trim(),
      role,
      (userData.status || 'active').trim(),
      auth.session.email,
      new Date().toISOString().split('T')[0],
      (userData.kelas || '').trim(),
      (userData.apps || '').trim()
    ]);

    logAuditEvent('USER_ADDED', {
      email: auth.session.email,
      detail: 'Added user: ' + email + ' with role: ' + role
    });

    return { success: true, message: 'User ' + email + ' berhasil ditambahkan.' };
  } catch (e) {
    return { success: false, message: 'Gagal menambah user: ' + e.message };
  }
}

/**
 * Update data user berdasarkan email.
 * @param {string} token - Admin session token
 * @param {string} email - Email user yang akan diupdate
 * @param {Object} updates - Field yang akan diupdate (phone, nama, role, status, kelas, apps)
 * @returns {Object} { success, message }
 */
function adminUpdateUser(token, email, updates) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  if (!email || !email.trim()) {
    return { success: false, message: 'Email target wajib diisi.' };
  }
  if (!updates || typeof updates !== 'object') {
    return { success: false, message: 'Data update tidak valid.' };
  }

  // Jangan izinkan update email (primary key)
  if ('email' in updates) {
    return { success: false, message: 'Email tidak boleh diubah (primary key).' };
  }

  // Validasi role jika di-update
  if (updates.role) {
    var newRole = updates.role.trim().toLowerCase();
    if (VALID_ROLES.indexOf(newRole) === -1) {
      return { success: false, message: 'Role tidak valid. Pilih salah satu: ' + VALID_ROLES.join(', ') };
    }
  }

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('users');
    if (!sheet) return { success: false, message: 'Sheet "users" tidak ditemukan.' };

    var data = sheet.getDataRange().getValues();
    var targetEmail = email.trim().toLowerCase();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === targetEmail) {
        // Column mapping: B=phone(2), C=nama(3), D=role(4), E=status(5), H=kelas(8), I=apps(9)
        if ('phone' in updates) sheet.getRange(i + 1, 2).setValue(updates.phone);
        if ('nama' in updates) sheet.getRange(i + 1, 3).setValue(updates.nama);
        if ('role' in updates) sheet.getRange(i + 1, 4).setValue(updates.role.trim().toLowerCase());
        if ('status' in updates) sheet.getRange(i + 1, 5).setValue(updates.status);
        if ('kelas' in updates) sheet.getRange(i + 1, 8).setValue(updates.kelas);
        if ('apps' in updates) sheet.getRange(i + 1, 9).setValue(updates.apps);

        logAuditEvent('USER_UPDATED', {
          email: auth.session.email,
          detail: 'Updated user: ' + targetEmail + ' fields: ' + Object.keys(updates).join(',')
        });

        return { success: true, message: 'User ' + targetEmail + ' berhasil diupdate.' };
      }
    }

    return { success: false, message: 'User dengan email ' + targetEmail + ' tidak ditemukan.' };
  } catch (e) {
    return { success: false, message: 'Gagal mengupdate user: ' + e.message };
  }
}

/**
 * Hapus user berdasarkan email.
 * @param {string} token - Admin session token
 * @param {string} email - Email user yang akan dihapus
 * @returns {Object} { success, message }
 */
function adminDeleteUser(token, email) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  if (!email || !email.trim()) {
    return { success: false, message: 'Email target wajib diisi.' };
  }

  var targetEmail = email.trim().toLowerCase();

  // Jangan izinkan delete diri sendiri
  if (targetEmail === auth.session.email.toLowerCase()) {
    return { success: false, message: 'Tidak boleh menghapus akun sendiri.' };
  }

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('users');
    if (!sheet) return { success: false, message: 'Sheet "users" tidak ditemukan.' };

    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === targetEmail) {
        sheet.deleteRow(i + 1);

        logAuditEvent('USER_DELETED', {
          email: auth.session.email,
          detail: 'Deleted user: ' + targetEmail
        });

        return { success: true, message: 'User ' + targetEmail + ' berhasil dihapus.' };
      }
    }

    return { success: false, message: 'User dengan email ' + targetEmail + ' tidak ditemukan.' };
  } catch (e) {
    return { success: false, message: 'Gagal menghapus user: ' + e.message };
  }
}

// ============ APP CRUD ============

/**
 * Ambil semua data app dari tab 'apps'.
 * @param {string} token - Admin session token
 * @returns {Object} { success, apps } atau { authorized: false, message }
 */
function adminGetApps(token) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('apps');
    if (!sheet) return { success: false, message: 'Sheet "apps" tidak ditemukan.' };

    var data = sheet.getDataRange().getValues();
    var apps = [];
    for (var i = 1; i < data.length; i++) {
      apps.push({
        id: String(data[i][0] || '').trim(),
        name: String(data[i][1] || '').trim(),
        url: String(data[i][2] || '').trim(),
        icon: String(data[i][3] || '').trim(),
        description: String(data[i][4] || '').trim(),
        allowedRoles: String(data[i][5] || '').trim(),
        status: String(data[i][6] || '').trim(),
        category: String(data[i][7] || '').trim()
      });
    }
    return { success: true, apps: apps };
  } catch (e) {
    return { success: false, message: 'Gagal membaca data apps: ' + e.message };
  }
}

/**
 * Tambah app baru ke tab 'apps'.
 * @param {string} token - Admin session token
 * @param {Object} appData - { id, name, url, icon, description, allowedRoles, status, category }
 * @returns {Object} { success, message }
 */
function adminAddApp(token, appData) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  if (!appData || !appData.id || !appData.id.trim()) {
    return { success: false, message: 'App ID wajib diisi.' };
  }
  if (!appData.name || !appData.name.trim()) {
    return { success: false, message: 'App name wajib diisi.' };
  }

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('apps');
    if (!sheet) return { success: false, message: 'Sheet "apps" tidak ditemukan.' };

    var appId = appData.id.trim();

    // Cek duplikasi id
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === appId.toLowerCase()) {
        return { success: false, message: 'App ID sudah terdaftar.' };
      }
    }

    sheet.appendRow([
      appId,
      appData.name.trim(),
      (appData.url || '').trim(),
      (appData.icon || '').trim(),
      (appData.description || '').trim(),
      (appData.allowedRoles || '').trim(),
      (appData.status || 'active').trim(),
      (appData.category || 'umum').trim()
    ]);

    logAuditEvent('APP_ADDED', {
      email: auth.session.email,
      detail: 'Added app: ' + appId + ' (' + appData.name.trim() + ')'
    });

    return { success: true, message: 'App ' + appId + ' berhasil ditambahkan.' };
  } catch (e) {
    return { success: false, message: 'Gagal menambah app: ' + e.message };
  }
}

/**
 * Update data app berdasarkan id.
 * @param {string} token - Admin session token
 * @param {string} appId - App ID yang akan diupdate
 * @param {Object} updates - Field yang akan diupdate (name, url, icon, description, allowedRoles, status, category)
 * @returns {Object} { success, message }
 */
function adminUpdateApp(token, appId, updates) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  if (!appId || !appId.trim()) {
    return { success: false, message: 'App ID target wajib diisi.' };
  }
  if (!updates || typeof updates !== 'object') {
    return { success: false, message: 'Data update tidak valid.' };
  }

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('apps');
    if (!sheet) return { success: false, message: 'Sheet "apps" tidak ditemukan.' };

    var data = sheet.getDataRange().getValues();
    var targetId = appId.trim().toLowerCase();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === targetId) {
        // Column mapping: B=name(2), C=url(3), D=icon(4), E=description(5), F=allowedRoles(6), G=status(7), H=category(8)
        if ('name' in updates) sheet.getRange(i + 1, 2).setValue(updates.name);
        if ('url' in updates) sheet.getRange(i + 1, 3).setValue(updates.url);
        if ('icon' in updates) sheet.getRange(i + 1, 4).setValue(updates.icon);
        if ('description' in updates) sheet.getRange(i + 1, 5).setValue(updates.description);
        if ('allowedRoles' in updates) sheet.getRange(i + 1, 6).setValue(updates.allowedRoles);
        if ('status' in updates) sheet.getRange(i + 1, 7).setValue(updates.status);
        if ('category' in updates) sheet.getRange(i + 1, 8).setValue(updates.category);

        logAuditEvent('APP_UPDATED', {
          email: auth.session.email,
          detail: 'Updated app: ' + targetId + ' fields: ' + Object.keys(updates).join(',')
        });

        return { success: true, message: 'App ' + targetId + ' berhasil diupdate.' };
      }
    }

    return { success: false, message: 'App dengan ID ' + targetId + ' tidak ditemukan.' };
  } catch (e) {
    return { success: false, message: 'Gagal mengupdate app: ' + e.message };
  }
}

/**
 * Hapus app berdasarkan id.
 * @param {string} token - Admin session token
 * @param {string} appId - App ID yang akan dihapus
 * @returns {Object} { success, message }
 */
function adminDeleteApp(token, appId) {
  var auth = requireAdmin(token);
  if (!auth.authorized) return auth;

  if (!appId || !appId.trim()) {
    return { success: false, message: 'App ID target wajib diisi.' };
  }

  try {
    var sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('apps');
    if (!sheet) return { success: false, message: 'Sheet "apps" tidak ditemukan.' };

    var data = sheet.getDataRange().getValues();
    var targetId = appId.trim().toLowerCase();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === targetId) {
        sheet.deleteRow(i + 1);

        logAuditEvent('APP_DELETED', {
          email: auth.session.email,
          detail: 'Deleted app: ' + targetId
        });

        return { success: true, message: 'App ' + targetId + ' berhasil dihapus.' };
      }
    }

    return { success: false, message: 'App dengan ID ' + targetId + ' tidak ditemukan.' };
  } catch (e) {
    return { success: false, message: 'Gagal menghapus app: ' + e.message };
  }
}
