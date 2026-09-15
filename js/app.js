import * as D from './data.js?v=2';
import * as Drive from './drive.js?v=2';
import { DESA_DEMO, WARGA_DEMO } from './demo.js?v=2';
import {
  TEMPLATE, cariTemplate, barisData, pembukaSurat, penutupSurat,
  tglPanjang, hariIni, judulKata
} from './templates.js?v=2';

const $  = (s, i = document) => i.querySelector(s);
const $$ = (s, i = document) => [...i.querySelectorAll(s)];

const aman = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

let jamToast;
function toast(pesan, gagal = false) {
  const t = $('#toast');
  t.textContent = pesan;
  t.classList.toggle('gagal', !!gagal);
  t.hidden = false;
  clearTimeout(jamToast);
  jamToast = setTimeout(() => { t.hidden = true; }, 3600);
}

/* ============================================================
   KEADAAN APLIKASI
   ============================================================ */

/** Lambang Kabupaten Jember ikut dalam repo, jadi kop surat sudah benar
 *  sejak pertama dibuka. Desa di luar Jember tinggal unggah lambangnya. */
const LOGO_BAWAAN = 'assets/logo-jember.png';

const BAWAAN_DESA = {
  kabupaten: 'JEMBER',
  kecamatan: 'BANGSALSARI',
  desa: 'KARANGSONO',
  alamat: '',
  kode_desa: '',
  kades: '',
  sekdes: '',
  logo: ''
};

let desa = { ...BAWAAN_DESA };
let warga = null;                    // warga yang sedang dipilih
let templateAktif = TEMPLATE[0];
let isian = {};                      // nilai field tambahan
let nomorManual = null;              // kalau operator menimpa nomor otomatis
let modeDemo = false;                // data contoh → surat diberi tanda air

/* ============================================================
   MULAI
   ============================================================ */

(async () => {
  const p = await D.ambilPengaturan();
  desa = { ...BAWAAN_DESA, ...p };
  modeDemo = p.mode_demo === true;
  $('#boot').hidden = true;
  $('#app').hidden = false;
  gantiTab('buat');
})();

$$('.tab').forEach(t => t.onclick = () => gantiTab(t.dataset.tab));

function gantiTab(nama) {
  $$('.tab').forEach(t => t.classList.toggle('aktif', t.dataset.tab === nama));
  document.body.classList.toggle('mode-buat', nama === 'buat');
  const w = $('#view');
  if (nama === 'buat')          vBuat(w);
  else if (nama === 'data')     vData(w);
  else if (nama === 'cadangan') vCadangan(w);
  else if (nama === 'atur')     vAtur(w);
  else                          vArsip(w);
}

/** Muat 5 warga karangan + identitas desa contoh, untuk demo. */
async function muatDemo() {
  await D.kosongkanPenduduk();
  await D.simpanPenduduk(WARGA_DEMO);
  for (const [k, v] of Object.entries(DESA_DEMO)) await D.simpanPengaturan(k, v);
  await D.simpanPengaturan('mode_demo', true);
  desa = { ...BAWAAN_DESA, ...DESA_DEMO };
  modeDemo = true;
  warga = null;
  toast('Data contoh dimuat. Surat akan bertanda air CONTOH.');
  gantiTab('buat');
}

/** Dipanggil begitu data sungguhan masuk — tanda air harus hilang. */
async function matikanDemo() {
  if (!modeDemo) return;
  modeDemo = false;
  await D.simpanPengaturan('mode_demo', false);
}

/* ============================================================
   TAB: BUAT SURAT
   ============================================================ */

