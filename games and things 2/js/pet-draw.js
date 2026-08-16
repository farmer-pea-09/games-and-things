function mix(hex, t, toward = '#000000') {
  const a = parse(hex);
  const b = parse(toward);
  const m = (i) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}

function parse(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length < 6) return [80, 60, 40];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function dark(hex, t = 0.28) {
  return mix(hex, t, '#1a1008');
}

function light(hex, t = 0.28) {
  return mix(hex, t, '#fff8ef');
}

function worldScale(ctx) {
  try {
    const tr = ctx.getTransform();
    return Math.max(0.08, Math.hypot(tr.a, tr.b) || 1);
  } catch {
    return 1;
  }
}

function strokeW(ctx, base, rx = 12, ry = 12) {
  return Math.max(base / worldScale(ctx), Math.min(rx, ry) * 0.1);
}

function oval(ctx, x, y, rx, ry, fill, rot = 0, stroke) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.6, rx), Math.max(0.6, ry), rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW(ctx, 2.6, rx, ry);
    ctx.stroke();
  }
}

function tri(ctx, x1, y1, x2, y2, x3, y3, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW(ctx, 2.8, 12, 12);
    ctx.stroke();
  }
}

function shadow(ctx, cx, cy, rx, ry) {
  oval(ctx, cx, cy + 58, rx, ry, 'rgba(40,22,12,0.22)');
}

function shine(ctx, x, y, rx, ry, rot = -0.4) {
  oval(ctx, x, y, rx, ry, 'rgba(255,248,239,0.38)', rot);
}

function blush(ctx, x1, y1, x2, y2, st) {
  if (!st.loving && st.mood <= 70) return;
  oval(ctx, x1, y1, 11, 7, 'rgba(230,90,100,0.38)');
  oval(ctx, x2, y2, 11, 7, 'rgba(230,90,100,0.38)');
}

function paws(ctx, cx, y, spread, color, ink, toe = '#e8b4b8') {
  oval(ctx, cx - spread, y, 16, 12, color, -0.12, ink);
  oval(ctx, cx + spread, y, 16, 12, color, 0.12, ink);
  oval(ctx, cx - spread - 2, y + 4, 8, 5, toe);
  oval(ctx, cx + spread + 2, y + 4, 8, 5, toe);
}

function fluff(ctx, x, y, rx, ry, color, ink, n = 5) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI - 0.2;
    oval(ctx, x + Math.cos(a) * rx * 0.7, y + Math.sin(a) * ry * 0.35 - ry * 0.2, rx * 0.42, ry * 0.38, color, 0, ink);
  }
}

function eyes(ctx, lx, ly, rx, ry, r, st, opt = {}) {
  const closed = st.sleeping || st.blink;
  const iris = opt.iris || '#4a3728';
  if (closed) {
    ctx.strokeStyle = '#2b1810';
    ctx.lineWidth = strokeW(ctx, Math.max(2.8, r * 0.32), r, r);
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (st.mood > 52 && !st.sleeping) {
      ctx.arc(lx, ly + 1, r * 0.75, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rx, ry + 1, r * 0.75, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else {
      ctx.moveTo(lx - r * 0.9, ly);
      ctx.quadraticCurveTo(lx, ly + (st.sleeping ? 2 : 4), lx + r * 0.9, ly);
      ctx.moveTo(rx - r * 0.9, ry);
      ctx.quadraticCurveTo(rx, ry + (st.sleeping ? 2 : 4), rx + r * 0.9, ry);
      ctx.stroke();
    }
    return;
  }
  const h = st.sad ? r * 0.72 : r;
  oval(ctx, lx, ly, r * 1.05, h * 1.08, '#fff8ef', 0, '#2b1810');
  oval(ctx, rx, ry, r * 1.05, h * 1.08, '#fff8ef', 0, '#2b1810');
  const look = st.loving ? 0 : st.playing ? Math.sin(st.t * 7) * 2.4 : 0;
  const py = ly + (st.sad ? 2 : 0.5);
  const qy = ry + (st.sad ? 2 : 0.5);
  if (opt.slit) {
    oval(ctx, lx + look, py, r * 0.55, h * 0.7, iris);
    oval(ctx, rx + look, qy, r * 0.55, h * 0.7, iris);
    oval(ctx, lx + look, py, 2.1, h * 0.62, '#1a1008');
    oval(ctx, rx + look, qy, 2.1, h * 0.62, '#1a1008');
  } else {
    oval(ctx, lx + look, py, r * 0.62, h * 0.62, iris);
    oval(ctx, rx + look, qy, r * 0.62, h * 0.62, iris);
    oval(ctx, lx + look, py, r * 0.32, h * 0.32, '#1a1008');
    oval(ctx, rx + look, qy, r * 0.32, h * 0.32, '#1a1008');
  }
  oval(ctx, lx - r * 0.28 + look, ly - r * 0.32, r * 0.22, r * 0.18, '#fff');
  oval(ctx, rx - r * 0.28 + look, ry - r * 0.32, r * 0.22, r * 0.18, '#fff');
  oval(ctx, lx + r * 0.18 + look, ly + r * 0.12, r * 0.1, r * 0.08, 'rgba(255,255,255,0.7)');
  oval(ctx, rx + r * 0.18 + look, ry + r * 0.12, r * 0.1, r * 0.08, 'rgba(255,255,255,0.7)');
}

function mouth(ctx, x, y, st, kind = 'smile') {
  ctx.strokeStyle = '#2b1810';
  ctx.lineWidth = strokeW(ctx, 2.8, 10, 10);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (st.eating) ctx.arc(x, y, 7, 0.3, Math.PI - 0.3);
  else if (st.playing || st.mood > 78) ctx.arc(x, y - 1, 10, 0.18, Math.PI - 0.18);
  else if (st.sad) ctx.arc(x, y + 9, 7, Math.PI * 1.18, Math.PI * 1.82, true);
  else if (kind === 'cat') {
    ctx.moveTo(x - 7, y);
    ctx.quadraticCurveTo(x - 3, y + 5, x, y + 1);
    ctx.quadraticCurveTo(x + 3, y + 5, x + 7, y);
  } else {
    ctx.moveTo(x - 8, y);
    ctx.quadraticCurveTo(x, y + 6, x + 8, y);
  }
  ctx.stroke();
}

function whiskers(ctx, x, y) {
  ctx.strokeStyle = 'rgba(43,24,16,0.55)';
  ctx.lineWidth = strokeW(ctx, 2.2, 8, 8);
  ctx.lineCap = 'round';
  ctx.beginPath();
  [[-14, -6, -40, -14], [-14, 1, -42, 1], [-14, 8, -38, 14],
    [14, -6, 40, -14], [14, 1, 42, 1], [14, 8, 38, 14]].forEach(([a, b, c, d]) => {
    ctx.moveTo(x + a, y + b);
    ctx.lineTo(x + c, y + d);
  });
  ctx.stroke();
}

function props(ctx, cx, bodyY, st) {
  if (st.eating) {
    oval(ctx, cx, bodyY + 64, 24, 9, '#6b4226', 0, '#3d2914');
    oval(ctx, cx, bodyY + 60, 15, 5, '#e07a5f');
  }
  if (st.drinking) {
    ctx.fillStyle = 'rgba(76,201,240,0.7)';
    ctx.fillRect(cx - 2.5, bodyY + 6, 5, 48);
  }
  if (st.crying) {
    oval(ctx, cx - 26, bodyY - 6 + ((st.t * 22) % 12), 3.2, 5.5, '#7ec8e3');
  }
}

function body(ctx, x, y, rx, ry, color, rot = 0) {
  oval(ctx, x + 3, y + 5, rx * 0.96, ry * 0.92, dark(color, 0.22), rot);
  oval(ctx, x, y, rx, ry, color, rot, dark(color, 0.48));
  oval(ctx, x, y + ry * 0.3, rx * 0.84, ry * 0.52, dark(color, 0.16), rot);
  oval(ctx, x - rx * 0.22, y - ry * 0.28, rx * 0.38, ry * 0.22, light(color, 0.22), rot);
  shine(ctx, x - rx * 0.3, y - ry * 0.34, rx * 0.3, ry * 0.16);
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
  const ink = dark(s.body, 0.45);
  shadow(ctx, cx, cy, 54, 13);
  oval(ctx, cx + 58, y + 22, 14, 28, s.tail, 0.7 + st.wag * 0.02, ink);
  oval(ctx, cx + 50, y + 8, 8, 10, s.body, 0.4, ink);
  oval(ctx, cx + 64, y + 4, 9, 9, light(s.tail, 0.2), 0, ink);
  for (let i = 0; i < 4; i++) oval(ctx, cx + 46 + i * 6, y + 10 + i * 5, 5, 3, dark(s.body, 0.2));
  body(ctx, cx, y + 26, 52, 38, s.body);
  oval(ctx, cx - 4, y + 38, 26, 18, s.belly);
  tri(ctx, cx - 22, y - 12, cx - 40, y - 72, cx - 2, y - 24, s.ear, ink);
  tri(ctx, cx + 22, y - 12, cx + 40, y - 72, cx + 2, y - 24, s.ear, ink);
  tri(ctx, cx - 20, y - 18, cx - 32, y - 56, cx - 8, y - 24, s.inner);
  tri(ctx, cx + 20, y - 18, cx + 32, y - 56, cx + 8, y - 24, s.inner);
  body(ctx, cx, y - 12, 34, 30, s.body);
  oval(ctx, cx, y + 6, 16, 11, s.belly);
  blush(ctx, cx - 22, y - 2, cx + 22, y - 2, st);
  eyes(ctx, cx - 13, y - 16, cx + 13, y - 16, 10, st, { slit: true, iris: '#3d6b3a' });
  tri(ctx, cx - 6, y - 2, cx + 6, y - 2, cx, y + 6, '#e07a9a', ink);
  mouth(ctx, cx, y + 12, st, 'cat');
  whiskers(ctx, cx, y + 4);
  paws(ctx, cx, y + 56, 22, s.body, ink);
  props(ctx, cx, y, st);
}

function drawDog(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.45);
  shadow(ctx, cx, cy, 58, 14);
  oval(ctx, cx + 60, y + 22, 14, 26, s.tail, 0.85 + st.wag * 0.04, ink);
  oval(ctx, cx + 68, y + 6, 10, 10, light(s.body, 0.1), 0, ink);
  body(ctx, cx, y + 26, 56, 40, s.body);
  oval(ctx, cx - 2, y + 40, 30, 20, s.belly);
  oval(ctx, cx - 42, y + 2, 16, 34, s.ear, 0.7, ink);
  oval(ctx, cx + 42, y + 2, 16, 34, s.ear, -0.7, ink);
  oval(ctx, cx - 40, y + 6, 8, 18, s.inner, 0.7);
  oval(ctx, cx + 40, y + 6, 8, 18, s.inner, -0.7);
  body(ctx, cx, y - 8, 38, 32, s.body);
  oval(ctx, cx + 2, y + 12, 24, 16, s.body, 0.05, ink);
  oval(ctx, cx + 4, y + 16, 16, 10, light(s.body, 0.28));
  oval(ctx, cx - 18, y - 6, 10, 8, light(s.body, 0.35));
  blush(ctx, cx - 24, y, cx + 24, y, st);
  eyes(ctx, cx - 14, y - 14, cx + 12, y - 14, 9, st, { iris: '#6b4226' });
  oval(ctx, cx + 2, y + 10, 10, 8, '#2b1810');
  oval(ctx, cx, y + 8, 3, 2, '#fff8ef');
  mouth(ctx, cx, y + 20, st);
  if (st.mood > 68 && !st.sleeping) oval(ctx, cx + 6, y + 28, 8, 12, '#e07a9a', 0.28, dark('#e07a9a'));
  paws(ctx, cx, y + 58, 24, s.body, ink, '#d4a373');
  props(ctx, cx, y, st);
}

function drawRabbit(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 8;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 48, 12);
  oval(ctx, cx + 36, y + 42, 16, 14, s.tail, 0, ink);
  oval(ctx, cx + 36, y + 42, 9, 8, '#ffffff');
  body(ctx, cx, y + 28, 46, 34, s.body);
  oval(ctx, cx, y + 40, 24, 16, s.belly);
  oval(ctx, cx - 16, y - 56, 12, 46, s.ear, -0.12, ink);
  oval(ctx, cx + 16, y - 56, 12, 46, s.ear, 0.16, ink);
  oval(ctx, cx - 16, y - 52, 5, 32, s.inner, -0.12);
  oval(ctx, cx + 16, y - 52, 5, 32, s.inner, 0.16);
  body(ctx, cx, y - 6, 30, 26, s.body);
  blush(ctx, cx - 18, y + 2, cx + 18, y + 2, st);
  eyes(ctx, cx - 11, y - 12, cx + 11, y - 12, 8.5, st, { iris: '#7a5c3a' });
  oval(ctx, cx, y + 4, 6, 5, '#e07a9a');
  mouth(ctx, cx, y + 12, st, 'cat');
  whiskers(ctx, cx, y + 6);
  paws(ctx, cx, y + 54, 20, s.body, ink, '#ffffff');
  props(ctx, cx, y, st);
}

