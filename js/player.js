import {
  GRAVITY,
  MAX_FALL,
  WALK_SPEED,
  RUN_SPEED,
  GROUND_ACCEL,
  AIR_ACCEL,
  JUMP_FORCE,
  AIR_JUMP_FORCE,
  JUMPSQUAT_FRAMES,
  GROUND_POUND_SPEED,
  GROUND_POUND_RADIUS,
  SUPER_JUMP_FORCE,
  SUPER_JUMP_COOLDOWN_MS,
  JUMP_CUT,
  FRICTION,
  AIR_FRICTION,
  GLIDE_FALL,
  TONGUE_SPEED,
  TONGUE_MAX_LEN,
  TONGUE_COOLDOWN,
  COIN_VALUE,
  POWER_VALUE,
  STOMP_BONUS,
  SCALE_VALUE,
  LIFE_COINS,
  STARTING_TIME,
  TAIL_STAND_MS,
  TAIL_STAND_H,
  TILE,
  TILE_TYPES,
} from './constants.js';
import { isSolid, isPlatform, isLava, getTile, setTile, spawnBlockItem } from './world.js';
import { sfx } from './audio.js';

const EMOTE_KEYS = { '1': 'wave', '2': 'dance', '3': 'twirl' };

export function createPlayer(save, spawn) {
  const powered = !!save?.powered;
  return {
    x: spawn?.x ?? 64,
    y: spawn?.y ?? 300,
    w: powered ? 30 : 26,
    h: powered ? 36 : 30,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    score: save?.score ?? 0,
    lives: save?.lives ?? 5,
    coins: save?.coins ?? 0,
    powered,
    invincible: 0,
    dead: false,
    won: false,
    animFrame: 0,
    jumpHeld: false,
    jumpKind: null,
    jumpSquat: 0,
    coyote: 0,
    jumpBuffer: 0,
    tongue: null,
    tongueCooldown: 0,
    message: '',
    messageTimer: 0,
    paused: false,
    respawnTimer: 0,
    camouflaged: false,
    spinning: 0,
    time: STARTING_TIME,
    timeAcc: 0,
    spawnX: spawn?.x ?? 64,
    spawnY: spawn?.y ?? 300,
    clearTimer: 0,
    scales: 0,
    tailStandUntil: 0,
    jumpKeyHeld: false,
    airJumpAvailable: true,
    tailHeld: false,
    superJumpReadyAt: save?.superJumpReadyAt ?? 0,
    superHeld: false,
    superJumping: 0,
    downHeld: false,
    groundPounding: false,
    groundPoundImpact: 0,
    accessory: save?.accessory ?? null,
    emotes: new Set(save?.emotes || []),
    emote: null,
    emoteTimer: 0,
    actionHeld: false,
    heldEgg: null,
    aimX: null,
    aimY: null,
  };
}

export function showMessage(player, msg) {
  player.message = msg;
  player.messageTimer = 110;
}

export function triggerEmote(player, key) {
  const emote = EMOTE_KEYS[key];
  if (!emote) return;
  if (!player.emotes?.has(emote)) {
    showMessage(player, `Buy emote ${key} at the Bug Boutique!`);
    return;
  }
  player.emote = emote;
  player.emoteTimer = 120;
  showMessage(player, emote === 'wave' ? 'Hello!' : emote === 'dance' ? 'Happy dance!' : 'Tail twirl!');
  sfx('coin');
}

