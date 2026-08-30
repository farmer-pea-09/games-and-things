const SAVE_KEY = 'gat-spikeroll-unlocked';
const MUTE_KEY = 'gat-spikeroll-mute';
const W = 800;
const H = 480;
const TILE = 40;
const PW = 34;
const PH = 34;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menu-overlay');
const winOverlay = document.getElementById('win-overlay');
const hud = document.getElementById('hud');
const hintBar = document.getElementById('hint-bar');
const winText = document.getElementById('win-text');
const progressFill = document.getElementById('progress-fill');
const pctLabel = document.getElementById('pct-label');
const attemptLabel = document.getElementById('attempt-label');
const levelLabel = document.getElementById('level-label');
const modeBadge = document.getElementById('mode-badge');
const deathFlash = document.getElementById('death-flash');
const levelGrid = document.getElementById('level-grid');
const fsBtn = document.getElementById('fullscreen-btn');

const LEVELS = [
  { id: 1, name: 'Soft Start', diff: 'Easy', speed: 255, bpm: 118, grav: 2200, jump: -740 },
  { id: 2, name: 'Palm Parade', diff: 'Normal', speed: 305, bpm: 128, grav: 2480, jump: -710 },
  { id: 3, name: 'Cloud Glide', diff: 'Hard', speed: 345, bpm: 138, grav: 2620, jump: -735 },
  { id: 4, name: 'Upside Alley', diff: 'Faster', speed: 385, bpm: 148, grav: 2740, jump: -755 },
  { id: 5, name: 'Last Burst', diff: 'Expert', speed: 395, bpm: 154, grav: 2780, jump: -760 },
];

let selectedLevelId = 1;
let currentLevel = LEVELS[0];
let playing = false;
let dead = false;
let won = false;
let deadTimer = 0;
let attempts = 0;
let hueShift = 0;
let time = 0;
let lastStamp = 0;
let groundTop = H - TILE * 2;
let endX = 0;
let speedMult = 1;
let boostTimer = 0;
let shake = 0;
let hintTimer = 0;

const keys = Object.create(null);
let jumpHeld = false;
let jumpBuffer = 0;
let wasJump = false;

let solids = [];
let spikes = [];
let pads = [];
let portals = [];
let hands = [];
let particles = [];

const player = {
  x: 80,
  y: 0,
  vy: 0,
  prevY: 0,
  grounded: false,
  coyote: 0,
  rot: 0,
  targetRot: 0,
  bounce: 0,
  trail: [],
  mode: 'cube',
  gravDir: 1,
  flyMin: 0,
  flyMax: 0,
  airJumps: 1,
};

function t(n) {
  return n * TILE;
}

function rainbow(u, a = 1) {
  const h = ((u % 1) + 1) % 1;
  const x = 1 - Math.abs((h * 6) % 2 - 1);
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 1 / 6) { r = 1; g = x; }
  else if (h < 2 / 6) { r = x; g = 1; }
  else if (h < 3 / 6) { g = 1; b = x; }
  else if (h < 4 / 6) { g = x; b = 1; }
  else if (h < 5 / 6) { r = x; b = 1; }
  else { r = 1; b = x; }
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}

