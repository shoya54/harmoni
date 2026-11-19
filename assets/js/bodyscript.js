const tblConfig = {
  data:[], layout:'fitColumns', movableColumns:false, columnDefaults:{resizable:false}, locale:'en', pagination:'local', paginationSize:10
}
const kolomAwal = [
  {title:'Tanggal', field:'tanggal', width:80, headerSort:false, frozen:true, hozAlign:'center'},
  {
    title:'Keterangan', field:'keterangan', headerSort:false, minWidth:200, maxWidth:800, widthGrow:1, resizable:true,
    formatter: function(cell) {
      const rowData = cell.getRow().getData();
      const ikon = rowData.url !== '-' ? 
      `<i class="bi bi-paperclip text-success ms-2" style="font-size:1rem;" title="Lihat Berkas" data-bs-toggle="modal" data-bs-target="#modalBerkas" data-id="${rowData.url}" data-txt="${rowData.keterangan}"></i>` 
      : '';
      return `<span>${rowData.keterangan}</span> ${ikon}`;
    }
  }
];
const kolomAkhir = [
  {title:'Kas', field:'kategori', headerSort:false, width:100}
];

function prosesDataPemasukan(pemasukan,targetKategori) {
  const listHasil = [];
  if (!pemasukan || pemasukan.length === 0) return listHasil;
  const rows = pemasukan.length;

  for (let r = 0; r < rows; r++) {
    const row = pemasukan[r];
    const cols = row.length;

    for (let c = 0; c < cols; c++) {
      if (!row[c]) continue;
      const sel = row[c].toString().trim().toLowerCase();

      if (targetKategori.hasOwnProperty(sel)) {
        const adaTgl = (c > 0) && (row[c - 1] && row[c - 1].toString().trim().toLowerCase() === 'tgl');
        const adaNominal = (c < cols - 1) && (row[c + 1] && row[c + 1].toString().trim().toLowerCase() === 'nominal');

        if (adaTgl && adaNominal) {
          const info = targetKategori[sel];
          const colTgl = c - 1;
          const colKategori = c;
          const colNominal = c + 1;

          for (let rowData = r + 1; rowData < rows; rowData++) {
            if (!pemasukan[rowData] || pemasukan[rowData].length <= colTgl) break;

            const tanggal = pemasukan[rowData][colTgl] !== undefined ? pemasukan[rowData][colTgl].toString().trim() : '';
            const nominal = pemasukan[rowData][colNominal] !== undefined ? pemasukan[rowData][colNominal].toString().trim() : '';
            const keterangan = pemasukan[rowData][colKategori] !== undefined ? pemasukan[rowData][colKategori].toString().trim() : '';

            if (tanggal === '' && nominal === '') break;
            if (tanggal.toLowerCase() === 'tgl') break;

            listHasil.push({
              status:info.status, kategori:info.asli,
              payload:{
                id:0, tanggal, keterangan,
                debet: Number(nominal.replace(/[^0-9.-]+/g, "")) || 0, kredit: '-', url: '-'
              }
            });
          }
        }
      }
    }
  }
  return listHasil;
}

function prosesDataPengeluaran(pengeluaran,targetKategori) {
  const listHasil = [];
  if (!pengeluaran || pengeluaran.length <= 1) return listHasil;
  const rows = pengeluaran.length;
  const iTgl=0, iPerlu=1, iTambahan=2, iJml=5, iUrl=6, iAnggaran=7;

  for (let r = 1; r < rows; r++) {
    const row = pengeluaran[r];
    if (!row || row.length <= iAnggaran) continue;

    const tanggal = row[iTgl] !== undefined ? row[iTgl].toString().trim() : '';
    const keperluan = row[iPerlu] !== undefined ? row[iPerlu].toString().trim() : '';
    const tambahan = row[iTambahan] !== undefined ? row[iTambahan].toString().trim() : '';
    const nominal = row[iJml] !== undefined ? row[iJml].toString().trim() : '';
    const anggaran = row[iAnggaran] !== undefined ? row[iAnggaran].toString().trim() : '';
    const url = row[iUrl] !== undefined ? row[iUrl].toString().trim() : '-';

    if (tanggal === '' && nominal === '' && anggaran === '') continue;

    const anggaranKey = anggaran.toLowerCase();
    if (targetKategori.hasOwnProperty(anggaranKey)) {
      const info = targetKategori[anggaranKey];
      listHasil.push({
        status:info.status, kategori:info.asli,
        payload:{
          id:0, tanggal,
          keterangan: tambahan !== '' ? `${keperluan} # ${tambahan}` : keperluan,
          debet: '-', kredit: Number(nominal.replace(/[^0-9.-]+/g, "")) || 0, url
        }
      });
    }
  }
  return listHasil;
}

