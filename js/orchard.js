import {
  netHost,
  netJoin,
  netBroadcast,
  netStop,
  netRoom,
  netRole,
  makeRoomCode,
  inviteUrl,
  MAX_PLAYERS,
} from './net.js';

const W = 800;
const H = 480;
const GROUND = 428;
const ROUND_MS = 60_000;
const MARKET_MS = 2800;
const NAME_KEY = 'gat-orchard-name';
const BASKET_W = 92;
const BASKET_H = 38;

const KINDS = {
  red: { value: 3, chance: 0.58, r: 13, fill: '#e63946', leaf: '#2d6a4f' },
  green: { value: 5, chance: 0.24, r: 13, fill: '#40916c', leaf: '#74c69d' },
  gold: { value: 12, chance: 0.1, r: 12, fill: '#ffd166', leaf: '#2d6a4f' },
  rotten: { value: -2, chance: 0.08, r: 12, fill: '#6b5344', leaf: '#3d2914' },
};

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#9b5de5', '#f4a261'];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const hud = document.getElementById('hud');
const timeLabel = document.getElementById('time-label');
const applesLabel = document.getElementById('apples-label');
const moneyLabel = document.getElementById('money-label');
const boardEl = document.getElementById('board');
const fsBtn = document.getElementById('fullscreen-btn');
const gameContainer = document.getElementById('game-container');

const keys = Object.create(null);
const players = new Map();

let phase = 'menu';
let menu = 'title';
let localId = 'solo';
let localName = loadName();
let localColor = COLORS[0];
let ownPeerId = '';
let lastStamp = 0;
let elapsed = 0;
let spawnAcc = 0;
let scoreBeat = 0;
let marketT = 0;
let pointerX = null;
let pointerDown = false;
let netBusy = false;
let overlayLocked = false;

const me = {
  x: W / 2,
  apples: 0,
  money: 0,
  counts: emptyCounts(),
};

let falling = [];
let pops = [];
let leaves = [];
let coins = [];

function emptyCounts() {
  return { red: 0, green: 0, gold: 0, rotten: 0 };
}

function loadName() {
  try {
    return String(localStorage.getItem(NAME_KEY) || '').slice(0, 12);
  } catch {
    return '';
  }
}

function saveName(name) {
  localName = String(name || '').trim().slice(0, 12);
  try {
    localStorage.setItem(NAME_KEY, localName);
  } catch {
    /* ignore */
  }
  return displayName();
}

function displayName() {
  return localName || 'You';
}

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pickKind() {
  let roll = Math.random();
  for (const [id, kind] of Object.entries(KINDS)) {
    roll -= kind.chance;
    if (roll <= 0) return id;
  }
  return 'red';
}

function valueOf(counts) {
  let sum = 0;
  for (const [id, n] of Object.entries(counts)) sum += (KINDS[id]?.value || 0) * n;
  return sum;
}

function resetRound() {
  me.x = W / 2;
  me.apples = 0;
  me.money = 0;
  me.counts = emptyCounts();
  falling = [];
  pops = [];
  coins = [];
  elapsed = 0;
  spawnAcc = 0;
  marketT = 0;
  scoreBeat = 0;
  for (const p of players.values()) {
    p.apples = 0;
    p.money = 0;
    p.counts = emptyCounts();
    p.sold = false;
  }
}

function upsertPlayer(id, extra = {}) {
  const prev = players.get(id) || {
    id,
    name: extra.name || 'Player',
    color: extra.color || COLORS[players.size % COLORS.length],
    apples: 0,
    money: 0,
    counts: emptyCounts(),
    sold: false,
  };
  Object.assign(prev, extra);
  if (extra.counts) prev.counts = { ...emptyCounts(), ...extra.counts };
  players.set(id, prev);
  return prev;
}

function localRecord() {
  return upsertPlayer(localId, {
    name: displayName(),
    color: localColor,
    apples: me.apples,
    money: me.money,
    counts: { ...me.counts },
  });
}

