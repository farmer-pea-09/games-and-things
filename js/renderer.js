import { TILE, TILE_TYPES, CANVAS_W, CANVAS_H, COLORS } from './constants.js';
import { resolveCamera } from './world.js';

export function render(ctx, world, player) {
  const { camX, camY } = resolveCamera(player.x, world.mapW);

  drawBackground(ctx, camX);

  const startX = Math.floor(camX / TILE);
  const startY = 0;
  const endX = Math.min(world.mapW, startX + Math.ceil(CANVAS_W / TILE) + 1);
  const endY = world.mapH;

  for (let y = startY; y < endY; y++) {
    for (let x = Math.max(0, startX); x < endX; x++) {
      drawTile(ctx, world, x, y, camX, camY);
    }
  }

  for (const bug of world.bugs) {
    if (!bug.collected) drawBug(ctx, bug, camX, camY);
  }

  for (const enemy of world.enemies) {
    if (enemy.alive) drawEnemy(ctx, enemy, camX, camY);
  }

  if (!player.dead || Math.floor(Date.now() / 100) % 2 === 0) {
    drawChameleon(ctx, player, camX, camY);
  }

  if (player.tongue) drawTongue(ctx, player.tongue, camX, camY);

  if (player.won) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL CLEAR!', CANVAS_W / 2, CANVAS_H / 2);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${player.score}`, CANVAS_W / 2, CANVAS_H / 2 + 40);
    ctx.textAlign = 'left';
  }
}

function drawBackground(ctx, camX) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, '#87ceeb');
  grad.addColorStop(0.55, '#b7e4c7');
  grad.addColorStop(1, '#40916c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Parallax hills
  ctx.fillStyle = '#2d6a4f';
  for (let i = 0; i < 6; i++) {
    const hx = ((i * 200 - camX * 0.2) % (CANVAS_W + 200)) - 100;
    ctx.beginPath();
    ctx.ellipse(hx, 380, 120, 60, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 260 - camX * 0.08) % (CANVAS_W + 200)) - 50;
    drawCloud(ctx, cx, 60 + (i % 2) * 30);
  }
}

function drawCloud(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 20, y - 4, 14, 0, Math.PI * 2);
  ctx.arc(x + 38, y, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawTile(ctx, world, x, y, camX, camY) {
  const type = world.tiles[y][x];
  const sx = x * TILE - camX;
  const sy = y * TILE - camY;

  if (type === TILE_TYPES.EMPTY) return;

  if (type === TILE_TYPES.GROUND) {
    ctx.fillStyle = '#5a3e2b';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#52b788';
    ctx.fillRect(sx, sy, TILE, 10);
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(sx + 4, sy + 14, 6, 6);
    ctx.fillRect(sx + 18, sy + 20, 5, 5);
  } else if (type === TILE_TYPES.BRICK) {
    ctx.fillStyle = '#c1440e';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#e85d04';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, 12);
    ctx.fillRect(sx + 2, sy + 18, TILE - 4, 12);
    ctx.strokeStyle = '#9c3d0a';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
  } else if (type === TILE_TYPES.QUESTION) {
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#fb8500';
    ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', sx + TILE / 2, sy + TILE / 2 + 5);
    ctx.textAlign = 'left';
  } else if (type === TILE_TYPES.PIPE) {
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(sx + 4, sy, TILE - 8, TILE);
    ctx.fillStyle = '#40916c';
    ctx.fillRect(sx, sy, TILE, 10);
  } else if (type === TILE_TYPES.FLAG_POLE) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 14, sy, 4, TILE);
  } else if (type === TILE_TYPES.FLAG_TOP) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 14, sy, 4, TILE);
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(sx + 18, sy + 4);
    ctx.lineTo(sx + 30, sy + 10);
    ctx.lineTo(sx + 18, sy + 16);
    ctx.fill();
  } else if (type === TILE_TYPES.VINE) {
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(sx + 12, sy, 8, TILE);
    ctx.fillStyle = '#52b788';
    ctx.fillRect(sx + 8, sy + 8, 16, 4);
  }
}

