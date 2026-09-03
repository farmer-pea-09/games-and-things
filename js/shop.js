const STORAGE_KEY = 'shop-local-v1';
const visitorId = localStorage.getItem('shop-visitor-id') || crypto.randomUUID();
localStorage.setItem('shop-visitor-id', visitorId);

const els = {
  sub: document.getElementById('shop-sub'),
  ownerBanner: document.getElementById('owner-banner'),
  ownerDesk: document.getElementById('owner-desk'),
  listForm: document.getElementById('list-form'),
  listTitle: document.getElementById('list-title'),
  listPrice: document.getElementById('list-price'),
  listDesc: document.getElementById('list-desc'),
  listPhoto: document.getElementById('list-photo'),
  photoBtn: document.getElementById('photo-btn'),
  photoPreview: document.getElementById('photo-preview'),
  photoStatus: document.getElementById('photo-status'),
  cameraModal: document.getElementById('camera-modal'),
  cameraVideo: document.getElementById('camera-video'),
  cameraStatus: document.getElementById('camera-status'),
  cameraSnap: document.getElementById('camera-snap'),
  cameraFlip: document.getElementById('camera-flip'),
  cameraClose: document.getElementById('camera-close'),
  orders: document.getElementById('orders'),
  orderList: document.getElementById('order-list'),
  products: document.getElementById('products'),
  empty: document.getElementById('empty'),
  chat: document.getElementById('chat'),
  chatToggle: document.getElementById('chat-toggle'),
  chatTitle: document.getElementById('chat-title'),
  chatDot: document.getElementById('chat-dot'),
  chatBody: document.getElementById('chat-body'),
  threadBar: document.getElementById('thread-bar'),
  threadSelect: document.getElementById('thread-select'),
  aiBtn: document.getElementById('ai-btn'),
  messages: document.getElementById('messages'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  accountChip: document.getElementById('account-chip'),
  accountModal: document.getElementById('account-modal'),
  accountForm: document.getElementById('account-form'),
  accountName: document.getElementById('account-name'),
  accountEmail: document.getElementById('account-email'),
  accountColor: document.getElementById('account-color'),
  accountCancel: document.getElementById('account-cancel'),
};

let ownerKey = '';
let photoData = '';
let live = null;
let selectedThread = visitorId;
let lastCovering = null;
let cameraStream = null;
let facing = 'user';
let pendingBuy = null;

function defaultStore() {
  return { products: [], chats: {}, orders: [], aiEnabled: false, accounts: {} };
}

function loadAccount() {
  try {
    return JSON.parse(localStorage.getItem('trinket-account') || 'null');
  } catch {
    return null;
  }
}

function saveAccountLocal(account) {
  localStorage.setItem('trinket-account', JSON.stringify(account));
}

function hasTrinketAccount() {
  const account = loadAccount();
  return Boolean(account && account.name && account.email && account.color);
}

function looksLikeBuy(text) {
  return /\b(order|buy|want|take|get|please)\b/i.test(String(text || ''));
}

function openAccountModal() {
  els.accountModal.classList.remove('hidden');
  els.accountName.focus();
}

function closeAccountModal() {
  els.accountModal.classList.add('hidden');
}

function needAccountThen(action) {
  if (document.body.classList.contains('is-owner') || hasTrinketAccount()) {
    action();
    return;
  }
  pendingBuy = action;
  openAccountModal();
}

function loadStore() {
  try {
    return { ...defaultStore(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultStore();
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isOwnerMachine() {
  const host = location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

function shopAI(text, products) {
  const q = String(text || '').toLowerCase().trim();
  const listed = products.length
    ? products.map((p) => `${p.title} — $${Number(p.price).toFixed(2)}`).join('\n')
    : 'Nothing is listed yet.';
  const hit = products.find((p) => q.includes(String(p.title).toLowerCase()));
  const wantsOrder = /\b(order|buy|want|take|get|please)\b/.test(q);
  if (wantsOrder && hit) {
    return `Got it — I will put "${hit.title}" ($${Number(hit.price).toFixed(2)}) on the order list. What is your name, and how should the owner get it to you?`;
  }
  if (wantsOrder) return `Sure — which item?\n${listed}`;
  if (hit) return `${hit.title} is $${Number(hit.price).toFixed(2)}. ${hit.description || ''} Want me to order it?`;
  if (/^(hi|hey|hello|yo|sup)\b/.test(q)) {
    return products.length
      ? `Hey! Welcome to Tiny Trinkets. Here is what is for sale:\n${listed}\n\nWant to order something?`
      : 'Hey! Tiny Trinkets has no listings yet. Hang tight.';
  }
  if (/\b(list|what|sell|have|stock|menu|items)\b/.test(q)) return `For sale right now:\n${listed}`;
  if (/\b(price|cost|how much)\b/.test(q)) return listed;
  if (/\b(thanks|thank|thx)\b/.test(q)) return 'You bet. The owner will see this chat too.';
  return `I can help you order from Tiny Trinkets. For sale:\n${listed}\n\nTell me the item and your name.`;
}

const localApi = {
  ownerHere: true,
  visible: true,
  state() {
    const store = loadStore();
    const here = this.ownerHere && this.visible;
    const covering = Boolean(store.aiEnabled && !here);
    return {
      isOwner: isOwnerMachine(),
      ownerHere: here,
      aiEnabled: store.aiEnabled,
      aiCovering: covering,
      products: store.products,
      chats: store.chats,
      orders: store.orders,
      accounts: store.accounts || {},
      chat: store.chats[visitorId] || [],
      chatTitle: here
        ? 'Order Now! Owner is here'
        : covering
          ? 'Order Now! Tiny Trinkets helper is here'
          : 'Order Now! Leave a message',
    };
  },
  async getState() {
    return this.state();
  },
  async postProduct(product) {
    if (!isOwnerMachine()) throw new Error('only this PC can post listings');
    const store = loadStore();
    const next = {
      id: product.id || crypto.randomUUID().slice(0, 12),
      title: product.title,
      price: product.price,
      description: product.description,
      image: product.image || '',
    };
    const index = store.products.findIndex((p) => p.id === next.id);
    if (index >= 0) store.products[index] = next;
    else store.products.unshift(next);
    saveStore(store);
    return { product: next };
  },
  async deleteProduct(id) {
    if (!isOwnerMachine()) throw new Error('owner only');
    const store = loadStore();
    store.products = store.products.filter((p) => p.id !== id);
    saveStore(store);
  },
  async sendChat(text, threadId) {
    const store = loadStore();
    const id = threadId || visitorId;
    if (!store.chats[id]) store.chats[id] = [];
    const here = this.ownerHere && this.visible;
    const covering = store.aiEnabled && !here;
    store.chats[id].push({ from: covering ? 'visitor' : 'owner', text, at: Date.now() });
    if (covering) {
      const hit = store.products.find((p) => text.toLowerCase().includes(String(p.title).toLowerCase()));
      if (hit && /\b(order|buy|want|take|get|please)\b/i.test(text)) {
        const who = (store.accounts || {})[id] || loadAccount() || {};
        store.orders.unshift({
          id: crypto.randomUUID().slice(0, 12),
          visitorId: id,
          buyer: who.name || '',
          email: who.email || '',
          color: who.color || '',
          item: hit.title,
          price: hit.price,
          note: text,
          at: Date.now(),
          status: 'new',
        });
      }
      store.chats[id].push({ from: 'ai', text: shopAI(text, store.products), at: Date.now() });
    }
    saveStore(store);
  },
  async setAI(enabled) {
    if (!isOwnerMachine()) throw new Error('owner only');
    const store = loadStore();
    store.aiEnabled = enabled;
    saveStore(store);
  },
  async ping() {},
  async saveAccount(account) {
    const store = loadStore();
    if (!store.accounts) store.accounts = {};
    store.accounts[visitorId] = account;
    saveStore(store);
    return { account };
  },
};

const remoteApi = {
  headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      'x-visitor-id': visitorId,
      ...extra,
    };
  },
  async getState() {
    const res = await fetch('/api/state', { headers: this.headers() });
    if (!res.ok) throw new Error('no shop server');
    const state = await res.json();
    return state;
  },
  async postProduct(product) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error('only this PC can post listings');
    return res.json();
  },
  async deleteProduct(id) {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: this.headers() });
    if (!res.ok) throw new Error('owner only');
  },
  async sendChat(text, threadId) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ text, visitorId: threadId || visitorId }),
    });
    if (res.status === 403) throw new Error('need an account');
    if (!res.ok) throw new Error('chat failed');
  },
  async saveAccount(account) {
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ ...account, visitorId }),
    });
    if (!res.ok) throw new Error('could not make account');
    return res.json();
  },
  async setAI(enabled) {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error('owner only');
  },
  async ping() {
    await fetch('/api/presence', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ visible: document.visibilityState === 'visible' }),
    });
  },
};

