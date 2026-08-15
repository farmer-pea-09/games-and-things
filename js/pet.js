import { PETS, searchPets } from './pets.js';
import { drawSpecies } from './pet-draw.js';

const CANVAS_W = 800;
const CANVAS_H = 480;
const BEST_KEY = 'pet-best-bond';

const CARE = {
  food: { key: 'z', label: 'Food', color: '#e07a5f', restore: 34, decay: 2.15 },
  love: { key: 'a', label: 'Love', color: '#e63946', restore: 36, decay: 1.45 },
  water: { key: 's', label: 'Water', color: '#4cc9f0', restore: 38, decay: 2.35 },
  sleep: { key: 'x', label: 'Sleep', color: '#9b8ec4', restore: 18, decay: 1.15 },
  play: { key: 'p', label: 'Play', color: '#f4a261', restore: 40, decay: 1.85 },
};

const KEY_TO_CARE = { z: 'food', a: 'love', s: 'water', x: 'sleep', p: 'play' };
const CARE_ORDER = ['food', 'love', 'water', 'sleep', 'play'];

const HAPPY_LINES = {
  food: ['Nom nom!', 'So tasty!', 'Crunch crunch!'],
  love: ['I love you too!', 'Purrrr~', 'Best friend!'],
  water: ['Glug glug!', 'Ahh, fresh!', '*sip sip*'],
  sleep: ['Zzz...', 'Night night...', 'So cozy...'],
  play: ['Yay!', 'Again! Again!', 'Wheee!'],
};

const NEEDY_LINES = {
  food: "I'm hungry...",
  love: 'I miss you...',
  water: 'So thirsty...',
  sleep: '*yaaawn*',
  play: "Let's play!",
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const picker = document.getElementById('picker');
const petGrid = document.getElementById('pet-grid');
const petSearch = document.getElementById('pet-search');
const petEmpty = document.getElementById('pet-empty');
const careButtons = document.getElementById('care-buttons');

let pet;
let gameStarted = false;
let picking = true;
let paused = false;
let lastTime = 0;
let clock = 0;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function moodOf(p) {
  return CARE_ORDER.reduce((sum, id) => sum + p.needs[id], 0) / CARE_ORDER.length;
}

function lowestNeed(p) {
  return CARE_ORDER.reduce((worst, id) => (
    p.needs[id] < p.needs[worst] ? id : worst
  ));
}

function bestBond() {
  return Number(localStorage.getItem(BEST_KEY) || 0);
}

function saveBest(bond) {
  const rounded = Math.floor(bond);
  if (rounded > bestBond()) localStorage.setItem(BEST_KEY, String(rounded));
}

function spec(p) {
  return p?.species || PETS[0];
}

function petName(p) {
  return spec(p).name;
}

function createPet(species) {
  const chosen = species || PETS[0];
  return {
    species: chosen,
    needs: { food: 78, love: 84, water: 72, sleep: 70, play: 80 },
    action: null,
    actionTime: 0,
    actionDur: 0,
    blink: 0,
    blinkWait: 2.2,
    message: `Hi! I am your ${chosen.name}.`,
    messageTimer: 3,
    bond: 0,
    critical: 0,
    particles: [],
    night: false,
  };
}

function matchesSearch(query) {
  return searchPets(query);
}

function renderPetGrid(query) {
  const matches = matchesSearch(query);
  petGrid.innerHTML = '';
  petEmpty.classList.toggle('hidden', matches.length > 0);
  for (const animal of matches) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.petId = animal.id;
    btn.innerHTML = `<span class="pet-emoji">${animal.emoji}</span>${animal.name}`;
    btn.addEventListener('click', () => selectPet(animal));
    petGrid.appendChild(btn);
  }
}

function selectPet(species) {
  picking = false;
  picker.classList.add('hidden');
  careButtons.classList.remove('hidden');
  startGame(species);
}

function showPicker() {
  gameStarted = false;
  paused = false;
  picking = true;
  overlay.classList.add('hidden');
  careButtons.classList.add('hidden');
  picker.classList.remove('hidden');
  petSearch.value = '';
  renderPetGrid('');
  petSearch.focus();
}

function say(p, text, seconds = 2.2) {
  p.message = text;
  p.messageTimer = seconds;
}

