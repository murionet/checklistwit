/* =========================================================
   Checklist Diário de Equipamentos — lógica da aplicação
   Vanilla JS (ES6+), persistência em localStorage
   ========================================================= */
'use strict';

/* ---------- 1. Constantes e estado ---------- */
const KEYS = { equip: 'ced_equip', hist: 'ced_history', session: 'ced_session', prefs: 'ced_prefs' };

const DEFAULT_EQUIP = [
  { id: 'tablets',     name: 'Tablets',         expected: 15 },
  { id: 'celulares',   name: 'Celulares',       expected: 15 },
  { id: 'carregadores',name: 'Carregadores',    expected: 30, auto: true }, // = tablets + celulares
  { id: 'smartwatches',name: 'Smartwatches',    expected: 10 },
  { id: 'vrbox',       name: 'VR Box',          expected: 10 },
  { id: 'metaverso',   name: 'Óculos Metaverso',expected: 5 }
];

const state = {
  equip: [],                 // lista de equipamentos
  counts: {},                // { id: quantidade encontrada | null }
  notes: '',                 // observações do dia
  history: [],               // relatórios finalizados
  prefs: { responsavel: '', sala: '', turno: 'Manhã', theme: 'light' },
  currentReport: null        // relatório aberto no modal
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ---------- 2. Persistência ---------- */
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { toast('Não foi possível salvar (armazenamento cheio ou bloqueado).'); }
}
const saveEquip = () => save(KEYS.equip, state.equip);
const saveHist = () => save(KEYS.hist, state.history);
const savePrefs = () => save(KEYS.prefs, state.prefs);
const saveSession = () => save(KEYS.session, { counts: state.counts, notes: state.notes });

/* ---------- 3. Regra dos carregadores ---------- */
// Carregadores (auto) = Tablets + Celulares esperados; recalcula em tempo real.
function recalcAuto() {
  const t = state.equip.find(e => e.id === 'tablets');
  const c = state.equip.find(e => e.id === 'celulares');
  const car = state.equip.find(e => e.id === 'carregadores');
  if (t && c && car && car.auto) car.expected = (+t.expected || 0) + (+c.expected || 0);
}

/* ---------- 4. Utilidades de data e status ---------- */
function nowParts() {
  const d = new Date();
  return {
    date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  };
}
const diffOf = (found, expected) => found - expected;
function diffLabel(d) { return d < 0 ? `${d} faltando` : `+${d} excedente`; }

/* ---------- 5. Renderização do checklist ---------- */
function renderItems() {
  const box = $('#items');
  if (!state.equip.length) {
    box.innerHTML = '<div class="empty">Nenhum equipamento cadastrado. Use “Gerenciar equipamentos” para adicionar.</div>';
    updateProgress(); return;
  }
  box.innerHTML = state.equip.map(e => {
    const found = state.counts[e.id];
    return `<article class="item" data-id="${e.id}">
      <div class="item-head">
        <div><div class="item-name">${esc(e.name)}</div><div class="item-exp">Esperado: <strong>${e.expected}</strong></div></div>
        <span class="badge"></span>
      </div>
      <div class="counter">
        <button type="button" data-act="minus" aria-label="Diminuir ${esc(e.name)}">−</button>
        <input type="number" inputmode="numeric" min="0" value="${found ?? ''}" placeholder="—" aria-label="Quantidade encontrada de ${esc(e.name)}">
        <button type="button" data-act="plus" aria-label="Aumentar ${esc(e.name)}">+</button>
        <button type="button" class="ok-btn" data-act="ok">OK</button>
      </div>
    </article>`;
  }).join('');
  state.equip.forEach(e => paintItem(e.id));
  updateProgress();
}

