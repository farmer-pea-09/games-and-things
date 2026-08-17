import {
  netHost,
  netJoin,
  netBroadcast,
  netStop,
  makeRoomCode,
  inviteUrl,
  setInviteOrigin,
  MAX_PLAYERS,
} from './chameleon-net.js';

const LIFE_NET = 'gatlife-';
const W = 800;
const H = 480;
const SAVE_KEY = 'oakstreet-life-save';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HAIR = ['#3b2a1a', '#111111', '#d4a017', '#8b2e1a', '#3d5a80', '#5c4d3c'];
const SEC_PER_HOUR = 16;

const JOBS = {
  none: { id: 'none', title: 'Unemployed', place: '—', wage: 0, game: null, scene: null },
  barista: { id: 'barista', title: 'Barista', place: 'Bean & Oak', wage: 11, game: 'cafe', scene: 'work' },
  lead: { id: 'lead', title: 'Shift Lead', place: 'Bean & Oak', wage: 15, game: 'cafe', scene: 'work' },
  clerk: { id: 'clerk', title: 'Office Clerk', place: 'Stack & File', wage: 17, game: 'office', scene: 'office' },
  cashier: { id: 'cashier', title: 'Cashier', place: 'Corner Market', wage: 12, game: 'market', scene: 'town' },
};

const CAFE_KEYS = [
  { id: 'brew', key: 'a', label: 'BREW', color: '#6a4428' },
  { id: 'milk', key: 's', label: 'MILK', color: '#f4ead4' },
  { id: 'pour', key: 'd', label: 'POUR', color: '#c47838' },
  { id: 'lid', key: 'f', label: 'LID', color: '#c04028' },
];
const OFFICE_KEYS = [
  { id: 'in', key: 'a', label: 'IN', color: '#3d6b4f' },
  { id: 'out', key: 's', label: 'OUT', color: '#3a78c8' },
  { id: 'shred', key: 'd', label: 'SHRED', color: '#c04028' },
];
const MARKET_KEYS = [
  { id: 'fruit', key: 'a', label: 'FRUIT', color: '#d84848' },
  { id: 'can', key: 's', label: 'CAN', color: '#8a8a8a' },
  { id: 'bread', key: 'd', label: 'BREAD', color: '#e0a050' },
];

const PETS = {
  cat: { id: 'cat', label: 'Cat', price: 65, food: 10 },
  dog: { id: 'dog', label: 'Dog', price: 80, food: 12 },
  bird: { id: 'bird', label: 'Bird', price: 45, food: 8 },
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const dayLabel = document.getElementById('day-label');
const timeLabel = document.getElementById('time-label');
const moneyLabel = document.getElementById('money-label');
const jobLabel = document.getElementById('job-label');
const petLabel = document.getElementById('pet-label');
const promptLabel = document.getElementById('prompt-label');
const toastLabel = document.getElementById('toast-label');
const actLabel = document.getElementById('act-label');
const energyBar = document.getElementById('energy-bar');
const hungerBar = document.getElementById('hunger-bar');
const moodBar = document.getElementById('mood-bar');
const hygieneBar = document.getElementById('hygiene-bar');
const healthBar = document.getElementById('health-bar');

const keys = new Set();
let menu = 'boot';
let lastTime = 0;
let toast = '';
let toastTimer = 0;
let prompt = null;
let customers = [];
let particles = [];
let riley = { x: 250, y: 280, vx: 12, face: 1 };
let nicoHere = false;
let haleHere = false;
let workServed = 0;
let workTips = 0;
let jobGame = null;
let saveTimer = 0;
let hairPick = 0;
let nameDraft = 'Remy';
let multiplayerRole = null;
let multiplayerCode = '';
let ownPeerId = '';
let remotes = new Map();
let netAcc = 0;
let netBusy = false;
let pendingInvite = (new URLSearchParams(location.search).get('play') || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')
  .slice(0, 6);

fetch('/__lan.json', { cache: 'no-store' })
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    if (data?.origin) setInviteOrigin(data.origin);
  })
  .catch(() => {});

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hourOf(minutes) {
  return Math.floor(minutes / 60) % 24;
}

function weekday(day) {
  return (day - 1) % 7;
}

function isWeekend(day) {
  const d = weekday(day);
  return d === 5 || d === 6;
}

