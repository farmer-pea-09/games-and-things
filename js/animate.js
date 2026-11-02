const W = 640;
const H = 360;
const PAPER = '#f4efe6';
const MAX_FRAMES = 12;
const PROJECT_KEY = 'gat-flipbook';
const REF_KEY = 'gat-character-ref';
const REF_NAME_KEY = 'gat-character-ref-name';
const COLORS = [
  '#1a120c', '#fff8ef', '#e94560', '#e9c46a', '#f4a261', '#2a9d8f',
  '#40916c', '#4cc9f0', '#4361ee', '#7b2cbf', '#f15bb5', '#6d4c41',
];

const view = document.getElementById('view');
const viewCtx = view.getContext('2d');
const strip = document.getElementById('strip');
const paper = document.getElementById('paper');
const playBtn = document.getElementById('play');
const counter = document.getElementById('counter');
const onionBtn = document.getElementById('onion');
const guideBtn = document.getElementById('guide');
const stampBtn = document.getElementById('stamp');
const fpsSelect = document.getElementById('fps');
const status = document.getElementById('status');

let frames = [];
let index = 0;
let tool = 'draw';
let color = COLORS[0];
let size = 10;
let onion = true;
let playing = false;
let timer = 0;
let fps = 8;
let drawing = false;
let last = null;
let ready = false;
let dirty = false;
let hadSave = false;
let saving = false;
let saveTimer = 0;
let showRef = false;
let refImage = null;
const undos = [];

function makeFrame() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.getContext('2d', { willReadFrequently: true });
  return canvas;
}

function frameCtx(frame) {
  return frame.getContext('2d', { willReadFrequently: true });
}

function setStatus(text) {
  status.textContent = text;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });
}

