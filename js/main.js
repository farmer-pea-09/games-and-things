import { CANVAS_W, CANVAS_H, STARTING_LIVES } from './constants.js';
import { createWorld, WORLD_NODES, mapNeighbors, unlockedIds, resolveCamera } from './world.js';
import { createPlayer, updatePlayer, bindWorld, respawnPlayer, triggerEmote } from './player.js';
import { updateEnemies } from './enemies.js';
import { render, renderTitle, renderMap } from './renderer.js';
import { updateHUD, showPauseMenu, showGameOver, showBugShop, hideOverlay } from './ui.js';
import { sfx, startMusic, toggleMute } from './audio.js';
import { showCustomizationPrompt, showCustomizer } from './customizer.js';
import {
  netHost,
  netJoin,
  netBroadcast,
  netStop,
  makeRoomCode,
  inviteUrl,
} from './chameleon-net.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const fullscreenButton = document.getElementById('fullscreen-btn');
const overlay = document.getElementById('overlay');
const overlayContent = document.getElementById('overlay-content');
ctx.imageSmoothingEnabled = false;

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await gameContainer.requestFullscreen();
  } catch {
    if (player) {
      player.message = 'Full screen is not available in this browser.';
      player.messageTimer = 120;
    }
  }
});

document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement ? '× Exit Full Screen' : '⛶ Full Screen';
});

const keys = new Set();
const remoteKeys = new Map();
const remoteCustomizations = new Map();
const peerSlots = new Map();
const activeSlots = new Set();
const SPECIES = ['chameleon', 'skink', 'blue-snake'];
const SPECIES_NAMES = ['Chameleon', 'Skink', 'Blue Snake'];
const EMOTES = [
  { id: 'wave', name: 'Wave', icon: '👋' },
  { id: 'dance', name: 'Happy Dance', icon: '🎵' },
  { id: 'twirl', name: 'Tail Twirl', icon: '🌀' },
];

let mode = 'title';
let world = null;
let player = { score: 0, lives: STARTING_LIVES, coins: 0, message: '', time: 300 };
let players = [player];
let cursorId = '1-1';
let gameOverShown = false;
let shopOpen = false;
let multiplayerRole = null;
let multiplayerCode = '';
let localSlot = 0;
let ownPeerId = '';
let lobbyOpen = false;
let netFrame = 0;
let introPromptOpen = true;

const CUSTOMIZATION_KEY = 'chameleon-world-design';
let savedCustomization = null;
try {
  savedCustomization = JSON.parse(localStorage.getItem(CUSTOMIZATION_KEY) || 'null');
} catch {
  savedCustomization = null;
}

const save = {
  lives: STARTING_LIVES,
  coins: 0,
  score: 0,
  powered: false,
  cleared: new Set(),
  emotes: new Set(),
  accessories: new Set(),
  accessory: null,
  barny: false,
  customization: savedCustomization,
};

function snapshotSave() {
  if (!player || player.lives == null) return;
  save.lives = Math.max(player.lives, 0);
  save.coins = player.coins ?? 0;
  save.score = player.score ?? 0;
  save.powered = !!player.powered;
  save.superJumpReadyAt = player.superJumpReadyAt ?? 0;
  save.accessory = player.accessory ?? save.accessory ?? null;
  save.barny = !!player.barny;
  save.customization = player.customization || save.customization;
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
    barny: save.barny,
    customization: save.customization,
  };
  players = [player];
  hideOverlay();
  gameOverShown = false;
}

function makePlayerForSlot(slot, spawn) {
  const character = createPlayer(save, {
    x: spawn.x + slot * 34,
    y: spawn.y,
  });
  character.slot = slot;
  character.species = SPECIES[slot];
  character.name = SPECIES_NAMES[slot];
  if (remoteCustomizations.has(slot)) character.customization = remoteCustomizations.get(slot);
  bindWorld(character, world);
  return character;
}

