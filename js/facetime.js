const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d');
const gate = document.getElementById('gate');
const statusChip = document.getElementById('status');
const scoreboard = document.getElementById('scoreboard');
const callStatus = document.getElementById('call-status');
const tray = document.getElementById('fx-tray');
const effectsBtn = document.getElementById('effects-btn');
const hangupBtn = document.getElementById('hangup-btn');
const standin = document.getElementById('standin');

const FILTERS = [
  { id: 'dog', emoji: '🐶', name: 'Dog' },
  { id: 'bunny', emoji: '🐰', name: 'Bunny' },
  { id: 'crown', emoji: '👑', name: 'Crown' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow' },
];
const REACTIONS = [
  { id: 'hearts', emoji: '❤️', name: 'Hearts' },
  { id: 'balloons', emoji: '🎈', name: 'Balloons' },
  { id: 'fireworks', emoji: '🎆', name: 'Fireworks' },
  { id: 'lasers', emoji: '💚', name: 'Lasers' },
  { id: 'confetti', emoji: '🎊', name: 'Confetti' },
  { id: 'rain', emoji: '🌧️', name: 'Rain' },
];
const STICKERS = [
  { id: 'taco', emoji: '🌮', name: 'Taco' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza' },
  { id: 'poop', emoji: '💩', name: 'Poop' },
  { id: 'ghost', emoji: '👻', name: 'Ghost' },
  { id: 'banana', emoji: '🍌', name: 'Banana' },
];
const GAMES = [
  { id: 'hoops', emoji: '🏀', name: 'Hoops' },
  { id: 'eightball', emoji: '🎱', name: '8 Ball' },
  { id: 'pong', emoji: '🥤', name: 'Cup Pong' },
];

const particles = [];
const notes = [];
const scratches = [];
const stickers = [];
let running = false;
let face = null;
let smooth = null;
let spaceHeld = false;
let mouthHeld = false;
let lastTs = 0;
let scratchT = 0;
let noteTimer = 0;
let audio = null;
let filterId = 'crown';
let gameId = null;
let game = null;
let filterOff = { x: 0, y: 0 };
let canvasDrag = null;

function fillRow(el, items, kind) {
  el.innerHTML = items
    .map((item) => `<button class="fx-chip" type="button" data-kind="${kind}" data-id="${item.id}" title="${item.name}">${item.emoji}</button>`)
    .join('');
}

function fillGate() {
  const all = [
    ...FILTERS.map((i) => ({ ...i, kind: 'filter' })),
    ...REACTIONS.map((i) => ({ ...i, kind: 'react' })),
    ...STICKERS.map((i) => ({ ...i, kind: 'sticker' })),
    ...GAMES.map((i) => ({ ...i, kind: 'game' })),
  ];
  document.getElementById('gate-grid').innerHTML = all
    .map((item) => `<button class="gate-chip" type="button" data-kind="${item.kind}" data-id="${item.id}"><span>${item.emoji}</span><small>${item.name}</small></button>`)
    .join('');
}

fillRow(document.getElementById('filters-row'), FILTERS, 'filter');
fillRow(document.getElementById('react-row'), REACTIONS, 'react');
fillRow(document.getElementById('sticker-row'), STICKERS, 'sticker');
fillRow(document.getElementById('games-row'), GAMES, 'game');
fillGate();

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function setStatus(text) {
  statusChip.textContent = text;
  statusChip.classList.remove('hidden');
}

function markChips() {
  document.querySelectorAll('.fx-chip[data-kind="filter"]').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.id === filterId);
  });
  document.querySelectorAll('.fx-chip[data-kind="game"]').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.id === gameId);
  });
}

function standinDest() {
  const iw = standin.naturalWidth || 9;
  const ih = standin.naturalHeight || 16;
  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  return { ox: (cw - dw) / 2, oy: dh > ch ? 0 : (ch - dh) / 2, dw, dh };
}

function fallbackFace() {
  const { ox, oy, dw, dh } = standinDest();
  return {
    open: spaceHeld || mouthHeld,
    headX: ox + dw * 0.5,
    headY: oy + dh * 0.22,
    noseX: ox + dw * 0.5,
    noseY: oy + dh * 0.38,
    faceH: dh * 0.32,
    faceW: dw * 0.36,
    mouthX: ox + dw * 0.5,
    mouthY: oy + dh * 0.445,
    cheekLX: ox + dw * 0.34,
    cheekLY: oy + dh * 0.4,
    cheekRX: ox + dw * 0.66,
    cheekRY: oy + dh * 0.4,
  };
}