/* --- audio --- */
const AudioEngine = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { muted = false; }
  let musicOn = false;
  let step = 0;
  let nextTime = 0;
  let bpm = 128;
  let timer = null;
  const LEAD = [
    392, 523, 659, 784, 659, 523, 0, 392,
    440, 554, 659, 880, 659, 554, 0, 440,
    349, 523, 698, 880, 698, 523, 0, 349,
    392, 494, 587, 784, 587, 494, 392, 0,
  ];
  const BASS = [98, 98, 131, 98, 110, 110, 147, 110, 87, 87, 131, 87, 98, 98, 123, 98];

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.85;
      musicGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function blip(freq, when, dur, type, vol) {
    if (!ctx || !freq || muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(musicGain);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  function tick() {
    if (!ctx || !musicOn || muted) return;
    const stepDur = 60 / bpm / 2;
    while (nextTime < ctx.currentTime + 0.4) {
      const i = step % LEAD.length;
      const beat = step % 8;
      if (beat === 0 || beat === 4) blip(90, nextTime, 0.12, 'sine', 0.12);
      if (beat === 2 || beat === 6) blip(220, nextTime, 0.06, 'triangle', 0.05);
      const bass = BASS[Math.floor(i / 2) % BASS.length];
      if (step % 2 === 0) blip(bass, nextTime, 0.2, 'triangle', 0.07);
      if (LEAD[i]) blip(LEAD[i], nextTime, 0.14, 'square', 0.04);
      step += 1;
      nextTime += stepDur;
    }
  }

  function tone(freq, dur, type = 'square', vol = 0.06) {
    if (muted) return;
    const audio = ac();
    if (!audio || !master || !freq) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(master);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.stop(audio.currentTime + dur);
  }

  return {
    init: ac,
    start(newBpm) {
      ac();
      bpm = newBpm || 128;
      if (musicOn) return;
      musicOn = true;
      step = 0;
      nextTime = ctx.currentTime + 0.05;
      if (!timer) timer = setInterval(tick, 70);
      tick();
    },
    stop() { musicOn = false; },
    sfx(name) {
      if (muted) return;
      ac();
      if (name === 'jump') tone(480, 0.09, 'square', 0.045);
      if (name === 'jump2') { tone(620, 0.07, 'square', 0.04); setTimeout(() => tone(780, 0.08, 'square', 0.035), 40); }
      if (name === 'pad') { tone(520, 0.08); setTimeout(() => tone(720, 0.1), 50); }
      if (name === 'boost') { tone(300, 0.08); setTimeout(() => tone(500, 0.1), 60); }
      if (name === 'portal') { tone(330, 0.07); setTimeout(() => tone(495, 0.08), 70); setTimeout(() => tone(660, 0.12), 140); }
      if (name === 'hurt') tone(120, 0.22, 'sawtooth', 0.07);
      if (name === 'win') {
        tone(523, 0.1);
        setTimeout(() => tone(659, 0.1), 110);
        setTimeout(() => tone(784, 0.1), 220);
        setTimeout(() => tone(1046, 0.24), 330);
      }
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
      ac();
      if (master) master.gain.setValueAtTime(muted ? 0 : 1, ctx ? ctx.currentTime : 0);
      if (!muted) this.start(currentLevel.bpm);
      return muted;
    },
    isMuted() { return muted; },
  };
})();

function getUnlocked() {
  try {
    const n = parseInt(localStorage.getItem(SAVE_KEY) || '1', 10);
    return Math.min(5, Math.max(1, n));
  } catch {
    return 1;
  }
}

function unlockLevel(id) {
  try {
    localStorage.setItem(SAVE_KEY, String(Math.max(getUnlocked(), id)));
  } catch { /* ignore */ }
}

function addBlock(x, y, w, h) {
  solids.push({ x, y, w, h });
}

function addSpike(x, y, dir = 1) {
  spikes.push({ x, y, w: TILE, h: TILE, dir });
}

function addPad(x, y, type) {
  pads.push({ x, y, w: TILE * 2, h: TILE * 0.5, type, used: false });
}

function addPortal(x, y, kind, opts = {}) {
  portals.push({
    x, y, w: TILE * 2, h: TILE * 3, kind,
    flyMin: opts.flyMin, flyMax: opts.flyMax, used: false,
  });
}

function addHand(x, yBase, amp = 16, phase = 0) {
  hands.push({ x, yBase, w: 42, h: 38, amp, phase, bob: 2.4 });
}

function floor(from, to, top) {
  for (let x = from; x < to; x += TILE) {
    addBlock(x, top, TILE, TILE);
    addBlock(x, top + TILE, TILE, TILE);
  }
}

