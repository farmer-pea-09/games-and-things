import { CROP_TYPES } from './constants.js';
import { tileKey } from './world.js';

export function createCrop(type, plantedDay) {
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

export function getCropStage(crop) {
  const progress = crop.stage / crop.maxStage;
  if (progress >= 1) return crop.maxStage;
  return crop.stage;
}

export function isCropRipe(crop) {
  return crop.stage >= crop.maxStage;
}

export function advanceCrops(crops, currentDay, season) {
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

export function waterCrop(crops, x, y) {
  const key = tileKey(x, y);
  const crop = crops.get(key);
  if (crop && crop.stage < crop.maxStage) {
    crop.watered = true;
    crop.daysSinceWater = 0;
    return true;
  }
  return false;
}

export function harvestCrop(crops, x, y) {
  const key = tileKey(x, y);
  const crop = crops.get(key);
  if (crop && isCropRipe(crop)) {
    const def = CROP_TYPES[crop.type];
    crops.delete(key);
    return def.sellPrice;
  }
  return 0;
}

export function plantCrop(crops, x, y, type, day) {
  const key = tileKey(x, y);
  if (crops.has(key)) return false;
  crops.set(key, createCrop(type, day));
  return true;
}