function drawContain(ctx, img) {
  const scale = Math.min(W / img.width, H / img.height) * 0.92;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function demoFrames() {
  const poses = [
    { cy: 92, rx: 34, ry: 36 },
    { cy: 168, rx: 34, ry: 36 },
    { cy: 228, rx: 48, ry: 22 },
    { cy: 150, rx: 32, ry: 40 },
  ];
  return poses.map((pose) => {
    const frame = makeFrame();
    const ctx = frameCtx(frame);
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, 252);
    ctx.lineTo(550, 252);
    ctx.stroke();
    ctx.fillStyle = 'rgba(26, 18, 12, 0.18)';
    ctx.beginPath();
    ctx.ellipse(320, 252, 40, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.ellipse(320, pose.cy, pose.rx, pose.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8ef';
    ctx.beginPath();
    ctx.ellipse(320, pose.cy + pose.ry * 0.15, pose.rx * 0.45, pose.ry * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a120c';
    ctx.beginPath();
    ctx.arc(308, pose.cy - 6, 4, 0, Math.PI * 2);
    ctx.arc(332, pose.cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a120c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(320, pose.cy + 2, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    return frame;
  });
}

function render() {
  viewCtx.fillStyle = PAPER;
  viewCtx.fillRect(0, 0, W, H);
  if (showRef && refImage && !playing) {
    viewCtx.save();
    viewCtx.globalAlpha = 0.42;
    drawContain(viewCtx, refImage);
    viewCtx.restore();
  }
  if (onion && !playing && frames.length > 1) {
    const prev = (index - 1 + frames.length) % frames.length;
    viewCtx.save();
    viewCtx.globalAlpha = 0.28;
    viewCtx.drawImage(frames[prev], 0, 0);
    viewCtx.restore();
  }
  if (frames[index]) viewCtx.drawImage(frames[index], 0, 0);
}

function paintThumb(i) {
  const canvas = strip.children[i]?.querySelector('canvas');
  if (!canvas || !frames[i]) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height);
}

function sync() {
  counter.textContent = `${index + 1} / ${frames.length}`;
  playBtn.textContent = playing ? 'Stop' : 'Play';
  playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  paper.classList.toggle('is-playing', playing);
  onionBtn.classList.toggle('active', onion);
  onionBtn.setAttribute('aria-pressed', onion ? 'true' : 'false');
  guideBtn.disabled = !refImage;
  guideBtn.textContent = !refImage ? 'No guide' : showRef ? 'Guide on' : 'Guide off';
  guideBtn.setAttribute('aria-pressed', showRef ? 'true' : 'false');
  stampBtn.disabled = !refImage;
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
  const data = frameCtx(frames[index]).getImageData(0, 0, W, H);
  undos.push({ index, data });
  if (undos.length > 15) undos.shift();
}

function undo() {
  const item = undos.pop();
  if (!item || !frames[item.index]) {
    setStatus('Nothing to undo.');
    return;
  }
  stop();
  index = item.index;
  frameCtx(frames[index]).putImageData(item.data, 0, 0);
  paintThumb(index);
  render();
  sync();
  scheduleSave();
}

function commit() {
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
  const payload = {
    v: 1,
    fps,
    index,
    onion,
    frames: frames.map((frame) => frame.toDataURL('image/png')),
  };
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(payload));
  } catch {
    setStatus('This flipbook is too big to keep in the browser.');
  }
}

async function frameFromUrl(url) {
  const frame = makeFrame();
  const img = await loadImage(url);
  frameCtx(frame).drawImage(img, 0, 0, W, H);
  return frame;
}

async function restore(data) {
  const loaded = [];
  for (const url of data.frames || []) {
    try {
      loaded.push(await frameFromUrl(url));
    } catch {
      /* Skip a frame that no longer loads. */
    }
  }
  if (!loaded.length) throw new Error('empty');
  frames = loaded.slice(0, MAX_FRAMES);
  index = Math.min(Math.max(0, data.index || 0), frames.length - 1);
  if ([4, 8, 12, 24].includes(Number(data.fps))) fps = Number(data.fps);
  onion = data.onion !== false;
  fpsSelect.value = String(fps);
  hadSave = true;
}

function addFrame(copy) {
  if (frames.length >= MAX_FRAMES) {
    setStatus('Twelve frames is the limit.');
    return;
  }
  stop();
  const frame = makeFrame();
  if (copy) frameCtx(frame).drawImage(frames[index], 0, 0);
  frames.splice(index + 1, 0, frame);
  index += 1;
  rebuildStrip();
  render();
  scheduleSave();
}

function deleteFrame() {
  stop();
  if (frames.length === 1) {
    snapshot();
    frameCtx(frames[0]).clearRect(0, 0, W, H);
    commit();
    setStatus('Cleared the only frame.');
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
  if ((hadSave || dirty) && !window.confirm('Erase this flipbook and start blank?')) return;
  stop();
  frames = [makeFrame()];
  index = 0;
  undos.length = 0;
  rebuildStrip();
  render();
  scheduleSave();
  setStatus('Blank frame. Draw the first pose.');
}

function setTool(next) {
  tool = next;
  document.querySelectorAll('.tool').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  view.classList.toggle('fill-tool', tool === 'fill');
}

function point(event) {
  const rect = view.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(W - 1, (event.clientX - rect.left) * (W / rect.width))),
    y: Math.max(0, Math.min(H - 1, (event.clientY - rect.top) * (H / rect.height))),
  };
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function flood(frame, x, y, fill) {
  const ctx = frameCtx(frame);
  const img = ctx.getImageData(0, 0, W, H);
  const data = img.data;
  const sx = Math.floor(x);
  const sy = Math.floor(y);
  const start = (sy * W + sx) * 4;
  const sr = data[start];
  const sg = data[start + 1];
  const sb = data[start + 2];
  const sa = data[start + 3];
  const near = (r, g, b, a, cr, cg, cb, ca) => (
    Math.abs(r - cr) <= 18
    && Math.abs(g - cg) <= 18
    && Math.abs(b - cb) <= 18
    && Math.abs(a - ca) <= 18
  );
  if (near(sr, sg, sb, sa, fill.r, fill.g, fill.b, 255)) return;
  const seen = new Uint8Array(W * H);
  const stack = [sy * W + sx];
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!near(data[i], data[i + 1], data[i + 2], data[i + 3], sr, sg, sb, sa)) continue;
    data[i] = fill.r;
    data[i + 1] = fill.g;
    data[i + 2] = fill.b;
    data[i + 3] = 255;
    const px = p % W;
    const py = (p / W) | 0;
    if (px > 0) stack.push(p - 1);
    if (px < W - 1) stack.push(p + 1);
    if (py > 0) stack.push(p - W);
    if (py < H - 1) stack.push(p + W);
  }
  ctx.putImageData(img, 0, 0);
}