function buildLevel(id, top) {
  solids = [];
  spikes = [];
  pads = [];
  portals = [];
  hands = [];
  const g = top;

  if (id === 1) {
    floor(0, t(78), g);
    addSpike(t(20), g - TILE);
    addSpike(t(30), g - TILE);
    addHand(t(40), g - 92);
    addPad(t(50), g - TILE * 0.5, 'jump');
    addSpike(t(56), g - TILE);
    addSpike(t(66), g - TILE);
    endX = t(74);
  } else if (id === 2) {
    floor(0, t(22), g);
    addPad(t(10), g - TILE * 0.5, 'jump');
    floor(t(26), t(48), g);
    addSpike(t(30), g - TILE);
    addSpike(t(32), g - TILE);
    addHand(t(38), g - 88, 20, 0.6);
    addPad(t(42), g - TILE * 0.5, 'boost');
    floor(t(50), t(86), g);
    addBlock(t(58), g - TILE * 2, TILE * 3, TILE);
    addSpike(t(59), g - TILE * 3);
    addHand(t(68), g - 96, 18, 1.2);
    addPad(t(74), g - TILE * 0.5, 'jump');
    addSpike(t(80), g - TILE);
    endX = t(84);
  } else if (id === 3) {
    floor(0, t(18), g);
    addPad(t(8), g - TILE * 0.5, 'boost');
    floor(t(20), t(30), g);
    addPortal(t(28), g - TILE * 6, 'ship', { flyMin: g - TILE * 7.2, flyMax: g - TILE * 1.6 });
    for (let x = t(34); x < t(62); x += 110) {
      addSpike(x, g - TILE);
      addSpike(x + 40, g - TILE * 6.2, -1);
    }
    addPortal(t(64), g - TILE * 6, 'cube');
    floor(t(64), t(98), g);
    addPad(t(72), g - TILE * 0.5, 'boost');
    addHand(t(78), g - 90, 22, 0.4);
    addSpike(t(84), g - TILE);
    addSpike(t(86), g - TILE);
    addSpike(t(90), g - TILE);
    endX = t(96);
  } else if (id === 4) {
    floor(0, t(24), g);
    addPad(t(12), g - TILE * 0.5, 'jump');
    addPortal(t(22), g - TILE * 4, 'flip');
    floor(t(26), t(50), g);
    addBlock(t(26), g - TILE * 8, TILE * 12, TILE);
    addSpike(t(32), g - TILE * 9, -1);
    addSpike(t(38), g - TILE);
    addHand(t(44), g - TILE * 4.4, 14, 0.8);
    addPortal(t(50), g - TILE * 3, 'flip');
    floor(t(52), t(70), g);
    addPortal(t(60), g - TILE * 6, 'ship', { flyMin: g - TILE * 7.2, flyMax: g - TILE * 1.6 });
    for (let x = t(64); x < t(80); x += 100) {
      addSpike(x, g - TILE);
      addSpike(x + 28, g - TILE * 6.2, -1);
    }
    addPortal(t(82), g - TILE * 6, 'cube');
    floor(t(82), t(108), g);
    addPad(t(90), g - TILE * 0.5, 'boost');
    addSpike(t(98), g - TILE);
    addHand(t(102), g - 94, 18, 0.2);
    endX = t(106);
  } else {
    floor(0, t(34), g);
    addSpike(t(10), g - TILE);
    addHand(t(17), g - 94, 12, 0.2);
    addSpike(t(24), g - TILE);
    addPad(t(30), g - TILE * 0.5, 'jump');
    floor(t(36), t(56), g);
    addSpike(t(40), g - TILE);
    addSpike(t(42), g - TILE);
    addPad(t(50), g - TILE * 0.5, 'boost');
    addPortal(t(54), g - TILE * 6, 'ship', { flyMin: g - TILE * 7, flyMax: g - TILE * 1.8 });
    addSpike(t(60), g - TILE);
    addSpike(t(67), g - TILE * 6.1, -1);
    addSpike(t(74), g - TILE);
    addPortal(t(80), g - TILE * 6, 'cube');
    floor(t(80), t(92), g);
    addPortal(t(86), g - TILE * 3.5, 'flip');
    addBlock(t(86), g - TILE * 8, TILE * 22, TILE);
    addSpike(t(92), g - TILE * 9, -1);
    addSpike(t(99), g - TILE * 9, -1);
    addPortal(t(106), g - TILE * 3.5, 'flip');
    floor(t(106), t(136), g);
    addHand(t(112), g - 92, 12, 0.6);
    addPad(t(118), g - TILE * 0.5, 'jump');
    addSpike(t(124), g - TILE);
    addSpike(t(126), g - TILE);
    endX = t(132);
  }
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function playerBox() {
  return { x: player.x + 4, y: player.y + 4, w: PW - 8, h: PH - 8 };
}

function handY(h) {
  return h.yBase + Math.sin(time * h.bob + h.phase) * h.amp;
}

function spawnBurst(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const sp = 80 + Math.random() * 220;
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 1,
      color,
    });
  }
}