export function updatePlayer(player, world, keys) {
  if (player.paused) return;

  if (player.won) {
    player.clearTimer++;
    player.x += 1.4;
    player.animFrame += 0.25;
    return;
  }

  if (player.dead) {
    player.vy += GRAVITY;
    player.y += player.vy;
    player.respawnTimer--;
    return;
  }

  if (player.invincible > 0) player.invincible--;
  if (player.tongueCooldown > 0) player.tongueCooldown--;
  if (player.spinning > 0) player.spinning--;
  if (player.superJumping > 0) player.superJumping--;
  if (player.groundPoundImpact > 0) player.groundPoundImpact--;
  if (player.emoteTimer > 0) {
    player.emoteTimer--;
    if (player.emoteTimer === 0) player.emote = null;
  }
  if (player.messageTimer > 0) player.messageTimer--;
  else player.message = '';

  player.timeAcc++;
  if (player.timeAcc >= 60) {
    player.timeAcc = 0;
    player.time--;
    if (player.time === 100) showMessage(player, 'Hurry!');
    if (player.time <= 0) {
      player.time = 0;
      killPlayer(player, world, 'Time up!');
      return;
    }
  }

  const tailDown = keys.has('s');
  if (tailDown && !player.tailHeld) startTailStand(player);
  player.tailHeld = tailDown;
  updateTailStandSize(player);

  const downDown = keys.has('arrowdown');
  const downPressed = downDown && !player.downHeld;
  player.downHeld = downDown;
  const ducking = downDown && player.onGround && !isTailStanding(player);
  const running = keys.has('a');
  const speed = running ? RUN_SPEED : WALK_SPEED;
  const acceleration = player.onGround ? GROUND_ACCEL : AIR_ACCEL;

  player.camouflaged = ducking && Math.abs(player.vx) < 0.35 && !player.tongue;

  if (!player.camouflaged) {
    if (keys.has('arrowleft')) {
      player.vx -= acceleration * (running ? 1.2 : 1);
      player.facing = -1;
    }
    if (keys.has('arrowright') || keys.has('d')) {
      player.vx += acceleration * (running ? 1.2 : 1);
      player.facing = 1;
    }
  }

  player.vx = Math.max(-speed, Math.min(speed, player.vx));
  player.vx *= player.onGround ? FRICTION : AIR_FRICTION;
  if (Math.abs(player.vx) < 0.08) player.vx = 0;

  if (player.onGround) player.coyote = 7;
  else if (player.coyote > 0) player.coyote--;

  const jumpDown = keys.has(' ') || keys.has('arrowup') || keys.has('w');
  const jumpPressed = jumpDown && !player.jumpKeyHeld;
  const jumpReleased = !jumpDown && player.jumpKeyHeld;
  if (jumpPressed) player.jumpBuffer = 7;
  player.jumpKeyHeld = jumpDown;
  player.jumpHeld = jumpDown;
  if (jumpReleased && player.vy < 0 && player.superJumping <= 0 && player.jumpKind === 'ground') {
    player.vy *= JUMP_CUT;
  }

  const superDown = keys.has('x');
  if (superDown && !player.superHeld) trySuperJump(player);
  player.superHeld = superDown;

  if (player.jumpBuffer > 0) {
    player.jumpBuffer--;
    const canGroundJump = player.onGround || player.coyote > 0;
    const canAirJump = !canGroundJump && player.airJumpAvailable;
    if (canGroundJump && player.jumpSquat <= 0) {
      player.jumpSquat = JUMPSQUAT_FRAMES;
      player.jumpBuffer = 0;
    } else if (canAirJump && player.jumpSquat <= 0) {
      player.vy = AIR_JUMP_FORCE;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.airJumpAvailable = false;
      player.jumpKind = 'air';
      sfx('jump');
    }
  }

  if (player.jumpSquat > 0) {
    player.jumpSquat--;
    player.vx *= 0.92;
    if (player.jumpSquat === 0) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      player.coyote = 0;
      player.jumpKind = 'ground';
      if (ducking) player.spinning = 22;
      sfx('jump');
    }
  }

  if (
    downPressed &&
    !player.onGround &&
    !player.groundPounding &&
    (player.jumpKind || player.superJumping > 0)
  ) {
    player.groundPounding = true;
    player.vx *= 0.35;
    player.vy = GROUND_POUND_SPEED;
    player.tongue = null;
    showMessage(player, 'Ground pound!');
    sfx('bump');
  }

  if (player.powered && !player.groundPounding && player.jumpHeld && player.vy > 1.2) {
    player.vy = Math.min(player.vy, GLIDE_FALL);
  }

  const actionDown = keys.has('z');
  const actionPressed = actionDown && !player.actionHeld;
  player.actionHeld = actionDown;
  if (actionPressed && !player.groundPounding && !player.camouflaged) {
    if (player.heldEgg != null) {
      throwHeldEgg(player, world);
    } else if (!pickUpNestEgg(player, world) && !player.tongue && player.tongueCooldown <= 0) {
      startTongue(player);
      sfx('tongue');
    }
  }

  updateTongue(player, world);

  if (player.groundPounding) {
    player.vx *= 0.82;
    player.vy = GROUND_POUND_SPEED;
  } else {
    player.vy += GRAVITY;
    player.vy = Math.min(player.vy, MAX_FALL);
  }

  moveAndCollide(player, world);
  updateBossEggs(player, world);
  if (player.groundPounding && player.onGround) finishGroundPound(player, world);
  if (player.onGround) {
    player.airJumpAvailable = true;
    player.jumpKind = null;
  }

  if (player.y > world.mapH * TILE + 40) {
    killPlayer(player, world, 'Fell away!');
    return;
  }

  collectPickups(player, world);
  checkMidway(player, world);
  checkGoal(player, world);

  if (Math.abs(player.vx) > 0.3 || !player.onGround || isTailStanding(player)) player.animFrame += 0.22;
}