async function vBuat(w) {
  const jumlah = await D.jumlahPenduduk();

  w.innerHTML = `
    ${jumlah === 0 ? `<div class="peringatan">
      Belum ada data penduduk. Muat berkas Excel di tab <strong>Data Penduduk</strong>,
      atau coba dulu dengan data contoh.
      <button class="btn btn-garis" id="bDemo" style="margin-top:10px">Muat 5 data contoh</button>
      </div>` : ''}

    ${modeDemo ? `<div class="catatan">
      <strong>Mode contoh.</strong> Data ini karangan dan suratnya bertanda air CONTOH.
      Tanda air hilang sendiri begitu data desa yang sebenarnya dimuat.</div>` : ''}

    <label class="field"><span>Jenis surat</span>
      <select id="fJenis">
        ${TEMPLATE.map(t => `<option value="${t.id}" ${t.id === templateAktif.id ? 'selected' : ''}>${aman(t.nama)}</option>`).join('')}
      </select></label>

    <div class="bagian"><h2>Data warga</h2><span>${jumlah ? jumlah.toLocaleString('id-ID') + ' jiwa termuat' : 'belum ada data'}</span></div>

    <label class="field"><span>Cari dengan NIK atau nama</span>
      <input id="fCari" placeholder="ketik 16 digit NIK, atau minimal 3 huruf nama" autocomplete="off">
      <span class="field-hint">NIK langsung ketemu. Nama akan menampilkan daftar pilihan.</span></label>
    <div id="hasilCari"></div>

    <div id="kartuWarga"></div>

    <div id="medanTambahan"></div>

    <div class="bagian"><h2>Keterangan surat</h2></div>

    <label class="field"><span>Nomor surat</span>
      <input id="fNomor" placeholder="otomatis">
      <span class="field-hint" id="hintNomor"></span></label>

    <div class="duo">
      <label class="field"><span>Tanggal surat</span>
        <input type="date" id="fTanggal" value="${hariIni()}"></label>
      <label class="field"><span>Ditandatangani oleh</span>
        <select id="fTtd">
          <option value="kades">Kepala Desa</option>
          <option value="sekdes">a.n. Kepala Desa — Sekretaris Desa</option>
        </select></label>
    </div>

    <div class="tombol-baris">
      <button class="btn btn-utama" id="bCetak">Cetak / Simpan PDF</button>
      <button class="btn btn-garis" id="bReset">Bersihkan</button>
    </div>
    <p class="field-hint" style="margin-top:8px">
      Tombol cetak membuka jendela cetak. Pilih printer untuk mencetak, atau
      pilih <strong>“Save as PDF”</strong> untuk menyimpan sebagai berkas PDF.
    </p>`;

  if ($('#bDemo')) $('#bDemo').onclick = muatDemo;

  $('#fJenis').onchange = e => {
    templateAktif = cariTemplate(e.target.value);
    isian = {};
    gambarMedanTambahan();
    perbaruiNomor();
    gambar();
  };

  let jamCari;
  $('#fCari').oninput = e => {
    clearTimeout(jamCari);
    const nilai = e.target.value.trim();
    jamCari = setTimeout(() => jalankanCari(nilai), 220);
  };

  $('#fNomor').oninput = e => { nomorManual = e.target.value; gambar(); };
  $('#fTanggal').onchange = gambar;
  $('#fTtd').onchange = gambar;
  $('#bCetak').onclick = cetak;
  $('#bReset').onclick = () => {
    warga = null; isian = {}; nomorManual = null;
    gantiTab('buat');
  };

  gambarKartu();
  gambarMedanTambahan();
  await perbaruiNomor();
  gambar();
}

async function jalankanCari(nilai) {
  const wadah = $('#hasilCari');
  const angka = nilai.replace(/\D/g, '');

  if (angka.length === 16) {
    const w = await D.cariNik(angka);
    if (w) { pilihWarga(w); wadah.innerHTML = ''; return; }
    wadah.innerHTML = `<p class="cari-kosong">NIK ${aman(angka)} tidak ada di data penduduk.
      Periksa lagi, atau isi data warga secara manual di bawah.</p>`;
    return;
  }

  if (nilai.length < 3) { wadah.innerHTML = ''; return; }

  const hasil = await D.cariNama(nilai);
  if (!hasil.length) {
    wadah.innerHTML = `<p class="cari-kosong">Tidak ada nama yang cocok.</p>`;
    return;
  }
  wadah.innerHTML = `<div class="daftar-cari">${hasil.map(h => `
    <button class="baris-cari" data-nik="${h.nik}">
      <strong>${aman(h.nama)}</strong>
      <small>${aman(h.nik)} · ${aman(judulKata(h.dusun))} RT ${aman(h.rt)} RW ${aman(h.rw)}</small>
    </button>`).join('')}</div>`;

  $$('[data-nik]', wadah).forEach(b => b.onclick = async () => {
    const w = await D.cariNik(b.dataset.nik);
    if (w) { pilihWarga(w); wadah.innerHTML = ''; $('#fCari').value = ''; }
  });
}

