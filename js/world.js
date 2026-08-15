import { TILE_TYPES } from './constants.js';

// Legend: . empty, # ground, B brick, ? question, P pipe, F flag pole, T flag top, X pit, V vine
const LEVEL_1 = [
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '...........................................................???......................................',
  '..........................................................B#B.......................................',
  '........................???...............................B#B.......................................',
  '.......................B#B#B..............................###.......................................',
  '....................................................................................................',
  '........???.........................................................................................',
  '.......B#B#B..............................................???.......................................',
  '.........................................................B#B#B......................................',
  '....................................................................................................',
  '.............................................................................???..................',
  '............................................................................B#B#B.................',
  '....................................................................................................',
  '....???...........???...............................................................................',
  '...B#B#B.........B#B#B..............................................................................',
  '....................................................................................................',
  '..........................................................................................T.........',
  '..........................................................................................F.........',
  '..........................................................................................F.........',
  '..........................................................................................F.........',
  '..........................................................................................F.........',
  '##########....##########....##########....##########....##########....##########....##########....',
  '##########....##########....##########....##########....##########....##########....##########....',
];

const CHAR_MAP = {
  '.': TILE_TYPES.EMPTY,
  '#': TILE_TYPES.GROUND,
  B: TILE_TYPES.BRICK,
  '?': TILE_TYPES.QUESTION,
  P: TILE_TYPES.PIPE,
  F: TILE_TYPES.FLAG_POLE,
  T: TILE_TYPES.FLAG_TOP,
  X: TILE_TYPES.DEATH,
  V: TILE_TYPES.VINE,
};

export function createWorld(levelIndex = 0) {
  const levelStrings = [LEVEL_1];
  const rows = levelStrings[levelIndex] || LEVEL_1;

  const tiles = rows.map((row) =>
    row.split('').map((ch) => CHAR_MAP[ch] ?? TILE_TYPES.EMPTY)
  );

  const mapW = tiles[0].length;
  const mapH = tiles.length;

  const bugs = [
    { x: 420, y: 0, collected: false },
    { x: 480, y: 0, collected: false },
    { x: 540, y: 0, collected: false },
    { x: 680, y: 0, collected: false },
    { x: 820, y: 0, collected: false },
    { x: 900, y: 0, collected: false },
    { x: 1020, y: 0, collected: false },
    { x: 1180, y: 0, collected: false },
    { x: 1280, y: 0, collected: false },
    { x: 1450, y: 0, collected: false },
    { x: 1580, y: 0, collected: false, power: true },
    { x: 1720, y: 0, collected: false },
    { x: 1850, y: 0, collected: false },
    { x: 2000, y: 0, collected: false },
    { x: 2100, y: 0, collected: false },
    { x: 2250, y: 0, collected: false },
    { x: 2400, y: 0, collected: false },
    { x: 2550, y: 0, collected: false },
  ];

  const enemies = [
    { x: 600, y: 0, w: 28, h: 28, vx: -1.2, alive: true, type: 'beetle' },
    { x: 950, y: 0, w: 28, h: 28, vx: -1.2, alive: true, type: 'beetle' },
    { x: 1300, y: 0, w: 28, h: 28, vx: 1.2, alive: true, type: 'beetle' },
    { x: 1650, y: 0, w: 28, h: 28, vx: -1.5, alive: true, type: 'fly', flyY: 320, flyPhase: 0 },
    { x: 1900, y: 0, w: 28, h: 28, vx: -1.2, alive: true, type: 'beetle' },
    { x: 2200, y: 0, w: 28, h: 28, vx: 1.2, alive: true, type: 'beetle' },
  ];

  const questionBlocks = new Set();
  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      if (tiles[y][x] === TILE_TYPES.QUESTION) {
        questionBlocks.add(`${x},${y}`);
      }
    }
  }

  // Snap bugs and enemies to ground
  for (const bug of bugs) {
    bug.y = findGroundY(tiles, bug.x) - 24;
  }
  for (const enemy of enemies) {
    if (enemy.type === 'fly') {
      enemy.y = enemy.flyY;
    } else {
      enemy.y = findGroundY(tiles, enemy.x) - enemy.h;
    }
  }

  return {
    tiles,
    mapW,
    mapH,
    bugs,
    enemies,
    questionBlocks,
    levelIndex,
    worldLabel: `World ${levelIndex + 1}-1`,
    flagX: findFlagX(tiles),
    completed: false,
  };
}

function findGroundY(tiles, worldX) {
  const tx = Math.floor(worldX / 32);
  for (let y = 0; y < tiles.length; y++) {
    if (isSolid(tiles[y][tx])) return y * 32;
  }
  return (tiles.length - 1) * 32;
}

function findFlagX(tiles) {
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] === TILE_TYPES.FLAG_TOP) return x * 32;
    }
  }
  return tiles[0].length * 32 - 64;
}

export function isSolid(type) {
  return (
    type === TILE_TYPES.GROUND ||
    type === TILE_TYPES.BRICK ||
    type === TILE_TYPES.QUESTION ||
    type === TILE_TYPES.PIPE ||
    type === TILE_TYPES.VINE
  );
}

export function isBreakable(type) {
  return type === TILE_TYPES.BRICK || type === TILE_TYPES.QUESTION;
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

export function getCamera(playerX) {
  let camX = playerX - 400 + 16;
  const maxCam = tilesWidth(tilesFromWorld) - 800;
  camX = Math.max(0, Math.min(camX, maxCam));
  return { camX, camY: 0 };
}

// Helper used after world creation
let tilesFromWorld = null;
export function updateCameraBounds(tiles) {
  tilesFromWorld = tiles;
}

function tilesWidth(tiles) {
  if (!tiles) return 800;
  return tiles[0].length * 32;
}

export function resolveCamera(playerX, mapW) {
  let camX = playerX - 400 + 16;
  camX = Math.max(0, Math.min(camX, mapW * 32 - 800));
  return { camX, camY: 0 };
}
