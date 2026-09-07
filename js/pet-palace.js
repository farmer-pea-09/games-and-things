const SAVE_KEY = 'pet-palace-save';
const PET_SESSION = new URLSearchParams(location.search).has('quick') ? 8000 : 120000;
const PALACE_DOOR_X = 338;
const SONG_NEED = 5.2;

const INSTRUMENTS = {
  violin: { id: 'violin', name: 'Violin', emoji: '🎻', hall: 'Velvet Hall' },
  guitar: { id: 'guitar', name: 'Guitar', emoji: '🎸', hall: 'Amber Hall' },
  flute: { id: 'flute', name: 'Flute', emoji: '🪈', hall: 'Sky Hall' },
  trumpet: { id: 'trumpet', name: 'Trumpet', emoji: '🎺', hall: 'Brass Hall' },
};

const STORE_PETS = [
  { id: 'moss-fox', name: 'Moss Fox', color: '#6b8f3a', ink: '#2d4014', accent: '#c45c26', kind: 'fox', img: 'img/pets/moss-fox.png', blurb: 'A quiet trail-finder who remembers every library path — and every melody.' },
  { id: 'mossling', name: 'Mossling', color: '#7cb342', ink: '#2e4a16', accent: '#fff8ef', kind: 'mossling', img: 'img/pets/mossling.png', blurb: 'A shy forest buddy who grows tiny flowers when you play.' },
  { id: 'cloud-fox', name: 'Cloud Fox', color: '#e8eef8', ink: '#3d4a6b', accent: '#7b6cff', kind: 'fox', img: 'img/pets/cloud-fox.png', blurb: 'A silver fox that naps on passing clouds until your song calls it down.' },
  { id: 'cloud-otter', name: 'Cloud Otter', color: '#c4a574', ink: '#4a2c17', accent: '#edf2f4', kind: 'otter', img: 'img/pets/cloud-otter.png', blurb: 'Keeps a pocketful of smooth stones, each named after a favorite story.' },
  { id: 'ember-drake', name: 'Ember Drake', color: '#e76f51', ink: '#6b2a14', accent: '#2a9d8f', kind: 'drake', img: 'img/pets/ember-drake.png', blurb: 'A tiny drake whose warm sneeze can toast exactly one marshmallow.' },
  { id: 'moon-moth', name: 'Moon Moth', color: '#9b7ed9', ink: '#3d2463', accent: '#e9c46a', kind: 'moth', img: 'img/pets/moon-moth.png', blurb: 'Wings shimmer on surprising facts — and on new notes.' },
  { id: 'inkcap-sprite', name: 'Inkcap Sprite', color: '#cfc7c0', ink: '#3d2a14', accent: '#8b5a2b', kind: 'inkcap', img: 'img/pets/inkcap-sprite.png', blurb: 'A tiny mushroom scholar who collects excellent new words from your songs.' },
];

const sprites = {};
function preloadSprites() {
  for (const pet of STORE_PETS) {
    if (!pet.img) continue;
    const image = new Image();
    image.src = pet.img;
    sprites[pet.id] = image;
  }
}

function spriteReady(pet) {
  const sprite = sprites[pet.id];
  return Boolean(sprite && sprite.complete && sprite.naturalWidth);
}

const listen = document.getElementById('listen');
const world = document.getElementById('world');
const dayPopup = document.getElementById('day-popup');
const popupPick = document.getElementById('popup-pick');
const popupMeet = document.getElementById('popup-meet');
const popupLead = document.getElementById('popup-lead');
const recordBtn = document.getElementById('record-btn');
const recordLabel = document.getElementById('record-label');
const listenStatus = document.getElementById('listen-status');
const listenError = document.getElementById('listen-error');
const songMeter = document.getElementById('song-meter');
const heardLine = document.getElementById('heard-line');
const viz = document.getElementById('viz');
const vizCtx = viz.getContext('2d');
const instrumentRow = document.getElementById('instrument-row');
const returnPet = document.getElementById('return-pet');
const saveLine = document.getElementById('save-line');
const petHall = document.getElementById('pet-hall');
const meetArt = document.getElementById('meet-art');
const meetCtx = meetArt.getContext('2d');
const meetName = document.getElementById('meet-name');
const meetBlurb = document.getElementById('meet-blurb');
const meetKicker = document.getElementById('meet-kicker');
const petNameInput = document.getElementById('pet-name');
const yard = document.getElementById('yard');
const yardCtx = yard.getContext('2d');
const speech = document.getElementById('speech');
const worldStatus = document.getElementById('world-status');
const worldKicker = document.getElementById('world-kicker');
const ageLabel = document.getElementById('age-label');
const clockLabel = document.getElementById('clock-label');
const serenadeBtn = document.getElementById('serenade-btn');
const homeOverlay = document.getElementById('home-overlay');
const careRow = document.getElementById('care-row');
const careGhost = document.getElementById('care-ghost');
const careGhostCtx = careGhost.querySelector('canvas').getContext('2d');

const meters = {
  hunger: document.getElementById('hunger-meter'),
  joy: document.getElementById('joy-meter'),
  rest: document.getElementById('rest-meter'),
  shine: document.getElementById('shine-meter'),
};

const audio = {
  ctx: null,
  analyser: null,
  freq: null,
  wave: null,
  mic: null,
  stream: null,
  synth: null,
};

const listenState = {
  on: false,
  mode: 'unlock',
  selected: 'violin',
  song: 0,
  scores: { violin: 0, guitar: 0, flute: 0, trumpet: 0 },
  lastHeard: '',
};

let save = loadSave();
let meeting = null;
let worldTime = 0;
let lastFrame = 0;
let popupTimer = 0;
let lastPetPersist = 0;
const walk = { phase: 'idle', t: 0, x: 175 };
const drag = { kind: null, x: 0, y: 0, overYard: false };
const careFx = { kind: null, x: 175, y: 150, t: 0 };

function defaultSave() {
  return {
    unlocked: false,
    instrument: null,
    petId: null,
    name: '',
    hunger: 82,
    joy: 80,
    rest: 78,
    shine: 74,
    serenades: 0,
    day: 1,
    petMs: 0,
    homeDate: null,
    lastTick: Date.now(),
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch {
    return defaultSave();
  }
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* ignore quota */
  }
}

