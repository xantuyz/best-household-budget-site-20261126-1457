// Hearth Ledger — Debt page: minimum-only vs your payment, payoff schedule.
import { loadState, saveState, money, esc } from './store.js';
import { payoffSchedule, payoffDate } from './calc.js';
import { balanceLine } from './charts.js';

let state = loadState();

function resultHtml(plan, label) {
  if (plan.never) {
    return `<p><span class="pill warn">Never pays off</span></p>
      <p>The payment does not cover the monthly interest, so the balance grows instead of falling. Raise the payment above ${money(state.debt.balance * (state.debt.apr / 100 / 12))} a month — the interest charged in the first month.</p>`;
  }
  return `<div class="kv"><span class="k">Months to payoff</span><span class="v num">${plan.months}</span></div>
    <div class="kv"><span class="k">Paid off</span><span class="v">${payoffDate(plan.months)}</span></div>
    <div class="kv"><span class="k">Total interest</span><span class="v num">${money(Math.round(plan.totalInterest))}</span></div>
    <div class="kv"><span class="k">Total paid</span><span class="v num">${money(Math.round(plan.totalPaid))}</span></div>
    <p class="hint">${label}</p>`;
}

function render() {
  const d = state.debt;
  const minPlan = payoffSchedule(d.balance, d.apr, d.minPayment);
  const yourPlan = payoffSchedule(d.balance, d.apr, d.plannedPayment);

  document.getElementById('debt-stats').innerHTML =
    `<div class="card"><p class="stat-label">Balance owed</p><p class="stat-value num">${money(d.balance)}</p><p class="stat-sub">${esc(d.name)} · ${esc(d.note || '')}</p></div>` +
    `<div class="card"><p class="stat-label">APR</p><p class="stat-value num">${d.apr}%</p><p class="stat-sub">Monthly interest ${money(d.balance * (d.apr / 100 / 12))} on this balance</p></div>` +
    `<div class="card"><p class="stat-label">Minimum payment</p><p class="stat-value num">${money(d.minPayment)}</p><p class="stat-sub">Due Dec 1, 2026</p></div>` +
    `<div class="card"><p class="stat-label">Your planned payment</p><p class="stat-value num">${money(d.plannedPayment)}</p><p class="stat-sub">Minimum $250 + extra $400 from the budget</p></div>`;

  document.getElementById('min-result').innerHTML = resultHtml(minPlan, 'Paying only the minimum keeps the card alive for years — most of each payment is interest.');
  document.getElementById('your-result').innerHTML = resultHtml(yourPlan, 'The extra $400 a month is what does the work.');
  document.getElementById('your-pay-label').textContent = money(d.plannedPayment);

  const warn = document.getElementById('debt-warning');
  if (yourPlan.never) {
    warn.classList.remove('hidden');
    warn.textContent = `At ${money(d.plannedPayment)} a month this balance never pays off — the payment is below the ${money(d.balance * (d.apr / 100 / 12))} of interest charged each month. Raise the payment.`;
  } else if (!minPlan.never && !yourPlan.never) {
    warn.classList.add('hidden');
    const saved = Math.round(minPlan.totalInterest - yourPlan.totalInterest);
    const monthsSaved = minPlan.months - yourPlan.months;
    const extra = document.createElement('p');
    extra.className = 'notice';
    extra.setAttribute('role', 'status');
    extra.textContent = `Paying ${money(d.plannedPayment)} instead of the ${money(d.minPayment)} minimum saves ${money(saved)} in interest and finishes ${monthsSaved} months sooner — paid off ${payoffDate(yourPlan.months)} instead of ${payoffDate(minPlan.months)}.`;
    const card = document.getElementById('your-result');
    card.appendChild(extra);
  }

  // Chart: full payoff curve (month 0 + monthly points)
  if (!yourPlan.never) {
    const points = [{ month: 0, balance: d.balance }];
    let bal = d.balance;
    const rate = d.apr / 100 / 12;
    for (let m = 1; m <= yourPlan.months; m++) {
      const pay = Math.min(d.plannedPayment, bal + bal * rate);
      bal = Math.max(0, bal + bal * rate - pay);
      points.push({ month: m, balance: bal });
    }
    document.getElementById('debt-chart').innerHTML = balanceLine(points);
    document.getElementById('debt-chart-note').textContent =
      `Balance falls from ${money(d.balance)} to $0 over ${yourPlan.months} months at ${money(d.plannedPayment)} a month. The last payment is a partial one — only what is still owed.`;
    const first12 = yourPlan.rows.filter((r) => r.month <= 12);
    document.getElementById('schedule-body').innerHTML = yourPlan.rows.map((r) => `
      <tr><td>Month ${r.month}</td><td class="amt num">${money(Math.round(r.interest * 100) / 100)}</td>
      <td class="amt num">${money(Math.round(r.payment * 100) / 100)}</td><td class="amt num">${money(Math.round(r.balance * 100) / 100)}</td></tr>`).join('');
    document.getElementById('schedule-empty').classList.add('hidden');
  } else {
    document.getElementById('debt-chart').innerHTML = '<p class="hint">No payoff curve — the payment is too small to cover the interest.</p>';
    document.getElementById('debt-chart-note').textContent = '';
    document.getElementById('schedule-body').innerHTML = '';
    document.getElementById('schedule-empty').classList.remove('hidden');
  }

  document.getElementById('d-balance').value = d.balance;
  document.getElementById('d-apr').value = d.apr;
  document.getElementById('d-payment').value = d.plannedPayment;
}

document.getElementById('debt-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const bal = Math.max(0, Math.round(Number(document.getElementById('d-balance').value) || 0));
  const apr = Math.max(0, Math.min(60, Number(document.getElementById('d-apr').value) || 0));
  const pay = Math.max(0, Math.round(Number(document.getElementById('d-payment').value) || 0));
  state.debt.balance = bal;
  state.debt.apr = apr;
  state.debt.plannedPayment = pay;
  saveState(state);
  render();
});

document.getElementById('btn-min').addEventListener('click', () => {
  document.getElementById('d-payment').value = state.debt.minPayment;
  document.getElementById('debt-form').dispatchEvent(new Event('submit', { cancelable: true }));
});
document.getElementById('btn-plan').addEventListener('click', () => {
  document.getElementById('d-payment').value = 650;
  document.getElementById('debt-form').dispatchEvent(new Event('submit', { cancelable: true }));
});

render();