function startLevel(id) {
  const barnyBySlot = players.map((character) => !!character?.barny);
  world = createWorld(id);
  if (multiplayerRole === 'host') {
    players = [null, null, null];
    for (const slot of activeSlots) {
      players[slot] = makePlayerForSlot(slot, world.spawn);
      players[slot].barny = barnyBySlot[slot] || players[slot].barny;
      players[slot].ridingBarny = players[slot].barny;
    }
    player = players[0];
  } else {
    player = createPlayer(save, world.spawn);
    player.slot = 0;
    player.species = 'chameleon';
    players = [player];
    bindWorld(player, world);
  }
  mode = 'play';
  hideOverlay();
  lobbyOpen = false;
  gameOverShown = false;
  if (multiplayerRole === 'host') broadcastSnapshot();
}

function completeLevel() {
  snapshotSave();
  const completedId = world.progressId || world.id;
  save.cleared.add(completedId);
  const node = WORLD_NODES.find((entry) => entry.id === completedId);
  if (multiplayerRole === 'host') {
    const next = node?.next.find((id) => id !== 'shop');
    if (next) startLevel(next);
    else showHostLobby('All quests cleared! Play again?');
    return;
  }
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

function openIntroCustomization() {
  introPromptOpen = true;
  showCustomizationPrompt(
    () => {
      showCustomizer(
        save.customization,
        (design) => {
          save.customization = design;
          try {
            localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(design));
          } catch { /* customization still works for this session */ }
          finishIntroCustomization();
        },
        openIntroCustomization
      );
    },
    finishIntroCustomization
  );
}

function finishIntroCustomization() {
  introPromptOpen = false;
  hideOverlay();
  if (inviteCode) {
    startMusic();
    joinRoom(inviteCode);
  }
}

function openEmoteMenu() {
  keys.clear();
  const owned = EMOTES.filter((emote) => player.emotes?.has(emote.id));
  if (multiplayerRole !== 'guest') player.paused = true;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Choose an Emote</h2>
    ${owned.length > 0
      ? `<div class="emote-grid">${owned.map((emote) => `
          <button data-emote="${emote.id}">${emote.icon}<br>${emote.name}</button>
        `).join('')}</div>`
      : '<p class="multi-note">Buy emotes with bugs at the Bug Boutique first!</p>'}
    <button id="close-emotes" class="shop-secondary">Back to game</button>
  `;
  overlayContent.querySelectorAll('[data-emote]').forEach((button) => {
    button.addEventListener('click', () => {
      const emote = button.dataset.emote;
      if (multiplayerRole === 'guest') netBroadcast({ t: 'emote', emote });
      else triggerEmote(player, emote);
      if (multiplayerRole !== 'guest') player.paused = false;
      hideOverlay();
    });
  });
  overlayContent.querySelector('#close-emotes').addEventListener('click', () => {
    if (multiplayerRole !== 'guest') player.paused = false;
    hideOverlay();
  });
}

function activePlayers() {
  return players.filter(Boolean);
}

function startTailContest(characters) {
  const slots = characters.map((character) => character.slot ?? 0);
  world.tailContest = {
    active: true,
    slots,
    turnIndex: 0,
    currentSlot: slots[0],
    meter: 50,
    phase: 'ready',
    timer: 75,
    result: 'Get ready!',
    results: [],
  };
  keys.clear();
  remoteKeys.clear();
  showTailContestOverlay();
  if (multiplayerRole === 'host') broadcastSnapshot();
}

function handleTailTap(slot) {
  const contest = world?.tailContest;
  if (!contest?.active || contest.phase !== 'duel' || contest.currentSlot !== slot) return;
  contest.meter = Math.min(100, contest.meter + 4.5);
  if (contest.meter >= 100) finishTailRound(true);
}

function finishTailRound(won) {
  const contest = world.tailContest;
  if (!contest?.active || contest.phase === 'result') return;
  contest.results.push({ slot: contest.currentSlot, won });
  contest.phase = 'result';
  contest.timer = 100;
  contest.result = won
    ? `${SPECIES_NAMES[contest.currentSlot]} beats Dori!`
    : `Dori outlasts ${SPECIES_NAMES[contest.currentSlot]}!`;
  if (won && players[contest.currentSlot]) players[contest.currentSlot].score += 1000;
}

function updateTailContest() {
  const contest = world?.tailContest;
  if (!contest?.active) return false;
  if (contest.phase === 'ready') {
    contest.timer--;
    if (contest.timer <= 0) {
      contest.phase = 'duel';
      contest.result = 'Tap S! Keep your balance!';
    }
  } else if (contest.phase === 'duel') {
    contest.meter = Math.max(0, contest.meter - 0.32);
    if (contest.meter <= 0) finishTailRound(false);
  } else if (contest.phase === 'result') {
    contest.timer--;
    if (contest.timer <= 0) {
      contest.turnIndex++;
      if (contest.turnIndex >= contest.slots.length) {
        contest.active = false;
        const dori = world.doris?.[0];
        if (dori) {
          dori.completed = true;
          dori.requested = false;
        }
        hideOverlay();
        for (const character of activePlayers()) {
          character.message = 'Tail contest complete!';
          character.messageTimer = 120;
        }
        if (multiplayerRole === 'host') broadcastSnapshot();
        return false;
      }
      contest.currentSlot = contest.slots[contest.turnIndex];
      contest.meter = 50;
      contest.phase = 'ready';
      contest.timer = 75;
      contest.result = `${SPECIES_NAMES[contest.currentSlot]}'s turn!`;
    }
  }
  showTailContestOverlay();
  return true;
}

