function e(ctx, x, y, rx, ry, color, rot = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, Math.PI * 2);
  ctx.fill();
}

function tri(ctx, x1, y1, x2, y2, x3, y3, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function shadow(ctx, cx, cy, rx, ry) {
  e(ctx, cx, cy + 56, rx, ry, 'rgba(0,0,0,0.2)');
}

function blush(ctx, x1, y1, x2, y2, st) {
  if (!st.loving && st.mood <= 72) return;
  e(ctx, x1, y1, 10, 6, 'rgba(230,57,70,0.32)');
  e(ctx, x2, y2, 10, 6, 'rgba(230,57,70,0.32)');
}

function eyes(ctx, lx, ly, rx, ry, r, st, opt = {}) {
  const closed = st.sleeping || st.blink;
  const h = st.sad ? r * 0.65 : r;
  if (closed) {
    ctx.strokeStyle = '#3d2914';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (st.mood > 50 && !st.sleeping) {
      ctx.arc(lx, ly, r * 0.7, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, ry, r * 0.7, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      ctx.moveTo(lx - r, ly);
      ctx.lineTo(lx + r, ly);
      ctx.moveTo(rx - r, ry);
      ctx.lineTo(rx + r, ry);
      ctx.stroke();
    }
    return;
  }
  e(ctx, lx, ly, r, h, '#fff8ef');
  e(ctx, rx, ry, r, h, '#fff8ef');
  const look = st.loving ? 0 : st.playing ? Math.sin(st.t * 8) * 3 : 0;
  const pupil = opt.slit ? 2 : r * 0.48;
  e(ctx, lx + look, ly + (st.sad ? 2 : 1), opt.slit ? 2 : pupil, opt.slit ? h * 0.7 : pupil, '#3d2914');
  e(ctx, rx + look, ry + (st.sad ? 2 : 1), opt.slit ? 2 : pupil, opt.slit ? h * 0.7 : pupil, '#3d2914');
  ctx.fillStyle = '#fff';
  ctx.fillRect(lx - 4 + look, ly - 4, 3, 3);
  ctx.fillRect(rx - 4 + look, ry - 4, 3, 3);
}

function mouth(ctx, x, y, st, kind = 'smile') {
  ctx.strokeStyle = '#3d2914';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (st.eating) {
    ctx.arc(x, y, 8, 0.25, Math.PI - 0.25);
  } else if (st.playing || st.mood > 75) {
    ctx.arc(x, y - 2, 11, 0.2, Math.PI - 0.2);
  } else if (st.sad) {
    ctx.arc(x, y + 10, 8, Math.PI * 1.2, Math.PI * 1.8, true);
  } else if (kind === 'cat') {
    ctx.moveTo(x - 7, y);
    ctx.quadraticCurveTo(x - 3, y + 5, x, y);
    ctx.quadraticCurveTo(x + 3, y + 5, x + 7, y);
  } else {
    ctx.moveTo(x - 8, y);
    ctx.quadraticCurveTo(x, y + 7, x + 8, y);
  }
  ctx.stroke();
}

function whiskers(ctx, x, y) {
  ctx.strokeStyle = 'rgba(61,41,20,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 4);
  ctx.lineTo(x - 38, y - 10);
  ctx.moveTo(x - 12, y + 2);
  ctx.lineTo(x - 40, y + 2);
  ctx.moveTo(x - 12, y + 8);
  ctx.lineTo(x - 36, y + 12);
  ctx.moveTo(x + 12, y - 4);
  ctx.lineTo(x + 38, y - 10);
  ctx.moveTo(x + 12, y + 2);
  ctx.lineTo(x + 40, y + 2);
  ctx.moveTo(x + 12, y + 8);
  ctx.lineTo(x + 36, y + 12);
  ctx.stroke();
}

function props(ctx, cx, bodyY, st) {
  if (st.eating) {
    e(ctx, cx, bodyY + 62, 22, 8, '#6b4226');
    e(ctx, cx, bodyY + 58, 14, 5, '#e07a5f');
  }
  if (st.drinking) {
    ctx.fillStyle = '#4cc9f0';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(cx - 2, bodyY + 8, 4, 44);
    ctx.globalAlpha = 1;
  }
  if (st.crying) {
    e(ctx, cx - 28, bodyY - 8 + ((st.t * 20) % 10), 3, 5, '#7ec8e3');
  }
}

function stateOf(p, t, extra) {
  const hop = extra.playing ? Math.abs(Math.sin((p.actionTime || 0) * 10)) * 16 : 0;
  const idle = extra.sleeping ? 1 : Math.sin(t * 3.1) * (extra.mood > 58 ? 4 : 2);
  return {
    t,
    ...extra,
    hop,
    idle,
    wag: extra.sleeping ? -6 : Math.sin(t * (extra.mood > 70 ? 8 : 3)) * 14,
    blink: p.blink > 0,
    actionTime: p.actionTime || 0,
  };
}

function drawCat(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 52, 12);
  e(ctx, cx + 58, y + 28, 14, 22, s.tail, 0.5 + st.wag * 0.02);
  e(ctx, cx, y + 22, 52, 40, s.body);
  e(ctx, cx, y + 32, 28, 22, s.belly);
  tri(ctx, cx - 22, y - 18, cx - 38, y - 62, cx - 6, y - 28, s.ear);
  tri(ctx, cx + 22, y - 18, cx + 38, y - 62, cx + 6, y - 28, s.ear);
  tri(ctx, cx - 20, y - 22, cx - 32, y - 50, cx - 10, y - 28, s.inner);
  tri(ctx, cx + 20, y - 22, cx + 32, y - 50, cx + 10, y - 28, s.inner);
  e(ctx, cx, y - 16, 36, 32, s.body);
  blush(ctx, cx - 22, y - 6, cx + 22, y - 6, st);
  eyes(ctx, cx - 14, y - 20, cx + 14, y - 20, 9, st, { slit: true });
  tri(ctx, cx - 5, y - 6, cx + 5, y - 6, cx, y + 2, s.nose);
  mouth(ctx, cx, y + 8, st, 'cat');
  whiskers(ctx, cx, y);
  e(ctx, cx - 20, y + 52, 14, 10, s.body, -0.2);
  e(ctx, cx + 20, y + 52, 14, 10, s.body, 0.2);
  props(ctx, cx, y, st);
}

function drawDog(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 56, 13);
  e(ctx, cx + 60, y + 30, 12, 20, s.tail, 0.6 + st.wag * 0.03);
  e(ctx, cx, y + 24, 58, 42, s.body);
  e(ctx, cx, y + 34, 32, 24, s.belly);
  e(ctx, cx - 40, y - 8, 16, 28, s.ear, 0.5);
  e(ctx, cx + 40, y - 8, 16, 28, s.ear, -0.5);
  e(ctx, cx, y - 10, 40, 34, s.body);
  e(ctx, cx, y + 8, 22, 16, s.body);
  blush(ctx, cx - 24, y - 2, cx + 24, y - 2, st);
  eyes(ctx, cx - 14, y - 16, cx + 14, y - 16, 8, st);
  e(ctx, cx, y + 6, 8, 6, s.nose);
  mouth(ctx, cx, y + 16, st);
  if (st.mood > 70 && !st.sleeping) {
    e(ctx, cx + 4, y + 24, 7, 10, '#e07a9a', 0.3);
  }
  e(ctx, cx - 22, y + 54, 16, 11, s.body);
  e(ctx, cx + 22, y + 54, 16, 11, s.body);
  props(ctx, cx, y, st);
}

