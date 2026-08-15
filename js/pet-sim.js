import { PETS } from './pets.js';
import { drawSpecies } from './pet-draw.js';

const W = 800;
const H = 480;
const WORLD_W = 1400;
const WORLD_H = 900;
const SAVE_KEY = 'petsim-save';
const MAX_EQUIP = 4;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const panel = document.getElementById('panel');
const panelContent = document.getElementById('panel-content');
const coinsLabel = document.getElementById('coins-label');
const multLabel = document.getElementById('mult-label');
const areaLabel = document.getElementById('area-label');
const hintLabel = document.getElementById('hint-label');

const RARITY = {
  common: { id: 'common', label: 'Common', color: '#cfc7c0', mult: 1.2 },
  uncommon: { id: 'uncommon', label: 'Uncommon', color: '#52b788', mult: 1.8 },
  rare: { id: 'rare', label: 'Rare', color: '#4cc9f0', mult: 3.5 },
  epic: { id: 'epic', label: 'Epic', color: '#9b5de5', mult: 8 },
  legendary: { id: 'legendary', label: 'Legendary', color: '#ffd166', mult: 18 },
  mythic: { id: 'mythic', label: 'Mythic', color: '#ff6bcb', mult: 45 },
};

const PET_RARITY = {
  mouse: 'common', hamster: 'common', gerbil: 'common', chicken: 'common',
  pigeon: 'common', finch: 'common', lizard: 'common', snail: 'common',
  goldfish: 'common', goat: 'common', duck: 'common', newt: 'common',
  guinea: 'uncommon', 'guinea-pig': 'uncommon', rabbit: 'uncommon', cat: 'uncommon',
  dog: 'uncommon', rat: 'uncommon', parakeet: 'uncommon', frog: 'uncommon',
  gecko: 'uncommon', pig: 'uncommon', sheep: 'uncommon', lovebird: 'uncommon',
  'hermit-crab': 'uncommon', hedgehog: 'uncommon',
  parrot: 'rare', cockatiel: 'rare', canary: 'rare', turtle: 'rare',
  ferret: 'rare', otter: 'rare', cow: 'rare', donkey: 'rare', pony: 'rare',
  betta: 'rare', tortoise: 'rare',
  'bearded-dragon': 'epic', iguana: 'epic', snake: 'epic', horse: 'epic',
  alpaca: 'epic', koala: 'epic', raccoon: 'epic', penguin: 'epic',
  chameleon: 'legendary', axolotl: 'legendary', fox: 'legendary',
  owl: 'legendary', llama: 'legendary', capybara: 'legendary',
  panda: 'mythic', 'sugar-glider': 'mythic', chinchilla: 'mythic',
};

const EGGS = [
  {
    id: 'common', name: 'Common Egg', price: 80, color: '#c4b7a6',
    weights: { common: 70, uncommon: 25, rare: 5 },
  },
  {
    id: 'rare', name: 'Rare Egg', price: 900, color: '#4cc9f0',
    weights: { uncommon: 40, rare: 42, epic: 15, legendary: 3 },
  },
  {
    id: 'legend', name: 'Legendary Egg', price: 14000, color: '#ffd166',
    weights: { rare: 30, epic: 42, legendary: 22, mythic: 6 },
  },
  {
    id: 'mythic', name: 'Mythic Egg', price: 120000, color: '#ff6bcb',
    weights: { epic: 20, legendary: 40, mythic: 40 },
  },
];

