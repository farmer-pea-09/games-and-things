const W = 800;
const H = 520;
const CUSTOM_KEY = 'gat-coloring-custom';
const SAVES_KEY = 'gat-coloring-saves';

const PALETTE = [
  '#e63946', '#fb8500', '#ffb703', '#90be6d',
  '#43aa8b', '#4cc9f0', '#4361ee', '#7209b7',
  '#f72585', '#f4a261', '#d4a373', '#bc6c25',
  '#6d4c41', '#adb5bd', '#212529', '#ffffff',
  '#9b2226', '#2a9d8f', '#cae9ff', '#ffcad4',
];

const fillCanvas = document.getElementById('fill-canvas');
const outlineCanvas = document.getElementById('outline-canvas');
const fillCtx = fillCanvas.getContext('2d', { willReadFrequently: true });
const outlineCtx = outlineCanvas.getContext('2d', { willReadFrequently: true });
const submitCanvas = document.getElementById('submit-canvas');
const submitCtx = submitCanvas.getContext('2d', { willReadFrequently: true });
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');

const views = {
  picker: document.getElementById('picker-view'),
  color: document.getElementById('color-view'),
  submit: document.getElementById('submit-view'),
};

const state = {
  tool: 'crayon',
  color: PALETTE[0],
  size: 14,
  drawing: false,
  last: null,
  undo: [],
  page: null,
  submitTool: 'pen',
  submitDrawing: false,
  submitLast: null,
  traced: null,
  submitTab: 'draw',
};

function ink(ctx, width = 3.4) {
  ctx.strokeStyle = '#1c1c1c';
  ctx.fillStyle = '#1c1c1c';
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.stroke();
}

function poly(ctx, pts, close = true) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  if (close) ctx.closePath();
  ctx.stroke();
}

function curve(ctx, pts, close = false) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length - 2; i += 2) {
    const mx = (pts[i] + pts[i + 2]) / 2;
    const my = (pts[i + 1] + pts[i + 3]) / 2;
    ctx.quadraticCurveTo(pts[i], pts[i + 1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
  if (close) ctx.closePath();
  ctx.stroke();
}

function arc(ctx, x, y, r, a0, a1) {
  ctx.beginPath();
  ctx.arc(x, y, r, a0, a1);
  ctx.stroke();
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawCat(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 0, 78, 118, 92);
  ellipse(ctx, 0, -42, 82, 74);
  poly(ctx, [-58, -88, -78, -168, -18, -108]);
  poly(ctx, [18, -108, 78, -168, 58, -88]);
  poly(ctx, [-52, -100, -62, -142, -28, -112]);
  poly(ctx, [28, -112, 62, -142, 52, -100]);
  ellipse(ctx, -28, -48, 16, 20);
  ellipse(ctx, 28, -48, 16, 20);
  ellipse(ctx, -28, -46, 6, 10);
  ellipse(ctx, 28, -46, 6, 10);
  poly(ctx, [-8, -18, 8, -18, 0, -6]);
  arc(ctx, -10, -2, 12, 0.15, Math.PI - 0.15);
  arc(ctx, 10, -2, 12, 0.15, Math.PI - 0.15);
  line(ctx, -82, -22, -148, -38);
  line(ctx, -84, -10, -152, -10);
  line(ctx, -80, 2, -146, 18);
  line(ctx, 82, -22, 148, -38);
  line(ctx, 84, -10, 152, -10);
  line(ctx, 80, 2, 146, 18);
  ellipse(ctx, -42, 158, 28, 16);
  ellipse(ctx, 42, 158, 28, 16);
  ctx.beginPath();
  ctx.moveTo(108, 90);
  ctx.bezierCurveTo(190, 70, 210, -10, 168, -70);
  ctx.bezierCurveTo(150, -20, 150, 50, 100, 80);
  ctx.stroke();
  line(ctx, 150, -40, 175, -55);
  line(ctx, 158, -18, 188, -22);
  line(ctx, -20, -88, 0, -70);
  line(ctx, 0, -88, 0, -68);
  line(ctx, 20, -88, 0, -70);
  ellipse(ctx, 0, 70, 48, 40);
}

function drawDog(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 10, 70, 120, 88);
  ellipse(ctx, 8, -50, 78, 68);
  ctx.beginPath();
  ctx.moveTo(-58, -70);
  ctx.bezierCurveTo(-130, -40, -120, 40, -70, 10);
  ctx.bezierCurveTo(-50, -10, -40, -50, -58, -70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, -78);
  ctx.bezierCurveTo(150, -50, 140, 30, 82, 4);
  ctx.bezierCurveTo(78, -20, 90, -70, 70, -78);
  ctx.stroke();
  ellipse(ctx, 18, -18, 42, 28);
  ellipse(ctx, -18, -52, 12, 16);
  ellipse(ctx, 38, -52, 12, 16);
  ellipse(ctx, 34, -8, 8, 6);
  arc(ctx, 10, 2, 18, 0.2, Math.PI - 0.1);
  ctx.beginPath();
  ctx.moveTo(22, 8);
  ctx.quadraticCurveTo(34, 28, 18, 32);
  ctx.quadraticCurveTo(8, 18, 22, 8);
  ctx.stroke();
  ellipse(ctx, 10, 18, 54, 18);
  ellipse(ctx, 10, 18, 10, 10);
  ellipse(ctx, -40, 150, 30, 18);
  ellipse(ctx, 58, 150, 30, 18);
  ctx.beginPath();
  ctx.moveTo(118, 70);
  ctx.bezierCurveTo(200, 40, 190, 160, 130, 130);
  ctx.stroke();
  line(ctx, -30, 40, 50, 40);
}

function drawBird(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, -10, 40, 110, 78);
  ellipse(ctx, 70, -50, 52, 46);
  poly(ctx, [118, -50, 168, -38, 118, -22]);
  ellipse(ctx, 86, -58, 10, 12);
  ellipse(ctx, 88, -58, 4, 5);
  ctx.beginPath();
  ctx.moveTo(-20, 20);
  ctx.bezierCurveTo(40, -20, 90, 20, 70, 70);
  ctx.bezierCurveTo(20, 90, -40, 70, -20, 20);
  ctx.stroke();
  line(ctx, 10, 10, 40, 30);
  line(ctx, 0, 28, 34, 48);
  line(ctx, -8, 46, 24, 64);
  poly(ctx, [-110, 20, -170, -10, -150, 40, -168, 70, -110, 50]);
  line(ctx, -20, 118, -20, 175);
  line(ctx, 20, 118, 20, 175);
  poly(ctx, [-32, 175, -8, 175, -20, 188]);
  poly(ctx, [8, 175, 32, 175, 20, 188]);
  ellipse(ctx, 10, 50, 28, 22);
}

