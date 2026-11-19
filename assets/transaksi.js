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