const AREAS = [
  {
    id: 'meadow', name: 'Sunny Meadow', unlock: 0, coin: 1, count: 30,
    ground: ['#7cb342', '#8bc34a', '#9ccc65'], dark: '#558b2f', sky: '#87ceeb',
    accent: '#e9c46a', hint: 'Coins everywhere. Shop is north. Portal is to the right.',
  },
  {
    id: 'beach', name: 'Pearl Beach', unlock: 2500, coin: 8, count: 34,
    ground: ['#f4e4b0', '#ead89a', '#f6d58a'], dark: '#d4a373', sky: '#4cc9f0',
    accent: '#4cc9f0', hint: 'Shells are worth more. Keep hatching!',
  },
  {
    id: 'candy', name: 'Candy Kingdom', unlock: 28000, coin: 48, count: 38,
    ground: ['#f8b4d4', '#f48fb1', '#fce4ec'], dark: '#e07a9a', sky: '#c77dff',
    accent: '#e63946', hint: 'Sugar coins melt into your bag. Go mythic.',
  },
  {
    id: 'space', name: 'Star Harbor', unlock: 220000, coin: 240, count: 42,
    ground: ['#1a1a40', '#2d2d6a', '#16213e'], dark: '#0d0d24', sky: '#0b1026',
    accent: '#c77dff', hint: 'Star shards! Rebirth when you are ready.',
  },
];

const keys = new Set();
let lastTime = 0;
let clock = 0;
let uid = 1;
let menu = null;
let paused = false;
let hatch = null;
let hintTimer = 6;
let toast = '';
let toastTimer = 0;

const state = {
  coins: 0,
  rebirths: 0,
  area: 0,
  pets: [],
  equipped: [],
};

const player = { x: 220, y: 480, dir: 1, walk: 0 };
const trail = [];
let coins = [];
let decor = [];
let popups = [];
let sparkles = [];

function speciesById(id) {
  return PETS.find((p) => p.id === id) || PETS[0];
}

function rarityOf(speciesId) {
  return PET_RARITY[speciesId] || 'common';
}

