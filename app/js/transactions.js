// Hearth Ledger — Transactions page: add / edit / delete + undo, search + filter.
import { loadState, saveState, money, esc, uid, shortDate } from './store.js';
import { totalSpent, spentByCategory, plannedByGroup } from './calc.js';

let state = loadState();
let editingId = null;
let history = []; // snapshots for undo (last change only is exposed, stack kept for safety)

function snapshot() { history.push(JSON.stringify(state)); if (history.length > 20) history.shift(); }
function updateUndoBtn() { document.getElementById('btn-undo').disabled = history.length === 0; }

function render() {
  const byCat = spentByCategory(state);
  const spent = totalSpent(state);
  const cats = state.budget.filter((c) => c.group !== 'saving');
  const savingNote = 'Saving categories are transfers, not spending — they never appear here.';

  const largest = state.transactions.reduce((a, b) => (b.amount > a.amount ? b : a), state.transactions[0] || { amount: 0, merchant: '—', date: '' });
  document.getElementById('tx-stats').innerHTML =
    `<div class="card"><p class="stat-label">Spent so far</p><p class="stat-value num">${money(spent)}</p><p class="stat-sub">${state.transactions.length} transactions, through Nov 18</p></div>` +
    `<div class="card"><p class="stat-label">Essentials spent</p><p class="stat-value num">${money(cats.filter((c) => c.group === 'essential').reduce((s, c) => s + (byCat[c.id] || 0), 0))}</p><p class="stat-sub">of ${money(plannedByGroup(state, 'essential'))} planned</p></div>` +
    `<div class="card"><p class="stat-label">Everyday joys spent</p><p class="stat-value num">${money(cats.filter((c) => c.group === 'fun').reduce((s, c) => s + (byCat[c.id] || 0), 0))}</p><p class="stat-sub">of ${money(plannedByGroup(state, 'fun'))} planned</p></div>` +
    `<div class="card"><p class="stat-label">Largest single spend</p><p class="stat-value num">${money(Math.max(0, ...state.transactions.map((t) => t.amount)))}</p><p class="stat-sub">${esc(largest.merchant)} · ${shortDate(largest.date)}</p></div>`;

  const catSel = document.getElementById('f-category');
  const curCat = catSel.value || 'groceries';
  catSel.innerHTML = cats.map((c) => `<option value="${c.id}">${esc(c.name)} — ${money(c.planned)} planned</option>`).join('');
  if (cats.some((c) => c.id === curCat)) catSel.value = curCat;

  const filterSel = document.getElementById('f-filter');
  const curFilter = filterSel.value || '';
  filterSel.innerHTML = '<option value="">All categories</option>' +
    cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  filterSel.value = curFilter;

  const q = (document.getElementById('q').value || '').trim().toLowerCase();
  const f = filterSel.value;
  const sorted = [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const shown = sorted.filter((t) => {
    if (f && t.category !== f) return false;
    if (q && !(t.merchant.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q))) return false;
    return true;
  });
  document.getElementById('tx-count').textContent =
    `Showing ${shown.length} of ${state.transactions.length} transactions · total shown ${money(shown.reduce((s, t) => s + Number(t.amount), 0))}. ${savingNote}`;
  document.getElementById('tx-empty').classList.toggle('hidden', shown.length > 0);
  document.getElementById('tx-list').innerHTML = shown.map((t) => {
    const cat = state.budget.find((c) => c.id === t.category);
    return `<li>
      <div class="tx-main"><div class="tx-merchant">${esc(t.merchant)}</div>
      <div class="tx-meta">${shortDate(t.date)} · ${esc(cat ? cat.name : t.category)}${t.note ? ' · ' + esc(t.note) : ''}</div></div>
      <span class="tx-amt num">${money(t.amount)}</span>
      <span class="tx-actions">
        <button type="button" class="btn-secondary btn-small" data-edit="${t.id}">Edit</button>
        <button type="button" class="btn-danger btn-small" data-del="${t.id}">Delete</button>
      </span>
    </li>`;
  }).join('');

  document.getElementById('tx-by-cat').innerHTML = cats.map((c) => {
    const sp = byCat[c.id] || 0;
    const left = c.planned - sp;
    const w = Math.min(100, Math.round((sp / Math.max(1, c.planned)) * 100));
    return `<div class="budget-row"><span class="cat-name">${esc(c.name)}</span>
      <span class="cat-amt money num">${money(sp)} <span class="hint">of ${money(c.planned)}</span></span>
      <span class="cat-meta"><span class="bar-track" style="display:block;width:220px;max-width:100%"><span class="bar-fill${left < 0 ? ' terra' : ''}" style="display:block;width:${w}%"></span></span>
      <span class="${left < 0 ? 'over' : 'under'}">${left < 0 ? money(-left) + ' over' : money(left) + ' left'}</span></span></div>`;
  }).join('');
  updateUndoBtn();
}