function formatTime(minutes) {
  const h24 = hourOf(minutes);
  const m = Math.floor(minutes % 60);
  const h = ((h24 + 11) % 12) + 1;
  const ap = h24 >= 12 ? 'PM' : 'AM';
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

function seasonId() {
  return Math.floor(((Math.max(1, state.day) - 1) % 28) / 7);
}

function seasonName() {
  return ['Spring', 'Summer', 'Fall', 'Winter'][seasonId()];
}

function pal() {
  const s = seasonId();
  return {
    grass: ['#7ed957', '#4caf50', '#c4a24a', '#dce6de'][s],
    grass2: ['#68c44a', '#3d9c44', '#b08a38', '#c8d4cc'][s],
    tree: ['#f2a0c0', '#2e8b3a', '#d2691e', '#eef4f8'][s],
    treeDark: ['#c07090', '#1f5c28', '#a05018', '#c5d0d8'][s],
    treeLight: ['#ffd0e8', '#7edc6a', '#f0b060', '#ffffff'][s],
    path: s === 3 ? '#e4e8ec' : '#e2c078',
    pathDark: s === 3 ? '#b8c0c8' : '#c4a058',
    flower: ['#ff8ab0', '#ffe066', '#e07030', '#ffffff'][s],
    sky: ['#8fd4f8', '#5eb8f0', '#f0a060', '#c5d4e8'][s],
  };
}

function newState() {
  return {
    name: 'Remy',
    hair: HAIR[0],
    shirt: '#2a9d8f',
    day: 1,
    minutes: 7 * 60,
    money: 100,
    energy: 78,
    hunger: 72,
    mood: 64,
    hygiene: 70,
    health: 100,
    scene: 'home',
    x: 640,
    y: 360,
    face: -1,
    look: 'down',
    moving: 0,
    jobId: 'barista',
    working: false,
    workedToday: false,
    calledSick: false,
    sickUsed: false,
    goodDays: 0,
    misses: 0,
    shift: 'none',
    morningDone: false,
    afternoonDone: false,
    openings: { cafe: false, office: false, market: false },
    rentPaid: false,
    utilPaid: false,
    rentLate: 0,
    utilLate: 0,
    mess: 18,
    food: 2,
    snacks: 1,
    petFood: 0,
    coffee: 0,
    pet: null,
    petOut: false,
    petSick: false,
    people: { riley: 58, hale: 42, priya: 50, nico: 40, moss: 28, alex: 35 },
    flags: { intro: false, fridgeBroke: false, promoted: false, officeOffer: false },
    eventDay: 0,
    dead: false,
    monthNote: false,
  };
}

let state = newState();

function job() {
  return JOBS[state.jobId] || JOBS.none;
}

function showToast(msg, time = 4.2) {
  toast = msg;
  toastTimer = time;
}

function addRel(id, n) {
  state.people[id] = clamp((state.people[id] || 40) + n, 0, 100);
}

function spendTime(mins) {
  state.minutes += mins;
  while (state.minutes >= 24 * 60) {
    state.minutes -= 24 * 60;
    newDay(false);
  }
}

function bump(stat, n) {
  state[stat] = clamp(state[stat] + n, 0, 100);
}

function trySpend(cost, label) {
  if (state.money < cost) {
    showToast(`Need $${cost} for ${label}.`);
    return false;
  }
  state.money -= cost;
  return true;
}

const WALLS = {
  home: [
    { x: 0, y: 0, w: 800, h: 18 },
    { x: 0, y: 462, w: 800, h: 18 },
    { x: 0, y: 0, w: 18, h: 480 },
    { x: 782, y: 0, w: 18, h: 480 },
    { x: 250, y: 18, w: 16, h: 130 },
    { x: 488, y: 18, w: 16, h: 150 },
  ],
  town: [
    { x: 0, y: 0, w: 800, h: 12 },
    { x: 0, y: 468, w: 800, h: 12 },
    { x: 0, y: 0, w: 12, h: 480 },
    { x: 788, y: 0, w: 12, h: 480 },
  ],
  work: [
    { x: 0, y: 0, w: 800, h: 18 },
    { x: 0, y: 462, w: 800, h: 18 },
    { x: 0, y: 0, w: 18, h: 480 },
    { x: 782, y: 0, w: 18, h: 480 },
    { x: 90, y: 210, w: 420, h: 24 },
  ],
  office: [
    { x: 0, y: 0, w: 800, h: 18 },
    { x: 0, y: 462, w: 800, h: 18 },
    { x: 0, y: 0, w: 18, h: 480 },
    { x: 782, y: 0, w: 18, h: 480 },
  ],
};

function hitsWall(x, y) {
  const r = { x: x - 7, y: y - 10, w: 14, h: 10 };
  const walls = WALLS[state.scene] || [];
  for (const w of walls) {
    if (r.x < w.x + w.w && r.x + r.w > w.x && r.y < w.y + w.h && r.y + r.h > w.y) return true;
  }
  return false;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function addRemotes(list) {
  for (const remote of remotes.values()) {
    if (remote.scene === state.scene) {
      list.push({
        id: `player:${remote.id}`,
        name: remote.name || 'Friend',
        x: remote.x,
        y: remote.y,
        verb: 'Talk',
      });
    }
  }
  return list;
}

function interactables() {
  if (state.scene === 'home') {
    const list = [
      { id: 'bed', name: 'Bed', x: 70, y: 90, verb: 'Sleep' },
      { id: 'shower', name: 'Shower', x: 320, y: 80, verb: 'Shower' },
      { id: 'fridge', name: 'Fridge', x: 580, y: 80, verb: 'Eat' },
      { id: 'desk', name: 'Desk', x: 80, y: 330, verb: 'Bills & calls' },
      { id: 'couch', name: 'Couch', x: 230, y: 250, verb: 'Relax' },
      { id: 'sink', name: 'Sink', x: 430, y: 80, verb: 'Clean' },
      { id: 'door', name: 'Front door', x: 740, y: 400, verb: 'Go outside' },
      { id: 'riley', name: 'Riley', x: riley.x, y: riley.y, verb: 'Talk' },
    ];
    if (state.pet) list.push({ id: 'bowl', name: 'Pet bowl', x: 200, y: 360, verb: 'Feed pet' });
    if (state.pet && !state.petOut) list.push({ id: 'pet', name: state.pet.name, x: state.pet.x, y: state.pet.y, verb: 'Pet' });
    return addRemotes(list);
  }
  if (state.scene === 'town') {
    const list = [
      { id: 'home', name: 'Apt 4B', x: 90, y: 400, verb: 'Go home' },
      { id: 'cafe', name: 'Bean & Oak', x: 140, y: 120, verb: (job().game === 'cafe' && inClockWindow()) ? 'Clock in' : (state.openings?.cafe ? 'Apply' : 'Enter cafe') },
      { id: 'office', name: 'Stack & File', x: 360, y: 110, verb: (job().game === 'office' && inClockWindow()) ? 'Clock in' : (state.openings?.office ? 'Apply' : 'Enter office') },
      { id: 'clinic', name: 'Clinic', x: 580, y: 110, verb: 'See doctor' },
      { id: 'grocery', name: 'Market', x: 380, y: 270, verb: (job().game === 'market' && inClockWindow()) ? 'Clock in' : (state.openings?.market ? 'Apply' : 'Shop') },
      { id: 'petshop', name: 'Pet shop', x: 600, y: 270, verb: 'Pet shop' },
      { id: 'park', name: 'Oak Park', x: 150, y: 270, verb: 'Park' },
    ];
    if (nicoHere) list.push({ id: 'nico', name: 'Nico', x: 170, y: 250, verb: 'Talk' });
    if (haleHere) list.push({ id: 'hale', name: 'Ms. Hale', x: 120, y: 360, verb: 'Talk' });
    return addRemotes(list);
  }
  if (state.scene === 'work') {
    const list = [
      { id: 'counter', name: 'Counter', x: 300, y: 200, verb: 'Clock in' },
      { id: 'priya', name: 'Priya', x: 520, y: 160, verb: 'Talk' },
      { id: 'alex', name: 'Alex', x: 640, y: 300, verb: 'Talk' },
      { id: 'exit', name: 'Door', x: 60, y: 400, verb: 'Leave' },
    ];
    return addRemotes(list);
  }
  if (state.scene === 'office') {
    return addRemotes([
      { id: 'deskjob', name: 'Your desk', x: 280, y: 220, verb: 'Clock in' },
      { id: 'boss', name: 'Mr. Stack', x: 520, y: 140, verb: 'Talk' },
      { id: 'exit', name: 'Door', x: 60, y: 400, verb: 'Leave' },
    ]);
  }
  return addRemotes([]);
}

function nearestAction() {
  let best = null;
  let bestD = 52;
  for (const item of interactables()) {
    const d = dist(state.x, state.y, item.x, item.y);
    if (d < bestD) {
      best = item;
      bestD = d;
    }
  }
  return best;
}

function goScene(scene, x, y) {
  if (jobGame) {
    jobGame = null;
    fired('walkout');
    return;
  }
  state.scene = scene;
  state.x = x;
  state.y = y;
  if (scene !== 'work' && scene !== 'office' && state.working) {
    state.working = false;
  }
}

function shopsOpen() {
  const h = hourOf(state.minutes);
  return h >= 8 && h < 21;
}

function workOpen() {
  const h = hourOf(state.minutes);
  return h >= 8 && h < 18 && !isWeekend(state.day);
}

function doAction(id) {
  if (state.dead || menu) return;
  const h = hourOf(state.minutes);
  if (String(id).startsWith('player:')) return talkRemote(id.slice(7));

  if (id === 'bed') return sleep();
  if (id === 'shower') {
    if (state.hygiene > 92) return showToast('Already clean.');
    bump('hygiene', 38);
    bump('mood', 4);
    bump('energy', -4);
    spendTime(20);
    showToast('Hot water. You feel like a person again.');
    return;
  }
  if (id === 'fridge') return eatAtHome();
  if (id === 'desk') return openDesk();
  if (id === 'couch') {
    bump('energy', 10);
    bump('mood', state.pet ? 8 : 4);
    bump('hunger', -4);
    spendTime(40);
    state.mess = clamp(state.mess + 4, 0, 100);
    showToast(state.pet ? `${state.pet.name} curls up with you.` : 'One episode turns into three.');
    return;
  }
  if (id === 'sink') {
    bump('energy', -8);
    bump('hygiene', 6);
    state.mess = clamp(state.mess - 28, 0, 100);
    spendTime(25);
    showToast(state.mess < 20 ? 'Apartment looks decent.' : 'Still a little chaotic.');
    addRel('riley', 4);
    return;
  }
  if (id === 'door') {
    if (state.pet) state.petOut = true;
    return goScene('town', 90, 400);
  }
  if (id === 'home') {
    state.petOut = false;
    return goScene('home', 720, 400);
  }
  if (id === 'bowl') return feedPet();
  if (id === 'pet') return petPet();
  if (id === 'riley') return talkRiley();
  if (id === 'nico') return talkNico();
  if (id === 'hale') return talkHale();
  if (id === 'cafe') {
    if (job().game === 'cafe' && inClockWindow()) return tryClockIn();
    if (state.openings?.cafe && job().game !== 'cafe') return applyJob('cafe');
    if (!shopsOpen() && !workOpen()) return showToast('Cafe is closed.');
    return goScene('work', 80, 390);
  }
  if (id === 'office') {
    if (job().game === 'office' && inClockWindow()) return tryClockIn();
    if (state.openings?.office && job().game !== 'office') return applyJob('office');
    if (h < 8 || h >= 18) return showToast('Office is locked.');
    return goScene('office', 80, 390);
  }
  if (id === 'clinic') return openClinic();
  if (id === 'grocery') return groceryAction();
  if (id === 'petshop') return openPetShop();
  if (id === 'park') return parkTime();
  if (id === 'counter') return cafeAction();
  if (id === 'deskjob') return officeAction();
  if (id === 'priya') return talkPriya();
  if (id === 'alex') return talkAlex();
  if (id === 'boss') return talkBoss();
  if (id === 'exit') {
    if (state.working) return leaveWork(true);
    return goScene('town', id === 'exit' && state.scene === 'office' ? 360 : 140, 150);
  }
}

function eatAtHome() {
  if (state.food <= 0 && state.snacks <= 0) {
    showToast('Fridge is a sad light and a mustard packet.');
    return;
  }
  if (state.food > 0) {
    state.food -= 1;
    const fill = state.flags.fridgeBroke ? 24 : 42;
    bump('hunger', fill);
    bump('mood', state.flags.fridgeBroke ? -2 : 6);
    bump('health', state.flags.fridgeBroke ? 0 : 3);
    spendTime(25);
    showToast(state.flags.fridgeBroke
      ? `Warm leftovers. Fridge is still dead. ${state.food} meals left.`
      : `Leftovers. ${state.food} meals left.`);
  } else {
    state.snacks -= 1;
    bump('hunger', 18);
    bump('mood', -2);
    spendTime(10);
    showToast('Chips. You will be hungry again.');
  }
}

function sleep() {
  const h = hourOf(state.minutes);
  if (h >= 7 && h < 21) {
    showToast('Too early to crash. Maybe a nap on the couch.');
    return;
  }
  const late = h >= 1 && h < 7;
  const noise = state.flags.loudNight;
  let energy = 72;
  let mood = 8;
  if (state.hunger < 25) energy -= 18;
  if (state.hygiene < 30) energy -= 10;
  if (state.mess > 70) energy -= 8;
  if (noise) {
    energy -= 16;
    mood -= 10;
    showToast('Neighbors partied. You slept like a pretzel.');
  }
  if (late) energy -= 12;
  if (state.pet && state.pet.happy > 70) mood += 6;
  bump('energy', energy);
  bump('mood', mood);
  bump('hunger', -18);
  bump('hygiene', -12);
  bump('health', state.health < 40 ? 8 : 2);
  state.flags.loudNight = false;
  if (multiplayerRole === 'guest') {
    showToast('You rest. Clock still follows the host.');
    return;
  }
  const pastMidnight = hourOf(state.minutes) < 7;
  if (pastMidnight) {
    state.minutes = 7 * 60 + Math.floor(rand(0, 25));
    state.workedToday = false;
    state.calledSick = false;
    state.working = false;
    state.shift = 'none';
    state.morningDone = false;
    state.afternoonDone = false;
  } else {
    newDay(true);
  }
}

function newDay(fromSleep) {
  if (fromSleep) {
    state.minutes = 7 * 60 + Math.floor(rand(0, 25));
    state.day += 1;
  }
  state.workedToday = false;
  state.calledSick = false;
  state.working = false;
  state.shift = 'none';
  state.morningDone = false;
  state.afternoonDone = false;
  jobGame = null;
  workServed = 0;
  workTips = 0;
  customers = [];
  if (fromSleep || state.day > 1) rollOpenings();
  state.mess = clamp(state.mess + 6, 0, 100);
  if (state.pet) {
    state.pet.hunger = clamp(state.pet.hunger - 22, 0, 100);
    state.pet.happy = clamp(state.pet.happy - 12, 0, 100);
    state.pet.clean = clamp(state.pet.clean - 10, 0, 100);
    if (state.pet.hunger < 18 || state.pet.happy < 15) state.petSick = true;
  }

  const d = weekday(state.day);
  if (d === 0) {
    if (!state.rentPaid) {
      state.rentLate += 1;
      showToast('Rent was late. Ms. Hale added a $25 fee.');
      addRel('hale', -12);
      if (state.rentLate >= 2) return evict();
    }
    if (!state.utilPaid) {
      state.utilLate += 1;
      showToast('Power company is side-eyeing you.');
      if (state.utilLate >= 3) {
        bump('mood', -20);
        bump('hygiene', -10);
        showToast('Lights flicker. Pay utilities.');
      }
    }
    state.rentPaid = false;
    state.utilPaid = false;
    state.sickUsed = false;
  }

  if (d === 5) showToast('Rent is due tomorrow. Desk in the living room.');
  if (d === 6) showToast('Sunday. Rent and utilities are due today.');

  if (!isWeekend(state.day) && state.jobId !== 'none' && !state.workedToday) {
    // miss is checked later in the morning
  }

  if (state.day === 28 && !state.monthNote) {
    state.monthNote = true;
    openEvent({
      title: 'A month on Oak Street',
      body: 'You kept the lights on, more or less. Nobody throws a parade, but Riley leaves sticky notes that say “still proud.” Keep going.',
      choices: [{ label: 'Keep living', run: () => {} }],
    });
  }

  if (state.day !== state.eventDay && Math.random() < 0.62) {
    state.eventDay = state.day;
    queueLifeProblem();
  } else if (state.day === 1 && !state.flags.intro) {
    state.flags.intro = true;
  }

  save();
}

function rentOwed() {
  return 140 + (state.rentLate ? 25 : 0);
}

function utilOwed() {
  return 35 + (state.utilLate ? 10 : 0);
}

function evict() {
  state.dead = true;
  openMenu('end', `
    <h2>Evicted</h2>
    <p>Ms. Hale changes the locks on day ${state.day}.</p>
    <p class="muted">You had $${state.money}. Rent was ${state.rentLate} cycles late. Riley texts “crash on my cousin’s floor?” but the week is over.</p>
    <div class="menu-actions">
      <button type="button" data-act="restart">Try another week</button>
      <button type="button" class="ghost" data-act="hub">Back to games</button>
    </div>
  `);
  localStorage.removeItem(SAVE_KEY);
}

function collapse() {
  state.dead = false;
  state.health = 35;
  state.energy = 30;
  state.scene = 'town';
  state.x = 580;
  state.y = 150;
  state.working = false;
  const bill = 45;
  state.money = Math.max(0, state.money - bill);
  bump('mood', -18);
  showToast(`You faint. Clinic bill $${bill}.`);
  openEvent({
    title: 'Clinic',
    body: `Dr. Moss catches you before the sidewalk does. Rest, eat, and stop treating sleep like a rumor. You were charged $${bill}.`,
    choices: [{ label: 'I will try', run: () => { addRel('moss', 6); } }],
  });
}

function openDesk() {
  const j = job();
  const sickBtn = !state.sickUsed && !isWeekend(state.day) && !state.workedToday
    ? `<button type="button" data-act="sick">Call in sick</button>`
    : '';
  openMenu('desk', `
    <h2>Desk</h2>
    <p class="muted">Laptop, bills, and a cracked phone.</p>
    <div class="row"><span>Rent ${state.rentPaid ? 'PAID' : 'DUE Sun'}</span><span>$${rentOwed()}</span></div>
    <div class="row"><span>Utilities ${state.utilPaid ? 'PAID' : 'DUE Sun'}</span><span>$${utilOwed()}</span></div>
    <div class="row"><span>Job</span><span>${esc(j.title)} · $${j.wage}/hr</span></div>
    <div class="row"><span>Shift</span><span>9:00 · lunch 12 · back 1:00</span></div>
    ${openingsList().length
      ? openingsList().map((n) => `<div class="row"><span class="warn">HIRING</span><span>${esc(n)}</span></div>`).join('')
      : '<p class="muted">No job openings on the board today.</p>'}
    <div class="row"><span>Good days</span><span>${state.goodDays}</span></div>
    <div class="menu-actions">
      <button type="button" data-act="pay-rent">Pay rent $${rentOwed()}</button>
      <button type="button" data-act="pay-util">Pay utilities $${utilOwed()}</button>
      ${sickBtn}
      <button type="button" class="ghost" data-act="close">Get up</button>
    </div>
  `);
}

function payRent() {
  if (state.rentPaid) return showToast('Rent is already paid this week.');
  if (!trySpend(rentOwed(), 'rent')) return;
  state.rentPaid = true;
  state.rentLate = 0;
  addRel('hale', 8);
  bump('mood', 6);
  showToast('Rent sent. You may keep the roof.');
  closeMenu();
}

function payUtil() {
  if (state.utilPaid) return showToast('Utilities already paid.');
  if (!trySpend(utilOwed(), 'utilities')) return;
  state.utilPaid = true;
  state.utilLate = 0;
  bump('mood', 3);
  showToast('Lights, water, wifi: still a trio.');
  closeMenu();
}

function callSick() {
  if (state.sickUsed) return showToast('You already used your sick day.');
  if (state.jobId === 'none') return showToast('No job to call.');
  state.calledSick = true;
  state.sickUsed = true;
  state.workedToday = true;
  state.morningDone = true;
  state.afternoonDone = true;
  addRel('priya', state.health < 55 ? 2 : -6);
  spendTime(10);
  closeMenu();
  showToast('You text Priya. The shift is covered. No pay today.');
}

function openingsList() {
  const rows = [];
  if (state.openings?.cafe) rows.push('Bean & Oak — Barista $11/hr');
  if (state.openings?.office) rows.push('Stack & File — Clerk $17/hr');
  if (state.openings?.market) rows.push('Corner Market — Cashier $12/hr');
  return rows;
}

function rollOpenings() {
  const unemployed = state.jobId === 'none';
  const next = {
    cafe: Math.random() < (unemployed ? 0.58 : 0.22),
    office: Math.random() < (unemployed ? 0.42 : 0.18),
    market: Math.random() < (unemployed ? 0.5 : 0.2),
  };
  if (state.jobId === 'barista' || state.jobId === 'lead') next.cafe = false;
  if (state.jobId === 'clerk') next.office = false;
  if (state.jobId === 'cashier') next.market = false;
  state.openings = next;
  const names = openingsList();
  if (names.length) showToast(`Help wanted: ${names.map((n) => n.split(' — ')[0]).join(', ')}`);
}

function hire(jobId) {
  state.jobId = jobId;
  state.misses = 0;
  state.goodDays = 0;
  state.shift = 'none';
  state.morningDone = false;
  state.afternoonDone = false;
  if (jobId === 'barista' || jobId === 'lead') state.openings.cafe = false;
  if (jobId === 'clerk') state.openings.office = false;
  if (jobId === 'cashier') state.openings.market = false;
  bump('mood', 10);
}

function cafeAction() {
  const j = job();
  if (j.game === 'cafe') return tryClockIn();
  if (state.jobId === 'none' && state.openings?.cafe) return applyJob('cafe');
  if (state.openings?.cafe && j.game !== 'cafe') return applyJob('cafe');
  if (!trySpend(4, 'coffee')) return;
  bump('energy', 14);
  bump('hunger', -2);
  bump('mood', 3);
  spendTime(15);
  showToast('Iced something. Heart says go, stomach says maybe.');
}

function officeAction() {
  const j = job();
  if (j.game === 'office') return tryClockIn();
  if (state.openings?.office) return applyJob('office');
  showToast('Reception: “We are not hiring today. Check the desk listings.”');
}

function groceryAction() {
  const j = job();
  if (j.game === 'market' && inClockWindow()) return tryClockIn();
  if (state.openings?.market && j.game !== 'market') return applyJob('market');
  return openGrocery();
}

function applyJob(place) {
  const ads = {
    cafe: {
      id: 'barista',
      title: 'Help wanted: Barista',
      body: 'Priya: “9:00 sharp. Morning rush, lunch at noon, back at 1:00. Late is fired. Can you press buttons like you mean it?” $11 an hour.',
    },
    office: {
      id: 'clerk',
      title: 'Help wanted: Clerk',
      body: 'Mr. Stack: “File the papers. Do not file the plant. 9 to 12, lunch, 1 to 5. Late means the sidewalk.” $17 an hour.',
    },
    market: {
      id: 'cashier',
      title: 'Help wanted: Cashier',
      body: 'The market wants hands that can bag fruit before it bruises. Same hours: 9, lunch, 1. Late is fired. $12 an hour.',
    },
  };
  const ad = ads[place];
  if (!ad) return;
  openEvent({
    title: ad.title,
    body: ad.body,
    choices: [
      {
        label: 'Take the job',
        run: () => {
          hire(ad.id);
          showToast(`Hired at ${JOBS[ad.id].place}. Do not be late.`);
        },
      },
      { label: 'Keep walking', run: () => {} },
    ],
  });
}

function inClockWindow() {
  const mins = state.minutes;
  const morning = !state.morningDone && mins >= 8 * 60 + 40 && mins <= 9 * 60 + 10;
  const afternoon = state.morningDone && !state.afternoonDone && mins >= 12 * 60 + 45 && mins <= 13 * 60 + 10;
  return morning || afternoon;
}

function tryClockIn() {
  const j = job();
  if (j.id === 'none') return showToast('You do not work here.');
  if (isWeekend(state.day)) return showToast('Weekend. The time clock is napping.');
  if (jobGame) return;
  if (state.calledSick) return showToast('You already called in sick.');
  if (state.afternoonDone) return showToast('You already finished both shifts.');
  const mins = state.minutes;

  if (!state.morningDone) {
    if (mins < 8 * 60 + 40) return showToast('Too early. Clock in at 9:00.');
    if (mins > 9 * 60 + 10) return fired('late');
    startShiftGame('morning');
    return;
  }

  if (state.morningDone && !state.afternoonDone) {
    if (mins < 12 * 60 + 45) return showToast('Lunch until 1:00. Eat, then come back.');
    if (mins > 13 * 60 + 10) return fired('late');
    startShiftGame('afternoon');
    return;
  }
}

function startShiftGame(part) {
  const j = job();
  jobGame = {
    part,
    kind: j.game,
    score: 0,
    combo: 0,
    misses: 0,
    served: 0,
    tips: 0,
    time: 44,
    input: [],
    order: null,
    papers: [],
    spawn: 0.2,
    flash: part === 'morning' ? 'MORNING RUSH' : 'AFTERNOON SHIFT',
    flashT: 1.1,
  };
  state.working = true;
  state.shift = part;
  if (j.scene && j.game !== 'market') {
    state.scene = j.scene;
    state.x = j.game === 'office' ? 280 : 300;
    state.y = 260;
  }
  if (j.game === 'cafe') nextCafeOrder();
  showToast(part === 'morning' ? 'Morning rush! Work until lunch.' : 'Afternoon shift. Work until 5.');
}

function nextCafeOrder() {
  if (!jobGame) return;
  const n = 2 + Math.min(2, Math.floor(jobGame.combo / 5));
  const recipe = [];
  for (let i = 0; i < n; i++) recipe.push(pick(CAFE_KEYS));
  jobGame.order = {
    recipe,
    t: clamp(7.2 - jobGame.combo * 0.12, 4.2, 7.2),
    max: 7.2,
    name: pick(['Nico', 'Alex', 'Tourist', 'Kid', 'Ms. Hale', 'Riley']),
  };
  jobGame.input = [];
}

function handleWorkKey(k) {
  if (!jobGame) return false;
  const map = { a: 'a', s: 's', d: 'd', f: 'f', 1: 'a', 2: 's', 3: 'd', 4: 'f' };
  const key = map[k];
  if (!key) return true;
  if (jobGame.kind === 'cafe') {
    const next = jobGame.order?.recipe[jobGame.input.length];
    if (!next) return true;
    if (next.key === key) {
      jobGame.input.push(next);
      if (jobGame.input.length >= jobGame.order.recipe.length) {
        jobGame.served += 1;
        jobGame.combo += 1;
        jobGame.score += 1 + Math.floor(jobGame.combo / 3);
        if (Math.random() < 0.4) jobGame.tips += 1 + Math.floor(jobGame.combo / 5);
        jobGame.flash = pick(['NICE', 'ORDER UP', 'TIP!', 'YES']);
        jobGame.flashT = 0.45;
        nextCafeOrder();
      }
    } else {
      jobGame.combo = 0;
      jobGame.misses += 1;
      jobGame.flash = 'WRONG';
      jobGame.flashT = 0.45;
      nextCafeOrder();
    }
    return true;
  }

  const table = jobGame.kind === 'office' ? OFFICE_KEYS : MARKET_KEYS;
  const falling = jobGame.papers[0];
  if (!falling) return true;
  if (falling.key === key) {
    jobGame.papers.shift();
    jobGame.served += 1;
    jobGame.combo += 1;
    jobGame.score += 1 + Math.floor(jobGame.combo / 4);
    jobGame.flash = 'FILED';
    jobGame.flashT = 0.3;
  } else {
    jobGame.papers.shift();
    jobGame.combo = 0;
    jobGame.misses += 1;
    jobGame.flash = 'NOPE';
    jobGame.flashT = 0.35;
  }
  return true;
}

function updateJobGame(dt) {
  if (!jobGame || menu) return;
  jobGame.time -= dt;
  if (jobGame.flashT > 0) jobGame.flashT -= dt;
  if (jobGame.kind === 'cafe' && jobGame.order) {
    jobGame.order.t -= dt;
    if (jobGame.order.t <= 0) {
      jobGame.combo = 0;
      jobGame.misses += 1;
      jobGame.flash = 'TOO SLOW';
      jobGame.flashT = 0.4;
      nextCafeOrder();
    }
  } else {
    jobGame.spawn -= dt;
    if (jobGame.spawn <= 0) {
      const table = jobGame.kind === 'office' ? OFFICE_KEYS : MARKET_KEYS;
      const item = pick(table);
      jobGame.papers.push({
        ...item,
        x: rand(220, 560),
        y: 70,
        v: 90 + jobGame.combo * 8 + jobGame.served * 2,
      });
      jobGame.spawn = clamp(1.05 - jobGame.served * 0.03, 0.45, 1.05);
    }
    for (const p of jobGame.papers) p.y += p.v * dt;
    while (jobGame.papers.length && jobGame.papers[0].y > 390) {
      jobGame.papers.shift();
      jobGame.combo = 0;
      jobGame.misses += 1;
    }
  }
  if (jobGame.time <= 0) {
    endShiftGame(jobGame.part === 'morning' ? 'lunch' : 'done');
  }
}

function endShiftGame(reason) {
  const g = jobGame;
  const j = job();
  jobGame = null;
  state.working = false;
  const tips = g?.tips || 0;
  const served = g?.served || 0;
  if (reason === 'lunch') {
    state.morningDone = true;
    state.shift = 'lunch';
    state.minutes = 12 * 60;
    const pay = Math.floor(j.wage * 3 + tips);
    state.money += pay;
    bump('hunger', -16);
    bump('energy', -18);
    bump('hygiene', -6);
    openEvent({
      title: 'Lunch',
      body: `You served ${served}. Morning pay $${pay}. Eat and be back by 1:00. Late means fired.`,
      choices: [{
        label: 'Go eat',
        run: () => {
          if (state.scene === 'work' || state.scene === 'office') {
            state.scene = 'town';
            state.x = j.game === 'office' ? 360 : j.game === 'market' ? 380 : 140;
            state.y = 150;
          }
        },
      }],
    });
    return;
  }
  state.afternoonDone = true;
  state.workedToday = true;
  state.shift = 'none';
  state.minutes = 17 * 60;
  const pay = Math.floor(j.wage * 4 + tips);
  state.money += pay;
  bump('hunger', -12);
  bump('energy', -14);
  bump('hygiene', -6);
  if (served >= 10 && g.misses < 6) {
    state.goodDays += 1;
    addRel('priya', 6);
  }
  if (j.id === 'barista' && state.goodDays >= 5 && !state.flags.promoted) {
    state.flags.promoted = true;
    state.jobId = 'lead';
    openEvent({
      title: 'Promotion',
      body: `Afternoon pay $${pay}. Priya slides you a Shift Lead tag. $15 an hour. Still do not be late.`,
      choices: [{ label: 'I will not cry into the steamed milk', run: () => bump('mood', 16) }],
    });
  } else {
    showToast(`Clocked out. Afternoon pay $${pay}. Served ${served}.`);
  }
  if (state.scene === 'work' || state.scene === 'office') {
    state.scene = 'town';
    state.x = j.game === 'office' ? 360 : 140;
    state.y = 150;
  }
}

function fired(why = 'late') {
  jobGame = null;
  const place = job().place;
  state.jobId = 'none';
  state.working = false;
  state.shift = 'none';
  state.misses = 0;
  state.goodDays = 0;
  bump('mood', -24);
  const lines = {
    late: `Too late. ${place} already gave your shift to someone with a watch.`,
    noshow: `You no-showed. ${place} shredded the nametag.`,
    walkout: `You walked out mid-shift. That was the whole interview.`,
  };
  if (state.scene !== 'town') {
    state.scene = 'town';
    state.x = 140;
    state.y = 150;
  }
  openEvent({
    title: 'You are fired',
    body: `${lines[why] || lines.late} Watch the help-wanted signs. Do not be late next time.`,
    choices: [{ label: 'Update the notes app', run: () => rollOpenings() }],
  });
}

function drawJobGame() {
  const g = jobGame;
  if (!g) return;
  const j = job();
  drawRect(0, 0, W, H, '#1a140c');
  drawRect(40, 24, 720, 432, '#fff6d8');
  drawRect(40, 24, 720, 8, '#c47838');
  drawRect(40, 448, 720, 8, '#c47838');
  ctx.fillStyle = '#c04028';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(g.part === 'morning' ? 'MORNING SHIFT' : 'AFTERNOON SHIFT', 400, 54);
  ctx.fillStyle = '#402010';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText(j.place, 400, 74);
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${g.score}`, 64, 100);
  ctx.fillText(`COMBO ${g.combo}`, 250, 100);
  ctx.fillText(`SERVED ${g.served}`, 430, 100);
  ctx.fillStyle = '#c47838';
  ctx.fillText(`${Math.ceil(g.time)}s`, 640, 100);
  drawRect(64, 110, 672, 10, '#5a3a18');
  drawRect(66, 112, (668 * g.time) / 44, 6, '#3d9e4a');

  if (g.kind === 'cafe' && g.order) {
    ctx.fillStyle = '#402010';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${g.order.name} wants`, 400, 150);
    g.order.recipe.forEach((step, i) => {
      const x = 220 + i * 90;
      const on = i < g.input.length;
      drawRect(x, 170, 70, 70, on ? '#3d9e4a' : step.color);
      ctx.strokeStyle = '#201810';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, 170, 70, 70);
      ctx.fillStyle = '#fff6d8';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(step.label, x + 35, 210);
    });
    drawRect(220, 258, 360, 12, '#5a3a18');
    drawRect(222, 260, 356 * clamp(g.order.t / g.order.max, 0, 1), 8, '#e07040');
    ctx.fillStyle = '#402010';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('A brew  S milk  D pour  F lid', 400, 300);
    CAFE_KEYS.forEach((step, i) => {
      const x = 90 + i * 160;
      drawRect(x, 330, 130, 90, step.color);
      ctx.strokeStyle = '#201810';
      ctx.strokeRect(x, 330, 130, 90);
      ctx.fillStyle = '#fff6d8';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(step.key.toUpperCase(), x + 65, 372);
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText(step.label, x + 65, 396);
    });
    ctx.textAlign = 'left';
  } else {
    const table = g.kind === 'office' ? OFFICE_KEYS : MARKET_KEYS;
    ctx.fillStyle = '#402010';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(g.kind === 'office' ? 'Sort the papers before they hit the floor' : 'Bag the groceries', 400, 140);
    for (const p of g.papers) {
      drawRect(p.x - 40, p.y, 80, 36, p.color);
      ctx.strokeStyle = '#201810';
      ctx.strokeRect(p.x - 40, p.y, 80, 36);
      ctx.fillStyle = '#fff6d8';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(p.label, p.x, p.y + 24);
    }
    table.forEach((bin, i) => {
      const x = 120 + i * 200;
      drawRect(x, 360, 160, 70, bin.color);
      ctx.strokeStyle = '#201810';
      ctx.strokeRect(x, 360, 160, 70);
      ctx.fillStyle = '#fff6d8';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(bin.key.toUpperCase(), x + 80, 392);
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText(bin.label, x + 80, 414);
    });
    ctx.textAlign = 'left';
  }
  if (g.flashT > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = g.flash === 'WRONG' || g.flash === 'TOO SLOW' || g.flash === 'NOPE' ? '#c04028' : '#3d9e4a';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(g.flash, 400, 130);
    ctx.textAlign = 'left';
  }
}

