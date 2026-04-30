/**
 * @file UserWhitelist.gs
 * @description Modul pengecekan whitelist user dari Google Sheet.
 * Sheet harus memiliki sheet bernama 'users' dengan kolom:
 * A: email | B: phone | C: nama | D: role | E: status | F: ditambahkan_oleh | G: tanggal | H: kelas | I: apps
 */

/**
 * Mendapatkan Sheet ID dari Script Properties.
 * @returns {string} Sheet ID
 */
function getUsersSheetId() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('USERS_SHEET_ID');
  if (!sheetId) {
    throw new Error('USERS_SHEET_ID belum dikonfigurasi di Script Properties.');
  }
  return sheetId;
}

/**
 * Cek apakah email terdaftar dan aktif di whitelist.
 * @param {string} email - Email user dari Google Sign-In.
 * @returns {Object} { found, name, role, status, allowed, phone }
 */
function checkUserByEmail(email) {
  try {
    const sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('users');
    if (!sheet) return { found: false, allowed: false, message: 'Sheet "users" tidak ditemukan.' };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
        return {
          found: true,
          email: data[i][0].toString().trim(),
          phone: data[i][1].toString().trim(),
          name: data[i][2].toString().trim(),
          role: data[i][3].toString().trim(),
          status: data[i][4].toString().trim(),
          allowed: data[i][4].toString().trim().toLowerCase() === 'active',
          kelas: (data[i][7] || '').toString().trim(),
          apps: (data[i][8] || '').toString().trim()
        };
      }
    }
    return { found: false, allowed: false };
  } catch (e) {
    console.error('checkUserByEmail error: ' + e.message);
    return { found: false, allowed: false, message: 'Gagal mengakses data user: ' + e.message };
  }
}

/**
 * Cek apakah nomor telepon terdaftar dan aktif di whitelist.
 * @param {string} phone - Nomor telepon format 62xxx.
 * @returns {Object} { found, name, role, status, allowed, email }
 */
function checkUserByPhone(phone) {
  try {
    const sheet = SpreadsheetApp.openById(getUsersSheetId()).getSheetByName('users');
    if (!sheet) return { found: false, allowed: false, message: 'Sheet "users" tidak ditemukan.' };

    const data = sheet.getDataRange().getValues();
    // Normalisasi: hapus non-digit dari phone input
    const cleanInput = phone.replace(/\D/g, '');

    for (let i = 1; i < data.length; i++) {
      const sheetPhone = data[i][1].toString().replace(/\D/g, '');
      if (sheetPhone === cleanInput && cleanInput !== '') {
        return {
          found: true,
          email: data[i][0].toString().trim(),
          phone: sheetPhone,
          name: data[i][2].toString().trim(),
          role: data[i][3].toString().trim(),
          status: data[i][4].toString().trim(),
          allowed: data[i][4].toString().trim().toLowerCase() === 'active',
          kelas: (data[i][7] || '').toString().trim(),
          apps: (data[i][8] || '').toString().trim()
        };
      }
    }
    return { found: false, allowed: false };
  } catch (e) {
    console.error('checkUserByPhone error: ' + e.message);
    return { found: false, allowed: false, message: 'Gagal mengakses data user: ' + e.message };
  }
}
