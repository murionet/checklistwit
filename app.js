'use strict';

/* ---------- Constantes ---------- */
const KEYS = { equip: 'ced_equip', hist: 'ced_history', session: 'ced_session', prefs: 'ced_prefs', meta: 'ced_meta' };
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const MAX_STRING_LEN = 500;

const DEFAULT_EQUIP = [
  { id: 'tablets', name: 'Tablets', expected: 15, icon: 'tablet' },
  { id: 'celulares', name: 'Celulares', expected: 15, icon: 'smartphone' },
  { id: 'carregadores', name: 'Carregadores', expected: 30, auto: true, icon: 'charger' },
  { id: 'smartwatches', name: 'Smartwatches', expected: 10, icon: 'watch' },
  { id: 'vrbox', name: 'VR Box', expected: 10, icon: 'vr' },
  { id: 'metaverso', name: 'Óculos Metaverso', expected: 5, icon: 'glasses' }
];

const _s = (p, w = 1.85) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  tablet: _s('<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/>'),
  smartphone: _s('<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>'),
  charger: _s('<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>'),
  watch: _s('<circle cx="12" cy="12" r="6"/><polyline points="12 10 12 12 13 13"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"/><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.64h2.72a2 2 0 0 0 2-1.64l.8-4"/>'),
  vr: _s('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3.5a2 2 0 0 1-1.7-1l-.8-1.4a1 1 0 0 0-1.7 0l-.8 1.4a2 2 0 0 1-1.7 1H5a2 2 0 0 1-2-2Z"/><circle cx="8" cy="11.5" r="1.5"/><circle cx="16" cy="11.5" r="1.5"/>'),
  glasses: _s('<circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/>'),
  box: _s('<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'),
  checklist: _s('<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>'),
  history: _s('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'),
  database: _s('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>'),
  sliders: _s('<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>'),
  user: _s('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  school: _s('<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>'),
  clock: _s('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  sun: _s('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  moon: _s('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
  check: _s('<polyline points="20 6 9 17 4 12"/>', 2.5),
  plus: _s('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 2),
  minus: _s('<line x1="5" y1="12" x2="19" y2="12"/>', 2)
};

/* ---------- Estado ---------- */
const state = {
  equip: [], counts: {}, notes: '', history: [],
  prefs: { instrutor: '', escola: '', turno: 'Manhã', theme: 'light', declare: true },
  currentReport: null, laudoCounter: 1,
  firebase: null, db: null, firebaseReady: false, online: navigator.onLine
};

/* ---------- Utilitários ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const tsOf = r => Date.parse(r && r.ts) || 0;
const debounce = (fn, ms = 1200) => { let t; return (...x) => { clearTimeout(t); t = setTimeout(() => fn(...x), ms); }; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function random4() {
  try {
    const buf = new Uint16Array(1);
    crypto.getRandomValues(buf);
    return String(buf[0] % 10000).padStart(4, '0');
  } catch {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  }
}

function hydrateIcons() { $$('[data-icon]').forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ''; }); }
function icon(name, size = 20) {
  const svg = ICONS[name] || ICONS.checklist;
  return svg.replace(/stroke-width="1\.85"/g, `stroke-width="${size / 10}"`);
}

function iconFor(e) {
  const n = (e.name || '').toLowerCase();
  let key = 'box';
  if (/tablet|ipad/.test(n)) key = 'tablet';
  else if (/celular|smartphone|iphone/.test(n)) key = 'smartphone';
  else if (/carreg|cabo|fonte/.test(n)) key = 'charger';
  else if (/watch|rel[óo]gio/.test(n)) key = 'watch';
  else if (/\bvr\b|realidade/.test(n)) key = 'vr';
  else if (/[óo]culos|metaverso/.test(n)) key = 'glasses';
  return ICONS[key];
}

/* ---------- Firebase ---------- */
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

async function saveToCloud(collection, docId, data) {
  if (!state.firebaseReady || !state.db) return;
  await state.db.collection(collection).doc(docId).set(data, { merge: true });
}
async function savePrefsToCloud() { await saveToCloud('prefs', 'user', state.prefs); }
async function saveEquipToCloud() { await saveToCloud('equip', 'list', { equip: state.equip }); }
async function saveReportToCloud(report) { await saveToCloud('reports', report.id, report); }
async function saveReportToCloudRetry(report, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { await saveReportToCloud(report); return true; } catch (e) { if (i === attempts - 1) throw e; await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
  }
}
async function saveMetaToCloud() { await saveToCloud('meta', 'counter', { laudoCounter: state.laudoCounter }); }
async function deleteReportFromCloud(id) {
  if (!state.firebaseReady || !state.db) return;
  try { await state.db.collection('reports').doc(id).delete(); } catch { }
}
async function loadHistoryFromCloud() {
  if (!state.firebaseReady || !state.db) return [];
  try { const snap = await state.db.collection('reports').orderBy('ts', 'desc').get(); return snap.docs.map(d => d.data()); } catch { return []; }
}
async function saveHistToCloud() {
  if (!state.firebaseReady) return;
  try { for (const r of state.history) { await saveToCloud('reports', r.id, r); } } catch { }
}

const savePrefsToCloudD = debounce(() => savePrefsToCloud());
const saveEquipToCloudD = debounce(() => saveEquipToCloud());

/* ---------- Persistência local ---------- */
function load(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('Armazenamento local cheio ou bloqueado.'); } }
const saveEquip = () => save(KEYS.equip, state.equip);
const saveHist = () => save(KEYS.hist, state.history);
const savePrefs = () => save(KEYS.prefs, state.prefs);
const saveSession = () => save(KEYS.session, { counts: state.counts, notes: state.notes });
const saveMeta = () => save(KEYS.meta, { laudoCounter: state.laudoCounter });

/* ---------- Número do laudo ---------- */
function getNextLaudoNumber() { const n = state.laudoCounter; state.laudoCounter = n + 1; saveMeta(); saveMetaToCloud(); return n; }
function formatLaudo(n) {
  const d = new Date();
  return `WIT-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${random4()}`;
}

/* ---------- Sincronização visual dos checkmarks ---------- */
function syncQuickCheck(id) {
  const e = state.equip.find(x => x.id === id);
  if (!e) return;
  const cb = $(`.item-check input[data-id="${esc(id)}"]`);
  const found = state.counts[id];
  const checked = found != null && found >= e.expected;
  if (cb) cb.checked = checked;
  const circle = $(`.item-check[data-id="${esc(id)}"]`);
  if (circle) {
    if (checked) circle.classList.add('confirmed'); else circle.classList.remove('confirmed');
  }
}

/* ---------- Renderização do checklist ---------- */
function renderItems() {
  const box = $('#items');
  if (!state.equip.length) {
    box.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><h3>Nenhum equipamento cadastrado</h3><p>Adicione os itens da sala para iniciar a conferência.</p><button class="btn primary" id="btnEmptyAdd">Adicionar primeiro equipamento</button></div>`;
    $('#btnEmptyAdd')?.addEventListener('click', () => { openManageSheet(); });
    updateProgress(); return;
  }
  box.innerHTML = state.equip.map(e => {
    const safeId = esc(e.id);
    const found = state.counts[e.id];
    const d = found != null ? found - e.expected : null;
    const checked = found != null && found >= e.expected;
    let statusClass = 'pending', statusText = 'Pendente';
    if (d === 0) { statusClass = 'confirmed'; statusText = 'Confere'; }
    else if (d != null) { statusClass = 'diff'; statusText = d < 0 ? `Faltam ${Math.abs(d)}` : `+${d} excedente`; if (d > 0) statusClass += ' excess'; }
    return `<article class="item ${statusClass}" data-id="${safeId}">
      <div class="item-check" data-id="${safeId}"><input type="checkbox" data-id="${safeId}" ${checked ? 'checked' : ''} style="opacity:0;position:absolute;width:26px;height:26px;margin:0;cursor:pointer;z-index:2;"><svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div class="item-name-wrap" data-id="${safeId}">
        <div class="item-icon-inline">${iconFor(e).replace('stroke-width="1.85"', 'stroke-width="1.6"')}</div>
        <div class="item-name">${esc(e.name)}</div>
      </div>
      <div class="item-expected num">Previsto: ${e.expected}</div>
      <div class="item-badge ${statusClass}">${statusText}</div>
      <div class="item-step">
        <button type="button" data-act="minus" data-id="${safeId}" aria-label="Diminuir ${esc(e.name)}">${icon('minus', 15)}</button>
        <input type="number" inputmode="numeric" min="0" value="${found ?? ''}" placeholder="—" data-id="${safeId}" aria-label="Quantidade de ${esc(e.name)}">
        <button type="button" data-act="plus" data-id="${safeId}" aria-label="Aumentar ${esc(e.name)}">${icon('plus', 15)}</button>
        <button type="button" data-act="ok" data-id="${safeId}" aria-label="Marcar como conferido ${esc(e.name)}">${icon('check', 15)}</button>
      </div>
    </article>`;
  }).join('');
  state.equip.forEach(e => syncQuickCheck(e.id));
  updateProgress();
}

function updateProgress() {
  const done = state.equip.filter(e => state.counts[e.id] != null).length;
  const divs = state.equip.filter(e => state.counts[e.id] != null && state.counts[e.id] !== e.expected).length;
  const fill = $('#progressFill');
  const pct = state.equip.length ? Math.round((done / state.equip.length) * 100) : 0;
  if (fill) fill.style.width = pct + '%';
  const pt = $('#progress'); if (pt) pt.textContent = `${done} de ${state.equip.length} conferidos` + (divs ? ` · ${divs} divergência${divs > 1 ? 's' : ''}` : '');
}

function paintItem(id) {
  const e = state.equip.find(x => x.id === id), item = $(`.item[data-id="${esc(id)}"]`);
  if (!e || !item) return;
  const f = state.counts[id], d = f == null ? null : f - e.expected;
  let cls = 'pending', txt = 'Pendente';
  if (d === 0) { cls = 'confirmed'; txt = 'Confere'; }
  else if (d != null) { cls = d < 0 ? 'diff' : 'diff excess'; txt = d < 0 ? `Faltam ${-d}` : `+${d} excedente`; }
  item.className = 'item ' + cls;
  const b = $('.item-badge', item); if (b) { b.className = 'item-badge ' + cls; b.textContent = txt; }
}

function setAllCounts(fn) {
  state.equip.forEach(e => { state.counts[e.id] = fn(e); });
  saveSession(); renderItems();
}

function setCount(id, value) {
  state.counts[id] = value === null || value === '' || isNaN(value) ? null : Math.max(0, Math.floor(+value));
  const input = $(`input[type="number"][data-id="${esc(id)}"]`);
  if (input && document.activeElement !== input) input.value = state.counts[id] ?? '';
  paintItem(id);
  syncQuickCheck(id);
  updateProgress(); saveSession();
  if (navigator.vibrate) navigator.vibrate(10);
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

/* ---------- Bottom Sheet: Gerenciar equipamentos ---------- */
const sheet = $('#manageSheet');
const sheetBackdrop = $('#sheetBackdrop');

function openManageSheet() { renderManage(); sheet.classList.add('open'); sheetBackdrop.classList.add('open'); }
function closeManageSheet() { sheet.classList.remove('open'); sheetBackdrop.classList.remove('open'); }

function renderManage() {
  $('#manageList').innerHTML = state.equip.map(e => {
    const safeId = esc(e.id);
    return `<div class="m-row" data-id="${safeId}">
      <input type="text" value="${esc(e.name)}" data-f="name" aria-label="Nome">
      <input type="number" min="0" value="${e.expected}" data-f="expected" aria-label="Quantidade prevista">
      <button class="btn danger small" data-del type="button">Remover</button>
      ${e.id === 'carregadores' ? `<label class="auto"><input type="checkbox" data-f="auto" ${e.auto ? 'checked' : ''}> Calcular automaticamente</label>` : ''}
    </div>`;
  }).join('') || '<div class="empty">Lista vazia.</div>';
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
  const car = state.equip.find(x => x.id === 'carregadores'), cr = $('.m-row[data-id="carregadores"]');
  if (car && cr) { $('[data-f="expected"]', cr).value = car.expected; const ac = $('[data-f="auto"]', cr); if (ac) ac.checked = !!car.auto; }
  saveEquip(); saveEquipToCloudD(); renderItems();
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

/* ---------- Relatório (Laudo) ---------- */
async function finishChecklist() {
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
  saveHist(); renderHistory();
  try {
    await saveReportToCloudRetry(report);
    toast(`Laudo ${report.laudo} gerado e salvo na nuvem`);
  } catch (err) {
    toast(`Laudo ${report.laudo} gerado localmente. Erro ao salvar na nuvem.`);
    console.warn('Firestore save error:', err);
  }
  openReport(report);
}

function reportHTML(r) {
  const rows = r.items.map(i => {
    const d = i.found - i.expected;
    return `<tr><td>${esc(i.name)}</td><td class="num">${i.expected}</td><td class="num">${i.found}</td>
      <td class="${d ? 'st-div' : 'st-ok'}">${d ? d < 0 ? `Faltando ${Math.abs(d)}` : `Excedente +${d}` : 'Confere'}</td></tr>`;
  }).join('');
  return `<div class="laudo-header">
    <div class="laudo-meta">
      <div>
        <div class="laudo-title">Termo de Conferência Diária de Equipamentos</div>
        <div class="laudo-num">${esc(r.laudo)}</div>
      </div>
      <div style="text-align:right;font-size:.8rem;color:var(--ink-tertiary)">${r.date} · ${r.time}</div>
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
    <div><div class="line">Instrutor(a) — Núcleo WIT</div></div>
    <div><div class="line">Coordenação / Direção Escolar</div></div>
  </div>
  <div class="footer">Documento gerado em ${r.date} às ${r.time} — Checklist WIT</div>`;
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

let lastFocusedElement = null;

function openReport(r) {
  state.currentReport = r;
  lastFocusedElement = document.activeElement;
  $('#reportView').innerHTML = reportHTML(r);
  $('#reportModal').showModal();
  const closeBtn = $('#reportModal').querySelector('[data-close="report"]');
  if (closeBtn) closeBtn.focus();
}

async function copyReport() {
  const text = reportText(state.currentReport);
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { } ta.remove(); }
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
    if (y > 275) { doc.addPage(); y = 20; }
    const d = i.found - i.expected;
    const status = d ? d < 0 ? `Faltando ${Math.abs(d)}` : `Excedente +${d}` : 'Confere';
    doc.text(i.name, 20, y); doc.text(String(i.expected), 70, y); doc.text(String(i.found), 110, y); doc.text(status, 150, y); y += 6;
  });
  y += 5;
  doc.text(`Resumo: ${r.items.length} itens — ${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}`, 20, y);
  y += 8;
  doc.text(doc.splitTextToSize(`Observações: ${r.notes || 'Sem observações.'}`, 170), 20, y);
  const fileName = `laudo-${r.laudo.replace(/[^a-z0-9]/gi, '-')}.pdf`;
  doc.save(fileName);
  toast('PDF gerado');
}

function printReport() {
  $('#printArea').innerHTML = reportHTML(state.currentReport);
  window.print();
}

/* ---------- Histórico ---------- */
function renderHistory() {
  const fd = $('#fDate').value, fs = $('#fStatus').value;
  const list = state.history.filter(r =>
    (!fd || r.iso === fd) &&
    (fs === 'all' || (fs === 'div' ? r.hasDivergence : !r.hasDivergence))
  ).sort((a, b) => tsOf(b) - tsOf(a));
  $('#historyList').innerHTML = list.map(r => `
    <article class="h-card ${r.hasDivergence ? 'div' : ''}" data-id="${esc(r.id)}">
      <strong>${esc(r.laudo)} · ${r.date} às ${r.time}</strong>
      <div class="meta">${esc(r.instrutor)} · ${esc(r.escola)} · ${esc(r.turno)}<br>
        <span class="${r.hasDivergence ? 'st-div' : 'st-ok'}" style="font-weight:700">${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}</span></div>
      <div class="h-actions">
        <button class="btn small" data-h="view" aria-label="Abrir laudo ${esc(r.laudo)}">Abrir</button>
        <button class="btn small" data-h="copy" aria-label="Copiar laudo ${esc(r.laudo)} para WhatsApp">Copiar WhatsApp</button>
        <button class="btn small" data-h="pdf" aria-label="Gerar PDF do laudo ${esc(r.laudo)}">PDF</button>
        <button class="btn small" data-h="print" aria-label="Imprimir laudo ${esc(r.laudo)}">Imprimir</button>
        <button class="btn small danger" data-h="del" aria-label="Excluir laudo ${esc(r.laudo)}">Excluir</button>
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
    saveHist(); deleteReportFromCloud(r.id); renderHistory(); renderStorageInfo(); toast('Laudo excluído');
  }
}

/* ---------- Backup / Restauração ---------- */
function exportBackup() {
  const data = { app: 'checklist-equipamentos', version: 2, exportedAt: new Date().toISOString(), equip: state.equip, history: state.history, prefs: state.prefs, laudoCounter: state.laudoCounter };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `backup-checklist-${nowParts().iso}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup exportado');
}

function safeParse(text) {
  return JSON.parse(text, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
    return value;
  });
}

function validateBackup(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) || d.app !== 'checklist-equipamentos') return 'Arquivo não é um backup deste aplicativo.';
  if (!Array.isArray(d.equip) || !Array.isArray(d.history)) return 'Estrutura do backup inválida.';
  if (d.prefs && (typeof d.prefs !== 'object' || Array.isArray(d.prefs))) return 'Preferências do backup inválidas.';
  const okEq = d.equip.every(e => e && typeof e.id === 'string' && e.id.length <= MAX_STRING_LEN && typeof e.name === 'string' && e.name.length <= MAX_STRING_LEN && Number.isFinite(+e.expected) && +e.expected >= 0);
  if (!okEq) return 'Lista de equipamentos corrompida.';
  const okH = d.history.every(r => r && typeof r.id === 'string' && r.id.length <= MAX_STRING_LEN && Array.isArray(r.items) && typeof r.date === 'string' && r.date.length <= MAX_STRING_LEN &&
    r.items.every(i => typeof i.name === 'string' && i.name.length <= MAX_STRING_LEN && Number.isFinite(+i.found) && Number.isFinite(+i.expected) && +i.found >= 0 && +i.expected >= 0));
  if (!okH) return 'Histórico de relatórios corrompido.';
  return null;
}

function importBackup(file) {
  if (file.size > MAX_BACKUP_BYTES) return toast('Backup muito grande (máx. 2 MB).');
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = safeParse(reader.result); } catch { return toast('Arquivo JSON inválido.'); }
    const err = validateBackup(data);
    if (err) return toast(err);
    if (!confirm(`Restaurar ${data.equip.length} equipamentos e ${data.history.length} laudos? Os dados atuais serão substituídos.`)) return;
    state.equip = data.equip.map(e => ({ id: e.id, name: e.name, expected: +e.expected, auto: !!e.auto, icon: e.icon || 'box' }));
    state.history = data.history;
    state.history.forEach(r => { r.ts = r.ts || 0; r.iso = r.iso || ''; });
    if (data.prefs) {
      Object.assign(state.prefs, data.prefs);
      $('#inInstrutor').value = state.prefs.instrutor || '';
      $('#inEscola').value = state.prefs.escola || '';
      setTurno(state.prefs.turno || 'Manhã');
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

/* ---------- Utilidades de data e carregadores ---------- */
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

/* ---------- Interface: tema, abas, toast ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.prefs.theme;
  $('meta[name="theme-color"]').content = state.prefs.theme === 'dark' ? '#0B0F0D' : '#0D9458';
  const ti = $('#themeIcon');
  if (ti) ti.innerHTML = state.prefs.theme === 'dark' ? ICONS.sun : ICONS.moon;
  const tb = $('#themeBtn');
  if (tb) tb.title = state.prefs.theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro';
}
function setTurno(t) {
  $$('#segTurno .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.turno === t));
  $('#inTurno').value = t;
}
function switchTab(name) {
  try {
    $$('.panel').forEach(p => p.classList.remove('active'));
    $$('.nav-item').forEach(t => t.classList.remove('active'));
    const panel = $('#tab-' + name);
    let nav = null;
    $$('.nav-item').forEach(t => {
      if (t.dataset.tab === name) nav = t;
    });
    if (panel) panel.classList.add('active');
    if (nav) nav.classList.add('active');
    if (name === 'history') renderHistory();
    if (name === 'data') renderStorageInfo();
  } catch (e) { console.warn('switchTab erro:', e); }
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
function updateSyncBadge() {
  const badge = $('#syncBadge');
  if (!badge) return;
  const fm = $('#firebaseMsg');
  if (fm) fm.textContent = !state.firebaseReady ? 'Firebase não carregou (sem internet ou bloqueado). Os dados ficam só neste aparelho.' : navigator.onLine ? 'Conectado à nuvem.' : 'Offline — alterações salvas neste aparelho.';
  if (!state.firebaseReady) { badge.className = 'sync-badge offline'; badge.title = 'Firebase não configurado'; }
  else if (!navigator.onLine) { badge.className = 'sync-badge offline'; badge.title = 'Offline — salvo localmente'; }
  else { badge.className = 'sync-badge online'; badge.title = 'Sincronizado com a nuvem'; }
}

/* ---------- Inicialização ---------- */
async function init() {
  hydrateIcons();
  initFirebase();
  updateSyncBadge();

  window.addEventListener('online', () => { state.online = true; updateSyncBadge(); });
  window.addEventListener('offline', () => { state.online = false; updateSyncBadge(); });

  const storedEquip = load(KEYS.equip, null);
  state.equip = Array.isArray(storedEquip) ? storedEquip : JSON.parse(JSON.stringify(DEFAULT_EQUIP));
  recalcAuto();
  if (!Array.isArray(storedEquip)) saveEquip();
  state.history = load(KEYS.hist, []);
  Object.assign(state.prefs, load(KEYS.prefs, {}));
  const sess = load(KEYS.session, { counts: {}, notes: '' });
  state.counts = sess.counts || {}; state.notes = sess.notes || '';
  const meta = load(KEYS.meta, { laudoCounter: 1 });
  state.laudoCounter = meta.laudoCounter || 1;

  $('#inInstrutor').value = state.prefs.instrutor;
  $('#inEscola').value = state.prefs.escola;
  setTurno(state.prefs.turno);
  $('#inDeclarante').checked = state.prefs.declare !== false;
  $('#inNotes').value = state.notes;

  const segBtns = $$('#segTurno .seg-btn');
  segBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#inTurno').value = btn.dataset.turno;
      state.prefs.turno = btn.dataset.turno;
      savePrefs(); savePrefsToCloud();
    });
  });

  $('#inInstrutor').addEventListener('input', e => { state.prefs.instrutor = e.target.value; savePrefs(); savePrefsToCloudD(); });
  $('#inEscola').addEventListener('change', e => { state.prefs.escola = e.target.value; savePrefs(); savePrefsToCloud(); });
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

  $$('[data-close="manage"]').forEach(b => b.addEventListener('click', closeManageSheet));
  $$('[data-close="report"]').forEach(b => b.addEventListener('click', () => $('#reportModal').close()));
  sheetBackdrop.addEventListener('click', closeManageSheet);
  $('#reportModal').addEventListener('click', e => { if (e.target === $('#reportModal')) $('#reportModal').close(); });
  $('#reportModal').addEventListener('close', () => { if (lastFocusedElement) lastFocusedElement.focus(); });

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

  const btnSelAll = $('#btnSelectAll');
  const btnSelNone = $('#btnSelectNone');
  if (btnSelAll) {
    btnSelAll.addEventListener('click', () => {
      try { setAllCounts(e => e.expected); toast('Todos selecionados'); } catch (err) { toast('Erro ao selecionar todos'); }
    });
  }
  if (btnSelNone) {
    btnSelNone.addEventListener('click', () => {
      try { setAllCounts(() => null); toast('Seleção limpa'); } catch (err) { toast('Erro ao limpar seleção'); }
    });
  }

  $('#btnSyncNow').addEventListener('click', async () => {
    if (!state.firebaseReady) return toast('Firebase não configurado.');
    try {
      await saveEquipToCloud(); await saveHistToCloud(); await savePrefsToCloud(); await saveMetaToCloud();
      toast('Sincronizado com a nuvem');
    } catch (err) {
      toast('Erro ao sincronizar com a nuvem.');
      console.warn('Sync error:', err);
    }
  });

  $('#themeBtn').addEventListener('click', () => {
    state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark'; savePrefs(); savePrefsToCloud(); applyTheme();
  });
  if (!load(KEYS.prefs, {}).theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) state.prefs.theme = 'dark';
  applyTheme();

  renderItems(); renderHistory(); renderStorageInfo();

  if (state.firebaseReady) {
    Promise.race([loadHistoryFromCloud(), new Promise(r => setTimeout(() => r([]), 8000))]).then(cloud => {
      const ids = new Set(state.history.map(r => r.id));
      const novos = cloud.filter(r => r && r.id && !ids.has(r.id));
      if (!novos.length) return;
      state.history = state.history.concat(novos).sort((x, y) => tsOf(y) - tsOf(x));
      saveHist(); renderHistory(); renderStorageInfo();
    }).catch(() => {});
  }

  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