function leaveWork(early) {
  if (jobGame) {
    jobGame = null;
    fired('walkout');
    return;
  }
  state.working = false;
  const j = job();
  goScene('town', j.scene === 'office' ? 360 : 140, 150);
}

function openGrocery() {
  if (!shopsOpen()) return showToast('Market is closed.');
  openMenu('shop', `
    <h2>Corner Market</h2>
    <p class="muted">Meals in the fridge beat sad chips at 1 AM.</p>
    <div class="choice-list">
      <button type="button" data-act="buy" data-arg="food">Groceries $16 — 3 meals (have ${state.food})</button>
      <button type="button" data-act="buy" data-arg="snacks">Snacks $7 — 2 snacks (have ${state.snacks})</button>
      <button type="button" data-act="buy" data-arg="petfood">Pet food $12 — 5 scoops (have ${state.petFood})</button>
      <button type="button" class="ghost" data-act="close">Leave</button>
    </div>
  `);
}

function openPetShop() {
  if (!shopsOpen()) return showToast('Pet shop is closed.');
  const adopt = state.pet ? `<p class="muted">You already have ${esc(state.pet.name)} the ${state.pet.kind}.</p>` : `
    <button type="button" data-act="adopt" data-arg="cat">Adopt cat $65</button>
    <button type="button" data-act="adopt" data-arg="dog">Adopt dog $80</button>
    <button type="button" data-act="adopt" data-arg="bird">Adopt bird $45</button>
  `;
  openMenu('shop', `
    <h2>Whisker Window</h2>
    <p class="muted">Someone in a hoodie is napping in a sunbeam. Relatable.</p>
    <div class="choice-list">
      ${adopt}
      <button type="button" data-act="buy" data-arg="toy">Toy $15 — pet mood</button>
      <button type="button" class="ghost" data-act="close">Leave</button>
    </div>
  `);
}