function onDown(event) {
  if (!ready || event.button !== 0) return;
  event.preventDefault();
  stop();
  sync();
  render();
  const p = point(event);
  if (tool === 'fill') {
    snapshot();
    flood(frames[index], p.x, p.y, hexToRgb(color));
    commit();
    return;
  }
  drawing = true;
  last = p;
  snapshot();
  try {
    view.setPointerCapture?.(event.pointerId);
  } catch {
    /* Untrusted events and some browsers refuse capture. */
  }
  const ctx = frameCtx(frames[index]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size;
  ctx.strokeStyle = color;
  ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + 0.01, p.y + 0.01);
  ctx.stroke();
  render();
}

function onMove(event) {
  if (!drawing) return;
  const p = point(event);
  const ctx = frameCtx(frames[index]);
  ctx.beginPath();
  ctx.moveTo(last.x, last.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  last = p;
  render();
}

function onUp() {
  if (!drawing) return;
  drawing = false;
  frameCtx(frames[index]).globalCompositeOperation = 'source-over';
  commit();
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
  const ctx = out.getContext('2d');
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(frames[index], 0, 0);
  out.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, `animation-${index + 1}.png`);
    setStatus('PNG saved.');
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveVideo() {
  if (saving) return;
  if (typeof MediaRecorder === 'undefined') {
    setStatus('This browser can play the flipbook, but it cannot save a video.');
    return;
  }
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((item) => MediaRecorder.isTypeSupported(item));
  if (!type) {
    setStatus('This browser can play the flipbook, but it cannot save a video.');
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
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(frame, 0, 0);
        track.requestFrame?.();
        await wait(gap);
      }
    }
    await wait(200);
    rec.stop();
    await stopped;
    downloadBlob(new Blob(chunks, { type: 'video/webm' }), 'animation.webm');
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

function bindColors() {
  const box = document.getElementById('colors');
  COLORS.forEach((hex, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `swatch${i === 0 ? ' active' : ''}`;
    btn.style.background = hex;
    btn.setAttribute('aria-label', hex);
    btn.addEventListener('click', () => {
      color = hex;
      if (tool === 'erase') setTool('draw');
      box.querySelectorAll('.swatch').forEach((swatch) => {
        swatch.classList.toggle('active', swatch === btn);
      });
    });
    box.append(btn);
  });
}

function bind() {
  bindFullscreen();
  bindColors();
  document.querySelectorAll('.tool').forEach((btn) => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });
  document.querySelectorAll('.size').forEach((btn) => {
    btn.addEventListener('click', () => {
      size = Number(btn.dataset.size);
      document.querySelectorAll('.size').forEach((item) => {
        item.classList.toggle('active', item === btn);
      });
    });
  });
  document.getElementById('add').addEventListener('click', () => addFrame(false));
  document.getElementById('copy').addEventListener('click', () => addFrame(true));
  document.getElementById('del').addEventListener('click', deleteFrame);
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('clear').addEventListener('click', () => {
    stop();
    snapshot();
    frameCtx(frames[index]).clearRect(0, 0, W, H);
    commit();
  });
  document.getElementById('fresh').addEventListener('click', fresh);
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
  guideBtn.addEventListener('click', () => {
    if (!refImage) return;
    showRef = !showRef;
    render();
    sync();
  });
  stampBtn.addEventListener('click', () => {
    if (!refImage) return;
    stop();
    snapshot();
    drawContain(frameCtx(frames[index]), refImage);
    commit();
    setStatus('Stamped onto this frame. Erase what you do not want.');
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
    } else if (event.key === 'b' || event.key === 'B') setTool('draw');
    else if (event.key === 'e' || event.key === 'E') setTool('erase');
    else if (event.key === 'f' || event.key === 'F') setTool('fill');
  });
}

async function init() {
  bind();
  frames = [makeFrame()];
  let saved = false;
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (raw) {
      await restore(JSON.parse(raw));
      saved = true;
    }
  } catch {
    saved = false;
  }
if (!saved) {
  const hasGuide = Boolean(localStorage.getItem(REF_KEY));
  frames = hasGuide ? [makeFrame()] : demoFrames();
  index = 0;
  hadSave = false;
}
  try {
    const ref = localStorage.getItem(REF_KEY);
    if (ref) {
      refImage = await loadImage(ref);
      showRef = true;
      const name = localStorage.getItem(REF_NAME_KEY) || 'Character';
      setStatus(`${name} is the tracing guide. Stamp drops them on this frame.`);
    }
  } catch {
    refImage = null;
    showRef = false;
  }
  rebuildStrip();
  render();
  ready = true;
}

init();
