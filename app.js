/* =========================================================
   Checklist de Equipamentos — lógica do redesign
   Vanilla JS (ES6+), localStorage + Firebase, offline-first
   ========================================================= */
'use strict';

/* ---------- 1. Constantes e estado ---------- */
const KEYS = { equip: 'ced_equip', hist: 'ced_history', session: 'ced_session', prefs: 'ced_prefs', meta: 'ced_meta' };

const DEFAULT_EQUIP = [
  { id: 'tablets',     name: 'Tablets',         expected: 15, icon: 'tablet' },
  { id: 'celulares',   name: 'Celulares',       expected: 15, icon: 'phone' },
  { id: 'carregadores',name: 'Carregadores',    expected: 30, auto: true, icon: 'charger' },
  { id: 'smartwatches',name: 'Smartwatches',    expected: 10, icon: 'watch' },
  { id: 'vrbox',       name: 'VR Box',          expected: 10, icon: 'vr' },
  { id: 'metaverso',   name: 'Óculos Metaverso',expected: 5,  icon: 'glasses' }
];

const ICON_MAP = {
  tablet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79"/></svg>`,
  charger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L11 16L7 12L6.24 7.89L4 6.73L9.09 5.64L12 2Z"/></svg>`,
  watch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/></svg>`,
  vr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"/><line x1="12" y1="17" x2="12.01" y2="17"/><line x1="9.2" y1="14.5" x2="9.81" y2="14.37"/><line x1="14.8" y1="14.5" x2="14.19" y2="14.37"/></svg>`,
  glasses: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><path d="M7 9H5c-1 0-1-1-1-1V4c0-1 1-1 1-1h2c1 0 1 1 1 1v2c0 1-1 1-1 1Z"/><path d="M17 9h-2c-1 0-1-1-1-1V4c0-1 1-1 1-1h2c1 0 1 1 1 1v2c0 1-1 1-1 1Z"/><line x1="12" y1="11" x2="12.01" y2="19"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
};

