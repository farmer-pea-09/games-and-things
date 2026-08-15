import {
  GRAVITY,
  MAX_FALL,
  WALK_SPEED,
  RUN_SPEED,
  JUMP_FORCE,
  JUMP_CUT,
  FRICTION,
  AIR_FRICTION,
  TONGUE_SPEED,
  TONGUE_MAX_LEN,
  TONGUE_COOLDOWN,
  STARTING_LIVES,
  BUG_VALUE,
  POWER_BUG_VALUE,
  STOMP_BONUS,
  TILE,
} from './constants.js';
import { isSolid, getTile, setTile, isBreakable, TILE_TYPES } from './world.js';

export function createPlayer() {
  return {
    x: 80,
    y: 300,
    w: 26,
    h: 30,
    vx: 0,
    vy: 0,
    onGround: false,
    facing: 1,
    score: 0,
    lives: STARTING_LIVES,
    powered: false,
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
  };
}

export function showMessage(player, msg) {
  player.message = msg;
  player.messageTimer = 120;
}

export function updatePlayer(player, world, keys) {
  if (player.paused || player.won) return;

  if (player.dead) {
    player.respawnTimer--;
    if (player.respawnTimer <= 0) respawnPlayer(player, world);
    return;
  }

  if (player.invincible > 0) player.invincible--;
  if (player.tongueCooldown > 0) player.tongueCooldown--;
  if (player.messageTimer > 0) player.messageTimer--;
  else player.message = '';

  const running = keys.has('shift');
  const speed = running ? RUN_SPEED : WALK_SPEED;

  if (keys.has('arrowleft') || keys.has('a')) {
    player.vx -= running ? 0.6 : 0.45;
    player.facing = -1;
  }
  if (keys.has('arrowright') || keys.has('d')) {
    player.vx += running ? 0.6 : 0.45;
    player.facing = 1;
  }

  player.vx = Math.max(-speed, Math.min(speed, player.vx));
  player.vx *= player.onGround ? FRICTION : AIR_FRICTION;

  if (player.onGround) player.coyote = 6;
  else if (player.coyote > 0) player.coyote--;

  if (keys.has(' ') || keys.has('arrowup') || keys.has('w')) {
    player.jumpBuffer = 6;
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
    }
  }

  if ((keys.has('z') || keys.has('x')) && !player.tongue && player.tongueCooldown <= 0) {
    startTongue(player);
  }

  updateTongue(player, world);

  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, MAX_FALL);

  moveAndCollide(player, world.tiles);

  if (player.y > world.mapH * TILE + 64) {
    hurtPlayer(player, world);
  }

  collectBugs(player, world);
  checkFlag(player, world);

  if (Math.abs(player.vx) > 0.3 || !player.onGround) player.animFrame += 0.2;
}

function moveAndCollide(player, tiles) {
  player.onGround = false;

  player.x += player.vx;
  resolveAxis(player, tiles, 'x');

  player.y += player.vy;
  resolveAxis(player, tiles, 'y');
}

