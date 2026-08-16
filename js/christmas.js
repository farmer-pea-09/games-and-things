const W = 800;
const H = 480;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const nightLabel = document.getElementById('night-label');
const scoreLabel = document.getElementById('score-label');
const phaseLabel = document.getElementById('phase-label');
const questLabel = document.getElementById('quest-label');
const messageBox = document.getElementById('message-box');

const PAPERS = [
  { id: 'red', name: 'Red', hex: '#c41e3a', deep: '#8b1428' },
  { id: 'green', name: 'Green', hex: '#1b7a4e', deep: '#0f4d32' },
  { id: 'gold', name: 'Gold', hex: '#d4a017', deep: '#8a6a0c' },
  { id: 'blue', name: 'Blue', hex: '#2b6cb0', deep: '#1a446e' },
];

const RIBBONS = [
  { id: 'gold', name: 'Gold', hex: '#ffd166' },
  { id: 'red', name: 'Red', hex: '#ff4d6d' },
  { id: 'white', name: 'White', hex: '#f8f4e8' },
  { id: 'green', name: 'Green', hex: '#74c69d' },
];

const PARTS = [
  { id: 'fur', name: 'Fur', hex: '#e8b88a' },
  { id: 'button', name: 'Button', hex: '#3d3d4a' },
  { id: 'bow', name: 'Bow', hex: '#ff3b5c' },
  { id: 'wood', name: 'Wood', hex: '#e07a3d' },
  { id: 'wheel', name: 'Wheel', hex: '#7b4b9a' },
  { id: 'paint', name: 'Paint', hex: '#ff5a4e' },
  { id: 'cloth', name: 'Cloth', hex: '#ff8ec4' },
  { id: 'yarn', name: 'Yarn', hex: '#ffe14a' },
  { id: 'metal', name: 'Metal', hex: '#9ec0d8' },
  { id: 'gear', name: 'Gear', hex: '#6f8f7a' },
  { id: 'leather', name: 'Leather', hex: '#a0522d' },
  { id: 'air', name: 'Air pump', hex: '#5ee7ff' },
  { id: 'stick', name: 'Stick', hex: '#f0c27a' },
  { id: 'bell', name: 'Bell', hex: '#ffd54a' },
];

const TOYS = [
  { id: 'teddy', name: 'Teddy', parts: ['fur', 'button', 'bow'] },
  { id: 'train', name: 'Train', parts: ['wood', 'wheel', 'paint'] },
  { id: 'doll', name: 'Doll', parts: ['cloth', 'yarn', 'button'] },
  { id: 'robot', name: 'Robot', parts: ['metal', 'gear', 'paint'] },
  { id: 'ball', name: 'Soccer ball', parts: ['leather', 'paint', 'air'] },
  { id: 'drum', name: 'Drum', parts: ['wood', 'leather', 'stick'] },
  { id: 'kite', name: 'Kite', parts: ['cloth', 'wood', 'yarn'] },
  { id: 'sleigh', name: 'Toy sleigh', parts: ['wood', 'paint', 'bell'] },
];

const KIDS = [
  { name: 'Maya', paper: 'red', ribbon: 'gold' },
  { name: 'Sam', paper: 'green', ribbon: 'red' },
  { name: 'Lila', paper: 'gold', ribbon: 'white' },
  { name: 'Noah', paper: 'blue', ribbon: 'green' },
  { name: 'Iris', paper: 'red', ribbon: 'white' },
  { name: 'Theo', paper: 'green', ribbon: 'gold' },
  { name: 'Piper', paper: 'gold', ribbon: 'red' },
  { name: 'Owen', paper: 'blue', ribbon: 'gold' },
];

const NIGHTS = [
  { make: 3, wrapSpeed: 1.35, zone: 0.15, deliverTime: 50, birds: 3 },
  { make: 4, wrapSpeed: 1.85, zone: 0.11, deliverTime: 46, birds: 5 },
  { make: 5, wrapSpeed: 2.3, zone: 0.085, deliverTime: 44, birds: 7 },
];

const keys = {};
const mouse = { x: 400, y: 200, down: false };
let ui = [];
let last = 0;
let shake = 0;
let msgTimer = 0;

const snow = Array.from({ length: 70 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  s: 1 + Math.random() * 2,
  v: 18 + Math.random() * 36,
  drift: Math.random() * Math.PI * 2,
}));

const puffs = [];
const sparks = [];

const game = {
  mode: 'title',
  night: 1,
  score: 0,
  combo: 0,
  orders: [],
  makeIndex: 0,
  wrapIndex: 0,
  make: null,
  wrap: null,
  deliver: null,
  nightStats: null,
};

function paperById(id) {
  return PAPERS.find((p) => p.id === id);
}

function ribbonById(id) {
  return RIBBONS.find((r) => r.id === id);
}

function partById(id) {
  return PARTS.find((p) => p.id === id);
}

function toyById(id) {
  return TOYS.find((t) => t.id === id);
}

