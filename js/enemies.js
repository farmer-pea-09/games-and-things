import { TILE } from './constants.js';
import { stompEnemy, hurtPlayer, showMessage } from './player.js';
import { isSolid, getTile } from './world.js';

export function updateEnemies(world, playerOrPlayers) {
  const players = (Array.isArray(playerOrPlayers) ? playerOrPlayers : [playerOrPlayers]).filter(Boolean);
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (enemy.hurtTimer > 0) enemy.hurtTimer--;

    if (enemy.type === 'fly') {
      enemy.flyPhase += 0.045;
      enemy.y = enemy.flyY + Math.sin(enemy.flyPhase) * 36;
      enemy.x += enemy.vx;
      if (enemy.x < 16 || enemy.x > world.mapW * TILE - 40) enemy.vx *= -1;
    } else if (enemy.type === 'spike') {
      // Tree-top spikes are stationary hazards.
    } else if (enemy.type === 'boss') {
      const target = nearestPlayer(enemy, players);
      if (target) updateOwlBoss(enemy, target);
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
          if (enemy.type === 'boss' && enemy.state === 'dizzy') continue;
          hurtPlayer(player, world);
        }
      }
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
