'use strict';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function loadCount() {
  const { notes } = await chrome.storage.local.get('notes');
  const count = (notes ?? []).length;
  document.getElementById('note-count').textContent =
    count === 0 ? 'No notes yet' : `${count} note${count === 1 ? '' : 's'} saved`;
}

async function saveNote() {
  const title   = document.getElementById('p-title').value.trim();
  const content = document.getElementById('p-content').value.trim();
  if (!content && !title) return;

  const btn = document.getElementById('save-btn');
  btn.disabled = true;

  const { notes } = await chrome.storage.local.get('notes');
  const existing  = notes ?? [];
  const now = new Date().toISOString();

  existing.unshift({ id: uid(), title, content, created: now, updated: now });
  await chrome.storage.local.set({ notes: existing });

  document.getElementById('p-title').value   = '';
  document.getElementById('p-content').value = '';

  const msg = document.getElementById('status-msg');
  msg.textContent = 'Saved!';
  setTimeout(() => { msg.textContent = ''; }, 2000);

  btn.disabled = false;
  loadCount();
  document.getElementById('p-content').focus();
}

document.getElementById('save-btn').addEventListener('click', saveNote);

document.getElementById('p-content').addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter') saveNote();
});

loadCount();
document.getElementById('p-content').focus();
