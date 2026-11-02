const GALLERY_KEY = 'gat-characters';
const NEXT_KEY = 'gat-character-next';
const REF_KEY = 'gat-character-ref';
const REF_NAME_KEY = 'gat-character-ref-name';
const COOLDOWN_MS = 45000;

const KINDS = [
  ['kid', 'Kid hero', 'a young human hero'],
  ['wizard', 'Wizard', 'a friendly wizard'],
  ['knight', 'Knight', 'a small knight'],
  ['cat', 'Cat', 'an anthropomorphic cat'],
  ['fox', 'Fox', 'an anthropomorphic fox'],
  ['robot', 'Robot', 'a cute round robot'],
  ['dragon', 'Dragon', 'a small friendly dragon'],
  ['ghost', 'Ghost', 'a round sheet ghost'],
  ['mushroom', 'Mushroom', 'a walking mushroom'],
  ['bird', 'Bird', 'a songbird character'],
  ['astro', 'Astronaut', 'a kid astronaut'],
  ['vampire', 'Vampire', 'a friendly vampire'],
  ['mermaid', 'Mermaid', 'a mermaid'],
  ['skeleton', 'Skeleton', 'a cheerful skeleton'],
  ['slime', 'Slime', 'a bouncy slime'],
];

const STYLES = [
  ['sticker', 'Sticker', 'sticker illustration, thick dark outline, flat colors'],
  ['pixel', 'Pixel', 'crisp pixel-art character, limited palette'],
  ['story', 'Storybook', 'soft storybook painting, gentle light'],
  ['clay', 'Clay', 'handmade clay toy, soft studio light'],
  ['anime', 'Anime', 'anime character design, clean line art'],
  ['crayon', 'Crayon', 'crayon and marker drawing on paper'],
];

const MOODS = [
  ['brave', 'Brave', 'brave'],
  ['sleepy', 'Sleepy', 'sleepy'],
  ['mischief', 'Mischief', 'mischievous'],
  ['shy', 'Shy', 'shy'],
  ['grumpy', 'Grumpy', 'grumpy'],
  ['cheerful', 'Cheerful', 'cheerful'],
  ['mystery', 'Mystery', 'mysterious'],
];

const OUTFITS = [
  ['hoodie', 'Hoodie', 'wearing a hoodie and sneakers'],
  ['armor', 'Armor', 'wearing simple storybook armor'],
  ['cape', 'Cape', 'wearing a short cape and boots'],
  ['overalls', 'Overalls', 'wearing overalls'],
  ['suit', 'Space suit', 'wearing a rounded space suit'],
  ['robes', 'Robes', 'wearing long soft robes'],
  ['rain', 'Raincoat', 'wearing a bright raincoat'],
  ['scarf', 'Scarf', 'wearing a very long scarf and boots'],
];

const PALETTES = [
  ['sunset', 'Sunset', 'sunset orange, pink, and gold'],
  ['ocean', 'Ocean', 'ocean teal, blue, and sand'],
  ['forest', 'Forest', 'forest green, moss, and cream'],
  ['candy', 'Candy', 'candy pink, lavender, and mint'],
  ['midnight', 'Midnight', 'midnight blue, silver, and violet'],
  ['gold', 'Gold', 'gold, cream, and warm brown'],
];

const EXTRAS = [
  '',
  'round glasses',
  'a tiny backpack',
  'a star pin',
  'striped socks',
  'a flower crown',
  'freckles',
  'a scarf twice as long as they are',
];

const NAMES = ['Pip', 'Moth', 'Bramble', 'Noodle', 'Juniper', 'Pebble', 'Lumen', 'Sable', 'Cricket', 'Toffee', 'Wisp'];

const form = document.getElementById('maker');
const nameInput = document.getElementById('name');
const extraInput = document.getElementById('extra');
const drawBtn = document.getElementById('draw');
const surpriseBtn = document.getElementById('surprise');
const downloadBtn = document.getElementById('download');
const flipBtn = document.getElementById('to-flipbook');
const removeBtn = document.getElementById('remove');
const portrait = document.getElementById('portrait');
const portraitImg = document.getElementById('portrait-img');
const portraitEmpty = document.getElementById('portrait-empty');
const summary = document.getElementById('summary');
const status = document.getElementById('status');
const gallery = document.getElementById('gallery');
const galleryEmpty = document.getElementById('gallery-empty');

