export const TILE = 32;
export const CANVAS_W = 800;
export const CANVAS_H = 480;

export const GRAVITY = 0.52;
export const MAX_FALL = 11;
export const WALK_SPEED = 2.6;
export const RUN_SPEED = 4.8;
export const JUMP_FORCE = -11.8;
export const JUMP_CUT = 0.48;
export const FRICTION = 0.8;
export const AIR_FRICTION = 0.94;
export const GLIDE_FALL = 2.1;

export const TONGUE_SPEED = 16;
export const TONGUE_MAX_LEN = 108;
export const TONGUE_COOLDOWN = 14;

export const STARTING_LIVES = 5;
export const STARTING_TIME = 300;
export const COIN_VALUE = 10;
export const POWER_VALUE = 1000;
export const STOMP_BONUS = 200;
export const SCALE_VALUE = 1000;
export const LIFE_COINS = 100;

export const TILE_TYPES = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE: 4,
  GOAL: 5,
  USED: 6,
  LAVA: 7,
  PLATFORM: 8,
  CASTLE: 9,
};

export const COLORS = {
  chameleon: {
    default: '#3dcc6a',
    powered: '#ff6b35',
    invincible: '#7ee8ff',
    belly: '#d8ffc2',
    camouflage: '#5a8f4a',
  },
};