function notice(msg, warn) {
  const n = document.getElementById('tx-notice');
  n.textContent = msg;
  n.classList.remove('hidden');
  n.classList.toggle('warn', !!warn);
}

document.getElementById('tx-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = document.getElementById('f-date').value;
  const merchant = document.getElementById('f-merchant').value.trim();
  const amount = Math.round(Number(document.getElementById('f-amount').value) * 100) / 100;
  const category = document.getElementById('f-category').value;
  const note = document.getElementById('f-note').value.trim();
  if (!merchant) { notice('Add a merchant name — “who did you pay?”', true); return; }
  if (!amount || amount <= 0) { notice('Amount must be more than $0.', true); return; }
  if (!date) { notice('Pick a date for the transaction.', true); return; }
  snapshot();
  if (editingId) {
    const t = state.transactions.find((x) => x.id === editingId);
    if (t) Object.assign(t, { date, merchant, category, amount, note });
    notice(`Updated “${merchant}” — ${money(amount)}. Overview and Budget already show the new total.`);
    editingId = null;
    document.getElementById('tx-submit').textContent = 'Add transaction';
    document.getElementById('tx-cancel').classList.add('hidden');
  } else {
    state.transactions.push({ id: uid('t'), date, merchant, category, amount, note });
    notice(`Added “${merchant}” — ${money(amount)} in ${state.budget.find((c) => c.id === category)?.name || category}. Overview and Budget already show the new total.`);
  }
  saveState(state);
  e.target.reset();
  document.getElementById('f-date').value = '2026-11-18';
  render();
});

document.getElementById('tx-cancel').addEventListener('click', () => {
  editingId = null;
  document.getElementById('tx-form').reset();
  document.getElementById('f-date').value = '2026-11-18';
  document.getElementById('tx-submit').textContent = 'Add transaction';
  document.getElementById('tx-cancel').classList.add('hidden');
});

document.getElementById('tx-list').addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');
  if (editBtn) {
    const t = state.transactions.find((x) => x.id === editBtn.dataset.edit);
    if (!t) return;
    editingId = t.id;
    document.getElementById('f-date').value = t.date;
    document.getElementById('f-merchant').value = t.merchant;
    document.getElementById('f-amount').value = t.amount;
    document.getElementById('f-category').value = t.category;
    document.getElementById('f-note').value = t.note || '';
    document.getElementById('tx-submit').textContent = 'Save changes';
    document.getElementById('tx-cancel').classList.remove('hidden');
    document.getElementById('f-merchant').focus();
    notice(`Editing “${t.merchant}” — change what you need, then Save changes.`);
  }
  if (delBtn) {
    const t = state.transactions.find((x) => x.id === delBtn.dataset.del);
    if (!t) return;
    if (!confirm(`Delete “${t.merchant}” — ${money(t.amount)} on ${t.date}?\n\nYou can undo this right after.`)) return;
    snapshot();
    state.transactions = state.transactions.filter((x) => x.id !== t.id);
    saveState(state);
    notice(`Deleted “${t.merchant}” (${money(t.amount)}). Use Undo if that was a mistake.`);
    render();
  }
});

document.getElementById('btn-undo').addEventListener('click', () => {
  const prev = history.pop();
  if (!prev) return;
  state = JSON.parse(prev);
  saveState(state);
  editingId = null;
  document.getElementById('tx-submit').textContent = 'Add transaction';
  document.getElementById('tx-cancel').classList.add('hidden');
  notice('Undone — the ledger is back to how it was before your last change.');
  render();
});

document.getElementById('q').addEventListener('input', render);
document.getElementById('f-filter').addEventListener('change', render);

render();
