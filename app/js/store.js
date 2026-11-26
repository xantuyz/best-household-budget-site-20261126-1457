// Hearth Ledger — shared data store. One example household, one source of truth.
// Every summary on every page is computed from this state, never typed twice.
// Example household: two adults + one child, November 2026, as of Nov 18, USD,
// income shown as take-home pay. Savings transfers are NOT spending.

export const STORE_KEY = 'hearth-ledger-v1';

export const CATEGORY_GROUPS = {
  essential: 'Essentials',
  fun: 'Everyday joys',
  saving: 'Saving & extra debt payoff',
};

export function seedState() {
  return {
    household: 'Morgan & Alex — two adults, one child',
    monthLabel: 'November 2026',
    asOfLabel: 'as of Nov 18',
    income: [
      { id: 'inc-morgan', name: "Morgan's salary", amount: 3800 },
      { id: 'inc-alex', name: "Alex's salary", amount: 2400 },
    ],
    budget: [
      // Essentials — planned $4,140
      { id: 'rent', name: 'Rent', group: 'essential', planned: 1800 },
      { id: 'utilities', name: 'Utilities', group: 'essential', planned: 220 },
      { id: 'internet', name: 'Internet', group: 'essential', planned: 60 },
      { id: 'phone', name: 'Phone', group: 'essential', planned: 80 },
      { id: 'groceries', name: 'Groceries', group: 'essential', planned: 650 },
      { id: 'transport', name: 'Transport', group: 'essential', planned: 350 },
      { id: 'insurance', name: 'Insurance', group: 'essential', planned: 180 },
      { id: 'childcare', name: 'Childcare', group: 'essential', planned: 450 },
      { id: 'medical', name: 'Medical', group: 'essential', planned: 100 },
      { id: 'debt-min', name: 'Debt minimum payment', group: 'essential', planned: 250 },
      // Everyday joys — planned $460
      { id: 'dining', name: 'Eating out', group: 'fun', planned: 220 },
      { id: 'entertainment', name: 'Entertainment', group: 'fun', planned: 80 },
      { id: 'personal', name: 'Personal shopping', group: 'fun', planned: 110 },
      { id: 'subscriptions', name: 'Subscriptions', group: 'fun', planned: 50 },
      // Saving & extra debt payoff — planned $1,600
      { id: 'emergency', name: 'Emergency fund', group: 'saving', planned: 600 },
      { id: 'retirement', name: 'Retirement', group: 'saving', planned: 600 },
      { id: 'debt-extra', name: 'Extra debt payoff', group: 'saving', planned: 400 },
    ],
    // Recorded spending through Nov 18: $3,940 exactly.
    // Fixed bills recorded in full ($3,090); the rest sums to $850.
    transactions: [
      { id: 't01', date: '2026-11-01', merchant: 'Maple Court Apartments', category: 'rent', amount: 1800, note: 'November rent' },
      { id: 't02', date: '2026-11-02', merchant: 'Little Oaks Daycare', category: 'childcare', amount: 450, note: 'November childcare' },
      { id: 't03', date: '2026-11-02', merchant: 'HomeNet', category: 'internet', amount: 60, note: 'Monthly internet' },
      { id: 't04', date: '2026-11-02', merchant: 'GreenMart', category: 'groceries', amount: 96, note: 'Weekly shop' },
      { id: 't05', date: '2026-11-03', merchant: 'City Power & Water', category: 'utilities', amount: 220, note: 'October usage' },
      { id: 't06', date: '2026-11-04', merchant: 'NorthStar Mobile', category: 'phone', amount: 80, note: 'Two lines' },
      { id: 't07', date: '2026-11-04', merchant: 'Fuel Stop', category: 'transport', amount: 45, note: 'Petrol' },
      { id: 't08', date: '2026-11-05', merchant: 'Harbor Mutual Insurance', category: 'insurance', amount: 180, note: 'Home + auto' },
      { id: 't09', date: '2026-11-06', merchant: 'StreamBundle', category: 'subscriptions', amount: 50, note: 'Streaming bundle' },
      { id: 't10', date: '2026-11-06', merchant: 'Corner Bistro', category: 'dining', amount: 48, note: 'Friday dinner' },
      { id: 't11', date: '2026-11-07', merchant: 'GreenMart', category: 'groceries', amount: 118, note: 'Weekly shop' },
      { id: 't12', date: '2026-11-08', merchant: 'Riverside Cinema', category: 'entertainment', amount: 18, note: 'Film night' },
      { id: 't13', date: '2026-11-09', merchant: 'Fuel Stop', category: 'transport', amount: 60, note: 'Petrol' },
      { id: 't14', date: '2026-11-10', merchant: 'Everyday Card — minimum', category: 'debt-min', amount: 250, note: 'Minimum payment' },
      { id: 't15', date: '2026-11-10', merchant: 'Thread & Needle', category: 'personal', amount: 45, note: 'Winter socks' },
      { id: 't16', date: '2026-11-11', merchant: 'Hilltop Pharmacy', category: 'medical', amount: 35, note: 'Prescription' },
      { id: 't17', date: '2026-11-12', merchant: 'GreenMart', category: 'groceries', amount: 84, note: 'Weekly shop' },
      { id: 't18', date: '2026-11-13', merchant: 'Noodle House', category: 'dining', amount: 52, note: 'Takeaway' },
      { id: 't19', date: '2026-11-14', merchant: 'Metro Transit', category: 'transport', amount: 55, note: 'Monthly pass top-up' },
      { id: 't20', date: '2026-11-15', merchant: 'Riverside Cinema', category: 'entertainment', amount: 22, note: 'Film night' },
      { id: 't21', date: '2026-11-16', merchant: 'GreenMart', category: 'groceries', amount: 92, note: 'Weekly shop' },
      { id: 't22', date: '2026-11-17', merchant: 'Fuel Stop', category: 'transport', amount: 45, note: 'Petrol' },
      { id: 't23', date: '2026-11-17', merchant: 'Corner Bistro', category: 'dining', amount: 35, note: 'Lunch' },
    ],
    goals: [
      {
        id: 'goal-emergency', name: 'Emergency fund', current: 3600, target: 12420,
        plannedMonthly: 600, contributedThisMonth: 600,
        note: 'Target = 3 months of essentials ($4,140 × 3). $600 a month, 15 contributions to go.',
      },
      {
        id: 'goal-retirement', name: 'Retirement', current: 4800, target: 12000,
        plannedMonthly: 600, contributedThisMonth: 600,
        note: 'Steady $600 a month from the budget. No deadline — the habit is the goal.',
      },
      {
        id: 'goal-debt', name: 'Pay off the Everyday Card', current: 0, target: 4800,
        plannedMonthly: 400, contributedThisMonth: 400,
        note: 'Extra payoff on top of the $250 minimum. Tracked here; the payoff date lives on the Debt page.',
      },
    ],
    debt: {
      name: 'Everyday Card', balance: 4800, apr: 18, minPayment: 250,
      plannedPayment: 650, nextDue: '2026-12-01',
      note: 'Balance already reflects the $250 minimum recorded on Nov 10.',
    },
    meta: { seeded: '2026-11-18', version: 1 },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.budget) && Array.isArray(parsed.transactions)) return parsed;
    }
  } catch (e) { /* corrupted storage: fall through to seed */ }
  const seed = seedState();
  saveState(seed);
  return seed;
}

export function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

export function resetState() {
  const seed = seedState();
  saveState(seed);
  return seed;
}

export function money(n) {
  const v = Math.round(n * 100) / 100;
  const decimals = Number.isInteger(v) ? 0 : 2;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function money2(n) {
  return '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(n) {
  return (Math.round(n * 10) / 10).toLocaleString('en-US') + '%';
}

export function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
