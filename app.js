/* =============================================
   KalkuHPP – app.js
   Kalkulator HPP Minuman Kekinian
   ============================================= */

'use strict';

// ─── STATE ────────────────────────────────────
const state = {
  bahan:    [],  // { id, nama, satuan, jml, harga }
  kemasan:  [],  // { id, nama, satuan, jml, harga }
  tk:       [],  // { id, posisi, orang, gaji }
  overhead: [],  // { id, nama, biaya }
  alat:     [],  // { id, nama, harga, umur }
};

let uid = 1;
const newId = () => uid++;

// ─── DEFAULTS ─────────────────────────────────
const DEFAULTS = {
  bahan: [
    { nama:'Susu Segar', satuan:'ml', jml:200, harga:15 },
    { nama:'Teh / Kopi', satuan:'gram', jml:5, harga:200 },
    { nama:'Gula / Sirup', satuan:'ml', jml:30, harga:20 },
    { nama:'Es Batu', satuan:'gram', jml:150, harga:2 },
    { nama:'Topping (Boba/Jelly)', satuan:'gram', jml:50, harga:60 },
  ],
  kemasan: [
    { nama:'Cup Plastik', satuan:'pcs', jml:1, harga:1500 },
    { nama:'Tutup Cup', satuan:'pcs', jml:1, harga:400 },
    { nama:'Sedotan', satuan:'pcs', jml:1, harga:200 },
    { nama:'Kantong Plastik', satuan:'pcs', jml:1, harga:150 },
    { nama:'Stiker / Label', satuan:'pcs', jml:1, harga:300 },
  ],
  tk: [
    { posisi:'Barista / Pramuniaga', orang:1, gaji:2500000 },
  ],
  overhead: [
    { nama:'Sewa Tempat', biaya:2000000 },
    { nama:'Listrik', biaya:500000 },
    { nama:'Air & Gas', biaya:200000 },
    { nama:'Internet / WiFi', biaya:150000 },
  ],
  alat: [
    { nama:'Blender / Mesin', harga:1500000, umur:36 },
    { nama:'Mesin Sealer Cup', harga:2000000, umur:48 },
    { nama:'Kulkas', harga:3000000, umur:60 },
  ],
};

// ─── UTILS ────────────────────────────────────
const fmt = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const fmtShort = (n) => {
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(1).replace('.', ',') + ' jt';
  if (n >= 1_000)    return 'Rp ' + (n / 1_000).toFixed(0) + ' rb';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
};

const el  = (id) => document.getElementById(id);
const num = (id) => parseFloat(el(id)?.value) || 0;

let toastTimer;
function showToast(msg, type = 'success') {
  const t = el('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast hidden'; }, 2500);
}

// round up to nearest 500
function roundPrice(p) {
  return Math.ceil(p / 500) * 500;
}

// ─── CHART ────────────────────────────────────
const COLORS = ['#7c6af7','#f8a84b','#34d39a','#5bc7f5','#f26b6b'];
const LABELS = ['Bahan Baku','Kemasan','Tenaga Kerja','Overhead','Penyusutan'];

function drawChart(values) {
  const canvas = el('costChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 8;

  ctx.clearRect(0, 0, W, H);

  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) {
    ctx.fillStyle = '#252b4e';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5e6690';
    ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada data', cx, cy);
    el('chartLegend').innerHTML = '';
    return;
  }

  let start = -Math.PI / 2;
  const legendHtml = [];
  values.forEach((v, i) => {
    if (v <= 0) return;
    const slice = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = COLORS[i];
    ctx.fill();
    ctx.strokeStyle = '#1e2340';
    ctx.lineWidth = 2;
    ctx.stroke();
    start += slice;
    const pct = ((v / total) * 100).toFixed(0);
    legendHtml.push(`<div class="legend-item">
      <div class="legend-dot" style="background:${COLORS[i]}"></div>
      <span>${LABELS[i]}: <strong>${pct}%</strong></span>
    </div>`);
  });

  // donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#12152a';
  ctx.fill();

  el('chartLegend').innerHTML = legendHtml.join('');
}