async function pickApi() {
  try {
    const state = await remoteApi.getState();
    return { api: remoteApi, state, remote: true };
  } catch {
    return { api: localApi, state: localApi.state(), remote: false };
  }
}

function renderProducts(state) {
  els.products.innerHTML = '';
  els.empty.classList.toggle('hidden', state.products.length > 0);
  for (const product of state.products) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      ${product.image ? `<img src="${product.image}" alt="">` : ''}
      <h3></h3>
      <p class="price"></p>
      <p class="desc"></p>
      <div class="actions"></div>
    `;
    card.querySelector('h3').textContent = product.title;
    card.querySelector('.price').textContent = `$${Number(product.price).toFixed(2)}`;
    card.querySelector('.desc').textContent = product.description || '';
    const actions = card.querySelector('.actions');
    const orderBtn = document.createElement('button');
    orderBtn.type = 'button';
    orderBtn.textContent = 'Order';
    orderBtn.addEventListener('click', () => {
      needAccountThen(() => {
        els.chat.classList.remove('collapsed');
        els.chatInput.value = `I want to order ${product.title}`;
        els.chatInput.focus();
      });
    });
    actions.append(orderBtn);
    if (state.isOwner) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'ghost';
      del.textContent = 'Remove';
      del.addEventListener('click', async () => {
        await live.api.deleteProduct(product.id);
        paint(await live.api.getState());
      });
      actions.append(del);
    }
    els.products.append(card);
  }
}

function chatLines(state) {
  if (state.isOwner) {
    const chats = state.chats || {};
    const id = selectedThread && chats[selectedThread] ? selectedThread : Object.keys(chats)[0];
    return id ? chats[id] || [] : [];
  }
  return state.chat || [];
}

function renderChat(state) {
  els.chatTitle.textContent = state.chatTitle || 'Order Now! Owner is here';
  els.chatDot.className = `dot ${state.ownerHere ? 'on' : state.aiCovering ? 'ai' : ''}`;
  els.threadBar.classList.toggle('hidden', !state.isOwner);
  els.aiBtn.textContent = state.aiEnabled ? 'AI is on' : 'Turn on AI';
  els.aiBtn.classList.toggle('on', Boolean(state.aiEnabled));

  if (state.isOwner) {
    const ids = Object.keys(state.chats || {});
    if (!ids.includes(selectedThread)) selectedThread = ids[0] || visitorId;
    els.threadSelect.innerHTML = '';
    if (!ids.length) {
      const opt = document.createElement('option');
      opt.value = visitorId;
      opt.textContent = 'No buyer chats yet';
      els.threadSelect.append(opt);
    }
    for (const id of ids) {
      const opt = document.createElement('option');
      opt.value = id;
      const who = (state.accounts || {})[id];
      opt.textContent = who?.name || (id === visitorId ? 'This browser' : `Buyer ${id.slice(0, 6)}`);
      opt.selected = id === selectedThread;
      els.threadSelect.append(opt);
    }
  }

  if (lastCovering === null) lastCovering = state.aiCovering;
  const lines = [...chatLines(state)];
  if (state.aiCovering && lastCovering === false) {
    lines.push({ from: 'system', text: 'Owner stepped away — Tiny Trinkets helper jumped in.', at: Date.now() });
  }
  if (!state.aiCovering && lastCovering === true && state.ownerHere) {
    lines.push({ from: 'system', text: 'Owner is back.', at: Date.now() });
  }
  lastCovering = state.aiCovering;

  els.messages.innerHTML = '';
  for (const msg of lines) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${msg.from}`;
    bubble.textContent = msg.text;
    els.messages.append(bubble);
  }
  els.messages.scrollTop = els.messages.scrollHeight;
}