function showHud(on) {
  hud.classList.toggle('hidden', !on);
  hintBar.classList.toggle('hidden', !on);
}

function renderLevelGrid() {
  const unlocked = getUnlocked();
  levelGrid.innerHTML = LEVELS.map((lv) => {
    const locked = lv.id > unlocked;
    const sel = lv.id === selectedLevelId;
    return `
      <button type="button" class="level-card${sel ? ' selected' : ''}" data-id="${lv.id}" ${locked ? 'disabled' : ''}>
        <span class="num">LV ${lv.id}</span>
        <div class="name">${lv.name}</div>
        <div class="diff">${lv.diff} · ${lv.speed} spd</div>
        ${locked ? `<div class="lock-tag">Beat LV ${lv.id - 1} first</div>` : ''}
      </button>
    `;
  }).join('');
}

levelGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.level-card:not(:disabled)');
  if (!card) return;
  selectedLevelId = Number(card.dataset.id);
  renderLevelGrid();
});

function jumpPressed() {
  return keys.Space || keys.ArrowUp || keys.KeyW || jumpHeld;
}

function resetPlayer(countAttempt) {
  dead = false;
  won = false;
  deadTimer = 0;
  speedMult = 1;
  boostTimer = 0;
  player.x = 90;
  player.y = groundTop - PH;
  player.vy = 0;
  player.prevY = player.y;
  player.grounded = true;
  player.coyote = 0;
  player.rot = 0;
  player.targetRot = 0;
  player.bounce = 0;
  player.trail = [];
  player.mode = 'cube';
  player.gravDir = 1;
  player.flyMin = 0;
  player.flyMax = 0;
  player.airJumps = 1;
  pads.forEach((p) => { p.used = false; });
  portals.forEach((p) => { p.used = false; });
  deathFlash.classList.remove('on');
  modeBadge.textContent = '';
  if (countAttempt) {
    attempts += 1;
    attemptLabel.textContent = `ATTEMPT ${attempts}`;
  }
}

function startGame(levelId) {
  currentLevel = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  selectedLevelId = currentLevel.id;
  attempts = 0;
  time = 0;
  particles = [];
  groundTop = H - TILE * 2;
  buildLevel(currentLevel.id, groundTop);
  resetPlayer(true);
  playing = true;
  won = false;
  menuOverlay.classList.add('hidden');
  winOverlay.classList.add('hidden');
  showHud(true);
  hintTimer = 5;
  hintBar.classList.remove('hidden');
  levelLabel.textContent = `LV ${currentLevel.id}`;
  AudioEngine.init();
  AudioEngine.start(currentLevel.bpm);
}

function kill() {
  if (dead || won || !playing) return;
  dead = true;
  deadTimer = 0.55;
  shake = 8;
  AudioEngine.sfx('hurt');
  deathFlash.classList.add('on');
  spawnBurst(player.x + PW / 2, player.y + PH / 2, '#ff4d6d', 18);
  setTimeout(() => deathFlash.classList.remove('on'), 140);
}

