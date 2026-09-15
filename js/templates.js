/* ============================================================
   TEMPLATE SURAT
   Kalimat pembuka dan penutup surat dinas Indonesia itu baku —
   tidak dikarang sendiri. Yang berubah antar surat hanya
   paragraf isinya.
   ============================================================ */

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember'];

/** "1992-10-02" → "2 Oktober 1992" */
export function tglPanjang(iso) {
  if (!iso) return '-';
  const [th, bl, hr] = iso.split('-').map(Number);
  if (!th || !bl || !hr) return '-';
  return `${hr} ${BULAN[bl - 1]} ${th}`;
}

export const hariIni = () => new Date().toISOString().slice(0, 10);

export const judulKata = s =>
  String(s ?? '').toLowerCase().replace(/(^|\s|\-)\S/g, c => c.toUpperCase());

const KELAMIN = { L: 'Laki-laki', P: 'Perempuan' };
const KAWIN   = { B: 'Belum Kawin', S: 'Kawin', P: 'Pernah Kawin' };

export function alamatLengkap(w, desa) {
  const bagian = [];
  if (w.dusun) bagian.push('Dusun ' + judulKata(w.dusun));
  if (w.rt) bagian.push('RT ' + w.rt);
  if (w.rw) bagian.push('RW ' + w.rw);
  const baris = bagian.join(' ');
  return `${baris}, Desa ${judulKata(desa.desa)}, Kecamatan ${judulKata(desa.kecamatan)}, Kabupaten ${judulKata(desa.kabupaten)}`;
}

/** Baris "Nama : ..." yang tampil di badan surat. */
export function barisData(kunci, w, f, desa) {
  switch (kunci) {
    case 'nama':     return ['Nama Lengkap', w.nama];
    case 'nik':      return ['NIK', w.nik];
    case 'ttl':      return ['Tempat/Tanggal Lahir', `${judulKata(w.tempat_lahir)}, ${tglPanjang(w.tanggal_lahir)}`];
    case 'kelamin':  return ['Jenis Kelamin', KELAMIN[w.kelamin] || '-'];
    case 'kawin':    return ['Status Perkawinan', KAWIN[w.status_kawin] || '-'];
    case 'warga':    return ['Kewarganegaraan', f.kewarganegaraan || 'Indonesia'];
    case 'agama':    return ['Agama', f.agama || '-'];
    case 'pekerjaan':return ['Pekerjaan', f.pekerjaan || '-'];
    case 'alamat':   return ['Alamat', alamatLengkap(w, desa)];
    default:         return null;
  }
}

const MEDAN_UMUM = ['nama', 'nik', 'ttl', 'kelamin', 'kawin', 'warga', 'agama', 'pekerjaan', 'alamat'];

const PEMBUKA = desa =>
  `Yang bertanda tangan di bawah ini Kepala Desa ${judulKata(desa.desa)} Kecamatan ${judulKata(desa.kecamatan)} Kabupaten ${judulKata(desa.kabupaten)}, dengan ini menerangkan dengan sebenarnya bahwa:`;

const PENUTUP =
  'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.';

const bahwaPenduduk = (w, desa) =>
  `Bahwa nama tersebut di atas adalah benar-benar penduduk Desa ${judulKata(desa.desa)}, Kecamatan ${judulKata(desa.kecamatan)}, Kabupaten ${judulKata(desa.kabupaten)}`;

const keperluan = f =>
  `Surat keterangan ini dibuat untuk keperluan ${f.keperluan || '................................'}.`;

/* ============================================================
   DAFTAR TEMPLATE
   kode = kode klasifikasi arsip (Permendagri 83/2022).
   Bisa diubah di Pengaturan kalau kabupaten memakai turunan lain.
   ============================================================ */

