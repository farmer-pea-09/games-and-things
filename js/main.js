import { CANVAS_W, CANVAS_H } from './constants.js';
import { createWorld } from './world.js';
import { createPlayer, updatePlayer, bindWorld, showMessage } from './player.js';
import { updateEnemies } from './enemies.js';
import { render, renderTitle } from './renderer.js';
import { updateHUD, showPauseMenu, hideOverlay } from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let world;
let player;
const keys = new Set();
let gameStarted = false;

function initGame() {
  world = createWorld();
  player = createPlayer();
  bindWorld(world);
  gameStarted = true;
  player.paused = false;
  hideOverlay();
  showMessage(player, 'Grab bugs and reach the flag vine!');
}

function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  if (!gameStarted) {
    renderTitle(ctx);
    updateHUD({ score: 0, lives: 3, message: '', worldLabel: 'World 1-1' });
  } else {
    if (!player.paused) {
      updatePlayer(player, world, keys);
      updateEnemies(world, player);
    }
    render(ctx, world, player);
    updateHUD(player, world);
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys.add(key);

  if (!gameStarted && (key === ' ' || key === 'enter')) {
    e.preventDefault();
    initGame();
    return;
  }

  if (!gameStarted) return;

  if (key === 'escape') {
    e.preventDefault();
    player.paused = true;
    showPauseMenu(
      () => { player.paused = false; },
      () => {
        gameStarted = false;
        player.paused = false;
        hideOverlay();
      }
    );
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.key.toLowerCase());
});

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target === document.body) e.preventDefault();
});

gameLoop();
