const SAVE_KEY = 'glowup-save';

const LOOKS = [
  { id: 'soft', name: 'Soft', emoji: '💗', unlock: 0, smooth: 0.62, glow: 0.42, warmth: 0.28, sat: 0.18, blush: 0.4, blushHue: 8, lips: 0.22, lipHue: 352, sparkle: 0.18 },
  { id: 'peach', name: 'Peach', emoji: '🍑', unlock: 0, smooth: 0.48, glow: 0.38, warmth: 0.55, sat: 0.28, blush: 0.58, blushHue: 18, lips: 0.34, lipHue: 12, sparkle: 0.12 },
  { id: 'glam', name: 'Glam', emoji: '💋', unlock: 0, smooth: 0.7, glow: 0.55, warmth: 0.2, sat: 0.35, blush: 0.5, blushHue: 350, lips: 0.72, lipHue: 348, sparkle: 0.35 },
  { id: 'sunset', name: 'Sunset', emoji: '🌅', unlock: 0, smooth: 0.45, glow: 0.6, warmth: 0.72, sat: 0.42, blush: 0.46, blushHue: 22, lips: 0.4, lipHue: 16, sparkle: 0.28 },
  { id: 'fairy', name: 'Fairy', emoji: '🧚', unlock: 5, smooth: 0.55, glow: 0.7, warmth: 0.15, sat: 0.45, blush: 0.38, blushHue: 300, lips: 0.3, lipHue: 310, sparkle: 0.85 },
  { id: 'ice', name: 'Ice', emoji: '❄️', unlock: 10, smooth: 0.68, glow: 0.5, warmth: 0, sat: 0.08, blush: 0.28, blushHue: 200, lips: 0.26, lipHue: 330, sparkle: 0.55 },
  { id: 'cherry', name: 'Cherry', emoji: '🍒', unlock: 15, smooth: 0.5, glow: 0.4, warmth: 0.32, sat: 0.5, blush: 0.7, blushHue: 0, lips: 0.8, lipHue: 356, sparkle: 0.22 },
  { id: 'gold', name: 'Gold', emoji: '✨', unlock: 20, smooth: 0.58, glow: 0.78, warmth: 0.8, sat: 0.38, blush: 0.42, blushHue: 32, lips: 0.36, lipHue: 24, sparkle: 0.48 },
];

const SLIDERS = [
  ['smooth', 'Smooth'],
  ['glow', 'Glow'],
  ['warmth', 'Warm'],
  ['blush', 'Blush'],
  ['lips', 'Lips'],
  ['sparkle', 'Sparkle'],
];

const LIPSTICKS = [
  { id: 'nude', name: 'Nude', color: '#c9897a' },
  { id: 'peach', name: 'Peach', color: '#e08a6c' },
  { id: 'rose', name: 'Rose', color: '#d45d6e' },
  { id: 'pink', name: 'Pink', color: '#ff6b9d' },
  { id: 'coral', name: 'Coral', color: '#ff7a59' },
  { id: 'red', name: 'Red', color: '#c41e3a' },
  { id: 'berry', name: 'Berry', color: '#8b1e4a' },
  { id: 'plum', name: 'Plum', color: '#6b2d5b' },
  { id: 'cocoa', name: 'Cocoa', color: '#7a3e32' },
  { id: 'wipe', name: 'Wipe', color: null },
];

const LIP_W = 320;
const LIP_H = 180;
const lipCanvas = document.createElement('canvas');
lipCanvas.width = LIP_W;
lipCanvas.height = LIP_H;
const lipCtx = lipCanvas.getContext('2d');

function makeLipPath(w, h) {
  const path = new Path2D();
  const cx = w * 0.5;
  const cy = h * 0.46;
  path.moveTo(w * 0.1, cy);
  path.bezierCurveTo(w * 0.16, h * 0.16, w * 0.36, h * 0.08, cx, h * 0.4);
  path.bezierCurveTo(w * 0.64, h * 0.08, w * 0.84, h * 0.16, w * 0.9, cy);
  path.bezierCurveTo(w * 0.8, h * 0.94, w * 0.2, h * 0.94, w * 0.1, cy);
  path.closePath();
  return path;
}

const LIP_PATH = makeLipPath(LIP_W, LIP_H);

const CHALLENGES = [
  { look: 'soft', line: 'Soft Sunday. Keep it gentle.' },
  { look: 'peach', line: 'Brunch glow. Think peaches.' },
  { look: 'glam', line: 'Red carpet in ten minutes.' },
  { look: 'sunset', line: 'Golden hour on the rooftop.' },
  { look: 'fairy', line: 'Late to the mushroom ball.' },
  { look: 'ice', line: 'Winter gala. Stay frost.' },
  { look: 'cherry', line: 'Cherry soda date night.' },
  { look: 'gold', line: 'Main-character lighting only.' },
];

const gate = document.getElementById('gate');
const studio = document.getElementById('studio');
const result = document.getElementById('result');
const video = document.getElementById('cam');
const view = document.getElementById('view');
const shot = document.getElementById('shot');
const looksRow = document.getElementById('looks-row');
const lipPalette = document.getElementById('lip-palette');
const slidersEl = document.getElementById('sliders');
const glowMeter = document.getElementById('glow-meter');
const studioStatus = document.getElementById('studio-status');
const mission = document.getElementById('mission');
const missionLabel = document.getElementById('mission-label');
const missionTime = document.getElementById('mission-time');
const gateError = document.getElementById('gate-error');
const starBank = document.getElementById('star-bank');

