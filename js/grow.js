const W = 800;
const H = 480;
const SAVE_KEY = 'gat-grow-save';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HAIR = ['#3b2a1a', '#111111', '#d4a017', '#8b2e1a', '#3d5a80', '#5c4d3c'];
const CITY_RENT = 45;

const JOBS = {
  none: { id: 'none', title: 'Home', wage: 0, game: null },
  stock: { id: 'stock', title: 'Stock kid', wage: 8, game: 'mart' },
  barista: { id: 'barista', title: 'Barista', wage: 12, game: 'cafe' },
  clerk: { id: 'clerk', title: 'Clerk', wage: 16, game: 'office' },
};

const CAFE_KEYS = [
  { id: 'brew', key: 'a', label: 'BREW', color: '#6a4428' },
  { id: 'milk', key: 's', label: 'MILK', color: '#f4ead4' },
  { id: 'pour', key: 'd', label: 'POUR', color: '#c47838' },
  { id: 'lid', key: 'f', label: 'LID', color: '#c04028' },
];
const MART_KEYS = [
  { id: 'can', key: 'a', label: 'CAN', color: '#8a8a8a' },
  { id: 'box', key: 's', label: 'BOX', color: '#c47838' },
  { id: 'bag', key: 'd', label: 'BAG', color: '#2a9d8f' },
  { id: 'tag', key: 'f', label: 'TAG', color: '#3a78c8' },
];
const OFFICE_KEYS = [
  { id: 'in', key: 'a', label: 'IN', color: '#3a78c8' },
  { id: 'file', key: 's', label: 'FILE', color: '#3d6b4f' },
  { id: 'send', key: 'd', label: 'SEND', color: '#c04028' },
  { id: 'done', key: 'f', label: 'DONE', color: '#8a4ac8' },
];
const SCHOOL_WORDS = [
  ['C', 'A', 'T'],
  ['R', 'E', 'A', 'D'],
  ['M', 'A', 'T', 'H'],
  ['P', 'L', 'A', 'Y'],
  ['H', 'O', 'M', 'E'],
  ['B', 'U', 'S'],
  ['C', 'I', 'T', 'Y'],
];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
const dayLabel = document.getElementById('day-label');
const timeLabel = document.getElementById('time-label');
const ageLabel = document.getElementById('age-label');
const moneyLabel = document.getElementById('money-label');
const jobLabel = document.getElementById('job-label');
const promptLabel = document.getElementById('prompt-label');
const toastLabel = document.getElementById('toast-label');
const actLabel = document.getElementById('act-label');
const fsBtn = document.getElementById('fullscreen-btn');
const gameContainer = document.getElementById('game-container');

const keys = new Set();
let walkTarget = null;
let menu = 'boot';
let toast = '';
let toastTimer = 0;
let lastTime = 0;
let saveTimer = 0;
let fade = 0;
let fadeText = '';
let fadeRun = null;
let hairPick = 0;
let genderPick = 'boy';
let nameDraft = 'Remy';
let jobGame = null;
let lastGrowCheck = 0;

function newState() {
  return {
    name: 'Remy',
    gender: 'boy',
    hair: HAIR[0],
    shirt: '#8ecae6',
    stage: 'baby',
    age: 0,
    years: 0,
    day: 1,
    minutes: 8 * 60,
    money: 0,
    energy: 80,
    hunger: 70,
    mood: 78,
    hygiene: 74,
    health: 100,
    scene: 'home',
    x: 360,
    y: 300,
    face: 1,
    look: 'down',
    moving: 0,
    jobId: 'none',
    working: false,
    workedToday: false,
    schoolToday: false,
    rentPaid: true,
    rentLate: 0,
    food: 3,
    cityDays: 0,
    flags: { intro: false, city: false },
    dead: false,
  };
}

