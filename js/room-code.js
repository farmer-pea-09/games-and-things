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
    <main class="room-gate">
      <p class="room-gate-kicker">Games and Things</p>
      <h1>Join a friend</h1>
      <p class="room-gate-msg">Type the 6-letter room code they sent you.</p>
      <form id="gate-join" class="room-gate-form">
        <input id="gate-code" type="text" maxlength="6" placeholder="ABC123" autocomplete="off" spellcheck="false" aria-label="Room code">
        <button type="submit">Log in</button>
      </form>
      <p class="room-gate-hint">${reason}</p>
      <a class="room-gate-link" href="index.html">← Back to games</a>
    </main>
  `;
  const form = document.getElementById('gate-join');
  const input = document.getElementById('gate-code');
  input?.focus();
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = String(input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code.length !== 6) {
      input?.focus();
      return;
    }
    const url = new URL(location.href);
    url.searchParams.delete('room');
    url.searchParams.set('play', code);
    location.href = url.toString();
  });
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

function isLocalOrLanHost() {
  const host = location.hostname;
  if (host === '127.0.0.1' || host === 'localhost' || host === '[::1]') return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return true;
  return false;
}

export function gateGame(gameId) {
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
