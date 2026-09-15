/* ============================================================
   LAPISAN DATA
   Untuk sekarang data penduduk disimpan di IndexedDB — di dalam
   browser komputer desa itu sendiri, tidak dikirim ke mana pun.
   Alasannya: data 6.000+ NIK warga tidak boleh naik ke cloud
   sebelum sistem login dan pemisahan antar-desa benar-benar siap.
   Saat Firestore nanti dipasang, hanya berkas ini yang berubah.
   ============================================================ */

const DB_NAMA = 'surat_desa';
const DB_VERSI = 1;

let dbPromise = null;

function buka() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((selesai, gagal) => {
    const req = indexedDB.open(DB_NAMA, DB_VERSI);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('penduduk')) {
        const s = db.createObjectStore('penduduk', { keyPath: 'nik' });
        s.createIndex('nama', 'nama');
        s.createIndex('nkk', 'nkk');
      }
      if (!db.objectStoreNames.contains('pengaturan')) {
        db.createObjectStore('pengaturan', { keyPath: 'kunci' });
      }
      if (!db.objectStoreNames.contains('arsip')) {
        const a = db.createObjectStore('arsip', { keyPath: 'id', autoIncrement: true });
        a.createIndex('dibuat', 'dibuat');
      }
    };
    req.onsuccess = () => selesai(req.result);
    req.onerror = () => gagal(req.error);
  });
  return dbPromise;
}

async function tx(nama, mode, kerja) {
  const db = await buka();
  return new Promise((selesai, gagal) => {
    const t = db.transaction(nama, mode);
    const hasil = kerja(t.objectStore(nama));
    t.oncomplete = () => selesai(hasil?.result ?? hasil);
    t.onerror = () => gagal(t.error);
  });
}

/* ---------- penduduk ---------- */

export const cariNik = nik =>
  tx('penduduk', 'readonly', s => s.get(String(nik).trim()));

export async function cariNama(potongan, batas = 20) {
  const kunci = String(potongan).trim().toUpperCase();
  if (kunci.length < 3) return [];
  const db = await buka();
  return new Promise((selesai, gagal) => {
    const hasil = [];
    const t = db.transaction('penduduk', 'readonly');
    const kursor = t.objectStore('penduduk').index('nama').openCursor();
    kursor.onsuccess = e => {
      const c = e.target.result;
      if (!c || hasil.length >= batas) return selesai(hasil);
      if (String(c.value.nama).includes(kunci)) hasil.push(c.value);
      c.continue();
    };
    kursor.onerror = () => gagal(t.error);
  });
}

/** Anggota satu kartu keluarga — dipakai surat yang butuh data keluarga. */
export async function seKeluarga(nkk) {
  const db = await buka();
  return new Promise((selesai, gagal) => {
    const t = db.transaction('penduduk', 'readonly');
    const req = t.objectStore('penduduk').index('nkk').getAll(String(nkk));
    req.onsuccess = () => selesai(req.result);
    req.onerror = () => gagal(t.error);
  });
}

export const jumlahPenduduk = () =>
  tx('penduduk', 'readonly', s => s.count());

export const kosongkanPenduduk = () =>
  tx('penduduk', 'readwrite', s => s.clear());

/* ---------- pengaturan (profil desa) ---------- */

export async function ambilPengaturan() {
  const baris = await tx('pengaturan', 'readonly', s => s.getAll());
  const o = {};
  (baris || []).forEach(b => { o[b.kunci] = b.nilai; });
  return o;
}

export const simpanPengaturan = (kunci, nilai) =>
  tx('pengaturan', 'readwrite', s => s.put({ kunci, nilai }));

/* ---------- arsip surat ---------- */

export const simpanArsip = data =>
  tx('arsip', 'readwrite', s => s.add({ ...data, dibuat: new Date().toISOString() }));

export async function ambilArsip(batas = 50) {
  const db = await buka();
  return new Promise((selesai, gagal) => {
    const hasil = [];
    const t = db.transaction('arsip', 'readonly');
    const kursor = t.objectStore('arsip').index('dibuat').openCursor(null, 'prev');
    kursor.onsuccess = e => {
      const c = e.target.result;
      if (!c || hasil.length >= batas) return selesai(hasil);
      hasil.push(c.value);
      c.continue();
    };
    kursor.onerror = () => gagal(t.error);
  });
}

/* ============================================================
   IMPOR EXCEL
   ============================================================ */

const JUDUL = {
  nkk:    ['NKK', 'NO KK', 'NOMOR KK', 'NO. KK'],
  nik:    ['NIK', 'NO NIK', 'NOMOR NIK'],
  nama:   ['NAMA', 'NAMA LENGKAP'],
  tempat: ['TEMPAT LAHIR', 'TMP LAHIR', 'TEMPAT'],
  lahir:  ['TANGGAL LAHIR', 'TGL LAHIR', 'TANGGAL'],
  kawin:  ['STS KAWIN', 'STATUS KAWIN', 'STATUS PERKAWINAN', 'KAWIN'],
  kelamin:['KELAMIN', 'JENIS KELAMIN', 'JK', 'L/P'],
  alamat: ['ALAMAT', 'DUSUN'],
  rt:     ['RT'],
  rw:     ['RW']
};

