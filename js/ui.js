export function updateHUD(player, world) {
  const score = document.getElementById('score-label');
  const lives = document.getElementById('lives-label');
  const coins = document.getElementById('coins-label');
  const time = document.getElementById('time-label');
  const worldLabel = document.getElementById('world-label');
  const msg = document.getElementById('message-box');

  if (score) score.textContent = `★ ${String(player.score ?? 0).padStart(6, '0')}`;
  if (lives) lives.textContent = `💚 × ${player.lives ?? 5}`;
  if (coins) coins.textContent = `🪙 ${player.coins ?? 0}`;
  if (time) time.textContent = `⏱ ${player.time ?? 300}`;
  if (worldLabel) worldLabel.textContent = world?.worldLabel ?? 'World Map';
  if (msg) msg.textContent = player.message || '';
}

export function showPauseMenu(onResume, onMap) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>Paused</h2>
    <button id="resume-btn">Resume</button>
    <button id="map-btn" style="background:#555;margin-top:8px">World Map</button>
  `;
  content.querySelector('#resume-btn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    onResume();
  });
  content.querySelector('#map-btn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    onMap();
  });
}

export function showGameOver(onMap) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>Game Over</h2>
    <p>The chameleon needs another try.</p>
    <button id="map-btn">World Map</button>
  `;
  content.querySelector('#map-btn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    onMap();
  });
}

export function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}