function drawFish(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, -20, 10, 150, 78);
  poly(ctx, [128, 10, 210, -62, 188, 10, 210, 78]);
  poly(ctx, [-40, -78, -10, -150, 40, -78]);
  poly(ctx, [-20, 86, 10, 150, 50, 86]);
  poly(ctx, [-150, 10, -188, -18, -170, 10, -188, 40]);
  ellipse(ctx, -110, -8, 16, 18);
  ellipse(ctx, -108, -8, 6, 7);
  arc(ctx, -70, 10, 42, -1.1, 1.1);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const x = -30 + i * 34;
      const y = -24 + j * 28 + (i % 2) * 12;
      arc(ctx, x, y, 16, 0.4, Math.PI - 0.4);
    }
  }
}

function drawBunny(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 0, 80, 108, 92);
  ellipse(ctx, 0, -20, 78, 70);
  ctx.beginPath();
  ctx.moveTo(-38, -70);
  ctx.bezierCurveTo(-70, -210, -10, -220, -8, -78);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(38, -70);
  ctx.bezierCurveTo(70, -210, 10, -220, 8, -78);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-30, -80);
  ctx.bezierCurveTo(-48, -180, -16, -180, -16, -82);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, -80);
  ctx.bezierCurveTo(48, -180, 16, -180, 16, -82);
  ctx.stroke();
  ellipse(ctx, -24, -28, 12, 16);
  ellipse(ctx, 24, -28, 12, 16);
  ellipse(ctx, 0, -4, 10, 8);
  arc(ctx, -8, 8, 10, 0.2, Math.PI);
  arc(ctx, 8, 8, 10, 0, Math.PI - 0.2);
  poly(ctx, [-6, 16, -2, 28, 2, 16, 6, 28]);
  ellipse(ctx, -40, 160, 26, 16);
  ellipse(ctx, 40, 160, 26, 16);
  ellipse(ctx, 108, 120, 28, 24);
  line(ctx, -70, -8, -120, -18);
  line(ctx, -68, 4, -118, 8);
  line(ctx, 70, -8, 120, -18);
  line(ctx, 68, 4, 118, 8);
}