function show(el) {
  [listen, world].forEach((screen) => {
    const on = screen === el;
    screen.classList.toggle('hidden', !on);
    if (on) screen.removeAttribute('hidden');
    else screen.setAttribute('hidden', '');
  });
}

function hideDayPopup() {
  dayPopup.classList.add('hidden');
  dayPopup.setAttribute('hidden', '');
}

function showDayPopup() {
  const inst = INSTRUMENTS[save.instrument] || INSTRUMENTS.violin;
  popupLead.textContent = `Your ${inst.name.toLowerCase()} song opened the store. These friends heard you practice.`;
  fillPetHall();
  popupPick.classList.remove('hidden');
  popupMeet.classList.add('hidden');
  dayPopup.classList.remove('hidden');
  dayPopup.removeAttribute('hidden');
}

function scheduleDayPopup() {
  clearTimeout(popupTimer);
  popupTimer = window.setTimeout(() => {
    if (!save.petId && !world.classList.contains('hidden')) showDayPopup();
  }, 1400);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isHomeToday() {
  return save.homeDate === todayKey();
}

function hideHomeOverlay() {
  homeOverlay.classList.add('hidden');
  homeOverlay.setAttribute('hidden', '');
}

function showHomeOverlay() {
  homeOverlay.classList.remove('hidden');
  homeOverlay.removeAttribute('hidden');
  world.classList.add('home');
  worldStatus.textContent = 'Your pet has gone home! play again tomorrow!';
  speech.textContent = `${save.name || 'Your pet'} walked into the palace.`;
}

function resetWalk() {
  walk.phase = 'idle';
  walk.t = 0;
  walk.x = 175;
}

function refreshDayLock() {
  if (save.homeDate && save.homeDate !== todayKey()) {
    save.homeDate = null;
    save.petMs = 0;
    resetWalk();
    hideHomeOverlay();
    persist();
  }
  if (isHomeToday()) {
    walk.phase = 'gone';
    walk.x = PALACE_DOOR_X;
  }
}

function sessionClock() {
  if (!save.petId) return 'Morning';
  if (isHomeToday() || walk.phase === 'gone') return 'Home';
  if (walk.phase === 'walking') return 'Bye';
  const left = Math.max(0, PET_SESSION - (save.petMs || 0));
  const s = Math.ceil(left / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function tickPetTime(dt) {
  refreshDayLock();
  if (world.classList.contains('hidden') || !save.petId) return;
  if (isHomeToday()) {
    if (homeOverlay.classList.contains('hidden')) showHomeOverlay();
    return;
  }
  if (walk.phase === 'idle') {
    save.petMs = (save.petMs || 0) + dt * 1000;
    if (performance.now() - lastPetPersist > 4000) {
      persist();
      lastPetPersist = performance.now();
    }
    if (save.petMs >= PET_SESSION) {
      walk.phase = 'walking';
      walk.t = 0;
      speech.textContent = `${save.name} walks into the palace…`;
      worldStatus.textContent = 'Time for bed in the palace.';
    }
  } else if (walk.phase === 'walking') {
    walk.t += dt;
    const p = Math.min(1, walk.t / 2.8);
    walk.x = 175 + p * (PALACE_DOOR_X - 175);
    if (p >= 1) {
      walk.phase = 'gone';
      save.homeDate = todayKey();
      persist();
      showHomeOverlay();
    }
  }
}

function findPet(id) {
  return STORE_PETS.find((pet) => pet.id === id) || STORE_PETS[0];
}

function clamp(n, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

async function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error('This browser cannot hear audio.');
  if (!audio.ctx) {
    audio.ctx = new AC();
    audio.analyser = audio.ctx.createAnalyser();
    audio.analyser.fftSize = 2048;
    audio.analyser.smoothingTimeConstant = 0.7;
    audio.freq = new Uint8Array(audio.analyser.frequencyBinCount);
    audio.wave = new Float32Array(audio.analyser.fftSize);
    audio.synth = audio.ctx.createGain();
    audio.synth.gain.value = 0.9;
    audio.synth.connect(audio.analyser);
    audio.synth.connect(audio.ctx.destination);
  }
  if (audio.ctx.state === 'suspended') await audio.ctx.resume();
  return audio.ctx;
}

async function openMic() {
  if (audio.mic) return true;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    audio.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    audio.mic = audio.ctx.createMediaStreamSource(audio.stream);
    audio.mic.connect(audio.analyser);
    return true;
  } catch {
    return false;
  }
}

function detectPitch(buf, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.008) return { f0: 0, rms, clarity: 0 };

  let bestOff = -1;
  let bestCorr = 0;
  const minL = Math.floor(sampleRate / 1100);
  const maxL = Math.min(Math.floor(sampleRate / 75), buf.length / 2);
  for (let off = minL; off < maxL; off++) {
    let corr = 0;
    for (let i = 0; i < buf.length - off; i++) corr += buf[i] * buf[i + off];
    if (corr > bestCorr) {
      bestCorr = corr;
      bestOff = off;
    }
  }
  const clarity = bestCorr / (rms * rms * buf.length + 0.0001);
  return { f0: bestOff > 0 ? sampleRate / bestOff : 0, rms, clarity };
}

function classify(f0, freq) {
  const nyquist = audio.ctx.sampleRate / 2;
  const binHz = nyquist / freq.length;
  const fundBin = Math.max(1, Math.round(f0 / binHz));
  const at = (n) => freq[Math.min(freq.length - 1, Math.round(fundBin * n))] / 255;
  const h1 = at(1);
  const h2 = at(2);
  const h3 = at(3);
  const h4 = at(4);
  let centroidNum = 0;
  let centroidDen = 0;
  for (let i = 1; i < freq.length; i++) {
    centroidNum += i * binHz * freq[i];
    centroidDen += freq[i];
  }
  const centroid = centroidDen ? centroidNum / centroidDen : 0;
  const odd = h1 + h3;
  const even = h2 + h4 + 0.0001;
  const scores = { violin: 0, guitar: 0, flute: 0, trumpet: 0 };

  if (f0 > 240 && f0 < 2100 && centroid < f0 * 2.4) scores.flute += 2.2;
  if (h2 < 0.5 && h3 < 0.42) scores.flute += 1.8;
  if (f0 > 180 && f0 < 2000) scores.violin += 1.1;
  if (h2 > 0.35 && h3 > 0.22) scores.violin += 2;
  if (f0 > 75 && f0 < 720) scores.guitar += 2;
  if (h2 > 0.25 && h2 < 0.85) scores.guitar += 1.1;
  if (f0 > 150 && f0 < 1050) scores.trumpet += 1.2;
  if (odd / even > 1.08) scores.trumpet += 2;
  if (centroid > f0 * 2.3) scores.trumpet += 1.4;
  scores[listenState.selected] += 0.35;
  return scores;
}

function winningInstrument() {
  let best = listenState.selected;
  let top = -1;
  for (const [id, value] of Object.entries(listenState.scores)) {
    if (value > top) {
      top = value;
      best = id;
    }
  }
  return INSTRUMENTS[best] ? best : listenState.selected;
}

function setMeter(el, value) {
  el.style.width = `${clamp(value)}%`;
}

function drawViz() {
  const w = viz.width;
  const h = viz.height;
  vizCtx.fillStyle = '#0c0810';
  vizCtx.fillRect(0, 0, w, h);
  if (!audio.analyser || !listenState.on) {
    vizCtx.fillStyle = '#3d2914';
    vizCtx.fillRect(0, h / 2 - 1, w, 2);
    return;
  }
  audio.analyser.getByteFrequencyData(audio.freq);
  const step = Math.max(1, Math.floor(audio.freq.length / 72));
  const barW = w / 72;
  for (let i = 0; i < 72; i++) {
    const v = audio.freq[i * step] / 255;
    const bh = Math.max(2, v * (h - 8));
    vizCtx.fillStyle = v > 0.55 ? '#e9c46a' : v > 0.25 ? '#e07a5f' : '#4a2c17';
    vizCtx.fillRect(i * barW + 1, h - bh, barW - 2, bh);
  }
}

function tickListen(dt) {
  if (!listenState.on || !audio.analyser) return;
  if (listen.classList.contains('hidden')) return;
  audio.analyser.getFloatTimeDomainData(audio.wave);
  const pitch = detectPitch(audio.wave, audio.ctx.sampleRate);
  const musical = pitch.clarity > 0.12 && pitch.rms > 0.01 && pitch.f0 > 70;
  if (musical) {
    listenState.song = clamp(listenState.song + dt, 0, SONG_NEED);
    listenState.lastHeard = INSTRUMENTS[winningInstrument()].name;
    heardLine.textContent = `Hearing ${INSTRUMENTS[winningInstrument()].emoji} ${listenState.lastHeard}`;
    audio.analyser.getByteFrequencyData(audio.freq);
    const add = classify(pitch.f0, audio.freq);
    for (const id of Object.keys(listenState.scores)) {
      listenState.scores[id] += add[id] * dt;
    }
  } else if (listenState.song > 0) {
    listenState.song = Math.max(0, listenState.song - dt * 0.12);
    heardLine.textContent = listenState.lastHeard
      ? `Keep playing — last heard ${listenState.lastHeard}`
      : 'Play a clear note…';
  }
  setMeter(songMeter, (listenState.song / SONG_NEED) * 100);
  if (listenState.song >= SONG_NEED) finishSong();
}

function finishSong() {
  const instrument = winningInstrument();
  stopListen(false);
  if (listenState.mode === 'serenade') {
    save.joy = clamp(save.joy + 38);
    save.shine = clamp(save.shine + 16);
    save.rest = clamp(save.rest - 4);
    save.serenades += 1;
    save.instrument = instrument;
    persist();
    worldStatus.textContent = `${INSTRUMENTS[instrument].emoji} ${save.name} loved that ${INSTRUMENTS[instrument].name.toLowerCase()} song.`;
    speech.textContent = serenadeLine();
    refreshWorldHud();
    enterWorld({ keepSpeech: true });
    return;
  }
  save.unlocked = true;
  save.instrument = instrument;
  save.day = save.day || 1;
  persist();
  if (save.petId) {
    enterWorld();
    return;
  }
  enterWorld({ waiting: true });
  scheduleDayPopup();
}

function fillPetHall() {
  petHall.innerHTML = '';
  for (const pet of STORE_PETS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'pet-card';
    if (pet.img) {
      const pic = document.createElement('img');
      pic.src = pet.img;
      pic.alt = pet.name;
      pic.width = 140;
      pic.height = 120;
      card.appendChild(pic);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 140;
      canvas.height = 120;
      drawPet(canvas.getContext('2d'), pet, { mood: 'happy', t: 0.4, scale: 0.42, x: 70, y: 84 });
      card.appendChild(canvas);
    }
    const title = document.createElement('h3');
    title.textContent = pet.name;
    const blurb = document.createElement('p');
    blurb.textContent = pet.blurb;
    card.append(title, blurb);
    card.addEventListener('click', () => openMeet(pet));
    petHall.appendChild(card);
  }
}

function openMeet(pet) {
  meeting = pet;
  const inst = INSTRUMENTS[save.instrument] || INSTRUMENTS.violin;
  meetKicker.textContent = `Day 1 · ${inst.emoji} ${inst.name}`;
  meetName.textContent = pet.name;
  meetBlurb.textContent = pet.blurb;
  petNameInput.value = save.name || pet.name.split(' ')[0];
  drawPet(meetCtx, pet, { mood: 'happy', t: 1, scale: 0.7, x: 140, y: 120 });
  popupPick.classList.add('hidden');
  popupMeet.classList.remove('hidden');
  petNameInput.focus();
}

function adoptPet() {
  if (!meeting) return;
  const name = petNameInput.value.trim().slice(0, 14) || meeting.name.split(' ')[0];
  save.petId = meeting.id;
  save.name = name;
  save.hunger = 84;
  save.joy = 86;
  save.rest = 80;
  save.shine = 78;
  save.serenades = 0;
  save.petMs = 0;
  save.homeDate = null;
  save.lastTick = Date.now();
  resetWalk();
  hideHomeOverlay();
  persist();
  hideDayPopup();
  enterWorld();
}

function ageName() {
  if (save.serenades >= 3) return 'Forever friend';
  if (save.serenades >= 1) return 'Young';
  return 'Hatchling';
}

function dayPart() {
  const hour = new Date().getHours();
  if (hour < 6 || hour >= 20) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Day';
  return 'Dusk';
}

function moodOf() {
  const avg = (save.hunger + save.joy + save.rest + save.shine) / 4;
  if (avg < 28) return 'sad';
  if (avg < 58) return 'ok';
  return 'happy';
}

function talk() {
  if (!save.petId) return 'Day 1. The garden is waiting for someone.';
  const mood = moodOf();
  const pet = findPet(save.petId);
  const lines = {
    sad: [
      `${save.name} looks small in the big hall.`,
      'A food bowl or a song would help.',
      `${pet.name} misses your playing.`,
    ],
    ok: [
      `${save.name} is waiting in the garden.`,
      'A water bowl might help.',
      'Drag the doll over. They always play.',
    ],
    happy: [
      `${save.name} spun in a circle!`,
      'The palace garden feels like home.',
      `${save.name} wants an encore.`,
    ],
  };
  const pack = lines[mood];
  return pack[Math.floor(Math.random() * pack.length)];
}

function serenadeLine() {
  const lines = [
    `${save.name} closed their eyes and listened.`,
    'The palace windows glowed for a second.',
    'That song unlocked another stitch of forever.',
  ];
  return lines[Math.min(save.serenades - 1, lines.length - 1)] || lines[0];
}

function applyDecay() {
  if (!save.petId) {
    save.lastTick = Date.now();
    return;
  }
  const now = Date.now();
  const minutes = Math.max(0, (now - save.lastTick) / 60000);
  save.lastTick = now;
  if (minutes <= 0) return;
  save.hunger = clamp(save.hunger - minutes * 1.6);
  save.joy = clamp(save.joy - minutes * 1.3);
  save.rest = clamp(save.rest - minutes * 0.7);
  save.shine = clamp(save.shine - minutes * 0.9);
}

function refreshWorldHud() {
  const instName = INSTRUMENTS[save.instrument]?.name || 'Song';
  if (!save.petId) {
    worldKicker.textContent = `Day ${save.day || 1} · ${instName}`;
    ageLabel.textContent = 'Day 1';
    clockLabel.textContent = sessionClock();
    setMeter(meters.hunger, 0);
    setMeter(meters.joy, 0);
    setMeter(meters.rest, 0);
    setMeter(meters.shine, 0);
    if (!speech.textContent || speech.textContent === '…') {
      speech.textContent = 'Day 1. The store is about to open…';
    }
    return;
  }
  worldKicker.textContent = `${save.name} · ${instName}`;
  ageLabel.textContent = ageName();
  clockLabel.textContent = sessionClock();
  setMeter(meters.hunger, save.hunger);
  setMeter(meters.joy, save.joy);
  setMeter(meters.rest, save.rest);
  setMeter(meters.shine, save.shine);
  if (!speech.textContent || speech.textContent === '…') speech.textContent = talk();
}

function care(kind) {
  if (!save.petId) {
    showDayPopup();
    return;
  }
  if (isHomeToday() || walk.phase !== 'idle') return;
  if (kind === 'food') {
    save.hunger = clamp(save.hunger + 30);
    save.shine = clamp(save.shine - 5);
    speech.textContent = `${save.name} ate from the food bowl.`;
  } else if (kind === 'water') {
    save.shine = clamp(save.shine + 34);
    save.rest = clamp(save.rest - 4);
    speech.textContent = `${save.name} lapped the water bowl.`;
  } else if (kind === 'play') {
    save.joy = clamp(save.joy + 26);
    save.rest = clamp(save.rest - 10);
    save.hunger = clamp(save.hunger - 8);
    speech.textContent = `${save.name} hugged the doll.`;
  } else if (kind === 'nap') {
    save.rest = clamp(save.rest + 36);
    save.hunger = clamp(save.hunger - 6);
    speech.textContent = `${save.name} tucked under the blanket.`;
  }
  careFx.kind = kind;
  careFx.x = 175;
  careFx.y = 150;
  careFx.t = 1.2;
  persist();
  refreshWorldHud();
}

function enterWorld(opts = {}) {
  refreshDayLock();
  applyDecay();
  persist();
  world.classList.toggle('waiting', !save.petId);
  world.classList.toggle('home', isHomeToday());
  if (isHomeToday()) {
    showHomeOverlay();
  } else {
    hideHomeOverlay();
  }
  if (!opts.keepSpeech) {
    if (isHomeToday()) {
      speech.textContent = `${save.name} is already home in the palace.`;
      worldStatus.textContent = 'Your pet has gone home! play again tomorrow!';
    } else if (opts.waiting || !save.petId) {
      speech.textContent = 'Day 1. The garden woke up after your practice.';
      worldStatus.textContent = 'Wait for the store — then pick your forever pet.';
    } else {
      speech.textContent = `${save.name} found you. This garden is yours now.`;
      worldStatus.textContent = 'Drag food, water, a doll, or a blanket onto your pet.';
    }
  }
  refreshWorldHud();
  show(world);
  if (!save.petId && !opts.waiting && !isHomeToday()) scheduleDayPopup();
}

function oval(ctx, x, y, rx, ry, fill, rot = 0, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.6, rx), Math.max(0.6, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
}

function poly(ctx, pts, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
}

function drawCareStamp(ctx, kind) {
  if (kind === 'food' || kind === 'water') {
    oval(ctx, 0, 14, 28, 8, 'rgba(20,12,10,0.22)');
    oval(ctx, 0, 8, 26, 11, '#6b3a1f', 0, '#2b1810');
    oval(ctx, 0, 4, 22, 8, '#8d5a2b', 0, '#2b1810');
    if (kind === 'food') {
      oval(ctx, 0, 2, 18, 6, '#c47a2a');
      oval(ctx, -7, 1, 4.5, 3.2, '#e9c46a');
      oval(ctx, 5, 2, 4.5, 3.2, '#e76f51');
      oval(ctx, -1, -1, 3.5, 2.5, '#fff3b0');
      oval(ctx, 8, -1, 3, 2.2, '#d4a373');
    } else {
      oval(ctx, 0, 2, 18, 6, '#3a86ff');
      oval(ctx, 0, 1, 14, 4, '#4ea8de');
      oval(ctx, -6, -1, 5, 2.2, '#caf0f8');
    }
    return;
  }
  if (kind === 'play') {
    oval(ctx, 0, 18, 14, 5, 'rgba(20,12,10,0.22)');
    oval(ctx, -7, -18, 5, 6, '#c41e3a', 0.25, '#4a2c17');
    oval(ctx, 7, -18, 5, 6, '#c41e3a', -0.25, '#4a2c17');
    oval(ctx, 0, -10, 11, 11, '#f0d0b0', 0, '#4a2c17');
    oval(ctx, 0, 8, 13, 14, '#e07a5f', 0, '#4a2c17');
    oval(ctx, 0, 6, 8, 6, '#fff8ef');
    oval(ctx, -14, 2, 5, 4, '#f0d0b0', 0, '#4a2c17');
    oval(ctx, 14, 2, 5, 4, '#f0d0b0', 0, '#4a2c17');
    oval(ctx, -4, -12, 2, 2.4, '#1a120c');
    oval(ctx, 4, -12, 2, 2.4, '#1a120c');
    ctx.strokeStyle = '#4a2c17';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -8, 3.2, 0.15, Math.PI - 0.15);
    ctx.stroke();
    return;
  }
  oval(ctx, 0, 16, 20, 5, 'rgba(20,12,10,0.22)');
  poly(ctx, [[-24, 10], [-18, -12], [24, -16], [22, 12]], '#6a4c93', '#2b1810');
  poly(ctx, [[-18, -12], [6, -20], [24, -16]], '#9b5de5', '#2b1810');
  ctx.fillStyle = '#e9c46a';
  ctx.fillRect(-12, -6, 18, 3);
  ctx.fillRect(-10, 1, 16, 3);
  ctx.fillStyle = '#fff8ef';
  ctx.fillRect(14, -8, 3, 14);
}