const state = {
  equip: [], counts: {}, notes: '', history: [],
  prefs: { instrutor: '', escola: '', turno: 'Manhã', theme: 'light', declare: true },
  currentReport: null, laudoCounter: 1,
  firebase: null, db: null, firebaseReady: false, online: navigator.onLine
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ---------- 2. Firebase ---------- */
function initFirebase() {
  try {
    if (typeof firebase === 'undefined') { state.firebaseReady = false; return; }
    const cfg = firebaseConfig || {};
    if (!cfg.apiKey || cfg.apiKey.includes('SUA_API_KEY')) { state.firebaseReady = false; return; }
    firebase.initializeApp(cfg);
    state.db = firebase.firestore();
    state.db.enablePersistence().catch(() => {});
    state.firebase = firebase; state.firebaseReady = true;
  } catch (e) { console.warn('Firebase:', e); state.firebaseReady = false; }
}

/* ---------- 3. Persistência ---------- */
function load(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Armazenamento local cheio ou bloqueado.'); } }
const saveEquip = () => save(KEYS.equip, state.equip);
const saveHist = () => save(KEYS.hist, state.history);
const savePrefs = () => save(KEYS.prefs, state.prefs);
const saveSession = () => save(KEYS.session, { counts: state.counts, notes: state.notes });
const saveMeta = () => save(KEYS.meta, { laudoCounter: state.laudoCounter });

async function saveToCloud(collection, docId, data) {
  if (!state.firebaseReady || !state.db) return;
  try { await state.db.collection(collection).doc(docId).set(data, { merge: true }); } catch { /* offline */ }
}
async function savePrefsToCloud() { await saveToCloud('prefs', 'user', state.prefs); }
async function saveEquipToCloud() { await saveToCloud('equip', 'list', { equip: state.equip }); }
async function saveReportToCloud(report) { await saveToCloud('reports', report.id, report); }
async function saveMetaToCloud() { await saveToCloud('meta', 'counter', { laudoCounter: state.laudoCounter }); }
async function loadHistoryFromCloud() {
  if (!state.firebaseReady || !state.db) return [];
  try { const snap = await state.db.collection('reports').orderBy('ts', 'desc').get(); return snap.docs.map(d => d.data()); } catch { return []; }
}
async function saveHistToCloud() {
  if (!state.firebaseReady) return;
  try { for (const r of state.history) { await saveToCloud('reports', r.id, r); } } catch { /* offline */ }
}

/* ---------- 4. Número de laudo ---------- */
function getNextLaudoNumber() { const n = state.laudoCounter; state.laudoCounter = n + 1; saveMeta(); saveMetaToCloud(); return n; }
function formatLaudo(n) { return `LAUDO #${new Date().getFullYear()}${pad(n)}`; }

/* ---------- 5. Ícone por categoria ---------- */
function iconFor(e) {
  const key = e.icon || (e.name.toLowerCase().includes('tablet') ? 'tablet' : e.name.toLowerCase().includes('celular') || e.name.toLowerCase().includes('smartphone') ? 'phone' : e.name.toLowerCase().includes('carreg') || e.name.toLowerCase().includes('cabo') ? 'charger' : e.name.toLowerCase().includes('watch') ? 'watch' : e.name.toLowerCase().includes('vr') ? 'vr' : e.name.toLowerCase().includes('óculos') || e.name.toLowerCase().includes('oculos') ? 'glasses' : 'default');
  return ICON_MAP[key] || ICON_MAP.default;
}

/* ---------- 6. Sincronização visual dos checkboxes ---------- */
function syncQuickCheck(id) {
  const e = state.equip.find(x => x.id === id);
  if (!e) return;
  const cb = $(`.item-check input[data-id="${id}"]`);
  const found = state.counts[id];
  const checked = found != null && found >= e.expected;
  if (cb) cb.checked = checked;
}

/* ---------- 7. Renderização do checklist ---------- */
function renderItems() {
  const box = $('#items');
  if (!state.equip.length) {
    box.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><h3>Nenhum equipamento na lista</h3><p>Cadastre os itens para começar a conferência.</p><button class="btn primary" id="btnEmptyAdd">Adicionar primeiro equipamento</button></div>`;
    $('#btnEmptyAdd')?.addEventListener('click', () => { openManageSheet(); });
    updateProgress(); return;
  }
  box.innerHTML = state.equip.map(e => {
    const found = state.counts[e.id];
    const d = found != null ? found - e.expected : null;
    const checked = found != null && found >= e.expected;
    let statusClass = 'pending', statusText = 'Não conferido';
    if (d === 0) { statusClass = 'match'; statusText = 'Confere'; }
    else if (d != null) { statusClass = 'diff'; statusText = d < 0 ? `Faltando ${Math.abs(d)}` : `Excedente +${d}`; if (d > 0) statusClass += ' excess'; }
    return `<article class="item ${statusClass}" data-id="${e.id}">
      <div class="item-icon">${iconFor(e)}</div>
      <div class="item-name">${esc(e.name)}</div>
      <div class="item-expected num">${e.expected}</div>
      <div class="item-check"><input type="checkbox" data-id="${e.id}" ${checked ? 'checked' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div class="item-badge ${statusClass}">${statusText}</div>
      <div class="counter">
        <button type="button" data-act="minus" data-id="${e.id}" aria-label="Diminuir ${esc(e.name)}">−</button>
        <input type="number" inputmode="numeric" min="0" value="${found ?? ''}" placeholder="—" data-id="${e.id}" aria-label="Quantidade encontrada de ${esc(e.name)}">
        <button type="button" data-act="plus" data-id="${e.id}" aria-label="Aumentar ${esc(e.name)}">+</button>
        <button type="button" class="ok-btn" data-act="ok" data-id="${e.id}">OK</button>
      </div>
    </article>`;
  }).join('');
  state.equip.forEach(e => syncQuickCheck(e.id));
  updateProgress();
}

function updateProgress() {
  const done = state.equip.filter(e => state.counts[e.id] != null).length;
  const divs = state.equip.filter(e => state.counts[e.id] != null && state.counts[e.id] !== e.expected).length;
  $('#progress').textContent = `${done} de ${state.equip.length} conferidos` + (divs ? ` · ${divs} divergência${divs > 1 ? 's' : ''}` : '');
}

function setCount(id, value) {
  state.counts[id] = value === null || value === '' || isNaN(value) ? null : Math.max(0, Math.floor(+value));
  const input = $(`input[type="number"][data-id="${id}"]`);
  if (input && document.activeElement !== input) input.value = state.counts[id] ?? '';
  const item = $(`.item[data-id="${id}"]`);
  if (item) {
    const d = state.counts[id] != null ? state.counts[id] - (state.equip.find(x => x.id === id)?.expected ?? 0) : null;
    item.className = 'item';
    if (state.counts[id] == null) item.classList.add('pending');
    else if (d === 0) item.classList.add('match');
    else { item.classList.add('diff'); if (d > 0) item.classList.add('excess'); }
  }
  syncQuickCheck(id);
  updateProgress(); saveSession();
}

function onItemsClick(ev) {
  const btn = ev.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const e = state.equip.find(x => x.id === id);
  const cur = state.counts[id];
  const act = btn.dataset.act;
  if (act === 'plus') setCount(id, (cur ?? 0) + 1);
  if (act === 'minus') setCount(id, Math.max(0, (cur ?? e.expected) - 1));
  if (act === 'ok') setCount(id, e.expected);
}
function onItemsInput(ev) {
  if (ev.target.matches('input[type="number"][data-id]')) setCount(ev.target.dataset.id, ev.target.value);
}
function onItemCheck(ev) {
  const cb = ev.target.closest('input[type="checkbox"]');
  if (!cb) return;
  const id = cb.dataset.id;
  const e = state.equip.find(x => x.id === id);
  if (!e) return;
  setCount(id, cb.checked ? e.expected : null);
}
function resetCounts() {
  if (!confirm('Zerar a contagem de hoje? Os equipamentos cadastrados serão mantidos.')) return;
  state.counts = {}; state.notes = ''; $('#inNotes').value = '';
  saveSession(); renderItems(); toast('Contagem resetada');
}

/* ---------- 8. Bottom Sheet: Gerenciar equipamentos ---------- */
const sheet = $('#manageSheet');
const sheetBackdrop = $('#sheetBackdrop');

function openManageSheet() { renderManage(); sheet.classList.add('open'); sheetBackdrop.classList.add('open'); }
function closeManageSheet() { sheet.classList.remove('open'); sheetBackdrop.classList.remove('open'); }

function renderManage() {
  $('#manageList').innerHTML = state.equip.map(e => `
    <div class="m-row" data-id="${e.id}">
      <input type="text" value="${esc(e.name)}" data-f="name" aria-label="Nome">
      <input type="number" min="0" value="${e.expected}" data-f="expected" aria-label="Quantidade prevista">
      <button class="btn danger small" data-del type="button">Remover</button>
      ${e.id === 'carregadores' ? `<label class="auto"><input type="checkbox" data-f="auto" ${e.auto ? 'checked' : ''}> Calcular automaticamente</label>` : ''}
    </div>`).join('') || '<div class="empty">Lista vazia.</div>';
}

function onManageInput(ev) {
  const row = ev.target.closest('.m-row'); if (!row) return;
  const e = state.equip.find(x => x.id === row.dataset.id);
  const f = ev.target.dataset.f;
  if (f === 'name') e.name = ev.target.value.trim() || e.name;
  if (f === 'expected') {
    e.expected = Math.max(0, Math.floor(+ev.target.value || 0));
    if (e.id === 'carregadores') e.auto = false;
  }
  if (f === 'auto') e.auto = ev.target.checked;
  recalcAuto();
  saveEquip(); saveEquipToCloud(); renderItems();
}

function onManageClick(ev) {
  if (!ev.target.matches('[data-del]')) return;
  const id = ev.target.closest('.m-row').dataset.id;
  const e = state.equip.find(x => x.id === id);
  if (!confirm(`Remover “${e.name}” da lista?`)) return;
  state.equip = state.equip.filter(x => x.id !== id);
  delete state.counts[id];
  recalcAuto(); saveEquip(); saveEquipToCloud(); saveSession(); renderManage(); renderItems();
}

function onAddItem(ev) {
  ev.preventDefault();
  const name = $('#newName').value.trim();
  const qty = Math.max(0, Math.floor(+$('#newQty').value || 0));
  if (!name) return;
  state.equip.push({ id: uid(), name, expected: qty });
  saveEquip(); saveEquipToCloud(); renderManage(); renderItems();
  $('#newName').value = ''; $('#newQty').value = 1; toast('Equipamento adicionado');
}

/* ---------- 9. Relatório (Laudo) ---------- */
function finishChecklist() {
  if (!state.equip.length) return toast('Cadastre ao menos um equipamento.');
  const instrutor = $('#inInstrutor').value.trim();
  const escola = $('#inEscola').value.trim();
  const declare = $('#inDeclarante').checked;
  if (!instrutor) { $('#inInstrutor').focus(); return toast('Informe o instrutor(a).'); }
  if (!escola) { $('#inEscola').focus(); return toast('Informe a escola.'); }
  if (!declare) { $('#inDeclarante').focus(); return toast('Marque a declaração de responsabilidade.'); }

  const pending = state.equip.filter(e => state.counts[e.id] == null);
  if (pending.length && !confirm(`${pending.length} item(ns) não conferido(s) será(ão) registrado como 0. Continuar?`)) return;

  const t = nowParts();
  const laudoNum = getNextLaudoNumber();
  const items = state.equip.map(e => ({ name: e.name, expected: e.expected, found: state.counts[e.id] ?? 0 }));
  const report = {
    id: uid(), laudo: formatLaudo(laudoNum), date: t.date, time: t.time, iso: t.iso, ts: t.ts,
    instrutor, escola, turno: state.prefs.turno, declare,
    items, notes: state.notes.trim(),
    hasDivergence: items.some(i => i.found !== i.expected)
  };
  state.history.unshift(report);
  saveHist(); saveReportToCloud(report); renderHistory();
  openReport(report);
  toast(`Laudo ${report.laudo} gerado`);
}

function reportHTML(r) {
  const rows = r.items.map(i => {
    const d = i.found - i.expected;
    return `<tr><td>${esc(i.name)}</td><td class="num">${i.expected}</td><td class="num">${i.found}</td>
      <td class="${d ? 'st-div' : 'st-ok'}">${d ? d < 0 ? `Faltando ${Math.abs(d)}` : `Excedente +${d}` : 'Confere'}</td></tr>`;
  }).join('');
  return `<div class="laudo-header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em">Termo de Conferência Diária de Equipamentos</div>
        <div class="laudo-num">${esc(r.laudo)}</div>
      </div>
      <div style="text-align:right;font-size:.8rem;color:var(--muted)">${r.date} · ${r.time}</div>
    </div>
  </div>
  <p style="font-size:.9rem"><strong>Unidade:</strong> ${esc(r.escola)} · <strong>Instrutor(a):</strong> ${esc(r.instrutor)} · <strong>Turno:</strong> ${esc(r.turno)}</p>
  <table>
    <thead><tr><th>Equipamento</th><th>Previsto</th><th>Conferido</th><th>Situação</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p><strong>Resumo:</strong> ${r.items.length} itens — <span class="${r.hasDivergence ? 'st-div' : 'st-ok'}">${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}</span></p>
  <div class="notes">${esc(r.notes) || 'Sem observações.'}</div>
  <div class="assina">
    <div><div class="line">Instrutor(a) de Informática</div></div>
    <div><div class="line">Coordenação / Direção Escolar</div></div>
  </div>
  <div class="footer">Documento gerado em ${r.date} às ${r.time} — Checklist de Equipamentos</div>`;
}

function reportText(r) {
  const L = [];
  L.push(`CHECKLIST DE EQUIPAMENTOS — ${r.laudo}`, '');
  L.push(`Data/Hora: ${r.date} às ${r.time}`, `Instrutor(a): ${r.instrutor}`, `Escola: ${r.escola}`, `Turno: ${r.turno}`, '');
  L.push('Equipamentos:');
  r.items.forEach(i => {
    const d = i.found - i.expected;
    L.push(`${i.name}: ${i.found} de ${i.expected}${d ? d < 0 ? ` (faltando ${Math.abs(d)})` : ` (excedente +${d})` : ''}`);
  });
  L.push('', `Resumo: ${r.items.length} itens — ${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}`, '', `Observações: ${r.notes || 'Sem observações.'}`);
  return L.join('\n');
}

function openReport(r) {
  state.currentReport = r;
  $('#reportView').innerHTML = reportHTML(r);
  $('#reportModal').showModal();
}

async function copyReport() {
  const text = reportText(state.currentReport);
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch {} ta.remove(); }
  toast('Copiado para WhatsApp');
}

function generatePDF() {
  const r = state.currentReport;
  if (!r) return toast('Nenhum laudo aberto.');
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) return toast('Biblioteca PDF não carregada.');
  const doc = new jsPDF();
  let y = 20;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text('Termo de Conferência Diária de Equipamentos', 20, y); y += 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`Laudo: ${r.laudo}`, 20, y); y += 5;
  doc.text(`Data/Hora: ${r.date} às ${r.time}`, 20, y); y += 5;
  doc.text(`Unidade: ${r.escola}`, 20, y); y += 5;
  doc.text(`Instrutor(a): ${r.instrutor}`, 20, y); y += 5;
  doc.text(`Turno: ${r.turno}`, 20, y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.text('Equipamentos', 20, y); y += 6;
  doc.setFont('helvetica', 'normal');
  r.items.forEach(i => {
    const d = i.found - i.expected;
    const status = d ? d < 0 ? `Faltando ${Math.abs(d)}` : `Excedente +${d}` : 'Confere';
    doc.text(i.name, 20, y); doc.text(String(i.expected), 70, y); doc.text(String(i.found), 110, y); doc.text(status, 150, y); y += 6;
  });
  y += 5;
  doc.text(`Resumo: ${r.items.length} itens — ${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}`, 20, y);
  y += 8;
  doc.text(`Observações: ${r.notes || 'Sem observações.'}`, 20, y);
  const fileName = `laudo-${r.laudo.replace(/[^a-z0-9]/gi, '-')}.pdf`;
  doc.save(fileName);
  toast('PDF gerado');
}

function printReport() {
  $('#printArea').innerHTML = reportHTML(state.currentReport);
  window.print();
}

/* ---------- 10. Histórico ---------- */
function renderHistory() {
  const fd = $('#fDate').value, fs = $('#fStatus').value;
  const list = state.history.filter(r =>
    (!fd || r.iso === fd) &&
    (fs === 'all' || (fs === 'div' ? r.hasDivergence : !r.hasDivergence))
  ).sort((a, b) => b.ts - a.ts);
  $('#historyList').innerHTML = list.map(r => `
    <article class="h-card ${r.hasDivergence ? 'div' : ''}" data-id="${r.id}">
      <strong>${r.laudo} · ${r.date} às ${r.time}</strong>
      <div class="meta">${esc(r.instrutor)} · ${esc(r.escola)} · ${esc(r.turno)}<br>
        <span class="${r.hasDivergence ? 'st-div' : 'st-ok'}" style="font-weight:700">${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}</span></div>
      <div class="h-actions">
        <button class="btn small" data-h="view">Abrir</button>
        <button class="btn small" data-h="copy">Copiar WhatsApp</button>
        <button class="btn small" data-h="pdf">PDF</button>
        <button class="btn small" data-h="print">Imprimir</button>
        <button class="btn small danger" data-h="del">Excluir</button>
      </div>
    </article>`).join('') ||
    `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><h3>Nenhum laudo encontrado</h3><p>Não há relatórios com esses filtros.</p>${fd || fs !== 'all' ? '<button class="btn primary" id="btnClearHist">Limpar filtros</button>' : ''}</div>`;
}

function onHistoryClick(ev) {
  const b = ev.target.closest('[data-h]'); if (!b) return;
  const r = state.history.find(x => x.id === b.closest('.h-card').dataset.id); if (!r) return;
  state.currentReport = r;
  if (b.dataset.h === 'view') openReport(r);
  if (b.dataset.h === 'copy') copyReport();
  if (b.dataset.h === 'pdf') generatePDF();
  if (b.dataset.h === 'print') printReport();
  if (b.dataset.h === 'del' && confirm('Excluir este laudo definitivamente?')) {
    state.history = state.history.filter(x => x.id !== r.id);
    saveHist(); saveHistToCloud(); renderHistory(); toast('Laudo excluído');
  }
}

/* ---------- 11. Backup / Restauração ---------- */
function exportBackup() {
  const data = { app: 'checklist-equipamentos', version: 2, exportedAt: new Date().toISOString(), equip: state.equip, history: state.history, prefs: state.prefs, laudoCounter: state.laudoCounter };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `backup-checklist-${nowParts().iso}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup exportado');
}

function validateBackup(d) {
  if (!d || typeof d !== 'object' || d.app !== 'checklist-equipamentos') return 'Arquivo não é um backup deste aplicativo.';
  if (!Array.isArray(d.equip) || !Array.isArray(d.history)) return 'Estrutura do backup inválida.';
  if (d.prefs && (typeof d.prefs !== 'object' || Array.isArray(d.prefs))) return 'Preferências do backup inválidas.';
  const okEq = d.equip.every(e => e && typeof e.id === 'string' && typeof e.name === 'string' && Number.isFinite(+e.expected));
  if (!okEq) return 'Lista de equipamentos corrompida.';
  const okH = d.history.every(r => r && typeof r.id === 'string' && Array.isArray(r.items) && typeof r.date === 'string' &&
    r.items.every(i => typeof i.name === 'string' && Number.isFinite(+i.found) && Number.isFinite(+i.expected)));
  if (!okH) return 'Histórico de relatórios corrompido.';
  return null;
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); } catch { return toast('Arquivo JSON inválido.'); }
    const err = validateBackup(data);
    if (err) return toast(err);
    if (!confirm(`Restaurar ${data.equip.length} equipamentos e ${data.history.length} laudos? Os dados atuais serão substituídos.`)) return;
    state.equip = data.equip.map(e => ({ ...e, expected: +e.expected }));
    state.history = data.history;
    state.history.forEach(r => { r.ts = r.ts || 0; r.iso = r.iso || ''; });
    if (data.prefs) {
      Object.assign(state.prefs, data.prefs);
      $('#inInstrutor').value = state.prefs.instrutor || '';
      $('#inEscola').value = state.prefs.escola || '';
      $('#inTurno').value = state.prefs.turno || 'Manhã';
      $('#inDeclarante').checked = state.prefs.declare !== false;
    }
    state.laudoCounter = data.laudoCounter || 1;
    state.counts = {}; recalcAuto();
    saveEquip(); saveEquipToCloud(); saveHist(); saveHistToCloud(); savePrefs(); savePrefsToCloud(); saveSession(); saveMeta(); saveMetaToCloud();
    renderItems(); renderHistory(); renderStorageInfo(); toast('Backup restaurado!');
  };
  reader.readAsText(file);
}

function renderStorageInfo() {
  $('#storageInfo').innerHTML = `<h2>Resumo</h2><p>${state.equip.length} equipamentos · ${state.history.length} laudos salvos neste navegador.</p>`;
}

/* ---------- 12. Utilidades de data e carregadores ---------- */
function nowParts() {
  const d = new Date();
  return { date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, ts: d.toISOString() };
}
function recalcAuto() {
  const t = state.equip.find(e => e.id === 'tablets');
  const c = state.equip.find(e => e.id === 'celulares');
  const car = state.equip.find(e => e.id === 'carregadores');
  if (t && c && car && car.auto) car.expected = (+t.expected || 0) + (+c.expected || 0);
}

/* ---------- 13. Interface: tema, abas, toast ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.prefs.theme;
  $('meta[name="theme-color"]').content = state.prefs.theme === 'dark' ? '#101827' : '#1f3a5f';
}
function switchTab(name) {
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  $$('.nav-item').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  if (name === 'history') renderHistory();
  if (name === 'data') renderStorageInfo();
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
function updateSyncBadge() {
  const badge = $('#syncBadge');
  if (!badge) return;
  if (!state.firebaseReady) { badge.className = 'sync-badge offline'; badge.title = 'Firebase não configurado'; }
  else if (!navigator.onLine) { badge.className = 'sync-badge offline'; badge.title = 'Offline — salvo localmente'; }
  else { badge.className = 'sync-badge online'; badge.title = 'Sincronizado com a nuvem'; }
}

/* ---------- 14. Inicialização ---------- */
async function init() {
  initFirebase();
  updateSyncBadge();

  window.addEventListener('online', () => { state.online = true; updateSyncBadge(); });
  window.addEventListener('offline', () => { state.online = false; updateSyncBadge(); });

  const storedEquip = load(KEYS.equip, null);
  state.equip = Array.isArray(storedEquip) ? storedEquip : JSON.parse(JSON.stringify(DEFAULT_EQUIP));
  recalcAuto();
  if (!Array.isArray(storedEquip)) saveEquip();
  state.history = load(KEYS.hist, []);
  if (state.firebaseReady) {
    try {
      const cloudHist = await loadHistoryFromCloud();
      if (cloudHist && cloudHist.length) {
        const localIds = new Set(state.history.map(r => r.id));
        cloudHist.forEach(r => { if (!localIds.has(r.id)) state.history.unshift(r); });
        state.history.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      }
    } catch { /* ignora falha de nuvem na leitura */ }
  }
  Object.assign(state.prefs, load(KEYS.prefs, {}));
  const sess = load(KEYS.session, { counts: {}, notes: '' });
  state.counts = sess.counts || {}; state.notes = sess.notes || '';
  const meta = load(KEYS.meta, { laudoCounter: 1 });
  state.laudoCounter = meta.laudoCounter || 1;

  $('#inInstrutor').value = state.prefs.instrutor;
  $('#inEscola').value = state.prefs.escola;
  $('#inTurno').value = state.prefs.turno;
  $('#inDeclarante').checked = state.prefs.declare !== false;
  $('#inNotes').value = state.notes;

  $('#inInstrutor').addEventListener('input', e => { state.prefs.instrutor = e.target.value; savePrefs(); savePrefsToCloud(); });
  $('#inEscola').addEventListener('input', e => { state.prefs.escola = e.target.value; savePrefs(); savePrefsToCloud(); });
  $('#inTurno').addEventListener('change', e => { state.prefs.turno = e.target.value; savePrefs(); savePrefsToCloud(); });
  $('#inDeclarante').addEventListener('change', e => { state.prefs.declare = e.target.checked; savePrefs(); savePrefsToCloud(); });
  $('#inNotes').addEventListener('input', e => { state.notes = e.target.value; saveSession(); });

  $('#items').addEventListener('click', onItemsClick);
  $('#items').addEventListener('input', onItemsInput);
  $('#items').addEventListener('change', onItemCheck);
  $('#btnReset').addEventListener('click', resetCounts);
  $('#btnFinish').addEventListener('click', finishChecklist);

  $('#btnManage').addEventListener('click', openManageSheet);
  $('#manageList').addEventListener('input', onManageInput);
  $('#manageList').addEventListener('click', onManageClick);
  $('#addForm').addEventListener('submit', onAddItem);

  $$('[data-close]').forEach(b => b.addEventListener('click', closeManageSheet));
  sheetBackdrop.addEventListener('click', closeManageSheet);

  $('#btnCopy').addEventListener('click', copyReport);
  $('#btnPdf').addEventListener('click', generatePDF);
  $('#btnPrint').addEventListener('click', printReport);
  $$('.nav-item').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  $('#fDate').addEventListener('change', renderHistory);
  $('#fStatus').addEventListener('change', renderHistory);
  $('#btnClearFilter').addEventListener('click', () => { $('#fDate').value = ''; $('#fStatus').value = 'all'; renderHistory(); });
  $('#historyList').addEventListener('click', onHistoryClick);
  $('#historyList').addEventListener('click', ev => {
    if (ev.target.id === 'btnClearHist') { $('#fDate').value = ''; $('#fStatus').value = 'all'; renderHistory(); }
  });

  $('#btnExport').addEventListener('click', exportBackup);
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });

  $('#btnSyncNow').addEventListener('click', async () => {
    if (!state.firebaseReady) return toast('Firebase não configurado.');
    await saveEquipToCloud(); await saveHistToCloud(); await savePrefsToCloud(); await saveMetaToCloud();
    toast('Sincronizado com a nuvem');
  });

  $('#themeBtn').addEventListener('click', () => {
    state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark'; savePrefs(); savePrefsToCloud(); applyTheme();
  });
  if (!load(KEYS.prefs, {}).theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) state.prefs.theme = 'dark';
  applyTheme();

  renderItems(); renderHistory(); renderStorageInfo();

  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
