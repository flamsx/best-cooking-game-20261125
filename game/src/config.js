// Ember & Thyme — Kitchen Rush: every tuning number, colour and layout rect in one
// place. The playfield is a fixed 1280x800 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 800 };

/** Fixed simulation step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** One full dinner shift, in seconds. */
export const SHIFT_SECONDS = 180;

export const HEARTS = 3;

/** Grill timing: a patty is ready after COOK_SECONDS and burns after BURN_SECONDS. */
export const GRILL = { slots: 2, cookSeconds: 4, burnSeconds: 9 };

/** Patience of a fresh ticket, shrinking as the shift wears on. */
export const PATIENCE = { base: 50, min: 28, shrinkPerSecond: 0.08 };

/** New-order gap, shrinking as the shift wears on. */
export const SPAWN = { first: 0.5, start: 15, min: 9, shrinkPerSecond: 0.03 };

export const MAX_TICKETS = 3;
export const MAX_PLATE = 6;

/** Star cutoffs on coins earned in one shift. */
export const STARS = { three: 140, two: 90 };

/** Where the best shift is kept between visits (this browser only). */
export const BEST_KEY = 'ember-thyme.best.coins';

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Warm bistro palette: cream tile, terracotta, sage and brass. Nothing here is a
// copy of another kitchen game's look; the tile, the board and the brass bell are
// drawn for this kitchen alone.
export const PALETTE = {
  wallTop: '#f6e8cf',
  wallBottom: '#eed9b4',
  tile: '#e7cfa5',
  tileLine: '#d9b98a',
  floor: '#8a5a3b',
  floorLine: '#74482e',
  counterTop: '#b4713f',
  counterFront: '#96602f',
  counterEdge: '#7c4f24',
  header: '#3d2b1f',
  headerText: '#ffe9c4',
  board: '#2f2118',
  boardLabel: '#f2c94c',
  ticket: '#fff8e7',
  ticketEdge: '#e3c98f',
  ticketText: '#3d2b1f',
  plate: '#fdfdf8',
  plateEdge: '#d8d2c2',
  grill: '#3a3f46',
  grillHot: '#57413a',
  button: '#2e7d32',
  buttonReady: '#43a047',
  buttonText: '#ffffff',
  danger: '#d64541',
  gold: '#f2c94c',
  sage: '#7ba05b',
  text: '#2b2118',
  muted: '#8b7a66',
  cream: '#fff8e7',
};

// One ingredient, one job: every ingredient is a small canvas drawing (see
// render.js) and a price, a key and a colour the tickets reuse.
export const INGREDIENTS = {
  bun: { name: 'Bun', key: '1', price: 2, color: '#e8b25c', dark: '#b57e2e' },
  patty: { name: 'Patty', key: '2', price: 4, color: '#8a5a34', dark: '#5f3a1e' },
  tomato: { name: 'Tomato', key: '3', price: 2, color: '#e2543e', dark: '#b03324' },
  lettuce: { name: 'Lettuce', key: '4', price: 2, color: '#7ba05b', dark: '#4e7a35' },
  cheese: { name: 'Cheese', key: '5', price: 3, color: '#f2c94c', dark: '#d9a41f' },
  sauce: { name: 'Sauce', key: '6', price: 1, color: '#d64541', dark: '#a32c28' },
};

export const INGREDIENT_ORDER = ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'sauce'];

// Recipes unlock as the shift goes on, so the first minute teaches the loop and
// the last minute asks for six-ingredient plates under a draining timer.
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', unlockAt: 0, needs: ['bun', 'patty', 'tomato'] },
  { id: 'garden', name: 'Garden Burger', unlockAt: 35, needs: ['bun', 'patty', 'lettuce', 'tomato'] },
  { id: 'cheesy', name: 'Cheesy Melt', unlockAt: 75, needs: ['bun', 'patty', 'cheese', 'sauce'] },
  { id: 'special', name: 'Thyme Special', unlockAt: 115, needs: ['bun', 'patty', 'lettuce', 'cheese', 'tomato', 'sauce'] },
];

export const CUSTOMERS = [
  'Mara', 'Juno', 'Theo', 'Pip', 'Sana', 'Rafi', 'Lena', 'Otto', 'Mia', 'Kai', 'Nia', 'Ezra',
];

// Fixed layout rectangles, shared by the renderer (what is drawn) and the input
// layer (what a click hits), so a button never drifts from its drawing.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 60 },
  board: { x: 0, y: 68, w: 1280, h: 122 },
  tickets: [
    { x: 24, y: 88, w: 296, h: 98 },
    { x: 336, y: 88, w: 296, h: 98 },
    { x: 648, y: 88, w: 296, h: 98 },
  ],
  rush: { x: 960, y: 88, w: 296, h: 98 },
  grill: { x: 24, y: 216, w: 288, h: 214 },
  grillSlots: [
    { x: 80, y: 312, r: 46 },
    { x: 220, y: 312, r: 46 },
  ],
  plate: { x: 336, y: 216, w: 520, h: 214, cx: 596, cy: 372 },
  serve: { x: 880, y: 216, w: 376, h: 214 },
  serveButton: { x: 916, y: 356, w: 304, h: 56 },
  bins: [
    { x: 24, y: 576, w: 176, h: 84 },
    { x: 212, y: 576, w: 176, h: 84 },
    { x: 400, y: 576, w: 176, h: 84 },
    { x: 588, y: 576, w: 176, h: 84 },
    { x: 776, y: 576, w: 176, h: 84 },
    { x: 964, y: 576, w: 176, h: 84 },
  ],
  trash: { x: 1152, y: 576, w: 104, h: 84 },
  hints: { x: 24, y: 676, w: 1280, h: 116 },
};