function drawRabbit(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 8;
  shadow(ctx, cx, cy, 48, 12);
  e(ctx, cx + 36, y + 40, 12, 10, s.tail);
  e(ctx, cx, y + 26, 48, 38, s.body);
  e(ctx, cx, y + 36, 26, 20, s.belly);
  e(ctx, cx - 16, y - 48, 10, 38, s.ear, -0.12);
  e(ctx, cx + 16, y - 48, 10, 38, s.ear, 0.12);
  e(ctx, cx - 16, y - 46, 5, 26, s.inner, -0.12);
  e(ctx, cx + 16, y - 46, 5, 26, s.inner, 0.12);
  e(ctx, cx, y - 8, 32, 28, s.body);
  blush(ctx, cx - 18, y, cx + 18, y, st);
  eyes(ctx, cx - 12, y - 12, cx + 12, y - 12, 8, st);
  e(ctx, cx, y + 2, 5, 4, s.nose);
  mouth(ctx, cx, y + 10, st, 'cat');
  whiskers(ctx, cx, y + 4);
  e(ctx, cx - 18, y + 52, 18, 12, s.body);
  e(ctx, cx + 18, y + 52, 18, 12, s.body);
  props(ctx, cx, y, st);
}

function drawRodent(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop + (opt.small ? 18 : 10);
  const sc = opt.small ? 0.78 : 1;
  shadow(ctx, cx, cy, 40 * sc, 10);
  if (opt.tail === 'long') e(ctx, cx + 50 * sc, y + 30, 28 * sc, 5, s.tail, 0.2 + st.wag * 0.01);
  if (opt.tail === 'tuft') {
    e(ctx, cx + 48 * sc, y + 26, 22 * sc, 6, s.tail, 0.15);
    e(ctx, cx + 70 * sc, y + 20, 8 * sc, 8 * sc, s.ear);
  }
  if (opt.tail === 'bushy') e(ctx, cx + 52 * sc, y + 24, 18 * sc, 14 * sc, s.tail, 0.3);
  e(ctx, cx, y + 18, 44 * sc, 34 * sc, s.body);
  e(ctx, cx, y + 26, 26 * sc, 18 * sc, s.belly);
  if (opt.cheeks) {
    e(ctx, cx - 28 * sc, y + 6, 16 * sc, 14 * sc, s.body);
    e(ctx, cx + 28 * sc, y + 6, 16 * sc, 14 * sc, s.body);
  }
  const ear = opt.ear || 12;
  e(ctx, cx - 28 * sc, y - 16 * sc, ear, ear, s.ear);
  e(ctx, cx + 28 * sc, y - 16 * sc, ear, ear, s.ear);
  e(ctx, cx - 28 * sc, y - 16 * sc, ear * 0.5, ear * 0.5, s.inner);
  e(ctx, cx + 28 * sc, y - 16 * sc, ear * 0.5, ear * 0.5, s.inner);
  e(ctx, cx, y - 4, 30 * sc, 24 * sc, s.body);
  blush(ctx, cx - 16 * sc, y + 4, cx + 16 * sc, y + 4, st);
  eyes(ctx, cx - 10 * sc, y - 8, cx + 10 * sc, y - 8, 7 * sc, st);
  e(ctx, cx, y + 6, 5 * sc, 4 * sc, s.nose);
  mouth(ctx, cx, y + 14 * sc, st);
  e(ctx, cx - 16 * sc, y + 44 * sc, 12 * sc, 8 * sc, s.body);
  e(ctx, cx + 16 * sc, y + 44 * sc, 12 * sc, 8 * sc, s.body);
  props(ctx, cx, y, st);
}

function drawHedgehog(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 12;
  shadow(ctx, cx, cy, 48, 11);
  ctx.fillStyle = '#6b4f32';
  for (let i = -7; i <= 7; i++) {
    tri(ctx, cx + i * 8, y + 8, cx + i * 8 + 4, y - 36 + Math.abs(i) * 2, cx + i * 8 + 8, y + 8, i % 2 ? '#7a5c3a' : '#5c4328');
  }
  e(ctx, cx, y + 18, 46, 28, s.body);
  e(ctx, cx, y + 26, 28, 16, s.belly);
  e(ctx, cx, y + 2, 28, 20, s.body);
  e(ctx, cx, y + 10, 18, 12, s.body);
  eyes(ctx, cx - 10, y - 2, cx + 10, y - 2, 6, st);
  e(ctx, cx, y + 10, 5, 4, s.nose);
  mouth(ctx, cx, y + 16, st);
  e(ctx, cx - 18, y + 40, 12, 8, s.body);
  e(ctx, cx + 18, y + 40, 12, 8, s.body);
  props(ctx, cx, y, st);
}

