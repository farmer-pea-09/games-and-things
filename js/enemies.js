import { TILE } from './constants.js';
import { stompEnemy, hurtPlayer } from './player.js';
import { isSolid, getTile } from './world.js';

export function updateEnemies(world, player) {
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (enemy.hurtTimer > 0) enemy.hurtTimer--;

    if (enemy.type === 'fly') {
      enemy.flyPhase += 0.045;
      enemy.y = enemy.flyY + Math.sin(enemy.flyPhase) * 36;
      enemy.x += enemy.vx;
      if (enemy.x < 16 || enemy.x > world.mapW * TILE - 40) enemy.vx *= -1;
    } else if (enemy.type === 'piranha') {
      enemy.phase += 1;
      const hidden = Math.floor(enemy.phase / 70) % 2 === 0;
      enemy.y += hidden ? 0.7 : -0.7;
      enemy.y = Math.max(enemy.homeY - 28, Math.min(enemy.homeY + 24, enemy.y));
      const near = Math.abs(player.x - enemy.x) < 36 && player.y + player.h > enemy.homeY - 10;
      if (near) enemy.y = Math.min(enemy.y + 1.2, enemy.homeY + 24);
    } else if (enemy.type === 'boss') {
      if (enemy.hurtTimer === 0) enemy.x += enemy.vx;
      const wall = getTile(
        world.tiles,
        Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE),
        Math.floor((enemy.y + enemy.h / 2) / TILE)
      );
      if (isSolid(wall) || enemy.x < 16 || enemy.x > world.mapW * TILE - 60) enemy.vx *= -1;
      if (enemy.hurtTimer === 0 && Math.random() < 0.01) enemy.vx *= -1;
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

    if (player.camouflaged || player.dead || player.won) continue;
    if (rects(player, enemy)) {
      if (enemy.type === 'koopa' && enemy.shell && Math.abs(enemy.vx) < 0.4) {
        enemy.vx = (player.facing || 1) * 5.5;
        player.vx = -player.facing * 2;
        continue;
      }
      if (!stompEnemy(player, enemy)) {
        if (enemy.type === 'piranha' && enemy.y > enemy.homeY + 10) continue;
        hurtPlayer(player, world);
      }
    }
  }
}

function rects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