function pilihWarga(w) {
  warga = w;
  gambarKartu();
  gambar();
}

function gambarKartu() {
  const k = $('#kartuWarga');
  if (!k) return;
  if (!warga) {
    k.innerHTML = `<div class="kartu-kosong">Belum ada warga dipilih.</div>`;
    return;
  }
  k.innerHTML = `
    <div class="kartu">
      <div class="kartu-atas">
        <strong>${aman(warga.nama)}</strong>
        <button class="kartu-ganti" id="bGanti">Ganti</button>
      </div>
      <p>NIK ${aman(warga.nik)}${warga.nkk ? ' · KK ' + aman(warga.nkk) : ''}</p>
      <p>${aman(judulKata(warga.tempat_lahir))}, ${aman(tglPanjang(warga.tanggal_lahir))}</p>
      <p>${aman(judulKata(warga.dusun))} RT ${aman(warga.rt)} RW ${aman(warga.rw)}</p>
    </div>`;
  $('#bGanti').onclick = () => { warga = null; gambarKartu(); gambar(); $('#fCari').focus(); };
}

function gambarMedanTambahan() {
  const w = $('#medanTambahan');
  if (!w) return;
  const medan = templateAktif.tambahan || [];
  w.innerHTML = `<div class="bagian"><h2>Isian surat</h2><span>tidak ada di data DPT</span></div>
    ${medan.map(m => {
      const nilai = isian[m.id] ?? m.bawaan ?? '';
      if (m.jenis === 'pilih') {
        return `<label class="field"><span>${aman(m.label)}</span>
          <select data-medan="${m.id}">
            ${m.pilihan.map(p => `<option ${p === nilai ? 'selected' : ''}>${aman(p)}</option>`).join('')}
          </select></label>`;
      }
      return `<label class="field"><span>${aman(m.label)}</span>
        <input data-medan="${m.id}" value="${aman(nilai)}"
          inputmode="${m.jenis === 'uang' ? 'numeric' : 'text'}"
          placeholder="${aman(m.contoh || '')}"></label>`;
    }).join('')}`;

  medan.forEach(m => { if (isian[m.id] === undefined && m.bawaan) isian[m.id] = m.bawaan; });

  $$('[data-medan]', w).forEach(el => {
    const pakai = () => {
      let v = el.value;
      if (el.inputMode === 'numeric') {
        const n = v.replace(/\D/g, '');
        el.value = n ? new Intl.NumberFormat('id-ID').format(n) : '';
        v = n;
      }
      isian[el.dataset.medan] = v;
      gambar();
    };
    el.oninput = pakai;
    el.onchange = pakai;
  });
}

/* ---------- nomor surat otomatis ---------- */

async function perbaruiNomor() {
  const el = $('#fNomor');
  if (!el) return;
  const tahun = new Date().getFullYear();
  const p = await D.ambilPengaturan();
  const urut = (p[`urut_${tahun}`] || 0) + 1;
  el.placeholder = susunNomor(urut, tahun);
  $('#hintNomor').textContent =
    `Nomor urut ${urut} untuk tahun ${tahun}, lanjut otomatis tiap surat dicetak. Kosongkan untuk memakai nomor ini.`;
}

function susunNomor(urut, tahun) {
  const kode = templateAktif.kode;
  const wilayah = desa.kode_desa || '..............';
  return `${kode}/${String(urut).padStart(3, '0')}/${wilayah}/${tahun}`;
}

/* ============================================================
   PRATINJAU SURAT
   ============================================================ */