function rosterList() {
  localRecord();
  return [...players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    apples: p.apples,
    money: p.money,
    counts: { ...p.counts },
    sold: !!p.sold,
  }));
}

function hideOverlay() {
  overlay.classList.add('hidden');
  overlayLocked = false;
}

function showOverlay(html) {
  overlayContent.innerHTML = html;
  overlay.classList.remove('hidden');
}

function bindClicks(map) {
  for (const [id, fn] of Object.entries(map)) {
    overlayContent.querySelector(`#${id}`)?.addEventListener('click', fn);
  }
}

function showTitle(message = '') {
  phase = 'menu';
  menu = 'title';
  hud.classList.add('hidden');
  showOverlay(`
    <h2>Orchard Market</h2>
    <p>Catch falling apples for one minute. Then sell at the market. Most money wins.</p>
    <div class="prices">
      <span>🍎 Red +$3</span>
      <span>🍏 Green +$5</span>
      <span>🌟 Gold +$12</span>
      <span>🤢 Rotten −$2</span>
    </div>
    ${message ? `<p class="error">${esc(message)}</p>` : ''}
    <label for="player-name">Your name</label>
    <input id="player-name" class="name-input" maxlength="12" placeholder="Farmer" value="${esc(localName)}" autocomplete="nickname">
    <div class="actions">
      <button type="button" id="play-solo">Play solo</button>
      <button type="button" id="play-online">Play with friends</button>
    </div>
  `);
  overlayContent.querySelector('#player-name')?.addEventListener('change', (e) => saveName(e.target.value));
  bindClicks({
    'play-solo': () => {
      saveName(overlayContent.querySelector('#player-name')?.value);
      startSolo();
    },
    'play-online': () => {
      saveName(overlayContent.querySelector('#player-name')?.value);
      openMultiplayer();
    },
  });
}

function openMultiplayer(message = '') {
  menu = 'multi';
  showOverlay(`
    <h2>Up to ${MAX_PLAYERS} farmers</h2>
    <p class="muted">Host a room, then send the code. Everyone catches on their own orchard. After one minute you all sell. Richest basket wins.</p>
    ${message ? `<p class="error">${esc(message)}</p>` : ''}
    <div class="actions">
      <button type="button" id="host-room">Host room</button>
    </div>
    <p class="muted">Or join a code</p>
    <input id="join-code" class="code-input" maxlength="6" placeholder="ABC123" autocomplete="off" spellcheck="false">
    <div class="actions">
      <button type="button" id="join-room">Join</button>
      <button type="button" class="ghost" id="back-title">Back</button>
    </div>
  `);
  bindClicks({
    'host-room': () => hostRoom(),
    'join-room': () => joinRoom(overlayContent.querySelector('#join-code')?.value),
    'back-title': () => showTitle(),
  });
  overlayContent.querySelector('#join-code')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      joinRoom(e.target.value);
    }
  });
}

function showConnecting(text) {
  showOverlay(`<h2>Orchard Market</h2><p>${esc(text)}</p>`);
}

function showLobby(status = '') {
  menu = 'lobby';
  phase = 'menu';
  hud.classList.add('hidden');
  localRecord();
  const list = rosterList();
  const code = netRoom();
  const link = code ? inviteUrl(code) : '';
  const host = netRole() === 'host';
  showOverlay(`
    <h2>Room ${esc(code || '------')}</h2>
    <p class="muted">${esc(status || `${list.length}/${MAX_PLAYERS} farmers in the orchard`)}</p>
    <ul class="roster">
      ${list.map((p) => `<li style="border-left-color:${p.color}">${esc(p.name)}${p.id === localId ? ' · you' : ''}${p.id === 'host' ? ' · host' : ''}</li>`).join('')}
    </ul>
    ${link ? `<p class="invite">${esc(link)}</p>` : ''}
    <div class="actions">
      ${host ? '<button type="button" id="start-round">Start harvest</button>' : ''}
      ${link ? '<button type="button" id="copy-invite">Copy invite</button>' : ''}
      <button type="button" class="ghost" id="leave-room">Leave</button>
    </div>
    ${host ? '' : '<p class="muted">Wait for the host to start the minute.</p>'}
  `);
  bindClicks({
    'start-round': () => beginRound(true),
    'copy-invite': async () => {
      try {
        await navigator.clipboard.writeText(link);
        overlayContent.querySelector('#copy-invite').textContent = 'Copied!';
      } catch {
        prompt('Copy this invite link:', link);
      }
    },
    'leave-room': () => leaveRoom(),
  });
}

