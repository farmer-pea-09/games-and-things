import { TILE } from './constants.js';
import { stompEnemy, hurtPlayer, showMessage } from './player.js';
import { isSolid, getTile } from './world.js';

export function updateEnemies(world, playerOrPlayers) {
  const players = (Array.isArray(playerOrPlayers) ? playerOrPlayers : [playerOrPlayers]).filter(Boolean);
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (enemy.hurtTimer > 0) enemy.hurtTimer--;

    if (enemy.type === 'fly' || enemy.type === 'pegasus' || enemy.type === 'wingedSnake') {
      enemy.flyPhase += 0.045;
      const amplitude = enemy.type === 'pegasus' ? 24 : 36;
      enemy.y = enemy.flyY + Math.sin(enemy.flyPhase) * amplitude;
      enemy.x += enemy.vx;
      if (enemy.x < 16 || enemy.x > world.mapW * TILE - 40) enemy.vx *= -1;
    } else if (enemy.type === 'spike') {
      // Tree-top spikes are stationary hazards.
    } else if (enemy.type === 'boss') {
      const target = nearestPlayer(enemy, players);
      if (target) {
        if (enemy.variant === 'mummy') updateMummyBoss(enemy, target);
        else updateOwlBoss(enemy, target);
      }
    } else {
      enemy.x += enemy.vx;
      const footTx = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w : 0)) / TILE);
      const footTy = Math.floor((enemy.y + enemy.h + 2) / TILE);
      const ahead = getTile(world.tiles, footTx, footTy);
      const wallTx = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
      const wallTy = Math.floor((enemy.y + enemy.h / 2) / TILE);
      const wall = getTile(world.tiles, wallTx, wallTy);

      if (enemy.type === 'koopa' && enemy.shell && Math.abs(enemy.vx) > 2) {
        if (isSolid(wall)) enemy.vx *= -1;
        for (const other of world.enemies) {
          if (other === enemy || !other.alive) continue;
          if (rects(enemy, other)) {
            other.alive = false;
            player.score += 200;
          }
        }
      } else if (!isSolid(ahead) || isSolid(wall)) {
        if (enemy.type === 'koopa' && enemy.shell) enemy.vx = 0;
        else enemy.vx *= -1;
      }
    }

    for (const player of players) {
      if (player.camouflaged || player.dead || player.won) continue;
      if (enemy.swordHitbox && rects(player, enemy.swordHitbox)) {
        hurtPlayer(player, world);
        continue;
      }
      if (rects(player, enemy)) {
        if (enemy.type === 'spike') {
          hurtPlayer(player, world);
          continue;
        }
        if (enemy.type === 'koopa' && enemy.shell && Math.abs(enemy.vx) < 0.4) {
          enemy.vx = (player.facing || 1) * 5.5;
          player.vx = -player.facing * 2;
          continue;
        }
        if (!stompEnemy(player, enemy)) {
          if (
            enemy.type === 'boss' &&
            (enemy.state === 'dizzy' || enemy.state === 'enrage' || (enemy.variant === 'mummy' && enemy.state === 'search'))
          ) continue;
          hurtPlayer(player, world);
        }
      }
    }
  }
}