let state = newState();

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shadeHex(hex, amt = 0.78) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.min(255, Math.floor(((n >> 16) & 255) * amt)));
  const g = Math.max(0, Math.min(255, Math.floor(((n >> 8) & 255) * amt)));
  const b = Math.max(0, Math.min(255, Math.floor((n & 255) * amt)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function weekday(day) {
  return (day - 1) % 7;
}

function isWeekend(day) {
  const w = weekday(day);
  return w === 5 || w === 6;
}

function hourOf(mins) {
  return Math.floor(mins / 60);
}

function clockText(mins) {
  const h = hourOf(mins);
  const m = Math.floor(mins % 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}

function secPerHour() {
  if (state.stage === 'baby') return 7;
  if (state.stage === 'kid') return 10;
  if (state.stage === 'teen') return 11;
  return 14;
}

function job() {
  return JOBS[state.jobId] || JOBS.none;
}

function stageLabel() {
  return { baby: 'Baby', kid: 'Kid', teen: 'Teen', city: 'Adult' }[state.stage] || 'Baby';
}

function bump(stat, amt) {
  state[stat] = clamp((state[stat] || 0) + amt, 0, 100);
}

function grow(amt) {
  if (state.stage === 'city') return;
  state.years = clamp(state.years + amt, 0, 100);
}

function spendTime(mins) {
  state.minutes += mins;
  if (state.minutes >= 24 * 60) {
    state.minutes -= 24 * 60;
    newDay(false);
  }
}

function showToast(text) {
  toast = text;
  toastTimer = 3.2;
}

function inClockWindow() {
  const h = hourOf(state.minutes);
  return h >= 8 && h < 17;
}

function schoolOpen() {
  return !isWeekend(state.day) && hourOf(state.minutes) >= 8 && hourOf(state.minutes) < 15;
}

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (err) {
    /* ignore */
  }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const next = JSON.parse(raw);
    if (!next || typeof next !== 'object') return false;
    state = { ...newState(), ...next };
    return true;
  } catch (err) {
    return false;
  }
}

function openMenu(kind, html) {
  menu = kind;
  overlayContent.innerHTML = html;
  overlay.classList.remove('hidden');
}

function closeMenu() {
  if (menu === 'boot' || menu === 'new' || menu === 'end') return;
  menu = null;
  overlay.classList.add('hidden');
}

function openEvent(evt) {
  overlay._choices = evt.choices || [];
  openMenu('event', `
    <h2>${esc(evt.title)}</h2>
    <p>${esc(evt.body)}</p>
    <div class="choice-list">
      ${(evt.choices || []).map((c, i) => `<button type="button" data-act="event" data-arg="${i}">${esc(c.label)}</button>`).join('')}
    </div>
  `);
}

function fadeTo(text, run) {
  fade = 0.01;
  fadeText = text;
  fadeRun = run;
}

function newDay(fromSleep) {
  state.day += 1;
  state.workedToday = false;
  state.schoolToday = false;
  if (state.stage === 'city') {
    state.cityDays += 1;
    if (weekday(state.day) === 0) {
      state.rentPaid = false;
      showToast('Rent is due. Pay it at the desk.');
    }
    if (weekday(state.day) === 1 && !state.rentPaid) {
      state.rentLate += 1;
      if (state.rentLate >= 2) {
        state.dead = true;
        openMenu('end', `
          <h2>Evicted</h2>
          <p>Harbor City does not wait. Two late rents and 2A belongs to someone else.</p>
          <div class="menu-actions">
            <button type="button" data-act="new">New life</button>
            <button type="button" class="ghost" data-act="hub">Games</button>
          </div>
        `);
        return;
      }
      showToast('Rent is late. One more and you are out.');
    }
  }
  if (fromSleep) {
    bump('energy', 55);
    bump('mood', 8);
    bump('hygiene', -6);
  }
  if (state.cityDays === 28 && !state.flags.month) {
    state.flags.month = true;
    openEvent({
      title: 'A month in the city',
      body: 'You paid enough people. You ate. You showed up. Willow Lane would be proud, and a little sad.',
      choices: [{ label: 'Keep going', run: () => bump('mood', 16) }],
    });
  }
}

function maybeGrowUp() {
  if (state.stage === 'city' || state.years < 100) return;
  if (state.stage === 'baby') {
    state.stage = 'kid';
    state.age = 6;
    state.years = 0;
    state.shirt = '#2a9d8f';
    state.x = 360;
    state.y = 300;
    openEvent({
      title: 'You can walk',
      body: 'The crib is too small. Mom packs a lunch. School is on Willow Lane. Chores pay a little. Play still counts.',
      choices: [{ label: 'I am huge now', run: () => showToast('WASD walk. Z do. School on weekdays.') }],
    });
    return;
  }
  if (state.stage === 'kid') {
    state.stage = 'teen';
    state.age = 14;
    state.years = 0;
    state.shirt = '#457b9d';
    state.jobId = 'stock';
    openEvent({
      title: 'Teenager',
      body: 'Your voice cracks. The front door is yours now. School still starts at 8:00 AM. Corner Mart pays after class. Grow up, then Oak Street is waiting.',
      choices: [{ label: 'I will go outside', run: () => showToast('Door goes to the street. School at 8:00 AM.') }],
    });
    return;
  }
  if (state.stage === 'teen') askOakStreet();
}

function showOakStreetPrompt() {
  openMenu('end', `
    <h2>Switch To Oak Street?</h2>
    <p>You grew up. Oak Street Life is the next town over. Same bills. Same kind of job. A different street.</p>
    <div class="menu-actions">
      <button type="button" data-act="oak">Yes</button>
      <button type="button" class="ghost" data-act="hub">No</button>
    </div>
  `);
}

function askOakStreet() {
  if (state.flags.city) {
    showOakStreetPrompt();
    return;
  }
  state.flags.city = true;
  state.stage = 'city';
  state.age = 18;
  state.years = 100;
  save();
  showOakStreetPrompt();
}

function spots() {
  const st = state.stage;
  if (state.scene === 'home') {
    const list = [
      { id: 'crib', name: st === 'baby' ? 'Crib' : 'Bed', x: 140, y: 220, verb: st === 'baby' ? 'Nap' : ((hourOf(state.minutes) >= 20 || hourOf(state.minutes) < 6 || state.energy < 22) ? 'Sleep' : 'Sit') },
      { id: 'mom', name: 'Mom', x: 520, y: 200, verb: st === 'baby' ? 'Bottle' : 'Talk' },
      { id: 'dad', name: 'Dad', x: 640, y: 320, verb: st === 'baby' ? 'Hug' : 'Talk' },
      { id: 'toys', name: 'Toys', x: 280, y: 340, verb: 'Play' },
      { id: 'fridge', name: 'Fridge', x: 80, y: 360, verb: 'Eat' },
      { id: 'bath', name: 'Sink', x: 720, y: 180, verb: 'Wash' },
    ];
    if (st === 'kid' || st === 'teen') {
      list.push({ id: 'door', name: 'Door', x: 400, y: 430, verb: st === 'teen' ? 'Go to the street' : 'Go outside' });
    }
    if (st === 'kid' || st === 'teen') list.push({ id: 'chore', name: 'Dishes', x: 200, y: 180, verb: 'Chores' });
    return list;
  }
  if (state.scene === 'lane') {
    const list = [
      { id: 'house', name: 'Home', x: 80, y: 360, verb: 'Go inside' },
      { id: 'park', name: 'Park', x: 260, y: 220, verb: 'Play' },
      { id: 'school', name: 'School', x: 560, y: 160, verb: schoolOpen() && !state.schoolToday ? 'Class' : 'Enter school' },
    ];
    if (st === 'teen') list.push({ id: 'mart', name: 'Corner Mart', x: 700, y: 300, verb: inClockWindow() && !state.workedToday ? 'Clock in' : 'Visit mart' });
    return list;
  }
  if (state.scene === 'school') {
    return [
      { id: 'desk', name: 'Desk', x: 300, y: 260, verb: state.schoolToday ? 'Already did class' : 'Do class' },
      { id: 'teacher', name: 'Ms. Wren', x: 560, y: 180, verb: 'Talk' },
      { id: 'exit', name: 'Door', x: 80, y: 400, verb: 'Leave' },
    ];
  }
  if (state.scene === 'apt') {
    return [
      { id: 'bed', name: 'Bed', x: 140, y: 220, verb: 'Sleep' },
      { id: 'fridge', name: 'Fridge', x: 80, y: 360, verb: 'Eat' },
      { id: 'bath', name: 'Shower', x: 700, y: 180, verb: 'Wash' },
      { id: 'desk', name: 'Desk', x: 520, y: 200, verb: 'Pay rent' },
      { id: 'jess', name: 'Jess', x: 640, y: 320, verb: 'Talk' },
      { id: 'door', name: 'Door', x: 400, y: 430, verb: 'City street' },
    ];
  }
  if (state.scene === 'city') {
    return [
      { id: 'apt', name: '2A', x: 80, y: 360, verb: 'Go home' },
      { id: 'cafe', name: 'Harbor Bean', x: 220, y: 160, verb: job().game === 'cafe' && inClockWindow() && !state.workedToday ? 'Clock in' : 'Enter cafe' },
      { id: 'office', name: 'Stackline', x: 520, y: 150, verb: job().game === 'office' && inClockWindow() && !state.workedToday ? 'Clock in' : 'Apply' },
      { id: 'shop', name: 'Market', x: 680, y: 300, verb: 'Buy food $8' },
    ];
  }
  if (state.scene === 'work') {
    return [
      { id: 'counter', name: 'Counter', x: 300, y: 250, verb: state.working ? 'Working' : 'Clock in' },
      { id: 'boss', name: 'Priya', x: 560, y: 180, verb: 'Talk' },
      { id: 'exit', name: 'Door', x: 80, y: 400, verb: 'Leave' },
    ];
  }
  if (state.scene === 'office') {
    return [
      { id: 'deskjob', name: 'Desk', x: 300, y: 250, verb: state.working ? 'Working' : 'Clock in' },
      { id: 'boss', name: 'Mr. Lin', x: 560, y: 180, verb: 'Talk' },
      { id: 'exit', name: 'Door', x: 80, y: 400, verb: 'Leave' },
    ];
  }
  return [];
}

function nearestAction(max = 56) {
  let best = null;
  let bestD = max;
  for (const s of spots()) {
    const d = Math.hypot(state.x - s.x, state.y - s.y);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

function hireClerk() {
  state.jobId = 'clerk';
  showToast('You have a desk now.');
}

function keepCafe() {
  showToast('Priya pretends not to listen.');
}

function goScene(scene, x, y) {
  state.scene = scene;
  state.x = x;
  state.y = y;
  if (state.working && scene !== 'work' && scene !== 'office') state.working = false;
}

function doAction(id) {
  if (jobGame) return;
  const st = state.stage;

  if (id === 'crib') {
    if (st === 'baby') {
      bump('energy', 40);
      bump('mood', 6);
      grow(22);
      spendTime(90);
      showToast('Warm. Dark. Growing.');
    } else if (st !== 'city' && (hourOf(state.minutes) >= 20 || hourOf(state.minutes) < 6 || state.energy < 22)) {
      fadeTo('You sleep in your old room.', () => {
        state.minutes = 7 * 60 + 20;
        newDay(true);
      });
    } else {
      bump('energy', 12);
      spendTime(20);
      showToast('You sit on the old crib rail. It squeaks.');
    }
    return;
  }
  if (id === 'mom') {
    if (st === 'baby') {
      bump('hunger', 36);
      bump('mood', 10);
      grow(18);
      spendTime(25);
      showToast('Mom: “There. That is the whole job.”');
    } else if (st === 'city') {
      showToast('Mom is a phone call now.');
    } else {
      bump('mood', 10);
      grow(6);
      spendTime(15);
      showToast(st === 'teen'
        ? 'Mom: “Keep $80. The city eats people who forget lunch.”'
        : 'Mom: “School first. Then the park.”');
    }
    return;
  }
  if (id === 'dad') {
    if (st === 'baby') {
      bump('mood', 16);
      grow(14);
      spendTime(15);
      showToast('Dad lifts you like a trophy.');
    } else {
      bump('mood', 8);
      grow(5);
      spendTime(12);
      showToast(st === 'teen' ? 'Dad: “I stocked shelves too. Then I met your mom.”' : 'Dad: “Kick the ball. Then homework.”');
    }
    return;
  }
  if (id === 'toys' || id === 'park') {
    bump('mood', 18);
    bump('energy', -10);
    grow(st === 'baby' ? 16 : 10);
    spendTime(30);
    showToast(id === 'park' ? 'The swing remembers you.' : 'Blocks become a city. Then you knock it down.');
    return;
  }
  if (id === 'fridge') {
    if (st === 'city') {
      if (state.food <= 0) return showToast('Fridge is a light and a smell.');
      state.food -= 1;
    }
    bump('hunger', 38);
    bump('mood', 4);
    spendTime(15);
    showToast(st === 'baby' ? 'Mush. You accept this.' : st === 'city' ? 'You eat. The day gets quieter.' : 'Mom already made a plate.');
    return;
  }
  if (id === 'bath') {
    bump('hygiene', 40);
    bump('mood', 4);
    spendTime(15);
    showToast(st === 'baby' ? 'Splash. Mom laughs.' : 'Hot water. You are a person again.');
    return;
  }
  if (id === 'chore') {
    if (isWeekend(state.day) === false && hourOf(state.minutes) < 15 && !state.schoolToday && st !== 'teen') {
      return showToast('School first.');
    }
    state.money += st === 'teen' ? 7 : 4;
    grow(12);
    bump('energy', -12);
    bump('hygiene', -8);
    spendTime(35);
    showToast(st === 'teen' ? 'Dishes. $7. Glamour.' : 'You dry a plate. Dad pays $4.');
    maybeGrowUp();
    return;
  }
  if (id === 'door' && state.scene === 'home') {
    if (st === 'baby') return showToast('The door is taller than you.');
    fadeTo(st === 'teen' ? 'The street' : 'Willow Lane', () => goScene('lane', 140, 360));
    return;
  }
  if (id === 'house') {
    fadeTo('Home', () => goScene('home', 400, 400));
    return;
  }
  if (id === 'school' || (id === 'desk' && state.scene === 'school')) {
    startSchool();
    return;
  }
  if (id === 'teacher') {
    showToast(state.schoolToday ? 'Ms. Wren: “Good. Go home before the sun does.”' : 'Ms. Wren: “Sit. Letters first.”');
    return;
  }
  if (id === 'exit') {
    if (state.working) return leaveWork(true);
    if (state.scene === 'school') return fadeTo('Willow Lane', () => goScene('lane', 560, 200));
    if (state.scene === 'work' || state.scene === 'office') return fadeTo('Harbor Street', () => goScene('city', 220, 200));
    return;
  }
  if (id === 'mart') {
    if (st !== 'teen') return;
    if (!inClockWindow()) return showToast('Mart opens at 8.');
    if (state.workedToday) return showToast('You already did a shift.');
    fadeTo('Corner Mart', () => startShift('mart'));
    return;
  }
  if (id === 'bus') {
    askOakStreet();
    return;
  }
  if (id === 'bed') {
    if (hourOf(state.minutes) < 20 && state.energy > 30) return showToast('Too early. The city is still loud.');
    fadeTo('You sleep.', () => {
      state.minutes = 7 * 60;
      newDay(true);
    });
    return;
  }
  if (id === 'desk' && state.scene === 'apt') {
    if (state.rentPaid) return showToast('Rent is paid. The desk still wobbles.');
    if (state.money < CITY_RENT) return showToast(`Rent is $${CITY_RENT}. You have $${state.money}.`);
    state.money -= CITY_RENT;
    state.rentPaid = true;
    state.rentLate = 0;
    showToast('2A is yours for another week.');
    return;
  }
  if (id === 'jess') {
    bump('mood', 8);
    spendTime(10);
    showToast(pick([
      'Jess: “Harbor Bean burns milk. I still go.”',
      'Jess: “Call your mom. She will pretend she was not waiting.”',
      'Jess: “Payday is a feeling.”',
    ]));
    return;
  }
  if (id === 'door' && state.scene === 'apt') {
    fadeTo('Harbor Street', () => goScene('city', 140, 360));
    return;
  }
  if (id === 'apt') {
    fadeTo('2A', () => goScene('apt', 400, 400));
    return;
  }
  if (id === 'cafe' || id === 'counter') {
    if (job().game !== 'cafe') {
      return showToast('You do not work here. Stackline is hiring if you want a raise.');
    }
    if (!inClockWindow()) return showToast('Cafe opens at 8.');
    if (state.workedToday) return showToast('You already clocked a shift.');
    fadeTo('Harbor Bean', () => {
      goScene('work', 300, 280);
      startShift('cafe');
    });
    return;
  }
  if (id === 'office' || id === 'deskjob') {
    if (job().game !== 'office') {
      if (state.jobId === 'barista' && state.flags.goodDays >= 3) {
        openEvent({
          title: 'Stackline',
          body: 'Mr. Lin wants a clerk. Sixteen an hour. Fewer tips. Same late rule.',
          choices: [
            { label: 'Take it', run: hireClerk },
            { label: 'Keep the cafe', run: keepCafe },
          ],
        });
        return;
      }
      return showToast('Help wanted, maybe later. Get a few good cafe days first.');
    }
    if (!inClockWindow()) return showToast('Office opens at 8.');
    if (state.workedToday) return showToast('You already filed today.');
    fadeTo('Stackline', () => {
      goScene('office', 300, 280);
      startShift('office');
    });
    return;
  }
  if (id === 'shop') {
    if (state.money < 8) return showToast('Food is $8.');
    state.money -= 8;
    state.food += 2;
    spendTime(20);
    showToast('Two meals. The bag is loud.');
    return;
  }
  if (id === 'boss') {
    showToast(state.scene === 'office'
      ? 'Mr. Lin: “Inbox. Then lunch. Then inbox.”'
      : 'Priya: “Do not guess the ticket.”');
  }
}

function startSchool() {
  if (state.stage === 'baby') return;
  if (state.scene !== 'school') {
    if (!isWeekend(state.day) && hourOf(state.minutes) < 8) {
      showToast('School starts at 8:00 AM.');
    }
    fadeTo('Willow School', () => goScene('school', 200, 360));
    return;
  }
  if (isWeekend(state.day)) return showToast('Weekend. Ms. Wren is a person today.');
  if (state.schoolToday) return showToast('Class is done. Go play or go home.');
  const h = hourOf(state.minutes);
  if (h < 8) return showToast('School starts at 8:00 AM.');
  if (h >= 15) return showToast('School is out. Come back at 8:00 AM.');
  const word = pick(SCHOOL_WORDS);
  jobGame = {
    kind: 'school',
    word,
    input: [],
    time: 18,
    flash: word.join(''),
    flashT: 0.8,
    score: 0,
  };
  showToast(`Spell ${word.join('')}. Type the letters.`);
}

function startShift(kind) {
  if (kind === 'mart') goScene('lane', 700, 300);
  jobGame = {
    kind,
    score: 0,
    combo: 0,
    served: 0,
    tips: 0,
    time: 40,
    input: [],
    order: null,
    flash: kind === 'school' ? '' : 'SHIFT',
    flashT: 0.8,
  };
  state.working = true;
  nextWorkOrder();
}

function workTable(kind) {
  if (kind === 'cafe') return CAFE_KEYS;
  if (kind === 'office') return OFFICE_KEYS;
  return MART_KEYS;
}

function nextWorkOrder() {
  if (!jobGame || jobGame.kind === 'school') return;
  if (jobGame.kind === 'cafe') {
    const n = 2 + Math.min(2, Math.floor(jobGame.combo / 5));
    const recipe = [];
    for (let i = 0; i < n; i++) recipe.push(pick(CAFE_KEYS));
    jobGame.order = { recipe, t: clamp(7 - jobGame.combo * 0.1, 4, 7), want: pick(['Drip', 'Latte', 'Cap', 'Tea']) };
    jobGame.input = [];
    return;
  }
  const item = pick(workTable(jobGame.kind));
  jobGame.order = { key: item.key, label: item.label, t: clamp(6.4 - jobGame.combo * 0.08, 3.6, 6.4) };
}

function handleWorkKey(k) {
  if (!jobGame) return false;
  if (jobGame.kind === 'school') {
    const next = jobGame.word[jobGame.input.length];
    if (!next) return true;
    if (k === next.toLowerCase()) {
      jobGame.input.push(k);
      if (jobGame.input.length >= jobGame.word.length) finishSchool(true);
    } else {
      finishSchool(false);
    }
    return true;
  }
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
        jobGame.score += 1;
        if (Math.random() < 0.35) jobGame.tips += 1;
        jobGame.flash = 'ORDER UP';
        jobGame.flashT = 0.35;
        nextWorkOrder();
      }
    } else {
      jobGame.combo = 0;
      jobGame.flash = 'WRONG';
      jobGame.flashT = 0.35;
      nextWorkOrder();
    }
    return true;
  }
  if (jobGame.order?.key === key) {
    jobGame.served += 1;
    jobGame.combo += 1;
    jobGame.flash = 'YES';
    jobGame.flashT = 0.3;
    nextWorkOrder();
  } else {
    jobGame.combo = 0;
    jobGame.flash = 'NOPE';
    jobGame.flashT = 0.3;
    nextWorkOrder();
  }
  return true;
}