function randPick(list, n) {
  const copy = list.slice();
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function showOverlay(html) {
  overlayContent.innerHTML = html;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function say(text, ms = 1800) {
  messageBox.textContent = text;
  msgTimer = ms;
}

function addScore(n) {
  const bonus = Math.round(n * (1 + game.combo * 0.15));
  game.score += bonus;
  updateHud();
  return bonus;
}

function bumpCombo(ok) {
  game.combo = ok ? game.combo + 1 : 0;
}

function burst(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    sparks.push({
      x, y,
      vx: (Math.random() - 0.5) * 180,
      vy: (Math.random() - 0.5) * 180 - 40,
      life: 400 + Math.random() * 300,
      color,
    });
  }
}

function puff(x, y) {
  puffs.push({ x, y, r: 4, life: 380 });
}

function updateHud() {
  nightLabel.textContent = `Night ${game.night}`;
  scoreLabel.textContent = `★ ${game.score}`;
  const names = { make: 'Workshop', wrap: 'Wrapping', deliver: 'Sleigh', title: 'North Pole', pause: 'Paused', nightend: 'Night over', victory: 'Christmas' };
  phaseLabel.textContent = names[game.mode] || 'North Pole';
}

function startNight(n) {
  game.night = n;
  game.combo = 0;
  const cfg = NIGHTS[n - 1];
  const kids = randPick(KIDS, cfg.make);
  game.orders = kids.map((kid) => ({
    kid,
    toy: TOYS[Math.floor(Math.random() * TOYS.length)],
    made: false,
    paper: null,
    ribbon: null,
    wrapHits: 0,
    wrapMiss: 0,
    delivered: false,
    missed: false,
  }));
  game.makeIndex = 0;
  game.wrapIndex = 0;
  game.nightStats = { made: 0, wrapped: 0, delivered: 0, perfect: 0 };
  beginMake();
}

function beginMake() {
  game.mode = 'make';
  hideOverlay();
  const order = game.orders[game.makeIndex];
  const needed = order.toy.parts.slice();
  const decoys = PARTS.map((p) => p.id).filter((id) => !needed.includes(id));
  const extras = randPick(decoys, 3);
  const bench = needed.concat(extras);
  for (let i = bench.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bench[i], bench[j]] = [bench[j], bench[i]];
  }
  game.make = {
    clicked: [],
    bench,
    started: performance.now(),
    flash: 0,
    wrong: 0,
  };
  questLabel.textContent = `Build a ${order.toy.name} for ${order.kid.name}`;
  say(`Order ${game.makeIndex + 1}/${game.orders.length}: ${order.toy.name}`);
  updateHud();
}

function clickPart(partId) {
  const order = game.orders[game.makeIndex];
  const next = order.toy.parts[game.make.clicked.length];
  if (partId === next) {
    game.make.clicked.push(partId);
    burst(400, 220, partById(partId).hex, 8);
    say(`Added ${partById(partId).name}!`);
    if (game.make.clicked.length === order.toy.parts.length) {
      finishMake();
    }
  } else {
    game.make.wrong += 1;
    game.make.flash = 220;
    shake = 8;
    bumpCombo(false);
    say('Wrong part! Follow the recipe.');
  }
}

function finishMake() {
  const order = game.orders[game.makeIndex];
  order.made = true;
  game.nightStats.made += 1;
  const elapsed = (performance.now() - game.make.started) / 1000;
  const speed = Math.max(0, 8 - elapsed - game.make.wrong * 1.5);
  bumpCombo(game.make.wrong === 0);
  const gained = addScore(80 + Math.round(speed * 12));
  burst(400, 210, '#ffd166', 16);
  say(`${order.toy.name} done! +${gained}`);
  game.makeIndex += 1;
  if (game.makeIndex >= game.orders.length) {
    setTimeout(() => {
      showOverlay(`
        <h2>Toys ready</h2>
        <p>Every gift is built. Time to wrap them for the list.</p>
        <button type="button" id="go-wrap">Wrap presents</button>
      `);
      document.getElementById('go-wrap').onclick = beginWrap;
    }, 700);
  } else {
    setTimeout(beginMake, 650);
  }
}

function beginWrap() {
  game.mode = 'wrap';
  hideOverlay();
  game.wrapIndex = 0;
  setupWrap();
  updateHud();
}

function setupWrap() {
  const order = game.orders[game.wrapIndex];
  game.wrap = {
    step: 'paper',
    bar: 0,
    dir: 1,
    hits: 0,
    miss: 0,
    paper: null,
    ribbon: null,
  };
  questLabel.textContent = `${order.kid.name} wants ${paperById(order.kid.paper).name} paper and a ${ribbonById(order.kid.ribbon).name} bow`;
  say(`Wrap the ${order.toy.name} for ${order.kid.name}`);
}

function pickPaper(id) {
  game.wrap.paper = id;
  game.wrap.step = 'bar';
  say(id === game.orders[game.wrapIndex].kid.paper ? 'Perfect paper!' : 'That paper is not their favorite...');
}

function tapWrapBar() {
  const cfg = NIGHTS[game.night - 1];
  const mid = 0.5;
  const inZone = Math.abs(game.wrap.bar - mid) <= cfg.zone;
  if (inZone) {
    game.wrap.hits += 1;
    burst(400, 300, '#ffd166', 7);
    say('Nice fold!');
  } else {
    game.wrap.miss += 1;
    shake = 6;
    say('Crooked wrap!');
  }
  if (game.wrap.hits + game.wrap.miss >= 3) {
    game.wrap.step = 'ribbon';
    say('Now pick a ribbon bow.');
  }
}

function pickRibbon(id) {
  game.wrap.ribbon = id;
  finishWrap();
}