// ─── RENDER TABLES ────────────────────────────
function renderBahan() {
  const tbody = el('bodyBahan');
  tbody.innerHTML = state.bahan.map(r => `
    <tr data-id="${r.id}">
      <td><input type="text"   value="${r.nama}"   onchange="updateRow('bahan',${r.id},'nama',this.value)" placeholder="Nama bahan" /></td>
      <td><input type="text"   value="${r.satuan}" onchange="updateRow('bahan',${r.id},'satuan',this.value)" placeholder="ml/gr/pcs" style="width:70px"/></td>
      <td><input type="number" value="${r.jml}"    onchange="updateRow('bahan',${r.id},'jml',this.value)"   min="0" style="width:80px"/></td>
      <td><input type="number" value="${r.harga}"  onchange="updateRow('bahan',${r.id},'harga',this.value)" min="0" /></td>
      <td class="col-total">${fmt(r.jml * r.harga)}</td>
      <td><button class="btn-delete" onclick="deleteRow('bahan',${r.id})">🗑</button></td>
    </tr>`).join('');
  const total = state.bahan.reduce((s, r) => s + r.jml * r.harga, 0);
  el('totalBahan').textContent = fmt(total);
  recalc();
}

function renderKemasan() {
  const tbody = el('bodyKemasan');
  tbody.innerHTML = state.kemasan.map(r => `
    <tr data-id="${r.id}">
      <td><input type="text"   value="${r.nama}"   onchange="updateRow('kemasan',${r.id},'nama',this.value)" placeholder="Nama item" /></td>
      <td><input type="text"   value="${r.satuan}" onchange="updateRow('kemasan',${r.id},'satuan',this.value)" placeholder="pcs" style="width:70px"/></td>
      <td><input type="number" value="${r.jml}"    onchange="updateRow('kemasan',${r.id},'jml',this.value)"   min="0" style="width:80px"/></td>
      <td><input type="number" value="${r.harga}"  onchange="updateRow('kemasan',${r.id},'harga',this.value)" min="0" /></td>
      <td class="col-total">${fmt(r.jml * r.harga)}</td>
      <td><button class="btn-delete" onclick="deleteRow('kemasan',${r.id})">🗑</button></td>
    </tr>`).join('');
  const total = state.kemasan.reduce((s, r) => s + r.jml * r.harga, 0);
  el('totalKemasan').textContent = fmt(total);
  recalc();
}

function renderTK() {
  const tbody = el('bodyTK');
  tbody.innerHTML = state.tk.map(r => `
    <tr data-id="${r.id}">
      <td><input type="text"   value="${r.posisi}" onchange="updateRow('tk',${r.id},'posisi',this.value)" placeholder="Posisi" /></td>
      <td><input type="number" value="${r.orang}"  onchange="updateRow('tk',${r.id},'orang',this.value)"  min="1" style="width:80px"/></td>
      <td><input type="number" value="${r.gaji}"   onchange="updateRow('tk',${r.id},'gaji',this.value)"   min="0" /></td>
      <td class="col-total">${fmt(r.orang * r.gaji)}</td>
      <td><button class="btn-delete" onclick="deleteRow('tk',${r.id})">🗑</button></td>
    </tr>`).join('');
  const total = state.tk.reduce((s, r) => s + r.orang * r.gaji, 0);
  el('totalTK').textContent = fmt(total);
  recalc();
}

function renderOverhead() {
  const tbody = el('bodyOverhead');
  tbody.innerHTML = state.overhead.map(r => `
    <tr data-id="${r.id}">
      <td><input type="text"   value="${r.nama}"  onchange="updateRow('overhead',${r.id},'nama',this.value)" placeholder="Jenis biaya" /></td>
      <td><input type="number" value="${r.biaya}" onchange="updateRow('overhead',${r.id},'biaya',this.value)" min="0" /></td>
      <td class="col-total">${fmt(r.biaya)}</td>
      <td><button class="btn-delete" onclick="deleteRow('overhead',${r.id})">🗑</button></td>
    </tr>`).join('');
  const total = state.overhead.reduce((s, r) => s + r.biaya, 0);
  el('totalOverhead').textContent = fmt(total);
  recalc();
}

function renderAlat() {
  const tbody = el('bodyAlat');
  tbody.innerHTML = state.alat.map(r => `
    <tr data-id="${r.id}">
      <td><input type="text"   value="${r.nama}"  onchange="updateRow('alat',${r.id},'nama',this.value)" placeholder="Nama alat" /></td>
      <td><input type="number" value="${r.harga}" onchange="updateRow('alat',${r.id},'harga',this.value)" min="0" /></td>
      <td><input type="number" value="${r.umur}"  onchange="updateRow('alat',${r.id},'umur',this.value)"  min="1" style="width:100px"/></td>
      <td class="col-total">${fmt(r.harga / r.umur)}</td>
      <td><button class="btn-delete" onclick="deleteRow('alat',${r.id})">🗑</button></td>
    </tr>`).join('');
  const total = state.alat.reduce((s, r) => s + r.harga / r.umur, 0);
  el('totalAlat').textContent = fmt(total);
  recalc();
}