function petsOfRarity(rarity) {
  return PETS.filter((p) => rarityOf(p.id) === rarity);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatCoins(n) {
  const v = Math.floor(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}m`;
  if (v >= 10_000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

function rebirthMult() {
  return 1 + state.rebirths;
}

function equippedPets() {
  return state.equipped
    .map((id) => state.pets.find((p) => p.uid === id))
    .filter(Boolean);
}

function totalMult() {
  const pets = equippedPets();
  if (!pets.length) return rebirthMult();
  const petSum = pets.reduce((sum, p) => sum + RARITY[p.rarity].mult, 0);
  return rebirthMult() * petSum;
}

function rebirthCost() {
  return Math.floor(800000 * (2 ** state.rebirths));
}

function say(text, seconds = 3.2) {
  toast = text;
  toastTimer = seconds;
  hintLabel.textContent = text;
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    coins: state.coins,
    rebirths: state.rebirths,
    area: state.area,
    pets: state.pets,
    equipped: state.equipped,
    uid,
  }));
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.coins = data.coins || 0;
    state.rebirths = data.rebirths || 0;
    state.area = clamp(data.area || 0, 0, AREAS.length - 1);
    state.pets = Array.isArray(data.pets) ? data.pets : [];
    state.equipped = Array.isArray(data.equipped) ? data.equipped : [];
    uid = data.uid || state.pets.length + 1;
  } catch {
    /* ignore bad saves */
  }
}

function addPet(species, rarity) {
  const pet = {
    uid: uid++,
    speciesId: species.id,
    rarity,
    name: species.name,
  };
  state.pets.push(pet);
  if (state.equipped.length < MAX_EQUIP) state.equipped.push(pet.uid);
  save();
  return pet;
}

function spawnCoins() {
  const area = AREAS[state.area];
  coins = [];
  for (let i = 0; i < area.count; i++) {
    coins.push(makeCoin(area));
  }
}

function makeCoin(area) {
  const big = Math.random() < 0.12;
  return {
    x: 80 + Math.random() * (WORLD_W - 160),
    y: 80 + Math.random() * (WORLD_H - 160),
    big,
    value: area.coin * (big ? 5 : 1),
    spin: Math.random() * Math.PI * 2,
  };
}

function buildDecor() {
  const rng = mulberry32(state.area * 9176 + 42);
  decor = [];
  for (let i = 0; i < 48; i++) {
    decor.push({
      kind: rng() < 0.45 ? 'tree' : rng() < 0.5 ? 'flower' : 'rock',
      x: 40 + rng() * (WORLD_W - 80),
      y: 40 + rng() * (WORLD_H - 80),
      s: 0.7 + rng() * 0.7,
      v: rng(),
    });
  }
}

function seedTrail() {
  trail.length = 0;
  for (let i = 0; i < 120; i++) trail.push({ x: player.x - i * 3, y: player.y });
}

function enterArea(index, fromLeft) {
  state.area = index;
  player.x = fromLeft ? 90 : WORLD_W - 90;
  player.y = WORLD_H / 2;
  seedTrail();
  spawnCoins();
  buildDecor();
  say(AREAS[index].hint);
  save();
}

function rollRarity(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of entries) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return entries[0][0];
}

function hatchEgg(egg) {
  if (state.coins < egg.price) {
    say('Not enough coins for that egg.');
    return;
  }
  state.coins -= egg.price;
  closeMenus();
  hatch = { egg, t: 0, phase: 'shake' };
  save();
}

function finishHatch() {
  const rarity = rollRarity(hatch.egg.weights);
  const pool = petsOfRarity(rarity);
  const species = pick(pool.length ? pool : PETS);
  const pet = addPet(species, rarity);
  const dupe = state.pets.filter((p) => p.speciesId === species.id).length > 1;
  hatch = null;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <div class="hatch-emoji">${species.emoji}</div>
    <h2>${species.name}</h2>
    <p style="color:${RARITY[rarity].color}">${RARITY[rarity].label} · ×${RARITY[rarity].mult}</p>
    <p>${dupe ? 'A familiar friend joins the parade!' : 'A new pet hatched!'}</p>
    <button id="hatch-ok" type="button">Awesome</button>
  `;
  overlayContent.querySelector('#hatch-ok').onclick = () => {
    overlay.classList.add('hidden');
    say(`${species.name} is following you!`);
  };
}

function magnetRange() {
  return 36 + equippedPets().length * 16;
}

function collectCoin(coin) {
  const gained = Math.max(1, Math.floor(coin.value * totalMult()));
  state.coins += gained;
  popups.push({
    x: coin.x,
    y: coin.y,
    text: `+${formatCoins(gained)}`,
    life: 0.9,
    color: coin.big ? '#fff3b0' : '#ffd166',
  });
  for (let i = 0; i < (coin.big ? 8 : 4); i++) {
    sparkles.push({
      x: coin.x,
      y: coin.y,
      vx: (Math.random() - 0.5) * 80,
      vy: -20 - Math.random() * 50,
      life: 0.4 + Math.random() * 0.3,
      color: coin.big ? '#fff' : '#ffd166',
    });
  }
}

function nearShop() {
  return state.area === 0 && Math.hypot(player.x - 260, player.y - 240) < 70;
}

function nearPortal(side) {
  if (side === 'next') return player.x > WORLD_W - 90 && Math.abs(player.y - WORLD_H / 2) < 90;
  return player.x < 90 && Math.abs(player.y - WORLD_H / 2) < 90;
}

function tryPortal() {
  if (nearPortal('next')) {
    const next = state.area + 1;
    if (next >= AREAS.length) {
      say('This is the last world. Time to rebirth?');
      return;
    }
    const need = Math.floor(AREAS[next].unlock / (1 + state.rebirths * 2));
    if (state.coins < need) {
      say(`Need ${formatCoins(need)} coins to open ${AREAS[next].name}.`);
      return;
    }
    enterArea(next, true);
    return;
  }
  if (nearPortal('prev') && state.area > 0) {
    enterArea(state.area - 1, false);
  }
}

function interact() {
  if (menu || hatch || paused) return;
  if (nearShop()) {
    openShop();
    return;
  }
  tryPortal();
}

function closeMenus() {
  menu = null;
  paused = false;
  panel.classList.add('hidden');
  overlay.classList.add('hidden');
}

function openShop() {
  menu = 'shop';
  panel.classList.remove('hidden');
  panelContent.innerHTML = `
    <h2>Egg Shop</h2>
    <p class="panel-sub">Coins ${formatCoins(state.coins)} · Hatch a pet, then equip it.</p>
    <div class="panel-grid">
      ${EGGS.map((egg) => `
        <button class="egg-card" data-egg="${egg.id}" type="button">
          <span class="pet-emoji">🥚</span>
          ${egg.name}
          <span class="rarity" style="color:${egg.color}">${formatCoins(egg.price)} coins</span>
        </button>
      `).join('')}
    </div>
    <div class="panel-actions">
      <button class="ghost" id="close-panel" type="button">Close</button>
    </div>
  `;
  panelContent.querySelectorAll('[data-egg]').forEach((btn) => {
    btn.onclick = () => hatchEgg(EGGS.find((e) => e.id === btn.dataset.egg));
  });
  panelContent.querySelector('#close-panel').onclick = closeMenus;
}

function openPets() {
  menu = 'pets';
  const list = [...state.pets].sort((a, b) => RARITY[b.rarity].mult - RARITY[a.rarity].mult);
  panel.classList.remove('hidden');
  panelContent.innerHTML = `
    <h2>Your Pets</h2>
    <p class="panel-sub">Equip up to ${MAX_EQUIP}. Multiplier ×${totalMult().toFixed(1)}</p>
    <div class="panel-grid">
      ${list.length ? list.map((pet) => {
        const spec = speciesById(pet.speciesId);
        const on = state.equipped.includes(pet.uid);
        return `
          <button class="pet-card${on ? ' equipped' : ''}" data-uid="${pet.uid}" type="button">
            <span class="pet-emoji">${spec.emoji}</span>
            ${spec.name}
            <span class="rarity" style="color:${RARITY[pet.rarity].color}">${RARITY[pet.rarity].label} ×${RARITY[pet.rarity].mult}</span>
            ${on ? 'Equipped' : 'Click to equip'}
          </button>
        `;
      }).join('') : '<p class="panel-sub">No pets yet. Buy an egg!</p>'}
    </div>
    <div class="panel-actions">
      <button class="ghost" id="close-panel" type="button">Close</button>
    </div>
  `;
  panelContent.querySelectorAll('[data-uid]').forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.uid);
      const idx = state.equipped.indexOf(id);
      if (idx >= 0) state.equipped.splice(idx, 1);
      else if (state.equipped.length < MAX_EQUIP) state.equipped.push(id);
      else say(`You can only walk with ${MAX_EQUIP} pets.`);
      save();
      openPets();
    };
  });
  panelContent.querySelector('#close-panel').onclick = closeMenus;
}