window.addEventListener('DOMContentLoaded', function() {      
  const kontenUtama = document.querySelector('main#konten-utama');
  kontenUtama.addEventListener('change', function(e) {
    // Cek apakah yang diubah adalah switch dengan class 'toggle-calcs'
    if (e.target && e.target.classList.contains('toggle-calcs')) {
      const cardBody = e.target.closest('.card-body');
      if (cardBody) {
        cardBody.classList.toggle('show-total', e.target.checked);
      }
    }
  });

  const modalBerkas = document.getElementById('modalBerkas');
  if (modalBerkas) {
    modalBerkas.addEventListener('show.bs.modal', function (event) {
      const idDrive = event.relatedTarget.getAttribute('data-id');
      const title = modalBerkas.querySelector('#titleBerkas');
      const iframe = modalBerkas.querySelector('#modalFrame');
      
      if (idDrive && title && iframe) {
        title.textContent = event.relatedTarget.getAttribute('data-txt');
        iframe.src = `https://drive.google.com/file/d/${idDrive}/preview`;
      }
    });
    modalBerkas.addEventListener('hidden.bs.modal', function () {
      const title = modalBerkas.querySelector('#titleBerkas');
      const iframe = modalBerkas.querySelector('#modalFrame');
      if (title && iframe) {
        title.textContent = 'Pratinjau';
        iframe.src = '';
      }
    });
  }
});

function prosesRekap(dt) {
  const saldoval = dt.valueRanges[0].values;
  const cardKas = saldoval.slice(1)
  .filter(v => parseInt(v[3]) > 0)
  .map((row) => {
    let obj = {};
    saldoval[0].forEach(function(h,i) {
      let cellValue = row[i];
      if (cellValue === null || cellValue === undefined) {obj[h] = ''}
      else {obj[h] = String(cellValue)}
    });
    if (obj.Kas in MasterKas.aktif) {obj.Status = 'Aktif'}
    else if (obj.Kas in MasterKas.arsip) {obj.Status = 'Arsip'}
    else {obj.Status = 'Lainnya'}
    return obj;
  })
  .sort((a,b) => {
    if (a.Status === 'Aktif' && b.Status === 'Arsip') return -1;
    if (a.Status === 'Arsip' && b.Status === 'Aktif') return 1;

    if (a.Status === 'Aktif' && b.Status === 'Aktif') {
      const prioritas = ['Bulanan', 'Jimpitan'];
      const indeksA = prioritas.indexOf(a.Kas);
      const indeksB = prioritas.indexOf(b.Kas);

      if (indeksA !== -1 && indeksB === -1) return -1; // Jika a termasuk prioritas tetapi b tidak
      if (indeksA === -1 && indeksB !== -1) return 1; // Jika b termasuk prioritas tetapi a tidak
      if (indeksA !== -1 && indeksB !== -1) return indeksA - indeksB; // Jika keduanya prioritas, urutkan berdasarkan array prioritas
    }
    return 0;
  });

  const tblval = dt.valueRanges[1].values;
  const tblIuran = {headers:[], data:[]};
  if (!tblval || tblval.length <= 2) return { headers: [], data: [] };
  const mainHeaders = tblval[0];
  const subHeaders = tblval[1];
  const rows = tblval.slice(2);
  let headerStructure = [];
  let lastMainTitle = '';
  let maxColumns = Math.max(mainHeaders.length, subHeaders.length);

  for (let i = 0; i < maxColumns; i++) {
    let currentMain = mainHeaders[i] ? mainHeaders[i].toString().trim() : "";
    let subTitle = subHeaders[i] ? subHeaders[i].toString().trim() : "";
    // Handle Merge Horizontal (Bulan)
    if (currentMain !== '') lastMainTitle = currentMain;
    // Handle Merge Vertikal (No. dan Nama)
    if (currentMain !== '' && subTitle === '') {
      subTitle = currentMain;
      currentMain = '';
    }
    let activeMain = currentMain || lastMainTitle; 
    let isStaticColumn = (subTitle === 'No.' || subTitle === 'Nama');
    let fieldKey = isStaticColumn ? subTitle : `${activeMain}#${subTitle}`;
    headerStructure.push({
      main: isStaticColumn ? '' : activeMain,
      sub:subTitle, field:fieldKey
    });
  }
  // Mapping Data Baris (Mengunci posisi berdasarkan indeks kolom agar tidak acak)
  const formatData = rows.map(row => {
    let obj = {};
    headerStructure.forEach((h, index) => {
      obj[h.field] = (row[index] !== undefined) ? row[index] : ""; 
    });
    return obj;
  });
  tblIuran.headers = headerStructure;
  tblIuran.data = formatData;

  return {cardKas, tblIuran};
}