function openClinic() {
  if (hourOf(state.minutes) < 8 || hourOf(state.minutes) >= 19) return showToast('Clinic is closed.');
  openMenu('shop', `
    <h2>Oak Clinic</h2>
    <p class="muted">Dr. Moss has stickers and strong opinions about sleep.</p>
    <div class="choice-list">
      <button type="button" data-act="heal">Checkup $40 — restore health</button>
      <button type="button" data-act="vet"${state.pet ? '' : ' disabled'}>Vet $50 — help ${state.pet ? esc(state.pet.name) : 'a pet'}</button>
      <button type="button" class="ghost" data-act="close">Leave</button>
    </div>
  `);
}

function adoptPet(kind) {
  const info = PETS[kind];
  if (state.pet) return showToast('One creature is already judging you.');
  if (!trySpend(info.price, info.label)) return;
  const names = {
    cat: ['Miso', 'Piper', 'Bean', 'Noodle'],
    dog: ['Toast', 'Maple', 'Gus', 'Pebble'],
    bird: ['Kiwi', 'Pip', 'Mango', 'Echo'],
  };
  state.pet = {
    kind,
    name: pick(names[kind]),
    hunger: 70,
    happy: 70,
    clean: 70,
    x: 220,
    y: 340,
  };
  state.petFood += 2;
  bump('mood', 18);
  addRel('riley', 6);
  closeMenu();
  showToast(`${state.pet.name} the ${kind} comes home. Do not forget food.`);
}

function feedPet() {
  if (!state.pet) return;
  if (state.petFood <= 0) return showToast('No pet food. Market is on the street.');
  state.petFood -= 1;
  state.pet.hunger = clamp(state.pet.hunger + 40, 0, 100);
  state.pet.happy = clamp(state.pet.happy + 8, 0, 100);
  bump('mood', 4);
  spendTime(10);
  showToast(`${state.pet.name} eats like rent is imaginary.`);
}

function petPet() {
  if (!state.pet) return;
  state.pet.happy = clamp(state.pet.happy + 12, 0, 100);
  bump('mood', 8);
  bump('energy', -2);
  spendTime(10);
  showToast(pick([
    `${state.pet.name} does a little loaf.`,
    `You both ignore your problems for one minute.`,
    `${state.pet.name} believes in you. Unclear why.`,
  ]));
}

function parkTime() {
  const withPet = state.pet && (state.petOut || state.scene === 'town');
  if (state.pet && !state.petOut && dist(state.x, state.y, 150, 270) < 70) {
    state.petOut = true;
  }
  bump('mood', 8);
  bump('energy', -6);
  bump('hygiene', -3);
  if (state.pet && (state.petOut || withPet)) {
    state.pet.happy = clamp(state.pet.happy + 22, 0, 100);
    state.pet.clean = clamp(state.pet.clean - 6, 0, 100);
    bump('mood', 6);
    showToast(`Park air. ${state.pet.name} writes a poem with their feet.`);
  } else {
    showToast('You sit on the slightly damp bench of peace.');
  }
  spendTime(35);
  if (nicoHere) addRel('nico', 3);
}

function talkRiley() {
  const lines = [];
  if (state.mess > 65) lines.push('Riley: “The dishes are forming a union.”');
  if (state.pet && state.pet.hunger < 30) lines.push(`Riley: “${state.pet.name} just stared into my soul. Feed them.”`);
  if (!state.rentPaid && weekday(state.day) >= 5) lines.push('Riley: “Please do not make me explain Ms. Hale again.”');
  if (state.jobId === 'none') lines.push('Riley: “Unemployed looks good on nobody. Cafe is hiring. Again.”');
  if (!lines.length) lines.push(pick([
    'Riley: “I saved you the good mug. The one that is not chipped. As much.”',
    'Riley: “If we order pizza I will do half the dishes. Emotionally.”',
    'Riley: “You live here. I live here. The crumbs also live here.”',
  ]));
  openEvent({
    title: 'Riley',
    body: `${lines[0]} Relationship ${Math.round(state.people.riley)}.`,
    choices: [
      {
        label: 'Chat ($0, +mood)',
        run: () => {
          bump('mood', 8);
          addRel('riley', 5);
          spendTime(20);
        },
      },
      {
        label: 'Order pizza $22',
        run: () => {
          if (!trySpend(22, 'pizza')) return;
          bump('hunger', 30);
          bump('mood', 12);
          addRel('riley', 10);
          spendTime(50);
          showToast('Pizza. You are a household.');
        },
      },
      {
        label: state.people.riley >= 70 && !state.rentPaid ? 'Ask Riley to cover $40 of rent' : 'Back to the mess',
        run: () => {
          if (state.people.riley >= 70 && !state.rentPaid) {
            state.money += 40;
            addRel('riley', -8);
            bump('mood', -4);
            showToast('Riley Venmos $40. “This is not a lifestyle.”');
          }
        },
      },
    ],
  });
}

function talkNico() {
  openEvent({
    title: 'Nico',
    body: pick([
      'Nico: “The park ducks have a union now. I respect it.”',
      'Nico: “Want to be a person with me for twenty minutes?”',
      'Nico: “If you skip work I will pretend I did not see you.”',
    ]) + ` Friendship ${Math.round(state.people.nico)}.`,
    choices: [
      {
        label: 'Hang out $0',
        run: () => {
          bump('mood', 10);
          addRel('nico', 8);
          spendTime(30);
        },
      },
      {
        label: 'Get fries $12',
        run: () => {
          if (!trySpend(12, 'fries')) return;
          bump('hunger', 16);
          bump('mood', 14);
          addRel('nico', 10);
          spendTime(40);
        },
      },
      { label: 'Wave and keep walking', run: () => addRel('nico', -1) },
    ],
  });
}

function talkHale() {
  openEvent({
    title: 'Ms. Hale',
    body: state.rentPaid
      ? 'Ms. Hale: “Paid. I almost smiled. Do not get used to it.”'
      : `Ms. Hale: “Rent is $${rentOwed()}. The building has standards. Some of them are financial.”`,
    choices: [
      {
        label: state.rentPaid ? 'Nod professionally' : `Pay rent now $${rentOwed()}`,
        run: () => {
          if (!state.rentPaid) payRent();
          else addRel('hale', 2);
        },
      },
      { label: 'Escape', run: () => addRel('hale', -1) },
    ],
  });
}

function talkPriya() {
  openEvent({
    title: 'Priya',
    body: pick([
      'Priya: “If the machine screams, you screamed first.”',
      'Priya: “Customers can smell fear and decaf.”',
      'Priya: “Show up. Wash hands. Do not invent seasonal drinks.”',
    ]) + ` Boss meter ${Math.round(state.people.priya)}.`,
    choices: [
      { label: 'Yes chef', run: () => { addRel('priya', 4); bump('mood', -2); spendTime(8); } },
      { label: 'Ask about hours', run: () => showToast('Weekdays 9 to 5. Late is a personality I do not fund.') },
    ],
  });
}

function talkAlex() {
  openEvent({
    title: 'Alex',
    body: 'Alex: “If Priya asks, I have been steaming milk this whole time. Emotionally.”',
    choices: [
      { label: 'Cover for each other', run: () => { addRel('alex', 8); bump('mood', 6); spendTime(10); } },
      { label: 'Back to the line', run: () => {} },
    ],
  });
}

function talkBoss() {
  openEvent({
    title: 'Mr. Stack',
    body: 'Mr. Stack: “The printer jams because it can feel doubt.”',
    choices: [
      { label: 'I will not doubt the printer', run: () => bump('mood', -2) },
      { label: 'Ask about the clerk job', run: () => applyOffice() },
    ],
  });
}

function queueLifeProblem() {
  const pool = [];
  pool.push('cold', 'dishes', 'nico_invite', 'leaky', 'loud', 'found', 'ticket', 'family');
  if (state.pet) pool.push('pet_sock', 'pet_lonely', 'vet_scare');
  if (!state.flags.fridgeBroke) pool.push('fridge');
  if (state.jobId !== 'none') pool.push('overtime', 'cowork');
  if (state.mess > 50) pool.push('inspection');
  if (state.money < 40) pool.push('broke');
  runEvent(pick(pool));
}