function resolveAxis(player, tiles, axis) {
  const corners = getCollisionPoints(player);
  for (const pt of corners) {
    const tx = Math.floor(pt.x / TILE);
    const ty = Math.floor(pt.y / TILE);
    const tile = getTile(tiles, tx, ty);
    if (!isSolid(tile)) continue;

    if (axis === 'x') {
      if (player.vx > 0) player.x = tx * TILE - player.w - 0.01;
      else if (player.vx < 0) player.x = (tx + 1) * TILE + 0.01;
      player.vx = 0;
    } else {
      if (player.vy > 0) {
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
}

function getCollisionPoints(player) {
  const pad = 2;
  return [
    { x: player.x + pad, y: player.y + pad },
    { x: player.x + player.w - pad, y: player.y + pad },
    { x: player.x + pad, y: player.y + player.h - pad },
    { x: player.x + player.w - pad, y: player.y + player.h - pad },
  ];
}

function hitBlockFromBelow(player, tiles, tx, ty) {
  const tile = getTile(tiles, tx, ty);
  if (tile === TILE_TYPES.QUESTION) {
    setTile(tiles, tx, ty, TILE_TYPES.GROUND);
    worldRef?.questionBlocks?.delete(`${tx},${ty}`);
    player.score += POWER_BUG_VALUE;
    player.powered = true;
    showMessage(player, 'Chameleon power! Stomp harder!');
  } else if (tile === TILE_TYPES.BRICK && player.powered) {
    setTile(tiles, tx, ty, TILE_TYPES.EMPTY);
    player.score += 50;
  }
}

let worldRef = null;
export function bindWorld(world) {
  worldRef = world;
}

function startTongue(player) {
  player.tongue = {
    x: player.x + (player.facing > 0 ? player.w : 0),
    y: player.y + 14,
    len: 0,
    extending: true,
    dir: player.facing,
  };
}

function updateTongue(player, world) {
  if (!player.tongue) return;
  const t = player.tongue;

  if (t.extending) {
    t.len += TONGUE_SPEED;
    if (t.len >= TONGUE_MAX_LEN) t.extending = false;
  } else {
    t.len -= TONGUE_SPEED * 1.4;
    if (t.len <= 0) {
      player.tongue = null;
      player.tongueCooldown = TONGUE_COOLDOWN;
      return;
    }
  }

  const tipX = t.x + t.dir * t.len;
  const tipY = t.y;

  for (const bug of world.bugs) {
    if (bug.collected) continue;
    if (Math.abs(tipX - (bug.x + 8)) < 14 && Math.abs(tipY - (bug.y + 8)) < 14) {
      bug.collected = true;
      player.score += bug.power ? POWER_BUG_VALUE : BUG_VALUE;
      if (bug.power) {
        player.powered = true;
        showMessage(player, 'Super bug! You glow red!');
      }
      t.extending = false;
    }
  }

  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (
      tipX > enemy.x &&
      tipX < enemy.x + enemy.w &&
      tipY > enemy.y &&
      tipY < enemy.y + enemy.h
    ) {
      enemy.alive = false;
      player.score += STOMP_BONUS;
      t.extending = false;
      showMessage(player, 'Tongue zap!');
    }
  }
}

function collectBugs(player, world) {
  for (const bug of world.bugs) {
    if (bug.collected) continue;
    if (
      player.x < bug.x + 16 &&
      player.x + player.w > bug.x &&
      player.y < bug.y + 16 &&
      player.y + player.h > bug.y
    ) {
      bug.collected = true;
      player.score += bug.power ? POWER_BUG_VALUE : BUG_VALUE;
      if (bug.power) player.powered = true;
    }
  }
}

function checkFlag(player, world) {
  if (player.x + player.w > world.flagX && !world.completed) {
    world.completed = true;
    player.won = true;
    player.vx = 0;
    player.vy = 0;
    showMessage(player, 'Level clear! You reached the vine!');
  }
}

export function hurtPlayer(player, world) {
  if (player.invincible > 0 || player.dead) return;

  if (player.powered) {
    player.powered = false;
    player.invincible = 90;
    showMessage(player, 'Lost power-up!');
    return;
  }

  player.lives--;
  player.dead = true;
  player.vx = 0;
  player.vy = -6;
  player.respawnTimer = 90;

  if (player.lives <= 0) {
    showMessage(player, 'Game Over!');
  }
}

function respawnPlayer(player, world) {
  if (player.lives <= 0) {
    Object.assign(player, createPlayer());
    player.lives = STARTING_LIVES;
    player.message = 'Try again!';
    player.messageTimer = 120;
    return;
  }
  player.dead = false;
  player.x = 80;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.invincible = 120;
  player.tongue = null;
}

export function stompEnemy(player, enemy) {
  if (!enemy.alive) return false;
  if (player.vy > 0 && player.y + player.h - enemy.y < 14) {
    enemy.alive = false;
    player.vy = JUMP_FORCE * 0.55;
    player.score += STOMP_BONUS;
    showMessage(player, 'Squish!');
    return true;
  }
  return false;
}