function drawParrot(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 36, 10);
  e(ctx, cx + 8, y + 36, 10, 28, '#1d3557', 0.35);
  e(ctx, cx + 18, y + 32, 8, 24, '#457b9d', 0.4);
  e(ctx, cx, y + 16, 32, 40, '#e63946');
  e(ctx, cx - 6, y + 20, 16, 22, '#ffd166');
  e(ctx, cx + 22, y + 8, 18, 26, '#1d3557', 0.5);
  e(ctx, cx + 18, y + 10, 12, 18, '#ffd166', 0.45);
  e(ctx, cx - 4, y - 28, 22, 20, '#e63946');
  e(ctx, cx - 10, y - 24, 14, 12, '#fff8ef');
  tri(ctx, cx - 22, y - 26, cx - 46, y - 14, cx - 18, y - 8, '#f4a261');
  e(ctx, cx - 28, y - 16, 6, 5, '#fff8ef');
  eyes(ctx, cx - 8, y - 30, cx + 6, y - 30, 7, st);
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(cx - 16, y + 52, 5, 18);
  ctx.fillRect(cx + 6, y + 52, 5, 18);
  tri(ctx, cx - 18, y + 70, cx - 4, y + 70, cx - 14, y + 78, '#f4a261');
  tri(ctx, cx + 4, y + 70, cx + 18, y + 70, cx + 10, y + 78, '#f4a261');
  blush(ctx, cx - 16, y - 18, cx + 10, y - 18, st);
  props(ctx, cx, y, st);
}

function drawChicken(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 40, 11);
  e(ctx, cx + 24, y + 8, 16, 22, '#f5f0e6', 0.4);
  e(ctx, cx, y + 18, 40, 32, '#f5f0e6');
  e(ctx, cx - 8, y + 24, 20, 16, '#fff');
  e(ctx, cx - 18, y + 10, 18, 14, '#f5f0e6', -0.2);
  e(ctx, cx, y - 22, 20, 18, '#f5f0e6');
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.moveTo(cx - 10, y - 34);
  ctx.quadraticCurveTo(cx - 8, y - 52, cx - 2, y - 34);
  ctx.quadraticCurveTo(cx + 2, y - 56, cx + 8, y - 34);
  ctx.quadraticCurveTo(cx + 12, y - 48, cx + 14, y - 32);
  ctx.closePath();
  ctx.fill();
  e(ctx, cx - 6, y - 10, 6, 10, '#e63946');
  e(ctx, cx + 4, y - 10, 6, 10, '#e63946');
  tri(ctx, cx - 18, y - 22, cx - 36, y - 16, cx - 16, y - 10, '#f4a261');
  eyes(ctx, cx - 6, y - 26, cx + 8, y - 26, 6, st);
  ctx.fillStyle = '#f4a261';
  ctx.fillRect(cx - 12, y + 48, 5, 16);
  ctx.fillRect(cx + 6, y + 48, 5, 16);
  tri(ctx, cx - 16, y + 64, cx - 2, y + 64, cx - 10, y + 72, '#f4a261');
  tri(ctx, cx + 2, y + 64, cx + 16, y + 64, cx + 10, y + 72, '#f4a261');
  props(ctx, cx, y, st);
}

function drawChameleon(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop + 8;
  const g = st.mood > 70 ? '#52b788' : st.sad ? '#6b705c' : '#40916c';
  shadow(ctx, cx, cy, 50, 11);
  ctx.strokeStyle = g;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx + 48, y + 28, 16, Math.PI * 0.2, Math.PI * 1.8, true);
  ctx.stroke();
  e(ctx, cx + 8, y + 20, 46, 22, g);
  e(ctx, cx + 8, y + 26, 32, 12, '#95d5b2');
  e(ctx, cx + 8, y + 12, 40, 6, '#2d6a4f');
  e(ctx, cx - 36, y + 4, 24, 18, g);
  tri(ctx, cx - 40, y - 8, cx - 28, y - 36, cx - 16, y - 6, g);
  e(ctx, cx - 48, y - 6, 10, 10, '#d8f3dc');
  e(ctx, cx - 28, y - 2, 10, 10, '#d8f3dc');
  if (!st.sleeping && !st.blink) {
    const a = Math.sin(st.t * 1.4) * 3;
    const b = Math.cos(st.t * 1.1) * 3;
    e(ctx, cx - 48 + a, y - 6, 4, 4, '#1b4332');
    e(ctx, cx - 28 + b, y - 2, 4, 4, '#1b4332');
  } else {
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - 48, y - 6, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 28, y - 2, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  e(ctx, cx - 58, y + 8, 8, 4, '#1b4332');
  e(ctx, cx - 20, y + 40, 10, 7, g);
  e(ctx, cx + 8, y + 42, 10, 7, g);
  e(ctx, cx - 24, y + 46, 8, 5, '#2d6a4f');
  e(ctx, cx + 12, y + 48, 8, 5, '#2d6a4f');
  props(ctx, cx, y, st);
}

function drawBeardedDragon(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  shadow(ctx, cx, cy, 54, 12);
  e(ctx, cx + 50, y + 24, 28, 10, s.tail, 0.2);
  for (let i = 0; i < 5; i++) e(ctx, cx + 30 + i * 10, y + 18 + i, 7, 6, i % 2 ? '#b08968' : '#d4a373');
  e(ctx, cx, y + 22, 50, 24, s.body);
  e(ctx, cx, y + 28, 34, 12, s.belly);
  e(ctx, cx, y - 4, 36, 22, s.body);
  for (let i = -5; i <= 5; i++) {
    tri(ctx, cx + i * 6 - 3, y + 12, cx + i * 6, y + 26, cx + i * 6 + 3, y + 12, '#8d5a3a');
  }
  tri(ctx, cx - 20, y - 8, cx, y - 28, cx + 20, y - 8, s.body);
  eyes(ctx, cx - 12, y - 8, cx + 12, y - 8, 6, st);
  e(ctx, cx, y + 4, 6, 4, s.nose);
  e(ctx, cx - 28, y + 36, 14, 8, s.body);
  e(ctx, cx + 28, y + 36, 14, 8, s.body);
  e(ctx, cx - 34, y + 42, 10, 6, '#8d5a3a');
  e(ctx, cx + 34, y + 42, 10, 6, '#8d5a3a');
  props(ctx, cx, y, st);
}

