// Hearth Ledger — Overview page: month at a glance, planned vs spent, next steps.
import { loadState, money, pct, esc, CATEGORY_GROUPS } from './store.js';
import { totalIncome, totalSpent, totalReserved, moneyAvailable, plannedByGroup, spentByCategory, fiftyThirtyTwenty } from './calc.js';
import { plannedVsSpentBars } from './charts.js';
import { wireBackupButtons } from './backup.js';

const state = loadState();
const income = totalIncome(state);
const spent = totalSpent(state);
const reserved = totalReserved(state);
const available = moneyAvailable(state);
const byCat = spentByCategory(state);

function stat(label, value, sub, warn) {
  return `<div class="card"><p class="stat-label">${label}</p><p class="stat-value num${warn ? ' warn' : ''}">${value}</p><p class="stat-sub">${sub}</p></div>`;
}

document.getElementById('stat-cards').innerHTML =
  stat('Income — take-home pay', money(income), "Morgan $3,800 + Alex $2,400") +
  stat('Spent so far', money(spent), '23 transactions, through Nov 18') +
  stat('Set aside (not spending)', money(reserved), 'Emergency $600 · Retirement $600 · Extra debt $400') +
  stat('Available for the rest of Nov', money(available), 'Must cover Nov 19–30', available < 0);

const callout = document.getElementById('available-callout');
callout.classList.add(available >= 0 ? 'good' : '');
callout.innerHTML = available >= 0
  ? `<p><strong>${money(available)} remains for November spending.</strong> The plan is fully funded — every dollar of the $6,200 has a job — and $660 is still unspent for the last 12 days. Groceries have ${money(650 - (byCat.groceries || 0))} left, eating out ${money(220 - (byCat.dining || 0))}.</p>`
  : `<p><strong>Over by ${money(-available)}.</strong> Spending plus set-aside money is more than income — move money between categories on the <a href="budget.html">Budget page</a>.</p>`;

const rows = Object.keys(CATEGORY_GROUPS).map((g) => ({
  label: CATEGORY_GROUPS[g],
  planned: plannedByGroup(state, g),
  spent: g === 'saving' ? 0 : state.budget.filter((c) => c.group === g).reduce((s, c) => s + (byCat[c.id] || 0), 0),
}));
document.getElementById('plan-chart').innerHTML = plannedVsSpentBars(rows);
const essSpent = state.budget.filter((c) => c.group === 'essential').reduce((s, c) => s + (byCat[c.id] || 0), 0);
const funSpent = state.budget.filter((c) => c.group === 'fun').reduce((s, c) => s + (byCat[c.id] || 0), 0);
document.getElementById('plan-note').textContent =
  `Essentials: ${money(essSpent)} of ${money(plannedByGroup(state, 'essential'))} spent. Everyday joys: ${money(funSpent)} of ${money(plannedByGroup(state, 'fun'))} spent. Saving is a transfer, not spending, so its bar shows $0 spent — the $1,600 is set aside, not gone.`;

const ef = state.goals.find((g) => g.id === 'goal-emergency');
document.getElementById('ef-value').textContent = `${money(ef.current)} of ${money(ef.target)}`;
document.getElementById('ef-bar').style.width = Math.round((ef.current / ef.target) * 100) + '%';
document.getElementById('ef-progress').textContent = `${pct((ef.current / ef.target) * 100)} funded`;
document.getElementById('ef-left').textContent = `${money(ef.target - ef.current)} to go · 15 × $600`;

const steps = [
  `Groceries: ${money(650 - (byCat.groceries || 0))} left for Nov 19–30 — about $21 a day.`,
  `Card payment: the $650 planned payment lands Dec 1 — paid off in 8 months at that pace.`,
  `Eating out: ${money(220 - (byCat.dining || 0))} left; two dinners out would use most of it.`,
];
document.getElementById('next-steps').innerHTML = steps.map((s) => `<li>${esc(s)}</li>`).join('');

const top = state.budget
  .map((c) => ({ name: c.name, planned: c.planned, spent: byCat[c.id] || 0 }))
  .filter((c) => c.spent > 0)
  .sort((a, b) => b.spent - a.spent)
  .slice(0, 6);
document.getElementById('top-spending').innerHTML = top.map((c) => `
  <div class="budget-row">
    <span class="cat-name">${esc(c.name)}</span>
    <span class="cat-amt money num">${money(c.spent)}</span>
    <span class="cat-meta">${money(c.planned - c.spent)} left of ${money(c.planned)} planned</span>
  </div>`).join('');

const split = fiftyThirtyTwenty(state);
document.getElementById('split-mini').innerHTML =
  `<div class="kv"><span class="k">Essentials</span><span class="v num">${pct(split.essential.pct * 100)} · ${money(split.essential.planned)}</span></div>` +
  `<div class="kv"><span class="k">Everyday joys</span><span class="v num">${pct(split.wants.pct * 100)} · ${money(split.wants.planned)}</span></div>` +
  `<div class="kv"><span class="k">Saving &amp; extra payoff</span><span class="v num">${pct(split.saving.pct * 100)} · ${money(split.saving.planned)}</span></div>`;
document.getElementById('split-note').textContent =
  'Essentials run 66.8% against the 50% guide — $1,040 over it, driven by rent and childcare. Saving runs 25.8%, above the 20% guide.';

wireBackupButtons(state);
