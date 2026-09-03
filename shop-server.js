const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.SHOP_PORT) || 3333;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'shop-data.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    const fresh = {
      ownerSecret: crypto.randomBytes(12).toString('hex'),
      products: [],
      chats: {},
      orders: [],
      aiEnabled: false,
      accounts: {},
    };
    saveData(fresh);
    return fresh;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();
if (!data.accounts) data.accounts = {};
const presence = { lastBeat: 0, visible: false };
const clients = new Set();

function lanAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const family = net.family === 4 || net.family === 'IPv4';
      if (family && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

function clientIp(req) {
  return String(req.socket.remoteAddress || '');
}

function isLocal(req) {
  const ip = clientIp(req);
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function identity(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  return {
    ownerKey: String(req.headers['x-owner-key'] || url.searchParams.get('owner') || ''),
    visitorId: String(req.headers['x-visitor-id'] || url.searchParams.get('visitor') || ''),
    local: isLocal(req),
  };
}

function isOwner(req) {
  return isLocal(req);
}

function ownerHere() {
  return Date.now() - presence.lastBeat < 12000 && presence.visible;
}

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function readBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('bad json'));
      }
    });
    req.on('error', reject);
  });
}

function visitorIdFrom(req, body) {
  return String(body.visitorId || req.headers['x-visitor-id'] || '').slice(0, 64);
}

function publicProduct(product) {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    description: product.description,
    image: product.image || '',
  };
}

function stateFor(req) {
  const id = identity(req);
  const owner = isOwner(req);
  const here = ownerHere();
  const covering = Boolean(data.aiEnabled && !here);
  const base = {
    isOwner: owner,
    ownerHere: here,
    aiEnabled: Boolean(data.aiEnabled),
    aiCovering: covering,
    products: data.products.map(publicProduct),
    friendUrl: owner ? `http://${lanAddress()}${PORT === 80 ? '' : ':' + PORT}` : '',
    chatTitle: here
      ? 'Order Now! Owner is here'
      : covering
        ? 'Order Now! Tiny Trinkets helper is here'
        : 'Order Now! Leave a message',
  };
  if (owner) {
    return { ...base, chats: data.chats, orders: data.orders, accounts: data.accounts };
  }
  return { ...base, chat: data.chats[id.visitorId] || [] };
}

function looksLikeBuy(text) {
  return /\b(order|buy|want|take|get|please)\b/i.test(String(text || ''));
}

function readAccount(raw) {
  const name = String(raw.name || '').trim().slice(0, 60);
  const email = String(raw.email || '').trim().slice(0, 80);
  const color = String(raw.color || '').trim().slice(0, 30);
  if (!name || !email || !color || !email.includes('@')) return null;
  return { name, email, color };
}

function broadcast() {
  const dead = [];
  for (const client of clients) {
    try {
      const payload = `data: ${JSON.stringify(stateFor(client.req))}\n\n`;
      client.res.write(payload);
    } catch {
      dead.push(client);
    }
  }
  for (const client of dead) clients.delete(client);
}

function ensureChat(visitorId) {
  if (!data.chats[visitorId]) data.chats[visitorId] = [];
  return data.chats[visitorId];
}

function pushMessage(visitorId, message) {
  ensureChat(visitorId).push(message);
  saveData(data);
  broadcast();
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
  if (wantsOrder) {
    return `Sure — which item?\n${listed}`;
  }
  if (hit) {
    return `${hit.title} is $${Number(hit.price).toFixed(2)}. ${hit.description || ''} Want me to order it?`;
  }
  if (/^(hi|hey|hello|yo|sup)\b/.test(q)) {
    return products.length
      ? `Hey! Welcome to Tiny Trinkets. Here is what is for sale:\n${listed}\n\nWant to order something?`
      : 'Hey! Tiny Trinkets has no listings yet. Hang tight.';
  }
  if (/\b(list|what|sell|have|stock|menu|items)\b/.test(q)) {
    return `For sale right now:\n${listed}`;
  }
  if (/\b(price|cost|how much)\b/.test(q)) {
    return listed;
  }
  if (/\b(thanks|thank|thx)\b/.test(q)) {
    return 'You bet. The owner will see this chat too.';
  }
  return `I can help you order from Tiny Trinkets. For sale:\n${listed}\n\nTell me the item and your name.`;
}

function maybeRecordOrder(visitorId, text) {
  const q = String(text || '').toLowerCase();
  const hit = data.products.find((p) => q.includes(String(p.title).toLowerCase()));
  if (!hit || !/\b(order|buy|want|take|get|please)\b/.test(q)) return;
  const who = data.accounts[visitorId] || {};
  data.orders.unshift({
    id: crypto.randomBytes(6).toString('hex'),
    visitorId,
    buyer: who.name || '',
    email: who.email || '',
    color: who.color || '',
    item: hit.title,
    price: hit.price,
    note: text,
    at: Date.now(),
    status: 'new',
  });
  saveData(data);
}