function runEvent(id) {
  const events = {
    fridge: {
      title: 'The fridge dies',
      body: 'It hums one last hymn and becomes a cabinet. Repair is $55. Ignore it and food spoils faster.',
      choices: [
        {
          label: 'Repair $55',
          run: () => {
            if (!trySpend(55, 'repair')) {
              state.flags.fridgeBroke = true;
              return;
            }
            state.flags.fridgeBroke = false;
            bump('mood', 4);
          },
        },
        {
          label: 'Ignore it',
          run: () => {
            state.flags.fridgeBroke = true;
            state.food = Math.max(0, state.food - 1);
            bump('mood', -8);
            showToast('Milk becomes a science project.');
          },
        },
      ],
    },
    cold: {
      title: 'You woke up wrong',
      body: 'Throat like sandpaper. Work will notice. Sleep and soup help. Pride does not.',
      choices: [
        {
          label: 'Stay home and stew',
          run: () => {
            bump('health', 12);
            bump('energy', 8);
            bump('mood', -4);
            if (!state.sickUsed && state.jobId !== 'none' && !isWeekend(state.day)) callSick();
            spendTime(90);
          },
        },
        {
          label: 'Power through',
          run: () => {
            bump('health', -16);
            bump('mood', -6);
            showToast('You packed a cough and a dream.');
          },
        },
      ],
    },
    dishes: {
      title: 'Roommate summit',
      body: 'Riley points at the sink with their whole soul. The dishes have a skyline now.',
      choices: [
        {
          label: 'Clean (energy -12)',
          run: () => {
            bump('energy', -12);
            state.mess = clamp(state.mess - 40, 0, 100);
            addRel('riley', 10);
            spendTime(30);
          },
        },
        {
          label: 'Argue',
          run: () => {
            addRel('riley', -12);
            bump('mood', -10);
            state.mess = clamp(state.mess + 8, 0, 100);
          },
        },
      ],
    },
    nico_invite: {
      title: 'Nico texts',
      body: '“Fries and complaining. $18. I will listen to the job saga. Again.”',
      choices: [
        {
          label: 'Go $18',
          run: () => {
            if (!trySpend(18, 'night out')) return;
            bump('mood', 18);
            bump('energy', -10);
            bump('hunger', 12);
            addRel('nico', 12);
            spendTime(80);
            if (hourOf(state.minutes) < 20) state.minutes = 20 * 60;
          },
        },
        { label: 'Not tonight', run: () => { addRel('nico', -4); bump('mood', -4); } },
      ],
    },
    leaky: {
      title: 'Sink is jazz now',
      body: 'Drip. Drip. Drip. A plumber wants $30. A bucket wants your last nerve.',
      choices: [
        {
          label: 'Fix $30',
          run: () => {
            if (!trySpend(30, 'plumber')) return;
            bump('mood', 6);
            state.mess = clamp(state.mess - 8, 0, 100);
          },
        },
        {
          label: 'Bucket life',
          run: () => {
            bump('mood', -8);
            state.mess = clamp(state.mess + 12, 0, 100);
          },
        },
      ],
    },
    loud: {
      title: '4C throws a rager',
      body: 'Bass in the walls. Sleep will be a rumor unless you join them or buy earplugs.',
      choices: [
        {
          label: 'Earplugs $8',
          run: () => {
            if (!trySpend(8, 'earplugs')) {
              state.flags.loudNight = true;
              return;
            }
            bump('mood', 2);
          },
        },
        {
          label: 'Join for $10',
          run: () => {
            if (!trySpend(10, 'party')) return;
            bump('mood', 14);
            bump('energy', -16);
            bump('hygiene', -8);
            state.minutes = Math.max(state.minutes, 23 * 60);
          },
        },
        { label: 'Suffer', run: () => { state.flags.loudNight = true; bump('mood', -6); } },
      ],
    },
    found: {
      title: 'Coat lottery',
      body: 'Last winter’s jacket had $16 and a grocery list that says “be better.”',
      choices: [{ label: 'Pocket it', run: () => { state.money += 16; bump('mood', 8); } }],
    },
    ticket: {
      title: 'The city noticed you',
      body: 'A parking ticket on a car you do not even own. Your name is on it anyway. $28.',
      choices: [
        { label: 'Pay $28', run: () => { if (!trySpend(28, 'ticket')) bump('mood', -8); } },
        { label: 'Ignore (mood -12 later)', run: () => { bump('mood', -12); addRel('hale', -4); } },
      ],
    },
    family: {
      title: 'Care package',
      body: 'Someone who still believes in you mailed snacks and $40. There is a note: eat a vegetable.',
      choices: [{
        label: 'Thank the void',
        run: () => {
          state.money += 40;
          state.food += 2;
          bump('mood', 12);
        },
      }],
    },
    pet_sock: {
      title: `${state.pet ? state.pet.name : 'Pet'} vs sock`,
      body: 'The sock lost. The pet looks proud. Dr. Moss would like $40 to confirm the sock is not a new organ.',
      choices: [
        {
          label: 'Vet $40',
          run: () => {
            if (!trySpend(40, 'vet')) {
              state.petSick = true;
              return;
            }
            state.petSick = false;
            if (state.pet) state.pet.happy = clamp(state.pet.happy + 10, 0, 100);
            addRel('moss', 6);
          },
        },
        {
          label: 'Wait and hope',
          run: () => {
            state.petSick = true;
            bump('mood', -10);
          },
        },
      ],
    },
    pet_lonely: {
      title: 'Guilty eyes',
      body: `${state.pet ? state.pet.name : 'Your pet'} waited by the door like a tiny landlord of feelings.`,
      choices: [
        {
          label: 'Play right now',
          run: () => {
            if (state.pet) state.pet.happy = clamp(state.pet.happy + 24, 0, 100);
            bump('mood', 8);
            bump('energy', -8);
            spendTime(30);
            state.scene = 'home';
            state.x = 220;
            state.y = 340;
          },
        },
        { label: 'Tomorrow, definitely', run: () => { if (state.pet) state.pet.happy = clamp(state.pet.happy - 16, 0, 100); bump('mood', -8); } },
      ],
    },
    vet_scare: {
      title: 'Off their food',
      body: 'Not dramatic. Just wrong. Clinic or a worried night.',
      choices: [
        {
          label: 'Clinic $50',
          run: () => {
            if (!trySpend(50, 'vet')) {
              state.petSick = true;
              return;
            }
            state.petSick = false;
            if (state.pet) {
              state.pet.hunger = 80;
              state.pet.happy = clamp(state.pet.happy + 8, 0, 100);
            }
          },
        },
        { label: 'Watch them', run: () => { state.petSick = true; bump('mood', -6); } },
      ],
    },
    overtime: {
      title: 'Priya: stay late?',
      body: 'A bus of tourists found the espresso machine. Extra $32 if you stay. Energy will file a complaint.',
      choices: [
        {
          label: 'Stay',
          run: () => {
            state.money += 32;
            bump('energy', -22);
            bump('mood', -6);
            addRel('priya', 8);
            spendTime(90);
            showToast('You smell like beans and victory.');
          },
        },
        { label: 'Go home', run: () => addRel('priya', -3) },
      ],
    },
    cowork: {
      title: 'Alex drama',
      body: 'Alex spilled oat milk and blame in equal parts. Take a side or mop in silence.',
      choices: [
        { label: 'Back up Alex', run: () => { addRel('alex', 10); addRel('priya', -4); bump('mood', 4); } },
        { label: 'Agree with Priya', run: () => { addRel('priya', 8); addRel('alex', -8); } },
        { label: 'Mop and hum', run: () => { bump('energy', -6); addRel('alex', 2); addRel('priya', 2); } },
      ],
    },
    inspection: {
      title: 'Inspection tomorrow',
      body: 'Ms. Hale will see the apartment. She has eyes. The mess has height.',
      choices: [
        {
          label: 'Clean now',
          run: () => {
            bump('energy', -16);
            state.mess = clamp(state.mess - 50, 0, 100);
            addRel('hale', 8);
            spendTime(40);
          },
        },
        {
          label: 'Hide things in the closet',
          run: () => {
            state.mess = clamp(state.mess - 10, 0, 100);
            addRel('hale', state.mess > 40 ? -10 : 2);
            bump('mood', -4);
          },
        },
      ],
    },
    broke: {
      title: 'Bank app: lol',
      body: 'You have the kind of money that makes cereal a strategy. Riley might float you if you are close. Or you could sell plasma. Joke. Maybe.',
      choices: [
        {
          label: state.people.riley >= 60 ? 'Ask Riley for $30' : 'Scrape together dignity',
          run: () => {
            if (state.people.riley >= 60) {
              state.money += 30;
              addRel('riley', -6);
              showToast('Riley sighs in Venmo.');
            } else bump('mood', -8);
          },
        },
        { label: 'Look at job listings', run: () => { if (state.jobId === 'none') showToast('Bean & Oak is still hiring. Priya knows.'); } },
      ],
    },
  };

  const ev = events[id];
  if (ev) openEvent(ev);
}

function openEvent(ev) {
  const choices = ev.choices.map((c, i) => `<button type="button" data-act="event" data-arg="${i}">${esc(c.label)}</button>`).join('');
  overlay.dataset.event = JSON.stringify(ev.choices.map((c) => true));
  overlay._choices = ev.choices;
  openMenu('event', `
    <h2>${esc(ev.title)}</h2>
    <p>${esc(ev.body)}</p>
    <div class="choice-list">${choices}</div>
  `);
}

function openLife() {
  const j = job();
  const ppl = [
    ['Riley', 'riley', 'Roommate'],
    ['Ms. Hale', 'hale', 'Landlord'],
    ['Priya', 'priya', 'Cafe boss'],
    ['Alex', 'alex', 'Coworker'],
    ['Nico', 'nico', 'Friend'],
    ['Dr. Moss', 'moss', 'Clinic'],
  ].map(([name, id, role]) => `
    <div class="row"><span>${name} · ${role}</span><span>${Math.round(state.people[id])}</span></div>
  `).join('');
  const pet = state.pet
    ? `<h3>${esc(state.pet.name)} the ${state.pet.kind}${state.petSick ? ' (sick)' : ''}</h3>
       <div class="row"><span>Hunger</span><span>${Math.round(state.pet.hunger)}</span></div>
       <div class="row"><span>Happy</span><span>${Math.round(state.pet.happy)}</span></div>
       <div class="row"><span>Clean</span><span>${Math.round(state.pet.clean)}</span></div>
       <div class="row"><span>Pet food</span><span>${state.petFood}</span></div>`
    : '<p class="muted">No pet yet. Whisker Window is on the street.</p>';
  openMenu('life', `
    <h2>${esc(state.name)} · Life</h2>
    <p class="muted">${DAYS[weekday(state.day)]} day ${state.day} · ${esc(j.title)} at ${esc(j.place)}</p>
    <div class="row"><span>Money</span><span>$${state.money}</span></div>
    <div class="row"><span>Rent</span><span class="${state.rentPaid ? 'good' : 'warn'}">${state.rentPaid ? 'paid' : '$' + rentOwed() + ' due Sun'}</span></div>
    <div class="row"><span>Utilities</span><span class="${state.utilPaid ? 'good' : 'warn'}">${state.utilPaid ? 'paid' : '$' + utilOwed()}</span></div>
    <div class="row"><span>Meals / snacks</span><span>${state.food} / ${state.snacks}</span></div>
    <div class="row"><span>Apartment mess</span><span>${Math.round(state.mess)}</span></div>
    <div class="row"><span>Job misses</span><span>${state.misses}</span></div>
    ${pet}
    <h3>People</h3>
    <div class="people-list">${ppl}</div>
    <div class="menu-actions">
      <button type="button" class="ghost" data-act="close">Close</button>
    </div>
  `);
}

function openPause() {
  openMenu('pause', `
    <h2>Paused</h2>
    <p class="muted">Oak Street will wait. The bills will not, but they will wait a little.</p>
    <div class="menu-actions">
      <button type="button" data-act="close">Resume</button>
      <button type="button" data-act="multi">Online co-op</button>
      <button type="button" class="ghost" data-act="save">Save</button>
      <button type="button" class="alt" data-act="hub">Quit to games</button>
    </div>
  `);
}

function openBoot() {
  const has = !!localStorage.getItem(SAVE_KEY);
  const continueBtn = has ? '<button type="button" data-act="continue">Continue</button>' : '';
  openMenu('boot', `
    <h2>Oak Street Life</h2>
    <p>You live in 4B. Riley has the other bedroom. Rent is due every Sunday. Bean &amp; Oak hired you as a barista. A pet would help, until it also has bills.</p>
    <p>Log in with a friend's 6-letter room code, or start your own life.</p>
    <div class="join-row">
      <input id="boot-room-input" type="text" maxlength="6" placeholder="ROOM CODE" value="${esc(pendingInvite)}" autocomplete="off" spellcheck="false">
      <button type="button" data-act="join-invite">Log in</button>
    </div>
    <div class="menu-actions">
      ${continueBtn}
      <button type="button" class="ghost" data-act="new">New life</button>
    </div>
  `);
  const input = document.getElementById('boot-room-input');
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinInviteNow();
  });
}

function openNew() {
  const swatches = HAIR.map((c, i) =>
    `<button type="button" class="swatch${i === hairPick ? ' on' : ''}" data-act="hair" data-arg="${i}" style="background:${c}"></button>`
  ).join('');
  openMenu('new', `
    <h2>Move-in day</h2>
    <p class="muted">Name on the mailbox.</p>
    <input id="name-input" type="text" maxlength="12" value="${esc(nameDraft)}" autocomplete="off" spellcheck="false">
    <p class="muted">Hair</p>
    <div class="hair-list">${swatches}</div>
    <div class="menu-actions">
      <button type="button" data-act="start">Take the keys</button>
    </div>
  `);
  const input = document.getElementById('name-input');
  if (input) {
    input.focus();
    input.addEventListener('input', () => { nameDraft = input.value; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startGame();
    });
  }
}

function startGame() {
  const input = document.getElementById('name-input');
  const name = (input?.value || nameDraft || 'Remy').trim().slice(0, 12) || 'Remy';
  state = newState();
  state.name = name;
  state.hair = HAIR[hairPick];
  closeMenu();
  save();
  openEvent({
    title: `Welcome to 4B, ${state.name}`,
    body: 'Riley has the other room. Rent is due Sunday. Work is a game: clock in at 9:00, play the morning rush, lunch at noon, back at 1:00. Late means fired. A pet is optional.',
    choices: [{ label: 'I live here now', run: () => showToast('Work at 9:00 sharp. Late is fired. Lunch at noon.') }],
  });
  afterEnterLife();
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    state = { ...newState(), ...data };
    state.dead = false;
    state.working = false;
    return true;
  } catch {
    return false;
  }
}

function talkRemote(id) {
  const remote = remotes.get(id);
  if (!remote) return;
  const who = remote.name || 'Friend';
  openEvent({
    title: who,
    body: `${who} is on Oak Street with you. ${remote.job ? 'They work as a ' + remote.job + '.' : 'Same leaky sink, different problems.'}`,
    choices: [
      {
        label: 'Wave',
        run: () => {
          bump('mood', 4);
          broadcastSay(`${state.name} waves at ${who}!`);
        },
      },
      {
        label: 'Hang out',
        run: () => {
          bump('mood', 10);
          bump('energy', -4);
          spendTime(20);
          broadcastSay(`${state.name} hangs out with ${who}.`);
        },
      },
      { label: 'Back to the bills', run: () => {} },
    ],
  });
}

function playerNetState() {
  return {
    name: state.name,
    hair: state.hair,
    shirt: state.shirt,
    x: Math.round(state.x),
    y: Math.round(state.y),
    scene: state.scene,
    look: state.look,
    face: state.face,
    moving: state.moving,
    job: job().title,
  };
}

function broadcastSay(text) {
  if (!multiplayerRole) {
    showToast(text);
    return;
  }
  if (multiplayerRole === 'host') {
    showToast(text);
    netBroadcast({ t: 'say', text });
  } else {
    netBroadcast({ t: 'say', text });
  }
}