function showTailContestOverlay() {
  const contest = world?.tailContest;
  if (!contest?.active) return;
  const currentName = SPECIES_NAMES[contest.currentSlot] || `Player ${contest.currentSlot + 1}`;
  const isYourTurn = contest.currentSlot === localSlot;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>🦎 Dori's Tail Contest</h2>
    <p class="multi-note">${currentName} versus Dori</p>
    <div class="tail-meter">
      <div class="tail-dori">DORI</div>
      <div class="tail-fill" style="width:${contest.meter}%"></div>
      <div class="tail-player">P${contest.currentSlot + 1}</div>
    </div>
    <p>${contest.result}</p>
    <p class="${isYourTurn ? 'tail-your-turn' : 'multi-note'}">
      ${isYourTurn && contest.phase === 'duel' ? 'REPEATEDLY TAP S!' : isYourTurn ? 'Get ready to tap S…' : 'Watch this round…'}
    </p>
  `;
}

function updateSkyTransition() {
  const transition = world?.skyTransition;
  if (!transition?.active) return false;
  const characters = activePlayers();

  if (transition.phase === 'stop') {
    for (const character of characters) character.vx = 0;
    transition.timer--;
    if (transition.timer <= 0) {
      transition.phase = 'open';
      transition.timer = 45;
      for (let x = 207; x <= 215; x++) {
        world.tiles[13][x] = 0;
        world.tiles[14][x] = 0;
      }
    }
  } else if (transition.phase === 'open') {
    for (const character of characters) {
      character.vx = 0;
      character.x += (transition.trampolineX - character.x) * 0.12;
    }
    transition.timer--;
    if (transition.timer <= 0) {
      transition.phase = 'bounce';
      transition.timer = 72;
      for (const character of characters) {
        character.x = transition.trampolineX + (character.slot ?? 0) * 22;
        character.y = 13 * 32 - character.h - 22;
        character.vx = 0;
        character.vy = -16;
      }
    }
  } else if (transition.phase === 'bounce') {
    for (const character of characters) {
      character.y += character.vy;
      character.vy += 0.18;
      character.animFrame += 0.3;
    }
    transition.timer--;
    if (transition.timer <= 0) {
      transition.phase = 'fadeOut';
      transition.alpha = 0;
    }
  } else if (transition.phase === 'fadeOut') {
    transition.alpha = Math.min(1, transition.alpha + 0.035);
    if (transition.alpha >= 1) enterCloudKingdom();
  } else if (transition.phase === 'fadeIn') {
    transition.alpha = Math.max(0, transition.alpha - 0.025);
    if (transition.alpha <= 0) {
      transition.active = false;
      for (const character of characters) {
        character.message = 'Welcome to the Cloud Kingdom!';
        character.messageTimer = 150;
      }
      if (multiplayerRole === 'host') broadcastSnapshot();
      return false;
    }
  }

  if (multiplayerRole === 'host') {
    netFrame++;
    if (netFrame % 4 === 0) broadcastSnapshot();
  }
  return true;
}

function enterCloudKingdom() {
  const previousPlayers = activePlayers();
  world = createWorld('1-2-sky');
  world.skyTransition = { active: true, phase: 'fadeIn', timer: 0, alpha: 1 };

  if (multiplayerRole === 'host') {
    players = [null, null, null];
    for (const oldPlayer of previousPlayers) {
      const slot = oldPlayer.slot ?? 0;
      const character = createPlayer(oldPlayer, {
        x: world.spawn.x + slot * 34,
        y: world.spawn.y,
      });
      character.slot = slot;
      character.species = SPECIES[slot];
      character.name = SPECIES_NAMES[slot];
      character.barny = oldPlayer.barny;
      character.ridingBarny = oldPlayer.ridingBarny;
      bindWorld(character, world);
      players[slot] = character;
    }
    player = players[0];
    broadcastSnapshot();
  } else {
    const oldPlayer = previousPlayers[0];
    player = createPlayer(oldPlayer, world.spawn);
    player.slot = 0;
    player.species = 'chameleon';
    player.barny = oldPlayer.barny;
    player.ridingBarny = oldPlayer.ridingBarny;
    bindWorld(player, world);
    players = [player];
  }
}

function updateHostGame() {
  const characters = activePlayers();
  world._players = characters;
  if (updateSkyTransition()) {
    player = players[0];
    return;
  }
  if (world.doris?.some((dori) => dori.requested) && !world.tailContest?.active && !world.doris[0].completed) {
    startTailContest(characters);
  }
  if (updateTailContest()) {
    player = players[0];
    netFrame++;
    if (netFrame % 4 === 0) broadcastSnapshot();
    return;
  }
  if (!world.completed) {
    const sharedWorldUpdater = characters.find((character) => !character.dead) || characters[0];
    for (const character of characters) {
      const input = character.slot === 0 ? keys : (remoteKeys.get(character.slot) || new Set());
      updatePlayer(character, world, input, character === sharedWorldUpdater);
    }
    updateEnemies(world, characters);
    if (world.doris?.some((dori) => dori.requested) && !world.doris[0].completed) {
      startTailContest(characters);
    }
    if (world.completed) {
      for (const character of characters) character.won = true;
    }
  } else {
    for (const character of characters) updatePlayer(character, world, new Set());
  }

  for (const character of characters) {
    if (character.dead && character.respawnTimer <= 0 && character.lives > 0) {
      respawnPlayer(character, world);
    }
  }
  player = players[0];
  netFrame++;
  if (netFrame % 4 === 0) broadcastSnapshot();
}

function updateSinglePlayer() {
  if (updateSkyTransition()) return;
  if (world.doris?.some((dori) => dori.requested) && !world.tailContest?.active && !world.doris[0].completed) {
    startTailContest([player]);
  }
  if (updateTailContest()) return;
  if (!player.paused && !player.won) {
    updatePlayer(player, world, keys);
    updateEnemies(world, player);
    if (world.doris?.some((dori) => dori.requested) && !world.doris[0].completed) {
      startTailContest([player]);
    }
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
    if (multiplayerRole === 'host') updateHostGame();
    else if (multiplayerRole !== 'guest') updateSinglePlayer();

    const visiblePlayers = multiplayerRole ? activePlayers() : [player];
    render(ctx, world, player, visiblePlayers);
    if ((world.skyTransition?.alpha || 0) > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${world.skyTransition.alpha})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    const roomWorld = multiplayerRole
      ? { ...world, worldLabel: `${world.worldLabel} · ${multiplayerCode} · P${localSlot + 1}` }
      : world;
    updateHUD(player, roomWorld);
    if (multiplayerRole === 'guest') {
      if (world.tailContest?.active) showTailContestOverlay();
      else if (overlayContent.querySelector('.tail-meter')) hideOverlay();
    }
  }

  if (multiplayerRole === 'guest' && mode === 'play') {
    netFrame++;
    if (netFrame % 3 === 0) {
      netBroadcast({
        t: 'input',
        keys: [...keys],
        aimX: player?.aimX,
        aimY: player?.aimY,
      });
    }
  }

  requestAnimationFrame(gameLoop);
}

function serializePlayer(character) {
  if (!character) return null;
  const data = { ...character, emotes: [...(character.emotes || [])] };
  delete data._world;
  return data;
}

function serializeWorld() {
  return {
    id: world.id,
    tiles: world.tiles,
    mapW: world.mapW,
    mapH: world.mapH,
    coins: world.coins,
    enemies: world.enemies,
    items: world.items,
    scales: world.scales,
    superOrbs: world.superOrbs,
    barnyEggs: world.barnyEggs,
    doris: world.doris,
    tailContest: world.tailContest,
    skyTransition: world.skyTransition,
    progressId: world.progressId,
    superJumpCooldownMs: world.superJumpCooldownMs,
    jumpMultiplier: world.jumpMultiplier,
    gravityMultiplier: world.gravityMultiplier,
    superJumpForce: world.superJumpForce,
    blockItems: [...world.blockItems.entries()],
    spawn: world.spawn,
    midway: world.midway,
    flagX: world.flagX,
    theme: world.theme,
    worldLabel: world.worldLabel,
    completed: world.completed,
    particles: world.particles,
    bossNest: world.bossNest,
    bossEggs: world.bossEggs,
    buttons: world.buttons,
    carryBricks: world.carryBricks,
    gates: world.gates,
    gateOpen: world.gateOpen,
  };
}

function broadcastSnapshot() {
  if (multiplayerRole !== 'host' || !world) return;
  netBroadcast({
    t: 'snapshot',
    mode,
    code: multiplayerCode,
    players: players.map(serializePlayer),
    world: serializeWorld(),
  });
}

function applySnapshot(message) {
  if (!message.world || !message.players) return;
  world = {
    ...message.world,
    blockItems: new Map(message.world.blockItems || []),
  };
  players = message.players.map((data) => {
    if (!data) return null;
    const character = { ...data, emotes: new Set(data.emotes || []) };
    bindWorld(character, world);
    return character;
  });
  player = players[localSlot] || players.find(Boolean);
  mode = message.mode || 'play';
  if (mode === 'play') {
    if (!world.tailContest?.active) hideOverlay();
    lobbyOpen = false;
  }
}

function assignGuest(peerId) {
  const slot = [1, 2].find((candidate) => !activeSlots.has(candidate));
  if (slot == null) return;
  peerSlots.set(peerId, slot);
  activeSlots.add(slot);
  remoteKeys.set(slot, new Set());
  if (mode === 'play' && world) players[slot] = makePlayerForSlot(slot, world.spawn);
  netBroadcast({ t: 'assign', target: peerId, slot, species: SPECIES[slot], code: multiplayerCode });
  netBroadcast({ t: 'lobby', count: activeSlots.size, code: multiplayerCode });
  if (mode === 'play') broadcastSnapshot();
  else showHostLobby();
}

function handleHostMessage(message) {
  const slot = peerSlots.get(message.id);
  if (slot == null) return;
  if (message.t === 'tailTap') {
    handleTailTap(slot);
    return;
  }
  if (message.t === 'customization') {
    remoteCustomizations.set(slot, message.design || null);
    if (players[slot]) players[slot].customization = message.design || null;
    return;
  }
  if (message.t === 'emote') {
    const character = players[slot];
    if (character) triggerEmote(character, message.emote);
    return;
  }
  if (message.t !== 'input') return;
  const nextInput = new Set(message.keys || []);
  const character = players[slot];
  remoteKeys.set(slot, nextInput);
  if (character) {
    if (Number.isFinite(message.aimX)) character.aimX = message.aimX;
    if (Number.isFinite(message.aimY)) character.aimY = message.aimY;
  }
}

function handleGuestMessage(message) {
  if (message.t === 'welcome') ownPeerId = message.id;
  if (message.t === 'assign' && message.target === ownPeerId) {
    localSlot = message.slot;
    netBroadcast({ t: 'customization', design: save.customization });
    showGuestLobby(`You are Player ${localSlot + 1}: ${SPECIES_NAMES[localSlot]}`);
  } else if (message.t === 'lobby' && lobbyOpen) {
    showGuestLobby(`Room ${message.code} · ${message.count}/3 players`);
  } else if (message.t === 'snapshot') {
    applySnapshot(message);
  }
}

function multiplayerHandlers(role) {
  if (role === 'host') {
    return {
      onMessage: handleHostMessage,
      onJoin: assignGuest,
      onLeave: (peerId) => {
        const slot = peerSlots.get(peerId);
        if (slot != null) {
          peerSlots.delete(peerId);
          activeSlots.delete(slot);
          remoteKeys.delete(slot);
          remoteCustomizations.delete(slot);
          players[slot] = null;
          netBroadcast({ t: 'lobby', count: activeSlots.size, code: multiplayerCode });
          if (lobbyOpen) showHostLobby();
        }
      },
    };
  }
  return {
    onMessage: handleGuestMessage,
    onHostGone: () => leaveMultiplayer('The host left the room.'),
  };
}

function openMultiplayerMenu(message = '') {
  lobbyOpen = true;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Online Co-op</h2>
    <p class="multi-note">Player 1 is the Chameleon, Player 2 is a Skink, and Player 3 is a Blue Snake.</p>
    ${message ? `<p class="multi-error">${message}</p>` : ''}
    <button id="host-room">Create Room</button>
    <div class="join-row">
      <input id="room-input" maxlength="6" placeholder="ROOM CODE" autocomplete="off">
      <button id="join-room">Join Room</button>
    </div>
    <button id="close-multi" class="shop-secondary">Back</button>
  `;
  overlayContent.querySelector('#host-room').addEventListener('click', hostRoom);
  overlayContent.querySelector('#join-room').addEventListener('click', () => {
    const code = overlayContent.querySelector('#room-input').value.trim().toUpperCase();
    if (code.length === 6) joinRoom(code);
    else openMultiplayerMenu('Enter a 6-character room code.');
  });
  overlayContent.querySelector('#close-multi').addEventListener('click', () => {
    lobbyOpen = false;
    hideOverlay();
  });
}

