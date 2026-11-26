// Hearth Ledger — Budget page: editable planner + live 50/30/20 analyser.
import { loadState, saveState, money, pct, esc, uid, CATEGORY_GROUPS } from './store.js';
import { totalIncome, totalPlanned, unallocated, plannedByGroup, spentByCategory, fiftyThirtyTwenty } from './calc.js';
import { splitDonut } from './charts.js';

let state = loadState();

function render() {
  const income = totalIncome(state);
  const planned = totalPlanned(state);
  const left = unallocated(state);
  const byCat = spentByCategory(state);

  document.getElementById('budget-stats').innerHTML =
    `<div class="card"><p class="stat-label">Income</p><p class="stat-value num">${money(income)}</p><p class="stat-sub">Take-home pay</p></div>` +
    `<div class="card"><p class="stat-label">Planned</p><p class="stat-value num">${money(planned)}</p><p class="stat-sub">Across ${state.budget.length} categories</p></div>` +
    `<div class="card"><p class="stat-label">Unallocated</p><p class="stat-value num${left < 0 ? ' warn' : ''}">${money(left)}</p><p class="stat-sub">${left === 0 ? 'Every dollar has a job' : left > 0 ? 'Still needs a job' : 'Over budget — cut something'}</p></div>` +
    `<div class="card"><p class="stat-label">Spent so far</p><p class="stat-value num">${money(state.transactions.reduce((s, t) => s + Number(t.amount), 0))}</p><p class="stat-sub">Through Nov 18</p></div>`;

  const oc = document.getElementById('over-callout');
  if (left < 0) {
    oc.classList.remove('hidden');
    oc.innerHTML = `<p><strong>Over-allocated by ${money(-left)}.</strong> The plan spends more than the $${income.toLocaleString()} coming in. Lower a category above, or raise income — the unallocated total must reach $0 before the month is safe.</p>`;
  } else if (left > 0) {
    oc.classList.remove('hidden');
    oc.classList.add('good');
    oc.innerHTML = `<p><strong>${money(left)} is still unallocated.</strong> Give it a job — extra debt payoff or the emergency fund are the usual homes.</p>`;
  } else {
    oc.classList.add('hidden');
  }

  // Income editor
  document.getElementById('income-list').innerHTML = state.income.map((inc, i) => `
    <div class="form-row" style="align-items:end">
      <div><label for="inc-name-${i}">Source</label><input type="text" id="inc-name-${i}" value="${esc(inc.name)}" data-inc-name="${i}"></div>
      <div><label for="inc-amt-${i}">Amount ($ per month)</label><input type="number" id="inc-amt-${i}" min="0" step="1" value="${inc.amount}" data-inc-amt="${i}"></div>
    </div>`).join('');
  document.getElementById('income-total').textContent = money(income);

  // Category groups
  const host = document.getElementById('group-sections');
  host.innerHTML = Object.keys(CATEGORY_GROUPS).map((g) => {
    const cats = state.budget.filter((c) => c.group === g);
    const groupPlanned = plannedByGroup(state, g);
    const groupSpent = cats.reduce((s, c) => s + (byCat[c.id] || 0), 0);
    return `<section class="card" style="margin-top:16px" data-group="${g}">
      <h2 data-group-h="${g}">${CATEGORY_GROUPS[g]} — ${money(groupPlanned)} planned · ${money(groupSpent)} spent</h2>
      ${cats.map((c) => {
        const spent = byCat[c.id] || 0;
        const leftCat = c.planned - spent;
        return `<div class="budget-row" style="grid-template-columns: 1fr auto auto; align-items:center">
          <div>
            <input type="text" value="${esc(c.name)}" data-cat-name="${c.id}" aria-label="Category name" style="font-weight:650;border-color:transparent;background:transparent;padding:4px 6px">
            <div class="cat-meta">${money(spent)} spent · <span class="${leftCat < 0 ? 'over' : 'under'}">${money(Math.abs(leftCat))} ${leftCat < 0 ? 'over' : 'left'}</span>${c.group === 'saving' ? ' · transfer, not spending' : ''}</div>
          </div>
          <div><label class="hidden" for="amt-${c.id}">Planned amount</label><input type="number" class="inline-amt" id="amt-${c.id}" min="0" step="1" value="${c.planned}" data-cat-amt="${c.id}" aria-label="Planned amount for ${esc(c.name)}"></div>
          <button type="button" class="btn-danger btn-small" data-cat-del="${c.id}">Remove</button>
        </div>`;
      }).join('') || '<p class="hint">No categories in this group yet — add one below.</p>'}
    </section>`;
  }).join('');

  // 50/30/20
  const s = fiftyThirtyTwenty(state);
  document.getElementById('split-chart').innerHTML = splitDonut([
    { label: 'Essentials', value: s.essential.planned, color: '#173f35' },
    { label: 'Everyday joys', value: s.wants.planned, color: '#a64f38' },
    { label: 'Saving & extra payoff', value: s.saving.planned, color: '#b98a2f' },
  ], s.income);
  document.getElementById('split-rows').innerHTML =
    splitRow('Essentials', s.essential, '50%') +
    splitRow('Everyday joys', s.wants, '30%') +
    splitRow('Saving & extra payoff', s.saving, '20%');
  document.getElementById('split-verdict').textContent =
    `Essentials exceed this guideline by ${money(s.essential.diff)}; rent and childcare are the largest commitments. ` +
    `Everyday joys sit ${money(-s.wants.diff)} under the guide, and saving runs ${money(s.saving.diff)} over it. ` +
    `The guide is a starting point — a household with $1,800 rent and $450 childcare will not hit 50% without moving house or changing childcare.`;
}