function lerpFace(next) {
  if (!smooth) {
    smooth = { ...next };
    return smooth;
  }
  for (const key of Object.keys(next)) {
    if (typeof next[key] === 'number') smooth[key] += (next[key] - smooth[key]) * 0.38;
    else smooth[key] = next[key];
  }
  smooth.open = next.open;
  return smooth;
}

function drawStandinPhoto() {
  if (!standin.complete || !standin.naturalWidth) return;
  const d = standinDest();
  ctx.drawImage(standin, d.ox, d.oy, d.dw, d.dh);
}

function drawStandinMouth(f, open) {
  if (!open) return;
  const w = Math.max(16, f.faceW * 0.2);
  ctx.save();
  ctx.translate(f.mouthX, f.mouthY + 6);
  ctx.fillStyle = '#3b1218';
  ctx.beginPath();
  ctx.ellipse(0, 4, w, w * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff5f5';
  ctx.beginPath();
  ctx.ellipse(0, -6, w * 0.72, w * 0.2, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e56b8c';
  ctx.beginPath();
  ctx.ellipse(0, 12, w * 0.42, w * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function ensureAudio() {
  if (!audio) audio = new AudioContext();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function pingNote() {
  const ac = ensureAudio();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'triangle';
  o.frequency.value = [523, 587, 659, 784, 880][Math.floor(Math.random() * 5)];
  g.gain.value = 0.045;
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
  o.connect(g).connect(ac.destination);
  o.start();
  o.stop(ac.currentTime + 0.3);
}

function spawnNote(x, y) {
  notes.push({
    x, y,
    vx: (Math.random() - 0.5) * 50,
    vy: -90 - Math.random() * 80,
    life: 1,
    kind: ['♪', '♫', '♬'][Math.floor(Math.random() * 3)],
    rot: (Math.random() - 0.5) * 0.8,
    size: 26 + Math.random() * 20,
    hue: 30 + Math.random() * 300,
  });
}

function spawnScratch(f) {
  const left = Math.random() < 0.5;
  scratches.push({
    x: left ? f.cheekLX : f.cheekRX,
    y: (left ? f.cheekLY : f.cheekRY) + (Math.random() - 0.5) * 28,
    life: 1,
    dir: left ? -1 : 1,
  });
}

function addParticle(p) {
  particles.push(p);
}

function burstHearts() {
  for (let i = 0; i < 18; i++) {
    addParticle({
      type: 'heart',
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * (0.55 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 40,
      vy: -80 - Math.random() * 120,
      life: 1.2 + Math.random(),
      s: 14 + Math.random() * 18,
    });
  }
}

function burstBalloons() {
  const colors = ['#ff4d6d', '#4cc9f0', '#ffd166', '#80ed99', '#c77dff'];
  for (let i = 0; i < 10; i++) {
    addParticle({
      type: 'balloon',
      x: canvas.width * (0.15 + Math.random() * 0.7),
      y: canvas.height * 0.92,
      vx: (Math.random() - 0.5) * 30,
      vy: -60 - Math.random() * 50,
      life: 3,
      s: 18 + Math.random() * 16,
      color: colors[i % colors.length],
    });
  }
}

function burstFireworks() {
  for (let k = 0; k < 3; k++) {
    const cx = canvas.width * (0.25 + Math.random() * 0.5);
    const cy = canvas.height * (0.18 + Math.random() * 0.25);
    const hue = Math.random() * 360;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const sp = 80 + Math.random() * 140;
      addParticle({ type: 'spark', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9, hue, s: 3 + Math.random() * 3 });
    }
  }
}

function burstLasers() {
  for (let i = 0; i < 8; i++) {
    addParticle({
      type: 'laser',
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.2,
      vx: (Math.random() - 0.5) * 400,
      vy: 500 + Math.random() * 400,
      life: 0.55,
      hue: 90 + Math.random() * 40,
    });
  }
}

function burstConfetti() {
  for (let i = 0; i < 50; i++) {
    addParticle({
      type: 'confetti',
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 80,
      vy: 90 + Math.random() * 140,
      life: 2,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 8,
      hue: Math.random() * 360,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
    });
  }
}

function burstRain() {
  for (let i = 0; i < 60; i++) {
    addParticle({ type: 'rain', x: Math.random() * canvas.width, y: -Math.random() * canvas.height, vx: 20, vy: 420 + Math.random() * 180, life: 1.4 });
  }
}

function burstReaction(id) {
  if (id === 'hearts') burstHearts();
  if (id === 'balloons') burstBalloons();
  if (id === 'fireworks') burstFireworks();
  if (id === 'lasers') burstLasers();
  if (id === 'confetti') burstConfetti();
  if (id === 'rain') burstRain();
}

function addSticker(id) {
  const item = STICKERS.find((s) => s.id === id);
  if (!item) return;
  const f = face || fallbackFace();
  stickers.push({ emoji: item.emoji, x: f.cheekRX + 20, y: f.headY, s: 42 + Math.random() * 16, bob: Math.random() * 6 });
}

function glossyCircle(x, y, r, c1, c2) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeartShape(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.fillStyle = '#ff2d55';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-18, -8, -10, -22, 0, -12);
  ctx.bezierCurveTo(10, -22, 18, -8, 0, 6);
  ctx.fill();
  ctx.restore();
}

function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    if (p.type === 'heart') {
      p.vy -= 20 * dt;
      drawHeartShape(p.x, p.y, p.s);
    } else if (p.type === 'balloon') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + p.s);
      ctx.quadraticCurveTo(p.x + 8, p.y + p.s * 2, p.x - 4, p.y + p.s * 3);
      ctx.stroke();
      glossyCircle(p.x, p.y, p.s, '#fff6', p.color);
    } else if (p.type === 'spark') {
      p.vy += 80 * dt;
      ctx.fillStyle = `hsl(${p.hue} 100% 65%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'laser') {
      ctx.strokeStyle = `hsl(${p.hue} 100% 60%)`;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.08, p.y + p.vy * 0.08);
      ctx.stroke();
    } else if (p.type === 'confetti') {
      p.rot += p.vr * dt;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `hsl(${p.hue} 90% 60%)`;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.type === 'rain') {
      ctx.strokeStyle = 'rgba(170,210,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 4, p.y + 16);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawNotes(dt) {
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i];
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    n.life -= dt * 0.65;
    if (n.life <= 0) {
      notes.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, n.life);
    ctx.translate(n.x, n.y);
    ctx.rotate(n.rot);
    ctx.fillStyle = `hsl(${n.hue} 90% 62%)`;
    ctx.font = `700 ${n.size}px Georgia, serif`;
    ctx.fillText(n.kind, 0, 0);
    ctx.restore();
  }
}

function drawScratches(dt) {
  for (let i = scratches.length - 1; i >= 0; i--) {
    const s = scratches[i];
    s.life -= dt * 1.5;
    if (s.life <= 0) {
      scratches.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(s.x + k * 8, s.y);
      ctx.lineTo(s.x + s.dir * 32 + k * 8, s.y + 20);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawStickers(t) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const s of stickers) {
    ctx.save();
    ctx.font = `${s.s}px sans-serif`;
    ctx.fillText(s.emoji, s.x, s.y + Math.sin(t * 3 + s.bob) * 6);
    ctx.restore();
  }
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawDog(f, asleep, t) {
  const s = Math.max(64, f.faceW * 0.64);
  ctx.save();
  ctx.translate(f.headX, f.headY - s * 0.72);
  const g = ctx.createRadialGradient(-s * 0.1, -s * 0.1, 8, 0, 0, s * 0.5);
  g.addColorStop(0, '#f0d1a0');
  g.addColorStop(1, '#b08968');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.48, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d6e52';
  ctx.beginPath();
  ctx.ellipse(-s * 0.4, s * 0.02, s * 0.16, s * 0.28, 0.4, 0, Math.PI * 2);
  ctx.ellipse(s * 0.4, s * 0.02, s * 0.16, s * 0.28, -0.4, 0, Math.PI * 2);
  ctx.fill();
  if (asleep) {
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-s * 0.14, 0, s * 0.08, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.14, 0, s * 0.08, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    glossyCircle(-s * 0.14, -s * 0.02, s * 0.09, '#fff', '#eee');
    glossyCircle(s * 0.14, -s * 0.02, s * 0.09, '#fff', '#eee');
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-s * 0.14, 0, s * 0.035, 0, Math.PI * 2);
    ctx.arc(s * 0.14, 0, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.08, s * 0.08, s * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBunny(f, asleep) {
  const s = Math.max(60, f.faceW * 0.6);
  ctx.save();
  ctx.translate(f.headX, f.headY - s * 0.62);
  ctx.fillStyle = '#f8f4ff';
  ctx.beginPath();
  ctx.ellipse(-s * 0.18, -s * 0.55, s * 0.12, s * 0.42, -0.15, 0, Math.PI * 2);
  ctx.ellipse(s * 0.18, -s * 0.55, s * 0.12, s * 0.42, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb3c6';
  ctx.beginPath();
  ctx.ellipse(-s * 0.18, -s * 0.5, s * 0.05, s * 0.28, -0.15, 0, Math.PI * 2);
  ctx.ellipse(s * 0.18, -s * 0.5, s * 0.05, s * 0.28, 0.15, 0, Math.PI * 2);
  ctx.fill();
  glossyCircle(0, 0, s * 0.38, '#fff', '#e9e4f5');
  if (asleep) {
    ctx.strokeStyle = '#5c4d6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-s * 0.12, 0, s * 0.07, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(s * 0.12, 0, s * 0.07, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(-s * 0.12, 0, s * 0.05, 0, Math.PI * 2);
    ctx.arc(s * 0.12, 0, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCrown(f, t) {
  const s = Math.max(50, f.faceW * 0.7);
  ctx.save();
  ctx.translate(f.headX, f.headY - s * 0.7);
  ctx.rotate(Math.sin(t * 2) * 0.05);
  const gold = ctx.createLinearGradient(0, -s * 0.2, 0, s * 0.2);
  gold.addColorStop(0, '#ffe566');
  gold.addColorStop(1, '#e09f1f');
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, s * 0.12);
  ctx.lineTo(-s * 0.42, -s * 0.05);
  ctx.lineTo(-s * 0.22, s * 0.06);
  ctx.lineTo(0, -s * 0.28);
  ctx.lineTo(s * 0.22, s * 0.06);
  ctx.lineTo(s * 0.42, -s * 0.05);
  ctx.lineTo(s * 0.42, s * 0.12);
  ctx.closePath();
  ctx.fill();
  glossyCircle(0, -s * 0.3, s * 0.07, '#fff', '#ff4d6d');
  glossyCircle(-s * 0.42, -s * 0.06, s * 0.055, '#fff', '#4cc9f0');
  glossyCircle(s * 0.42, -s * 0.06, s * 0.055, '#fff', '#80ed99');
  ctx.restore();
}

function drawRainbow(f, t) {
  if (!f.open) return;
  const hues = [0, 30, 55, 120, 210, 270];
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `hsl(${hues[i]} 90% 60%)`;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.mouthX, f.mouthY);
    ctx.quadraticCurveTo(f.mouthX + Math.sin(t * 6 + i) * 30, f.mouthY + 40 + i * 10, f.mouthX + Math.sin(t * 4 + i) * 80, f.mouthY + 90 + i * 16);
    ctx.stroke();
  }
}

function drawFilter(f, t) {
  ctx.save();
  ctx.translate(filterOff.x, filterOff.y);
  const asleep = !!f.open;
  if (filterId === 'dog') drawDog(f, asleep, t);
  if (filterId === 'bunny') drawBunny(f, asleep);
  if (filterId === 'crown') drawCrown(f, t);
  if (filterId === 'rainbow') {
    drawCrown(f, t);
    drawRainbow(f, t);
  }
  ctx.restore();
}

function startGame(id) {
  resize();
  gameId = id;
  if (id === 'hoops') game = { id: 'hoops', score: 0, balls: [] };
  if (id === 'eightball') {
    game = {
      id: 'eightball',
      score: 0,
      balls: [
        { nx: 0.32, ny: 0.68, vx: 0, vy: 0, color: '#f8f8f8', cue: true, r: 16 },
        { nx: 0.62, ny: 0.42, vx: 0, vy: 0, color: '#1d3557', r: 16 },
        { nx: 0.7, ny: 0.38, vx: 0, vy: 0, color: '#e63946', r: 16 },
        { nx: 0.7, ny: 0.48, vx: 0, vy: 0, color: '#111', r: 16 },
      ],
    };
    for (const b of game.balls) {
      b.x = b.nx * canvas.width;
      b.y = b.ny * canvas.height;
    }
  }
  if (id === 'pong') {
    const cups = [];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i <= row; i++) cups.push({ x: 0.5 + (i - row / 2) * 0.08, y: 0.2 + row * 0.08, up: true });
    }
    game = { id: 'pong', score: 0, cups, ball: null };
  }
  markChips();
  scoreboard.classList.remove('hidden');
}

function eventToCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (1 - (e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

function onPointer(e) {
  if (!running || !game) return;
  const p = eventToCanvas(e);
  if (game.id === 'hoops') {
    game.balls.push({ x: canvas.width * 0.5, y: canvas.height * 0.88, vx: (p.x - canvas.width * 0.5) * 1.6, vy: (p.y - canvas.height * 0.88) * 1.8 - 420, r: 18, scored: false });
  } else if (game.id === 'eightball') {
    const cue = game.balls.find((b) => b.cue);
    if (!cue) return;
    cue.vx = (p.x - cue.x) * 2.2;
    cue.vy = (p.y - cue.y) * 2.2;
  } else if (game.id === 'pong' && !game.ball) {
    game.ball = { x: canvas.width * 0.5, y: canvas.height * 0.86, vx: (p.x - canvas.width * 0.5) * 1.4, vy: -520, r: 10 };
  }
}

function updateHoops(dt) {
  const hx = canvas.width * 0.5;
  const hy = canvas.height * 0.18;
  ctx.strokeStyle = '#ff8fab';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 52, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = game.balls.length - 1; i >= 0; i--) {
    const b = game.balls[i];
    b.vy += 980 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (!b.scored && Math.abs(b.x - hx) < 30 && Math.abs(b.y - hy) < 16 && b.vy > 0) {
      b.scored = true;
      game.score += 1;
      burstConfetti();
    }
    glossyCircle(b.x, b.y, b.r, '#ffd7a8', '#e85d04');
    if (b.y > canvas.height + 40) game.balls.splice(i, 1);
  }
  scoreboard.textContent = `Hoops  ${game.score}`;
}

function updateEight(dt) {
  const w = canvas.width;
  const h = canvas.height;
  const table = { x: w * 0.18, y: h * 0.28, w: w * 0.64, h: h * 0.42 };
  ctx.fillStyle = '#1b4332';
  ctx.strokeStyle = '#7f4f24';
  ctx.lineWidth = 14;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(table.x, table.y, table.w, table.h, 18);
  else ctx.rect(table.x, table.y, table.w, table.h);
  ctx.fill();
  ctx.stroke();
  const pockets = [[table.x, table.y], [table.x + table.w / 2, table.y], [table.x + table.w, table.y], [table.x, table.y + table.h], [table.x + table.w / 2, table.y + table.h], [table.x + table.w, table.y + table.h]];
  ctx.fillStyle = '#111';
  for (const [px, py] of pockets) {
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of game.balls) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= 0.985;
    b.vy *= 0.985;
    if (b.x < table.x + 16 || b.x > table.x + table.w - 16) b.vx *= -0.85;
    if (b.y < table.y + 16 || b.y > table.y + table.h - 16) b.vy *= -0.85;
    b.x = Math.max(table.x + 16, Math.min(table.x + table.w - 16, b.x));
    b.y = Math.max(table.y + 16, Math.min(table.y + table.h - 16, b.y));
    glossyCircle(b.x, b.y, b.r, '#fff', b.color);
  }
  for (let i = 0; i < game.balls.length; i++) {
    for (let j = i + 1; j < game.balls.length; j++) {
      const a = game.balls[i];
      const b = game.balls[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < a.r + b.r) {
        const nx = dx / d;
        const ny = dy / d;
        const p = a.vx * nx + a.vy * ny - (b.vx * nx + b.vy * ny);
        a.vx -= p * nx;
        a.vy -= p * ny;
        b.vx += p * nx;
        b.vy += p * ny;
      }
    }
  }
  for (let i = game.balls.length - 1; i >= 0; i--) {
    const b = game.balls[i];
    if (b.cue) continue;
    for (const [px, py] of pockets) {
      if (Math.hypot(b.x - px, b.y - py) < 18) {
        game.balls.splice(i, 1);
        game.score += 1;
        burstHearts();
        break;
      }
    }
  }
  scoreboard.textContent = `8 Ball  ${game.score}  ·  tap to shoot`;
}

function updatePong(dt) {
  for (const cup of game.cups) {
    if (!cup.up) continue;
    const x = cup.x * canvas.width;
    const y = cup.y * canvas.height;
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 10);
    ctx.lineTo(x + 18, y - 10);
    ctx.lineTo(x + 12, y + 22);
    ctx.lineTo(x - 12, y + 22);
    ctx.closePath();
    ctx.fill();
  }
  if (game.ball) {
    const b = game.ball;
    b.vy += 900 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    glossyCircle(b.x, b.y, b.r, '#fff', '#f8edeb');
    for (const cup of game.cups) {
      if (!cup.up) continue;
      const x = cup.x * canvas.width;
      const y = cup.y * canvas.height;
      if (Math.hypot(b.x - x, b.y - y) < 22 && b.vy > 0) {
        cup.up = false;
        game.score += 1;
        game.ball = null;
        burstConfetti();
        break;
      }
    }
    if (game.ball && b.y > canvas.height) game.ball = null;
  }
  scoreboard.textContent = `Cup Pong  ${game.score}/${game.cups.length}  ·  tap to throw`;
}

function updateGame(dt) {
  if (!game) {
    scoreboard.classList.add('hidden');
    return;
  }
  if (game.id === 'hoops') updateHoops(dt);
  if (game.id === 'eightball') updateEight(dt);
  if (game.id === 'pong') updatePong(dt);
}

function loop(ts) {
  if (!running) return;
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  resize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStandinPhoto();
  face = fallbackFace();
  const f = lerpFace(face);
  f.open = !!(face.open || spaceHeld || mouthHeld);
  const t = ts / 1000;

  if (filterId === 'dog' || filterId === 'bunny') {
    if (f.open) {
      scratchT = 0;
      noteTimer += dt;
      if (noteTimer > 0.16) {
        noteTimer = 0;
        spawnNote(f.mouthX, f.mouthY);
        pingNote();
      }
      setStatus(filterId === 'dog' ? 'Howling… the dog is happy 🐶' : 'Singing… bunny is chill 🐰');
    } else {
      scratchT += dt;
      if (scratchT > 0.3) {
        scratchT = 0;
        spawnScratch(f);
      }
      setStatus(filterId === 'dog' ? 'Sing or the dog paws you! 🐕' : 'Sing or bunny thumps you! 🐇');
    }
  } else if (filterId === 'rainbow') {
    setStatus(f.open ? 'Rainbow mode 🌈' : 'Hold Space for rainbows');
  } else {
    setStatus('Crown sparkles · tap ✨ for more');
  }

  drawStandinMouth(f, f.open);
  drawScratches(dt);
  drawNotes(dt);
  drawParticles(dt);
  drawStickers(t);
  drawFilter(f, t);
  updateGame(dt);
  requestAnimationFrame(loop);
}

function startCall() {
  if (running) return;
  gate.classList.add('hidden');
  tray.classList.remove('hidden');
  effectsBtn.classList.add('active');
  callStatus.textContent = FILTERS.find((x) => x.id === filterId)?.name || 'Effects';
  setStatus('Fake caller · hold Space or click their face to sing');
  running = true;
  markChips();
  requestAnimationFrame(loop);
}

function stopCall() {
  running = false;
  effectsBtn.classList.remove('active');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.length = 0;
  notes.length = 0;
  scratches.length = 0;
  stickers.length = 0;
  face = null;
  smooth = null;
  game = null;
  gameId = null;
  filterOff = { x: 0, y: 0 };
  canvasDrag = null;
  mouthHeld = false;
  gate.classList.remove('hidden');
  tray.classList.add('hidden');
  statusChip.classList.add('hidden');
  scoreboard.classList.add('hidden');
}

function applyItem(kind, id) {
  if (kind === 'filter') {
    filterId = id;
    callStatus.textContent = FILTERS.find((x) => x.id === id)?.name || id;
    markChips();
  } else if (kind === 'react') {
    burstReaction(id);
  } else if (kind === 'sticker') {
    addSticker(id);
  } else if (kind === 'game') {
    startGame(id);
    callStatus.textContent = GAMES.find((g) => g.id === id)?.name || id;
    tray.classList.add('hidden');
  }
}

document.getElementById('gate-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  applyItem(btn.dataset.kind, btn.dataset.id);
  startCall();
});

let trayDrag = null;
let trayMoved = false;

function clampTray(x, y) {
  const pad = 8;
  return {
    x: Math.max(pad, Math.min(window.innerWidth - tray.offsetWidth - pad, x)),
    y: Math.max(pad, Math.min(window.innerHeight - tray.offsetHeight - pad, y)),
  };
}

function placeTray(x, y) {
  const p = clampTray(x, y);
  tray.classList.add('moved');
  tray.style.left = `${p.x}px`;
  tray.style.top = `${p.y}px`;
}

tray.addEventListener('pointerdown', (e) => {
  if (e.button && e.button !== 0) return;
  if (e.target.closest('.fx-chip, .fx-row')) return;
  const r = tray.getBoundingClientRect();
  trayDrag = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
  trayMoved = false;
  tray.classList.add('dragging');
  tray.setPointerCapture(e.pointerId);
  e.preventDefault();
});

tray.addEventListener('pointermove', (e) => {
  if (!trayDrag || e.pointerId !== trayDrag.id) return;
  const nextX = e.clientX - trayDrag.dx;
  const nextY = e.clientY - trayDrag.dy;
  if (!trayMoved) {
    const r = tray.getBoundingClientRect();
    if (Math.hypot(nextX - r.left, nextY - r.top) > 5) trayMoved = true;
  }
  placeTray(nextX, nextY);
});

tray.addEventListener('pointerup', (e) => {
  if (!trayDrag || e.pointerId !== trayDrag.id) return;
  tray.classList.remove('dragging');
  trayDrag = null;
});

tray.addEventListener('click', (e) => {
  if (trayMoved) {
    trayMoved = false;
    e.preventDefault();
    return;
  }
  const btn = e.target.closest('[data-id]');
  if (!btn) return;
  applyItem(btn.dataset.kind, btn.dataset.id);
});

effectsBtn.addEventListener('click', () => {
  if (!running) startCall();
  else tray.classList.toggle('hidden');
  effectsBtn.classList.toggle('active', running && !tray.classList.contains('hidden'));
});
hangupBtn.addEventListener('click', stopCall);

canvas.addEventListener('pointerdown', (e) => {
  if (!running) return;
  const p = eventToCanvas(e);
  for (let i = stickers.length - 1; i >= 0; i--) {
    const s = stickers[i];
    if (Math.hypot(p.x - s.x, p.y - s.y) < s.s * 0.62) {
      canvasDrag = { kind: 'sticker', index: i, dx: p.x - s.x, dy: p.y - s.y, id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  const f = smooth || face;
  if (f) {
    const fx = f.headX + filterOff.x;
    const fy = f.headY - Math.max(36, f.faceW * 0.32) + filterOff.y;
    if (Math.hypot(p.x - fx, p.y - fy) < Math.max(52, f.faceW * 0.42)) {
      canvasDrag = { kind: 'filter', dx: p.x - (f.headX + filterOff.x), dy: p.y - (f.headY + filterOff.y), id: e.pointerId };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  if (game) {
    onPointer(e);
    return;
  }
  mouthHeld = true;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!canvasDrag || e.pointerId !== canvasDrag.id) return;
  const p = eventToCanvas(e);
  if (canvasDrag.kind === 'sticker') {
    const s = stickers[canvasDrag.index];
    if (!s) return;
    s.x = p.x - canvasDrag.dx;
    s.y = p.y - canvasDrag.dy;
  } else if (canvasDrag.kind === 'filter' && (smooth || face)) {
    const f = smooth || face;
    filterOff.x = p.x - canvasDrag.dx - f.headX;
    filterOff.y = p.y - canvasDrag.dy - f.headY;
  }
});

canvas.addEventListener('pointerup', (e) => {
  if (canvasDrag && e.pointerId === canvasDrag.id) canvasDrag = null;
  mouthHeld = false;
});
canvas.addEventListener('pointercancel', () => {
  canvasDrag = null;
  mouthHeld = false;
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    spaceHeld = true;
    if (!running) startCall();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') spaceHeld = false;
});
window.addEventListener('resize', () => {
  resize();
  if (tray.classList.contains('moved')) {
    const r = tray.getBoundingClientRect();
    placeTray(r.left, r.top);
  }
});
