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

## Rencana fitur

- [ ] Profil desa: kop surat, logo, alamat, nama kepala desa & sekretaris (sekali isi)
- [ ] Impor data penduduk dari Excel/CSV — **fitur kunci**, tanpa ini autofill tidak ada gunanya
- [ ] Cari warga dengan NIK, data surat terisi otomatis
- [ ] Nomor surat otomatis sesuai kode klasifikasi, berurutan per tahun
- [ ] Template surat (lihat daftar di bawah)
- [ ] Arsip surat yang pernah dicetak — bisa dicetak ulang tanpa mengetik lagi
- [ ] Cetak / simpan PDF
- [ ] Login per desa, data antardesa terisolasi penuh

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

## Status

Tahap perencanaan. Belum ada kode.