function finishWrap() {
  const order = game.orders[game.wrapIndex];
  order.paper = game.wrap.paper;
  order.ribbon = game.wrap.ribbon;
  order.wrapHits = game.wrap.hits;
  order.wrapMiss = game.wrap.miss;
  const paperOk = order.paper === order.kid.paper;
  const ribbonOk = order.ribbon === order.kid.ribbon;
  const wrapOk = order.wrapHits >= 2;
  if (paperOk && ribbonOk && wrapOk) game.nightStats.perfect += 1;
  game.nightStats.wrapped += 1;
  bumpCombo(paperOk && ribbonOk);
  let pts = 40 + order.wrapHits * 25;
  if (paperOk) pts += 50;
  if (ribbonOk) pts += 40;
  const gained = addScore(pts);
  burst(400, 220, paperById(order.paper).hex, 14);
  say(`Wrapped! +${gained}`);
  game.wrapIndex += 1;
  if (game.wrapIndex >= game.orders.length) {
    setTimeout(() => {
      showOverlay(`
        <h2>Sleigh is packed</h2>
        <p>Fly to each house and drop the matching present down the chimney.</p>
        <p>Sunrise will not wait.</p>
        <button type="button" id="go-fly">Take off</button>
      `);
      document.getElementById('go-fly').onclick = beginDeliver;
    }, 650);
  } else {
    setTimeout(setupWrap, 600);
  }
}

function beginDeliver() {
  game.mode = 'deliver';
  hideOverlay();
  const cfg = NIGHTS[game.night - 1];
  const worldW = 2200;
  const houses = game.orders.map((order, i) => {
    const x = 280 + i * ((worldW - 520) / Math.max(1, game.orders.length - 1));
    return {
      x,
      w: 88,
      h: 110,
      order,
      roof: paperById(order.kid.paper).hex,
    };
  });
  const birds = [];
  for (let i = 0; i < cfg.birds; i++) {
    birds.push({
      x: 400 + Math.random() * (worldW - 500),
      y: 70 + Math.random() * 180,
      vx: 40 + Math.random() * 70,
      amp: 18 + Math.random() * 22,
      baseY: 80 + Math.random() * 160,
      t: Math.random() * 10,
    });
  }
  game.deliver = {
    x: 120,
    y: 180,
    vx: 0,
    vy: 0,
    facing: 1,
    cam: 0,
    selected: 0,
    falling: [],
    houses,
    birds,
    worldW,
    time: cfg.deliverTime,
    done: false,
  };
  questLabel.textContent = 'Drop each present on the matching house';
  say('Fly, Santa! Hold Shift to slow down. Space drops the gift.');
  updateHud();
}

function selectedOrder() {
  const ready = game.orders.filter((o) => !o.delivered && !o.missed);
  if (!ready.length) return null;
  const i = Math.min(game.deliver.selected, ready.length - 1);
  game.deliver.selected = i;
  return ready[i];
}

function dropPresent() {
  if (game.mode !== 'deliver' || game.deliver.done) return;
  const order = selectedOrder();
  if (!order) return;
  const d = game.deliver;
  d.falling.push({
    order,
    x: d.x + 18,
    y: d.y + 20,
    vy: 30,
  });
  order.missed = true;
  say(`Dropped ${order.kid.name}'s ${order.toy.name}`);
}

function scoreDelivery(order, house) {
  const match = house.order === order;
  order.missed = !match;
  order.delivered = match;
  if (match) {
    game.nightStats.delivered += 1;
    bumpCombo(true);
    const gained = addScore(180);
    burst(house.x + 44, 300, '#ffd166', 18);
    say(`Delivered to ${order.kid.name}! +${gained}`);
  } else {
    bumpCombo(false);
    shake = 8;
    say(`Wrong chimney! That was ${house.order.kid.name}'s house.`);
  }
}

function finishDeliver() {
  if (game.deliver.done) return;
  game.deliver.done = true;
  game.orders.forEach((o) => {
    if (!o.delivered) o.missed = true;
  });
  const leftover = Math.max(0, Math.floor(game.deliver.time));
  if (leftover && game.nightStats.delivered === game.orders.length) {
    addScore(leftover * 4);
  }
  const n = game.night;
  const s = game.nightStats;
  setTimeout(() => {
    if (n >= NIGHTS.length) {
      game.mode = 'victory';
      showOverlay(`
        <h2>Merry Christmas</h2>
        <p>Sunrise hits the rooftops. The list is done.</p>
        <p>Made ${s.made} · Wrapped ${s.wrapped} · Delivered ${s.delivered}/${game.orders.length}</p>
        <p>Perfect wraps: ${s.perfect}</p>
        <p>Final score ★ ${game.score}</p>
        <button type="button" id="play-again">Play again</button>
      `);
      document.getElementById('play-again').onclick = () => {
        game.score = 0;
        startNight(1);
      };
    } else {
      game.mode = 'nightend';
      showOverlay(`
        <h2>Night ${n} done</h2>
        <p>Made ${s.made} · Wrapped ${s.wrapped} · Delivered ${s.delivered}/${game.orders.length}</p>
        <p>Perfect wraps: ${s.perfect}</p>
        <p>Score ★ ${game.score}</p>
        <button type="button" id="next-night">Start night ${n + 1}</button>
      `);
      document.getElementById('next-night').onclick = () => startNight(n + 1);
    }
    updateHud();
  }, 500);
}

