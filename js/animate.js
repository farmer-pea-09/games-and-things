const W = 640;
const H = 360;
const MAX_FRAMES = 16;
const PROJECT_KEY = 'gat-puppet-v1';
const CAST_KEY = 'gat-puppet-cast';
const NEXT_KEY = 'gat-puppet-next';
const WAIT_MS = 45000;
const MAX_CAST = 4;
const LINE = '#4a3428';

const SPRITE_KEY = {
  body: 'body',
  head: 'head',
  tail: 'tail',
  ear: 'ear',
  frontArm: 'arm',
  backArm: 'arm',
  frontFore: 'hand',
  backFore: 'hand',
  frontLeg: 'leg',
  backLeg: 'leg',
  frontShin: 'paw',
  backShin: 'paw',
};

const FIT = {
  body: { w: 148, h: 78, x: -36, y: -34 },
  head: { w: 96, h: 88, x: -6, y: -40 },
  ear: { w: 34, h: 42, x: -17, y: -38 },
  tail: { w: 30, h: 36, x: -15, y: 0 },
  arm: { w: 34 },
  hand: { w: 28 },
  leg: { w: 36 },
  paw: { w: 30 },
};

const SLICES = [
  { id: 'ear', parent: 'head', x0: 0.6, y0: 0, x1: 0.78, y1: 0.16, jx: 0.68, jy: 0.15 },
  { id: 'tail', parent: 'body', x0: 0, y0: 0.2, x1: 0.18, y1: 0.46, jx: 0.16, jy: 0.34 },
  { id: 'frontShin', parent: 'frontLeg', x0: 0.56, y0: 0.84, x1: 0.7, y1: 1, jx: 0.62, jy: 0.84 },
  { id: 'backShin', parent: 'backLeg', x0: 0.3, y0: 0.84, x1: 0.44, y1: 1, jx: 0.36, jy: 0.84 },
  { id: 'frontFore', parent: 'frontArm', x0: 0.7, y0: 0.36, x1: 0.84, y1: 0.52, jx: 0.72, jy: 0.38 },
  { id: 'backFore', parent: 'backArm', x0: 0.18, y0: 0.38, x1: 0.32, y1: 0.54, jx: 0.3, jy: 0.4 },
  { id: 'frontLeg', parent: 'body', x0: 0.54, y0: 0.64, x1: 0.68, y1: 0.86, jx: 0.6, jy: 0.64 },
  { id: 'backLeg', parent: 'body', x0: 0.28, y0: 0.64, x1: 0.42, y1: 0.86, jx: 0.34, jy: 0.64 },
  { id: 'frontArm', parent: 'body', x0: 0.58, y0: 0.28, x1: 0.72, y1: 0.46, jx: 0.62, jy: 0.3 },
  { id: 'backArm', parent: 'body', x0: 0.32, y0: 0.3, x1: 0.46, y1: 0.48, jx: 0.38, jy: 0.32 },
  { id: 'head', parent: 'body', x0: 0.7, y0: 0.02, x1: 1, y1: 0.38, jx: 0.72, jy: 0.26 },
  { id: 'body', parent: null, x0: 0, y0: 0, x1: 1, y1: 1, jx: 0.46, jy: 0.5 },
];

const COATS = {
  honey: { fur: '#f0b56a', dark: '#d9924a', belly: '#fff6e4' },
  teal: { fur: '#6ec8c0', dark: '#3aa39a', belly: '#e9fffb' },
  berry: { fur: '#e58aa6', dark: '#c45b7a', belly: '#ffe8f0' },
};

const PARTS = [
  { id: 'body', parent: null, x: 0, y: 0, name: 'Body', blob: { x: 6, y: 2, r: 48 } },
  { id: 'tail', parent: 'body', x: -58, y: -8, len: 34, thick: 14, name: 'Tail' },
  { id: 'backLeg', parent: 'body', x: -34, y: 16, len: 36, thick: 14, name: 'Far leg' },
  { id: 'backShin', parent: 'backLeg', x: 0, y: 36, len: 26, thick: 12, name: 'Far paw' },
  { id: 'backArm', parent: 'body', x: -18, y: -12, len: 26, thick: 12, name: 'Far arm' },
  { id: 'backFore', parent: 'backArm', x: 0, y: 26, len: 16, thick: 11, name: 'Far hand' },
  { id: 'frontLeg', parent: 'body', x: 32, y: 14, len: 36, thick: 15, name: 'Leg' },
  { id: 'frontShin', parent: 'frontLeg', x: 0, y: 36, len: 24, thick: 13, name: 'Paw' },
  { id: 'frontArm', parent: 'body', x: 16, y: -14, len: 30, thick: 13, name: 'Arm' },
  { id: 'frontFore', parent: 'frontArm', x: 0, y: 30, len: 16, thick: 12, name: 'Hand' },
  { id: 'head', parent: 'body', x: 52, y: -22, name: 'Head', blob: { x: 18, y: 2, r: 32 } },
  { id: 'ear', parent: 'head', x: 4, y: -20, len: 18, thick: 14, name: 'Ear' },
];