function drawBird(ctx, cx, cy, st, opt) {
  const y = cy + st.idle - st.hop + 6;
  shadow(ctx, cx, cy, 30, 9);
  e(ctx, cx + 16, y + 18, 8, opt.tail || 18, opt.tailColor || opt.body, 0.4);
  e(ctx, cx, y + 14, 24, 28, opt.body);
  e(ctx, cx - 2, y + 18, 12, 16, opt.belly);
  e(ctx, cx + 14, y + 10, 14, 16, opt.wing || opt.body, 0.4);
  e(ctx, cx, y - 16, 16, 14, opt.head || opt.body);
  if (opt.crest) tri(ctx, cx - 2, y - 24, cx + 4, y - 48, cx + 12, y - 22, opt.crest);
  if (opt.cheek) e(ctx, cx - 8, y - 12, 6, 5, opt.cheek);
  tri(ctx, cx - 14, y - 16, cx - 28, y - 10, cx - 12, y - 6, opt.beak || '#f4a261');
  eyes(ctx, cx - 2, y - 18, cx + 8, y - 18, 5, st);
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(cx - 8, y + 40, 3, 14);
  ctx.fillRect(cx + 4, y + 40, 3, 14);
  props(ctx, cx, y, st);
}

function drawPenguin(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 34, 10);
  e(ctx, cx, y + 12, 32, 44, '#1d3557');
  e(ctx, cx, y + 18, 20, 30, '#fff8ef');
  e(ctx, cx - 28, y + 10, 10, 20, '#1d3557', 0.4);
  e(ctx, cx + 28, y + 10, 10, 20, '#1d3557', -0.4);
  e(ctx, cx, y - 28, 22, 20, '#1d3557');
  e(ctx, cx, y - 22, 14, 12, '#fff8ef');
  tri(ctx, cx - 6, y - 18, cx + 6, y - 18, cx, y - 4, '#f4a261');
  eyes(ctx, cx - 8, y - 30, cx + 8, y - 30, 6, st);
  e(ctx, cx - 10, y + 52, 10, 5, '#f4a261');
  e(ctx, cx + 10, y + 52, 10, 5, '#f4a261');
  props(ctx, cx, y, st);
}

function drawOwl(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 38, 10);
  e(ctx, cx, y + 14, 36, 40, s.body);
  e(ctx, cx, y + 22, 22, 24, s.belly);
  tri(ctx, cx - 20, y - 20, cx - 28, y - 48, cx - 6, y - 24, s.ear);
  tri(ctx, cx + 20, y - 20, cx + 28, y - 48, cx + 6, y - 24, s.ear);
  e(ctx, cx, y - 16, 28, 24, s.body);
  e(ctx, cx - 12, y - 16, 14, 14, '#f3e6c8');
  e(ctx, cx + 12, y - 16, 14, 14, '#f3e6c8');
  eyes(ctx, cx - 12, y - 16, cx + 12, y - 16, 8, st);
  tri(ctx, cx - 5, y - 4, cx + 5, y - 4, cx, y + 8, '#e76f51');
  ctx.fillStyle = '#3d2914';
  ctx.fillRect(cx - 10, y + 50, 4, 10);
  ctx.fillRect(cx + 6, y + 50, 4, 10);
  props(ctx, cx, y, st);
}

function drawDuck(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop + 8;
  shadow(ctx, cx, cy, 40, 10);
  e(ctx, cx, y + 16, 36, 26, '#f0c36c');
  e(ctx, cx - 4, y + 22, 22, 14, '#fff3d6');
  e(ctx, cx + 28, y + 8, 14, 10, '#f0c36c');
  e(ctx, cx - 16, y - 10, 18, 16, '#f0c36c');
  e(ctx, cx - 28, y - 8, 14, 6, '#f4a261');
  eyes(ctx, cx - 18, y - 14, cx - 6, y - 14, 5, st);
  e(ctx, cx - 12, y + 42, 12, 6, '#f4a261');
  e(ctx, cx + 10, y + 42, 12, 6, '#f4a261');
  props(ctx, cx, y, st);
}

function drawFishBowl(ctx, cx, cy, st, opt) {
  const y = cy + 8;
  shadow(ctx, cx, cy, 48, 12);
  ctx.fillStyle = 'rgba(126, 200, 227, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, y + 8, 54, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#c9855a';
  ctx.fillRect(cx - 22, y + 52, 44, 10);
  const fx = cx + Math.sin(st.t * 2) * 16;
  const fy = y + 4 + Math.sin(st.t * 3) * 8 - st.hop * 0.3;
  e(ctx, fx + 22, fy, 14, 12, opt.tail, st.wag * 0.02);
  e(ctx, fx, fy, 22, 14, opt.body);
  e(ctx, fx, fy + 4, 12, 6, opt.belly);
  tri(ctx, fx - 4, fy - 10, fx + 8, fy - 22, fx + 12, fy - 6, opt.fin || opt.body);
  e(ctx, fx - 10, fy - 2, 5, 5, '#fff8ef');
  e(ctx, fx - 10, fy - 2, 2.5, 2.5, '#3d2914');
  if (st.sleeping) {
    ctx.fillStyle = '#c9b6ff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('Z', fx + 24, fy - 16);
  }
  props(ctx, cx, y, st);
}

function drawTurtle(ctx, cx, cy, st, s, dome) {
  const y = cy + st.idle - st.hop + 14;
  shadow(ctx, cx, cy, 52, 12);
  e(ctx, cx, y + 8, 54, 22 + dome, s.ear);
  e(ctx, cx, y + 4, 38, 14 + dome * 0.6, s.body);
  ctx.strokeStyle = 'rgba(61,41,20,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 18, y - 8, 16, 12);
  ctx.strokeRect(cx + 2, y - 8, 16, 12);
  ctx.strokeRect(cx - 10, y + 4, 20, 12);
  e(ctx, cx - 40, y + 10, 16, 12, s.body);
  e(ctx, cx - 48, y + 6, 10, 8, s.body);
  eyes(ctx, cx - 52, y + 2, cx - 44, y + 2, 4, st);
  e(ctx, cx - 28, y + 28, 10, 7, s.body);
  e(ctx, cx + 18, y + 28, 10, 7, s.body);
  e(ctx, cx + 40, y + 16, 10, 6, s.tail);
  props(ctx, cx, y, st);
}