function spawn(p, extra) {
  p.particles.push({
    x: 400,
    y: 240,
    vx: 0,
    vy: -40,
    g: 0,
    life: 1,
    max: 1,
    size: 6,
    color: '#fff',
    kind: 'dot',
    ...extra,
  });
}

function burst(p, kind, color, count) {
  for (let i = 0; i < count; i++) {
    if (kind === 'heart') {
      spawn(p, {
        kind: 'heart',
        color,
        x: 400 + (Math.random() - 0.5) * 70,
        y: 250 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 30,
        vy: -30 - Math.random() * 40,
        life: 1.1 + Math.random() * 0.4,
        max: 1.4,
        size: 8 + Math.random() * 5,
      });
    } else if (kind === 'drop') {
      spawn(p, {
        kind: 'drop',
        color,
        x: 400 + (Math.random() - 0.5) * 50,
        y: 210,
        vx: (Math.random() - 0.5) * 20,
        vy: 20 + Math.random() * 40,
        g: 90,
        life: 0.8,
        max: 0.8,
        size: 5,
      });
    } else if (kind === 'crumb') {
      spawn(p, {
        kind: 'crumb',
        color,
        x: 400 + (Math.random() - 0.5) * 40,
        y: 300,
        vx: (Math.random() - 0.5) * 80,
        vy: -40 - Math.random() * 40,
        g: 180,
        life: 0.7,
        max: 0.7,
        size: 4,
      });
    } else if (kind === 'zzz') {
      spawn(p, {
        kind: 'zzz',
        color,
        x: 450,
        y: 230,
        vx: 18,
        vy: -22,
        life: 1.6,
        max: 1.6,
        size: 10,
      });
    } else {
      spawn(p, {
        kind: 'spark',
        color,
        x: 400 + (Math.random() - 0.5) * 90,
        y: 260 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 50,
        vy: -50 - Math.random() * 30,
        life: 0.7,
        max: 0.7,
        size: 4,
      });
    }
  }
}

function doCare(type) {
  if (!gameStarted || paused || !pet) return;
  if (pet.action === 'sleep' && type !== 'sleep') {
    say(pet, `Shh... ${petName(pet)} is sleeping.`);
    return;
  }
  if (pet.action && pet.actionTime < pet.actionDur * 0.55) return;

  const def = CARE[type];
  pet.needs[type] = clamp(pet.needs[type] + def.restore, 0, 100);
  pet.action = type;
  pet.actionTime = 0;
  pet.critical = 0;
  say(pet, pick(HAPPY_LINES[type]));
  flashButton(type);

  if (type === 'food') {
    pet.actionDur = 1.05;
    burst(pet, 'crumb', '#e07a5f', 8);
    pet.needs.water = clamp(pet.needs.water - 3, 0, 100);
  } else if (type === 'love') {
    pet.actionDur = 1.15;
    burst(pet, 'heart', '#e63946', 7);
    pet.needs.play = clamp(pet.needs.play + 4, 0, 100);
  } else if (type === 'water') {
    pet.actionDur = 1.0;
    burst(pet, 'drop', '#4cc9f0', 8);
  } else if (type === 'sleep') {
    pet.actionDur = 2.8;
    pet.night = true;
    burst(pet, 'zzz', '#c9b6ff', 3);
  } else if (type === 'play') {
    pet.actionDur = 1.25;
    burst(pet, 'spark', '#ffd166', 10);
    pet.needs.sleep = clamp(pet.needs.sleep - 8, 0, 100);
    pet.needs.love = clamp(pet.needs.love + 6, 0, 100);
  }
}

function flashButton(care) {
  const btn = document.querySelector(`[data-care="${care}"]`);
  if (!btn) return;
  btn.classList.add('active');
  window.setTimeout(() => btn.classList.remove('active'), 180);
}

