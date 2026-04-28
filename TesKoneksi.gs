/**
 * @file TestKoneksi.gs
 * @description Script khusus untuk menguji koneksi ke API Gowa.
 */

function testGowaConnection() {
  const config = getGowaConfig();

  // Menggunakan endpoint standar GOWA untuk cek koneksi/device
  const url = config.BASE_URL + '/app/devices'; 
  
  Logger.log('=== MEMULAI TEST KONEKSI KE GOWA ===');
  Logger.log('URL Target: ' + url);
  Logger.log('Kredensial (5 karakter pertama): ' + config.API_KEY.substring(0, 5) + '...');

  try {
    // KUNCI PERBAIKAN: Encode kredensial ke Base64 untuk Basic Auth
    const encodedAuth = Utilities.base64Encode(config.API_KEY);

    const response = UrlFetchApp.fetch(url, {
      method: 'get', 
      headers: {
        // Ganti Bearer menjadi Basic
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true 
    });

    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    Logger.log('HTTP Status Code: ' + responseCode);
    Logger.log('Response Body: ' + responseBody);

    // Analisa hasil balasan dari server Gowa
    if (responseCode >= 200 && responseCode < 300) {
      Logger.log('✅ KESIMPULAN: KONEKSI BERHASIL! API Key valid dan server merespon dengan baik.');
    } else if (responseCode === 401 || responseCode === 403) {
      Logger.log('❌ KESIMPULAN: KONEKSI TERHUBUNG, TAPI API KEY SALAH ATAU KADALUWARSA.');
    } else if (responseCode === 404) {
      Logger.log('⚠️ KESIMPULAN: Server terhubung, tapi Endpoint URL salah (404 Not Found). Cek BASE_URL.');
    } else {
      Logger.log('⚠️ KESIMPULAN: Terjadi error lain dari sisi server. Silakan cek pesan di Response Body.');
    }

  } catch (e) {
    Logger.log('🛑 KESIMPULAN: GAGAL TOTAL. Tidak bisa terhubung ke internet atau URL tidak valid.');
    Logger.log('Pesan Error Asli: ' + e.message);
  }
  
  Logger.log('=== TEST SELESAI ===');
}