function rect(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawText(str, x, y, c, size = 8, align = 'left') {
  ctx.fillStyle = c;
  ctx.font = `${size}px "Press Start 2P"`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(str, x, y);
}

function drawToy(toyId, stage, x, y, scale = 1) {
  const s = scale;
  if (toyId === 'teddy') {
    if (stage >= 1) {
      rect(x - 16 * s, y - 6 * s, 32 * s, 24 * s, '#c4a484');
      rect(x - 22 * s, y - 18 * s, 16 * s, 16 * s, '#c4a484');
      rect(x + 6 * s, y - 18 * s, 16 * s, 16 * s, '#c4a484');
      rect(x - 10 * s, y - 14 * s, 20 * s, 18 * s, '#d4b896');
    }
    if (stage >= 2) {
      rect(x - 6 * s, y + 2 * s, 4 * s, 4 * s, '#2b2b2b');
      rect(x + 2 * s, y + 2 * s, 4 * s, 4 * s, '#2b2b2b');
      rect(x - 2 * s, y - 6 * s, 4 * s, 4 * s, '#3d2914');
    }
    if (stage >= 3) {
      rect(x - 8 * s, y - 20 * s, 16 * s, 6 * s, '#c41e3a');
      rect(x - 2 * s, y - 24 * s, 4 * s, 6 * s, '#c41e3a');
    }
  } else if (toyId === 'train') {
    if (stage >= 1) rect(x - 22 * s, y - 4 * s, 44 * s, 16 * s, '#b56a2b');
    if (stage >= 2) {
      rect(x - 16 * s, y + 10 * s, 10 * s, 10 * s, '#3d2914');
      rect(x + 6 * s, y + 10 * s, 10 * s, 10 * s, '#3d2914');
    }
    if (stage >= 3) {
      rect(x - 22 * s, y - 14 * s, 18 * s, 12 * s, '#c41e3a');
      rect(x + 4 * s, y - 8 * s, 16 * s, 6 * s, '#e63946');
    }
  } else if (toyId === 'doll') {
    if (stage >= 1) {
      rect(x - 10 * s, y - 2 * s, 20 * s, 22 * s, '#f4a6c4');
      rect(x - 8 * s, y - 16 * s, 16 * s, 16 * s, '#f1d0b0');
    }
    if (stage >= 2) rect(x - 10 * s, y - 20 * s, 20 * s, 8 * s, '#f4d35e');
    if (stage >= 3) {
      rect(x - 4 * s, y - 8 * s, 3 * s, 3 * s, '#2b2b2b');
      rect(x + 2 * s, y - 8 * s, 3 * s, 3 * s, '#2b2b2b');
    }
  } else if (toyId === 'robot') {
    if (stage >= 1) {
      rect(x - 14 * s, y - 4 * s, 28 * s, 24 * s, '#8d99ae');
      rect(x - 10 * s, y - 16 * s, 20 * s, 14 * s, '#adb5bd');
    }
    if (stage >= 2) {
      rect(x - 6 * s, y + 4 * s, 12 * s, 12 * s, '#6c757d');
    }
    if (stage >= 3) {
      rect(x - 8 * s, y - 12 * s, 6 * s, 6 * s, '#e63946');
      rect(x + 2 * s, y - 12 * s, 6 * s, 6 * s, '#e63946');
    }
  } else if (toyId === 'ball') {
    if (stage >= 1) rect(x - 14 * s, y - 12 * s, 28 * s, 28 * s, '#6b4226');
    if (stage >= 2) {
      rect(x - 14 * s, y - 2 * s, 28 * s, 4 * s, '#f8f4e8');
      rect(x - 2 * s, y - 12 * s, 4 * s, 28 * s, '#f8f4e8');
    }
    if (stage >= 3) rect(x + 10 * s, y - 16 * s, 6 * s, 6 * s, '#90e0ef');
  } else if (toyId === 'drum') {
    if (stage >= 1) rect(x - 18 * s, y - 4 * s, 36 * s, 20 * s, '#b56a2b');
    if (stage >= 2) rect(x - 18 * s, y - 10 * s, 36 * s, 8 * s, '#6b4226');
    if (stage >= 3) {
      rect(x + 16 * s, y - 18 * s, 4 * s, 22 * s, '#d4a373');
      rect(x + 22 * s, y - 14 * s, 4 * s, 18 * s, '#d4a373');
    }
  } else if (toyId === 'kite') {
    if (stage >= 1) {
      rect(x - 4 * s, y - 20 * s, 8 * s, 36 * s, '#f4a6c4');
      rect(x - 16 * s, y - 6 * s, 32 * s, 8 * s, '#f4a6c4');
    }
    if (stage >= 2) {
      rect(x - 2 * s, y - 20 * s, 4 * s, 36 * s, '#b56a2b');
      rect(x - 16 * s, y - 4 * s, 32 * s, 4 * s, '#b56a2b');
    }
    if (stage >= 3) {
      rect(x - 2 * s, y + 16 * s, 4 * s, 10 * s, '#f4d35e');
      rect(x + 4 * s, y + 22 * s, 8 * s, 4 * s, '#f4d35e');
    }
  } else {
    if (stage >= 1) rect(x - 18 * s, y - 2 * s, 36 * s, 12 * s, '#b56a2b');
    if (stage >= 2) rect(x - 18 * s, y - 8 * s, 36 * s, 6 * s, '#c41e3a');
    if (stage >= 3) {
      rect(x - 6 * s, y - 16 * s, 8 * s, 8 * s, '#ffd166');
      rect(x - 4 * s, y - 14 * s, 4 * s, 4 * s, '#c41e3a');
    }
  }
}

function drawPresentBox(x, y, paperId, ribbonId, wrapLevel, scale = 1) {
  const paper = paperById(paperId) || { hex: '#8b5a2b', deep: '#5c3b1c' };
  const s = scale;
  rect(x - 22 * s, y - 16 * s, 44 * s, 36 * s, paper.hex);
  rect(x - 22 * s, y - 16 * s, 44 * s, 6 * s, paper.deep);
  if (wrapLevel >= 1) rect(x - 4 * s, y - 16 * s, 8 * s, 36 * s, '#fff3');
  if (wrapLevel >= 2) rect(x - 22 * s, y - 2 * s, 44 * s, 8 * s, '#fff3');
  if (ribbonId && wrapLevel >= 3) {
    const rib = ribbonById(ribbonId);
    rect(x - 4 * s, y - 16 * s, 8 * s, 36 * s, rib.hex);
    rect(x - 22 * s, y - 2 * s, 44 * s, 8 * s, rib.hex);
    rect(x - 10 * s, y - 24 * s, 8 * s, 10 * s, rib.hex);
    rect(x + 2 * s, y - 24 * s, 8 * s, 10 * s, rib.hex);
  }
}

function drawElf(x, y) {
  rect(x - 8, y - 28, 16, 10, '#1b7a4e');
  rect(x - 2, y - 34, 6, 8, '#1b7a4e');
  rect(x, y - 36, 4, 4, '#c41e3a');
  rect(x - 8, y - 18, 16, 12, '#f1d0b0');
  rect(x - 10, y - 6, 20, 16, '#c41e3a');
  rect(x - 10, y + 10, 8, 10, '#1b4332');
  rect(x + 2, y + 10, 8, 10, '#1b4332');
}

function drawSantaSleigh(x, y, facing = 1) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (facing < 0) ctx.scale(-1, 1);
  rect(-22, 10, 70, 14, '#6b4226');
  rect(-24, 22, 76, 5, '#3d2914');
  rect(-20, 8, 8, 8, '#c41e3a');
  rect(40, 6, 12, 10, '#c41e3a');
  rect(-10, -8, 22, 18, '#c41e3a');
  rect(-8, -20, 16, 14, '#f1d0b0');
  rect(-10, -14, 20, 8, '#f8f4e8');
  rect(-6, -26, 16, 8, '#c41e3a');
  rect(6, -30, 5, 5, '#f8f4e8');
  rect(16, -4, 16, 12, '#8b1428');
  ctx.restore();
}