// ─── ROW CRUD ─────────────────────────────────
window.updateRow = (section, id, field, val) => {
  const item = state[section].find(r => r.id === id);
  if (!item) return;
  item[field] = isNaN(parseFloat(val)) ? val : parseFloat(val);
  const renders = { bahan: renderBahan, kemasan: renderKemasan, tk: renderTK, overhead: renderOverhead, alat: renderAlat };
  renders[section]();
};

window.deleteRow = (section, id) => {
  state[section] = state[section].filter(r => r.id !== id);
  const renders = { bahan: renderBahan, kemasan: renderKemasan, tk: renderTK, overhead: renderOverhead, alat: renderAlat };
  renders[section]();
  showToast('Item dihapus', 'success');
};

// ─── MODAL ────────────────────────────────────
let currentModal = null;

function openModal(type) {
  currentModal = type;
  const overlay = el('modalOverlay');
  const body    = el('modalBody');
  const titles  = { bahan:'Tambah Bahan Baku', kemasan:'Tambah Kemasan', tk:'Tambah Tenaga Kerja', overhead:'Tambah Biaya Overhead', alat:'Tambah Alat' };
  el('modalTitle').textContent = titles[type];

  const fields = {
    bahan:    `<div class="form-group"><label>Nama Bahan</label><input id="mf1" type="text" placeholder="cth: Susu UHT"/></div>
               <div class="form-group"><label>Satuan</label><input id="mf2" type="text" placeholder="ml / gram / pcs" value="ml"/></div>
               <div class="form-group"><label>Jumlah per Cup</label><input id="mf3" type="number" min="0" value="0"/></div>
               <div class="form-group"><label>Harga per Satuan (Rp)</label><input id="mf4" type="number" min="0" value="0"/></div>`,
    kemasan:  `<div class="form-group"><label>Nama Item</label><input id="mf1" type="text" placeholder="cth: Cup Plastik"/></div>
               <div class="form-group"><label>Satuan</label><input id="mf2" type="text" placeholder="pcs" value="pcs"/></div>
               <div class="form-group"><label>Jumlah per Cup</label><input id="mf3" type="number" min="0" value="1"/></div>
               <div class="form-group"><label>Harga per Satuan (Rp)</label><input id="mf4" type="number" min="0" value="0"/></div>`,
    tk:       `<div class="form-group"><label>Posisi / Jabatan</label><input id="mf1" type="text" placeholder="cth: Barista"/></div>
               <div class="form-group"><label>Jumlah Orang</label><input id="mf3" type="number" min="1" value="1"/></div>
               <div class="form-group"><label>Gaji per Bulan (Rp)</label><input id="mf4" type="number" min="0" value="0"/></div>`,
    overhead: `<div class="form-group"><label>Jenis Biaya</label><input id="mf1" type="text" placeholder="cth: Sewa Tempat"/></div>
               <div class="form-group"><label>Biaya per Bulan (Rp)</label><input id="mf4" type="number" min="0" value="0"/></div>`,
    alat:     `<div class="form-group"><label>Nama Alat</label><input id="mf1" type="text" placeholder="cth: Blender"/></div>
               <div class="form-group"><label>Harga Beli (Rp)</label><input id="mf4" type="number" min="0" value="0"/></div>
               <div class="form-group"><label>Umur Pakai (Bulan)</label><input id="mf5" type="number" min="1" value="24"/></div>`,
  };

  body.innerHTML = fields[type];
  overlay.classList.remove('hidden');
  document.querySelector('#modalBody input')?.focus();
}

function closeModal() {
  el('modalOverlay').classList.add('hidden');
  currentModal = null;
}