function renderOrders(state) {
  const orders = state.orders || [];
  els.orders.classList.toggle('hidden', !state.isOwner || orders.length === 0);
  els.orderList.innerHTML = '';
  for (const order of orders) {
    const li = document.createElement('li');
    const who = order.buyer ? `${order.buyer} (${order.email || 'no email'})` : 'Unknown buyer';
    li.textContent = `${order.item} — $${Number(order.price).toFixed(2)} · ${who} · ${order.note}`;
    els.orderList.append(li);
  }
}

function paint(state) {
  document.body.classList.toggle('is-owner', Boolean(state.isOwner));
  els.ownerDesk.classList.toggle('hidden', !state.isOwner);
  if (state.isOwner) {
    els.sub.textContent = live.remote
      ? 'This computer can post Tiny Trinkets listings. Friends order in the chat.'
      : 'This computer can post listings. Run npm run shop so friends on your wifi can visit Tiny Trinkets.';
    els.ownerBanner.classList.remove('hidden');
    els.ownerBanner.textContent = live.remote
      ? (state.friendUrl ? `Tiny Trinkets owner mode is on. Friends open ${state.friendUrl}` : 'Tiny Trinkets owner mode is on for this PC.')
      : 'Owner mode is on. Start the shop server so other people can see Tiny Trinkets.';
  } else {
    els.sub.textContent = 'You can look and order. Only the owner’s computer can list trinkets.';
    els.ownerBanner.classList.add('hidden');
  }
  const mine = loadAccount();
  if (!state.isOwner && mine) {
    els.accountChip.classList.remove('hidden');
    els.accountChip.textContent = `Trinket Account: ${mine.name} · ${mine.color}`;
  } else {
    els.accountChip.classList.add('hidden');
  }
  renderProducts(state);
  renderChat(state);
  renderOrders(state);
}