function updatePet(p, dt) {
  clock += dt;
  p.actionTime += dt;

  if (p.action && p.actionTime >= p.actionDur) {
    if (p.action === 'sleep') p.night = false;
    p.action = null;
    p.actionTime = 0;
  }

  if (p.action === 'sleep') {
    p.needs.sleep = clamp(p.needs.sleep + 22 * dt, 0, 100);
    if (Math.random() < dt * 1.6) burst(p, 'zzz', '#c9b6ff', 1);
  }

  for (const id of CARE_ORDER) {
    if (p.action === id) continue;
    p.needs[id] = clamp(p.needs[id] - CARE[id].decay * dt, 0, 100);
  }

  const mood = moodOf(p);
  if (mood >= 62) {
    p.bond += dt * (mood / 50);
    saveBest(p.bond);
  }

  p.blinkWait -= dt;
  if (p.blinkWait <= 0) {
    p.blink = 0.14;
    p.blinkWait = 1.8 + Math.random() * 2.4;
  }
  if (p.blink > 0) p.blink -= dt;

  p.messageTimer -= dt;
  if (p.messageTimer <= 0) {
    p.message = '';
    const low = lowestNeed(p);
    if (p.needs[low] < 28 && !p.action) {
      say(p, NEEDY_LINES[low], 2.4);
    }
  }

  const empty = CARE_ORDER.some((id) => p.needs[id] <= 0);
  if (empty) {
    p.critical += dt;
    if (p.critical > 11) {
      saveBest(p.bond);
      endGame();
    }
  } else {
    p.critical = 0;
  }

  p.particles = p.particles.filter((part) => {
    part.life -= dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    part.vy += (part.g || 0) * dt;
    return part.life > 0;
  });
}