export function isTailStanding(player) {
  return (player.tailStandUntil || 0) > performance.now();
}

function trySuperJump(player) {
  if (player.dead || player.won || player.paused) return;
  const now = performance.now();
  if (now < (player.superJumpReadyAt || 0)) {
    const wait = Math.ceil((player.superJumpReadyAt - now) / 1000);
    showMessage(player, `Super jump in ${wait}s`);
    return;
  }
  if (!player.onGround && player.coyote <= 0) {
    showMessage(player, 'Super jump needs the ground!');
    return;
  }
  player.vy = SUPER_JUMP_FORCE;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.superJumping = 28;
  player.superJumpReadyAt = now + SUPER_JUMP_COOLDOWN_MS;
  showMessage(player, 'Super jump!');
  sfx('super');
}

function finishGroundPound(player, world) {
  player.groundPounding = false;
  player.groundPoundImpact = 18;
  player.vy = 0;
  player.vx *= 0.25;
  sfx('stomp');

  const center = player.x + player.w / 2;
  const feet = player.y + player.h;
  let eggsSmashed = 0;
  const minX = Math.max(0, Math.floor((center - GROUND_POUND_RADIUS) / TILE));
  const maxX = Math.min(world.mapW - 1, Math.floor((center + GROUND_POUND_RADIUS) / TILE));
  const minY = Math.max(0, Math.floor((feet - 12) / TILE));
  const maxY = Math.min(world.mapH - 1, Math.floor((feet + 42) / TILE));

  for (let ty = minY; ty <= maxY; ty++) {
    for (let tx = minX; tx <= maxX; tx++) {
      if (getTile(world.tiles, tx, ty) !== TILE_TYPES.QUESTION) continue;
      const tileCenter = tx * TILE + TILE / 2;
      if (Math.abs(tileCenter - center) > GROUND_POUND_RADIUS) continue;
      spawnBlockItem(world, tx, ty);
      setTile(world.tiles, tx, ty, TILE_TYPES.EMPTY);
      world.blockItems.delete(`${tx},${ty}`);
      player.score += 50;
      eggsSmashed++;
    }
  }

  showMessage(player, eggsSmashed > 0 ? `Egg smash! ×${eggsSmashed}` : 'BOOM!');

  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    const enemyCenter = enemy.x + enemy.w / 2;
    const enemyFeet = enemy.y + enemy.h;
    if (
      Math.abs(enemyCenter - center) <= GROUND_POUND_RADIUS &&
      Math.abs(enemyFeet - feet) <= 36
    ) {
      damageEnemy(player, enemy, false, center, feet);
    }
  }
}