// Atualiza só o visual (borda + badge) de um cartão, sem recriar o input (mantém o foco).
function paintItem(id) {
  const e = state.equip.find(x => x.id === id);
  const card = $(`.item[data-id="${id}"]`);
  if (!e || !card) return;
  const found = state.counts[id];
  const badge = $('.badge', card);
  card.className = 'item';
  if (found == null) { card.classList.add('pending'); badge.className = 'badge pending'; badge.textContent = 'Não conferido'; return; }
  const d = diffOf(found, e.expected);
  if (d === 0) { card.classList.add('match'); badge.className = 'badge match'; badge.textContent = '✓ Confere'; }
  else {
    card.classList.add('diff'); if (d > 0) card.classList.add('excess');
    badge.className = 'badge ' + (d < 0 ? 'missing' : 'excess');
    badge.textContent = '⚠ ' + diffLabel(d);
  }
}

function updateProgress() {
  const done = state.equip.filter(e => state.counts[e.id] != null).length;
  const divs = state.equip.filter(e => state.counts[e.id] != null && state.counts[e.id] !== e.expected).length;
  $('#progress').textContent = `${done} de ${state.equip.length} conferidos` + (divs ? ` · ${divs} com divergência` : '');
}

function setCount(id, value) {
  state.counts[id] = value === null || value === '' || isNaN(value) ? null : Math.max(0, Math.floor(+value));
  const input = $(`.item[data-id="${id}"] input`);
  if (input && document.activeElement !== input) input.value = state.counts[id] ?? '';
  paintItem(id); updateProgress(); saveSession();
}

function onItemsClick(ev) {
  const btn = ev.target.closest('button[data-act]'); if (!btn) return;
  const id = btn.closest('.item').dataset.id;
  const e = state.equip.find(x => x.id === id);
  const cur = state.counts[id];
  const act = btn.dataset.act;
  if (act === 'plus') setCount(id, (cur ?? 0) + 1);
  if (act === 'minus') setCount(id, Math.max(0, (cur ?? e.expected) - 1));
  if (act === 'ok') setCount(id, e.expected);
}
function onItemsInput(ev) {
  if (ev.target.matches('.item input')) setCount(ev.target.closest('.item').dataset.id, ev.target.value);
}

function resetCounts() {
  if (!confirm('Zerar a conferência de hoje? Os equipamentos cadastrados serão mantidos.')) return;
  state.counts = {}; state.notes = ''; $('#inNotes').value = '';
  saveSession(); renderItems(); toast('Contagem resetada');
}

/* ---------- 6. Gerenciar equipamentos (CRUD) ---------- */
function renderManage() {
  $('#manageList').innerHTML = state.equip.map(e => `
    <div class="m-row" data-id="${e.id}">
      <input type="text" value="${esc(e.name)}" data-f="name" aria-label="Nome">
      <input type="number" min="0" value="${e.expected}" data-f="expected" aria-label="Quantidade esperada">
      <button class="btn danger small" data-del type="button">Remover</button>
      ${e.id === 'carregadores' ? `<label class="auto"><input type="checkbox" data-f="auto" ${e.auto ? 'checked' : ''}> Calcular automaticamente (Tablets + Celulares)</label>` : ''}
    </div>`).join('') || '<div class="empty">Lista vazia.</div>';
}

function onManageInput(ev) {
  const row = ev.target.closest('.m-row'); if (!row) return;
  const e = state.equip.find(x => x.id === row.dataset.id);
  const f = ev.target.dataset.f;
  if (f === 'name') e.name = ev.target.value.trim() || e.name;
  if (f === 'expected') {
    e.expected = Math.max(0, Math.floor(+ev.target.value || 0));
    if (e.id === 'carregadores') e.auto = false; // ajuste manual desliga o automático
  }
  if (f === 'auto') e.auto = ev.target.checked;
  const before = state.equip.map(x => x.expected).join();
  recalcAuto();
  // atualiza o campo do carregador em tempo real sem recriar a lista (mantém o foco)
  const car = state.equip.find(x => x.id === 'carregadores');
  if (car) {
    const carRow = $(`.m-row[data-id="carregadores"]`);
    if (carRow) {
      $('[data-f="expected"]', carRow).value = car.expected;
      $('[data-f="auto"]', carRow).checked = !!car.auto;
    }
  }
  saveEquip(); renderItems();
}