function drawBug(ctx, bug, camX, camY) {
  const sx = bug.x - camX;
  const sy = bug.y - camY;
  const bob = Math.sin(Date.now() / 200 + bug.x) * 3;

  ctx.fillStyle = bug.power ? '#ffd700' : '#95d5b2';
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 8 + bob, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b4332';
  ctx.fillRect(sx + 4, sy + 4 + bob, 3, 3);
  ctx.fillRect(sx + 10, sy + 4 + bob, 3, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(sx + 12, sy + 2 + bob, 6, 2);
}

function drawEnemy(ctx, enemy, camX, camY) {
  const sx = enemy.x - camX;
  const sy = enemy.y - camY;

  if (enemy.type === 'fly') {
    ctx.fillStyle = '#7209b7';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 16, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,150,255,0.6)';
    ctx.fillRect(sx - 4, sy + 10, 8, 4);
    ctx.fillRect(sx + 24, sy + 10, 8, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 8, sy + 12, 4, 4);
    ctx.fillRect(sx + 16, sy + 12, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 9, sy + 13, 2, 2);
    ctx.fillRect(sx + 17, sy + 13, 2, 2);
  } else {
    ctx.fillStyle = '#6a040f';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 18, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#370617';
    ctx.fillRect(sx + 2, sy + 8, 6, 4);
    ctx.fillRect(sx + 20, sy + 8, 6, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 8, sy + 12, 4, 4);
    ctx.fillRect(sx + 16, sy + 12, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 9 + (enemy.vx > 0 ? 1 : -1), sy + 13, 2, 2);
    ctx.fillRect(sx + 17 + (enemy.vx > 0 ? 1 : -1), sy + 13, 2, 2);
  }
}

function drawChameleon(ctx, player, camX, camY) {
  const px = player.x - camX;
  const py = player.y - camY;
  const bounce = player.onGround && Math.abs(player.vx) > 0.5 ? Math.sin(player.animFrame * 3) * 2 : 0;
  const flicker = player.invincible > 0 && Math.floor(Date.now() / 80) % 2 === 0;

  if (flicker) return;

  let bodyColor = COLORS.chameleon.default;
  if (player.powered) bodyColor = COLORS.chameleon.powered;
  if (player.invincible > 0) bodyColor = COLORS.chameleon.invincible;

  // Tail
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  const tailDir = -player.facing;
  ctx.moveTo(px + (player.facing > 0 ? 4 : player.w - 4), py + 20 + bounce);
  ctx.quadraticCurveTo(
    px + player.w / 2 + tailDir * 18,
    py + 28 + bounce,
    px + player.w / 2 + tailDir * 22,
    py + 10 + bounce
  );
  ctx.lineWidth = 5;
  ctx.strokeStyle = bodyColor;
  ctx.stroke();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(px + player.w / 2, py + 18 + bounce, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = COLORS.chameleon.belly;
  ctx.beginPath();
  ctx.ellipse(px + player.w / 2, py + 20 + bounce, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(
    px + player.w / 2 + player.facing * 6,
    py + 10 + bounce,
    10,
    9,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Eye stalk
  ctx.fillStyle = bodyColor;
  ctx.fillRect(px + player.w / 2 + player.facing * 8 - 2, py + 2 + bounce, 4, 6);

  // Big eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px + player.w / 2 + player.facing * 10, py + 4 + bounce, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(px + player.w / 2 + player.facing * 11, py + 4 + bounce, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Feet
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(px + 6, py + player.h - 4 + bounce, 5, 4);
  ctx.fillRect(px + player.w - 11, py + player.h - 4 + bounce, 5, 4);

  // Crest
  ctx.fillStyle = '#40916c';
  ctx.fillRect(px + player.w / 2 - 2, py + 1 + bounce, 4, 3);
}

function drawTongue(ctx, tongue, camX, camY) {
  const sx = tongue.x - camX;
  const sy = tongue.y - camY;
  const ex = sx + tongue.dir * tongue.len;
  const ey = sy;

  ctx.strokeStyle = '#e63946';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.fillStyle = '#ff758f';
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function renderTitle(ctx) {
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, 380, CANVAS_W, 100);

  drawChameleon(ctx, {
    x: CANVAS_W / 2 - 13,
    y: 220,
    w: 26,
    h: 30,
    facing: 1,
    onGround: true,
    vx: 0,
    animFrame: Date.now() / 100,
    powered: false,
    invincible: 0,
    dead: false,
  }, 0, 0);

  ctx.fillStyle = '#1b4332';
  ctx.font = '22px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('CHAMELEON', CANVAS_W / 2, 80);
  ctx.fillStyle = '#40916c';
  ctx.fillText('QUEST', CANVAS_W / 2, 115);

  ctx.fillStyle = '#fff';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('A jungle platform adventure', CANVAS_W / 2, 160);
  ctx.fillStyle = '#ffd700';
  ctx.fillText('Press SPACE or ENTER to start', CANVAS_W / 2, 340);
  ctx.fillStyle = '#b7e4c7';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('Jump on bugs · Zap with tongue · Reach the flag vine', CANVAS_W / 2, 380);
  ctx.textAlign = 'left';
}
