import { TILE, TILE_TYPES } from './constants.js';

export const WORLD_NODES = [
  { id: 'shop', name: 'Bug Boutique', x: 70, y: 315, kind: 'shop', next: ['1-1'] },
  { id: '1-1', name: 'Leafy Lane', x: 150, y: 250, kind: 'grass', next: ['1-2'] },
  { id: '1-2', name: 'Canopy Walk', x: 290, y: 210, kind: 'grass', next: ['1-3'] },
  { id: '1-3', name: 'Windy Gulch', x: 430, y: 260, kind: 'athletic', next: ['1-4'] },
  { id: '1-4', name: 'Murk Cavern', x: 560, y: 300, kind: 'cave', next: ['1-castle'] },
  { id: '1-castle', name: 'Thorn Keep', x: 680, y: 230, kind: 'castle', next: [] },
];

const TILE_CHARS = {
  '.': TILE_TYPES.EMPTY,
  '#': TILE_TYPES.GROUND,
  B: TILE_TYPES.BRICK,
  '?': TILE_TYPES.QUESTION,
  '!': TILE_TYPES.QUESTION,
  1: TILE_TYPES.QUESTION,
  P: TILE_TYPES.PIPE,
  G: TILE_TYPES.GOAL,
  '=': TILE_TYPES.PLATFORM,
  L: TILE_TYPES.LAVA,
  C: TILE_TYPES.CASTLE,
  U: TILE_TYPES.USED,
};

const ENTITY_CHARS = {
  S: 'spawn',
  e: 'beetle',
  f: 'fly',
  k: 'koopa',
  n: 'piranha',
  o: 'coin',
  '*': 'berry',
  '+': 'life',
  $: 'scale',
  M: 'midway',
  b: 'boss',
};

const BLOCK_ITEMS = {
  '?': 'coin',
  '!': 'berry',
  1: 'life',
};

function makeLevel(width, paint, theme = 'grass', label = 'World 1-1') {
  const grid = Array.from({ length: 15 }, () => Array(width).fill('.'));

  const put = (x, y, ch) => {
    if (y >= 0 && y < 15 && x >= 0 && x < width) grid[y][x] = ch;
  };
  const fill = (x0, x1, y, ch = '#') => {
    for (let x = x0; x < x1; x++) put(x, y, ch);
  };
  const ground = (x0, x1) => {
    fill(x0, x1, 13, '#');
    fill(x0, x1, 14, '#');
  };
  const pipe = (x, h = 2) => {
    for (let i = 0; i < h; i++) {
      put(x, 12 - i, 'P');
      put(x + 1, 12 - i, 'P');
    }
  };
  const blockRow = (x, y, chars) => {
    for (let i = 0; i < chars.length; i++) put(x + i, y, chars[i]);
  };

  paint({ put, fill, ground, pipe, blockRow, width });
  return { rows: grid.map((r) => r.join('')), theme, label, width };
}

function level11() {
  return makeLevel(132, ({ put, fill, ground, pipe, blockRow }) => {
    ground(0, 27);
    ground(30, 75);
    ground(78, 132);

    put(3, 12, 'S');
    blockRow(10, 9, '?!?');
    blockRow(10, 10, 'BBB');
    put(16, 8, 'o');
    put(17, 7, 'o');
    put(18, 8, 'o');

    put(36, 12, 'e');
    pipe(42, 2);
    put(42, 10, 'n');

    blockRow(52, 8, '???');
    put(58, 12, 'e');
    put(63, 12, 'k');

    put(68, 12, 'M');
    put(69, 9, '$');

    fill(84, 90, 11, '=');
    put(85, 9, 'o');
    put(86, 9, 'o');
    put(87, 9, '*');
    put(92, 12, 'e');

    pipe(98, 3);
    blockRow(108, 7, '!??');
    put(114, 12, 'e');
    put(118, 8, 'f');

    put(126, 10, 'G');
    put(126, 11, 'G');
    put(126, 12, 'G');
  }, 'grass', '1-1 Leafy Lane');
}