function setPhoto(dataUrl) {
  photoData = dataUrl || '';
  els.photoPreview.src = photoData;
  els.photoPreview.classList.toggle('hidden', !photoData);
  els.photoStatus.textContent = photoData ? 'Photo ready. Add a title and price, then post.' : '';
}

function photoFromVideo(video) {
  const canvas = document.createElement('canvas');
  const max = 640;
  const scale = Math.min(1, max / Math.max(video.videoWidth || 1, video.videoHeight || 1));
  canvas.width = Math.max(1, Math.round((video.videoWidth || 1) * scale));
  canvas.height = Math.max(1, Math.round((video.videoHeight || 1) * scale));
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

function stopTracks() {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  els.cameraVideo.srcObject = null;
}

function stopCamera() {
  stopTracks();
  els.cameraModal.classList.add('hidden');
}

async function getCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('no camera API');
  }
  const tries = [
    { audio: false, video: { facingMode: facing } },
    { audio: false, video: { facingMode: { ideal: facing } } },
    { audio: false, video: true },
  ];
  let lastErr;
  for (const constraints of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('camera failed');
}

async function startCamera() {
  if (!document.body.classList.contains('is-owner')) return;
  stopTracks();
  els.cameraStatus.textContent = 'Starting camera…';
  els.cameraModal.classList.remove('hidden');
  els.cameraVideo.muted = true;
  els.cameraVideo.playsInline = true;
  try {
    cameraStream = await getCameraStream();
    els.cameraVideo.srcObject = cameraStream;
    await els.cameraVideo.play();
    els.cameraStatus.textContent = 'Line up the trinket, then take a picture.';
  } catch (err) {
    const why = err && err.name === 'NotAllowedError'
      ? 'Camera permission was blocked. Allow the camera for localhost, or pick a photo.'
      : 'Could not open the camera. Use Chrome or Edge on this PC, or pick a photo.';
    els.cameraStatus.textContent = why;
    els.photoStatus.textContent = why;
  }
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 640;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('photo failed'));
    };
    img.src = url;
  });
}

els.photoBtn.addEventListener('click', () => {
  if (!document.body.classList.contains('is-owner')) return;
  startCamera();
});