function drawElephant(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 20, 40, 140, 100);
  ellipse(ctx, -90, -20, 70, 62);
  ctx.beginPath();
  ctx.moveTo(-150, -20);
  ctx.bezierCurveTo(-230, 40, -210, 160, -150, 170);
  ctx.bezierCurveTo(-130, 120, -160, 40, -130, -10);
  ctx.stroke();
  line(ctx, -170, 40, -150, 50);
  line(ctx, -176, 80, -154, 88);
  line(ctx, -172, 120, -152, 126);
  ctx.beginPath();
  ctx.moveTo(-90, -70);
  ctx.bezierCurveTo(-40, -180, 80, -140, 40, -40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-40, -50);
  ctx.bezierCurveTo(0, -140, 70, -110, 20, -30);
  ctx.stroke();
  ellipse(ctx, -112, -28, 12, 14);
  poly(ctx, [-150, 8, -200, 50, -148, 28]);
  ellipse(ctx, -70, 138, 28, 52);
  ellipse(ctx, 10, 140, 28, 54);
  ellipse(ctx, 70, 138, 28, 52);
  ellipse(ctx, 120, 130, 26, 48);
  ellipse(ctx, -70, 188, 22, 10);
  ellipse(ctx, 10, 190, 22, 10);
  ellipse(ctx, 70, 188, 22, 10);
  ellipse(ctx, 120, 176, 20, 10);
  ctx.beginPath();
  ctx.moveTo(150, 40);
  ctx.quadraticCurveTo(200, 20, 190, 90);
  ctx.stroke();
  poly(ctx, [190, 90, 210, 100, 188, 108]);
}

function drawTurtle(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 0, 20, 150, 100);
  const cells = [
    [0, -20, 40, 32], [-70, -10, 36, 30], [70, -10, 36, 30],
    [-40, 40, 38, 30], [40, 40, 38, 30], [0, 55, 36, 26],
  ];
  for (const [x, y, rx, ry] of cells) ellipse(ctx, x, y, rx, ry);
  ellipse(ctx, -175, 10, 42, 34);
  ellipse(ctx, -200, 0, 10, 12);
  ellipse(ctx, 155, 40, 36, 18, 0.4);
  ellipse(ctx, -80, 130, 40, 22, -0.2);
  ellipse(ctx, 70, 128, 40, 22, 0.2);
  ellipse(ctx, -110, 110, 36, 20, -0.5);
  ellipse(ctx, 100, 108, 36, 20, 0.5);
  line(ctx, -175, 24, -155, 24);
}

function drawButterfly(ctx) {
  ink(ctx, 3.3);
  ellipse(ctx, 0, 10, 16, 92);
  ellipse(ctx, 0, -70, 12, 16);
  line(ctx, -4, -84, -28, -130);
  line(ctx, 4, -84, 28, -130);
  ellipse(ctx, -28, -130, 5, 5);
  ellipse(ctx, 28, -130, 5, 5);
  ctx.beginPath();
  ctx.moveTo(-12, -40);
  ctx.bezierCurveTo(-40, -120, -200, -110, -190, -10);
  ctx.bezierCurveTo(-180, 50, -70, 20, -14, 10);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, -40);
  ctx.bezierCurveTo(40, -120, 200, -110, 190, -10);
  ctx.bezierCurveTo(180, 50, 70, 20, 14, 10);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, 20);
  ctx.bezierCurveTo(-30, 30, -160, 40, -150, 120);
  ctx.bezierCurveTo(-120, 170, -20, 110, -10, 70);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, 20);
  ctx.bezierCurveTo(30, 30, 160, 40, 150, 120);
  ctx.bezierCurveTo(120, 170, 20, 110, 10, 70);
  ctx.closePath();
  ctx.stroke();
  ellipse(ctx, -90, -30, 28, 24);
  ellipse(ctx, 90, -30, 28, 24);
  ellipse(ctx, -70, 90, 18, 16);
  ellipse(ctx, 70, 90, 18, 16);
  line(ctx, -50, -60, -120, -20);
  line(ctx, 50, -60, 120, -20);
  line(ctx, -40, 50, -100, 100);
  line(ctx, 40, 50, 100, 100);
}