function applySnap(msg) {
  if (!msg || !Array.isArray(msg.players)) return;
  if (multiplayerRole === 'guest') {
    if (Number.isFinite(msg.day)) state.day = msg.day;
    if (Number.isFinite(msg.minutes)) state.minutes = msg.minutes;
  }
  const seen = new Set();
  for (const person of msg.players) {
    if (!person?.id || person.id === ownPeerId || person.id === 'self') continue;
    seen.add(person.id);
    remotes.set(person.id, person);
  }
  for (const id of [...remotes.keys()]) {
    if (!seen.has(id)) remotes.delete(id);
  }
}

function handleNetMessage(msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'welcome' && msg.id) ownPeerId = msg.id;
  if (msg.t === 'pos' && multiplayerRole === 'host' && msg.id) {
    remotes.set(msg.id, { ...msg, id: msg.id });
    return;
  }
  if (msg.t === 'snap') {
    applySnap(msg);
    return;
  }
  if (msg.t === 'say' && msg.text) {
    showToast(msg.text);
    if (multiplayerRole === 'host') netBroadcast({ t: 'say', text: msg.text });
  }
}

function multiplayerHandlers(role) {
  if (role === 'host') {
    return {
      onMessage: handleNetMessage,
      onJoin: (id) => {
        showToast('A friend arrived on Oak Street!');
        netBroadcast(hostSnapshot());
        if (menu === 'multi') closeMenu();
      },
      onLeave: (id) => {
        remotes.delete(id);
        showToast('A friend left the street.');
        if (menu === 'multi') showHostLobby();
      },
    };
  }
  return {
    onMessage: handleNetMessage,
    onHostGone: () => leaveMultiplayer('The host left the room.'),
  };
}

function hostSnapshot() {
  return {
    t: 'snap',
    day: state.day,
    minutes: Math.floor(state.minutes),
    players: [
      { id: 'host', ...playerNetState() },
      ...[...remotes.entries()].map(([id, person]) => ({ ...person, id })),
    ],
  };
}

function netTick(dt) {
  if (!multiplayerRole) return;
  netAcc += dt;
  if (netAcc < 0.12) return;
  netAcc = 0;
  if (multiplayerRole === 'host') netBroadcast(hostSnapshot());
  else netBroadcast({ t: 'pos', ...playerNetState() });
}

function openMultiplayerMenu(message = '') {
  if (multiplayerRole) {
    if (multiplayerRole === 'host') showHostLobby(message);
    else showGuestLobby(message || `Room ${multiplayerCode}`);
    return;
  }
  openMenu('multi', `
    <h2>Online Co-op</h2>
    <p class="muted">Up to ${MAX_PLAYERS} people on one Oak Street. Same Wi-Fi. Player 1 hosts the town clock. Do not send a 127.0.0.1 link — that only works on your computer.</p>
    ${message ? `<p class="warn">${esc(message)}</p>` : ''}
    <div class="menu-actions">
      <button type="button" data-act="host-room">Create Room</button>
    </div>
    <div class="join-row">
      <input id="room-input" type="text" maxlength="6" placeholder="ROOM CODE" autocomplete="off" spellcheck="false">
      <button type="button" data-act="join-room">Join Room</button>
    </div>
    <div class="menu-actions">
      <button type="button" class="ghost" data-act="close">Back</button>
    </div>
  `);
}

function showConnecting(text) {
  openMenu('multi', `<h2>Online Co-op</h2><p>${esc(text)}</p>`);
}

function showHostLobby(status = '') {
  const link = inviteUrl(multiplayerCode);
  const count = Math.min(1 + remotes.size, MAX_PLAYERS);
  const localOnly = /127\.0\.0\.1|localhost/i.test(link);
  openMenu('multi', `
    <h2>Room ${esc(multiplayerCode)}</h2>
    <p class="muted">${esc(status || `${count}/${MAX_PLAYERS} players connected`)}</p>
    <p>Send this to a friend on the <strong>same Wi-Fi</strong>. Phone hotspot / different house will not work.</p>
    <p class="muted" style="word-break:break-all;max-width:340px">${esc(link)}</p>
    ${localOnly ? '<p class="warn">This still says 127.0.0.1. That link only works on your PC. Use the LAN server address instead.</p>' : ''}
    <div class="menu-actions">
      <button type="button" data-act="copy-invite">Copy Invite Link</button>
      <button type="button" data-act="play-room">Start / Play</button>
      <button type="button" class="ghost" data-act="leave-room">Close Room</button>
    </div>
  `);
}

function showGuestLobby(status) {
  openMenu('multi', `
    <h2>Room ${esc(multiplayerCode)}</h2>
    <p class="muted">${esc(status)}</p>
    <p>The host keeps the town clock. You still have your own job, money, and pet.</p>
    <div class="menu-actions">
      <button type="button" data-act="play-room">Play</button>
      <button type="button" class="ghost" data-act="leave-room">Leave Room</button>
    </div>
  `);
}

async function hostRoom() {
  if (netBusy) return;
  netBusy = true;
  const code = makeRoomCode();
  showConnecting('Creating room…');
  try {
    await netHost(code, multiplayerHandlers('host'), LIFE_NET);
    multiplayerRole = 'host';
    multiplayerCode = code;
    ownPeerId = 'host';
    remotes.clear();
    showHostLobby();
  } catch (error) {
    multiplayerRole = null;
    multiplayerCode = '';
    openMultiplayerMenu(error?.message || 'Could not create room.');
  }
  netBusy = false;
}

async function joinRoom(rawCode) {
  const code = String(rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (code.length !== 6) {
    openMultiplayerMenu('Enter a 6-character room code.');
    return;
  }
  if (netBusy) return;
  netBusy = true;
  showConnecting(`Joining ${code}…`);
  try {
    multiplayerRole = 'guest';
    multiplayerCode = code;
    remotes.clear();
    await netJoin(code, multiplayerHandlers('guest'), LIFE_NET);
    netBroadcast({ t: 'pos', ...playerNetState() });
    closeMenu();
    showToast(`Joined ${code} — look for your friend on the street`);
  } catch (error) {
    multiplayerRole = null;
    multiplayerCode = '';
    ownPeerId = '';
    openMultiplayerMenu(error?.message || 'Could not join room.');
  }
  netBusy = false;
}

async function copyInvite() {
  const link = inviteUrl(multiplayerCode);
  try {
    await navigator.clipboard.writeText(link);
    showToast('Invite link copied!');
    if (menu === 'multi') showHostLobby('Invite link copied.');
  } catch {
    prompt('Copy this invite link:', link);
  }
}

function leaveMultiplayer(message = '') {
  netStop();
  multiplayerRole = null;
  multiplayerCode = '';
  ownPeerId = '';
  remotes.clear();
  if (message) openMultiplayerMenu(message);
  else {
    closeMenu();
    showToast('You left the room.');
  }
}

function afterEnterLife() {
  if (pendingInvite.length === 6 && !multiplayerRole) {
    const code = pendingInvite;
    pendingInvite = '';
    joinRoom(code);
  }
}

function joinInviteNow() {
  const typed = document.getElementById('boot-room-input')?.value;
  const code = String(typed || pendingInvite || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  pendingInvite = '';
  load();
  joinRoom(code);
}

function openMenu(type, html) {
  menu = type;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = html;
}

function closeMenu() {
  menu = null;
  overlay.classList.add('hidden');
  overlayContent.innerHTML = '';
}

overlayContent.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  const arg = btn.dataset.arg;
  if (act === 'close') closeMenu();
  else if (act === 'continue') {
    if (load()) {
      closeMenu();
      showToast('Same street. Same problems. Hi.');
      afterEnterLife();
    }
  } else if (act === 'join-invite') joinInviteNow();
  else if (act === 'new') openNew();
  else if (act === 'hair') {
    hairPick = Number(arg);
    openNew();
  } else if (act === 'start') startGame();
  else if (act === 'restart') {
    localStorage.removeItem(SAVE_KEY);
    state = newState();
    openNew();
  } else if (act === 'hub') {
    netStop();
    window.location.href = 'index.html';
  } else if (act === 'save') {
    save();
    showToast('Saved.');
    closeMenu();
  } else if (act === 'pay-rent') payRent();
  else if (act === 'pay-util') payUtil();
  else if (act === 'sick') callSick();
  else if (act === 'buy') {
    const prices = { food: 16, snacks: 7, petfood: 12, toy: 15 };
    const cost = prices[arg];
    if (!trySpend(cost, arg)) return;
    spendTime(12);
    if (arg === 'food') state.food += state.flags.fridgeBroke ? 2 : 3;
    if (arg === 'snacks') state.snacks += 2;
    if (arg === 'petfood') state.petFood += 5;
    if (arg === 'toy' && state.pet) {
      state.pet.happy = clamp(state.pet.happy + 20, 0, 100);
      bump('mood', 6);
    }
    showToast('Bagged.');
    closeMenu();
  } else if (act === 'adopt') adoptPet(arg);
  else if (act === 'heal') {
    if (!trySpend(40, 'checkup')) return;
    bump('health', 40);
    bump('energy', 10);
    addRel('moss', 8);
    spendTime(40);
    closeMenu();
    showToast('Dr. Moss: “Eat. Sleep. I cannot prescribe rent.”');
  } else if (act === 'vet') {
    if (!state.pet) return;
    if (!trySpend(50, 'vet')) return;
    state.petSick = false;
    state.pet.hunger = clamp(state.pet.hunger + 20, 0, 100);
    state.pet.happy = clamp(state.pet.happy + 12, 0, 100);
    addRel('moss', 6);
    bump('mood', 8);
    spendTime(35);
    closeMenu();
    showToast(`${state.pet.name} forgives you, mostly.`);
  } else if (act === 'event') {
    const choice = overlay._choices?.[Number(arg)];
    closeMenu();
    if (choice?.run) choice.run();
  } else if (act === 'multi') openMultiplayerMenu();
  else if (act === 'host-room') hostRoom();
  else if (act === 'join-room') {
    const input = document.getElementById('room-input');
    joinRoom(input?.value);
  } else if (act === 'copy-invite') copyInvite();
  else if (act === 'play-room') closeMenu();
  else if (act === 'leave-room') leaveMultiplayer();
});

function checkMissedWork() {
  if (menu || state.dead || jobGame) return;
  if (state.jobId === 'none' || isWeekend(state.day) || state.calledSick) return;
  const mins = state.minutes;
  if (!state.morningDone && mins > 9 * 60 + 15) {
    fired('noshow');
    return;
  }
  if (state.morningDone && !state.afternoonDone && mins > 13 * 60 + 15) {
    fired('late');
  }
}

function updateStats(dt) {
  const hours = dt / SEC_PER_HOUR;
  const workMul = state.working ? 1.4 : 1;
  bump('hunger', -2.2 * hours * workMul);
  bump('energy', -1.6 * hours * (state.working ? 1.8 : 1));
  bump('hygiene', -1.1 * hours * workMul);
  if (state.hunger < 20) bump('mood', -4 * hours);
  if (state.energy < 15) bump('mood', -3 * hours);
  if (state.hygiene < 20) bump('mood', -2 * hours);
  if (state.hunger < 8) bump('health', -5 * hours);
  if (state.energy < 5) bump('health', -4 * hours);
  if (state.mood < 15) bump('health', -2 * hours);
  if (state.pet) {
    state.pet.hunger = clamp(state.pet.hunger - 3.2 * hours, 0, 100);
    state.pet.happy = clamp(state.pet.happy - 2.1 * hours, 0, 100);
    if (state.petSick) {
      state.pet.happy = clamp(state.pet.happy - 4 * hours, 0, 100);
      bump('mood', -2 * hours);
    }
    if (state.pet.hunger <= 0 && state.pet.happy <= 8) {
      const name = state.pet.name;
      state.pet = null;
      state.petOut = false;
      bump('mood', -28);
      openEvent({
        title: 'Empty bowl',
        body: `${name} was taken in by Whisker Window. They will be okay. You might not be, for a minute.`,
        choices: [{ label: 'I will do better', run: () => {} }],
      });
    }
  }
  if (state.health <= 0) {
    state.health = 1;
    collapse();
  }
  const h = hourOf(state.minutes);
  if (h >= 2 && h < 6 && !state.working) {
    showToast('You pass out wherever you are.');
    if (state.scene !== 'home') goScene('home', 70, 90);
    sleep();
  }
}

function updateWorld(dt) {
  const h = hourOf(state.minutes);
  nicoHere = state.scene === 'town' && ((h >= 16 && h < 22) || isWeekend(state.day));
  haleHere = state.scene === 'town' && (weekday(state.day) === 6 || (!state.rentPaid && weekday(state.day) >= 5));

  riley.x += riley.vx * dt;
  if (riley.x < 180 || riley.x > 360) riley.vx *= -1;
  riley.face = riley.vx > 0 ? 1 : -1;

  if (state.pet && state.scene === 'home' && !state.petOut) {
    state.pet.x += Math.sin(lastTime / 900) * 8 * dt;
    state.pet.y += Math.cos(lastTime / 1100) * 6 * dt;
    state.pet.x = clamp(state.pet.x, 160, 360);
    state.pet.y = clamp(state.pet.y, 300, 400);
  }

  if (state.working && !jobGame && state.scene === 'work' && customers.filter((c) => !c.done).length < 3) {
    if (Math.random() < dt * 0.35) {
      customers.push({
        x: rand(140, 400),
        y: rand(260, 360),
        done: false,
        hair: pick(HAIR),
        shirt: pick(['#457b9d', '#e76f51', '#2a9d8f', '#9b5de5', '#f4a261']),
      });
    }
  }

  if (state.working && !jobGame && hourOf(state.minutes) >= 17) {
    state.working = false;
  }

  if (state.petOut && state.scene === 'home') state.petOut = false;
}