function drawWorkshop() {
  rect(0, 0, W, H, '#2a1810');
  rect(0, 0, W, 70, '#1a0e0a');
  for (let i = 0; i < 10; i++) {
    const lx = 50 + i * 76;
    rect(lx, 18, 10, 8, i % 2 ? '#c41e3a' : '#ffd166');
    rect(lx + 3, 10, 4, 10, '#5c3b1c');
  }
  rect(40, 86, 130, 86, '#1b2a44');
  rect(48, 94, 114, 70, '#0b1d36');
  rect(48, 128, 114, 8, '#8b1428');
  rect(100, 100, 20, 20, '#f8f4e8');
  rect(620, 80, 140, 200, '#3d2914');
  rect(636, 96, 108, 168, '#1a0e0a');
  rect(650, 200, 40, 64, '#5c3b1c');
  rect(0, 360, W, 120, '#4a2c17');
  rect(80, 300, 640, 70, '#6b4226');
  rect(80, 300, 640, 8, '#3d2914');
  drawElf(120, 292);
}

function drawWrapRoom() {
  rect(0, 0, W, H, '#1d1020');
  rect(0, 0, W, H, '#241428');
  for (let i = 0; i < 8; i++) {
    rect(30 + i * 96, 20, 14, 10, i % 2 ? '#c41e3a' : '#1b7a4e');
  }
  rect(200, 300, 400, 90, '#5c3b1c');
  rect(200, 300, 400, 10, '#3d2914');
  rect(0, 390, W, 90, '#2a1810');
}

function drawSkyVillage(cam) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#071226');
  sky.addColorStop(0.55, '#1a0a20');
  sky.addColorStop(1, '#2a1230');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 1 ? '#74c69d' : '#c77dff';
    ctx.beginPath();
    const y = 40 + i * 18;
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 20) {
      ctx.lineTo(x, y + Math.sin((x + cam * 0.2 + i * 40) / 50) * 16);
    }
    ctx.lineTo(W, 0);
    ctx.lineTo(0, 0);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  rect(660, 36, 36, 36, '#f8f4e8');
  rect(668, 44, 20, 20, '#071226');

  for (let i = 0; i < 40; i++) {
    const sx = ((i * 97 - cam * 0.15) % (W + 20) + W + 20) % (W + 20) - 10;
    const sy = 12 + (i * 37) % 120;
    rect(sx, sy, 2, 2, '#fff8');
  }

  const groundY = 400;
  rect(0, groundY, W, 80, '#dce6f2');
  rect(0, groundY, W, 10, '#f8fbff');

  for (let i = 0; i < 18; i++) {
    const tx = ((i * 160 - cam * 0.4) % (W + 80)) - 40;
    drawTree(tx, groundY);
  }
}

function drawTree(x, groundY) {
  rect(x + 10, groundY - 18, 8, 18, '#5c3b1c');
  rect(x, groundY - 40, 28, 24, '#1b4332');
  rect(x + 4, groundY - 56, 20, 20, '#2d6a4f');
  rect(x + 8, groundY - 68, 12, 16, '#40916c');
}