function onManageClick(ev) {
  if (!ev.target.matches('[data-del]')) return;
  const id = ev.target.closest('.m-row').dataset.id;
  const e = state.equip.find(x => x.id === id);
  if (!confirm(`Remover “${e.name}” da lista?`)) return;
  state.equip = state.equip.filter(x => x.id !== id);
  delete state.counts[id];
  recalcAuto(); saveEquip(); saveSession(); renderManage(); renderItems();
}

function onAddItem(ev) {
  ev.preventDefault();
  const name = $('#newName').value.trim();
  const qty = Math.max(0, Math.floor(+$('#newQty').value || 0));
  if (!name) return;
  state.equip.push({ id: uid(), name, expected: qty });
  saveEquip(); renderManage(); renderItems();
  $('#newName').value = ''; $('#newQty').value = 1; toast('Equipamento adicionado');
}

/* ---------- 7. Relatório ---------- */
function finishChecklist() {
  if (!state.equip.length) return toast('Cadastre ao menos um equipamento.');
  const pending = state.equip.filter(e => state.counts[e.id] == null);
  if (pending.length && !confirm(`${pending.length} item(ns) não conferido(s) serão registrados como 0. Continuar?`)) return;

  const t = nowParts();
  const items = state.equip.map(e => ({ name: e.name, expected: e.expected, found: state.counts[e.id] ?? 0 }));
  const report = {
    id: uid(), date: t.date, time: t.time, iso: t.iso, ts: Date.now(),
    turno: state.prefs.turno, sala: state.prefs.sala.trim() || '—', responsavel: state.prefs.responsavel.trim() || '—',
    items, notes: state.notes.trim(),
    hasDivergence: items.some(i => i.found !== i.expected)
  };
  state.history.unshift(report);
  saveHist(); renderHistory();
  openReport(report);
  toast('Relatório salvo no histórico');
}

// HTML estruturado (modal e impressão)
function reportHTML(r) {
  const rows = r.items.map(i => {
    const d = i.found - i.expected;
    return `<tr><td>${esc(i.name)}</td><td>${i.found}</td><td>${i.expected}</td>
      <td class="${d ? 'st-div' : 'st-ok'}">${d ? 'Divergência ' + (d > 0 ? '+' : '') + d : 'OK'}</td></tr>`;
  }).join('');
  return `<h3>Checklist de Equipamentos</h3>
    <p><strong>Data:</strong> ${r.date} · <strong>Horário:</strong> ${r.time}<br>
    <strong>Turno:</strong> ${esc(r.turno)} · <strong>Sala:</strong> ${esc(r.sala)}<br>
    <strong>Responsável:</strong> ${esc(r.responsavel)}</p>
    <table><thead><tr><th>Equipamento</th><th>Encontrado</th><th>Esperado</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    <p><strong>Resumo:</strong> ${r.items.length} itens conferidos —
      <span class="${r.hasDivergence ? 'st-div' : 'st-ok'}">${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}</span></p>
    <p><strong>Divergências / Observações:</strong></p>
    <div class="notes">${esc(r.notes) || 'Nenhuma observação registrada.'}</div>`;
}

