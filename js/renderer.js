import { TILE, TILE_TYPES, CANVAS_W, CANVAS_H, COLORS } from './constants.js';
import { resolveCamera, WORLD_NODES, unlockedIds } from './world.js';

export function render(ctx, world, player) {
  const { camX, camY } = resolveCamera(player.x, player.y, world.mapW, world.mapH);

  drawBackground(ctx, camX, world.theme);

  const startX = Math.floor(camX / TILE);
  const endX = Math.min(world.mapW, startX + Math.ceil(CANVAS_W / TILE) + 2);
  const startY = Math.floor(camY / TILE);
  const endY = Math.min(world.mapH, startY + Math.ceil(CANVAS_H / TILE) + 2);

  for (let y = Math.max(0, startY); y < endY; y++) {
    for (let x = Math.max(0, startX); x < endX; x++) {
      drawTile(ctx, world, x, y, camX, camY);
    }
  }

  if (world.midway && !world.midway.got) drawMidway(ctx, world.midway, camX, camY);

  for (const coin of world.coins) {
    if (!coin.collected) drawCoin(ctx, coin, camX, camY);
  }
  for (const scale of world.scales) {
    if (!scale.collected) drawScale(ctx, scale, camX, camY);
  }
  for (const item of world.items) {
    if (!item.collected) drawItem(ctx, item, camX, camY);
  }
  for (const enemy of world.enemies) {
    if (enemy.alive) drawEnemy(ctx, enemy, camX, camY);
  }

  drawGoal(ctx, world, camX, camY);

  if (!player.dead || Math.floor(Date.now() / 90) % 2 === 0) {
    drawChameleon(ctx, player, camX, camY);
  }
  if (player.tongue) drawTongue(ctx, player.tongue, camX, camY);

  if (player.won) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffe566';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('COURSE CLEAR!', CANVAS_W / 2, 200);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score ${player.score}`, CANVAS_W / 2, 240);
    ctx.fillText('Press ENTER for the world map', CANVAS_W / 2, 280);
    ctx.textAlign = 'left';
  }
}

function themeColors(theme) {
  if (theme === 'cave') {
    return { top: '#1b1f3b', mid: '#2c2f54', hill: '#17122a', hill2: '#24183a' };
  }
  if (theme === 'castle') {
    return { top: '#3b1d32', mid: '#6b2d3c', hill: '#4a2030', hill2: '#2a121c' };
  }
  if (theme === 'athletic') {
    return { top: '#7ec8ff', mid: '#c8f0ff', hill: '#3cb878', hill2: '#2a8f5c' };
  }
  return { top: '#5c94fc', mid: '#a8d8ff', hill: '#00a800', hill2: '#007800' };
}

function drawBackground(ctx, camX, theme) {
  const c = themeColors(theme);
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, c.top);
  grad.addColorStop(1, c.mid);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (theme !== 'cave') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 220 - camX * 0.08) % (CANVAS_W + 220)) - 40;
      drawCloud(ctx, cx, 40 + (i % 3) * 28);
    }
  }

  ctx.fillStyle = c.hill2;
  for (let i = 0; i < 7; i++) {
    const hx = ((i * 180 - camX * 0.18) % (CANVAS_W + 200)) - 80;
    drawHill(ctx, hx, 390, 110, 70);
  }
  ctx.fillStyle = c.hill;
  for (let i = 0; i < 6; i++) {
    const hx = ((i * 210 - camX * 0.32) % (CANVAS_W + 220)) - 90;
    drawHill(ctx, hx, 430, 130, 80, true);
  }
}