function drawFrog(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 16;
  shadow(ctx, cx, cy, 48, 11);
  e(ctx, cx, y + 18, 48, 26, s.body);
  e(ctx, cx, y + 24, 30, 14, s.belly);
  e(ctx, cx, y - 4, 32, 20, s.body);
  e(ctx, cx - 16, y - 18, 12, 12, s.body);
  e(ctx, cx + 16, y - 18, 12, 12, s.body);
  eyes(ctx, cx - 16, y - 18, cx + 16, y - 18, 7, st);
  mouth(ctx, cx, y + 8, st);
  e(ctx, cx - 28, y + 36, 16, 10, s.body);
  e(ctx, cx + 28, y + 36, 16, 10, s.body);
  props(ctx, cx, y, st);
}

function drawAxolotl(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  shadow(ctx, cx, cy, 50, 11);
  e(ctx, cx + 50, y + 22, 24, 10, s.tail, 0.15);
  e(ctx, cx, y + 18, 48, 22, s.body);
  e(ctx, cx, y + 24, 30, 12, s.belly);
  e(ctx, cx - 28, y + 2, 24, 18, s.body);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      e(ctx, cx - 28 + side * (26 + i * 2), y - 8 + i * 10, 12, 5, s.ear, side * 0.5);
    }
  }
  eyes(ctx, cx - 36, y - 2, cx - 20, y - 2, 5, st);
  mouth(ctx, cx - 28, y + 12, st);
  e(ctx, cx - 16, y + 36, 10, 7, s.body);
  e(ctx, cx + 12, y + 36, 10, 7, s.body);
  props(ctx, cx, y, st);
}

function drawLizard(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop + 12;
  shadow(ctx, cx, cy, 52, 11);
  e(ctx, cx + 52, y + 22, 30, 8, s.tail, 0.15);
  e(ctx, cx, y + 18, 48, 18, s.body);
  e(ctx, cx, y + 22, 30, 10, s.belly);
  if (opt.crest) {
    for (let i = -3; i < 6; i++) tri(ctx, cx + i * 8, y + 4, cx + i * 8 + 4, y - 16, cx + i * 8 + 8, y + 4, s.ear);
  }
  if (opt.spots) {
    e(ctx, cx - 10, y + 14, 6, 5, 'rgba(61,41,20,0.3)');
    e(ctx, cx + 12, y + 18, 5, 4, 'rgba(61,41,20,0.3)');
    e(ctx, cx + 4, y + 10, 4, 4, 'rgba(61,41,20,0.3)');
  }
  e(ctx, cx - 36, y + 4, 20, 14, s.body);
  eyes(ctx, cx - 42, y, cx - 30, y, 5, st);
  e(ctx, cx - 22, y + 32, 10, 6, s.body);
  e(ctx, cx + 10, y + 32, 10, 6, s.body);
  props(ctx, cx, y, st);
}

function drawSnake(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 16;
  shadow(ctx, cx, cy, 56, 12);
  e(ctx, cx + 16, y + 28, 54, 14, s.body, 0.15);
  e(ctx, cx - 20, y + 16, 40, 14, s.body, -0.25);
  e(ctx, cx + 8, y + 8, 28, 12, s.body, 0.4);
  e(ctx, cx - 8, y - 6, 22, 18, s.body);
  eyes(ctx, cx - 14, y - 10, cx - 2, y - 10, 5, st);
  if (!st.sleeping && st.mood > 50) {
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, y + 8);
    ctx.lineTo(cx - 8, y + 22);
    ctx.moveTo(cx - 8, y + 22);
    ctx.lineTo(cx - 14, y + 28);
    ctx.moveTo(cx - 8, y + 22);
    ctx.lineTo(cx - 2, y + 28);
    ctx.stroke();
  }
  props(ctx, cx, y, st);
}

function drawHermit(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop + 18;
  shadow(ctx, cx, cy, 40, 10);
  e(ctx, cx + 10, y + 6, 28, 24, '#c15c44');
  e(ctx, cx + 10, y + 2, 18, 16, '#e07a5f');
  e(ctx, cx - 24, y + 16, 16, 12, '#e07a5f');
  e(ctx, cx - 38, y + 12, 12, 8, '#c15c44');
  e(ctx, cx - 42, y + 4, 6, 10, '#3d2914');
  e(ctx, cx - 28, y + 2, 5, 5, '#fff8ef');
  e(ctx, cx - 20, y + 2, 5, 5, '#fff8ef');
  e(ctx, cx - 28, y + 2, 2, 2, '#3d2914');
  e(ctx, cx - 20, y + 2, 2, 2, '#3d2914');
  e(ctx, cx - 16, y + 32, 8, 5, '#e07a5f');
  e(ctx, cx - 4, y + 34, 8, 5, '#e07a5f');
  props(ctx, cx, y, st);
}

function drawSnail(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 22;
  shadow(ctx, cx, cy, 40, 10);
  e(ctx, cx + 12, y, 26, 24, '#c15c44');
  e(ctx, cx + 12, y, 16, 16, '#e9c46a');
  e(ctx, cx + 12, y, 8, 8, '#c15c44');
  e(ctx, cx - 20, y + 16, 28, 12, s.body);
  e(ctx, cx - 40, y + 4, 8, 6, s.body);
  ctx.strokeStyle = s.body;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 44, y);
  ctx.lineTo(cx - 44, y - 18);
  ctx.moveTo(cx - 36, y);
  ctx.lineTo(cx - 36, y - 16);
  ctx.stroke();
  e(ctx, cx - 44, y - 20, 4, 4, '#3d2914');
  e(ctx, cx - 36, y - 18, 4, 4, '#3d2914');
  props(ctx, cx, y, st);
}

function drawHorse(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 58, 13);
  e(ctx, cx + 8, y + 16, 48, 36, s.body);
  e(ctx, cx + 8, y + 28, 28, 18, s.belly);
  e(ctx, cx - 8, y - 16, 16, 22, s.body);
  e(ctx, cx - 28, y - 28, 26, 16, s.body, -0.35);
  e(ctx, cx - 48, y - 22, 16, 12, s.body, -0.2);
  const earH = opt.longEars ? 28 : 18;
  tri(ctx, cx - 36, y - 40, cx - 42, y - 40 - earH, cx - 28, y - 42, s.ear);
  tri(ctx, cx - 20, y - 42, cx - 16, y - 40 - earH, cx - 8, y - 38, s.ear);
  ctx.fillStyle = s.tail;
  ctx.fillRect(cx - 30, y - 50, 28, 10);
  e(ctx, cx + 52, y + 20, 10, 24, s.tail, 0.4);
  eyes(ctx, cx - 40, y - 30, cx - 28, y - 32, 5, st);
  e(ctx, cx - 56, y - 18, 6, 5, s.nose);
  e(ctx, cx - 18, y + 48, 12, 10, s.body);
  e(ctx, cx + 18, y + 48, 12, 10, s.body);
  props(ctx, cx, y, st);
}