function drawRodent(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop + (opt.small ? 16 : 10);
  const sc = opt.small ? 0.82 : 1;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 42 * sc, 11);
  if (opt.tail === 'long') oval(ctx, cx + 52 * sc, y + 30, 30 * sc, 5, s.tail, 0.18, ink);
  if (opt.tail === 'tuft') {
    oval(ctx, cx + 48 * sc, y + 26, 22 * sc, 6, s.tail, 0.15, ink);
    oval(ctx, cx + 70 * sc, y + 20, 9 * sc, 9 * sc, s.ear, 0, ink);
  }
  if (opt.tail === 'bushy') oval(ctx, cx + 52 * sc, y + 22, 18 * sc, 15 * sc, s.tail, 0.25, ink);
  body(ctx, cx, y + 18, 44 * sc, 32 * sc, s.body);
  oval(ctx, cx, y + 26, 24 * sc, 16 * sc, s.belly);
  if (opt.cheeks) {
    oval(ctx, cx - 28 * sc, y + 6, 16 * sc, 14 * sc, light(s.body, 0.08), 0, ink);
    oval(ctx, cx + 28 * sc, y + 6, 16 * sc, 14 * sc, light(s.body, 0.08), 0, ink);
  }
  const ear = opt.ear || 12;
  oval(ctx, cx - 28 * sc, y - 16 * sc, ear, ear, s.ear, 0, ink);
  oval(ctx, cx + 28 * sc, y - 16 * sc, ear, ear, s.ear, 0, ink);
  oval(ctx, cx - 28 * sc, y - 16 * sc, ear * 0.5, ear * 0.5, s.inner);
  oval(ctx, cx + 28 * sc, y - 16 * sc, ear * 0.5, ear * 0.5, s.inner);
  body(ctx, cx, y - 2, 30 * sc, 24 * sc, s.body);
  blush(ctx, cx - 16 * sc, y + 4, cx + 16 * sc, y + 4, st);
  eyes(ctx, cx - 10 * sc, y - 8, cx + 10 * sc, y - 8, 7 * sc, st, { iris: '#5c4033' });
  oval(ctx, cx, y + 6, 5 * sc, 4 * sc, s.nose);
  mouth(ctx, cx, y + 14 * sc, st);
  oval(ctx, cx - 16 * sc, y + 44 * sc, 12 * sc, 8 * sc, s.body, 0, ink);
  oval(ctx, cx + 16 * sc, y + 44 * sc, 12 * sc, 8 * sc, s.body, 0, ink);
  oval(ctx, cx - 16 * sc, y + 46 * sc, 6 * sc, 3 * sc, s.inner);
  oval(ctx, cx + 16 * sc, y + 46 * sc, 6 * sc, 3 * sc, s.inner);
  props(ctx, cx, y, st);
}

function drawHedgehog(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 12;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 50, 12);
  for (let i = -8; i <= 8; i++) {
    tri(ctx, cx + i * 7.2, y + 10, cx + i * 7.2 + 4, y - 40 + Math.abs(i) * 1.8, cx + i * 7.2 + 8, y + 10, i % 2 ? '#6b4f32' : '#4e3824', ink);
  }
  body(ctx, cx, y + 20, 46, 26, s.body);
  oval(ctx, cx, y + 28, 26, 14, s.belly);
  body(ctx, cx, y + 4, 26, 18, s.body);
  oval(ctx, cx, y + 12, 16, 10, light(s.body, 0.12));
  eyes(ctx, cx - 10, y, cx + 10, y, 6.5, st, { iris: '#3d2914' });
  oval(ctx, cx, y + 12, 5, 4, '#2b1810');
  mouth(ctx, cx, y + 18, st);
  oval(ctx, cx - 18, y + 42, 12, 8, s.body, 0, ink);
  oval(ctx, cx + 18, y + 42, 12, 8, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawParrot(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 34, 11);
  oval(ctx, cx + 8, y + 36, 10, 34, '#1d3557', 0.42, '#0d1b2a');
  oval(ctx, cx + 18, y + 30, 9, 26, '#457b9d', 0.48, '#1d3557');
  oval(ctx, cx + 26, y + 22, 7, 18, '#e9c46a', 0.5, '#b08968');
  body(ctx, cx, y + 16, 30, 40, '#e63946');
  oval(ctx, cx - 6, y + 22, 16, 22, '#ffd166');
  oval(ctx, cx + 24, y + 6, 20, 28, '#1d3557', 0.55, '#0d1b2a');
  oval(ctx, cx + 18, y + 8, 14, 18, '#2a9d8f', 0.45);
  oval(ctx, cx + 14, y + 4, 10, 12, '#ffd166', 0.4);
  body(ctx, cx - 2, y - 26, 22, 20, '#e63946');
  oval(ctx, cx - 12, y - 22, 14, 12, '#fff8ef', 0, '#2b1810');
  tri(ctx, cx - 22, y - 26, cx - 52, y - 10, cx - 18, y - 4, '#f4a261', '#b08968');
  oval(ctx, cx - 32, y - 12, 7, 5, '#fff8ef');
  oval(ctx, cx - 8, y - 36, 10, 8, '#1d3557');
  eyes(ctx, cx - 6, y - 28, cx + 8, y - 28, 7.5, st, { iris: '#1d3557' });
  ctx.fillStyle = '#2b1810';
  ctx.fillRect(cx - 14, y + 54, 6, 16);
  ctx.fillRect(cx + 6, y + 54, 6, 16);
  tri(ctx, cx - 20, y + 70, cx, y + 70, cx - 12, y + 82, '#f4a261', '#b08968');
  tri(ctx, cx + 2, y + 70, cx + 20, y + 70, cx + 10, y + 82, '#f4a261', '#b08968');
  blush(ctx, cx - 16, y - 16, cx + 10, y - 16, st);
  props(ctx, cx, y, st);
}