function finishSchool(ok) {
  jobGame = null;
  state.schoolToday = true;
  spendTime(90);
  if (ok) {
    grow(28);
    bump('mood', 10);
    bump('energy', -14);
    if (state.stage === 'teen') state.money += 2;
    showToast('Ms. Wren: “That is a word. Go.”');
  } else {
    grow(10);
    bump('mood', -6);
    bump('energy', -10);
    showToast('Ms. Wren: “Again tomorrow. The letters will wait.”');
  }
  maybeGrowUp();
}

function updateJobGame(dt) {
  if (!jobGame || menu) return;
  jobGame.time -= dt;
  if (jobGame.flashT > 0) jobGame.flashT -= dt;
  if (jobGame.kind === 'school') {
    if (jobGame.time <= 0) finishSchool(false);
    return;
  }
  if (jobGame.order) {
    jobGame.order.t -= dt;
    if (jobGame.order.t <= 0) {
      jobGame.combo = 0;
      jobGame.flash = 'TOO SLOW';
      jobGame.flashT = 0.3;
      nextWorkOrder();
    }
  }
  if (jobGame.time <= 0) endShift();
}

function endShift() {
  const g = jobGame;
  jobGame = null;
  state.working = false;
  state.workedToday = true;
  const j = job();
  const pay = Math.floor((j.wage || 8) * 3 + (g?.tips || 0) + Math.floor((g?.served || 0) / 2));
  state.money += pay;
  grow(state.stage === 'teen' ? 22 : 0);
  bump('energy', -16);
  bump('hunger', -12);
  bump('hygiene', -6);
  if ((g?.served || 0) >= 8) {
    state.flags.goodDays = (state.flags.goodDays || 0) + 1;
  }
  spendTime(180);
  showToast(`Clocked out. $${pay}. Served ${g?.served || 0}.`);
  if (state.stage === 'teen' && state.years >= 100) askOakStreet();
}