function drawFox(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 10, 70, 108, 86);
  poly(ctx, [-70, -20, -20, -110, 40, -20]);
  poly(ctx, [40, -20, 90, -118, 110, -18]);
  poly(ctx, [-50, -40, -28, -88, 0, -30]);
  poly(ctx, [58, -36, 82, -92, 98, -22]);
  ellipse(ctx, 20, -8, 58, 48);
  ellipse(ctx, 8, -18, 12, 14);
  ellipse(ctx, 48, -18, 12, 14);
  poly(ctx, [22, 4, 38, 4, 30, 16]);
  arc(ctx, 22, 18, 12, 0.1, Math.PI - 0.2);
  arc(ctx, 38, 18, 12, 0.2, Math.PI);
  ellipse(ctx, 0, 70, 40, 50);
  ellipse(ctx, -30, 150, 26, 16);
  ellipse(ctx, 50, 150, 26, 16);
  ctx.beginPath();
  ctx.moveTo(110, 80);
  ctx.bezierCurveTo(210, 20, 220, 150, 130, 140);
  ctx.bezierCurveTo(180, 90, 140, 70, 110, 80);
  ctx.stroke();
  ellipse(ctx, 175, 90, 22, 28);
}

function drawOwl(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 0, 30, 108, 130);
  poly(ctx, [-70, -70, -90, -130, -30, -90]);
  poly(ctx, [70, -70, 90, -130, 30, -90]);
  ellipse(ctx, -38, -40, 38, 38);
  ellipse(ctx, 38, -40, 38, 38);
  ellipse(ctx, -38, -40, 14, 14);
  ellipse(ctx, 38, -40, 14, 14);
  ellipse(ctx, -38, -40, 5, 5);
  ellipse(ctx, 38, -40, 5, 5);
  poly(ctx, [-8, -8, 8, -8, 0, 10]);
  for (let i = 0; i < 5; i++) {
    arc(ctx, 0, 40 + i * 22, 48 - i * 4, 0.3, Math.PI - 0.3);
  }
  ctx.beginPath();
  ctx.moveTo(-100, -10);
  ctx.quadraticCurveTo(-150, 40, -90, 90);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, -10);
  ctx.quadraticCurveTo(150, 40, 90, 90);
  ctx.stroke();
  line(ctx, -20, 160, -20, 185);
  line(ctx, 20, 160, 20, 185);
  line(ctx, -200, 185, 200, 185);
  ellipse(ctx, 0, 185, 16, 8);
}

function drawFrog(ctx) {
  ink(ctx, 3.4);
  ellipse(ctx, 0, 50, 130, 90);
  ellipse(ctx, -50, -70, 38, 34);
  ellipse(ctx, 50, -70, 38, 34);
  ellipse(ctx, -50, -70, 16, 16);
  ellipse(ctx, 50, -70, 16, 16);
  ellipse(ctx, -50, -70, 6, 6);
  ellipse(ctx, 50, -70, 6, 6);
  arc(ctx, 0, 20, 70, 0.15, Math.PI - 0.15);
  line(ctx, -40, 40, -20, 52);
  line(ctx, 40, 40, 20, 52);
  ellipse(ctx, -40, 20, 16, 12);
  ellipse(ctx, 40, 20, 16, 12);
  ellipse(ctx, -90, 20, 18, 14);
  ellipse(ctx, 90, 20, 18, 14);
  ctx.beginPath();
  ctx.moveTo(-90, 110);
  ctx.quadraticCurveTo(-160, 80, -140, 160);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(90, 110);
  ctx.quadraticCurveTo(160, 80, 140, 160);
  ctx.stroke();
  ellipse(ctx, -150, 168, 32, 16);
  ellipse(ctx, 150, 168, 32, 16);
  ellipse(ctx, -50, 140, 28, 18);
  ellipse(ctx, 50, 140, 28, 18);
}

function drawWhale(ctx) {
  ink(ctx, 3.4);
  ctx.beginPath();
  ctx.moveTo(-220, 20);
  ctx.bezierCurveTo(-180, -90, 40, -110, 140, -10);
  ctx.bezierCurveTo(200, 40, 160, 110, 40, 110);
  ctx.bezierCurveTo(-80, 120, -240, 80, -220, 20);
  ctx.stroke();
  poly(ctx, [140, -10, 230, -70, 200, 0, 230, 60, 150, 30]);
  poly(ctx, [20, 20, 70, -10, 50, 40]);
  ellipse(ctx, -120, -10, 14, 16);
  ellipse(ctx, -118, -10, 5, 6);
  arc(ctx, -140, 20, 24, 0.2, Math.PI - 0.4);
  line(ctx, -40, 50, 60, 50);
  line(ctx, -20, 70, 40, 70);
  ellipse(ctx, -80, -100, 10, 18);
  ellipse(ctx, -80, -130, 8, 16);
  ellipse(ctx, -80, -155, 6, 12);
}