function drawPig(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 6;
  shadow(ctx, cx, cy, 56, 13);
  e(ctx, cx + 48, y + 24, 8, 10, s.tail, st.wag * 0.05);
  e(ctx, cx, y + 20, 56, 40, s.body);
  e(ctx, cx, y + 30, 32, 22, s.belly);
  e(ctx, cx - 36, y - 6, 14, 18, s.ear, 0.5);
  e(ctx, cx + 36, y - 6, 14, 18, s.ear, -0.5);
  e(ctx, cx, y - 8, 40, 32, s.body);
  e(ctx, cx, y + 10, 18, 12, s.nose);
  e(ctx, cx - 6, y + 10, 3, 4, '#3d2914');
  e(ctx, cx + 6, y + 10, 3, 4, '#3d2914');
  blush(ctx, cx - 24, y, cx + 24, y, st);
  eyes(ctx, cx - 16, y - 14, cx + 16, y - 14, 7, st);
  e(ctx, cx - 22, y + 52, 14, 10, s.body);
  e(ctx, cx + 22, y + 52, 14, 10, s.body);
  props(ctx, cx, y, st);
}

function drawGoat(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 52, 12);
  e(ctx, cx, y + 20, 48, 36, s.body);
  if (opt.wool) {
    e(ctx, cx - 20, y + 8, 18, 16, '#fff');
    e(ctx, cx + 20, y + 8, 18, 16, '#fff');
    e(ctx, cx, y + 4, 22, 18, '#fff');
  }
  e(ctx, cx, y + 28, 26, 18, s.belly);
  e(ctx, cx - 8, y - 16, 14, 18, s.body);
  e(ctx, cx - 22, y - 24, 20, 14, s.body, -0.2);
  e(ctx, cx - 40, y - 8, 12, 16, s.ear, 0.6);
  e(ctx, cx - 4, y - 10, 12, 16, s.ear, -0.4);
  if (opt.horn) {
    ctx.strokeStyle = '#c4b7a6';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx - 28, y - 36, 12, Math.PI, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 10, y - 36, 12, 0, Math.PI * 0.7, true);
    ctx.stroke();
  }
  eyes(ctx, cx - 28, y - 28, cx - 16, y - 28, 5, st);
  e(ctx, cx - 34, y - 16, 5, 4, s.nose);
  e(ctx, cx - 20, y + 50, 12, 10, s.body);
  e(ctx, cx + 16, y + 50, 12, 10, s.body);
  props(ctx, cx, y, st);
}

function drawCow(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 60, 14);
  e(ctx, cx, y + 18, 60, 42, s.body);
  e(ctx, cx - 16, y + 8, 16, 14, '#3d2914');
  e(ctx, cx + 22, y + 20, 18, 16, '#3d2914');
  e(ctx, cx + 4, y + 36, 14, 12, '#3d2914');
  e(ctx, cx, y + 30, 32, 20, s.belly);
  e(ctx, cx - 10, y - 18, 16, 20, s.body);
  e(ctx, cx - 28, y - 28, 24, 16, s.body, -0.2);
  e(ctx, cx - 48, y - 12, 14, 18, s.ear, 0.5);
  e(ctx, cx - 8, y - 14, 14, 18, s.ear, -0.4);
  e(ctx, cx - 36, y - 16, 10, 8, '#e07a9a');
  eyes(ctx, cx - 36, y - 32, cx - 22, y - 32, 5, st);
  e(ctx, cx - 22, y + 52, 14, 10, s.body);
  e(ctx, cx + 20, y + 52, 14, 10, s.body);
  props(ctx, cx, y, st);
}

function drawAlpaca(ctx, cx, cy, st, s, tall) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 50, 12);
  e(ctx, cx + 6, y + 22, 40, 34, s.body);
  e(ctx, cx + 6, y + 12, 36, 24, s.belly);
  e(ctx, cx - 4, y - 20, 14, tall ? 28 : 22, s.body);
  e(ctx, cx - 8, y - 48, 20, 18, s.body);
  tri(ctx, cx - 18, y - 58, cx - 22, y - 78, cx - 8, y - 58, s.ear);
  tri(ctx, cx + 2, y - 58, cx + 8, y - 78, cx + 12, y - 56, s.ear);
  eyes(ctx, cx - 14, y - 50, cx - 2, y - 50, 5, st);
  e(ctx, cx - 10, y - 38, 5, 4, s.nose);
  e(ctx, cx - 16, y + 50, 12, 10, s.body);
  e(ctx, cx + 16, y + 50, 12, 10, s.body);
  props(ctx, cx, y, st);
}

function drawFox(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 50, 12);
  e(ctx, cx + 50, y + 18, 22, 14, s.tail, 0.4 + st.wag * 0.02);
  e(ctx, cx + 64, y + 10, 10, 10, '#fff8ef');
  e(ctx, cx, y + 22, 48, 36, s.body);
  e(ctx, cx, y + 32, 26, 18, s.belly);
  tri(ctx, cx - 18, y - 16, cx - 32, y - 58, cx - 4, y - 22, s.ear);
  tri(ctx, cx + 18, y - 16, cx + 32, y - 58, cx + 4, y - 22, '#3d2914');
  tri(ctx, cx - 16, y - 20, cx - 26, y - 46, cx - 8, y - 22, s.inner);
  e(ctx, cx, y - 10, 32, 28, s.body);
  e(ctx, cx, y + 6, 16, 12, s.belly);
  eyes(ctx, cx - 12, y - 14, cx + 12, y - 14, 7, st, { slit: true });
  tri(ctx, cx - 4, y - 2, cx + 4, y - 2, cx, y + 6, s.nose);
  whiskers(ctx, cx, y + 2);
  e(ctx, cx - 18, y + 50, 14, 10, s.body);
  e(ctx, cx + 18, y + 50, 14, 10, s.body);
  props(ctx, cx, y, st);
}

