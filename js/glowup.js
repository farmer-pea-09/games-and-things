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

function applyLook(row) {
  for (const key of ['smooth', 'glow', 'warmth', 'sat', 'blush', 'blushHue', 'lips', 'lipHue', 'sparkle']) {
    look[key] = row[key];
  }
  activeLook = row.id;
  syncSliders();
  paintLooks();
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

function drawMakeup(g, box, w, h) {
  const { cx, cy, w: fw, h: fh } = box;
  if (look.blush > 0.04) {
    g.save();
    g.globalCompositeOperation = 'soft-light';
    for (const side of [-1, 1]) {
      const x = cx + side * fw * 0.28;
      const y = cy + fh * 0.08;
      const rad = fw * (0.16 + look.blush * 0.08);
      const grad = g.createRadialGradient(x, y, 4, x, y, rad);
      grad.addColorStop(0, hsl(look.blushHue, 78, 62, 0.18 + look.blush * 0.55));
      grad.addColorStop(1, hsl(look.blushHue, 70, 60, 0));
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(x, y, rad, rad * 0.72, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  if (look.lips > 0.04) {
    const lx = cx;
    const ly = cy + fh * 0.28;
    const lw = fw * (0.16 + look.lips * 0.04);
    const lh = fh * (0.055 + look.lips * 0.02);
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = hsl(look.lipHue, 72, 48, 0.18 + look.lips * 0.45);
    g.beginPath();
    g.ellipse(lx, ly, lw, lh, 0, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'screen';
    g.fillStyle = hsl(look.lipHue, 70, 70, 0.08 + look.lips * 0.18);
    g.beginPath();
    g.ellipse(lx, ly - lh * 0.15, lw * 0.7, lh * 0.35, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  if (look.glow > 0.2) {
    g.save();
    g.globalCompositeOperation = 'soft-light';
    const hx = cx;
    const hy = cy - fh * 0.12;
    const grad = g.createRadialGradient(hx, hy, 2, hx, hy, fw * 0.22);
    grad.addColorStop(0, `rgba(255, 236, 210, ${0.08 + look.glow * 0.22})`);
    grad.addColorStop(1, 'rgba(255, 236, 210, 0)');
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(hx, hy, fw * 0.18, fh * 0.1, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  const vig = g.createRadialGradient(w / 2, h * 0.42, w * 0.18, w / 2, h * 0.45, w * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(20, 6, 16, ${0.18 + look.glow * 0.12})`);
  g.fillStyle = vig;
  g.fillRect(0, 0, w, h);
}

function seedSparkles(box, count) {
  sparkles = [];
  for (let i = 0; i < count; i += 1) {
    sparkles.push({
      x: box.x + Math.random() * box.w,
      y: box.y + Math.random() * box.h * 0.85,
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
    const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(t * spec.speed + spec.phase));
    g.fillStyle = `rgba(255, 246, 210, ${twinkle * (0.35 + look.sparkle * 0.65)})`;
    g.beginPath();
    g.arc(spec.x, spec.y, spec.r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(spec.x - spec.r * 2.2, spec.y);
    g.lineTo(spec.x + spec.r * 2.2, spec.y);
    g.moveTo(spec.x, spec.y - spec.r * 2.2);
    g.lineTo(spec.x, spec.y + spec.r * 2.2);
    g.stroke();
  }
  g.restore();
}

function drawStandinFace(t) {
  const w = standin.width;
  const h = standin.height;
  const g = standinCtx;
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#5b3a7a');
  grad.addColorStop(1, '#2a1638');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#6d8f4e';
  g.fillRect(0, h * 0.72, w, h * 0.28);
  g.fillStyle = '#8fb86a';
  g.beginPath();
  g.ellipse(w * 0.2, h * 0.78, 90, 40, 0, 0, Math.PI * 2);
  g.ellipse(w * 0.8, h * 0.8, 110, 50, 0, 0, Math.PI * 2);
  g.fill();

  const cx = w * 0.5 + Math.sin(t / 900) * 6;
  const cy = h * 0.46 + Math.cos(t / 1100) * 4;
  g.fillStyle = '#2b1a14';
  g.beginPath();
  g.ellipse(cx, cy - 70, 118, 130, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f0c3a3';
  g.beginPath();
  g.ellipse(cx, cy, 92, 112, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2b1a14';
  g.beginPath();
  g.ellipse(cx, cy - 78, 100, 54, 0, Math.PI, Math.PI * 2);
  g.fill();
  g.fillStyle = '#3d261c';
  g.beginPath();
  g.moveTo(cx - 70, cy - 20);
  g.quadraticCurveTo(cx, cy - 88, cx + 70, cy - 20);
  g.lineTo(cx + 62, cy - 8);
  g.quadraticCurveTo(cx, cy - 62, cx - 62, cy - 8);
  g.fill();

  const blink = Math.sin(t / 180) > 0.96 ? 2 : 8;
  g.fillStyle = '#2a1812';
  g.beginPath();
  g.ellipse(cx - 32, cy - 8, 10, blink, 0, 0, Math.PI * 2);
  g.ellipse(cx + 32, cy - 8, 10, blink, 0, 0, Math.PI * 2);
  g.fill();
  if (blink > 4) {
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(cx - 29, cy - 11, 3, 0, Math.PI * 2);
    g.arc(cx + 35, cy - 11, 3, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = '#c98474';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - 18, cy + 38);
  g.quadraticCurveTo(cx, cy + 50, cx + 18, cy + 38);
  g.stroke();
  g.fillStyle = '#d9a07c';
  g.beginPath();
  g.ellipse(cx, cy + 16, 14, 10, 0, 0, Math.PI * 2);
  g.fill();
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
  drawMakeup(g, mapped, dw, dh);
  if (sparkles.length < 8 || frame % 40 === 0) {
    seedSparkles(mapped, 10 + Math.round(look.sparkle * 18));
  }
  drawSparkles(g, frame);
  g.restore();
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
  paintBeautified(ctx, view.width, view.height, { plain: compare });
  glowMeter.style.width = `${Math.round(currentGlow() * 100)}%`;
  if (sourceReady) {
    studioStatus.textContent = compare
      ? 'Before — release to glow again'
      : face
        ? 'Face found. Stack a look, then snap.'
        : usingStandin
          ? 'Practice face ready. Pick a look.'
          : 'Center your face in the light.';
  }
  if (mode === 'challenge' && challenge) {
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

slidersEl.addEventListener('input', (event) => {
  const key = event.target.dataset.key;
  if (!key) return;
  look[key] = Number(event.target.value);
  activeLook = 'custom';
  paintLooks();
});

window.addEventListener('resize', resizeView);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && stream) stream.getTracks().forEach((track) => { track.enabled = false; });
  else if (stream) stream.getTracks().forEach((track) => { track.enabled = true; });
});