function gambar() {
  const c = $('#cetak');
  if (!document.body.classList.contains('mode-buat')) return;

  const t = templateAktif;
  const tglSurat = $('#fTanggal')?.value || hariIni();
  const nomor = (nomorManual && nomorManual.trim()) || $('#fNomor')?.placeholder || '';
  const pakaiSekdes = $('#fTtd')?.value === 'sekdes';

  const w = warga || {
    nama: '................................', nik: '................',
    tempat_lahir: '............', tanggal_lahir: '', kelamin: '', status_kawin: '',
    dusun: '............', rt: '...', rw: '...'
  };

  const baris = (t.medan || [])
    .map(k => barisData(k, w, isian, desa))
    .filter(Boolean);

  const alinea = t.paragraf(w, isian, desa);

  c.innerHTML = `
    <div class="kertas${modeDemo ? ' contoh' : ''}">
      <header class="kop">
        <img class="kop-logo" src="${desa.logo || LOGO_BAWAAN}" alt="">

        <div class="kop-teks">
          <div class="k1">PEMERINTAH KABUPATEN ${aman(desa.kabupaten)}</div>
          <div class="k2">KECAMATAN ${aman(desa.kecamatan)}</div>
          <div class="k3">DESA ${aman(desa.desa)}</div>
          <div class="k4">${aman(desa.alamat || 'Alamat kantor desa — isi di tab Pengaturan')}</div>
        </div>
      </header>
      <div class="kop-garis"></div>

      <h1 class="surat-judul">${aman(t.judul)}</h1>
      <p class="surat-nomor">Nomor: ${aman(nomor)}</p>

      <p class="surat-alinea">${aman(pembukaSurat(desa))}</p>

      <table class="surat-data">
        ${baris.map(([l, v]) => `<tr>
          <td class="label">${aman(l)}</td>
          <td class="pisah">:</td>
          <td class="isi">${aman(v)}</td>
        </tr>`).join('')}
      </table>

      ${alinea.map(p => `<p class="surat-alinea">${aman(p)}</p>`).join('')}

      <p class="surat-alinea">${aman(penutupSurat)}</p>

      <div class="ttd">
        <div class="ttd-blok">
          <p>${aman(judulKata(desa.desa))}, ${aman(tglPanjang(tglSurat))}</p>
          ${pakaiSekdes
            ? `<p class="ttd-jabatan">a.n. Kepala Desa ${aman(judulKata(desa.desa))}<br>Sekretaris Desa</p>`
            : `<p class="ttd-jabatan">Kepala Desa ${aman(judulKata(desa.desa))}</p>`}
          <div class="ttd-ruang"></div>
          <p class="ttd-nama">${aman((pakaiSekdes ? desa.sekdes : desa.kades) || '..............................')}</p>
        </div>
      </div>
    </div>`;
}

/* ---------- cetak ---------- */

async function cetak() {
  if (!desa.kades && !desa.sekdes) {
    toast('Isi dulu nama Kepala Desa di tab Pengaturan.', true);
    return;
  }

  const tahun = new Date().getFullYear();
  const p = await D.ambilPengaturan();
  const urut = (p[`urut_${tahun}`] || 0) + 1;
  const nomor = (nomorManual && nomorManual.trim()) || susunNomor(urut, tahun);

  // Nomor otomatis hanya maju kalau memang yang dipakai — kalau operator
  // menulis nomor sendiri, buku agenda tidak boleh ikut bergeser.
  if (!nomorManual || !nomorManual.trim()) {
    await D.simpanPengaturan(`urut_${tahun}`, urut);
  }

  await D.simpanArsip({
    jenis: templateAktif.id,
    judul: templateAktif.judul,
    nomor,
    nik: warga?.nik || '',
    nama: warga?.nama || '',
    tanggal: $('#fTanggal')?.value || hariIni(),
    isian: { ...isian }
  });

  window.print();
  await perbaruiNomor();
  toast('Surat tercatat di arsip.');
}

/* ============================================================
   TAB: DATA PENDUDUK
   ============================================================ */