const ctx = view.getContext('2d', { alpha: false });
const shotCtx = shot.getContext('2d');
const probe = document.createElement('canvas');
const probeCtx = probe.getContext('2d', { willReadFrequently: true });
const standin = document.createElement('canvas');
const standinCtx = standin.getContext('2d');

const save = loadSave();
const look = { ...LOOKS[0] };
let activeLook = 'soft';
let stream = null;
let facing = 'user';
let usingStandin = false;
let loop = 0;
let face = null;
let frame = 0;
let sparkles = [];
let compare = false;
let mode = 'studio';
let challenge = null;
let challengeEnds = 0;
let sourceReady = false;
let hoverId = null;
let drag = null;
let lastLayout = null;
let sparkleHome = { x: 0, y: 0 };
let activeLipstick = LIPSTICKS[2];
let lipPainted = false;
let coloring = null;
let stickDrag = null;
const lipGhost = document.getElementById('lip-ghost');

const PIECES = [
  { id: 'blushL', kind: 'blush', label: 'Blush' },
  { id: 'blushR', kind: 'blush', label: 'Blush' },
  { id: 'glow', kind: 'glow', label: 'Glow' },
  { id: 'sparkle', kind: 'sparkle', label: 'Sparkle' },
];

const pins = {
  blushL: null,
  blushR: null,
  lips: null,
  glow: null,
  sparkle: null,
};

function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return { stars: Number(raw.stars) || 0 };
  } catch {
    return { stars: 0 };
  }
}

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  starBank.textContent = `★ ${save.stars} stars saved`;
}

function show(screen) {
  for (const node of [gate, studio, result]) {
    const on = node === screen;
    node.classList.toggle('hidden', !on);
    node.hidden = !on;
  }
}

function unlocked(row) {
  return save.stars >= row.unlock;
}

function resetPins() {
  for (const id of Object.keys(pins)) pins[id] = null;
}

function applyLook(row) {
  for (const key of ['smooth', 'glow', 'warmth', 'sat', 'blush', 'blushHue', 'lips', 'lipHue', 'sparkle']) {
    look[key] = row[key];
  }
  activeLook = row.id;
  resetPins();
  syncSliders();
  paintLooks();
  if (row.id === 'plain' || (row.lips ?? 0) < 0.12) clearLips();
  else fillLips(lipColorFromHue(row.lipHue));
}

function currentGlow() {
  return Math.min(1, look.smooth * 0.25 + look.glow * 0.35 + look.blush * 0.15 + look.lips * 0.1 + look.sparkle * 0.15);
}

function paintLooks() {
  looksRow.innerHTML = LOOKS.map((row) => {
    const lock = unlocked(row) ? '' : ' locked';
    const on = activeLook === row.id ? ' on' : '';
    return `<button class="look-btn${on}${lock}" type="button" data-look="${row.id}"><small>${row.emoji}</small>${row.name}${row.unlock && !unlocked(row) ? `<br>★${row.unlock}` : ''}</button>`;
  }).join('');
}

function syncSliders() {
  for (const [key] of SLIDERS) {
    const input = slidersEl.querySelector(`[data-key="${key}"]`);
    if (input) input.value = String(look[key]);
  }
}

function buildSliders() {
  slidersEl.innerHTML = SLIDERS.map(([key, label]) => (
    `<label class="slider-row">${label}<input type="range" min="0" max="1" step="0.01" data-key="${key}" value="${look[key]}"></label>`
  )).join('');
}

function buildLipPalette() {
  if (!lipPalette) return;
  lipPalette.innerHTML = LIPSTICKS.map((pot) => (
    `<button class="lip-stick${pot.id === 'wipe' ? ' wipe' : ''}${activeLipstick.id === pot.id ? ' on' : ''}" type="button" data-lip="${pot.id}" title="${pot.name}. Drag onto your lips.">
      <span class="bullet" style="${pot.color ? `background:${pot.color}` : ''}"></span>
      <span class="tube"></span>
      ${pot.name}
    </button>`
  )).join('');
}

function lipColorFromHue(hue) {
  return `hsl(${hue} 72% 48%)`;
}

function clearLips() {
  lipCtx.clearRect(0, 0, LIP_W, LIP_H);
  lipPainted = false;
}

function fillLips(color) {
  lipCtx.save();
  lipCtx.clearRect(0, 0, LIP_W, LIP_H);
  lipCtx.clip(LIP_PATH);
  lipCtx.fillStyle = color;
  lipCtx.fillRect(0, 0, LIP_W, LIP_H);
  lipCtx.globalCompositeOperation = 'screen';
  lipCtx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  lipCtx.beginPath();
  lipCtx.ellipse(LIP_W * 0.5, LIP_H * 0.36, LIP_W * 0.2, LIP_H * 0.1, 0, 0, Math.PI * 2);
  lipCtx.fill();
  lipCtx.restore();
  lipPainted = true;
}

