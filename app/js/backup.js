// Hearth Ledger — backup, import and reset. One shared helper for every page that offers it.
import { loadState, saveState, resetState, STORE_KEY } from './store.js';

export function exportBackup(state, noticeEl) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hearth-ledger-backup-2026-11.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  if (noticeEl) {
    noticeEl.textContent = 'Backup downloaded as hearth-ledger-backup-2026-11.json. Keep it somewhere safe.';
    noticeEl.classList.remove('hidden');
  }
}

export function importBackupFile(file, noticeEl, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || !Array.isArray(data.budget) || !Array.isArray(data.transactions) || !Array.isArray(data.income)) {
        throw new Error('not a Hearth Ledger backup');
      }
      saveState(data);
      if (noticeEl) {
        noticeEl.textContent = 'Backup imported — the site now shows the imported household. Reloading…';
        noticeEl.classList.remove('hidden');
      }
      setTimeout(() => location.reload(), 600);
      if (onDone) onDone(data);
    } catch (e) {
      if (noticeEl) {
        noticeEl.textContent = 'That file is not a valid Hearth Ledger backup — nothing was changed. Export a backup first, then try again.';
        noticeEl.classList.remove('hidden');
        noticeEl.classList.add('warn');
      }
    }
  };
  reader.readAsText(file);
}

export function resetWithConfirm(noticeEl) {
  const ok = confirm('Reset to the November example?\n\nThis replaces everything you changed with the original example household. Export a backup first if you want to keep your edits.');
  if (!ok) return null;
  const seed = resetState();
  if (noticeEl) {
    noticeEl.textContent = 'Reset done — the November example is back. Reloading…';
    noticeEl.classList.remove('hidden');
  }
  setTimeout(() => location.reload(), 600);
  return seed;
}

export function wireBackupButtons(state) {
  const notice = document.getElementById('backup-notice');
  const ex = document.getElementById('btn-export');
  const im = document.getElementById('btn-import');
  const file = document.getElementById('file-import');
  const rs = document.getElementById('btn-reset');
  if (ex) ex.addEventListener('click', () => exportBackup(loadState(), notice));
  if (im && file) {
    im.addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      if (file.files && file.files[0]) importBackupFile(file.files[0], notice);
      file.value = '';
    });
  }
  if (rs) rs.addEventListener('click', () => resetWithConfirm(notice));
}