function drawCareIcon(ctx, kind) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2 + 2);
  ctx.scale(ctx.canvas.width / 80, ctx.canvas.height / 64);
  drawCareStamp(ctx, kind);
  ctx.restore();
}

function drawFace(ctx, mood, ink, accent, eyeY = -26) {
  const sad = mood === 'sad';
  oval(ctx, -9, eyeY, 6, sad ? 2.2 : 7, '#fff8ef', 0, ink);
  oval(ctx, 9, eyeY, 6, sad ? 2.2 : 7, '#fff8ef', 0, ink);
  if (!sad) {
    oval(ctx, -8, eyeY, 3.2, 4, ink);
    oval(ctx, 10, eyeY, 3.2, 4, ink);
    oval(ctx, -7, eyeY - 1.5, 1.3, 1.3, '#fff8ef');
    oval(ctx, 11, eyeY - 1.5, 1.3, 1.3, '#fff8ef');
  }
  oval(ctx, 0, eyeY + 10, 4, 3, accent);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (sad) {
    ctx.arc(0, eyeY + 18, 7, Math.PI + 0.3, -0.3);
  } else {
    ctx.arc(0, eyeY + 12, 8, 0.2, Math.PI - 0.2);
  }
  ctx.stroke();
}

function drawPet(ctx, pet, opt) {
  const { mood = 'happy', t = 0, scale = 1, x, y, clear = true } = opt;
  if (clear) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (spriteReady(pet)) {
    const sprite = sprites[pet.id];
    const bounce = Math.sin(t * 3.1) * (mood === 'sad' ? 1.5 : 5) * scale;
    const size = 118 * scale;
    ctx.save();
    oval(ctx, x, y + 8 * scale, 22 * scale, 7 * scale, 'rgba(20,12,10,0.22)');
    ctx.translate(x, y + bounce);
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(sprite, -size / 2, -size + 6 * scale, size, size);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const bounce = Math.sin(t * 3.1) * (mood === 'sad' ? 1.5 : 5);
  ctx.translate(0, -bounce);
  const body = pet.color;
  const ink = pet.ink;
  const accent = pet.accent;
  const kind = pet.kind;
  oval(ctx, 0, 56, 34, 9, 'rgba(20,12,10,0.22)');

  if (kind === 'peacock') {
    for (let i = -3; i <= 3; i++) {
      oval(ctx, i * 12, -8, 10, 28, accent, i * 0.18, ink);
      oval(ctx, i * 12, -28, 6, 6, '#2a9d8f', 0, ink);
      oval(ctx, i * 12, -28, 2.5, 2.5, '#e9c46a');
    }
  }
  if (kind === 'moth' || kind === 'sprite' || kind === 'drake') {
    oval(ctx, -36, -6, 26, 20, accent, -0.35, ink);
    oval(ctx, 36, -6, 26, 20, accent, 0.35, ink);
    oval(ctx, -32, -8, 12, 10, '#fff8ef');
    oval(ctx, 32, -8, 12, 10, '#fff8ef');
  }
  if (kind === 'owl' || kind === 'finch') {
    oval(ctx, -24, 12, 18, 12, body, -0.45, ink);
    oval(ctx, 24, 12, 18, 12, body, 0.45, ink);
  }
  if (kind === 'fox' || kind === 'pup' || kind === 'raccoon' || kind === 'lion') {
    oval(ctx, 32, 8, 18, 10, kind === 'raccoon' ? ink : accent, 0.4, ink);
    if (kind === 'raccoon') {
      oval(ctx, 40, 8, 5, 7, body);
      oval(ctx, 48, 8, 4, 6, ink);
    }
  }

  oval(ctx, 0, 14, kind === 'gecko' || kind === 'beetle' ? 40 : 32, 26, body, 0, ink);
  oval(ctx, -16, 36, 8, 10, body, 0.1, ink);
  oval(ctx, 16, 36, 8, 10, body, -0.1, ink);
  oval(ctx, 0, -24, 24, 22, body, 0, ink);

  if (kind === 'bunny') {
    oval(ctx, -12, -58, 6, 22, body, -0.12, ink);
    oval(ctx, 12, -58, 6, 22, body, 0.12, ink);
    oval(ctx, -12, -58, 3, 14, accent);
    oval(ctx, 12, -58, 3, 14, accent);
    oval(ctx, 22, 28, 8, 8, '#fff8ef', 0, ink);
  }
  if (kind === 'mossling') {
    ctx.strokeStyle = '#8d6e4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -40);
    ctx.lineTo(-18, -64);
    ctx.lineTo(-26, -56);
    ctx.moveTo(-18, -64);
    ctx.lineTo(-12, -72);
    ctx.moveTo(10, -40);
    ctx.lineTo(18, -64);
    ctx.lineTo(26, -56);
    ctx.moveTo(18, -64);
    ctx.lineTo(12, -72);
    ctx.stroke();
    oval(ctx, 0, -48, 6, 6, '#fff8ef', 0, '#e9c46a');
    oval(ctx, -8, -44, 5, 5, '#fff8ef', 0, '#e9c46a');
    oval(ctx, 8, -44, 5, 5, '#fff8ef', 0, '#e9c46a');
  }
  if (kind === 'otter') {
    oval(ctx, 0, 16, 16, 14, accent);
    oval(ctx, 30, -4, 16, 12, '#edf2f4', 0.25, ink);
    oval(ctx, 40, 0, 10, 8, '#fff8ef');
    oval(ctx, -10, 44, 5, 4, '#8d8d8d', 0, ink);
    oval(ctx, 2, 46, 5, 4, '#a8a8a8', 0, ink);
    oval(ctx, 14, 44, 5, 4, '#7a7a7a', 0, ink);
  }
  if (kind === 'drake') {
    oval(ctx, 32, 18, 10, 16, '#ffd166', 0.45, ink);
    poly(ctx, [[-8, -42], [-6, -58], [0, -44]], '#c9a227', ink);
    poly(ctx, [[8, -42], [6, -58], [0, -44]], '#c9a227', ink);
  }
  if (kind === 'inkcap') {
    oval(ctx, 0, -42, 28, 14, '#6b5344', 0, ink);
    oval(ctx, 0, -36, 22, 8, '#3d2a14');
    oval(ctx, 18, 28, 10, 7, '#fff8ef', 0.2, ink);
  }
  if (kind === 'fox' || kind === 'cat' || kind === 'mouse') {
    poly(ctx, [[-18, -38], [-24, -62], [-4, -40]], body, ink);
    poly(ctx, [[18, -38], [24, -62], [4, -40]], body, ink);
    if (kind !== 'mouse') {
      poly(ctx, [[-16, -42], [-20, -56], [-8, -42]], accent);
      poly(ctx, [[16, -42], [20, -56], [8, -42]], accent);
    }
  }
  if (kind === 'lion') {
    oval(ctx, 0, -24, 36, 30, accent, 0, ink);
    oval(ctx, 0, -22, 22, 18, body, 0, ink);
  }
  if (kind === 'raccoon') {
    oval(ctx, -12, -26, 9, 6, ink);
    oval(ctx, 12, -26, 9, 6, ink);
  }
  if (kind === 'pup') {
    oval(ctx, -18, -18, 10, 14, body, 0.5, ink);
    oval(ctx, 18, -18, 10, 14, body, -0.5, ink);
  }
  if (kind === 'gecko') {
    oval(ctx, 36, 10, 20, 7, accent, 0.2, ink);
    oval(ctx, -10, 8, 5, 4, '#fff8ef');
    oval(ctx, 8, 18, 5, 4, '#fff8ef');
  }
  if (kind === 'beetle') {
    oval(ctx, 0, 8, 28, 22, accent, 0, ink);
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 28);
    ctx.stroke();
  }
  if (kind === 'owl') {
    poly(ctx, [[-16, -40], [-20, -56], [-6, -42]], body, ink);
    poly(ctx, [[16, -40], [20, -56], [6, -42]], body, ink);
    oval(ctx, -10, -26, 10, 11, '#fff8ef', 0, ink);
    oval(ctx, 10, -26, 10, 11, '#fff8ef', 0, ink);
  }
  if (kind === 'finch') {
    poly(ctx, [[8, -18], [26, -14], [8, -8]], accent, ink);
  }
  if (kind === 'mouse') {
    oval(ctx, -20, -28, 10, 10, accent, 0, ink);
    oval(ctx, 20, -28, 10, 10, accent, 0, ink);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, 20);
    ctx.quadraticCurveTo(48, 8, 52, 28);
    ctx.stroke();
  }
  if (kind === 'sprite') {
    oval(ctx, 0, -8, 22, 22, 'rgba(255,255,255,0.28)');
  }

  drawFace(ctx, mood, ink, accent, kind === 'owl' ? -26 : -26);
  if (kind === 'cat' || kind === 'fox') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-28, -10);
    ctx.moveTo(-6, -12);
    ctx.lineTo(-28, -16);
    ctx.moveTo(6, -14);
    ctx.lineTo(28, -10);
    ctx.moveTo(6, -12);
    ctx.lineTo(28, -16);
    ctx.stroke();
  }
  if (save.serenades >= 3 && pet.id === save.petId) {
    poly(ctx, [[-10, -56], [0, -72], [10, -56]], '#e9c46a', ink);
  }
  ctx.restore();
}