async function hostRoom() {
  const code = makeRoomCode();
  showConnecting('Creating room…');
  try {
    await netHost(code, multiplayerHandlers('host'));
    multiplayerRole = 'host';
    multiplayerCode = code;
    localSlot = 0;
    activeSlots.clear();
    activeSlots.add(0);
    showHostLobby();
  } catch (error) {
    openMultiplayerMenu(error?.message || 'Could not create room.');
  }
}

async function joinRoom(rawCode) {
  const code = rawCode.trim().toUpperCase();
  showConnecting(`Joining ${code}…`);
  try {
    multiplayerRole = 'guest';
    multiplayerCode = code;
    localSlot = 1;
    await netJoin(code, multiplayerHandlers('guest'));
    showGuestLobby('Connected! Waiting for the host to start.');
  } catch (error) {
    multiplayerRole = null;
    multiplayerCode = '';
    openMultiplayerMenu(error?.message || 'Could not join room.');
  }
}

function showConnecting(text) {
  lobbyOpen = true;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `<h2>Online Co-op</h2><p>${text}</p>`;
}

function showHostLobby(status = '') {
  lobbyOpen = true;
  const link = inviteUrl(multiplayerCode);
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Room ${multiplayerCode}</h2>
    <p class="multi-note">${status || `${activeSlots.size}/3 players connected`}</p>
    <p>Share this code or invite link with two friends.</p>
    <button id="copy-invite">Copy Invite Link</button>
    <button id="start-room">Start Game</button>
    <button id="leave-room" class="shop-secondary">Close Room</button>
  `;
  overlayContent.querySelector('#copy-invite').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link);
      overlayContent.querySelector('#copy-invite').textContent = 'Copied!';
    } catch {
      prompt('Copy this invite link:', link);
    }
  });
  overlayContent.querySelector('#start-room').addEventListener('click', () => {
    startMusic();
    startLevel('1-1');
  });
  overlayContent.querySelector('#leave-room').addEventListener('click', () => leaveMultiplayer());
}

function showGuestLobby(status) {
  lobbyOpen = true;
  overlay.classList.remove('hidden');
  overlayContent.innerHTML = `
    <h2>Room ${multiplayerCode}</h2>
    <p class="multi-note">${status}</p>
    <p>The host controls when the quest begins.</p>
    <button id="leave-room" class="shop-secondary">Leave Room</button>
  `;
  overlayContent.querySelector('#leave-room').addEventListener('click', () => leaveMultiplayer());
}

function leaveMultiplayer(message = '') {
  netStop();
  multiplayerRole = null;
  multiplayerCode = '';
  localSlot = 0;
  ownPeerId = '';
  peerSlots.clear();
  activeSlots.clear();
  remoteKeys.clear();
  remoteCustomizations.clear();
  mode = 'title';
  world = null;
  player = { score: 0, lives: STARTING_LIVES, coins: 0, message: '', time: 300 };
  players = [player];
  if (message) openMultiplayerMenu(message);
  else {
    lobbyOpen = false;
    hideOverlay();
  }
}

function moveCursor(dir) {
  const unlocked = unlockedIds(save.cleared);
  const current = WORLD_NODES.find((entry) => entry.id === cursorId);
  const options = mapNeighbors(cursorId).filter((id) => unlocked.has(id));
  let best = null;
  let bestDistance = Infinity;
  for (const id of options) {
    const node = WORLD_NODES.find((entry) => entry.id === id);
    const dx = node.x - current.x;
    if (dir > 0 && dx > 4 && dx < bestDistance) {
      best = id;
      bestDistance = dx;
    }
    if (dir < 0 && dx < -4 && -dx < bestDistance) {
      best = id;
      bestDistance = -dx;
    }
  }
  if (best) cursorId = best;
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);

  if (introPromptOpen) {
    keys.delete(key);
    return;
  }

  if (mode === 'play' && world?.tailContest?.active && key === 's') {
    event.preventDefault();
    keys.delete('s');
    if (!event.repeat) {
      if (multiplayerRole === 'guest') netBroadcast({ t: 'tailTap' });
      else handleTailTap(localSlot);
    }
    return;
  }

  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
  }

  if (key === 'm') {
    event.preventDefault();
    const off = toggleMute();
    if (player) {
      player.message = off ? 'Music muted' : 'Music on';
      player.messageTimer = 90;
    }
    return;
  }

  if (mode === 'title' && key === 'p' && !multiplayerRole) {
    openMultiplayerMenu();
    return;
  }

  if (mode === 'title' && lobbyOpen) return;
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
  if (key === 'e') {
    openEmoteMenu();
    return;
  }
  if (player.won && (key === 'enter' || key === ' ')) {
    if (multiplayerRole !== 'guest') completeLevel();
    return;
  }
  if (key === 'escape') {
    if (multiplayerRole) {
      if (multiplayerRole === 'host') showHostLobby('Game paused by the host.');
      else showGuestLobby('Game continues while this menu is open.');
      return;
    }
    player.paused = true;
    showPauseMenu(
      () => { player.paused = false; },
      goMap
    );
  }
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
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
openIntroCustomization();

const inviteCode = new URLSearchParams(location.search).get('play');
