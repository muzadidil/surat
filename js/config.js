// ============================================================
//  Client ID Google — dipakai HANYA untuk fitur cadangan ke
//  Google Drive. Aplikasi tetap jalan penuh tanpa ini; tombol
//  cadangan ke Drive saja yang tidak aktif.
//
//  Cara mendapatkannya:
//  1. console.cloud.google.com → buat project
//  2. APIs & Services → Library → aktifkan "Google Drive API"
//  3. OAuth consent screen → External → isi nama & email
//  4. Credentials → Create Credentials → OAuth client ID
//     → Application type: Web application
//     → Authorized JavaScript origins:
//          https://surat.zasha.online
//          http://localhost:8777      (untuk mencoba di komputer sendiri)
//  5. Salin Client ID-nya ke bawah ini.
//
//  Client ID bukan rahasia — memang dirancang untuk terlihat di
//  kode halaman. Yang rahasia adalah Client Secret, dan itu tidak
//  dipakai sama sekali di sini.
// ============================================================

export const GOOGLE_CLIENT_ID = "";