function saveModal() {
  const v1 = el('mf1')?.value.trim();
  const v2 = el('mf2')?.value.trim();
  const v3 = parseFloat(el('mf3')?.value) || 0;
  const v4 = parseFloat(el('mf4')?.value) || 0;
  const v5 = parseFloat(el('mf5')?.value) || 24;

  if (!v1) { showToast('Nama tidak boleh kosong!', 'error'); return; }

  const renders = { bahan: renderBahan, kemasan: renderKemasan, tk: renderTK, overhead: renderOverhead, alat: renderAlat };

  switch (currentModal) {
    case 'bahan':    state.bahan.push({ id: newId(), nama: v1, satuan: v2||'ml', jml: v3, harga: v4 }); break;
    case 'kemasan':  state.kemasan.push({ id: newId(), nama: v1, satuan: v2||'pcs', jml: v3, harga: v4 }); break;
    case 'tk':       state.tk.push({ id: newId(), posisi: v1, orang: v3||1, gaji: v4 }); break;
    case 'overhead': state.overhead.push({ id: newId(), nama: v1, biaya: v4 }); break;
    case 'alat':     state.alat.push({ id: newId(), nama: v1, harga: v4, umur: v5 }); break;
  }

  renders[currentModal]();
  closeModal();
  showToast('Item berhasil ditambahkan ✓', 'success');
}

// ─── RECALCULATE ──────────────────────────────
function recalc() {
  const targetPerHari  = num('targetProduksi') || 50;
  const hariPerBulan   = num('hariOperasi') || 26;
  const totalCupBulan  = targetPerHari * hariPerBulan;

  // biaya per cup
  const biayaBahan   = state.bahan.reduce((s, r) => s + r.jml * r.harga, 0);
  const biayaKemasan = state.kemasan.reduce((s, r) => s + r.jml * r.harga, 0);

  // per bulan → per cup
  const totalTKBulan       = state.tk.reduce((s, r) => s + r.orang * r.gaji, 0);
  const totalOverheadBulan = state.overhead.reduce((s, r) => s + r.biaya, 0);
  const totalAlatBulan     = state.alat.reduce((s, r) => s + (r.harga / r.umur), 0);

  const biayaTKperCup       = totalCupBulan > 0 ? totalTKBulan / totalCupBulan : 0;
  const biayaOverheadperCup = totalCupBulan > 0 ? totalOverheadBulan / totalCupBulan : 0;
  const biayaAlatperCup     = totalCupBulan > 0 ? totalAlatBulan / totalCupBulan : 0;

  const hpp = biayaBahan + biayaKemasan + biayaTKperCup + biayaOverheadperCup + biayaAlatperCup;

  const margin = num('marginPersen') / 100;
  const pajak  = num('pajakPersen') / 100;

  const marginNominal = hpp * margin;
  const hargaSebelumPajak = hpp + marginNominal;
  const pajakNominal = hargaSebelumPajak * pajak;
  const hargaJual = hargaSebelumPajak + pajakNominal;
  const hargaRound = roundPrice(hargaJual);

  // BEP
  const biayaTetapBulan = totalTKBulan + totalOverheadBulan + totalAlatBulan;
  const biayaVariabelPerCup = biayaBahan + biayaKemasan;
  const kontribusiMargin = hargaRound - biayaVariabelPerCup;
  const bepUnitBulan = kontribusiMargin > 0 ? Math.ceil(biayaTetapBulan / kontribusiMargin) : 0;
  const bepUnitHari  = hariPerBulan > 0 ? Math.ceil(bepUnitBulan / hariPerBulan) : 0;
  const bepOmzet     = bepUnitBulan * hargaRound;
  const labaBulan    = (totalCupBulan * hargaRound) - (totalCupBulan * biayaVariabelPerCup) - biayaTetapBulan;
  const omzetBulan   = totalCupBulan * hargaRound;

  // update summary
  el('sBahan').textContent    = fmt(biayaBahan);
  el('sKemasan').textContent  = fmt(biayaKemasan);
  el('sTK').textContent       = fmt(biayaTKperCup);
  el('sOverhead').textContent = fmt(biayaOverheadperCup);
  el('sAlat').textContent     = fmt(biayaAlatperCup);

  el('rHPP').textContent          = fmt(hpp);
  el('rMarginLabel').textContent  = num('marginPersen');
  el('rMarginNominal').textContent= fmt(marginNominal);
  el('rPajakLabel').textContent   = num('pajakPersen');
  el('rPajakNominal').textContent = fmt(pajakNominal);
  el('rHargaJual').textContent    = fmt(hargaJual);
  el('rHargaRound').textContent   = fmt(hargaRound);

  el('bepUnit').textContent   = bepUnitHari.toLocaleString('id-ID');
  el('bepOmzet').textContent  = fmtShort(bepOmzet);
  el('labaBulan').textContent = fmtShort(labaBulan);
  el('omzetBulan').textContent= fmtShort(omzetBulan);

  // progress bar
  const pct = bepUnitHari > 0 ? Math.min((targetPerHari / bepUnitHari) * 100, 100) : 0;
  el('progressFill').style.width = pct + '%';
  el('progressLabel').textContent = `Target: ${targetPerHari} cup/hari  |  BEP: ${bepUnitHari} cup/hari`;

  // chart
  drawChart([biayaBahan, biayaKemasan, biayaTKperCup, biayaOverheadperCup, biayaAlatperCup]);

  // product info
  const nama = el('namaProduk').value || '—';
  const kat  = el('kategori').value   || '—';
  el('spName').textContent = nama;
  el('spCat').textContent  = kat;

  // badge
  if (hpp > 0) {
    el('summaryBadge').textContent = 'Siap ✓';
    el('summaryBadge').classList.add('ready');
  }
}