function drawHouse(house, cam, selected) {
  const x = house.x - cam;
  const groundY = 400;
  const y = groundY - house.h;
  if (x < -120 || x > W + 40) return;
  if (selected) rect(x - 14, y - 78, house.w + 28, house.h + 86, '#ffd16633');
  rect(x, y, house.w, house.h, '#4a3222');
  rect(x - 10, y - 28, house.w + 20, 32, house.roof);
  rect(x + house.w / 2 - 8, y - 52, 16, 32, '#5c3b1c');
  rect(x + house.w / 2 - 12, y - 58, 24, 8, '#3d2914');
  rect(x + house.w / 2 - 6, y - 48, 8, 6, '#1a0e0a');
  rect(x + 12, y + 28, 18, 22, '#ffd166');
  rect(x + 54, y + 28, 18, 22, '#ffd166');
  rect(x + 34, y + 50, 18, 40, '#3d2914');
  drawText(house.order.kid.name, x + house.w / 2, y - 76, selected ? '#ffd166' : '#fff', 7, 'center');
}

function uiBtn(x, y, w, h, id, meta) {
  ui.push({ x, y, w, h, id, meta });
}

function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r * 0.3 + g * 0.59 + b * 0.11 > 150 ? '#1a120c' : '#fff8ef';
}

function drawBtn(b, label, fill, hover) {
  rect(b.x, b.y, b.w, b.h, hover ? '#ffd166' : fill);
  rect(b.x, b.y, b.w, 4, '#0003');
  drawText(label, b.x + b.w / 2, b.y + b.h / 2 - 5, hover ? '#1a120c' : inkOn(fill), 7, 'center');
}

function drawPartBtn(b, part, taken, hover, next) {
  const coat = taken ? '#3a2418' : part.hex;
  const rim = next ? '#ffd166' : hover ? '#fff' : '#14080c';
  rect(b.x - 3, b.y - 3, b.w + 6, b.h + 6, rim);
  rect(b.x, b.y, b.w, b.h, '#2a1810');
  rect(b.x, b.y, b.w, 16, coat);
  rect(b.x, b.y + 16, b.w, 4, '#0005');
  rect(b.x + 6, b.y + 24, 14, 14, coat);
  rect(b.x + 6, b.y + 24, 14, 14, taken ? '#0006' : '#fff2');
  drawText(part.name, b.x + 28, b.y + 28, taken ? '#7a5a40' : '#fff8ef', 7, 'left');
}

function hovered() {
  return ui.find((b) => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h);
}