const ANIMALS = [
  { id: 'cat', name: 'Cat', draw: drawCat },
  { id: 'dog', name: 'Dog', draw: drawDog },
  { id: 'bird', name: 'Bird', draw: drawBird },
  { id: 'fish', name: 'Fish', draw: drawFish },
  { id: 'bunny', name: 'Bunny', draw: drawBunny },
  { id: 'elephant', name: 'Elephant', draw: drawElephant },
  { id: 'turtle', name: 'Turtle', draw: drawTurtle },
  { id: 'butterfly', name: 'Butterfly', draw: drawButterfly },
  { id: 'fox', name: 'Fox', draw: drawFox },
  { id: 'owl', name: 'Owl', draw: drawOwl },
  { id: 'frog', name: 'Frog', draw: drawFrog },
  { id: 'whale', name: 'Whale', draw: drawWhale },
];

function paintBuiltInOutline(drawFn, ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2 + 8);
  const s = Math.min(width / 800, height / 520) * 1.15;
  ctx.scale(s, s);
  drawFn(ctx);
  ctx.restore();
}

function loadCustom() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCustom(pages) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(pages));
}

function loadSaves() {
  try {
    return JSON.parse(localStorage.getItem(SAVES_KEY) || '{}');
  } catch {
    return {};
  }
}

function storeSave(id, dataUrl) {
  const saves = loadSaves();
  saves[id] = dataUrl;
  localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
}

function showView(name) {
  for (const [key, el] of Object.entries(views)) {
    const on = key === name;
    el.classList.toggle('hidden', !on);
    el.hidden = !on;
  }
}

function thumbFor(page) {
  const c = document.createElement('canvas');
  c.width = 240;
  c.height = 156;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  if (page.draw) {
    paintBuiltInOutline(page.draw, ctx, c.width, c.height);
  } else if (page.outline) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
    img.src = page.outline;
  }
  return c;
}

function renderPicker() {
  const grid = document.getElementById('page-grid');
  grid.innerHTML = '';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'page-card submit';
  submit.innerHTML = '<div class="submit-plus">+</div><h3>Submit a drawing</h3>';
  submit.addEventListener('click', openSubmit);
  grid.appendChild(submit);

  for (const page of ANIMALS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    card.appendChild(thumbFor(page));
    const title = document.createElement('h3');
    title.textContent = page.name;
    card.appendChild(title);
    card.addEventListener('click', () => openPage(page));
    grid.appendChild(card);
  }

  for (const page of loadCustom()) {
    const card = document.createElement('div');
    card.className = 'page-card';
    const thumb = thumbFor(page);
    card.appendChild(thumb);
    const title = document.createElement('h3');
    title.textContent = page.name;
    card.appendChild(title);
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const colorBtn = document.createElement('button');
    colorBtn.type = 'button';
    colorBtn.className = 'tiny';
    colorBtn.textContent = 'Color';
    colorBtn.addEventListener('click', () => openPage(page));
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'tiny';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      saveCustom(loadCustom().filter((p) => p.id !== page.id));
      renderPicker();
    });
    actions.append(colorBtn, delBtn);
    card.appendChild(actions);
    card.addEventListener('click', (event) => {
      if (event.target.closest('.tiny')) return;
      openPage(page);
    });
    grid.appendChild(card);
  }
}

function resetFill() {
  fillCtx.fillStyle = '#ffffff';
  fillCtx.fillRect(0, 0, W, H);
}

function snapshot() {
  state.undo.push(fillCtx.getImageData(0, 0, W, H));
  if (state.undo.length > 24) state.undo.shift();
}

function openPage(page) {
  state.page = page;
  state.undo = [];
  document.getElementById('page-title').textContent = page.name;
  resetFill();
  outlineCtx.clearRect(0, 0, W, H);
  if (page.draw) {
    paintBuiltInOutline(page.draw, outlineCtx, W, H);
  } else if (page.outline) {
    const img = new Image();
    img.onload = () => outlineCtx.drawImage(img, 0, 0, W, H);
    img.src = page.outline;
  }
  const save = loadSaves()[page.id];
  if (save) {
    const img = new Image();
    img.onload = () => {
      fillCtx.drawImage(img, 0, 0, W, H);
    };
    img.src = save;
  }
  showView('color');
}