// ─── HITUNG BUTTON ────────────────────────────
el('btnHitung').addEventListener('click', () => {
  recalc();
  showToast('HPP berhasil dihitung! 🎉', 'success');
  el('summaryCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ─── MARGIN SLIDER ────────────────────────────
const slider    = el('marginSlider');
const marginInp = el('marginPersen');

function syncSlider(val) {
  const pct = (Math.min(val, 200) / 200) * 100;
  slider.style.setProperty('--pct', pct + '%');
  el('marginLabel').textContent = val + '%';
}

slider.addEventListener('input', () => {
  marginInp.value = slider.value;
  syncSlider(slider.value);
  recalc();
});

marginInp.addEventListener('input', () => {
  slider.value = Math.min(marginInp.value, 200);
  syncSlider(marginInp.value);
  recalc();
});

// live recalc on any input change
document.querySelectorAll('#sectionProduk input, #sectionProduk select, #sectionMargin input').forEach(inp => {
  inp.addEventListener('input', recalc);
});

// ─── ADD BUTTONS ──────────────────────────────
el('btnAddBahan').addEventListener('click',    () => openModal('bahan'));
el('btnAddKemasan').addEventListener('click',  () => openModal('kemasan'));
el('btnAddTK').addEventListener('click',       () => openModal('tk'));
el('btnAddOverhead').addEventListener('click', () => openModal('overhead'));
el('btnAddAlat').addEventListener('click',     () => openModal('alat'));

el('modalClose').addEventListener('click',  closeModal);
el('modalCancel').addEventListener('click', closeModal);
el('modalSave').addEventListener('click',   saveModal);
el('modalOverlay').addEventListener('click', (e) => { if (e.target === el('modalOverlay')) closeModal(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && currentModal) saveModal();
});

// ─── RESET ────────────────────────────────────
el('btnReset').addEventListener('click', () => {
  if (!confirm('Reset semua data ke kondisi awal?')) return;
  initDefaults();
  el('namaProduk').value    = '';
  el('kategori').value      = '';
  el('ukuranSajian').value  = '';
  el('targetProduksi').value= '50';
  el('hariOperasi').value   = '26';
  el('marginPersen').value  = '30';
  el('pajakPersen').value   = '0';
  slider.value = 30;
  syncSlider(30);
  showToast('Data berhasil direset', 'success');
});

// ─── EXPORT PDF ───────────────────────────────
el('btnExport').addEventListener('click', () => {
  // Hide toast before printing so it doesn't overlay the PDF
  const t = el('toast');
  t.className = 'toast hidden';
  clearTimeout(toastTimer);
  setTimeout(() => {
    window.print();
    showToast('PDF berhasil diekspor! 📥', 'success');
  }, 100);
});

// ─── INIT DEFAULTS ────────────────────────────
function initDefaults() {
  state.bahan    = DEFAULTS.bahan.map(r    => ({ id: newId(), ...r }));
  state.kemasan  = DEFAULTS.kemasan.map(r  => ({ id: newId(), ...r }));
  state.tk       = DEFAULTS.tk.map(r       => ({ id: newId(), ...r }));
  state.overhead = DEFAULTS.overhead.map(r => ({ id: newId(), ...r }));
  state.alat     = DEFAULTS.alat.map(r     => ({ id: newId(), ...r }));

  renderBahan();
  renderKemasan();
  renderTK();
  renderOverhead();
  renderAlat();
  syncSlider(30);
  recalc();
}

// ─── BOOT ─────────────────────────────────────
initDefaults();