function showPause() {
  menu = 'pause';
  showOverlay(`
    <h2>Paused</h2>
    <p class="muted">The minute keeps falling for everyone else.</p>
    <div class="actions">
      <button type="button" id="resume-round">Back to basket</button>
      <button type="button" class="ghost" id="quit-round">Quit to title</button>
    </div>
  `);
  bindClicks({
    'resume-round': () => {
      hideOverlay();
      menu = null;
    },
    'quit-round': () => leaveRoom(),
  });
}

function showResults() {
  phase = 'results';
  menu = 'results';
  hud.classList.remove('hidden');
  const ranked = rosterList().sort((a, b) => b.money - a.money || b.apples - a.apples);
  const top = ranked[0];
  const tied = ranked.filter((p) => p.money === top?.money);
  const winLine = !top
    ? 'No sale today.'
    : tied.length > 1
      ? `Tie at $${top.money}!`
      : `${top.name} wins the market with $${top.money}!`;
  const host = netRole() === 'host' || !netRoom();
  showOverlay(`
    <h2>Market closed</h2>
    <p>${esc(winLine)}</p>
    <ol class="rank">
      ${ranked.map((p, i) => `
        <li class="${i === 0 ? 'win' : ''}">
          <span class="who">${i + 1}. ${esc(p.name)}</span>
          · $${p.money} · ${p.apples} apples
        </li>
      `).join('')}
    </ol>
    <div class="actions">
      ${host ? '<button type="button" id="again-round">Play again</button>' : ''}
      <button type="button" class="ghost" id="quit-round">${netRoom() ? 'Leave room' : 'Title'}</button>
    </div>
    ${host ? '' : '<p class="muted">Host can start another harvest.</p>'}
  `);
  bindClicks({
    'again-round': () => beginRound(true),
    'quit-round': () => leaveRoom(),
  });
  updateHud();
}

function startSolo() {
  netStop();
  players.clear();
  localId = 'solo';
  localColor = COLORS[0];
  upsertPlayer(localId, { name: displayName(), color: localColor });
  beginRound(false);
}

function beginRound(broadcast) {
  resetRound();
  localRecord();
  phase = 'catch';
  menu = null;
  hideOverlay();
  hud.classList.remove('hidden');
  updateHud();
  if (broadcast && netRole() === 'host') {
    netBroadcast({ t: 'start' });
  }
}

function goToMarket() {
  if (phase !== 'catch') return;
  me.money = valueOf(me.counts);
  localRecord();
  const self = players.get(localId);
  if (self) self.sold = true;
  phase = 'market';
  marketT = 0;
  coins = [];
  for (let i = 0; i < Math.min(18, Math.max(4, me.apples)); i++) {
    coins.push({
      x: 220 + Math.random() * 80,
      y: 300 + Math.random() * 40,
      vx: 1.2 + Math.random() * 1.4,
      vy: -2.2 - Math.random() * 2,
      t: i * 0.05,
    });
  }
  if (netRoom()) {
    netBroadcast({
      t: 'sold',
      apples: me.apples,
      money: me.money,
      counts: { ...me.counts },
    });
  }
}