function persistPage() {
  if (!state.page) return;
  storeSave(state.page.id, fillCanvas.toDataURL('image/png'));
}

function pointerPos(event, canvas) {
  const r = canvas.getBoundingClientRect();
  const src = event.touches ? event.touches[0] : event;
  return {
    x: (src.clientX - r.left) * (canvas.width / r.width),
    y: (src.clientY - r.top) * (canvas.height / r.height),
  };
}

function brush(ctx, from, to, color, size) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (from) {
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(to.x, to.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function colorsMatch(data, i, r, g, b, a) {
  return data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] === a;
}

function floodFill(x, y, rgb) {
  x = x | 0;
  y = y | 0;
  const fill = fillCtx.getImageData(0, 0, W, H);
  const outline = outlineCtx.getImageData(0, 0, W, H);
  const f = fill.data;
  const o = outline.data;
  const i0 = (y * W + x) * 4;
  const tr = f[i0];
  const tg = f[i0 + 1];
  const tb = f[i0 + 2];
  const ta = f[i0 + 3];
  const [nr, ng, nb] = rgb;
  if (tr === nr && tg === ng && tb === nb && ta === 255) return;
  if (o[i0 + 3] > 90) return;

  const seen = new Uint8Array(W * H);
  const stack = [x, y];
  seen[y * W + x] = 1;

  while (stack.length) {
    const cy = stack.pop();
    const cx = stack.pop();
    const i = (cy * W + cx) * 4;
    if (o[i + 3] > 90) continue;
    if (!colorsMatch(f, i, tr, tg, tb, ta)) continue;
    f[i] = nr;
    f[i + 1] = ng;
    f[i + 2] = nb;
    f[i + 3] = 255;
    if (cx > 0 && !seen[cy * W + cx - 1]) {
      seen[cy * W + cx - 1] = 1;
      stack.push(cx - 1, cy);
    }
    if (cx + 1 < W && !seen[cy * W + cx + 1]) {
      seen[cy * W + cx + 1] = 1;
      stack.push(cx + 1, cy);
    }
    if (cy > 0 && !seen[(cy - 1) * W + cx]) {
      seen[(cy - 1) * W + cx] = 1;
      stack.push(cx, cy - 1);
    }
    if (cy + 1 < H && !seen[(cy + 1) * W + cx]) {
      seen[(cy + 1) * W + cx] = 1;
      stack.push(cx, cy + 1);
    }
  }
  fillCtx.putImageData(fill, 0, 0);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function onColorPointerDown(event) {
  event.preventDefault();
  const p = pointerPos(event, fillCanvas);
  snapshot();
  if (state.tool === 'fill') {
    floodFill(p.x, p.y, hexToRgb(state.color));
    persistPage();
    return;
  }
  state.drawing = true;
  state.last = p;
  const color = state.tool === 'eraser' ? '#ffffff' : state.color;
  brush(fillCtx, null, p, color, state.size);
}

function onColorPointerMove(event) {
  if (!state.drawing) return;
  event.preventDefault();
  const p = pointerPos(event, fillCanvas);
  const color = state.tool === 'eraser' ? '#ffffff' : state.color;
  brush(fillCtx, state.last, p, color, state.size);
  state.last = p;
}

function onColorPointerUp() {
  if (!state.drawing) return;
  state.drawing = false;
  state.last = null;
  persistPage();
}

function downloadPage() {
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d');
  ctx.drawImage(fillCanvas, 0, 0);
  ctx.drawImage(outlineCanvas, 0, 0);
  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = `${(state.page?.name || 'coloring').toLowerCase().replace(/\s+/g, '-')}.png`;
  a.click();
}

function luma(data, i) {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

function toOutlineImage(source) {
  const src = document.createElement('canvas');
  src.width = W;
  src.height = H;
  const sctx = src.getContext('2d');
  sctx.fillStyle = '#ffffff';
  sctx.fillRect(0, 0, W, H);
  const scale = Math.min(W / source.width, H / source.height);
  const dw = source.width * scale;
  const dh = source.height * scale;
  sctx.drawImage(source, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const img = sctx.getImageData(0, 0, W, H);
  const d = img.data;

  let white = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (luma(d, i) > 235) white += 1;
  }
  const lineArt = white / (W * H) > 0.62;

  const out = outlineCtx.createImageData(W, H);
  const o = out.data;

  if (lineArt) {
    for (let i = 0; i < d.length; i += 4) {
      const on = luma(d, i) < 188;
      o[i] = o[i + 1] = o[i + 2] = 28;
      o[i + 3] = on ? 255 : 0;
    }
  } else {
    const gray = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        gray[y * W + x] = luma(d, i);
      }
    }
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const gx =
          -gray[(y - 1) * W + (x - 1)] + gray[(y - 1) * W + (x + 1)] +
          -2 * gray[y * W + (x - 1)] + 2 * gray[y * W + (x + 1)] +
          -gray[(y + 1) * W + (x - 1)] + gray[(y + 1) * W + (x + 1)];
        const gy =
          -gray[(y - 1) * W + (x - 1)] - 2 * gray[(y - 1) * W + x] - gray[(y - 1) * W + (x + 1)] +
          gray[(y + 1) * W + (x - 1)] + 2 * gray[(y + 1) * W + x] + gray[(y + 1) * W + (x + 1)];
        const mag = Math.hypot(gx, gy);
        const i = (y * W + x) * 4;
        const on = mag > 48;
        o[i] = o[i + 1] = o[i + 2] = 28;
        o[i + 3] = on ? 255 : 0;
      }
    }
  }

  const thick = new Uint8Array(o);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      if (thick[i + 3]) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (thick[((y + dy) * W + (x + dx)) * 4 + 3]) {
            near = true;
            break;
          }
        }
      }
      if (near) {
        o[i] = o[i + 1] = o[i + 2] = 28;
        o[i + 3] = 255;
      }
    }
  }

  const result = document.createElement('canvas');
  result.width = W;
  result.height = H;
  const rctx = result.getContext('2d');
  rctx.putImageData(out, 0, 0);
  return result;
}

