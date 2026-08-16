const PREFIX = 'gatch-';
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
export const MAX_PLAYERS = 3;

let PeerCtor = null;
let peer = null;
let hostConn = null;
const guests = new Map();
let role = null;
let roomCode = '';
let handlers = {};

function loadPeer() {
  if (PeerCtor) return Promise.resolve(PeerCtor);
  if (window.Peer) {
    PeerCtor = window.Peer;
    return Promise.resolve(PeerCtor);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PEER_SRC;
    script.async = true;
    script.onload = () => {
      PeerCtor = window.Peer;
      if (PeerCtor) resolve(PeerCtor);
      else reject(new Error('Multiplayer failed to load'));
    };
    script.onerror = () => reject(new Error('Could not load multiplayer'));
    document.head.appendChild(script);
  });
}

function send(conn, message) {
  if (conn?.open) conn.send(message);
}

function attachGuest(conn) {
  const id = conn.peer;
  if (guests.size + 1 >= MAX_PLAYERS) {
    const reject = () => {
      send(conn, { t: 'full' });
      setTimeout(() => conn.close(), 100);
    };
    if (conn.open) reject();
    else conn.on('open', reject);
    return;
  }

  let welcomed = false;
  guests.set(id, conn);
  conn.on('data', (message) => {
    if (message && typeof message === 'object') handlers.onMessage?.({ ...message, id });
  });
  conn.on('close', () => {
    guests.delete(id);
    if (welcomed) handlers.onLeave?.(id);
  });
  conn.on('error', () => {
    guests.delete(id);
    if (welcomed) handlers.onLeave?.(id);
  });

  const welcome = () => {
    if (welcomed || role !== 'host') return;
    welcomed = true;
    send(conn, { t: 'welcome', id });
    handlers.onJoin?.(id);
  };
  if (conn.open) welcome();
  else conn.on('open', welcome);
}

export function netBroadcast(message) {
  if (role === 'host') {
    for (const conn of guests.values()) send(conn, message);
  } else if (role === 'guest') {
    send(hostConn, message);
  }
}

export function netStop() {
  try { hostConn?.close(); } catch { /* already closed */ }
  for (const conn of guests.values()) {
    try { conn.close(); } catch { /* already closed */ }
  }
  guests.clear();
  hostConn = null;
  try { peer?.destroy(); } catch { /* already closed */ }
  peer = null;
  role = null;
  roomCode = '';
}

export async function netHost(code, nextHandlers = {}) {
  netStop();
  handlers = nextHandlers;
  role = 'host';
  roomCode = code;
  await loadPeer();
  return new Promise((resolve, reject) => {
    peer = new PeerCtor(PREFIX + code);
    const timer = setTimeout(() => reject(new Error('Hosting timed out')), 12000);
    peer.on('open', () => {
      clearTimeout(timer);
      peer.on('connection', attachGuest);
      resolve(code);
    });
    peer.on('error', (error) => {
      clearTimeout(timer);
      netStop();
      reject(error);
    });
  });
}

export async function netJoin(code, nextHandlers = {}) {
  netStop();
  handlers = nextHandlers;
  role = 'guest';
  roomCode = code;
  await loadPeer();
  return new Promise((resolve, reject) => {
    peer = new PeerCtor();
    let joined = false;
    const timer = setTimeout(() => reject(new Error('Join timed out')), 12000);
    const fail = (error) => {
      if (joined) return;
      clearTimeout(timer);
      netStop();
      reject(error instanceof Error ? error : new Error('Could not join room'));
    };
    peer.on('error', fail);
    peer.on('open', () => {
      hostConn = peer.connect(PREFIX + code, { reliable: true });
      hostConn.on('data', (message) => {
        if (!message || typeof message !== 'object') return;
        if (message.t === 'full') {
          fail(new Error('That room already has 3 players.'));
          return;
        }
        if (!joined && message.t === 'welcome') {
          joined = true;
          clearTimeout(timer);
          resolve(code);
        }
        handlers.onMessage?.(message);
      });
      hostConn.on('close', () => {
        if (!joined) fail(new Error('Could not join room'));
        else handlers.onHostGone?.();
      });
      hostConn.on('error', fail);
    });
  });
}

export function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function inviteUrl(code) {
  const url = new URL(location.href);
  url.searchParams.delete('room');
  url.searchParams.set('play', code);
  return url.toString();
}
