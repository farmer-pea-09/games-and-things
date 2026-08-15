const USED_KEY = 'gat-used-room-codes';
const PENDING_PREFIX = 'gat-pending-room-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function getUsedCodes() {
  try {
    return JSON.parse(localStorage.getItem(USED_KEY) || '[]');
  } catch {
    return [];
  }
}

function markCodeUsed(code) {
  const used = getUsedCodes();
  if (!used.includes(code)) {
    used.push(code);
    localStorage.setItem(USED_KEY, JSON.stringify(used.slice(-5000)));
  }
}

export function issueRoomCode(gameId) {
  const code = generateRoomCode();
  sessionStorage.setItem(
    `${PENDING_PREFIX}${code}`,
    JSON.stringify({ game: gameId, issuedAt: Date.now() })
  );
  return code;
}

export function consumeRoomCode(code, expectedGameId) {
  if (!code || code.length !== 6) {
    return { ok: false, reason: 'No room code in this link.' };
  }

  if (getUsedCodes().includes(code)) {
    return { ok: false, reason: 'This room code was already used and destroyed.' };
  }

  const raw = sessionStorage.getItem(`${PENDING_PREFIX}${code}`);
  if (!raw) {
    return { ok: false, reason: 'Invalid or expired room code.' };
  }

  let pending;
  try {
    pending = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'Corrupted room code.' };
  }

  if (pending.game !== expectedGameId) {
    return { ok: false, reason: 'This room code is for a different game.' };
  }

  sessionStorage.removeItem(`${PENDING_PREFIX}${code}`);
  markCodeUsed(code);

  return { ok: true, code };
}

export function showRoomGateFailure(reason) {
  document.body.innerHTML = `
    <main class="room-gate room-gate--fail">
      <p class="room-gate-kicker">Games and Things</p>
      <h1>Room closed</h1>
      <p class="room-gate-msg">${reason}</p>
      <p class="room-gate-hint">Each room code works once, then it is gone forever.</p>
      <a class="room-gate-link" href="index.html">← Back to games</a>
    </main>
  `;
}

export function mountRoomBadge(code) {
  const badge = document.createElement('div');
  badge.id = 'room-badge';
  badge.className = 'room-badge';
  badge.innerHTML = `
    <span class="room-badge-label">Room</span>
    <span class="room-badge-code">${code}</span>
    <span class="room-badge-note">Used once · now destroyed</span>
  `;
  document.body.appendChild(badge);

  if (location.search.includes('room=')) {
    history.replaceState({}, '', location.pathname);
  }
}

export function gateGame(gameId) {
  const local = location.hostname === '127.0.0.1'
    || location.hostname === 'localhost'
    || location.hostname === '[::1]';
  if (local) return true;

  const params = new URLSearchParams(window.location.search);
  const result = consumeRoomCode(params.get('room')?.toUpperCase(), gameId);

  if (!result.ok) {
    showRoomGateFailure(result.reason);
    return false;
  }

  mountRoomBadge(result.code);
  return true;
}

export function bindHubCards() {
  document.querySelectorAll('[data-game]').forEach((card) => {
    card.addEventListener('click', (event) => {
      event.preventDefault();
      const gameId = card.dataset.game;
      const href = card.getAttribute('href');
      const code = issueRoomCode(gameId);
      window.location.href = `${href}?room=${code}`;
    });
  });
}