function showPreview(outline) {
  previewCtx.fillStyle = '#ffffff';
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(outline, 0, 0, previewCanvas.width, previewCanvas.height);
  state.traced = outline;
  document.getElementById('add-page-btn').disabled = false;
  document.getElementById('submit-status').textContent = 'Outline ready. Name it and add it to the book.';
}

function resetSubmitCanvas() {
  submitCtx.fillStyle = '#ffffff';
  submitCtx.fillRect(0, 0, W, H);
  previewCtx.fillStyle = '#ffffff';
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  state.traced = null;
  document.getElementById('add-page-btn').disabled = true;
  document.getElementById('submit-status').textContent = '';
}

function openSubmit() {
  resetSubmitCanvas();
  document.getElementById('page-name').value = '';
  setSubmitTab('draw');
  showView('submit');
}

function setSubmitTab(tab) {
  state.submitTab = tab;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('upload-label').classList.toggle('hidden', tab !== 'upload');
  document.getElementById('submit-pen-btn').classList.toggle('hidden', tab !== 'draw');
  document.getElementById('submit-erase-btn').classList.toggle('hidden', tab !== 'draw');
  document.getElementById('submit-clear-btn').classList.toggle('hidden', tab !== 'draw');
}

function onSubmitPointerDown(event) {
  if (state.submitTab !== 'draw') return;
  event.preventDefault();
  state.submitDrawing = true;
  state.submitLast = pointerPos(event, submitCanvas);
  const color = state.submitTool === 'erase' ? '#ffffff' : '#1c1c1c';
  const size = state.submitTool === 'erase' ? 22 : 5;
  brush(submitCtx, null, state.submitLast, color, size);
}

function onSubmitPointerMove(event) {
  if (!state.submitDrawing) return;
  event.preventDefault();
  const p = pointerPos(event, submitCanvas);
  const color = state.submitTool === 'erase' ? '#ffffff' : '#1c1c1c';
  const size = state.submitTool === 'erase' ? 22 : 5;
  brush(submitCtx, state.submitLast, p, color, size);
  state.submitLast = p;
}

function onSubmitPointerUp() {
  state.submitDrawing = false;
  state.submitLast = null;
}

