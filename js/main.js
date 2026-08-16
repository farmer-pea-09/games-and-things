import { CANVAS_W, CANVAS_H, STARTING_LIVES } from './constants.js';
import { createWorld, WORLD_NODES, mapNeighbors, unlockedIds, resolveCamera } from './world.js';
import { createPlayer, updatePlayer, bindWorld, respawnPlayer, triggerEmote } from './player.js';
import { updateEnemies } from './enemies.js';
import { render, renderTitle, renderMap } from './renderer.js';
import { updateHUD, showPauseMenu, showGameOver, showBugShop, hideOverlay } from './ui.js';
import { sfx, startMusic, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const keys = new Set();
let mode = 'title';
let world = null;
let player = { score: 0, lives: STARTING_LIVES, coins: 0, message: '', time: 300 };
let cursorId = '1-1';
let gameOverShown = false;
let shopOpen = false;

const save = {
  lives: STARTING_LIVES,
  coins: 0,
  score: 0,
  powered: false,
  cleared: new Set(),
  emotes: new Set(),
  accessories: new Set(),
  accessory: null,
};

function snapshotSave() {
  if (!player || player.lives == null) return;
  save.lives = Math.max(player.lives, 0);
  save.coins = player.coins ?? 0;
  save.score = player.score ?? 0;
  save.powered = !!player.powered;
  save.superJumpReadyAt = player.superJumpReadyAt ?? 0;
  save.accessory = player.accessory ?? save.accessory ?? null;
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
    superJumpReadyAt: save.superJumpReadyAt ?? 0,
    accessory: save.accessory,
    emotes: new Set(save.emotes),
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

function openShop() {
  shopOpen = true;
  showBugShop(
    save,
    () => {
      player.coins = save.coins;
      player.accessory = save.accessory;
    },
    () => { shopOpen = false; }
  );
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

  if (key === 'm') {
    e.preventDefault();
    const off = toggleMute();
    if (player) {
      player.message = off ? 'Music muted' : 'Music on';
      player.messageTimer = 90;
    }
    return;
  }

  if (mode === 'title' && (key === ' ' || key === 'enter')) {
    startMusic();
    sfx('coin');
    goMap();
    return;
  }

  if (mode === 'map') {
    if (shopOpen) return;
    if (key === 'arrowleft' || key === 'a') moveCursor(-1);
    if (key === 'arrowright' || key === 'd') moveCursor(1);
    if (key === ' ' || key === 'enter') {
      startMusic();
      if (cursorId === 'shop') openShop();
      else if (unlockedIds(save.cleared).has(cursorId)) startLevel(cursorId);
    }
    return;
  }

  if (mode !== 'play') return;

  if (key === '1' || key === '2' || key === '3') {
    triggerEmote(player, key);
    return;
  }

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

canvas.addEventListener('mousemove', (event) => {
  if (mode !== 'play' || !world || !player) return;
  const rect = canvas.getBoundingClientRect();
  const screenX = (event.clientX - rect.left) * canvas.width / rect.width;
  const screenY = (event.clientY - rect.top) * canvas.height / rect.height;
  const { camX, camY } = resolveCamera(player.x, player.y, world.mapW, world.mapH);
  player.aimX = camX + screenX;
  player.aimY = camY + screenY;
});

gameLoop();