function drawMake() {
  drawWorkshop();
  const order = game.orders[game.makeIndex];
  if (!order) return;
  rect(230, 90, 340, 70, '#3d2914');
  drawText(`${order.toy.name} for ${order.kid.name}`, 400, 102, '#ffd166', 8, 'center');
  let rx = 400 - (order.toy.parts.length * 92) / 2;
  order.toy.parts.forEach((id, i) => {
    const part = partById(id);
    const used = i < game.make.clicked.length;
    const next = i === game.make.clicked.length;
    rect(rx, 124, 10, 10, used ? '#2a1810' : part.hex);
    drawText(part.name, rx + 14, 124, used ? '#7a5a40' : next ? '#ffd166' : part.hex, 7, 'left');
    if (i < order.toy.parts.length - 1) drawText('>', rx + 70, 124, '#c9a227', 7, 'left');
    rx += 92;
  });
  drawText(`Gift ${game.makeIndex + 1} of ${game.orders.length}`, 400, 148, '#c9a227', 7, 'center');

  rect(330, 178, 140, 110, '#5c3b1c');
  rect(338, 186, 124, 94, '#7a5230');
  if (game.make.clicked.length === 0) {
    ctx.globalAlpha = 0.28;
    drawToy(order.toy.id, 3, 400, 240, 2.4);
    ctx.globalAlpha = 1;
    drawText('click parts', 400, 268, '#f4e4c8', 6, 'center');
  } else {
    drawToy(order.toy.id, game.make.clicked.length, 400, 240, 2.4);
  }

  const nextId = order.toy.parts[game.make.clicked.length];
  game.make.bench.forEach((id, i) => {
    const taken = game.make.clicked.includes(id);
    const x = 86 + i * 112;
    const y = 386;
    const b = { x, y, w: 102, h: 58 };
    if (!taken) uiBtn(b.x, b.y, b.w, b.h, 'part', id);
    const hot = hovered() && hovered().id === 'part' && hovered().meta === id;
    drawPartBtn(b, partById(id), taken, hot && !taken, !taken && id === nextId);
  });

  if (game.make.flash > 0) {
    ctx.fillStyle = `rgba(196,30,58,${game.make.flash / 400})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawWrap() {
  drawWrapRoom();
  const order = game.orders[game.wrapIndex];
  if (!order || !game.wrap) return;
  const cfg = NIGHTS[game.night - 1];
  rect(180, 70, 440, 64, '#3d1020');
  drawText(`${order.kid.name}'s ${order.toy.name}`, 400, 80, '#ffd166', 8, 'center');
  drawText(`Wanted: ${paperById(order.kid.paper).name} paper · ${ribbonById(order.kid.ribbon).name} bow`, 400, 104, '#f4e4c8', 7, 'center');
  drawText(`Gift ${game.wrapIndex + 1} of ${game.orders.length}`, 400, 122, '#c9a227', 7, 'center');

  const wrapLevel = game.wrap.step === 'paper' ? 0 : game.wrap.hits + game.wrap.miss;
  drawPresentBox(400, 220, game.wrap.paper || 'wood', game.wrap.ribbon, wrapLevel, 2.1);
  if (!game.wrap.paper) drawToy(order.toy.id, 3, 400, 214, 1.2);

  if (game.wrap.step === 'paper') {
    drawText('Pick wrapping paper', 400, 330, '#fff', 8, 'center');
    PAPERS.forEach((p, i) => {
      const x = 120 + i * 150;
      const b = { x, y: 360, w: 130, h: 50 };
      uiBtn(b.x, b.y, b.w, b.h, 'paper', p.id);
      const hot = hovered() && hovered().meta === p.id;
      drawBtn(b, p.name, p.hex, hot);
    });
  } else if (game.wrap.step === 'bar') {
    drawText('Click when the mark is in the gold', 400, 318, '#fff', 7, 'center');
    const bx = 140;
    const by = 350;
    const bw = 520;
    const bh = 28;
    rect(bx, by, bw, bh, '#1a0e0a');
    const z0 = bx + (0.5 - cfg.zone) * bw;
    const zw = cfg.zone * 2 * bw;
    rect(z0, by, zw, bh, '#d4a017');
    const mx = bx + game.wrap.bar * bw;
    rect(mx - 5, by - 6, 10, bh + 12, '#fff');
    uiBtn(100, 390, 600, 70, 'bar');
    drawText('Click / Space', 400, 400, '#c9a227', 7, 'center');
  } else if (game.wrap.step === 'ribbon') {
    drawText('Pick a ribbon bow', 400, 330, '#fff', 8, 'center');
    RIBBONS.forEach((r, i) => {
      const x = 120 + i * 150;
      const b = { x, y: 360, w: 130, h: 50 };
      uiBtn(b.x, b.y, b.w, b.h, 'ribbon', r.id);
      const hot = hovered() && hovered().meta === r.id;
      drawBtn(b, r.name, r.hex, hot);
    });
  }
}

function drawDeliver() {
  const d = game.deliver;
  drawSkyVillage(d.cam);
  const sel = selectedOrder();
  d.houses.forEach((house) => drawHouse(house, d.cam, sel === house.order));

  d.birds.forEach((b) => {
    const x = b.x - d.cam;
    const y = b.baseY + Math.sin(b.t) * b.amp;
    if (x < -20 || x > W + 20) return;
    rect(x, y, 14, 6, '#2b2b2b');
    rect(x + 4, y - 6, 10, 6, '#444');
  });

  d.falling.forEach((p) => {
    drawPresentBox(p.x - d.cam, p.y, p.order.paper, p.order.ribbon, 3, 0.7);
  });

  drawSantaSleigh(d.x - d.cam, d.y, d.facing);

  const ready = game.orders.filter((o) => !o.delivered && !o.missed);
  ready.forEach((o, i) => {
    const x = 16 + i * 154;
    const y = 430;
    const b = { x, y, w: 146, h: 40 };
    uiBtn(b.x, b.y, b.w, b.h, 'pick', i);
    const hot = hovered() && hovered().id === 'pick' && hovered().meta === i;
    const fill = i === d.selected ? paperById(o.paper).hex : '#2a1810';
    drawBtn(b, `${i + 1} ${o.kid.name}`, fill, hot);
  });

  const t = Math.max(0, Math.ceil(d.time));
  drawText(`Sunrise ${t}s`, 788, 8, t < 10 ? '#ff4d6d' : '#fff', 8, 'right');
  drawText(`${game.nightStats.delivered}/${game.orders.length} homes`, 788, 26, '#ffd166', 7, 'right');
}

function drawSnow(dt) {
  snow.forEach((f) => {
    f.y += f.v * dt;
    f.x += Math.sin(f.drift) * 12 * dt;
    f.drift += dt;
    if (f.y > H) {
      f.y = -4;
      f.x = Math.random() * W;
    }
    rect(f.x, f.y, f.s, f.s, '#ffffffcc');
  });
}

function drawFx(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.life -= dt * 1000;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 220 * dt;
    if (s.life <= 0) sparks.splice(i, 1);
    else rect(s.x, s.y, 3, 3, s.color);
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i];
    p.life -= dt * 1000;
    p.r += 30 * dt;
    if (p.life <= 0) puffs.splice(i, 1);
    else {
      ctx.globalAlpha = Math.max(0, p.life / 380);
      rect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r, '#fff');
      ctx.globalAlpha = 1;
    }
  }
}

function handleClick() {
  if (overlay.classList.contains('hidden') === false) return;
  const hit = hovered();
  if (game.mode === 'make' && hit && hit.id === 'part') clickPart(hit.meta);
  else if (game.mode === 'wrap' && hit) {
    if (hit.id === 'paper') pickPaper(hit.meta);
    else if (hit.id === 'bar') tapWrapBar();
    else if (hit.id === 'ribbon') pickRibbon(hit.meta);
  } else if (game.mode === 'deliver') {
    if (hit && hit.id === 'pick') game.deliver.selected = hit.meta;
    else dropPresent();
  }
}

function updateMake(dt) {
  if (game.make.flash > 0) game.make.flash -= dt * 1000;
}

function updateWrap(dt) {
  if (game.wrap.step !== 'bar') return;
  const cfg = NIGHTS[game.night - 1];
  game.wrap.bar += game.wrap.dir * cfg.wrapSpeed * dt;
  if (game.wrap.bar >= 1) {
    game.wrap.bar = 1;
    game.wrap.dir = -1;
  } else if (game.wrap.bar <= 0) {
    game.wrap.bar = 0;
    game.wrap.dir = 1;
  }
}