function openRebirth() {
  menu = 'rebirth';
  const cost = rebirthCost();
  panel.classList.remove('hidden');
  panelContent.innerHTML = `
    <h2>Rebirth</h2>
    <p class="panel-sub">Reset coins and worlds. Keep every pet. Gain +1× forever.</p>
    <p class="panel-sub">Now ×${rebirthMult().toFixed(1)} · Next ×${(rebirthMult() + 1).toFixed(1)}</p>
    <p class="panel-sub">Cost ${formatCoins(cost)} coins</p>
    <div class="panel-actions">
      <button id="do-rebirth" type="button">Rebirth</button>
      <button class="ghost" id="close-panel" type="button">Close</button>
    </div>
  `;
  panelContent.querySelector('#do-rebirth').onclick = () => {
    if (state.coins < cost) {
      say('Need more coins to rebirth.');
      return;
    }
    state.coins = 0;
    state.rebirths += 1;
    enterArea(0, true);
    closeMenus();
    say(`Rebirth ${state.rebirths}! Pets kept. Multiplier ×${rebirthMult().toFixed(1)}.`);
    save();
  };
  panelContent.querySelector('#close-panel').onclick = closeMenus;
}

function showPause() {
  paused = true;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Paused</h2>
    <p>Your pets will wait.</p>
    <button id="resume-btn" type="button">Resume</button>
  `;
  overlayContent.querySelector('#resume-btn').onclick = () => {
    paused = false;
    overlay.classList.add('hidden');
  };
}

function updateHud() {
  coinsLabel.textContent = `🪙 ${formatCoins(state.coins)}`;
  multLabel.textContent = `×${totalMult().toFixed(1)}`;
  areaLabel.textContent = AREAS[state.area].name;
  if (toastTimer > 0) return;
  if (nearShop()) hintLabel.textContent = 'Space: open the egg shop';
  else if (nearPortal('next')) hintLabel.textContent = 'Space: next world';
  else if (nearPortal('prev') && state.area > 0) hintLabel.textContent = 'Space: previous world';
  else hintLabel.textContent = AREAS[state.area].hint;
}

function updatePlayer(dt) {
  let ax = 0;
  let ay = 0;
  if (keys.has('arrowleft') || keys.has('a')) ax -= 1;
  if (keys.has('arrowright') || keys.has('d')) ax += 1;
  if (keys.has('arrowup') || keys.has('w')) ay -= 1;
  if (keys.has('arrowdown') || keys.has('s')) ay += 1;
  const len = Math.hypot(ax, ay);
  if (len > 0) {
    ax /= len;
    ay /= len;
    player.dir = ax === 0 ? player.dir : Math.sign(ax);
    player.walk += dt * 10;
  } else {
    player.walk *= 0.8;
  }
  const speed = 168;
  player.x = clamp(player.x + ax * speed * dt, 28, WORLD_W - 28);
  player.y = clamp(player.y + ay * speed * dt, 40, WORLD_H - 28);
  if (len > 0) {
    trail.unshift({ x: player.x, y: player.y });
    if (trail.length > 220) trail.length = 220;
  }
}

function updateCoins(dt) {
  const magnet = magnetRange();
  const area = AREAS[state.area];
  for (const coin of coins) {
    coin.spin += dt * 6;
    const dx = player.x - coin.x;
    const dy = player.y - coin.y;
    const dist = Math.hypot(dx, dy);
    if (dist < magnet && dist > 1) {
      const pull = 220 * dt;
      coin.x += (dx / dist) * pull;
      coin.y += (dy / dist) * pull;
    }
    if (dist < 24) {
      collectCoin(coin);
      Object.assign(coin, makeCoin(area));
    }
  }
}

function updateFx(dt) {
  popups = popups.filter((p) => {
    p.life -= dt;
    p.y -= 28 * dt;
    return p.life > 0;
  });
  sparkles = sparkles.filter((s) => {
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 90 * dt;
    return s.life > 0;
  });
}

function cam() {
  return {
    x: clamp(player.x - W / 2, 0, WORLD_W - W),
    y: clamp(player.y - H / 2, 0, WORLD_H - H),
  };
}

function drawGround(c) {
  const area = AREAS[state.area];
  ctx.fillStyle = area.sky;
  ctx.fillRect(0, 0, W, H);
  const tile = 32;
  const x0 = Math.floor(c.x / tile) * tile;
  const y0 = Math.floor(c.y / tile) * tile;
  for (let y = y0; y < c.y + H + tile; y += tile) {
    for (let x = x0; x < c.x + W + tile; x += tile) {
      const n = (Math.floor(x / tile) * 13 + Math.floor(y / tile) * 7) % 3;
      ctx.fillStyle = area.ground[n];
      ctx.fillRect(x - c.x, y - c.y, tile, tile);
    }
  }
}

function drawTree(x, y, s, area) {
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x - 4 * s, y - 8 * s, 8 * s, 18 * s);
  if (area.id === 'space') {
    ctx.fillStyle = '#c77dff';
    ctx.beginPath();
    ctx.arc(x, y - 22 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (area.id === 'candy') {
    ctx.fillStyle = '#e63946';
    ctx.fillRect(x - 3 * s, y - 40 * s, 6 * s, 36 * s);
    ctx.fillStyle = '#fff8ef';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x - 12 * s, y - 36 * s + i * 8 * s, 24 * s, 4 * s);
    }
  } else if (area.id === 'beach') {
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x - 3 * s, y - 28 * s, 6 * s, 36 * s);
    ctx.fillStyle = '#40916c';
    ctx.beginPath();
    ctx.ellipse(x, y - 28 * s, 16 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.arc(x, y - 22 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#40916c';
    ctx.beginPath();
    ctx.arc(x + 8 * s, y - 18 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDecor(c) {
  const area = AREAS[state.area];
  for (const d of decor) {
    const x = d.x - c.x;
    const y = d.y - c.y;
    if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
    if (d.kind === 'tree') drawTree(x, y, d.s, area);
    else if (d.kind === 'flower') {
      ctx.fillStyle = area.accent;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x - 1, y, 2, 6);
    } else {
      ctx.fillStyle = area.dark;
      ctx.beginPath();
      ctx.ellipse(x, y, 10 * d.s, 6 * d.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawShop(c) {
  if (state.area !== 0) return;
  const x = 260 - c.x;
  const y = 240 - c.y;
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x - 48, y - 8, 96, 36);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(x - 56, y - 28, 112, 20);
  ctx.fillStyle = '#fff8ef';
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) ctx.fillRect(x - 56 + i * 16, y - 28, 16, 20);
  }
  ctx.fillStyle = '#c4b7a6';
  ctx.beginPath();
  ctx.ellipse(x - 18, y + 4, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4cc9f0';
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 2, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.ellipse(x + 24, y + 4, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8ef';
  ctx.font = '7px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('EGGS', x, y - 36);
  ctx.fillStyle = nearShop() ? '#ffd166' : '#fff8ef';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('Space', x, y + 42);
  ctx.textAlign = 'left';
}

function drawPortal(c, side) {
  const px = (side === 'next' ? WORLD_W - 48 : 48) - c.x;
  const py = WORLD_H / 2 - c.y;
  const next = side === 'next' ? AREAS[state.area + 1] : AREAS[state.area - 1];
  if (!next) return;
  const pulse = 18 + Math.sin(clock * 4) * 4;
  ctx.fillStyle = next.accent;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(px, py, 16, pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff8ef';
  ctx.font = '6px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(next.name.split(' ')[0], px, py - 32);
  ctx.textAlign = 'left';
}

function drawCoin(coin, c) {
  const x = coin.x - c.x;
  const y = coin.y - c.y;
  if (x < -20 || y < -20 || x > W + 20 || y > H + 20) return;
  const area = AREAS[state.area];
  const squash = 0.35 + Math.abs(Math.cos(coin.spin)) * 0.65;
  const r = (coin.big ? 12 : 8) * squash;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = coin.big ? '#fff3b0' : area.accent;
  ctx.beginPath();
  ctx.ellipse(x, y, r, coin.big ? 12 : 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d2914';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPlayer(c) {
  const x = player.x - c.x;
  const y = player.y - c.y + Math.sin(player.walk) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, player.y - c.y + 16, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d3557';
  ctx.fillRect(x - 8, y + 2, 16, 12);
  ctx.fillStyle = '#4cc9f0';
  ctx.fillRect(x - 9, y - 8, 18, 12);
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.arc(x, y - 16, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(x - 8, y - 24, 16, 6);
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(x - 4 + player.dir * 3, y - 18, 3, 3);
  ctx.fillRect(x + 2 + player.dir * 3, y - 18, 3, 3);
}

function drawFollowers(c) {
  const pets = equippedPets();
  pets.forEach((pet, i) => {
    const node = trail[18 + i * 22] || trail[trail.length - 1] || player;
    const spec = speciesById(pet.speciesId);
    const x = node.x - c.x;
    const y = node.y - c.y - 8;
    ctx.fillStyle = RARITY[pet.rarity].color;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.28, 0.28);
    ctx.translate(-400, -318);
    drawSpecies(ctx, { species: spec, blink: 0, actionTime: clock }, clock, {
      mood: 88,
      sleeping: false,
      playing: true,
      eating: false,
      drinking: false,
      loving: false,
      sad: false,
      crying: false,
    });
    ctx.restore();
  });
}

function drawHatch() {
  if (!hatch) return;
  ctx.fillStyle = 'rgba(12, 6, 22, 0.72)';
  ctx.fillRect(0, 0, W, H);
  const shake = hatch.phase === 'shake' ? Math.sin(hatch.t * 28) * 10 : 0;
  const x = W / 2 + shake;
  const y = H / 2;
  ctx.fillStyle = hatch.egg.color;
  ctx.beginPath();
  ctx.ellipse(x, y, 36, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff8ef';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - 10, y - 14, 8, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(hatch.phase === 'shake' ? 'Hatching...' : '!', x, y - 70);
  ctx.textAlign = 'left';
}

function drawFx(c) {
  for (const s of sparkles) {
    ctx.globalAlpha = clamp(s.life / 0.5, 0, 1);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - c.x, s.y - c.y, 3, 3);
    ctx.globalAlpha = 1;
  }
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  for (const p of popups) {
    ctx.globalAlpha = clamp(p.life / 0.9, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x - c.x, p.y - c.y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

function render() {
  const c = cam();
  ctx.clearRect(0, 0, W, H);
  drawGround(c);
  drawDecor(c);
  drawShop(c);
  drawPortal(c, 'prev');
  drawPortal(c, 'next');
  for (const coin of coins) drawCoin(coin, c);
  drawFollowers(c);
  drawPlayer(c);
  drawFx(c);
  drawHatch();
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  clock += dt;
  const blocked = paused || menu || hatch || !overlay.classList.contains('hidden');
  if (!blocked) {
    updatePlayer(dt);
    updateCoins(dt);
    updateFx(dt);
    hintTimer -= dt;
    toastTimer -= dt;
  }
  if (hatch) {
    hatch.t += dt;
    if (hatch.phase === 'shake' && hatch.t > 1.6) finishHatch();
  }
  updateHud();
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);
  if (e.repeat) return;

  if (key === 'escape') {
    e.preventDefault();
    if (menu) closeMenus();
    else if (hatch) return;
    else if (paused) {
      paused = false;
      overlay.classList.add('hidden');
    } else showPause();
    return;
  }

  if (menu || !overlay.classList.contains('hidden')) {
    if (key === 'e' || key === 'f' || key === 'r') closeMenus();
    return;
  }

  if (key === 'e') {
    e.preventDefault();
    openPets();
  } else if (key === 'f') {
    e.preventDefault();
    openShop();
  } else if (key === 'r') {
    e.preventDefault();
    openRebirth();
  } else if (key === ' ' || key === 'enter') {
    e.preventDefault();
    interact();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

document.querySelectorAll('#action-bar button').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (hatch || paused) return;
    const id = btn.dataset.panel;
    if (menu === id) closeMenus();
    else if (id === 'pets') openPets();
    else if (id === 'shop') openShop();
    else openRebirth();
  });
});

load();
const fresh = !state.pets.length;
if (fresh) addPet(speciesById('dog'), 'uncommon');
enterArea(state.area, true);
if (fresh || state.area === 0) {
  player.x = 220;
  player.y = 480;
  seedTrail();
}
if (fresh) say('Your first pup is ready. Collect coins and hatch more eggs!');
updateHud();
requestAnimationFrame(loop);
