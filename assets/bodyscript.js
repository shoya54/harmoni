function prosesRekap(dt) {
  const cardKas = dt.saldoval.slice(1)
  .filter(v => parseInt(v[3]) > 0)
  .map((row) => {
    let obj = {};
    dt.saldoval[0].forEach(function(h,i) {
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

  const tblIuran = {headers:[], data:[]};
  if (!dt.tblval || dt.tblval.length <= 2) return { headers: [], data: [] };
  const mainHeaders = dt.tblval[0];
  const subHeaders = dt.tblval[1];
  const rows = dt.tblval.slice(2);
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