function winLevel() {
  if (won || dead) return;
  won = true;
  playing = false;
  AudioEngine.sfx('win');
  spawnBurst(player.x + PW / 2, player.y + PH / 2, '#ffd166', 22);
  unlockLevel(Math.min(5, currentLevel.id + 1));
  const next = LEVELS.find((l) => l.id === currentLevel.id + 1);
  winText.textContent = next
    ? `${currentLevel.name} done in ${attempts} attempt${attempts === 1 ? '' : 's'}. ${next.name} is unlocked.`
    : `${currentLevel.name} done in ${attempts} attempt${attempts === 1 ? '' : 's'}. You cleared every track!`;
  document.getElementById('btn-next').style.display = next ? '' : 'none';
  showHud(false);
  winOverlay.classList.remove('hidden');
  renderLevelGrid();
}

function restartRun() {
  if (!currentLevel) return;
  buildLevel(currentLevel.id, groundTop);
  resetPlayer(true);
  playing = true;
  won = false;
  winOverlay.classList.add('hidden');
  showHud(true);
}

function tryJump() {
  if (player.mode === 'ship') return;
  const fromGround = player.grounded || player.coyote > 0;
  if (!fromGround && player.airJumps <= 0) return;
  const power = fromGround ? 1 : 0.88;
  if (fromGround) player.airJumps = 1;
  else player.airJumps -= 1;
  player.vy = currentLevel.jump * power * player.gravDir;
  player.grounded = false;
  player.coyote = 0;
  player.targetRot += (Math.PI / 2) * player.gravDir;
  player.bounce = 1;
  jumpBuffer = 0;
  AudioEngine.sfx(fromGround ? 'jump' : 'jump2');
  if (!fromGround) {
    spawnBurst(player.x + PW / 2, player.y + PH / 2, '#6ee7ff', 8);
  }
}