function startTailStand(player) {
  if (player.dead || player.won) return;
  const already = isTailStanding(player);
  player.tailStandUntil = performance.now() + TAIL_STAND_MS;
  if (!already) {
    const extra = TAIL_STAND_H - player.h;
    player.y -= extra;
    player.h = TAIL_STAND_H;
  }
  showMessage(player, 'Tail stand!');
  sfx('power');
}

function updateTailStandSize(player) {
  const standing = isTailStanding(player);
  const baseH = player.powered ? 36 : 30;
  if (standing && player.h < TAIL_STAND_H) {
    player.y -= TAIL_STAND_H - player.h;
    player.h = TAIL_STAND_H;
  } else if (!standing && player.h > baseH + 1) {
    player.y += player.h - baseH;
    player.h = baseH;
  }
}

function moveAndCollide(player, world) {
  const tiles = world.tiles;
  player.onGround = false;

  player.x += player.vx;
  resolveSolid(player, tiles, 'x');

  const prevY = player.y;
  player.y += player.vy;
  resolveSolid(player, tiles, 'y');
  resolvePlatforms(player, tiles, prevY);
  resolveLava(player, world);
}

function bodyPoints(player) {
  const pad = 3;
  return [
    { x: player.x + pad, y: player.y + pad },
    { x: player.x + player.w - pad, y: player.y + pad },
    { x: player.x + pad, y: player.y + player.h - pad },
    { x: player.x + player.w - pad, y: player.y + player.h - pad },
    { x: player.x + player.w / 2, y: player.y + player.h - pad },
    { x: player.x + player.w / 2, y: player.y + pad },
  ];
}

function resolveSolid(player, tiles, axis) {
  for (const pt of bodyPoints(player)) {
    const tx = Math.floor(pt.x / TILE);
    const ty = Math.floor(pt.y / TILE);
    const tile = getTile(tiles, tx, ty);
    if (!isSolid(tile)) continue;

    if (axis === 'x') {
      if (player.vx > 0) player.x = tx * TILE - player.w - 0.01;
      else if (player.vx < 0) player.x = (tx + 1) * TILE + 0.01;
      player.vx = 0;
    } else if (player.vy > 0) {
      player.y = ty * TILE - player.h - 0.01;
      player.onGround = true;
      player.vy = 0;
    } else if (player.vy < 0) {
      player.y = (ty + 1) * TILE + 0.01;
      player.vy = 0;
      hitBlockFromBelow(player, tiles, tx, ty);
    }
  }
}

function resolvePlatforms(player, tiles, prevY) {
  if (player.vy < 0) return;
  const feet = player.y + player.h;
  const prevFeet = prevY + player.h;
  const xs = [player.x + 4, player.x + player.w / 2, player.x + player.w - 4];
  for (const x of xs) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(feet / TILE);
    if (!isPlatform(getTile(tiles, tx, ty))) continue;
    const top = ty * TILE;
    if (prevFeet <= top + 8 && feet >= top) {
      player.y = top - player.h - 0.01;
      player.onGround = true;
      player.vy = 0;
      return;
    }
  }
}

function resolveLava(player, world) {
  const tx = Math.floor((player.x + player.w / 2) / TILE);
  const ty = Math.floor((player.y + player.h - 2) / TILE);
  if (isLava(getTile(world.tiles, tx, ty))) {
    killPlayer(player, world, 'Lava!');
  }
}

function hitBlockFromBelow(player, tiles, tx, ty) {
  const tile = getTile(tiles, tx, ty);
  const world = player._world;
  if (tile === TILE_TYPES.QUESTION) {
    setTile(tiles, tx, ty, TILE_TYPES.USED);
    if (world) spawnBlockItem(world, tx, ty);
    sfx('bump');
  } else if (tile === TILE_TYPES.BRICK) {
    if (player.powered) {
      setTile(tiles, tx, ty, TILE_TYPES.EMPTY);
      player.score += 50;
      sfx('bump');
    } else {
      sfx('bump');
    }
  }
}

