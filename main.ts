// Hearth Ledger — best-household-budget-site-20261126-1457 (Node 22, standard library only).
//
// The entry is the static site in this directory's app/ folder: plain HTML, CSS and
// ES modules, no build step, nothing loaded over the network. This program hands it
// in: it copies app/ and screenshots/ from beside this file into /output (or
// $MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json with the
// vendored make.fun library. vendor/makefun-frontend.ts is the kit's copy, unchanged:
// the scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
// Copy only the four named screenshots, never a recursive copy of the folder:
// the grader rejects any output path that is not a plain relative name, so a
// stray dotfile in the repo (e.g. screenshots/.gitkeep) must never reach /output.
for (const shot of ['1-overview.jpg', '2-budget.jpg', '3-transactions-phone.jpg', '4-debt.jpg']) {
  const src = join(here, 'screenshots', shot);
  if (existsSync(src)) copyFileSync(src, join(out, 'screenshots', shot));
}

// The scorer's own caps: at most 4 screenshots, each at most 256 KiB; app/ at most
// 993 files and directories and 16 MiB in all; the dossier text at most 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