// Texto para WhatsApp (*negrito* e marcadores)
function reportText(r) {
  const L = [];
  L.push('*📋 CHECKLIST DE EQUIPAMENTOS*', '');
  L.push(`📅 *Data:* ${r.date}`, `🕒 *Horário:* ${r.time}`, `🌓 *Turno:* ${r.turno}`, `🏫 *Sala:* ${r.sala}`, `👤 *Responsável:* ${r.responsavel}`, '');
  L.push('*Equipamentos:*');
  r.items.forEach(i => {
    const d = i.found - i.expected;
    L.push(`${d ? '⚠️' : '✅'} ${i.name} — Encontrado: ${i.found} / Esperado: ${i.expected} (${d ? 'Divergência de ' + (d > 0 ? '+' : '') + d : 'OK'})`);
  });
  L.push('', `*Resumo:* ${r.items.length} itens conferidos — ${r.hasDivergence ? '⚠️ *Com divergências*' : '✅ *Sem divergências*'}`, '');
  L.push('*Divergências / Observações:*', r.notes || 'Nenhuma observação registrada.');
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
  catch { // fallback para contextos sem Clipboard API (ex.: file://)
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch {} ta.remove();
  }
  toast('Relatório copiado!');
}

function printReport() {
  $('#printArea').innerHTML = reportHTML(state.currentReport);
  window.print();
}

/* ---------- 8. Histórico ---------- */
function renderHistory() {
  const fd = $('#fDate').value, fs = $('#fStatus').value;
  const list = state.history.filter(r =>
    (!fd || r.iso === fd) &&
    (fs === 'all' || (fs === 'div' ? r.hasDivergence : !r.hasDivergence))
  ).sort((a, b) => b.ts - a.ts);

  $('#historyList').innerHTML = list.map(r => `
    <article class="h-card ${r.hasDivergence ? 'div' : ''}" data-id="${r.id}">
      <strong>${r.date} às ${r.time}</strong>
      <div class="meta">${esc(r.turno)} · ${esc(r.sala)} · ${esc(r.responsavel)}<br>
        <span class="${r.hasDivergence ? 'st-div' : 'st-ok'}" style="font-weight:700;color:var(--${r.hasDivergence ? 'bad' : 'ok'})">${r.hasDivergence ? 'Com divergências' : 'Sem divergências'}</span></div>
      <div class="h-actions">
        <button class="btn small" data-h="view">Abrir</button>
        <button class="btn small" data-h="copy">Copiar WhatsApp</button>
        <button class="btn small" data-h="print">PDF / Imprimir</button>
        <button class="btn small danger" data-h="del">Excluir</button>
      </div>
    </article>`).join('') ||
    `<div class="empty">${state.history.length ? 'Nenhum relatório com esses filtros.' : 'Nenhum relatório finalizado ainda.'}</div>`;
}

function onHistoryClick(ev) {
  const b = ev.target.closest('[data-h]'); if (!b) return;
  const r = state.history.find(x => x.id === b.closest('.h-card').dataset.id); if (!r) return;
  state.currentReport = r;
  if (b.dataset.h === 'view') openReport(r);
  if (b.dataset.h === 'copy') copyReport();
  if (b.dataset.h === 'print') printReport();
  if (b.dataset.h === 'del' && confirm('Excluir este relatório definitivamente?')) {
    state.history = state.history.filter(x => x.id !== r.id); saveHist(); renderHistory(); toast('Relatório excluído');
  }
}