function leaveWork(quit) {
  if (jobGame) {
    jobGame = null;
    state.working = false;
    if (quit) {
      state.jobId = 'none';
      bump('mood', -16);
      showToast('You walked. The nametag stays.');
    }
  }
  fadeTo('Harbor Street', () => goScene('city', 220, 200));
}

function walkBox() {
  return { x: 40, y: 150, w: 720, h: 280 };
}

function updatePlayer(dt) {
  if (menu || state.dead || jobGame || fade) return;
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (!dx && !dy && walkTarget) {
    dx = walkTarget.x - state.x;
    dy = walkTarget.y - state.y;
    if (Math.hypot(dx, dy) < 8) {
      walkTarget = null;
      dx = 0;
      dy = 0;
    }
  }
  if (dx || dy) {
    const len = Math.hypot(dx, dy) || 1;
    const spd = state.stage === 'baby' ? 55 : state.energy < 12 ? 80 : 120;
    const box = walkBox();
    state.x = clamp(state.x + (dx / len) * spd * dt, box.x, box.x + box.w);
    state.y = clamp(state.y + (dy / len) * spd * dt, box.y, box.y + box.h);
    state.moving += dt;
    if (dx < 0) { state.face = -1; state.look = 'left'; }
    if (dx > 0) { state.face = 1; state.look = 'right'; }
    if (!dx && dy < 0) state.look = 'up';
    if (!dx && dy > 0) state.look = 'down';
  } else {
    state.moving = 0;
  }
}

