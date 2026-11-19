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
