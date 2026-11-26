// Hearth Ledger — small SVG charts, always with readable dollar labels and a text summary.
// No library, no network: plain SVG strings the page scripts insert.

import { money } from './store.js';

function svgOpen(w, h, label) {
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${label}" style="display:block">`;
}

// Horizontal bars: planned (sage track) vs spent (evergreen fill), dollar labels at the end.
export function plannedVsSpentBars(rows, width = 640) {
  const rowH = 48;
  const h = rows.length * rowH + 8;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.planned, r.spent)));
  const labelW = 150;
  const barW = width - labelW - 170;
  let s = svgOpen(width, h, 'Budgeted versus spent by group');
  rows.forEach((r, i) => {
    const y = 8 + i * rowH;
    const pw = Math.max(2, (r.planned / max) * barW);
    const sw = Math.max(r.spent > 0 ? 2 : 0, (r.spent / max) * barW);
    s += `<text x="0" y="${y + 13}" font-size="13" fill="#252d29">${r.label}</text>`;
    s += `<rect x="${labelW}" y="${y}" width="${pw}" height="11" rx="5" fill="#dde7dc"/>`;
    s += `<rect x="${labelW}" y="${y + 17}" width="${sw}" height="11" rx="5" fill="#173f35"/>`;
    s += `<text x="${labelW + pw + 8}" y="${y + 10}" font-size="12" fill="#5d6a63">${money(r.planned)} planned</text>`;
    s += `<text x="${labelW + sw + 8}" y="${y + 27}" font-size="12" fill="#173f35" font-weight="700">${money(r.spent)} spent</text>`;
  });
  return s + '</svg>';
}

// Donut for the 50/30/20 split, with a centre total and dollar labels.
export function splitDonut(parts, total) {
  const size = 220, cx = 110, cy = 110, r = 82, stroke = 30;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  let s = svgOpen(size, size, 'Fifty thirty twenty split of take-home pay');
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ece8da" stroke-width="${stroke}"/>`;
  for (const p of parts) {
    const frac = p.value / total;
    const len = Math.max(0, frac * circ - (frac > 0 ? 2 : 0));
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${stroke}" stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"><title>${p.label}: ${money(p.value)}</title></circle>`;
    offset += frac * circ;
  }
  s += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="20" font-weight="700" fill="#173f35">${money(total)}</text>`;
  s += `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12" fill="#5d6a63">take-home pay</text>`;
  return s + '</svg>';
}

// Balance-over-time line for the debt payoff: balance each month, dollar labels.
export function balanceLine(points, width = 640) {
  const h = 220, padL = 58, padB = 26, padT = 14;
  const maxBal = Math.max(1, ...points.map((p) => p.balance));
  const maxMonth = Math.max(1, ...points.map((p) => p.month));
  const x = (m) => padL + (m / maxMonth) * (width - padL - 14);
  const y = (b) => padT + (1 - b / maxBal) * (h - padB - padT);
  let s = svgOpen(width, h, 'Card balance falling month by month');
  s += `<line x1="${padL}" y1="${y(0)}" x2="${width - 14}" y2="${y(0)}" stroke="#ddd8c8"/>`;
  s += `<text x="4" y="${y(maxBal) + 4}" font-size="11" fill="#5d6a63">${money(maxBal)}</text>`;
  s += `<text x="4" y="${y(0) + 4}" font-size="11" fill="#5d6a63">$0</text>`;
  const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + x(p.month).toFixed(1) + ' ' + y(p.balance).toFixed(1)).join(' ');
  s += `<path d="${d}" fill="none" stroke="#a64f38" stroke-width="2.5"/>`;
  for (const p of points) {
    if (p.month === 0 || p.month === maxMonth || p.month % 6 === 0) {
      s += `<circle cx="${x(p.month)}" cy="${y(p.balance)}" r="3.5" fill="#173f35"/>`;
    }
  }
  const last = points[points.length - 1];
  s += `<text x="${Math.min(x(last.month) - 4, width - 130)}" y="${Math.max(y(last.balance) - 8, 12)}" font-size="12" font-weight="700" fill="#173f35">Paid off — month ${last.month}</text>`;
  s += `<text x="${padL}" y="${h - 6}" font-size="11" fill="#5d6a63">Month 0</text>`;
  s += `<text x="${width - 60}" y="${h - 6}" font-size="11" fill="#5d6a63">Month ${maxMonth}</text>`;
  return s + '</svg>';
}

// Monthly payoff bars: first 12 months of the chosen payment plan.
export function monthlyPayoffBars(rows, width = 640) {
  const h = 190, padL = 58, padB = 26, padT = 26;
  const maxPay = Math.max(1, ...rows.map((r) => r.payment));
  const bw = (width - padL - 14) / rows.length;
  let s = svgOpen(width, h, 'Monthly payments in the first year of the plan');
  rows.forEach((r, i) => {
    const bh = (r.payment / maxPay) * (h - padB - padT);
    const bx = padL + i * bw + 3;
    s += `<rect x="${bx.toFixed(1)}" y="${(h - padB - bh).toFixed(1)}" width="${Math.max(4, bw - 6).toFixed(1)}" height="${bh.toFixed(1)}" fill="${i === rows.length - 1 && r.balance <= 0.01 ? '#a64f38' : '#173f35'}"/>`;
    if (i === 0 || i === rows.length - 1) {
      s += `<text x="${(bx + bw / 2).toFixed(1)}" y="${(h - padB - bh - 6).toFixed(1)}" text-anchor="middle" font-size="11" fill="#252d29">${money(Math.round(r.payment))}</text>`;
    }
    s += `<text x="${(bx + bw / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle" font-size="10" fill="#5d6a63">${r.month}</text>`;
  });
  s += `<text x="${padL}" y="14" font-size="12" fill="#5d6a63">Payment each month (first ${rows.length} months)</text>`;
  return s + '</svg>';
}