function petakanKolom(baris) {
  const peta = {};
  baris.forEach((judul, i) => {
    const bersih = String(judul ?? '').trim().toUpperCase();
    for (const [medan, alias] of Object.entries(JUDUL)) {
      if (peta[medan] === undefined && alias.includes(bersih)) peta[medan] = i;
    }
  });
  return peta;
}

/** "02|10|1992", "02/10/1992", "1992-10-02" → "1992-10-02" */
function bacaTanggal(nilai) {
  if (nilai == null || nilai === '') return '';
  if (nilai instanceof Date) return nilai.toISOString().slice(0, 10);
  const t = String(nilai).trim();
  let m = t.match(/^(\d{1,2})[|\/\-.](\d{1,2})[|\/\-.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = t.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return '';
}

/** Rapikan penulisan dusun: buang kata "DUSUN", rapatkan spasi ganda. */
function bersihkanDusun(nilai) {
  return String(nilai ?? '')
    .trim().toUpperCase()
    .replace(/^(DUSUN|DSN|DS)\.?\s+/, '')
    .replace(/\s+/g, ' ');
}

const angka3 = v => String(v ?? '').trim().replace(/\D/g, '').padStart(3, '0');

/**
 * Baca berkas Excel jadi daftar penduduk.
 * Mengembalikan { data, laporan } — laporan berisi semua yang perlu
 * diperiksa manusia, bukan hanya jumlah yang berhasil.
 */
export function bacaExcel(berkas) {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onerror = () => gagal(new Error('Berkas tidak bisa dibaca.'));
    pembaca.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const baris = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
        if (baris.length < 2) throw new Error('Berkas kosong.');

        const peta = petakanKolom(baris[0]);
        const wajib = ['nik', 'nama'];
        const hilang = wajib.filter(m => peta[m] === undefined);
        if (hilang.length) {
          throw new Error(`Kolom ${hilang.join(', ').toUpperCase()} tidak ditemukan di berkas.`);
        }

        const isi = baris.slice(1).filter(r => r && String(r[peta.nik] ?? '').trim());
        const laporan = {
          total: isi.length, masuk: 0,
          nikTidakValid: [], nikGanda: [], tanggalRusak: [],
          rtRwDitukar: false, dusun: {}, rtAneh: []
        };

        // DPT sering menukar isi kolom RT dan RW. Satu RW menaungi banyak
        // RT, jadi kolom yang nilainya jauh lebih beragam adalah RT yang
        // sebenarnya. Dideteksi, bukan diasumsikan.
        if (peta.rt !== undefined && peta.rw !== undefined) {
          const unikRT = new Set(isi.map(r => angka3(r[peta.rt]))).size;
          const unikRW = new Set(isi.map(r => angka3(r[peta.rw]))).size;
          laporan.rtRwDitukar = unikRW > unikRT * 1.5;
        }

        const terlihat = new Set();
        const data = [];

        for (const r of isi) {
          const nik = String(r[peta.nik] ?? '').replace(/\D/g, '');
          const nama = String(r[peta.nama] ?? '').trim().toUpperCase();

          if (nik.length !== 16) { laporan.nikTidakValid.push({ nik, nama }); continue; }
          if (terlihat.has(nik))  { laporan.nikGanda.push({ nik, nama }); continue; }
          terlihat.add(nik);

          const mentahRT = peta.rt !== undefined ? angka3(r[peta.rt]) : '';
          const mentahRW = peta.rw !== undefined ? angka3(r[peta.rw]) : '';
          const rt = laporan.rtRwDitukar ? mentahRW : mentahRT;
          const rw = laporan.rtRwDitukar ? mentahRT : mentahRW;

          const lahir = bacaTanggal(r[peta.lahir]);
          if (peta.lahir !== undefined && !lahir) {
            laporan.tanggalRusak.push({ nik, nama, nilai: r[peta.lahir] });
          }

          const dusun = bersihkanDusun(r[peta.alamat]);
          if (dusun) laporan.dusun[dusun] = (laporan.dusun[dusun] || 0) + 1;

          data.push({
            nik,
            nkk: String(r[peta.nkk] ?? '').replace(/\D/g, ''),
            nama,
            tempat_lahir: String(r[peta.tempat] ?? '').trim().toUpperCase(),
            tanggal_lahir: lahir,
            kelamin: String(r[peta.kelamin] ?? '').trim().toUpperCase().startsWith('P') ? 'P' : 'L',
            status_kawin: String(r[peta.kawin] ?? '').trim().toUpperCase().charAt(0),
            dusun, rt, rw
          });
          laporan.masuk++;
        }

        selesai({ data, laporan });
      } catch (err) { gagal(err); }
    };
    pembaca.readAsArrayBuffer(berkas);
  });
}

/** Tulis hasil impor ke IndexedDB. Data lama ditimpa berdasarkan NIK. */
export async function simpanPenduduk(data, saatMaju = () => {}) {
  const db = await buka();
  const POTONG = 500;
  for (let i = 0; i < data.length; i += POTONG) {
    await new Promise((selesai, gagal) => {
      const t = db.transaction('penduduk', 'readwrite');
      const s = t.objectStore('penduduk');
      data.slice(i, i + POTONG).forEach(d => s.put(d));
      t.oncomplete = selesai;
      t.onerror = () => gagal(t.error);
    });
    saatMaju(Math.min(i + POTONG, data.length), data.length);
  }
}