function drawPalace(ctx, night) {
  const stone = night ? '#6d5a4a' : '#e6d5b8';
  const dark = night ? '#3d2a1c' : '#b08968';
  const gold = '#e9c46a';
  ctx.fillStyle = dark;
  ctx.fillRect(248, 78, 158, 112);
  ctx.fillStyle = stone;
  ctx.fillRect(256, 86, 142, 104);
  poly(ctx, [[248, 86], [327, 38], [406, 86]], '#c41e3a', '#2b1810');
  ctx.fillStyle = dark;
  ctx.fillRect(252, 48, 28, 52);
  ctx.fillRect(374, 48, 28, 52);
  poly(ctx, [[248, 50], [266, 22], [284, 50]], '#7a1f2b', '#2b1810');
  poly(ctx, [[370, 50], [388, 22], [406, 50]], '#7a1f2b', '#2b1810');
  ctx.fillStyle = gold;
  ctx.fillRect(262, 40, 8, 18);
  ctx.fillRect(384, 40, 8, 18);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = stone;
    ctx.fillRect(258 + i * 24, 78, 14, 10);
  }
  const glow = night ? '#ffd166' : '#7ec8e3';
  ctx.fillStyle = glow;
  ctx.fillRect(276, 100, 22, 22);
  ctx.fillRect(356, 100, 22, 22);
  ctx.fillStyle = '#2b1810';
  ctx.fillRect(286, 100, 2, 22);
  ctx.fillRect(276, 110, 22, 2);
  ctx.fillRect(366, 100, 2, 22);
  ctx.fillRect(356, 110, 22, 2);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.moveTo(312, 128);
  ctx.quadraticCurveTo(327, 108, 342, 128);
  ctx.lineTo(342, 186);
  ctx.lineTo(312, 186);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2b1810';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(325, 128, 4, 58);
  oval(ctx, 336, 158, 3, 3, '#fff3b0');
}