function level12() {
  return makeLevel(148, ({ put, fill, ground, pipe, blockRow }) => {
    ground(0, 18);
    ground(128, 148);

    put(3, 12, 'S');
    blockRow(8, 9, '??');

    fill(20, 28, 11, '=');
    put(22, 9, 'o');
    put(23, 9, 'o');
    put(24, 9, 'o');
    put(26, 10, 'e');

    fill(32, 40, 8, '=');
    put(34, 6, 'o');
    put(35, 6, '$');
    put(36, 6, 'o');
    put(38, 4, 'f');

    fill(46, 54, 10, '=');
    put(48, 9, 'k');
    blockRow(48, 6, '?!?');

    fill(60, 68, 7, '=');
    put(62, 5, 'o');
    put(63, 5, 'o');
    put(64, 5, 'o');
    put(66, 3, 'f');

    fill(72, 80, 11, '=');
    put(74, 10, 'M');
    put(76, 8, '*');

    fill(86, 96, 9, '=');
    put(88, 8, 'e');
    put(92, 6, 'o');
    put(93, 5, 'o');
    put(94, 6, 'o');

    fill(102, 112, 6, '=');
    put(104, 4, 'o');
    put(106, 2, 'f');
    put(108, 4, '+');

    fill(116, 126, 10, '=');
    pipe(130, 2);
    put(130, 10, 'n');
    put(136, 12, 'e');

    put(144, 10, 'G');
    put(144, 11, 'G');
    put(144, 12, 'G');
  }, 'grass', '1-2 Canopy Walk');
}

function level13() {
  return makeLevel(140, ({ put, fill, ground, pipe, blockRow }) => {
    ground(0, 18);
    ground(22, 40);
    ground(50, 64);
    fill(42, 48, 11, '=');
    ground(76, 92);
    fill(66, 74, 9, '=');
    ground(104, 140);
    fill(94, 102, 8, '=');

    put(3, 12, 'S');
    blockRow(7, 9, '??');
    put(12, 12, 'e');

    put(26, 12, 'k');
    fill(30, 36, 10, '=');
    put(32, 8, 'o');
    put(33, 8, 'o');
    put(34, 8, 'o');

    put(54, 12, 'e');
    put(58, 12, 'e');
    blockRow(54, 8, '!??');
    put(60, 12, 'M');
    put(61, 9, '$');

    put(68, 6, 'f');
    put(70, 7, 'o');

    put(80, 12, 'k');
    pipe(86, 2);
    put(86, 10, 'n');

    put(96, 6, 'o');
    put(97, 5, '*');
    put(98, 6, 'o');
    put(100, 4, 'f');

    put(110, 12, 'e');
    put(116, 12, 'k');
    blockRow(120, 8, '???');
    put(128, 12, 'e');

    put(136, 10, 'G');
    put(136, 11, 'G');
    put(136, 12, 'G');
  }, 'athletic', '1-3 Windy Gulch');
}

function level14() {
  return makeLevel(136, ({ put, fill, ground, pipe, blockRow }) => {
    ground(0, 20);
    fill(20, 32, 14, 'L');
    ground(32, 50);
    fill(50, 62, 14, 'L');
    ground(62, 88);
    fill(88, 100, 14, 'L');
    ground(100, 136);

    put(3, 12, 'S');
    blockRow(8, 9, 'B?B');
    put(14, 12, 'e');

    fill(22, 30, 11, '=');
    put(24, 9, 'o');
    put(25, 9, 'o');
    put(26, 9, 'o');
    put(28, 8, 'f');

    put(36, 12, 'k');
    blockRow(40, 8, '!?');
    put(46, 12, 'e');

    fill(52, 60, 10, '=');
    put(54, 8, 'o');
    put(55, 7, '$');
    put(56, 8, 'o');

    put(66, 12, 'M');
    pipe(72, 2);
    put(72, 10, 'n');
    put(78, 12, 'e');
    blockRow(80, 8, 'BBB');
    put(81, 8, '1');

    fill(90, 98, 9, '=');
    put(92, 7, 'o');
    put(93, 7, '*');
    put(94, 7, 'o');
    put(96, 5, 'f');

    put(106, 12, 'k');
    put(112, 12, 'e');
    fill(116, 122, 11, '=');
    put(118, 9, 'o');
    put(124, 12, 'e');

    put(132, 10, 'G');
    put(132, 11, 'G');
    put(132, 12, 'G');
  }, 'cave', '1-4 Murk Cavern');
}

