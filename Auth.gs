/**
 * @file Auth.gs
 * @description Modul integrasi Auth/OTP menggunakan API Gowa dengan keamanan yang ditingkatkan.
 * Menerapkan hashing, expiry, rate limiting, dan pembatasan percobaan.
 */

/**
 * Mengambil OTP_SECRET_PEPPER dari ScriptProperties.
 * Pastikan property ini sudah dikonfigurasi sebelum deploy.
 */
function getOtpPepper() {
  const pepper = PropertiesService.getScriptProperties().getProperty('OTP_SECRET_PEPPER');
  if (!pepper) {
    throw new Error('OTP_SECRET_PEPPER belum dikonfigurasi di Script Properties.');
  }
  return pepper;
}

/**
 * Konfigurasi API Key dan Endpoint Gowa.
 */
function getGowaConfig() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GOWA_API_KEY');
  
  if (!apiKey || !apiKey.includes(':')) {
    console.warn("GOWA_API_KEY tidak ditemukan atau formatnya tidak valid (harus username:password)");
  }

  return {
    API_KEY: apiKey || '',
    BASE_URL: 'https://wa.dimanaaja.biz.id',
    SENDER_ID: 'GOWA_AUTH'
  };
}

/**
 * Membuat hash SHA-256 dari string input
 */
function generateHash(input) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) {
      hashVal += 256;
    }
    if (hashVal.toString(16).length == 1) {
      txtHash += '0';
    }
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

/**
 * Mengirim OTP ke nomor HP dengan implementasi Rate Limiting dan Hashing.
 * @param {string} phoneNumber - Format internasional (misal: 62812345678).
 * @returns {Object} {success: boolean, message: string}
 */
function sendOtp(phoneNumber) {
  const scriptProps = PropertiesService.getScriptProperties();
  const propKey = `OTP_DATA_${phoneNumber}`;
  const existingDataStr = scriptProps.getProperty(propKey);
  const now = new Date().getTime();

  let otpData = {
    codeHash: '',
    createdAt: now,
    expiresAt: now + (5 * 60 * 1000), // Expired dalam 5 menit
    attempts: 0,
    lastSentAt: now,
    sendCount: 1 // Hitung berapa kali OTP dikirim dalam sesi ini
  };

  // Implementasi Rate Limiting & Proteksi Resend
  if (existingDataStr) {
    const existingData = JSON.parse(existingDataStr);
    
    // Cek cooldown resend (minimal 60 detik)
    if (now - existingData.lastSentAt < 60000) {
      const waitTime = Math.ceil((60000 - (now - existingData.lastSentAt)) / 1000);
      return { success: false, message: `Tunggu ${waitTime} detik lagi sebelum meminta OTP baru.` };
    }

    // Cek batas maksimum kirim (misal: 3 kali per 15 menit)
    if (existingData.sendCount >= 3 && now < existingData.createdAt + (15 * 60 * 1000)) {
      return { success: false, message: 'Batas permintaan OTP tercapai. Silakan coba lagi setelah 15 menit.' };
    }

    // Jika lebih dari 15 menit sejak OTP pertama, reset counter
    if (now > existingData.createdAt + (15 * 60 * 1000)) {
      otpData.sendCount = 1;
    } else {
      otpData.sendCount = existingData.sendCount + 1;
      otpData.createdAt = existingData.createdAt; // Pertahankan waktu awal untuk window 15 menit
    }
  }

  // Generate OTP dan Hash
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpData.codeHash = generateHash(phoneNumber + otpCode + getOtpPepper());

  // Kirim via API GOWA
  const config = getGowaConfig();
  const url = `${config.BASE_URL}/send/message`; 
  const payload = {
    phone: phoneNumber,
    message: `Kode OTP Anda adalah: *${otpCode}*\n\nBerlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.`
  };

  try {
    if (!config.API_KEY) {
      throw new Error("GOWA_API_KEY belum dikonfigurasi dengan benar.");
    }

    const encodedAuth = Utilities.base64Encode(config.API_KEY);

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Basic ${encodedAuth}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 201) {
      // Simpan metadata OTP yang sudah di-hash (Bukan plain text)
      scriptProps.setProperty(propKey, JSON.stringify(otpData));
      return { success: true, message: 'OTP berhasil dikirim' };
    } else {
      console.error(`Gowa API Error [${responseCode}]: ${response.getContentText()}`);
      return { success: false, message: 'Gagal mengirim OTP dari server.' };
    }
  } catch (e) {
    console.error(`Error in sendOtp: ${e.message}`);
    return { success: false, message: 'Terjadi kesalahan sistem saat menghubungi layanan pengiriman.' };
  }
}

/**
 * Memverifikasi OTP dengan mengecek umur, limit percobaan, dan mencocokkan hash.
 * @param {string} phoneNumber - Nomor HP user.
 * @param {string} otp - Kode OTP yang dimasukkan user.
 * @returns {Object} {success: boolean, message: string}
 */
function verifyOtp(phoneNumber, otp) {
  const scriptProps = PropertiesService.getScriptProperties();
  const propKey = `OTP_DATA_${phoneNumber}`;
  const dataStr = scriptProps.getProperty(propKey);
  const now = new Date().getTime();

  if (!dataStr) {
    return { success: false, message: 'Sesi OTP tidak ditemukan atau sudah dibatalkan. Silakan minta ulang.' };
  }

  let otpData = JSON.parse(dataStr);

  // 1. Cek Kedaluwarsa
  if (now > otpData.expiresAt) {
    scriptProps.deleteProperty(propKey);
    return { success: false, message: 'Kode OTP sudah kadaluwarsa (lebih dari 5 menit).' };
  }

  // 2. Cek Batas Percobaan
  if (otpData.attempts >= 5) {
    scriptProps.deleteProperty(propKey);
    return { success: false, message: 'Terlalu banyak percobaan salah. Sesi OTP dibatalkan demi keamanan.' };
  }

  // Update jumlah percobaan
  otpData.attempts += 1;
  scriptProps.setProperty(propKey, JSON.stringify(otpData));

  // 3. Verifikasi Hash
  const inputHash = generateHash(phoneNumber + otp + getOtpPepper());
  
  if (inputHash === otpData.codeHash) {
    // Sukses, bersihkan data OTP
    scriptProps.deleteProperty(propKey);
    return { success: true, message: 'Verifikasi berhasil' };
  } else {
    return { success: false, message: `Kode OTP salah. Sisa percobaan: ${5 - otpData.attempts}` };
  }
}