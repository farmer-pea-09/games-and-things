import { bindHubCards } from './room-code.js';

bindHubCards();

document.getElementById('hub-join-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const code = String(document.getElementById('hub-code')?.value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  if (code.length !== 6) {
    document.getElementById('hub-code')?.focus();
    return;
  }
  const href = document.getElementById('hub-game')?.value || 'life.html';
  window.location.href = `${href}?play=${encodeURIComponent(code)}`;
});