function drawYard(t) {
  const ctx = yardCtx;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const night = dayPart() === 'Night';
  const sky = ctx.createLinearGradient(0, 0, 0, 150);
  sky.addColorStop(0, night ? '#14213d' : '#7ec8e3');
  sky.addColorStop(1, night ? '#3d2463' : '#caf0f8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = night ? '#e9c46a' : '#fff3b0';
  ctx.beginPath();
  ctx.arc(night ? 52 : 86, 36, 18, 0, Math.PI * 2);
  ctx.fill();
  if (!night) {
    oval(ctx, 180, 32, 28, 12, 'rgba(255,255,255,0.75)');
    oval(ctx, 200, 28, 20, 10, 'rgba(255,255,255,0.6)');
    oval(ctx, 40, 48, 18, 8, 'rgba(255,255,255,0.5)');
  } else {
    ctx.fillStyle = '#fff8ef';
    for (let i = 0; i < 16; i++) ctx.fillRect(18 + (i * 23) % 400, 8 + (i * 11) % 50, 2, 2);
  }
  ctx.fillStyle = night ? '#2d6a4f' : '#74c69d';
  ctx.fillRect(0, 150, w, h);
  ctx.fillStyle = night ? '#1b4332' : '#52b788';
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.quadraticCurveTo(80, 138, 160, 152);
  ctx.quadraticCurveTo(240, 164, w, 148);
  ctx.lineTo(w, 250);
  ctx.lineTo(0, 250);
  ctx.fill();
  ctx.fillStyle = '#d4a373';
  ctx.beginPath();
  ctx.moveTo(150, 250);
  ctx.lineTo(190, 168);
  ctx.lineTo(318, 186);
  ctx.lineTo(360, 250);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#c38e70';
    ctx.fillRect(188 + i * 26, 176 + i * 8, 16, 8);
  }
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(28, 118, 16, 52);
  oval(ctx, 36, 108, 32, 24, '#2d6a4f');
  oval(ctx, 22, 98, 18, 16, '#40916c');
  oval(ctx, 50, 96, 16, 14, '#52b788');
  oval(ctx, 58, 188, 6, 6, '#ff8fab');
  oval(ctx, 78, 196, 5, 5, '#e9c46a');
  oval(ctx, 120, 184, 6, 6, '#c77dff');
  oval(ctx, 98, 200, 5, 5, '#e76f51');
  drawPalace(ctx, night);

  const petY = 198;
  if (!save.petId) {
    const wobble = Math.sin(t * 2.4) * 2;
    oval(ctx, 175, petY + 8, 24, 8, 'rgba(20,12,10,0.2)');
    oval(ctx, 175, petY - 4 + wobble * 0.2, 16, 22, '#fff8ef', 0, '#5c3a28');
    oval(ctx, 169, petY - 12, 4, 4, '#e9c46a');
    oval(ctx, 180, petY, 4, 3, '#e07a5f');
    oval(ctx, 172, petY + 6, 4, 3, '#2a9d8f');
    return;
  }
  if (walk.phase !== 'gone') {
    const enter = walk.phase === 'walking' ? Math.min(1, walk.t / 2.8) : 0;
    const pet = findPet(save.petId);
    drawPet(ctx, pet, {
      mood: moodOf(),
      t,
      scale: (save.serenades >= 3 ? 0.62 : 0.54) * (1 - enter * 0.35),
      x: walk.phase === 'walking' ? walk.x : 175,
      y: petY,
      clear: false,
    });
  }
  if (careFx.kind && careFx.t > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, careFx.t);
    ctx.translate(careFx.x, careFx.y);
    ctx.scale(0.72, 0.72);
    drawCareStamp(ctx, careFx.kind);
    ctx.restore();
  }
  ctx.fillStyle = '#e9c46a';
  ctx.beginPath();
  ctx.moveTo(312, 128);
  ctx.quadraticCurveTo(327, 108, 342, 128);
  ctx.lineTo(342, 186);
  ctx.lineTo(312, 186);
  ctx.closePath();
  ctx.globalAlpha = walk.phase === 'gone' ? 1 : walk.phase === 'walking' ? 0.55 : 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;
}

