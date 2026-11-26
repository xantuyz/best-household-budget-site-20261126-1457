// Hearth Ledger — budget calculations. Every figure on every page comes from here,
// computed from the one shared state, so the pages can never disagree.

export function totalIncome(state) {
  return state.income.reduce((s, i) => s + Number(i.amount || 0), 0);
}

export function plannedByGroup(state, group) {
  return state.budget
    .filter((c) => c.group === group)
    .reduce((s, c) => s + Number(c.planned || 0), 0);
}

export function totalPlanned(state) {
  return state.budget.reduce((s, c) => s + Number(c.planned || 0), 0);
}

export function spentByCategory(state) {
  const out = {};
  for (const tx of state.transactions) {
    out[tx.category] = (out[tx.category] || 0) + Number(tx.amount || 0);
  }
  return out;
}

export function totalSpent(state) {
  return state.transactions.reduce((s, t) => s + Number(t.amount || 0), 0);
}

// Money set aside this month (saving group) — transfers, NOT spending.
export function totalReserved(state) {
  return plannedByGroup(state, 'saving');
}

// Spendable money still left for the rest of November.
export function moneyAvailable(state) {
  return totalIncome(state) - totalSpent(state) - totalReserved(state);
}

export function unallocated(state) {
  return totalIncome(state) - totalPlanned(state);
}

// 50/30/20 split of take-home pay. Minimum debt payment counts as essential;
// extra payoff counts with saving.
export function fiftyThirtyTwenty(state) {
  const income = totalIncome(state);
  const essential = plannedByGroup(state, 'essential');
  const wants = plannedByGroup(state, 'fun');
  const saving = plannedByGroup(state, 'saving');
  const guide = { essential: 0.5 * income, wants: 0.3 * income, saving: 0.2 * income };
  return {
    income,
    essential: { planned: essential, pct: essential / income, target: guide.essential, diff: essential - guide.essential },
    wants: { planned: wants, pct: wants / income, target: guide.wants, diff: wants - guide.wants },
    saving: { planned: saving, pct: saving / income, target: guide.saving, diff: saving - guide.saving },
  };
}

// ---- Debt payoff simulation ----
// Monthly interest on the opening balance, payment at month end. Handles APR 0,
// a final partial payment, and a payment too small to cover interest (never pays off).
export function payoffSchedule(balance, aprPct, payment) {
  const monthlyRate = Number(aprPct) / 100 / 12;
  const pay = Number(payment);
  if (balance <= 0) return { months: 0, totalInterest: 0, totalPaid: 0, never: false, rows: [] };
  if (pay <= 0) return { months: Infinity, totalInterest: 0, totalPaid: 0, never: true, rows: [] };
  if (monthlyRate > 0 && pay <= balance * monthlyRate) {
    return { months: Infinity, totalInterest: Infinity, totalPaid: 0, never: true, rows: [] };
  }
  let bal = balance;
  let interest = 0;
  const rows = [];
  let months = 0;
  while (bal > 0 && months < 600) {
    months += 1;
    const int = bal * monthlyRate;
    const thisPay = Math.min(pay, bal + int);
    bal = bal + int - thisPay;
    interest += int;
    if (months <= 12 || bal <= 0.005 || months % 6 === 0) {
      rows.push({ month: months, payment: thisPay, interest: int, balance: Math.max(0, bal) });
    }
  }
  if (bal > 0.005) return { months: Infinity, totalInterest: Infinity, totalPaid: 0, never: true, rows };
  return { months, totalInterest: interest, totalPaid: balance + interest, never: false, rows };
}

export function payoffDate(months) {
  if (!Number.isFinite(months)) return '—';
  const d = new Date(2026, 10, 18); // Nov 18, 2026: payoff clock starts at the next payment
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ---- Goals ----
export function goalMonthsLeft(goal) {
  const remaining = Math.max(0, goal.target - goal.current);
  if (remaining <= 0) return 0;
  if (!goal.plannedMonthly || goal.plannedMonthly <= 0) return Infinity;
  return Math.ceil(remaining / goal.plannedMonthly);
}

export function goalFinishDate(goal) {
  const m = goalMonthsLeft(goal);
  if (!Number.isFinite(m)) return 'No monthly contribution set';
  if (m === 0) return 'Reached';
  const d = new Date(2026, 10, 18);
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Monthly amount needed to hit the target by a chosen deadline (months from now).
export function monthlyNeeded(goal, months) {
  const remaining = Math.max(0, goal.target - goal.current);
  if (remaining <= 0) return 0;
  if (!months || months <= 0) return Infinity;
  return Math.ceil(remaining / months);
}