function prosesTransaksi(dt) {
  const Kas = structuredClone(MasterKas);
  const Laporan = {Meet:'', Pemasukan:[], Pengeluaran:[]};
  const pemasukan = dt.valueRanges[0].values;
  const pengeluaran = dt.valueRanges[1].values;
  const meetDate = new Date(dt.valueRanges[2].values.toString());
  Laporan.Meet = meetDate.toLocaleDateString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric'});

  const targetKategori = {};
  for (const status in Kas) {
    for (const kategori in Kas[status]) {
      targetKategori[kategori.trim().toLowerCase()] = {status, asli: kategori};
    }
  }

  prosesDataPemasukan(pemasukan,targetKategori).forEach(item => {
    if (new Date(item.payload.tanggal) > meetDate) {
      Laporan.Pemasukan.push({kategori:item.kategori, ...item.payload});
    } else {
      Kas[item.status][item.kategori].push(item.payload);
    }
  });
  prosesDataPengeluaran(pengeluaran,targetKategori).forEach(item => {
    if (new Date(item.payload.tanggal) > meetDate) Laporan.Pengeluaran.push({kategori:item.kategori, ...item.payload});
    else Kas[item.status][item.kategori].push(item.payload);
  });

  ['Pemasukan','Pengeluaran'].forEach(jenis => {
    if (Laporan[jenis]) {
      Laporan[jenis].sort((a,b) => {
        return new Date(b.tanggal) - new Date(a.tanggal);
      });
    }
  });

  // sortir by tanggal dan assign id
  for (const status in Kas) {
    for (const kategori in Kas[status]) {
      const listTransaksi = Kas[status][kategori];
      if (listTransaksi.length > 0) {
        // Menyatukan & mengurutkan Pemasukan + Pengeluaran
        listTransaksi.sort((a, b) => {
          const tanggalA = new Date(a.tanggal);
          const tanggalB = new Date(b.tanggal);
          
          // Jika tanggal berbeda, urutkan berdasarkan tanggal terlama ke terbaru
          if (tanggalA - tanggalB !== 0) return tanggalA - tanggalB;
          
          // JIKA TANGGAL SAMA: Dahulukan Pemasukan (yang debetnya bukan '-')
          const apakahAMasuk = a.debet !== '-';
          const apakahBMasuk = b.debet !== '-';
          if (apakahAMasuk && !apakahBMasuk) return -1; // 'a' (pemasukan) naik ke atas
          if (!apakahAMasuk && apakahBMasuk) return 1;  // 'b' (pemasukan) naik ke atas
          
          return 0;
        });

        // Buat ID baru yang runtut dari 1 untuk Tabulator
        listTransaksi.forEach((item, index) => {item.id = index + 1});
      }
    }
  }

  return {Laporan, Histori:Kas};
}

function prosesJimpitan(dt) {
  try {
    const Val = dt.valueRanges[0].values;
    const headers = Val[0].filter(nama => nama !== 'Total Harian');
    const rows = Val.slice(1);
    let hariIni = new Date();
    hariIni.setHours(0,0,0,0);
    const data = rows.filter(function(row) {
      const kosong = row.slice(1).filter(item => String(item).trim() === '').length;
      return kosong < 1;
    }).map(function(row) {
      let obj = {};
      headers.forEach(function(h,i) {
        let cellValue = row[i];
        if (cellValue === null || cellValue === undefined) {obj[h] = ""}
        else {obj[h] = String(cellValue)}
      });
      return obj;
    });
    return {headers, data, message:'', embed:dt.valueRanges[1].values.flat()};
  } catch (err) {
    return {message:err.message};
  }
}
