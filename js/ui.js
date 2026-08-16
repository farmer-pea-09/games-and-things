import { isMuted } from './audio.js';

export const SHOP_ITEMS = [
  { id: 'wave', type: 'emote', name: 'Wave', icon: '👋', price: 8, key: 'E' },
  { id: 'dance', type: 'emote', name: 'Happy Dance', icon: '🎵', price: 15, key: 'E' },
  { id: 'twirl', type: 'emote', name: 'Tail Twirl', icon: '🌀', price: 25, key: 'E' },
  { id: 'flowers', type: 'accessory', name: 'Flower Crown', icon: '🌸', price: 10 },
  { id: 'explorer', type: 'accessory', name: 'Explorer Hat', icon: '🤠', price: 20 },
  { id: 'cape', type: 'accessory', name: 'Golden Cape', icon: '🟨', price: 35 },
];

export function updateHUD(player, world) {
  const score = document.getElementById('score-label');
  const lives = document.getElementById('lives-label');
  const coins = document.getElementById('coins-label');
  const time = document.getElementById('time-label');
  const worldLabel = document.getElementById('world-label');
  const superLabel = document.getElementById('super-label');
  const muteLabel = document.getElementById('mute-label');
  const msg = document.getElementById('message-box');

  if (score) score.textContent = `★ ${String(player.score ?? 0).padStart(6, '0')}`;
  if (lives) lives.textContent = `💚 × ${player.lives ?? 5}`;
  if (coins) coins.textContent = `🦗 ${player.coins ?? 0}`;
  if (time) time.textContent = `⏱ ${player.time ?? 300}`;
  if (worldLabel) worldLabel.textContent = world?.worldLabel ?? 'World Map';
  if (superLabel) {
    const wait = Math.ceil(((player.superJumpReadyAt || 0) - performance.now()) / 1000);
    superLabel.textContent = wait > 0 ? `🚀 ${wait}s` : '🚀 Ready';
  }
  if (muteLabel) muteLabel.textContent = isMuted() ? '🔇 M' : '🔊 M';
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

export function showBugShop(save, onChange, onClose) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');

  function renderShop() {
    const ownedEmotes = save.emotes || new Set();
    const ownedAccessories = save.accessories || new Set();
    const cards = SHOP_ITEMS.map((item) => {
      const owned = item.type === 'emote'
        ? ownedEmotes.has(item.id)
        : ownedAccessories.has(item.id);
      const equipped = item.type === 'accessory' && save.accessory === item.id;
      const action = equipped ? 'Equipped' : owned
        ? (item.type === 'accessory' ? 'Equip' : `Use with ${item.key}`)
        : `${item.price} bugs`;
      return `
        <button class="shop-item ${equipped ? 'equipped' : ''}"
          data-item="${item.id}" ${item.type === 'emote' && owned ? 'disabled' : ''}>
          <span>${item.icon} ${item.name}</span>
          <small>${action}</small>
        </button>
      `;
    }).join('');

    content.innerHTML = `
      <h2>🦗 Bug Boutique</h2>
      <p class="shop-balance">Your bugs: <strong>${save.coins}</strong></p>
      <p class="shop-note">Buy emotes and accessories. Press E during a quest to choose an owned emote.</p>
      <div class="shop-grid">${cards}</div>
      <button id="unequip-btn" class="shop-secondary">Remove accessory</button>
      <button id="close-shop" class="shop-secondary">Back to map</button>
    `;

    content.querySelectorAll('[data-item]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = SHOP_ITEMS.find((entry) => entry.id === button.dataset.item);
        if (!item) return;
        const ownedSet = item.type === 'emote' ? ownedEmotes : ownedAccessories;
        if (!ownedSet.has(item.id)) {
          if (save.coins < item.price) {
            const note = content.querySelector('.shop-note');
            note.textContent = `You need ${item.price - save.coins} more bugs.`;
            return;
          }
          save.coins -= item.price;
          ownedSet.add(item.id);
        }
        if (item.type === 'accessory') save.accessory = item.id;
        onChange();
        renderShop();
      });
    });

    content.querySelector('#unequip-btn').addEventListener('click', () => {
      save.accessory = null;
      onChange();
      renderShop();
    });
    content.querySelector('#close-shop').addEventListener('click', () => {
      overlay.classList.add('hidden');
      onClose();
    });
  }

  renderShop();
}

export function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}