function maybeAI(visitorId, text) {
  if (!data.aiEnabled || ownerHere()) return;
  const reply = shopAI(text, data.products);
  maybeRecordOrder(visitorId, text);
  pushMessage(visitorId, { from: 'ai', text: reply, at: Date.now() });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, 'nope');
    return;
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      send(res, 404, 'not found');
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Permissions-Policy': 'camera=(self)',
    });
    res.end(buf);
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-owner-key, x-visitor-id',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  try {
    if (url.pathname === '/api/state' && req.method === 'GET') {
      send(res, 200, stateFor(req));
      return;
    }

    if (url.pathname === '/api/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const client = { req, res };
      clients.add(client);
      res.write(`data: ${JSON.stringify(stateFor(req))}\n\n`);
      req.on('close', () => clients.delete(client));
      return;
    }

    if (url.pathname === '/api/presence' && req.method === 'POST') {
      if (!isOwner(req)) {
        send(res, 403, { error: 'owner only' });
        return;
      }
      const body = await readBody(req);
      presence.lastBeat = Date.now();
      presence.visible = Boolean(body.visible);
      broadcast();
      send(res, 200, { ok: true, ownerHere: ownerHere() });
      return;
    }

    if (url.pathname === '/api/ai' && req.method === 'POST') {
      if (!isOwner(req)) {
        send(res, 403, { error: 'owner only' });
        return;
      }
      const body = await readBody(req);
      data.aiEnabled = Boolean(body.enabled);
      saveData(data);
      broadcast();
      send(res, 200, { aiEnabled: data.aiEnabled });
      return;
    }

    if (url.pathname === '/api/products' && req.method === 'POST') {
      if (!isOwner(req)) {
        send(res, 403, { error: 'only this PC can post listings' });
        return;
      }
      const body = await readBody(req);
      const product = {
        id: body.id || crypto.randomBytes(6).toString('hex'),
        title: String(body.title || '').trim().slice(0, 80),
        price: Number(body.price) || 0,
        description: String(body.description || '').trim().slice(0, 400),
        image: String(body.image || '').slice(0, 1_500_000),
      };
      if (!product.title) {
        send(res, 400, { error: 'need a title' });
        return;
      }
      const index = data.products.findIndex((p) => p.id === product.id);
      if (index >= 0) data.products[index] = product;
      else data.products.unshift(product);
      saveData(data);
      broadcast();
      send(res, 200, { product });
      return;
    }

    if (url.pathname.startsWith('/api/products/') && req.method === 'DELETE') {
      if (!isOwner(req)) {
        send(res, 403, { error: 'owner only' });
        return;
      }
      const id = url.pathname.split('/').pop();
      data.products = data.products.filter((p) => p.id !== id);
      saveData(data);
      broadcast();
      send(res, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/chat' && req.method === 'POST') {
      const body = await readBody(req);
      const visitorId = visitorIdFrom(req, body);
      if (!visitorId) {
        send(res, 400, { error: 'need visitor id' });
        return;
      }
      const text = String(body.text || '').trim().slice(0, 500);
      if (!text) {
        send(res, 400, { error: 'empty' });
        return;
      }
      const fromOwner = isOwner(req);
      if (!fromOwner && looksLikeBuy(text) && !data.accounts[visitorId]) {
        send(res, 403, { error: 'need an account' });
        return;
      }
      const targetId = fromOwner && body.visitorId ? String(body.visitorId) : visitorId;
      pushMessage(targetId, {
        from: fromOwner ? 'owner' : 'visitor',
        text,
        at: Date.now(),
      });
      if (!fromOwner) maybeAI(targetId, text);
      send(res, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/account' && req.method === 'POST') {
      const body = await readBody(req);
      const visitorId = visitorIdFrom(req, body);
      if (!visitorId) {
        send(res, 400, { error: 'need visitor id' });
        return;
      }
      const account = readAccount(body);
      if (!account) {
        send(res, 400, { error: 'need a name, email account, and favorite color' });
        return;
      }
      data.accounts[visitorId] = account;
      saveData(data);
      broadcast();
      send(res, 200, { account });
      return;
    }

    if (url.pathname === '/api/orders' && req.method === 'POST') {
      if (!isOwner(req)) {
        send(res, 403, { error: 'owner only' });
        return;
      }
      const body = await readBody(req);
      data.orders = data.orders.map((order) => (
        order.id === body.id ? { ...order, status: body.status || order.status } : order
      ));
      saveData(data);
      broadcast();
      send(res, 200, { ok: true });
      return;
    }

    serveStatic(req, res);
  } catch (err) {
    send(res, 400, { error: err.message || 'bad request' });
  }
}

function listenOn(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);
    server.on('error', reject);
    server.listen(port, '0.0.0.0', () => resolve(server));
  });
}

(async () => {
  const lan = lanAddress();
  await listenOn(PORT);
  let webPort = PORT;
  try {
    await listenOn(80);
    webPort = 80;
    console.log('Tiny Trinkets also on port 80.');
  } catch (err) {
    console.log(`Port 80 not available (${err.code || err.message}). Use :${PORT}`);
  }
  console.log(`Games and Things running.`);
  console.log(`This PC:     http://localhost:${webPort}`);
  console.log(`Friends:     http://${lan}:${webPort}`);
  console.log(`Tiny Trinkets: http://localhost:${webPort}/shop.html`);
})();