export const TEMPLATE = [
  {
    id: 'domisili',
    nama: 'Surat Keterangan Domisili',
    judul: 'SURAT KETERANGAN DOMISILI',
    kode: '400.12',
    medan: MEDAN_UMUM,
    tambahan: [
      { id: 'agama', label: 'Agama', jenis: 'pilih', pilihan: ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'], bawaan: 'Islam' },
      { id: 'pekerjaan', label: 'Pekerjaan', jenis: 'teks', contoh: 'Petani' },
      { id: 'keperluan', label: 'Untuk keperluan', jenis: 'teks', contoh: 'melengkapi berkas administrasi' }
    ],
    paragraf: (w, f, desa) => [
      `${bahwaPenduduk(w, desa)} dan sampai saat ini yang bersangkutan masih berdomisili/bertempat tinggal di alamat tersebut di atas.`,
      keperluan(f)
    ]
  },

  {
    id: 'sktm',
    nama: 'Surat Keterangan Tidak Mampu (SKTM)',
    judul: 'SURAT KETERANGAN TIDAK MAMPU',
    kode: '400.10',
    medan: MEDAN_UMUM,
    tambahan: [
      { id: 'agama', label: 'Agama', jenis: 'pilih', pilihan: ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'], bawaan: 'Islam' },
      { id: 'pekerjaan', label: 'Pekerjaan', jenis: 'teks', contoh: 'Buruh Tani' },
      { id: 'keperluan', label: 'Untuk keperluan', jenis: 'teks', contoh: 'pengajuan bantuan pendidikan' }
    ],
    paragraf: (w, f, desa) => [
      `${bahwaPenduduk(w, desa)} dan menurut sepengetahuan kami yang bersangkutan beserta keluarganya termasuk golongan keluarga yang kurang mampu/tidak mampu secara ekonomi.`,
      keperluan(f)
    ]
  },

  {
    id: 'sku',
    nama: 'Surat Keterangan Usaha (SKU)',
    judul: 'SURAT KETERANGAN USAHA',
    kode: '500.1',
    medan: MEDAN_UMUM,
    tambahan: [
      { id: 'agama', label: 'Agama', jenis: 'pilih', pilihan: ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'], bawaan: 'Islam' },
      { id: 'pekerjaan', label: 'Pekerjaan', jenis: 'teks', contoh: 'Wiraswasta' },
      { id: 'jenis_usaha', label: 'Jenis usaha', jenis: 'teks', contoh: 'Toko Kelontong' },
      { id: 'lokasi_usaha', label: 'Lokasi usaha', jenis: 'teks', contoh: 'Dusun Krajan RT 005 RW 001' },
      { id: 'sejak', label: 'Berdiri sejak tahun', jenis: 'teks', contoh: '2019' },
      { id: 'keperluan', label: 'Untuk keperluan', jenis: 'teks', contoh: 'pengajuan kredit usaha' }
    ],
    paragraf: (w, f, desa) => [
      `${bahwaPenduduk(w, desa)} dan benar-benar memiliki usaha ${f.jenis_usaha || '................'} yang berlokasi di ${f.lokasi_usaha || '................'} sejak tahun ${f.sejak || '........'} sampai dengan sekarang.`,
      keperluan(f)
    ]
  },

  {
    id: 'skck',
    nama: 'Surat Pengantar SKCK',
    judul: 'SURAT PENGANTAR',
    kode: '300.1',
    medan: MEDAN_UMUM,
    tambahan: [
      { id: 'agama', label: 'Agama', jenis: 'pilih', pilihan: ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'], bawaan: 'Islam' },
      { id: 'pekerjaan', label: 'Pekerjaan', jenis: 'teks', contoh: 'Karyawan Swasta' },
      { id: 'keperluan', label: 'Untuk keperluan', jenis: 'teks', contoh: 'melamar pekerjaan' }
    ],
    paragraf: (w, f, desa) => [
      `${bahwaPenduduk(w, desa)} dan menurut sepengetahuan kami yang bersangkutan berkelakuan baik serta tidak pernah tersangkut perkara pidana maupun perdata.`,
      `Surat pengantar ini dibuat untuk keperluan mengurus Surat Keterangan Catatan Kepolisian (SKCK) guna ${f.keperluan || '................................'}.`
    ]
  },

  {
    id: 'belum_menikah',
    nama: 'Surat Keterangan Belum Menikah',
    judul: 'SURAT KETERANGAN BELUM MENIKAH',
    kode: '400.12',
    medan: MEDAN_UMUM,
    tambahan: [
      { id: 'agama', label: 'Agama', jenis: 'pilih', pilihan: ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'], bawaan: 'Islam' },
      { id: 'pekerjaan', label: 'Pekerjaan', jenis: 'teks', contoh: 'Pelajar/Mahasiswa' },
      { id: 'keperluan', label: 'Untuk keperluan', jenis: 'teks', contoh: 'melengkapi berkas pernikahan' }
    ],
    paragraf: (w, f, desa) => [
      `${bahwaPenduduk(w, desa)} dan sampai dengan dikeluarkannya surat keterangan ini yang bersangkutan benar-benar berstatus BELUM PERNAH MENIKAH.`,
      keperluan(f)
    ]
  },

  {
    id: 'penghasilan',
    nama: 'Surat Keterangan Penghasilan',
    judul: 'SURAT KETERANGAN PENGHASILAN',
    kode: '400.10',
    medan: MEDAN_UMUM,
    tambahan: [
      { id: 'agama', label: 'Agama', jenis: 'pilih', pilihan: ['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'], bawaan: 'Islam' },
      { id: 'pekerjaan', label: 'Pekerjaan', jenis: 'teks', contoh: 'Petani' },
      { id: 'penghasilan', label: 'Penghasilan per bulan (Rp)', jenis: 'uang', contoh: '1500000' },
      { id: 'keperluan', label: 'Untuk keperluan', jenis: 'teks', contoh: 'pengajuan beasiswa' }
    ],
    paragraf: (w, f, desa) => [
      `${bahwaPenduduk(w, desa)} dan yang bersangkutan mempunyai penghasilan rata-rata sebesar ${f.penghasilan ? rupiah(f.penghasilan) : 'Rp ................'} (${f.penghasilan ? terbilang(f.penghasilan) + ' rupiah' : '................'}) setiap bulan dari pekerjaan sebagai ${f.pekerjaan || '................'}.`,
      keperluan(f)
    ]
  }
];

export const cariTemplate = id => TEMPLATE.find(t => t.id === id) || TEMPLATE[0];

export const pembukaSurat = PEMBUKA;
export const penutupSurat = PENUTUP;

/* ---------- uang & terbilang ---------- */

export const rupiah = n =>
  'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));

const SATUAN = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan',
                'sepuluh','sebelas'];

/** Terbilang dipakai di surat penghasilan — wajib ada di surat resmi. */
export function terbilang(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n < 12) return SATUAN[n] || 'nol';
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '');
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1e6) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + terbilang(n % 1e6) : '');
  return terbilang(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + terbilang(n % 1e9) : '');
}
