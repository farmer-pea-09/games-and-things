const W = 800;
const H = 480;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const eggsLabel = document.getElementById('eggs-label');
const acornLabel = document.getElementById('acorn-label');
const chapterLabel = document.getElementById('chapter-label');
const questLabel = document.getElementById('quest-label');
const messageBox = document.getElementById('message-box');

const LEO_PAL = { body: '#52b788', belly: '#d8f3dc', crest: '#1b4332' };
const DORI_PAL = { body: '#e9c46a', belly: '#fff3b0', crest: '#bc6c25' };

const NAMES = [
  { id: 'David', leo: 'David is kind of a common name.' },
  { id: 'Jacob', leo: 'Jacob is personal, but just not the right one.' },
  { id: 'Nibbles', leo: 'Nibbles is personal, but not what we are looking for.' },
  { id: 'Fred', leo: 'Fred... well, I do not like it.' },
  { id: 'Chomper', leo: 'Chomper? I do not like that one.' },
  { id: 'Leonardo', leo: 'Leonardo is amazing, but I am named Leonardo! Leo is short for Leonardo!' },
  { id: 'wait', leo: 'We will have to wait until he hatches to name him.' },
];

const PACK_ITEMS = [
  { id: 'crickets', name: 'Canned crickets', bag: 'road' },
  { id: 'worms', name: 'Roasted mealworms', bag: 'road' },
  { id: 'bananas', name: 'Bananas', bag: 'road' },
  { id: 'wedding', name: 'Wedding picture', bag: 'home' },
  { id: 'toys', name: 'Stuffed animals', bag: 'home' },
  { id: 'flowers', name: 'Pressed flowers', bag: 'home' },
  { id: 'tent', name: 'Tent', bag: 'camp' },
  { id: 'shrooms', name: 'Mallow mushrooms', bag: 'camp' },
  { id: 'cocoa', name: 'Cocoa beans', bag: 'camp' },
];

const BAGS = [
  { id: 'road', name: 'Road bag', x: 90, y: 150 },
  { id: 'home', name: 'New home', x: 310, y: 150 },
  { id: 'camp', name: 'Camp bag', x: 530, y: 150 },
];

const WOUNDS = [
  { id: 'back', name: 'Back scrape', herb: 'moss', x: 318, y: 198 },
  { id: 'nose', name: 'Nose cut', herb: 'leaf', x: 338, y: 188 },
  { id: 'tail', name: 'Half tail', herb: 'vine', x: 272, y: 212 },
];

const HERBS = [
  { id: 'moss', name: 'Soft moss' },
  { id: 'leaf', name: 'Cooling leaf' },
  { id: 'vine', name: 'Vine wrap' },
];

const PATH_LEN = 4200;

const MEALS = {
  camp: {
    chapter: 'Camp',
    title: 'Camp supper',
    quest: 'Click dishes to feed Leo. Fill his belly.',
    need: 70,
    intro: [
      { who: 'Mayor Ben', text: 'We shall set camp here. Carts into the safer ditch!' },
      { who: 'Dori', text: 'Hear that rumble? The whole convoy is parking along the bank.' },
      { who: 'Dori', text: 'Camping bag, please. I will get the eggs. The stone is set. What will you eat, Leo?' },
    ],
    after: [
      { who: 'Leo', text: 'Not very homey, but we are together. Barny is tied to a grassy branch.' },
    ],
    foods: [
      { id: 'smores', name: 'Mushroom s\'mores', fill: 38, heal: 8, servings: 2, yum: 'Gooey cocoa mushrooms! Perfect.' },
      { id: 'cocoa', name: 'Cocoa beans', fill: 14, heal: 0, servings: 2, yum: 'Bitter! Leo\'s face scrunches.' },
      { id: 'worms', name: 'Roasted mealworms', fill: 24, heal: 4, servings: 2, yum: 'Crunchy and warm.' },
      { id: 'banana', name: 'Banana', fill: 18, heal: 2, servings: 2, yum: 'Sweet trail snack.' },
    ],
  },
  lunch: {
    chapter: 'Lunch',
    title: 'Path lunch',
    quest: 'Pick Leo\'s lunch. Click a dish to feed him.',
    need: 75,
    intro: [
      { who: 'Leo', text: 'The most wonderful smell haunted his little reptilian nose.' },
      { who: 'Dori', text: 'Sit, Leo. You choose what goes on your plate.' },
    ],
    after: [
      { who: 'Leo', text: 'Did I mate with a professional chef or what!' },
      { who: 'Mayor Ben', text: 'We are going to keep moving in two minutes!' },
    ],
    foods: [
      { id: 'nuts', name: 'Candied nuts', fill: 28, heal: 6, servings: 2, yum: 'Sugar-crusted and perfect.' },
      { id: 'loaf', name: 'Cricket meat loaf', fill: 36, heal: 8, servings: 1, yum: 'Hearty! Leo thumps his tail.' },
      { id: 'bread', name: 'Banana bread', fill: 30, heal: 5, servings: 2, yum: 'Soft banana bread. Wow.' },
      { id: 'handful', name: 'Extra nuts', fill: 12, heal: 1, servings: 2, yum: 'A handful for the road.' },
    ],
  },
  dinner: {
    chapter: 'Dinner',
    title: 'Ditch dinner',
    quest: 'Feed Leo dinner. Tyler is watching too.',
    need: 70,
    intro: [
      { who: 'Mayor Ben', text: 'Ditches, everyone! Carts off the path for the night.' },
      { who: 'Leo', text: 'Smells amazing, Dori!' },
      { who: 'Dori', text: 'Thanks. You pick your plate... and maybe save munchies for Tyler.' },
    ],
    after: [
      { who: 'Dori', text: 'How long has it been since the eggs were laid?' },
      { who: 'Leo', text: 'About four weeks. Maybe longer. Let\'s eat... we did.' },
    ],
    foods: [
      { id: 'pie', name: 'Apple pie', fill: 40, heal: 8, servings: 1, yum: 'Cherry glaze. Leo closes his eyes.' },
      { id: 'munchies', name: 'Mealworm munchies', fill: 22, heal: 4, servings: 2, yum: 'Tyler would love these too!', tyler: true },
      { id: 'toast', name: 'Banana toasties', fill: 18, heal: 3, servings: 2, yum: 'Mushroom cream on toast!' },
      { id: 'cakes', name: 'Acorn pancakes', fill: 26, heal: 5, servings: 1, yum: 'Cocoa syrup. Breakfast for dinner!' },
    ],
  },
};

const OBSTACLE_KIND = {
  rock: { w: 20, dmg: 6 },
  log: { w: 38, dmg: 9 },
  puddle: { w: 30, dmg: 4 },
  root: { w: 24, dmg: 6 },
  stump: { w: 18, dmg: 7 },
};

const keys = new Set();
const tapped = new Set();
const mouse = { x: 0, y: 0, clicked: false };

let mode = 'title';
let paused = false;
let clock = 0;
let fade = 0;
let fadeDir = 0;
let fadeTo = null;
let dlg = null;
let prompt = '';

const player = {
  x: 360,
  y: 250,
  w: 22,
  h: 24,
  facing: 1,
  carrying: null,
  lane: 1,
  worldX: 40,
  speed: 0,
};

let game;
let nestEggs;
let packState;
let convoy;
let gather;
let heal;
let meal;
let ditch;
let cmd;

function freshGame() {
  game = {
    acorns: 50,
    eggs: { annabell: 100, rosanna: 100, tyler: 100 },
    boyName: null,
    cribBuilt: false,
    eggsPlaced: 0,
    tucked: false,
    namedTyler: false,
    packed: false,
    hasCart: false,
    hasBarny: false,
    sawNoMantis: false,
    quest: 'Talk to Dori',
    chapter: 'Nest',
    message: '',
    messageT: 0,
    liko: false,
  };
  nestEggs = [
    { id: 'annabell', x: 560, y: 208, placed: false },
    { id: 'rosanna', x: 590, y: 218, placed: false },
    { id: 'tyler', x: 575, y: 192, placed: false },
  ];
  packState = {
    selected: null,
    placed: {},
  };
  convoy = null;
  gather = null;
  heal = null;
  meal = null;
  ditch = null;
  cmd = null;
  player.x = 360;
  player.y = 250;
  player.facing = 1;
  player.carrying = null;
  player.lane = 1;
  player.worldX = 40;
  player.speed = 0;
}

freshGame();

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function eggCount() {
  return ['annabell', 'rosanna', 'tyler'].filter((id) => game.eggs[id] > 0).length;
}

function hurtEggs(amount) {
  const ids = ['annabell', 'rosanna', 'tyler'].filter((id) => game.eggs[id] > 0);
  if (!ids.length) return;
  const id = ids[Math.floor(Math.random() * ids.length)];
  game.eggs[id] = Math.max(0, game.eggs[id] - amount);
  flash(`${id[0].toUpperCase()}${id.slice(1)} is jostled!`);
  if (eggCount() === 0) lose('The eggs did not make it.');
}

function healEggs(amount) {
  ['annabell', 'rosanna', 'tyler'].forEach((id) => {
    if (game.eggs[id] > 0) game.eggs[id] = Math.min(100, game.eggs[id] + amount);
  });
}

function flash(text) {
  game.message = text;
  game.messageT = 2.4;
}

function setQuest(text) {
  game.quest = text;
}

function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function near(x, y, r = 36) {
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  return Math.hypot(cx - x, cy - y) < r;
}

function pressed(k) {
  return tapped.has(k);
}

function held(k) {
  return keys.has(k);
}

function talk(lines, then) {
  dlg = { lines: lines.slice(), i: 0, then: then || null };
}