const LIMITS = {
  body: [-0.4, 0.4],
  head: [-0.8, 0.6],
  ear: [-0.6, 0.8],
  tail: [-2.8, 2.8],
  frontArm: [-2.8, 1.4],
  frontFore: [-1.4, 1.6],
  backArm: [-1.4, 2.2],
  backFore: [-1.5, 1.4],
  frontLeg: [-1.4, 1.2],
  frontShin: [-0.2, 1.4],
  backLeg: [-1.2, 1.4],
  backShin: [-0.2, 1.4],
};

const SPEC = Object.fromEntries(PARTS.map((part) => [part.id, part]));

const view = document.getElementById('view');
const viewCtx = view.getContext('2d');
const strip = document.getElementById('strip');
const paper = document.getElementById('paper');
const playBtn = document.getElementById('play');
const counter = document.getElementById('counter');
const onionBtn = document.getElementById('onion');
const fpsSelect = document.getElementById('fps');
const statusEl = document.getElementById('status');

let frames = [];
let index = 0;
let coat = 'honey';
let selected = 'frontArm';
let onion = true;
let playing = false;
let timer = 0;
let fps = 8;
let ready = false;
let dirty = false;
let hadSave = false;
let saving = false;
let saveTimer = 0;
let drag = null;
let cast = [];
let sprites = null;
let rig = null;
let footDrop = 70;
let activeId = null;
let making = false;
const undos = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function clone(pose) {
  return {
    x: pose.x,
    y: pose.y,
    flip: pose.flip,
    angles: { ...pose.angles },
  };
}

function currentRest() {
  const pose = restPose();
  if (!rig) return pose;
  Object.keys(pose.angles).forEach((key) => {
    pose.angles[key] = 0;
  });
  pose.y = Math.max(110, Math.min(210, 258 - footDrop));
  return pose;
}

function standFlat() {
  const standing = currentRest();
  frames.forEach((frame) => {
    frame.y = standing.y;
    frame.angles = { ...standing.angles };
  });
}

function standPuppy() {
  const standing = restPose();
  frames.forEach((frame) => {
    frame.y = standing.y;
    frame.angles = { ...standing.angles };
  });
}

function restPose() {
  return {
    x: 318,
    y: 196,
    flip: false,
    angles: {
      body: 0,
      head: -0.08,
      ear: 0.25,
      tail: 2.35,
      frontArm: -0.25,
      frontFore: 0.35,
      backArm: 0.55,
      backFore: -0.25,
      frontLeg: -0.12,
      frontShin: 0.18,
      backLeg: 0.28,
      backShin: 0.16,
    },
  };
}

function wavePoses() {
  const arms = [-0.3, -2.05, -1.15, -2.35, -0.85, -0.25];
  const hands = [0.3, -0.4, 0.5, -0.55, 0.35, 0.2];
  if (rig) {
    return arms.map((arm, i) => {
      const pose = currentRest();
      pose.angles.frontArm = arm;
      pose.angles.frontFore = hands[i];
      pose.angles.head = i % 2 ? 0.2 : -0.15;
      pose.y -= (i % 2) * 6;
      return pose;
    });
  }
  return arms.map((arm, i) => {
    const pose = restPose();
    pose.angles.frontArm = arm;
    pose.angles.frontFore = hands[i];
    pose.angles.head = i % 2 ? 0.12 : -0.18;
    pose.angles.tail = 2.15 + (i % 2) * 0.25;
    pose.y = 196 - (i % 2) * 6;
    return pose;
  });
}

function pose() {
  return frames[index];
}

function rot(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
}

function compute(current) {
  const world = {};
  function walk(id, parentAngle, ox, oy) {
    const angle = parentAngle + (current.angles[id] || 0);
    world[id] = { x: ox, y: oy, angle };
    PARTS.forEach((part) => {
      if (part.parent !== id) return;
      const spot = rig && rig[part.id] ? rig[part.id] : part;
      const joint = rot(spot.x, spot.y, angle);
      walk(part.id, angle, ox + joint.x, oy + joint.y);
    });
  }
  walk('body', 0, current.x, current.y);
  return world;
}

function coatColors() {
  return COATS[coat] || COATS.honey;
}

function strokeShape(ctx) {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawLimb(ctx, len, width, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-width / 2, 0, width, len, width * 0.45);
  ctx.fill();
  strokeShape(ctx);
}

function drawSprite(ctx, id, sprite) {
  const fit = FIT[SPRITE_KEY[id]] || FIT.arm;
  const h = fit.h || SPEC[id].len;
  const w = fit.w;
  const x = fit.x == null ? -w / 2 : fit.x;
  const y = fit.y == null ? 0 : fit.y;
  ctx.drawImage(sprite, x, y, w, h);
}