function updatePlayer(dt) {
  if (menu || state.dead || jobGame) return;
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    const spd = 110 * (state.energy < 20 ? 0.7 : 1);
    const nx = state.x + (dx / len) * spd * dt;
    const ny = state.y + (dy / len) * spd * dt;
    if (!hitsWall(nx, state.y)) state.x = nx;
    if (!hitsWall(state.x, ny)) state.y = ny;
    state.x = clamp(state.x, 24, W - 24);
    state.y = clamp(state.y, 40, H - 20);
    state.face = dx < 0 ? -1 : dx > 0 ? 1 : state.face;
    if (Math.abs(dy) > Math.abs(dx)) state.look = dy < 0 ? 'up' : 'down';
    else if (dx) state.look = dx < 0 ? 'left' : 'right';
    state.moving += dt;
  } else {
    state.moving = 0;
  }
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function shadeHex(hex, amt = 0.78) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.min(255, Math.floor(((n >> 16) & 255) * amt)));
  const g = Math.max(0, Math.min(255, Math.floor(((n >> 8) & 255) * amt)));
  const b = Math.max(0, Math.min(255, Math.floor((n & 255) * amt)));
  return `rgb(${r},${g},${b})`;
}

function skyColor() {
  const h = hourOf(state.minutes);
  if (h < 6 || h >= 21) return '#182038';
  if (h < 8) return '#f0a078';
  if (h >= 18) return '#e07048';
  return pal().sky;
}

function drawPerson(x, y, hair, shirt, face, walk, look) {
  const s = 2;
  const ox = Math.round(x);
  const oy = Math.round(y);
  const dir = look || (walk ? (face < 0 ? 'left' : 'right') : 'down');
  const step = walk ? Math.floor(walk * 8) % 2 : 0;
  const out = '#201810';
  const skin = '#f3c89a';
  const shade = '#dca070';
  const pants = '#3a5a86';
  const shoe = '#4a3020';

  ctx.fillStyle = 'rgba(32, 24, 16, 0.28)';
  ctx.fillRect(ox - 9, oy - 1, 18, 4);

  ctx.save();
  ctx.translate(ox, oy);
  if (dir === 'left') ctx.scale(-1, 1);

  const p = (sx, sy, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(sx * s, sy * s, w * s, h * s);
  };

  if (dir === 'up') {
    p(-5, -22, 10, 2, out);
    p(-6, -20, 12, 9, hair);
    p(-5, -19, 10, 7, shadeHex(hair, 0.88));
    p(-5, -11, 10, 8, out);
    p(-4, -10, 8, 7, shirt);
    p(-4, -3, 3, 3, pants);
    p(1, -3, 3, 3, pants);
    p(-4 + (step ? -1 : 0), 0, 3, 2, shoe);
    p(1 + (step ? 1 : 0), 0, 3, 2, shoe);
    ctx.restore();
    return;
  }

  p(-5, -22, 10, 2, out);
  p(-6, -20, 12, 9, hair);
  p(-4, -18, 8, 7, skin);
  p(-4, -12, 8, 2, shade);
  p(-6, -19, 2, 6, hair);
  p(4, -19, 2, 6, hair);
  if (dir === 'down') {
    p(-3, -16, 2, 2, '#fff8f0');
    p(1, -16, 2, 2, '#fff8f0');
    p(-2, -16, 1, 2, out);
    p(2, -16, 1, 2, out);
    p(-1, -13, 2, 1, '#e09080');
  } else {
    p(1, -16, 2, 2, '#fff8f0');
    p(2, -16, 1, 2, out);
    p(-6, -18, 3, 7, hair);
  }
  p(-5, -11, 10, 8, out);
  p(-4, -10, 8, 7, shirt);
  p(-3, -9, 6, 3, shadeHex(shirt, 1.12));
  p(-5, -8, 2, 3, skin);
  p(3, -8, 2, 3, skin);
  p(-4, -3, 3, 4, pants);
  p(1, -3, 3, 4, pants);
  if (step) {
    p(-5, -2, 3, 3, pants);
    p(2, -1, 3, 3, pants);
    p(-5, 1, 3, 2, shoe);
    p(2, 2, 3, 2, shoe);
  } else {
    p(-4, 1, 3, 2, shoe);
    p(1, 1, 3, 2, shoe);
  }
  ctx.restore();
}

function drawPet(pet, x, y) {
  const ox = Math.round(x);
  const oy = Math.round(y);
  const s = 2;
  const p = (sx, sy, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(ox + sx * s, oy + sy * s, w * s, h * s);
  };
  ctx.fillStyle = 'rgba(32,24,16,0.25)';
  ctx.fillRect(ox - 10, oy, 20, 3);
  const wag = Math.sin(lastTime / 180) > 0 ? 1 : 0;
  if (pet.kind === 'cat') {
    p(-6, -9, 12, 8, '#201810');
    p(-5, -8, 10, 6, '#e0a05a');
    p(-6, -12, 4, 4, '#201810');
    p(2, -12, 4, 4, '#201810');
    p(-5, -11, 2, 3, '#e0a05a');
    p(3, -11, 2, 3, '#e0a05a');
    p(-3, -7, 1, 1, '#201810');
    p(1, -7, 1, 1, '#201810');
    p(-1, -6, 2, 1, '#f4c8a0');
    p(5, -7 + wag, 4, 2, '#e0a05a');
    p(-4, -5, 3, 2, '#fff4e0');
  } else if (pet.kind === 'dog') {
    p(-7, -8, 13, 8, '#201810');
    p(-6, -7, 11, 6, '#c48a50');
    p(4, -10, 5, 5, '#201810');
    p(4, -9, 4, 4, '#c48a50');
    p(-7, -7, 3, 4, '#a06838');
    p(-2, -6, 1, 1, '#201810');
    p(2, -6, 1, 1, '#201810');
    p(6, -6, 2, 1, '#201810');
    p(5, -4 + wag, 4, 2, '#c48a50');
    p(-5, -3, 3, 2, '#fff4e0');
  } else {
    p(-4, -10, 8, 7, '#201810');
    p(-3, -9, 6, 5, '#f0d060');
    p(3, -8, 4, 2, '#e07040');
    p(-2, -8, 1, 1, '#201810');
    p(-2, -4, 2, 4, '#f0d060');
    p(1, -4, 2, 4, '#f8e080');
  }
}

function drawLabel(text, x, y) {
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#301808';
  ctx.lineWidth = 4;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff6d8';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

function drawWoodFloor() {
  for (let y = 108; y < H; y += 16) {
    const odd = Math.floor(y / 16) % 2;
    for (let x = 0; x < W; x += 40) {
      drawRect(x, y, 40, 16, odd ? '#e0b86a' : '#d4a85c');
      drawRect(x + (odd ? 20 : 0), y, 20, 16, odd ? '#c89850' : '#e8c878');
      drawRect(x, y + 15, 40, 1, '#b07e40');
    }
  }
}

function drawGrass() {
  const p = pal();
  for (let y = 72; y < H; y += 16) {
    for (let x = 0; x < W; x += 16) {
      const alt = ((x + y) / 16) % 2 === 0;
      drawRect(x, y, 16, 16, alt ? p.grass : p.grass2);
      if ((x * 7 + y * 13) % 53 === 0) drawRect(x + 6, y + 8, 2, 2, p.flower);
      if ((x * 5 + y * 11) % 71 === 0) drawRect(x + 10, y + 4, 2, 2, '#fff8f0');
    }
  }
  if (seasonId() === 3) {
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73 + Math.floor(lastTime / 40)) % W;
      const sy = 80 + (i * 47) % (H - 80);
      drawRect(sx, sy, 2, 2, '#ffffff');
    }
  }
}

function drawPath(x, y, w, h) {
  const p = pal();
  drawRect(x, y, w, h, p.path);
  drawRect(x, y, w, 2, p.pathDark);
  drawRect(x, y + h - 2, w, 2, p.pathDark);
  for (let i = x + 8; i < x + w; i += 18) drawRect(i, y + 6, 3, 2, p.pathDark);
}

function drawTree(x, y) {
  const p = pal();
  drawRect(x + 10, y - 18, 8, 22, '#6a4428');
  drawRect(x + 12, y - 16, 4, 20, '#8a5a32');
  drawRect(x - 2, y - 48, 32, 28, p.treeDark);
  drawRect(x + 2, y - 52, 24, 32, p.tree);
  drawRect(x + 8, y - 56, 14, 12, p.treeLight);
  if (seasonId() === 0) {
    drawRect(x + 4, y - 44, 3, 3, '#ff8ab0');
    drawRect(x + 20, y - 36, 3, 3, '#ffd0e0');
  }
  if (seasonId() === 3) drawRect(x + 4, y - 56, 22, 6, '#f8fcff');
}

function drawWindowPane(x, y) {
  const h = hourOf(state.minutes);
  const glass = h >= 7 && h < 19 ? skyColor() : '#203050';
  drawRect(x, y, 22, 26, '#5a3a22');
  drawRect(x + 2, y + 2, 18, 22, glass);
  drawRect(x + 10, y + 2, 2, 22, '#fff8e8');
  drawRect(x + 2, y + 12, 18, 2, '#fff8e8');
  if (h >= 7 && h < 19 && seasonId() !== 3) drawRect(x + 4, y + 14, 6, 8, pal().tree);
}

function drawHouse(x, y, w, bodyH, wall, roof, title) {
  const roofH = 34;
  drawRect(x + w - 30, y + 6, 14, 24, '#8a4a32');
  drawRect(x + w - 32, y + 4, 18, 6, '#6a3424');
  if (hourOf(state.minutes) >= 18 || hourOf(state.minutes) < 7) {
    drawRect(x + w - 27, y + 2, 6, 4, '#c8c8c8');
  }
  for (let i = 0; i < roofH; i += 2) {
    const inset = Math.floor((roofH - i) * 0.28);
    drawRect(x + inset, y + i, w - inset * 2, 2, i % 4 < 2 ? roof : shadeHex(roof, 0.82));
  }
  if (seasonId() === 3) drawRect(x + 18, y + 4, w - 36, 6, '#f4f8fc');
  const by = y + roofH - 10;
  drawRect(x + 10, by, w - 20, bodyH, wall);
  drawRect(x + 10, by, w - 20, 5, '#6a4428');
  drawRect(x + 10, by + bodyH - 3, w - 20, 3, '#5a3820');
  drawWindowPane(x + 20, by + 14);
  drawWindowPane(x + w - 52, by + 14);
  const dx = x + w / 2 - 13;
  const dy = by + bodyH - 34;
  drawRect(dx, dy, 26, 34, '#6a3a22');
  drawRect(dx + 3, dy + 4, 20, 12, '#4a2818');
  drawRect(dx + 18, dy + 20, 3, 3, '#f0d060');
  drawRect(x + 16, by + bodyH - 8, 16, 6, '#8b4513');
  drawRect(x + 20, by + bodyH - 12, 3, 4, pal().flower);
  drawRect(x + 26, by + bodyH - 11, 3, 3, '#ffe066');
  if (title) drawLabel(title, x + w / 2, y - 4);
}

function drawClouds() {
  const h = hourOf(state.minutes);
  if (h < 6 || h >= 21) {
    for (let i = 0; i < 18; i++) {
      const sx = (i * 89) % W;
      const sy = 8 + (i * 17) % 50;
      drawRect(sx, sy, 2, 2, i % 3 ? '#f8f0c8' : '#ffffff');
    }
    return;
  }
  const drift = Math.floor(lastTime / 80) % W;
  const clouds = [[40, 18], [220, 10], [480, 22], [660, 12]];
  for (const [cx, cy] of clouds) {
    const x = (cx + drift) % (W + 80) - 40;
    drawRect(x, cy, 36, 10, '#ffffff');
    drawRect(x + 10, cy - 6, 24, 12, '#fff8f0');
    drawRect(x + 8, cy + 2, 28, 8, '#e8f4ff');
  }
}

