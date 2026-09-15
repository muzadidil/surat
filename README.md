# Surat Desa

Pembuat surat administrasi desa. Perangkat desa cukup mengetik NIK, data
warga terisi otomatis, nomor surat dibuatkan sistem, lalu surat langsung
bisa dicetak atau disimpan sebagai PDF.

Statis (HTML/CSS/JS, tanpa build tool), dihosting di GitHub Pages, data di
Firestore.

## Masalah yang diselesaikan

Pembuatan surat di desa lambat dan sering salah ketik — nama, alamat, dan
nomor KTP kerap keliru sehingga warga harus bolak-balik ke kantor desa.
Antrean makin panjang, dan perangkat desa yang sudah sepuh kesulitan
mengejar. Aplikasi ini memindahkan pengetikan berulang itu ke sistem.

## Prinsip rancangan

Pembanding terdekat adalah [OpenSID](https://github.com/OpenSID/OpenSID) —
gratis, lengkap, ~40 template surat. Tapi OpenSID perlu hosting sendiri,
instalasi PHP/MySQL, dan operator yang melek IT.

**Produk ini tidak bersaing di jumlah fitur, tapi di kemudahan:** buka
browser, ketik NIK, cetak. Tanpa instalasi, tanpa server, tanpa pelatihan
panjang.

## Status fitur

- [x] Profil desa: kop surat, lambang, alamat, nama kepala desa & sekretaris (sekali isi)
- [x] Impor data penduduk dari Excel/CSV, dengan laporan hal yang perlu diperiksa manusia
- [x] Cari warga dengan NIK atau nama, data surat terisi otomatis
- [x] Nomor surat otomatis sesuai kode klasifikasi, berurutan per tahun
- [x] Enam template surat (lihat daftar di bawah)
- [x] Cetak A4 / simpan PDF lewat dialog cetak browser
- [x] Arsip surat yang pernah dicetak
- [x] Cadangan ke Google Drive milik desa, dan ke berkas
- [x] Mode contoh untuk demo — 5 data karangan, surat bertanda air CONTOH
- [ ] Login per desa, data antardesa terisolasi penuh (tahap Firestore)
- [ ] Cetak ulang surat dari arsip

## Cara mencoba

Buka `index.html` lewat server statis apa pun (bukan `file://`, karena
aplikasinya memakai modul JavaScript):

```bash
python -m http.server 8777
```

lalu buka `http://localhost:8777`. Tekan **Muat 5 data contoh** untuk
mencoba tanpa menyiapkan apa pun.

## Cadangan

Data tersimpan di IndexedDB — di browser komputer itu saja. Karena itu
cadangan bukan pelengkap, tapi keharusan: menghapus data browsing bisa
menghapus seluruh data penduduk.

Dua cara, keduanya menghasilkan berkas yang sama:

1. **Google Drive** — masuk ke Drive milik desa yang login, bukan ke
   penyedia aplikasi. Izin yang diminta hanya `drive.file`, artinya
   aplikasi cuma bisa membuka berkas yang dibuatnya sendiri dan tidak
   pernah melihat isi Drive yang lain. Perlu Client ID Google; caranya
   ada di [js/config.js](js/config.js).
2. **Berkas** — unduh ke komputer, bisa dipulihkan di komputer lain.
   Tidak perlu internet.

## Daftar surat yang akan dibuat

**Kependudukan** — Keterangan Domisili, Keterangan Identitas/Beda Nama,
Pengantar KTP/KK, Keterangan Pindah, Keterangan Kelahiran, Keterangan
Kematian, Keterangan Ahli Waris

**Ekonomi & usaha** — Keterangan Usaha (SKU), Keterangan Penghasilan,
Keterangan Tidak Mampu (SKTM), Pengantar Ternak

**Sosial & hukum** — Pengantar SKCK, Keterangan Tidak Pernah Dipidana,
Keterangan Kehilangan, Keterangan Belum Menikah, Surat Kuasa

**Pernikahan** — Pengantar Nikah (model N1–N6 ke KUA)

**Pertanahan** — Keterangan Tanah/Riwayat Tanah, Keterangan Waris atas tanah

**Internal desa** — Undangan, Surat Tugas, Keputusan Kepala Desa, Izin Keramaian

## Penomoran surat

Mengikuti **Permendagri No. 83 Tahun 2022** tentang Kode Klasifikasi Arsip
(acuan terbaru). Kode utama: `000` umum, `100` pemerintahan, `400`
kesejahteraan rakyat (`400.12` kependudukan & capil), `500` perekonomian,
`800` kepegawaian, `900` keuangan.

Format: `[kode klasifikasi]/[no urut]/[kode desa]/[tahun]`

Nomor urut dibuat otomatis oleh sistem — per klasifikasi, per tahun, reset
tiap Januari. Ini menghapus salah satu sumber kesalahan yang paling sering
terjadi.

## Rencana struktur data (Firestore)

```
desa/{kode_desa}                     profil desa: kop, logo, alamat, kades, sekdes
desa/{kode_desa}/penduduk/{nik}      NIK jadi ID dokumen → cari sekali ambil, instan
desa/{kode_desa}/surat/{id}          arsip surat yang pernah dicetak
desa/{kode_desa}/counter/{tahun}     nomor urut berjalan per kode klasifikasi
```

## Keamanan data — tidak bisa ditawar

Aplikasi ini menyimpan NIK, nama, dan alamat seluruh warga desa. Itu data
pribadi yang dilindungi **UU No. 27 Tahun 2022 (PDP)**.

Aturan yang wajib dipegang:

1. **Tidak boleh pakai login anonim.** Harus login sungguhan per perangkat desa.
2. **Data tiap desa wajib terisolasi** — aturan Firestore harus memastikan operator Desa A tidak bisa membaca satu baris pun data Desa B.
3. **Berkas data penduduk tidak boleh masuk Git.** Sudah diblokir lewat `.gitignore`; data hanya masuk lewat fitur impor di aplikasi.

## Berkas

```
index.html              kerangka aplikasi
CNAME                   surat.zasha.online
assets/style.css        tampilan aplikasi
assets/surat.css        tampilan lembar surat + aturan cetak
assets/logo-jember.png  lambang bawaan kop surat
js/config.js            Client ID Google untuk cadangan Drive
js/data.js              penyimpanan lokal, impor Excel, cadangan
js/templates.js         definisi template & kalimat baku surat
js/drive.js             cadangan ke Google Drive
js/demo.js              data contoh untuk demo
js/app.js               antarmuka & perakitan surat
```

Saat Firestore dipasang nanti, hanya `js/data.js` yang perlu berubah —
seluruh aplikasi mengakses data lewat berkas itu saja.