function drawRaccoon(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 50, 12);
  e(ctx, cx + 52, y + 22, 20, 10, s.tail, 0.3);
  e(ctx, cx + 44, y + 18, 6, 8, '#fff8ef');
  e(ctx, cx + 58, y + 16, 6, 8, '#3d2914');
  e(ctx, cx, y + 20, 48, 36, s.body);
  e(ctx, cx, y + 30, 28, 18, s.belly);
  e(ctx, cx - 28, y - 18, 12, 12, s.ear);
  e(ctx, cx + 28, y - 18, 12, 12, s.ear);
  e(ctx, cx, y - 12, 34, 28, s.body);
  e(ctx, cx - 14, y - 12, 14, 10, '#1d3557');
  e(ctx, cx + 14, y - 12, 14, 10, '#1d3557');
  eyes(ctx, cx - 12, y - 12, cx + 12, y - 12, 7, st);
  e(ctx, cx, y + 4, 6, 5, s.nose);
  e(ctx, cx - 18, y + 50, 14, 10, s.body);
  e(ctx, cx + 18, y + 50, 14, 10, s.body);
  props(ctx, cx, y, st);
}

function drawPanda(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 56, 13);
  e(ctx, cx, y + 22, 56, 42, '#f5f0e6');
  e(ctx, cx, y + 32, 32, 22, '#ffffff');
  e(ctx, cx - 28, y - 28, 14, 14, '#1d3557');
  e(ctx, cx + 28, y - 28, 14, 14, '#1d3557');
  e(ctx, cx, y - 12, 38, 32, '#f5f0e6');
  e(ctx, cx - 16, y - 14, 14, 12, '#1d3557');
  e(ctx, cx + 16, y - 14, 14, 12, '#1d3557');
  eyes(ctx, cx - 14, y - 14, cx + 14, y - 14, 8, st);
  e(ctx, cx, y + 2, 8, 6, '#1d3557');
  e(ctx, cx - 24, y + 52, 16, 12, '#1d3557');
  e(ctx, cx + 24, y + 52, 16, 12, '#1d3557');
  blush(ctx, cx - 24, y - 2, cx + 24, y - 2, st);
  props(ctx, cx, y, st);
}

function drawKoala(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 4;
  shadow(ctx, cx, cy, 52, 12);
  e(ctx, cx, y + 22, 48, 36, s.body);
  e(ctx, cx, y + 30, 26, 18, s.belly);
  e(ctx, cx - 34, y - 16, 18, 18, s.ear);
  e(ctx, cx + 34, y - 16, 18, 18, s.ear);
  e(ctx, cx - 34, y - 16, 10, 10, s.inner);
  e(ctx, cx + 34, y - 16, 10, 10, s.inner);
  e(ctx, cx, y - 8, 36, 30, s.body);
  e(ctx, cx, y + 6, 14, 12, '#3d2914');
  eyes(ctx, cx - 14, y - 12, cx + 14, y - 12, 7, st);
  e(ctx, cx - 18, y + 50, 14, 10, s.body);
  e(ctx, cx + 18, y + 50, 14, 10, s.body);
  props(ctx, cx, y, st);
}

function drawFerret(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  shadow(ctx, cx, cy, 58, 11);
  e(ctx, cx + 56, y + 16, 22, 10, s.tail, 0.2);
  e(ctx, cx + 10, y + 16, 50, 16, s.body);
  e(ctx, cx + 10, y + 20, 36, 10, s.belly);
  e(ctx, cx - 36, y + 6, 22, 16, s.body);
  e(ctx, cx - 36, y - 2, 16, 8, '#5c4033');
  e(ctx, cx - 48, y, 8, 8, s.ear);
  e(ctx, cx - 28, y - 4, 8, 8, s.ear);
  eyes(ctx, cx - 42, y + 2, cx - 30, y + 2, 5, st);
  e(ctx, cx - 40, y + 12, 4, 3, s.nose);
  e(ctx, cx - 16, y + 30, 10, 7, s.body);
  e(ctx, cx + 16, y + 30, 10, 7, s.body);
  props(ctx, cx, y, st);
}

function drawOtter(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 8;
  shadow(ctx, cx, cy, 52, 11);
  e(ctx, cx + 48, y + 20, 20, 10, s.tail, 0.25);
  e(ctx, cx, y + 18, 46, 28, s.body);
  e(ctx, cx, y + 26, 28, 16, s.belly);
  e(ctx, cx - 28, y - 2, 24, 18, s.body);
  e(ctx, cx - 40, y - 8, 8, 8, s.ear);
  e(ctx, cx - 18, y - 10, 8, 8, s.ear);
  eyes(ctx, cx - 34, y - 4, cx - 22, y - 4, 6, st);
  whiskers(ctx, cx - 28, y + 8);
  e(ctx, cx - 28, y + 10, 5, 4, s.nose);
  e(ctx, cx - 16, y + 42, 12, 8, s.body);
  e(ctx, cx + 14, y + 42, 12, 8, s.body);
  props(ctx, cx, y, st);
}

function drawNewt(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 16;
  shadow(ctx, cx, cy, 50, 10);
  e(ctx, cx + 48, y + 18, 26, 8, s.tail, 0.1);
  e(ctx, cx, y + 16, 42, 14, s.body);
  e(ctx, cx, y + 20, 28, 8, s.belly);
  e(ctx, cx - 32, y + 8, 16, 12, s.body);
  eyes(ctx, cx - 38, y + 4, cx - 28, y + 4, 4, st);
  e(ctx, cx - 18, y + 28, 8, 5, s.body);
  e(ctx, cx + 10, y + 28, 8, 5, s.body);
  props(ctx, cx, y, st);
}

function drawGlider(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  shadow(ctx, cx, cy, 46, 11);
  e(ctx, cx, y + 22, 8, 28, s.body);
  e(ctx, cx - 36, y + 16, 22, 16, '#c4b7a6', 0.3);
  e(ctx, cx + 36, y + 16, 22, 16, '#c4b7a6', -0.3);
  e(ctx, cx, y + 16, 32, 24, s.body);
  e(ctx, cx, y + 22, 18, 14, s.belly);
  e(ctx, cx, y - 8, 22, 18, s.body);
  e(ctx, cx, y - 16, 6, 16, '#3d2914');
  e(ctx, cx - 16, y - 14, 10, 10, s.ear);
  e(ctx, cx + 16, y - 14, 10, 10, s.ear);
  eyes(ctx, cx - 8, y - 8, cx + 8, y - 8, 7, st);
  e(ctx, cx + 40, y + 28, 16, 6, s.tail, 0.2);
  props(ctx, cx, y, st);
}