export function bindWorld(player, world) {
  player._world = world;
}

function startTongue(player) {
  player.tongue = {
    x: player.x + (player.facing > 0 ? player.w - 2 : 2),
    y: player.y + 12,
    len: 0,
    extending: true,
    dir: player.facing,
  };
}

function pickUpNestEgg(player, world) {
  let nearest = null;
  let nearestDistance = 48;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  for (const egg of world.bossEggs || []) {
    if (egg.state !== 'nest') continue;
    const distance = Math.hypot(egg.x + egg.w / 2 - cx, egg.y + egg.h / 2 - cy);
    if (distance < nearestDistance) {
      nearest = egg;
      nearestDistance = distance;
    }
  }
  if (!nearest) return false;
  nearest.state = 'held';
  nearest.vx = 0;
  nearest.vy = 0;
  player.heldEgg = nearest.id;
  showMessage(player, 'Egg ready! Press Z to throw.');
  sfx('coin');
  return true;
}

function throwHeldEgg(player, world) {
  const egg = world.bossEggs?.find((entry) => entry.id === player.heldEgg);
  if (!egg) return;
  if (!Number.isFinite(player.aimX) || !Number.isFinite(player.aimY)) {
    showMessage(player, 'Move the cursor to aim first!');
    return;
  }
  player.heldEgg = null;
  egg.state = 'thrown';
  egg.x = player.x + player.w / 2 + player.facing * 10;
  egg.y = player.y + 4;
  const dx = player.aimX - (egg.x + egg.w / 2);
  const dy = player.aimY - (egg.y + egg.h / 2);
  const distance = Math.max(1, Math.hypot(dx, dy));
  const speed = 12;
  egg.vx = dx / distance * speed;
  egg.vy = dy / distance * speed;
  showMessage(player, 'Egg throw!');
  sfx('bump');
}

function updateBossEggs(player, world) {
  for (const egg of world.bossEggs || []) {
    if (egg.state === 'held') {
      egg.x = player.x + player.w / 2 - egg.w / 2;
      egg.y = player.y - egg.h + 3;
      continue;
    }
    if (egg.state === 'respawning') {
      egg.respawnTimer--;
      if (egg.respawnTimer <= 0) {
        egg.state = 'nest';
        egg.x = egg.homeX;
        egg.y = egg.homeY;
      }
      continue;
    }
    if (egg.state !== 'thrown') continue;

    egg.x += egg.vx;
    egg.y += egg.vy;
    egg.vy += 0.3;
    egg.vx *= 0.995;

    const boss = world.enemies.find((enemy) => enemy.type === 'boss' && enemy.alive);
    if (boss && overlap(egg, boss)) {
      stunOwlBoss(player, boss);
      respawnBossEgg(egg);
      continue;
    }

    if (
      egg.y + egg.h >= 13 * TILE ||
      egg.x < 0 ||
      egg.x > world.mapW * TILE
    ) {
      respawnBossEgg(egg);
    }
  }
}

function stunOwlBoss(player, boss) {
  if (boss.state === 'dizzy' || boss.state === 'dizzyFall') return;
  boss.state = 'dizzyFall';
  boss.vy = 2;
  boss.dizzyTimer = 300;
  boss.hurtTimer = 0;
  showMessage(player, 'Direct hit! The owl is dizzy!');
  sfx('stomp');
}

function respawnBossEgg(egg) {
  egg.state = 'respawning';
  egg.respawnTimer = 90;
  egg.vx = 0;
  egg.vy = 0;
}

