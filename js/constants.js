export const TILE = 32;
export const CANVAS_W = 800;
export const CANVAS_H = 480;

export const GRAVITY = 0.42;
export const MAX_FALL = 8.5;
export const WALK_SPEED = 2.6;
export const RUN_SPEED = 5.8;
export const GROUND_ACCEL = 0.5;
export const AIR_ACCEL = 0.3;
export const JUMP_FORCE = -12.2;
export const AIR_JUMP_FORCE = -10.8;
export const JUMPSQUAT_FRAMES = 3;
export const GROUND_POUND_SPEED = 14;
export const GROUND_POUND_RADIUS = 54;
export const SUPER_JUMP_FORCE = -18.4;
export const SUPER_JUMP_COOLDOWN_MS = 60000;
export const JUMP_CUT = 0.55;
export const FRICTION = 0.8;
export const AIR_FRICTION = 0.97;
export const GLIDE_FALL = 2.1;

export const TAIL_STAND_MS = 10000;
export const TAIL_STAND_H = 50;

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
