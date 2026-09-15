/* ============================================================
   DATA CONTOH untuk demo ke perangkat desa.

   Semua isinya karangan — nama, NIK, dan alamat tidak merujuk
   ke orang yang ada. Nama desanya sengaja "CONTOH", bukan nama
   desa sungguhan, supaya surat yang keluar dari mode demo tidak
   bisa dipakai seolah-olah surat resmi. Surat dalam mode demo
   juga diberi tanda air CONTOH.

   NIK-nya mengikuti struktur asli — 3509 (Jember) + 09 (Bangsalsari)
   + tanggal lahir (tanggal +40 untuk perempuan) + nomor urut — supaya
   saat didemokan terlihat wajar, sekaligus menunjukkan bahwa pencarian
   lewat NIK memang bekerja.
   ============================================================ */

export const DESA_DEMO = {
  kabupaten: 'JEMBER',
  kecamatan: 'BANGSALSARI',
  desa: 'CONTOH',
  alamat: 'Jl. Raya Contoh No. 1, Kode Pos 68154',
  kode_desa: '35.09.09.0000',
  kades: 'H. SUPRIYADI, S.Sos',
  sekdes: 'ANDI WIJAYA, S.E.',
  logo: ''
};

export const WARGA_DEMO = [
  {
    nik: '3509091203850001', nkk: '3509091505150001',
    nama: 'BUDI SANTOSO',
    tempat_lahir: 'JEMBER', tanggal_lahir: '1985-03-12',
    kelamin: 'L', status_kawin: 'S',
    dusun: 'KRAJAN', rt: '003', rw: '001'
  },
  {
    nik: '3509096507900002', nkk: '3509091505150001',
    nama: 'SITI AMINAH',
    tempat_lahir: 'JEMBER', tanggal_lahir: '1990-07-25',
    kelamin: 'P', status_kawin: 'S',
    dusun: 'KRAJAN', rt: '003', rw: '001'
  },
  {
    nik: '3509090511780003', nkk: '3509092003120002',
    nama: 'AGUS PRASETYO',
    tempat_lahir: 'LUMAJANG', tanggal_lahir: '1978-11-05',
    kelamin: 'L', status_kawin: 'S',
    dusun: 'GUMUKREJO', rt: '012', rw: '002'
  },
  {
    nik: '3509095702980004', nkk: '3509090807190003',
    nama: 'DEWI LESTARI',
    tempat_lahir: 'JEMBER', tanggal_lahir: '1998-02-17',
    kelamin: 'P', status_kawin: 'B',
    dusun: 'BEGELENAN', rt: '007', rw: '001'
  },
  {
    nik: '3509093009650005', nkk: '3509091102080004',
    nama: 'SLAMET RIYADI',
    tempat_lahir: 'JEMBER', tanggal_lahir: '1965-09-30',
    kelamin: 'L', status_kawin: 'P',
    dusun: 'CURAH KETING', rt: '019', rw: '002'
  }
];