export function drawSpecies(ctx, p, t, extra = {}) {
  const s = p.species;
  const st = stateOf(p, t, extra);
  const cx = extra.x ?? 400;
  const cy = extra.y ?? 318;
  const scale = extra.scale ?? 1;
  const id = s.id;

  const paint = () => {
    if (id === 'cat') return drawCat(ctx, cx, cy, st, s);
  if (id === 'dog') return drawDog(ctx, cx, cy, st, s);
  if (id === 'rabbit') return drawRabbit(ctx, cx, cy, st, s);
  if (id === 'hamster') return drawRodent(ctx, cx, cy, st, s, { small: true, cheeks: true, ear: 10 });
  if (id === 'guinea-pig') return drawRodent(ctx, cx, cy, st, s, { cheeks: true, ear: 8 });
  if (id === 'mouse') return drawRodent(ctx, cx, cy, st, s, { small: true, tail: 'long', ear: 14 });
  if (id === 'rat') return drawRodent(ctx, cx, cy, st, s, { tail: 'long', ear: 10 });
  if (id === 'gerbil') return drawRodent(ctx, cx, cy, st, s, { small: true, tail: 'tuft', ear: 8 });
  if (id === 'chinchilla') return drawRodent(ctx, cx, cy, st, s, { tail: 'bushy', ear: 16 });
  if (id === 'capybara') return drawRodent(ctx, cx, cy, st, s, { ear: 7 });
  if (id === 'hedgehog') return drawHedgehog(ctx, cx, cy, st, s);
  if (id === 'ferret') return drawFerret(ctx, cx, cy, st, s);
  if (id === 'sugar-glider') return drawGlider(ctx, cx, cy, st, s);
  if (id === 'parrot') return drawParrot(ctx, cx, cy, st);
  if (id === 'chicken') return drawChicken(ctx, cx, cy, st);
  if (id === 'chameleon') return drawChameleon(ctx, cx, cy, st);
  if (id === 'bearded-dragon') return drawBeardedDragon(ctx, cx, cy, st, s);
  if (id === 'parakeet') return drawBird(ctx, cx, cy, st, { body: '#52b788', belly: '#b7e4c7', tail: 22, tailColor: '#2d6a4f' });
  if (id === 'cockatiel') return drawBird(ctx, cx, cy, st, { body: '#f0e6c8', belly: '#fff8e8', crest: '#f4a261', cheek: '#e76f51', tail: 20 });
  if (id === 'lovebird') return drawBird(ctx, cx, cy, st, { body: '#74c69d', belly: '#f4a261', tail: 12 });
  if (id === 'canary') return drawBird(ctx, cx, cy, st, { body: '#ffd166', belly: '#fff3c4', tail: 14 });
  if (id === 'finch') return drawBird(ctx, cx, cy, st, { body: '#c4a484', belly: '#f3e6c8', beak: '#e76f51', tail: 12 });
  if (id === 'pigeon') return drawBird(ctx, cx, cy, st, { body: '#9aa4b0', belly: '#e8edf2', wing: '#6b7280', tail: 16 });
  if (id === 'duck') return drawDuck(ctx, cx, cy, st);
  if (id === 'penguin') return drawPenguin(ctx, cx, cy, st);
  if (id === 'owl') return drawOwl(ctx, cx, cy, st, s);
  if (id === 'goldfish') return drawFishBowl(ctx, cx, cy, st, { body: '#f4a261', belly: '#ffd166', tail: '#e76f51', fin: '#e76f51' });
  if (id === 'betta') return drawFishBowl(ctx, cx, cy, st, { body: '#e63946', belly: '#9b2226', tail: '#7b2cbf', fin: '#7b2cbf' });
  if (id === 'turtle') return drawTurtle(ctx, cx, cy, st, s, 8);
  if (id === 'tortoise') return drawTurtle(ctx, cx, cy, st, s, 16);
  if (id === 'frog') return drawFrog(ctx, cx, cy, st, s);
  if (id === 'axolotl') return drawAxolotl(ctx, cx, cy, st, s);
  if (id === 'newt') return drawNewt(ctx, cx, cy, st, s);
  if (id === 'lizard') return drawLizard(ctx, cx, cy, st, s, {});
  if (id === 'gecko') return drawLizard(ctx, cx, cy, st, s, { spots: true });
  if (id === 'iguana') return drawLizard(ctx, cx, cy, st, s, { crest: true });
  if (id === 'snake') return drawSnake(ctx, cx, cy, st, s);
  if (id === 'hermit-crab') return drawHermit(ctx, cx, cy, st);
  if (id === 'snail') return drawSnail(ctx, cx, cy, st, s);
  if (id === 'horse') return drawHorse(ctx, cx, cy, st, s, {});
  if (id === 'pony') return drawHorse(ctx, cx, cy, st, s, {});
  if (id === 'donkey') return drawHorse(ctx, cx, cy, st, s, { longEars: true });
  if (id === 'pig') return drawPig(ctx, cx, cy, st, s);
  if (id === 'goat') return drawGoat(ctx, cx, cy, st, s, { horn: true });
  if (id === 'sheep') return drawGoat(ctx, cx, cy, st, s, { wool: true });
  if (id === 'cow') return drawCow(ctx, cx, cy, st, s);
  if (id === 'alpaca') return drawAlpaca(ctx, cx, cy, st, s, false);
  if (id === 'llama') return drawAlpaca(ctx, cx, cy, st, s, true);
  if (id === 'fox') return drawFox(ctx, cx, cy, st, s);
  if (id === 'raccoon') return drawRaccoon(ctx, cx, cy, st, s);
  if (id === 'otter') return drawOtter(ctx, cx, cy, st, s);
    if (id === 'panda') return drawPanda(ctx, cx, cy, st);
    if (id === 'koala') return drawKoala(ctx, cx, cy, st, s);
    return drawCat(ctx, cx, cy, st, s);
  };

  if (scale !== 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    paint();
    ctx.restore();
    return;
  }
  paint();
}
