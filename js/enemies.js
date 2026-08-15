import { TILE } from './constants.js';
import { stompEnemy, hurtPlayer } from './player.js';
import { isSolid as tileSolid, getTile as getWorldTile } from './world.js';

export function updateEnemies(world, player) {
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;

    if (enemy.type === 'fly') {
      enemy.flyPhase += 0.04;
      enemy.y = enemy.flyY + Math.sin(enemy.flyPhase) * 40;
      enemy.x += enemy.vx;
      if (Math.abs(enemy.x - player.x) < 400) {
        if (enemy.x < player.x) enemy.vx = Math.abs(enemy.vx);
        else enemy.vx = -Math.abs(enemy.vx);
      }
    } else {
      enemy.x += enemy.vx;
      const tx = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w : 0)) / TILE);
      const ty = Math.floor((enemy.y + enemy.h + 2) / TILE);
      const ahead = getWorldTile(world.tiles, tx, ty);
      const wallTx = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.w + 2 : -2)) / TILE);
      const wallTy = Math.floor((enemy.y + enemy.h / 2) / TILE);
      const wall = getWorldTile(world.tiles, wallTx, wallTy);

      if (!tileSolid(ahead) || tileSolid(wall)) {
        enemy.vx *= -1;
      }
    }

    if (rectOverlap(player, enemy)) {
      if (!stompEnemy(player, enemy)) {
        hurtPlayer(player, world);
      }
    }
  }
}

function rectOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