function updateMummyBoss(enemy, player) {
  const playerCenter = player.x + player.w / 2;
  const mummyCenter = enemy.x + enemy.w / 2;
  const sword = enemy.sword || (enemy.sword = {
    x: enemy.x,
    y: enemy.floorY + enemy.h - 14,
    w: 52,
    h: 14,
    state: 'sheathed',
    heldBy: null,
    vx: 0,
    vy: 0,
  });
  enemy.swordHitbox = null;
  const rage = enemy.enraged ? 1.5 : 1;
  const meleeTime = enemy.enraged ? 190 : 240;
  const fleeTime = enemy.enraged ? 230 : 360;
  const searchTime = enemy.enraged ? 210 : 300;
  const attackEvery = enemy.enraged ? 68 : 100;
  const swingFrames = enemy.enraged ? 28 : 24;

  if (enemy.state === 'enrage') {
    enemy.stateTimer--;
    enemy.vx = 0;
    enemy.facing = playerCenter >= mummyCenter ? 1 : -1;
    if (enemy.stateTimer <= 0) {
      enemy.state = 'melee';
      enemy.stateTimer = meleeTime;
      enemy.attackTimer = 40;
      showMessage(player, 'The giant mummy is swinging harder!');
    }
    return;
  }

  if (enemy.state === 'melee') {
    enemy.facing = playerCenter >= mummyCenter ? 1 : -1;
    enemy.stateTimer--;
    enemy.attackTimer--;
    enemy.vx = enemy.facing * 1.35 * rage;
    enemy.x += enemy.vx;
    enemy.x = Math.max(enemy.arenaMin, Math.min(enemy.x, enemy.arenaMax - enemy.w));
    if (enemy.attackTimer <= 0) enemy.attackTimer = attackEvery;
    if (enemy.attackTimer < swingFrames) {
      const bladeW = enemy.enraged ? 72 : 54;
      enemy.swordHitbox = {
        x: enemy.facing > 0 ? enemy.x + enemy.w - 2 : enemy.x - bladeW,
        y: enemy.y + (enemy.enraged ? 28 : 20),
        w: bladeW,
        h: enemy.enraged ? 22 : 16,
      };
    }
    if (enemy.stateTimer <= 0) {
      sword.state = 'floor';
      sword.heldBy = null;
      sword.vx = 0;
      sword.vy = 0;
      sword.x = enemy.x + enemy.w / 2 - sword.w / 2;
      sword.y = enemy.floorY + enemy.h - sword.h;
      enemy.state = 'flee';
      enemy.stateTimer = fleeTime;
      enemy.vx = 0;
      showMessage(player, 'He dropped the sword! Grab it with Z!');
    }
    return;
  }

  const swordCenter = sword.x + sword.w / 2;
  const awayFromSword = mummyCenter >= swordCenter ? 1 : -1;

  if (enemy.state === 'flee') {
    enemy.stateTimer--;
    let dir = awayFromSword;
    const atLeft = enemy.x <= enemy.arenaMin + 2;
    const atRight = enemy.x >= enemy.arenaMax - enemy.w - 2;
    if ((dir < 0 && atLeft) || (dir > 0 && atRight)) dir *= -1;
    enemy.facing = dir;
    enemy.vx = dir * 2.55 * rage;
    enemy.x += enemy.vx;
    enemy.x = Math.max(enemy.arenaMin, Math.min(enemy.x, enemy.arenaMax - enemy.w));
    if (sword.state === 'held' || sword.state === 'thrown') {
      enemy.state = 'search';
      enemy.stateTimer = searchTime;
      showMessage(player, 'He is panicking—throw the sword or jump on him!');
      return;
    }
    if (enemy.stateTimer <= 0) {
      enemy.state = 'retrieve';
      showMessage(player, 'The mummy is going back for his sword!');
    }
    return;
  }

  if (enemy.state === 'search') {
    enemy.stateTimer--;
    enemy.facing = awayFromSword;
    enemy.vx = awayFromSword * 2.2 * rage;
    enemy.x += enemy.vx;
    enemy.x = Math.max(enemy.arenaMin, Math.min(enemy.x, enemy.arenaMax - enemy.w));
    if (sword.state === 'sheathed') {
      enemy.state = 'melee';
      enemy.stateTimer = meleeTime;
      enemy.attackTimer = enemy.enraged ? 40 : 70;
      return;
    }
    if (enemy.stateTimer <= 0 && sword.state === 'floor') {
      enemy.state = 'retrieve';
    }
    return;
  }

  if (enemy.state === 'retrieve') {
    if (sword.state === 'held' || sword.state === 'thrown') {
      enemy.state = 'search';
      enemy.stateTimer = searchTime;
      return;
    }
    const towardSword = mummyCenter >= swordCenter ? -1 : 1;
    enemy.facing = towardSword;
    enemy.vx = towardSword * 2.8 * rage;
    enemy.x += enemy.vx;
    enemy.x = Math.max(enemy.arenaMin, Math.min(enemy.x, enemy.arenaMax - enemy.w));
    if (Math.abs(mummyCenter - swordCenter) < 36) {
      sword.state = 'sheathed';
      sword.heldBy = null;
      sword.vx = 0;
      sword.vy = 0;
      enemy.state = 'melee';
      enemy.stateTimer = meleeTime;
      enemy.attackTimer = enemy.enraged ? 40 : 70;
      showMessage(player, 'The mummy snatched his sword back!');
    }
  }
}

function nearestPlayer(enemy, players) {
  let nearest = null;
  let distance = Infinity;
  for (const player of players) {
    if (player.dead || player.won) continue;
    const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
    const nextDistance = Math.abs(dx);
    if (nextDistance < distance) {
      nearest = player;
      distance = nextDistance;
    }
  }
  return nearest;
}

function updateOwlBoss(enemy, player) {
  enemy.phase += 0.06;

  if (enemy.state === 'hover') {
    enemy.diveClock++;
    enemy.x += enemy.vx;
    enemy.y = enemy.homeY + Math.sin(enemy.phase) * 18;
    if (enemy.x <= enemy.arenaMin || enemy.x + enemy.w >= enemy.arenaMax) {
      enemy.vx *= -1;
      enemy.x = Math.max(enemy.arenaMin, Math.min(enemy.x, enemy.arenaMax - enemy.w));
    }
    if (enemy.diveClock >= 180) {
      enemy.diveClock = 0;
      enemy.state = 'dive';
      enemy.diveTargetX = player.x + player.w / 2;
      enemy.vy = 3.5;
      showMessage(player, 'The giant owl is diving!');
    }
  } else if (enemy.state === 'dive') {
    const center = enemy.x + enemy.w / 2;
    const dx = enemy.diveTargetX - center;
    enemy.x += Math.max(-3.2, Math.min(3.2, dx * 0.08));
    enemy.vy = Math.min(enemy.vy + 0.34, 11);
    enemy.y += enemy.vy;
    const floorY = 13 * TILE - enemy.h;
    if (enemy.y >= floorY) {
      enemy.y = floorY;
      enemy.vy = 0;
      enemy.state = 'rise';
    }
  } else if (enemy.state === 'dizzyFall') {
    enemy.vy = Math.min(enemy.vy + 0.38, 10);
    enemy.y += enemy.vy;
    const floorY = 13 * TILE - enemy.h;
    if (enemy.y >= floorY) {
      enemy.y = floorY;
      enemy.vy = 0;
      enemy.state = 'dizzy';
    }
  } else if (enemy.state === 'dizzy') {
    enemy.dizzyTimer--;
    if (enemy.dizzyTimer <= 0) enemy.state = 'rise';
  } else {
    enemy.y -= 3.2;
    enemy.x += enemy.vx * 0.4;
    if (enemy.y <= enemy.homeY) {
      enemy.y = enemy.homeY;
      enemy.state = 'hover';
    }
  }
}

function rects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