function updateStats(dt) {
  const hours = dt / secPerHour();
  bump('hunger', -2.4 * hours);
  bump('energy', -1.5 * hours);
  bump('hygiene', -1.0 * hours);
  if (state.hunger < 18) bump('mood', -3 * hours);
  if (state.energy < 12) bump('mood', -2 * hours);
  if (state.hunger < 6) bump('health', -3 * hours);
  if (state.health < 1) state.health = 8;
}

function updateFade(dt) {
  if (!fade) return;
  fade += dt * 2.2;
  if (fade >= 1 && fadeRun) {
    const run = fadeRun;
    fadeRun = null;
    run();
  }
  if (fade >= 2) {
    fade = 0;
    fadeText = '';
  }
}

function openBoot() {
  const has = !!localStorage.getItem(SAVE_KEY);
  openMenu('boot', `
    <h2>Grow Up</h2>
    <p>You start as a baby on Willow Lane. Eat. Sleep. Play. Grow. School starts at 8:00 AM. As a teen you can leave the house. Grow up, then Oak Street is waiting.</p>
    <div class="menu-actions">
      <button type="button" data-act="new">New life</button>
      ${has ? '<button type="button" data-act="continue">Continue</button>' : ''}
    </div>
  `);
}

function openGender() {
  openMenu('new', `
    <h2>Boy or girl?</h2>
    <p class="muted">This is you. Mom and Dad stay Mom and Dad.</p>
    <div class="menu-actions">
      <button type="button" data-act="gender" data-arg="boy">Boy</button>
      <button type="button" data-act="gender" data-arg="girl">Girl</button>
    </div>
  `);
}