function bindPalette() {
  const pal = document.getElementById('palette');
  PALETTE.forEach((hex, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `swatch${i === 0 ? ' active' : ''}`;
    btn.style.background = hex;
    btn.title = hex;
    btn.addEventListener('click', () => {
      state.color = hex;
      pal.querySelectorAll('.swatch').forEach((s) => s.classList.remove('active'));
      btn.classList.add('active');
      if (state.tool === 'eraser') {
        state.tool = 'crayon';
        document.querySelectorAll('.tool-btn').forEach((t) => {
          t.classList.toggle('active', t.dataset.tool === 'crayon');
        });
      }
    });
    pal.appendChild(btn);
  });
}

function isFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function bindFullscreen() {
  const btn = document.getElementById('fullscreen-btn');
  if (!btn) return;

  const syncLabel = () => {
    btn.textContent = isFullscreen() ? '× Exit Full Screen' : '⛶ Full Screen';
  };

  btn.addEventListener('click', async () => {
    try {
      if (isFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else document.webkitExitFullscreen?.();
      } else {
        const root = document.documentElement;
        if (root.requestFullscreen) await root.requestFullscreen();
        else root.webkitRequestFullscreen?.();
      }
    } catch {
      /* some browsers block fullscreen outside a user gesture */
    }
  });

  document.addEventListener('fullscreenchange', syncLabel);
  document.addEventListener('webkitfullscreenchange', syncLabel);
}

function bindUi() {
  bindFullscreen();
  bindPalette();

  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.tool = btn.dataset.tool;
      document.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.size-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = Number(btn.dataset.size);
      document.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    persistPage();
    showView('picker');
    renderPicker();
  });

  document.getElementById('undo-btn').addEventListener('click', () => {
    const prev = state.undo.pop();
    if (prev) {
      fillCtx.putImageData(prev, 0, 0);
      persistPage();
    }
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    snapshot();
    resetFill();
    persistPage();
  });

  document.getElementById('download-btn').addEventListener('click', downloadPage);

  fillCanvas.addEventListener('mousedown', onColorPointerDown);
  fillCanvas.addEventListener('mousemove', onColorPointerMove);
  window.addEventListener('mouseup', onColorPointerUp);
  fillCanvas.addEventListener('touchstart', onColorPointerDown, { passive: false });
  fillCanvas.addEventListener('touchmove', onColorPointerMove, { passive: false });
  window.addEventListener('touchend', onColorPointerUp);

  document.getElementById('submit-back-btn').addEventListener('click', () => {
    showView('picker');
    renderPicker();
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setSubmitTab(btn.dataset.tab));
  });

  document.getElementById('submit-pen-btn').addEventListener('click', () => {
    state.submitTool = 'pen';
    document.getElementById('submit-pen-btn').classList.add('active');
    document.getElementById('submit-erase-btn').classList.remove('active');
  });

  document.getElementById('submit-erase-btn').addEventListener('click', () => {
    state.submitTool = 'erase';
    document.getElementById('submit-erase-btn').classList.add('active');
    document.getElementById('submit-pen-btn').classList.remove('active');
  });

  document.getElementById('submit-clear-btn').addEventListener('click', resetSubmitCanvas);

  submitCanvas.addEventListener('mousedown', onSubmitPointerDown);
  submitCanvas.addEventListener('mousemove', onSubmitPointerMove);
  window.addEventListener('mouseup', onSubmitPointerUp);
  submitCanvas.addEventListener('touchstart', onSubmitPointerDown, { passive: false });
  submitCanvas.addEventListener('touchmove', onSubmitPointerMove, { passive: false });
  window.addEventListener('touchend', onSubmitPointerUp);

  document.getElementById('upload-input').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      submitCtx.fillStyle = '#ffffff';
      submitCtx.fillRect(0, 0, W, H);
      const scale = Math.min(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      submitCtx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });

  document.getElementById('trace-btn').addEventListener('click', () => {
    const outline = toOutlineImage(submitCanvas);
    showPreview(outline);
  });

  document.getElementById('add-page-btn').addEventListener('click', () => {
    if (!state.traced) return;
    const name = document.getElementById('page-name').value.trim() || 'My drawing';
    const pages = loadCustom();
    pages.unshift({
      id: `custom-${Date.now()}`,
      name,
      outline: state.traced.toDataURL('image/png'),
    });
    saveCustom(pages.slice(0, 24));
    document.getElementById('submit-status').textContent = `"${name}" is in the coloring book.`;
    showView('picker');
    renderPicker();
  });
}

bindUi();
renderPicker();
showView('picker');