function drawHome() {
  drawRect(0, 0, W, 108, '#f3d7a8');
  for (let x = 0; x < W; x += 24) drawRect(x, 20, 12, 70, '#edd0a0');
  drawRect(0, 96, W, 8, '#c47840');
  drawRect(0, 104, W, 8, '#8b5a32');
  drawWoodFloor();
  drawWindowPane(56, 28);
  drawWindowPane(168, 28);
  drawWindowPane(600, 28);
  drawRect(48, 24, 10, 40, '#d06060');
  drawRect(188, 24, 10, 40, '#d06060');
  drawRect(592, 24, 10, 40, '#d06060');
  drawRect(38, 48, 96, 64, '#6a4428');
  drawRect(44, 42, 84, 18, '#f8f0e0');
  drawRect(44, 60, 84, 44, '#d84848');
  drawRect(44, 72, 84, 4, '#fff8e8');
  drawRect(44, 84, 84, 4, '#fff8e8');
  drawRect(38, 48, 4, 64, '#5a3820');
  drawRect(130, 48, 4, 64, '#5a3820');
  drawRect(292, 36, 52, 72, '#d8c4a0');
  drawRect(296, 40, 44, 64, '#8ecae6');
  drawRect(300, 88, 36, 8, '#6a4428');
  drawRect(404, 48, 40, 22, '#c0c8d0');
  drawRect(408, 52, 32, 10, '#8aa0b0');
  drawRect(548, 36, 40, 70, '#e8e4dc');
  drawRect(552, 40, 32, 12, '#c8d4c0');
  drawRect(580, 64, 4, 10, '#c04040');
  drawRect(600, 68, 64, 28, '#c47840');
  drawRect(606, 62, 20, 10, '#6a4428');
  drawRect(632, 58, 24, 14, '#4a4a4a');
  drawRect(40, 292, 78, 48, '#6a4428');
  drawRect(46, 284, 66, 12, '#f0d060');
  drawRect(50, 298, 28, 18, '#203050');
  drawRect(176, 226, 118, 36, '#3d6b4f');
  drawRect(182, 220, 106, 12, '#2d5540');
  drawRect(186, 232, 28, 14, '#f3c89a');
  drawRect(184, 348, 28, 12, '#8a5a32');
  drawRect(188, 350, 20, 6, '#e8d0a0');
  drawRect(720, 348, 48, 96, '#6a4428');
  drawRect(726, 354, 36, 84, '#8b5a32');
  drawRect(748, 396, 4, 8, '#f0d060');
  drawRect(430, 40, 22, 28, '#fff8e0');
  drawRect(434, 46, 14, 16, '#d84848');
  drawRect(700, 40, 18, 36, '#2d6a3a');
  drawRect(704, 70, 10, 10, '#8b5a32');
  if (state.mess > 40) {
    drawRect(300, 400, 18, 10, '#6a4428');
    drawRect(430, 360, 14, 8, '#e0c060');
  }
  if (state.mess > 70) drawRect(140, 400, 22, 12, '#3d7a40');
  drawLabel('bed', 90, 40);
  drawLabel('bath', 318, 30);
  drawLabel('kitchen', 640, 30);
  drawPerson(riley.x, riley.y, '#5c4d3c', '#3d6b4f', riley.face, lastTime / 1000, riley.vx > 0 ? 'right' : 'left');
  if (state.pet && !state.petOut) drawPet(state.pet, state.pet.x, state.pet.y);
}

function drawTown() {
  ctx.fillStyle = skyColor();
  ctx.fillRect(0, 0, W, 80);
  drawClouds();
  drawGrass();
  drawPath(0, 186, W, 28);
  drawPath(0, 318, W, 24);
  drawPath(120, 80, 28, 260);
  drawPath(340, 80, 28, 260);
  drawPath(560, 80, 28, 260);
  drawHouse(54, 44, 150, 78, '#f3d5a8', '#d84848', 'Cafe');
  drawHouse(268, 36, 158, 86, '#e8dcc8', '#5a6e8a', 'Office');
  drawHouse(488, 40, 150, 82, '#f8f4e8', '#3d9e8a', 'Clinic');
  if (state.openings?.cafe) drawLabel('HIRING', 129, 40);
  if (state.openings?.office) drawLabel('HIRING', 347, 32);
  drawRect(64, 214, 176, 88, pal().grass2);
  drawRect(70, 220, 164, 76, pal().grass);
  drawRect(96, 248, 48, 22, '#5aa0d0');
  drawRect(102, 252, 36, 12, '#8ecae6');
  drawRect(108, 256, 16, 4, '#d8f0ff');
  drawTree(86, 268);
  drawTree(190, 274);
  drawLabel('Park', 152, 214);
  drawHouse(292, 200, 140, 72, '#f0c878', '#c06030', 'Market');
  if (state.openings?.market) drawLabel('HIRING', 362, 196);
  drawHouse(512, 200, 140, 72, '#e8d0a8', '#c070b0', 'Pets');
  drawHouse(28, 328, 128, 88, '#f3d5a8', '#d84848', '4B');
  drawTree(250, 430);
  drawTree(470, 430);
  drawTree(720, 160);
  if (nicoHere) drawPerson(170, 250, '#d4a017', '#e07040', 1, 0, 'down');
  if (haleHere) drawPerson(120, 360, '#3a3028', '#6a6e78', 1, 0, 'down');
}

function drawWork() {
  drawRect(0, 0, W, 100, '#f3d7a8');
  for (let x = 0; x < W; x += 24) drawRect(x, 16, 12, 70, '#edd0a0');
  drawRect(0, 92, W, 8, '#c47840');
  drawWoodFloor();
  drawWindowPane(80, 24);
  drawWindowPane(200, 24);
  drawWindowPane(680, 24);
  drawRect(80, 156, 440, 56, '#6a4428');
  drawRect(86, 148, 428, 14, '#8b5a32');
  drawRect(96, 128, 70, 22, '#c0d8e0');
  drawRect(240, 128, 70, 22, '#c0d8e0');
  drawRect(384, 128, 70, 22, '#c0d8e0');
  drawRect(110, 134, 16, 10, '#6a4428');
  drawRect(36, 348, 48, 96, '#6a4428');
  drawRect(42, 354, 36, 84, '#8b5a32');
  drawRect(64, 396, 4, 8, '#f0d060');
  drawRect(560, 300, 28, 22, '#8b5a32');
  drawRect(600, 300, 28, 22, '#8b5a32');
  drawLabel('Bean & Oak', 400, 36);
  drawPerson(520, 160, '#1a1a1a', '#8a4ac8', -1, 0, 'down');
  drawPerson(640, 300, '#8b2e1a', '#3a78c8', -1, 0, 'left');
  for (const c of customers) {
    if (!c.done) drawPerson(c.x, c.y, c.hair, c.shirt, -1, 0, 'up');
  }
}

function drawOffice() {
  drawRect(0, 0, W, 100, '#e8dcc8');
  drawRect(0, 92, W, 8, '#6a4428');
  drawWoodFloor();
  drawRect(180, 108, W - 180, 372, '#7a3040');
  for (let y = 120; y < H; y += 16) {
    for (let x = 188; x < W; x += 16) {
      if ((x + y) % 32 === 0) drawRect(x, y, 16, 16, '#8a3848');
    }
  }
  drawRect(40, 24, 28, 70, '#6a4428');
  drawRect(44, 30, 20, 8, '#c04040');
  drawRect(44, 42, 20, 8, '#f0d060');
  drawRect(44, 54, 20, 8, '#3d6b4f');
  drawRect(44, 66, 20, 8, '#3a78c8');
  drawRect(200, 168, 92, 52, '#6a4428');
  drawRect(206, 160, 80, 12, '#f0d060');
  drawRect(360, 168, 92, 52, '#6a4428');
  drawRect(366, 160, 80, 12, '#f0d060');
  drawRect(36, 348, 48, 96, '#6a4428');
  drawRect(42, 354, 36, 84, '#8b5a32');
  drawLabel('Stack & File', 400, 36);
  drawPerson(520, 140, '#111111', '#2b2d42', -1, 0, 'down');
}

function drawPrompt() {
  if (jobGame) {
    promptLabel.textContent = jobGame.kind === 'cafe'
      ? 'A brew · S milk · D pour · F lid'
      : 'A / S / D match the falling label';
    actLabel.textContent = 'Work';
    return;
  }
  const a = nearestAction();
  prompt = a;
  let text = a ? `${a.verb} · ${a.name}` : (state.scene === 'town' ? 'Street' : 'Walk around');
  if (state.shift === 'lunch') text = 'LUNCH · eat, then clock in by 1:00';
  promptLabel.textContent = text;
  actLabel.textContent = a ? a.verb : 'Do';
}

function drawHudBars() {
  energyBar.style.width = `${state.energy}%`;
  hungerBar.style.width = `${state.hunger}%`;
  moodBar.style.width = `${state.mood}%`;
  hygieneBar.style.width = `${state.hygiene}%`;
  healthBar.style.width = `${state.health}%`;
  dayLabel.textContent = `${seasonName()} ${DAYS[weekday(state.day)]} · ${state.day}`;
  timeLabel.textContent = formatTime(state.minutes);
  moneyLabel.textContent = `$${Math.floor(state.money)}`;
  jobLabel.textContent = multiplayerCode
    ? `${job().title} · ${multiplayerCode}`
    : (state.shift === 'lunch' ? `${job().title} · lunch` : job().title);
  if (state.pet) {
    petLabel.classList.remove('hidden');
    petLabel.textContent = `🐾 ${state.pet.name} · eat ${Math.round(state.pet.hunger)} · joy ${Math.round(state.pet.happy)}${state.petSick ? ' · sick' : ''}`;
  } else {
    petLabel.classList.add('hidden');
  }
  toastLabel.textContent = toast;
}

function render() {
  if (jobGame) {
    drawJobGame();
    return;
  }
  if (state.scene === 'home') drawHome();
  else if (state.scene === 'town') drawTown();
  else if (state.scene === 'work') drawWork();
  else if (state.scene === 'office') drawOffice();

  for (const remote of remotes.values()) {
    if (remote.scene !== state.scene) continue;
    drawPerson(
      remote.x,
      remote.y,
      remote.hair || '#3b2a1a',
      remote.shirt || '#3a78c8',
      remote.face || 1,
      remote.moving || 0,
      remote.look
    );
    drawLabel(remote.name || 'Friend', remote.x, remote.y - 46);
  }
  drawPerson(state.x, state.y, state.hair, state.shirt, state.face, state.moving, state.look);
  if (state.pet && state.petOut && state.scene !== 'home') {
    drawPet(state.pet, state.x - 20 * state.face, state.y + 6);
  }

  const h = hourOf(state.minutes);
  if (h >= 20 || h < 6) {
    ctx.fillStyle = 'rgba(20, 28, 72, 0.32)';
    ctx.fillRect(0, 0, W, H);
  } else if (h >= 18) {
    ctx.fillStyle = 'rgba(220, 90, 40, 0.12)';
    ctx.fillRect(0, 0, W, H);
  }
}

function loop(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
  lastTime = t;
  if (jobGame && !menu && !state.dead) {
    updateJobGame(dt);
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toast = '';
    }
  } else if (!menu && !state.dead) {
    if (multiplayerRole !== 'guest') {
      const speed = state.shift === 'lunch' ? 0.28 : 1;
      state.minutes += (dt * speed * 60) / SEC_PER_HOUR;
      if (state.minutes >= 24 * 60) {
        state.minutes -= 24 * 60;
        newDay(false);
      }
    }
    updatePlayer(dt);
    updateWorld(dt);
    updateStats(dt);
    checkMissedWork();
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toast = '';
    }
    saveTimer += dt;
    if (saveTimer > 8) {
      saveTimer = 0;
      save();
    }
  }
  if (multiplayerRole && menu !== 'boot' && menu !== 'new') netTick(dt);
  render();
  drawPrompt();
  drawHudBars();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  const typing = e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
  const k = e.key.toLowerCase();
  if (!typing && (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k) || k === ' ')) e.preventDefault();
  if (!typing) keys.add(k);
  if (k === 'escape') {
    if (menu === 'pause') closeMenu();
    else if (menu && menu !== 'boot' && menu !== 'new' && menu !== 'end' && menu !== 'event') closeMenu();
    else if (!menu) openPause();
  }
  if (typing) return;
  if (jobGame && e.repeat) return;
  if (jobGame && handleWorkKey(k)) return;
  if (k === 'p' && menu !== 'new' && menu !== 'event' && menu !== 'end') {
    openMultiplayerMenu();
    return;
  }
  if (menu) return;
  if (k === 'e') openLife();
  if (k === 'z' || k === ' ') {
    const a = nearestAction();
    if (a) doAction(a.id);
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

document.getElementById('act-btn').addEventListener('click', () => {
  const a = nearestAction();
  if (a) doAction(a.id);
});
document.getElementById('life-btn').addEventListener('click', () => {
  if (!menu) openLife();
});
document.getElementById('play-btn').addEventListener('click', () => {
  if (menu !== 'new' && menu !== 'event' && menu !== 'end') openMultiplayerMenu();
});
document.getElementById('pause-btn').addEventListener('click', () => {
  if (menu === 'pause') closeMenu();
  else if (!menu) openPause();
});

const gameContainer = document.getElementById('game-container');
const fullscreenButton = document.getElementById('fullscreen-btn');

function isFullscreen() {
  return document.fullscreenElement === gameContainer
    || document.webkitFullscreenElement === gameContainer;
}

function syncFullscreenBtn() {
  const on = isFullscreen();
  fullscreenButton.textContent = on ? '×' : '⛶';
  fullscreenButton.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
  fullscreenButton.title = on ? 'Exit full screen' : 'Full screen';
}

fullscreenButton.addEventListener('click', async () => {
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else document.webkitExitFullscreen?.();
    } else if (gameContainer.requestFullscreen) {
      await gameContainer.requestFullscreen();
    } else {
      gameContainer.webkitRequestFullscreen?.();
    }
  } catch {
    showToast('Full screen is not available here.');
  }
});

document.addEventListener('fullscreenchange', syncFullscreenBtn);
document.addEventListener('webkitfullscreenchange', syncFullscreenBtn);

openBoot();
if (pendingInvite.length === 6) joinInviteNow();
requestAnimationFrame(loop);