function line() {
  return dlg && dlg.lines[dlg.i];
}

function advanceTalk() {
  if (!dlg) return;
  const cur = line();
  if (cur && cur.choices) return;
  dlg.i += 1;
  if (dlg.i >= dlg.lines.length) {
    const done = dlg.then;
    dlg = null;
    if (done) done();
  }
}

function pickChoice(index) {
  const cur = line();
  if (!cur || !cur.choices || !cur.choices[index]) return;
  const choice = cur.choices[index];
  const done = dlg.then;
  dlg = null;
  if (choice.then) choice.then();
  else if (done) done();
}

function startFade(next, after) {
  fadeDir = 1;
  fadeTo = { next, after };
}

function wrapText(text, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function mouseIn(x, y, w, h) {
  return mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function showPause() {
  paused = true;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Paused</h2>
    <p>Vinery Village is waiting.</p>
    <button type="button" id="resume-btn">Resume</button>
    <button type="button" id="quit-btn">Title</button>
  `;
  document.getElementById('resume-btn').onclick = () => {
    paused = false;
    hideOverlay();
  };
  document.getElementById('quit-btn').onclick = () => {
    paused = false;
    hideOverlay();
    freshGame();
    mode = 'title';
  };
}

function win() {
  mode = 'win';
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Mossy Grove</h2>
    <p>Leo, Dori, Annabell, Rosanna, little Ty, Barny, and baby Liko are safe by the water.</p>
    <p>Fossas will not rule this island today.</p>
    <button type="button" id="again-btn">Play again</button>
  `;
  document.getElementById('again-btn').onclick = () => {
    hideOverlay();
    freshGame();
    mode = 'title';
  };
}

function lose(reason) {
  mode = 'lose';
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Oh no</h2>
    <p>${reason}</p>
    <button type="button" id="again-btn">Try again</button>
  `;
  document.getElementById('again-btn').onclick = () => {
    hideOverlay();
    freshGame();
    mode = 'title';
  };
}

function moveTopDown(dt, bounds) {
  let dx = 0;
  let dy = 0;
  if (held('arrowleft') || held('a')) dx -= 1;
  if (held('arrowright') || held('d')) dx += 1;
  if (held('arrowup') || held('w')) dy -= 1;
  if (held('arrowdown') || held('s')) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    player.x += (dx / len) * 150 * dt;
    player.y += (dy / len) * 150 * dt;
    if (dx) player.facing = dx > 0 ? 1 : -1;
  }
  player.x = clamp(player.x, bounds.x, bounds.x + bounds.w - player.w);
  player.y = clamp(player.y, bounds.y, bounds.y + bounds.h - player.h);
}

function drawCloud(x, y, s = 1) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath();
  ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y - 6 * s, 14 * s, 0, Math.PI * 2);
  ctx.arc(x + 34 * s, y, 15 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawCanopy(camX = 0, sunset = false) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (sunset) {
    sky.addColorStop(0, '#ffb703');
    sky.addColorStop(0.35, '#fb8500');
    sky.addColorStop(0.7, '#9b2226');
    sky.addColorStop(1, '#1d2a14');
  } else {
    sky.addColorStop(0, '#8ecae6');
    sky.addColorStop(0.45, '#95d5b2');
    sky.addColorStop(1, '#2d6a4f');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = sunset ? 'rgba(255,180,80,0.35)' : 'rgba(45,106,79,0.55)';
  for (let i = 0; i < 7; i++) {
    const hx = ((i * 180 - camX * 0.18) % (W + 180)) - 80;
    ctx.beginPath();
    ctx.ellipse(hx, 390, 110, 54, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!sunset) {
    for (let i = 0; i < 4; i++) {
      drawCloud(((i * 250 - camX * 0.08 + clock * 8) % (W + 160)) - 40, 50 + (i % 2) * 28, 0.9);
    }
  }

  ctx.fillStyle = '#3d2914';
  ctx.fillRect(0, 400, W, 80);
  ctx.fillStyle = '#52796f';
  ctx.fillRect(0, 400, W, 8);
}

function drawVines(camX = 0) {
  ctx.strokeStyle = '#1b4332';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 130 - camX * 0.4) % (W + 40)) - 10;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 20, 80, x - 8, 160);
    ctx.stroke();
    ctx.fillStyle = '#40916c';
    ctx.fillRect(x - 6, 40 + (i % 3) * 18, 14, 5);
  }
}

function drawChameleon(x, y, facing, pal, t = 0, carrying = false) {
  const bounce = Math.sin(t) * 1.5;
  const dir = facing >= 0 ? 1 : -1;
  ctx.save();
  ctx.translate(x + 11, y + 12 + bounce);
  ctx.scale(dir, 1);

  ctx.strokeStyle = pal.body;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.quadraticCurveTo(-18, 12, -20, 0);
  ctx.stroke();

  ctx.fillStyle = pal.body;
  ctx.beginPath();
  ctx.ellipse(0, 4, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pal.belly;
  ctx.beginPath();
  ctx.ellipse(1, 6, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pal.body;
  ctx.beginPath();
  ctx.ellipse(8, -4, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(10, -12, 3, 6);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(12, -10, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(13, -10, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pal.crest;
  ctx.fillRect(-2, -8, 4, 3);
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(-6, 11, 5, 4);
  ctx.fillRect(4, 11, 5, 4);
  ctx.restore();

  if (carrying) drawEgg(x + 6, y - 10, '#fff8ef', 0.7);
}

function drawEgg(x, y, color, s = 1) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + 7 * s, y + 10 * s, 7 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(x + 5 * s, y + 6 * s, 2 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLemur(x, y, t = 0) {
  const b = Math.sin(t) * 1.2;
  ctx.fillStyle = '#f1faee';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 16 + b, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d3557';
  ctx.fillRect(x + 4, y + 10 + b, 12, 8);
  ctx.beginPath();
  ctx.arc(x + 4, y + 6 + b, 5, 0, Math.PI * 2);
  ctx.arc(x + 16, y + 6 + b, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1faee';
  ctx.beginPath();
  ctx.arc(x + 4, y + 6 + b, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 16, y + 6 + b, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 7, y + 12 + b, 2, 2);
  ctx.fillRect(x + 13, y + 12 + b, 2, 2);
  ctx.fillStyle = '#e76f51';
  ctx.fillRect(x + 9, y + 16 + b, 4, 2);
}

function drawMacaw(x, y, t = 0) {
  const b = Math.sin(t * 2) * 2;
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 14 + b, 12, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#457b9d';
  ctx.fillRect(x + 2, y + 10 + b, 8, 5);
  ctx.fillStyle = '#ffb703';
  ctx.beginPath();
  ctx.moveTo(x + 22, y + 12 + b);
  ctx.lineTo(x + 32, y + 16 + b);
  ctx.lineTo(x + 22, y + 18 + b);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + 18, y + 10 + b, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 18, y + 9 + b, 2, 2);
}

function drawMantis(x, y, t = 0) {
  const b = Math.sin(t) * 1.5;
  ctx.strokeStyle = '#90be6d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 22);
  ctx.lineTo(x + 10, y + 10 + b);
  ctx.lineTo(x + 22, y + 10 + b);
  ctx.lineTo(x + 28, y + 22);
  ctx.stroke();
  ctx.fillStyle = '#b5e48c';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 10 + b, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 22, y + 6 + b, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 23, y + 7 + b, 2, 2);
}

function drawCart(x, y, color = '#9c6644') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 8, 54, 22);
  ctx.fillStyle = '#3d2914';
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x + 4, y, 46, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, y, 46, 10);
  ctx.fillStyle = '#3d2914';
  ctx.beginPath();
  ctx.arc(x + 12, y + 32, 8, 0, Math.PI * 2);
  ctx.arc(x + 42, y + 32, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9ada7';
  ctx.beginPath();
  ctx.arc(x + 12, y + 32, 3, 0, Math.PI * 2);
  ctx.arc(x + 42, y + 32, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeetle(x, y, t = 0) {
  const b = Math.sin(t) * 1.2;
  ctx.fillStyle = '#1d3557';
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 12 + b, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  ctx.fillRect(x + 8, y + 8 + b, 12, 4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 20, y + 8 + b, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 21, y + 9 + b, 2, 2);
}

function drawCicada(x, y, t = 0) {
  const b = Math.sin(t * 2) * 1.4;
  ctx.fillStyle = '#90be6d';
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 12 + b, 11, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x + 4, y + 6 + b, 10, 5);
  ctx.fillRect(x + 16, y + 6 + b, 10, 5);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 20, y + 10 + b, 2, 2);
}

function drawMole(x, y) {
  ctx.fillStyle = '#6c757d';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 12, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcad4';
  ctx.fillRect(x + 16, y + 12, 5, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 8, y + 10, 2, 2);
}

function drawSquirrel(x, y, t = 0) {
  const b = Math.sin(t) * 1.2;
  ctx.fillStyle = '#bc6c25';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 12 + b, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 6 + b, 6, 8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 14, y + 8 + b, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 15, y + 9 + b, 2, 2);
}

function drawFamilyCart(f, x, y) {
  if (f.missing) return;
  const pull = x - 30;
  if (f.puller === 'beetle') drawBeetle(pull, y + 8, clock * 7 + f.gap);
  else if (f.puller === 'cicada') drawCicada(pull, y + 8, clock * 7 + f.gap);
  else drawMantis(pull, y + 8, clock * 7 + f.gap);
  drawCart(x, y, f.color);
  if (f.kind === 'mouse') {
    drawMouse(x + 8, y + 2);
    drawMouse(x + 24, y + 6);
  } else if (f.kind === 'lemur') {
    drawLemur(x + 12, y - 4, clock * 4);
  } else if (f.kind === 'mole') {
    drawMole(x + 16, y + 2);
  } else if (f.kind === 'skink') {
    drawSkink(x + 10, y + 6, false);
  } else if (f.kind === 'parrot') {
    drawMacaw(x + 8, y - 2, clock * 3);
  } else if (f.kind === 'squirrel') {
    drawSquirrel(x + 14, y + 2, clock * 5);
  }
  ctx.fillStyle = '#fff8ef';
  ctx.font = '5px "Press Start 2P"';
  ctx.fillText(f.name, x + 2, y - 2);
}

function drawFossa(x, y, facing, t = 0) {
  const dir = facing >= 0 ? 1 : -1;
  const b = Math.sin(t * 6) * 1.5;
  ctx.save();
  ctx.translate(x + 16, y + 14 + b);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#9c6644';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b3f1a';
  ctx.beginPath();
  ctx.moveTo(14, 4);
  ctx.quadraticCurveTo(28, 10, 30, -4);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#6b3f1a';
  ctx.stroke();
  ctx.fillStyle = '#c08552';
  ctx.beginPath();
  ctx.ellipse(12, -4, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(14, -8, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(15, -7, 2, 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(18, -2, 2, 3);
  ctx.restore();
}

function drawSkink(x, y, hurt = false) {
  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 10, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hurt ? '#e76f51' : '#4cc9f0';
  ctx.fillRect(x - 6, y + 8, 14, 5);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 24, y + 6, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 25, y + 7, 2, 2);
}

function drawMouse(x, y) {
  ctx.fillStyle = '#adb5bd';
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 10, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 2, y + 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcad4';
  ctx.beginPath();
  ctx.arc(x + 2, y + 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#adb5bd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 10);
  ctx.quadraticCurveTo(x + 22, y + 4, x + 20, y + 14);
  ctx.stroke();
}

function drawDragon(x, y, t = 0) {
  const b = Math.sin(t) * 1.2;
  ctx.fillStyle = '#bc6c25';
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 12 + b, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e76f51';
  ctx.fillRect(x + 8, y + 2 + b, 3, 4);
  ctx.fillRect(x + 13, y + 1 + b, 3, 5);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 18, y + 8 + b, 3, 3);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 19, y + 9 + b, 2, 2);
}

function drawPrompt() {
  if (!prompt) return;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(W / 2 - 220, H - 36, 440, 22);
  ctx.fillStyle = '#ffd166';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(prompt, W / 2, H - 20);
  ctx.textAlign = 'left';
}

function drawTalk() {
  if (!dlg) return;
  const cur = line();
  if (!cur) return;
  ctx.fillStyle = 'rgba(20, 12, 8, 0.92)';
  ctx.fillRect(24, 330, 752, 136);
  ctx.strokeStyle = '#e9c46a';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 330, 752, 136);

  ctx.fillStyle = '#e9c46a';
  ctx.font = '9px "Press Start 2P"';
  ctx.fillText(cur.who, 40, 354);

  ctx.fillStyle = '#fff8ef';
  ctx.font = '8px "Press Start 2P"';
  const lines = wrapText(cur.text, 700);
  lines.forEach((ln, i) => ctx.fillText(ln, 40, 378 + i * 16));

  if (cur.choices) {
    cur.choices.forEach((ch, i) => {
      const bx = 40 + (i % 4) * 185;
      const by = 410 + Math.floor(i / 4) * 24;
      const hot = mouseIn(bx, by - 12, 175, 20);
      ctx.fillStyle = hot ? '#2a9d8f' : '#3d2914';
      ctx.fillRect(bx, by - 12, 175, 20);
      ctx.fillStyle = '#fff';
      ctx.font = '7px "Press Start 2P"';
      ctx.fillText(`${i + 1}. ${ch.label}`, bx + 6, by + 2);
    });
  } else {
    ctx.fillStyle = '#c9a227';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('Space / click', 620, 450);
  }
}

function drawHudBars() {
  const ids = [
    ['annabell', 'A'],
    ['rosanna', 'R'],
    ['tyler', 'T'],
  ];
  ids.forEach(([id, letter], i) => {
    const hp = game.eggs[id];
    ctx.fillStyle = '#1a120c';
    ctx.fillRect(12 + i * 70, 8, 62, 8);
    ctx.fillStyle = hp > 40 ? '#95d5b2' : hp > 0 ? '#e9c46a' : '#9b2226';
    ctx.fillRect(12 + i * 70, 8, 62 * (hp / 100), 8);
    ctx.fillStyle = '#fff';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText(letter, 14 + i * 70, 15);
  });
}

function startNestTalk() {
  talk(
    [
      { who: 'Leo', text: 'The first egg will be named Annabell.' },
      { who: 'Dori', text: 'Ok Leo, and the second one will be Rosanna.' },
      { who: 'Leo', text: 'But what will the third be... being a boy, I mean?' },
      { who: 'Dori', text: 'Here are a few ideas, Leo.', choices: NAMES.map((n) => ({
        label: n.id === 'wait' ? 'Wait' : n.id,
        then: () => {
          game.boyName = n.id;
          talk(
            [
              { who: 'Leo', text: n.leo },
              { who: 'Dori', text: n.id === 'wait'
                ? 'Then we wait. Help me with the crib, honey.'
                : 'Well, we may still wait until he hatches. Help me with that crib.' },
            ],
            () => setQuest('Assemble the triplet crib')
          );
        },
      })) },
    ]
  );
}

function maybeTuck() {
  if (game.eggsPlaced >= 3 && !game.tucked) {
    setQuest('Tuck the eggs in with Dori\'s quilt');
  }
}

function updateNest(dt) {
  prompt = '';
  if (dlg) return;
  moveTopDown(dt, { x: 40, y: 90, w: 720, h: 300 });

  const dori = { x: 430, y: 210 };
  if (!game.boyName && near(dori.x + 10, dori.y + 10, 40)) {
    prompt = 'Space: talk to Dori';
    if (pressed(' ') || pressed('enter')) startNestTalk();
  }

  const box = { x: 180, y: 270 };
  if (game.boyName && !game.cribBuilt && near(box.x + 10, box.y + 10, 40)) {
    prompt = 'Space: assemble the crib';
    if (pressed(' ') || pressed('enter')) {
      talk(
        [
          { who: 'Leo', text: 'Instructions... upside down. There.' },
          { who: 'Leo', text: 'Finishing touches on the triplet crib!' },
          { who: 'Dori', text: 'Beautiful. Now the eggs, one at a time.' },
        ],
        () => {
          game.cribBuilt = true;
          setQuest('Carry each egg into the crib');
        }
      );
    }
  }

  if (game.cribBuilt && !player.carrying) {
    for (const egg of nestEggs) {
      if (!egg.placed && near(egg.x, egg.y, 28)) {
        prompt = `Space: pick up ${egg.id}`;
        if (pressed(' ') || pressed('enter')) {
          player.carrying = egg.id;
          flash(`Carrying ${egg.id}`);
          break;
        }
      }
    }
  }

  const crib = { x: 500, y: 250 };
  if (player.carrying && game.cribBuilt && near(crib.x + 20, crib.y + 10, 42)) {
    prompt = 'Space: set egg in the crib';
    if (pressed(' ') || pressed('enter')) {
      const egg = nestEggs.find((e) => e.id === player.carrying);
      egg.placed = true;
      player.carrying = null;
      game.eggsPlaced += 1;
      flash(`${egg.id} is tucked in the crib.`);
      maybeTuck();
    }
  }

  if (game.eggsPlaced >= 3 && !game.tucked && near(crib.x + 20, crib.y + 10, 42)) {
    prompt = 'Space: quilt the eggs';
    if (pressed(' ') || pressed('enter')) {
      game.tucked = true;
      talk(
        [
          { who: 'Dori', text: 'Good night, our little eggs.' },
          { who: 'Dori', text: 'Want to go for an evening stroll, Leo?' },
          { who: 'Leo', text: 'After you, my lady.' },
          { who: 'Dori', text: 'Oh you!' },
        ],
        () => setQuest('Walk to the root-woven door')
      );
    }
  }

  const door = { x: 48, y: 200 };
  if (game.tucked && near(door.x, door.y + 20, 40)) {
    prompt = 'Space: evening stroll';
    if (pressed(' ') || pressed('enter')) {
      startFade('sunset', () => {
        player.x = 200;
        player.y = 300;
        game.chapter = 'Sunset';
        setQuest('Walk to the favorite spot above the canopy');
      });
    }
  }
}

function drawNest() {
  drawCanopy(0, false);
  drawVines(0);

  ctx.fillStyle = '#6b4226';
  ctx.fillRect(30, 70, 740, 340);
  ctx.fillStyle = '#52796f';
  ctx.fillRect(40, 90, 720, 300);
  ctx.fillStyle = '#2d6a4f';
  for (let i = 0; i < 18; i++) {
    ctx.fillRect(60 + (i * 37) % 680, 110 + (i * 53) % 250, 18, 8);
  }

  ctx.fillStyle = '#3d2914';
  ctx.fillRect(36, 180, 28, 90);
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(44, 210, 12, 18);

  ctx.fillStyle = '#7f4f24';
  ctx.fillRect(120, 170, 70, 18);
  ctx.fillRect(128, 188, 12, 22);
  ctx.fillRect(170, 188, 12, 22);
  ctx.fillStyle = '#c08552';
  ctx.fillRect(126, 158, 58, 14);

  if (!game.cribBuilt) {
    ctx.fillStyle = '#bc6c25';
    ctx.fillRect(170, 268, 36, 24);
    ctx.strokeStyle = '#fff8ef';
    ctx.strokeRect(176, 274, 24, 12);
  } else {
    ctx.fillStyle = '#9c6644';
    ctx.fillRect(488, 248, 70, 28);
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(494, 242, 58, 10);
    if (game.tucked) {
      ctx.fillStyle = '#b5179e';
      ctx.fillRect(496, 236, 54, 10);
    }
  }

  ctx.fillStyle = '#5a3e2b';
  ctx.fillRect(540, 170, 120, 14);
  nestEggs.forEach((egg) => {
    if (!egg.placed && player.carrying !== egg.id) drawEgg(egg.x, egg.y, '#fff8ef');
  });
  if (game.cribBuilt) {
    nestEggs.forEach((egg, i) => {
      if (egg.placed) drawEgg(504 + i * 16, 228, '#fff8ef', 0.75);
    });
  }

  drawChameleon(430, 210, -1, DORI_PAL, clock * 3);
  drawChameleon(player.x, player.y, player.facing, LEO_PAL, clock * 8, !!player.carrying);
}

function updateSunset(dt) {
  prompt = '';
  if (dlg) return;
  moveTopDown(dt, { x: 40, y: 220, w: 720, h: 160 });
  const spot = { x: 560, y: 260 };
  if (!game.namedTyler && near(spot.x, spot.y, 50)) {
    prompt = 'Space: watch the sunset';
    if (pressed(' ') || pressed('enter')) {
      talk(
        [
          { who: 'Leo', text: 'Wonderful sunset tonight, right Dori?' },
          { who: 'Dori', text: 'Yes, honey.' },
          { who: 'Dori', text: 'I thought of the perfect name for our little boy!' },
          { who: 'Leo', text: 'Oh good! I thought something bit your tail off.' },
          { who: 'Dori', text: 'No! I found a name!' },
          { who: 'Leo', text: 'Well, what is it?' },
          { who: 'Dori', text: 'Tyler!' },
          { who: 'Leo', text: 'It is perfect! Our little Ty.' },
        ],
        () => {
          game.namedTyler = true;
          game.boyName = 'Tyler';
          startFade('morning', () => {
            player.x = 80;
            player.y = 220;
            game.chapter = 'Morning';
            setQuest('Open the door. Someone is knocking.');
            mode = 'nest2';
          });
        }
      );
    }
  }
}

function drawSunset() {
  drawCanopy(clock * 10, true);
  drawVines(20);
  ctx.fillStyle = '#1d2a14';
  ctx.fillRect(0, 360, W, 120);
  ctx.fillStyle = '#40916c';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 80 - 20, 360);
    ctx.lineTo(i * 80 + 30, 280);
    ctx.lineTo(i * 80 + 80, 360);
    ctx.fill();
  }
  ctx.fillStyle = '#ffba08';
  ctx.beginPath();
  ctx.arc(620, 160, 36, 0, Math.PI * 2);
  ctx.fill();
  drawChameleon(520, 250, 1, DORI_PAL, clock * 2);
  drawChameleon(player.x, player.y, player.facing, LEO_PAL, clock * 8);
}

function updateNest2(dt) {
  prompt = '';
  if (dlg) return;
  moveTopDown(dt, { x: 40, y: 90, w: 720, h: 300 });
  if (near(48, 220, 40)) {
    prompt = 'Space: open the door';
    if (pressed(' ') || pressed('enter')) {
      talk(
        [
          { who: 'Leo', text: 'Zed the lemur, I\'ll be darned!' },
          { who: 'Zed', text: 'I have bad news. Rumors of forest fires. The Forest Board sent us to warn Vinery Village.' },
          { who: 'Zed', text: 'Move to Mossy Grove. Water is closer there. A travel party starts tonight.' },
          { who: 'Dori', text: 'What\'s wrong, Zed?' },
          { who: 'Leo', text: 'Forest fires, Dori. We have to move to Mossy Grove for our safety.' },
        ],
        () => {
          startFade('village', () => {
            player.x = 90;
            player.y = 240;
            game.chapter = 'Village';
            setQuest('Pack three bags at home, then find a cart');
          });
        }
      );
    }
  }
}

function drawNest2() {
  drawNest();
  drawLemur(70, 210, clock * 4);
}

function villageSpots() {
  return {
    home: { x: 90, y: 220, label: 'Home bags' },
    zed: { x: 230, y: 150, label: 'Zed' },
    cart: { x: 420, y: 210, label: 'Norman\'s cart' },
    shop: { x: 640, y: 160, label: 'George\'s store' },
    meet: { x: 400, y: 380, label: 'Travel party' },
  };
}

function updateVillage(dt) {
  prompt = '';
  if (dlg) return;
  moveTopDown(dt, { x: 20, y: 80, w: 760, h: 360 });
  const s = villageSpots();

  if (near(s.home.x, s.home.y, 40)) {
    prompt = game.packed ? 'Bags are packed.' : 'Space: pack the three bags';
    if (!game.packed && (pressed(' ') || pressed('enter'))) {
      packState.selected = null;
      packState.placed = {};
      mode = 'pack';
    }
  }
  if (near(s.zed.x, s.zed.y, 36)) {
    prompt = 'Space: talk to Zed';
    if (pressed(' ') || pressed('enter')) {
      talk([{ who: 'Zed', text: 'Travel party gathers at the roots tonight. Stick close. No singing. If Ben says HIT THE DIRT, ditch. If he says RUN, run.' }]);
    }
  }
  if (near(s.cart.x, s.cart.y, 42)) {
    if (!game.hasCart) {
      prompt = 'Space: buy cart (30 acorns)';
      if (pressed(' ') || pressed('enter')) {
        if (game.acorns < 30) talk([{ who: 'Lillian', text: 'We are hoping for 30 acorns, sweety.' }]);
        else {
          game.acorns -= 30;
          game.hasCart = true;
          talk(
            [
              { who: 'Lillian', text: 'We are very busy Leo, make it quick sweety.' },
              { who: 'Leo', text: 'How much is that cart?' },
              { who: 'Lillian', text: '30 acorns.' },
              { who: 'Leo', text: 'Ok, here is 30 acorns.' },
              { who: 'Lillian', text: 'Thanks for the business!' },
              { who: 'Leo', text: 'Wait... I do not have a praying mantis!' },
              { who: 'Lillian', text: 'Oh! They ran off a long time ago. Buy one at George\'s general store.' },
            ],
            () => {
              game.sawNoMantis = true;
              setQuest('Buy a strong mantis at George\'s (10 acorns)');
            }
          );
        }
      }
    } else {
      prompt = 'The cart is yours.';
    }
  }
  if (near(s.shop.x, s.shop.y, 40)) {
    prompt = game.hasBarny ? 'Barny coos hello.' : 'Space: talk to George';
    if (!game.hasBarny && (pressed(' ') || pressed('enter'))) {
      if (!game.hasCart) talk([{ who: 'George', text: 'Need a cart first, sunny. Norman still has one in the yard.' }]);
      else if (game.acorns < 10) talk([{ who: 'George', text: 'A strong one is 10 acorns.' }]);
      else {
        game.acorns -= 10;
        game.hasBarny = true;
        talk(
          [
            { who: 'George', text: 'Here is a very strong one, sunny. Perfect for a traveling family. 10 acorns.' },
            { who: 'Dori', text: 'Oh a mantis! What is its name?' },
            { who: 'Leo', text: 'Um... Barny.' },
            { who: 'Barny', text: '*coos* (thanks for the name)' },
          ],
          () => setQuest('Join the travel party at the roots')
        );
      }
    }
  }
  if (near(s.meet.x, s.meet.y, 46)) {
    prompt = 'Space: join the convoy';
    if (pressed(' ') || pressed('enter')) {
      if (!game.packed) talk([{ who: 'Dori', text: 'The bags are not packed yet!' }]);
      else if (!game.hasCart) talk([{ who: 'Leo', text: 'We still need a cart.' }]);
      else if (!game.hasBarny) talk([{ who: 'Leo', text: 'I do not have a praying mantis!' }]);
      else startConvoy();
    }
  }
}

function drawVillage() {
  drawCanopy(0, false);
  drawVines(80);
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, 360, W, 120);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(360, 300, 80, 90);

  const house = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 70, 50);
    ctx.fillStyle = '#3d2914';
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 35, y - 28);
    ctx.lineTo(x + 76, y);
    ctx.fill();
    ctx.fillStyle = '#e9c46a';
    ctx.fillRect(x + 28, y + 22, 14, 20);
  };
  house(60, 200, '#bc6c25');
  house(200, 130, '#9c6644');
  house(600, 140, '#7f4f24');
  house(380, 180, '#c08552');

  if (!game.hasCart) drawCart(400, 230);
  drawLemur(220, 150, clock * 3);
  drawLemur(640, 148, clock * 2.2);
  ctx.fillStyle = '#fff8ef';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('Zed', 218, 148);
  ctx.fillText('George', 628, 138);
  ctx.fillText('Norman', 390, 178);
  ctx.fillText('Party', 390, 372);

  drawMantis(300, 368, clock * 4);
  drawCart(330, 364, '#9c6644');
  drawLemur(344, 352, clock * 3);
  drawBeetle(470, 372, clock * 5);
  drawCart(500, 368, '#c08552');
  drawMouse(512, 360);
  drawMouse(528, 364);
  drawCicada(200, 376, clock * 6);
  drawCart(230, 372, '#6c757d');
  drawMole(246, 366);

  if (game.hasBarny) drawMantis(player.x - 36, player.y + 4, clock * 5);
  drawChameleon(110, 210, 1, DORI_PAL, clock * 2);
  drawChameleon(player.x, player.y, player.facing, LEO_PAL, clock * 8);
}

function updatePack() {
  prompt = 'Click an item, then click the right bag';
  if (pressed('escape')) {
    mode = 'village';
    return;
  }
  if (!mouse.clicked) return;

  PACK_ITEMS.forEach((item, i) => {
    if (packState.placed[item.id]) return;
    const x = 40 + (i % 3) * 250;
    const y = 300 + Math.floor(i / 3) * 42;
    if (mouseIn(x, y, 230, 34)) packState.selected = item.id;
  });

  BAGS.forEach((bag) => {
    if (mouseIn(bag.x, bag.y, 180, 90) && packState.selected) {
      const item = PACK_ITEMS.find((it) => it.id === packState.selected);
      if (item.bag === bag.id) {
        packState.placed[item.id] = bag.id;
        packState.selected = null;
        flash(`Packed ${item.name}.`);
        if (Object.keys(packState.placed).length === PACK_ITEMS.length) {
          game.packed = true;
          talk([{ who: 'Dori', text: 'Road bag, new-home bag, camping bag. Ready when you are.' }], () => {
            mode = 'village';
            setQuest(game.hasBarny ? 'Join the travel party' : 'Buy a cart, then a mantis');
          });
        }
      } else {
        flash('That belongs in a different bag!');
      }
    }
  });
}

function drawPack() {
  ctx.fillStyle = '#1d2a14';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e9c46a';
  ctx.font = '12px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Pack the bags', W / 2, 40);
  ctx.font = '7px "Press Start 2P"';
  ctx.fillStyle = '#fff8ef';
  ctx.fillText('Road, new home, and camp. Dori sorted them in her head.', W / 2, 64);
  ctx.textAlign = 'left';

  BAGS.forEach((bag) => {
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(bag.x, bag.y, 180, 90);
    ctx.strokeStyle = '#e9c46a';
    ctx.strokeRect(bag.x, bag.y, 180, 90);
    ctx.fillStyle = '#ffd166';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(bag.name, bag.x + 12, bag.y + 28);
    const n = Object.values(packState.placed).filter((b) => b === bag.id).length;
    ctx.fillStyle = '#95d5b2';
    ctx.fillText(`${n}/3`, bag.x + 12, bag.y + 52);
  });

  PACK_ITEMS.forEach((item, i) => {
    if (packState.placed[item.id]) return;
    const x = 40 + (i % 3) * 250;
    const y = 300 + Math.floor(i / 3) * 42;
    ctx.fillStyle = packState.selected === item.id ? '#2a9d8f' : '#6b4226';
    ctx.fillRect(x, y, 230, 34);
    ctx.fillStyle = '#fff';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText(item.name, x + 10, y + 22);
  });
}

function laneY(lane) {
  return 250 + lane * 44;
}

function spawnObstacles() {
  const list = [];
  const eventsAt = [520, 980, 1480, 1920, 2380, 2860, 3220, 3580, 4000];
  let x = 220;
  while (x < PATH_LEN - 160) {
    if (eventsAt.some((at) => Math.abs(at - x) < 80)) {
      x += 90;
      continue;
    }
    const roll = Math.random();
    let type;
    if (roll < 0.28) type = 'rock';
    else if (roll < 0.48) type = 'log';
    else if (roll < 0.64) type = 'stump';
    else if (roll < 0.82) type = 'root';
    else type = 'puddle';

    const lane = type === 'puddle' ? 2 : type === 'root' ? 0 : type === 'log' ? 1 : Math.floor(Math.random() * 3);
    list.push({ x, lane, type, hit: false });
    if (Math.random() < 0.4) {
      const other = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      const extra = other === 2 ? 'puddle' : other === 0 ? 'root' : 'rock';
      list.push({ x: x + 12, lane: other, type: extra, hit: false });
    }
    x += 64 + Math.random() * 48;
  }
  return list;
}

function startConvoy() {
  convoy = {
    dist: 0,
    families: [
      { name: 'Furry Tail', gap: 132, lane: 1, kind: 'lemur', color: '#9c6644', puller: 'mantis', missing: false },
      { name: 'Burrowing', gap: 250, lane: 0, kind: 'mouse', color: '#c08552', puller: 'beetle', missing: false },
      { name: 'Sniffling', gap: 370, lane: 1, kind: 'mole', color: '#6c757d', puller: 'cicada', missing: false },
      { name: 'Leaf Wing', gap: 490, lane: 0, kind: 'parrot', color: '#e76f51', puller: 'beetle', missing: false },
      { name: 'Moss Ear', gap: -120, lane: 2, kind: 'squirrel', color: '#7f4f24', puller: 'mantis', missing: false },
      { name: 'Blue Tail', gap: -230, lane: 1, kind: 'skink', color: '#2a9d8f', puller: 'mantis', missing: false },
    ],
    obstacles: spawnObstacles(),
    nuts: [],
    events: [
      { at: 520, id: 'camp' },
      { at: 980, id: 'missing' },
      { at: 1480, id: 'nuts' },
      { at: 1920, id: 'ollie' },
      { at: 2380, id: 'lunch' },
      { at: 2860, id: 'wake' },
      { at: 3220, id: 'dinner' },
      { at: 3580, id: 'cave' },
      { at: 4000, id: 'ambush' },
    ],
    fired: new Set(),
    cmdCd: 8,
    ollie: false,
    camping: false,
    settling: 0,
    campMeal: null,
  };
  player.lane = 1;
  player.worldX = 40;
  player.speed = 50;
  mode = 'convoy';
  game.chapter = 'Convoy';
  setQuest('Stay on the path. Steer around rocks, logs, and puddles.');
  talk([
    { who: 'Mayor Ben', text: 'If you want to survive, LISTEN!' },
    { who: 'Mayor Ben', text: 'When I call your family, walk behind the family before you.' },
    { who: 'Mayor Ben', text: 'The Scale Tail family!' },
    { who: 'Leo', text: 'Hya, Barny.' },
    { who: 'Mayor Ben', text: 'Stick close. No singing. HIT THE DIRT means the ditch. RUN means run like crazy.' },
  ]);
}

function fireEvent(id) {
  if (id === 'camp') {
    startCampSettle('camp');
  } else if (id === 'missing') {
    talk([
      { who: 'Mayor Ben', text: 'Recall! The Blue Tail family!' },
      { who: 'Tiffany', text: 'They disappeared overnight!' },
      { who: 'Mayor Ben', text: 'Send mice and hares to find them. The rest of us keep moving.' },
    ], () => {
      const blue = convoy.families.find((f) => f.name === 'Blue Tail');
      if (blue) blue.missing = true;
    });
  } else if (id === 'nuts') {
    talk([{ who: 'Dori', text: 'I will hop off for nuts. Surprise for the eggs and Leo! Grab and go, the cart is still moving!' }], () => startGather());
  } else if (id === 'ollie') {
    talk(
      [
        { who: 'Dori', text: 'STOP THE CART LEO! There is a blue-tailed lizard on the side of the road!' },
        { who: 'Mayor Ben', text: 'What is the meaning of this?' },
        { who: 'Leo', text: 'Dori found a blue-tailed skink!' },
        { who: 'Holly', text: 'The Blue Tail family! One of them, at least.' },
        { who: 'Mayor Ben', text: 'He is injured. He is now in your care, Scale Tails.' },
      ],
      () => startHeal()
    );
  } else if (id === 'lunch') {
    talk(MEALS.lunch.intro, () => startMeal('lunch'));
  } else if (id === 'wake') {
    talk([
      { who: 'Ollie', text: 'Huh? Ouch! Where... yow... am I?' },
      { who: 'Dori', text: 'You are in our cart. I am Dori. What injured you?' },
      { who: 'Ollie', text: 'We woke in a cave surrounded by Fusa! Mother said run. A Fusa scratched me. I tripped on a rock.' },
      { who: 'Dori', text: 'Your sister is marching with your family. I must tell Mayor Ben.' },
      { who: 'Mayor Ben', text: 'Fusa sighting nearby! Stick close. Lemurs, no more circus acts!' },
      { who: 'Crowd', text: 'Awww!' },
    ], () => {
      const blue = convoy.families.find((f) => f.name === 'Blue Tail');
      if (blue) {
        blue.missing = false;
        blue.gap = 200;
        blue.lane = 1;
      }
    });
  } else if (id === 'dinner') {
    startCampSettle('dinner');
  } else if (id === 'cave') {
    startFade('cave', () => {
      mode = 'cave';
      game.chapter = 'Cave';
      talk(
        [
          { who: 'Dagger Tail', text: 'General Rapier Fang! They are on the move again!' },
          { who: 'Rapier Fang', text: 'Wake up, you lazy heap of fur! We march with the convoy!' },
          { who: 'Golden Arrow', text: 'Hey! We are not all boys!' },
          { who: 'Rapier Fang', text: 'Whatever, Goldie. Never talk back to the general.' },
          { who: 'Rapier Fang', text: 'Brave savage warriors... it is eggs we want. Fossas will rule this island!' },
          { who: 'Rapier Fang', text: 'Stealth Claw, you are the diversion. Play hurt on the path. Then we strike with Goldie\'s knockout drops.' },
        ],
        () => {
          startFade('convoy', () => {
            mode = 'convoy';
            game.chapter = 'Convoy';
            setQuest('Stay close. Something is watching.');
          });
        }
      );
    });
  } else if (id === 'ambush') {
    talk(
      [
        { who: 'Mayor Ben', text: 'My oh my! What happened here, Mr. fossa?' },
        { who: 'Stealth Claw', text: 'Something... bit... hurt... help...' },
        { who: 'Stealth Claw', text: 'Nothing, ma\'am!' },
        { who: 'Rapier Fang', text: 'CHARGE!' },
        { who: 'Mayor Ben', text: 'Ambush! RUN!' },
        { who: 'Dori', text: 'He said RUN like crazy!' },
      ],
      () => startAmbush()
    );
  }
}

function startCampSettle(mealId) {
  convoy.camping = true;
  convoy.settling = 1.7;
  convoy.campMeal = mealId;
  player.lane = 2;
  player.speed = 0;
  cmd = null;
  const visible = convoy.families.filter((f) => !f.missing);
  visible.forEach((f, i) => {
    f.homeGap = f.gap;
    f.homeLane = f.lane;
    f.campGap = 90 + i * 112;
    f.lane = 2;
  });
  convoy.families.filter((f) => f.missing).forEach((f) => {
    f.homeGap = f.gap;
    f.homeLane = f.lane;
  });
  game.chapter = mealId === 'dinner' ? 'Dinner' : 'Camp';
  setQuest('The convoy is rumbling into the safer ditch...');
  flash('Carts settle in the ditch.');
}

function endCamp() {
  if (!convoy) return;
  convoy.camping = false;
  convoy.settling = 0;
  convoy.campMeal = null;
  convoy.families.forEach((f) => {
    if (f.homeGap != null) f.gap = f.homeGap;
    if (f.homeLane != null) f.lane = f.homeLane;
    f.homeGap = null;
    f.homeLane = null;
    f.campGap = null;
  });
  player.lane = 1;
}

function updateConvoy(dt) {
  prompt = '';
  if (!convoy) return;

  if (convoy.settling > 0) {
    convoy.settling -= dt;
    player.lane = 2;
    player.speed = 0;
    convoy.families.forEach((f) => {
      if (f.missing || f.campGap == null) return;
      f.lane = 2;
      f.gap += (f.campGap - f.gap) * Math.min(1, 5 * dt);
    });
    prompt = 'The travel party parks in the ditch...';
    if (convoy.settling <= 0) {
      talk(MEALS[convoy.campMeal].intro, () => startMeal(convoy.campMeal));
    }
    return;
  }

  if (dlg || convoy.camping) return;

  if (pressed('arrowup') || pressed('w')) player.lane = clamp(player.lane - 1, 0, 2);
  if (pressed('arrowdown') || pressed('s')) player.lane = clamp(player.lane + 1, 0, 2);

  let target = 52;
  if (held('arrowright') || held('d')) target = 88;
  if (held('arrowleft') || held('a')) target = 28;
  player.speed += (target - player.speed) * 3 * dt;
  convoy.dist += player.speed * dt;
  player.worldX = convoy.dist;

  convoy.cmdCd -= dt;
  const nearEvent = convoy.events.some((ev) => !convoy.fired.has(ev.id) && Math.abs(convoy.dist - ev.at) < 90);
  if (!cmd && !nearEvent && convoy.cmdCd <= 0 && convoy.dist > 180 && convoy.dist < PATH_LEN - 250) {
    cmd = { type: 'dirt', t: 2.6 };
    convoy.cmdCd = 10 + Math.random() * 7;
    flash('HIT THE DIRT!');
  }
  if (cmd) {
    cmd.t -= dt;
    prompt = 'Down / S: into the lower ditch!';
    if (player.lane === 2) {
      flash('Safe in the ditch.');
      cmd = null;
    } else if (cmd.t <= 0) {
      hurtEggs(12);
      flash('A fossa nearly snatched an egg!');
      cmd = null;
    }
  }

  convoy.obstacles.forEach((ob) => {
    const kind = OBSTACLE_KIND[ob.type] || OBSTACLE_KIND.rock;
    const sx = ob.x - convoy.dist + 120;
    if (!ob.hit && sx > 90 && sx < 90 + kind.w + 40 && ob.lane === player.lane) {
      ob.hit = true;
      player.speed *= 0.42;
      hurtEggs(kind.dmg);
    }
  });

  convoy.events.forEach((ev) => {
    if (!convoy.fired.has(ev.id) && convoy.dist >= ev.at) {
      convoy.fired.add(ev.id);
      fireEvent(ev.id);
    }
  });

  convoy.families.forEach((f) => {
    if (f.missing) return;
    if (cmd) {
      f.lane = 2;
    } else if (Math.random() < 0.004) {
      f.lane = clamp(f.lane + (Math.random() < 0.5 ? -1 : 1), 0, 2);
    }
    const cartX = 148 + f.gap;
    if (f.lane === player.lane && cartX > 100 && cartX < 210) {
      player.speed *= 0.7;
      if (!f.bumped) {
        f.bumped = true;
        hurtEggs(3);
        flash(`Watch the ${f.name} cart!`);
      }
    } else {
      f.bumped = false;
    }
  });

  if (!cmd) prompt = 'Left/Right speed  Up/Down lanes  Stay with the other carts';
}

function drawCampfire(x, y) {
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(x - 8, y + 6, 6, 8);
  ctx.fillRect(x + 2, y + 6, 6, 8);
  const flicker = 10 + Math.sin(clock * 10 + x) * 3;
  ctx.fillStyle = '#e76f51';
  ctx.beginPath();
  ctx.arc(x, y, flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffba08';
  ctx.beginPath();
  ctx.arc(x, y - 2, flicker * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawTent(x, y) {
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x + 22, y);
  ctx.lineTo(x + 44, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(x + 18, y + 16, 10, 12);
}

function drawPathScene(dist, showOllie = false) {
  const camping = convoy && convoy.camping;
  drawCanopy(dist, camping);
  drawVines(dist);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(0, 268, W, camping ? 40 : 96);
  ctx.fillStyle = '#52796f';
  ctx.fillRect(0, 268, W, 8);
  if (!camping) ctx.fillRect(0, 356, W, 8);
  ctx.fillStyle = camping ? '#2b2118' : '#3d2914';
  ctx.fillRect(0, camping ? 308 : 360, W, camping ? 172 : 50);
  if (camping) {
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(0, 308, W, 12);
  }

  for (let i = 0; i < 20; i++) {
    const x = ((i * 70 - dist) % (W + 70));
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(x, camping ? 286 : 310, 18, 4);
  }

  if (convoy) {
    if (!camping) {
      convoy.obstacles.forEach((ob) => {
        const x = ob.x - dist + 120;
        if (x < -40 || x > W + 20) return;
        drawObstacle(x, laneY(ob.lane), ob.type);
      });
    }
    convoy.families.forEach((f) => {
      const lane = camping ? 2 : f.lane;
      drawFamilyCart(f, 148 + f.gap, camping ? 318 : laneY(lane));
    });
  }

  drawMacaw(80, 120, clock);
  if (showOllie) drawSkink(500, 300, true);

  const pLaneY = camping ? 318 : laneY(player.lane);
  if (camping) {
    drawTent(20, 330);
    drawCampfire(90, 400);
    drawCampfire(280, 408);
    drawCampfire(520, 398);
    drawCampfire(700, 404);
    drawMantis(40, 300, clock * 2);
  } else {
    drawMantis(118, pLaneY + 8, clock * 8);
  }
  drawCart(148, pLaneY);
  drawChameleon(168, pLaneY - 8, 1, LEO_PAL, clock * 6);
  drawChameleon(188, pLaneY - 6, 1, DORI_PAL, clock * 5);
  drawEgg(200, pLaneY - 18, '#fff8ef', 0.6);
  drawEgg(212, pLaneY - 16, '#fff8ef', 0.6);
  drawEgg(224, pLaneY - 18, '#fff8ef', 0.6);

  if (cmd) {
    ctx.fillStyle = 'rgba(155,34,38,0.85)';
    ctx.fillRect(0, 40, W, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('HIT THE DIRT!', W / 2, 68);
    ctx.textAlign = 'left';
  }
}

function drawConvoy() {
  if (!convoy) {
    drawCanopy(0, false);
    return;
  }
  drawPathScene(convoy.dist, convoy.fired.has('ollie') && !heal);
  const p = clamp(convoy.dist / PATH_LEN, 0, 1);
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(200, 16, 400, 8);
  ctx.fillStyle = '#2a9d8f';
  ctx.fillRect(200, 16, 400 * p, 8);
  ctx.fillStyle = '#ffd166';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('Mossy Grove', 610, 14);
}

function drawObstacle(x, y, type) {
  if (type === 'log') {
    ctx.fillStyle = '#7f4f24';
    ctx.fillRect(x, y + 16, 36, 10);
    ctx.fillStyle = '#c08552';
    ctx.fillRect(x + 2, y + 18, 32, 3);
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(x, y + 16, 4, 10);
    ctx.fillRect(x + 32, y + 16, 4, 10);
  } else if (type === 'puddle') {
    ctx.fillStyle = 'rgba(69, 123, 157, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x + 16, y + 24, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 22, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'root') {
    ctx.strokeStyle = '#6b4226';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + 26);
    ctx.quadraticCurveTo(x + 10, y + 8, x + 24, y + 22);
    ctx.stroke();
    ctx.fillStyle = '#40916c';
    ctx.fillRect(x + 16, y + 6, 8, 5);
  } else if (type === 'stump') {
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x + 4, y + 10, 14, 16);
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.ellipse(x + 11, y + 10, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#6c757d';
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 26);
    ctx.lineTo(x + 10, y + 12);
    ctx.lineTo(x + 20, y + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x + 8, y + 16, 6, 4);
  }
}

function foodRect(i) {
  const top = meal && meal.id !== 'lunch' ? 102 : 300;
  return { x: 40 + (i % 2) * 250, y: top + Math.floor(i / 2) * 38, w: 230, h: 34 };
}

function startMeal(id) {
  const spec = MEALS[id];
  meal = {
    id,
    hunger: 0,
    chew: 0,
    lastYum: '',
    fedTyler: false,
    foods: spec.foods.map((f) => ({ ...f, left: f.servings })),
  };
  mode = 'eat';
  game.chapter = spec.chapter;
  setQuest(spec.quest);
}

function feedLeo(food) {
  if (!food || food.left <= 0 || meal.hunger >= 100) return;
  food.left -= 1;
  meal.hunger = clamp(meal.hunger + food.fill, 0, 100);
  meal.chew = 0.7;
  meal.lastYum = food.yum;
  if (food.heal) healEggs(food.heal);
  if (food.tyler) {
    meal.fedTyler = true;
    game.eggs.tyler = Math.min(100, game.eggs.tyler + 6);
    flash('Tyler nibbles a munchie too!');
  } else {
    flash(food.yum);
  }
}

function finishMeal() {
  const spec = MEALS[meal.id];
  const extra = [];
  if (meal.fedTyler) extra.push({ who: 'Dori', text: 'Good. Tyler ate his mealworm munchies.' });
  const wasCamp = meal.id === 'camp' || meal.id === 'dinner';
  meal = null;
  mode = 'convoy';
  game.chapter = 'Convoy';
  if (wasCamp) endCamp();
  talk(spec.after.concat(extra), () => {
    setQuest('Keep moving with the travel party');
  });
}

function updateMeal(dt) {
  if (!meal) return;
  const spec = MEALS[meal.id];
  prompt = meal.hunger >= spec.need ? 'Space: all done' : 'Click a dish, or press 1-4';
  if (meal.chew > 0) meal.chew -= dt;

  if (meal.hunger >= spec.need && (pressed(' ') || pressed('enter'))) {
    finishMeal();
    return;
  }

  meal.foods.forEach((food, i) => {
    if (pressed(String(i + 1))) feedLeo(food);
  });

  if (!mouse.clicked) return;
  meal.foods.forEach((food, i) => {
    const r = foodRect(i);
    if (mouseIn(r.x, r.y, r.w, r.h)) feedLeo(food);
  });
}

function drawMeal() {
  if (!meal) {
    drawConvoy();
    return;
  }
  const spec = MEALS[meal.id];
  if (meal.id !== 'lunch' && convoy) {
    drawPathScene(convoy.dist, false);
  } else {
    drawCanopy(convoy ? convoy.dist : 0, false);
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(220, 210, 220, 16);
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(250, 226, 16, 28);
    ctx.fillRect(394, 226, 16, 28);
    drawChameleon(430, 168, -1, DORI_PAL, clock * 2);
    drawChameleon(300, 176, 1, LEO_PAL, meal.chew > 0 ? clock * 18 : clock * 2);
    drawEgg(470, 196, '#fff8ef', 0.55);
    drawEgg(484, 200, '#fff8ef', 0.55);
    drawEgg(477, 186, '#fff8ef', 0.55);
  }

  ctx.fillStyle = '#e9c46a';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText(spec.title, 40, 36);
  ctx.fillStyle = '#fff8ef';
  ctx.font = '7px "Press Start 2P"';
  ctx.fillText(meal.id === 'lunch' ? 'You choose every bite Leo takes.' : 'Carts rest in the ditch. Feed Leo.', 40, 56);

  ctx.fillStyle = '#1a120c';
  ctx.fillRect(40, 78, 240, 14);
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(40, 78, 240 * (meal.hunger / 100), 14);
  ctx.fillStyle = '#fff';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText(`Belly ${Math.floor(meal.hunger)} / ${spec.need}`, 46, 89);

  if (meal.lastYum) {
    ctx.fillStyle = '#ffd166';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText(meal.lastYum, 300, 90);
  }

  meal.foods.forEach((food, i) => {
    const r = foodRect(i);
    const empty = food.left <= 0;
    ctx.fillStyle = empty ? '#3d2914' : '#6b4226';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = empty ? '#6b4226' : '#e9c46a';
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = empty ? '#888' : '#fff8ef';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(`${i + 1}. ${food.name}`, r.x + 10, r.y + 20);
    ctx.font = '6px "Press Start 2P"';
    ctx.fillStyle = '#c9a227';
    ctx.fillText(empty ? 'gone' : `${food.left} left  +${food.fill} belly`, r.x + 10, r.y + 36);
  });
}

function startGather() {
  gather = {
    nuts: [],
    got: 0,
    need: 5,
    cartX: 500,
  };
  for (let i = 0; i < 8; i++) {
    gather.nuts.push({
      x: 80 + Math.random() * 640,
      y: 300 + Math.random() * 80,
      kind: i % 3,
      got: false,
    });
  }
  player.x = 200;
  player.y = 320;
  mode = 'gather';
  game.chapter = 'Nuts';
  setQuest('Grab 5 nuts and get back in the moving cart');
}

function updateGather(dt) {
  prompt = `${gather.got}/${gather.need} nuts`;
  if (dlg) return;
  moveTopDown(dt, { x: 20, y: 250, w: 760, h: 160 });
  gather.cartX -= 18 * dt;
  gather.nuts.forEach((n) => {
    if (!n.got && near(n.x, n.y, 22)) {
      n.got = true;
      gather.got += 1;
      flash(['Red peanut!', 'Cashew!', 'Bambara groundnut!'][n.kind]);
    }
  });
  if (gather.got >= gather.need && player.x > gather.cartX - 20 && player.x < gather.cartX + 70) {
    talk([{ who: 'Dori', text: 'Nuts for candied treats. Back on the cart!' }], () => {
      mode = 'convoy';
      game.chapter = 'Convoy';
      setQuest('Keep moving with the travel party');
    });
  }
  if (gather.cartX < -80) {
    talk([{ who: 'Leo', text: 'Barny, wait! ...he loops back. Thank goodness.' }], () => {
      gather.cartX = 620;
    });
  }
}

function drawGather() {
  drawCanopy(convoy.dist, false);
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, 280, W, 200);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(0, 300, W, 24);
  gather.nuts.forEach((n) => {
    if (n.got) return;
    ctx.fillStyle = ['#e76f51', '#e9c46a', '#bc6c25'][n.kind];
    ctx.beginPath();
    ctx.ellipse(n.x, n.y, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  drawMantis(gather.cartX - 28, 292, clock * 6);
  drawCart(gather.cartX, 288);
  drawChameleon(player.x, player.y, player.facing, DORI_PAL, clock * 8);
}

function startHeal() {
  heal = {
    selected: null,
    done: {},
  };
  mode = 'heal';
  game.chapter = 'Heal';
  setQuest('Match each herb to a wound');
}

function updateHeal() {
  prompt = 'Click a herb, then the matching wound';
  if (pressed('escape')) return;
  if (!mouse.clicked) return;
  HERBS.forEach((h, i) => {
    if (heal.done[h.id]) return;
    if (mouseIn(40, 360 + i * 32, 220, 28)) heal.selected = h.id;
  });
  WOUNDS.forEach((w) => {
    if (heal.done[w.id]) return;
    if (mouseIn(w.x - 20, w.y - 16, 80, 40) && heal.selected) {
      if (heal.selected === w.herb) {
        heal.done[w.id] = true;
        heal.selected = null;
        flash(`${w.name} is bound.`);
        if (Object.keys(heal.done).length === 3) {
          talk([{ who: 'Dori', text: 'Rest, little skink. Your family is looking for you.' }], () => {
            mode = 'convoy';
            game.chapter = 'Convoy';
            setQuest('Drive while Dori watches Ollie');
          });
        }
      } else {
        flash('Wrong herb for that wound.');
      }
    }
  });
}

function drawHeal() {
  ctx.fillStyle = '#1b4332';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#52796f';
  ctx.fillRect(180, 80, 500, 250);
  drawSkink(300, 200, true);
  ctx.fillStyle = '#e9c46a';
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText('Heal Ollie', 40, 40);
  ctx.fillStyle = '#fff8ef';
  ctx.font = '7px "Press Start 2P"';
  ctx.fillText('Moss for the back, leaf for the nose, vine for the tail.', 40, 64);

  WOUNDS.forEach((w) => {
    ctx.fillStyle = heal.done[w.id] ? '#95d5b2' : '#e76f51';
    ctx.beginPath();
    ctx.arc(w.x, w.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText(heal.done[w.id] ? 'healed' : `${w.name}`, w.x - 40, w.y + 28);
  });

  HERBS.forEach((h, i) => {
    const y = 360 + i * 32;
    ctx.fillStyle = heal.selected === h.id ? '#2a9d8f' : '#3d2914';
    ctx.fillRect(40, y, 220, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    const used = WOUNDS.some((w) => heal.done[w.id] && w.herb === h.id);
    ctx.fillText(used ? `${h.name} used` : h.name, 52, y + 20);
  });
}

function drawCave() {
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3d2914';
  ctx.beginPath();
  ctx.ellipse(400, 520, 420, 220, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b3f1a';
  for (let i = 0; i < 6; i++) ctx.fillRect(80 + i * 120, 40, 18, 80);
  drawFossa(300, 220, 1, clock);
  drawFossa(380, 240, 1, clock + 1);
  drawFossa(460, 210, -1, clock + 0.5);
  drawFossa(520, 250, 1, clock + 2);
  ctx.fillStyle = '#e76f51';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Meanwhile...', W / 2, 40);
  ctx.textAlign = 'left';
}

function startAmbush() {
  ditch = {
    fossas: [],
    t: 28,
    tongue: 0,
    tongueDir: 1,
    spawn: 1.2,
    rescued: false,
    egg: { x: 420, y: 210, crack: 0 },
  };
  player.x = 280;
  player.y = 240;
  mode = 'ditch';
  game.chapter = 'Ambush';
  setQuest('Protect the eggs! Z tongue, keep fossas back');
}

function updateDitch(dt) {
  prompt = 'Z: tongue   Keep fossas off the eggs';
  if (dlg) return;
  moveTopDown(dt, { x: 30, y: 140, w: 520, h: 220 });

  if ((pressed('z') || pressed(' ')) && ditch.tongue <= 0) {
    const foe = ditch.fossas.reduce((best, f) => {
      if (f.stunned > 0) return best;
      if (!best) return f;
      const a = Math.hypot(f.x - player.x, f.y - player.y);
      const b = Math.hypot(best.x - player.x, best.y - player.y);
      return a < b ? f : best;
    }, null);
    ditch.tongueDir = foe && foe.x < player.x ? -1 : 1;
    ditch.tongue = 0.28;
  }
  if (ditch.tongue > 0) ditch.tongue -= dt;
  const tongueLen = ditch.tongue > 0 ? 86 : 0;

  ditch.spawn -= dt;
  if (ditch.spawn <= 0 && ditch.t > 4) {
    ditch.spawn = 2.1;
    ditch.fossas.push({
      x: 560 + Math.random() * 40,
      y: 160 + Math.random() * 180,
      stunned: 0,
    });
  }

  const tipX = player.x + player.w / 2 + ditch.tongueDir * tongueLen;
  const tipY = player.y + 8;
  ditch.fossas.forEach((f) => {
    if (f.stunned > 0) {
      f.stunned -= dt;
      return;
    }
    const dx = 80 - f.x;
    const dy = 230 - f.y;
    const len = Math.hypot(dx, dy) || 1;
    f.x += (dx / len) * 55 * dt;
    f.y += (dy / len) * 40 * dt;
    if (tongueLen > 0 && Math.hypot(f.x + 16 - tipX, f.y + 10 - tipY) < 26) {
      f.stunned = 1.4;
      f.x += ditch.tongueDir * 40;
    }
    if (Math.hypot(f.x - 90, f.y - 230) < 36) {
      f.x = 600;
      hurtEggs(22);
    }
  });

  ditch.t -= dt;
  if (ditch.t <= 0 && !ditch.rescued) {
    ditch.rescued = true;
    talk(
      [
        { who: 'Mayor Ben', text: 'Everyone recall! Limited losses. They were hunting eggs.' },
        { who: 'Leo', text: 'What\'s this on Barny? An egg! Much bigger than ours.' },
        { who: 'Dori', text: 'It is hatching! Stand back!' },
        { who: 'Liko', text: 'Mama?' },
        { who: 'Dori', text: 'A bearded dragon! Oh Leo can we keep it, please?' },
        { who: 'Leo', text: 'I will look for the mother tomorrow. If I find her, we give her back. Deal?' },
        { who: 'Dori', text: 'Deal. Let\'s name her Liko.' },
      ],
      () => {
        game.liko = true;
        startFade('win', () => win());
      }
    );
  }
}

function drawDitch() {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(20, 120, 560, 260);
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(0, 0, W, 80);
  ctx.fillStyle = '#e76f51';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText(`Hold the hole  ${Math.ceil(ditch.t)}s`, 24, 36);

  ctx.fillStyle = '#b5e48c';
  ctx.fillRect(60, 210, 70, 40);
  drawEgg(70, 200, '#fff8ef', 0.8);
  drawEgg(86, 206, '#fff8ef', 0.8);
  drawEgg(78, 188, '#fff8ef', 0.8);
  if (ditch.t < 6) drawEgg(110, 196, '#c1440e', 1);
  if (ditch.rescued) drawDragon(108, 198, clock * 5);

  ditch.fossas.forEach((f) => drawFossa(f.x, f.y, -1, f.stunned > 0 ? 0 : clock * 8));
  drawChameleon(430, 200, -1, DORI_PAL, clock * 3);
  drawMouse(300, 180);
  drawLemur(340, 300, clock);
  drawMacaw(500, 150, clock);
  drawChameleon(player.x, player.y, player.facing, LEO_PAL, clock * 8);

  if (ditch.tongue > 0) {
    const x0 = player.x + player.w / 2;
    const y0 = player.y + 8;
    const x1 = x0 + ditch.tongueDir * 86;
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y0);
    ctx.stroke();
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.arc(x1, y0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTitle() {
  drawCanopy(clock * 20, true);
  drawVines(clock * 8);
  drawChameleon(330, 250, 1, LEO_PAL, clock * 3);
  drawChameleon(430, 258, -1, DORI_PAL, clock * 2.4);
  drawEgg(372, 236, '#fff8ef', 0.8);
  drawEgg(390, 242, '#fff8ef', 0.8);
  drawEgg(382, 220, '#fff8ef', 0.8);
  ctx.fillStyle = 'rgba(20,12,8,0.45)';
  ctx.fillRect(0, 40, W, 120);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff8ef';
  ctx.font = '20px "Press Start 2P"';
  ctx.fillText('VINERY', W / 2, 88);
  ctx.fillStyle = '#e9c46a';
  ctx.fillText('VILLAGE', W / 2, 122);
  ctx.fillStyle = '#fff8ef';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('Leo, Dori, and three little eggs', W / 2, 160);
  ctx.fillStyle = '#ffd166';
  ctx.fillText('Press SPACE or ENTER', W / 2, 400);
  ctx.fillStyle = '#c9a227';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('A Madagascar canopy journey to Mossy Grove', W / 2, 428);
  ctx.textAlign = 'left';
}

function updateTitle() {
  if (pressed(' ') || pressed('enter')) {
    freshGame();
    mode = 'nest';
    talk([
      { who: 'Narrator', text: 'It was a lovely day in Vinery Village, in the wonderful canopy of the Madagascar jungle.' },
      { who: 'Narrator', text: 'Leo and Dori were expecting children soon from their three wonderfully white eggs.' },
    ]);
  }
}

function update(dt) {
  if (paused || mode === 'win' || mode === 'lose') return;
  clock += dt;
  if (game.messageT > 0) game.messageT -= dt;
  if (game.messageT <= 0) game.message = '';

  if (fadeDir !== 0) {
    fade += fadeDir * dt * 1.8;
    if (fade >= 1 && fadeDir > 0) {
      if (fadeTo) {
        mode = fadeTo.next;
        if (fadeTo.after) fadeTo.after();
        fadeTo = null;
      }
      fadeDir = -1;
    }
    if (fade <= 0 && fadeDir < 0) {
      fade = 0;
      fadeDir = 0;
    }
    return;
  }

  if (dlg) {
    const cur = line();
    if (cur && cur.choices) {
      for (let i = 0; i < cur.choices.length; i++) {
        if (pressed(String(i + 1))) pickChoice(i);
      }
      if (mouse.clicked) {
        cur.choices.forEach((ch, i) => {
          const bx = 40 + (i % 4) * 185;
          const by = 410 + Math.floor(i / 4) * 24;
          if (mouseIn(bx, by - 12, 175, 20)) pickChoice(i);
        });
      }
    } else if (pressed(' ') || pressed('enter') || mouse.clicked) {
      advanceTalk();
    }
    return;
  }

  if (mode === 'title') updateTitle();
  else if (mode === 'nest') updateNest(dt);
  else if (mode === 'sunset') updateSunset(dt);
  else if (mode === 'nest2') updateNest2(dt);
  else if (mode === 'village') updateVillage(dt);
  else if (mode === 'pack') updatePack();
  else if (mode === 'convoy') updateConvoy(dt);
  else if (mode === 'gather') updateGather(dt);
  else if (mode === 'heal') updateHeal();
  else if (mode === 'eat') updateMeal(dt);
  else if (mode === 'ditch') updateDitch(dt);
}

function draw() {
  if (mode === 'title') drawTitle();
  else if (mode === 'nest' || mode === 'morning') drawNest();
  else if (mode === 'sunset') drawSunset();
  else if (mode === 'nest2') drawNest2();
  else if (mode === 'village') drawVillage();
  else if (mode === 'pack') drawPack();
  else if (mode === 'convoy') drawConvoy();
  else if (mode === 'gather') drawGather();
  else if (mode === 'heal') drawHeal();
  else if (mode === 'eat') drawMeal();
  else if (mode === 'cave') drawCave();
  else if (mode === 'ditch') drawDitch();
  else drawCanopy(0, false);

  if (mode !== 'title' && mode !== 'pack' && mode !== 'heal') drawHudBars();
  drawPrompt();
  drawTalk();

  if (fade > 0) {
    ctx.fillStyle = `rgba(10,8,4,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function syncHud() {
  eggsLabel.textContent = `🥚 ${eggCount()}`;
  acornLabel.textContent = `🌰 ${game.acorns}`;
  chapterLabel.textContent = game.chapter;
  questLabel.textContent = game.quest;
  messageBox.textContent = game.message;
}

let last = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
  last = ts;
  update(dt);
  draw();
  syncHud();
  tapped.clear();
  mouse.clicked = false;
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(k) || e.code === 'Space') {
    e.preventDefault();
  }
  if (!keys.has(k)) tapped.add(k);
  keys.add(k);
  if (k === 'escape' && mode !== 'title' && mode !== 'win' && mode !== 'lose') {
    if (mode === 'pack') {
      mode = 'village';
      return;
    }
    if (!paused) showPause();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
});

canvas.addEventListener('mousedown', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
  mouse.clicked = true;
});

requestAnimationFrame(loop);