async function vData(w) {
  const jumlah = await D.jumlahPenduduk();

  w.innerHTML = `
    <div class="catatan">
      Data penduduk disimpan <strong>di komputer ini saja</strong>, tidak dikirim ke internet.
      Jangan memuat data warga di komputer umum.
    </div>

    <section class="kop-kartu">
      <p class="kop-label">Penduduk termuat</p>
      <p class="kop-angka">${jumlah.toLocaleString('id-ID')}</p>
      <p class="kop-sub">jiwa</p>
    </section>

    <div class="bagian"><h2>Muat berkas Excel</h2></div>
    <label class="field"><span>Pilih berkas (.xlsx / .xls / .csv)</span>
      <input type="file" id="fBerkas" accept=".xlsx,.xls,.csv">
      <span class="field-hint">Kolom yang dikenali: NKK, NIK, NAMA, TEMPAT LAHIR, TANGGAL LAHIR, STS KAWIN, KELAMIN, ALAMAT, RT, RW.</span></label>
    <div id="laporanImpor"></div>

    <div class="bagian"><h2>Hapus data</h2></div>
    <button class="btn btn-bahaya" id="bHapus">Hapus semua data penduduk</button>`;

  $('#fBerkas').onchange = async e => {
    const berkas = e.target.files[0];
    if (!berkas) return;
    const lap = $('#laporanImpor');
    lap.innerHTML = `<p class="cari-kosong">Membaca berkas…</p>`;
    try {
      const { data, laporan } = await D.bacaExcel(berkas);
      lap.innerHTML = `<p class="cari-kosong">Menyimpan ${data.length.toLocaleString('id-ID')} baris…</p>`;
      await D.simpanPenduduk(data, (n, total) => {
        lap.innerHTML = `<p class="cari-kosong">Menyimpan ${n.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')}…</p>`;
      });
      await matikanDemo();
      tampilLaporan(lap, laporan);
      toast(`${laporan.masuk.toLocaleString('id-ID')} warga termuat.`);
    } catch (err) {
      lap.innerHTML = `<div class="peringatan">Gagal membaca: ${aman(err.message)}</div>`;
    }
  };

  $('#bHapus').onclick = async () => {
    if (!confirm('Hapus semua data penduduk dari komputer ini?')) return;
    await D.kosongkanPenduduk();
    toast('Data penduduk dihapus.');
    gantiTab('data');
  };
}

function tampilLaporan(wadah, l) {
  const dusun = Object.entries(l.dusun).sort((a, b) => b[1] - a[1]);
  wadah.innerHTML = `
    <div class="catatan"><strong>${l.masuk.toLocaleString('id-ID')}</strong> dari ${l.total.toLocaleString('id-ID')} baris berhasil dimuat.</div>

    ${l.rtRwDitukar ? `<div class="peringatan">
      <strong>Kolom RT dan RW di berkas ini tertukar</strong> — kolom berlabel RT ternyata berisi nomor RW,
      dan sebaliknya. Terdeteksi karena satu RW menaungi banyak RT, bukan kebalikannya.
      Sudah otomatis dibetulkan saat dimuat.</div>` : ''}

    ${l.nikTidakValid.length ? `<div class="peringatan">
      ${l.nikTidakValid.length} baris dilewati karena NIK bukan 16 digit.</div>` : ''}

    ${l.nikGanda.length ? `<div class="peringatan">
      ${l.nikGanda.length} baris dilewati karena NIK ganda.</div>` : ''}

    ${l.tanggalRusak.length ? `<div class="peringatan">
      ${l.tanggalRusak.length} baris tanggal lahirnya tidak terbaca — perlu diperbaiki manual saat membuat surat.</div>` : ''}

    <div class="bagian"><h2>Dusun terbaca</h2><span>${dusun.length} nama</span></div>
    <div class="daftar-cari">
      ${dusun.map(([n, j]) => `<div class="baris-cari" style="cursor:default">
        <strong>${aman(judulKata(n))}</strong><small>${j.toLocaleString('id-ID')} jiwa</small></div>`).join('')}
    </div>
    ${dusun.length > 6 ? `<p class="field-hint">Kalau ada nama dusun yang sebenarnya sama tapi beda ejaan,
      rapikan di berkas Excel lalu muat ulang — supaya alamat di surat konsisten.</p>` : ''}`;
}

/* ============================================================
   TAB: CADANGAN
   ============================================================ */