const fields = {
  kind: document.getElementById('kind'),
  style: document.getElementById('style'),
  mood: document.getElementById('mood'),
  outfit: document.getElementById('outfit'),
  palette: document.getElementById('palette'),
};

let galleryItems = [];
let current = null;
let busy = false;
let nextAt = Number(localStorage.getItem(NEXT_KEY) || 0);

function fillSelect(select, rows) {
  rows.forEach(([id, label]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
    select.append(option);
  });
}

function row(list, id) {
  return list.find((item) => item[0] === id) || list[0];
}

function setStatus(text) {
  status.textContent = text;
}

function secondsLeft() {
  return Math.max(0, Math.ceil((nextAt - Date.now()) / 1000));
}

function armCooldown(ms) {
  nextAt = Date.now() + ms;
  localStorage.setItem(NEXT_KEY, String(nextAt));
  syncButtons();
}

function summaryText() {
  const mood = row(MOODS, fields.mood.value)[1];
  const kind = row(KINDS, fields.kind.value)[1];
  const style = row(STYLES, fields.style.value)[1];
  const extra = extraInput.value.trim();
  const base = `${mood} ${kind.toLowerCase()}, ${style.toLowerCase()} style`;
  return extra ? `${base}. ${extra}` : base;
}

function characterName() {
  const typed = nameInput.value.trim();
  if (typed) return typed.slice(0, 24);
  return row(KINDS, fields.kind.value)[1];
}

function buildPrompt() {
  const kind = row(KINDS, fields.kind.value)[2];
  const style = row(STYLES, fields.style.value)[2];
  const mood = row(MOODS, fields.mood.value)[2];
  const outfit = row(OUTFITS, fields.outfit.value)[2];
  const palette = row(PALETTES, fields.palette.value)[2];
  const extra = extraInput.value.trim();
  const parts = [
    `A single original character, full body, ${mood} ${kind}`,
    outfit,
    `${palette} color palette`,
    style,
  ];
  if (extra) parts.push(extra);
  parts.push('centered, simple empty background, clean silhouette, family-friendly, no text, no letters, no watermark');
  return parts.join(', ');
}

function syncButtons() {
  const wait = secondsLeft();
  drawBtn.disabled = busy || wait > 0;
  surpriseBtn.disabled = busy;
  downloadBtn.disabled = busy || !current;
  flipBtn.disabled = busy || !current;
  removeBtn.disabled = busy || !current;
  if (busy) drawBtn.textContent = 'Drawing...';
  else if (wait > 0) drawBtn.textContent = `Wait ${wait}s`;
  else drawBtn.textContent = 'Draw character';
}

function showPortrait(item) {
  current = item;
  if (!item) {
    portraitImg.classList.add('hidden');
    portraitImg.removeAttribute('src');
    portraitEmpty.classList.remove('hidden');
    syncButtons();
    paintGallery();
    return;
  }
  portraitImg.src = item.image;
  portraitImg.alt = item.name;
  portraitImg.classList.remove('hidden');
  portraitEmpty.classList.add('hidden');
  summary.textContent = item.summary;
  syncButtons();
  paintGallery();
}

function loadGallery() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]');
    galleryItems = Array.isArray(parsed) ? parsed.filter((item) => item && item.image && item.name) : [];
  } catch {
    galleryItems = [];
  }
}

function remember() {
  const copy = galleryItems.slice(0, 8);
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(copy));
    galleryItems = copy;
    return true;
  } catch {
    if (copy.length > 1) {
      galleryItems = copy.slice(0, -1);
      return remember();
    }
    return false;
  }
}

function paintGallery() {
  gallery.replaceChildren();
  galleryEmpty.classList.toggle('hidden', galleryItems.length > 0);
  galleryItems.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.toggle('on', current && current.id === item.id);
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '';
    const caption = document.createElement('span');
    caption.textContent = item.name;
    btn.append(img, caption);
    btn.addEventListener('click', () => showPortrait(item));
    gallery.append(btn);
  });
}

function pick(select) {
  const options = [...select.options];
  select.value = options[Math.floor(Math.random() * options.length)].value;
}