function paintLipStroke(from, to, color) {
  const wipe = !color;
  lipCtx.save();
  lipCtx.clip(LIP_PATH);
  lipCtx.globalCompositeOperation = wipe ? 'destination-out' : 'source-over';
  lipCtx.strokeStyle = wipe ? 'rgba(0,0,0,1)' : color;
  lipCtx.lineWidth = wipe ? 34 : 30;
  lipCtx.lineCap = 'round';
  lipCtx.lineJoin = 'round';
  lipCtx.globalAlpha = wipe ? 1 : 0.92;
  lipCtx.beginPath();
  lipCtx.moveTo(from.x, from.y);
  lipCtx.lineTo(to.x, to.y);
  lipCtx.stroke();
  lipCtx.restore();
  if (!wipe) lipPainted = true;
}

function lipRect(box, dw, dh) {
  const pos = piecePos('lips', box, dw, dh);
  const rw = box.w * 0.44;
  const rh = box.h * 0.17;
  return { x: pos.x - rw / 2, y: pos.y - rh / 2, w: rw, h: rh };
}

function screenToLip(sx, sy, rect) {
  return {
    x: ((sx - rect.x) / Math.max(1, rect.w)) * LIP_W,
    y: ((sy - rect.y) / Math.max(1, rect.h)) * LIP_H,
  };
}

function inLips(sx, sy, rect) {
  if (!rect) return false;
  const point = screenToLip(sx, sy, rect);
  return lipCtx.isPointInPath(LIP_PATH, point.x, point.y);
}

function hueDist(a, b) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function closeness(a, b) {
  const keys = ['smooth', 'glow', 'warmth', 'blush', 'lips', 'sparkle'];
  let err = 0;
  for (const key of keys) err += Math.abs(a[key] - b[key]);
  err += hueDist(a.blushHue, b.blushHue) / 180;
  err += hueDist(a.lipHue, b.lipHue) / 180;
  return Math.max(0, 1 - err / 5.2);
}

function isSkin(r, g, b) {
  return r > 80 && g > 35 && b > 18 && r > g && r - b > 12 && Math.abs(r - g) > 8 && r < 255 && g < 230;
}

