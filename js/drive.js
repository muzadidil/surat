import { GOOGLE_CLIENT_ID } from './config.js?v=2';

/* ============================================================
   CADANGAN KE GOOGLE DRIVE

   Memakai izin "drive.file" saja — aplikasi hanya bisa melihat
   dan mengubah berkas yang dibuatnya sendiri. Isi Drive desa
   yang lain tidak pernah terbaca. Izin ini juga tidak termasuk
   kategori sensitif di Google, jadi tidak perlu proses verifikasi
   aplikasi yang panjang.

   Cadangan masuk ke Drive milik desa yang login, bukan ke
   penyedia aplikasi.
   ============================================================ */

const IZIN = 'https://www.googleapis.com/auth/drive.file';
const AWALAN = 'cadangan-surat-desa';

export const siapDipakai = () => !!GOOGLE_CLIENT_ID;

let token = null;
let kedaluwarsa = 0;

function tungguGIS() {
  return new Promise((selesai, gagal) => {
    if (window.google?.accounts?.oauth2) return selesai();
    let sisa = 40;                                   // ~10 detik
    const jam = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(jam); selesai(); }
      else if (--sisa <= 0) {
        clearInterval(jam);
        gagal(new Error('Pustaka Google tidak bisa dimuat. Periksa sambungan internet.'));
      }
    }, 250);
  });
}

/** Minta izin ke Google. Jendela izin hanya muncul saat token habis. */
async function ambilToken() {
  if (token && Date.now() < kedaluwarsa) return token;
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Client ID Google belum diisi di js/config.js.');
  }
  await tungguGIS();

  return new Promise((selesai, gagal) => {
    const klien = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: IZIN,
      callback: resp => {
        if (resp.error) return gagal(new Error('Izin Google ditolak.'));
        token = resp.access_token;
        // Dipotong 60 detik supaya tidak terpakai tepat saat kedaluwarsa.
        kedaluwarsa = Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000;
        selesai(token);
      },
      error_callback: () => gagal(new Error('Jendela izin Google ditutup.'))
    });
    klien.requestAccessToken();
  });
}

async function panggil(url, opsi = {}) {
  const t = await ambilToken();
  const r = await fetch(url, {
    ...opsi,
    headers: { ...(opsi.headers || {}), Authorization: 'Bearer ' + t }
  });
  if (!r.ok) {
    if (r.status === 401) { token = null; kedaluwarsa = 0; }
    throw new Error(`Google Drive menolak (${r.status}). Coba ulangi.`);
  }
  return r;
}

/** Unggah satu berkas cadangan baru ke Drive desa. */
export async function unggah(isi) {
  const nama = `${AWALAN}-${new Date().toISOString().slice(0, 10)}.json`;
  const batas = '-------surat' + Date.now();

  const badan =
    `--${batas}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name: nama, mimeType: 'application/json' }) +
    `\r\n--${batas}\r\nContent-Type: application/json\r\n\r\n` +
    JSON.stringify(isi) +
    `\r\n--${batas}--`;

  const r = await panggil(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${batas}` }, body: badan }
  );
  return r.json();
}

/** Daftar cadangan yang pernah dibuat aplikasi ini. */
export async function daftar() {
  const q = encodeURIComponent(`name contains '${AWALAN}' and trashed = false`);
  const r = await panggil(
    `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,modifiedTime,size)`
  );
  const j = await r.json();
  return j.files || [];
}

export async function unduh(id) {
  const r = await panggil(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  return r.json();
}