function drawChicken(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  const ink = '#cfc6b8';
  shadow(ctx, cx, cy, 40, 11);
  oval(ctx, cx + 26, y + 6, 16, 22, '#f5f0e6', 0.4, ink);
  body(ctx, cx, y + 18, 40, 30, '#f5f0e6');
  oval(ctx, cx - 6, y + 24, 20, 14, '#fff');
  oval(ctx, cx - 16, y + 8, 16, 12, '#eee6d8', -0.15, ink);
  body(ctx, cx, y - 20, 20, 17, '#f5f0e6');
  ctx.fillStyle = '#e63946';
  ctx.strokeStyle = '#9b2226';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, y - 32);
  ctx.quadraticCurveTo(cx - 8, y - 54, cx - 2, y - 32);
  ctx.quadraticCurveTo(cx + 4, y - 58, cx + 8, y - 32);
  ctx.quadraticCurveTo(cx + 14, y - 50, cx + 16, y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  oval(ctx, cx - 5, y - 8, 6, 10, '#e63946', 0, '#9b2226');
  oval(ctx, cx + 5, y - 8, 6, 10, '#e63946', 0, '#9b2226');
  tri(ctx, cx - 16, y - 20, cx - 36, y - 14, cx - 14, y - 8, '#f4a261', '#b08968');
  eyes(ctx, cx - 4, y - 24, cx + 10, y - 24, 6, st, { iris: '#3d2914' });
  ctx.fillStyle = '#f4a261';
  ctx.fillRect(cx - 10, y + 48, 5, 16);
  ctx.fillRect(cx + 6, y + 48, 5, 16);
  tri(ctx, cx - 16, y + 64, cx - 2, y + 64, cx - 10, y + 74, '#e9c46a', '#b08968');
  tri(ctx, cx + 2, y + 64, cx + 16, y + 64, cx + 10, y + 74, '#e9c46a', '#b08968');
  props(ctx, cx, y, st);
}

function drawChameleon(ctx, cx, cy, st) {
  const g = st.mood > 72 ? '#52b788' : st.sad ? '#6b705c' : '#2d6a4f';
  const y = cy + st.idle - st.hop + 8;
  const ink = dark(g, 0.35);
  shadow(ctx, cx, cy, 52, 12);
  ctx.strokeStyle = g;
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx + 50, y + 30, 17, Math.PI * 0.15, Math.PI * 1.85, true);
  ctx.stroke();
  body(ctx, cx + 10, y + 20, 46, 20, g);
  oval(ctx, cx + 10, y + 26, 30, 10, '#95d5b2');
  oval(ctx, cx + 8, y + 10, 38, 5, '#1b4332');
  body(ctx, cx - 34, y + 4, 24, 17, g);
  tri(ctx, cx - 38, y - 6, cx - 26, y - 34, cx - 14, y - 4, g, ink);
  oval(ctx, cx - 48, y - 4, 11, 11, '#d8f3dc', 0, ink);
  oval(ctx, cx - 26, y, 11, 11, '#d8f3dc', 0, ink);
  if (!st.sleeping && !st.blink) {
    const a = Math.sin(st.t * 1.3) * 3;
    const b = Math.cos(st.t * 1.05) * 3;
    oval(ctx, cx - 48 + a, y - 4, 4.2, 4.2, '#1b4332');
    oval(ctx, cx - 26 + b, y, 4.2, 4.2, '#1b4332');
    oval(ctx, cx - 50 + a, y - 6, 1.6, 1.6, '#fff');
    oval(ctx, cx - 28 + b, y - 2, 1.6, 1.6, '#fff');
  } else {
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - 48, y - 4, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 26, y, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  oval(ctx, cx - 56, y + 10, 8, 4, '#1b4332');
  oval(ctx, cx - 18, y + 40, 11, 7, g, 0, ink);
  oval(ctx, cx + 10, y + 42, 11, 7, g, 0, ink);
  oval(ctx, cx - 22, y + 46, 8, 5, '#1b4332');
  oval(ctx, cx + 14, y + 48, 8, 5, '#1b4332');
  props(ctx, cx, y, st);
}

function drawBeardedDragon(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 56, 13);
  for (let i = 0; i < 6; i++) oval(ctx, cx + 28 + i * 9, y + 18 + i * 1.2, 8, 6, i % 2 ? '#b08968' : '#d4a373', 0, ink);
  body(ctx, cx, y + 22, 50, 22, s.body);
  oval(ctx, cx, y + 28, 32, 10, s.belly);
  body(ctx, cx, y - 2, 34, 20, s.body);
  for (let i = -6; i <= 6; i++) {
    tri(ctx, cx + i * 5.5 - 3, y + 12, cx + i * 5.5, y + 26, cx + i * 5.5 + 3, y + 12, '#8d5a3a');
  }
  tri(ctx, cx - 22, y - 6, cx, y - 28, cx + 22, y - 6, s.body, ink);
  eyes(ctx, cx - 12, y - 6, cx + 12, y - 6, 6.5, st, { iris: '#6b4226' });
  oval(ctx, cx, y + 6, 6, 4, '#5c4033');
  oval(ctx, cx - 28, y + 36, 14, 8, s.body, 0, ink);
  oval(ctx, cx + 28, y + 36, 14, 8, s.body, 0, ink);
  oval(ctx, cx - 34, y + 42, 10, 6, '#8d5a3a', 0, ink);
  oval(ctx, cx + 34, y + 42, 10, 6, '#8d5a3a', 0, ink);
  props(ctx, cx, y, st);
}

function drawBird(ctx, cx, cy, st, opt) {
  const y = cy + st.idle - st.hop + 6;
  const ink = dark(opt.body, 0.4);
  shadow(ctx, cx, cy, 30, 10);
  oval(ctx, cx + 18, y + 16, 9, opt.tail || 18, opt.tailColor || opt.body, 0.45, ink);
  oval(ctx, cx + 26, y + 10, 6, (opt.tail || 18) * 0.7, light(opt.tailColor || opt.body, 0.15), 0.5, ink);
  body(ctx, cx, y + 14, 24, 26, opt.body);
  oval(ctx, cx - 2, y + 18, 12, 14, opt.belly);
  oval(ctx, cx + 16, y + 8, 16, 17, opt.wing || dark(opt.body, 0.12), 0.45, ink);
  oval(ctx, cx + 12, y + 10, 9, 10, light(opt.wing || opt.body, 0.2), 0.4);
  body(ctx, cx, y - 16, 16, 14, opt.head || opt.body);
  if (opt.crest) tri(ctx, cx - 2, y - 24, cx + 4, y - 50, cx + 12, y - 22, opt.crest, dark(opt.crest, 0.3));
  if (opt.cheek) oval(ctx, cx - 8, y - 12, 7, 6, opt.cheek);
  tri(ctx, cx - 14, y - 16, cx - 30, y - 9, cx - 12, y - 5, opt.beak || '#f4a261', '#b08968');
  eyes(ctx, cx - 2, y - 18, cx + 8, y - 18, 6, st, { iris: '#2b1810' });
  ctx.fillStyle = '#2b1810';
  ctx.fillRect(cx - 8, y + 40, 4, 14);
  ctx.fillRect(cx + 4, y + 40, 4, 14);
  tri(ctx, cx - 12, y + 54, cx - 4, y + 54, cx - 8, y + 62, '#f4a261', '#b08968');
  tri(ctx, cx + 2, y + 54, cx + 10, y + 54, cx + 6, y + 62, '#f4a261', '#b08968');
  props(ctx, cx, y, st);
}

