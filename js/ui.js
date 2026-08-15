export function updateHUD(player, world) {
  document.getElementById('score-label').textContent = `🦗 ${player.score ?? 0}`;
  document.getElementById('lives-label').textContent = `💚 × ${player.lives ?? 3}`;
  document.getElementById('world-label').textContent = world?.worldLabel ?? 'World 1-1';
  document.getElementById('message-box').textContent = player.message || '';
}

export function showPauseMenu(onResume, onNewGame) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>⏸ Paused</h2>
    <button id="resume-btn">Resume</button>
    <button id="newgame-btn" style="background:#555;margin-top:8px">New Game</button>
  `;
  content.querySelector('#resume-btn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    onResume();
  });
  content.querySelector('#newgame-btn').addEventListener('click', onNewGame);
}

export function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}
