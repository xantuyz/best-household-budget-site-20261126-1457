[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/xantuyz/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/xantuyz/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

# Hearth Ledger

A household budget site that actually works: one example household's November 2026
budget — $6,200 take-home pay, $3,940 spent through Nov 18, $1,600 set aside,
$660 left — with five tools that all do what they say.

- **Overview** (`app/index.html`) — money in, out and left; planned vs. spent chart; emergency-fund progress; next steps.
- **Budget** — editable planner: change any amount or name, add or remove categories, live unallocated total and over-allocation warning, live 50/30/20 analyser.
- **Transactions** — searchable, filterable ledger; add, edit, delete and undo. Every change flows into Overview and Budget at once.
- **Goals** — emergency fund, retirement and card payoff; actual contributions kept separate from the plan; monthly amount needed and finish date.
- **Debt** — minimum-only vs. your payment: months to payoff, total interest, interest saved, month-by-month schedule. Handles 0% APR, a final partial payment, and a payment too small to cover interest.

One dataset lives in `localStorage` and is shared by every page. Backup (JSON export/import) and reset-to-example live on the Overview page. No framework, no CDN, no font download, no network request of any kind — plain HTML, CSS and ES modules, system fonts only.

## Run it

Serve `app/` with any static server and open `index.html`:

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

## Hand in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to
`$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

Real renders of this site in desktop Chrome (1280×800) and a phone viewport (390×844):

1. `1-overview.jpg` — Overview (cover)
2. `2-budget.jpg` — Budget, while editing a category amount
3. `3-transactions-phone.jpg` — Transactions on a phone
4. `4-debt.jpg` — Debt, with the payoff schedule calculated

## License

MIT — see [LICENSE](LICENSE).