function drawPenguin(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 34, 11);
  body(ctx, cx, y + 12, 32, 44, '#1d3557');
  oval(ctx, cx, y + 18, 20, 30, '#fff8ef');
  oval(ctx, cx, y + 8, 10, 8, '#e63946');
  oval(ctx, cx - 30, y + 10, 12, 22, '#1d3557', 0.45, '#0d1b2a');
  oval(ctx, cx + 30, y + 10, 12, 22, '#1d3557', -0.45, '#0d1b2a');
  oval(ctx, cx - 28, y + 8, 6, 10, '#4cc9f0', 0.4);
  oval(ctx, cx + 28, y + 8, 6, 10, '#4cc9f0', -0.4);
  body(ctx, cx, y - 28, 22, 20, '#1d3557');
  oval(ctx, cx, y - 22, 14, 12, '#fff8ef');
  tri(ctx, cx - 7, y - 18, cx + 7, y - 18, cx, y - 2, '#f4a261', '#b08968');
  eyes(ctx, cx - 8, y - 30, cx + 8, y - 30, 7, st, { iris: '#1d3557' });
  oval(ctx, cx - 12, y + 54, 14, 6, '#f4a261', -0.15, '#b08968');
  oval(ctx, cx + 12, y + 54, 14, 6, '#f4a261', 0.15, '#b08968');
  props(ctx, cx, y, st);
}

function drawOwl(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.45);
  shadow(ctx, cx, cy, 38, 11);
  body(ctx, cx, y + 14, 36, 40, s.body);
  oval(ctx, cx, y + 22, 22, 22, s.belly);
  for (let i = 0; i < 4; i++) oval(ctx, cx - 10 + (i % 2) * 20, y + 10 + Math.floor(i / 2) * 14, 8, 6, dark(s.body, 0.12));
  tri(ctx, cx - 18, y - 18, cx - 30, y - 56, cx - 4, y - 22, s.ear, ink);
  tri(ctx, cx + 18, y - 18, cx + 30, y - 56, cx + 4, y - 22, s.ear, ink);
  body(ctx, cx, y - 14, 28, 24, s.body);
  oval(ctx, cx - 12, y - 14, 16, 16, '#f3e6c8', 0, ink);
  oval(ctx, cx + 12, y - 14, 16, 16, '#f3e6c8', 0, ink);
  eyes(ctx, cx - 12, y - 14, cx + 12, y - 14, 10, st, { iris: '#e9c46a' });
  tri(ctx, cx - 6, y - 2, cx + 6, y - 2, cx, y + 12, '#e76f51', '#9b2226');
  ctx.fillStyle = '#2b1810';
  ctx.fillRect(cx - 10, y + 52, 5, 12);
  ctx.fillRect(cx + 6, y + 52, 5, 12);
  tri(ctx, cx - 16, y + 64, cx - 4, y + 64, cx - 10, y + 74, '#e76f51', '#9b2226');
  tri(ctx, cx + 4, y + 64, cx + 16, y + 64, cx + 10, y + 74, '#e76f51', '#9b2226');
  props(ctx, cx, y, st);
}

function drawDuck(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop + 8;
  shadow(ctx, cx, cy, 40, 11);
  body(ctx, cx, y + 16, 36, 24, '#f0c36c');
  oval(ctx, cx - 4, y + 22, 22, 12, '#fff3d6');
  oval(ctx, cx + 28, y + 8, 14, 10, '#e9c46a', 0, dark('#f0c36c'));
  body(ctx, cx - 16, y - 10, 18, 16, '#f0c36c');
  oval(ctx, cx - 30, y - 8, 16, 6, '#f4a261', 0, '#b08968');
  eyes(ctx, cx - 18, y - 14, cx - 6, y - 14, 5.5, st, { iris: '#3d2914' });
  oval(ctx, cx - 12, y + 42, 13, 6, '#f4a261', 0, '#b08968');
  oval(ctx, cx + 10, y + 42, 13, 6, '#f4a261', 0, '#b08968');
  props(ctx, cx, y, st);
}

function drawFishBowl(ctx, cx, cy, st, opt) {
  const y = cy + 8;
  shadow(ctx, cx, cy, 50, 12);
  ctx.beginPath();
  ctx.ellipse(cx, y + 8, 56, 50, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120, 198, 230, 0.32)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,140,170,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  oval(ctx, cx, y + 54, 24, 6, '#c9855a', 0, '#6b4226');
  const fx = cx + Math.sin(st.t * 2) * 16;
  const fy = y + 4 + Math.sin(st.t * 3) * 8 - st.hop * 0.3;
  oval(ctx, fx + 24, fy, 16, 14, opt.tail, st.wag * 0.02, dark(opt.tail, 0.25));
  oval(ctx, fx + 30, fy - 4, 10, 10, light(opt.tail, 0.15), st.wag * 0.03);
  body(ctx, fx, fy, 22, 13, opt.body);
  oval(ctx, fx, fy + 4, 12, 6, opt.belly);
  tri(ctx, fx - 4, fy - 10, fx + 8, fy - 24, fx + 12, fy - 6, opt.fin || opt.body, dark(opt.body, 0.3));
  tri(ctx, fx + 2, fy + 6, fx + 16, fy + 16, fx + 10, fy + 2, opt.fin || opt.body, dark(opt.body, 0.3));
  oval(ctx, fx - 10, fy - 2, 5.5, 5.5, '#fff8ef', 0, '#2b1810');
  oval(ctx, fx - 10, fy - 2, 2.4, 2.4, '#2b1810');
  oval(ctx, fx - 12, fy - 4, 1.4, 1.4, '#fff');
  if (st.sleeping) {
    ctx.fillStyle = '#c9b6ff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('Z', fx + 24, fy - 16);
  }
  props(ctx, cx, y, st);
}

function drawTurtle(ctx, cx, cy, st, s, dome) {
  const y = cy + st.idle - st.hop + 14;
  const ink = dark(s.ear, 0.3);
  shadow(ctx, cx, cy, 54, 12);
  oval(ctx, cx, y + 8, 54, 20 + dome, s.ear, 0, ink);
  oval(ctx, cx, y + 2, 36, 12 + dome * 0.55, s.body, 0, dark(s.body, 0.25));
  ctx.strokeStyle = 'rgba(43,24,16,0.4)';
  ctx.lineWidth = strokeW(ctx, 2.4, 16, 12);
  ctx.strokeRect(cx - 20, y - 10, 18, 14);
  ctx.strokeRect(cx + 2, y - 10, 18, 14);
  ctx.strokeRect(cx - 12, y + 4, 22, 14);
  ctx.strokeRect(cx - 28, y + 2, 14, 12);
  ctx.strokeRect(cx + 16, y + 2, 14, 12);
  body(ctx, cx - 42, y + 10, 16, 12, s.body);
  oval(ctx, cx - 50, y + 6, 10, 8, s.body, 0, ink);
  eyes(ctx, cx - 54, y + 2, cx - 46, y + 2, 4.2, st, { iris: '#1b4332' });
  oval(ctx, cx - 28, y + 28, 10, 7, s.body, 0, ink);
  oval(ctx, cx + 18, y + 28, 10, 7, s.body, 0, ink);
  oval(ctx, cx + 42, y + 16, 10, 6, s.tail, 0, ink);
  props(ctx, cx, y, st);
}