/* ---------- 9. Backup / Restauração ---------- */
function exportBackup() {
  const data = { app: 'checklist-equipamentos', version: 1, exportedAt: new Date().toISOString(), equip: state.equip, history: state.history };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `backup-checklist-${nowParts().iso}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup exportado');
}

// Validação de integridade antes de sobrescrever
function validateBackup(d) {
  if (!d || typeof d !== 'object' || d.app !== 'checklist-equipamentos') return 'Arquivo não é um backup deste aplicativo.';
  if (!Array.isArray(d.equip) || !Array.isArray(d.history)) return 'Estrutura do backup inválida.';
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
    if (!confirm(`Restaurar ${data.equip.length} equipamentos e ${data.history.length} relatórios? Os dados atuais serão substituídos.`)) return;
    state.equip = data.equip.map(e => ({ ...e, expected: +e.expected }));
    state.history = data.history;
    state.history.forEach(r => { r.ts = r.ts || 0; r.iso = r.iso || ''; });
    state.counts = {}; recalcAuto();
    saveEquip(); saveHist(); saveSession();
    renderItems(); renderHistory(); renderStorageInfo(); toast('Backup restaurado!');
  };
  reader.readAsText(file);
}

function renderStorageInfo() {
  $('#storageInfo').innerHTML = `<h2>Resumo</h2><p>${state.equip.length} equipamentos · ${state.history.length} relatórios salvos neste navegador.</p>`;
}

/* ---------- 10. Interface: tema, abas, toast ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.prefs.theme;
  $('meta[name="theme-color"]').content = state.prefs.theme === 'dark' ? '#101827' : '#1f3a5f';
}
function switchTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'history') renderHistory();
  if (name === 'data') renderStorageInfo();
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- 11. Inicialização ---------- */
function init() {
  // Dados persistidos (ou inventário padrão na primeira execução)
  const storedEquip = load(KEYS.equip, null);
  state.equip = Array.isArray(storedEquip) ? storedEquip : JSON.parse(JSON.stringify(DEFAULT_EQUIP));
  recalcAuto();
  if (!Array.isArray(storedEquip)) saveEquip();
  state.history = load(KEYS.hist, []);
  Object.assign(state.prefs, load(KEYS.prefs, {}));
  const sess = load(KEYS.session, { counts: {}, notes: '' });
  state.counts = sess.counts || {}; state.notes = sess.notes || '';

  // Campos de identificação
  $('#inResp').value = state.prefs.responsavel;
  $('#inSala').value = state.prefs.sala;
  $('#inTurno').value = state.prefs.turno;
  $('#inNotes').value = state.notes;

  // Eventos
  $('#inResp').addEventListener('input', e => { state.prefs.responsavel = e.target.value; savePrefs(); });
  $('#inSala').addEventListener('input', e => { state.prefs.sala = e.target.value; savePrefs(); });
  $('#inTurno').addEventListener('change', e => { state.prefs.turno = e.target.value; savePrefs(); });
  $('#inNotes').addEventListener('input', e => { state.notes = e.target.value; saveSession(); });
  $('#items').addEventListener('click', onItemsClick);
  $('#items').addEventListener('input', onItemsInput);
  $('#btnReset').addEventListener('click', resetCounts);
  $('#btnFinish').addEventListener('click', finishChecklist);

  $('#btnManage').addEventListener('click', () => { renderManage(); $('#manageModal').showModal(); });
  $('#manageList').addEventListener('input', onManageInput);
  $('#manageList').addEventListener('click', onManageClick);
  $('#addForm').addEventListener('submit', onAddItem);

  $('#btnCopy').addEventListener('click', copyReport);
  $('#btnPrint').addEventListener('click', printReport);
  $$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); })); // clique no fundo fecha

  $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  $('#fDate').addEventListener('change', renderHistory);
  $('#fStatus').addEventListener('change', renderHistory);
  $('#btnClearFilter').addEventListener('click', () => { $('#fDate').value = ''; $('#fStatus').value = 'all'; renderHistory(); });
  $('#historyList').addEventListener('click', onHistoryClick);

  $('#btnExport').addEventListener('click', exportBackup);
  $('#btnImport').addEventListener('click', () => $('#fileImport').click());
  $('#fileImport').addEventListener('change', e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });

  $('#themeBtn').addEventListener('click', () => {
    state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark'; savePrefs(); applyTheme();
  });
  // Tema inicial: preferência salva, senão a do sistema
  if (!load(KEYS.prefs, {}).theme && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) state.prefs.theme = 'dark';
  applyTheme();

  renderItems(); renderHistory(); renderStorageInfo();

  // Service Worker: só registra em http(s). Em file:// nada é feito (sem erros no console).
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW não registrado:', err));
  }
}

document.addEventListener('DOMContentLoaded', init);
