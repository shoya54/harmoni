const Notif = Swal.mixin({
  toast:true, position:'top-end', showConfirmButton:false, timer:2000, timerProgressBar:true,
  didOpen: (t) => { t.onmouseenter = Swal.stopTimer; t.onmouseleave = Swal.resumeTimer; }
});
const DaftarBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DaftarBulanMin = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DaftarHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const DaftarHariMin = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const FormatBulanTahun = new Intl.DateTimeFormat('id-ID', {month:'long', year:'numeric'});
const gasUrl = 'https://script.google.com/macros/s/AKfycbyoT6ogogKz5ShiImTx9rGHCNCDisl6gAiGRPFbv5KI57_5Eh7b_oZ2LpGY-1E3JzAhaQ/exec';
var allTbl = {tblIuran:null, tblLapIn:null, tblLapOut:null, tblJimpitan:null};

async function prosesLog() {
  const parser = new UAParser();
  let hasil = parser.getResult();

  // Coba ambil Client Hints lewat UAParser v2
  try {
    hasil = await hasil.withClientHints();
  } catch (e) {}

  let merek = hasil.device.vendor || '';
  let model = hasil.device.model || '';

  // Fallback: Baca langsung dari API native browser jika UAParser masih kosong
  if ((!model || model === 'K') && navigator.userAgentData) {
    try {
      const hints = await navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion']);
      if (hints.model) {
        model = hints.model;
      }
    } catch (err) {}
  }

  // Tebak merek otomatis dari awalan kode model HP Android yang umum di Indonesia
  if (!merek && model) {
    if (/^SM-/i.test(model)) merek = 'SAMSUNG';
    else if (/^(22|23|24|M2|Redmi|POCO)/i.test(model)) merek = 'XIAOMI/REDMI/POCO';
    else if (/^(CPH|RMX)/i.test(model)) merek = 'OPPO/REALME';
    else if (/^(V2|Vivo)/i.test(model)) merek = 'VIVO';
    else if (/^(X6|Infinix)/i.test(model)) merek = 'INFINIX';
  }

  const dataLog = {
    tipePerangkat: hasil.device.type || (navigator.userAgentData?.mobile ? 'MOBILE' : 'DESKTOP'),
    merek: merek || '-',
    model: model || '-',
    os: `${hasil.os.name} ${hasil.os.version}`.trim(),
    browser: `${hasil.browser.name} (Versi ${hasil.browser.version})`.trim(),
    resolusi: `${window.screen.width}x${window.screen.height}`,
    userAgentMentah: navigator.userAgent
  };

  google.script.run.logDevice(dataLog);
}

function btnAllWarga(visible) {
  allTbl.tblJimpitan.getColumns().forEach(c => {
    c.getDefinition().title !== 'Tanggal' && (visible ? c.show() : c.hide());
  });
  allTbl.tblJimpitan.redraw(true);

  let chkJimpitan = document.querySelectorAll('#daftar-checkbox-kolom input[type="checkbox"]');
  chkJimpitan.forEach(cb => cb.checked = visible);
}

function toggleKolomWarga() {
  let menu = document.getElementById('container-chk-jimpitan');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style:'currency', currency:'IDR', minimumFractionDigits:0
  }).format(Number(num));
}

function formatWarnaTagihan(cell,params) {
  const val = cell.getValue();
  if (!val || val === '-') return val;

  let cls = '';
  if (params.main.includes('Kekurangan')) {
    if (val !== 'Rp 0') {
      cls = params.sub === 'Jumlah' ? 'text-danger fw-bolder' : 'text-danger';
    }
  }
  else if (val === 'Rp 0' || val.includes('(-')) cls = 'text-danger';
  else if (val.includes('(+')) cls = 'text-primary';

  return cls ? `<span class="${cls}">${val}</span>` : val;
}
