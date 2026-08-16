import { drawChameleon } from './renderer.js';

const PALETTE = [
  { name: 'Leaf', color: '#3dcc6a' },
  { name: 'Ocean', color: '#3185fc' },
  { name: 'Berry', color: '#ef476f' },
  { name: 'Grape', color: '#9b5de5' },
  { name: 'Sun', color: '#ffd23f' },
  { name: 'Pink', color: '#ff70a6' },
  { name: 'Magenta', color: '#ff00a8' },
  { name: 'Snow', color: '#f4f7fb' },
  { name: 'Midnight', color: '#263238' },
];

const TATTOOS = [
  { id: 'star', icon: '★', name: 'Star' },
  { id: 'heart', icon: '♥', name: 'Heart' },
  { id: 'bolt', icon: 'ϟ', name: 'Bolt' },
];

export function showCustomizationPrompt(onYes, onNo) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>Customize your chameleon?</h2>
    <p class="multi-note">Choose scale colors, tattoos, and pencils before your adventure.</p>
    <button id="customize-yes">Yes</button>
    <button id="customize-no" class="shop-secondary">No</button>
  `;
  content.querySelector('#customize-yes').addEventListener('click', onYes);
  content.querySelector('#customize-no').addEventListener('click', onNo);
}

export function showCustomizer(initial, onSave, onCancel) {
  const overlay = document.getElementById('overlay');
  const content = document.getElementById('overlay-content');
  const design = normalizeDesign(initial);
  let tool = { type: 'pencil', color: '#ffe566', size: 12 };
  let drawing = false;
  let previous = null;

  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>Chameleon Studio</h2>
    <canvas id="customizer-canvas" width="420" height="330"></canvas>
    <p class="custom-label">Scale colors</p>
    <div class="custom-tools custom-colors">
      ${PALETTE.map((entry) => `
        <button data-base="${entry.color}" title="${entry.name}" style="--swatch:${entry.color}"></button>
      `).join('')}
    </div>
    <p class="custom-label">Tattoos</p>
    <div class="custom-tools">
      ${TATTOOS.map((tattoo) => `
        <button data-tattoo="${tattoo.id}" title="${tattoo.name}">${tattoo.icon}</button>
      `).join('')}
    </div>
    <p class="custom-label">Pencils</p>
    <div class="custom-tools">
      <button data-pencil="6">✎ Thin</button>
      <button data-pencil="12" class="selected">✎ Medium</button>
      <button data-pencil="20">✎ Thick</button>
      ${PALETTE.slice(0, 6).map((entry) => `
        <button data-ink="${entry.color}" title="${entry.name}" style="--swatch:${entry.color}"></button>
      `).join('')}
    </div>
    <p class="shop-note">Choose a pencil, then click and drag on the chameleon. Choose a tattoo, then click where it should go.</p>
    <button id="save-customization">Save Chameleon</button>
    <button id="reset-customization" class="shop-secondary">Reset</button>
    <button id="cancel-customization" class="shop-secondary">Cancel</button>
  `;

  const canvas = content.querySelector('#customizer-canvas');
  const ctx = canvas.getContext('2d');

  function selectButton(button) {
    content.querySelectorAll('[data-pencil], [data-tattoo]').forEach((entry) => entry.classList.remove('selected'));
    button?.classList.add('selected');
  }

  content.querySelectorAll('[data-base]').forEach((button) => {
    button.addEventListener('click', () => {
      design.baseColor = button.dataset.base;
      drawPreview(ctx, design);
    });
  });
  content.querySelectorAll('[data-ink]').forEach((button) => {
    button.addEventListener('click', () => {
      tool.color = button.dataset.ink;
      tool.type = 'pencil';
      selectButton(content.querySelector(`[data-pencil="${tool.size}"]`));
    });
  });
  content.querySelectorAll('[data-pencil]').forEach((button) => {
    button.addEventListener('click', () => {
      tool = { type: 'pencil', color: tool.color, size: Number(button.dataset.pencil) };
      selectButton(button);
    });
  });
  content.querySelectorAll('[data-tattoo]').forEach((button) => {
    button.addEventListener('click', () => {
      tool = { type: 'tattoo', id: button.dataset.tattoo, color: tool.color, size: 28 };
      selectButton(button);
    });
  });

  const pointFromEvent = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    const point = pointFromEvent(event);
    if (!isOnChameleon(ctx, point.x, point.y)) return;
    if (tool.type === 'tattoo') {
      design.tattoos.push({ id: tool.id, x: point.x, y: point.y, color: tool.color, size: tool.size });
      drawPreview(ctx, design);
      return;
    }
    drawing = true;
    previous = point;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drawing || tool.type !== 'pencil') return;
    const point = pointFromEvent(event);
    if (!isOnChameleon(ctx, point.x, point.y)) {
      previous = null;
      return;
    }
    if (previous) {
      design.strokes.push({
        x1: previous.x,
        y1: previous.y,
        x2: point.x,
        y2: point.y,
        color: tool.color,
        size: tool.size,
      });
    }
    previous = point;
    drawPreview(ctx, design);
  });
  const stopDrawing = () => {
    drawing = false;
    previous = null;
  };
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);

  content.querySelector('#save-customization').addEventListener('click', () => onSave(normalizeDesign(design)));
  content.querySelector('#reset-customization').addEventListener('click', () => {
    design.baseColor = '#3dcc6a';
    design.strokes = [];
    design.tattoos = [];
    drawPreview(ctx, design);
  });
  content.querySelector('#cancel-customization').addEventListener('click', onCancel);

  drawPreview(ctx, design);
}

function normalizeDesign(design) {
  return {
    baseColor: design?.baseColor || '#3dcc6a',
    strokes: Array.isArray(design?.strokes) ? design.strokes.slice(0, 1200) : [],
    tattoos: Array.isArray(design?.tattoos) ? design.tattoos.slice(0, 40) : [],
  };
}

function chameleonPath() {
  const path = new Path2D();
  path.ellipse(208, 189, 106, 90, 0, 0, Math.PI * 2);
  path.ellipse(272, 125, 82, 74, 0, 0, Math.PI * 2);
  path.ellipse(76, 204, 76, 43, -0.2, 0, Math.PI * 2);
  path.rect(135, 205, 50, 82);
  path.rect(225, 205, 50, 82);
  return path;
}

function isOnChameleon(ctx, x, y) {
  return ctx.isPointInPath(chameleonPath(), x, y);
}

function drawPreview(ctx, design) {
  ctx.clearRect(0, 0, 420, 330);
  const gradient = ctx.createLinearGradient(0, 0, 0, 330);
  gradient.addColorStop(0, '#77c9ff');
  gradient.addColorStop(1, '#d8ffc2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 420, 330);

  ctx.save();
  ctx.translate(104, 45);
  ctx.scale(8, 8);
  drawChameleon(ctx, {
    x: 0,
    y: 0,
    w: 26,
    h: 30,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    animFrame: 0,
    invincible: 0,
    powered: false,
    camouflaged: false,
    groundPounding: false,
    spinning: 0,
    emote: null,
    emoteTimer: 0,
    tailStandUntil: 0,
    accessory: null,
    customization: design,
  }, 0, 0);
  ctx.restore();

  ctx.fillStyle = '#173b72';
  ctx.font = '12px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Click and drag to paint!', 210, 315);
}