function openNew() {
  const swatches = HAIR.map((c, i) =>
    `<button type="button" class="swatch${i === hairPick ? ' on' : ''}" data-act="hair" data-arg="${i}" style="background:${c}"></button>`
  ).join('');
  openMenu('new', `
    <h2>A baby on Willow Lane</h2>
    <p class="muted">Name on the crib.</p>
    <input id="name-input" type="text" maxlength="12" value="${esc(nameDraft)}" autocomplete="off" spellcheck="false">
    <p class="muted">Hair</p>
    <div class="hair-list">${swatches}</div>
    <div class="menu-actions">
      <button type="button" data-act="start">Wake up</button>
    </div>
  `);
  const input = document.getElementById('name-input');
  input?.addEventListener('input', () => { nameDraft = input.value; });
}

function startLife() {
  state = newState();
  state.name = (nameDraft || 'Remy').trim().slice(0, 12) || 'Remy';
  state.gender = genderPick;
  state.hair = HAIR[hairPick] || HAIR[0];
  state.shirt = genderPick === 'girl' ? '#e07a9a' : '#8ecae6';
  menu = null;
  overlay.classList.add('hidden');
  save();
  openEvent({
    title: `Hello, ${state.name}`,
    body: 'The ceiling is huge. Mom has a bottle. Dad has a face. The crib is your whole country. Grow up. Then the city.',
    choices: [{ label: 'I live here', run: () => showToast('Crawl to Mom. Z does things.') }],
  });
}

function openLife() {
  const rent = state.stage === 'city'
    ? `<div class="row"><span>Rent</span><span class="${state.rentPaid ? 'good' : 'warn'}">${state.rentPaid ? 'Paid' : `Due $${CITY_RENT}`}</span></div>`
    : '';
  openMenu('life', `
    <h2>${esc(state.name)}</h2>
    <p class="muted">${stageLabel()} · age ${state.age} · ${state.stage === 'city' ? 'Harbor City 2A' : 'Willow Lane'}</p>
    <div class="row"><span>Job</span><span>${esc(job().title)}</span></div>
    <div class="row"><span>Money</span><span>$${state.money}</span></div>
    <div class="row"><span>Food</span><span>${state.food}</span></div>
    ${state.stage !== 'city' ? `<div class="row"><span>Growing</span><span>${Math.floor(state.years)}%</span></div>` : ''}
    ${rent}
    <div class="menu-actions">
      <button type="button" class="ghost" data-act="close">Close</button>
    </div>
  `);
}