function maybeFinishMarket() {
  if (phase !== 'market' && phase !== 'results') return;
  if (netRole() === 'host' && netRoom()) {
    netBroadcast({ t: 'results', players: rosterList() });
  }
  if (phase !== 'results') showResults();
}

function applySold(msg) {
  const id = !msg?.id || msg.id === 'host' ? 'host' : msg.id;
  upsertPlayer(id, {
    apples: msg.apples || 0,
    money: msg.money || 0,
    counts: msg.counts,
    sold: true,
  });
}

function wireNet() {
  return {
    onMessage: handleNet,
    onJoin: (id) => {
      upsertPlayer(id, { name: 'Farmer', color: COLORS[players.size % COLORS.length] });
      if (netRole() === 'host') {
        netBroadcast({ t: 'hello', name: displayName(), color: localColor, apples: me.apples, money: me.money });
        netBroadcast({ t: 'roster', players: rosterList() });
        if (menu === 'lobby') showLobby();
      }
    },
    onLeave: (id) => {
      if (id === 'host') return;
      players.delete(id);
      if (menu === 'lobby') showLobby('A farmer left.');
      updateHud();
    },
    onHostGone: () => leaveRoom('The host left the orchard.'),
  };
}

function handleNet(msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'welcome' && msg.id) {
    ownPeerId = msg.id;
    localId = msg.id;
    localColor = COLORS[(players.size + 1) % COLORS.length];
    upsertPlayer(localId, { name: displayName(), color: localColor });
    netBroadcast({ t: 'hello', name: displayName(), color: localColor });
  }
  if (msg.t === 'hello') {
    const id = msg.id === 'host' || !msg.id ? 'host' : msg.id;
    upsertPlayer(id, { name: msg.name || 'Farmer', color: msg.color, apples: msg.apples, money: msg.money });
    if (netRole() === 'host') {
      netBroadcast({ t: 'roster', players: rosterList() });
      if (menu === 'lobby') showLobby();
    }
  }
  if (msg.t === 'roster' && Array.isArray(msg.players)) {
    for (const p of msg.players) {
      if (!p?.id) continue;
      upsertPlayer(p.id, p);
    }
    const self = players.get(localId);
    if (self?.color) localColor = self.color;
    if (menu === 'lobby') showLobby();
    updateHud();
  }
  if (msg.t === 'start' && phase !== 'catch') {
    beginRound(false);
  }
  if (msg.t === 'score') {
    const id = msg.id === 'host' || !msg.id ? 'host' : msg.id;
    if (id === localId) return;
    upsertPlayer(id, { apples: msg.apples, money: msg.money, name: msg.name, color: msg.color });
    updateHud();
  }
  if (msg.t === 'sold') {
    applySold(msg);
    if (phase === 'market' && marketT >= MARKET_MS) maybeFinishMarket();
  }
  if (msg.t === 'results' && Array.isArray(msg.players)) {
    for (const p of msg.players) {
      if (!p?.id) continue;
      upsertPlayer(p.id, { ...p, sold: true });
    }
    if (phase !== 'results') showResults();
  }
}

async function hostRoom(preset) {
  if (netBusy) return;
  netBusy = true;
  const code = String(preset || pendingHostCode || makeRoomCode()).toUpperCase();
  showConnecting('Opening the orchard…');
  try {
    players.clear();
    localId = 'host';
    localColor = COLORS[0];
    upsertPlayer(localId, { name: displayName(), color: localColor });
    await netHost(code, wireNet());
    showLobby();
  } catch (err) {
    openMultiplayer(err?.message || 'Could not host.');
  }
  netBusy = false;
}