async function vCadangan(w) {
  const jumlah = await D.jumlahPenduduk();
  const adaDrive = Drive.siapDipakai();

  w.innerHTML = `
    <div class="catatan">
      Cadangan masuk ke <strong>Google Drive milik desa sendiri</strong> — akun yang login nanti.
      Aplikasi ini hanya diberi izin membuka berkas yang dibuatnya sendiri, tidak bisa
      melihat isi Drive yang lain.
    </div>

    <section class="kop-kartu">
      <p class="kop-label">Isi yang akan dicadangkan</p>
      <p class="kop-angka">${jumlah.toLocaleString('id-ID')}</p>
      <p class="kop-sub">data penduduk, ditambah pengaturan desa dan arsip surat</p>
    </section>

    ${!adaDrive ? `<div class="peringatan">
      Cadangan ke Google Drive belum aktif — Client ID Google belum diisi di
      <strong>js/config.js</strong>. Caranya ditulis di dalam berkas itu.
      Sementara ini pakai cadangan ke berkas di bawah.</div>` : ''}

    <div class="bagian"><h2>Cadangkan ke Google Drive</h2></div>
    <div class="tombol-baris">
      <button class="btn btn-utama" id="bUnggah" ${adaDrive ? '' : 'disabled'}>Cadangkan sekarang</button>
      <button class="btn btn-garis" id="bDaftar" ${adaDrive ? '' : 'disabled'}>Lihat cadangan</button>
    </div>
    <div id="hasilDrive"></div>

    <div class="bagian"><h2>Cadangkan ke berkas</h2><span>tanpa internet</span></div>
    <div class="tombol-baris">
      <button class="btn btn-garis" id="bUnduh">Simpan ke komputer</button>
      <label class="btn btn-garis" style="cursor:pointer">
        Pulihkan dari berkas
        <input type="file" id="fPulih" accept=".json" hidden>
      </label>
    </div>`;

  $('#bUnduh').onclick = async () => {
    const isi = await D.exportSemua();
    const blob = new Blob([JSON.stringify(isi)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'),
      { href: url, download: `cadangan-surat-desa-${hariIni()}.json` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Cadangan tersimpan di komputer.');
  };

  $('#fPulih').onchange = e => {
    const berkas = e.target.files[0];
    if (!berkas) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        await pulihkan(JSON.parse(r.result));
      } catch (err) {
        toast(err.message || 'Berkas cadangan tidak terbaca.', true);
      }
    };
    r.readAsText(berkas);
  };

  if (!adaDrive) return;

  $('#bUnggah').onclick = async () => {
    const b = $('#bUnggah');
    b.disabled = true; b.textContent = 'Mengunggah…';
    try {
      const isi = await D.exportSemua();
      const hasil = await Drive.unggah(isi);
      $('#hasilDrive').innerHTML = `<div class="catatan">Tersimpan di Google Drive sebagai
        <strong>${aman(hasil.name)}</strong>.</div>`;
      toast('Cadangan terkirim ke Google Drive.');
    } catch (err) {
      $('#hasilDrive').innerHTML = `<div class="peringatan">${aman(err.message)}</div>`;
    }
    b.disabled = false; b.textContent = 'Cadangkan sekarang';
  };

  $('#bDaftar').onclick = async () => {
    const wadah = $('#hasilDrive');
    wadah.innerHTML = `<p class="cari-kosong">Mengambil daftar…</p>`;
    try {
      const berkas = await Drive.daftar();
      if (!berkas.length) {
        wadah.innerHTML = `<p class="cari-kosong">Belum ada cadangan di Drive akun ini.</p>`;
        return;
      }
      wadah.innerHTML = `<div class="daftar-cari">${berkas.map(f => `
        <button class="baris-cari" data-drive="${aman(f.id)}">
          <strong>${aman(f.name)}</strong>
          <small>${new Date(f.modifiedTime).toLocaleString('id-ID')}</small>
        </button>`).join('')}</div>
        <p class="field-hint">Menekan salah satu akan mengganti seluruh data di komputer ini.</p>`;

      $$('[data-drive]', wadah).forEach(b => b.onclick = async () => {
        try {
          toast('Mengunduh cadangan…');
          await pulihkan(await Drive.unduh(b.dataset.drive));
        } catch (err) {
          toast(err.message || 'Gagal memulihkan.', true);
        }
      });
    } catch (err) {
      wadah.innerHTML = `<div class="peringatan">${aman(err.message)}</div>`;
    }
  };
}

async function pulihkan(isi) {
  if (!confirm('Seluruh data di komputer ini akan diganti dengan isi cadangan. Lanjutkan?')) return;
  const hasil = await D.imporSemua(isi);
  const p = await D.ambilPengaturan();
  desa = { ...BAWAAN_DESA, ...p };
  modeDemo = p.mode_demo === true;
  toast(`Dipulihkan: ${hasil.penduduk.toLocaleString('id-ID')} warga, ${hasil.arsip} arsip surat.`);
  gantiTab('cadangan');
}

/* ============================================================
   TAB: PENGATURAN
   ============================================================ */

function vAtur(w) {
  const medan = [
    ['kabupaten', 'Kabupaten', 'JEMBER'],
    ['kecamatan', 'Kecamatan', 'BANGSALSARI'],
    ['desa', 'Desa', 'KARANGSONO'],
    ['alamat', 'Alamat kantor desa', 'Jl. ... Kode Pos ...'],
    ['kode_desa', 'Kode wilayah desa', '35.09.09.xxxx'],
    ['kades', 'Nama Kepala Desa', 'ditulis lengkap dengan gelar'],
    ['sekdes', 'Nama Sekretaris Desa', 'untuk surat yang ditandatangani a.n.']
  ];

  w.innerHTML = `
    <div class="bagian"><h2>Identitas desa</h2><span>tampil di kop surat</span></div>
    ${medan.map(([id, label, contoh]) => `
      <label class="field"><span>${label}</span>
        <input data-atur="${id}" value="${aman(desa[id] || '')}" placeholder="${aman(contoh)}"></label>`).join('')}

    <p class="field-hint" style="margin-top:-8px">
      Kode wilayah desa dipakai di nomor surat. Cocokkan dengan yang dipakai di surat desa selama ini.
    </p>

    <div class="bagian"><h2>Lambang di kop surat</h2></div>
    <div class="logo-baris">
      <img class="logo-pratinjau" src="${desa.logo || LOGO_BAWAAN}" alt="">
      <div>
        <p class="field-hint" style="margin:0 0 8px">
          ${desa.logo ? 'Memakai lambang yang kamu unggah.' : 'Memakai Lambang Kabupaten Jember bawaan aplikasi.'}
        </p>
        <input type="file" id="fLogo" accept="image/*">
        ${desa.logo ? `<button class="btn btn-garis" id="bHapusLogo" style="margin-top:8px">Kembalikan ke lambang bawaan</button>` : ''}
      </div>
    </div>

    <button class="btn btn-utama" id="bSimpanAtur" style="margin-top:20px">Simpan pengaturan</button>`;

  $('#bSimpanAtur').onclick = async () => {
    for (const el of $$('[data-atur]')) {
      const id = el.dataset.atur;
      desa[id] = el.value.trim();
      await D.simpanPengaturan(id, desa[id]);
    }
    toast('Pengaturan tersimpan.');
  };

  $('#fLogo').onchange = e => {
    const berkas = e.target.files[0];
    if (!berkas) return;
    const r = new FileReader();
    r.onload = async () => {
      desa.logo = r.result;
      await D.simpanPengaturan('logo', desa.logo);
      toast('Logo tersimpan.');
      vAtur(w);
    };
    r.readAsDataURL(berkas);
  };

  if ($('#bHapusLogo')) $('#bHapusLogo').onclick = async () => {
    desa.logo = '';
    await D.simpanPengaturan('logo', '');
    vAtur(w);
  };
}

/* ============================================================
   TAB: ARSIP
   ============================================================ */

async function vArsip(w) {
  const daftar = await D.ambilArsip();
  w.innerHTML = `
    <div class="bagian"><h2>Surat yang pernah dibuat</h2><span>${daftar.length} terakhir</span></div>
    ${daftar.length
      ? `<div class="daftar-cari">${daftar.map(a => `
          <div class="baris-cari" style="cursor:default">
            <strong>${aman(a.judul)}</strong>
            <small>${aman(a.nomor)}</small>
            <small>${aman(a.nama || '-')} · ${aman(tglPanjang(a.tanggal))}</small>
          </div>`).join('')}</div>`
      : `<div class="kartu-kosong">Belum ada surat yang dicetak.</div>`}`;
}