function updateDeliver(dt) {
  const d = game.deliver;
  if (d.done) return;

  let ax = 0;
  let ay = 0;
  if (keys.a || keys.arrowleft) ax -= 1;
  if (keys.d || keys.arrowright) ax += 1;
  if (keys.w || keys.arrowup) ay -= 1;
  if (keys.s || keys.arrowdown) ay += 1;
  if (!ax && !ay && mouse.y < 390) {
    ax += Math.max(-1, Math.min(1, (mouse.x - (d.x - d.cam)) / 120));
    ay += Math.max(-1, Math.min(1, (mouse.y - d.y) / 110));
  }
  const shiftBrake = keys.shift;
  const brakeX = !shiftBrake && ax && d.vx * ax < 0;
  const brakeY = !shiftBrake && ay && d.vy * ay < 0;
  const accel = shiftBrake ? 900 : 2200;
  const accelY = shiftBrake ? 700 : 1800;
  d.vx += ax * (brakeX ? 3800 : accel) * dt;
  d.vy += ay * (brakeY ? 3200 : accelY) * dt;
  d.vx *= shiftBrake ? 0.78 : brakeX ? 0.8 : 0.94;
  d.vy *= shiftBrake ? 0.78 : brakeY ? 0.8 : 0.94;
  if (Math.abs(d.vx) > 18) d.facing = d.vx > 0 ? 1 : -1;
  d.x += d.vx * dt;
  d.y += d.vy * dt;
  d.x = Math.max(40, Math.min(d.worldW - 40, d.x));
  d.y = Math.max(50, Math.min(330, d.y));
  d.cam += (d.x - 280 - d.cam) * Math.min(1, 4 * dt);
  d.cam = Math.max(0, Math.min(d.worldW - W, d.cam));

  d.birds.forEach((b) => {
    b.t += dt * 2;
    b.x += b.vx * dt;
    if (b.x > d.worldW) b.x = 200;
    const by = b.baseY + Math.sin(b.t) * b.amp;
    if (Math.abs(b.x - d.x) < 28 && Math.abs(by - d.y) < 20) {
      d.vx -= 80;
      shake = 7;
      say('A goose clipped the sleigh!');
    }
  });

  for (let i = d.falling.length - 1; i >= 0; i--) {
    const p = d.falling[i];
    p.vy += 520 * dt;
    p.y += p.vy * dt;
    let landed = false;
    d.houses.forEach((house) => {
      const cx = house.x + house.w / 2;
      const cy = 400 - house.h - 40;
      if (Math.abs(p.x - cx) < 22 && p.y > cy && p.y < cy + 36) {
        p.order.missed = false;
        scoreDelivery(p.order, house);
        puff(cx, cy);
        landed = true;
      }
    });
    if (!landed && p.y > 400) {
      puff(p.x, 396);
      say(`${p.order.kid.name}'s gift landed in the snow.`);
      landed = true;
    }
    if (landed) d.falling.splice(i, 1);
  }

  d.time -= dt;
  const leftover = game.orders.filter((o) => !o.delivered && !o.missed);
  if (d.time <= 0 || (leftover.length === 0 && d.falling.length === 0)) {
    finishDeliver();
  }
}

function tick(t) {
  const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
  last = t;
  ui = [];

  if (msgTimer > 0) {
    msgTimer -= dt * 1000;
    if (msgTimer <= 0) messageBox.textContent = '';
  }
  if (shake > 0) shake *= 0.85;

  ctx.save();
  if (shake > 0.4) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  if (game.mode === 'make') {
    updateMake(dt);
    drawMake();
  } else if (game.mode === 'wrap') {
    updateWrap(dt);
    drawWrap();
  } else if (game.mode === 'deliver') {
    updateDeliver(dt);
    drawDeliver();
  } else {
    drawWorkshop();
    drawText('NORTH POLE NIGHT', 400, 200, '#ffd166', 14, 'center');
  }

  drawSnow(dt);
  drawFx(dt);
  ctx.restore();
  requestAnimationFrame(tick);
}

function showTitle() {
  game.mode = 'title';
  updateHud();
  questLabel.textContent = 'Make, wrap, and deliver before sunrise';
  showOverlay(`
    <h2>North Pole Night</h2>
    <p>Christmas Eve. Three nights. One list.</p>
    <p>1. Click the recipe parts to make each toy.</p>
    <p>2. Match paper and ribbon, then time the wrap.</p>
    <p>3. Fly the sleigh and drop gifts down the right chimneys.</p>
    <button type="button" id="start-eve">Start Christmas Eve</button>
  `);
  document.getElementById('start-eve').onclick = () => {
    game.score = 0;
    startNight(1);
  };
}

canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
});

canvas.addEventListener('mousedown', () => {
  mouse.down = true;
  handleClick();
});

window.addEventListener('mouseup', () => {
  mouse.down = false;
});

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape') {
    if (game.mode === 'pause') {
      hideOverlay();
      game.mode = game._resume || 'make';
    } else if (['make', 'wrap', 'deliver'].includes(game.mode)) {
      game._resume = game.mode;
      game.mode = 'pause';
      showOverlay(`
        <h2>Paused</h2>
        <p>The toys can wait a second.</p>
        <button type="button" id="resume-btn">Back to work</button>
      `);
      document.getElementById('resume-btn').onclick = () => {
        hideOverlay();
        game.mode = game._resume;
      };
    }
    return;
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (game.mode === 'wrap' && game.wrap && game.wrap.step === 'bar') tapWrapBar();
    if (game.mode === 'deliver') dropPresent();
  }
  const num = parseInt(e.key, 10);
  if (game.mode === 'deliver' && num >= 1 && num <= 5) {
    game.deliver.selected = num - 1;
  }
  if (game.mode === 'make' && num >= 1 && num <= 6 && game.make) {
    const id = game.make.bench[num - 1];
    if (id) clickPart(id);
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

showTitle();
requestAnimationFrame(tick);