function drawFrog(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 16;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 50, 12);
  body(ctx, cx, y + 18, 48, 24, s.body);
  oval(ctx, cx, y + 24, 28, 12, s.belly);
  body(ctx, cx, y - 2, 32, 18, s.body);
  oval(ctx, cx - 16, y - 18, 13, 13, s.body, 0, ink);
  oval(ctx, cx + 16, y - 18, 13, 13, s.body, 0, ink);
  eyes(ctx, cx - 16, y - 18, cx + 16, y - 18, 7.5, st, { iris: '#1b4332' });
  mouth(ctx, cx, y + 10, st);
  oval(ctx, cx - 30, y + 36, 16, 10, s.body, 0, ink);
  oval(ctx, cx + 30, y + 36, 16, 10, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawAxolotl(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 52, 12);
  oval(ctx, cx + 50, y + 22, 24, 10, s.tail, 0.15, ink);
  body(ctx, cx, y + 18, 48, 20, s.body);
  oval(ctx, cx, y + 24, 28, 10, s.belly);
  body(ctx, cx - 28, y + 2, 24, 18, s.body);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      oval(ctx, cx - 28 + side * (26 + i * 2), y - 8 + i * 10, 12, 5, s.ear, side * 0.5, ink);
    }
  }
  eyes(ctx, cx - 36, y - 2, cx - 20, y - 2, 5.5, st, { iris: '#7b2cbf' });
  mouth(ctx, cx - 28, y + 12, st);
  oval(ctx, cx - 16, y + 36, 10, 7, s.body, 0, ink);
  oval(ctx, cx + 12, y + 36, 10, 7, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawLizard(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop + 12;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 54, 12);
  oval(ctx, cx + 52, y + 22, 30, 8, s.tail, 0.15, ink);
  body(ctx, cx, y + 18, 48, 16, s.body);
  oval(ctx, cx, y + 22, 28, 8, s.belly);
  if (opt.crest) {
    for (let i = -3; i < 6; i++) tri(ctx, cx + i * 8, y + 4, cx + i * 8 + 4, y - 16, cx + i * 8 + 8, y + 4, s.ear, ink);
  }
  if (opt.spots) {
    oval(ctx, cx - 12, y + 12, 8, 7, 'rgba(61,41,20,0.45)');
    oval(ctx, cx + 14, y + 16, 7, 6, 'rgba(61,41,20,0.45)');
    oval(ctx, cx + 2, y + 8, 6, 6, 'rgba(61,41,20,0.4)');
    oval(ctx, cx - 22, y + 18, 5, 5, 'rgba(61,41,20,0.35)');
    oval(ctx, cx + 22, y + 10, 5, 4, 'rgba(61,41,20,0.35)');
  }
  body(ctx, cx - 36, y + 4, 20, 13, s.body);
  eyes(ctx, cx - 42, y, cx - 30, y, 5.2, st, { iris: '#1b4332' });
  oval(ctx, cx - 22, y + 32, 10, 6, s.body, 0, ink);
  oval(ctx, cx + 10, y + 32, 10, 6, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawSnake(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 16;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 58, 13);
  oval(ctx, cx + 16, y + 28, 54, 14, s.body, 0.15, ink);
  oval(ctx, cx - 20, y + 16, 40, 14, s.body, -0.25, ink);
  oval(ctx, cx + 8, y + 8, 28, 12, s.body, 0.4, ink);
  oval(ctx, cx + 4, y + 22, 12, 8, dark(s.body, 0.2));
  oval(ctx, cx - 24, y + 12, 10, 7, dark(s.body, 0.2));
  oval(ctx, cx + 28, y + 30, 10, 7, dark(s.body, 0.2));
  body(ctx, cx - 8, y - 6, 22, 18, s.body);
  eyes(ctx, cx - 14, y - 10, cx - 2, y - 10, 5.5, st, { slit: true, iris: '#3d6b3a' });
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
  shadow(ctx, cx, cy, 40, 11);
  oval(ctx, cx + 10, y + 6, 28, 24, '#c15c44', 0, '#6b4226');
  oval(ctx, cx + 10, y, 16, 14, '#e07a5f');
  shine(ctx, cx + 2, y - 6, 8, 5);
  oval(ctx, cx - 24, y + 16, 16, 12, '#e07a5f', 0, '#9b2226');
  oval(ctx, cx - 38, y + 12, 12, 8, '#c15c44', 0, '#9b2226');
  oval(ctx, cx - 42, y + 2, 5, 10, '#2b1810');
  oval(ctx, cx - 34, y + 2, 5, 10, '#2b1810');
  oval(ctx, cx - 28, y + 2, 5.5, 5.5, '#fff8ef', 0, '#2b1810');
  oval(ctx, cx - 20, y + 2, 5.5, 5.5, '#fff8ef', 0, '#2b1810');
  oval(ctx, cx - 28, y + 2, 2.2, 2.2, '#2b1810');
  oval(ctx, cx - 20, y + 2, 2.2, 2.2, '#2b1810');
  oval(ctx, cx - 16, y + 32, 8, 5, '#e07a5f', 0, '#9b2226');
  oval(ctx, cx - 4, y + 34, 8, 5, '#e07a5f', 0, '#9b2226');
  props(ctx, cx, y, st);
}

function drawSnail(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 22;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 42, 11);
  oval(ctx, cx + 12, y, 26, 24, '#c15c44', 0, '#6b4226');
  oval(ctx, cx + 12, y, 16, 16, '#e9c46a', 0, '#b08968');
  oval(ctx, cx + 12, y, 7, 7, '#c15c44');
  oval(ctx, cx - 20, y + 16, 28, 12, s.body, 0, ink);
  oval(ctx, cx - 40, y + 4, 8, 6, s.body, 0, ink);
  ctx.strokeStyle = s.body;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 44, y);
  ctx.lineTo(cx - 44, y - 20);
  ctx.moveTo(cx - 36, y);
  ctx.lineTo(cx - 36, y - 18);
  ctx.stroke();
  oval(ctx, cx - 44, y - 22, 4.5, 4.5, '#2b1810');
  oval(ctx, cx - 36, y - 20, 4.5, 4.5, '#2b1810');
  props(ctx, cx, y, st);
}

function drawHorse(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 58, 14);
  body(ctx, cx + 8, y + 16, 48, 34, s.body);
  oval(ctx, cx + 8, y + 28, 26, 16, s.belly);
  oval(ctx, cx - 8, y - 16, 16, 22, s.body, 0, ink);
  body(ctx, cx - 28, y - 28, 26, 15, s.body);
  oval(ctx, cx - 48, y - 22, 16, 12, s.body, -0.2, ink);
  const earH = opt.longEars ? 28 : 18;
  tri(ctx, cx - 36, y - 40, cx - 42, y - 40 - earH, cx - 28, y - 42, s.ear, ink);
  tri(ctx, cx - 20, y - 42, cx - 16, y - 40 - earH, cx - 8, y - 38, s.ear, ink);
  ctx.fillStyle = s.tail;
  ctx.fillRect(cx - 32, y - 54, 32, 14);
  oval(ctx, cx - 16, y - 56, 18, 10, s.tail, 0, ink);
  oval(ctx, cx + 54, y + 18, 12, 28, s.tail, 0.45 + st.wag * 0.02, ink);
  eyes(ctx, cx - 40, y - 30, cx - 28, y - 32, 5.8, st, { iris: '#3d2914' });
  oval(ctx, cx - 56, y - 18, 7, 6, '#2b1810');
  oval(ctx, cx - 20, y + 50, 11, 18, s.body, 0.05, ink);
  oval(ctx, cx + 16, y + 50, 11, 18, s.body, -0.05, ink);
  oval(ctx, cx - 20, y + 66, 12, 8, '#2b1810', 0, ink);
  oval(ctx, cx + 16, y + 66, 12, 8, '#2b1810', 0, ink);
  props(ctx, cx, y, st);
}