function update(dt) {
  hueShift += dt * 40;
  time += dt;
  if (shake > 0) shake = Math.max(0, shake - dt * 28);
  if (playing && !dead && hintTimer > 0) {
    hintTimer -= dt;
    if (hintTimer <= 0) hintBar.classList.add('hidden');
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
    p.life -= dt * 1.8;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (!playing) return;

  if (dead) {
    deadTimer -= dt;
    if (deadTimer <= 0) restartRun();
    return;
  }

  const holding = jumpPressed();
  const jumpEdge = holding && !wasJump;
  if (jumpEdge) jumpBuffer = 0.13;
  jumpBuffer = Math.max(0, jumpBuffer - dt);

  if (boostTimer > 0) {
    boostTimer -= dt;
    if (boostTimer <= 0) speedMult = 1;
  }

  const spd = currentLevel.speed * speedMult;
  player.x += spd * dt;

  if (player.mode === 'ship') {
    const lift = currentLevel.grav * 1.55 * dt;
    if (holding) player.vy -= lift * player.gravDir;
    else player.vy += currentLevel.grav * 0.9 * dt * player.gravDir;
    player.vy = Math.max(-500, Math.min(500, player.vy));
    player.targetRot = Math.atan2(player.vy, spd) * 0.55;
  } else {
    player.vy += currentLevel.grav * player.gravDir * dt;
    if (player.gravDir === 1) player.vy = Math.min(player.vy, 1350);
    else player.vy = Math.max(player.vy, -1350);
  }
  wasJump = holding;

  player.prevY = player.y;
  player.y += player.vy * dt;
  player.bounce = Math.max(0, player.bounce - dt * 6);
  player.rot += (player.targetRot - player.rot) * Math.min(1, dt * 10);

  if (player.mode === 'ship') {
    if (player.flyMin) player.y = Math.max(player.flyMin, player.y);
    if (player.flyMax) player.y = Math.min(player.flyMax - PH, player.y);
  }

  player.grounded = false;
  const box = { x: player.x + 2, y: player.y, w: PW - 4, h: PH };
  for (const s of solids) {
    box.y = player.y;
    if (!aabb(box, s)) continue;
    const overlapTop = (player.y + PH) - s.y;
    const overlapBottom = (s.y + s.h) - player.y;
    if (player.gravDir === 1 && overlapTop >= 0 && overlapTop < 22 && player.vy >= -40) {
      player.y = s.y - PH;
      player.vy = 0;
      player.grounded = true;
      player.airJumps = 1;
    } else if (player.gravDir === -1 && overlapBottom >= 0 && overlapBottom < 22 && player.vy <= 40) {
      player.y = s.y + s.h;
      player.vy = 0;
      player.grounded = true;
      player.airJumps = 1;
    } else {
      kill();
      return;
    }
  }

  if (player.grounded) player.coyote = 0.1;
  else player.coyote = Math.max(0, player.coyote - dt);

  if (player.mode === 'cube' && (jumpBuffer > 0 || (holding && player.grounded))) tryJump();

  const hit = playerBox();
  for (const p of pads) {
    const pb = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (aabb(hit, pb)) {
      if (!p.used) {
        p.used = true;
        if (p.type === 'jump') {
          player.vy = currentLevel.jump * 1.35 * player.gravDir;
          player.grounded = false;
          player.airJumps = 1;
          player.targetRot += (Math.PI / 2) * player.gravDir;
          AudioEngine.sfx('pad');
        } else {
          speedMult = 1.48;
          boostTimer = 1.15;
          AudioEngine.sfx('boost');
        }
      }
    } else {
      p.used = false;
    }
  }

  for (const p of portals) {
    const pb = { x: p.x + 8, y: p.y + 8, w: p.w - 16, h: p.h - 16 };
    if (!aabb(hit, pb)) {
      p.used = false;
      continue;
    }
    if (p.used) continue;
    p.used = true;
    AudioEngine.sfx('portal');
    if (p.kind === 'ship') {
      player.mode = 'ship';
      player.flyMin = p.flyMin || 40;
      player.flyMax = p.flyMax || (groundTop - TILE);
      player.vy *= 0.3;
      modeBadge.textContent = 'SHIP MODE';
    } else if (p.kind === 'cube') {
      player.mode = 'cube';
      player.flyMin = 0;
      player.flyMax = 0;
      modeBadge.textContent = '';
    } else if (p.kind === 'flip') {
      player.gravDir *= -1;
      player.vy = currentLevel.jump * 0.25 * player.gravDir;
      player.grounded = false;
      modeBadge.textContent = player.gravDir === -1 ? 'FLIPPED' : '';
    }
  }

  const pad = 8;
  for (const sp of spikes) {
    const sb = { x: sp.x + pad, y: sp.y + pad, w: sp.w - pad * 2, h: sp.h - pad * 2 };
    if (aabb(hit, sb)) {
      kill();
      return;
    }
  }
  for (const hnd of hands) {
    const y = handY(hnd);
    const hb = { x: hnd.x + 8, y: y + 8, w: hnd.w - 16, h: hnd.h - 12 };
    if (aabb(hit, hb)) {
      kill();
      return;
    }
  }

  if (player.y > H + 80 || player.y < -90) {
    kill();
    return;
  }

  if (player.x >= endX) {
    winLevel();
    return;
  }

  player.trail.push({ x: player.x + PW / 2, y: player.y + PH / 2, life: 1 });
  if (player.trail.length > 18) player.trail.shift();
  for (const tr of player.trail) tr.life -= dt * 2.2;

  const pct = Math.min(100, Math.floor((player.x / endX) * 100));
  progressFill.style.width = `${pct}%`;
  pctLabel.textContent = `${pct}%`;
}

function camX() {
  return player.x - W * 0.22;
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a0838');
  g.addColorStop(0.55, '#120828');
  g.addColorStop(1, '#070414');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const cam = camX();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  const ox = -((cam % TILE) + TILE) % TILE;
  for (let x = ox; x < W; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawBlock(s) {
  const wx = s.x - camX();
  if (wx + s.w < -8 || wx > W + 8) return;
  const grad = ctx.createLinearGradient(wx, s.y, wx + s.w, s.y + s.h);
  grad.addColorStop(0, rainbow(s.x * 0.007, 1));
  grad.addColorStop(1, rainbow(s.x * 0.007 + 0.22, 0.85));
  ctx.fillStyle = grad;
  ctx.fillRect(wx, s.y, s.w, s.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(wx + 1, s.y + 1, s.w - 2, s.h - 2);
}

function drawSpike(sp) {
  const wx = sp.x - camX();
  if (wx + sp.w < -8 || wx > W + 8) return;
  ctx.fillStyle = '#ff3b5c';
  ctx.beginPath();
  if (sp.dir === -1) {
    ctx.moveTo(wx, sp.y);
    ctx.lineTo(wx + sp.w / 2, sp.y + sp.h);
    ctx.lineTo(wx + sp.w, sp.y);
  } else {
    ctx.moveTo(wx, sp.y + sp.h);
    ctx.lineTo(wx + sp.w / 2, sp.y);
    ctx.lineTo(wx + sp.w, sp.y + sp.h);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPad(p) {
  const wx = p.x - camX();
  if (wx + p.w < -8 || wx > W + 8) return;
  if (p.type === 'boost') {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(wx, p.y, p.w, p.h);
    ctx.fillStyle = '#ff9f1c';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(wx + 8 + i * 14, p.y + p.h);
      ctx.lineTo(wx + 16 + i * 14, p.y);
      ctx.lineTo(wx + 24 + i * 14, p.y + p.h);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(wx, p.y, p.w, p.h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx + 6, p.y + p.h);
    ctx.lineTo(wx + p.w / 2, p.y);
    ctx.lineTo(wx + p.w - 6, p.y + p.h);
    ctx.stroke();
  }
}

function drawPortal(p) {
  const wx = p.x - camX();
  if (wx + p.w < -8 || wx > W + 8) return;
  const colors = {
    ship: ['#6ee7ff', '#b794f6'],
    cube: ['#ff6ec7', '#ffd166'],
    flip: ['#b794f6', '#ff6ec7'],
  };
  const c = colors[p.kind] || colors.cube;
  ctx.save();
  ctx.strokeStyle = c[0];
  ctx.lineWidth = 4;
  ctx.strokeRect(wx + 2, p.y + 2, p.w - 4, p.h - 4);
  ctx.strokeStyle = c[1];
  ctx.lineWidth = 2;
  ctx.strokeRect(wx + 8, p.y + 8, p.w - 16, p.h - 16);
  ctx.fillStyle = `${c[0]}33`;
  ctx.fillRect(wx + 10, p.y + 10, p.w - 20, p.h - 20);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '7px "Press Start 2P"';
  const label = p.kind === 'ship' ? 'FLY' : p.kind === 'flip' ? 'FLIP' : 'ROLL';
  ctx.fillText(label, wx + 10, p.y + p.h / 2 + 3);
}

function drawHand(hnd) {
  const wx = hnd.x - camX();
  const y = handY(hnd);
  if (wx + hnd.w < -8 || wx > W + 8) return;
  ctx.save();
  ctx.translate(wx + hnd.w / 2, y + hnd.h / 2);
  ctx.rotate(Math.sin(time * 1.6 + hnd.phase) * 0.12);
  ctx.fillStyle = '#ffb4a2';
  ctx.strokeStyle = '#ff3b8b';
  ctx.lineWidth = 3;
  roundRect(-18, -6, 36, 22, 8);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const fx = -14 + i * 9;
    ctx.fillStyle = '#ffcbb8';
    roundRect(fx, -20, 7, 16, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#ff6ec7';
  ctx.beginPath();
  ctx.arc(-10, 4, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlayer() {
  const wx = player.x - camX();
  const cx = wx + PW / 2;
  const cy = player.y + PH / 2;
  if (dead) return;

  for (const tr of player.trail) {
    if (tr.life <= 0) continue;
    ctx.fillStyle = rainbow(tr.life + hueShift * 0.01, tr.life * 0.45);
    ctx.fillRect(tr.x - camX() - 4, tr.y - 4, 8, 8);
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.mode === 'ship' ? player.targetRot : player.rot);
  const squash = 1 + player.bounce * 0.12;
  ctx.scale(1 / squash, 1 - player.bounce * 0.08);

  if (player.mode === 'ship') {
    ctx.fillStyle = '#6ee7ff';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#1a0830';
    ctx.beginPath();
    ctx.arc(-2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const r = PW * 0.48;
    const body = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 2, 0, 0, r);
    body.addColorStop(0, '#fff');
    body.addColorStop(0.35, '#ff6ec7');
    body.addColorStop(0.75, rainbow(hueShift * 0.01));
    body.addColorStop(1, '#2a1448');
    ctx.fillStyle = body;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = '#1a0830';
    ctx.fillRect(-8, -6, 6, 6);
    ctx.fillRect(2, -6, 6, 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -5, 2, 2);
    ctx.fillRect(4, -5, 2, 2);
    ctx.fillStyle = '#1a0830';
    ctx.fillRect(-6, 6, 12, 3);
  }
  ctx.restore();
}

function drawFinish() {
  const wx = endX - camX();
  if (wx < -20 || wx > W + 20) return;
  const grad = ctx.createLinearGradient(wx, 0, wx + 18, 0);
  grad.addColorStop(0, 'rgba(255,209,102,0.1)');
  grad.addColorStop(0.5, 'rgba(255,209,102,0.85)');
  grad.addColorStop(1, 'rgba(110,231,255,0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(wx, 0, 18, H);
  ctx.fillStyle = '#ffd166';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('100%', wx - 8, 40);
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  drawSky();
  for (const s of solids) drawBlock(s);
  for (const p of pads) drawPad(p);
  for (const p of portals) drawPortal(p);
  for (const sp of spikes) drawSpike(sp);
  for (const hnd of hands) drawHand(hnd);
  drawFinish();
  drawPlayer();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camX() - 3, p.y - 3, 6, 6);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function loop(stamp) {
  const dt = Math.min(0.033, (stamp - lastStamp) / 1000 || 0.016);
  lastStamp = stamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (event.code === 'Space' || event.code === 'ArrowUp') event.preventDefault();
  if (event.code === 'KeyM') AudioEngine.toggleMute();
  if (event.code === 'Escape' && playing && !won) {
    playing = false;
    showHud(false);
    menuOverlay.classList.remove('hidden');
    renderLevelGrid();
  }
  if (playing && dead && (event.code === 'Space' || event.code === 'ArrowUp')) {
    event.preventDefault();
    restartRun();
  }
});
document.addEventListener('keyup', (event) => { keys[event.code] = false; });

document.getElementById('game-container').addEventListener('pointerdown', (event) => {
  if (event.target.closest('button, a, .level-card, .cta')) return;
  jumpHeld = true;
  AudioEngine.init();
  if (playing && dead) restartRun();
});
window.addEventListener('pointerup', () => { jumpHeld = false; });
window.addEventListener('pointercancel', () => { jumpHeld = false; });
window.addEventListener('blur', () => { jumpHeld = false; });

document.getElementById('btn-play').addEventListener('click', () => {
  AudioEngine.init();
  startGame(selectedLevelId);
});
document.getElementById('btn-next').addEventListener('click', () => {
  const next = Math.min(5, currentLevel.id + 1);
  selectedLevelId = next;
  startGame(next);
});
document.getElementById('btn-menu').addEventListener('click', () => {
  winOverlay.classList.add('hidden');
  menuOverlay.classList.remove('hidden');
  playing = false;
  showHud(false);
  renderLevelGrid();
});

function isFs() {
  return document.fullscreenElement || document.webkitFullscreenElement;
}
function syncFs() {
  const on = Boolean(isFs());
  fsBtn.textContent = on ? '×' : '⛶';
  fsBtn.title = on ? 'Exit fullscreen' : 'Fullscreen';
  fsBtn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Enter fullscreen');
}
fsBtn.addEventListener('click', async () => {
  const root = document.getElementById('game-container');
  try {
    if (isFs()) await document.exitFullscreen();
    else await root.requestFullscreen();
  } catch { /* blocked */ }
});
document.addEventListener('fullscreenchange', syncFs);
document.addEventListener('webkitfullscreenchange', syncFs);

renderLevelGrid();
requestAnimationFrame(loop);