function splitRow(label, part, guide) {
  const over = part.diff > 0;
  return `<div class="kv"><span class="k">${label} — guide ${guide} (${money(part.target)})</span>
    <span class="v num">${pct(part.pct * 100)} · ${money(part.planned)} · <span class="${over ? 'over' : 'under'}">${over ? '+' : ''}${money(part.diff)} vs guide</span></span></div>`;
}

function persist() { saveState(state); render(); }

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.catAmt !== undefined) {
    const c = state.budget.find((x) => x.id === t.dataset.catAmt);
    if (c) { c.planned = Math.max(0, Math.round(Number(t.value) || 0)); saveState(state); renderTotalsOnly(); }
  } else if (t.dataset.incAmt !== undefined) {
    const inc = state.income[Number(t.dataset.incAmt)];
    if (inc) { inc.amount = Math.max(0, Math.round(Number(t.value) || 0)); saveState(state); renderTotalsOnly(); }
  }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.catName !== undefined) {
    const c = state.budget.find((x) => x.id === t.dataset.catName);
    if (c && t.value.trim()) { c.planned = c.planned; c.name = t.value.trim(); persist(); }
  } else if (t.dataset.incName !== undefined) {
    const inc = state.income[Number(t.dataset.incName)];
    if (inc && t.value.trim()) { inc.name = t.value.trim(); persist(); }
  }
});
document.addEventListener('click', (e) => {
  const del = e.target.closest('[data-cat-del]');
  if (del) {
    const c = state.budget.find((x) => x.id === del.dataset.catDel);
    if (!c) return;
    const spent = spentByCategory(state)[c.id] || 0;
    if (!confirm(`Remove “${c.name}” (${money(c.planned)} planned${spent ? `, ${money(spent)} already spent` : ''})?\n\nIts transactions stay in the ledger under their old category.`)) return;
    state.budget = state.budget.filter((x) => x.id !== c.id);
    persist();
  }
});