function estimateFace(source, sw, sh) {
  const pw = 80;
  const ph = Math.max(45, Math.round(80 * sh / sw));
  probe.width = pw;
  probe.height = ph;
  probeCtx.drawImage(source, 0, 0, pw, ph);
  const data = probeCtx.getImageData(0, 0, pw, ph).data;
  let n = 0;
  let sx = 0;
  let sy = 0;
  let minX = pw;
  let minY = ph;
  let maxX = 0;
  let maxY = 0;
  for (let y = 2; y < ph - 2; y += 2) {
    for (let x = 4; x < pw - 4; x += 2) {
      const i = (y * pw + x) * 4;
      if (!isSkin(data[i], data[i + 1], data[i + 2])) continue;
      n += 1;
      sx += x;
      sy += y;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (n < 28) return null;
  const scaleX = sw / pw;
  const scaleY = sh / ph;
  return {
    x: minX * scaleX,
    y: minY * scaleY,
    w: Math.max(40, (maxX - minX) * scaleX),
    h: Math.max(48, (maxY - minY) * scaleY),
    cx: (sx / n) * scaleX,
    cy: (sy / n) * scaleY,
  };
}

function defaultFace(w, h) {
  return { x: w * 0.28, y: h * 0.18, w: w * 0.44, h: h * 0.58, cx: w * 0.5, cy: h * 0.42 };
}

function hsl(h, s, l, a) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

function pieceAmount(kind) {
  if (kind === 'blush') return look.blush;
  if (kind === 'lips') return look.lips;
  if (kind === 'glow') return look.glow;
  return look.sparkle;
}

function pieceShown(kind) {
  return pieceAmount(kind) > 0.04;
}

function defaultPiecePos(id, box) {
  const { cx, cy, w: fw, h: fh } = box;
  if (id === 'blushL') return { x: cx - fw * 0.28, y: cy + fh * 0.08 };
  if (id === 'blushR') return { x: cx + fw * 0.28, y: cy + fh * 0.08 };
  if (id === 'lips') return { x: cx, y: cy + fh * 0.28 };
  if (id === 'glow') return { x: cx, y: cy - fh * 0.12 };
  return { x: cx + fw * 0.16, y: cy - fh * 0.2 };
}

function piecePos(id, box, dw, dh) {
  const pin = pins[id];
  if (pin) return { x: pin.nx * dw, y: pin.ny * dh };
  return defaultPiecePos(id, box);
}

function pieceRadii(kind, box) {
  const fw = box.w;
  const fh = box.h;
  if (kind === 'blush') {
    const rad = fw * (0.16 + look.blush * 0.08);
    return { rx: rad, ry: rad * 0.72 };
  }
  if (kind === 'lips') {
    return { rx: fw * (0.16 + look.lips * 0.04), ry: fh * (0.055 + look.lips * 0.02) };
  }
  if (kind === 'glow') return { rx: fw * 0.18, ry: fh * 0.1 };
  return { rx: fw * 0.2, ry: fw * 0.2 };
}

function layoutPieces(box, dw, dh) {
  return PIECES.filter((piece) => pieceShown(piece.kind)).map((piece) => {
    const pos = piecePos(piece.id, box, dw, dh);
    const rad = pieceRadii(piece.kind, box);
    return { ...piece, x: pos.x, y: pos.y, rx: rad.rx, ry: rad.ry };
  });
}

function drawBlushAt(g, x, y, rad) {
  g.save();
  g.globalCompositeOperation = 'soft-light';
  const grad = g.createRadialGradient(x, y, 4, x, y, rad);
  grad.addColorStop(0, hsl(look.blushHue, 78, 62, 0.18 + look.blush * 0.55));
  grad.addColorStop(1, hsl(look.blushHue, 70, 60, 0));
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(x, y, rad, rad * 0.72, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawLipColoring(g, box, dw, dh, opts = {}) {
  const rect = lipRect(box, dw, dh);
  g.save();
  g.translate(rect.x, rect.y);
  g.scale(rect.w / LIP_W, rect.h / LIP_H);
  if (lipPainted) {
    g.save();
    g.globalAlpha = 0.55 + look.lips * 0.45;
    g.globalCompositeOperation = 'multiply';
    g.drawImage(lipCanvas, 0, 0);
    g.restore();
    g.save();
    g.globalAlpha = 0.18 + look.lips * 0.2;
    g.globalCompositeOperation = 'soft-light';
    g.drawImage(lipCanvas, 0, 0);
    g.restore();
  }
  g.strokeStyle = '#1a0810';
  g.lineWidth = 8;
  g.stroke(LIP_PATH);
  g.strokeStyle = opts.handles ? '#fff' : 'rgba(255, 255, 255, 0.35)';
  g.lineWidth = 3.5;
  g.stroke(LIP_PATH);
  if (opts.handles && !lipPainted) {
    g.fillStyle = 'rgba(255, 182, 193, 0.22)';
    g.fill(LIP_PATH);
    g.font = '700 22px "IBM Plex Sans", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText('Drag on', LIP_W / 2, LIP_H * 0.55);
  }
  g.restore();
  return rect;
}

function drawGlowAt(g, hx, hy, fw, fh) {
  g.save();
  g.globalCompositeOperation = 'soft-light';
  const grad = g.createRadialGradient(hx, hy, 2, hx, hy, fw * 0.22);
  grad.addColorStop(0, `rgba(255, 236, 210, ${0.08 + look.glow * 0.22})`);
  grad.addColorStop(1, 'rgba(255, 236, 210, 0)');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(hx, hy, fw * 0.18, fh * 0.1, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawHandle(g, piece, active) {
  g.save();
  g.strokeStyle = active ? 'rgba(255, 226, 122, 0.95)' : 'rgba(255, 255, 255, 0.55)';
  g.lineWidth = active ? 3 : 2;
  g.setLineDash(active ? [] : [5, 4]);
  g.beginPath();
  g.ellipse(piece.x, piece.y, piece.rx * 1.08, piece.ry * 1.08, 0, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.font = '700 13px "IBM Plex Sans", sans-serif';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(0, 0, 0, 0.45)';
  g.fillText(piece.label, piece.x + 1, piece.y - piece.ry - 8);
  g.fillStyle = active ? '#ffe27a' : '#fff';
  g.fillText(piece.label, piece.x, piece.y - piece.ry - 9);
  g.restore();
}

function drawMakeup(g, box, w, h, opts = {}) {
  const laid = layoutPieces(box, w, h);
  for (const piece of laid) {
    if (piece.kind === 'blush') drawBlushAt(g, piece.x, piece.y, piece.rx);
    if (piece.kind === 'glow') drawGlowAt(g, piece.x, piece.y, box.w, box.h);
  }
  const lip = drawLipColoring(g, box, w, h, opts);

  const sparkle = laid.find((piece) => piece.kind === 'sparkle');
  if (sparkle) {
    if (sparkles.length < 8 || frame % 40 === 0) {
      seedSparkles(sparkle, 10 + Math.round(look.sparkle * 18));
    }
    sparkleHome = { x: sparkle.x, y: sparkle.y };
    drawSparkles(g, frame);
  }

  const vig = g.createRadialGradient(w / 2, h * 0.42, w * 0.18, w / 2, h * 0.45, w * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(20, 6, 16, ${0.18 + look.glow * 0.12})`);
  g.fillStyle = vig;
  g.fillRect(0, 0, w, h);

  if (opts.handles) {
    for (const piece of laid) {
      const active = piece.id === hoverId || piece.id === drag?.id;
      drawHandle(g, piece, active);
    }
  }

  if (opts.track) {
    lastLayout = { dw: w, dh: h, pieces: laid, lip };
    view._glowPieces = laid;
    view._lip = lip;
  }
}

function seedSparkles(piece, count) {
  const spreadX = piece.rx * 1.6;
  const spreadY = piece.ry * 1.6;
  sparkles = [];
  for (let i = 0; i < count; i += 1) {
    sparkles.push({
      dx: (Math.random() - 0.5) * spreadX * 2,
      dy: (Math.random() - 0.5) * spreadY * 2,
      r: 1.2 + Math.random() * 2.4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.04 + Math.random() * 0.08,
    });
  }
}

function drawSparkles(g, t) {
  if (look.sparkle < 0.04) return;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const spec of sparkles) {
    const x = sparkleHome.x + spec.dx;
    const y = sparkleHome.y + spec.dy;
    const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(t * spec.speed + spec.phase));
    g.fillStyle = `rgba(255, 246, 210, ${twinkle * (0.35 + look.sparkle * 0.65)})`;
    g.beginPath();
    g.arc(x, y, spec.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - spec.r * 2.2, y);
    g.lineTo(x + spec.r * 2.2, y);
    g.moveTo(x, y - spec.r * 2.2);
    g.lineTo(x, y + spec.r * 2.2);
    g.stroke();
  }
  g.restore();
}

function drawStandinFace(t) {
  const w = standin.width;
  const h = standin.height;
  const g = standinCtx;
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#4a2a62');
  sky.addColorStop(0.55, '#2c1840');
  sky.addColorStop(1, '#1a1024');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#3d5c32';
  g.fillRect(0, h * 0.7, w, h * 0.3);
  g.fillStyle = '#5a8344';
  g.beginPath();
  g.ellipse(w * 0.18, h * 0.76, 120, 46, 0, 0, Math.PI * 2);
  g.ellipse(w * 0.82, h * 0.78, 140, 56, 0, 0, Math.PI * 2);
  g.fill();

  const cx = w * 0.5 + Math.sin(t / 900) * 5;
  const cy = h * 0.44 + Math.cos(t / 1100) * 3;

  g.fillStyle = '#3a2418';
  g.beginPath();
  g.ellipse(cx, cy + 88, 70, 28, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f3c4a6';
  g.beginPath();
  g.ellipse(cx, cy + 70, 38, 46, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = '#2a1810';
  g.beginPath();
  g.ellipse(cx - 2, cy - 18, 108, 128, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f3c4a6';
  g.beginPath();
  g.ellipse(cx, cy + 6, 86, 104, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2a1810';
  g.beginPath();
  g.moveTo(cx - 86, cy - 8);
  g.quadraticCurveTo(cx - 70, cy - 118, cx, cy - 132);
  g.quadraticCurveTo(cx + 70, cy - 118, cx + 86, cy - 8);
  g.quadraticCurveTo(cx + 40, cy - 70, cx, cy - 78);
  g.quadraticCurveTo(cx - 40, cy - 70, cx - 86, cy - 8);
  g.fill();
  g.beginPath();
  g.ellipse(cx - 78, cy + 8, 18, 36, -0.4, 0, Math.PI * 2);
  g.ellipse(cx + 78, cy + 8, 18, 36, 0.4, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = '#3d261c';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx - 44, cy - 22);
  g.quadraticCurveTo(cx - 30, cy - 32, cx - 16, cy - 20);
  g.moveTo(cx + 16, cy - 20);
  g.quadraticCurveTo(cx + 30, cy - 32, cx + 44, cy - 22);
  g.stroke();

  const blink = Math.sin(t / 200) > 0.97 ? 2 : 7;
  g.fillStyle = '#2a1812';
  g.beginPath();
  g.ellipse(cx - 28, cy - 4, 9, blink, 0, 0, Math.PI * 2);
  g.ellipse(cx + 28, cy - 4, 9, blink, 0, 0, Math.PI * 2);
  g.fill();
  if (blink > 4) {
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(cx - 26, cy - 7, 2.4, 0, Math.PI * 2);
    g.arc(cx + 30, cy - 7, 2.4, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = '#e0a888';
  g.beginPath();
  g.ellipse(cx, cy + 22, 12, 9, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#c57b7b';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(cx - 16, cy + 44);
  g.quadraticCurveTo(cx, cy + 56, cx + 16, cy + 44);
  g.stroke();
}

function sourceFrame() {
  if (usingStandin) {
    drawStandinFace(performance.now());
    return standin;
  }
  return video;
}

function sourceSize() {
  if (usingStandin) return { w: standin.width, h: standin.height };
  return { w: video.videoWidth, h: video.videoHeight };
}

function gradeFilter() {
  const bright = 1 + look.glow * 0.22;
  const sat = 1 + (look.sat ?? 0.2) * 0.7;
  const contrast = 0.96 + look.glow * 0.08;
  return `brightness(${bright}) saturate(${sat}) contrast(${contrast})`;
}

function drawWarmth(g, w, h) {
  if (look.warmth < 0.04) return;
  g.save();
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = `rgba(255, 170, 90, ${look.warmth * 0.42})`;
  g.fillRect(0, 0, w, h);
  g.restore();
}

function fitCover(sw, sh, dw, dh) {
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  return { x: (dw - w) / 2, y: (dh - h) / 2, w, h };
}

function displayFace(mapped, dw) {
  return {
    x: dw - mapped.x - mapped.w,
    y: mapped.y,
    w: mapped.w,
    h: mapped.h,
    cx: dw - mapped.cx,
    cy: mapped.cy,
  };
}

function paintBeautified(g, dw, dh, opts = {}) {
  const src = sourceFrame();
  const { w: sw, h: sh } = sourceSize();
  if (!sw) return false;
  const dest = fitCover(sw, sh, dw, dh);
  g.save();
  if (!opts.unmirrored) {
    g.translate(dw, 0);
    g.scale(-1, 1);
  }
  if (opts.plain) {
    g.filter = 'none';
    g.drawImage(src, dest.x, dest.y, dest.w, dest.h);
    g.restore();
    return true;
  }
  g.filter = gradeFilter();
  g.drawImage(src, dest.x, dest.y, dest.w, dest.h);
  if (look.smooth > 0.05) {
    g.filter = `${gradeFilter()} blur(${1 + look.smooth * 7}px)`;
    g.globalAlpha = 0.28 + look.smooth * 0.48;
    g.drawImage(src, dest.x, dest.y, dest.w, dest.h);
    g.globalAlpha = 1;
  }
  g.filter = 'none';
  drawWarmth(g, dw, dh);
  g.restore();

  const mapped = face
    ? {
      x: dest.x + face.x * (dest.w / sw),
      y: dest.y + face.y * (dest.h / sh),
      w: face.w * (dest.w / sw),
      h: face.h * (dest.h / sh),
      cx: dest.x + face.cx * (dest.w / sw),
      cy: dest.y + face.cy * (dest.h / sh),
    }
    : defaultFace(dw, dh);
  const box = opts.unmirrored ? mapped : displayFace(mapped, dw);
  drawMakeup(g, box, dw, dh, { handles: opts.handles, track: opts.track });
  return true;
}

function resizeView() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  view.width = Math.round(view.clientWidth * dpr);
  view.height = Math.round(view.clientHeight * dpr);
}

function tick() {
  loop = requestAnimationFrame(tick);
  if (!view.width) resizeView();
  const src = sourceFrame();
  const { w: sw, h: sh } = sourceSize();
  if (sw) {
    sourceReady = true;
    if (frame % 7 === 0) face = estimateFace(src, sw, sh);
  }
  ctx.fillStyle = '#110814';
  ctx.fillRect(0, 0, view.width, view.height);
  paintBeautified(ctx, view.width, view.height, { plain: compare, handles: !compare, track: true });
  glowMeter.style.width = `${Math.round(currentGlow() * 100)}%`;
  if (sourceReady && result.hidden) {
    const dragging = drag && PIECES.find((piece) => piece.id === drag.id);
    if (compare) {
      studioStatus.textContent = 'Before — release to glow again';
    } else if (dragging) {
      studioStatus.textContent = `Placing ${dragging.label}. Drop it on your face.`;
    } else if (stickDrag) {
      studioStatus.textContent = stickDrag.pot.id === 'wipe'
        ? 'Drag the wipe across your lips.'
        : `Drag ${stickDrag.pot.name} onto your lips.`;
    } else if (coloring) {
      studioStatus.textContent = activeLipstick.id === 'wipe'
        ? 'Wiping lipstick…'
        : `Swiping ${activeLipstick.name} on your lips.`;
    } else if (mode === 'challenge' && challenge) {
      const target = LOOKS.find((row) => row.id === challenge.look);
      studioStatus.textContent = `Match ${target.name}. Drag lipstick onto your face.`;
    } else if (face || usingStandin) {
      studioStatus.textContent = 'Drag a lipstick onto your lips.';
    } else {
      studioStatus.textContent = 'Center your face in the light.';
    }
  }
  if (mode === 'challenge' && challenge && result.hidden && !studio.hidden) {
    const left = Math.max(0, challengeEnds - Date.now());
    missionTime.textContent = `0:${String(Math.ceil(left / 1000)).padStart(2, '0')}`;
    if (left <= 0) finishSnap();
  }
  frame += 1;
}

function stopCamera() {
  if (loop) cancelAnimationFrame(loop);
  loop = 0;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  sourceReady = false;
}

async function startCamera() {
  stopCamera();
  usingStandin = false;
  studioStatus.textContent = 'Starting camera…';
  show(studio);
  resizeView();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    video.srcObject = stream;
    await video.play();
    sourceReady = true;
    studioStatus.textContent = 'Camera on. Beautify yourself.';
    if (!loop) loop = requestAnimationFrame(tick);
  } catch {
    gateError.textContent = 'Camera was blocked. You can still practice with the stand-in face.';
    gateError.classList.remove('hidden');
    show(gate);
  }
}

function startStandin() {
  stopCamera();
  usingStandin = true;
  standin.width = 720;
  standin.height = 960;
  sourceReady = true;
  show(studio);
  resizeView();
  studioStatus.textContent = 'Practice face ready. Pick a look.';
  if (!loop) loop = requestAnimationFrame(tick);
}

function setMode(next) {
  mode = next;
  document.getElementById('mode-studio').classList.toggle('on', next === 'studio');
  document.getElementById('mode-challenge').classList.toggle('on', next === 'challenge');
  if (next === 'challenge') startChallenge();
  else {
    challenge = null;
    mission.classList.add('hidden');
  }
}

function startChallenge() {
  const open = CHALLENGES.filter((row) => unlocked(LOOKS.find((lookRow) => lookRow.id === row.look)));
  challenge = open[Math.floor(Math.random() * open.length)] || CHALLENGES[0];
  const target = LOOKS.find((row) => row.id === challenge.look);
  challengeEnds = Date.now() + 25000;
  mission.classList.remove('hidden');
  missionLabel.textContent = challenge.line;
  applyLook({
    id: 'plain',
    smooth: 0.12,
    glow: 0.1,
    warmth: 0.08,
    sat: 0.1,
    blush: 0.06,
    blushHue: 10,
    lips: 0.05,
    lipHue: 350,
    sparkle: 0.04,
  });
  studioStatus.textContent = `Match ${target.name}. You have 25 seconds.`;
}

function titleFor(score, challengeHit) {
  if (challengeHit && score >= 90) return 'Look locked in';
  if (score >= 92) return 'Main character';
  if (score >= 80) return 'Glow up complete';
  if (score >= 68) return 'Pretty close';
  return 'Keep mixing';
}

function finishSnap() {
  if (!result.hidden) return;
  if (!sourceReady) {
    studioStatus.textContent = 'Camera is not ready yet.';
    return;
  }
  const w = 360;
  const h = 480;
  shot.width = w;
  shot.height = h;
  paintBeautified(shotCtx, w, h);

  let score = Math.round(58 + currentGlow() * 28 + (face ? 8 : 0) + look.sparkle * 6);
  let note = 'Soft light, blush, and a little sparkle go a long way.';
  let earned = 1;
  if (mode === 'challenge' && challenge) {
    const target = LOOKS.find((row) => row.id === challenge.look);
    const near = closeness(look, target);
    score = Math.round(54 + near * 46);
    if (activeLook === target.id) score = Math.min(100, score + 6);
    note = near > 0.72
      ? `You matched ${target.name}. That is the assignment.`
      : `The brief was ${target.name}. Tweak blush, glow, and sparkle.`;
    earned = score >= 88 ? 3 : score >= 74 ? 2 : 1;
  } else {
    score = Math.min(100, score);
    note = activeLook === 'custom'
      ? 'Custom mix. Save it if this is your face now.'
      : `${LOOKS.find((row) => row.id === activeLook)?.name || 'This'} looks good on you.`;
    earned = score >= 90 ? 2 : 1;
  }
  save.stars += earned;
  persist();
  challenge = null;
  challengeEnds = 0;
  document.getElementById('result-kicker').textContent = mode === 'challenge' ? 'Challenge' : 'Studio snap';
  document.getElementById('result-title').textContent = titleFor(score, mode === 'challenge');
  document.getElementById('result-score').textContent = String(score);
  document.getElementById('result-note').textContent = note;
  document.getElementById('result-stars').textContent = `+${earned} ★   bank ${save.stars}`;
  show(result);
}

function savePhoto() {
  shot.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glow-up.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function returnToStudio() {
  show(studio);
  if (mode === 'challenge') startChallenge();
  if (!loop) loop = requestAnimationFrame(tick);
}

buildSliders();
buildLipPalette();
paintLooks();
persist();

document.getElementById('open-cam').addEventListener('click', () => {
  gateError.classList.add('hidden');
  startCamera();
});
document.getElementById('open-standin').addEventListener('click', startStandin);
document.getElementById('studio-back').addEventListener('click', () => {
  stopCamera();
  show(gate);
});
document.getElementById('cam-flip').addEventListener('click', () => {
  if (usingStandin) return;
  facing = facing === 'user' ? 'environment' : 'user';
  startCamera();
});
document.getElementById('mode-studio').addEventListener('click', () => setMode('studio'));
document.getElementById('mode-challenge').addEventListener('click', () => setMode('challenge'));
document.getElementById('shutter').addEventListener('click', finishSnap);
document.getElementById('again').addEventListener('click', returnToStudio);
document.getElementById('save-shot').addEventListener('click', savePhoto);
document.getElementById('compare').addEventListener('pointerdown', () => { compare = true; });
document.getElementById('compare').addEventListener('pointerup', () => { compare = false; });
document.getElementById('compare').addEventListener('pointerleave', () => { compare = false; });

looksRow.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-look]');
  if (!btn) return;
  const row = LOOKS.find((item) => item.id === btn.dataset.look);
  if (!row) return;
  if (!unlocked(row)) {
    studioStatus.textContent = `Need ★${row.unlock} to unlock ${row.name}.`;
    return;
  }
  applyLook(row);
});

lipPalette?.addEventListener('pointerdown', (event) => {
  const btn = event.target.closest('[data-lip]');
  if (!btn || compare || !result.hidden) return;
  const pot = LIPSTICKS.find((item) => item.id === btn.dataset.lip);
  if (!pot) return;
  event.preventDefault();
  activeLipstick = pot;
  lipPalette.querySelectorAll('.lip-stick').forEach((node) => {
    node.classList.toggle('on', node.dataset.lip === pot.id);
  });
  const point = canvasPoint(event);
  const rect = lastLayout?.lip;
  const over = rect && inLips(point.x, point.y, rect);
  stickDrag = {
    pot,
    pointerId: event.pointerId,
    last: over ? screenToLip(point.x, point.y, rect) : null,
    painted: false,
    moved: false,
  };
  btn.classList.add('dragging');
  showLipGhost(pot, event.clientX, event.clientY);
  btn.setPointerCapture(event.pointerId);
});

lipPalette?.addEventListener('pointermove', (event) => {
  if (!stickDrag || event.pointerId !== stickDrag.pointerId) return;
  showLipGhost(stickDrag.pot, event.clientX, event.clientY);
  const point = canvasPoint(event);
  const rect = lastLayout?.lip;
  if (!rect) return;
  const dx = event.movementX;
  const dy = event.movementY;
  if (dx * dx + dy * dy > 4) stickDrag.moved = true;
  if (!inLips(point.x, point.y, rect)) {
    stickDrag.last = null;
    return;
  }
  if (look.lips < 0.35) {
    look.lips = 0.7;
    syncSliders();
  }
  const local = screenToLip(point.x, point.y, rect);
  if (stickDrag.last) paintLipStroke(stickDrag.last, local, stickDrag.pot.color);
  else paintLipStroke(local, local, stickDrag.pot.color);
  stickDrag.last = local;
  stickDrag.painted = true;
});

function endStickDrag(event) {
  if (!stickDrag) return;
  const point = canvasPoint(event);
  const rect = lastLayout?.lip;
  const over = rect && inLips(point.x, point.y, rect);
  if (over && !stickDrag.painted) {
    if (!stickDrag.pot.color) clearLips();
    else fillLips(stickDrag.pot.color);
  }
  hideLipGhost();
  stickDrag = null;
  document.querySelectorAll('.lip-stick.dragging').forEach((node) => node.classList.remove('dragging'));
}

lipPalette?.addEventListener('pointerup', endStickDrag);
lipPalette?.addEventListener('pointercancel', endStickDrag);

function showLipGhost(pot, x, y) {
  if (!lipGhost) return;
  lipGhost.classList.remove('hidden');
  const bullet = lipGhost.querySelector('.ghost-bullet');
  if (bullet) {
    bullet.style.background = pot.color || '';
    bullet.style.backgroundImage = pot.color ? 'none' : '';
  }
  lipGhost.style.left = `${x}px`;
  lipGhost.style.top = `${y}px`;
}

function hideLipGhost() {
  lipGhost?.classList.add('hidden');
}

slidersEl.addEventListener('input', (event) => {
  const key = event.target.dataset.key;
  if (!key) return;
  look[key] = Number(event.target.value);
  activeLook = 'custom';
  paintLooks();
});

function canvasPoint(event) {
  const rect = view.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (view.width / Math.max(1, rect.width)),
    y: (event.clientY - rect.top) * (view.height / Math.max(1, rect.height)),
  };
}

function hitPiece(x, y) {
  if (!lastLayout) return null;
  const hits = lastLayout.pieces.filter((piece) => {
    const nx = (x - piece.x) / (piece.rx * 1.35);
    const ny = (y - piece.y) / (piece.ry * 1.35);
    return nx * nx + ny * ny <= 1;
  });
  hits.sort((a, b) => a.rx * a.ry - b.rx * b.ry);
  return hits[0] || null;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function setCursor() {
  if (coloring) view.style.cursor = 'crosshair';
  else if (drag) view.style.cursor = 'grabbing';
  else if (hoverId) view.style.cursor = 'grab';
  else if (lastLayout?.lip) view.style.cursor = 'crosshair';
  else view.style.cursor = 'default';
}

view.addEventListener('pointerdown', (event) => {
  if (compare || !result.hidden) return;
  const point = canvasPoint(event);
  const hit = hitPiece(point.x, point.y);
  if (hit) {
    event.preventDefault();
    drag = { id: hit.id, ox: point.x - hit.x, oy: point.y - hit.y };
    hoverId = hit.id;
    view.setPointerCapture(event.pointerId);
    setCursor();
    return;
  }
  const rect = lastLayout?.lip;
  if (rect && inLips(point.x, point.y, rect)) {
    event.preventDefault();
    const local = screenToLip(point.x, point.y, rect);
    coloring = { pointerId: event.pointerId, moved: false, last: local };
    if (look.lips < 0.35) {
      look.lips = 0.7;
      syncSliders();
    }
    paintLipStroke(local, local, activeLipstick.color);
    view.setPointerCapture(event.pointerId);
    setCursor();
  }
});

view.addEventListener('pointermove', (event) => {
  const point = canvasPoint(event);
  if (coloring) {
    const rect = lastLayout?.lip;
    if (!rect) return;
    const local = screenToLip(point.x, point.y, rect);
    const dx = local.x - coloring.last.x;
    const dy = local.y - coloring.last.y;
    if (dx * dx + dy * dy > 4) coloring.moved = true;
    paintLipStroke(coloring.last, local, activeLipstick.color);
    coloring.last = local;
    setCursor();
    return;
  }
  if (drag) {
    pins[drag.id] = {
      nx: clamp((point.x - drag.ox) / Math.max(1, view.width), 0.03, 0.97),
      ny: clamp((point.y - drag.oy) / Math.max(1, view.height), 0.06, 0.9),
    };
    setCursor();
    return;
  }
  hoverId = hitPiece(point.x, point.y)?.id || null;
  setCursor();
});

function endDrag(event) {
  if (coloring) {
    if (!coloring.moved) {
      if (activeLipstick.id === 'wipe') clearLips();
      else fillLips(activeLipstick.color);
    }
    coloring = null;
  }
  if (drag && event && view.hasPointerCapture?.(event.pointerId)) {
    view.releasePointerCapture(event.pointerId);
  }
  drag = null;
  setCursor();
}

view.addEventListener('pointerup', endDrag);
view.addEventListener('pointercancel', endDrag);
view.addEventListener('pointerleave', () => {
  if (!drag && !coloring) hoverId = null;
  setCursor();
});

document.getElementById('reset-place')?.addEventListener('click', () => {
  resetPins();
  studioStatus.textContent = 'Makeup is back on the face.';
});

window.addEventListener('resize', resizeView);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && stream) stream.getTracks().forEach((track) => { track.enabled = false; });
  else if (stream) stream.getTracks().forEach((track) => { track.enabled = true; });
});