els.cameraClose.addEventListener('click', () => {
  stopCamera();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.cameraModal.classList.contains('hidden')) {
    stopCamera();
  }
});

els.cameraFlip.addEventListener('click', () => {
  facing = facing === 'environment' ? 'user' : 'environment';
  startCamera();
});

els.cameraSnap.addEventListener('click', () => {
  if (!els.cameraVideo.videoWidth) {
    els.cameraStatus.textContent = 'Camera is not ready yet.';
    return;
  }
  setPhoto(photoFromVideo(els.cameraVideo));
  stopCamera();
  els.listTitle.focus();
});

els.listPhoto.addEventListener('change', async () => {
  if (!document.body.classList.contains('is-owner')) return;
  setPhoto(await readPhoto(els.listPhoto.files[0]));
  stopCamera();
});

els.listForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!document.body.classList.contains('is-owner')) return;
  try {
    await live.api.postProduct({
      title: els.listTitle.value.trim(),
      price: Number(els.listPrice.value),
      description: els.listDesc.value.trim(),
      image: photoData,
    });
    els.listForm.reset();
    setPhoto('');
    paint(await live.api.getState());
  } catch (err) {
    els.ownerBanner.classList.remove('hidden');
    els.ownerBanner.textContent = err.message || 'Could not post listing.';
  }
});

async function sendBuyerChat(text) {
  try {
    await live.api.sendChat(text, selectedThread);
    paint(await live.api.getState());
  } catch (err) {
    if (String(err.message || '').includes('need an account')) {
      els.chatInput.value = text;
      needAccountThen(() => sendBuyerChat(text));
      return;
    }
    throw err;
  }
}

els.chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  if (!document.body.classList.contains('is-owner') && looksLikeBuy(text)) {
    needAccountThen(async () => {
      els.chatInput.value = '';
      await sendBuyerChat(text);
    });
    return;
  }
  els.chatInput.value = '';
  await sendBuyerChat(text);
});

els.accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const account = {
    name: els.accountName.value.trim(),
    email: els.accountEmail.value.trim(),
    color: els.accountColor.value.trim(),
  };
  if (!account.name || !account.email || !account.color) return;
  saveAccountLocal(account);
  if (live?.api.saveAccount) await live.api.saveAccount(account);
  closeAccountModal();
  const next = pendingBuy;
  pendingBuy = null;
  paint(await live.api.getState());
  if (next) next();
});

els.accountCancel.addEventListener('click', () => {
  pendingBuy = null;
  closeAccountModal();
});

els.chatToggle.addEventListener('click', () => {
  els.chat.classList.toggle('collapsed');
  els.chatToggle.setAttribute('aria-expanded', String(!els.chat.classList.contains('collapsed')));
});

els.aiBtn.addEventListener('click', async () => {
  if (!document.body.classList.contains('is-owner')) return;
  const state = await live.api.getState();
  await live.api.setAI(!state.aiEnabled);
  paint(await live.api.getState());
});

els.threadSelect.addEventListener('change', async () => {
  selectedThread = els.threadSelect.value;
  paint(await live.api.getState());
});

document.addEventListener('visibilitychange', async () => {
  if (!live) return;
  if (live.api === localApi) {
    localApi.visible = document.visibilityState === 'visible';
    paint(await live.api.getState());
    return;
  }
  if (live.stateCache?.isOwner) live.api.ping().catch(() => {});
});

async function boot() {
  localStorage.removeItem('shop-owner-key');
  const picked = await pickApi();
  live = picked;
  live.stateCache = picked.state;
  paint(picked.state);

  if (picked.remote && picked.state.isOwner) {
    setInterval(() => {
      live.api.ping().catch(() => {});
    }, 4000);
    live.api.ping().catch(() => {});
  }

  if (picked.remote) {
    const params = new URLSearchParams({ visitor: visitorId });
    const stream = new EventSource(`/api/stream?${params}`);
    stream.addEventListener('message', (event) => {
      const state = JSON.parse(event.data);
      live.stateCache = state;
      paint(state);
    });
  } else {
    setInterval(async () => paint(await live.api.getState()), 1500);
  }
}

boot();