function levelCastle() {
  return makeLevel(124, ({ put, fill, ground, pipe, blockRow }) => {
    ground(0, 18);
    fill(18, 28, 14, 'L');
    ground(28, 48);
    fill(48, 58, 14, 'L');
    ground(58, 86);
    fill(86, 96, 14, 'L');
    ground(96, 124);

    for (let x = 0; x < 8; x++) {
      put(x, 0, 'C');
      put(x, 1, 'C');
    }

    put(3, 12, 'S');
    blockRow(8, 9, 'B!B');
    put(12, 12, 'e');
    pipe(14, 3);
    put(14, 9, 'n');

    fill(20, 26, 11, '=');
    put(22, 9, 'o');
    put(23, 9, 'o');

    put(32, 12, 'k');
    put(36, 12, 'k');
    blockRow(38, 8, '???');
    put(44, 12, 'e');

    fill(50, 56, 10, '=');
    put(52, 8, '$');
    put(54, 6, 'f');

    put(62, 12, 'M');
    pipe(68, 2);
    put(68, 10, 'n');
    blockRow(74, 8, 'BBB');
    put(75, 8, '!');
    put(80, 12, 'e');

    fill(88, 94, 9, '=');
    put(90, 7, '*');

    put(102, 12, 'b');
    put(108, 8, '+');

    put(118, 10, 'G');
    put(118, 11, 'G');
    put(118, 12, 'G');
    put(120, 8, 'C');
    put(120, 9, 'C');
    put(120, 10, 'C');
    put(120, 11, 'C');
    put(120, 12, 'C');
    put(121, 8, 'C');
    put(121, 9, 'C');
    put(121, 10, 'C');
    put(121, 11, 'C');
    put(121, 12, 'C');
  }, 'castle', 'Castle Thorn Keep');
}

const LEVELS = {
  '1-1': level11,
  '1-2': level12,
  '1-3': level13,
  '1-4': level14,
  '1-castle': levelCastle,
};

export function createWorld(levelId = '1-1') {
  const factory = LEVELS[levelId] || level11;
  const { rows, theme, label, width } = factory();

  const tiles = [];
  const coins = [];
  const enemies = [];
  const items = [];
  const blockItems = new Map();
  let spawn = { x: 64, y: 300 };
  let midway = null;
  let flagX = (width - 6) * TILE;
  const scales = [];
  const bossNest = levelId === '1-castle'
    ? { x: 97 * TILE, y: 13 * TILE - 13, w: 66, h: 13 }
    : null;
  const bossEggs = bossNest
    ? [0, 1, 2].map((id) => ({
        id,
        x: bossNest.x + 12 + id * 20,
        y: bossNest.y - 18,
        homeX: bossNest.x + 12 + id * 20,
        homeY: bossNest.y - 18,
        w: 15,
        h: 19,
        vx: 0,
        vy: 0,
        state: 'nest',
        respawnTimer: 0,
      }))
    : [];

  for (let y = 0; y < rows.length; y++) {
    tiles[y] = [];
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ENTITY_CHARS[ch]) {
        tiles[y][x] = TILE_TYPES.EMPTY;
        const kind = ENTITY_CHARS[ch];
        const px = x * TILE;
        const py = y * TILE;
        if (kind === 'spawn') spawn = { x: px, y: py - 4 };
        else if (kind === 'midway') midway = { x: px, y: py };
        else if (kind === 'coin') coins.push(makeCoin(px, py));
        else if (kind === 'berry') items.push(makeItem(px, py, 'berry', true));
        else if (kind === 'life') items.push(makeItem(px, py, 'life', true));
        else if (kind === 'scale') scales.push({ x: px, y: py, collected: false });
        else enemies.push(makeEnemy(kind, px, py));
      } else {
        tiles[y][x] = TILE_CHARS[ch] ?? TILE_TYPES.EMPTY;
        if (BLOCK_ITEMS[ch]) blockItems.set(`${x},${y}`, BLOCK_ITEMS[ch]);
        if (ch === 'G') flagX = x * TILE;
      }
    }
  }

  spawn.y = findGroundY(tiles, spawn.x + 8, spawn.y) - 32;
  for (const enemy of enemies) {
    if (enemy.type === 'fly' || enemy.type === 'piranha' || enemy.type === 'boss') continue;
    enemy.y = findGroundY(tiles, enemy.x + enemy.w / 2, enemy.y) - enemy.h;
  }
  if (midway) midway.y = findGroundY(tiles, midway.x + 8, midway.y) - 8;

  return {
    id: levelId,
    tiles,
    mapW: width,
    mapH: rows.length,
    coins,
    enemies,
    items,
    scales,
    blockItems,
    spawn,
    midway,
    flagX,
    theme,
    worldLabel: label,
    completed: false,
    particles: [],
    bossNest,
    bossEggs,
  };
}