async function startListen(mode) {
  listenState.mode = mode;
  listenState.song = 0;
  listenState.scores = { violin: 0, guitar: 0, flute: 0, trumpet: 0 };
  listenState.lastHeard = '';
  setMeter(songMeter, 0);
  listenError.classList.add('hidden');
  try {
    await ensureAudio();
  } catch (err) {
    listenError.textContent = err.message;
    listenError.classList.remove('hidden');
    return;
  }
  const micOk = await openMic();
  if (!micOk) {
    listenError.textContent = 'Allow the microphone. Pet Palace only hears a real instrument in the room.';
    listenError.classList.remove('hidden');
    listenStatus.textContent = 'The mic is blocked. Allow it, then play your instrument near the laptop.';
    return;
  }
  listenState.on = true;
  recordBtn.classList.add('listening');
  recordBtn.setAttribute('aria-pressed', 'true');
  recordLabel.textContent = 'Listening';
  serenadeBtn.classList.toggle('listening', mode === 'serenade');
  if (mode === 'serenade') show(listen);
  listenStatus.textContent = mode === 'serenade'
    ? `Serenade ${save.name}. Play your real instrument near the laptop.`
    : 'Listening. Play your real instrument near the laptop.';
  heardLine.textContent = 'Listening for an instrument…';
}