function drawPig(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 6;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 56, 14);
  oval(ctx, cx + 48, y + 24, 8, 10, s.tail, st.wag * 0.05, ink);
  body(ctx, cx, y + 20, 56, 38, s.body);
  oval(ctx, cx, y + 32, 30, 20, s.belly);
  oval(ctx, cx - 36, y - 4, 14, 18, s.ear, 0.5, ink);
  oval(ctx, cx + 36, y - 4, 14, 18, s.ear, -0.5, ink);
  body(ctx, cx, y - 6, 40, 30, s.body);
  oval(ctx, cx, y + 12, 20, 14, s.nose, 0, ink);
  oval(ctx, cx, y + 10, 12, 8, light(s.nose, 0.25));
  oval(ctx, cx - 7, y + 12, 3.6, 4.8, '#2b1810');
  oval(ctx, cx + 7, y + 12, 3.6, 4.8, '#2b1810');
  blush(ctx, cx - 24, y + 2, cx + 24, y + 2, st);
  eyes(ctx, cx - 16, y - 12, cx + 16, y - 12, 7.5, st, { iris: '#5c4033' });
  oval(ctx, cx - 22, y + 54, 14, 10, s.body, 0, ink);
  oval(ctx, cx + 22, y + 54, 14, 10, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawGoat(ctx, cx, cy, st, s, opt) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 52, 13);
  body(ctx, cx, y + 20, 48, 34, s.body);
  if (opt.wool) {
    fluff(ctx, cx, y + 10, 42, 28, '#fff8ef', '#cfc6b8', 7);
    oval(ctx, cx - 22, y + 8, 20, 18, '#fff8ef', 0, '#cfc6b8');
    oval(ctx, cx + 22, y + 8, 20, 18, '#fff8ef', 0, '#cfc6b8');
    oval(ctx, cx, y + 2, 24, 20, '#fff8ef', 0, '#cfc6b8');
  }
  oval(ctx, cx, y + 28, 24, 16, s.belly);
  oval(ctx, cx - 8, y - 16, 14, 18, s.body, 0, ink);
  body(ctx, cx - 22, y - 24, 20, 14, s.body);
  oval(ctx, cx - 40, y - 8, 12, 16, s.ear, 0.6, ink);
  oval(ctx, cx - 4, y - 10, 12, 16, s.ear, -0.4, ink);
  if (opt.horn) {
    ctx.strokeStyle = '#c4b7a6';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx - 28, y - 36, 12, Math.PI, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 10, y - 36, 12, 0, Math.PI * 0.7, true);
    ctx.stroke();
  }
  eyes(ctx, cx - 28, y - 28, cx - 16, y - 28, 5.2, st, { iris: '#3d2914' });
  oval(ctx, cx - 34, y - 16, 5, 4, '#2b1810');
  oval(ctx, cx - 20, y + 50, 12, 10, s.body, 0, ink);
  oval(ctx, cx + 16, y + 50, 12, 10, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawCow(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 60, 14);
  body(ctx, cx, y + 18, 60, 40, s.body);
  oval(ctx, cx - 18, y + 6, 18, 16, '#2b1810');
  oval(ctx, cx + 24, y + 18, 20, 18, '#2b1810');
  oval(ctx, cx + 6, y + 34, 16, 14, '#2b1810');
  oval(ctx, cx - 28, y + 28, 12, 10, '#2b1810');
  oval(ctx, cx, y + 30, 30, 18, s.belly);
  oval(ctx, cx - 10, y - 18, 16, 20, s.body, 0, ink);
  body(ctx, cx - 28, y - 28, 24, 16, s.body);
  oval(ctx, cx - 48, y - 12, 14, 18, s.ear, 0.5, ink);
  oval(ctx, cx - 8, y - 14, 14, 18, s.ear, -0.4, ink);
  oval(ctx, cx - 36, y - 16, 10, 8, '#e07a9a', 0, '#9b2226');
  eyes(ctx, cx - 36, y - 32, cx - 22, y - 32, 5.5, st, { iris: '#3d2914' });
  oval(ctx, cx - 22, y + 52, 14, 10, s.body, 0, ink);
  oval(ctx, cx + 20, y + 52, 14, 10, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawAlpaca(ctx, cx, cy, st, s, tall) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 50, 13);
  body(ctx, cx + 6, y + 22, 40, 32, s.body);
  oval(ctx, cx + 6, y + 14, 32, 20, s.belly);
  oval(ctx, cx - 4, y - 20, 14, tall ? 28 : 22, s.body, 0, ink);
  fluff(ctx, cx - 8, y - 50, 26, 16, s.body, ink, 6);
  body(ctx, cx - 8, y - 48, 22, 18, s.body);
  tri(ctx, cx - 18, y - 58, cx - 22, y - 80, cx - 8, y - 58, s.ear, ink);
  tri(ctx, cx + 2, y - 58, cx + 8, y - 80, cx + 12, y - 56, s.ear, ink);
  eyes(ctx, cx - 14, y - 50, cx - 2, y - 50, 5.2, st, { iris: '#5c4033' });
  oval(ctx, cx - 10, y - 38, 5, 4, '#2b1810');
  oval(ctx, cx - 16, y + 50, 12, 10, s.body, 0, ink);
  oval(ctx, cx + 16, y + 50, 12, 10, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawFox(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 52, 13);
  oval(ctx, cx + 54, y + 14, 26, 16, s.body, 0.45 + st.wag * 0.02, ink);
  oval(ctx, cx + 70, y + 4, 14, 12, '#fff8ef', 0.2, ink);
  body(ctx, cx, y + 22, 48, 34, s.body);
  oval(ctx, cx, y + 36, 26, 16, s.belly);
  tri(ctx, cx - 20, y - 12, cx - 36, y - 64, cx - 4, y - 20, s.ear, ink);
  tri(ctx, cx + 20, y - 12, cx + 36, y - 64, cx + 4, y - 20, s.ear, ink);
  tri(ctx, cx - 18, y - 16, cx - 28, y - 50, cx - 8, y - 20, s.inner);
  tri(ctx, cx + 18, y - 16, cx + 28, y - 50, cx + 8, y - 20, s.inner);
  oval(ctx, cx + 28, y - 48, 6, 8, '#2b1810');
  oval(ctx, cx - 28, y - 48, 6, 8, '#2b1810');
  body(ctx, cx, y - 8, 32, 26, s.body);
  oval(ctx, cx, y + 10, 18, 14, s.belly);
  eyes(ctx, cx - 12, y - 12, cx + 12, y - 12, 8, st, { slit: true, iris: '#c45c26' });
  tri(ctx, cx - 5, y, cx + 5, y, cx, y + 10, '#2b1810');
  whiskers(ctx, cx, y + 4);
  paws(ctx, cx, y + 54, 20, '#2b1810', '#1a1008', '#3d2914');
  props(ctx, cx, y, st);
}

function drawRaccoon(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.45);
  shadow(ctx, cx, cy, 52, 13);
  oval(ctx, cx + 54, y + 20, 24, 12, s.body, 0.35, ink);
  oval(ctx, cx + 42, y + 16, 7, 9, '#fff8ef');
  oval(ctx, cx + 54, y + 14, 7, 9, '#1d3557');
  oval(ctx, cx + 66, y + 10, 7, 9, '#fff8ef');
  body(ctx, cx, y + 20, 48, 34, s.body);
  oval(ctx, cx, y + 34, 26, 16, s.belly);
  oval(ctx, cx - 28, y - 18, 13, 13, s.ear, 0, ink);
  oval(ctx, cx + 28, y - 18, 13, 13, s.ear, 0, ink);
  oval(ctx, cx - 28, y - 18, 6, 6, s.inner);
  oval(ctx, cx + 28, y - 18, 6, 6, s.inner);
  body(ctx, cx, y - 10, 34, 26, s.body);
  oval(ctx, cx - 14, y - 10, 16, 12, '#1d3557');
  oval(ctx, cx + 14, y - 10, 16, 12, '#1d3557');
  oval(ctx, cx, y + 8, 10, 6, '#fff8ef');
  eyes(ctx, cx - 12, y - 10, cx + 12, y - 10, 8, st, { iris: '#3d2914' });
  oval(ctx, cx, y + 6, 7, 6, '#2b1810');
  paws(ctx, cx, y + 54, 20, '#2b1810', '#0d1b2a', '#8a817c');
  props(ctx, cx, y, st);
}

function drawBear(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 58, 14);
  body(ctx, cx, y + 22, 58, 42, s.body);
  oval(ctx, cx, y + 36, 28, 18, s.belly);
  oval(ctx, cx - 30, y - 26, 16, 16, s.ear, 0, ink);
  oval(ctx, cx + 30, y - 26, 16, 16, s.ear, 0, ink);
  oval(ctx, cx - 30, y - 26, 8, 8, s.inner);
  oval(ctx, cx + 30, y - 26, 8, 8, s.inner);
  body(ctx, cx, y - 8, 40, 32, s.body);
  oval(ctx, cx, y + 10, 16, 12, s.belly);
  eyes(ctx, cx - 14, y - 10, cx + 14, y - 10, 8.5, st, { iris: '#3d2914' });
  oval(ctx, cx, y + 6, 10, 8, '#2b1810');
  mouth(ctx, cx, y + 18, st);
  paws(ctx, cx, y + 56, 26, s.body, ink, s.belly);
  blush(ctx, cx - 24, y + 2, cx + 24, y + 2, st);
  props(ctx, cx, y, st);
}

function drawPanda(ctx, cx, cy, st) {
  const y = cy + st.idle - st.hop;
  shadow(ctx, cx, cy, 56, 14);
  body(ctx, cx, y + 22, 56, 40, '#f5f0e6');
  oval(ctx, cx, y + 34, 30, 20, '#ffffff');
  oval(ctx, cx - 28, y - 28, 15, 15, '#1d3557', 0, '#0d1b2a');
  oval(ctx, cx + 28, y - 28, 15, 15, '#1d3557', 0, '#0d1b2a');
  body(ctx, cx, y - 10, 38, 30, '#f5f0e6');
  oval(ctx, cx - 16, y - 12, 14, 12, '#1d3557');
  oval(ctx, cx + 16, y - 12, 14, 12, '#1d3557');
  eyes(ctx, cx - 14, y - 12, cx + 14, y - 12, 8.5, st, { iris: '#1d3557' });
  oval(ctx, cx, y + 4, 8, 6, '#1d3557');
  paws(ctx, cx, y + 56, 24, '#1d3557', '#0d1b2a', '#4a6fa5');
  blush(ctx, cx - 24, y, cx + 24, y, st);
  props(ctx, cx, y, st);
}

function drawKoala(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 4;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 54, 13);
  body(ctx, cx, y + 22, 48, 34, s.body);
  oval(ctx, cx, y + 32, 24, 16, s.belly);
  oval(ctx, cx - 34, y - 16, 20, 20, s.ear, 0, ink);
  oval(ctx, cx + 34, y - 16, 20, 20, s.ear, 0, ink);
  oval(ctx, cx - 34, y - 16, 11, 11, s.inner);
  oval(ctx, cx + 34, y - 16, 11, 11, s.inner);
  body(ctx, cx, y - 6, 36, 28, s.body);
  oval(ctx, cx, y + 8, 14, 12, '#2b1810');
  oval(ctx, cx, y + 6, 6, 5, '#fff8ef');
  eyes(ctx, cx - 14, y - 10, cx + 14, y - 10, 8, st, { iris: '#3d2914' });
  paws(ctx, cx, y + 54, 20, s.body, ink, s.inner);
  props(ctx, cx, y, st);
}

