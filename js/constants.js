export const TILE = 32;
export const CANVAS_W = 800;
export const CANVAS_H = 480;

export const GRAVITY = 0.55;
export const MAX_FALL = 12;
export const WALK_SPEED = 2.8;
export const RUN_SPEED = 4.5;
export const JUMP_FORCE = -11.5;
export const JUMP_CUT = 0.45;
export const FRICTION = 0.82;
export const AIR_FRICTION = 0.95;

export const TONGUE_SPEED = 14;
export const TONGUE_MAX_LEN = 96;
export const TONGUE_COOLDOWN = 18;

export const STARTING_LIVES = 3;
export const BUG_VALUE = 100;
export const POWER_BUG_VALUE = 500;
export const STOMP_BONUS = 200;

export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE: 4,
  FLAG_POLE: 5,
  FLAG_TOP: 6,
  DEATH: 7,
  VINE: 8,
};

export const COLORS = {
  chameleon: {
    default: '#52b788',
    powered: '#e63946',
    invincible: '#4cc9f0',
    belly: '#b7e4c7',
  },
};