function stopListen(resetMeter = true) {
  listenState.on = false;
  recordBtn.classList.remove('listening');
  recordBtn.setAttribute('aria-pressed', 'false');
  recordLabel.textContent = 'Record';
  serenadeBtn.classList.remove('listening');
  if (resetMeter) {
    listenState.song = 0;
    setMeter(songMeter, 0);
  }
}

function renderSaveLine() {
  if (isHomeToday() && save.petId) {
    saveLine.textContent = `${save.name} went home. Play again tomorrow!`;
    saveLine.classList.remove('hidden');
    returnPet.textContent = 'See the palace';
    returnPet.classList.remove('hidden');
  } else if (save.petId && save.name) {
    saveLine.textContent = `${save.name} is waiting in the garden.`;
    saveLine.classList.remove('hidden');
    returnPet.textContent = 'Return to your pet';
    returnPet.classList.remove('hidden');
  } else if (save.unlocked && save.instrument) {
    saveLine.textContent = `Day 1 is waiting after your ${INSTRUMENTS[save.instrument].name.toLowerCase()} practice.`;
    saveLine.classList.remove('hidden');
    returnPet.textContent = 'Open the garden';
    returnPet.classList.remove('hidden');
  } else {
    saveLine.classList.add('hidden');
    returnPet.classList.add('hidden');
  }
}