function drawHill(ctx, x, y, w, h, eyes = false) {
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, Math.PI, 0);
  ctx.fill();
  if (eyes) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 18, y - 28, 7, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x - 16, y - 28, 3, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 26, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCloud(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.arc(x + 18, y - 6, 14, 0, Math.PI * 2);
  ctx.arc(x + 36, y, 16, 0, Math.PI * 2);
  ctx.arc(x + 18, y + 4, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawTile(ctx, world, x, y, camX, camY) {
  const type = world.tiles[y][x];
  const sx = x * TILE - camX;
  const sy = y * TILE - camY;
  if (type === TILE_TYPES.EMPTY) return;

  if (type === TILE_TYPES.GROUND) {
    const cave = world.theme === 'cave' || world.theme === 'castle';
    ctx.fillStyle = cave ? '#6b4f3a' : '#c84c0c';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = cave ? '#3d7a3d' : '#00c800';
    ctx.fillRect(sx, sy, TILE, 8);
    ctx.fillStyle = cave ? '#2d5a2d' : '#009800';
    ctx.fillRect(sx, sy + 8, TILE, 3);
    ctx.fillStyle = cave ? '#5a3f2c' : '#a03c08';
    ctx.fillRect(sx + 6, sy + 16, 5, 5);
    ctx.fillRect(sx + 18, sy + 22, 4, 4);
  } else if (type === TILE_TYPES.BRICK) {
    ctx.fillStyle = '#d06020';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#f08838';
    ctx.fillRect(sx + 2, sy + 2, 13, 12);
    ctx.fillRect(sx + 17, sy + 2, 13, 12);
    ctx.fillRect(sx + 2, sy + 16, 13, 14);
    ctx.fillRect(sx + 17, sy + 16, 13, 14);
  } else if (type === TILE_TYPES.QUESTION) {
    const pulse = 0.85 + Math.sin(Date.now() / 180) * 0.15;
    ctx.fillStyle = `rgb(255, ${Math.floor(180 * pulse)}, 0)`;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#fff3a0';
    ctx.fillRect(sx + 3, sy + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = '#c06000';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', sx + TILE / 2, sy + 23);
    ctx.textAlign = 'left';
  } else if (type === TILE_TYPES.USED) {
    ctx.fillStyle = '#b07038';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a5020';
    ctx.strokeRect(sx + 3, sy + 3, TILE - 6, TILE - 6);
  } else if (type === TILE_TYPES.PIPE) {
    ctx.fillStyle = '#00a800';
    ctx.fillRect(sx + 2, sy, TILE - 4, TILE);
    ctx.fillStyle = '#00d000';
    ctx.fillRect(sx, sy, TILE, 8);
    ctx.fillStyle = '#007800';
    ctx.fillRect(sx + 6, sy + 8, 4, TILE - 8);
  } else if (type === TILE_TYPES.PLATFORM) {
    ctx.fillStyle = '#e8b060';
    ctx.fillRect(sx, sy, TILE, 10);
    ctx.fillStyle = '#b07830';
    ctx.fillRect(sx, sy + 8, TILE, 4);
  } else if (type === TILE_TYPES.LAVA) {
    ctx.fillStyle = '#ff3c00';
    ctx.fillRect(sx, sy + 8, TILE, TILE - 8);
    ctx.fillStyle = '#ffc000';
    const wave = Math.sin(Date.now() / 140 + x) * 3;
    ctx.fillRect(sx, sy + 6 + wave, TILE, 8);
  } else if (type === TILE_TYPES.CASTLE) {
    ctx.fillStyle = '#686880';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#404058';
    ctx.fillRect(sx + 8, sy + 10, 16, 16);
    ctx.fillStyle = '#202030';
    ctx.fillRect(sx + 12, sy + 16, 8, 10);
  } else if (type === TILE_TYPES.GOAL) {
    return;
  }
}

function drawMidway(ctx, mid, camX, camY) {
  const sx = mid.x - camX;
  const sy = mid.y - camY - 48;
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx, sy, 5, 64);
  ctx.fillRect(sx + 22, sy, 5, 64);
  ctx.fillStyle = '#ffd000';
  ctx.fillRect(sx + 5, sy + 10, 17, 6);
}

function drawGoal(ctx, world, camX, camY) {
  const sx = world.flagX - camX;
  const groundY = 13 * TILE - camY;
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(sx + 4, groundY - 168, 6, 168);
  ctx.fillRect(sx + 36, groundY - 168, 6, 168);
  const bob = groundY - 150 + Math.sin(Date.now() / 250) * 48;
  ctx.fillStyle = '#e83870';
  ctx.fillRect(sx + 10, bob, 26, 8);
}

function drawCoin(ctx, coin, camX, camY) {
  const sx = coin.x - camX;
  const sy = coin.y - camY + Math.sin(Date.now() / 200 + coin.x) * 2;
  ctx.fillStyle = '#ffd000';
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 8, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3a0';
  ctx.fillRect(sx + 6, sy + 4, 3, 6);
}

function drawScale(ctx, scale, camX, camY) {
  const sx = scale.x - camX;
  const sy = scale.y - camY + Math.sin(Date.now() / 180) * 3;
  ctx.fillStyle = '#7ee8ff';
  ctx.beginPath();
  ctx.moveTo(sx + 10, sy);
  ctx.lineTo(sx + 20, sy + 10);
  ctx.lineTo(sx + 10, sy + 20);
  ctx.lineTo(sx, sy + 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx + 8, sy + 7, 4, 4);
}

function drawItem(ctx, item, camX, camY) {
  const sx = item.x - camX;
  const sy = item.y - camY;
  if (item.type === 'berry') {
    ctx.fillStyle = '#ff3c3c';
    ctx.beginPath();
    ctx.arc(sx + 10, sy + 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00c800';
    ctx.fillRect(sx + 8, sy + 2, 4, 5);
  } else {
    ctx.fillStyle = '#40e070';
    ctx.font = '16px sans-serif';
    ctx.fillText('1', sx + 4, sy + 16);
  }
}

function drawEnemy(ctx, enemy, camX, camY) {
  const sx = enemy.x - camX;
  const sy = enemy.y - camY;
  const flash = enemy.hurtTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
  if (flash) return;

  if (enemy.type === 'fly') {
    ctx.fillStyle = '#c060ff';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 14, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(sx - 2, sy + 8, 10, 5);
    ctx.fillRect(sx + 20, sy + 8, 10, 5);
    eyes(ctx, sx, sy, enemy.vx);
  } else if (enemy.type === 'piranha') {
    ctx.fillStyle = '#d00030';
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 14, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 4, sy + 12, 16, 4);
    ctx.fillStyle = '#00a000';
    ctx.fillRect(sx + 10, sy + 24, 4, 8);
  } else if (enemy.type === 'boss') {
    ctx.fillStyle = '#8b1a1a';
    ctx.beginPath();
    ctx.ellipse(sx + 24, sy + 26, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd000';
    ctx.fillRect(sx + 8, sy + 8, 8, 6);
    ctx.fillRect(sx + 32, sy + 8, 8, 6);
    eyes(ctx, sx + 10, sy + 8, enemy.vx, 6);
  } else if (enemy.type === 'koopa' && enemy.shell) {
    ctx.fillStyle = '#2080d0';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 12, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#104080';
    ctx.fillRect(sx + 8, sy + 8, 12, 3);
  } else if (enemy.type === 'koopa') {
    ctx.fillStyle = '#20a050';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 18, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe0a0';
    ctx.fillRect(sx + 10, sy + 6, 10, 8);
    eyes(ctx, sx, sy, enemy.vx);
  } else {
    ctx.fillStyle = '#8b4510';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 16, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a2a0a';
    ctx.fillRect(sx + 4, sy + 8, 6, 4);
    ctx.fillRect(sx + 18, sy + 8, 6, 4);
    eyes(ctx, sx, sy, enemy.vx);
  }
}

function eyes(ctx, sx, sy, vx, size = 4) {
  const look = vx > 0 ? 1 : -1;
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx + 8, sy + 12, size, size);
  ctx.fillRect(sx + 16, sy + 12, size, size);
  ctx.fillStyle = '#111';
  ctx.fillRect(sx + 9 + look, sy + 13, 2, 2);
  ctx.fillRect(sx + 17 + look, sy + 13, 2, 2);
}

export function drawChameleon(ctx, player, camX, camY) {
  const px = player.x - camX;
  const py = player.y - camY;
  const bounce = player.onGround && Math.abs(player.vx) > 0.5 ? Math.sin(player.animFrame * 3) * 2 : 0;
  const flicker = player.invincible > 0 && Math.floor(Date.now() / 70) % 2 === 0;
  if (flicker) return;

  let body = COLORS.chameleon.default;
  if (player.powered) body = COLORS.chameleon.powered;
  if (player.camouflaged) {
    ctx.globalAlpha = 0.35;
    body = COLORS.chameleon.camouflage;
  }

  const spin = player.spinning > 0 ? Date.now() / 40 : 0;
  ctx.save();
  if (spin) {
    ctx.translate(px + player.w / 2, py + player.h / 2);
    ctx.rotate(spin);
    ctx.translate(-(px + player.w / 2), -(py + player.h / 2));
  }

  ctx.strokeStyle = body;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const tailX = px + player.w / 2 - player.facing * 16;
  ctx.moveTo(px + player.w / 2 - player.facing * 6, py + 20 + bounce);
  ctx.quadraticCurveTo(tailX, py + 30 + bounce, tailX - player.facing * 6, py + 12 + bounce);
  ctx.stroke();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(px + player.w / 2, py + 18 + bounce, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.chameleon.belly;
  ctx.beginPath();
  ctx.ellipse(px + player.w / 2, py + 21 + bounce, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const hx = px + player.w / 2 + player.facing * 8;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(hx, py + 10 + bounce, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillRect(hx + player.facing * 2 - 2, py + 1 + bounce, 4, 7);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hx + player.facing * 4, py + 3 + bounce, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(hx + player.facing * 5, py + 3 + bounce, 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = player.powered ? '#ffd000' : '#2d8a4a';
  ctx.beginPath();
  ctx.moveTo(hx - 4, py + 4 + bounce);
  ctx.lineTo(hx, py - 4 + bounce);
  ctx.lineTo(hx + 4, py + 4 + bounce);
  ctx.fill();

  ctx.fillStyle = '#1b4332';
  ctx.fillRect(px + 5, py + player.h - 4 + bounce, 6, 4);
  ctx.fillRect(px + player.w - 11, py + player.h - 4 + bounce, 6, 4);

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawTongue(ctx, tongue, camX, camY) {
  const sx = tongue.x - camX;
  const sy = tongue.y - camY;
  const ex = sx + tongue.dir * tongue.len;
  ctx.strokeStyle = '#ff4d6d';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, sy);
  ctx.stroke();
  ctx.fillStyle = '#ff8fa3';
  ctx.beginPath();
  ctx.arc(ex, sy, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function renderTitle(ctx) {
  drawBackground(ctx, 0, 'grass');
  ctx.fillStyle = 'rgba(8, 28, 21, 0.35)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawChameleon(ctx, {
    x: CANVAS_W / 2 - 15,
    y: 210,
    w: 30,
    h: 36,
    facing: 1,
    onGround: true,
    vx: 1,
    animFrame: Date.now() / 90,
    powered: false,
    invincible: 0,
    camouflaged: false,
    spinning: 0,
  }, 0, 0);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#143d1f';
  ctx.font = '22px "Press Start 2P"';
  ctx.fillText('CHAMELEON', CANVAS_W / 2 + 3, 83);
  ctx.fillStyle = '#ffe566';
  ctx.fillText('CHAMELEON', CANVAS_W / 2, 80);
  ctx.fillStyle = '#3dcc6a';
  ctx.fillText('WORLD', CANVAS_W / 2, 118);

  ctx.fillStyle = '#fff';
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('A Super Mario World-style jungle quest', CANVAS_W / 2, 160);
  ctx.fillStyle = '#ffe566';
  ctx.fillText('Press SPACE or ENTER', CANVAS_W / 2, 340);
  ctx.fillStyle = '#d8ffc2';
  ctx.font = '6px "Press Start 2P"';
  ctx.fillText('Tongue · Camouflage · Frill glide · Reach the goal tape', CANVAS_W / 2, 380);
  ctx.textAlign = 'left';
}

export function renderMap(ctx, save, cursorId) {
  drawBackground(ctx, 0, 'grass');
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.ellipse(400, 300, 360, 160, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#208038';
  ctx.beginPath();
  ctx.ellipse(260, 250, 140, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  const unlocked = unlockedIds(save.cleared);
  ctx.strokeStyle = '#c4a574';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (const node of WORLD_NODES) {
    for (const nid of node.next) {
      const other = WORLD_NODES.find((n) => n.id === nid);
      if (!other) continue;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(other.x, other.y);
      ctx.stroke();
    }
  }

  for (const node of WORLD_NODES) {
    const open = unlocked.has(node.id);
    const done = save.cleared.has(node.id);
    ctx.fillStyle = !open ? '#555' : node.kind === 'castle' ? '#c03030' : done ? '#40c0ff' : '#ffe566';
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.kind === 'castle' ? 16 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const cur = WORLD_NODES.find((n) => n.id === cursorId) || WORLD_NODES[0];
  drawChameleon(ctx, {
    x: cur.x - 14,
    y: cur.y - 42,
    w: 26,
    h: 30,
    facing: 1,
    onGround: true,
    vx: 1,
    animFrame: Date.now() / 80,
    powered: false,
    invincible: 0,
    camouflaged: false,
    spinning: 0,
  }, 0, 0);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(140, 400, 520, 56);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe566';
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText(cur.name, CANVAS_W / 2, 424);
  ctx.fillStyle = '#fff';
  ctx.font = '7px "Press Start 2P"';
  const hint = unlocked.has(cur.id) ? 'ENTER to play  ·  ← → move' : 'Clear the last course first';
  ctx.fillText(hint, CANVAS_W / 2, 446);
  ctx.textAlign = 'left';

  if (save.cleared.has('1-castle')) {
    ctx.fillStyle = '#ffe566';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('You cleared Chameleon World!', CANVAS_W / 2, 40);
    ctx.textAlign = 'left';
  }
}