function drawFerret(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 58, 12);
  oval(ctx, cx + 56, y + 16, 22, 10, s.tail, 0.2, ink);
  body(ctx, cx + 10, y + 16, 50, 15, s.body);
  oval(ctx, cx + 10, y + 20, 34, 8, s.belly);
  body(ctx, cx - 36, y + 6, 22, 15, s.body);
  oval(ctx, cx - 36, y - 2, 16, 8, '#5c4033');
  oval(ctx, cx - 48, y, 8, 8, s.ear, 0, ink);
  oval(ctx, cx - 28, y - 4, 8, 8, s.ear, 0, ink);
  eyes(ctx, cx - 42, y + 2, cx - 30, y + 2, 5.2, st, { iris: '#3d2914' });
  oval(ctx, cx - 40, y + 12, 4, 3, '#2b1810');
  oval(ctx, cx - 16, y + 30, 10, 7, s.body, 0, ink);
  oval(ctx, cx + 16, y + 30, 10, 7, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawOtter(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 8;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 52, 12);
  oval(ctx, cx + 48, y + 20, 20, 10, s.tail, 0.25, ink);
  body(ctx, cx, y + 18, 46, 26, s.body);
  oval(ctx, cx, y + 26, 26, 14, s.belly);
  body(ctx, cx - 28, y - 2, 24, 17, s.body);
  oval(ctx, cx - 40, y - 8, 8, 8, s.ear, 0, ink);
  oval(ctx, cx - 18, y - 10, 8, 8, s.ear, 0, ink);
  eyes(ctx, cx - 34, y - 4, cx - 22, y - 4, 6.2, st, { iris: '#3d2914' });
  whiskers(ctx, cx - 28, y + 8);
  oval(ctx, cx - 28, y + 10, 5, 4, '#2b1810');
  oval(ctx, cx - 16, y + 42, 12, 8, s.body, 0, ink);
  oval(ctx, cx + 14, y + 42, 12, 8, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawNewt(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 16;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 50, 11);
  oval(ctx, cx + 48, y + 18, 26, 8, s.tail, 0.1, ink);
  body(ctx, cx, y + 16, 42, 13, s.body);
  oval(ctx, cx, y + 20, 26, 7, s.belly);
  body(ctx, cx - 32, y + 8, 16, 11, s.body);
  eyes(ctx, cx - 38, y + 4, cx - 28, y + 4, 4.4, st, { iris: '#3d2914' });
  oval(ctx, cx - 18, y + 28, 8, 5, s.body, 0, ink);
  oval(ctx, cx + 10, y + 28, 8, 5, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawGlider(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 10;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 48, 12);
  oval(ctx, cx, y + 22, 8, 28, s.body, 0, ink);
  oval(ctx, cx - 36, y + 16, 22, 16, '#c4b7a6', 0.3, ink);
  oval(ctx, cx + 36, y + 16, 22, 16, '#c4b7a6', -0.3, ink);
  body(ctx, cx, y + 16, 32, 22, s.body);
  oval(ctx, cx, y + 22, 16, 12, s.belly);
  body(ctx, cx, y - 8, 22, 17, s.body);
  oval(ctx, cx, y - 16, 6, 16, '#2b1810');
  oval(ctx, cx - 16, y - 14, 10, 10, s.ear, 0, ink);
  oval(ctx, cx + 16, y - 14, 10, 10, s.ear, 0, ink);
  eyes(ctx, cx - 8, y - 8, cx + 8, y - 8, 7.2, st, { iris: '#3d2914' });
  oval(ctx, cx + 40, y + 28, 16, 6, s.tail, 0.2, ink);
  props(ctx, cx, y, st);
}

function mythicSpark(ctx, cx, cy, st) {
  const t = st.t || 0;
  for (let i = 0; i < 5; i++) {
    const a = t * 2.2 + i * 1.26;
    oval(ctx, cx + Math.cos(a) * 58, cy - 8 + Math.sin(a * 1.4) * 22, 3.2, 3.2, i % 2 ? '#ffd166' : '#ff6bcb');
  }
}

function drawDragon(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 62, 14);
  mythicSpark(ctx, cx, y, st);
  oval(ctx, cx + 58, y + 18, 28, 12, s.tail, 0.35 + st.wag * 0.02, ink);
  oval(ctx, cx + 82, y + 10, 14, 10, '#ff6d00', 0.5, '#9b2226');
  oval(ctx, cx - 8, y + 8, 26, 18, s.body, -0.45, ink);
  oval(ctx, cx + 28, y + 6, 26, 18, s.body, 0.45, ink);
  body(ctx, cx + 6, y + 20, 52, 28, s.body);
  oval(ctx, cx + 6, y + 28, 30, 14, s.belly);
  for (let i = -2; i < 5; i++) tri(ctx, cx + i * 10, y + 4, cx + i * 10 + 5, y - 16, cx + i * 10 + 10, y + 4, '#ffd166', ink);
  body(ctx, cx - 36, y - 4, 26, 20, s.body);
  tri(ctx, cx - 44, y - 16, cx - 50, y - 44, cx - 28, y - 18, s.ear, ink);
  tri(ctx, cx - 30, y - 18, cx - 22, y - 42, cx - 14, y - 16, s.ear, ink);
  eyes(ctx, cx - 44, y - 8, cx - 30, y - 8, 6.5, st, { slit: true, iris: '#ffd166' });
  if (!st.sleeping && st.mood > 50) {
    oval(ctx, cx - 62, y + 8, 10, 6, '#ff6d00');
    oval(ctx, cx - 72, y + 6, 6, 4, '#ffd166');
  }
  paws(ctx, cx, y + 50, 24, s.body, ink, '#5a189a');
  props(ctx, cx, y, st);
}

function drawPhoenix(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 40, 12);
  mythicSpark(ctx, cx, y, st);
  oval(ctx, cx + 8, y + 28, 12, 34, '#ff6d00', 0.4, ink);
  oval(ctx, cx + 20, y + 22, 10, 28, '#ffd166', 0.5, '#e76f51');
  oval(ctx, cx + 30, y + 14, 8, 20, '#fff8ef', 0.55);
  body(ctx, cx, y + 10, 28, 36, s.body);
  oval(ctx, cx - 4, y + 16, 14, 18, s.belly);
  oval(ctx, cx + 22, y + 2, 22, 24, '#ff6d00', 0.55, ink);
  oval(ctx, cx + 16, y, 14, 16, '#ffd166', 0.45);
  body(ctx, cx - 2, y - 28, 20, 18, s.body);
  for (let i = 0; i < 4; i++) tri(ctx, cx - 8 + i * 6, y - 38, cx - 4 + i * 6, y - 62, cx + 2 + i * 6, y - 36, i % 2 ? '#ffd166' : '#e63946', ink);
  tri(ctx, cx - 18, y - 28, cx - 40, y - 16, cx - 14, y - 12, '#f4a261', '#b08968');
  eyes(ctx, cx - 6, y - 30, cx + 8, y - 30, 6.5, st, { iris: '#ff6d00' });
  ctx.fillStyle = '#2b1810';
  ctx.fillRect(cx - 10, y + 46, 5, 14);
  ctx.fillRect(cx + 4, y + 46, 5, 14);
  props(ctx, cx, y, st);
}

function drawUnicorn(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.28);
  shadow(ctx, cx, cy, 58, 14);
  mythicSpark(ctx, cx, y, st);
  body(ctx, cx + 8, y + 16, 48, 32, s.body);
  oval(ctx, cx + 8, y + 28, 26, 14, s.belly);
  oval(ctx, cx - 8, y - 16, 16, 22, s.body, 0, ink);
  body(ctx, cx - 28, y - 28, 26, 15, s.body);
  tri(ctx, cx - 48, y - 34, cx - 42, y - 78, cx - 32, y - 32, '#c77dff', '#9b5de5');
  tri(ctx, cx - 44, y - 40, cx - 42, y - 66, cx - 36, y - 36, '#fff8ef');
  tri(ctx, cx - 36, y - 40, cx - 42, y - 58, cx - 28, y - 42, s.ear, ink);
  tri(ctx, cx - 20, y - 42, cx - 16, y - 58, cx - 8, y - 38, s.ear, ink);
  oval(ctx, cx - 18, y - 54, 16, 10, '#ff6bcb', 0, ink);
  oval(ctx, cx + 54, y + 16, 12, 26, s.tail, 0.45 + st.wag * 0.02, ink);
  oval(ctx, cx + 64, y + 4, 10, 10, '#c77dff');
  eyes(ctx, cx - 40, y - 30, cx - 28, y - 32, 5.6, st, { iris: '#9b5de5' });
  oval(ctx, cx - 20, y + 50, 11, 18, s.body, 0.05, ink);
  oval(ctx, cx + 16, y + 50, 11, 18, s.body, -0.05, ink);
  props(ctx, cx, y, st);
}