function drawPart(ctx, id) {
  if (rig && sprites && sprites[id]) {
    const spot = rig[id];
    ctx.drawImage(sprites[id], -spot.ax, -spot.ay);
    return;
  }
  if (sprites && sprites.whole) {
    if (id !== 'body') return;
    const sprite = sprites.whole;
    const h = 176;
    const w = h * (sprite.width / Math.max(1, sprite.height));
    ctx.drawImage(sprite, -w * 0.38, 72 - h, w, h);
    return;
  }
  const sprite = sprites && sprites[SPRITE_KEY[id]];
  if (sprite) {
    drawSprite(ctx, id, sprite);
    return;
  }
  const colors = coatColors();
  if (id === 'body') {
    ctx.fillStyle = colors.fur;
    ctx.beginPath();
    ctx.ellipse(4, 4, 66, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    strokeShape(ctx);
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.ellipse(16, 12, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    strokeShape(ctx);
    return;
  }
  if (id === 'head') {
    ctx.fillStyle = colors.fur;
    ctx.beginPath();
    ctx.ellipse(18, 2, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    strokeShape(ctx);
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.ellipse(42, 10, 16, 12, 0.15, 0, Math.PI * 2);
    ctx.fill();
    strokeShape(ctx);
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(50, 10, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(24, -6, 8, 0, Math.PI * 2);
    ctx.fill();
    strokeShape(ctx);
    ctx.fillStyle = LINE;
    ctx.beginPath();
    ctx.arc(26, -6, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(36, 12, 8, 0.1 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
    return;
  }
  if (id === 'tail') {
    drawLimb(ctx, 32, 14, colors.dark);
    return;
  }
  if (id === 'ear') {
    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.ellipse(0, -14, 9, 16, -0.35, 0, Math.PI * 2);
    ctx.fill();
    strokeShape(ctx);
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.ellipse(1, -12, 4, 8, -0.35, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const width = id.includes('Arm') || id.includes('Fore') ? 16 : 18;
  drawLimb(ctx, SPEC[id].len, width, colors.fur);
}

function drawPuppet(ctx, current, ghost) {
  const world = compute(current);
  ctx.save();
  ctx.translate(current.x, current.y);
  if (current.flip) ctx.scale(-1, 1);
  ctx.translate(-current.x, -current.y);
  if (ghost) ctx.globalAlpha = 0.28;
  PARTS.forEach((part) => {
    const node = world[part.id];
    ctx.save();
    ctx.translate(node.x, node.y);
    ctx.rotate(node.angle);
    drawPart(ctx, part.id);
    ctx.restore();
  });
  if (!ghost && !playing) {
    const node = world[selected];
    if (node) {
      ctx.fillStyle = '#e9c46a';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScene(ctx, current, ghosts) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#8fd4f2');
  sky.addColorStop(0.62, '#d7f3c8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f6d56a';
  ctx.beginPath();
  ctx.arc(86, 64, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8dce73';
  ctx.beginPath();
  ctx.ellipse(120, 250, 90, 28, 0, 0, Math.PI * 2);
  ctx.ellipse(520, 246, 110, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5eae62';
  ctx.fillRect(0, 262, W, H - 262);
  ctx.fillStyle = '#d8b48a';
  ctx.fillRect(0, 300, W, 18);
  ctx.fillStyle = 'rgba(74, 52, 40, 0.18)';
  ctx.beginPath();
  ctx.ellipse(current.x, 276, 46, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ghosts) drawPuppet(ctx, ghosts, true);
  drawPuppet(ctx, current, false);
}

function render() {
  const previous = frames.length > 1 ? frames[(index - 1 + frames.length) % frames.length] : null;
  drawScene(viewCtx, pose(), onion && !playing && previous && previous !== pose() ? previous : null);
}

function paintThumb(i) {
  const canvas = strip.children[i]?.querySelector('canvas');
  if (!canvas || !frames[i]) return;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  drawScene(ctx, frames[i], null);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function sync() {
  counter.textContent = `${index + 1} / ${frames.length}`;
  playBtn.textContent = playing ? 'Stop' : 'Play';
  playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  paper.classList.toggle('is-playing', playing);
  onionBtn.classList.toggle('active', onion);
  onionBtn.setAttribute('aria-pressed', onion ? 'true' : 'false');
  document.getElementById('flip').classList.toggle('active', Boolean(pose()?.flip));
  document.querySelectorAll('#parts button').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.part === selected);
  });
  document.querySelectorAll('#coats .coat').forEach((btn) => {
    btn.classList.toggle('on', !sprites && btn.dataset.coat === coat);
  });
  document.getElementById('drawn').classList.toggle('on', !sprites);
  document.querySelectorAll('#cast button').forEach((btn) => {
    btn.classList.toggle('on', Boolean(sprites) && btn.dataset.id === activeId);
  });
  [...strip.children].forEach((btn, i) => btn.classList.toggle('on', i === index));
  const active = strip.children[index];
  if (active) {
    const left = active.offsetLeft - (strip.clientWidth - active.clientWidth) / 2;
    strip.scrollLeft = Math.max(0, left);
  }
}

function rebuildStrip() {
  strip.replaceChildren();
  frames.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Frame ${i + 1}`);
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    btn.append(canvas);
    btn.addEventListener('click', () => selectFrame(i));
    strip.append(btn);
    paintThumb(i);
  });
  sync();
}

function stop() {
  playing = false;
  clearInterval(timer);
  timer = 0;
}

function play() {
  if (playing) return;
  playing = true;
  timer = setInterval(() => {
    if (frames.length > 1) index = (index + 1) % frames.length;
    render();
    sync();
  }, 1000 / fps);
  render();
  sync();
}

function togglePlay() {
  if (playing) {
    stop();
    render();
    sync();
    return;
  }
  play();
}

function selectFrame(i) {
  stop();
  index = i;
  render();
  sync();
}

function step(dir) {
  selectFrame((index + dir + frames.length) % frames.length);
}

function snapshot() {
  undos.push({ index, pose: clone(pose()) });
  if (undos.length > 20) undos.shift();
}

function undo() {
  const item = undos.pop();
  if (!item || !frames[item.index]) {
    setStatus('Nothing to undo.');
    return;
  }
  stop();
  index = item.index;
  frames[index] = item.pose;
  paintThumb(index);
  render();
  sync();
  scheduleSave();
}

function scheduleSave() {
  dirty = true;
  hadSave = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}

function saveNow() {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify({
      v: 1,
      fps,
      index,
      onion,
      coat,
      activeId,
      frames,
    }));
  } catch {
    setStatus('This cartoon is too big to keep in the browser.');
  }
}

function addFrame() {
  if (frames.length >= MAX_FRAMES) {
    setStatus('Sixteen frames is the limit.');
    return;
  }
  stop();
  frames.splice(index + 1, 0, clone(pose()));
  index += 1;
  rebuildStrip();
  render();
  scheduleSave();
}

function deleteFrame() {
  stop();
  if (frames.length === 1) {
    snapshot();
    frames[0] = currentRest();
    frames[0].flip = false;
    paintThumb(0);
    render();
    sync();
    scheduleSave();
    setStatus('Reset the only frame.');
    return;
  }
  frames.splice(index, 1);
  index = Math.min(index, frames.length - 1);
  undos.length = 0;
  rebuildStrip();
  render();
  scheduleSave();
}

function fresh() {
  if ((hadSave || dirty) && !window.confirm('Erase this cartoon and start again?')) return;
  stop();
  frames = [currentRest()];
  index = 0;
  undos.length = 0;
  rebuildStrip();
  render();
  scheduleSave();
  setStatus('Standing still. Drag the arm to start a pose.');
}

function loadExample() {
  if ((hadSave || dirty || frames.length > 1) && !window.confirm('Replace this cartoon with a wave?')) return;
  stop();
  frames = wavePoses();
  index = 0;
  undos.length = 0;
  rebuildStrip();
  render();
  scheduleSave();
  setStatus('A wave. Copy a frame and bend the arm somewhere new.');
}

function pointer(event) {
  const rect = view.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (W / rect.width),
    y: (event.clientY - rect.top) * (H / rect.height),
  };
}

function toRig(point, current) {
  if (!current.flip) return point;
  return { x: current.x - (point.x - current.x), y: point.y };
}

function hits(id, point, world) {
  const node = world[id];
  const spec = SPEC[id];
  const dx = point.x - node.x;
  const dy = point.y - node.y;
  const c = Math.cos(node.angle);
  const s = Math.sin(node.angle);
  const lx = dx * c + dy * s;
  const ly = -dx * s + dy * c;
  if (rig && sprites && sprites[id] && sprites[id]._alpha) {
    const spot = rig[id];
    const sx = Math.round(lx + spot.ax);
    const sy = Math.round(ly + spot.ay);
    const sprite = sprites[id];
    if (sx < 0 || sy < 0 || sx >= sprite.width || sy >= sprite.height) return false;
    return sprite._alpha[sy * sprite.width + sx] > 20;
  }
  if (spec.blob) {
    const cx = spec.blob.x;
    const cy = spec.blob.y;
    return (lx - cx) ** 2 + (ly - cy) ** 2 <= spec.blob.r ** 2;
  }
  const along = Math.max(0, Math.min(spec.len, ly));
  return lx * lx + (ly - along) ** 2 <= spec.thick ** 2;
}

function pickPart(point, world) {
  if (sprites && sprites.whole) {
    const node = world.body;
    const dx = point.x - node.x;
    const dy = point.y - node.y;
    return dx * dx + dy * dy < 130 * 130 ? 'body' : null;
  }
  for (let i = PARTS.length - 1; i >= 0; i -= 1) {
    const id = PARTS[i].id;
    if (hits(id, point, world)) return id;
  }
  return null;
}

function wrap(angle) {
  let next = angle;
  while (next > Math.PI) next -= Math.PI * 2;
  while (next < -Math.PI) next += Math.PI * 2;
  return next;
}

function clampAngle(id, angle) {
  const [min, max] = LIMITS[id] || [-Math.PI, Math.PI];
  return Math.max(min, Math.min(max, angle));
}

function onDown(event) {
  if (!ready || event.button !== 0) return;
  event.preventDefault();
  stop();
  const current = pose();
  const screen = pointer(event);
  const at = toRig(screen, current);
  const world = compute(current);
  const id = pickPart(at, world) || selected;
  selected = id;
  snapshot();
  if (id === 'body') {
    drag = { mode: 'move', sx: screen.x - current.x, sy: screen.y - current.y };
  } else {
    drag = { mode: 'rot', id };
  }
  try {
    view.setPointerCapture?.(event.pointerId);
  } catch {
    /* Some browsers refuse capture. */
  }
  setStatus(`Posing the ${SPEC[id].name.toLowerCase()}.`);
  render();
  sync();
}

function onMove(event) {
  if (!drag) return;
  const current = pose();
  const screen = pointer(event);
  const at = toRig(screen, current);
  if (drag.mode === 'move') {
    current.x = Math.max(90, Math.min(550, screen.x - drag.sx));
    current.y = Math.max(80, Math.min(240, screen.y - drag.sy));
  } else {
    const world = compute(current);
    const joint = world[drag.id];
    const parent = SPEC[drag.id].parent;
    const parentAngle = parent ? world[parent].angle : 0;
    const aim = -Math.atan2(at.x - joint.x, at.y - joint.y);
    current.angles[drag.id] = clampAngle(drag.id, wrap(aim - parentAngle));
  }
  render();
}

function onUp() {
  if (!drag) return;
  drag = null;
  paintThumb(index);
  render();
  sync();
  scheduleSave();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function savePng() {
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  drawScene(out.getContext('2d'), pose(), null);
  out.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, `puppet-${index + 1}.png`);
    setStatus('PNG saved.');
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveVideo() {
  if (saving) return;
  if (typeof MediaRecorder === 'undefined') {
    setStatus('This browser can play the cartoon, but it cannot save a video.');
    return;
  }
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((item) => MediaRecorder.isTypeSupported(item));
  if (!type) {
    setStatus('This browser can play the cartoon, but it cannot save a video.');
    return;
  }
  saving = true;
  stop();
  render();
  sync();
  setStatus('Saving video...');
  try {
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ctx = out.getContext('2d');
    const stream = out.captureStream(0);
    const rec = new MediaRecorder(stream, { mimeType: type });
    const chunks = [];
    rec.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise((resolve) => {
      rec.onstop = resolve;
    });
    rec.start(200);
    const track = stream.getVideoTracks()[0];
    const gap = 1000 / fps;
    for (let loop = 0; loop < 2; loop += 1) {
      for (const frame of frames) {
        drawScene(ctx, frame, null);
        track.requestFrame?.();
        await wait(gap);
      }
    }
    await wait(200);
    rec.stop();
    await stopped;
    downloadBlob(new Blob(chunks, { type: 'video/webm' }), 'puppet.webm');
    setStatus('Video saved.');
  } catch {
    setStatus('The video could not be saved.');
  } finally {
    saving = false;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The picture did not load.'));
    img.src = src;
  });
}

function knockBackground(data, w, h, limit) {
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, (h * w - 1) * 4];
  let br = 0;
  let bg = 0;
  let bb = 0;
  corners.forEach((i) => {
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
  });
  br /= 4;
  bg /= 4;
  bb /= 4;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x += 1) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 1) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    const dr = data[i] - br;
    const dg = data[i + 1] - bg;
    const db = data[i + 2] - bb;
    if (dr * dr + dg * dg + db * db > limit * limit) continue;
    data[i + 3] = 0;
    const x = p % w;
    const y = Math.floor(p / w);
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
}

function floodShadows(data, w, h) {
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x += 1) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += 1) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (data[i + 3] >= 16) {
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      if (max - min > 26 || max < 150 || max > 230) continue;
      data[i + 3] = 0;
    }
    const x = p % w;
    const y = Math.floor(p / w);
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
}

function clearBottomJunk(data, w, h) {
  const y0 = Math.max(0, h - 30);
  let empty = 0;
  let total = 0;
  for (let y = y0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      total += 1;
      if (data[(y * w + x) * 4 + 3] < 16) empty += 1;
    }
  }
  if (empty / total < 0.7) return;
  for (let y = y0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 16) continue;
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      if (max < 140 || max - min < 45) data[i + 3] = 0;
    }
  }
}

function extractPieces(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const w = canvas.width;
  const h = canvas.height;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 16) transparent += 1;
  if (transparent / (w * h) < 0.05) {
    const original = new Uint8ClampedArray(data);
    knockBackground(data, w, h, 32);
    let clear = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 16) clear += 1;
    if (clear / (w * h) < 0.08) {
      data.set(original);
      knockBackground(data, w, h, 58);
      clear = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 16) clear += 1;
    }
    if (clear / (w * h) < 0.08) {
      throw new Error('That picture had no empty background. Try Make again.');
    }
  }
  floodShadows(data, w, h);
  clearBottomJunk(data, w, h);
  const labels = new Int32Array(w * h);
  const blobs = [];
  let count = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const start = y * w + x;
      if (labels[start] || data[start * 4 + 3] < 16) continue;
      count += 1;
      const stack = [start];
      labels[start] = count;
      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      while (stack.length) {
        const p = stack.pop();
        const px = p % w;
        const py = Math.floor(p / w);
        area += 1;
        sumX += px;
        sumY += py;
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
        const next = [p - 1, p + 1, p - w, p + w];
        if (px === 0) next[0] = -1;
        if (px === w - 1) next[1] = -1;
        if (py === 0) next[2] = -1;
        if (py === h - 1) next[3] = -1;
        next.forEach((n) => {
          if (n < 0 || labels[n] || data[n * 4 + 3] < 16) return;
          labels[n] = count;
          stack.push(n);
        });
      }
      if (area < 100) continue;
      blobs.push({
        id: count,
        area,
        minX,
        minY,
        maxX,
        maxY,
        cx: sumX / area,
        cy: sumY / area,
      });
    }
  }
  const pieces = blobs.filter((blob) => !((blob.maxY > h - 40) && (blob.maxY - blob.minY) < 28));
  if (!pieces.length) throw new Error('That picture had no puppet to cut out. Try Make again.');

  function crop(blob) {
    const piece = document.createElement('canvas');
    piece.width = blob.maxX - blob.minX + 1;
    piece.height = blob.maxY - blob.minY + 1;
    const out = piece.getContext('2d').createImageData(piece.width, piece.height);
    for (let yy = blob.minY; yy <= blob.maxY; yy += 1) {
      for (let xx = blob.minX; xx <= blob.maxX; xx += 1) {
        if (labels[yy * w + xx] !== blob.id) continue;
        const src = (yy * w + xx) * 4;
        const dst = ((yy - blob.minY) * piece.width + (xx - blob.minX)) * 4;
        out.data[dst] = data[src];
        out.data[dst + 1] = data[src + 1];
        out.data[dst + 2] = data[src + 2];
        out.data[dst + 3] = data[src + 3];
      }
    }
    piece.getContext('2d').putImageData(out, 0, 0);
    return piece;
  }

  const biggest = pieces.slice().sort((a, b) => b.area - a.area)[0];
  return sliceCutout(crop(biggest));
}

function sliceCutout(cutout) {
  const targetH = 210;
  const scale = targetH / cutout.height;
  const sw = Math.max(1, Math.round(cutout.width * scale));
  const sh = targetH;
  const source = document.createElement('canvas');
  source.width = sw;
  source.height = sh;
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  sourceCtx.drawImage(cutout, 0, 0, sw, sh);
  const pixels = sourceCtx.getImageData(0, 0, sw, sh);
  const pd = pixels.data;
  const owner = new Int16Array(sw * sh);
  owner.fill(-1);
  let any = false;
  let bottom = 0;
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const p = y * sw + x;
      if (pd[p * 4 + 3] < 16) continue;
      any = true;
      if (y > bottom) bottom = y;
      const fx = x / sw;
      const fy = y / sh;
      let found = -1;
      for (let i = 0; i < SLICES.length; i += 1) {
        const zone = SLICES[i];
        if (fx >= zone.x0 && fx < zone.x1 && fy >= zone.y0 && fy < zone.y1) {
          found = i;
          break;
        }
      }
      if (found < 0) found = SLICES.findIndex((zone) => zone.id === 'body');
      owner[p] = found;
    }
  }
  if (!any) throw new Error('That picture had no puppet to cut out. Try Make again.');
  const spritesOut = {};
  const rigOut = {};
  const joints = {};
  SLICES.forEach((slice) => {
    joints[slice.id] = { x: Math.round(slice.jx * sw), y: Math.round(slice.jy * sh) };
  });
  SLICES.forEach((slice, index) => {
    const piece = document.createElement('canvas');
    piece.width = sw;
    piece.height = sh;
    const out = piece.getContext('2d').createImageData(sw, sh);
    const alpha = new Uint8Array(sw * sh);
    for (let p = 0; p < owner.length; p += 1) {
      if (owner[p] !== index) continue;
      const src = p * 4;
      out.data[src] = pd[src];
      out.data[src + 1] = pd[src + 1];
      out.data[src + 2] = pd[src + 2];
      out.data[src + 3] = pd[src + 3];
      alpha[p] = pd[src + 3];
    }
    piece.getContext('2d').putImageData(out, 0, 0);
    piece._alpha = alpha;
    spritesOut[slice.id] = piece;
    const joint = joints[slice.id];
    const parent = slice.parent ? joints[slice.parent] : joint;
    rigOut[slice.id] = {
      x: slice.parent ? joint.x - parent.x : 0,
      y: slice.parent ? joint.y - parent.y : 0,
      ax: joint.x,
      ay: joint.y,
    };
  });
  return {
    sprites: spritesOut,
    rig: rigOut,
    footDrop: bottom - joints.body.y,
    source,
  };
}

function ideaText() {
  return document.getElementById('idea').value.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function puppetName(idea) {
  return idea.length > 24 ? `${idea.slice(0, 23)}…` : idea;
}

function buildPrompt() {
  return [
    ideaText(),
    'one character, full body, side view facing right, standing',
    'it has a head, two ears, a body, a tail, two arms, two hands, two legs, and two paws',
    'simple paper cut-out, thick dark outline, flat solid colors',
    'centered on a plain pure white background, no ground, no shadow, no scenery, no text',
    'family-friendly',
  ].join(', ');
}

function waitLeft() {
  return Math.max(0, (Number(localStorage.getItem(NEXT_KEY)) || 0) - Date.now());
}

function saveCast() {
  try {
    localStorage.setItem(CAST_KEY, JSON.stringify(cast));
  } catch {
    cast = cast.slice(-2);
    try {
      localStorage.setItem(CAST_KEY, JSON.stringify(cast));
    } catch {
      setStatus('The browser could not keep this puppet. It still works until you leave the page.');
    }
  }
}

function paintCast() {
  const box = document.getElementById('cast');
  box.replaceChildren();
  cast.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = item.id;
    btn.setAttribute('aria-label', item.name);
    const img = document.createElement('img');
    img.alt = '';
    img.src = item.parts.source || item.parts.head || item.parts.whole || item.parts.body || '';
    btn.append(img);
    btn.addEventListener('click', () => {
      applyCast(item.id).then((kind) => {
        if (kind === 'rig') standFlat();
        render();
        rebuildStrip();
        scheduleSave();
        sync();
        setStatus(kind === 'whole'
          ? `${item.name} is on the stage. Drag it to move it.`
          : `${item.name} is ready. Drag the head, a leg, or the tail.`);
      }).catch(() => {
        setStatus('That puppet could not be opened.');
      });
    });
    box.append(btn);
  });
}

function loadCast() {
  try {
    const data = JSON.parse(localStorage.getItem(CAST_KEY) || '[]');
    if (Array.isArray(data)) {
      cast = data.filter((item) => item && item.id && item.parts).slice(-MAX_CAST);
    }
  } catch {
    cast = [];
  }
  paintCast();
}

async function spritesFromParts(parts) {
  const next = {};
  await Promise.all(Object.entries(parts).map(async ([name, url]) => {
    if (!url) return;
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    next[name] = canvas;
  }));
  return next;
}

async function applyCast(id) {
  const item = cast.find((entry) => entry.id === id);
  if (!item) {
    sprites = null;
    rig = null;
    activeId = null;
    return 'none';
  }
  if (item.parts.source) {
    const built = await Promise.resolve(loadImage(item.parts.source)).then((img) => extractPieces(img));
    sprites = built.sprites;
    rig = built.rig;
    footDrop = built.footDrop;
    activeId = id;
    selected = 'frontArm';
    return 'rig';
  }
  rig = null;
  sprites = await spritesFromParts(item.parts);
  activeId = id;
  if (sprites.whole) selected = 'body';
  return sprites.whole ? 'whole' : 'parts';
}

async function generatePuppet() {
  if (making) return;
  const idea = ideaText();
  if (!idea) {
    setStatus('Type what the puppet is. It can be anything.');
    return;
  }
  const left = Math.ceil(waitLeft() / 1000);
  if (left > 0) {
    setStatus(`The picture maker needs a rest. Try again in ${left} seconds.`);
    return;
  }
  const button = document.getElementById('generate');
  making = true;
  button.disabled = true;
  button.textContent = 'Making';
  setStatus('Making the puppet pieces. This can take a little while.');
  let sent = false;
  try {
    const seed = Math.floor(Math.random() * 1e9);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(buildPrompt())}?width=512&height=512&seed=${seed}&nologo=true&safe=true&model=flux`;
    const res = await fetch(url);
    sent = true;
    if (res.status === 402) {
      const retry = Number(res.headers.get('Retry-After')) || 45;
      localStorage.setItem(NEXT_KEY, String(Date.now() + retry * 1000));
      throw new Error(`The picture maker needs a rest. Try again in ${retry} seconds.`);
    }
    localStorage.setItem(NEXT_KEY, String(Date.now() + WAIT_MS));
    if (!res.ok) throw new Error('The picture maker did not answer. Try again in a minute.');
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) throw new Error('The picture maker did not send a picture.');
    const blobUrl = URL.createObjectURL(blob);
    let sheet;
    try {
      sheet = await loadImage(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
    const built = extractPieces(sheet);
    const name = puppetName(idea);
    const item = {
      id: String(Date.now()),
      name,
      parts: { source: built.source.toDataURL('image/png') },
    };
    cast.push(item);
    cast = cast.slice(-MAX_CAST);
    sprites = built.sprites;
    rig = built.rig;
    footDrop = built.footDrop;
    activeId = item.id;
    selected = 'frontArm';
    standFlat();
    saveCast();
    paintCast();
    render();
    rebuildStrip();
    scheduleSave();
    sync();
    setStatus(`${name} is ready. Drag the head, a leg, or the tail.`);
  } catch (error) {
    if (!sent) localStorage.removeItem(NEXT_KEY);
    setStatus(error.message || 'The puppet could not be made.');
  } finally {
    making = false;
    button.disabled = false;
    button.textContent = 'Make';
  }
}

function bindMaker() {
  document.getElementById('maker').addEventListener('submit', (event) => {
    event.preventDefault();
    generatePuppet();
  });
  document.getElementById('drawn').addEventListener('click', () => {
    const wasGenerated = Boolean(sprites);
    sprites = null;
    rig = null;
    activeId = null;
    if (wasGenerated) standPuppy();
    render();
    rebuildStrip();
    scheduleSave();
    sync();
    setStatus('Drawn puppy. Pick a coat, then drag the parts.');
  });
}

function bindFullscreen() {
  const btn = document.getElementById('fullscreen-btn');
  if (!btn) return;
  const fullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const syncLabel = () => {
    btn.textContent = fullscreen() ? '× Exit Full Screen' : '⛶ Full Screen';
  };
  btn.addEventListener('click', async () => {
    try {
      if (fullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else document.webkitExitFullscreen?.();
      } else {
        const root = document.documentElement;
        if (root.requestFullscreen) await root.requestFullscreen();
        else root.webkitRequestFullscreen?.();
      }
    } catch {
      /* Fullscreen can be blocked outside a user gesture. */
    }
  });
  document.addEventListener('fullscreenchange', syncLabel);
  document.addEventListener('webkitfullscreenchange', syncLabel);
}

function bindParts() {
  const box = document.getElementById('parts');
  PARTS.forEach((part) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.part = part.id;
    btn.textContent = part.name;
    btn.addEventListener('click', () => {
      if (sprites && sprites.whole) {
        selected = 'body';
        setStatus('This puppet is one piece. Drag it to move.');
        sync();
        return;
      }
      selected = part.id;
      setStatus(`${part.name} selected. Drag it on the stage.`);
      sync();
    });
    box.append(btn);
  });
  const coats = document.getElementById('coats');
  Object.entries(COATS).forEach(([id, colors]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'coat';
    btn.dataset.coat = id;
    btn.style.background = colors.fur;
    btn.setAttribute('aria-label', `${id} coat`);
    btn.addEventListener('click', () => {
      coat = id;
      render();
      rebuildStrip();
      scheduleSave();
      if (sprites) setStatus('This puppet keeps the colors it was made with. Show the drawn puppy to use a coat.');
    });
    coats.append(btn);
  });
}

function bind() {
  bindFullscreen();
  bindParts();
  bindMaker();
  document.getElementById('add').addEventListener('click', () => addFrame());
  document.getElementById('copy').addEventListener('click', () => addFrame());
  document.getElementById('del').addEventListener('click', deleteFrame);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('fresh').addEventListener('click', fresh);
  document.getElementById('example').addEventListener('click', loadExample);
  document.getElementById('flip').addEventListener('click', () => {
    snapshot();
    pose().flip = !pose().flip;
    render();
    paintThumb(index);
    sync();
    scheduleSave();
  });
  document.getElementById('prev').addEventListener('click', () => step(-1));
  document.getElementById('next').addEventListener('click', () => step(1));
  playBtn.addEventListener('click', togglePlay);
  onionBtn.addEventListener('click', () => {
    onion = !onion;
    render();
    sync();
    if (hadSave) scheduleSave();
  });
  fpsSelect.addEventListener('change', () => {
    fps = Number(fpsSelect.value);
    if (playing) {
      stop();
      play();
    }
    if (hadSave) scheduleSave();
  });
  document.getElementById('png').addEventListener('click', savePng);
  document.getElementById('video').addEventListener('click', () => {
    saveVideo();
  });
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);
  window.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if ((event.key === 'z' || event.key === 'Z') && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      undo();
    }
  });
}

function restore(data) {
  if (!Array.isArray(data.frames) || !data.frames.length) throw new Error('empty');
  frames = data.frames.slice(0, MAX_FRAMES).map((item) => ({
    x: Number(item.x) || 318,
    y: Number(item.y) || 186,
    flip: Boolean(item.flip),
    angles: { ...restPose().angles, ...(item.angles || {}) },
  }));
  index = Math.min(Math.max(0, data.index || 0), frames.length - 1);
  if ([4, 8, 12, 24].includes(Number(data.fps))) fps = Number(data.fps);
  onion = data.onion !== false;
  if (COATS[data.coat]) coat = data.coat;
  activeId = typeof data.activeId === 'string' ? data.activeId : null;
  fpsSelect.value = String(fps);
  hadSave = true;
}

async function init() {
  bind();
  loadCast();
  frames = [restPose()];
  let savedId = null;
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (raw) {
      restore(JSON.parse(raw));
      savedId = activeId;
    }
  } catch {
    frames = [restPose()];
    index = 0;
    hadSave = false;
    activeId = null;
  }
  try {
    if (savedId) await applyCast(savedId);
  } catch {
    sprites = null;
    rig = null;
    activeId = null;
  }
  if (!hadSave) setStatus('Describe any puppet and press Make. Or drag the drawn puppy.');
  else if (rig) setStatus('Your puppet is back. Drag the head, a leg, or the tail.');
  else if (sprites && sprites.whole) setStatus('Your puppet is back. Drag it to move it.');
  else if (sprites) setStatus('Your puppet is back. Drag the parts.');
  rebuildStrip();
  render();
  sync();
  ready = true;
}

init();