function openPause() {
  openMenu('pause', `
    <h2>Paused</h2>
    <p class="muted">${state.stage === 'city' ? 'Harbor City will wait a minute.' : 'Willow Lane will wait a minute.'}</p>
    <div class="menu-actions">
      <button type="button" data-act="close">Resume</button>
      <button type="button" data-act="save">Save</button>
      <button type="button" class="alt" data-act="hub">Quit to games</button>
    </div>
  `);
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawLabel(text, x, y) {
  ctx.fillStyle = '#fff8ef';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function drawPerson(x, y, hair, shirt, walk, look, gender, scale) {
  const s = scale || 2;
  const ox = Math.round(x);
  const oy = Math.round(y);
  const step = walk ? Math.floor(walk * 8) % 2 : 0;
  const out = '#201810';
  const skin = '#f3c89a';
  const shade = '#dca070';
  const girl = gender === 'girl';
  const pants = girl ? shadeHex(shirt, 0.85) : '#3a5a86';
  ctx.fillStyle = 'rgba(32,24,16,0.28)';
  ctx.fillRect(ox - 8, oy, 16, 3);
  ctx.save();
  ctx.translate(ox, oy);
  if (look === 'left') ctx.scale(-1, 1);
  const p = (sx, sy, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(sx * s, sy * s, w * s, h * s);
  };
  p(-5, -22, 10, 2, out);
  p(-6, -20, 12, 9, hair);
  p(-4, -18, 8, 7, skin);
  p(-4, -12, 8, 2, shade);
  p(-3, -16, 2, 2, '#fff8f0');
  p(1, -16, 2, 2, '#fff8f0');
  p(-2, -16, 1, 2, out);
  p(2, -16, 1, 2, out);
  p(-5, -11, 10, 8, out);
  p(-4, -10, 8, 7, shirt);
  if (girl) {
    p(-6, -14, 2, 10, hair);
    p(4, -14, 2, 10, hair);
    p(-5, -4, 10, 5, pants);
  }
  p(-4, -3, 3, 4, girl ? skin : pants);
  p(1, -3, 3, 4, girl ? skin : pants);
  p(-4 + (step ? -1 : 0), 1, 3, 2, '#4a3020');
  p(1 + (step ? 1 : 0), 1, 3, 2, '#4a3020');
  ctx.restore();
}

function drawBaby(x, y, hair, shirt) {
  drawRect(x - 10, y - 2, 20, 4, 'rgba(32,24,16,0.25)');
  drawRect(x - 8, y - 10, 16, 10, shirt);
  drawRect(x - 6, y - 20, 12, 12, '#f3c89a');
  drawRect(x - 7, y - 24, 14, 8, hair);
  drawRect(x - 3, y - 16, 2, 2, '#201810');
  drawRect(x + 2, y - 16, 2, 2, '#201810');
}

function youScale() {
  if (state.stage === 'baby') return 1.15;
  if (state.stage === 'kid') return 1.55;
  if (state.stage === 'teen') return 1.85;
  return 2;
}

function drawWoodFloor() {
  drawRect(0, 108, W, H, '#c9a06a');
  for (let y = 120; y < H; y += 16) {
    for (let x = 0; x < W; x += 32) drawRect(x + (y % 32 ? 16 : 0), y, 16, 2, '#b89058');
  }
}

function drawHome() {
  drawRect(0, 0, W, 108, '#f7d6e0');
  for (let x = 0; x < W; x += 24) drawRect(x, 18, 12, 74, '#f3c8d4');
  drawRect(0, 100, W, 8, '#e07a9a');
  drawWoodFloor();
  drawRect(70, 22, 70, 62, '#8ecae6');
  drawRect(76, 28, 58, 50, '#c8e8f4');
  drawRect(200, 156, 90, 70, '#f4ead4');
  drawRect(208, 148, 74, 14, '#e07a9a');
  drawRect(40, 300, 50, 90, '#8b5a32');
  drawRect(46, 308, 38, 50, '#c8e8f4');
  drawRect(680, 148, 40, 70, '#8ecae6');
  drawRect(360, 400, 80, 24, '#6a4428');
  drawLabel('Willow Lane', 400, 36);
  if (state.stage !== 'city') {
    drawPerson(520, 200, '#8b2e1a', '#e07a9a', 0, 'left', 'girl', 2);
    drawLabel('Mom', 520, 154);
    drawPerson(640, 320, '#3b2a1a', '#457b9d', 0, 'left', 'boy', 2);
    drawLabel('Dad', 640, 274);
  }
}

function drawLane() {
  ctx.fillStyle = '#8ecae6';
  ctx.fillRect(0, 0, W, 90);
  drawRect(0, 90, W, H, '#7dce6a');
  drawRect(0, 300, W, 70, '#c4b49a');
  drawRect(40, 200, 90, 110, '#e07a9a');
  drawRect(48, 208, 30, 24, '#8ecae6');
  drawRect(500, 120, 130, 90, '#f0d060');
  drawRect(520, 150, 40, 50, '#6a4428');
  drawRect(240, 180, 70, 40, '#3d9e4a');
  drawRect(660, 240, 90, 80, '#c47838');
  drawLabel('Willow Lane', 400, 36);
  drawLabel('Home', 85, 190);
  drawLabel('School', 565, 112);
  drawLabel('Park', 275, 170);
  if (state.stage === 'teen') drawLabel('Mart', 705, 230);
}

function drawSchool() {
  drawRect(0, 0, W, 108, '#dce8f4');
  drawRect(0, 100, W, 8, '#3a78c8');
  drawWoodFloor();
  drawRect(70, 140, 200, 90, '#3d6b4f');
  drawRect(80, 148, 180, 74, '#2d5540');
  drawRect(240, 220, 120, 56, '#6a4428');
  drawLabel('Willow School', 400, 36);
  drawPerson(560, 180, '#3b2a1a', '#3a78c8', 0, 'left', 'girl', 2);
  drawLabel('Ms. Wren', 560, 134);
}

function drawApt() {
  drawRect(0, 0, W, 108, '#e8dcc8');
  drawRect(0, 100, W, 8, '#5a6e8a');
  drawWoodFloor();
  drawRect(100, 170, 90, 70, '#8b5a32');
  drawRect(40, 300, 50, 90, '#8b5a32');
  drawRect(480, 168, 80, 50, '#6a4428');
  drawRect(680, 148, 40, 70, '#8ecae6');
  drawRect(360, 400, 80, 24, '#6a4428');
  drawLabel('2A Harbor City', 400, 36);
  drawPerson(640, 320, '#d4a017', '#9b5de5', 0, 'left', 'girl', 2);
  drawLabel('Jess', 640, 274);
}

function drawCity() {
  drawRect(0, 0, W, 100, '#5a6e8a');
  drawRect(0, 100, W, H, '#6a6a72');
  drawRect(0, 320, W, 40, '#4a4a52');
  drawRect(40, 160, 80, 160, '#e07a9a');
  drawRect(180, 120, 110, 180, '#c47838');
  drawRect(460, 110, 120, 190, '#3a4a62');
  drawRect(640, 200, 90, 130, '#2a9d8f');
  drawLabel('Harbor Street', 400, 36);
  drawLabel('2A', 80, 150);
  drawLabel('Bean', 235, 110);
  drawLabel('Stackline', 520, 100);
  drawLabel('Market', 685, 190);
}

function drawWork() {
  drawRect(0, 0, W, 108, '#f3d7a8');
  drawRect(0, 100, W, 8, '#c47840');
  drawWoodFloor();
  drawRect(80, 176, 440, 56, '#6a4428');
  drawLabel(state.scene === 'office' ? 'Stackline' : 'Harbor Bean', 400, 36);
  drawPerson(560, 180, '#1a1a1a', state.scene === 'office' ? '#2b2d42' : '#8a4ac8', 0, 'left', state.scene === 'office' ? 'boy' : 'girl', 2);
}

function drawYou() {
  if (state.stage === 'baby') {
    drawBaby(state.x, state.y, state.hair, state.shirt);
    return;
  }
  drawPerson(state.x, state.y, state.hair, state.shirt, state.moving, state.look, state.gender, youScale());
}

function drawJobHud() {
  const g = jobGame;
  if (!g) return;
  drawRect(16, 8, 768, 78, 'rgba(32,24,12,0.82)');
  ctx.fillStyle = '#f0d060';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  if (g.kind === 'school') {
    ctx.fillText('CLASS', 28, 28);
    ctx.fillStyle = '#fff8ef';
    ctx.fillText((g.word || []).join(' '), 28, 50);
    (g.word || []).forEach((ch, i) => {
      drawRect(300 + i * 40, 30, 32, 36, i < g.input.length ? '#3d9e4a' : '#3a78c8');
      ctx.fillStyle = '#fff8ef';
      ctx.textAlign = 'center';
      ctx.fillText(ch, 316 + i * 40, 54);
    });
    return;
  }
  ctx.fillText(g.kind === 'cafe' ? 'RUSH' : 'SHIFT', 28, 28);
  ctx.fillStyle = '#fff8ef';
  ctx.fillText(`SERVED ${g.served}`, 28, 50);
  ctx.fillStyle = '#c47838';
  ctx.fillText(`${Math.ceil(g.time)}s`, 200, 50);
  if (g.kind === 'cafe' && g.order) {
    ctx.fillStyle = '#fff8ef';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText(g.order.want, 300, 28);
    g.order.recipe.forEach((step, i) => {
      drawRect(300 + i * 54, 36, 48, 36, i < g.input.length ? '#3d9e4a' : step.color);
      ctx.fillStyle = step.id === 'milk' && i >= g.input.length ? '#3d2914' : '#fff8ef';
      ctx.textAlign = 'center';
      ctx.fillText(step.label, 324 + i * 54, 58);
    });
  } else if (g.order) {
    ctx.fillStyle = '#fff8ef';
    ctx.fillText(`${g.order.label}  (${g.order.key.toUpperCase()})`, 300, 50);
  }
  if (g.flashT > 0 && g.flash) {
    ctx.fillStyle = '#f0d060';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(g.flash, 400, 150);
  }
}

function drawFade() {
  if (!fade) return;
  const a = fade < 1 ? fade : 2 - fade;
  ctx.fillStyle = `rgba(20,12,8,${clamp(a, 0, 1)})`;
  ctx.fillRect(0, 0, W, H);
  if (fadeText) {
    ctx.fillStyle = '#fff8ef';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fadeText, 400, 240);
  }
}

function render() {
  if (state.scene === 'home') drawHome();
  else if (state.scene === 'lane') drawLane();
  else if (state.scene === 'school') drawSchool();
  else if (state.scene === 'apt') drawApt();
  else if (state.scene === 'city') drawCity();
  else if (state.scene === 'work' || state.scene === 'office') drawWork();
  else drawHome();
  drawYou();
  const h = hourOf(state.minutes);
  if (h >= 20 || h < 6) {
    ctx.fillStyle = 'rgba(20,28,72,0.32)';
    ctx.fillRect(0, 0, W, H);
  } else if (h >= 18) {
    ctx.fillStyle = 'rgba(220,90,40,0.12)';
    ctx.fillRect(0, 0, W, H);
  }
  if (jobGame) drawJobHud();
  drawFade();
}

function drawHud() {
  dayLabel.textContent = `${DAYS[weekday(state.day)]} · Day ${state.day}`;
  timeLabel.textContent = clockText(state.minutes);
  ageLabel.textContent = `${stageLabel()} · ${state.age}`;
  moneyLabel.textContent = `$${state.money}`;
  jobLabel.textContent = job().title;
  document.getElementById('energy-bar').style.width = `${state.energy}%`;
  document.getElementById('hunger-bar').style.width = `${state.hunger}%`;
  document.getElementById('mood-bar').style.width = `${state.mood}%`;
  document.getElementById('hygiene-bar').style.width = `${state.hygiene}%`;
  document.getElementById('grow-bar').style.width = `${state.stage === 'city' ? 100 : state.years}%`;
  const a = nearestAction();
  promptLabel.textContent = a ? `${a.verb} ${a.name}` : '';
  actLabel.textContent = a ? a.verb : 'Do';
  toastLabel.textContent = toast;
}

function loop(t) {
  const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
  lastTime = t;
  updateFade(dt);
  if (jobGame && !menu && !state.dead && !fade) {
    updateJobGame(dt);
  } else if (!menu && !state.dead && !fade) {
    state.minutes += (dt * 60) / secPerHour();
    if (state.minutes >= 24 * 60) {
      state.minutes -= 24 * 60;
      newDay(false);
    }
    updatePlayer(dt);
    updateStats(dt);
    lastGrowCheck += dt;
    if (lastGrowCheck > 1) {
      lastGrowCheck = 0;
      maybeGrowUp();
    }
    saveTimer += dt;
    if (saveTimer > 8) {
      saveTimer = 0;
      save();
    }
  }
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) toast = '';
  }
  render();
  drawHud();
  requestAnimationFrame(loop);
}

