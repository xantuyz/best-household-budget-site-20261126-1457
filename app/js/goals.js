// Hearth Ledger — Goals page: actual contributions, editable targets, finish dates.
import { loadState, saveState, money, pct, esc } from './store.js';
import { goalMonthsLeft, goalFinishDate, monthlyNeeded } from './calc.js';

let state = loadState();

function render() {
  const goals = state.goals;
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const thisMonth = goals.reduce((s, g) => s + (g.contributedThisMonth || 0), 0);

  document.getElementById('goal-stats').innerHTML =
    `<div class="card"><p class="stat-label">Saved across all goals</p><p class="stat-value num">${money(totalCurrent)}</p><p class="stat-sub">of ${money(totalTarget)} in targets</p></div>` +
    `<div class="card"><p class="stat-label">Contributed in November</p><p class="stat-value num">${money(thisMonth)}</p><p class="stat-sub">Actual money moved — not the plan</p></div>` +
    `<div class="card"><p class="stat-label">Planned each month</p><p class="stat-value num">${money(goals.reduce((s, g) => s + (g.plannedMonthly || 0), 0))}</p><p class="stat-sub">Emergency $600 · Retirement $600 · Extra payoff $400</p></div>`;

  document.getElementById('goal-cards').innerHTML = goals.map((g) => {
    const progress = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
    const months = goalMonthsLeft(g);
    const finish = goalFinishDate(g);
    const remaining = Math.max(0, g.target - g.current);
    return `<section class="card" style="margin-bottom:16px">
      <h2>${esc(g.name)} <span class="pill">${progress}% funded</span></h2>
      <p><span class="stat-value small num">${money(g.current)}</span> <span class="hint">of ${money(g.target)} target</span></p>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${progress}%"></div></div>
      <div class="progress-row"><span>${money(remaining)} to go</span><span>${Number.isFinite(months) ? months + ' contributions of ' + money(g.plannedMonthly || 0) + ' left' : 'No monthly amount set'}</span></div>
      <p class="hint">${esc(g.note)}</p>
      <p><strong>Finish at the planned pace:</strong> ${esc(finish)}${g.id === 'goal-debt' ? ' — the exact payoff month is on the <a href="debt.html">Debt page</a>.' : ''}</p>
      <form data-goal-form="${g.id}">
        <div class="form-row-3">
          <div><label>Record a real contribution ($)</label><input type="number" min="0" step="1" placeholder="0" data-contrib="${g.id}"></div>
          <div><label>Target ($)</label><input type="number" min="0" step="1" value="${g.target}" data-target="${g.id}"></div>
          <div><label>Planned monthly ($)</label><input type="number" min="0" step="1" value="${g.plannedMonthly || 0}" data-monthly="${g.id}"></div>
        </div>
        <div class="toolbar"><button type="submit">Save ${esc(g.name)}</button></div>
      </form>
      <p class="notice hidden" data-goal-notice="${g.id}" role="status"></p>
      <p class="hint">Contributions here are money actually moved. The November plan already counts $600 / $600 / $400 as set aside on Overview — recording the same money twice would double-count it, so “contributed this month” is shown separately and never added to spending.</p>
    </section>`;
  }).join('');

  const sel = document.getElementById('plan-goal');
  sel.innerHTML = goals.map((g) => `<option value="${g.id}">${esc(g.name)} — ${money(Math.max(0, g.target - g.current))} to go</option>`).join('');
}

document.getElementById('goal-cards').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target.closest('[data-goal-form]');
  if (!form) return;
  const id = form.dataset.goalForm;
  const g = state.goals.find((x) => x.id === id);
  if (!g) return;
  const contrib = Math.max(0, Math.round(Number(form.querySelector(`[data-contrib="${id}"]`).value) || 0));
  const target = Math.max(0, Math.round(Number(form.querySelector(`[data-target="${id}"]`).value) || 0));
  const monthly = Math.max(0, Math.round(Number(form.querySelector(`[data-monthly="${id}"]`).value) || 0));
  const noticeEl = document.querySelector(`[data-goal-notice="${id}"]`);
  if (target < g.current && !confirm(`Set the target to ${money(target)} — below the ${money(g.current)} already saved?\n\nThe goal will show as over-funded.`)) return;
  g.target = target;
  g.plannedMonthly = monthly;
  if (contrib > 0) {
    g.current += contrib;
    g.contributedThisMonth = (g.contributedThisMonth || 0) + contrib;
    // A real contribution to the debt goal also lowers the card balance.
    if (id === 'goal-debt') state.debt.balance = Math.max(0, state.debt.balance - contrib);
  }
  saveState(state);
  render();
  const after = document.querySelector(`[data-goal-notice="${id}"]`);
  if (after) {
    after.textContent = contrib > 0
      ? `Saved. Recorded ${money(contrib)} to ${g.name} — now ${money(g.current)} of ${money(g.target)}, finishing ${goalFinishDate(g)} at the planned pace.`
      : `Saved. ${g.name} is now ${money(g.current)} of ${money(g.target)}, finishing ${goalFinishDate(g)} at the planned pace.`;
    after.classList.remove('hidden');
  }
});

document.getElementById('btn-plan').addEventListener('click', () => {
  const id = document.getElementById('plan-goal').value;
  const months = Math.max(1, Math.round(Number(document.getElementById('plan-months').value) || 1));
  const g = state.goals.find((x) => x.id === id);
  const out = document.getElementById('plan-result');
  if (!g) return;
  const needed = monthlyNeeded(g, months);
  const planned = g.plannedMonthly || 0;
  out.classList.remove('hidden');
  if (needed === 0) {
    out.textContent = `${g.name} is already funded — no monthly saving needed.`;
  } else if (needed <= planned) {
    out.textContent = `To finish ${g.name} in ${months} months you need ${money(needed)} a month — within the planned ${money(planned)} a month, so the plan already gets you there.`;
  } else {
    out.textContent = `To finish ${g.name} in ${months} months you need ${money(needed)} a month — ${money(needed - planned)} more than the planned ${money(planned)} a month. Stretch the date, or move money from another category on the Budget page.`;
  }
});

render();