function makeCoin(x, y) {
  return { x, y, w: 16, h: 16, collected: false };
}

function makeItem(x, y, type, floating = false) {
  return {
    x,
    y,
    w: 20,
    h: 20,
    type,
    vy: floating ? 0 : -3.2,
    rising: !floating,
    life: floating ? 9999 : 40,
    collected: false,
  };
}

function makeEnemy(kind, x, y) {
  if (kind === 'fly') {
    return { x, y, w: 28, h: 24, vx: -1.1, alive: true, type: 'fly', flyY: y, flyPhase: 0 };
  }
  if (kind === 'koopa') {
    return { x, y, w: 28, h: 30, vx: -0.9, alive: true, type: 'koopa', shell: false };
  }
  if (kind === 'piranha') {
    return {
      x,
      y: y + 8,
      w: 24,
      h: 28,
      vx: 0,
      alive: true,
      type: 'piranha',
      homeY: y + 8,
      phase: 0,
    };
  }
  if (kind === 'boss') {
    return {
      x,
      y: 150,
      w: 72,
      h: 58,
      vx: 1,
      vy: 0,
      alive: true,
      type: 'boss',
      hp: 3,
      hurtTimer: 0,
      state: 'hover',
      homeY: 150,
      phase: 0,
      diveClock: 0,
      diveTargetX: x,
      arenaMin: x - 96,
      arenaMax: x + 400,
    };
  }
  return { x, y, w: 28, h: 26, vx: -1.15, alive: true, type: 'beetle' };
}

export function spawnBlockItem(world, tx, ty) {
  const key = `${tx},${ty}`;
  const type = world.blockItems.get(key) || 'coin';
  const x = tx * TILE + 6;
  const y = ty * TILE - 20;
  if (type === 'coin') {
    world.coins.push({ x, y: y + 4, w: 16, h: 16, collected: false, pop: 18 });
  } else {
    world.items.push(makeItem(x, y, type, false));
  }
}

function findGroundY(tiles, worldX, fromY = 0) {
  const tx = Math.floor(worldX / TILE);
  const start = Math.max(0, Math.floor(fromY / TILE));
  for (let y = start; y < tiles.length; y++) {
    if (isSolid(tiles[y][tx])) return y * TILE;
  }
  return (tiles.length - 1) * TILE;
}

export function isSolid(type) {
  return (
    type === TILE_TYPES.GROUND ||
    type === TILE_TYPES.BRICK ||
    type === TILE_TYPES.QUESTION ||
    type === TILE_TYPES.PIPE ||
    type === TILE_TYPES.USED ||
    type === TILE_TYPES.CASTLE
  );
}

export function isPlatform(type) {
  return type === TILE_TYPES.PLATFORM;
}

export function isLava(type) {
  return type === TILE_TYPES.LAVA;
}

export function getTile(tiles, tx, ty) {
  if (ty < 0 || ty >= tiles.length || tx < 0 || tx >= tiles[0].length) {
    return TILE_TYPES.EMPTY;
  }
  return tiles[ty][tx];
}

export function setTile(tiles, tx, ty, type) {
  if (ty >= 0 && ty < tiles.length && tx >= 0 && tx < tiles[0].length) {
    tiles[ty][tx] = type;
  }
}

export function resolveCamera(playerX, playerY, mapW, mapH) {
  let camX = playerX - CANVAS_CENTER_X;
  let camY = playerY - 280;
  camX = Math.max(0, Math.min(camX, mapW * TILE - 800));
  camY = Math.max(0, Math.min(camY, mapH * TILE - 480));
  return { camX, camY };
}

const CANVAS_CENTER_X = 360;

export function mapNeighbors(nodeId) {
  const node = WORLD_NODES.find((n) => n.id === nodeId);
  const ids = new Set(node?.next || []);
  for (const other of WORLD_NODES) {
    if (other.next.includes(nodeId)) ids.add(other.id);
  }
  return [...ids];
}

export function unlockedIds(cleared) {
  const open = new Set(['shop', '1-1']);
  for (const id of cleared) {
    const node = WORLD_NODES.find((n) => n.id === id);
    node?.next.forEach((n) => open.add(n));
    open.add(id);
  }
  return open;
}
