const PREFIX = 'gatps-';
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

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
    const s = document.createElement('script');
    s.src = PEER_SRC;
    s.async = true;
    s.onload = () => {
      PeerCtor = window.Peer;
      if (!PeerCtor) reject(new Error('PeerJS failed to load'));
      else resolve(PeerCtor);
    };
    s.onerror = () => reject(new Error('Could not load multiplayer library'));
    document.head.appendChild(s);
  });
}

function send(conn, msg) {
  if (conn && conn.open) conn.send(msg);
}

function hostRelay(fromId, msg) {
  for (const [id, conn] of guests) {
    if (id !== fromId) send(conn, msg);
  }
}

function attachGuest(conn) {
  const id = conn.peer;
  guests.set(id, conn);
  conn.on('data', (msg) => {
    if (!msg || typeof msg !== 'object') return;
    const packed = { ...msg, id };
    handlers.onMessage?.(packed);
    hostRelay(id, packed);
  });
  conn.on('close', () => {
    guests.delete(id);
    handlers.onLeave?.(id);
    hostRelay(id, { t: 'leave', id });
  });
  conn.on('error', () => {
    guests.delete(id);
    handlers.onLeave?.(id);
  });
  send(conn, { t: 'welcome', id, host: true });
  handlers.onJoin?.(id);
}

export function netRoom() {
  return roomCode;
}

export function netRole() {
  return role;
}

export function netCount() {
  if (role === 'host') return guests.size + 1;
  if (role === 'guest') return 1 + (handlers.sizeHint || 0);
  return 1;
}

export function netBroadcast(msg) {
  if (role === 'host') {
    const packed = { ...msg, id: 'host' };
    for (const conn of guests.values()) send(conn, packed);
  } else if (role === 'guest') {
    send(hostConn, msg);
  }
}

export function netStop() {
  try { hostConn?.close(); } catch { /* ignore */ }
  for (const conn of guests.values()) {
    try { conn.close(); } catch { /* ignore */ }
  }
  guests.clear();
  hostConn = null;
  try { peer?.destroy(); } catch { /* ignore */ }
  peer = null;
  role = null;
  roomCode = '';
}

export async function netHost(code, nextHandlers) {
  netStop();
  handlers = nextHandlers || {};
  roomCode = code;
  role = 'host';
  await loadPeer();
  return new Promise((resolve, reject) => {
    peer = new PeerCtor(PREFIX + code);
    let opened = false;
    const fail = (err) => {
      if (opened) return;
      netStop();
      reject(err || new Error('Could not host room'));
    };
    const timer = setTimeout(() => fail(new Error('Hosting timed out')), 12000);
    peer.on('open', () => {
      opened = true;
      clearTimeout(timer);
      resolve(code);
    });
    peer.on('connection', attachGuest);
    peer.on('error', fail);
  });
}

export async function netJoin(code, nextHandlers) {
  netStop();
  handlers = nextHandlers || {};
  roomCode = code;
  role = 'guest';
  await loadPeer();
  return new Promise((resolve, reject) => {
    peer = new PeerCtor();
    let opened = false;
    const fail = (err) => {
      if (opened) return;
      netStop();
      reject(err || new Error('Could not join room'));
    };
    const timer = setTimeout(() => fail(new Error('Join timed out')), 12000);
    peer.on('error', fail);
    peer.on('open', () => {
      hostConn = peer.connect(PREFIX + code, { reliable: true });
      hostConn.on('open', () => {
        opened = true;
        clearTimeout(timer);
        resolve(code);
      });
      hostConn.on('data', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        handlers.onMessage?.(msg);
      });
      hostConn.on('close', () => {
        handlers.onLeave?.('host');
        handlers.onHostGone?.();
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
