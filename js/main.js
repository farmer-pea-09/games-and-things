import { CANVAS_W, CANVAS_H, STARTING_LIVES } from './constants.js';
import { createWorld, WORLD_NODES, mapNeighbors, unlockedIds } from './world.js';
import { createPlayer, updatePlayer, bindWorld, respawnPlayer } from './player.js';
import { updateEnemies } from './enemies.js';
import { render, renderTitle, renderMap } from './renderer.js';
import { updateHUD, showPauseMenu, showGameOver, hideOverlay } from './ui.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const keys = new Set();
let mode = 'title';
let world = null;
let player = { score: 0, lives: STARTING_LIVES, coins: 0, message: '', time: 300 };
let cursorId = '1-1';
let gameOverShown = false;

const save = {
  lives: STARTING_LIVES,
  coins: 0,
  score: 0,
  powered: false,
  cleared: new Set(),
};

function snapshotSave() {
  if (!player || player.lives == null) return;
  save.lives = Math.max(player.lives, 0);
  save.coins = player.coins ?? 0;
  save.score = player.score ?? 0;
  save.powered = !!player.powered;
}

function goMap() {
  snapshotSave();
  if (save.lives <= 0) {
    save.lives = STARTING_LIVES;
    save.powered = false;
  }
  mode = 'map';
  player = {
    score: save.score,
    lives: save.lives,
    coins: save.coins,
    message: '',
    time: 300,
  };
  hideOverlay();
  gameOverShown = false;
}

function startLevel(id) {
  world = createWorld(id);
  player = createPlayer(save, world.spawn);
  bindWorld(player, world);
  mode = 'play';
  hideOverlay();
  gameOverShown = false;
}

function completeLevel() {
  snapshotSave();
  save.cleared.add(world.id);
  const node = WORLD_NODES.find((n) => n.id === world.id);
  if (node?.next[0]) cursorId = node.next[0];
  goMap();
}

function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (mode === 'title') {
    renderTitle(ctx);
    updateHUD({ score: 0, lives: STARTING_LIVES, coins: 0, time: 300, message: '' }, { worldLabel: 'Chameleon World' });
  } else if (mode === 'map') {
    renderMap(ctx, save, cursorId);
    updateHUD(player, { worldLabel: 'World Map' });
  } else if (world && player) {
    if (!player.paused && !player.won) {
      updatePlayer(player, world, keys);
      updateEnemies(world, player);
    } else if (player.won) {
      updatePlayer(player, world, keys);
    }

    if (player.dead && player.respawnTimer <= 0) {
      if (player.lives <= 0) {
        if (!gameOverShown) {
          gameOverShown = true;
          showGameOver(goMap);
        }
      } else {
        respawnPlayer(player, world);
      }
    }

    render(ctx, world, player);
    updateHUD(player, world);
  }

  requestAnimationFrame(gameLoop);
}

function moveCursor(dir) {
  const unlocked = unlockedIds(save.cleared);
  const cur = WORLD_NODES.find((n) => n.id === cursorId);
  const options = mapNeighbors(cursorId).filter((id) => unlocked.has(id));
  let best = null;
  let bestDist = Infinity;
  for (const id of options) {
    const node = WORLD_NODES.find((n) => n.id === id);
    const dx = node.x - cur.x;
    if (dir > 0 && dx > 4 && dx < bestDist) {
      best = id;
      bestDist = dx;
    }
    if (dir < 0 && dx < -4 && -dx < bestDist) {
      best = id;
      bestDist = -dx;
    }
  }
  if (best) cursorId = best;
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);

  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    e.preventDefault();
  }

  if (mode === 'title' && (key === ' ' || key === 'enter')) {
    sfx('coin');
    goMap();
    return;
  }

  if (mode === 'map') {
    if (key === 'arrowleft' || key === 'a') moveCursor(-1);
    if (key === 'arrowright' || key === 'd') moveCursor(1);
    if (key === ' ' || key === 'enter') {
      if (unlockedIds(save.cleared).has(cursorId)) startLevel(cursorId);
    }
    return;
  }

  if (mode !== 'play') return;

  if (player.won && (key === 'enter' || key === ' ')) {
    completeLevel();
    return;
  }

  if (key === 'escape') {
    player.paused = true;
    showPauseMenu(
      () => { player.paused = false; },
      goMap
    );
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

gameLoop();
