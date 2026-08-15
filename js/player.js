import {
  GRAVITY,
  MAX_FALL,
  WALK_SPEED,
  RUN_SPEED,
  JUMP_FORCE,
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
  TILE,
  TILE_TYPES,
} from './constants.js';
import { isSolid, isPlatform, isLava, getTile, setTile, spawnBlockItem } from './world.js';
import { sfx } from './audio.js';

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
  };
}

export function showMessage(player, msg) {
  player.message = msg;
  player.messageTimer = 110;
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

  const ducking = (keys.has('arrowdown') || keys.has('s')) && player.onGround;
  const running = keys.has('shift');
  const speed = running ? RUN_SPEED : WALK_SPEED;

  player.camouflaged = ducking && Math.abs(player.vx) < 0.35 && !player.tongue;

  if (!player.camouflaged) {
    if (keys.has('arrowleft') || keys.has('a')) {
      player.vx -= running ? 0.62 : 0.46;
      player.facing = -1;
    }
    if (keys.has('arrowright') || keys.has('d')) {
      player.vx += running ? 0.62 : 0.46;
      player.facing = 1;
    }
  }

  player.vx = Math.max(-speed, Math.min(speed, player.vx));
  player.vx *= player.onGround ? FRICTION : AIR_FRICTION;
  if (Math.abs(player.vx) < 0.08) player.vx = 0;

  if (player.onGround) player.coyote = 7;
  else if (player.coyote > 0) player.coyote--;

  const jumpDown = keys.has(' ') || keys.has('arrowup') || keys.has('w');
  if (jumpDown) {
    player.jumpBuffer = 7;
    player.jumpHeld = true;
  } else {
    player.jumpHeld = false;
    if (player.vy < 0) player.vy *= JUMP_CUT;
  }

  if (player.jumpBuffer > 0) {
    player.jumpBuffer--;
    if ((player.onGround || player.coyote > 0) && player.vy >= 0) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      if (ducking) player.spinning = 22;
      sfx('jump');
    }
  }

  if (player.powered && player.jumpHeld && player.vy > 1.2) {
    player.vy = Math.min(player.vy, GLIDE_FALL);
  }

  if ((keys.has('z') || keys.has('x')) && !player.tongue && player.tongueCooldown <= 0 && !player.camouflaged) {
    startTongue(player);
    sfx('tongue');
  }

  updateTongue(player, world);

  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, MAX_FALL);

  moveAndCollide(player, world);

  if (player.y > world.mapH * TILE + 40) {
    killPlayer(player, world, 'Fell away!');
    return;
  }

  collectPickups(player, world);
  checkMidway(player, world);
  checkGoal(player, world);

  if (Math.abs(player.vx) > 0.3 || !player.onGround) player.animFrame += 0.22;
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
      damageEnemy(player, enemy, true);
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
}

export function stompEnemy(player, enemy) {
  if (!enemy.alive) return false;
  const feet = player.y + player.h;
  if ((player.vy > 0.4 || player.spinning > 0) && feet - enemy.y < 16) {
    damageEnemy(player, enemy, false);
    player.vy = JUMP_FORCE * 0.58;
    return true;
  }
  return false;
}

function damageEnemy(player, enemy, fromTongue) {
  if (enemy.type === 'boss') {
    if (enemy.hurtTimer > 0) return;
    enemy.hp--;
    enemy.hurtTimer = 40;
    player.score += STOMP_BONUS;
    sfx('stomp');
    if (enemy.hp <= 0) {
      enemy.alive = false;
      player.score += 2000;
      showMessage(player, 'Boss down!');
    } else {
      showMessage(player, `${enemy.hp} hits left!`);
    }
    return;
  }

  if (enemy.type === 'koopa' && !enemy.shell) {
    enemy.shell = true;
    enemy.h = 18;
    enemy.y += 12;
    enemy.vx = 0;
    player.score += STOMP_BONUS;
    sfx('stomp');
    showMessage(player, fromTongue ? 'Tongue zap!' : 'Koopa shelled!');
    return;
  }

  if (enemy.type === 'koopa' && enemy.shell) {
    enemy.vx = (player.facing || 1) * 5.5;
    player.score += 100;
    sfx('stomp');
    return;
  }

  enemy.alive = false;
  player.score += STOMP_BONUS;
  sfx('stomp');
  if (fromTongue) showMessage(player, 'Tongue zap!');
}

function overlap(a, b) {
  return a.x < b.x + (b.w || 16) && a.x + a.w > b.x && a.y < b.y + (b.h || 16) && a.y + a.h > b.y;
}
