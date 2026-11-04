const W = 640;
const H = 360;
const MAX_FRAMES = 16;
const PROJECT_KEY = 'gat-puppet-v1';
const LINE = '#4a3428';

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
  tail: [1.2, 2.8],
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
      const joint = rot(part.x, part.y, angle);
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

function drawPart(ctx, id) {
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
  document.querySelectorAll('#coats button').forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.coat === coat);
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
    frames[0] = restPose();
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
  frames = [restPose()];
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
  if (spec.blob) {
    const cx = spec.blob.x;
    const cy = spec.blob.y;
    return (lx - cx) ** 2 + (ly - cy) ** 2 <= spec.blob.r ** 2;
  }
  const along = Math.max(0, Math.min(spec.len, ly));
  return lx * lx + (ly - along) ** 2 <= spec.thick ** 2;
}

function pickPart(point, world) {
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
    current.y = Math.max(120, Math.min(220, screen.y - drag.sy));
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
    });
    coats.append(btn);
  });
}

function bind() {
  bindFullscreen();
  bindParts();
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
  fpsSelect.value = String(fps);
  hadSave = true;
}

function init() {
  bind();
  frames = [restPose()];
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (raw) restore(JSON.parse(raw));
  } catch {
    frames = [restPose()];
    index = 0;
    hadSave = false;
  }
  if (!hadSave) setStatus('Drag the arm, the head, or a leg. Copy the frame to make the next pose.');
  rebuildStrip();
  render();
  ready = true;
}

init();