function updateTongue(player, world) {
  if (!player.tongue) return;
  const t = player.tongue;
  t.x = player.x + (t.dir > 0 ? player.w - 2 : 2);
  t.y = player.y + 12;

  if (t.extending) {
    t.len += TONGUE_SPEED;
    if (t.len >= TONGUE_MAX_LEN) t.extending = false;
  } else {
    t.len -= TONGUE_SPEED * 1.35;
    if (t.len <= 0) {
      player.tongue = null;
      player.tongueCooldown = TONGUE_COOLDOWN;
      return;
    }
  }

  const tipX = t.x + t.dir * t.len;
  const tipY = t.y;

  for (const coin of world.coins) {
    if (coin.collected) continue;
    if (Math.abs(tipX - (coin.x + 8)) < 14 && Math.abs(tipY - (coin.y + 8)) < 14) {
      takeCoin(player, coin);
      t.extending = false;
    }
  }

  for (const item of world.items) {
    if (item.collected) continue;
    if (Math.abs(tipX - (item.x + 10)) < 16 && Math.abs(tipY - (item.y + 10)) < 16) {
      takeItem(player, item);
      t.extending = false;
    }
  }

  for (const scale of world.scales) {
    if (scale.collected) continue;
    if (Math.abs(tipX - (scale.x + 10)) < 16 && Math.abs(tipY - (scale.y + 10)) < 16) {
      takeScale(player, scale);
      t.extending = false;
    }
  }

  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (tipX > enemy.x && tipX < enemy.x + enemy.w && tipY > enemy.y && tipY < enemy.y + enemy.h) {
      damageEnemy(player, enemy, true, tipX, tipY);
      t.extending = false;
    }
  }
}

function collectPickups(player, world) {
  for (const coin of world.coins) {
    if (coin.collected) continue;
    if (coin.pop) {
      coin.y -= 1.6;
      coin.pop--;
      if (coin.pop <= 0) takeCoin(player, coin);
      continue;
    }
    if (overlap(player, coin)) takeCoin(player, coin);
  }

  for (const item of world.items) {
    if (item.collected) continue;
    if (item.rising) {
      item.y += item.vy;
      item.vy += 0.12;
      item.life--;
      if (item.life <= 0) item.rising = false;
    }
    if (overlap(player, item)) takeItem(player, item);
  }

  for (const scale of world.scales) {
    if (!scale.collected && overlap(player, { x: scale.x, y: scale.y, w: 20, h: 20 })) {
      takeScale(player, scale);
    }
  }
}

function takeCoin(player, coin) {
  coin.collected = true;
  player.score += COIN_VALUE;
  player.coins++;
  if (player.coins >= LIFE_COINS) {
    player.coins -= LIFE_COINS;
    player.lives++;
    showMessage(player, '1-UP!');
    sfx('life');
  } else {
    sfx('coin');
  }
}

function takeItem(player, item) {
  item.collected = true;
  if (item.type === 'berry') {
    powerUp(player);
    player.score += POWER_VALUE;
    showMessage(player, 'Super Chameleon! Glide with jump!');
    sfx('power');
  } else if (item.type === 'life') {
    player.lives++;
    player.score += 1000;
    showMessage(player, '1-UP!');
    sfx('life');
  }
}

function takeScale(player, scale) {
  scale.collected = true;
  player.scales++;
  player.score += SCALE_VALUE;
  showMessage(player, `Prism Scale! ${player.scales}/5`);
  sfx('coin');
}

function powerUp(player) {
  if (player.powered) {
    player.score += 500;
    return;
  }
  player.powered = true;
  player.h = 36;
  player.w = 30;
  player.y -= 6;
}

function checkMidway(player, world) {
  if (!world.midway || world.midway.got) return;
  if (player.x + player.w > world.midway.x) {
    world.midway.got = true;
    player.spawnX = world.midway.x;
    player.spawnY = world.midway.y - 8;
    showMessage(player, 'Midway tape!');
    sfx('bump');
  }
}