function roundRect(x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawWindow(t, night) {
  const x = 86;
  const y = 70;
  const w = 168;
  const h = 128;

  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x - 10, y - 10, w + 20, h + 22);

  if (night) {
    const sky = ctx.createLinearGradient(x, y, x, y + h);
    sky.addColorStop(0, '#151b2b');
    sky.addColorStop(1, '#3a4560');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#f4e4c1';
    ctx.beginPath();
    ctx.arc(x + 118, y + 38, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#151b2b';
    ctx.beginPath();
    ctx.arc(x + 126, y + 34, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8ef';
    for (const [sx, sy] of [[18, 22], [48, 50], [86, 18], [36, 86], [140, 78], [70, 70]]) {
      ctx.fillRect(x + sx, y + sy, 2, 2);
    }
  } else {
    const sky = ctx.createLinearGradient(x, y, x, y + h);
    sky.addColorStop(0, '#7ec8e3');
    sky.addColorStop(1, '#d7eef6');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(x + 36, y + 34, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const cx = x + 100 + Math.sin(t * 0.25) * 10;
    ctx.beginPath();
    ctx.arc(cx, y + 58, 16, 0, Math.PI * 2);
    ctx.arc(cx + 18, y + 60, 12, 0, Math.PI * 2);
    ctx.arc(cx - 16, y + 62, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x + w / 2 - 4, y, 8, h);
  ctx.fillRect(x, y + h / 2 - 4, w, 8);
  ctx.fillStyle = '#8b5a3c';
  ctx.fillRect(x - 16, y + h + 10, w + 32, 12);
}

function drawPlant() {
  ctx.fillStyle = '#8b5a3c';
  ctx.fillRect(678, 248, 36, 28);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(674, 244, 44, 8);
  ctx.fillStyle = '#2d6a4f';
  ctx.beginPath();
  ctx.ellipse(696, 214, 22, 28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(712, 206, 18, 26, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#40916c';
  ctx.beginPath();
  ctx.ellipse(704, 190, 16, 22, 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawBowl(x, y, color, active) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = active ? color : '#3d2914';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCushion(cx, cy) {
  ctx.fillStyle = '#c15c44';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 92, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e07a5f';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6, 78, 18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall(x, y) {
  ctx.fillStyle = '#e07a5f';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8ef';
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1810';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHeart(x, y, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.2, x - size * 0.5, y + size * 0.15);
  ctx.bezierCurveTo(x, y + size * 0.7, x, y + size * 0.7, x, y + size);
  ctx.bezierCurveTo(x, y + size * 0.7, x, y + size * 0.7, x + size * 0.5, y + size * 0.15);
  ctx.bezierCurveTo(x + size, y - size * 0.2, x, y - size * 0.3, x, y + size * 0.3);
  ctx.fill();
  ctx.restore();
}

function drawRoom(p, t) {
  const night = p.night;

  ctx.fillStyle = night ? '#3a2a20' : '#f3d7b5';
  ctx.fillRect(0, 0, CANVAS_W, 318);

  ctx.fillStyle = night ? 'rgba(0,0,0,0.12)' : 'rgba(224, 122, 95, 0.14)';
  for (let x = 0; x < CANVAS_W; x += 48) ctx.fillRect(x, 0, 22, 318);

  ctx.fillStyle = night ? '#4a3122' : '#c9855a';
  ctx.fillRect(0, 318, CANVAS_W, 162);

  ctx.strokeStyle = night ? 'rgba(0,0,0,0.25)' : 'rgba(80, 40, 20, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 318; y < CANVAS_H; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#8b5a3c';
  ctx.fillRect(0, 308, CANVAS_W, 12);

  drawWindow(t, night);
  drawPlant();
  drawBowl(210, 392, '#d4a373', p.action === 'food');
  drawBowl(590, 392, '#7ec8e3', p.action === 'water');
  drawCushion(400, 400);

  if (p.action !== 'play') drawBall(150, 408);
}

function drawPet(p, t) {
  const mood = moodOf(p);
  const sleeping = p.action === 'sleep';
  drawSpecies(ctx, p, t, {
    mood,
    sleeping,
    playing: p.action === 'play',
    eating: p.action === 'food',
    drinking: p.action === 'water',
    loving: p.action === 'love',
    sad: mood < 38,
    crying: mood < 38 && p.needs[lowestNeed(p)] < 18 && !sleeping,
  });
}

function drawParticles(p) {
  for (const part of p.particles) {
    const a = clamp(part.life / part.max, 0, 1);
    if (part.kind === 'heart') {
      drawHeart(part.x, part.y, part.size, part.color, a);
    } else if (part.kind === 'zzz') {
      ctx.globalAlpha = a;
      ctx.fillStyle = part.color;
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('Z', part.x, part.y);
      ctx.globalAlpha = 1;
    } else if (part.kind === 'drop') {
      ctx.globalAlpha = a;
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.ellipse(part.x, part.y, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x, part.y, part.size, part.size);
      ctx.globalAlpha = 1;
    }
  }
}

function drawSpeech(p) {
  if (!p.message) return;
  ctx.font = '8px "Press Start 2P"';
  const w = Math.min(360, ctx.measureText(p.message).width + 24);
  const x = 400 - w / 2;
  const y = 168;
  ctx.fillStyle = '#fff8ef';
  roundRect(x, y, w, 36, 8);
  ctx.fill();
  ctx.strokeStyle = '#3d2914';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(392, y + 36);
  ctx.lineTo(400, y + 48);
  ctx.lineTo(408, y + 36);
  ctx.fillStyle = '#fff8ef';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3d2914';
  ctx.textAlign = 'center';
  ctx.fillText(p.message, 400, y + 24);
  ctx.textAlign = 'left';
}

function drawHud(p) {
  ctx.fillStyle = 'rgba(43, 24, 16, 0.72)';
  ctx.fillRect(0, 0, CANVAS_W, 58);

  ctx.font = '8px "Press Start 2P"';
  ctx.fillStyle = '#e9c46a';
  ctx.fillText(`Bond ${Math.floor(p.bond)}`, 16, 22);
  ctx.fillStyle = '#fff8ef';
  ctx.fillText(`Best ${bestBond()}`, 150, 22);

  const mood = moodOf(p);
  const name = petName(p);
  let moodText = `${name} is okay.`;
  if (mood > 80) moodText = `${name} is so happy!`;
  else if (mood > 60) moodText = `${name} is happy.`;
  else if (mood < 25) moodText = `${name} needs you!`;
  else if (mood < 45) moodText = `${name} feels down.`;
  ctx.textAlign = 'right';
  ctx.fillText(moodText, CANVAS_W - 16, 22);
  ctx.textAlign = 'left';

  CARE_ORDER.forEach((id, i) => {
    const x = 16 + i * 156;
    const y = 34;
    const val = p.needs[id];
    ctx.fillStyle = '#fff8ef';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText(CARE[id].label, x, y + 8);
    ctx.fillStyle = '#2b1810';
    ctx.fillRect(x + 48, y, 90, 10);
    ctx.fillStyle = CARE[id].color;
    ctx.fillRect(x + 48, y, 90 * (val / 100), 10);
    if (val < 22) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 48 + 90 * (val / 100) - 2, y, 2, 10);
    }
  });
}

function drawPlayBall(p) {
  if (p.action !== 'play') return;
  const bounce = Math.abs(Math.sin(p.actionTime * 9));
  const x = 400 + Math.sin(p.actionTime * 7) * 110;
  const y = 250 - bounce * 90;
  drawBall(x, y);
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const idle = { action: null, night: false };
  const p = picking ? idle : (pet || idle);
  drawRoom(p, clock);
  if (!picking && pet) {
    drawPet(pet, clock);
    drawPlayBall(pet);
    drawParticles(pet);
    if (pet.night) {
      ctx.fillStyle = 'rgba(12, 10, 28, 0.28)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    drawSpeech(pet);
    if (gameStarted) drawHud(pet);
  }
}

function showPause() {
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Paused</h2>
    <p>${petName(pet)} will wait right here.</p>
    <button id="resume-btn" type="button">Resume</button>
    <button id="changepet-btn" type="button" style="background:#555;margin-left:8px">Change pet</button>
  `;
  overlayContent.querySelector('#resume-btn').onclick = () => {
    paused = false;
    overlay.classList.add('hidden');
  };
  overlayContent.querySelector('#changepet-btn').onclick = () => {
    showPicker();
  };
}

function endGame() {
  gameStarted = false;
  paused = false;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>${petName(pet)} needs a rest</h2>
    <p>One of ${petName(pet)}'s needs stayed empty too long.</p>
    <p>Bond reached ${Math.floor(pet.bond)}.</p>
    <button id="retry-btn" type="button">Try again</button>
    <button id="changepet-btn" type="button" style="background:#555;margin-left:8px">Change pet</button>
  `;
  overlayContent.querySelector('#retry-btn').onclick = () => {
    overlay.classList.add('hidden');
    startGame(pet.species);
  };
  overlayContent.querySelector('#changepet-btn').onclick = () => {
    showPicker();
  };
}

function startGame(species) {
  pet = createPet(species || pet?.species);
  gameStarted = true;
  paused = false;
  picking = false;
  clock = 0;
  picker.classList.add('hidden');
  careButtons.classList.remove('hidden');
  overlay.classList.add('hidden');
  say(pet, `Hi! I am your ${petName(pet)}.`, 2.6);
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  if (gameStarted && !paused) updatePet(pet, dt);
  else if (!picking && pet && !gameStarted) {
    clock += dt;
    pet.blinkWait -= dt;
    if (pet.blinkWait <= 0) {
      pet.blink = 0.14;
      pet.blinkWait = 2 + Math.random() * 2;
    }
    if (pet.blink > 0) pet.blink -= dt;
    if (pet.messageTimer > 0) pet.messageTimer -= dt;
    else pet.message = '';
    pet.particles = pet.particles.filter((part) => {
      part.life -= dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      return part.life > 0;
    });
  }
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (e.target === petSearch) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const matches = matchesSearch(petSearch.value);
      if (matches.length === 1) selectPet(matches[0]);
    }
    return;
  }

  const key = e.key.toLowerCase();
  if (e.repeat) return;

  if (picking) {
    if (key === 'enter') {
      e.preventDefault();
      const matches = matchesSearch(petSearch.value);
      if (matches.length === 1) selectPet(matches[0]);
    }
    return;
  }

  if (!gameStarted && (key === 'enter' || key === ' ')) {
    e.preventDefault();
    if (pet?.species) startGame(pet.species);
    return;
  }

  if (key === 'escape' && gameStarted) {
    e.preventDefault();
    paused = !paused;
    if (paused) showPause();
    else overlay.classList.add('hidden');
    return;
  }

  const care = KEY_TO_CARE[key];
  if (care) {
    e.preventDefault();
    if (!overlay.classList.contains('hidden')) return;
    if (!gameStarted) return;
    doCare(care);
  }
});

document.querySelectorAll('#care-buttons button').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!overlay.classList.contains('hidden')) return;
    if (!gameStarted) return;
    doCare(btn.dataset.care);
  });
});

petSearch.addEventListener('input', () => {
  renderPetGrid(petSearch.value);
});

renderPetGrid('');
petSearch.focus();
requestAnimationFrame(loop);