async function joinRoom(raw) {
  const code = String(raw || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (code.length !== 6) {
    openMultiplayer('Enter a 6-character room code.');
    return;
  }
  if (netBusy) return;
  netBusy = true;
  showConnecting(`Joining ${code}…`);
  try {
    players.clear();
    await netJoin(code, wireNet());
    if (!ownPeerId) localId = 'guest';
    upsertPlayer(localId, { name: displayName(), color: localColor });
    netBroadcast({ t: 'hello', name: displayName(), color: localColor });
    showLobby('Connected! Waiting for the harvest.');
  } catch (err) {
    localId = 'solo';
    openMultiplayer(err?.message || 'Could not join.');
  }
  netBusy = false;
}

function leaveRoom(message = '') {
  netStop();
  players.clear();
  falling = [];
  pops = [];
  coins = [];
  phase = 'menu';
  ownPeerId = '';
  localId = 'solo';
  hud.classList.add('hidden');
  if (message) openMultiplayer(message);
  else showTitle();
}

function spawnApple() {
  const kind = pickKind();
  falling.push({
    kind,
    x: 40 + Math.random() * (W - 80),
    y: -20 - Math.random() * 40,
    vy: 90 + Math.random() * 40 + elapsed * 0.012,
    spin: Math.random() * Math.PI * 2,
    wobble: Math.random() * Math.PI * 2,
  });
}

function catchApple(apple) {
  const kind = KINDS[apple.kind];
  me.counts[apple.kind] += 1;
  if (apple.kind !== 'rotten') me.apples += 1;
  me.money = valueOf(me.counts);
  localRecord();
  pops.push({
    x: apple.x,
    y: apple.y,
    t: 0,
    text: `${kind.value >= 0 ? '+' : ''}$${kind.value}`,
    color: kind.value >= 0 ? '#8eed8e' : '#ff8fa3',
  });
  for (let i = 0; i < 6; i++) {
    leaves.push({
      x: apple.x,
      y: apple.y,
      vx: (Math.random() - 0.5) * 80,
      vy: -40 - Math.random() * 50,
      t: 0,
      c: kind.fill,
    });
  }
}

function basketBox() {
  return {
    x: me.x - BASKET_W / 2,
    y: GROUND - 8,
    w: BASKET_W,
    h: BASKET_H,
  };
}

function isRunning() {
  return !!(keys.ShiftLeft || (keys.Shift && !keys.ShiftRight));
}

function updateCatch(dt) {
  const speed = isRunning() ? 620 : 340;
  let dir = 0;
  if (keys.ArrowLeft || keys.a || keys.A) dir -= 1;
  if (keys.ArrowRight || keys.d || keys.D) dir += 1;
  if (dir) me.x += dir * speed * dt;
  if (pointerDown && pointerX != null) {
    const target = pointerX;
    const diff = target - me.x;
    me.x += Math.max(-speed * dt, Math.min(speed * dt, diff));
  }
  me.x = Math.max(BASKET_W / 2 + 8, Math.min(W - BASKET_W / 2 - 8, me.x));

  elapsed += dt * 1000;
  const remain = Math.max(0, ROUND_MS - elapsed);
  const rate = 0.55 + Math.min(1.1, elapsed / ROUND_MS);
  spawnAcc += dt * rate;
  while (spawnAcc >= 0.42) {
    spawnAcc -= 0.42;
    spawnApple();
  }

  const box = basketBox();
  for (let i = falling.length - 1; i >= 0; i--) {
    const a = falling[i];
    a.vy += 220 * dt;
    a.y += a.vy * dt;
    a.wobble += dt * 3;
    a.x += Math.sin(a.wobble) * 18 * dt;
    a.spin += dt * 2;
    const r = KINDS[a.kind].r;
    const hit =
      a.x + r > box.x &&
      a.x - r < box.x + box.w &&
      a.y + r > box.y + 6 &&
      a.y - r < box.y + box.h &&
      a.vy > 0;
    if (hit) {
      catchApple(a);
      falling.splice(i, 1);
    } else if (a.y > H + 30) {
      falling.splice(i, 1);
    }
  }

  if (remain <= 0) goToMarket();

  scoreBeat += dt;
  if (scoreBeat > 0.28 && netRoom()) {
    scoreBeat = 0;
    netBroadcast({
      t: 'score',
      name: displayName(),
      color: localColor,
      apples: me.apples,
      money: me.money,
    });
  }
}

function updateMarket(dt) {
  marketT += dt * 1000;
  for (const c of coins) {
    c.t -= dt;
    if (c.t > 0) continue;
    c.x += c.vx * 60 * dt;
    c.y += c.vy * 60 * dt;
    c.vy += 8 * dt;
  }
  if (marketT >= MARKET_MS) maybeFinishMarket();
}

function updateFx(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    pops[i].t += dt;
    pops[i].y -= 28 * dt;
    if (pops[i].t > 0.7) pops.splice(i, 1);
  }
  for (let i = leaves.length - 1; i >= 0; i--) {
    const L = leaves[i];
    L.t += dt;
    L.x += L.vx * dt;
    L.y += L.vy * dt;
    L.vy += 180 * dt;
    if (L.t > 0.55) leaves.splice(i, 1);
  }
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#7ec8e3');
  g.addColorStop(0.55, '#b8e0c8');
  g.addColorStop(1, '#6a9f58');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#f6e27a';
  ctx.beginPath();
  ctx.arc(700, 70, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5c8a46';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.quadraticCurveTo(160, 300, 320, 350);
  ctx.quadraticCurveTo(480, 400, 800, 330);
  ctx.lineTo(800, H);
  ctx.lineTo(0, H);
  ctx.fill();

  ctx.fillStyle = '#4f7a3c';
  ctx.fillRect(0, GROUND + 18, W, H - GROUND - 18);
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(0, GROUND + 34, W, 8);
}

function drawTree(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#5c3d2e';
  ctx.fillRect(-10, 40, 20, 90);
  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.arc(0, 20, 48, 0, Math.PI * 2);
  ctx.arc(-34, 40, 28, 0, Math.PI * 2);
  ctx.arc(34, 38, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  for (const [ax, ay] of [[-18, 18], [14, 8], [6, 36], [-28, 44], [28, 28]]) {
    ctx.beginPath();
    ctx.arc(ax, ay, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawApple(apple) {
  const kind = KINDS[apple.kind];
  ctx.save();
  ctx.translate(apple.x, apple.y);
  ctx.rotate(apple.spin * 0.15);
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(-1, -kind.r - 6, 2, 7);
  ctx.fillStyle = kind.leaf;
  ctx.beginPath();
  ctx.ellipse(6, -kind.r - 2, 6, 3, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = kind.fill;
  ctx.beginPath();
  ctx.arc(0, 0, kind.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.ellipse(-4, -3, 3.5, 2.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  if (apple.kind === 'rotten') {
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    ctx.arc(3, 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBasket() {
  const box = basketBox();
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.fillStyle = localColor;
  ctx.beginPath();
  ctx.moveTo(-box.w / 2 - 4, -10);
  ctx.lineTo(box.w / 2 + 4, -10);
  ctx.lineTo(box.w / 2 - 8, box.h / 2);
  ctx.lineTo(-box.w / 2 + 8, box.h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3d2914';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(61,41,20,0.45)';
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10, -8);
    ctx.lineTo(i * 8, box.h / 2 - 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#3d2914';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, -18, 28, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
}

function drawStall() {
  ctx.fillStyle = '#8d5a2b';
  ctx.fillRect(300, 220, 280, 140);
  ctx.fillStyle = '#c41e3a';
  ctx.beginPath();
  ctx.moveTo(280, 220);
  ctx.lineTo(440, 150);
  ctx.lineTo(600, 220);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e9c46a';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('MARKET', 440, 205);
  ctx.fillStyle = '#fff8ef';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('Selling your haul…', 440, 250);
  ctx.fillText(`$${me.money}`, 440, 278);
}

function drawFx() {
  for (const p of pops) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / 0.7);
    ctx.fillStyle = p.color;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
  for (const L of leaves) {
    ctx.fillStyle = L.c;
    ctx.globalAlpha = Math.max(0, 1 - L.t / 0.55);
    ctx.fillRect(L.x, L.y, 4, 4);
    ctx.globalAlpha = 1;
  }
  for (const c of coins) {
    if (c.t > 0) continue;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  drawSky();
  drawTree(70, 250, 1.1);
  drawTree(730, 240, 1);
  drawTree(160, 300, 0.7);
  if (phase === 'market' || phase === 'results') {
    drawStall();
    drawBasket();
  } else {
    for (const a of falling) drawApple(a);
    drawBasket();
  }
  drawFx();
  if (phase === 'menu') {
    ctx.fillStyle = 'rgba(20,8,12,0.18)';
    ctx.fillRect(0, 0, W, H);
  }
}

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function updateHud() {
  const remain = phase === 'catch' ? Math.max(0, ROUND_MS - elapsed) : 0;
  timeLabel.textContent = phase === 'catch' ? formatTime(remain) : phase === 'market' ? 'SELL' : 'DONE';
  applesLabel.textContent = `🍎 ${me.apples}`;
  moneyLabel.textContent = `$${me.money}`;
  const others = rosterList().filter((p) => p.id !== localId);
  boardEl.innerHTML = others.map((p) => (
    `<span class="board-chip" style="border-color:${p.color}">${esc(p.name)} · $${p.money}</span>`
  )).join('');
}

function loop(stamp) {
  const dt = Math.min(0.033, (stamp - lastStamp) / 1000 || 0.016);
  lastStamp = stamp;
  if (phase === 'catch' && menu !== 'pause') updateCatch(dt);
  if (phase === 'market') updateMarket(dt);
  updateFx(dt);
  draw();
  if (phase === 'catch' || phase === 'market') updateHud();
  requestAnimationFrame(loop);
}

function canvasPos(event) {
  const rect = canvas.getBoundingClientRect();
  return ((event.clientX - rect.left) / rect.width) * W;
}

canvas.addEventListener('pointerdown', (event) => {
  pointerDown = true;
  pointerX = canvasPos(event);
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointerDown) return;
  pointerX = canvasPos(event);
});
window.addEventListener('pointerup', () => {
  pointerDown = false;
});

window.addEventListener('keydown', (event) => {
  keys[event.key] = true;
  keys[event.code] = true;
  if (['ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  if (event.key === 'Escape') {
    if (phase === 'catch' && menu !== 'pause') showPause();
    else if (menu === 'pause') {
      hideOverlay();
      menu = null;
    }
  }
});
window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
  keys[event.code] = false;
});
window.addEventListener('blur', () => {
  for (const k of Object.keys(keys)) keys[k] = false;
  pointerDown = false;
});

function isFullscreen() {
  return document.fullscreenElement === gameContainer
    || document.webkitFullscreenElement === gameContainer;
}

function syncFullscreenBtn() {
  const on = isFullscreen();
  fsBtn.textContent = on ? '×' : '⛶';
  fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
  fsBtn.title = on ? 'Exit full screen' : 'Full screen';
}

fsBtn.addEventListener('click', async () => {
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else document.webkitExitFullscreen?.();
    } else if (gameContainer.requestFullscreen) {
      await gameContainer.requestFullscreen();
    } else {
      gameContainer.webkitRequestFullscreen?.();
    }
  } catch {
    /* ignore */
  }
});
document.addEventListener('fullscreenchange', syncFullscreenBtn);
document.addEventListener('webkitfullscreenchange', syncFullscreenBtn);

const params = new URLSearchParams(location.search);
const playCode = (params.get('play') || '').trim().toUpperCase();
const pendingHostCode = (params.get('room') || '').trim().toUpperCase();

if (playCode.length === 6) {
  showTitle();
  joinRoom(playCode);
} else {
  showTitle();
}

requestAnimationFrame(loop);
