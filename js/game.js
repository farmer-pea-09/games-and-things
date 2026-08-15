(function () {
  'use strict';

  // constants.js
  const TILE = 32;
  const MAP_W = 20;
  const MAP_H = 15;
  const CANVAS_W = 640;
  const CANVAS_H = 480;

  const TOOLS = ['hoe', 'water', 'seeds', 'harvest', 'talk'];

  const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
  const DAYS_PER_SEASON = 7;

  const CROP_TYPES = {
    turnip: {
      name: 'Turnip',
      seedCost: 20,
      sellPrice: 45,
      growDays: 4,
      stages: 4,
      color: '#e8f5e9',
      ripeColor: '#81c784',
      seasons: ['Spring', 'Fall'],
    },
    potato: {
      name: 'Potato',
      seedCost: 40,
      sellPrice: 90,
      growDays: 6,
      stages: 4,
      color: '#fff3e0',
      ripeColor: '#ffb74d',
      seasons: ['Spring', 'Summer', 'Fall'],
    },
    pumpkin: {
      name: 'Pumpkin',
      seedCost: 80,
      sellPrice: 200,
      growDays: 9,
      stages: 4,
      color: '#fff8e1',
      ripeColor: '#ff9800',
      seasons: ['Summer', 'Fall'],
    },
  };

  const ENERGY_COST = {
    hoe: 2,
    water: 2,
    seeds: 1,
    harvest: 1,
  };

  const STARTING_MONEY = 100;
  const STARTING_ENERGY = 100;
  const MAX_ENERGY = 100;

  const MINUTES_PER_DAY = 840; // 6 AM to 8 PM
  const TIME_SPEED = 0.5; // game minutes per real frame at 60fps ~ 28 sec per day

  const TILE_TYPES = {
    GRASS: 0,
    TILLED: 1,
    WATERED: 2,
    PATH: 3,
    FENCE: 4,
    HOUSE: 5,
    SHOP: 6,
    BED: 7,
    WATER: 8,
  };

  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const NPC_DIALOGUE = {
    shopkeeper: [
      "Welcome to Sunny Vale General Store!",
      "Seeds are flying off the shelves today!",
      "A good farmer knows when to rest. Don't forget to sleep!",
      "Pumpkins sell for a fortune, but they take patience.",
    ],
    neighbor: [
      "Your farm looks lovely!",
      "I heard turnips grow fast in spring.",
      "The seasons change every week around here.",
      "Water your crops every day for best results!",
    ],
  };

  // world.js
  function createWorld() {
    const tiles = [];
    const crops = new Map();
    const npcs = [];

    for (let y = 0; y < MAP_H; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_W; x++) {
        tiles[y][x] = TILE_TYPES.GRASS;
      }
    }

    // Farm plot area (tilled zone surrounded by fence)
    for (let x = 3; x <= 16; x++) {
      tiles[3][x] = TILE_TYPES.FENCE;
      tiles[10][x] = TILE_TYPES.FENCE;
    }
    for (let y = 3; y <= 10; y++) {
      tiles[y][3] = TILE_TYPES.FENCE;
      tiles[y][16] = TILE_TYPES.FENCE;
    }

    // Gate opening
    tiles[10][9] = TILE_TYPES.PATH;
    tiles[10][10] = TILE_TYPES.PATH;

    // Paths
    for (let y = 11; y < MAP_H; y++) {
      tiles[y][9] = TILE_TYPES.PATH;
      tiles[y][10] = TILE_TYPES.PATH;
    }
    for (let x = 4; x <= 15; x++) {
      tiles[11][x] = TILE_TYPES.PATH;
    }

    // House (top-left outside farm)
    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 3; x++) {
        tiles[y][x] = TILE_TYPES.HOUSE;
      }
    }
    tiles[2][2] = TILE_TYPES.BED;

    // Shop (top-right)
    for (let y = 1; y <= 2; y++) {
      for (let x = 16; x <= 18; x++) {
        tiles[y][x] = TILE_TYPES.SHOP;
      }
    }

    // Pond
    for (let y = 12; y <= 13; y++) {
      for (let x = 14; x <= 17; x++) {
        tiles[y][x] = TILE_TYPES.WATER;
      }
    }

    // Decorative grass patches inside farm (already grass)
    npcs.push({
      id: 'shopkeeper',
      name: 'Marie',
      x: 17,
      y: 3,
      dir: 'left',
      color: '#e94560',
      hairColor: '#ffd700',
    });

    npcs.push({
      id: 'neighbor',
      name: 'Sam',
      x: 5,
      y: 12,
      dir: 'up',
      color: '#4fc3f7',
      hairColor: '#5d4037',
    });

    return { tiles, crops, npcs };
  }

  function tileKey(x, y) {
    return `${x},${y}`;
  }

  function isWalkable(tiles, x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
    const t = tiles[y][x];
    return t !== TILE_TYPES.FENCE && t !== TILE_TYPES.HOUSE && t !== TILE_TYPES.SHOP && t !== TILE_TYPES.WATER;
  }

  function isFarmTile(tiles, x, y) {
    if (x < 4 || y < 4 || x > 15 || y > 9) return false;
    const t = tiles[y][x];
    return t === TILE_TYPES.GRASS || t === TILE_TYPES.TILLED || t === TILE_TYPES.WATERED;
  }

  function getInteractTile(px, py, dir) {
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = dirs[dir] || [0, 1];
    return { x: Math.floor(px) + dx, y: Math.floor(py) + dy };
  }

  function worldToScreen(x, y, camX, camY) {
    return {
      sx: x * TILE - camX,
      sy: y * TILE - camY,
    };
  }

  function getCamera(playerX, playerY) {
    const px = playerX * TILE + TILE / 2;
    const py = playerY * TILE + TILE / 2;
    let camX = px - 640 / 2;
    let camY = py - 480 / 2;
    camX = Math.max(0, Math.min(camX, MAP_W * TILE - 640));
    camY = Math.max(0, Math.min(camY, MAP_H * TILE - 480));
    return { camX, camY };
  }

  // crops.js
  function createCrop(type, plantedDay) {
    const def = CROP_TYPES[type];
    return {
      type,
      plantedDay,
      stage: 0,
      watered: false,
      daysSinceWater: 0,
      daysInStage: 0,
      maxStage: def.stages,
      growDays: def.growDays,
    };
  }

  function getCropStage(crop) {
    const progress = crop.stage / crop.maxStage;
    if (progress >= 1) return crop.maxStage;
    return crop.stage;
  }

  function isCropRipe(crop) {
    return crop.stage >= crop.maxStage;
  }

  function advanceCrops(crops, currentDay, season) {
    for (const [key, crop] of crops) {
      const def = CROP_TYPES[crop.type];
      if (!def.seasons.includes(season)) {
        // Crops wilt out of season
        crops.delete(key);
        continue;
      }

      if (crop.watered) {
        crop.daysInStage++;
        const daysPerStage = Math.ceil(crop.growDays / crop.maxStage);
        if (crop.daysInStage >= daysPerStage) {
          crop.stage = Math.min(crop.stage + 1, crop.maxStage);
          crop.daysInStage = 0;
        }
        crop.watered = false;
      } else {
        crop.daysSinceWater++;
        if (crop.daysSinceWater >= 2 && crop.stage > 0) {
          // Wilt if not watered
          crop.stage = Math.max(0, crop.stage - 1);
          crop.daysSinceWater = 0;
        }
      }
    }
  }

  function waterCrop(crops, x, y) {
    const key = tileKey(x, y);
    const crop = crops.get(key);
    if (crop && crop.stage < crop.maxStage) {
      crop.watered = true;
      crop.daysSinceWater = 0;
      return true;
    }
    return false;
  }

  function harvestCrop(crops, x, y) {
    const key = tileKey(x, y);
    const crop = crops.get(key);
    if (crop && isCropRipe(crop)) {
      const def = CROP_TYPES[crop.type];
      crops.delete(key);
      return def.sellPrice;
    }
    return 0;
  }

  function plantCrop(crops, x, y, type, day) {
    const key = tileKey(x, y);
    if (crops.has(key)) return false;
    crops.set(key, createCrop(type, day));
    return true;
  }

  // player.js
  function createPlayer() {
    return {
      x: 9.5,
      y: 12.5,
      dir: 'up',
      money: STARTING_MONEY,
      energy: STARTING_ENERGY,
      maxEnergy: MAX_ENERGY,
      tool: 0,
      selectedSeed: 'turnip',
      day: 1,
      seasonIndex: 0,
      gameMinutes: 360, // 6:00 AM
      moving: false,
      animFrame: 0,
      inventory: { turnip: 5, potato: 2, pumpkin: 0 },
      particles: [],
      messageTimer: 0,
      paused: false,
    };
  }

  function getSeason(player) {
    return SEASONS[player.seasonIndex];
  }

  function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  function showMessage(player, msg) {
    player.currentMessage = msg;
    player.messageTimer = 180;
  }

  function updatePlayer(player, world, keys, actionPressed) {
    if (player.paused) return;

    // Time
    player.gameMinutes += TIME_SPEED;
    if (player.gameMinutes >= 360 + MINUTES_PER_DAY) {
      endDay(player, world);
    }

    // Movement
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('arrowup')) { dy = -1; player.dir = 'up'; }
    if (keys.has('s') || keys.has('arrowdown')) { dy = 1; player.dir = 'down'; }
    if (keys.has('a') || keys.has('arrowleft')) { dx = -1; player.dir = 'left'; }
    if (keys.has('d') || keys.has('arrowright')) { dx = 1; player.dir = 'right'; }

    player.moving = dx !== 0 || dy !== 0;
    if (player.moving) {
      const speed = 0.08;
      const nx = player.x + dx * speed;
      const ny = player.y + dy * speed;
      const margin = 0.2;
      const canX = isWalkable(world.tiles, Math.floor(nx + 0.5), Math.floor(player.y + 0.5));
      const canY = isWalkable(world.tiles, Math.floor(player.x + 0.5), Math.floor(ny + 0.5));
      if (canX) player.x = nx;
      if (canY) player.y = ny;
      player.animFrame += 0.15;
    }

    if (actionPressed) {
      useTool(player, world);
    }

    // Particles
    player.particles = player.particles.filter(p => {
      p.life--;
      p.y -= 0.5;
      return p.life > 0;
    });

    if (player.messageTimer > 0) player.messageTimer--;
    else player.currentMessage = '';
  }

  function useTool(player, world) {
    const { x, y } = getInteractTile(player.x, player.y, player.dir);
    const tools = ['hoe', 'water', 'seeds', 'harvest', 'talk'];

    switch (tools[player.tool]) {
      case 'hoe':
        if (player.energy < ENERGY_COST.hoe) {
          showMessage(player, 'Too tired! Go sleep.');
          return;
        }
        if (isFarmTile(world.tiles, x, y) && world.tiles[y][x] === TILE_TYPES.GRASS) {
          world.tiles[y][x] = TILE_TYPES.TILLED;
          player.energy -= ENERGY_COST.hoe;
          spawnParticles(player, x, y, '#8d6e63');
          showMessage(player, 'Soil tilled!');
        }
        break;

      case 'water':
        if (player.energy < ENERGY_COST.water) {
          showMessage(player, 'Too tired!');
          return;
        }
        if (world.tiles[y][x] === TILE_TYPES.TILLED || world.tiles[y][x] === TILE_TYPES.WATERED) {
          world.tiles[y][x] = TILE_TYPES.WATERED;
          waterCrop(world.crops, x, y);
          player.energy -= ENERGY_COST.water;
          spawnParticles(player, x, y, '#4fc3f7');
          showMessage(player, 'Crop watered!');
        }
        break;

      case 'seeds':
        if (player.energy < ENERGY_COST.seeds) {
          showMessage(player, 'Too tired!');
          return;
        }
        const seed = player.selectedSeed;
        if (player.inventory[seed] <= 0) {
          showMessage(player, `No ${CROP_TYPES[seed].name} seeds! Buy at shop.`);
          return;
        }
        const season = getSeason(player);
        if (!CROP_TYPES[seed].seasons.includes(season)) {
          showMessage(player, `${CROP_TYPES[seed].name} can't grow in ${season}!`);
          return;
        }
        if ((world.tiles[y][x] === TILE_TYPES.TILLED || world.tiles[y][x] === TILE_TYPES.WATERED) && !world.crops.has(`${x},${y}`)) {
          if (plantCrop(world.crops, x, y, seed, player.day)) {
            player.inventory[seed]--;
            player.energy -= ENERGY_COST.seeds;
            spawnParticles(player, x, y, '#66bb6a');
            showMessage(player, `Planted ${CROP_TYPES[seed].name}!`);
          }
        }
        break;

      case 'harvest':
        if (player.energy < ENERGY_COST.harvest) {
          showMessage(player, 'Too tired!');
          return;
        }
        const gold = harvestCrop(world.crops, x, y);
        if (gold > 0) {
          player.money += gold;
          player.energy -= ENERGY_COST.harvest;
          world.tiles[y][x] = TILE_TYPES.TILLED;
          spawnParticles(player, x, y, '#ffd700', 8);
          showMessage(player, `Harvested! +${gold}g`);
        }
        break;

      case 'talk':
        for (const npc of world.npcs) {
          if (Math.abs(npc.x - x) <= 0.5 && Math.abs(npc.y - y) <= 0.5) {
            const lines = NPC_DIALOGUE[npc.id];
            const line = lines[Math.floor(Math.random() * lines.length)];
            if (npc.id === 'shopkeeper') {
              player.shopOpen = true;
              showMessage(player, `${npc.name}: "${line}"`);
            } else {
              showMessage(player, `${npc.name}: "${line}"`);
            }
            return;
          }
        }
        // Check bed
        if (world.tiles[y]?.[x] === TILE_TYPES.BED) {
          showMessage(player, 'Press E to sleep and end the day.');
        }
        break;
    }
  }

  function buySeeds(player, type) {
    const def = CROP_TYPES[type];
    if (player.money >= def.seedCost) {
      player.money -= def.seedCost;
      player.inventory[type] = (player.inventory[type] || 0) + 1;
      showMessage(player, `Bought ${def.name} seed! (-${def.seedCost}g)`);
      return true;
    }
    showMessage(player, 'Not enough gold!');
    return false;
  }

  function sleep(player, world, forceAtBed = false) {
    if (!forceAtBed && player.gameMinutes < 360 + 600) {
      showMessage(player, "It's not late enough to sleep yet!");
      return false;
    }
    endDay(player, world);
    return true;
  }

  function endDay(player, world) {
    advanceCrops(world.crops, player.day, getSeason(player));

    // Reset watered tiles to tilled
    for (let y = 0; y < world.tiles.length; y++) {
      for (let x = 0; x < world.tiles[y].length; x++) {
        if (world.tiles[y][x] === TILE_TYPES.WATERED) world.tiles[y][x] = TILE_TYPES.TILLED;
      }
    }

    player.day++;
    player.gameMinutes = 360;
    player.energy = player.maxEnergy;

    if ((player.day - 1) % DAYS_PER_SEASON === 0 && player.day > 1) {
      player.seasonIndex = (player.seasonIndex + 1) % SEASONS.length;
      showMessage(player, `${getSeason(player)} has arrived!`);
    } else {
      showMessage(player, `Good morning! Day ${player.day}`);
    }
  }

  function spawnParticles(player, tx, ty, color, count = 4) {
    for (let i = 0; i < count; i++) {
      player.particles.push({
        x: tx * 32 + 16 + (Math.random() - 0.5) * 20,
        y: ty * 32 + 16,
        color,
        life: 30 + Math.random() * 20,
      });
    }
  }

  function spawnHarvestCelebration(player) {
    for (let i = 0; i < 20; i++) {
      player.particles.push({
        x: player.x * 32 + (Math.random() - 0.5) * 40,
        y: player.y * 32 + (Math.random() - 0.5) * 40,
        color: ['#ffd700', '#ff6b8a', '#66bb6a', '#4fc3f7'][Math.floor(Math.random() * 4)],
        life: 40 + Math.random() * 30,
      });
    }
  }

  // renderer.js
  const TILE_COLORS = {
    [TILE_TYPES.GRASS]: ['#4caf50', '#43a047', '#388e3c'],
    [TILE_TYPES.TILLED]: ['#6d4c41', '#5d4037', '#4e342e'],
    [TILE_TYPES.WATERED]: ['#5d4037', '#4e342e', '#3e2723'],
    [TILE_TYPES.PATH]: ['#bcaaa4', '#a1887f', '#8d6e63'],
    [TILE_TYPES.FENCE]: ['#795548', '#6d4c41', '#5d4037'],
    [TILE_TYPES.HOUSE]: ['#ef5350', '#e53935', '#c62828'],
    [TILE_TYPES.SHOP]: ['#ffb74d', '#ffa726', '#fb8c00'],
    [TILE_TYPES.BED]: ['#7986cb', '#5c6bc0', '#3f51b5'],
    [TILE_TYPES.WATER]: ['#29b6f6', '#039be5', '#0277bd'],
  };

  function render(ctx, world, player) {
    const { camX, camY } = getCamera(player.x, player.y);

    // Sky gradient based on time
    drawSky(ctx, player.gameMinutes);

    // Tiles
    const startX = Math.floor(camX / TILE);
    const startY = Math.floor(camY / TILE);
    const endX = Math.min(MAP_W, startX + Math.ceil(640 / TILE) + 1);
    const endY = Math.min(MAP_H, startY + Math.ceil(480 / TILE) + 1);

    for (let y = Math.max(0, startY); y < endY; y++) {
      for (let x = Math.max(0, startX); x < endX; x++) {
        drawTile(ctx, world, x, y, camX, camY);
      }
    }

    // Crops
    for (const [key, crop] of world.crops) {
      const [cx, cy] = key.split(',').map(Number);
      drawCrop(ctx, crop, cx, cy, camX, camY);
    }

    // NPCs
    for (const npc of world.npcs) {
      drawCharacter(ctx, npc.x, npc.y, npc.color, npc.hairColor, npc.dir, 0, camX, camY, false);
    }

    // Player
    drawCharacter(ctx, player.x, player.y, '#ff8a65', '#3e2723', player.dir, player.animFrame, camX, camY, player.moving);

    // Particles
    for (const p of player.particles) {
      ctx.globalAlpha = p.life / 50;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camX - 2, p.y - camY - 2, 4, 4);
      ctx.globalAlpha = 1;
    }

    // Night overlay
    drawNightOverlay(ctx, player.gameMinutes);

    // Mini info when near interactables
    drawInteractHint(ctx, world, player, camX, camY);
  }

  function drawSky(ctx, minutes) {
    const dawn = 360, dusk = 1080;
    let brightness = 1;
    if (minutes < dawn + 60) brightness = 0.5 + (minutes - dawn) / 120;
    else if (minutes > dusk - 60) brightness = 1 - (minutes - (dusk - 60)) / 120;
    brightness = Math.max(0.15, Math.min(1, brightness));

    const r = Math.floor(135 * brightness);
    const g = Math.floor(206 * brightness);
    const b = Math.floor(235 * brightness);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, 640, 480);
  }

  function drawNightOverlay(ctx, minutes) {
    const dawn = 360, dusk = 1080;
    let alpha = 0;
    if (minutes < dawn + 60) alpha = 0.6 * (1 - (minutes - dawn) / 60);
    else if (minutes > dusk - 60) alpha = 0.6 * ((minutes - (dusk - 60)) / 60);
    alpha = Math.max(0, Math.min(0.65, alpha));
    if (alpha > 0) {
      ctx.fillStyle = `rgba(10, 10, 40, ${alpha})`;
      ctx.fillRect(0, 0, 640, 480);
    }
  }

  function drawTile(ctx, world, x, y, camX, camY) {
    const type = world.tiles[y][x];
    const { sx, sy } = worldToScreen(x, y, camX, camY);
    const colors = TILE_COLORS[type] || TILE_COLORS[TILE_TYPES.GRASS];
    const variant = (x + y * 3) % 3;

    ctx.fillStyle = colors[variant];
    ctx.fillRect(sx, sy, TILE, TILE);

    // Texture details
    ctx.fillStyle = colors[(variant + 1) % 3];
    if (type === TILE_TYPES.GRASS) {
      ctx.fillRect(sx + 4, sy + 8, 3, 5);
      ctx.fillRect(sx + 20, sy + 18, 3, 5);
      ctx.fillRect(sx + 12, sy + 24, 2, 4);
    } else if (type === TILE_TYPES.TILLED || type === TILE_TYPES.WATERED) {
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(sx + 4, sy + 8 + i * 8, TILE - 8, 2);
      }
      if (type === TILE_TYPES.WATERED) {
        ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    } else if (type === TILE_TYPES.FENCE) {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx + 12, sy, 8, TILE);
      ctx.fillRect(sx, sy + 12, TILE, 8);
    } else if (type === TILE_TYPES.HOUSE || type === TILE_TYPES.SHOP) {
      ctx.fillStyle = '#333';
      ctx.fillRect(sx + 8, sy + 10, 8, 10);
      ctx.fillRect(sx + 16, sy + 10, 8, 10);
    } else if (type === TILE_TYPES.BED) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx + 4, sy + 8, TILE - 8, TILE - 12);
      ctx.fillStyle = '#ef5350';
      ctx.fillRect(sx + 4, sy + 4, TILE - 8, 8);
    } else if (type === TILE_TYPES.WATER) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(sx + 8 + (Date.now() / 200 % 8), sy + 12, 12, 2);
    }
  }

  function drawCrop(ctx, crop, x, y, camX, camY) {
    const { sx, sy } = worldToScreen(x, y, camX, camY);
    const def = CROP_TYPES[crop.type];
    const stage = getCropStage(crop);
    const cx = sx + TILE / 2;
    const cy = sy + TILE / 2;

    if (stage === 0) {
      // Seed
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(cx - 2, cy + 4, 4, 4);
      return;
    }

    const ripe = isCropRipe(crop);
    const scale = 0.3 + (stage / crop.maxStage) * 0.7;

    // Stem
    ctx.fillStyle = '#33691e';
    ctx.fillRect(cx - 1, cy + 2 - scale * 10, 2, scale * 12);

    // Leaf / fruit
    if (crop.type === 'turnip') {
      ctx.fillStyle = ripe ? def.ripeColor : def.color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4 - scale * 4, 6 * scale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      if (ripe) {
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(cx - 3, cy - scale * 12, 6, 4);
      }
    } else if (crop.type === 'potato') {
      ctx.fillStyle = ripe ? def.ripeColor : '#689f38';
      ctx.beginPath();
      ctx.ellipse(cx - 4 * scale, cy, 4 * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 3 * scale, cy + 2, 3 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (crop.type === 'pumpkin') {
      ctx.fillStyle = ripe ? def.ripeColor : '#aed581';
      ctx.beginPath();
      ctx.ellipse(cx, cy - scale * 2, 10 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      if (stage >= 2) {
        ctx.fillStyle = '#33691e';
        ctx.fillRect(cx - 1, cy - scale * 12, 2, 5);
      }
    }

    if (crop.watered) {
      ctx.fillStyle = 'rgba(79, 195, 247, 0.5)';
      ctx.fillRect(sx + 2, sy + TILE - 6, TILE - 4, 4);
    }
  }

  function drawCharacter(ctx, x, y, bodyColor, hairColor, dir, animFrame, camX, camY, moving) {
    const px = x * TILE - camX;
    const py = y * TILE - camY;
    const bounce = moving ? Math.sin(animFrame * 2) * 2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + TILE / 2, py + TILE - 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + 10, py + 14 + bounce, 12, 14);

    // Overalls
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(px + 10, py + 20 + bounce, 12, 8);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(px + 14, py + 22 + bounce, 4, 3);

    // Head
    ctx.fillStyle = '#ffccbc';
    ctx.fillRect(px + 10, py + 4 + bounce, 12, 12);

    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(px + 9, py + 2 + bounce, 14, 6);

    // Eyes
    ctx.fillStyle = '#333';
    const eyeOff = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    ctx.fillRect(px + 12 + eyeOff, py + 9 + bounce, 2, 2);
    ctx.fillRect(px + 18 + eyeOff, py + 9 + bounce, 2, 2);

    // Tool indicator based on direction
    if (dir === 'down') {
      ctx.fillStyle = '#888';
      ctx.fillRect(px + 20, py + 18 + bounce, 3, 10);
    }
  }

  function drawInteractHint(ctx, world, player, camX, camY) {
    // Subtle tile highlight in front of player
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = dirs[player.dir];
    const tx = Math.floor(player.x) + dx;
    const ty = Math.floor(player.y) + dy;
    const { sx, sy } = worldToScreen(tx, ty, camX, camY);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
  }

  function renderTitle(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#e94560';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SUNNY VALE FARM', 320, 180);
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('A Harvest Moon tribute', 320, 220);
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('Till · Plant · Water · Harvest · Sell', 320, 280);
    ctx.fillText('Press SPACE or ENTER to start', 320, 340);
    ctx.textAlign = 'left';
  }

  // ui.js
  function updateHUD(player) {
    document.getElementById('day-label').textContent = `Day ${player.day}`;
    document.getElementById('season-label').textContent = getSeason(player);
    document.getElementById('time-label').textContent = formatTime(Math.floor(player.gameMinutes));
    document.getElementById('money-label').textContent = `💰 ${player.money}g`;
    document.getElementById('energy-label').textContent = `⚡ ${Math.floor(player.energy)}/${player.maxEnergy}`;

    const msgBox = document.getElementById('message-box');
    msgBox.textContent = player.currentMessage || '';

    // Seed picker visibility
    const seedPicker = document.getElementById('seed-picker');
    if (player.tool === 2) {
      seedPicker.classList.remove('hidden');
      updateSeedButtons(player);
    } else {
      seedPicker.classList.add('hidden');
    }
  }

  function updateSeedButtons(player) {
    document.querySelectorAll('.seed-btn').forEach(btn => {
      const type = btn.dataset.seed;
      const count = player.inventory[type] || 0;
      const def = CROP_TYPES[type];
      btn.textContent = `${def.name} (×${count}) — ${def.growDays} days`;
      btn.classList.toggle('selected', player.selectedSeed === type);
      if (player.selectedSeed === type) {
        btn.style.borderColor = '#ffd700';
      } else {
        btn.style.borderColor = '#2d8a2d';
      }
    });
  }

  function setupUI(player, onToolChange, onSeedSelect, onShopBuy, onOverlayClose) {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = parseInt(btn.dataset.tool);
        player.tool = tool;
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onToolChange(tool);
      });
    });

    document.querySelectorAll('.seed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        player.selectedSeed = btn.dataset.seed;
        onSeedSelect(btn.dataset.seed);
        updateSeedButtons(player);
      });
    });
  }

  function showShopOverlay(player, onBuy, onClose) {
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlay-content');

    function renderShop() {
      const inv = Object.entries(player.inventory)
        .map(([k, v]) => `${CROP_TYPES[k].name}: ×${v}`)
        .join(' · ');

      content.innerHTML = `
      <h2>🛒 Marie's General Store</h2>
      <p>Your gold: <span style="color:#ffd700">${player.money}g</span></p>
      <p style="font-size:6px;margin:12px 0;color:#aaa">${inv}</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
        <button data-buy="turnip">Turnip Seeds — ${CROP_TYPES.turnip.seedCost}g</button>
        <button data-buy="potato">Potato Seeds — ${CROP_TYPES.potato.seedCost}g</button>
        <button data-buy="pumpkin">Pumpkin Seeds — ${CROP_TYPES.pumpkin.seedCost}g</button>
      </div>
      <button id="close-shop" style="background:#555;margin-top:12px">Leave Shop</button>
    `;

      content.querySelectorAll('[data-buy]').forEach(btn => {
        btn.addEventListener('click', () => {
          onBuy(btn.dataset.buy);
          renderShop();
        });
      });
      content.querySelector('#close-shop').addEventListener('click', () => {
        overlay.classList.add('hidden');
        onClose();
      });
    }

    overlay.classList.remove('hidden');
    renderShop();
  }

  function showSleepOverlay(onConfirm, onCancel) {
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlay-content');
    overlay.classList.remove('hidden');
    content.innerHTML = `
    <h2>🌙 Good Night</h2>
    <p>Go to sleep and start a new day?<br>Your crops will grow overnight.</p>
    <button id="confirm-sleep">Sleep</button>
    <button id="cancel-sleep" style="background:#555;margin-left:8px">Not yet</button>
  `;
    content.querySelector('#confirm-sleep').addEventListener('click', () => {
      overlay.classList.add('hidden');
      onConfirm();
    });
    content.querySelector('#cancel-sleep').addEventListener('click', () => {
      overlay.classList.add('hidden');
      onCancel();
    });
  }

  function showPauseMenu(onResume, onNewGame) {
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlay-content');
    overlay.classList.remove('hidden');
    content.innerHTML = `
    <h2>⏸ Paused</h2>
    <button id="resume-btn">Resume</button>
    <button id="newgame-btn" style="background:#555;margin-top:8px">New Game</button>
  `;
    content.querySelector('#resume-btn').addEventListener('click', () => {
      overlay.classList.add('hidden');
      onResume();
    });
    content.querySelector('#newgame-btn').addEventListener('click', onNewGame);
  }

  function hideOverlay() {
    document.getElementById('overlay').classList.add('hidden');
  }

  // main.js
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let world, player;
  let keys = new Set();
  let actionPressed = false;
  let gameStarted = false;
  let lastShopCheck = false;

  function initGame() {
    world = createWorld();
    player = createPlayer();
    gameStarted = true;
    player.paused = false;
    hideOverlay();
    showMessage(player, 'Welcome to Sunny Vale Farm! Till soil, plant seeds, and harvest!');
  }

  function gameLoop() {
    ctx.clearRect(0, 0, 640, 480);

    if (!gameStarted) {
      renderTitle(ctx);
      updateHUD({ day: 1, seasonIndex: 0, gameMinutes: 360, money: 100, energy: 100, maxEnergy: 100, currentMessage: '', tool: 0, inventory: {} });
    } else {
      updatePlayer(player, world, keys, actionPressed);
      actionPressed = false;

      render(ctx, world, player);
      updateHUD(player);

      if (player.shopOpen && !lastShopCheck) {
        player.paused = true;
        showShopOverlay(
          player,
          (type) => buySeeds(player, type),
          () => { player.shopOpen = false; player.paused = false; }
        );
      }
      lastShopCheck = player.shopOpen;
    }

    requestAnimationFrame(gameLoop);
  }

  // Input
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys.add(key);

    if (!gameStarted && (key === ' ' || key === 'enter')) {
      e.preventDefault();
      initGame();
      return;
    }

    if (!gameStarted) return;

    if (key === ' ' || key === 'enter') {
      e.preventDefault();
      actionPressed = true;
    }

    if (key >= '1' && key <= '5') {
      player.tool = parseInt(key) - 1;
      document.querySelectorAll('.tool-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === player.tool);
      });
    }

    if (key === 'e') {
      e.preventDefault();
      // Try sleep if near bed, else force sleep at night
      const nearBed = Math.abs(player.x - 2) < 1.5 && Math.abs(player.y - 2) < 1.5;
      if (nearBed || player.gameMinutes >= 360 + 600) {
        showSleepOverlay(
          () => sleep(player, world, nearBed),
          () => {}
        );
      } else {
        showMessage(player, 'Head to your bed (top-left house) to sleep.');
      }
    }

    if (key === 'escape') {
      e.preventDefault();
      player.paused = true;
      showPauseMenu(
        () => { player.paused = false; },
        () => { gameStarted = false; player.paused = false; hideOverlay(); }
      );
    }
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.toLowerCase());
  });

  // UI setup
  setupUI(
    player || createPlayer(),
    () => {},
    () => {},
    () => {},
    () => {}
  );

  // Prevent space scroll
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target === document.body) e.preventDefault();
  });

  gameLoop();
})();