function buildChips() {
  instrumentRow.innerHTML = '';
  for (const inst of Object.values(INSTRUMENTS)) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip${listenState.selected === inst.id ? ' on' : ''}`;
    chip.textContent = `${inst.emoji} ${inst.name}`;
    chip.title = `I'm playing ${inst.name}`;
    chip.addEventListener('click', () => {
      listenState.selected = inst.id;
      buildChips();
    });
    instrumentRow.appendChild(chip);
  }
}

function loop(now) {
  const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016;
  lastFrame = now;
  worldTime += dt;
  drawViz();
  if (listenState.on) tickListen(dt);
  if (!world.classList.contains('hidden')) {
    if (careFx.t > 0) careFx.t = Math.max(0, careFx.t - dt);
    tickPetTime(dt);
    applyDecay();
    if (Math.floor(worldTime * 4) % 20 === 0) refreshWorldHud();
    drawYard(worldTime);
  }
  if (!popupMeet.classList.contains('hidden') && meeting) {
    drawPet(meetCtx, meeting, { mood: 'happy', t: worldTime, scale: 0.7, x: 140, y: 120 });
  }
  requestAnimationFrame(loop);
}

recordBtn.addEventListener('click', async () => {
  if (listenState.on) stopListen();
  else await startListen('unlock');
});

serenadeBtn.addEventListener('click', async () => {
  if (!save.petId) {
    showDayPopup();
    return;
  }
  if (isHomeToday() || walk.phase !== 'idle') return;
  if (listenState.on) stopListen();
  else await startListen('serenade');
});

homeOverlay.addEventListener('click', hideHomeOverlay);
document.getElementById('adopt-btn').addEventListener('click', adoptPet);
document.getElementById('back-hall').addEventListener('click', () => {
  popupMeet.classList.add('hidden');
  popupPick.classList.remove('hidden');
});
returnPet.addEventListener('click', enterWorld);
document.getElementById('replay-song').addEventListener('click', () => {
  stopListen();
  listenState.mode = 'unlock';
  hideDayPopup();
  hideHomeOverlay();
  clearTimeout(popupTimer);
  renderSaveLine();
  show(listen);
});
document.getElementById('reset-palace').addEventListener('click', () => {
  if (!confirm('Release this forever pet and lock the palace again?')) return;
  save = defaultSave();
  persist();
  stopListen();
  hideDayPopup();
  hideHomeOverlay();
  resetWalk();
  clearTimeout(popupTimer);
  renderSaveLine();
  listenStatus.textContent = 'Press Record, allow the mic, then play your real instrument.';
  heardLine.textContent = 'Listening for an instrument…';
  show(listen);
});
petNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') adoptPet();
});
function yardFromClient(clientX, clientY) {
  const rect = yard.getBoundingClientRect();
  return {
    inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom,
    x: (clientX - rect.left) * (yard.width / Math.max(1, rect.width)),
    y: (clientY - rect.top) * (yard.height / Math.max(1, rect.height)),
  };
}

function showCareGhost(kind, clientX, clientY) {
  drawCareIcon(careGhostCtx, kind);
  careGhost.style.left = `${clientX}px`;
  careGhost.style.top = `${clientY}px`;
  careGhost.classList.remove('hidden');
  careGhost.removeAttribute('hidden');
}

function hideCareGhost() {
  careGhost.classList.add('hidden');
  careGhost.setAttribute('hidden', '');
  yard.classList.remove('drop-ready');
}

function paintCareIcons() {
  careRow.querySelectorAll('[data-care]').forEach((item) => {
    drawCareIcon(item.querySelector('canvas').getContext('2d'), item.dataset.care);
  });
}

function bindCareDrag() {
  careRow.querySelectorAll('[data-care]').forEach((item) => {
    item.addEventListener('pointerdown', (event) => {
      if (world.classList.contains('waiting') || world.classList.contains('home')) return;
      if (!save.petId || isHomeToday() || walk.phase !== 'idle') return;
      event.preventDefault();
      item.setPointerCapture(event.pointerId);
      drag.kind = item.dataset.care;
      drag.overYard = false;
      item.classList.add('dragging');
      showCareGhost(drag.kind, event.clientX, event.clientY);
    });
    item.addEventListener('pointermove', (event) => {
      if (!drag.kind) return;
      showCareGhost(drag.kind, event.clientX, event.clientY);
      const at = yardFromClient(event.clientX, event.clientY);
      drag.overYard = at.inside;
      drag.x = at.x;
      drag.y = at.y;
      yard.classList.toggle('drop-ready', at.inside);
    });
    const endDrag = (event) => {
      if (!drag.kind) return;
      const kind = drag.kind;
      const at = yardFromClient(event.clientX, event.clientY);
      item.classList.remove('dragging');
      hideCareGhost();
      drag.kind = null;
      drag.overYard = false;
      if (at.inside) {
        careFx.x = 175;
        careFx.y = 150;
        care(kind);
        worldStatus.textContent = 'Drag food, water, a doll, or a blanket onto your pet.';
      } else {
        worldStatus.textContent = 'Drop it on your pet in the garden.';
      }
    };
    item.addEventListener('pointerup', endDrag);
    item.addEventListener('pointercancel', endDrag);
  });
}
window.addEventListener('pagehide', persist);

preloadSprites();
paintCareIcons();
bindCareDrag();
buildChips();
refreshDayLock();
renderSaveLine();
if (save.petId && save.name) {
  listenStatus.textContent = `Welcome back. Record a new song, or return to ${save.name}.`;
}
requestAnimationFrame(loop);