function checkGoal(player, world) {
  if (world.completed) return;
  if (player.x + player.w > world.flagX + 8) {
    const bossAlive = world.enemies.some((enemy) => enemy.type === 'boss' && enemy.alive);
    if (bossAlive) {
      showMessage(player, 'Defeat the giant owl first!');
      return;
    }
    world.completed = true;
    player.won = true;
    player.vx = 0;
    player.vy = 0;
    player.tongue = null;
    const bonus = player.time * 10;
    player.score += bonus;
    showMessage(player, `Course clear! +${bonus}`);
    sfx('clear');
  }
}

export function hurtPlayer(player, world) {
  if (player.invincible > 0 || player.dead || player.won || player.camouflaged) return;

  if (player.powered) {
    player.powered = false;
    player.w = 26;
    player.h = 30;
    player.invincible = 90;
    showMessage(player, 'Lost a color!');
    sfx('hurt');
    return;
  }

  killPlayer(player, world, 'Ouch!');
}

function killPlayer(player, world, msg) {
  if (player.dead || player.won) return;
  player.lives--;
  player.dead = true;
  player.vx = 0;
  player.vy = -7;
  player.respawnTimer = 80;
  player.tongue = null;
  if (player.heldEgg != null) {
    const egg = world.bossEggs?.find((entry) => entry.id === player.heldEgg);
    if (egg) respawnBossEgg(egg);
    player.heldEgg = null;
  }
  player.tailStandUntil = 0;
  showMessage(player, player.lives <= 0 ? 'Game Over!' : msg);
  sfx('hurt');
}

export function respawnPlayer(player, world) {
  player.dead = false;
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 120;
  player.tongue = null;
  player.powered = false;
  player.w = 26;
  player.h = 30;
  player.time = STARTING_TIME;
  player.tailStandUntil = 0;
  player.superJumping = 0;
  player.airJumpAvailable = true;
  player.jumpSquat = 0;
  player.jumpKind = null;
  player.groundPounding = false;
  player.groundPoundImpact = 0;
}

export function stompEnemy(player, enemy) {
  if (!enemy.alive) return false;
  const feet = player.y + player.h;
  if ((player.vy > 0.4 || player.spinning > 0) && feet - enemy.y < 16) {
    const damaged = damageEnemy(
      player,
      enemy,
      false,
      player.x + player.w / 2,
      feet
    );
    if (!damaged) return false;
    player.vy = JUMP_FORCE * 0.58;
    return true;
  }
  return false;
}

function damageEnemy(player, enemy, fromTongue, hitX = null, hitY = null) {
  if (enemy.type === 'boss') {
    if (enemy.state !== 'dizzy') {
      showMessage(player, 'Throw a nest egg to make the owl dizzy!');
      sfx('bump');
      return false;
    }
    if (enemy.hurtTimer > 0) return true;
    enemy.hp--;
    enemy.hurtTimer = 40;
    enemy.state = 'rise';
    player.score += STOMP_BONUS;
    sfx('stomp');
    if (enemy.hp <= 0) {
      enemy.alive = false;
      player.score += 2000;
      showMessage(player, 'Giant owl defeated!');
    } else {
      showMessage(player, `${enemy.hp} hits left!`);
    }
    return true;
  }

  if (enemy.type === 'koopa' && !enemy.shell) {
    enemy.shell = true;
    enemy.h = 18;
    enemy.y += 12;
    enemy.vx = 0;
    player.score += STOMP_BONUS;
    sfx('stomp');
    showMessage(player, fromTongue ? 'Tongue zap!' : 'Owl tucked!');
    return true;
  }

  if (enemy.type === 'koopa' && enemy.shell) {
    enemy.vx = (player.facing || 1) * 5.5;
    player.score += 100;
    sfx('stomp');
    return true;
  }

  enemy.alive = false;
  player.score += STOMP_BONUS;
  sfx('stomp');
  if (fromTongue) showMessage(player, 'Tongue zap!');
  return true;
}

function overlap(a, b) {
  return a.x < b.x + (b.w || 16) && a.x + a.w > b.x && a.y < b.y + (b.h || 16) && a.y + a.h > b.y;
}