function drawPegasus(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.3);
  shadow(ctx, cx, cy, 58, 14);
  mythicSpark(ctx, cx, y, st);
  oval(ctx, cx - 6, y, 28, 22, '#9aa4b0', -0.5, ink);
  oval(ctx, cx + 22, y - 2, 28, 22, '#cfd8e3', 0.45, ink);
  oval(ctx, cx - 10, y - 8, 14, 12, '#fff8ef', -0.4);
  oval(ctx, cx + 26, y - 10, 14, 12, '#fff8ef', 0.4);
  body(ctx, cx + 8, y + 18, 46, 30, s.body);
  oval(ctx, cx + 8, y + 28, 24, 14, s.belly);
  oval(ctx, cx - 8, y - 14, 15, 20, s.body, 0, ink);
  body(ctx, cx - 28, y - 26, 24, 14, s.body);
  tri(ctx, cx - 36, y - 38, cx - 42, y - 56, cx - 28, y - 40, s.ear, ink);
  tri(ctx, cx - 20, y - 40, cx - 16, y - 56, cx - 8, y - 36, s.ear, ink);
  oval(ctx, cx + 52, y + 18, 11, 24, s.tail, 0.4, ink);
  eyes(ctx, cx - 38, y - 28, cx - 26, y - 30, 5.4, st, { iris: '#4cc9f0' });
  oval(ctx, cx - 20, y + 50, 11, 16, s.body, 0, ink);
  oval(ctx, cx + 16, y + 50, 11, 16, s.body, 0, ink);
  props(ctx, cx, y, st);
}

function drawGriffin(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 56, 14);
  mythicSpark(ctx, cx, y, st);
  oval(ctx, cx - 10, y + 4, 24, 20, '#e9c46a', -0.5, ink);
  oval(ctx, cx + 26, y + 2, 24, 20, '#e9c46a', 0.5, ink);
  body(ctx, cx + 4, y + 22, 50, 30, s.body);
  oval(ctx, cx + 4, y + 32, 26, 14, s.belly);
  oval(ctx, cx + 52, y + 20, 14, 18, s.tail, 0.4, ink);
  body(ctx, cx - 30, y - 8, 24, 20, '#e9c46a');
  tri(ctx, cx - 38, y - 18, cx - 48, y - 48, cx - 22, y - 16, '#8d5a3a', ink);
  tri(ctx, cx - 22, y - 20, cx - 14, y - 46, cx - 8, y - 14, '#8d5a3a', ink);
  tri(ctx, cx - 44, y - 4, cx - 66, y + 6, cx - 36, y + 8, '#f4a261', '#b08968');
  eyes(ctx, cx - 38, y - 10, cx - 24, y - 10, 6.2, st, { iris: '#e9c46a' });
  paws(ctx, cx, y + 54, 22, s.body, ink, '#8d5a3a');
  props(ctx, cx, y, st);
}

function drawKitsune(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop;
  const ink = dark(s.body, 0.28);
  shadow(ctx, cx, cy, 54, 13);
  mythicSpark(ctx, cx, y, st);
  for (let i = 0; i < 5; i++) {
    const tilt = -0.4 + i * 0.22 + st.wag * 0.01;
    oval(ctx, cx + 36 + i * 6, y + 8 - i * 2, 16, 28, i % 2 ? s.tail : '#fff8ef', tilt, ink);
    oval(ctx, cx + 42 + i * 6, y - 6 - i * 2, 7, 8, '#ff6bcb', tilt);
  }
  body(ctx, cx, y + 22, 46, 32, s.body);
  oval(ctx, cx, y + 34, 24, 16, s.belly);
  tri(ctx, cx - 18, y - 12, cx - 34, y - 62, cx - 4, y - 20, s.ear, ink);
  tri(ctx, cx + 18, y - 12, cx + 34, y - 62, cx + 4, y - 20, s.ear, ink);
  tri(ctx, cx - 16, y - 16, cx - 26, y - 48, cx - 8, y - 20, s.inner);
  tri(ctx, cx + 16, y - 16, cx + 26, y - 48, cx + 8, y - 20, s.inner);
  body(ctx, cx, y - 8, 30, 24, s.body);
  oval(ctx, cx, y + 8, 16, 12, s.belly);
  eyes(ctx, cx - 12, y - 12, cx + 12, y - 12, 7.5, st, { slit: true, iris: '#c77dff' });
  tri(ctx, cx - 4, y, cx + 4, y, cx, y + 8, '#e07a9a');
  whiskers(ctx, cx, y + 4);
  paws(ctx, cx, y + 54, 20, s.body, ink, '#ff8fab');
  props(ctx, cx, y, st);
}

function drawHydra(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 8;
  const ink = dark(s.body, 0.4);
  shadow(ctx, cx, cy, 60, 14);
  mythicSpark(ctx, cx, y, st);
  oval(ctx, cx + 20, y + 28, 50, 16, s.body, 0.12, ink);
  oval(ctx, cx - 8, y + 18, 36, 14, s.body, -0.2, ink);
  for (const [hx, hy, rot] of [[-28, -8, -0.4], [-4, -22, 0], [24, -10, 0.35]]) {
    oval(ctx, cx + hx + 8, y + hy + 16, 10, 22, s.body, rot, ink);
    body(ctx, cx + hx, y + hy, 16, 14, s.body);
    eyes(ctx, cx + hx - 5, y + hy - 2, cx + hx + 5, y + hy - 2, 4.4, st, { slit: true, iris: '#95d5b2' });
    if (!st.sleeping && st.mood > 48) {
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + hx, y + hy + 10);
      ctx.lineTo(cx + hx - 4, y + hy + 18);
      ctx.moveTo(cx + hx, y + hy + 10);
      ctx.lineTo(cx + hx + 4, y + hy + 18);
      ctx.stroke();
    }
  }
  props(ctx, cx, y, st);
}

function drawJackalope(ctx, cx, cy, st, s) {
  const y = cy + st.idle - st.hop + 8;
  const ink = dark(s.body, 0.35);
  shadow(ctx, cx, cy, 48, 12);
  mythicSpark(ctx, cx, y, st);
  oval(ctx, cx + 36, y + 42, 16, 14, s.tail, 0, ink);
  body(ctx, cx, y + 28, 46, 34, s.body);
  oval(ctx, cx, y + 40, 24, 16, s.belly);
  oval(ctx, cx - 16, y - 56, 12, 46, s.ear, -0.12, ink);
  oval(ctx, cx + 16, y - 56, 12, 46, s.ear, 0.16, ink);
  oval(ctx, cx - 16, y - 52, 5, 32, s.inner, -0.12);
  oval(ctx, cx + 16, y - 52, 5, 32, s.inner, 0.16);
  ctx.strokeStyle = '#c4b7a6';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 8, y - 28);
  ctx.lineTo(cx - 18, y - 70);
  ctx.moveTo(cx - 18, y - 58);
  ctx.lineTo(cx - 28, y - 66);
  ctx.moveTo(cx + 8, y - 28);
  ctx.lineTo(cx + 18, y - 70);
  ctx.moveTo(cx + 18, y - 58);
  ctx.lineTo(cx + 28, y - 66);
  ctx.stroke();
  body(ctx, cx, y - 6, 30, 26, s.body);
  eyes(ctx, cx - 11, y - 12, cx + 11, y - 12, 8.5, st, { iris: '#9b5de5' });
  oval(ctx, cx, y + 4, 6, 5, '#e07a9a');
  whiskers(ctx, cx, y + 6);
  paws(ctx, cx, y + 54, 20, s.body, ink, '#ffffff');
  props(ctx, cx, y, st);
}

export function drawSpecies(ctx, p, t, extra = {}) {
  const s = p.species;
  const st = stateOf(p, t, extra);
  const cx = extra.x ?? 400;
  const cy = extra.y ?? 318;
  const scale = extra.scale ?? 1;
  const id = s.id;
  const prevSmooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

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
    if (id === 'bear') return drawBear(ctx, cx, cy, st, s);
    if (id === 'fox') return drawFox(ctx, cx, cy, st, s);
    if (id === 'raccoon') return drawRaccoon(ctx, cx, cy, st, s);
    if (id === 'otter') return drawOtter(ctx, cx, cy, st, s);
    if (id === 'panda') return drawPanda(ctx, cx, cy, st);
    if (id === 'koala') return drawKoala(ctx, cx, cy, st, s);
    if (id === 'dragon') return drawDragon(ctx, cx, cy, st, s);
    if (id === 'phoenix') return drawPhoenix(ctx, cx, cy, st, s);
    if (id === 'unicorn') return drawUnicorn(ctx, cx, cy, st, s);
    if (id === 'pegasus') return drawPegasus(ctx, cx, cy, st, s);
    if (id === 'griffin') return drawGriffin(ctx, cx, cy, st, s);
    if (id === 'kitsune') return drawKitsune(ctx, cx, cy, st, s);
    if (id === 'hydra') return drawHydra(ctx, cx, cy, st, s);
    if (id === 'jackalope') return drawJackalope(ctx, cx, cy, st, s);
    return drawCat(ctx, cx, cy, st, s);
  };

  if (scale !== 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    paint();
    ctx.restore();
  } else {
    paint();
  }
  ctx.imageSmoothingEnabled = prevSmooth;
}