function surprise() {
  pick(fields.kind);
  pick(fields.style);
  pick(fields.mood);
  pick(fields.outfit);
  pick(fields.palette);
  extraInput.value = EXTRAS[Math.floor(Math.random() * EXTRAS.length)];
  if (!nameInput.value.trim()) nameInput.value = NAMES[Math.floor(Math.random() * NAMES.length)];
  syncButtons();
  if (secondsLeft() === 0) {
    drawCharacter();
    return;
  }
  setStatus(`Picked a new character. The artist can draw in ${secondsLeft()}s.`);
}

function blobToData(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(blob);
  });
}

async function drawCharacter() {
  if (busy || secondsLeft() > 0) return;
  const prompt = buildPrompt();
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&seed=${seed}&nologo=true&safe=true`;
  busy = true;
  portrait.classList.add('busy');
  syncButtons();
  setStatus('Asking the artist for a new character...');
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (response.status === 402) {
      const retry = Number(response.headers.get('retry-after'));
      armCooldown((retry > 0 ? retry : 45) * 1000);
      throw new Error('wait');
    }
    if (!response.ok) throw new Error('bad');
    const type = response.headers.get('content-type') || '';
    if (!type.includes('image')) throw new Error('bad');
    const blob = await response.blob();
    if (!blob.size || !blob.type.startsWith('image/')) throw new Error('bad');
    const image = await blobToData(blob);
    const item = {
      id: crypto.randomUUID?.() || String(Date.now()),
      name: characterName(),
      summary: summaryText(),
      prompt,
      seed,
      image,
      at: Date.now(),
    };
    galleryItems.unshift(item);
    const kept = remember();
    armCooldown(COOLDOWN_MS);
    showPortrait(item);
    setStatus(kept
      ? `${item.name} is ready. Download them, or send them to Animation.`
      : `${item.name} is ready, but the browser could not store another picture.`);
  } catch (error) {
    if (error.message === 'wait') {
      setStatus(`The artist needs a rest. Try again in ${secondsLeft()}s.`);
    } else if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      setStatus('That took too long. Try again in a moment.');
    } else {
      setStatus('The artist could not be reached. Check your connection and try again.');
    }
  } finally {
    busy = false;
    portrait.classList.remove('busy');
    syncButtons();
  }
}

function downloadCurrent() {
  if (!current) return;
  const safe = current.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'character';
  const link = document.createElement('a');
  link.href = current.image;
  link.download = `${safe}.jpg`;
  link.click();
}

function sendToAnimation() {
  if (!current) return;
  try {
    localStorage.setItem(REF_KEY, current.image);
    localStorage.setItem(REF_NAME_KEY, current.name);
  } catch {
    setStatus('This picture is too big to send. Download it instead.');
    return;
  }
  window.location.href = 'animate.html';
}

function removeCurrent() {
  if (!current) return;
  galleryItems = galleryItems.filter((item) => item.id !== current.id);
  remember();
  const next = galleryItems[0] || null;
  showPortrait(next);
  setStatus('Removed from this computer.');
}

function bindFullscreen() {
  const btn = document.getElementById('fullscreen-btn');
  if (!btn) return;
  const fullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const syncLabel = () => {
    btn.textContent = fullscreen() ? '× Exit Full Screen' : '⛶ Full Screen';
  };
  btn.addEventListener('click', async () => {
    try {
      if (fullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else document.webkitExitFullscreen?.();
      } else {
        const root = document.documentElement;
        if (root.requestFullscreen) await root.requestFullscreen();
        else root.webkitRequestFullscreen?.();
      }
    } catch {
      /* Fullscreen can be blocked outside a user gesture. */
    }
  });
  document.addEventListener('fullscreenchange', syncLabel);
  document.addEventListener('webkitfullscreenchange', syncLabel);
}

fillSelect(fields.kind, KINDS);
fillSelect(fields.style, STYLES);
fillSelect(fields.mood, MOODS);
fillSelect(fields.outfit, OUTFITS);
fillSelect(fields.palette, PALETTES);
loadGallery();
paintGallery();
if (galleryItems[0]) showPortrait(galleryItems[0]);
else syncButtons();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  drawCharacter();
});
form.addEventListener('input', () => {
  summary.textContent = summaryText();
});
form.addEventListener('change', () => {
  summary.textContent = summaryText();
});
surpriseBtn.addEventListener('click', surprise);
downloadBtn.addEventListener('click', downloadCurrent);
flipBtn.addEventListener('click', sendToAnimation);
removeBtn.addEventListener('click', removeCurrent);
bindFullscreen();
setInterval(syncButtons, 1000);