// Live totals while typing an amount, without rebuilding the inputs (keeps focus).
function renderTotalsOnly() {
  const income = totalIncome(state);
  const planned = totalPlanned(state);
  const left = unallocated(state);
  const stats = document.querySelectorAll('#budget-stats .card');
  if (stats.length === 4) {
    stats[0].querySelector('.stat-value').textContent = money(income);
    stats[1].querySelector('.stat-value').textContent = money(planned);
    const un = stats[2].querySelector('.stat-value');
    un.textContent = money(left);
    un.classList.toggle('warn', left < 0);
    stats[2].querySelector('.stat-sub').textContent = left === 0 ? 'Every dollar has a job' : left > 0 ? 'Still needs a job' : 'Over budget — cut something';
  }
  document.getElementById('income-total').textContent = money(income);
  const oc = document.getElementById('over-callout');
  if (left < 0) {
    oc.classList.remove('hidden', 'good');
    oc.innerHTML = `<p><strong>Over-allocated by ${money(-left)}.</strong> The plan spends more than the ${money(income)} coming in.</p>`;
  } else if (left > 0) {
    oc.classList.remove('hidden');
    oc.classList.add('good');
    oc.innerHTML = `<p><strong>${money(left)} is still unallocated.</strong> Give it a job — extra debt payoff or the emergency fund are the usual homes.</p>`;
  } else {
    oc.classList.add('hidden');
  }
  // Keep every per-category "left" line and group header honest while typing.
  const byCat = spentByCategory(state);
  document.querySelectorAll('[data-cat-amt]').forEach((input) => {
    const c = state.budget.find((x) => x.id === input.dataset.catAmt);
    if (!c) return;
    const row = input.closest('.budget-row');
    const spent = byCat[c.id] || 0;
    const leftCat = c.planned - spent;
    const meta = row && row.querySelector('.cat-meta');
    if (meta) {
      meta.innerHTML = `${money(spent)} spent · <span class="${leftCat < 0 ? 'over' : 'under'}">${money(Math.abs(leftCat))} ${leftCat < 0 ? 'over' : 'left'}</span>${c.group === 'saving' ? ' · transfer, not spending' : ''}`;
    }
  });
  Object.keys(CATEGORY_GROUPS).forEach((g) => {
    const h = document.querySelector(`[data-group-h="${g}"]`);
    if (!h) return;
    const cats = state.budget.filter((c) => c.group === g);
    const gp = cats.reduce((s, c) => s + c.planned, 0);
    const gs = cats.reduce((s, c) => s + (byCat[c.id] || 0), 0);
    h.textContent = `${CATEGORY_GROUPS[g]} — ${money(gp)} planned · ${money(gs)} spent`;
  });
  const s = fiftyThirtyTwenty(state);
  document.getElementById('split-rows').innerHTML =
    splitRow('Essentials', s.essential, '50%') + splitRow('Everyday joys', s.wants, '30%') + splitRow('Saving & extra payoff', s.saving, '20%');
  document.getElementById('split-chart').innerHTML = splitDonut([
    { label: 'Essentials', value: s.essential.planned, color: '#173f35' },
    { label: 'Everyday joys', value: s.wants.planned, color: '#a64f38' },
    { label: 'Saving & extra payoff', value: s.saving.planned, color: '#b98a2f' },
  ], s.income);
}

document.getElementById('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('new-name').value.trim();
  const group = document.getElementById('new-group').value;
  const amount = Math.max(0, Math.round(Number(document.getElementById('new-amount').value) || 0));
  const notice = document.getElementById('add-notice');
  if (!name) { notice.textContent = 'Give the category a name first.'; notice.classList.remove('hidden'); return; }
  if (state.budget.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    notice.textContent = `“${name}” already exists — pick a different name.`;
    notice.classList.remove('hidden');
    return;
  }
  state.budget.push({ id: uid('cat'), name, group, planned: amount });
  persist();
  notice.textContent = `Added “${name}” at ${money(amount)} a month. It now appears in the ${CATEGORY_GROUPS[group]} group — and in the transaction form.`;
  notice.classList.remove('hidden');
  e.target.reset();
  document.getElementById('new-amount').value = '0';
});

render();