overlay.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const act = btn.dataset.act;
  const arg = btn.dataset.arg;
  if (act === 'new') openGender();
  else if (act === 'continue') {
    if (load()) {
      if (state.stage === 'city') {
        showOakStreetPrompt();
        return;
      }
      menu = null;
      overlay.classList.add('hidden');
      showToast(`Welcome back, ${state.name}.`);
    }
  } else if (act === 'gender') {
    genderPick = arg;
    openNew();
  } else if (act === 'hair') {
    hairPick = Number(arg);
    openNew();
  } else if (act === 'start') {
    const input = document.getElementById('name-input');
    if (input) nameDraft = input.value;
    startLife();
  } else if (act === 'close') closeMenu();
  else if (act === 'save') {
    save();
    closeMenu();
    showToast('Saved.');
  }   else if (act === 'hub') {
    location.href = 'index.html';
  } else if (act === 'oak') {
    location.href = 'life.html';
  } else if (act === 'event') {
    const choice = overlay._choices?.[Number(arg)];
    closeMenu();
    if (choice?.run) choice.run();
  }
});

window.addEventListener('keydown', (e) => {
  const typing = e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
  const k = e.key.toLowerCase();
  if (!typing && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (!typing) keys.add(k);
  if (k === 'escape') {
    if (menu === 'pause') closeMenu();
    else if (menu && menu !== 'boot' && menu !== 'new' && menu !== 'end' && menu !== 'event') closeMenu();
    else if (!menu) openPause();
  }
  if (typing) return;
  if (jobGame && e.repeat) return;
  if (jobGame && !fade && handleWorkKey(k)) return;
  if (menu) return;
  if (k === 'e') openLife();
  if (k === 'z' || k === ' ') {
    const a = nearestAction();
    if (a) doAction(a.id);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', (event) => {
  if (menu || state.dead || jobGame || fade) return;
  const rect = canvas.getBoundingClientRect();
  walkTarget = {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
  };
});

document.getElementById('act-btn').addEventListener('click', () => {
  const a = nearestAction();
  if (a) doAction(a.id);
});
document.getElementById('life-btn').addEventListener('click', () => {
  if (!menu) openLife();
});
document.getElementById('pause-btn').addEventListener('click', () => {
  if (!menu) openPause();
  else if (menu === 'pause') closeMenu();
});

function isFullscreen() {
  return document.fullscreenElement === gameContainer
    || document.webkitFullscreenElement === gameContainer;
}
fsBtn.addEventListener('click', async () => {
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else document.webkitExitFullscreen?.();
    } else if (gameContainer.requestFullscreen) {
      await gameContainer.requestFullscreen();
    } else {
      gameContainer.webkitRequestFullscreen?.();
    }
  } catch (err) { /* ignore */ }
});

openBoot();
requestAnimationFrame(loop);
